/**
 * Minesweeper — flood-fill reveal, flagging (right-click / long-press /
 * toggle button), first-click-is-always-safe mine placement. Original code.
 */
import { $, sfx, isMuted, toggleMute, bestTime } from '../shared/engine.js';

const GAME_ID = 'minesweeper';
const DIFFICULTIES = {
  easy: { size: 8, mines: 10 },
  medium: { size: 12, mines: 25 },
  hard: { size: 16, mines: 45 }
};

let difficulty = 'medium';
let size, mineCount, grid, revealedCount, flagCount, firstClick, gameOver, startTime, timerId, flagMode;

function reset() {
  const cfg = DIFFICULTIES[difficulty];
  size = cfg.size;
  mineCount = cfg.mines;
  grid = Array.from({ length: size * size }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }));
  revealedCount = 0;
  flagCount = 0;
  firstClick = true;
  gameOver = false;
  flagMode = false;
  $('#flag-toggle').classList.remove('is-active');
  $('#mine-count').textContent = mineCount;
  $('#time').textContent = '0:00';
  $('#overlay').hidden = true;
  clearInterval(timerId);

  const board = $('#board');
  board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  render();
}

function idx(x, y) {
  return y * size + x;
}

function neighbors(x, y) {
  const out = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) out.push([nx, ny]);
    }
  }
  return out;
}

function placeMines(safeX, safeY) {
  const forbidden = new Set(neighbors(safeX, safeY).map(([x, y]) => idx(x, y)));
  forbidden.add(idx(safeX, safeY));

  let placed = 0;
  while (placed < mineCount) {
    const i = Math.floor(Math.random() * grid.length);
    if (grid[i].mine || forbidden.has(i)) continue;
    grid[i].mine = true;
    placed++;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[idx(x, y)].mine) continue;
      grid[idx(x, y)].adjacent = neighbors(x, y).filter(([nx, ny]) => grid[idx(nx, ny)].mine).length;
    }
  }
}

function updateTimer() {
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function reveal(x, y) {
  const cell = grid[idx(x, y)];
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  revealedCount++;

  if (cell.adjacent === 0 && !cell.mine) {
    neighbors(x, y).forEach(([nx, ny]) => reveal(nx, ny));
  }
}

function handleTap(x, y) {
  if (gameOver) return;
  const cell = grid[idx(x, y)];

  if (flagMode) return toggleFlag(x, y);
  if (cell.flagged || cell.revealed) return;

  if (firstClick) {
    placeMines(x, y);
    firstClick = false;
    startTime = performance.now();
    timerId = setInterval(updateTimer, 250);
  }

  if (cell.mine) {
    sfx.lose();
    cell.revealed = true;
    return endGame(false);
  }

  sfx.place();
  reveal(x, y);
  render();

  if (revealedCount === size * size - mineCount) endGame(true);
}

function toggleFlag(x, y) {
  const cell = grid[idx(x, y)];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagCount += cell.flagged ? 1 : -1;
  sfx.click();
  $('#mine-count').textContent = mineCount - flagCount;
  render();
}

function render() {
  const board = $('#board');
  board.innerHTML = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = grid[idx(x, y)];
      const el = document.createElement('div');
      el.className = 'cell';
      if (cell.revealed) {
        el.classList.add('revealed');
        if (cell.mine) {
          el.classList.add('mine');
          el.textContent = '💣';
        } else if (cell.adjacent) {
          el.classList.add(`n${cell.adjacent}`);
          el.textContent = cell.adjacent;
        }
      } else if (cell.flagged) {
        el.classList.add('flag');
      }

      let holdTimer = null;
      el.addEventListener('pointerdown', () => {
        holdTimer = setTimeout(() => {
          holdTimer = null;
          toggleFlag(x, y);
        }, 450);
      });
      el.addEventListener('pointerup', () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          handleTap(x, y);
        }
      });
      el.addEventListener('pointerleave', () => { if (holdTimer) clearTimeout(holdTimer); });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(x, y);
      });

      board.appendChild(el);
    }
  }
}

function endGame(won) {
  gameOver = true;
  clearInterval(timerId);

  if (won) {
    grid.forEach((c) => { if (c.mine) c.flagged = true; });
    sfx.win();
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    const { isNewBest, best } = bestTime(`${GAME_ID}-${difficulty}`, elapsed);
    render();
    showOverlay('Field Cleared!', `${isNewBest ? 'New best time!' : `Best time: ${Math.floor(best / 60)}:${String(best % 60).padStart(2, '0')}`}`);
  } else {
    grid.forEach((c) => { if (c.mine) c.revealed = true; });
    render();
    showOverlay('Boom!', 'You hit a mine. Give it another shot.');
  }
}

function showOverlay(title, message) {
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>${title}</h1><p>${message}</p><button class="g-btn" id="start-btn">Play Again</button>`;
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

$('#flag-toggle').addEventListener('click', () => {
  flagMode = !flagMode;
  $('#flag-toggle').classList.toggle('is-active', flagMode);
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

size = 12;
grid = Array.from({ length: size * size }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }));
render();
