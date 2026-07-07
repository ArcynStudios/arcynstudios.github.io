/**
 * Bubble Shooter — hex-grid match-3+ popper with wall-bounce aiming and
 * floating-cluster cleanup (bubbles disconnected from the ceiling drop).
 * Original code, canvas 2D only.
 */
import { fitCanvas, createLoop, bestScore, sfx, isMuted, toggleMute, clamp, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 0.72);

const COLS = 8;
const INITIAL_ROWS = 6;
const MAX_ROWS = 12;
const COLORS = ['#ff5c8a', '#22d3ee', '#ffb444', '#7c5cff', '#35e0a1'];

let grid, r, marginX, rowHeight;
let shooterBubble, nextBubble, flying, aim, score, state; // state: idle | aiming | flying | over | won

function logicalSize() {
  const dpr = window.devicePixelRatio || 1;
  return { w: canvas.width / dpr, h: canvas.height / dpr };
}

function computeGeometry() {
  const { w } = logicalSize();
  r = w / (COLS + 1) / 2;
  marginX = r;
  rowHeight = r * Math.sqrt(3);
}

function cellToPixel(row, col) {
  const x = marginX + col * 2 * r + (row % 2 ? r : 0) + r;
  const y = r + row * rowHeight + r * 0.3;
  return { x, y };
}

function key(row, col) {
  return `${row},${col}`;
}

function neighbors(row, col) {
  if (row % 2 === 0) {
    return [[row, col - 1], [row, col + 1], [row - 1, col - 1], [row - 1, col], [row + 1, col - 1], [row + 1, col]];
  }
  return [[row, col - 1], [row, col + 1], [row - 1, col], [row - 1, col + 1], [row + 1, col], [row + 1, col + 1]];
}

function reset() {
  computeGeometry();
  grid = new Map();
  for (let row = 0; row < INITIAL_ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      grid.set(key(row, col), COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
  }
  score = 0;
  $('#score').textContent = '0';
  state = 'aiming';
  shooterBubble = randomColor();
  nextBubble = randomColor();
  flying = null;
  aim = { x: logicalSize().w / 2, y: 0 };
  $('#overlay').hidden = true;
  draw();
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function shooterPos() {
  const { w, h } = logicalSize();
  return { x: w / 2, y: h - r * 1.5 };
}

function updateAim(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = logicalSize().w / rect.width;
  aim.x = (clientX - rect.left) * scale;
  aim.y = (clientY - rect.top) * scale;
}

function shoot() {
  if (state !== 'aiming') return;
  const pos = shooterPos();
  const angle = Math.atan2(aim.y - pos.y, aim.x - pos.x);
  const clampedAngle = clamp(angle, -Math.PI + 0.15, -0.15);
  const speed = 640;
  flying = {
    x: pos.x,
    y: pos.y,
    vx: Math.cos(clampedAngle) * speed,
    vy: Math.sin(clampedAngle) * speed,
    color: shooterBubble
  };
  state = 'flying';
  sfx.place();
}

function update(dt) {
  if (state !== 'flying' || !flying) return draw();
  const { w } = logicalSize();

  flying.x += flying.vx * dt;
  flying.y += flying.vy * dt;

  if (flying.x - r < 0) {
    flying.x = r;
    flying.vx *= -1;
  } else if (flying.x + r > w) {
    flying.x = w - r;
    flying.vx *= -1;
  }

  if (flying.y - r <= 0 || collidesWithGrid(flying)) {
    settleBubble(flying);
    flying = null;
    state = 'aiming';
  }

  draw();
}

function collidesWithGrid(b) {
  for (const [k, color] of grid) {
    const [row, col] = k.split(',').map(Number);
    const p = cellToPixel(row, col);
    if (Math.hypot(p.x - b.x, p.y - b.y) < r * 1.85) return true;
  }
  return false;
}

function settleBubble(b) {
  // Find nearest empty cell among the candidate row band around the impact point.
  const approxRow = Math.max(0, Math.round((b.y - r - r * 0.3) / rowHeight));
  let best = null;
  let bestDist = Infinity;
  for (let row = Math.max(0, approxRow - 1); row <= approxRow + 1; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid.has(key(row, col))) continue;
      const p = cellToPixel(row, col);
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      if (d < bestDist) {
        bestDist = d;
        best = { row, col };
      }
    }
  }
  if (!best) best = { row: approxRow, col: clamp(Math.round((b.x - marginX) / (2 * r)), 0, COLS - 1) };

  grid.set(key(best.row, best.col), b.color);
  sfx.pop();
  resolveMatches(best.row, best.col, b.color);

  shooterBubble = nextBubble;
  nextBubble = randomColor();

  checkEndState();
}

