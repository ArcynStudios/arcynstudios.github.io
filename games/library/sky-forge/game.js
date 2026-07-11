/**
 * SKY FORGE — Tower Builder
 * Premium quality: clouds, god rays, flying birds, sunset lighting, beautiful skybox
 */

import {
  fitCanvas, createKeyState, createTouchState, createLoop, bindTouchButton, $,
  overlap, clamp, rand, randInt, lerp, bestScore, saveGameState, loadGameState,
  sfx, playMusic, stopMusic, isMuted, toggleMute, setMasterVolume,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect,
  createTrailEffect, createUI, createBackgroundLayers, createComboSystem,
  createScoreSystem, createTimer, createAchievementSystem, createSettings,
  themes, lerpColor
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 9 / 16);

const keys = createKeyState();
const touch = createTouchState(canvas);
bindTouchButton($('#btn-left'), keys, 'ArrowLeft');
bindTouchButton($('#btn-right'), keys, 'ArrowRight');
bindTouchButton($('#btn-drop'), keys, 'Space');

const theme = themes.sky;

const particles = createParticleSystem();
const textParts = createTextParticles();
const screenShake = createScreenShake();
const glows = createGlowEffect();
const trail = createTrailEffect();
const ui = createUI();
const combo = createComboSystem();
const scoreSys = createScoreSystem();
const timer = createTimer();
const achievements = createAchievementSystem('sky-forge');
const settings = createSettings();

const BLOCK_WIDTH_RATIO = 0.6;
const BLOCK_HEIGHT_RATIO = 0.08;
const BASE_BLOCK_WIDTH = 0.5;
const PERFECT_THRESHOLD = 0.015;

let state = 'menu';
let blocks = [];
let currentBlock = null;
let nextBlockWidth = 1;
let cameraY = 0;
let targetCameraY = 0;
let height = 0;
let maxHeight = 0;
let blocksRemaining = 10;
let perfectDrops = 0;
let totalPerfects = 0;
let totalTowers = 0;
let totalTime = 0;
let currentRunStart = 0;
let wind = { direction: 1, strength: 0, targetStrength: 0, changeTimer: 0 };
let weather = { type: 'clear', timer: 0, intensity: 0 };
let movingPlatforms = [];
let birds = [];
let clouds = [];
let godRays = [];
let sun = { x: 0, y: 0, angle: 0 };
let skyColors = { top: '#051015', mid: '#1a3a5c', bottom: '#ff6b35' };
let weatherParticles = [];

function resetGame(endless = false) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  blocks = [];
  movingPlatforms = [];
  weatherParticles = [];
  
  // Base platform
  blocks.push({
    x: w / 2,
    y: h - 50,
    w: w * BASE_BLOCK_WIDTH,
    h: h * BLOCK_HEIGHT_RATIO,
    color: '#8b7355',
    glow: '#ffaa00',
    stable: true,
    perfect: false,
    index: 0
  });
  
  spawnBlock();
  height = 0;
  maxHeight = 0;
  blocksRemaining = endless ? 9999 : 10;
  perfectDrops = 0;
  combo.reset();
  scoreSys.reset();
  timer.reset();
  currentRunStart = performance.now();
  cameraY = h - 50;
  targetCameraY = h - 50;
  
  initWind();
  initWeather();
  initBirds();
  initClouds();
  initGodRays();
  initSun();
  
  if (!endless) {
    generateMovingPlatforms();
  }
}

function initWind() {
  wind = {
    direction: rand() > 0.5 ? 1 : -1,
    strength: rand(0.2, 0.8),
    targetStrength: rand(0.2, 0.8),
    changeTimer: rand(10, 20)
  };
}

function initWeather() {
  const types = ['clear', 'clear', 'clear', 'windy', 'stormy', 'sunny', 'foggy'];
  weather = {
    type: types[randInt(0, types.length - 1)],
    timer: rand(30, 60),
    intensity: rand(0.3, 1)
  };
}

function initBirds() {
  birds = [];
  for (let i = 0; i < 15; i++) {
    birds.push({
      x: rand(0, 1),
      y: rand(0.1, 0.7),
      speed: rand(0.002, 0.008),
      wingPhase: rand(0, Math.PI * 2),
      size: rand(0.5, 1.5),
      color: `hsl(${rand(20, 40)}, 60%, ${rand(30, 50)}%)`
    });
  }
}

function initClouds() {
  clouds = [];
  for (let i = 0; i < 20; i++) {
    clouds.push({
      x: rand(0, 1),
      y: rand(0.05, 0.5),
      speed: rand(0.0001, 0.0005),
      size: rand(0.1, 0.3),
      layers: randInt(3, 6),
      opacity: rand(0.15, 0.4),
      color: `hsl(${rand(180, 220)}, 40%, ${rand(70, 90)}%)`
    });
  }
}

