/**
 * REEF RALLY — top-down drift racing over a procedurally shaped reef circuit.
 * Lateral grip is cut while the handbrake is down, which both slides the car
 * and refills boost, so drifting corners is the fast line.
 */

import {
  fitCanvas, createKeyState, createLoop, bindTouchButton, $,
  clamp, rand, lerp, sfx, isMuted, toggleMute,
  createParticleSystem, createTextParticles, createScreenShake, createTimer
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 3 / 4);

const keys = createKeyState();
bindTouchButton($('#btn-left'), keys, 'KeyA');
bindTouchButton($('#btn-right'), keys, 'KeyD');
bindTouchButton($('#btn-gas'), keys, 'KeyW');
bindTouchButton($('#btn-boost'), keys, 'ShiftLeft');

const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const timer = createTimer();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const TRACK_HALF = 78;      // half width of the drivable surface
const TOTAL_LAPS = 3;
const BEST_LAP_KEY = 'arcyn-reef-rally-bestlap';
const WINS_KEY = 'arcyn-reef-rally-wins';

let state = 'menu';
let path = [];              // closed centreline
let cars = [];
let player = null;
let time = 0;
let raceTime = 0;
let bestLap = null;
let lapStart = 0;

// ------------------------------------------------------------------ track

function buildTrack() {
  // A closed loop built from radial noise, then smoothed so corners flow.
  const nodes = 16;
  const raw = [];
  for (let i = 0; i < nodes; i++) {
    const a = (i / nodes) * Math.PI * 2;
    const r = 620 + Math.sin(a * 2.3) * 150 + Math.cos(a * 3.1) * 110 + rand(-40, 40);
    raw.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.78 });
  }

  // Chaikin-style smoothing, twice, keeping the loop closed.
  let pts = raw;
  for (let pass = 0; pass < 3; pass++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 });
      out.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
    }
    pts = out;
  }
  path = pts;
}

function nearestNode(x, y, hint = 0) {
  // Search near the last known node first; fall back to a full scan.
  let bestI = hint, bestD = Infinity;
  const n = path.length;
  for (let k = -12; k <= 12; k++) {
    const i = ((hint + k) % n + n) % n;
    const d = (path[i].x - x) ** 2 + (path[i].y - y) ** 2;
    if (d < bestD) { bestD = d; bestI = i; }
  }
  if (bestD > (TRACK_HALF * 6) ** 2) {
    for (let i = 0; i < n; i++) {
      const d = (path[i].x - x) ** 2 + (path[i].y - y) ** 2;
      if (d < bestD) { bestD = d; bestI = i; }
    }
  }
  return { i: bestI, dist: Math.sqrt(bestD) };
}

// ------------------------------------------------------------------- cars

function makeCar(idx, isPlayer) {
  const start = path[0];
  const next = path[3];
  const ang = Math.atan2(next.y - start.y, next.x - start.x);
  const off = (idx - 1.5) * 32;
  return {
    x: start.x + Math.cos(ang + Math.PI / 2) * off,
    y: start.y + Math.sin(ang + Math.PI / 2) * off,
    a: ang,
    vx: 0, vy: 0,
    speed: 0,
    node: 0, prevNode: 0,
    lap: 1, finished: false, finishTime: 0,
    isPlayer,
    boost: 100,
    drift: 0,
    color: isPlayer ? '#ff5c8a' : ['#22d3ee', '#ffb444', '#7c5cff'][idx % 3],
    aiSkill: isPlayer ? 0 : rand(0.82, 0.97),
    aiOffset: isPlayer ? 0 : rand(-34, 34),
    respawn: 0
  };
}

function resetRace() {
  buildTrack();
  cars = [makeCar(0, true), makeCar(1, false), makeCar(2, false), makeCar(3, false)];
  player = cars[0];
  raceTime = 0;
  lapStart = 0;
  timer.reset();
  timer.start();
  particles.clear();
}

