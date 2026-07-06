/**
 * Quantum Maze — procedurally generated maze escape (recursive backtracker).
 * Grid-based discrete movement. Original code, canvas 2D only.
 */
import { fitCanvas, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 1);

let cols, rows, cells, player, exit, level, startTime, timerId, finished;

function makeMaze(w, h) {
  const grid = Array.from({ length: w * h }, () => ({ top: true, right: true, bottom: true, left: true, visited: false }));
  const at = (x, y) => grid[y * w + x];
  const stack = [{ x: 0, y: 0 }];
  at(0, 0).visited = true;

  while (stack.length) {
    const { x, y } = stack[stack.length - 1];
    const neighbors = [];
    if (y > 0 && !at(x, y - 1).visited) neighbors.push({ x, y: y - 1, dir: 'top' });
    if (x < w - 1 && !at(x + 1, y).visited) neighbors.push({ x: x + 1, y, dir: 'right' });
    if (y < h - 1 && !at(x, y + 1).visited) neighbors.push({ x, y: y + 1, dir: 'bottom' });
    if (x > 0 && !at(x - 1, y).visited) neighbors.push({ x: x - 1, y, dir: 'left' });

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
    at(x, y)[next.dir] = false;
    at(next.x, next.y)[opposite[next.dir]] = false;
    at(next.x, next.y).visited = true;
    stack.push({ x: next.x, y: next.y });
  }

  return grid;
}

function newLevel() {
  const size = Math.min(6 + level * 2, 16);
  cols = size;
  rows = size;
  cells = makeMaze(cols, rows);
  player = { x: 0, y: 0 };
  exit = { x: cols - 1, y: rows - 1 };
  render();
}

function reset() {
  level = 1;
  finished = false;
  startTime = performance.now();
  $('#overlay').hidden = true;
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);
  newLevel();
}

function updateTimer() {
  if (finished) return;
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function tryMove(dx, dy) {
  if (finished || !cells) return;
  const cell = cells[player.y * cols + player.x];
  if (dx === 1 && cell.right) return;
  if (dx === -1 && cell.left) return;
  if (dy === 1 && cell.bottom) return;
  if (dy === -1 && cell.top) return;

  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;
  player.x = nx;
  player.y = ny;

  if (player.x === exit.x && player.y === exit.y) {
    if (level >= 5) {
      finish();
    } else {
      level += 1;
      $('#level').textContent = level;
      newLevel();
      return;
    }
  }
  render();
}

function finish() {
  finished = true;
  clearInterval(timerId);
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Maze Master</h1>
    <div class="overlay__score">${$('#time').textContent}</div>
    <p>You escaped all 5 mazes. The quantum corridors bow to you.</p>
    <button class="g-btn" id="start-btn">Go Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function render() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, w, h);
  if (!cells) return;

  const cell = Math.min(w / cols, h / rows);
  const offX = (w - cell * cols) / 2;
  const offY = (h - cell * rows) / 2;

  // Exit glow
  ctx.fillStyle = 'rgba(53,224,161,0.25)';
  ctx.fillRect(offX + exit.x * cell, offY + exit.y * cell, cell, cell);

  ctx.strokeStyle = '#7c5cff';
  ctx.lineWidth = Math.max(2, cell * 0.06);
  ctx.lineCap = 'round';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = cells[y * cols + x];
      const px = offX + x * cell;
      const py = offY + y * cell;
      ctx.beginPath();
      if (c.top) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); }
      if (c.right) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell); }
      if (c.bottom) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell); }
      if (c.left) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#22d3ee';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(offX + (player.x + 0.5) * cell, offY + (player.y + 0.5) * cell, cell * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

window.addEventListener('keydown', (e) => {
  const map = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };
  if (map[e.code]) {
    e.preventDefault();
    tryMove(...map[e.code]);
  }
});

$('#btn-left').addEventListener('click', () => tryMove(-1, 0));
$('#btn-right').addEventListener('click', () => tryMove(1, 0));
$('#btn-up').addEventListener('click', () => tryMove(0, -1));
$('#btn-down').addEventListener('click', () => tryMove(0, 1));

window.addEventListener('resize', render);
$('#start-btn').addEventListener('click', reset);
