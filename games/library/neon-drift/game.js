/**
 * Neon Drift — 3-lane endless dodge racer. Original code, canvas 2D only.
 */
import { fitCanvas, createKeyState, createLoop, bindTouchButton, overlap, rand, bestScore, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 9 / 16);

const keys = createKeyState();
bindTouchButton($('#btn-left'), keys, 'ArrowLeft');
bindTouchButton($('#btn-right'), keys, 'ArrowRight');

const LANES = 3;
const laneX = (lane, w) => (w / LANES) * (lane + 0.5);

let state = 'idle'; // idle | playing | over
let player = null;
let traffic = [];
let distance, speed, spawnTimer;

function reset() {
  player = { lane: 1, x: 0, y: 0, w: 0.14, h: 0.09 }; // fractions of canvas size
  traffic = [];
  distance = 0;
  speed = 0.22; // fraction of height per second
  spawnTimer = 0;
  state = 'playing';
  $('#overlay').hidden = true;
}

function spawnCar() {
  const lane = Math.floor(rand(0, LANES));
  traffic.push({ lane, y: -0.15, w: 0.14, h: 0.09, hue: rand(0, 360) });
}

function update(dt) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  if (state !== 'playing') return draw(w, h);

  // Move player between lanes on key press (edge-triggered via small cooldown baked into lane distance).
  const targetX = laneX(player.lane, w) - (player.w * w) / 2;
  player.x += (targetX - player.x) * Math.min(dt * 12, 1);
  player.y = h * 0.78;

  if ((keys.has('ArrowLeft') || keys.has('KeyA')) && !player._movedLeft) {
    player.lane = Math.max(0, player.lane - 1);
    player._movedLeft = true;
  } else if (!keys.has('ArrowLeft') && !keys.has('KeyA')) {
    player._movedLeft = false;
  }

  if ((keys.has('ArrowRight') || keys.has('KeyD')) && !player._movedRight) {
    player.lane = Math.min(LANES - 1, player.lane + 1);
    player._movedRight = true;
  } else if (!keys.has('ArrowRight') && !keys.has('KeyD')) {
    player._movedRight = false;
  }

  speed = Math.min(0.55, speed + dt * 0.005);
  distance += speed * dt * 40;

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnCar();
    spawnTimer = Math.max(0.45, 1.1 - speed);
  }

  const playerBox = { x: player.x, y: player.y, w: player.w * w, h: player.h * h };

  traffic.forEach((c) => {
    c.y += speed * dt;
  });
  traffic = traffic.filter((c) => c.y < 1.1);

  for (const c of traffic) {
    const carBox = { x: laneX(c.lane, w) - (c.w * w) / 2, y: c.y * h, w: c.w * w, h: c.h * h };
    if (overlap(playerBox, carBox)) {
      gameOver();
      break;
    }
  }

  $('#score').textContent = Math.floor(distance);
  draw(w, h, playerBox);
}

function gameOver() {
  state = 'over';
  const { best, isNewBest } = bestScore('neon-drift', Math.floor(distance));
  $('#best').textContent = best;
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Wrecked!</h1>
    <div class="overlay__score">${Math.floor(distance)}m</div>
    <p>${isNewBest ? 'New personal best!' : `Best: ${best}m`}</p>
    <button class="g-btn" id="start-btn">Drive Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function draw(w, h, playerBox) {
  ctx.clearRect(0, 0, w, h);

  // Road
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0a18');
  grad.addColorStop(1, '#14142a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Lane dividers
  ctx.strokeStyle = 'rgba(124,92,255,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 16]);
  const scroll = (performance.now() / 1000) * (speed || 0.2) * 60 * 4;
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.moveTo((w / LANES) * i, -scroll % 34);
    ctx.lineTo((w / LANES) * i, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Traffic
  traffic.forEach((c) => {
    const x = laneX(c.lane, w) - (c.w * w) / 2;
    const y = c.y * h;
    ctx.fillStyle = `hsl(${c.hue}, 80%, 60%)`;
    roundRect(x, y, c.w * w, c.h * h, 8);
    ctx.shadowColor = `hsl(${c.hue}, 90%, 60%)`;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Player
  if (playerBox) {
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 18;
    roundRect(playerBox.x, playerBox.y, playerBox.w, playerBox.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
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

$('#start-btn').addEventListener('click', reset);
createLoop(update);
