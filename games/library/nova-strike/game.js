/**
 * NOVA STRIKE — twin-stick shooter with a magazine to manage.
 * Drones return fire, so the reload window is the real risk.
 */

import {
  fitCanvas, createKeyState, createTouchState, createLoop, bindTouchButton, $,
  clamp, rand, randInt, lerp, bestScore, sfx, isMuted, toggleMute,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect,
  createComboSystem, createScoreSystem
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 3 / 4);

const keys = createKeyState();
const pointer = createTouchState(canvas);
bindTouchButton($('#btn-reload'), keys, 'KeyR');

const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const glows = createGlowEffect();
const combo = createComboSystem();
const scoreSys = createScoreSystem();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const PLAYER_R = 12;
const MAG_SIZE = 12;

let state = 'menu';
let player, drones, bullets, foeShots, grid, time, hp, wave, spawnQueue, waveTimer;
let ammo, reloadT, fireCd;

function reset() {
  player = { x: W() / 2, y: H() / 2, vx: 0, vy: 0, facing: 0, invuln: 0, flash: 0 };
  drones = [];
  bullets = [];
  foeShots = [];
  grid = { off: 0 };
  time = 0;
  hp = 100;
  wave = 1;
  spawnQueue = 0;
  waveTimer = 0;
  ammo = MAG_SIZE;
  reloadT = 0;
  fireCd = 0;
  combo.reset();
  scoreSys.reset();
  startWave();
}

function startWave() {
  spawnQueue = 2 + wave * 2;
  waveTimer = 0;
  $('#wave-label').textContent = `WAVE ${wave}`;
  texts.add(W() / 2, H() / 2 - 40, `WAVE ${wave}`, {
    size: 32, color: '#7c5cff', life: 1.4, vy: -0.5, glow: true
  });
  if (wave > 1) sfx.levelup();
}

function spawnDrone() {
  const edge = randInt(0, 3);
  const m = 40;
  let x, y;
  if (edge === 0) { x = rand(0, W()); y = -m; }
  else if (edge === 1) { x = W() + m; y = rand(0, H()); }
  else if (edge === 2) { x = rand(0, W()); y = H() + m; }
  else { x = -m; y = rand(0, H()); }

  const heavy = wave >= 3 && Math.random() < 0.25;
  drones.push({
    x, y,
    hp: heavy ? 4 + Math.floor(wave / 2) : 2,
    r: heavy ? 18 : 13,
    speed: (heavy ? 34 : 52) + wave * 2,
    heavy,
    // Heavies hold at range and shell you; skirmishers close in.
    standoff: heavy ? rand(150, 210) : 0,
    shotCd: rand(1.4, 3),
    hit: 0,
    spin: rand(0, 6.28)
  });
}

function startReload() {
  if (reloadT > 0 || ammo === MAG_SIZE) return;
  reloadT = ammo === 0 ? 1.35 : 0.85;
  sfx.move();
}

function fire() {
  if (reloadT > 0) return;
  if (ammo <= 0) { startReload(); return; }

  ammo--;
  fireCd = 0.14;

  const dx = pointer.x - player.x;
  const dy = pointer.y - player.y;
  const d = Math.hypot(dx, dy) || 1;
  player.facing = Math.atan2(dy, dx);

  const spread = rand(-0.045, 0.045);
  const a = player.facing + spread;
  bullets.push({
    x: player.x + Math.cos(a) * PLAYER_R,
    y: player.y + Math.sin(a) * PLAYER_R,
    vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, life: 1.1
  });

  particles.add(player.x + Math.cos(a) * (PLAYER_R + 6), player.y + Math.sin(a) * (PLAYER_R + 6), {
    vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 0.16, size: 4, color: '#cbb8ff', glow: true
  });
  sfx.laser();
  shake.shake(2.2, 0.82);

  if (ammo === 0) {
    texts.add(player.x, player.y - 26, 'RELOAD', { size: 15, color: '#ff5c8a', life: 1 });
    startReload();
  }
}

function damagePlayer(amount) {
  if (player.invuln > 0) return;
  hp -= amount;
  player.invuln = 0.85;
  player.flash = 0.32;
  combo.reset();
  sfx.explosion();
  shake.shake(11, 0.86);
  particles.burst(player.x, player.y, 20, { color: '#ff5c8a', size: 5, life: 0.7, glow: true });
  if (hp <= 0) { hp = 0; gameOver(); }
}

