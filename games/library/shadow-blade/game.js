/**
 * SHADOW BLADE — close-quarters arena duelling.
 * A single slash arc, a dash with i-frames, and wraiths that telegraph a
 * lunge you can parry for double value.
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
bindTouchButton($('#btn-dash'), keys, 'Space');

const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const glows = createGlowEffect();
const combo = createComboSystem();
const scoreSys = createScoreSystem();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const PLAYER_R = 12;
const SLASH_RANGE = 74;
const SLASH_ARC = Math.PI * 0.85;

let state = 'menu';
let player, wraiths, slashes, motes, time, hp, wave, spawnQueue, waveTimer;
let wasDown = false;

function reset() {
  player = {
    x: W() / 2, y: H() / 2, vx: 0, vy: 0,
    facing: 0, dash: 0, dashCd: 0, invuln: 0, flash: 0, atkCd: 0
  };
  wraiths = [];
  slashes = [];
  motes = Array.from({ length: 46 }, () => ({
    x: rand(0, W()), y: rand(0, H()), r: rand(0.6, 2.2),
    vy: rand(-6, -18), tw: rand(0, 6.28)
  }));
  time = 0;
  hp = 100;
  wave = 1;
  spawnQueue = 0;
  waveTimer = 0;
  combo.reset();
  scoreSys.reset();
  startWave();
}

function startWave() {
  spawnQueue = 3 + wave * 2;
  waveTimer = 0;
  $('#wave-label').textContent = `WAVE ${wave}`;
  texts.add(W() / 2, H() / 2 - 40, `WAVE ${wave}`, {
    size: 32, color: '#7c5cff', life: 1.4, vy: -0.5, glow: true
  });
  if (wave > 1) sfx.levelup();
}

function spawnWraith() {
  const edge = randInt(0, 3);
  const m = 38;
  let x, y;
  if (edge === 0) { x = rand(0, W()); y = -m; }
  else if (edge === 1) { x = W() + m; y = rand(0, H()); }
  else if (edge === 2) { x = rand(0, W()); y = H() + m; }
  else { x = -m; y = rand(0, H()); }

  const brute = wave >= 4 && Math.random() < 0.2;
  wraiths.push({
    x, y,
    hp: brute ? 3 : 1,
    r: brute ? 19 : 13,
    speed: (brute ? 40 : 58) + wave * 2,
    brute,
    windup: 0,       // >0 while telegraphing a lunge (parry window)
    lunge: 0,
    cd: rand(1.2, 2.6),
    hit: 0,
    wob: rand(0, 6.28)
  });
}

function slash() {
  player.atkCd = 0.28;
  const a = player.facing;
  slashes.push({ x: player.x, y: player.y, a, life: 0.22, max: 0.22 });
  sfx.dash();
  shake.shake(3.5, 0.85);

  for (let i = 0; i < 14; i++) {
    const off = rand(-SLASH_ARC / 2, SLASH_ARC / 2);
    const d = rand(PLAYER_R, SLASH_RANGE);
    particles.add(player.x + Math.cos(a + off) * d, player.y + Math.sin(a + off) * d, {
      vx: Math.cos(a + off) * 2, vy: Math.sin(a + off) * 2,
      life: 0.28, size: 3.5, color: '#c9b8ff', glow: true
    });
  }

  let struck = 0;
  for (let i = wraiths.length - 1; i >= 0; i--) {
    const wr = wraiths[i];
    const dx = wr.x - player.x;
    const dy = wr.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > SLASH_RANGE + wr.r) continue;
    // Angular difference, wrapped into -PI..PI.
    let diff = Math.atan2(dy, dx) - a;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) > SLASH_ARC / 2) continue;

    const parry = wr.windup > 0;
    wr.hp -= parry ? 3 : 1;
    wr.hit = 0.14;
    struck++;
    if (parry) {
      texts.add(wr.x, wr.y - 16, 'PARRY!', { size: 19, color: '#22d3ee', life: 1, glow: true });
      sfx.shield();
      shake.shake(9, 0.86);
      glows.add(wr.x, wr.y, 60, 'rgb(34, 211, 238)', 0.4);
    }
    if (wr.hp <= 0) killWraith(wr, i, parry);
  }
  if (struck === 0) sfx.tick();
}

function killWraith(wr, i, parry) {
  wraiths.splice(i, 1);
  combo.add();
  const mult = combo.multiplier;
  const gain = (wr.brute ? 110 : 45) * mult * (parry ? 2 : 1);
  scoreSys.add(gain);
  texts.add(wr.x, wr.y, `+${Math.round(gain)}`, {
    size: 17, color: parry ? '#22d3ee' : '#c9b8ff', life: 0.8
  });
  particles.burst(wr.x, wr.y, wr.brute ? 30 : 18, {
    color: wr.brute ? '#7c5cff' : '#9d7cff', size: 5, life: 0.8, glow: true, speed: rand(2, 5)
  });
  glows.add(wr.x, wr.y, wr.brute ? 66 : 42, 'rgb(124, 92, 255)', 0.4);
  sfx.pop();
  shake.shake(wr.brute ? 8 : 4, 0.85);
}

function damagePlayer(amount) {
  if (player.invuln > 0) return;
  hp -= amount;
  player.invuln = 0.9;
  player.flash = 0.35;
  combo.reset();
  sfx.explosion();
  shake.shake(12, 0.86);
  particles.burst(player.x, player.y, 22, { color: '#ff5c8a', size: 5, life: 0.7, glow: true });
  if (hp <= 0) { hp = 0; gameOver(); }
}

function update(dt) {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  glows.update(dt);
  combo.update(dt);

  for (const m of motes) {
    m.y += m.vy * dt;
    m.tw += dt * 2;
    if (m.y < -6) { m.y = H() + 6; m.x = rand(0, W()); }
  }

  for (let i = slashes.length - 1; i >= 0; i--) {
    slashes[i].life -= dt;
    if (slashes[i].life <= 0) slashes.splice(i, 1);
  }

  if (state !== 'playing') return;

  let ix = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  let iy = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  const len = Math.hypot(ix, iy);
  if (len > 0) { ix /= len; iy /= len; }

  const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = sprinting ? 290 : 205;

  player.dashCd = Math.max(0, player.dashCd - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.flash = Math.max(0, player.flash - dt);
  player.atkCd = Math.max(0, player.atkCd - dt);

  if (keys.has('Space') && player.dashCd <= 0 && len > 0) {
    player.dash = 0.2;
    player.dashCd = 0.7;
    player.invuln = Math.max(player.invuln, 0.32);
    player.vx = ix * 800;
    player.vy = iy * 800;
    sfx.dash();
  }

  if (player.dash > 0) {
    player.dash -= dt;
    player.vx *= 0.87;
    player.vy *= 0.87;
    particles.trail(player.x, player.y, { color: '#7c5cff', life: 0.32, size: 6, glow: true });
  } else {
    player.vx = lerp(player.vx, ix * speed, 1 - Math.pow(0.0008, dt));
    player.vy = lerp(player.vy, iy * speed, 1 - Math.pow(0.0008, dt));
  }

  player.x = clamp(player.x + player.vx * dt, PLAYER_R, W() - PLAYER_R);
  player.y = clamp(player.y + player.vy * dt, PLAYER_R, H() - PLAYER_R);

  if (pointer.x || pointer.y) {
    player.facing = Math.atan2(pointer.y - player.y, pointer.x - player.x);
  }

  // Slash on the press edge so holding does not machine-gun the blade.
  if (pointer.active && !wasDown && player.atkCd <= 0) slash();
  wasDown = pointer.active;

  waveTimer += dt;
  if (spawnQueue > 0 && waveTimer > 0.5) {
    spawnWraith();
    spawnQueue--;
    waveTimer = 0;
  }
  if (wraiths.length === 0 && spawnQueue === 0) {
    wave++;
    scoreSys.add(160);
    startWave();
  }

  for (const wr of wraiths) {
    wr.wob += dt * 4;
    wr.hit = Math.max(0, wr.hit - dt);
    const dx = player.x - wr.x;
    const dy = player.y - wr.y;
    const d = Math.hypot(dx, dy) || 1;

    if (wr.lunge > 0) {
      wr.lunge -= dt;
      wr.x += wr.lx * 430 * dt;
      wr.y += wr.ly * 430 * dt;
      particles.trail(wr.x, wr.y, { color: '#ff5c8a', life: 0.22, size: 4, glow: true });
    } else if (wr.windup > 0) {
      wr.windup -= dt;
      if (wr.windup <= 0) {
        wr.lunge = 0.3;
        wr.lx = dx / d;
        wr.ly = dy / d;
        sfx.laser();
      }
    } else {
      wr.cd -= dt;
      wr.x += (dx / d) * wr.speed * dt;
      wr.y += (dy / d) * wr.speed * dt;
      if (wr.cd <= 0 && d < 190) {
        wr.windup = 0.55;
        wr.cd = rand(1.6, 3);
      }
    }

    wr.x = clamp(wr.x, -60, W() + 60);
    wr.y = clamp(wr.y, -60, H() + 60);

    if (Math.hypot(player.x - wr.x, player.y - wr.y) < wr.r + PLAYER_R) {
      damagePlayer(wr.brute ? 17 : 10);
    }
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

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0d0820');
  bg.addColorStop(1, '#05050a');
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, w + 40, h + 40);

  for (const m of motes) {
    ctx.globalAlpha = 0.2 + Math.sin(m.tw) * 0.18;
    ctx.fillStyle = '#9d7cff';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  glows.draw(ctx);

  // wraiths
  for (const wr of wraiths) {
    const bob = Math.sin(wr.wob) * 2.5;
    ctx.save();
    ctx.translate(wr.x, wr.y + bob);

    if (wr.windup > 0) {
      // Parry window — ring tightens as the lunge approaches.
      const t = 1 - wr.windup / 0.55;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, wr.r + 16 - t * 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowColor = wr.windup > 0 ? '#ffffff' : '#7c5cff';
    ctx.shadowBlur = wr.hit > 0 ? 32 : 18;
    ctx.fillStyle = wr.hit > 0 ? '#ffffff'
      : wr.windup > 0 ? '#e6e0ff'
      : (wr.brute ? '#6b4fd6' : '#3d2b78');
    ctx.beginPath();
    ctx.moveTo(0, -wr.r);
    ctx.quadraticCurveTo(wr.r, -wr.r * 0.2, wr.r * 0.6, wr.r);
    ctx.quadraticCurveTo(0, wr.r * 0.55, -wr.r * 0.6, wr.r);
    ctx.quadraticCurveTo(-wr.r, -wr.r * 0.2, 0, -wr.r);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = wr.windup > 0 ? '#ff5c8a' : '#22d3ee';
    ctx.beginPath();
    ctx.arc(-wr.r * 0.3, -wr.r * 0.25, wr.r * 0.17, 0, Math.PI * 2);
    ctx.arc(wr.r * 0.3, -wr.r * 0.25, wr.r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  particles.draw(ctx);

  // slash arcs
  for (const s of slashes) {
    const t = s.life / s.max;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    ctx.globalAlpha = t;
    ctx.strokeStyle = '#e8e2ff';
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 26;
    ctx.lineWidth = 7 * t + 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, SLASH_RANGE * (1.05 - t * 0.25), -SLASH_ARC / 2, SLASH_ARC / 2);
    ctx.stroke();
    ctx.restore();
  }

  // player
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.invuln > 0 && player.dash <= 0) {
    ctx.globalAlpha = 0.4 + Math.sin(time * 30) * 0.3;
  }
  ctx.rotate(player.facing);
  ctx.shadowColor = player.flash > 0 ? '#ff5c8a' : '#7c5cff';
  ctx.shadowBlur = 24;
  ctx.fillStyle = player.flash > 0 ? '#ff5c8a' : '#f0ecff';
  ctx.beginPath();
  ctx.moveTo(PLAYER_R + 6, 0);
  ctx.lineTo(-PLAYER_R * 0.7, PLAYER_R * 0.85);
  ctx.lineTo(-PLAYER_R * 0.3, 0);
  ctx.lineTo(-PLAYER_R * 0.7, -PLAYER_R * 0.85);
  ctx.closePath();
  ctx.fill();

  // blade
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(PLAYER_R * 0.4, -PLAYER_R * 0.5);
  ctx.lineTo(PLAYER_R + 20, -PLAYER_R * 0.9);
  ctx.stroke();
  ctx.restore();

  // dash pip
  ctx.save();
  ctx.globalAlpha = player.dashCd > 0 ? 0.25 : 0.8;
  ctx.strokeStyle = '#7c5cff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_R + 9, -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * (player.dashCd > 0 ? 1 - player.dashCd / 0.7 : 1));
  ctx.stroke();
  ctx.restore();

  texts.draw(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------- flow

function gameOver() {
  state = 'gameover';
  const { best, isNewBest } = bestScore('shadow-blade', Math.floor(scoreSys.getScore()));
  $('#final-score').textContent = Math.floor(scoreSys.getScore());
  $('#final-stats').innerHTML =
    `Wave ${wave} &middot; Best ${best}` + (isNewBest ? ' &middot; <b>New best!</b>' : '');
  $('#gameover-overlay').style.display = 'flex';
  sfx.lose();
}

function play() {
  reset();
  state = 'playing';
  wasDown = false;
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
  const { best } = bestScore('shadow-blade', 0);
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
