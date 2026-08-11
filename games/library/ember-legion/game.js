/**
 * EMBER LEGION — lane defence.
 * Spend regenerating ember to place towers on a grid; raiders march left
 * toward the core. Survive twelve waves to win.
 */

import {
  fitCanvas, createKeyState, createLoop, $,
  clamp, rand, randInt, sfx, isMuted, toggleMute, saveGameState, loadGameState,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 3 / 4);

const keys = createKeyState();
const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const glows = createGlowEffect();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const LANES = 5;
const COLS = 7;
const FINAL_WAVE = 12;

const UNITS = [
  { key: '1', name: 'Torch',   cost: 25,  rate: 1.05, dmg: 9,   range: 3.2, hp: 40, color: '#ffb444' },
  { key: '2', name: 'Bulwark', cost: 40,  rate: 0,    dmg: 0,   range: 0,   hp: 190, color: '#7c5cff' },
  { key: '3', name: 'Lancer',  cost: 65,  rate: 1.5,  dmg: 26,  range: 6.5, hp: 45, color: '#22d3ee' },
  { key: '4', name: 'Pyre',    cost: 95,  rate: 2.4,  dmg: 20,  range: 2.4, hp: 60, color: '#ff5c8a', splash: true }
];

let state = 'menu';
let towers, raiders, shots, energy, core, wave, waveQueue, spawnT, time, selected, paused;
let hoverCell = null;

function laneY(i) { const top = H() * 0.16, gap = H() * 0.145; return top + i * gap; }
function colX(i) { const left = W() * 0.2, gap = W() * 0.105; return left + i * gap; }

function reset() {
  towers = [];
  raiders = [];
  shots = [];
  energy = 100;
  core = 20;
  wave = 1;
  waveQueue = 0;
  spawnT = 1.5;
  time = 0;
  selected = 0;
  paused = false;
  startWave();
}

function startWave() {
  waveQueue = 3 + wave * 2;
  spawnT = 1.2;
  $('#wave-label').textContent = `WAVE ${wave} / ${FINAL_WAVE}`;
  texts.add(W() / 2, H() / 2 - 40, `WAVE ${wave}`, {
    size: 30, color: '#ffb444', life: 1.4, vy: -0.5, glow: true
  });
  if (wave > 1) sfx.levelup();
}

function spawnRaider() {
  const lane = randInt(0, LANES - 1);
  const brute = wave >= 4 && Math.random() < 0.28;
  raiders.push({
    lane,
    x: COLS + 0.6,
    hp: (brute ? 90 : 34) + wave * 9,
    maxHp: (brute ? 90 : 34) + wave * 9,
    speed: brute ? 0.30 : 0.46,
    dmg: brute ? 22 : 11,
    brute,
    hit: 0,
    wob: rand(0, 6.28)
  });
}

function towerAt(lane, col) { return towers.find(t => t.lane === lane && t.col === col); }

function place(lane, col) {
  const u = UNITS[selected];
  if (towerAt(lane, col)) { sfx.invalid(); return; }
  if (energy < u.cost) {
    sfx.invalid();
    texts.add(colX(col), laneY(lane) - 22, 'NO EMBER', { size: 14, color: '#ff5c8a', life: 0.9 });
    return;
  }
  energy -= u.cost;
  towers.push({ lane, col, type: selected, hp: u.hp, maxHp: u.hp, cd: 0, pulse: 0 });
  sfx.place();
  glows.add(colX(col), laneY(lane), 46, 'rgb(255, 180, 68)', 0.4);
  particles.burst(colX(col), laneY(lane), 14, { color: u.color, size: 4, life: 0.5, glow: true });
}