function driveCar(c, dt) {
  let steer = 0, throttle = 0, brake = false, handbrake = false, boosting = false;

  if (c.isPlayer) {
    steer = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    throttle = (keys.has('KeyW') || keys.has('ArrowUp')) ? 1 : 0;
    brake = keys.has('KeyS') || keys.has('ArrowDown');
    handbrake = keys.has('Space');
    boosting = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && c.boost > 0;
    // Cars roll forward on their own so the race never stalls.
    if (!throttle && !brake) throttle = 0.55;
  } else {
    // Aim a few nodes ahead of the current position, offset from the centre
    // line so rivals do not drive in a single file.
    const look = path[(c.node + 7) % path.length];
    const perp = Math.atan2(look.y - c.y, look.x - c.x) + Math.PI / 2;
    const tx = look.x + Math.cos(perp) * c.aiOffset;
    const ty = look.y + Math.sin(perp) * c.aiOffset;
    let diff = Math.atan2(ty - c.y, tx - c.x) - c.a;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    steer = clamp(diff * 2.2, -1, 1);
    throttle = 1;
    handbrake = Math.abs(diff) > 0.95;
    boosting = c.boost > 30 && Math.abs(diff) < 0.25;
  }

  const onTrack = nearestNode(c.x, c.y, c.node).dist < TRACK_HALF;

  const maxSpeed = (boosting ? 470 : 360) * (onTrack ? 1 : 0.55) * (c.isPlayer ? 1 : c.aiSkill);
  const accel = throttle * (boosting ? 520 : 340);

  c.speed += accel * dt;
  if (brake) c.speed -= 520 * dt;
  c.speed *= Math.pow(onTrack ? 0.55 : 0.06, dt);   // drag
  c.speed = clamp(c.speed, -110, maxSpeed);

  // Steering authority scales with speed so a parked car cannot spin.
  const grip = Math.min(1, Math.abs(c.speed) / 90);
  c.a += steer * 2.5 * dt * grip * (handbrake ? 1.5 : 1);

  // Split velocity into forward and lateral, then bleed the lateral part.
  const fx = Math.cos(c.a), fy = Math.sin(c.a);
  const lx = -fy, ly = fx;
  const fwd = c.vx * fx + c.vy * fy;
  let lat = c.vx * lx + c.vy * ly;

  const latGrip = handbrake ? 0.94 : (onTrack ? 0.10 : 0.55);
  lat *= Math.pow(latGrip, dt * 60 / 60);
  lat *= handbrake ? 1 : 0.86;

  const targetFwd = lerp(fwd, c.speed, 1 - Math.pow(0.001, dt));
  c.vx = fx * targetFwd + lx * lat;
  c.vy = fy * targetFwd + ly * lat;

  c.x += c.vx * dt;
  c.y += c.vy * dt;

  c.drift = Math.abs(lat);

  if (boosting) {
    c.boost = Math.max(0, c.boost - 34 * dt);
    if (c.isPlayer) shake.shake(2.2, 0.9);
  }
  // Drifting recharges boost — that is the risk/reward loop.
  if (c.drift > 60) c.boost = Math.min(100, c.boost + c.drift * 0.045 * dt);

  if (c.drift > 55 && Math.abs(c.speed) > 90) {
    particles.add(c.x - fx * 12, c.y - fy * 12, {
      vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6),
      life: 0.55, size: rand(3, 6),
      color: onTrack ? 'rgba(255,255,255,0.55)' : '#d8b98a',
      friction: 0.94
    });
    if (c.isPlayer && Math.random() < 0.14) sfx.tick();
  }

  // ---- lap tracking ----
  const nn = nearestNode(c.x, c.y, c.node);
  c.prevNode = c.node;
  c.node = nn.i;
  const n = path.length;
  if (c.prevNode > n * 0.75 && c.node < n * 0.25) {
    c.lap++;
    if (c.isPlayer) {
      const lapTime = raceTime - lapStart;
      lapStart = raceTime;
      if (bestLap === null || lapTime < bestLap) {
        bestLap = lapTime;
        try { localStorage.setItem(BEST_LAP_KEY, String(lapTime)); } catch {}
        texts.add(W() / 2, H() / 2 - 60, 'BEST LAP!', {
          size: 26, color: '#35e0a1', life: 1.5, glow: true
        });
      }
      if (c.lap <= TOTAL_LAPS) sfx.levelup();
    }
    if (c.lap > TOTAL_LAPS && !c.finished) {
      c.finished = true;
      c.finishTime = raceTime;
      if (c.isPlayer) finishRace();
    }
  } else if (c.prevNode < n * 0.25 && c.node > n * 0.75) {
    c.lap--;   // crossed the line backwards
  }

  if (c.isPlayer && keys.has('KeyR')) respawn(c);
  // Falling a long way off the circuit puts the car back on the line.
  if (nn.dist > TRACK_HALF * 5) respawn(c);
}

