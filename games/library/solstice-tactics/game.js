/**
 * SOLSTICE TACTICS — turn-based grid skirmish.
 * Each unit gets one move and one strike per round; reach is computed with a
 * breadth-first flood so blocked squares are respected.
 */

import {
  fitCanvas, createLoop, $,
  clamp, rand, randInt, lerp, sfx, isMuted, toggleMute, saveGameState, loadGameState,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 1);

const particles = createParticleSystem();
const texts = createTextParticles();
const shake = createScreenShake();
const glows = createGlowEffect();

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

const SIZE = 8;

const CLASSES = {
  vanguard: { name: 'Vanguard', hp: 34, dmg: 12, move: 3, reach: 1, color: '#22d3ee' },
  ranger:   { name: 'Ranger',   hp: 22, dmg: 10, move: 4, reach: 3, color: '#35e0a1' },
  warden:   { name: 'Warden',   hp: 46, dmg: 9,  move: 2, reach: 1, color: '#7c5cff' },
  seer:     { name: 'Seer',     hp: 20, dmg: 14, move: 3, reach: 2, color: '#ff5c8a' }
};

let state = 'menu';
let blocks, units, selected, reach, strikes, turn, round, time = 0;
let busy = false;

function key(x, y) { return `${x},${y}`; }
function unitAt(x, y) { return units.find(u => u.alive && u.x === x && u.y === y); }
function isBlock(x, y) { return blocks.has(key(x, y)); }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE; }

function reset() {
  blocks = new Set();
  // Scatter cover, keeping the deployment rows clear.
  for (let i = 0; i < 9; i++) {
    const x = randInt(1, SIZE - 2);
    const y = randInt(2, SIZE - 3);
    blocks.add(key(x, y));
  }

  units = [];
  const mine = ['vanguard', 'ranger', 'warden', 'seer'];
  const theirs = ['vanguard', 'ranger', 'warden', 'seer'];
  mine.forEach((c, i) => units.push(makeUnit(c, 1 + i * 2, SIZE - 1, true)));
  theirs.forEach((c, i) => units.push(makeUnit(c, 1 + i * 2, 0, false)));

  selected = null;
  reach = new Map();
  strikes = new Set();
  turn = 'player';
  round = 1;
  busy = false;
  refreshTurnUi();
}

function makeUnit(cls, x, y, friendly) {
  const c = CLASSES[cls];
  return {
    cls, x, y, friendly,
    hp: c.hp, maxHp: c.hp,
    moved: false, struck: false, alive: true,
    ax: x, ay: y,           // animated position
    facing: friendly ? -1 : 1,
    flash: 0
  };
}

// --------------------------------------------------------------- movement

function computeReach(u) {
  // Breadth-first flood limited by the unit's move allowance.
  const c = CLASSES[u.cls];
  const seen = new Map([[key(u.x, u.y), 0]]);
  const q = [{ x: u.x, y: u.y, d: 0 }];
  while (q.length) {
    const cur = q.shift();
    if (cur.d >= c.move) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inBounds(nx, ny) || isBlock(nx, ny) || unitAt(nx, ny)) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.set(k, cur.d + 1);
      q.push({ x: nx, y: ny, d: cur.d + 1 });
    }
  }
  seen.delete(key(u.x, u.y));
  return seen;
}

function computeStrikes(u) {
  const c = CLASSES[u.cls];
  const out = new Set();
  for (const t of units) {
    if (!t.alive || t.friendly === u.friendly) continue;
    if (Math.abs(t.x - u.x) + Math.abs(t.y - u.y) <= c.reach) out.add(key(t.x, t.y));
  }
  return out;
}

function select(u) {
  selected = u;
  reach = u && !u.moved ? computeReach(u) : new Map();
  strikes = u && !u.struck ? computeStrikes(u) : new Set();
  if (u) sfx.click();
  refreshTurnUi();
}

function moveTo(u, x, y) {
  u.x = x; u.y = y;
  u.moved = true;
  sfx.move();
  particles.burst(...cellCentre(x, y), 10, {
    color: CLASSES[u.cls].color, size: 3.5, life: 0.45, glow: true
  });
  select(u);
}