function initGodRays() {
  godRays = [];
  for (let i = 0; i < 12; i++) {
    godRays.push({
      angle: (i / 12) * Math.PI * 2 + rand(-0.1, 0.1),
      length: rand(0.8, 1.5),
      opacity: rand(0.02, 0.08),
      speed: rand(0.0001, 0.0003)
    });
  }
}

function initSun() {
  sun = { x: 0.8, y: 0.15, angle: 0, pulse: 0 };
}

function generateMovingPlatforms() {
  movingPlatforms = [];
  const count = randInt(3, 6);
  for (let i = 0; i < count; i++) {
    const y = -(i + 1) * rand(200, 400);
    movingPlatforms.push({
      x: rand(0.2, 0.8),
      y: y,
      w: rand(0.3, 0.5),
      h: 0.06,
      speed: rand(0.3, 1),
      range: rand(0.15, 0.35),
      direction: rand() > 0.5 ? 1 : -1,
      phase: rand(0, Math.PI * 2),
      color: `hsl(${rand(30, 50)}, 60%, ${rand(40, 60)}%)`,
      glow: `hsl(${rand(40, 60)}, 80%, 60%)`
    });
  }
}

function spawnBlock() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  const lastBlock = blocks[blocks.length - 1];
  const newWidth = lastBlock.w * nextBlockWidth;
  
  currentBlock = {
    x: w / 2,
    y: lastBlock.y - h * 0.15,
    w: newWidth,
    h: h * BLOCK_HEIGHT_RATIO,
    targetX: w / 2,
    color: getBlockColor(blocks.length),
    glow: getBlockGlow(blocks.length),
    moving: false,
    falling: false,
    fallSpeed: 0,
    rotation: 0,
    rotationSpeed: 0,
    perfect: false,
    index: blocks.length,
    wobble: 0,
    wobbleSpeed: 0
  };
  
  // Determine next block width
  nextBlockWidth = clamp(0.95 + rand(-0.05, 0.05), 0.7, 1.0);
}

function getBlockColor(index) {
  const colors = [
    '#8b7355', '#a08d6b', '#b89f7a', '#c9b896', '#d4c4a8',
    '#e8d5b7', '#f0dbc8', '#f5e6c8', '#faefe0', '#fff8e7',
    '#ffe8c4', '#ffd8a0', '#ffc87a', '#ffb854', '#ffaa00'
  ];
  return colors[Math.min(index, colors.length - 1)];
}

function getBlockGlow(index) {
  const glows = [
    '#ffaa00', '#ffbb00', '#ffcc00', '#ffdd00', '#ffee00',
    '#ffff00', '#eeff00', '#ddff00', '#ccff00', '#bbff00',
    '#aaff00', '#99ff00', '#88ff00', '#77ff00', '#66ff00'
  ];
  return glows[Math.min(index, glows.length - 1)];
}

function updateWind(dt) {
  wind.changeTimer -= dt;
  if (wind.changeTimer <= 0) {
    wind.direction = rand() > 0.5 ? 1 : -1;
    wind.targetStrength = rand(0.1, 1.2);
    wind.changeTimer = rand(8, 20);
  }
  
  wind.strength += (wind.targetStrength - wind.strength) * dt * 0.5;
}

function updateWeather(dt) {
  weather.timer -= dt;
  if (weather.timer <= 0) {
    const types = ['clear', 'clear', 'clear', 'windy', 'stormy', 'sunny', 'foggy'];
    weather.type = types[randInt(0, types.length - 1)];
    weather.timer = rand(20, 50);
    weather.intensity = rand(0.3, 1);
    
    if (weather.type === 'stormy') {
      sfx.ambient && stopMusic();
      playMusic('sky-forge-storm', [
        [65, 2, 'sawtooth', 0.03],
        [73, 2, 'sawtooth', 0.03],
        [82, 2, 'sawtooth', 0.03]
      ], 40);
    }
  }
  
  // Weather particles
  if (weather.type === 'stormy' || weather.type === 'windy') {
    spawnWeatherParticles();
  }
}

function spawnWeatherParticles() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  if (weather.type === 'stormy' && rand() < 0.3 * weather.intensity) {
    weatherParticles.push({
      x: rand(0, w),
      y: -20,
      vx: wind.direction * wind.strength * 200 + rand(-50, 50),
      vy: rand(300, 600),
      size: rand(2, 6),
      color: '#88aaff',
      life: 2,
      type: 'rain'
    });
  }
  
  if (weather.type === 'foggy' && rand() < 0.1 * weather.intensity) {
    weatherParticles.push({
      x: rand(0, w),
      y: rand(0, h),
      vx: wind.direction * wind.strength * 30 + rand(-10, 10),
      vy: rand(-20, 20),
      size: rand(30, 80),
      color: 'rgba(200,200,220,0.1)',
      life: 10,
      type: 'fog'
    });
  }
  
  if (weather.type === 'sunny' && rand() < 0.05) {
    weatherParticles.push({
      x: rand(0, w),
      y: rand(0, h * 0.5),
      vx: rand(-5, 5),
      vy: rand(-10, 10),
      size: rand(3, 8),
      color: 'rgba(255,255,200,0.6)',
      life: 3,
      type: 'sparkle'
    });
  }
}