function update(dt) {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  glows.update(dt);

  if (state !== 'playing' || paused) return;

  energy = Math.min(220, energy + 11 * dt);

  // ---- spawning ----
  if (waveQueue > 0) {
    spawnT -= dt;
    if (spawnT <= 0) { spawnRaider(); waveQueue--; spawnT = rand(0.7, 1.5); }
  } else if (raiders.length === 0) {
    if (wave >= FINAL_WAVE) { finish(true); return; }
    wave++;
    startWave();
  }

  // ---- towers ----
  for (const t of towers) {
    const u = UNITS[t.type];
    t.pulse = Math.max(0, t.pulse - dt);
    if (!u.rate) continue;
    t.cd -= dt;
    if (t.cd <= 0) {
      // Nearest raider ahead of the tower on the same lane.
      let target = null;
      for (const r of raiders) {
        if (r.lane !== t.lane) continue;
        if (r.x < t.col) continue;
        if (r.x - t.col > u.range) continue;
        if (!target || r.x < target.x) target = r;
      }
      if (target) {
        t.cd = 1 / u.rate;
        t.pulse = 0.16;
        shots.push({
          x: colX(t.col), y: laneY(t.lane),
          tx: target, dmg: u.dmg, splash: u.splash, color: u.color, life: 1
        });
        sfx.laser();
      }
    }
  }

  // ---- shots ----
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    const tgt = s.tx;
    if (!raiders.includes(tgt)) { shots.splice(i, 1); continue; }
    const gx = colX(tgt.x), gy = laneY(tgt.lane);
    const dx = gx - s.x, dy = gy - s.y;
    const d = Math.hypot(dx, dy) || 1;
    const sp = 620 * dt;
    if (d <= sp) {
      damage(tgt, s.dmg);
      if (s.splash) {
        for (const r of raiders) {
          if (r !== tgt && Math.abs(r.lane - tgt.lane) <= 1 && Math.abs(r.x - tgt.x) < 1.2) {
            damage(r, s.dmg * 0.5);
          }
        }
        glows.add(gx, gy, 48, 'rgb(255, 92, 138)', 0.3);
      }
      particles.burst(gx, gy, 7, { color: s.color, size: 3.5, life: 0.35, glow: true });
      shots.splice(i, 1);
    } else {
      s.x += (dx / d) * sp;
      s.y += (dy / d) * sp;
    }
  }

  // ---- raiders ----
  for (let i = raiders.length - 1; i >= 0; i--) {
    const r = raiders[i];
    r.wob += dt * 5;
    r.hit = Math.max(0, r.hit - dt);

    // Stop and chew through a tower standing in the way.
    const blocking = towers.find(t => t.lane === r.lane && Math.abs(t.col - r.x) < 0.45);
    if (blocking) {
      blocking.hp -= r.dmg * dt;
      if (Math.random() < dt * 6) {
        particles.add(colX(blocking.col), laneY(blocking.lane), {
          vx: rand(-1, 1), vy: rand(-1, 1), life: 0.3, size: 3, color: '#ff5c8a', glow: true
        });
      }
      if (blocking.hp <= 0) {
        towers.splice(towers.indexOf(blocking), 1);
        sfx.explosion();
        shake.shake(7, 0.86);
        particles.burst(colX(blocking.col), laneY(blocking.lane), 20, {
          color: '#ff5c8a', size: 5, life: 0.7, glow: true
        });
      }
    } else {
      r.x -= r.speed * dt;
    }

    if (r.x <= -0.4) {
      raiders.splice(i, 1);
      core--;
      sfx.explosion();
      shake.shake(12, 0.86);
      texts.add(W() * 0.1, laneY(r.lane), '-1', { size: 20, color: '#ff5c8a', life: 0.9 });
      if (core <= 0) { finish(false); return; }
    }
  }

  $('#energy').textContent = Math.floor(energy);
  $('#core').textContent = core;
}

function damage(r, amount) {
  r.hp -= amount;
  r.hit = 0.12;
  if (r.hp <= 0) {
    const idx = raiders.indexOf(r);
    if (idx >= 0) raiders.splice(idx, 1);
    energy += r.brute ? 22 : 9;
    sfx.pop();
    particles.burst(colX(r.x), laneY(r.lane), r.brute ? 24 : 14, {
      color: '#ffb444', size: 4.5, life: 0.7, glow: true
    });
  }
}

