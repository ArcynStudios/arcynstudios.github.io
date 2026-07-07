/**
 * 2048 — swipe/arrow-key tile merging. Tiles are persistent DOM nodes
 * keyed by id so CSS transitions animate the slide; only genuinely new
 * tiles get the spawn pop. Original code.
 */
import { $, sfx, isMuted, toggleMute, bestScore } from '../shared/engine.js';

const GAME_ID = '2048';
const SIZE = 4;

let tiles, nextId, score, over, won, continued;
const tileEls = new Map();
const boardEl = $('#board');

function colorFor(value) {
  const hue = 260 - Math.min(11, Math.log2(value)) * 18;
  const light = value <= 4 ? 88 : Math.max(45, 75 - Math.log2(value) * 3);
  return `hsl(${hue}, 70%, ${light}%)`;
}

function reset() {
  tiles = [];
  nextId = 1;
  score = 0;
  over = false;
  won = false;
  continued = false;
  tileEls.forEach((el) => el.remove());
  tileEls.clear();
  boardEl.removeAttribute('data-init');
  $('#overlay').hidden = true;
  addRandomTile();
  addRandomTile();
  render();
}

function emptyCells() {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!tiles.some((t) => t.r === r && t.c === c)) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile() {
  const empty = emptyCells();
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  tiles.push({ id: nextId++, r, c, value: Math.random() < 0.9 ? 2 : 4, isNew: true, merged: false });
}

function move(dir) {
  if (over) return;
  const axis = dir === 'left' || dir === 'right' ? 'c' : 'r';
  const ascending = dir === 'left' || dir === 'up';
  let moved = false;
  let scoreGain = 0;

  tiles.forEach((t) => { t.isNew = false; t.merged = false; });

  const lineKey = axis === 'c' ? 'r' : 'c';
  const lines = {};
  tiles.forEach((t) => {
    (lines[t[lineKey]] ||= []).push(t);
  });

  Object.values(lines).forEach((lineTiles) => {
    lineTiles.sort((a, b) => (ascending ? a[axis] - b[axis] : b[axis] - a[axis]));
    let pos = ascending ? 0 : SIZE - 1;
    const step = ascending ? 1 : -1;
    let lastTile = null;

    lineTiles.forEach((t) => {
      if (lastTile && !lastTile.merged && lastTile.value === t.value) {
        lastTile.value *= 2;
        lastTile.merged = true;
        scoreGain += lastTile.value;
        t.remove = true;
        moved = true;
      } else {
        if (t[axis] !== pos) moved = true;
        t[axis] = pos;
        pos += step;
        lastTile = t;
      }
    });
  });

  tiles = tiles.filter((t) => !t.remove);

  if (!moved) return;

  score += scoreGain;
  sfx[scoreGain > 0 ? 'merge' : 'move']();
  addRandomTile();
  render();
  checkState();
}

function checkState() {
  const { best, isNewBest } = bestScore(GAME_ID, score);
  $('#best').textContent = best;

  if (!won && tiles.some((t) => t.value >= 2048)) {
    won = true;
    sfx.win();
    showOverlay('2048!', "You hit the target tile. Keep going for a higher score, or start fresh.", true);
    return;
  }

  if (emptyCells().length) return;

  const hasMove = tiles.some((t) => {
    return tiles.some((o) => o !== t && ((o.r === t.r && Math.abs(o.c - t.c) === 1) || (o.c === t.c && Math.abs(o.r - t.r) === 1)) && o.value === t.value);
  });

  if (!hasMove) {
    over = true;
    sfx.lose();
    showOverlay('Game Over', `Final score: ${score}. ${isNewBest ? 'New best!' : `Best: ${best}`}`, false);
  }
}

function showOverlay(title, message, allowContinue) {
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="option-row">
      ${allowContinue ? '<button class="g-btn g-btn--ghost" id="continue-btn">Keep Playing</button>' : ''}
      <button class="g-btn" id="start-btn">${allowContinue ? 'New Game' : 'Try Again'}</button>
    </div>
  `;
  $('#start-btn').addEventListener('click', reset);
  $('#continue-btn')?.addEventListener('click', () => {
    continued = true;
    overlay.hidden = true;
  });
}

function render() {
  if (!boardEl.dataset.init) {
    boardEl.innerHTML = '';
    for (let i = 0; i < SIZE * SIZE; i++) {
      const bg = document.createElement('div');
      bg.className = 'cell-bg';
      boardEl.appendChild(bg);
    }
    boardEl.dataset.init = '1';
  }

  const boardRect = boardEl.getBoundingClientRect();
  const liveIds = new Set(tiles.map((t) => t.id));
  for (const [id, el] of tileEls) {
    if (!liveIds.has(id)) {
      el.remove();
      tileEls.delete(id);
    }
  }

  tiles.forEach((t) => {
    const bg = boardEl.children[t.r * SIZE + t.c];
    const bgRect = bg.getBoundingClientRect();
    let el = tileEls.get(t.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'tile spawn';
      boardEl.appendChild(el);
      tileEls.set(t.id, el);
    }
    el.style.left = `${bgRect.left - boardRect.left}px`;
    el.style.top = `${bgRect.top - boardRect.top}px`;
    el.style.width = `${bgRect.width}px`;
    el.style.height = `${bgRect.height}px`;
    el.style.background = colorFor(t.value);
    el.style.color = t.value <= 4 ? '#5b4636' : '#f5f5fa';
    el.textContent = t.value;
    if (t.merged) {
      el.classList.remove('merged');
      void el.offsetWidth; // restart the animation
      el.classList.add('merged');
    }
  });

  $('#score').textContent = score;
}

window.addEventListener('keydown', (e) => {
  const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  if (map[e.code]) {
    e.preventDefault();
    move(map[e.code]);
  }
});

let touchStart = null;
boardEl.addEventListener('pointerdown', (e) => { touchStart = { x: e.clientX, y: e.clientY }; });
boardEl.addEventListener('pointerup', (e) => {
  if (!touchStart) return;
  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  touchStart = null;
  if (Math.hypot(dx, dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});

window.addEventListener('resize', render);

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);
$('#best').textContent = Number(localStorage.getItem(`arcyn-best-${GAME_ID}`) || 0);

tiles = [];