function updateWeatherParticles(dt) {
  for (let i = weatherParticles.length - 1; i >= 0; i--) {
    const p = weatherParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0 || p.y > canvas.height / (window.devicePixelRatio || 1) + 50) {
      weatherParticles.splice(i, 1);
    }
  }
}

function updateCurrentBlock(dt, w, h) {
  if (!currentBlock) return;
  
  // Wind affects block
  const windForce = wind.direction * wind.strength * 100 * dt;
  currentBlock.x += windForce;
  
  // Nudge with keys/touch
  const nudgeSpeed = 300;
  if (keys.has('ArrowLeft') || keys.has('KeyA') || (touch.active && touch.x < w / 3)) {
    currentBlock.x -= nudgeSpeed * dt;
  }
  if (keys.has('ArrowRight') || keys.has('KeyD') || (touch.active && touch.x > w * 2 / 3)) {
    currentBlock.x += nudgeSpeed * dt;
  }
  
  // Wobble animation
  currentBlock.wobble += dt * 3;
  currentBlock.x += Math.sin(currentBlock.wobble) * 0.5;
  
  // Clamp to screen with margin
  const margin = currentBlock.w / 2 + 20;
  currentBlock.x = clamp(currentBlock.x, margin, w - margin);
  
  // Check drop
  if (keys.has('Space') || (touch.active && touch.y > h * 0.7 && touch.x > w / 3 && touch.x < w * 2 / 3)) {
    dropBlock();
  }
}

function dropBlock() {
  if (!currentBlock || currentBlock.falling) return;
  
  currentBlock.falling = true;
  currentBlock.fallSpeed = 0;
  sfx.click();
}

function updateFallingBlock(dt, w, h) {
  if (!currentBlock || !currentBlock.falling) return;
  
  const lastBlock = blocks[blocks.length - 1];
  
  // Apply gravity
  currentBlock.fallSpeed += 800 * dt;
  currentBlock.y += currentBlock.fallSpeed * dt;
  
  // Wind affects falling
  currentBlock.x += wind.direction * wind.strength * 50 * dt;
  
  // Moving platform collision
  for (const mp of movingPlatforms) {
    const mpScreenY = mp.y - cameraY + h;
    if (currentBlock.y + currentBlock.h / 2 > mpScreenY - mp.h * h / 2 &&
        currentBlock.y - currentBlock.h / 2 < mpScreenY + mp.h * h / 2 &&
        currentBlock.fallSpeed > 0) {
      const mpScreenX = mp.x * w;
      if (currentBlock.x + currentBlock.w / 2 > mpScreenX - mp.w * w / 2 &&
          currentBlock.x - currentBlock.w / 2 < mpScreenX + mp.w * w / 2) {
        landOnPlatform(mp);
        return;
      }
    }
  }
  
  // Check collision with last block
  if (currentBlock.y + currentBlock.h / 2 >= lastBlock.y - lastBlock.h / 2 &&
      currentBlock.fallSpeed > 0) {
    
    const overlap = (lastBlock.x - lastBlock.w / 2) - (currentBlock.x + currentBlock.w / 2);
    const overlap2 = (currentBlock.x - currentBlock.w / 2) - (lastBlock.x + lastBlock.w / 2);
    
    if (overlap < 0 && overlap2 < 0) {
      // Landed!
      landBlock(lastBlock);
    } else {
      // Missed - tower falls
      towerFall();
    }
  }
  
  // Fell off screen
  if (currentBlock.y > h + 100) {
    towerFall();
  }
}

function landOnPlatform(platform) {
  currentBlock.falling = false;
  currentBlock.y = platform.y - cameraY + (canvas.height / (window.devicePixelRatio || 1)) - platform.h * (canvas.height / (window.devicePixelRatio || 1)) / 2 - currentBlock.h / 2;
  currentBlock.x = platform.x * (canvas.width / (window.devicePixelRatio || 1));
  currentBlock.moving = true;
  currentBlock.platform = platform;
  finalizeBlock(true);
}

