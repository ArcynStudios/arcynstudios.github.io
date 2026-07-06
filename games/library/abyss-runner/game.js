/**
 * Abyss Runner — endless side-scrolling jump/duck runner. Original code,
 * canvas 2D only.
 */
import { fitCanvas, createKeyState, createLoop, bindTouchButton, overlap, rand, bestScore, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 16 / 9);

const keys = createKeyState();
bindTouchButton($('#btn-jump'), keys, 'Space');
bindTouchButton($('#btn-duck'), keys, 'ArrowDown');
canvas.addEventListener('pointerdown', () => keys.add('Space'));
canvas.addEventListener('pointerup', () => keys.delete('Space'));

const GROUND_Y_FRAC = 0.78;
let state = 'idle';
let player = null;
let obstacles = [];
let distance, speed, spawnTimer, jumpHeld;

function reset() {
  player = { x: 0.12, y: 0, vy: 0, w: 0.05, h: 0.09, ducking: false, grounded: true };
  obstacles = [];
  distance = 0;
  speed = 0.32;
  spawnTimer = 0.6;
  jumpHeld = false;
  state = 'playing';
  $('#overlay').hidden = true;
}

function spawnObstacle() {
  const flying = Math.random() < 0.35;
  obstacles.push({
    x: 1.05,
    flying,
    w: 0.035,
    h: flying ? 0.08 : rand(0.06, 0.1),
    yOffset: flying ? rand(0.22, 0.3) : 0
  });
}

function update(dt) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  if (state !== 'playing') return draw(w, h);

  const groundY = h * GROUND_Y_FRAC;
  const wantsJump = keys.has('Space') || keys.has('ArrowUp');
  const wantsDuck = keys.has('ArrowDown');

  if (wantsJump && player.grounded && !jumpHeld) {
    player.vy = -h * 1.05;
    player.grounded = false;
  }
  jumpHeld = wantsJump;

  player.ducking = wantsDuck && player.grounded;

  player.vy += h * 2.6 * dt; // gravity
  player.y += player.vy * dt;
  if (player.y > 0) {
    player.y = 0;
    player.vy = 0;
    player.grounded = true;
  }

  speed = Math.min(0.75, speed + dt * 0.006);
  distance += speed * dt * 40;

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(0.55, 1.3 - speed * 0.8);
  }

  obstacles.forEach((o) => (o.x -= speed * dt));
  obstacles = obstacles.filter((o) => o.x > -0.1);

  const playerH = player.ducking ? player.h * 0.55 : player.h;
  const playerBox = {
    x: player.x * w,
    y: groundY + player.y - playerH * h,
    w: player.w * w,
    h: playerH * h
  };

  for (const o of obstacles) {
    const oy = o.flying ? groundY - o.yOffset * h - o.h * h : groundY - o.h * h;
    const obBox = { x: o.x * w, y: oy, w: o.w * w, h: o.h * h };
    if (overlap(playerBox, obBox)) return gameOver();
  }

  $('#score').textContent = Math.floor(distance);
  draw(w, h, playerBox, groundY);
}

function gameOver() {
  state = 'over';
  const { best, isNewBest } = bestScore('abyss-runner', Math.floor(distance));
  $('#best').textContent = best;
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Swallowed by the Abyss</h1>
    <div class="overlay__score">${Math.floor(distance)}m</div>
    <p>${isNewBest ? 'New personal best!' : `Best: ${best}m`}</p>
    <button class="g-btn" id="start-btn">Run Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function draw(w, h, playerBox, groundYArg) {
  const groundY = groundYArg ?? h * GROUND_Y_FRAC;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0a18');
  grad.addColorStop(1, '#191932');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(124,92,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  obstacles.forEach((o) => {
    const oy = o.flying ? groundY - o.yOffset * h - o.h * h : groundY - o.h * h;
    ctx.fillStyle = o.flying ? '#ffb444' : '#ff5c8a';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillRect(o.x * w, oy, o.w * w, o.h * h);
    ctx.shadowBlur = 0;
  });

  if (playerBox) {
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 16;
    ctx.fillRect(playerBox.x, playerBox.y, playerBox.w, playerBox.h);
    ctx.shadowBlur = 0;
  }
}

$('#start-btn').addEventListener('click', reset);
createLoop(update);
