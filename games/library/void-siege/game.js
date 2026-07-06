/**
 * Void Siege — top-down twin-stick-style wave shooter. Mouse aims, WASD
 * moves, click/space fires. Original code, canvas 2D only.
 */
import { fitCanvas, createKeyState, createLoop, bindTouchButton, rand, clamp, bestScore, $ } from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 4 / 3);

const keys = createKeyState();
bindTouchButton($('#btn-left'), keys, 'KeyA');
bindTouchButton($('#btn-right'), keys, 'KeyD');
bindTouchButton($('#btn-up'), keys, 'KeyW');
bindTouchButton($('#btn-down'), keys, 'KeyS');

let state = 'idle';
let player = null;
let bullets = [];
let enemies = [];
let particles = [];
let score, wave, hp, fireCooldown, waveTimer, aim;

const pointer = { x: 0, y: 0, down: false };
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * canvasLogicalWidth();
  pointer.y = ((e.clientY - r.top) / r.height) * canvasLogicalHeight();
});
canvas.addEventListener('pointerdown', () => (pointer.down = true));
window.addEventListener('pointerup', () => (pointer.down = false));
$('#btn-fire')?.addEventListener('pointerdown', () => (pointer.down = true));
$('#btn-fire')?.addEventListener('pointerup', () => (pointer.down = false));

function canvasLogicalWidth() {
  return canvas.width / (window.devicePixelRatio || 1);
}
function canvasLogicalHeight() {
  return canvas.height / (window.devicePixelRatio || 1);
}

function reset() {
  const w = canvasLogicalWidth();
  const h = canvasLogicalHeight();
  player = { x: w / 2, y: h / 2, r: 14 };
  bullets = [];
  enemies = [];
  particles = [];
  score = 0;
  wave = 1;
  hp = 100;
  fireCooldown = 0;
  waveTimer = 0;
  aim = { x: w / 2, y: h / 2 };
  pointer.x = w / 2;
  pointer.y = h / 2;
  state = 'playing';
  $('#overlay').hidden = true;
  spawnWave();
}

function spawnWave() {
  const w = canvasLogicalWidth();
  const h = canvasLogicalHeight();
  const count = 3 + wave * 2;
  for (let i = 0; i < count; i++) {
    const edge = Math.floor(rand(0, 4));
    let x, y;
    if (edge === 0) { x = rand(0, w); y = -20; }
    else if (edge === 1) { x = w + 20; y = rand(0, h); }
    else if (edge === 2) { x = rand(0, w); y = h + 20; }
    else { x = -20; y = rand(0, h); }
    enemies.push({ x, y, r: 12, speed: rand(35, 55) + wave * 3, hp: 1 });
  }
}

function update(dt) {
  const w = canvasLogicalWidth();
  const h = canvasLogicalHeight();
  if (state !== 'playing') return draw(w, h);

  const speed = 220;
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  const len = Math.hypot(dx, dy) || 1;
  player.x = clamp(player.x + (dx / len) * speed * dt, player.r, w - player.r);
  player.y = clamp(player.y + (dy / len) * speed * dt, player.r, h - player.r);

  aim.x += (pointer.x - aim.x) * 0.5;
  aim.y += (pointer.y - aim.y) * 0.5;

  fireCooldown -= dt;
  if ((pointer.down || keys.has('Space')) && fireCooldown <= 0) {
    const angle = Math.atan2(aim.y - player.y, aim.x - player.x);
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 480, vy: Math.sin(angle) * 480, life: 1.1 });
    fireCooldown = 0.16;
  }

  bullets.forEach((b) => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  });
  bullets = bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < w + 20 && b.y > -20 && b.y < h + 20);

  enemies.forEach((e) => {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;
  });

  // Bullet vs enemy
  for (const e of enemies) {
    for (const b of bullets) {
      if (b.life > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r) {
        e.hp -= 1;
        b.life = 0;
        if (e.hp <= 0) {
          e.dead = true;
          score += 10;
          spawnBurst(e.x, e.y);
        }
      }
    }
  }
  bullets = bullets.filter((b) => b.life > 0);

  // Enemy vs player
  enemies.forEach((e) => {
    if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.r) {
      e.dead = true;
      hp -= 12;
      spawnBurst(e.x, e.y, '#ff5c8a');
    }
  });
  enemies = enemies.filter((e) => !e.dead);

  particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  });
  particles = particles.filter((p) => p.life > 0);

  if (!enemies.length) {
    waveTimer += dt;
    if (waveTimer > 1) {
      wave += 1;
      waveTimer = 0;
      spawnWave();
    }
  }

  if (hp <= 0) return gameOver();

  $('#score').textContent = score;
  $('#wave').textContent = wave;
  $('#hp').textContent = Math.max(0, Math.round(hp));

  draw(w, h);
}

function spawnBurst(x, y, color = '#22d3ee') {
  for (let i = 0; i < 8; i++) {
    const a = rand(0, Math.PI * 2);
    particles.push({ x, y, vx: Math.cos(a) * rand(40, 140), vy: Math.sin(a) * rand(40, 140), life: rand(0.2, 0.5), color });
  }
}

function gameOver() {
  state = 'over';
  const { best, isNewBest } = bestScore('void-siege', score);
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Overrun</h1>
    <div class="overlay__score">${score} pts</div>
    <p>Reached wave ${wave}. ${isNewBest ? 'New personal best!' : `Best: ${best}`}</p>
    <button class="g-btn" id="start-btn">Redeploy</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

function draw(w, h) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, '#12122a');
  grad.addColorStop(1, '#05050a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  particles.forEach((p) => {
    ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  bullets.forEach((b) => {
    ctx.fillStyle = '#ffb444';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  enemies.forEach((e) => {
    ctx.fillStyle = '#ff5c8a';
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  if (player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    const angle = Math.atan2(aim.y - player.y, aim.x - player.x);
    ctx.rotate(angle);
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

$('#start-btn').addEventListener('click', reset);
createLoop(update);