function landBlock(lastBlock) {
  currentBlock.falling = false;
  
  // Calculate precision
  const centerDiff = Math.abs(currentBlock.x - lastBlock.x);
  const maxOverlap = (lastBlock.w + currentBlock.w) / 2;
  const precision = 1 - (centerDiff / maxOverlap);
  
  currentBlock.perfect = precision > (1 - PERFECT_THRESHOLD * 2);
  
  if (currentBlock.perfect) {
    perfectDrops++;
    totalPerfects++;
    combo.add(2);
    scoreSys.add(500 * combo.multiplier);
    textParts.add(currentBlock.x, currentBlock.y, `PERFECT! +${500 * combo.multiplier}`, { color: '#ffaa00', size: 24, glow: true });
    sfx.combo();
    particles.burst(currentBlock.x, currentBlock.y, 30, {
      color: '#ffaa00', size: 8, life: 1.5, vx: rand(-10,10), vy: rand(-15,-5), glow: true
    });
    glows.add(currentBlock.x, currentBlock.y, 80, '#ffaa00', 0.8);
    screenShake.shake(5, 0.8);
    
    // Perfect bonus - wider next block
    nextBlockWidth = Math.min(1.05, nextBlockWidth * 1.02);
  } else {
    combo.add(1);
    const points = Math.floor(100 * precision * combo.multiplier);
    scoreSys.add(points);
    textParts.add(currentBlock.x, currentBlock.y, `+${points}`, { color: '#fff', size: 20, glow: true });
    sfx.pop();
    particles.burst(currentBlock.x, currentBlock.y, 15, {
      color: currentBlock.glow, size: 5, life: 1, vx: rand(-8,8), vy: rand(-10,-2), glow: true
    });
  }
  
  // Wobble based on precision
  currentBlock.wobbleSpeed = (1 - precision) * 0.5;
  currentBlock.rotation = (currentBlock.x - lastBlock.x) * 0.001;
  currentBlock.rotationSpeed = (currentBlock.x - lastBlock.x) * 0.0005;
  
  finalizeBlock(false);
}

function finalizeBlock(onPlatform) {
  blocks.push({ ...currentBlock });
  currentBlock = null;
  
  blocksRemaining--;
  if (!onPlatform) {
    // Generate new moving platforms occasionally
    if (blocks.length % 5 === 0) {
      addMovingPlatform();
    }
  }
  
  if (blocksRemaining <= 0 && state !== 'endless') {
    // Level complete
    levelComplete();
  } else {
    spawnBlock();
  }
}

function addMovingPlatform() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const topBlock = blocks[blocks.length - 1];
  
  movingPlatforms.push({
    x: rand(0.2, 0.8),
    y: topBlock.y - rand(200, 400),
    w: rand(0.3, 0.5),
    h: 0.06,
    speed: rand(0.3, 1),
    range: rand(0.15, 0.35),
    direction: rand() > 0.5 ? 1 : -1,
    phase: rand(0, Math.PI * 2),
    color: `hsl(${rand(30, 50)}, 60%, ${rand(40, 60)}%)`,
    glow: `hsl(${rand(40, 60)}, 80%, 60%)`
  });
}

function towerFall() {
  state = 'gameover';
  stopMusic();
  sfx.lose();
  screenShake.shake(20, 0.5);
  
  // Animate tower falling
  for (let i = blocks.length - 1; i >= 0; i--) {
    setTimeout(() => {
      blocks[i].falling = true;
      blocks[i].fallSpeed = 0;
      blocks[i].rotationSpeed = rand(-0.05, 0.05);
      particles.burst(blocks[i].x, blocks[i].y, 20, {
        color: blocks[i].glow, size: 6, life: 1.5, vx: rand(-10,10), vy: rand(-15,-5), glow: true
      });
    }, (blocks.length - 1 - i) * 100);
  }
  
  setTimeout(() => {
    const runTime = (performance.now() - currentRunStart) / 1000;
    totalTime += runTime;
    totalTowers++;
    
    const { best, isNewBest } = bestScore('sky-forge', Math.floor(scoreSys.getScore()));
    saveGameState('sky-forge', { maxHeight: Math.max(maxHeight, height), highScore: best, totalPerfects, totalTowers, totalTime });
    
    $('#final-score').textContent = Math.floor(scoreSys.getScore());
    $('#final-stats').innerHTML = `
      <div class="final-stat">Height: ${Math.floor(height)}m</div>
      <div class="final-stat">Perfect Drops: ${perfectDrops}</div>
      <div class="final-stat">Max Combo: ${combo.maxCombo}x</div>
      <div class="final-stat">Time: ${timer.getFormatted()}</div>
      ${isNewBest ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
    `;
    $('#gameover-overlay').style.display = 'flex';
  }, blocks.length * 100 + 1000);
}

