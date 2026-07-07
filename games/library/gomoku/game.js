/**
 * Gomoku (five-in-a-row) on a 15x15 grid. The AI uses a threat-scoring
 * heuristic (evaluate every empty cell for both players, pick the max)
 * rather than minimax — a full search is infeasible at this board size.
 * Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const SIZE = 15;
const NEED = 5;
const GAME_ID = 'gomoku';

let board, current, mode, gameOver, moveCount;

function reset() {
  board = Array(SIZE * SIZE).fill(null);
  current = 1;
  gameOver = false;
  moveCount = 0;
  $('#overlay').hidden = true;
  updateStats();
  render();
  updateTurn();
}

function idx(x, y) {
  return y * SIZE + x;
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

function render() {
  const el = $('#board');
  el.innerHTML = '';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = board[idx(x, y)];
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (v) {
        const stone = document.createElement('div');
        stone.className = `stone p${v}`;
        cell.appendChild(stone);
      } else {
        cell.addEventListener('click', () => handleMove(x, y));
      }
      el.appendChild(cell);
    }
  }
}

function handleMove(x, y) {
  if (gameOver) return;
  if (mode !== 'two-player' && current === 2) return;
  place(x, y, current);
}

function place(x, y, player) {
  board[idx(x, y)] = player;
  moveCount++;
  sfx.place();
  render();

  const win = checkWin(board, x, y, player);
  if (win) return endGame({ mark: player, line: win });
  if (moveCount === SIZE * SIZE) return endGame({ mark: 'draw', line: [] });

  current = current === 1 ? 2 : 1;
  updateTurn();

  if (mode !== 'two-player' && current === 2 && !gameOver) {
    setTimeout(aiTurn, 400);
  }
}

function checkWin(b, x, y, player) {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (const [dx, dy] of dirs) {
    const line = [idx(x, y)];
    for (const sign of [1, -1]) {
      let cx = x + dx * sign;
      let cy = y + dy * sign;
      while (cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE && b[idx(cx, cy)] === player) {
        line.push(idx(cx, cy));
        cx += dx * sign;
        cy += dy * sign;
      }
    }
    if (line.length >= NEED) return line;
  }
  return null;
}

function aiTurn() {
  if (gameOver) return;
  const hard = mode === 'ai-hard';
  const move = hard ? bestMove(board, 2) : easyMove(board);
  if (!move) return;
  place(move.x, move.y, 2);
}

function candidateCells(b) {
  // Only consider empty cells adjacent to existing stones — keeps scoring fast on a 225-cell board.
  const set = new Set();
  let any = false;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!b[idx(x, y)]) continue;
      any = true;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
          if (!b[idx(nx, ny)]) set.add(idx(nx, ny));
        }
      }
    }
  }
  if (!any) return [{ x: Math.floor(SIZE / 2), y: Math.floor(SIZE / 2) }];
  return [...set].map((i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }));
}

function lineScore(count, openEnds) {
  if (count >= 5) return 100000;
  if (openEnds === 0) return count >= 3 ? count * 3 : 0;
  if (count === 4) return openEnds === 2 ? 50000 : 5000;
  if (count === 3) return openEnds === 2 ? 2000 : 400;
  if (count === 2) return openEnds === 2 ? 100 : 20;
  return openEnds === 2 ? 5 : 1;
}

function evaluateCell(b, x, y, player) {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  let score = 0;
  for (const [dx, dy] of dirs) {
    let count = 1;
    let openEnds = 0;
    for (const sign of [1, -1]) {
      let cx = x + dx * sign;
      let cy = y + dy * sign;
      let run = 0;
      while (cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE && b[idx(cx, cy)] === player) {
        run++;
        cx += dx * sign;
        cy += dy * sign;
      }
      count += run;
      if (cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE && !b[idx(cx, cy)]) openEnds++;
    }
    score += lineScore(count, openEnds);
  }
  return score;
}

function bestMove(b, aiPlayer) {
  const opponent = aiPlayer === 1 ? 2 : 1;
  const candidates = candidateCells(b);
  let best = null;
  let bestScore = -Infinity;
  for (const { x, y } of candidates) {
    b[idx(x, y)] = aiPlayer;
    const offense = evaluateCell(b, x, y, aiPlayer);
    b[idx(x, y)] = opponent;
    const defense = evaluateCell(b, x, y, opponent);
    b[idx(x, y)] = null;
    const score = offense + defense * 0.9;
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  }
  return best;
}

function easyMove(b) {
  const candidates = candidateCells(b);
  // Still blocks obvious 4-in-a-rows, otherwise leans toward randomness.
  const opponent = current === 1 ? 1 : 2;
  for (const { x, y } of candidates) {
    b[idx(x, y)] = opponent;
    const threat = evaluateCell(b, x, y, opponent);
    b[idx(x, y)] = null;
    if (threat >= 50000 && Math.random() < 0.85) return { x, y };
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function endGame(result) {
  gameOver = true;
  result.line.forEach((i) => {
    const x = i % SIZE, y = Math.floor(i / SIZE);
    $(`.cell[data-x="${x}"][data-y="${y}"]`)?.classList.add('win');
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
  }, 400);
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
board = Array(SIZE * SIZE).fill(null);
render();
