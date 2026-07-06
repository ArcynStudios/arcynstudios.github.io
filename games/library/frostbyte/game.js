/**
 * Frostbyte — top-down exploration: collect every gem in the zone while
 * dodging drifting hazards. Original code, canvas 2D only.
 */
import { fitCanvas, createKeyState, createLoop, bindTouchButton, clamp, rand, bestScore, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 4 / 3);

const keys = createKeyState();
bindTouchButton($('#btn-left'), keys, 'KeyA');
bindTouchButton($('#btn-right'), keys, 'KeyD');
bindTouchButton($('#btn-up'), keys, 'KeyW');
bindTouchButton($('#btn-down'), keys, 'KeyS');

let state = 'idle';
let player, gems, hazards, score, zone, lives, invuln;

function logicalSize() {
  const dpr = window.devicePixelRatio || 1;
  return { w: canvas.width / dpr, h: canvas.height / dpr };
}

function reset() {
  const { w, h } = logicalSize();
  player = { x: w / 2, y: h / 2, r: 12 };
  score = 0;
  zone = 1;
  lives = 3;
  invuln = 0;
  state = 'playing';
  $('#overlay').hidden = true;
  setupZone();
}

function setupZone() {
  const { w, h } = logicalSize();
  gems = Array.from({ length: 5 + zone }, () => ({
    x: rand(30, w - 30),
    y: rand(30, h - 30),
    r: 8,
    collected: false
  }));
  hazards = Array.from({ length: 1 + Math.floor(zone * 1.2) }, () => ({
    x: rand(30, w - 30),
    y: rand(30, h - 30),
    r: 14,
    a: rand(0, Math.PI * 2),
    speed: rand(30, 55)
  }));
  $('#zone').textContent = zone;
}

function update(dt) {
  const { w, h } = logicalSize();
  if (state !== 'playing') return draw(w, h);

  const speed = 200;
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  player.x = clamp(player.x + (dx / len) * speed * dt, player.r, w - player.r);
  player.y = clamp(player.y + (dy / len) * speed * dt, player.r, h - player.r);

  hazards.forEach((hz) => {
    hz.a += rand(-0.6, 0.6) * dt;
    hz.x = clamp(hz.x + Math.cos(hz.a) * hz.speed * dt, hz.r, w - hz.r);
    hz.y = clamp(hz.y + Math.sin(hz.a) * hz.speed * dt, hz.r, h - hz.r);
  });

  gems.forEach((g) => {
    if (!g.collected && Math.hypot(g.x - player.x, g.y - player.y) < g.r + player.r) {
      g.collected = true;
      score += 10;
    }
  });

  invuln = Math.max(0, invuln - dt);
  if (invuln <= 0) {
    for (const hz of hazards) {
      if (Math.hypot(hz.x - player.x, hz.y - player.y) < hz.r + player.r) {
        lives -= 1;
        invuln = 1.4;
        if (lives <= 0) return gameOver();
        break;
      }
    }
  }

  if (gems.every((g) => g.collected)) {
    zone += 1;
    setupZone();
  }

  $('#score').textContent = score;
  $('#lives').textContent = lives;
  draw(w, h);
}

function gameOver() {
  state = 'over';
  const { best, isNewBest } = bestScore('frostbyte', score);
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Frozen Out</h1>
    <div class="overlay__score">${score} pts</div>
    <p>Reached zone ${zone}. ${isNewBest ? 'New personal best!' : `Best: ${best}`}</p>
    <button class="g-btn" id="start-btn">Try Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function draw(w, h) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0c1830');
  grad.addColorStop(1, '#0a0a18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  gems?.forEach((g) => {
    if (g.collected) return;
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - g.r);
    ctx.lineTo(g.x + g.r, g.y);
    ctx.lineTo(g.x, g.y + g.r);
    ctx.lineTo(g.x - g.r, g.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  hazards?.forEach((hz) => {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  if (player) {
    ctx.globalAlpha = invuln > 0 ? 0.5 + 0.5 * Math.sin(performance.now() / 60) : 1;
    ctx.fillStyle = '#ff5c8a';
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

$('#start-btn').addEventListener('click', reset);
createLoop(update);