function strike(attacker, target) {
  const c = CLASSES[attacker.cls];
  // Hitting a unit from behind (attacker on the side it is not facing) hurts more.
  const behind = Math.sign(target.x - attacker.x) === target.facing ||
                 Math.sign(target.y - attacker.y) === (target.friendly ? 1 : -1);
  const dmg = Math.round(c.dmg * (behind ? 1.5 : 1) * rand(0.9, 1.1));
  target.hp -= dmg;
  target.flash = 0.35;
  attacker.struck = true;
  attacker.facing = Math.sign(target.x - attacker.x) || attacker.facing;

  const [cx, cy] = cellCentre(target.x, target.y);
  texts.add(cx, cy - 10, `${dmg}${behind ? '!' : ''}`, {
    size: behind ? 22 : 18, color: behind ? '#ffb444' : '#fff', life: 0.9, glow: behind
  });
  particles.burst(cx, cy, 16, { color: '#ff5c8a', size: 4, life: 0.6, glow: true });
  glows.add(cx, cy, 40, 'rgb(255, 92, 138)', 0.35);
  shake.shake(behind ? 8 : 5, 0.86);
  sfx.explosion();

  if (target.hp <= 0) {
    target.alive = false;
    sfx.pop();
    particles.burst(cx, cy, 26, {
      color: CLASSES[target.cls].color, size: 5, life: 0.8, glow: true
    });
  }
  select(attacker);
  checkEnd();
}

function checkEnd() {
  const mine = units.filter(u => u.alive && u.friendly);
  const foes = units.filter(u => u.alive && !u.friendly);
  if (!foes.length) finish(true);
  else if (!mine.length) finish(false);
}

// -------------------------------------------------------------------- AI

function endTurn() {
  if (state !== 'playing' || busy) return;
  if (turn === 'player') {
    turn = 'enemy';
    select(null);
    refreshTurnUi();
    busy = true;
    setTimeout(runEnemyTurn, 420);
  }
}

function runEnemyTurn() {
  const foes = units.filter(u => u.alive && !u.friendly);
  let i = 0;

  const step = () => {
    if (state !== 'playing') { busy = false; return; }
    if (i >= foes.length) {
      for (const u of units) { u.moved = false; u.struck = false; }
      turn = 'player';
      round++;
      busy = false;
      refreshTurnUi();
      return;
    }
    const u = foes[i++];
    if (!u.alive) { step(); return; }

    const targets = units.filter(t => t.alive && t.friendly);
    if (!targets.length) { busy = false; return; }

    // Close on the weakest reachable target, then strike if able.
    let best = targets[0];
    for (const t of targets) {
      const d = Math.abs(t.x - u.x) + Math.abs(t.y - u.y);
      const bd = Math.abs(best.x - u.x) + Math.abs(best.y - u.y);
      if (t.hp < best.hp || (t.hp === best.hp && d < bd)) best = t;
    }

    const c = CLASSES[u.cls];
    if (Math.abs(best.x - u.x) + Math.abs(best.y - u.y) > c.reach) {
      const cells = computeReach(u);
      let pick = null, pickD = Infinity;
      for (const k of cells.keys()) {
        const [x, y] = k.split(',').map(Number);
        const d = Math.abs(best.x - x) + Math.abs(best.y - y);
        if (d < pickD) { pickD = d; pick = { x, y }; }
      }
      if (pick) { u.x = pick.x; u.y = pick.y; u.moved = true; }
    }

    if (Math.abs(best.x - u.x) + Math.abs(best.y - u.y) <= c.reach) {
      setTimeout(() => { if (u.alive && best.alive) strike(u, best); setTimeout(step, 330); }, 260);
    } else {
      setTimeout(step, 300);
    }
  };
  step();
}

// ------------------------------------------------------------------ draw

function layout() {
  const cell = Math.floor(Math.min(W(), H()) * 0.9 / SIZE);
  return { cell, ox: (W() - cell * SIZE) / 2, oy: (H() - cell * SIZE) / 2 };
}

