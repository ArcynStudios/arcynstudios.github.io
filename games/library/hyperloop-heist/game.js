/**
 * HYPERLOOP HEIST — three-rail arcade runner through a speeding transit tube.
 * Switch rails to collect cargo and dodge interceptors; jumping lifts you off
 * the rail for a moment.
 */

import {
  fitCanvas, createKeyState, createLoop, bindTouchButton, $,
  clamp, rand, randInt, lerp, bestScore, saveGameState, loadGameState,
  sfx, isMuted, toggleMute,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect,
  createComboSystem, createScoreSystem
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 9 / 16);

const keys = createKeyState();
bindTouchButton($('#btn-up'), keys, 'ArrowUp');
bindTouchButton($('#btn-down'), keys, 'ArrowDown');
bindTouchButton($('#btn-jump'), keys, 'Space');

const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const glows = createGlowEffect();
const combo = createComboSystem();
const scoreSys = createScoreSystem();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const RAILS = 3;
const PLAYER_X = 0.24;      // fraction of the width
const PLAYER_R = 15;

let state = 'menu';
let player, items, hazards, sparks, ribs;
let speed, distance, spawnT, time, hp;
let prevUp = false, prevDown = false, prevJump = false;

function railY(i) {
  const top = H() * 0.3;
  const gap = H() * 0.2;
  return top + i * gap;
}

function reset() {
  player = { rail: 1, y: railY(1), jump: 0, invuln: 0, flash: 0, tilt: 0 };
  items = [];
  hazards = [];
  sparks = [];
  ribs = Array.from({ length: 16 }, (_, i) => ({ x: (i / 16) * W() * 2 }));
  speed = 1;
  distance = 0;
  spawnT = 0;
  time = 0;
  hp = 3;
  combo.reset();
  scoreSys.reset();
}

function spawn() {
  const rail = randInt(0, RAILS - 1);
  const x = W() + 40;
  // Never place cargo and an interceptor on the same rail at the same time.
  if (Math.random() < 0.56) {
    items.push({ x, rail, r: 12, spin: 0, taken: false });
  } else {
    hazards.push({ x, rail, r: 15, spin: 0 });
  }
}

function hit() {
  if (player.invuln > 0) return;
  hp--;
  player.invuln = 1.4;
  player.flash = 0.4;
  combo.reset();
  sfx.explosion();
  shake.shake(14, 0.86);
  particles.burst(W() * PLAYER_X, player.y, 26, {
    color: '#ff5c8a', size: 6, life: 0.8, glow: true
  });
  if (hp <= 0) gameOver();
}

function update(dt) {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  glows.update(dt);
  combo.update(dt);

  if (state !== 'playing') return;

  speed = Math.min(3.4, 1 + distance / 2600);
  const px = speed * 320;
  distance += px * dt * 0.1;

  for (const r of ribs) {
    r.x -= px * dt;
    if (r.x < -60) r.x += W() * 2 + 60;
  }

  // ---- input (edge-triggered so a held key moves one rail) ----
  const up = keys.has('ArrowUp') || keys.has('KeyW');
  const down = keys.has('ArrowDown') || keys.has('KeyS');
  const jump = keys.has('Space');

  if (up && !prevUp && player.rail > 0) { player.rail--; sfx.move(); player.tilt = -1; }
  if (down && !prevDown && player.rail < RAILS - 1) { player.rail++; sfx.move(); player.tilt = 1; }
  if (jump && !prevJump && player.jump <= 0) { player.jump = 0.55; sfx.jump(); }
  prevUp = up; prevDown = down; prevJump = jump;

  player.y = lerp(player.y, railY(player.rail), 1 - Math.pow(0.0005, dt));
  player.tilt = lerp(player.tilt, 0, 1 - Math.pow(0.002, dt));
  if (player.jump > 0) player.jump -= dt;
  player.invuln = Math.max(0, player.invuln - dt);
  player.flash = Math.max(0, player.flash - dt);

  const airborne = player.jump > 0;
  const drawY = player.y - (airborne ? Math.sin((1 - player.jump / 0.55) * Math.PI) * 46 : 0);
  player.drawY = drawY;

  particles.trail(W() * PLAYER_X - 14, drawY, {
    color: '#ffb444', life: 0.3, size: 4, glow: true
  });

  // ---- spawning ----
  spawnT -= dt;
  if (spawnT <= 0) {
    spawn();
    spawnT = rand(0.42, 0.85) / speed;
  }

  const hx = W() * PLAYER_X;

  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.x -= px * dt;
    it.spin += dt * 3;
    if (!it.taken && !airborne && Math.abs(it.x - hx) < PLAYER_R + it.r &&
        Math.abs(railY(it.rail) - player.y) < 26) {
      it.taken = true;
      combo.add();
      const gain = 30 * combo.multiplier;
      scoreSys.add(gain);
      texts.add(it.x, railY(it.rail) - 12, `+${Math.round(gain)}`, {
        size: 16, color: '#ffb444', life: 0.7
      });
      particles.burst(it.x, railY(it.rail), 14, {
        color: '#ffd9a0', size: 4, life: 0.5, glow: true
      });
      glows.add(it.x, railY(it.rail), 40, 'rgb(255, 180, 68)', 0.35);
      sfx.collect();
      items.splice(i, 1);
      continue;
    }
    if (it.x < -50) items.splice(i, 1);
  }

  for (let i = hazards.length - 1; i >= 0; i--) {
    const hz = hazards[i];
    hz.x -= px * dt;
    hz.spin += dt * 5;
    if (!airborne && Math.abs(hz.x - hx) < PLAYER_R + hz.r &&
        Math.abs(railY(hz.rail) - player.y) < 26) {
      hazards.splice(i, 1);
      hit();
      continue;
    }
    if (hz.x < -50) hazards.splice(i, 1);
  }

  scoreSys.add(px * dt * 0.02);

  $('#score').textContent = Math.floor(scoreSys.getScore());
  $('#speed-label').textContent = `SPEED ${speed.toFixed(1)}x`;
  const c = combo.combo;
  $('#combo-pill').style.display = c > 1 ? '' : 'none';
  $('#combo').textContent = c;
}

