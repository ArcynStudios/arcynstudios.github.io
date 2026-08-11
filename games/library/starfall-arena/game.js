/**
 * STARFALL ARENA — top-down arena survival under a meteor storm.
 * Waves of husks close in while telegraphed meteors fall on the arena.
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
bindTouchButton($('#btn-dodge'), keys, 'Space');

const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const glows = createGlowEffect();
const combo = createComboSystem();
const scoreSys = createScoreSystem();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const PLAYER_R = 13;
const HUSK_R = 14;

let state = 'menu';
let player, husks, bullets, meteors, orbs, stars;
let wave, waveTimer, spawnQueue, fireCooldown, time, hp, shakeToggle;

function reset() {
  player = {
    x: W() / 2, y: H() / 2, vx: 0, vy: 0,
    dodge: 0, dodgeCd: 0, invuln: 0, facing: 0, flash: 0
  };
  husks = [];
  bullets = [];
  meteors = [];
  orbs = [];
  stars = Array.from({ length: 70 }, () => ({
    x: rand(0, W()), y: rand(0, H()), r: rand(0.4, 1.6), tw: rand(0, Math.PI * 2)
  }));
  wave = 1;
  waveTimer = 0;
  spawnQueue = 0;
  fireCooldown = 0;
  time = 0;
  hp = 100;
  combo.reset();
  scoreSys.reset();
  startWave();
}

function startWave() {
  spawnQueue = 3 + wave * 2;
  waveTimer = 0;
  $('#wave-label').textContent = `WAVE ${wave}`;
  texts.add(W() / 2, H() / 2 - 40, `WAVE ${wave}`, {
    size: 34, color: '#ffb444', life: 1.4, vy: -0.5, glow: true
  });
  if (wave > 1) sfx.levelup();
}

function spawnHusk() {
  // Always arrive from off-screen so nothing materialises on top of the player.
  const edge = randInt(0, 3);
  const m = 40;
  let x, y;
  if (edge === 0) { x = rand(0, W()); y = -m; }
  else if (edge === 1) { x = W() + m; y = rand(0, H()); }
  else if (edge === 2) { x = rand(0, W()); y = H() + m; }
  else { x = -m; y = rand(0, H()); }

  const elite = wave >= 4 && Math.random() < 0.22;
  husks.push({
    x, y,
    hp: elite ? 5 + wave : 2 + Math.floor(wave / 2),
    speed: (elite ? 34 : 46) + wave * 2.5,
    r: elite ? HUSK_R * 1.5 : HUSK_R,
    elite,
    hit: 0,
    wobble: rand(0, Math.PI * 2)
  });
}

function spawnMeteor() {
  meteors.push({
    x: rand(60, W() - 60), y: rand(60, H() - 60),
    warn: 1.5, r: rand(38, 62), done: false
  });
}

function fire() {
  const dx = pointer.x - player.x;
  const dy = pointer.y - player.y;
  const d = Math.hypot(dx, dy) || 1;
  player.facing = Math.atan2(dy, dx);
  bullets.push({
    x: player.x + (dx / d) * PLAYER_R,
    y: player.y + (dy / d) * PLAYER_R,
    vx: (dx / d) * 560, vy: (dy / d) * 560, life: 1.1
  });
  particles.add(player.x + (dx / d) * PLAYER_R, player.y + (dy / d) * PLAYER_R, {
    vx: rand(-1, 1), vy: rand(-1, 1), life: 0.2, size: 3, color: '#ffd9a0', glow: true
  });
  sfx.laser();
  shake.shake(1.6, 0.82);
}

function damagePlayer(amount) {
  if (player.invuln > 0) return;
  hp -= amount;
  player.invuln = 1;
  player.flash = 0.35;
  combo.reset();
  sfx.explosion();
  shake.shake(11, 0.86);
  particles.burst(player.x, player.y, 22, { color: '#ff5c8a', size: 5, life: 0.7, glow: true });
  if (hp <= 0) { hp = 0; gameOver(); }
}

function killHusk(h, i) {
  husks.splice(i, 1);
  combo.add();
  const mult = combo.multiplier;
  const gain = (h.elite ? 120 : 40) * mult;
  scoreSys.add(gain);
  texts.add(h.x, h.y, `+${Math.round(gain)}`, {
    size: 17, color: mult > 1 ? '#ffb444' : '#f5f5fa', life: 0.8
  });
  particles.burst(h.x, h.y, h.elite ? 34 : 20, {
    color: h.elite ? '#ffb444' : '#ff8a5c', size: 5, life: 0.8, glow: true, speed: rand(2, 5)
  });
  glows.add(h.x, h.y, h.elite ? 70 : 44, 'rgb(255, 180, 68)', 0.4);
  sfx.pop();
  shake.shake(h.elite ? 8 : 4, 0.85);
  if (Math.random() < (h.elite ? 0.75 : 0.16)) {
    orbs.push({ x: h.x, y: h.y, r: 8, pulse: rand(0, 6.28), life: 9 });
  }
}

function update(dt) {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  glows.update(dt);
  combo.update(dt);

  if (state !== 'playing') return;

  // ---- player ----
  let ix = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  let iy = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  const len = Math.hypot(ix, iy);
  if (len > 0) { ix /= len; iy /= len; }

  const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = sprinting ? 300 : 215;

  player.dodgeCd = Math.max(0, player.dodgeCd - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.flash = Math.max(0, player.flash - dt);

  if (keys.has('Space') && player.dodgeCd <= 0 && len > 0) {
    player.dodge = 0.22;
    player.dodgeCd = 0.75;
    player.invuln = Math.max(player.invuln, 0.34);
    player.vx = ix * 780;
    player.vy = iy * 780;
    sfx.dash();
    for (let i = 0; i < 12; i++) {
      particles.add(player.x, player.y, {
        vx: rand(-2, 2), vy: rand(-2, 2), life: 0.4, size: 4,
        color: '#22d3ee', glow: true
      });
    }
  }

  if (player.dodge > 0) {
    player.dodge -= dt;
    player.vx *= 0.86;
    player.vy *= 0.86;
    particles.trail(player.x, player.y, { color: '#22d3ee', life: 0.3, size: 5, glow: true });
  } else {
    player.vx = lerp(player.vx, ix * speed, 1 - Math.pow(0.0008, dt));
    player.vy = lerp(player.vy, iy * speed, 1 - Math.pow(0.0008, dt));
  }

  player.x = clamp(player.x + player.vx * dt, PLAYER_R, W() - PLAYER_R);
  player.y = clamp(player.y + player.vy * dt, PLAYER_R, H() - PLAYER_R);

  if (pointer.x || pointer.y) {
    player.facing = Math.atan2(pointer.y - player.y, pointer.x - player.x);
  }

  // ---- shooting ----
  fireCooldown -= dt;
  if (pointer.active && fireCooldown <= 0) {
    fire();
    fireCooldown = 0.16;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -20 || b.x > W() + 20 || b.y < -20 || b.y > H() + 20) {
      bullets.splice(i, 1);
    }
  }

  // ---- waves ----
  waveTimer += dt;
  if (spawnQueue > 0 && waveTimer > 0.55) {
    spawnHusk();
    spawnQueue--;
    waveTimer = 0;
  }
  if (husks.length === 0 && spawnQueue === 0) {
    wave++;
    scoreSys.add(150);
    startWave();
  }

  if (wave >= 2 && Math.random() < dt * (0.22 + wave * 0.05)) spawnMeteor();

  // ---- husks ----
  for (let i = husks.length - 1; i >= 0; i--) {
    const h = husks[i];
    h.wobble += dt * 4;
    h.hit = Math.max(0, h.hit - dt);
    const dx = player.x - h.x;
    const dy = player.y - h.y;
    const d = Math.hypot(dx, dy) || 1;
    h.x += (dx / d) * h.speed * dt;
    h.y += (dy / d) * h.speed * dt;

    if (d < h.r + PLAYER_R) damagePlayer(h.elite ? 18 : 10);

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.hypot(b.x - h.x, b.y - h.y) < h.r) {
        bullets.splice(j, 1);
        h.hp--;
        h.hit = 0.14;
        particles.burst(b.x, b.y, 5, { color: '#ffd9a0', size: 3, life: 0.3, glow: true });
        if (h.hp <= 0) { killHusk(h, i); break; }
      }
    }
  }

  // ---- meteors ----
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.warn -= dt;
    if (m.warn <= 0 && !m.done) {
      m.done = true;
      sfx.explosion();
      shake.shake(16, 0.88);
      glows.add(m.x, m.y, m.r * 2.2, 'rgb(255, 92, 138)', 0.5);
      particles.burst(m.x, m.y, 46, {
        color: '#ff8a5c', size: 7, life: 0.9, glow: true, speed: rand(3, 8), gravity: 0.04
      });
      if (Math.hypot(player.x - m.x, player.y - m.y) < m.r) damagePlayer(26);
      for (let j = husks.length - 1; j >= 0; j--) {
        if (Math.hypot(husks[j].x - m.x, husks[j].y - m.y) < m.r) killHusk(husks[j], j);
      }
      meteors.splice(i, 1);
    }
  }

  // ---- pickups ----
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.pulse += dt * 5;
    o.life -= dt;
    if (Math.hypot(player.x - o.x, player.y - o.y) < PLAYER_R + o.r) {
      hp = Math.min(100, hp + 15);
      orbs.splice(i, 1);
      sfx.powerup();
      texts.add(o.x, o.y, '+15 HP', { size: 15, color: '#35e0a1', life: 0.9 });
      particles.burst(o.x, o.y, 16, { color: '#35e0a1', size: 4, life: 0.6, glow: true });
      continue;
    }
    if (o.life <= 0) orbs.splice(i, 1);
  }

  $('#hp').textContent = Math.ceil(hp);
  $('#score').textContent = Math.floor(scoreSys.getScore());
  const c = combo.combo;
  $('#combo-pill').style.display = c > 1 ? '' : 'none';
  $('#combo').textContent = c;
}

// ---------------------------------------------------------------- drawing

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  const o = shake.getOffset();
  ctx.translate(o.x, o.y);

  // backdrop
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#141026');
  bg.addColorStop(1, '#05050a');
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, w + 40, h + 40);

  for (const s of stars) {
    const a = 0.35 + Math.sin(time * 2 + s.tw) * 0.3;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // arena ring
  ctx.strokeStyle = 'rgba(255, 180, 68, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.44 + Math.sin(time * 1.4) * 5, 0, Math.PI * 2);
  ctx.stroke();

  glows.draw(ctx);

  // meteor telegraphs
  for (const m of meteors) {
    const t = 1 - m.warn / 1.5;
    ctx.strokeStyle = `rgba(255, 92, 138, ${0.35 + t * 0.55})`;
    ctx.lineWidth = 2 + t * 3;
    ctx.setLineDash([7, 7]);
    ctx.lineDashOffset = -time * 40;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(255, 92, 138, ${0.10 + t * 0.22})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r * t, 0, Math.PI * 2);
    ctx.fill();

    // incoming rock
    const fall = 1 - m.warn / 1.5;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ff8a5c';
    ctx.shadowColor = '#ff5c8a';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(m.x, m.y - (1 - fall) * h * 0.9, 9 + fall * 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // orbs
  for (const o of orbs) {
    const p = 1 + Math.sin(o.pulse) * 0.22;
    ctx.save();
    ctx.globalAlpha = o.life < 2 ? 0.35 + Math.sin(time * 14) * 0.3 : 1;
    ctx.fillStyle = '#35e0a1';
    ctx.shadowColor = '#35e0a1';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * p, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // husks
  for (const hk of husks) {
    const bob = Math.sin(hk.wobble) * 2;
    ctx.save();
    ctx.translate(hk.x, hk.y + bob);
    ctx.shadowColor = hk.elite ? '#ffb444' : '#ff5c8a';
    ctx.shadowBlur = hk.hit > 0 ? 30 : 16;
    ctx.fillStyle = hk.hit > 0 ? '#ffffff' : (hk.elite ? '#ffb444' : '#b0405f');
    ctx.beginPath();
    ctx.arc(0, 0, hk.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#05050a';
    const eye = hk.r * 0.26;
    ctx.beginPath();
    ctx.arc(-hk.r * 0.32, -hk.r * 0.16, eye, 0, Math.PI * 2);
    ctx.arc(hk.r * 0.32, -hk.r * 0.16, eye, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // bullets
  for (const b of bullets) {
    ctx.save();
    ctx.strokeStyle = '#ffd9a0';
    ctx.shadowColor = '#ffb444';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.014, b.y - b.vy * 0.014);
    ctx.stroke();
    ctx.restore();
  }

  particles.draw(ctx);

  // player
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.invuln > 0 && player.dodge <= 0) {
    ctx.globalAlpha = 0.4 + Math.sin(time * 30) * 0.3;
  }
  ctx.rotate(player.facing);
  ctx.shadowColor = player.flash > 0 ? '#ff5c8a' : '#22d3ee';
  ctx.shadowBlur = 22;
  ctx.fillStyle = player.flash > 0 ? '#ff5c8a' : '#e8fbff';
  ctx.beginPath();
  ctx.moveTo(PLAYER_R + 5, 0);
  ctx.lineTo(-PLAYER_R * 0.75, PLAYER_R * 0.8);
  ctx.lineTo(-PLAYER_R * 0.35, 0);
  ctx.lineTo(-PLAYER_R * 0.75, -PLAYER_R * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // dodge-ready pip
  ctx.save();
  ctx.globalAlpha = player.dodgeCd > 0 ? 0.25 : 0.8;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_R + 8, -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * (player.dodgeCd > 0 ? 1 - player.dodgeCd / 0.75 : 1));
  ctx.stroke();
  ctx.restore();

  texts.draw(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------- flow

function gameOver() {
  state = 'gameover';
  const { best, isNewBest } = bestScore('starfall-arena', Math.floor(scoreSys.getScore()));
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
  const { best } = bestScore('starfall-arena', 0);
  $('#stat-best').textContent = best;
  $('#stat-wave').textContent = wave || 0;
}

$('#btn-play').addEventListener('click', play);
$('#btn-retry').addEventListener('click', play);
$('#btn-menu').addEventListener('click', toMenu);
$('#btn-tutorial').addEventListener('click', () => {
  $('#tutorial-overlay').style.display = 'flex';
  sfx.click();
});
$('#btn-tutorial-close').addEventListener('click', () => {
  $('#tutorial-overlay').style.display = 'none';
  sfx.click();
});
$('#mute-btn').addEventListener('click', () => {
  $('#mute-btn').textContent = toggleMute() ? '\u{1F507}' : '\u{1F50A}';
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') e.preventDefault();
});

reset();
state = 'menu';
refreshStats();
$('#mute-btn').textContent = isMuted() ? '\u{1F507}' : '\u{1F50A}';

createLoop((dt) => { update(dt); draw(); });
