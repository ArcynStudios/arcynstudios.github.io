/**
 * VOID RUNNER — Cyberpunk Neon Endless Runner
 * Premium quality: neon reflections, motion blur, glow, particles, rain, lightning
 */

import {
  fitCanvas, createKeyState, createTouchState, createLoop, bindTouchButton, $,
  overlap, clamp, rand, randInt, lerp, bestScore, saveGameState, loadGameState,
  sfx, playMusic, stopMusic, isMuted, toggleMute, setMasterVolume,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect,
  createTrailEffect, createRainEffect, createLightningEffect, createUI,
  createBackgroundLayers, createComboSystem, createScoreSystem, createTimer,
  createAchievementSystem, createSettings, themes, lerpColor
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 9 / 16);

const keys = createKeyState();
const touch = createTouchState(canvas);
bindTouchButton($('#btn-left'), keys, 'ArrowLeft');
bindTouchButton($('#btn-right'), keys, 'ArrowRight');
bindTouchButton($('#btn-jump'), keys, 'Space');
bindTouchButton($('#btn-slide'), keys, 'KeyS');

const theme = themes.cyberpunk;

const particles = createParticleSystem();
const textParts = createTextParticles();
const screenShake = createScreenShake();
const glows = createGlowEffect();
const trail = createTrailEffect();
const rain = createRainEffect(canvas, { count: 150, color: 'rgba(0,255,255,0.3)', speed: 400 });
const lightning = createLightningEffect(canvas);
const ui = createUI();
const combo = createComboSystem();
const scoreSys = createScoreSystem();
const timer = createTimer();
const achievements = createAchievementSystem('void-runner');
const settings = createSettings();

const LANES = 3;
const LANE_WIDTH = 1 / LANES;
const PLAYER_SIZE = 0.08;
const GROUND_Y = 0.85;

let state = 'menu';
let prevState = 'menu';
let player = null;
let obstacles = [];
let crystals = [];
let bgElements = [];
let distance = 0;
let speed = 1;
let baseSpeed = 0.25;
let spawnTimer = 0;
let crystalTimer = 0;
let speedIncreaseTimer = 0;
let crystalsCollected = 0;
let totalCrystals = 0;
let runs = 0;
let bestComboEver = 0;
let totalDistance = 0;
let totalTime = 0;
let currentRunStart = 0;
let isChallenge = false;
let challengeMods = [];
let challengeSeed = 0;
let tutorialStep = 0;

const OBSTACLE_TYPES = [
  { type: 'laser', height: 0.02, width: 1, gap: false, color: '#ff0066', glow: '#ff0066', damage: true },
  { type: 'barrier', height: 0.25, width: 0.3, gap: false, color: '#7c5cff', glow: '#7c5cff', slideable: true },
  { type: 'gap', height: 0, width: 0.4, gap: true, color: '#000', glow: null },
  { type: 'double-laser', height: 0.02, width: 1, gap: false, color: '#00ffff', glow: '#00ffff', damage: true, count: 2 },
  { type: 'moving-barrier', height: 0.2, width: 0.25, gap: false, color: '#ff5c8a', glow: '#ff5c8a', slideable: true, moving: true },
  { type: 'crystal-wall', height: 0.3, width: 0.2, gap: false, color: '#ffff00', glow: '#ffff00', crystals: true }
];

function getLaneX(lane, w) {
  return (w / LANES) * (lane + 0.5);
}

function resetGame() {
  player = {
    lane: 1,
    targetLane: 1,
    x: 0,
    y: 0,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    invincible: 0,
    trail: [],
    color: '#00ffff',
    glowColor: '#00ffff',
    pulse: 0
  };
  obstacles = [];
  crystals = [];
  bgElements = [];
  distance = 0;
  speed = 1;
  baseSpeed = isChallenge ? 0.3 : 0.25;
  spawnTimer = 0;
  crystalTimer = 0;
  speedIncreaseTimer = 0;
  crystalsCollected = 0;
  combo.reset();
  scoreSys.reset();
  timer.reset();
  currentRunStart = performance.now();
  particles.clear();
  textParts.clear();
  glows.clear();
  trail.clear();
  screenShake.shake(0);
  runs++;
  generateBackground();
}