// ------------------------------------------------------------------- draw

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const o = shake.getOffset();
  ctx.translate(o.x, o.y);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1a0f04');
  bg.addColorStop(0.5, '#0a0710');
  bg.addColorStop(1, '#1a0f04');
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, w + 40, h + 40);

  // tube ribs rushing past
  for (const r of ribs) {
    ctx.strokeStyle = 'rgba(255, 180, 68, 0.16)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(r.x, h / 2, 26, h * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // rails
  for (let i = 0; i < RAILS; i++) {
    const y = railY(i);
    ctx.strokeStyle = i === player.rail ? 'rgba(255, 180, 68, 0.5)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = i === player.rail ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(0, y + PLAYER_R + 5);
    ctx.lineTo(w, y + PLAYER_R + 5);
    ctx.stroke();
  }

  glows.draw(ctx);

  // cargo
  for (const it of items) {
    const y = railY(it.rail);
    ctx.save();
    ctx.translate(it.x, y + Math.sin(time * 4 + it.x * 0.02) * 3);
    ctx.rotate(it.spin);
    ctx.shadowColor = '#ffb444';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffd9a0';
    ctx.fillRect(-it.r, -it.r, it.r * 2, it.r * 2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#8a5a12';
    ctx.lineWidth = 2;
    ctx.strokeRect(-it.r, -it.r, it.r * 2, it.r * 2);
    ctx.restore();
  }

  // interceptors
  for (const hz of hazards) {
    const y = railY(hz.rail);
    ctx.save();
    ctx.translate(hz.x, y);
    ctx.rotate(hz.spin);
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff5c8a';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rr = i % 2 === 0 ? hz.r : hz.r * 0.55;
      const x2 = Math.cos(a) * rr, y2 = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  particles.draw(ctx);

  // player pod
  const px = w * PLAYER_X;
  const py = player.drawY ?? player.y;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(player.tilt * 0.3);
  if (player.invuln > 0) ctx.globalAlpha = 0.45 + Math.sin(time * 28) * 0.3;
  ctx.shadowColor = player.flash > 0 ? '#ff5c8a' : '#22d3ee';
  ctx.shadowBlur = 24;
  ctx.fillStyle = player.flash > 0 ? '#ff5c8a' : '#eaf7ff';
  ctx.beginPath();
  ctx.moveTo(PLAYER_R + 8, 0);
  ctx.lineTo(-PLAYER_R, PLAYER_R * 0.8);
  ctx.lineTo(-PLAYER_R * 0.5, 0);
  ctx.lineTo(-PLAYER_R, -PLAYER_R * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  texts.draw(ctx);
  ctx.restore();

  // hull pips
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < hp ? '#ff5c8a' : 'rgba(255,255,255,0.16)';
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = i < hp ? 10 : 0;
    ctx.beginPath();
    ctx.arc(20 + i * 20, h - 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// ------------------------------------------------------------------- flow

function gameOver() {
  state = 'gameover';
  const score = Math.floor(scoreSys.getScore());
  const { best, isNewBest } = bestScore('hyperloop-heist', score);
  const saved = loadGameState('hyperloop-heist') || {};
  const bestDist = Math.max(Math.floor(distance), saved.bestDist || 0);
  saveGameState('hyperloop-heist', { bestDist });
  $('#final-score').textContent = score;
  $('#final-stats').innerHTML =
    `${Math.floor(distance)}m &middot; Best ${best}` + (isNewBest ? ' &middot; <b>New best!</b>' : '');
  $('#gameover-overlay').style.display = 'flex';
  sfx.lose();
}

function play() {
  reset();
  state = 'playing';
  prevUp = prevDown = prevJump = false;
  $('#overlay').style.display = 'none';
  $('#gameover-overlay').style.display = 'none';
  sfx.click();
}

function toMenu() {
  state = 'menu';
  $('#overlay').style.display = 'flex';
  $('#gameover-overlay').style.display = 'none';
  refreshStats();
}

function refreshStats() {
  const { best } = bestScore('hyperloop-heist', 0);
  const saved = loadGameState('hyperloop-heist') || {};
  $('#stat-best').textContent = best;
  $('#best').textContent = best;
  $('#stat-dist').textContent = `${saved.bestDist || 0}m`;
}

$('#btn-play').addEventListener('click', play);
$('#btn-retry').addEventListener('click', play);
$('#btn-menu').addEventListener('click', toMenu);
$('#btn-tutorial').addEventListener('click', () => {
  $('#tutorial-overlay').style.display = 'flex'; sfx.click();
});
$('#btn-tutorial-close').addEventListener('click', () => {
  $('#tutorial-overlay').style.display = 'none'; sfx.click();
});
$('#mute-btn').addEventListener('click', () => {
  $('#mute-btn').textContent = toggleMute() ? '\u{1F507}' : '\u{1F50A}';
});

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
});

reset();
state = 'menu';
refreshStats();
$('#mute-btn').textContent = isMuted() ? '\u{1F507}' : '\u{1F50A}';

createLoop((dt) => { update(dt); draw(); });