function killDrone(d, i) {
  drones.splice(i, 1);
  combo.add();
  const mult = combo.multiplier;
  const gain = (d.heavy ? 130 : 50) * mult;
  scoreSys.add(gain);
  texts.add(d.x, d.y, `+${Math.round(gain)}`, {
    size: 17, color: mult > 1 ? '#22d3ee' : '#f5f5fa', life: 0.8
  });
  particles.burst(d.x, d.y, d.heavy ? 32 : 18, {
    color: d.heavy ? '#7c5cff' : '#9d7cff', size: 5, life: 0.8, glow: true, speed: rand(2, 5)
  });
  glows.add(d.x, d.y, d.heavy ? 68 : 44, 'rgb(124, 92, 255)', 0.4);
  sfx.pop();
  shake.shake(d.heavy ? 8 : 4, 0.85);
}

function update(dt) {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  glows.update(dt);
  combo.update(dt);
  grid.off = (grid.off + dt * 14) % 46;

  if (state !== 'playing') return;

  let ix = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  let iy = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  const len = Math.hypot(ix, iy);
  if (len > 0) { ix /= len; iy /= len; }

  player.invuln = Math.max(0, player.invuln - dt);
  player.flash = Math.max(0, player.flash - dt);
  player.vx = lerp(player.vx, ix * 235, 1 - Math.pow(0.0008, dt));
  player.vy = lerp(player.vy, iy * 235, 1 - Math.pow(0.0008, dt));
  player.x = clamp(player.x + player.vx * dt, PLAYER_R, W() - PLAYER_R);
  player.y = clamp(player.y + player.vy * dt, PLAYER_R, H() - PLAYER_R);

  if (pointer.x || pointer.y) {
    player.facing = Math.atan2(pointer.y - player.y, pointer.x - player.x);
  }

  if (keys.has('KeyR')) startReload();
  if (reloadT > 0) {
    reloadT -= dt;
    if (reloadT <= 0) {
      reloadT = 0;
      ammo = MAG_SIZE;
      sfx.shield();
      texts.add(player.x, player.y - 26, 'READY', { size: 15, color: '#35e0a1', life: 0.8 });
    }
  }

  fireCd -= dt;
  if (pointer.active && fireCd <= 0) fire();

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.x < -20 || b.x > W() + 20 || b.y < -20 || b.y > H() + 20) bullets.splice(i, 1);
  }

  for (let i = foeShots.length - 1; i >= 0; i--) {
    const s = foeShots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    s.spin += dt * 8;
    if (Math.hypot(s.x - player.x, s.y - player.y) < PLAYER_R + 5) {
      foeShots.splice(i, 1);
      damagePlayer(12);
      continue;
    }
    if (s.life <= 0 || s.x < -20 || s.x > W() + 20 || s.y < -20 || s.y > H() + 20) foeShots.splice(i, 1);
  }

  waveTimer += dt;
  if (spawnQueue > 0 && waveTimer > 0.6) {
    spawnDrone(); spawnQueue--; waveTimer = 0;
  }
  if (drones.length === 0 && spawnQueue === 0) {
    wave++; scoreSys.add(170); startWave();
  }

  for (let i = drones.length - 1; i >= 0; i--) {
    const d = drones[i];
    d.spin += dt * 2;
    d.hit = Math.max(0, d.hit - dt);
    const dx = player.x - d.x;
    const dy = player.y - d.y;
    const dist = Math.hypot(dx, dy) || 1;

    // Heavies stop at their standoff range; skirmishers keep closing.
    const wantCloser = dist > d.standoff;
    const dir = wantCloser ? 1 : -1;
    d.x += (dx / dist) * d.speed * dir * dt;
    d.y += (dy / dist) * d.speed * dir * dt;

    d.shotCd -= dt;
    if (d.shotCd <= 0 && dist < 340) {
      d.shotCd = d.heavy ? rand(1.1, 2) : rand(2, 3.4);
      const a = Math.atan2(dy, dx) + rand(-0.09, 0.09);
      foeShots.push({
        x: d.x, y: d.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, life: 3, spin: 0
      });
      sfx.tick();
    }

    if (dist < d.r + PLAYER_R) damagePlayer(d.heavy ? 16 : 9);

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.hypot(b.x - d.x, b.y - d.y) < d.r) {
        bullets.splice(j, 1);
        d.hp--;
        d.hit = 0.13;
        particles.burst(b.x, b.y, 5, { color: '#cbb8ff', size: 3, life: 0.3, glow: true });
        if (d.hp <= 0) { killDrone(d, i); break; }
      }
    }
  }

  $('#hp').textContent = Math.ceil(hp);
  $('#score').textContent = Math.floor(scoreSys.getScore());
  $('#ammo').textContent = reloadT > 0 ? `—/${MAG_SIZE}` : `${ammo}/${MAG_SIZE}`;
  $('#ammo-pill').style.color = (reloadT > 0 || ammo <= 3) ? '#ff5c8a' : '';
}