function generateBackground() {
  for (let i = 0; i < 20; i++) {
    bgElements.push({
      x: rand(0, 1),
      y: rand(0, 0.6),
      size: rand(0.02, 0.08),
      type: randInt(0, 3),
      speed: rand(0.1, 0.5),
      hue: rand(260, 300),
      alpha: rand(0.3, 0.8)
    });
  }
  for (let i = 0; i < 50; i++) {
    bgElements.push({
      x: rand(0, 1),
      y: rand(0, 1),
      size: rand(0.005, 0.02),
      type: 4,
      speed: rand(0.05, 0.3),
      hue: rand(180, 200),
      alpha: rand(0.2, 0.6)
    });
  }
}

function spawnObstacle() {
  const type = OBSTACLE_TYPES[randInt(0, OBSTACLE_TYPES.length - 1)];
  const lane = randInt(0, LANES - 1);
  
  if (type.type === 'gap') {
    const gapLane = randInt(0, LANES - 1);
    for (let i = 0; i < LANES; i++) {
      if (i !== gapLane) {
        obstacles.push({
          type: 'barrier',
          lane: i,
          y: -0.2,
          w: LANE_WIDTH * 0.9,
          h: 0.25,
          color: theme.accent,
          glow: theme.accent,
          slideable: true,
          passed: false
        });
      }
    }
    obstacles.push({
      type: 'gap',
      lane: gapLane,
      y: -0.2,
      w: LANE_WIDTH,
      h: 0,
      color: '#000',
      glow: null,
      passed: false
    });
    return;
  }
  
  if (type.type === 'double-laser') {
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, 2);
    for (const l of lanes) {
      obstacles.push({
        type: 'laser',
        lane: l,
        y: -0.1,
        w: 1,
        h: 0.02,
        color: type.color,
        glow: type.glow,
        damage: true,
        passed: false
      });
    }
    return;
  }
  
  obstacles.push({
    type: type.type,
    lane,
    y: -0.15,
    w: type.width || LANE_WIDTH * 0.8,
    h: type.height || 0.2,
    color: type.color,
    glow: type.glow,
    slideable: type.slideable || false,
    moving: type.moving || false,
    moveDir: rand() > 0.5 ? 1 : -1,
    moveSpeed: rand(0.5, 1.5),
    crystals: type.crystals || false,
    passed: false
  });
}

function spawnCrystal() {
  const lane = randInt(0, LANES - 1);
  crystals.push({
    lane,
    y: -0.1,
    w: 0.04,
    h: 0.04,
    rotation: 0,
    pulse: rand(0, Math.PI * 2),
    collected: false,
    value: randInt(1, 3)
  });
}

function updateBackground(dt, w, h) {
  for (const el of bgElements) {
    el.y += baseSpeed * el.speed * dt * speed;
    if (el.type === 4) el.y += baseSpeed * 0.1 * dt * speed;
    if (el.y > 1.2) {
      el.y = -0.2;
      el.x = rand(0, 1);
    }
  }
}

