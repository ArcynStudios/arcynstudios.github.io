/**
 * Snakes & Ladders — 2-4 player local hot-seat, standard rules (exact
 * roll required to land on 100, no bonus turn on 6). Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult } from '../shared/engine.js';

const GAME_ID = 'snakes-and-ladders';
const LADDERS = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };
const SNAKES = { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 99: 41 };
const COLORS = ['#ff5c8a', '#22d3ee', '#ffb444', '#7c5cff'];
const NAMES = ['Red', 'Cyan', 'Amber', 'Violet'];

let numPlayers = 3;
let positions, current, over;

function reset() {
  positions = Array(numPlayers).fill(0);
  current = 0;
  over = false;
  $('#overlay').hidden = true;
  $('#legend').innerHTML = positions.map((_, i) => `<span><span class="swatch" style="background:${COLORS[i]}"></span>${NAMES[i]}</span>`).join('');
  updateTurn();
  render();
}

function updateTurn() {
  if (over) return;
  $('#turn-indicator').textContent = `${NAMES[current]}'s turn`;
}

function cellRowCol(num) {
  // Boustrophedon numbering: bottom row is 1-10 left-to-right, next row right-to-left, etc.
  const rowFromBottom = Math.floor((num - 1) / 10);
  const indexInRow = (num - 1) % 10;
  const col = rowFromBottom % 2 === 0 ? indexInRow : 9 - indexInRow;
  const row = 9 - rowFromBottom;
  return { row, col };
}

function render() {
  const board = $('#board');
  board.innerHTML = '';
  const grid = Array.from({ length: 100 }, () => null);

  for (let num = 1; num <= 100; num++) {
    const { row, col } = cellRowCol(num);
    grid[row * 10 + col] = num;
  }

  grid.forEach((num) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (LADDERS[num]) cell.classList.add('ladder-bottom');
    if (Object.values(LADDERS).includes(num)) cell.classList.add('ladder-top');
    if (SNAKES[num]) cell.classList.add('snake-head');
    if (Object.values(SNAKES).includes(num)) cell.classList.add('snake-tail');
    cell.innerHTML = `${num}`;

    const here = positions.map((p, i) => (p === num ? i : -1)).filter((i) => i !== -1);
    if (here.length) {
      const tokensEl = document.createElement('div');
      tokensEl.className = 'tokens-in-cell';
      tokensEl.innerHTML = here.map((i) => `<span class="token-dot" style="background:${COLORS[i]}"></span>`).join('');
      cell.appendChild(tokensEl);
    }
    board.appendChild(cell);
  });
}

function rollDie() {
  if (over) return;
  const die = $('#die-btn');
  die.classList.add('rolling');
  sfx.click();
  setTimeout(() => {
    const roll = 1 + Math.floor(Math.random() * 6);
    die.textContent = '⚀⚁⚂⚃⚄⚅'[roll - 1];
    die.classList.remove('rolling');
    applyMove(roll);
  }, 350);
}

function applyMove(roll) {
  const start = positions[current];
  let target = start + roll;
  if (target > 100) {
    $('#die-hint').textContent = `Rolled ${roll} — needs an exact ${100 - start} to finish. Passing.`;
    render();
    return setTimeout(nextTurn, 900);
  }

  positions[current] = target;
  sfx.move();
  render();

  setTimeout(() => {
    let landed = target;
    if (LADDERS[landed]) {
      landed = LADDERS[landed];
      sfx.pop();
      positions[current] = landed;
      $('#die-hint').textContent = 'Ladder! Climbing up.';
      render();
    } else if (SNAKES[landed]) {
      landed = SNAKES[landed];
      sfx.invalid();
      positions[current] = landed;
      $('#die-hint').textContent = 'Snake! Sliding down.';
      render();
    } else {
      $('#die-hint').textContent = `Rolled ${roll}.`;
    }

    if (positions[current] === 100) return finishGame(current);
    setTimeout(nextTurn, 700);
  }, 350);
}

function nextTurn() {
  current = (current + 1) % numPlayers;
  $('#die-hint').textContent = 'Tap to roll';
  $('#die-btn').textContent = '🎲';
  updateTurn();
}

function finishGame(winner) {
  over = true;
  recordResult(GAME_ID, 'win');
  sfx.win();
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>${NAMES[winner]} Wins!</h1><p>First to square 100.</p><button class="g-btn" id="start-btn">Play Again</button>`;
  $('#start-btn').addEventListener('click', reset);
}

$('#die-btn').addEventListener('click', rollDie);

$('#player-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#player-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  numPlayers = Number(btn.dataset.players);
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

positions = [0, 0, 0];
render();
