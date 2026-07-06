/**
 * Pixel Kingdoms — turn-based territory capture on an 8x8 grid.
 * Original code, plain DOM (no canvas needed for a grid-of-buttons game).
 */
import { rand, $ } from '../shared/engine.js';

const SIZE = 8;
const MAX_TURNS = 30;
const board = $('#board');

let grid = Array.from({ length: SIZE * SIZE }, () => 'neutral');
grid[0] = 'player';
grid[SIZE * SIZE - 1] = 'ai';
let turnsLeft = MAX_TURNS;
let gameActive = false;

function reset() {
  grid = Array.from({ length: SIZE * SIZE }, () => 'neutral');
  grid[0] = 'player';
  grid[SIZE * SIZE - 1] = 'ai';
  turnsLeft = MAX_TURNS;
  gameActive = true;
  $('#overlay').hidden = true;
  render();
}

function idx(x, y) {
  return y * SIZE + x;
}

function neighbors(i) {
  const x = i % SIZE;
  const y = Math.floor(i / SIZE);
  const out = [];
  if (x > 0) out.push(idx(x - 1, y));
  if (x < SIZE - 1) out.push(idx(x + 1, y));
  if (y > 0) out.push(idx(x, y - 1));
  if (y < SIZE - 1) out.push(idx(x, y + 1));
  return out;
}

function capturableFor(owner) {
  const set = new Set();
  grid.forEach((v, i) => {
    if (v !== owner) return;
    neighbors(i).forEach((n) => {
      if (grid[n] !== owner) set.add(n);
    });
  });
  return [...set];
}

function render() {
  board.innerHTML = '';
  const playerMoves = new Set(capturableFor('player'));

  grid.forEach((owner, i) => {
    const el = document.createElement('div');
    el.className = `tile ${owner}`;
    if (gameActive && owner !== 'player' && playerMoves.has(i)) {
      el.classList.add('capturable');
      el.addEventListener('click', () => playerTurn(i));
    }
    board.appendChild(el);
  });

  $('#you-count').textContent = grid.filter((v) => v === 'player').length;
  $('#ai-count').textContent = grid.filter((v) => v === 'ai').length;
  $('#turns-left').textContent = `${turnsLeft} turns left`;
}

function playerTurn(i) {
  if (!gameActive) return;
  grid[i] = 'player';
  turnsLeft -= 1;
  render();
  checkEnd();
  if (gameActive) setTimeout(aiTurn, 350);
}

function aiTurn() {
  if (!gameActive) return;
  const options = capturableFor('ai');
  if (options.length) {
    // Prefer capturing the player's tiles when possible (a little aggression), else expand into neutral land.
    const aggressive = options.filter((i) => grid[i] === 'player');
    const pick = aggressive.length && Math.random() < 0.4 ? aggressive[Math.floor(rand(0, aggressive.length))] : options[Math.floor(rand(0, options.length))];
    grid[pick] = 'ai';
  }
  turnsLeft -= 1;
  render();
  checkEnd();
}

function checkEnd() {
  const full = grid.every((v) => v !== 'neutral');
  const playerMoves = capturableFor('player').length;
  const aiMoves = capturableFor('ai').length;

  if (turnsLeft <= 0 || full || (playerMoves === 0 && aiMoves === 0)) {
    endGame();
  }
}

function endGame() {
  gameActive = false;
  const you = grid.filter((v) => v === 'player').length;
  const ai = grid.filter((v) => v === 'ai').length;
  const overlay = $('#overlay');
  overlay.hidden = false;

  let title, body;
  if (you > ai) {
    title = 'Kingdom Triumphant';
    body = `You claimed ${you} tiles to your rival's ${ai}. The realm is yours.`;
  } else if (ai > you) {
    title = 'Kingdom Fallen';
    body = `Your rival claimed ${ai} tiles to your ${you}. Rebuild and try again.`;
  } else {
    title = 'A Tense Stalemate';
    body = `Both kingdoms hold ${you} tiles each. Nobody blinked first.`;
  }

  overlay.innerHTML = `
    <h1>${title}</h1>
    <p>${body}</p>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

$('#start-btn').addEventListener('click', reset);
render();