// ------------------------------------------------------------------- draw

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const o = shake.getOffset();
  ctx.translate(o.x, o.y);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1c1006');
  bg.addColorStop(1, '#05050a');
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, w + 40, h + 40);

  // lanes
  for (let l = 0; l < LANES; l++) {
    const y = laneY(l);
    ctx.fillStyle = l % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(w * 0.14, y - h * 0.062, w * 0.82, h * 0.124);
    for (let c = 0; c < COLS; c++) {
      ctx.strokeStyle = 'rgba(255,180,68,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(colX(c) - w * 0.05, y - h * 0.06, w * 0.1, h * 0.12);
    }
  }

  // hover preview
  if (hoverCell && state === 'playing') {
    const u = UNITS[selected];
    const ok = !towerAt(hoverCell.lane, hoverCell.col) && energy >= u.cost;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = ok ? u.color : '#ff5c8a';
    ctx.lineWidth = 2;
    ctx.strokeRect(colX(hoverCell.col) - w * 0.05, laneY(hoverCell.lane) - h * 0.06, w * 0.1, h * 0.12);
    ctx.restore();
  }

  // core
  const coreGrad = ctx.createLinearGradient(0, 0, w * 0.13, 0);
  coreGrad.addColorStop(0, '#ffb444');
  coreGrad.addColorStop(1, 'rgba(255,180,68,0.05)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, h * 0.1, w * 0.13, h * 0.8);
  ctx.save();
  ctx.shadowColor = '#ffb444';
  ctx.shadowBlur = 26 + Math.sin(time * 3) * 8;
  ctx.fillStyle = '#ffd9a0';
  ctx.fillRect(w * 0.045, h * 0.42, w * 0.04, h * 0.16);
  ctx.restore();

  glows.draw(ctx);

  // towers
  for (const t of towers) {
    const u = UNITS[t.type];
    const x = colX(t.col), y = laneY(t.lane);
    const s = w * 0.036 * (1 + t.pulse * 1.2);
    ctx.save();
    ctx.shadowColor = u.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = u.color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (t.hp < t.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - s, y + s + 3, s * 2, 3);
      ctx.fillStyle = '#35e0a1';
      ctx.fillRect(x - s, y + s + 3, s * 2 * (t.hp / t.maxHp), 3);
    }
  }

  // raiders
  for (const r of raiders) {
    const x = colX(r.x), y = laneY(r.lane) + Math.sin(r.wob) * 2;
    const s = w * (r.brute ? 0.034 : 0.026);
    ctx.save();
    ctx.shadowColor = r.brute ? '#ff5c8a' : '#c2410c';
    ctx.shadowBlur = r.hit > 0 ? 26 : 12;
    ctx.fillStyle = r.hit > 0 ? '#fff' : (r.brute ? '#ff5c8a' : '#e2703a');
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - s, y - s - 7, s * 2, 3);
    ctx.fillStyle = '#ff5c8a';
    ctx.fillRect(x - s, y - s - 7, s * 2 * clamp(r.hp / r.maxHp, 0, 1), 3);
  }

  // shots
  for (const s of shots) {
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  particles.draw(ctx);
  texts.draw(ctx);
  ctx.restore();

  // unit bar
  const bh = h * 0.085;
  for (let i = 0; i < UNITS.length; i++) {
    const u = UNITS[i];
    const bw = w / UNITS.length;
    const x = i * bw;
    ctx.fillStyle = i === selected ? 'rgba(255,180,68,0.22)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 3, h - bh - 3, bw - 6, bh);
    ctx.strokeStyle = i === selected ? u.color : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = i === selected ? 2 : 1;
    ctx.strokeRect(x + 3, h - bh - 3, bw - 6, bh);
    ctx.fillStyle = energy >= u.cost ? '#f5f5fa' : '#7a7a8c';
    ctx.font = 'bold 12px Sora, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${u.key} ${u.name}`, x + bw / 2, h - bh + 16);
    ctx.fillStyle = u.color;
    ctx.fillText(`${u.cost}`, x + bw / 2, h - bh + 34);
  }
  ctx.textAlign = 'start';

  if (paused) {
    ctx.fillStyle = 'rgba(5,5,10,0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f5f5fa';
    ctx.font = 'bold 26px Sora, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — PLAN', w / 2, h / 2);
    ctx.textAlign = 'start';
  }
}

// ------------------------------------------------------------------- flow

function finish(won) {
  state = 'over';
  const saved = loadGameState('ember-legion') || {};
  saveGameState('ember-legion', {
    bestWave: Math.max(saved.bestWave || 0, wave),
    wins: (saved.wins || 0) + (won ? 1 : 0)
  });
  $('#result-title').textContent = won ? 'CORE HELD' : 'CORE BREACHED';
  $('#result-title').className = won ? 'victory-title' : 'gameover-title';
  $('#final-score').textContent = `W${wave}`;
  $('#final-stats').innerHTML = won
    ? `All ${FINAL_WAVE} waves repelled with ${core} core intact.`
    : `Fell on wave ${wave} of ${FINAL_WAVE}.`;
  $('#gameover-overlay').style.display = 'flex';
  won ? sfx.win() : sfx.lose();
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
  const saved = loadGameState('ember-legion') || {};
  $('#stat-wave').textContent = saved.bestWave || 0;
  $('#stat-wins').textContent = saved.wins || 0;
}

function cellFrom(e) {
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  let lane = -1, col = -1;
  for (let l = 0; l < LANES; l++) if (Math.abs(my - laneY(l)) < H() * 0.062) lane = l;
  for (let c = 0; c < COLS; c++) if (Math.abs(mx - colX(c)) < W() * 0.05) col = c;
  return lane >= 0 && col >= 0 ? { lane, col } : null;
}

canvas.addEventListener('pointermove', (e) => { hoverCell = cellFrom(e); });
canvas.addEventListener('pointerleave', () => { hoverCell = null; });
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  const my = e.clientY - r.top;
  // Bottom strip is the unit bar, not the battlefield.
  if (my > H() - H() * 0.085 - 3) {
    const idx = Math.floor(((e.clientX - r.left) / W()) * UNITS.length);
    if (idx >= 0 && idx < UNITS.length) { selected = idx; sfx.click(); }
    return;
  }
  const cell = cellFrom(e);
  if (cell) place(cell.lane, cell.col);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); togglePause(); }
  const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[e.code];
  if (n !== undefined) { selected = n; sfx.click(); }
});

function togglePause() {
  if (state !== 'playing') return;
  paused = !paused;
  paused ? sfx.pause() : sfx.resume();
}

$('#btn-play').addEventListener('click', play);
$('#btn-retry').addEventListener('click', play);
$('#btn-menu').addEventListener('click', toMenu);
$('#pause-btn').addEventListener('click', togglePause);
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
