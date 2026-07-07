/**
 * Sliding Puzzle (N-puzzle) — selectable grid size 3x3/4x4/5x5, shuffled
 * via a guaranteed-solvable permutation. Original code.
 */
import { $, sfx, isMuted, toggleMute, bestTime } from '../shared/engine.js';

const GAME_ID = 'sliding-puzzle';
let SIZE = 4;

let tiles, blankIndex, moves, startTime, timerId, solved;

function solvedState() {
  return [...Array(SIZE * SIZE - 1).keys()].map((n) => n + 1).concat([0]);
}

function isSolvable(arr) {
  const flat = arr.filter((n) => n !== 0);
  let inversions = 0;
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inversions++;
    }
  }
  if (SIZE % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = SIZE - Math.floor(arr.indexOf(0) / SIZE);
  return (inversions + blankRowFromBottom) % 2 === 0;
}

function shuffledSolvable() {
  let arr;
  do {
    arr = solvedState();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr) || arr.join(',') === solvedState().join(','));
  return arr;
}

function reset() {
  tiles = shuffledSolvable();
  blankIndex = tiles.indexOf(0);
  moves = 0;
  solved = false;
  startTime = performance.now();
  $('#overlay').hidden = true;
  $('#moves').textContent = '0';
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);

  const board = $('#board');
  board.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  render();
}

function updateTimer() {
  if (solved) return;
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function neighborsOf(i) {
  const x = i % SIZE, y = Math.floor(i / SIZE);
  const out = [];
  if (x > 0) out.push(i - 1);
  if (x < SIZE - 1) out.push(i + 1);
  if (y > 0) out.push(i - SIZE);
  if (y < SIZE - 1) out.push(i + SIZE);
  return out;
}

function tryMove(i) {
  if (solved || !neighborsOf(i).includes(blankIndex)) {
    if (!solved) sfx.invalid();
    return;
  }
  [tiles[i], tiles[blankIndex]] = [tiles[blankIndex], tiles[i]];
  blankIndex = i;
  moves++;
  sfx.move();
  $('#moves').textContent = moves;
  render();

  if (tiles.join(',') === solvedState().join(',')) {
    solved = true;
    clearInterval(timerId);
    setTimeout(win, 200);
  }
}

function render() {
  const board = $('#board');
  board.innerHTML = '';
  tiles.forEach((value, i) => {
    const el = document.createElement('div');
    el.className = value === 0 ? 'tile blank' : 'tile';
    el.style.fontSize = SIZE >= 5 ? '1.1rem' : '1.5rem';
    el.textContent = value === 0 ? '' : value;
    if (value !== 0) el.addEventListener('click', () => tryMove(i));
    board.appendChild(el);
  });
}

function win() {
  sfx.win();
  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  const { isNewBest, best } = bestTime(`${GAME_ID}-${SIZE}`, elapsed);
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Solved!</h1>
    <div class="overlay__score">${$('#time').textContent}</div>
    <p>${moves} moves. ${isNewBest ? 'New best time!' : `Best time: ${Math.floor(best / 60)}:${String(best % 60).padStart(2, '0')}`}</p>
    <button class="g-btn" id="start-btn">Shuffle Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

$('#diff-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#diff-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  SIZE = Number(btn.dataset.size);
  reset();
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

tiles = solvedState();
blankIndex = tiles.length - 1;
render();
