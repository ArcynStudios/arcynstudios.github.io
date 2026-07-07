/**
 * Reversi / Othello — vs AI (minimax + positional weights) or local
 * 2-player. Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const SIZE = 8;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const GAME_ID = 'reversi';

// Positional weights — corners are gold, cells adjacent to corners are traps.
const WEIGHTS = [
  100, -20, 10, 5, 5, 10, -20, 100,
  -20, -50, -2, -2, -2, -2, -50, -20,
  10, -2, 1, 1, 1, 1, -2, 10,
  5, -2, 1, 1, 1, 1, -2, 5,
  5, -2, 1, 1, 1, 1, -2, 5,
  10, -2, 1, 1, 1, 1, -2, 10,
  -20, -50, -2, -2, -2, -2, -50, -20,
  100, -20, 10, 5, 5, 10, -20, 100
];

let board, current, mode, gameOver;

function idx(x, y) {
  return y * SIZE + x;
}

function reset() {
  board = Array(SIZE * SIZE).fill(null);
  const mid = SIZE / 2;
  board[idx(mid - 1, mid - 1)] = 2;
  board[idx(mid, mid)] = 2;
  board[idx(mid - 1, mid)] = 1;
  board[idx(mid, mid - 1)] = 1;
  current = 1;
  gameOver = false;
  $('#overlay').hidden = true;
  updateStats();
  render();
  updateTurn();
}

function updateStats() {
  const s = getStats(GAME_ID);
  $('#stat-wins').textContent = s.wins;
}

function updateScores() {
  $('#score-p1').textContent = board.filter((v) => v === 1).length;
  $('#score-p2').textContent = board.filter((v) => v === 2).length;
}

function updateTurn() {
  const el = $('#turn-indicator');
  if (gameOver) return;
  if (mode === 'two-player') el.textContent = `Player ${current}'s turn`;
  else el.textContent = current === 1 ? 'Your turn' : 'AI thinking…';
}

function flipsFor(b, x, y, player) {
  if (b[idx(x, y)]) return [];
  const opponent = player === 1 ? 2 : 1;
  const allFlips = [];
  for (const [dx, dy] of DIRS) {
    const line = [];
    let cx = x + dx, cy = y + dy;
    while (cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE && b[idx(cx, cy)] === opponent) {
      line.push(idx(cx, cy));
      cx += dx;
      cy += dy;
    }
    if (line.length && cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE && b[idx(cx, cy)] === player) {
      allFlips.push(...line);
    }
  }
  return allFlips;
}

function validMoves(b, player) {
  const moves = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const flips = flipsFor(b, x, y, player);
      if (flips.length) moves.push({ x, y, flips });
    }
  }
  return moves;
}

function render() {
  const el = $('#board');
  el.innerHTML = '';
  const moves = gameOver ? [] : validMoves(board, current);
  const canClick = mode === 'two-player' || current === 1;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = board[idx(x, y)];
      const cell = document.createElement('div');
      cell.className = 'cell';
      const move = moves.find((m) => m.x === x && m.y === y);
      if (v) {
        const disc = document.createElement('div');
        disc.className = `disc p${v}`;
        cell.appendChild(disc);
      } else if (move && canClick) {
        cell.classList.add('hint');
        cell.addEventListener('click', () => handleMove(move));
      }
      el.appendChild(cell);
    }
  }
  updateScores();
}

function handleMove(move) {
  if (gameOver) return;
  applyMove(move, current);
}

function applyMove(move, player) {
  board[idx(move.x, move.y)] = player;
  move.flips.forEach((i) => (board[i] = player));
  sfx.place();
  render();

  advanceTurn();
}

function advanceTurn() {
  const next = current === 1 ? 2 : 1;
  const nextMoves = validMoves(board, next);
  const currentMovesIfPass = validMoves(board, current);

  if (nextMoves.length) {
    current = next;
  } else if (!currentMovesIfPass.length) {
    return endGame();
  } // else: next player has no moves, current player goes again

  updateTurn();
  render();

  if (mode !== 'two-player' && current === 2 && !gameOver) {
    setTimeout(aiTurn, 450);
  }
}

function aiTurn() {
  if (gameOver) return;
  const moves = validMoves(board, 2);
  if (!moves.length) return advanceTurn();
  const hard = mode === 'ai-hard';
  const move = hard ? bestMove(moves, 3) : easyMove(moves);
  applyMove(move, 2);
}

function easyMove(moves) {
  // Prefer corners when available, otherwise random — simple but not silly.
  const corners = moves.filter((m) => WEIGHTS[idx(m.x, m.y)] === 100);
  if (corners.length && Math.random() < 0.8) return corners[0];
  return moves[Math.floor(Math.random() * moves.length)];
}

function bestMove(moves, depth) {
  let best = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const snapshot = board.slice();
    board[idx(move.x, move.y)] = 2;
    move.flips.forEach((i) => (board[i] = 2));
    const score = minimax(depth - 1, -Infinity, Infinity, false);
    board = snapshot;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function minimax(depth, alpha, beta, maximizing) {
  const player = maximizing ? 2 : 1;
  const moves = validMoves(board, player);
  if (depth === 0 || !moves.length) return evaluate(board);

  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      const snapshot = board.slice();
      board[idx(move.x, move.y)] = 2;
      move.flips.forEach((i) => (board[i] = 2));
      value = Math.max(value, minimax(depth - 1, alpha, beta, false));
      board = snapshot;
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }
  let value = Infinity;
  for (const move of moves) {
    const snapshot = board.slice();
    board[idx(move.x, move.y)] = 1;
    move.flips.forEach((i) => (board[i] = 1));
    value = Math.min(value, minimax(depth - 1, alpha, beta, true));
    board = snapshot;
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

function evaluate(b) {
  let score = 0;
  for (let i = 0; i < b.length; i++) {
    if (b[i] === 2) score += WEIGHTS[i];
    else if (b[i] === 1) score -= WEIGHTS[i];
  }
  return score;
}

function endGame() {
  gameOver = true;
  const p1 = board.filter((v) => v === 1).length;
  const p2 = board.filter((v) => v === 2).length;

  let title, statResult;
  if (p1 === p2) {
    title = "It's a Draw";
    statResult = 'draw';
    sfx.click();
  } else if (mode === 'two-player') {
    title = `Player ${p1 > p2 ? 1 : 2} Wins!`;
    statResult = 'win';
    sfx.win();
  } else if (p1 > p2) {
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

  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>${title}</h1>
    <div class="overlay__score">${p1} — ${p2}</div>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
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
