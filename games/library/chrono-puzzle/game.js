/**
 * Chrono Puzzle — classic 4x4 sliding tile puzzle against the clock.
 * Original code, plain DOM.
 */
import { $ } from '../shared/engine.js';

const SIZE = 4;
const board = $('#board');

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
  const blankRow = Math.floor(arr.indexOf(0) / SIZE);
  const blankRowFromBottom = SIZE - blankRow;
  // Standard 15-puzzle solvability rule for an even-width board.
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
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);
  render();
}

function updateTimer() {
  if (solved) return;
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function neighborsOf(i) {
  const x = i % SIZE;
  const y = Math.floor(i / SIZE);
  const out = [];
  if (x > 0) out.push(i - 1);
  if (x < SIZE - 1) out.push(i + 1);
  if (y > 0) out.push(i - SIZE);
  if (y < SIZE - 1) out.push(i + SIZE);
  return out;
}

function tryMove(i) {
  if (solved || !neighborsOf(i).includes(blankIndex)) return;
  [tiles[i], tiles[blankIndex]] = [tiles[blankIndex], tiles[i]];
  blankIndex = i;
  moves += 1;
  $('#moves').textContent = moves;
  render();

  if (tiles.join(',') === solvedState().join(',')) {
    solved = true;
    clearInterval(timerId);
    setTimeout(win, 200);
  }
}

function render() {
  board.innerHTML = '';
  tiles.forEach((value, i) => {
    const el = document.createElement('div');
    el.className = value === 0 ? 'tile blank' : 'tile';
    el.textContent = value === 0 ? '' : value;
    if (value !== 0) el.addEventListener('click', () => tryMove(i));
    board.appendChild(el);
  });
}

function win() {
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Solved!</h1>
    <div class="overlay__score">${$('#time').textContent}</div>
    <p>Finished in ${moves} moves.</p>
    <button class="g-btn" id="start-btn">Shuffle Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

$('#start-btn').addEventListener('click', reset);
tiles = solvedState();
blankIndex = tiles.length - 1;
render();
