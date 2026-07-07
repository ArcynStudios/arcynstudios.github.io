/**
 * Tic Tac Toe — vs AI (easy/hard minimax) or local 2-player. Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];
const GAME_ID = 'tic-tac-toe';

let board, current, mode, gameOver;

function reset() {
  board = Array(9).fill(null);
  current = 'X';
  gameOver = false;
  $('#overlay').hidden = true;
  updateStats();
  render();
  updateTurnIndicator();
}

function updateStats() {
  const s = getStats(GAME_ID);
  $('#stat-wins').textContent = s.wins;
  $('#stat-losses').textContent = s.losses;
  $('#stat-draws').textContent = s.draws;
}

function updateTurnIndicator() {
  const el = $('#turn-indicator');
  if (mode === 'two-player') {
    el.textContent = `Player ${current === 'X' ? '1 (X)' : '2 (O)'}'s turn`;
  } else {
    el.textContent = current === 'X' ? 'Your turn (X)' : "AI thinking…";
  }
}

function winner(b) {
  for (const [a, b1, c] of WIN_LINES) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return { mark: b[a], line: [a, b1, c] };
  }
  if (b.every((v) => v)) return { mark: 'draw', line: [] };
  return null;
}

function render() {
  const el = $('#board');
  el.innerHTML = board
    .map((v, i) => `<div class="cell ${v ? v.toLowerCase() : ''}" data-i="${i}">${v || ''}</div>`)
    .join('');
  el.querySelectorAll('.cell').forEach((cellEl) => {
    cellEl.addEventListener('click', () => handleMove(Number(cellEl.dataset.i)));
  });
}

function handleMove(i) {
  if (gameOver || board[i]) {
    if (board[i]) sfx.invalid();
    return;
  }
  if (mode !== 'two-player' && current === 'O') return; // AI's turn, ignore clicks

  place(i, current);

  const result = winner(board);
  if (result) return endGame(result);

  current = current === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  if (mode !== 'two-player' && current === 'O' && !gameOver) {
    setTimeout(aiMove, 400);
  }
}

function place(i, mark) {
  board[i] = mark;
  sfx.place();
  render();
  const cellEl = $(`.cell[data-i="${i}"]`);
  cellEl?.classList.add('placed');
}

function aiMove() {
  if (gameOver) return;
  const hard = mode === 'ai-hard';
  const i = hard ? bestMove(board, 'O') : easyMove(board);
  if (i === -1) return;
  place(i, 'O');
  const result = winner(board);
  if (result) return endGame(result);
  current = 'X';
  updateTurnIndicator();
}

function easyMove(b) {
  // 60% random, 40% best-move — keeps "Easy" beatable but not brain-dead.
  const empty = b.map((v, i) => (v ? null : i)).filter((v) => v !== null);
  if (Math.random() < 0.6) return empty[Math.floor(Math.random() * empty.length)];
  return bestMove(b, 'O');
}

function bestMove(b, mark) {
  const opponent = mark === 'O' ? 'X' : 'O';
  let best = { score: -Infinity, index: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = mark;
    const score = minimax(b, 0, false, mark, opponent);
    b[i] = null;
    if (score > best.score) best = { score, index: i };
  }
  return best.index;
}

function minimax(b, depth, isMaximizing, mark, opponent) {
  const result = winner(b);
  if (result) {
    if (result.mark === mark) return 10 - depth;
    if (result.mark === opponent) return depth - 10;
    return 0;
  }
  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = mark;
      best = Math.max(best, minimax(b, depth + 1, false, mark, opponent));
      b[i] = null;
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = opponent;
    best = Math.min(best, minimax(b, depth + 1, true, mark, opponent));
    b[i] = null;
  }
  return best;
}

function endGame(result) {
  gameOver = true;
  result.line.forEach((i) => $(`.cell[data-i="${i}"]`)?.classList.add('win'));

  let title, statResult;
  if (result.mark === 'draw') {
    title = "It's a Draw";
    statResult = 'draw';
    sfx.click();
  } else if (mode === 'two-player') {
    title = `Player ${result.mark === 'X' ? '1' : '2'} Wins!`;
    statResult = 'win';
    sfx.win();
  } else if (result.mark === 'X') {
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
    overlay.innerHTML = `
      <h1>${title}</h1>
      <button class="g-btn" id="start-btn">Play Again</button>
    `;
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
board = Array(9).fill(null);
render();
