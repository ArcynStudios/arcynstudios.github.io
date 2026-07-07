/**
 * Checkers (American draughts) — mandatory captures, multi-jump chains,
 * king promotion. AI is a one-ply heuristic evaluator with greedy
 * capture-chain simulation rather than deep minimax (chains are forced
 * moves anyway, so this plays solidly without the complexity of a full
 * search over multi-jump trees). Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const SIZE = 8;
const GAME_ID = 'checkers';

let board, current, mode, gameOver, selected, selectedOptions, forcedContinue;

function idx(x, y) {
  return y * SIZE + x;
}
function inBounds(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function reset() {
  board = Array(SIZE * SIZE).fill(null);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if ((x + y) % 2 !== 1) continue;
      if (y < 3) board[idx(x, y)] = { player: 2, king: false };
      else if (y > 4) board[idx(x, y)] = { player: 1, king: false };
    }
  }
  current = 1;
  gameOver = false;
  selected = null;
  selectedOptions = [];
  forcedContinue = false;
  $('#overlay').hidden = true;
  updateStats();
  updateScores();
  render();
  updateTurn();
}

function updateStats() {
  $('#stat-wins').textContent = getStats(GAME_ID).wins;
}

function updateScores() {
  $('#score-p1').textContent = board.filter((p) => p?.player === 1).length;
  $('#score-p2').textContent = board.filter((p) => p?.player === 2).length;
}

function updateTurn() {
  if (gameOver) return;
  const el = $('#turn-indicator');
  if (mode === 'two-player') el.textContent = `Player ${current}'s turn`;
  else el.textContent = current === 1 ? 'Your turn' : 'AI thinking…';
}

function getMovesForPiece(b, x, y) {
  const p = b[idx(x, y)];
  if (!p) return { moves: [], jumps: [] };
  const dirs = p.king ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : p.player === 1 ? [[1, -1], [-1, -1]] : [[1, 1], [-1, 1]];
  const moves = [];
  const jumps = [];
  for (const [dx, dy] of dirs) {
    const nx = x + dx, ny = y + dy;
    if (inBounds(nx, ny) && !b[idx(nx, ny)]) moves.push({ x: nx, y: ny });
    const jx = x + dx * 2, jy = y + dy * 2;
    if (inBounds(jx, jy) && !b[idx(jx, jy)] && b[idx(nx, ny)] && b[idx(nx, ny)].player !== p.player) {
      jumps.push({ x: jx, y: jy, capX: nx, capY: ny });
    }
  }
  return { moves, jumps };
}

function allMoves(b, player) {
  const perPiece = [];
  let anyJump = false;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = b[idx(x, y)];
      if (!p || p.player !== player) continue;
      const { moves, jumps } = getMovesForPiece(b, x, y);
      if (jumps.length) anyJump = true;
      if (moves.length || jumps.length) perPiece.push({ x, y, moves, jumps });
    }
  }
  if (anyJump) return perPiece.filter((pp) => pp.jumps.length).map((pp) => ({ x: pp.x, y: pp.y, options: pp.jumps.map((j) => ({ ...j, isJump: true })) }));
  return perPiece.map((pp) => ({ x: pp.x, y: pp.y, options: pp.moves.map((m) => ({ ...m, isJump: false })) })).filter((pp) => pp.options.length);
}

function render() {
  const el = $('#board');
  el.innerHTML = '';
  const legal = gameOver ? [] : allMoves(board, current);
  const canClick = mode === 'two-player' || current === 1;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = `cell ${(x + y) % 2 === 1 ? 'dark' : 'light'}`;
      cell.dataset.x = x;
      cell.dataset.y = y;

      const p = board[idx(x, y)];
      if (p) {
        const piece = document.createElement('div');
        piece.className = `piece p${p.player}${p.king ? ' king' : ''}`;
        if (p.king) piece.textContent = '♛';
        const pieceEntry = legal.find((m) => m.x === x && m.y === y);
        if (canClick && p.player === current && pieceEntry && (!forcedContinue || (selected && selected.x === x && selected.y === y))) {
          piece.addEventListener('click', () => selectPiece(x, y, pieceEntry.options));
        }
        cell.appendChild(piece);
        if (selected && selected.x === x && selected.y === y) cell.classList.add('selected');
      } else if (selected && selectedOptions.some((o) => o.x === x && o.y === y)) {
        cell.classList.add('hint');
        cell.addEventListener('click', () => performMove(selectedOptions.find((o) => o.x === x && o.y === y)));
      }
      el.appendChild(cell);
    }
  }
}

function selectPiece(x, y, options) {
  selected = { x, y };
  selectedOptions = options;
  sfx.click();
  render();
}

function performMove(option) {
  const piece = board[idx(selected.x, selected.y)];
  board[idx(selected.x, selected.y)] = null;
  board[idx(option.x, option.y)] = piece;
  if (option.isJump) board[idx(option.capX, option.capY)] = null;

  // Crown on reaching the far row.
  if ((piece.player === 1 && option.y === 0) || (piece.player === 2 && option.y === SIZE - 1)) {
    piece.king = true;
  }

  sfx[option.isJump ? 'pop' : 'place']();
  updateScores();

  if (option.isJump) {
    const { jumps } = getMovesForPiece(board, option.x, option.y);
    if (jumps.length) {
      selected = { x: option.x, y: option.y };
      selectedOptions = jumps.map((j) => ({ ...j, isJump: true }));
      forcedContinue = true;
      render();
      if (mode !== 'two-player' && current === 2) setTimeout(() => aiContinueChain(), 400);
      return;
    }
  }

  selected = null;
  selectedOptions = [];
  forcedContinue = false;
  endTurnCheck();
}

function aiContinueChain() {
  if (gameOver || !selected) return;
  const best = selectedOptions.reduce((a, b) => (b.capX !== undefined ? b : a), selectedOptions[0]);
  performMove(best);
}

function endTurnCheck() {
  const opponent = current === 1 ? 2 : 1;
  const opponentHasPieces = board.some((p) => p?.player === opponent);
  const opponentMoves = allMoves(board, opponent);

  if (!opponentHasPieces || !opponentMoves.length) return endGame(current);

  current = opponent;
  updateTurn();
  render();

  if (mode !== 'two-player' && current === 2 && !gameOver) {
    setTimeout(aiTurn, 450);
  }
}

function aiTurn() {
  if (gameOver) return;
  const moves = allMoves(board, 2);
  if (!moves.length) return endTurnCheck();
  const hard = mode === 'ai-hard';
  const { piece, option } = hard ? bestAiMove(moves) : easyAiMove(moves);
  selected = { x: piece.x, y: piece.y };
  performMove(option);
}

function easyAiMove(moves) {
  const piece = moves[Math.floor(Math.random() * moves.length)];
  const option = piece.options[Math.floor(Math.random() * piece.options.length)];
  return { piece, option };
}

function bestAiMove(moves) {
  let best = null;
  let bestScore = -Infinity;
  for (const piece of moves) {
    for (const option of piece.options) {
      const snapshot = board.map((c) => (c ? { ...c } : null));
      const p = board[idx(piece.x, piece.y)];
      board[idx(piece.x, piece.y)] = null;
      board[idx(option.x, option.y)] = p;
      if (option.isJump) board[idx(option.capX, option.capY)] = null;
      if ((p.player === 1 && option.y === 0) || (p.player === 2 && option.y === SIZE - 1)) p.king = true;

      const score = evaluate(board) + (option.isJump ? 8 : 0);
      board = snapshot;

      if (score > bestScore) {
        bestScore = score;
        best = { piece, option };
      }
    }
  }
  return best;
}

function evaluate(b) {
  let score = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = b[idx(x, y)];
      if (!p) continue;
      let value = p.king ? 5 : 3;
      if (!p.king) value += p.player === 2 ? y * 0.1 : (SIZE - 1 - y) * 0.1;
      score += p.player === 2 ? value : -value;
    }
  }
  return score;
}

function endGame(winnerPlayer) {
  gameOver = true;
  let title, statResult;
  if (mode === 'two-player') {
    title = `Player ${winnerPlayer} Wins!`;
    statResult = 'win';
    sfx.win();
  } else if (winnerPlayer === 1) {
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
  render();

  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>${title}</h1><button class="g-btn" id="start-btn">Play Again</button>`;
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