function cellCentre(x, y) {
  const { ox, oy, cell } = layout();
  return [ox + x * cell + cell / 2, oy + y * cell + cell / 2];
}

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  const o = shake.getOffset();
  ctx.translate(o.x, o.y);

  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bg.addColorStop(0, '#08222b');
  bg.addColorStop(1, '#05050a');
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, w + 40, h + 40);

  const { ox, oy, cell } = layout();

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const px = ox + x * cell, py = oy + y * cell;
      ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)';
      ctx.fillRect(px, py, cell, cell);

      if (isBlock(x, y)) {
        ctx.fillStyle = '#123642';
        ctx.fillRect(px + 3, py + 3, cell - 6, cell - 6);
        ctx.strokeStyle = 'rgba(34,211,238,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3.5, py + 3.5, cell - 7, cell - 7);
      }

      const k = key(x, y);
      if (reach.has(k)) {
        ctx.fillStyle = `rgba(34,211,238,${0.16 + Math.sin(time * 3 + x + y) * 0.05})`;
        ctx.fillRect(px, py, cell, cell);
      }
      if (strikes.has(k)) {
        ctx.strokeStyle = '#ff5c8a';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(px + 2, py + 2, cell - 4, cell - 4);
      }
    }
  }

  glows.draw(ctx);

  for (const u of units) {
    if (!u.alive) continue;
    u.ax = lerp(u.ax, u.x, 0.28);
    u.ay = lerp(u.ay, u.y, 0.28);
    u.flash = Math.max(0, u.flash - 0.02);
    const px = ox + u.ax * cell + cell / 2;
    const py = oy + u.ay * cell + cell / 2;
    const c = CLASSES[u.cls];
    const r = cell * 0.3;

    if (u === selected) {
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -time * 22;
      ctx.beginPath();
      ctx.arc(px, py, r + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = u.friendly ? c.color : '#ffb444';
    ctx.shadowBlur = u.flash > 0 ? 30 : 16;
    ctx.fillStyle = u.flash > 0 ? '#fff' : (u.friendly ? c.color : '#e2913a');
    ctx.beginPath();
    if (u.friendly) {
      ctx.arc(px, py, r, 0, Math.PI * 2);
    } else {
      ctx.moveTo(px, py - r);
      ctx.lineTo(px + r, py + r * 0.8);
      ctx.lineTo(px - r, py + r * 0.8);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // spent marker
    if (u.friendly && u.moved && u.struck) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(px - r, py + r + 3, r * 2, 4);
    ctx.fillStyle = u.friendly ? '#35e0a1' : '#ff5c8a';
    ctx.fillRect(px - r, py + r + 3, r * 2 * clamp(u.hp / u.maxHp, 0, 1), 4);
  }

  particles.draw(ctx);
  texts.draw(ctx);
  ctx.restore();
}

// ------------------------------------------------------------------ flow

function refreshTurnUi() {
  $('#turn-label').textContent = turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN';
  $('#round').textContent = round;
  $('#hint-label').textContent = turn !== 'player'
    ? 'ENEMY MOVING…'
    : selected
      ? `${CLASSES[selected.cls].name.toUpperCase()} — ${selected.moved ? 'MOVED' : 'MOVE'} / ${selected.struck ? 'STRUCK' : 'STRIKE'}`
      : 'SELECT A UNIT';
}

function finish(won) {
  state = 'over';
  const saved = loadGameState('solstice-tactics') || {};
  saveGameState('solstice-tactics', {
    wins: (saved.wins || 0) + (won ? 1 : 0),
    bestRound: won ? Math.min(saved.bestRound || 99, round) : (saved.bestRound || null)
  });
  $('#result-title').textContent = won ? 'FIELD WON' : 'WARBAND LOST';
  $('#result-title').className = won ? 'victory-title' : 'gameover-title';
  $('#final-score').textContent = `R${round}`;
  $('#final-stats').innerHTML = won
    ? `Cleared in ${round} round${round === 1 ? '' : 's'}.`
    : 'Your warband was wiped out.';
  setTimeout(() => { $('#gameover-overlay').style.display = 'flex'; }, 600);
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
  const saved = loadGameState('solstice-tactics') || {};
  $('#stat-wins').textContent = saved.wins || 0;
  $('#stat-round').textContent = saved.bestRound || '—';
}

canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'playing' || turn !== 'player' || busy) return;
  const r = canvas.getBoundingClientRect();
  const { ox, oy, cell } = layout();
  const x = Math.floor((e.clientX - r.left - ox) / cell);
  const y = Math.floor((e.clientY - r.top - oy) / cell);
  if (!inBounds(x, y)) return;

  const target = unitAt(x, y);

  if (selected && strikes.has(key(x, y)) && target && !target.friendly) {
    strike(selected, target);
    return;
  }
  if (selected && reach.has(key(x, y)) && !target) {
    moveTo(selected, x, y);
    return;
  }
  if (target && target.friendly) { select(target); return; }
  select(null);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); endTurn(); }
  const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[e.code];
  if (n !== undefined && state === 'playing' && turn === 'player') {
    const mine = units.filter(u => u.alive && u.friendly);
    if (mine[n]) select(mine[n]);
  }
});

$('#btn-play').addEventListener('click', play);
$('#btn-retry').addEventListener('click', play);
$('#btn-menu').addEventListener('click', toMenu);
$('#end-btn').addEventListener('click', endTurn);
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

createLoop((dt) => {
  time += dt;
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  glows.update(dt);
  draw();
});