function levelComplete() {
  state = 'levelcomplete';
  stopMusic();
  sfx.win();
  
  const bonus = perfectDrops * 1000 + combo.maxCombo * 500;
  scoreSys.add(bonus);
  textParts.add(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), `LEVEL COMPLETE! +${bonus}`, { color: '#ffaa00', size: 32, glow: true });
  
  particles.burst(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), 80, {
    color: '#ffaa00', size: 15, life: 3, vx: rand(-20,20), vy: rand(-20,20), glow: true
  });
  
  setTimeout(() => {
    const runTime = (performance.now() - currentRunStart) / 1000;
    totalTime += runTime;
    totalTowers++;
    
    const { best, isNewBest } = bestScore('sky-forge', Math.floor(scoreSys.getScore()));
    saveGameState('sky-forge', { maxHeight: Math.max(maxHeight, height), highScore: best, totalPerfects, totalTowers, totalTime });
    
    $('#final-score').textContent = Math.floor(scoreSys.getScore());
    $('#final-stats').innerHTML = `
      <div class="final-stat">Height: ${Math.floor(height)}m</div>
      <div class="final-stat">Perfect Drops: ${perfectDrops}</div>
      <div class="final-stat">Max Combo: ${combo.maxCombo}x</div>
      <div class="final-stat">Time: ${timer.getFormatted()}</div>
      <div class="final-stat">Bonus: +${bonus}</div>
      ${isNewBest ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
    `;
    $('#gameover-overlay').style.display = 'flex';
    $('#btn-retry').textContent = 'NEXT TOWER';
  }, 2000);
}

function updateBlocks(dt, w, h) {
  // Update moving platforms
  for (const mp of movingPlatforms) {
    mp.phase += mp.speed * dt;
    mp.x = 0.5 + Math.sin(mp.phase) * mp.range * mp.direction;
  }
  
  // Update blocks on moving platforms
  for (const block of blocks) {
    if (block.moving && block.platform) {
      block.x = block.platform.x * w;
      block.y = block.platform.y - cameraY + h - block.platform.h * h / 2 - block.h / 2;
    }
    
    // Wobble decay
    if (block.wobbleSpeed > 0) {
      block.wobble += dt * 5;
      block.x += Math.sin(block.wobble) * block.wobbleSpeed;
      block.wobbleSpeed *= 0.98;
      if (block.wobbleSpeed < 0.01) block.wobbleSpeed = 0;
    }
    
    // Rotation
    if (block.rotation !== 0) {
      block.rotation += block.rotationSpeed;
      block.rotationSpeed *= 0.95;
      if (Math.abs(block.rotationSpeed) < 0.0001) {
        block.rotation = 0;
        block.rotationSpeed = 0;
      }
    }
  }
  
  // Update camera
  if (blocks.length > 0) {
    const topBlock = blocks[blocks.length - 1];
    targetCameraY = topBlock.y - h * 0.3;
    cameraY += (targetCameraY - cameraY) * Math.min(dt * 3, 1);
  }
  
  // Height calculation
  if (blocks.length > 1) {
    const baseY = blocks[0].y;
    const topY = blocks[blocks.length - 1].y - blocks[blocks.length - 1].h / 2;
    height = (baseY - topY) / 10; // Convert to meters
    maxHeight = Math.max(maxHeight, height);
  }
}

function updateEnvironment(dt, w, h) {
  // Birds
  for (const bird of birds) {
    bird.x += bird.speed * dt * 60;
    bird.wingPhase += dt * 15;
    if (bird.x > 1.2) bird.x = -0.2;
  }
  
  // Clouds
  for (const cloud of clouds) {
    cloud.x += cloud.speed * dt * 60 * (wind.direction * wind.strength * 0.5 + 1);
    if (cloud.x > 1.3) cloud.x = -0.3;
    if (cloud.x < -0.3) cloud.x = 1.3;
  }
  
  // God rays
  for (const ray of godRays) {
    ray.angle += ray.speed * dt * 60;
  }
  
  // Sun
  sun.pulse += dt * 2;
  sun.angle += dt * 0.1;
}

function checkAchievements() {
  if (maxHeight >= 1000) achievements.unlock('km-high', 'Kilometer High', 'Build a tower 1km tall', '🏗');
  if (perfectDrops >= 50) achievements.unlock('perfect-builder', 'Perfect Builder', 'Land 50 perfect drops in one run', '⭐');
  if (combo.maxCombo >= 20) achievements.unlock('stack-master', 'Stack Master', 'Reach 20x combo', '⚡');
  if (totalTowers >= 100) achievements.unlock('architect', 'Master Architect', 'Build 100 towers', '👑');
  if (totalPerfects >= 500) achievements.unlock('precision', 'Surgical Precision', 'Land 500 perfect drops total', '💎');
}

function update(dt) {
  if (state === 'menu' || state === 'paused') return;
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  if (state === 'playing') {
    timer.update(dt);
    updateWind(dt);
    updateWeather(dt);
    updateWeatherParticles(dt);
    updateCurrentBlock(dt, w, h);
    updateFallingBlock(dt, w, h);
    updateBlocks(dt, w, h);
    updateEnvironment(dt, w, h);
    combo.update(dt);
    checkAchievements();
  }
  
  particles.update(dt);
  textParts.update(dt);
  glows.update(dt);
  trail.update(dt);
  screenShake.update(dt);
  
  draw(w, h);
}

