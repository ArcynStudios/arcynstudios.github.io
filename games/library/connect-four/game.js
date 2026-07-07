/**
 * Connect Four — vs AI (depth-limited minimax) or local 2-player.
 * Board stored as a flat array, row 0 = bottom. Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const COLS = 7;
const ROWS = 6;
const GAME_ID = 'connect-four';

let board, current, mode, gameOver;

function reset() {
  board = Array(COLS * ROWS).fill(null);
  current = 1;
  gameOver = false;
  $('#overlay').hidden = true;
  updateStats();
  render();
  updateTurn();
}

function idx(c, r) {
  return r * COLS + c;
}

function lowestEmptyRow(c) {
  for (let r = 0; r < ROWS; r++) {
    if (!board[idx(c, r)]) return r;
  }
  return -1;
}

function updateStats() {
  const s = getStats(GAME_ID);
  $('#stat-wins').textContent = s.wins;
  $('#stat-losses').textContent = s.losses;
  $('#stat-draws').textContent = s.draws;
}

function updateTurn() {
  const el = $('#turn-indicator');
  if (mode === 'two-player') el.textContent = `Player ${current}'s turn`;
  else el.textContent = current === 1 ? 'Your turn' : 'AI thinking…';
}

function render(dropCol = -1) {
  const el = $('#board');
  el.innerHTML = '';
  for (let c = 0; c < COLS; c++) {
    const col = document.createElement('div');
    col.className = 'col';
    col.dataset.col = c;
    for (let r = ROWS - 1; r >= 0; r--) {
      const v = board[idx(c, r)];
      const slot = document.createElement('div');
      slot.className = `slot ${v === 1 ? 'p1' : v === 2 ? 'p2' : ''}`;
      slot.dataset.c = c;
      slot.dataset.r = r;
      if (c === dropCol && v && r === lastDropRow) slot.classList.add('drop');
      col.appendChild(slot);
    }
    col.addEventListener('click', () => handleDrop(c));
    el.appendChild(col);
  }
}

let lastDropRow = -1;

function handleDrop(c) {
  if (gameOver) return;
  if (mode !== 'two-player' && current === 2) return;
  drop(c, current);
}

function drop(c, player) {
  const r = lowestEmptyRow(c);
  if (r === -1) {
    sfx.invalid();
    return false;
  }
  board[idx(c, r)] = player;
  lastDropRow = r;
  sfx.place();
  render(c);

  const result = checkWin(board);
  if (result) return endGame(result), true;
  if (board.every((v) => v)) return endGame({ mark: 'draw', line: [] }), true;

  current = current === 1 ? 2 : 1;
  updateTurn();

  if (mode !== 'two-player' && current === 2 && !gameOver) {
    setTimeout(aiTurn, 450);
  }
  return true;
}

function checkWin(b) {
  const dirs = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const p = b[idx(c, r)];
      if (!p) continue;
      for (const [dc, dr] of dirs) {
        const line = [idx(c, r)];
        for (let s = 1; s < 4; s++) {
          const nc = c + dc * s;
          const nr = r + dr * s;
          if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS || b[idx(nc, nr)] !== p) break;
          line.push(idx(nc, nr));
        }
        if (line.length === 4) return { mark: p, line };
      }
    }
  }
  return null;
}

function aiTurn() {
  if (gameOver) return;
  const hard = mode === 'ai-hard';
  const c = hard ? bestColumn(board, 2, 5) : easyColumn(board);
  if (c === -1) return;
  drop(c, 2);
}

function validColumns(b) {
  const cols = [];
  for (let c = 0; c < COLS; c++) if (lowestEmptyRowOf(b, c) !== -1) cols.push(c);
  return cols;
}

function lowestEmptyRowOf(b, c) {
  for (let r = 0; r < ROWS; r++) if (!b[idx(c, r)]) return r;
  return -1;
}

function easyColumn(b) {
  const cols = validColumns(b);
  // Block an immediate opponent win 50% of the time, otherwise random — beatable but not careless.
  for (const c of cols) {
    const r = lowestEmptyRowOf(b, c);
    b[idx(c, r)] = 1;
    const win = checkWin(b);
    b[idx(c, r)] = null;
    if (win && Math.random() < 0.5) return c;
  }
  return cols[Math.floor(Math.random() * cols.length)];
}

function bestColumn(b, player, depth) {
  const cols = validColumns(b);
  let best = { score: -Infinity, col: cols[0] };
  for (const c of cols) {
    const r = lowestEmptyRowOf(b, c);
    b[idx(c, r)] = player;
    const score = minimax(b, depth - 1, -Infinity, Infinity, false, player);
    b[idx(c, r)] = null;
    if (score > best.score) best = { score, col: c };
  }
  return best.col;
}

function minimax(b, depth, alpha, beta, maximizing, aiPlayer) {
  const opponent = aiPlayer === 1 ? 2 : 1;
  const win = checkWin(b);
  if (win) return win.mark === aiPlayer ? 1000 + depth : -1000 - depth;
  const cols = validColumns(b);
  if (depth === 0 || !cols.length) return heuristic(b, aiPlayer);

  if (maximizing) {
    let value = -Infinity;
    for (const c of cols) {
      const r = lowestEmptyRowOf(b, c);
      b[idx(c, r)] = aiPlayer;
      value = Math.max(value, minimax(b, depth - 1, alpha, beta, false, aiPlayer));
      b[idx(c, r)] = null;
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }
  let value = Infinity;
  for (const c of cols) {
    const r = lowestEmptyRowOf(b, c);
    b[idx(c, r)] = opponent;
    value = Math.min(value, minimax(b, depth - 1, alpha, beta, true, aiPlayer));
    b[idx(c, r)] = null;
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

function heuristic(b, player) {
  // Favor central-column control — a simple, fast proxy for board strength.
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    const v = b[idx(3, r)];
    if (v === player) score += 3;
    else if (v) score -= 3;
  }
  return score;
}

function endGame(result) {
  gameOver = true;
  result.line.forEach((i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    $(`.slot[data-c="${c}"][data-r="${r}"]`)?.classList.add('win');
  });

  let title, statResult;
  if (result.mark === 'draw') {
    title = "It's a Draw";
    statResult = 'draw';
    sfx.click();
  } else if (mode === 'two-player') {
    title = `Player ${result.mark} Wins!`;
    statResult = 'win';
    sfx.win();
  } else if (result.mark === 1) {
    title = 'You Win!';
    statResult = 'win';
    sfx.win();
  } else {
    title = 'AI Wins';
    statResult = 'loss';
    sfx.lose();
  }

  recordResult(GAME_ID, statResult);
  updateStats();

  setTimeout(() => {
    const overlay = $('#overlay');
    overlay.hidden = false;
    overlay.innerHTML = `<h1>${title}</h1><button class="g-btn" id="start-btn">Play Again</button>`;
    $('#start-btn').addEventListener('click', reset);
  }, 500);
}

$('#mode-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#mode-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  mode = btn.dataset.mode;
  reset();
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

mode = 'ai-easy';
board = Array(COLS * ROWS).fill(null);
render();