function respawn(c) {
  const p = path[c.node];
  const nx = path[(c.node + 2) % path.length];
  c.x = p.x; c.y = p.y;
  c.a = Math.atan2(nx.y - p.y, nx.x - p.x);
  c.vx = 0; c.vy = 0; c.speed = 0;
  if (c.isPlayer) { sfx.invalid(); shake.shake(6, 0.85); }
}

function placeOf(c) {
  // Rank by laps, then by how far round the lap the car is.
  const score = (k) => k.lap * path.length + k.node;
  return cars.filter(k => k !== c && (k.finished ? true : score(k) > score(c))).length + 1;
}

// ----------------------------------------------------------------- update

function update(dt) {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);

  if (state !== 'playing') return;

  raceTime += dt;
  for (const c of cars) if (!c.finished) driveCar(c, dt);

  $('#lap').textContent = `${Math.min(player.lap, TOTAL_LAPS)}/${TOTAL_LAPS}`;
  $('#time').textContent = fmt(raceTime);
  $('#boost').textContent = Math.round(player.boost);
  $('#place-label').textContent = `P${placeOf(player)}`;
}

function fmt(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const d = Math.floor((t % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${d}`;
}

// ------------------------------------------------------------------- draw

function drawCar(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.a);
  ctx.shadowColor = c.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-11, 9);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-11, -9);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(5,5,10,0.65)';
  ctx.fillRect(-2, -5, 8, 10);
  ctx.restore();
}

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);

  // water backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#04212e');
  bg.addColorStop(1, '#02101a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  const o = shake.getOffset();
  ctx.translate(w / 2 + o.x, h / 2 + o.y);
  ctx.translate(-player.x, -player.y);

  // caustic shimmer
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -6; i <= 6; i++) {
    const y = player.y + i * 120 + Math.sin(time + i) * 20;
    ctx.moveTo(player.x - w, y);
    ctx.lineTo(player.x + w, y);
  }
  ctx.stroke();

  // track surface
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0b3a4a';
  ctx.lineWidth = TRACK_HALF * 2 + 16;
  strokePath();
  ctx.strokeStyle = '#e2cfa4';
  ctx.lineWidth = TRACK_HALF * 2;
  strokePath();

  // centre dashes
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 26]);
  strokePath();
  ctx.setLineDash([]);

  // start/finish line
  const p0 = path[0], p1 = path[1];
  const a0 = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
  ctx.save();
  ctx.translate(p0.x, p0.y);
  ctx.rotate(a0);
  for (let i = -4; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1b1b22';
    ctx.fillRect(i * 20, -7, 20, 14);
  }
  ctx.restore();

  particles.draw(ctx);
  for (const c of cars) if (!c.isPlayer) drawCar(c);
  drawCar(player);
  texts.draw(ctx);
  ctx.restore();

  // boost bar
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(14, h - 26, w - 28, 8);
  ctx.fillStyle = player.boost > 30 ? '#22d3ee' : '#ff5c8a';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.fillRect(14, h - 26, (w - 28) * (player.boost / 100), 8);
  ctx.shadowBlur = 0;
}

function strokePath() {
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.closePath();
  ctx.stroke();
}

// ------------------------------------------------------------------- flow

function finishRace() {
  state = 'finished';
  timer.stop();
  const place = placeOf(player);
  const won = place === 1;
  if (won) {
    try {
      localStorage.setItem(WINS_KEY, String((Number(localStorage.getItem(WINS_KEY)) || 0) + 1));
    } catch {}
  }
  $('#result-title').textContent = won ? 'RACE WON' : 'RACE OVER';
  $('#result-title').className = won ? 'victory-title' : 'gameover-title';
  $('#final-score').textContent = `P${place}`;
  $('#final-stats').innerHTML =
    `Time ${fmt(raceTime)}` + (bestLap !== null ? ` &middot; Best lap ${fmt(bestLap)}` : '');
  $('#gameover-overlay').style.display = 'flex';
  won ? sfx.win() : sfx.lose();
}

function play() {
  resetRace();
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
  $('#stat-lap').textContent = bestLap !== null ? fmt(bestLap) : '—';
  $('#stat-wins').textContent = Number(localStorage.getItem(WINS_KEY)) || 0;
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

const storedLap = Number(localStorage.getItem(BEST_LAP_KEY));
if (storedLap > 0) bestLap = storedLap;

resetRace();
state = 'menu';
refreshStats();
$('#mute-btn').textContent = isMuted() ? '\u{1F507}' : '\u{1F50A}';

createLoop((dt) => { update(dt); draw(); });
