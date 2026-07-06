/**
 * Wraith Protocol — pure-dodge arena survival against four aimed turrets.
 * Original code, canvas 2D only.
 */
import { fitCanvas, createKeyState, createLoop, bindTouchButton, clamp, rand, bestScore, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 1);

const keys = createKeyState();
bindTouchButton($('#btn-left'), keys, 'KeyA');
bindTouchButton($('#btn-right'), keys, 'KeyD');
bindTouchButton($('#btn-up'), keys, 'KeyW');
bindTouchButton($('#btn-down'), keys, 'KeyS');

let state = 'idle';
let player, turrets, bolts, orbs, score, lives, invuln, elapsed, orbTimer;

function logicalSize() {
  const dpr = window.devicePixelRatio || 1;
  return { w: canvas.width / dpr, h: canvas.height / dpr };
}

function reset() {
  const { w, h } = logicalSize();
  player = { x: w / 2, y: h / 2, r: 11 };
  turrets = [
    { x: 30, y: 30 },
    { x: w - 30, y: 30 },
    { x: 30, y: h - 30 },
    { x: w - 30, y: h - 30 }
  ].map((t) => ({ ...t, cooldown: rand(0.4, 1.2) }));
  bolts = [];
  orbs = [];
  score = 0;
  lives = 3;
  invuln = 1;
  elapsed = 0;
  orbTimer = 2;
  state = 'playing';
  $('#overlay').hidden = true;
}

function update(dt) {
  const { w, h } = logicalSize();
  if (state !== 'playing') return draw(w, h);

  elapsed += dt;
  const difficulty = clamp(1 + elapsed / 30, 1, 3);

  const speed = 210;
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  player.x = clamp(player.x + (dx / len) * speed * dt, player.r, w - player.r);
  player.y = clamp(player.y + (dy / len) * speed * dt, player.r, h - player.r);

  turrets.forEach((t) => {
    t.cooldown -= dt * difficulty;
    if (t.cooldown <= 0) {
      const angle = Math.atan2(player.y - t.y, player.x - t.x);
      bolts.push({ x: t.x, y: t.y, vx: Math.cos(angle) * 190, vy: Math.sin(angle) * 190, r: 6 });
      t.cooldown = rand(0.9, 1.6);
    }
  });

  bolts.forEach((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  });
  bolts = bolts.filter((b) => b.x > -20 && b.x < w + 20 && b.y > -20 && b.y < h + 20);

  orbTimer -= dt;
  if (orbTimer <= 0) {
    orbs.push({ x: rand(40, w - 40), y: rand(40, h - 40), r: 9, life: 6 });
    orbTimer = rand(2.5, 4.5);
  }
  orbs.forEach((o) => (o.life -= dt));
  orbs = orbs.filter((o) => o.life > 0);

  orbs.forEach((o) => {
    if (Math.hypot(o.x - player.x, o.y - player.y) < o.r + player.r) {
      o.life = 0;
      score += 25;
    }
  });
  orbs = orbs.filter((o) => o.life > 0);

  invuln = Math.max(0, invuln - dt);
  if (invuln <= 0) {
    for (const b of bolts) {
      if (Math.hypot(b.x - player.x, b.y - player.y) < b.r + player.r) {
        lives -= 1;
        invuln = 1.5;
        bolts = bolts.filter((x) => x !== b);
        if (lives <= 0) return gameOver();
        break;
      }
    }
  }

  score += Math.round(dt * 10);
  $('#score').textContent = score;
  $('#lives').textContent = lives;
  draw(w, h);
}

function gameOver() {
  state = 'over';
  const { best, isNewBest } = bestScore('wraith-protocol', score);
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Protocol Failed</h1>
    <div class="overlay__score">${score} pts</div>
    <p>${isNewBest ? 'New personal best!' : `Best: ${best}`}</p>
    <button class="g-btn" id="start-btn">Try Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function draw(w, h) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, '#181233');
  grad.addColorStop(1, '#05050a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  turrets?.forEach((t) => {
    ctx.fillStyle = '#7c5cff';
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  orbs?.forEach((o) => {
    ctx.fillStyle = '#ffb444';
    ctx.shadowColor = '#ffb444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  bolts?.forEach((b) => {
    ctx.fillStyle = '#ff5c8a';
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  if (player) {
    ctx.globalAlpha = invuln > 0 ? 0.5 + 0.5 * Math.sin(performance.now() / 60) : 1;
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
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
