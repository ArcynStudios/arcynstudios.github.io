/**
 * Sudoku — full generator (randomized backtracking fill) + unique-solution
 * puzzle carving (remove cells only while a solver confirms exactly one
 * solution remains). Original code.
 */
import { $, sfx, isMuted, toggleMute, bestTime } from '../shared/engine.js';

const GAME_ID = 'sudoku';
const REMOVE_COUNT = { easy: 38, medium: 46, hard: 52 };

let difficulty = 'medium';
let solution, puzzle, given, selected, mistakes, startTime, timerId, over;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(grid, i, n) {
  const row = Math.floor(i / 9), col = i % 9;
  for (let c = 0; c < 9; c++) if (grid[row * 9 + c] === n) return false;
  for (let r = 0; r < 9; r++) if (grid[r * 9 + col] === n) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (grid[r * 9 + c] === n) return false;
  return true;
}

function fillGrid(grid) {
  const i = grid.indexOf(0);
  if (i === -1) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isValid(grid, i, n)) {
      grid[i] = n;
      if (fillGrid(grid)) return true;
      grid[i] = 0;
    }
  }
  return false;
}

function countSolutions(grid, limit) {
  let count = 0;
  const g = [...grid];
  function solve() {
    if (count >= limit) return;
    const i = g.indexOf(0);
    if (i === -1) {
      count++;
      return;
    }
    for (let n = 1; n <= 9; n++) {
      if (isValid(g, i, n)) {
        g[i] = n;
        solve();
        g[i] = 0;
        if (count >= limit) return;
      }
    }
  }
  solve();
  return count;
}

function carvePuzzle(solved, removeCount) {
  const puz = [...solved];
  const positions = shuffle([...Array(81).keys()]);
  let removed = 0;
  for (const pos of positions) {
    if (removed >= removeCount) break;
    const backup = puz[pos];
    puz[pos] = 0;
    if (countSolutions(puz, 2) !== 1) {
      puz[pos] = backup;
    } else {
      removed++;
    }
  }
  return puz;
}

function reset() {
  const empty = Array(81).fill(0);
  fillGrid(empty);
  solution = empty;
  puzzle = carvePuzzle(solution, REMOVE_COUNT[difficulty]);
  given = puzzle.map((v) => v !== 0);
  selected = null;
  mistakes = 0;
  over = false;
  startTime = performance.now();
  $('#overlay').hidden = true;
  $('#mistakes').textContent = '0';
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);
  render();
  renderNumpad();
}

function updateTimer() {
  if (over) return;
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function render() {
  const board = $('#board');
  board.innerHTML = '';
  const selVal = selected !== null ? puzzle[selected] : null;

  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9), col = i % 9;
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (given[i]) cell.classList.add('given');
    if (i === selected) cell.classList.add('selected');
    else if (selected !== null) {
      const srow = Math.floor(selected / 9), scol = selected % 9;
      const sameBox = Math.floor(row / 3) === Math.floor(srow / 3) && Math.floor(col / 3) === Math.floor(scol / 3);
      if (row === srow || col === scol || sameBox) cell.classList.add('peer');
    }
    if (selVal && puzzle[i] === selVal && i !== selected) cell.classList.add('same-value');
    if (puzzle[i]) cell.textContent = puzzle[i];
    cell.addEventListener('click', () => selectCell(i));
    board.appendChild(cell);
  }
}

function renderNumpad() {
  const pad = $('#numpad');
  pad.innerHTML = [...Array(9).keys()].map((n) => `<button class="num-btn" data-n="${n + 1}">${n + 1}</button>`).join('') +
    `<button class="num-btn" data-n="0" style="grid-column:span 9;">Erase</button>`;
  pad.querySelectorAll('.num-btn').forEach((btn) => {
    btn.addEventListener('click', () => inputNumber(Number(btn.dataset.n)));
  });
}

function selectCell(i) {
  if (over) return;
  selected = i;
  sfx.click();
  render();
}

function inputNumber(n) {
  if (over || selected === null || given[selected]) return;
  if (n === 0) {
    puzzle[selected] = 0;
    render();
    return;
  }

  puzzle[selected] = n;
  if (n !== solution[selected]) {
    sfx.invalid();
    mistakes++;
    $('#mistakes').textContent = mistakes;
    render();
    $(`.board`).children[selected].classList.add('wrong');
    if (mistakes >= 3) return lose();
    return;
  }

  sfx.place();
  render();

  if (puzzle.every((v, i) => v === solution[i])) win();
}

window.addEventListener('keydown', (e) => {
  if (selected === null) return;
  if (e.key >= '1' && e.key <= '9') inputNumber(Number(e.key));
  else if (e.key === 'Backspace' || e.key === 'Delete') inputNumber(0);
  else if (e.key === 'ArrowLeft') moveSelection(-1, 0);
  else if (e.key === 'ArrowRight') moveSelection(1, 0);
  else if (e.key === 'ArrowUp') moveSelection(0, -1);
  else if (e.key === 'ArrowDown') moveSelection(0, 1);
});

function moveSelection(dx, dy) {
  if (selected === null) return;
  const row = Math.floor(selected / 9), col = selected % 9;
  const nr = Math.min(8, Math.max(0, row + dy));
  const nc = Math.min(8, Math.max(0, col + dx));
  selectCell(nr * 9 + nc);
}

function win() {
  over = true;
  clearInterval(timerId);
  sfx.win();
  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  const { isNewBest, best } = bestTime(`${GAME_ID}-${difficulty}`, elapsed);
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Solved!</h1>
    <div class="overlay__score">${$('#time').textContent}</div>
    <p>${isNewBest ? 'New best time!' : `Best time: ${Math.floor(best / 60)}:${String(best % 60).padStart(2, '0')}`}</p>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function lose() {
  over = true;
  clearInterval(timerId);
  sfx.lose();
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>Three Strikes</h1><p>Too many mistakes this round.</p><button class="g-btn" id="start-btn">Try Again</button>`;
  $('#start-btn').addEventListener('click', reset);
}

$('#diff-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#diff-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  difficulty = btn.dataset.diff;
  reset();
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

puzzle = Array(81).fill(0);
given = Array(81).fill(false);
render();
renderNumpad();
