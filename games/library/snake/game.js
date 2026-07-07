/**
 * Snake — classic grid movement on a fixed tick interval (not a continuous
 * RAF loop) since discrete-cell movement is the correct feel for this
 * game. Original code.
 */
import { fitCanvas, createKeyState, bindTouchButton, bestScore, sfx, isMuted, toggleMute, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 1);

const COLS = 20;
const ROWS = 20;
const SPEEDS = { slow: 180, normal: 120, fast: 80 };

const keys = createKeyState();
bindTouchButton($('#btn-left'), keys, 'ArrowLeft');
bindTouchButton($('#btn-right'), keys, 'ArrowRight');
bindTouchButton($('#btn-up'), keys, 'ArrowUp');
bindTouchButton($('#btn-down'), keys, 'ArrowDown');

let snake, dir, nextDir, food, score, speed, tickId, state; // state: idle | playing | paused | over

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  spawnFood();
  state = 'playing';
  $('#overlay').hidden = true;
  $('#pause-layer').hidden = true;
  $('#score').textContent = '0';
  restartTick();
  draw();
}

function restartTick() {
  clearInterval(tickId);
  tickId = setInterval(tick, SPEEDS[speed]);
}

function spawnFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function readDirection() {
  if ((keys.has('ArrowLeft') || keys.has('KeyA')) && dir.x === 0) nextDir = { x: -1, y: 0 };
  else if ((keys.has('ArrowRight') || keys.has('KeyD')) && dir.x === 0) nextDir = { x: 1, y: 0 };
  else if ((keys.has('ArrowUp') || keys.has('KeyW')) && dir.y === 0) nextDir = { x: 0, y: -1 };
  else if ((keys.has('ArrowDown') || keys.has('KeyS')) && dir.y === 0) nextDir = { x: 0, y: 1 };
}

function tick() {
  if (state !== 'playing') return;
  readDirection();
  dir = nextDir;

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some((s) => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    $('#score').textContent = score;
    sfx.pop();
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const cell = w / COLS;

  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0a0a18');
  grad.addColorStop(1, '#14142a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ff5c8a';
  ctx.shadowColor = '#ff5c8a';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc((food.x + 0.5) * cell, (food.y + 0.5) * cell, cell * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  snake.forEach((seg, i) => {
    const t = i / snake.length;
    ctx.fillStyle = i === 0 ? '#22d3ee' : `hsl(${188 - t * 40}, 80%, ${60 - t * 20}%)`;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = i === 0 ? 12 : 0;
    roundRect(seg.x * cell + 1, seg.y * cell + 1, cell - 2, cell - 2, cell * 0.25);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function gameOver() {
  state = 'over';
  clearInterval(tickId);
  sfx.lose();
  const { best, isNewBest } = bestScore('snake', score);
  $('#best').textContent = best;
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Game Over</h1>
    <div class="overlay__score">${score} pts</div>
    <p>${isNewBest ? 'New personal best!' : `Best: ${best}`}</p>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    $('#pause-layer').hidden = false;
  } else if (state === 'paused') {
    state = 'playing';
    $('#pause-layer').hidden = true;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') togglePause();
});

let touchStart = null;
canvas.addEventListener('pointerdown', (e) => { touchStart = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!touchStart) return;
  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  touchStart = null;
  if (Math.hypot(dx, dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && dir.x === 0) nextDir = { x: 1, y: 0 };
    else if (dx < 0 && dir.x === 0) nextDir = { x: -1, y: 0 };
  } else if (dy > 0 && dir.y === 0) nextDir = { x: 0, y: 1 };
  else if (dy < 0 && dir.y === 0) nextDir = { x: 0, y: -1 };
});

$('#speed-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#speed-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  speed = btn.dataset.speed;
});

$('#pause-btn').addEventListener('click', togglePause);
$('#resume-btn').addEventListener('click', togglePause);

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#start-btn').addEventListener('click', reset);

speed = 'normal';
state = 'idle';
snake = [{ x: 10, y: 10 }];
food = { x: 15, y: 10 };
draw();