function updatePlayer(dt, w, h) {
  const targetX = getLaneX(player.targetLane, w) - (player.w * w) / 2;
  player.x += (targetX - player.x) * Math.min(dt * 15, 1);
  player.y = h * GROUND_Y - player.h * h;
  
  player.pulse += dt * 5;
  
  if ((keys.has('ArrowLeft') || keys.has('KeyA') || touch.active && touch.x < w / 3) && !player._movedLeft) {
    player.targetLane = Math.max(0, player.targetLane - 1);
    player._movedLeft = true;
    sfx.move();
  } else if (!keys.has('ArrowLeft') && !keys.has('KeyA') && (!touch.active || touch.x >= w / 3)) {
    player._movedLeft = false;
  }
  
  if ((keys.has('ArrowRight') || keys.has('KeyD') || touch.active && touch.x > w * 2 / 3) && !player._movedRight) {
    player.targetLane = Math.min(LANES - 1, player.targetLane + 1);
    player._movedRight = true;
    sfx.move();
  } else if (!keys.has('ArrowRight') && !keys.has('KeyD') && (!touch.active || touch.x <= w * 2 / 3)) {
    player._movedRight = false;
  }
  
  const jumpPressed = keys.has('Space') || keys.has('KeyW') || keys.has('ArrowUp') || (touch.active && touch.y < h / 2 && touch.x > w / 3 && touch.x < w * 2 / 3);
  if (jumpPressed && !player.jumping && !player.sliding) {
    player.vy = -0.65;
    player.jumping = true;
    sfx.jump();
    particles.burst(player.x + player.w * w / 2, player.y + player.h * h, 12, {
      color: theme.neon1, size: 4, life: 0.5, vx: rand(-2, 2), vy: rand(-3, -1), glow: true
    });
  }
  
  const slidePressed = keys.has('KeyS') || keys.has('ArrowDown') || (touch.active && touch.y > h / 2 && touch.x > w / 3 && touch.x < w * 2 / 3);
  if (slidePressed && !player.sliding && !player.jumping) {
    player.sliding = true;
    player.slideTimer = 0.8;
    player.h = PLAYER_SIZE * 0.5;
    sfx.dash();
    particles.burst(player.x + player.w * w / 2, player.y + player.h * h, 15, {
      color: theme.accent2, size: 3, life: 0.4, vx: rand(-3, 3), vy: rand(-1, 1), glow: true
    });
  }
  
  if (player.sliding) {
    player.slideTimer -= dt;
    if (player.slideTimer <= 0) {
      player.sliding = false;
      player.h = PLAYER_SIZE;
    }
  }
  
  if (player.jumping) {
    player.vy += dt * 1.8;
    player.y += player.vy * h * dt * 60;
    if (player.y >= h * GROUND_Y - player.h * h) {
      player.y = h * GROUND_Y - player.h * h;
      player.vy = 0;
      player.jumping = false;
      particles.burst(player.x + player.w * w / 2, player.y + player.h * h, 8, {
        color: theme.neon1, size: 3, life: 0.3, vx: rand(-2, 2), vy: rand(-1, 1), glow: true
      });
      screenShake.shake(3, 0.8);
    }
  }
  
  if (player.invincible > 0) player.invincible -= dt;
  
  trail.add(player.x + player.w * w / 2, player.y + player.h * h / 2, theme.neon1, 4 * (1 + Math.sin(player.pulse * 3) * 0.3));
}

function updateObstacles(dt, w, h) {
  for (const obs of obstacles) {
    obs.y += baseSpeed * dt * speed;
    
    if (obs.moving) {
      const laneCenter = getLaneX(obs.lane, w);
      const maxOffset = w * LANE_WIDTH * 0.4;
      obs.xOffset = (obs.xOffset || 0) + obs.moveDir * obs.moveSpeed * dt * 60 * (w * 0.01);
      if (Math.abs(obs.xOffset) > maxOffset) obs.moveDir *= -1;
    }
    
    if (!obs.passed && obs.y > GROUND_Y + 0.1) {
      obs.passed = true;
      if (obs.type !== 'gap') {
        distance += 10;
        scoreSys.add(10 * combo.multiplier);
      }
    }
  }
  
  obstacles = obstacles.filter(obs => obs.y < 1.3);
}

function updateCrystals(dt, w, h) {
  for (const cry of crystals) {
    cry.y += baseSpeed * dt * speed;
    cry.rotation += dt * 3;
    cry.pulse += dt * 5;
  }
  crystals = crystals.filter(cry => cry.y < 1.2 && !cry.collected);
}