// ---------------------------------------------------------------- drawing

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const o = shake.getOffset();
  ctx.translate(o.x, o.y);

  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8);
  bg.addColorStop(0, '#120e28');
  bg.addColorStop(1, '#05050a');
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, w + 40, h + 40);

  // drifting grid floor
  ctx.strokeStyle = 'rgba(124, 92, 255, 0.13)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -46 + grid.off; x < w + 46; x += 46) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = -46 + grid.off; y < h + 46; y += 46) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();

  glows.draw(ctx);

  // drones
  for (const d of drones) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.spin);
    ctx.shadowColor = d.heavy ? '#ff5c8a' : '#7c5cff';
    ctx.shadowBlur = d.hit > 0 ? 30 : 16;
    ctx.fillStyle = d.hit > 0 ? '#ffffff' : (d.heavy ? '#6b4fd6' : '#4a3596');
    ctx.beginPath();
    const spokes = d.heavy ? 6 : 4;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const r2 = i % 2 === 0 ? d.r : d.r * 0.62;
      const px = Math.cos(a) * r2, py = Math.sin(a) * r2;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, 0, d.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // enemy shots
  for (const s of foeShots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff87ab';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  // player bullets
  for (const b of bullets) {
    ctx.save();
    ctx.strokeStyle = '#e0d4ff';
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.013, b.y - b.vy * 0.013);
    ctx.stroke();
    ctx.restore();
  }

  particles.draw(ctx);

  // player
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.invuln > 0) ctx.globalAlpha = 0.4 + Math.sin(time * 30) * 0.3;
  ctx.rotate(player.facing);
  ctx.shadowColor = player.flash > 0 ? '#ff5c8a' : '#22d3ee';
  ctx.shadowBlur = 22;
  ctx.fillStyle = player.flash > 0 ? '#ff5c8a' : '#eef6ff';
  ctx.beginPath();
  ctx.moveTo(PLAYER_R + 7, 0);
  ctx.lineTo(-PLAYER_R * 0.7, PLAYER_R * 0.8);
  ctx.lineTo(-PLAYER_R * 0.25, 0);
  ctx.lineTo(-PLAYER_R * 0.7, -PLAYER_R * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // reload ring
  if (reloadT > 0) {
    const total = ammo === 0 ? 1.35 : 0.85;
    ctx.save();
    ctx.strokeStyle = '#ffb444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffb444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R + 11, -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - reloadT / total));
    ctx.stroke();
    ctx.restore();
  }

  texts.draw(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------- flow

function gameOver() {
  state = 'gameover';
  const { best, isNewBest } = bestScore('nova-strike', Math.floor(scoreSys.getScore()));
  $('#final-score').textContent = Math.floor(scoreSys.getScore());
  $('#final-stats').innerHTML =
    `Wave ${wave} &middot; Best ${best}` + (isNewBest ? ' &middot; <b>New best!</b>' : '');
  $('#gameover-overlay').style.display = 'flex';
  sfx.lose();
}

function play() {
  reset();
  state = 'playing';
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
  const { best } = bestScore('nova-strike', 0);
  $('#stat-best').textContent = best;
  $('#stat-wave').textContent = wave || 0;
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

reset();
state = 'menu';
refreshStats();
$('#mute-btn').textContent = isMuted() ? '\u{1F507}' : '\u{1F50A}';

createLoop((dt) => { update(dt); draw(); });
