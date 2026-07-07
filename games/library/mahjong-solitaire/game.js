/**
 * Mahjong Solitaire — layered tile-matching with the classic "freedom"
 * rule (a tile is selectable if uncovered and open on at least one side).
 * Layout is a programmatically generated 4-tier pyramid rather than a
 * hand-authored turtle shape, so the covered/open math stays provably
 * consistent with what's rendered. Original code.
 */
import { $, sfx, isMuted, toggleMute, bestTime } from '../shared/engine.js';

const GAME_ID = 'mahjong-solitaire';
const SYMBOLS = ['🀄', '🎋', '🌸', '🍀', '🔔', '⭐', '🌙', '🔥', '💎', '🍁', '🎴', '🌊', '⚡', '🐉', '🦋', '🍄', '🧧', '🎐', '🪭', '🀇'];
const GRID_COLS = 9;
const GRID_ROWS = 7;

function buildLayout() {
  const positions = [];
  const layers = [
    { layer: 0, xs: range(0, 7), ys: range(0, 5) },
    { layer: 1, xs: range(1, 6), ys: range(1, 4) },
    { layer: 2, xs: range(2, 5), ys: range(2, 3) },
    { layer: 3, xs: [3, 4], ys: [2] }
  ];
  layers.forEach(({ layer, xs, ys }) => {
    xs.forEach((x) => ys.forEach((y) => positions.push({ layer, x, y })));
  });
  return positions;
}

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

let tiles, selected, matchedCount, startTime, timerId, over;

function reset() {
  const layout = buildLayout();
  const pairCount = layout.length / 2;
  const symbolPool = [];
  while (symbolPool.length < pairCount) symbolPool.push(...SYMBOLS);
  const symbols = shuffle(symbolPool.slice(0, pairCount).flatMap((s) => [s, s]));

  tiles = layout.map((pos, i) => ({ ...pos, id: i, symbol: symbols[i], matched: false }));
  selected = null;
  matchedCount = 0;
  over = false;
  startTime = performance.now();
  $('#overlay').hidden = true;
  $('#remaining').textContent = pairCount;
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);
  render();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateTimer() {
  if (over) return;
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function isCovered(tile) {
  return tiles.some((t) => !t.matched && t.layer === tile.layer + 1 && t.x === tile.x && t.y === tile.y);
}

function sideOpen(tile, dx) {
  return !tiles.some((t) => !t.matched && t.layer === tile.layer && t.x === tile.x + dx && t.y === tile.y);
}

function isFree(tile) {
  if (isCovered(tile)) return false;
  return sideOpen(tile, -1) || sideOpen(tile, 1);
}

function render() {
  const board = $('#board');
  board.innerHTML = '';
  tiles.forEach((tile) => {
    if (tile.matched) return;
    const free = isFree(tile);
    const el = document.createElement('div');
    el.className = `tile${free ? '' : ' blocked'}${selected?.id === tile.id ? ' selected' : ''}`;
    el.style.width = `${(1 / GRID_COLS) * 100}%`;
    el.style.height = `${(1 / GRID_ROWS) * 100}%`;
    el.style.left = `${(tile.x / GRID_COLS) * 100}%`;
    el.style.top = `${(tile.y / GRID_ROWS) * 100}%`;
    el.style.transform = `translate(${-tile.layer * 4}px, ${-tile.layer * 4}px)`;
    el.style.zIndex = tile.layer * 10 + tile.y;
    el.textContent = tile.symbol;
    if (free) el.addEventListener('click', () => handleTap(tile));
    board.appendChild(el);
  });
}

function handleTap(tile) {
  if (over) return;
  if (selected?.id === tile.id) {
    selected = null;
    render();
    return;
  }

  if (!selected) {
    selected = tile;
    sfx.click();
    render();
    return;
  }

  if (selected.symbol === tile.symbol) {
    selected.matched = true;
    tile.matched = true;
    matchedCount++;
    sfx.pop();
    selected = null;
    $('#remaining').textContent = tiles.filter((t) => !t.matched).length / 2;
    render();
    checkWin();
    checkDeadlock();
  } else {
    sfx.invalid();
    selected = tile;
    render();
  }
}

function checkWin() {
  if (tiles.every((t) => t.matched)) {
    over = true;
    clearInterval(timerId);
    sfx.win();
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    const { isNewBest, best } = bestTime(GAME_ID, elapsed);
    const overlay = $('#overlay');
    overlay.hidden = false;
    overlay.innerHTML = `
      <h1>Board Cleared!</h1>
      <div class="overlay__score">${$('#time').textContent}</div>
      <p>${isNewBest ? 'New best time!' : `Best time: ${Math.floor(best / 60)}:${String(best % 60).padStart(2, '0')}`}</p>
      <button class="g-btn" id="start-btn">Play Again</button>
    `;
    $('#start-btn').addEventListener('click', reset);
  }
}

function checkDeadlock() {
  const free = tiles.filter((t) => !t.matched && isFree(t));
  const bySymbol = new Map();
  free.forEach((t) => bySymbol.set(t.symbol, (bySymbol.get(t.symbol) || 0) + 1));
  const hasMove = [...bySymbol.values()].some((count) => count >= 2);
  if (!hasMove && free.length) {
    setTimeout(() => {
      if (!over) shuffleRemaining(true);
    }, 500);
  }
}

function shuffleRemaining(auto = false) {
  const remaining = tiles.filter((t) => !t.matched);
  const symbols = shuffle(remaining.map((t) => t.symbol));
  remaining.forEach((t, i) => (t.symbol = symbols[i]));
  sfx.click();
  render();
  if (auto) checkDeadlock();
}

$('#shuffle-btn').addEventListener('click', () => shuffleRemaining(false));

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

tiles = [];
render();