function resolveMatches(row, col, color) {
  const group = floodFill(row, col, color);
  if (group.length >= 3) {
    group.forEach((k) => grid.delete(k));
    score += group.length * 10;
    sfx.merge();
    dropFloating();
  }
  $('#score').textContent = score;
}

function floodFill(row, col, color) {
  const visited = new Set();
  const stack = [[row, col]];
  const result = [];
  while (stack.length) {
    const [r0, c0] = stack.pop();
    const k = key(r0, c0);
    if (visited.has(k) || grid.get(k) !== color) continue;
    visited.add(k);
    result.push(k);
    neighbors(r0, c0).forEach(([nr, nc]) => stack.push([nr, nc]));
  }
  return result;
}

function dropFloating() {
  const connected = new Set();
  const stack = [];
  for (let col = 0; col < COLS; col++) {
    if (grid.has(key(0, col))) stack.push([0, col]);
  }
  while (stack.length) {
    const [r0, c0] = stack.pop();
    const k = key(r0, c0);
    if (connected.has(k) || !grid.has(k)) continue;
    connected.add(k);
    neighbors(r0, c0).forEach(([nr, nc]) => stack.push([nr, nc]));
  }

  let dropped = 0;
  for (const k of [...grid.keys()]) {
    if (!connected.has(k)) {
      grid.delete(k);
      dropped++;
    }
  }
  if (dropped) {
    score += dropped * 15;
    sfx.win();
  }
}

function checkEndState() {
  if (!grid.size) {
    state = 'won';
    sfx.win();
    return finish('Board Cleared!', true);
  }
  let maxRow = -1;
  for (const k of grid.keys()) maxRow = Math.max(maxRow, Number(k.split(',')[0]));
  if (maxRow >= MAX_ROWS) {
    state = 'over';
    sfx.lose();
    return finish('Bubbles Reached the Line', false);
  }
}

function finish(title, won) {
  const { best, isNewBest } = bestScore('bubble-shooter', score);
  $('#best').textContent = best;
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>${title}</h1>
    <div class="overlay__score">${score} pts</div>
    <p>${isNewBest ? 'New personal best!' : `Best: ${best}`}</p>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function draw() {
  const { w, h } = logicalSize();
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#12122a');
  grad.addColorStop(1, '#05050a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Danger line
  const dangerY = r + MAX_ROWS * rowHeight;
  ctx.strokeStyle = 'rgba(255,92,138,0.4)';
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, dangerY);
  ctx.lineTo(w, dangerY);
  ctx.stroke();
  ctx.setLineDash([]);

  grid.forEach((color, k) => {
    const [row, col] = k.split(',').map(Number);
    const p = cellToPixel(row, col);
    drawBubble(p.x, p.y, color);
  });

  if (flying) drawBubble(flying.x, flying.y, flying.color);

  if (state === 'aiming') {
    const pos = shooterPos();
    const angle = clamp(Math.atan2(aim.y - pos.y, aim.x - pos.x), -Math.PI + 0.15, -0.15);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + Math.cos(angle) * 140, pos.y + Math.sin(angle) * 140);
    ctx.stroke();
    ctx.setLineDash([]);
    drawBubble(pos.x, pos.y, shooterBubble);
    drawBubble(pos.x + r * 2.4, pos.y, nextBubble, 0.6);
  }
}

function drawBubble(x, y, color, scale = 1) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.arc(x, y, r * 0.88 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.arc(x - r * 0.25 * scale, y - r * 0.25 * scale, r * 0.22 * scale, 0, Math.PI * 2);
  ctx.fill();
}

canvas.addEventListener('pointermove', (e) => updateAim(e.clientX, e.clientY));
canvas.addEventListener('pointerdown', (e) => {
  updateAim(e.clientX, e.clientY);
  shoot();
});

window.addEventListener('resize', () => {
  computeGeometry();
  draw();
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

grid = new Map();
state = 'idle';
computeGeometry();
draw();
createLoop(update);