function drawSky(ctx, w, h) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, skyColors.top);
  grad.addColorStop(0.4, skyColors.mid);
  grad.addColorStop(0.7, skyColors.bottom);
  grad.addColorStop(1, '#ff8c42');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  // God rays
  ctx.save();
  ctx.translate(w * sun.x, h * sun.y);
  for (const ray of godRays) {
    ctx.rotate(ray.angle);
    const rayGrad = ctx.createLinearGradient(0, 0, 0, -h * ray.length);
    rayGrad.addColorStop(0, `rgba(255, 255, 200, ${ray.opacity})`);
    rayGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(-w * 0.02, -h * ray.length, w * 0.04, h * ray.length);
    ctx.rotate(-ray.angle);
  }
  ctx.restore();
  
  // Sun
  ctx.save();
  ctx.translate(w * sun.x, h * sun.y);
  const sunPulse = 1 + Math.sin(sun.pulse) * 0.1;
  
  // Corona
  const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.15 * sunPulse);
  coronaGrad.addColorStop(0, 'rgba(255, 255, 150, 0.3)');
  coronaGrad.addColorStop(0.5, 'rgba(255, 200, 50, 0.1)');
  coronaGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.15 * sunPulse, 0, Math.PI * 2);
  ctx.fill();
  
  // Sun disc
  const sunGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.04);
  sunGrad.addColorStop(0, '#fff');
  sunGrad.addColorStop(0.3, '#fff8c0');
  sunGrad.addColorStop(1, '#ffaa00');
  ctx.fillStyle = sunGrad;
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  
  // Clouds
  for (const cloud of clouds) {
    drawCloud(ctx, cloud.x * w, cloud.y * h, cloud.size * Math.min(w, h), cloud.opacity, cloud.color);
  }
  
  // Weather particles
  for (const p of weatherParticles) {
    if (p.type === 'rain') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.01, p.y + p.vy * 0.01);
      ctx.stroke();
    } else if (p.type === 'fog') {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 10 * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (p.type === 'sparkle') {
      ctx.fillStyle = p.color;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + Math.sin(performance.now() * 0.01 + p.x) * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  // Birds
  for (const bird of birds) {
    drawBird(ctx, bird.x * w, bird.y * h, bird.size, bird.wingPhase, bird.color);
  }
}

function drawCloud(ctx, x, y, size, opacity, color) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const layerSize = size * (0.6 + i * 0.15);
    const layerX = x + Math.sin(performance.now() * 0.0005 + i) * size * 0.1;
    const layerY = y + Math.cos(performance.now() * 0.0003 + i) * size * 0.05;
    
    ctx.beginPath();
    ctx.arc(layerX - layerSize * 0.3, layerY, layerSize * 0.4, 0, Math.PI * 2);
    ctx.arc(layerX + layerSize * 0.3, layerY, layerSize * 0.4, 0, Math.PI * 2);
    ctx.arc(layerX, layerY - layerSize * 0.2, layerSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBird(ctx, x, y, size, wingPhase, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const wingAngle = Math.sin(wingPhase) * 0.8;
  
  ctx.beginPath();
  // Left wing
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-15 * wingAngle, -5, -20, 5 * wingAngle);
  // Right wing
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(15 * wingAngle, -5, 20, 5 * wingAngle);
  ctx.stroke();
  
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawBlocks(ctx, w, h) {
  // Draw from bottom to top
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const screenY = block.y - cameraY + h;
    
    if (screenY + block.h / 2 < 0 || screenY - block.h / 2 > h) continue;
    
    ctx.save();
    ctx.translate(block.x, screenY);
    if (block.rotation !== 0) ctx.rotate(block.rotation);
    
    // Block shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    roundRect(ctx, -block.w / 2, -block.h / 2, block.w, block.h, 4);
    ctx.fill();
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    
    // Block body
    const blockGrad = ctx.createLinearGradient(-block.w / 2, -block.h / 2, block.w / 2, block.h / 2);
    blockGrad.addColorStop(0, lightenColor(block.color, 30));
    blockGrad.addColorStop(0.5, block.color);
    blockGrad.addColorStop(1, darkenColor(block.color, 20));
    ctx.fillStyle = blockGrad;
    roundRect(ctx, -block.w / 2, -block.h / 2, block.w, block.h, 4);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, -block.w / 2 + 2, -block.h / 2 + 2, block.w - 4, block.h / 2, 2);
    ctx.fill();
    
    // Glow for perfect blocks
    if (block.perfect || block.index % 5 === 0) {
      ctx.shadowColor = block.glow;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = block.glow;
      ctx.lineWidth = 2;
      roundRect(ctx, -block.w / 2, -block.h / 2, block.w, block.h, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = -block.w / 2 + 10; x < block.w / 2; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, -block.h / 2);
      ctx.lineTo(x, block.h / 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  // Current block
  if (currentBlock && !currentBlock.falling) {
    const screenY = currentBlock.y - cameraY + h;
    ctx.save();
    ctx.translate(currentBlock.x, screenY);
    
    // Ghost preview
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    roundRect(ctx, -currentBlock.w / 2, -currentBlock.h / 2, currentBlock.w, currentBlock.h, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Actual block
    const blockGrad = ctx.createLinearGradient(-currentBlock.w / 2, -currentBlock.h / 2, currentBlock.w / 2, currentBlock.h / 2);
    blockGrad.addColorStop(0, lightenColor(currentBlock.color, 40));
    blockGrad.addColorStop(0.5, currentBlock.color);
    blockGrad.addColorStop(1, darkenColor(currentBlock.color, 10));
    ctx.fillStyle = blockGrad;
    ctx.shadowColor = currentBlock.glow;
    ctx.shadowBlur = 20;
    roundRect(ctx, -currentBlock.w / 2, -currentBlock.h / 2, currentBlock.w, currentBlock.h, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Pulse
    const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.02;
    ctx.strokeStyle = currentBlock.glow;
    ctx.lineWidth = 3 * pulse;
    roundRect(ctx, -currentBlock.w / 2, -currentBlock.h / 2, currentBlock.w, currentBlock.h, 4);
    ctx.stroke();
    
    // Drop indicator
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 14px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼ DROP', 0, currentBlock.h / 2 + 25);
    
    ctx.restore();
  }
  
  // Falling block
  if (currentBlock && currentBlock.falling) {
    const screenY = currentBlock.y - cameraY + h;
    ctx.save();
    ctx.translate(currentBlock.x, screenY);
    if (currentBlock.rotation !== 0) ctx.rotate(currentBlock.rotation);
    
    ctx.fillStyle = currentBlock.color;
    ctx.shadowColor = currentBlock.glow;
    ctx.shadowBlur = 10;
    roundRect(ctx, -currentBlock.w / 2, -currentBlock.h / 2, currentBlock.w, currentBlock.h, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
  }
  
  // Moving platforms
  for (const mp of movingPlatforms) {
    const screenY = mp.y - cameraY + h;
    if (screenY + mp.h * h / 2 < 0 || screenY - mp.h * h / 2 > h) continue;
    
    ctx.save();
    ctx.translate(mp.x * w, screenY);
    
    // Platform
    const platGrad = ctx.createLinearGradient(-mp.w * w / 2, -mp.h * h / 2, mp.w * w / 2, mp.h * h / 2);
    platGrad.addColorStop(0, mp.color);
    platGrad.addColorStop(1, darkenColor(mp.color, 30));
    ctx.fillStyle = platGrad;
    ctx.shadowColor = mp.glow;
    ctx.shadowBlur = 15;
    roundRect(ctx, -mp.w * w / 2, -mp.h * h / 2, mp.w * w, mp.h * h, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Glow line
    ctx.strokeStyle = mp.glow;
    ctx.lineWidth = 2;
    ctx.shadowColor = mp.glow;
    ctx.shadowBlur = 10;
    roundRect(ctx, -mp.w * w / 2, -mp.h * h / 2, mp.w * w, mp.h * h, 6);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Direction arrows
    ctx.fillStyle = mp.glow;
    ctx.font = '16px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mp.direction > 0 ? '▶' : '◀', 0, mp.h * h / 2 + 20);
    
    ctx.restore();
  }
}

function drawHUD(ctx, w, h) {
  // Height
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 28px Sora, sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 10;
  ctx.fillText(`${Math.floor(height)}m`, 20, 40);
  ctx.shadowBlur = 0;
  
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Sora, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(scoreSys.getScore()).toLocaleString(), w - 20, 40);
  
  // Combo
  if (combo.active) {
    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 20px Sora, sans-serif';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 10;
    ctx.fillText(`${combo.combo}x COMBO`, w - 20, 70);
    ctx.shadowBlur = 0;
  }
  
  // Wind indicator
  ctx.fillStyle = '#fff';
  ctx.font = '14px Sora, sans-serif';
  ctx.textAlign = 'center';
  const windArrow = wind.direction > 0 ? '→' : '←';
  ctx.fillText(`WIND ${windArrow} ${(wind.strength * 100).toFixed(0)}%`, w / 2, 30);
  
  // Weather
  if (weather.type !== 'clear') {
    ctx.fillStyle = getWeatherColor(weather.type);
    ctx.font = 'bold 14px Sora, sans-serif';
    ctx.shadowColor = getWeatherColor(weather.type);
    ctx.shadowBlur = 5;
    ctx.fillText(weather.type.toUpperCase(), w / 2, 55);
    ctx.shadowBlur = 0;
  }
  
  // Blocks remaining
  ctx.fillStyle = blocksRemaining > 20 ? '#fff' : '#ff6b35';
  ctx.font = '16px Sora, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(blocksRemaining > 20 ? '∞' : blocksRemaining.toString(), 20, 70);
  
  // Perfect counter
  ctx.fillStyle = perfectDrops > 0 ? '#ffaa00' : '#888';
  ctx.fillText(`${perfectDrops} PERFECT`, 20, 95);
  
  ctx.textAlign = 'start';
}

function getWeatherColor(type) {
  const colors = {
    windy: '#00ffff',
    stormy: '#ff3366',
    sunny: '#ffaa00',
    foggy: '#aaaaff'
  };
  return colors[type] || '#fff';
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 + (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
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

function draw(w, h) {
  const shake = screenShake.getOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  ctx.clearRect(0, 0, w, h);
  
  drawSky(ctx, w, h);
  drawBlocks(ctx, w, h);
  
  particles.draw(ctx);
  textParts.draw(ctx);
  glows.draw(ctx);
  trail.draw(ctx);
  
  drawHUD(ctx, w, h);
  
  ctx.restore();
}

function startGame(endless = false) {
  resetGame(endless);
  state = 'playing';
  timer.start();
  
  const musicNotes = [
    [130, 2, 'sine', 0.04],
    [164, 2, 'sine', 0.04],
    [196, 2, 'sine', 0.04],
    [261, 2, 'sine', 0.04],
    [196, 2, 'sine', 0.04],
    [164, 2, 'sine', 0.04],
    [130, 2, 'sine', 0.04],
    [110, 2, 'sine', 0.04]
  ];
  playMusic('sky-forge', musicNotes, 60);
  
  $('#overlay').style.display = 'none';
  $('#btn-continue').style.display = 'block';
}

function updateStats() {
  const saved = loadGameState('sky-forge') || {};
  $('#stat-height').textContent = Math.floor(saved.maxHeight || 0) + 'm';
  $('#stat-score').textContent = saved.highScore ? saved.highScore.toLocaleString() : '0';
  $('#stat-combo').textContent = (saved.bestCombo || 0) + 'x';
  $('#stat-perfect').textContent = (saved.totalPerfects || 0).toLocaleString();
  $('#stat-towers').textContent = (saved.totalTowers || 0).toLocaleString();
  $('#stat-time').textContent = formatTime(saved.totalTime || 0);
}

function formatTime(ms) {
  const m = Math.floor(ms / 60);
  const s = Math.floor(ms % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

$('#btn-play').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-endless').addEventListener('click', () => { sfx.click(); startGame(true); });
$('#btn-continue').addEventListener('click', () => { sfx.click(); startGame(false); });

$('#btn-resume').addEventListener('click', () => { sfx.click(); state = 'playing'; timer.start(); playMusic('sky-forge', [], 60); $('#pause-overlay').style.display = 'none'; });
$('#btn-restart').addEventListener('click', () => { sfx.click(); startGame(/* endless */ false); $('#pause-overlay').style.display = 'none'; });
$('#btn-menu').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#pause-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

$('#btn-retry').addEventListener('click', () => { sfx.click(); startGame(false); $('#gameover-overlay').style.display = 'none'; });
$('#btn-menu2').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#gameover-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

$('#btn-tutorial').addEventListener('click', () => { sfx.click(); $('#tutorial-overlay').style.display = 'flex'; });
$('#btn-tutorial-close').addEventListener('click', () => { sfx.click(); $('#tutorial-overlay').style.display = 'none'; });

$('#btn-settings').addEventListener('click', () => { sfx.click(); openSettings(); });
$('#btn-settings-close').addEventListener('click', () => { sfx.click(); $('#settings-overlay').style.display = 'none'; });

$('#btn-credits').addEventListener('click', () => { sfx.click(); $('#credits-overlay').style.display = 'flex'; });
$('#btn-credits-close').addEventListener('click', () => { sfx.click(); $('#credits-overlay').style.display = 'none'; });

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

$('#set-music').addEventListener('change', (e) => { settings.set('music', e.target.checked); if (!e.target.checked) stopMusic(); else if (state === 'playing') playMusic('sky-forge', [], 60); });
$('#set-sfx').addEventListener('change', (e) => { settings.set('sfx', e.target.checked); });
$('#set-shake').addEventListener('change', (e) => { settings.set('screenShake', e.target.checked); });
$('#set-particles').addEventListener('change', (e) => { settings.set('particles', e.target.value); });
$('#set-difficulty').addEventListener('change', (e) => { settings.set('difficulty', e.target.value); });
$('#set-fullscreen').addEventListener('change', (e) => {
  settings.set('fullscreen', e.target.checked);
  if (e.target.checked) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state === 'playing') {
      state = 'paused';
      timer.stop();
      stopMusic();
      $('#pause-overlay').style.display = 'flex';
    } else if (state === 'paused') {
      state = 'playing';
      timer.start();
      playMusic('sky-forge', [], 60);
      $('#pause-overlay').style.display = 'none';
    }
  }
});

createLoop(update);
updateStats();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../../assets/js/service-worker.js', { scope: '../../..' }).catch(() => {});
}