function checkCollisions(w, h) {
  const px = player.x + player.w * w / 2;
  const py = player.y + player.h * h / 2;
  const pr = Math.min(player.w, player.h) * w * 0.4;
  
  if (player.invincible > 0) return;
  
  for (const obs of obstacles) {
    if (obs.type === 'gap') continue;
    
    const ox = getLaneX(obs.lane, w) + (obs.xOffset || 0);
    const oy = obs.y * h;
    const ow = obs.w * w;
    const oh = obs.h * h;
    
    const closestX = clamp(px, ox - ow / 2, ox + ow / 2);
    const closestY = clamp(py, oy - oh / 2, oy + oh / 2);
    const dx = px - closestX;
    const dy = py - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < pr + Math.min(ow, oh) * 0.3) {
      if (obs.damage) {
        gameOver();
        return;
      }
      if (obs.slideable && player.sliding) {
        combo.add(1);
        scoreSys.add(50 * combo.multiplier);
        textParts.add(ox, oy - 30, `+${50 * combo.multiplier}`, { color: theme.neon3, size: 20, glow: true });
        sfx.combo();
        particles.burst(ox, oy, 20, { color: theme.accent, size: 5, life: 0.6, vx: rand(-4, 4), vy: rand(-4, 4), glow: true });
        screenShake.shake(5, 0.8);
      } else if (!player.jumping || player.vy > 0) {
        gameOver();
        return;
      }
    }
  }
  
  for (const cry of crystals) {
    if (cry.collected) continue;
    const cx = getLaneX(cry.lane, w);
    const cy = cry.y * h;
    const dx = px - cx;
    const dy = py - cy;
    if (Math.sqrt(dx * dx + dy * dy) < pr + 20) {
      cry.collected = true;
      crystalsCollected += cry.value;
      totalCrystals += cry.value;
      combo.add(2);
      const points = 100 * cry.value * combo.multiplier;
      scoreSys.add(points);
      textParts.add(cx, cy - 30, `+${points}`, { color: theme.neon3, size: 24, glow: true });
      sfx.crystal();
      particles.burst(cx, cy, 25, { color: theme.neon2, size: 6, life: 0.8, vx: rand(-5, 5), vy: rand(-5, 5), glow: true });
      glows.add(cx, cy, 50, theme.neon2, 0.5);
      screenShake.shake(2, 0.9);
      
      checkAchievements();
    }
  }
}

function checkAchievements() {
  if (crystalsCollected >= 50) achievements.unlock('collector', 'Crystal Collector', 'Collect 50 crystals in one run', '◆');
  if (combo.combo >= 20) achievements.unlock('combo-master', 'Combo Master', 'Reach 20x combo', '⚡');
  if (distance >= 5000) achievements.unlock('marathon', 'Marathon Runner', 'Run 5000m', '🏃');
  if (speed >= 3) achievements.unlock('speed-demon', 'Speed Demon', 'Reach 3x speed', '⚡');
  if (runs >= 100) achievements.unlock('dedicated', 'Dedicated Runner', 'Play 100 runs', '★');
}

function updateSpeed(dt) {
  speedIncreaseTimer += dt;
  if (speedIncreaseTimer >= 20) {
    speedIncreaseTimer = 0;
    speed = Math.min(5, speed + 0.15);
    sfx.levelup();
    particles.burst(canvas.width / 2, canvas.height * 0.5, 50, {
      color: theme.accent2, size: 8, life: 1.5, vx: rand(-8, 8), vy: rand(-8, 8), glow: true
    });
    screenShake.shake(10, 0.7);
    lightning.strike(rand(0, canvas.width), 0, 5);
  }
}

function gameOver() {
  state = 'gameover';
  stopMusic();
  sfx.lose();
  screenShake.shake(20, 0.6);
  particles.burst(player.x + player.w * canvas.width / 2, player.y + player.h * canvas.height / 2, 60, {
    color: theme.accent2, size: 10, life: 2, vx: rand(-10, 10), vy: rand(-10, 10), glow: true
  });
  
  const runTime = (performance.now() - currentRunStart) / 1000;
  totalTime += runTime;
  totalDistance += distance;
  bestComboEver = Math.max(bestComboEver, combo.maxCombo);
  
  const { best, isNewBest } = bestScore('void-runner', Math.floor(scoreSys.getScore()));
  
  saveGameState('void-runner', {
    totalCrystals, runs, bestComboEver, totalDistance, totalTime,
    highScore: best
  });
  
  const finalStatsEl = $('#final-stats');
  finalStatsEl.innerHTML = `
    <div class="final-stat">Distance: ${Math.floor(distance)}m</div>
    <div class="final-stat">Crystals: ${crystalsCollected}</div>
    <div class="final-stat">Max Combo: ${combo.maxCombo}x</div>
    <div class="final-stat">Time: ${timer.getFormatted()}</div>
    ${isNewBest ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
  `;
  $('#final-score').textContent = Math.floor(scoreSys.getScore());
  $('#gameover-overlay').style.display = 'flex';
}

function update(dt) {
  if (state === 'menu' || state === 'paused') return;
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  if (state === 'playing') {
    timer.update(dt);
    updateBackground(dt, w, h);
    updatePlayer(dt, w, h);
    updateObstacles(dt, w, h);
    updateCrystals(dt, w, h);
    checkCollisions(w, h);
    updateSpeed(dt);
    combo.update(dt);
    
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.max(0.5, 1.5 / speed);
    }
    
    crystalTimer -= dt;
    if (crystalTimer <= 0) {
      spawnCrystal();
      crystalTimer = rand(2, 5) / speed;
    }
  }
  
  particles.update(dt);
  textParts.update(dt);
  glows.update(dt);
  trail.update(dt);
  screenShake.update(dt);
  rain.update(dt, w, h);
  lightning.update(dt);
  
  draw(w, h);
}

function drawPlayer(ctx, w, h) {
  const px = player.x + player.w * w / 2;
  const py = player.y + player.h * h / 2;
  const pw = player.w * w;
  const ph = player.h * h;
  
  ctx.save();
  
  if (player.invincible > 0) {
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 50) * 0.3;
  }
  
  const pulseScale = 1 + Math.sin(player.pulse * 3) * 0.05;
  
  ctx.shadowColor = player.glowColor;
  ctx.shadowBlur = 20 * pulseScale;
  
  const grad = ctx.createRadialGradient(px, py, 0, px, py, Math.max(pw, ph) * 0.8);
  grad.addColorStop(0, player.color);
  grad.addColorStop(0.5, lerpColor(player.color, theme.neon1, 0.5));
  grad.addColorStop(1, theme.neon1);
  ctx.fillStyle = grad;
  
  roundRect(ctx, px - pw / 2 * pulseScale, py - ph / 2 * pulseScale, pw * pulseScale, ph * pulseScale, 8);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px - pw * 0.15, py - ph * 0.1, Math.max(2, pw * 0.08), 0, Math.PI * 2);
  ctx.arc(px + pw * 0.15, py - ph * 0.1, Math.max(2, pw * 0.08), 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawObstacles(ctx, w, h) {
  for (const obs of obstacles) {
    const ox = getLaneX(obs.lane, w) + (obs.xOffset || 0);
    const oy = obs.y * h;
    const ow = obs.w * w;
    const oh = obs.h * h;
    
    if (obs.type === 'laser') {
      const laserGrad = ctx.createLinearGradient(0, oy - oh/2, 0, oy + oh/2);
      laserGrad.addColorStop(0, obs.color);
      laserGrad.addColorStop(0.5, '#fff');
      laserGrad.addColorStop(1, obs.color);
      ctx.fillStyle = laserGrad;
      ctx.shadowColor = obs.glow;
      ctx.shadowBlur = 15;
      ctx.fillRect(0, oy - oh/2, w, oh);
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = obs.glow;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, oy);
      ctx.lineTo(w, oy);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (obs.type === 'barrier' || obs.type === 'moving-barrier') {
      const grad = ctx.createLinearGradient(ox - ow/2, 0, ox + ow/2, 0);
      grad.addColorStop(0, obs.color);
      grad.addColorStop(0.5, lerpColor(obs.color, '#fff', 0.3));
      grad.addColorStop(1, obs.color);
      ctx.fillStyle = grad;
      ctx.shadowColor = obs.glow;
      ctx.shadowBlur = 15;
      roundRect(ctx, ox - ow/2, oy - oh/2, ow, oh, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      roundRect(ctx, ox - ow/2, oy - oh/2, ow, oh, 6);
      ctx.stroke();
      
      if (obs.slideable) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 14px Sora';
        ctx.textAlign = 'center';
        ctx.fillText('▼', ox, oy + 5);
      }
    } else if (obs.type === 'crystal-wall') {
      const grad = ctx.createLinearGradient(ox - ow/2, 0, ox + ow/2, 0);
      grad.addColorStop(0, obs.color);
      grad.addColorStop(0.5, '#ffff88');
      grad.addColorStop(1, obs.color);
      ctx.fillStyle = grad;
      ctx.shadowColor = obs.glow;
      ctx.shadowBlur = 20;
      roundRect(ctx, ox - ow/2, oy - oh/2, ow, oh, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      for (let i = 0; i < 3; i++) {
        const cx = ox + rand(-ow/3, ow/3);
        const cy = oy + rand(-oh/3, oh/3);
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx + 4, cy + 2);
        ctx.lineTo(cx - 4, cy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}

function drawCrystals(ctx, w, h) {
  for (const cry of crystals) {
    if (cry.collected) continue;
    const cx = getLaneX(cry.lane, w);
    const cy = cry.y * h;
    const size = cry.w * w * (1 + Math.sin(cry.pulse * 2) * 0.15);
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cry.rotation);
    
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, theme.neon2);
    grad.addColorStop(1, theme.accent2);
    ctx.fillStyle = grad;
    ctx.shadowColor = theme.neon2;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = size * (i % 2 === 0 ? 1 : 0.5);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBackground(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#030308');
  grad.addColorStop(0.3, '#0a0515');
  grad.addColorStop(0.7, '#150520');
  grad.addColorStop(1, '#050510');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  for (let i = 0; i < 5; i++) {
    const y = h * (0.2 + i * 0.15);
    const layerGrad = ctx.createLinearGradient(0, y, w, y);
    layerGrad.addColorStop(0, `hsla(${260 + i * 10}, 80%, 20%, 0.1)`);
    layerGrad.addColorStop(0.5, `hsla(${280 + i * 10}, 80%, 30%, 0.05)`);
    layerGrad.addColorStop(1, `hsla(${260 + i * 10}, 80%, 20%, 0.1)`);
    ctx.fillStyle = layerGrad;
    ctx.fillRect(0, y - 30, w, 60);
  }
  
  ctx.strokeStyle = 'rgba(124, 92, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 1; i < LANES; i++) {
    const x = (w / LANES) * i;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  
  for (const el of bgElements) {
    if (el.type === 0) {
      ctx.fillStyle = `hsla(${el.hue}, 80%, 60%, ${el.alpha})`;
      ctx.shadowColor = `hsl(${el.hue}, 80%, 60%)`;
      ctx.shadowBlur = 10;
      roundRect(ctx, el.x * w - el.size * w / 2, el.y * h - el.size * h / 2, el.size * w, el.size * h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (el.type === 1) {
      ctx.fillStyle = `hsla(${el.hue}, 70%, 50%, ${el.alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(el.x * w, el.y * h, el.size * w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (el.type === 2) {
      ctx.strokeStyle = `hsla(${el.hue}, 80%, 60%, ${el.alpha * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(el.x * w, el.y * h);
      ctx.lineTo(el.x * w + el.size * w, el.y * h + el.size * h);
      ctx.stroke();
    } else if (el.type === 3) {
      ctx.fillStyle = `hsla(${el.hue}, 60%, 70%, ${el.alpha * 0.4})`;
      ctx.font = `${el.size * w}px Sora`;
      ctx.textAlign = 'center';
      ctx.fillText(['◆', '◇', '◈', '◆'][Math.floor(el.hue / 10) % 4], el.x * w, el.y * h);
    } else if (el.type === 4) {
      ctx.fillStyle = `hsla(${el.hue}, 80%, 70%, ${el.alpha})`;
      ctx.beginPath();
      ctx.arc(el.x * w, el.y * h, Math.max(1, el.size * w / 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  if (Math.random() < 0.005) {
    lightning.strike(rand(0, w), 0, 3);
  }
}

function drawHUD(ctx, w, h) {
  ctx.save();
  ctx.font = 'bold 28px Sora';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${Math.floor(scoreSys.getScore()).toLocaleString()}`, 20, 40);
  ctx.font = '18px Inter';
  ctx.fillStyle = theme.neon1;
  ctx.fillText(`BEST: ${scoreSys.getHighScore().toLocaleString()}`, 20, 65);
  ctx.restore();
}

function drawRain(ctx) {
  rain.draw(ctx);
}

function drawLightning(ctx) {
  lightning.draw(ctx);
}

function draw(w, h) {
  const shakeOffset = screenShake.getOffset();
  ctx.save();
  ctx.translate(shakeOffset.x, shakeOffset.y);
  
  ctx.clearRect(0, 0, w, h);
  
  drawBackground(ctx, w, h);
  drawRain(ctx);
  drawObstacles(ctx, w, h);
  drawCrystals(ctx, w, h);
  trail.draw(ctx);
  drawPlayer(ctx, w, h);
  particles.draw(ctx);
  glows.draw(ctx);
  textParts.draw(ctx);
  drawLightning(ctx);
  
  ctx.restore();
  
  if (state === 'playing') {
    drawHUD(ctx, w, h);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function startGame(challenge = false) {
  isChallenge = challenge;
  if (challenge) {
    const today = new Date().toDateString();
    challengeSeed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    Math.seedrandom = (seed) => {
      let s = seed;
      Math.random = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };
    Math.seedrandom(challengeSeed);
    challengeMods = ['INCREASED SPEED', 'FEWER CRYSTALS', 'MORE LASERS'].slice(0, 2);
  } else {
    Math.random = Math.random;
  }
  
  state = 'playing';
  resetGame();
  timer.start();
  
  const saved = loadGameState('void-runner');
  if (saved) {
    totalCrystals = saved.totalCrystals || 0;
    runs = saved.runs || 0;
    bestComboEver = saved.bestComboEver || 0;
    totalDistance = saved.totalDistance || 0;
    totalTime = saved.totalTime || 0;
  }
  
  const musicNotes = [
    [110, 0.5, 'sawtooth', 0.05],
    [130.8, 0.5, 'sawtooth', 0.05],
    [146.8, 0.5, 'sawtooth', 0.05],
    [174.6, 0.5, 'sawtooth', 0.05],
    [164.8, 0.5, 'sawtooth', 0.05],
    [146.8, 0.5, 'sawtooth', 0.05],
    [130.8, 0.5, 'sawtooth', 0.05],
    [110, 1, 'sawtooth', 0.05]
  ];
  playMusic('void-runner', musicNotes, 140, true);
  
  $('#overlay').style.display = 'none';
  updateStatsDisplay();
}

function updateStatsDisplay() {
  const saved = loadGameState('void-runner');
  const highScore = saved?.highScore || bestScore('void-runner', 0).best;
  $('#stat-high').textContent = Math.floor(highScore).toLocaleString();
  $('#stat-combo').textContent = bestComboEver + 'x';
  $('#stat-crystals').textContent = totalCrystals.toLocaleString();
  $('#stat-dist').textContent = Math.floor(totalDistance).toLocaleString() + 'm';
  $('#stat-runs').textContent = runs.toLocaleString();
  const m = Math.floor(totalTime / 60);
  const s = Math.floor(totalTime % 60);
  $('#stat-time').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function showMenu() {
  state = 'menu';
  stopMusic();
  $('#overlay').style.display = 'flex';
  $('#pause-overlay').style.display = 'none';
  $('#gameover-overlay').style.display = 'none';
  updateStatsDisplay();
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    prevState = 'playing';
    timer.stop();
    stopMusic();
    sfx.pause();
    $('#pause-overlay').style.display = 'flex';
  } else if (state === 'paused') {
    state = prevState;
    timer.start();
    const musicNotes = [
      [110, 0.5, 'sawtooth', 0.05],
      [130.8, 0.5, 'sawtooth', 0.05],
      [146.8, 0.5, 'sawtooth', 0.05],
      [174.6, 0.5, 'sawtooth', 0.05],
      [164.8, 0.5, 'sawtooth', 0.05],
      [146.8, 0.5, 'sawtooth', 0.05],
      [130.8, 0.5, 'sawtooth', 0.05],
      [110, 1, 'sawtooth', 0.05]
    ];
    playMusic('void-runner', musicNotes, 140, true);
    sfx.resume();
    $('#pause-overlay').style.display = 'none';
  }
}

keys.hasOrig = keys.has;
keys.has = function(code) {
  if (code === 'Escape' || code === 'KeyP') {
    if (this._escPressed) return false;
    this._escPressed = true;
    setTimeout(() => this._escPressed = false, 300);
    togglePause();
    return false;
  }
  return this.hasOrig(code);
};

$('#btn-play').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-challenge').addEventListener('click', () => { sfx.click(); $('#challenge-overlay').style.display = 'flex'; updateChallengeDisplay(); });
$('#btn-continue').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-retry').addEventListener('click', () => { sfx.click(); startGame(isChallenge); });
$('#btn-menu').addEventListener('click', () => { sfx.click(); showMenu(); });
$('#btn-menu2').addEventListener('click', () => { sfx.click(); showMenu(); });
$('#btn-resume').addEventListener('click', () => { sfx.click(); togglePause(); });
$('#btn-restart').addEventListener('click', () => { sfx.click(); startGame(isChallenge); });

$('#btn-tutorial').addEventListener('click', () => { sfx.click(); $('#tutorial-overlay').style.display = 'flex'; });
$('#btn-tutorial-close').addEventListener('click', () => { sfx.click(); $('#tutorial-overlay').style.display = 'none'; });

$('#btn-settings').addEventListener('click', () => { sfx.click(); openSettings(); });
$('#btn-settings-close').addEventListener('click', () => { sfx.click(); $('#settings-overlay').style.display = 'none'; });

$('#btn-credits').addEventListener('click', () => { sfx.click(); $('#credits-overlay').style.display = 'flex'; });
$('#btn-credits-close').addEventListener('click', () => { sfx.click(); $('#credits-overlay').style.display = 'none'; });

$('#btn-challenge-play').addEventListener('click', () => { sfx.click(); $('#challenge-overlay').style.display = 'none'; startGame(true); });
$('#btn-challenge-close').addEventListener('click', () => { sfx.click(); $('#challenge-overlay').style.display = 'none'; });

function updateChallengeDisplay() {
  $('#challenge-mods').innerHTML = challengeMods.map(m => `<span class="mod-tag">${m}</span>`).join('');
  $('#challenge-reward').textContent = isChallenge ? '1000' : '500';
}

function openSettings() {
  const s = settings.all();
  $('#set-music').checked = s.music;
  $('#set-sfx').checked = s.sfx;
  $('#set-shake').checked = s.screenShake;
  $('#set-particles').value = s.particles;
  $('#set-difficulty').value = s.difficulty;
  $('#set-fullscreen').checked = s.fullscreen;
  $('#settings-overlay').style.display = 'flex';
}

$('#set-music').addEventListener('change', (e) => { settings.set('music', e.target.checked); if (!e.target.checked) stopMusic(); else if (state === 'playing') startGame(isChallenge); });
$('#set-sfx').addEventListener('change', (e) => { settings.set('sfx', e.target.checked); });
$('#set-shake').addEventListener('change', (e) => { settings.set('screenShake', e.target.checked); });
$('#set-particles').addEventListener('change', (e) => { settings.set('particles', e.target.value); });
$('#set-difficulty').addEventListener('change', (e) => { settings.set('difficulty', e.target.value); });
$('#set-fullscreen').addEventListener('change', (e) => {
  settings.set('fullscreen', e.target.checked);
  if (e.target.checked) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

const saved = loadGameState('void-runner');
if (saved && saved.highScore > 0) {
  $('#btn-continue').style.display = 'block';
}

createLoop(update);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../../assets/js/service-worker.js', { scope: '../../..' }).catch(() => {});
}