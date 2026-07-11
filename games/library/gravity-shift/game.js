/**
 * GRAVITY SHIFT — Physics Platformer
 * Premium quality: realistic lighting, mechanical animations, blue energy effects
 */

import {
  fitCanvas, createKeyState, createTouchState, createLoop, bindTouchButton, $,
  overlap, clamp, rand, randInt, lerp, bestScore, saveGameState, loadGameState,
  sfx, playMusic, stopMusic, isMuted, toggleMute, setMasterVolume,
  createParticleSystem, createTextParticles, createScreenShake, createGlowEffect,
  createTrailEffect, createUI, createBackgroundLayers, createComboSystem,
  createScoreSystem, createTimer, createAchievementSystem, createSettings,
  themes, lerpColor, hexToRgb
} from '../shared/engine.js';

const canvas = $('#c');
const ctx = canvas.getContext('2d');
fitCanvas(canvas, 9 / 16);

const keys = createKeyState();
const touch = createTouchState(canvas);
bindTouchButton($('#btn-left'), keys, 'ArrowLeft');
bindTouchButton($('#btn-right'), keys, 'ArrowRight');
bindTouchButton($('#btn-jump'), keys, 'Space');
bindTouchButton($('#btn-gravity'), keys, 'ShiftLeft');

const theme = themes.gravity;

const particles = createParticleSystem();
const textParts = createTextParticles();
const screenShake = createScreenShake();
const glows = createGlowEffect();
const trail = createTrailEffect();
const ui = createUI();
const combo = createComboSystem();
const scoreSys = createScoreSystem();
const timer = createTimer();
const achievements = createAchievementSystem('gravity-shift');
const settings = createSettings();

const GRAVITY_DIRS = [
  { x: 0, y: 1, label: '▼', angle: Math.PI / 2 },
  { x: 1, y: 0, label: '▶', angle: 0 },
  { x: 0, y: -1, label: '▲', angle: -Math.PI / 2 },
  { x: -1, y: 0, label: '◀', angle: Math.PI }
];

let state = 'menu';
let player = null;
let platforms = [];
let lasers = [];
let portals = [];
let movingPlatforms = [];
let elevators = [];
let exit = null;
let gravityDir = 0;
let level = 1;
let maxLevel = 30;
let crystalsCollected = 0;
let totalCrystals = 0;
let deaths = 0;
let stageStartTime = 0;
let totalTime = 0;
let shakeIntensity = 0;
let gravityTransition = 0;
let targetGravityDir = 0;
let cameraX = 0;
let cameraY = 0;
let cameraTargetX = 0;
let cameraTargetY = 0;
let levelComplete = false;
let levelCompleteTimer = 0;

const LEVELS = [
  { name: "ENTRANCE", width: 24, height: 14, crystals: 3 },
  { name: "CORRIDOR", width: 28, height: 16, crystals: 4 },
  { name: "VERTICAL SHAFT", width: 20, height: 24, crystals: 4 },
  { name: "LASER GRID", width: 30, height: 18, crystals: 5 },
  { name: "PORTAL NEXUS", width: 26, height: 20, crystals: 5 },
  { name: "ELEVATOR ASCENT", width: 18, height: 28, crystals: 5 },
  { name: "GRAVITY MAZE", width: 32, height: 22, crystals: 6 },
  { name: "ROTATING CHAMBER", width: 24, height: 24, crystals: 6 },
  { name: "LASER LABYRINTH", width: 36, height: 16, crystals: 7 },
  { name: "CORE ACCESS", width: 28, height: 26, crystals: 7 },
  { name: "QUANTUM BRIDGE", width: 30, height: 24, crystals: 7 },
  { name: "ANTI-GRAVITY ZONE", width: 26, height: 30, crystals: 8 },
  { name: "PHASE SHIFT", width: 34, height: 22, crystals: 8 },
  { name: "ENERGY CONDUIT", width: 28, height: 28, crystals: 8 },
  { name: "SINGULARITY CORE", width: 40, height: 24, crystals: 9 },
  { name: "VOID WALKER", width: 32, height: 30, crystals: 9 },
  { name: "TEMPORAL FLUX", width: 36, height: 26, crystals: 9 },
  { name: "DIMENSIONAL RIFT", width: 30, height: 32, crystals: 10 },
  { name: "EVENT HORIZON", width: 38, height: 28, crystals: 10 },
  { name: "FINAL SEQUENCE", width: 42, height: 30, crystals: 10 },
  { name: "ESCAPE VELOCITY", width: 40, height: 28, crystals: 10 },
  { name: "OVERRIDE", width: 36, height: 32, crystals: 11 },
  { name: "PURGE PROTOCOL", width: 34, height: 34, crystals: 11 },
  { name: "SYSTEM REBOOT", width: 38, height: 32, crystals: 11 },
  { name: "ADMIN ACCESS", width: 40, height: 36, crystals: 12 },
  { name: "ROOT DIRECTORY", width: 44, height: 30, crystals: 12 },
  { name: "KERNEL PANIC", width: 38, height: 38, crystals: 12 },
  { name: "BLUE SCREEN", width: 42, height: 36, crystals: 13 },
  { name: "SAFE MODE", width: 40, height: 40, crystals: 13 },
  { name: "RECOVERY", width: 44, height: 38, crystals: 13 },
  { name: "TRANSCENDENCE", width: 48, height: 42, crystals: 15 }
];

function generateLevel(levelNum) {
  const lvl = LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];
  const w = lvl.width;
  const h = lvl.height;
  const tileSize = 1;
  
  platforms = [];
  lasers = [];
  portals = [];
  movingPlatforms = [];
  elevators = [];
  crystals = [];
  
  const grid = Array(h).fill(null).map(() => Array(w).fill(0));
  
  // Create floor
  for (let x = 0; x < w; x++) grid[h - 1][x] = 1;
  for (let x = 0; x < w; x++) grid[0][x] = 1;
  for (let y = 0; y < h; y++) { grid[y][0] = 1; grid[y][w - 1] = 1; }
  
  // Add platforms
  const platformCount = Math.min(5 + levelNum, 25);
  for (let i = 0; i < platformCount; i++) {
    const px = randInt(2, w - 3);
    const py = randInt(2, h - 3);
    const pw = randInt(3, 6);
    for (let x = 0; x < pw && px + x < w - 1; x++) {
      if (grid[py][px + x] === 0) grid[py][px + x] = 1;
    }
  }
  
  // Add vertical walls for gravity shifts
  for (let i = 0; i < 3 + levelNum; i++) {
    const px = randInt(2, w - 3);
    const py = randInt(2, h - 3);
    const ph = randInt(4, 8);
    for (let y = 0; y < ph && py + y < h - 1; y++) {
      if (grid[py + y][px] === 0) grid[py + y][px] = 1;
    }
  }
  
  // Convert grid to platforms
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (grid[y][x] === 1) {
        let startX = x;
        while (x < w && grid[y][x] === 1) x++;
        platforms.push({
          x: startX * tileSize,
          y: y * tileSize,
          w: (x - startX) * tileSize,
          h: tileSize,
          type: 'static'
        });
      } else x++;
    }
  }
  
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      if (grid[y][x] === 1) {
        let startY = y;
        while (y < h && grid[y][x] === 1) y++;
        if (y - startY > 2) {
          platforms.push({
            x: x * tileSize,
            y: startY * tileSize,
            w: tileSize,
            h: (y - startY) * tileSize,
            type: 'wall'
          });
        }
      } else y++;
    }
  }
  
  // Add moving platforms
  const movingCount = Math.min(2 + Math.floor(levelNum / 3), 8);
  for (let i = 0; i < movingCount; i++) {
    const horizontal = rand() > 0.5;
    if (horizontal) {
      const y = randInt(3, h - 4);
      const x1 = randInt(2, w - 8);
      const x2 = randInt(x1 + 4, w - 3);
      movingPlatforms.push({
        x: x1 * tileSize, y: y * tileSize,
        w: 4 * tileSize, h: tileSize,
        x1: x1 * tileSize, x2: x2 * tileSize,
        speed: rand(0.5, 1.5), dir: 1,
        type: 'horizontal'
      });
    } else {
      const x = randInt(2, w - 3);
      const y1 = randInt(2, h - 8);
      const y2 = randInt(y1 + 4, h - 3);
      movingPlatforms.push({
        x: x * tileSize, y: y1 * tileSize,
        w: tileSize, h: 3 * tileSize,
        y1: y1 * tileSize, y2: y2 * tileSize,
        speed: rand(0.5, 1.2), dir: 1,
        type: 'vertical'
      });
    }
  }
  
  // Add elevators
  const elevatorCount = Math.min(1 + Math.floor(levelNum / 5), 4);
  for (let i = 0; i < elevatorCount; i++) {
    const x = randInt(2, w - 3);
    const y = randInt(3, h - 6);
    elevators.push({
      x: x * tileSize, y: y * tileSize,
      w: 2 * tileSize, h: tileSize,
      minY: 2 * tileSize, maxY: (h - 3) * tileSize,
      speed: 1.5, active: false,
      platform: { x: x * tileSize, y: y * tileSize, w: 2 * tileSize, h: tileSize }
    });
  }
  
  // Add lasers
  const laserCount = Math.min(2 + levelNum, 15);
  for (let i = 0; i < laserCount; i++) {
    const horizontal = rand() > 0.5;
    if (horizontal) {
      const y = randInt(2, h - 3);
      const x1 = 1;
      const x2 = w - 1;
      const dir = rand() > 0.5 ? 1 : -1;
      lasers.push({
        x1: x1 * tileSize, y1: y * tileSize,
        x2: x2 * tileSize, y2: y * tileSize,
        horizontal: true, active: true,
        cycle: rand(0, 2), cycleTime: rand(2, 4),
        warning: false, warnTimer: 0, color: '#00d4ff'
      });
    } else {
      const x = randInt(2, w - 3);
      const y1 = 1;
      const y2 = h - 1;
      lasers.push({
        x1: x * tileSize, y1: y1 * tileSize,
        x2: x * tileSize, y2: y2 * tileSize,
        horizontal: false, active: true,
        cycle: rand(0, 2), cycleTime: rand(2, 4),
        warning: false, warnTimer: 0, color: '#ff0066'
      });
    }
  }
  
  // Add portals
  const portalCount = Math.min(1 + Math.floor(levelNum / 4), 6);
  for (let i = 0; i < portalCount; i += 2) {
    const x1 = randInt(2, w - 3);
    const y1 = randInt(2, h - 3);
    const x2 = randInt(2, w - 3);
    const y2 = randInt(2, h - 3);
    portals.push({
      a: { x: x1 * tileSize, y: y1 * tileSize, w: 2 * tileSize, h: 2 * tileSize, color: '#00d4ff' },
      b: { x: x2 * tileSize, y: y2 * tileSize, w: 2 * tileSize, h: 2 * tileSize, color: '#7c5cff' },
      linked: true, cooldown: 0
    });
  }
  
  // Place crystals
  for (let i = 0; i < lvl.crystals; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const cx = randInt(2, w - 3) * tileSize;
      const cy = randInt(2, h - 3) * tileSize;
      let onPlatform = false;
      for (const p of platforms) {
        if (cx >= p.x && cx <= p.x + p.w && cy - 1.5 * tileSize <= p.y && cy - 1.5 * tileSize >= p.y - 2) {
          onPlatform = true; break;
        }
      }
      for (const mp of movingPlatforms) {
        if (cx >= mp.x && cx <= mp.x + mp.w && cy - 1.5 * tileSize <= mp.y && cy - 1.5 * tileSize >= mp.y - 2) {
          onPlatform = true; break;
        }
      }
      if (onPlatform) {
        crystals.push({ x: cx, y: cy - 1.5 * tileSize, collected: false, pulse: rand(0, Math.PI * 2), value: 1 });
        placed = true;
        break;
      }
    }
  }
  
  // Place exit
  const exitX = (w - 2) * tileSize;
  const exitY = 1 * tileSize;
  exit = { x: exitX, y: exitY, w: 2 * tileSize, h: 3 * tileSize, active: false, pulse: 0 };
  
  // Place player at start
  player = {
    x: 2 * tileSize, y: (h - 3) * tileSize,
    w: 0.8, h: 1.6, vx: 0, vy: 0,
    onGround: false, groundedTimer: 0,
    color: '#00d4ff', glowColor: '#00d4ff',
    trail: [], invincible: 0, dead: false
  };
  
  gravityDir = 0;
  targetGravityDir = 0;
  gravityTransition = 0;
  levelComplete = false;
  levelCompleteTimer = 0;
  stageStartTime = performance.now();
  crystalsCollected = 0;
  cameraX = player.x;
  cameraY = player.y;
  cameraTargetX = player.x;
  cameraTargetY = player.y;
}

function resetGame() {
  level = 1;
  totalCrystals = 0;
  deaths = 0;
  totalTime = 0;
  generateLevel(level);
}

function applyGravity(dt) {
  const g = GRAVITY_DIRS[gravityDir];
  player.vx += g.x * 25 * dt;
  player.vy += g.y * 25 * dt;
  
  if (gravityDir === 0 || gravityDir === 2) {
    player.vx *= 0.9;
  } else {
    player.vy *= 0.9;
  }
}

function checkCollisions() {
  const p = player;
  p.onGround = false;
  
  const allPlatforms = [...platforms, ...movingPlatforms.map(mp => mp.platform)];
  
  for (const plat of allPlatforms) {
    if (plat.type === 'wall' && gravityDir % 2 === 0) continue;
    if (plat.type === 'static' && gravityDir % 2 === 1) continue;
    
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;
    
    if (px > plat.x && px < plat.x + plat.w &&
        py > plat.y && py < plat.y + plat.h) {
      
      const overlapX = Math.min(px - plat.x, plat.x + plat.w - px);
      const overlapY = Math.min(py - plat.y, plat.y + plat.h - py);
      
      if (overlapX < overlapY) {
        if (px < plat.x + plat.w / 2) {
          p.x = plat.x - p.w;
          p.vx = Math.min(p.vx, 0);
        } else {
          p.x = plat.x + plat.w;
          p.vx = Math.max(p.vx, 0);
        }
      } else {
        if (py < plat.y + plat.h / 2) {
          p.y = plat.y - p.h;
          p.vy = Math.min(p.vy, 0);
          p.onGround = true;
          p.groundedTimer = 0.1;
        } else {
          p.y = plat.y + plat.h;
          p.vy = Math.max(p.vy, 0);
        }
      }
    }
  }
  
  // Check elevators
  for (const elev of elevators) {
    const ep = elev.platform;
    if (p.x + p.w > ep.x && p.x < ep.x + ep.w &&
        p.y + p.h > ep.y && p.y < ep.y + ep.h) {
      if (p.vy >= 0 && p.y + p.h - p.vy <= ep.y) {
        p.y = ep.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.groundedTimer = 0.1;
      }
    }
  }
  
  // Check lasers
  if (p.invincible <= 0) {
    for (const laser of lasers) {
      if (!laser.active) continue;
      const dist = laser.horizontal
        ? Math.abs(p.y + p.h / 2 - laser.y1)
        : Math.abs(p.x + p.w / 2 - laser.x1);
      if (dist < 8) {
        killPlayer();
        return;
      }
    }
  }
  
  // Check portals
  for (const portal of portals) {
    if (portal.cooldown > 0) {
      portal.cooldown -= 1/60;
      continue;
    }
    for (const end of [portal.a, portal.b]) {
      if (p.x < end.x + end.w && p.x + p.w > end.x &&
          p.y < end.y + end.h && p.y + p.h > end.y) {
        const other = end === portal.a ? portal.b : portal.a;
        p.x = other.x + (other.w - p.w) / 2;
        p.y = other.y + (other.h - p.h) / 2;
        p.vx = 0; p.vy = 0;
        portal.cooldown = 1;
        sfx.powerup();
        particles.burst(p.x + p.w/2, p.y + p.h/2, 30, {
          color: '#00d4ff', size: 5, life: 1, vx: rand(-5,5), vy: rand(-5,5), glow: true
        });
        screenShake.shake(8, 0.7);
        break;
      }
    }
  }
  
  // Check crystals
  for (const cry of crystals) {
    if (!cry.collected &&
        p.x < cry.x + 16 && p.x + p.w > cry.x - 16 &&
        p.y < cry.y + 16 && p.y + p.h > cry.y - 16) {
      cry.collected = true;
      crystalsCollected++;
      totalCrystals++;
      combo.add(2);
      scoreSys.add(100 * combo.multiplier);
      textParts.add(cry.x, cry.y, `+${100 * combo.multiplier}`, { color: '#ffff00', size: 20, glow: true });
      sfx.crystal();
      particles.burst(cry.x, cry.y, 20, {
        color: '#ffff00', size: 6, life: 0.8, vx: rand(-4,4), vy: rand(-4,4), glow: true
      });
      checkAchievements();
    }
  }
  
  // Check exit
  const allCollected = crystals.every(c => c.collected);
  exit.active = allCollected;
  if (exit.active &&
      p.x < exit.x + exit.w && p.x + p.w > exit.x &&
      p.y < exit.y + exit.h && p.y + p.h > exit.y) {
    completeLevel();
  }
}

function killPlayer() {
  if (player.dead) return;
  player.dead = true;
  deaths++;
  sfx.lose();
  screenShake.shake(15, 0.6);
  particles.burst(player.x + player.w/2, player.y + player.h/2, 50, {
    color: '#ff0066', size: 8, life: 1.5, vx: rand(-8,8), vy: rand(-8,8), glow: true
  });
  setTimeout(() => {
    state = 'gameover';
    stopMusic();
    const runTime = (performance.now() - stageStartTime) / 1000;
    totalTime += runTime;
    const { best, isNewBest } = bestScore('gravity-shift', Math.floor(scoreSys.getScore()));
    saveGameState('gravity-shift', { totalCrystals, deaths, totalTime, highScore: best, maxLevel: level });
    $('#final-score').textContent = Math.floor(scoreSys.getScore());
    $('#final-stats').innerHTML = `
      <div class="final-stat">Level: ${level}</div>
      <div class="final-stat">Crystals: ${crystalsCollected}</div>
      <div class="final-stat">Deaths: ${deaths}</div>
      <div class="final-stat">Time: ${timer.getFormatted()}</div>
      ${isNewBest ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
    `;
    $('#gameover-overlay').style.display = 'flex';
  }, 1000);
}

function completeLevel() {
  levelComplete = true;
  levelCompleteTimer = 2;
  sfx.win();
  const runTime = (performance.now() - stageStartTime) / 1000;
  totalTime += runTime;
  const timeBonus = Math.max(0, 5000 - runTime * 100);
  const crystalBonus = crystalsCollected * 500;
  const levelBonus = level * 100;
  const totalBonus = timeBonus + crystalBonus + levelBonus;
  scoreSys.add(totalBonus);
  textParts.add(player.x, player.y - 50, `+${totalBonus}`, { color: '#00ff88', size: 28, glow: true });
  particles.burst(player.x + player.w/2, player.y + p.h/2, 60, {
    color: '#00d4ff', size: 8, life: 2, vx: rand(-10,10), vy: rand(-10,10), glow: true
  });
}

function nextLevel() {
  level++;
  if (level > maxLevel) level = 1;
  generateLevel(level);
  state = 'playing';
  timer.start();
}

function restartLevel() {
  generateLevel(level);
  state = 'playing';
  timer.start();
}

function updatePlayer(dt) {
  const p = player;
  const moveSpeed = 12;
  
  const leftPressed = keys.has('ArrowLeft') || keys.has('KeyA');
  const rightPressed = keys.has('ArrowRight') || keys.has('KeyD');
  const jumpPressed = keys.has('Space') || keys.has('KeyW') || keys.has('ArrowUp');
  
  if (leftPressed) p.vx -= moveSpeed;
  if (rightPressed) p.vx += moveSpeed;
  
  if (jumpPressed && (p.onGround || p.groundedTimer > 0)) {
    const g = GRAVITY_DIRS[gravityDir];
    p.vx -= g.x * 18;
    p.vy -= g.y * 18;
    p.onGround = false;
    p.groundedTimer = 0;
    sfx.jump();
    particles.burst(p.x + p.w/2, p.y + p.h/2, 15, {
      color: theme.neon1, size: 4, life: 0.5, vx: rand(-3,3), vy: rand(-3,3), glow: true
    });
    screenShake.shake(3, 0.8);
  }
  
  const gravLeft = keys.has('KeyQ') || keys.has('KeyE');
  const gravRight = keys.has('KeyE');
  if ((keys.has('KeyQ') || keys.has('KeyE')) && !player._gravPressed) {
    if (keys.has('KeyQ')) targetGravityDir = (gravityDir + 3) % 4;
    else targetGravityDir = (gravityDir + 1) % 4;
    player._gravPressed = true;
    gravityTransition = 1;
    sfx.shield();
    screenShake.shake(10, 0.7);
    particles.burst(p.x + p.w/2, p.y + p.h/2, 40, {
      color: '#00d4ff', size: 6, life: 1, vx: rand(-6,6), vy: rand(-6,6), glow: true
    });
    lightning.strike(p.x + p.w/2, p.y + p.h/2, 3);
  }
  if (!keys.has('KeyQ') && !keys.has('KeyE')) player._gravPressed = false;
  
  // Touch gravity shift
  if (touch.active && touch.x > canvas.width * 0.75) {
    if (!player._touchGrav) {
      targetGravityDir = (gravityDir + 1) % 4;
      gravityTransition = 1;
      sfx.shield();
      screenShake.shake(10, 0.7);
      player._touchGrav = true;
    }
  } else {
    player._touchGrav = false;
  }
  
  // Apply gravity transition
  if (gravityTransition > 0) {
    gravityTransition -= dt * 3;
    if (gravityTransition <= 0) {
      gravityDir = targetGravityDir;
      gravityTransition = 0;
    }
  }
  
  // Update velocity
  applyGravity(dt);
  
  // Clamp velocity
  const maxSpeed = 15;
  p.vx = clamp(p.vx, -maxSpeed, maxSpeed);
  p.vy = clamp(p.vy, -maxSpeed, maxSpeed);
  
  // Update position
  p.x += p.vx * dt * 60;
  p.y += p.vy * dt * 60;
  
  // Trail
  p.trail.push({ x: p.x + p.w/2, y: p.y + p.h/2, life: 0.3 });
  p.trail = p.trail.filter(t => (t.life -= dt) > 0);
  
  if (p.invincible > 0) p.invincible -= dt;
  
  checkCollisions();
  
  // Camera follow
  cameraTargetX = p.x;
  cameraTargetY = p.y;
  cameraX += (cameraTargetX - cameraX) * Math.min(dt * 5, 1);
  cameraY += (cameraTargetY - cameraY) * Math.min(dt * 5, 1);
}

function updateMovingPlatforms(dt) {
  for (const mp of movingPlatforms) {
    if (mp.type === 'horizontal') {
      mp.x += mp.dir * mp.speed * dt * 60;
      if (mp.x >= mp.x2 || mp.x <= mp.x1) mp.dir *= -1;
      mp.platform.x = mp.x;
    } else {
      mp.y += mp.dir * mp.speed * dt * 60;
      if (mp.y >= mp.y2 || mp.y <= mp.y1) mp.dir *= -1;
      mp.platform.y = mp.y;
    }
  }
  
  for (const elev of elevators) {
    const playerOn = player.x + player.w > elev.platform.x && player.x < elev.platform.x + elev.platform.w &&
                     player.y + player.h > elev.platform.y && player.y < elev.platform.y + elev.platform.h;
    if (playerOn) elev.active = true;
    
    if (elev.active) {
      elev.platform.y += elev.speed * dt * 60;
      if (elev.platform.y <= elev.minY || elev.platform.y >= elev.maxY) {
        elev.speed *= -1;
      }
    }
  }
}

function updateLasers(dt) {
  for (const laser of lasers) {
    laser.cycle += dt;
    if (laser.cycle > laser.cycleTime) {
      laser.cycle = 0;
      laser.active = !laser.active;
      laser.warning = true;
      laser.warnTimer = 0.5;
      if (laser.warning) sfx.tick();
    }
    if (laser.warning) {
      laser.warnTimer -= dt;
      if (laser.warnTimer <= 0) laser.warning = false;
    }
  }
}

function updateCrystals(dt) {
  for (const cry of crystals) {
    cry.pulse += dt * 4;
  }
}

function updateExit(dt) {
  exit.pulse += dt * 3;
}

function checkAchievements() {
  if (totalCrystals >= 100) achievements.unlock('collector', 'Crystal Collector', 'Collect 100 crystals', '◇');
  if (level >= 15) achievements.unlock('deep', 'Deep Diver', 'Reach level 15', '▼');
  if (level >= 30) achievements.unlock('master', 'Gravity Master', 'Complete all 30 stages', '★');
  if (deaths === 0 && level >= 10) achievements.unlock('flawless', 'Flawless', 'Reach level 10 without dying', '◆');
  if (combo.maxCombo >= 15) achievements.unlock('combo-king', 'Combo King', 'Reach 15x combo', '⚡');
}

function update(dt) {
  if (state === 'menu' || state === 'paused') return;
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  if (state === 'playing') {
    timer.update(dt);
    updatePlayer(dt);
    updateMovingPlatforms(dt);
    updateLasers(dt);
    updateCrystals(dt);
    updateExit(dt);
    combo.update(dt);
    
    if (levelComplete) {
      levelCompleteTimer -= dt;
      if (levelCompleteTimer <= 0) {
        state = 'stagecomplete';
        timer.stop();
        $('#stage-score').textContent = `Score: ${Math.floor(scoreSys.getScore())}`;
        $('#stage-stats').innerHTML = `
          <div class="stage-stat">Time: ${timer.getFormatted()}</div>
          <div class="stage-stat">Crystals: ${crystalsCollected}/${crystals.length}</div>
          <div class="stage-stat">Combo: ${combo.maxCombo}x</div>
        `;
        $('#stage-complete-overlay').style.display = 'flex';
      }
    }
  }
  
  particles.update(dt);
  textParts.update(dt);
  glows.update(dt);
  trail.update(dt);
  screenShake.update(dt);
  
  draw(w, h);
}

function drawBackground(ctx, w, h) {
  const g = GRAVITY_DIRS[gravityDir];
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#080810');
  grad.addColorStop(0.5, '#0a0a18');
  grad.addColorStop(1, '#081018');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  // Grid lines
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  const offsetX = (cameraX * 0.1) % gridSize;
  const offsetY = (cameraY * 0.1) % gridSize;
  
  for (let x = -offsetX; x < w + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -offsetY; y < h + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  // Gravity indicator lines
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  if (gravityDir === 0 || gravityDir === 2) {
    for (let x = 0; x < w; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  } else {
    for (let y = 0; y < h; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  
  // Floating particles
  for (let i = 0; i < 30; i++) {
    const x = (i * 127 + cameraX * 0.05 + performance.now() * 0.01) % (w + 100) - 50;
    const y = (i * 89 + cameraY * 0.05 + performance.now() * 0.008) % (h + 100) - 50;
    const alpha = 0.1 + Math.sin(performance.now() * 0.003 + i) * 0.05;
    ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.sin(performance.now() * 0.002 + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms(ctx, w, h) {
  ctx.fillStyle = '#1a1a2e';
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  
  for (const p of platforms) {
    const sx = p.x - cameraX + w / 2;
    const sy = p.y - cameraY + h / 2;
    
    if (sx + p.w < 0 || sx > w || sy + p.h < 0 || sy > h) continue;
    
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 5;
    
    if (p.type === 'wall') {
      const grad = ctx.createLinearGradient(sx, sy, sx + p.w, sy + p.h);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.5, '#0d1b2a');
      grad.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = grad;
    }
    
    roundRect(ctx, sx, sy, p.w, p.h, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  
  // Moving platforms
  ctx.fillStyle = '#00d4ff';
  ctx.strokeStyle = '#7c5cff';
  for (const mp of movingPlatforms) {
    const sx = mp.platform.x - cameraX + w / 2;
    const sy = mp.platform.y - cameraY + h / 2;
    if (sx + mp.platform.w < 0 || sx > w || sy + mp.platform.h < 0 || sy > h) continue;
    
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
    roundRect(ctx, sx, sy, mp.platform.w, mp.platform.h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // Elevators
  ctx.fillStyle = '#7c5cff';
  ctx.strokeStyle = '#00d4ff';
  for (const elev of elevators) {
    const sx = elev.platform.x - cameraX + w / 2;
    const sy = elev.platform.y - cameraY + h / 2;
    if (sx + elev.platform.w < 0 || sx > w || sy + elev.platform.h < 0 || sy > h) continue;
    
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 10;
    roundRect(ctx, sx, sy, elev.platform.w, elev.platform.h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Elevator shaft
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(sx + elev.platform.w / 2, sy);
    ctx.lineTo(sx + elev.platform.w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawLasers(ctx, w, h) {
  for (const laser of lasers) {
    if (!laser.active && !laser.warning) continue;
    
    const x1 = laser.x1 - cameraX + w / 2;
    const y1 = laser.y1 - cameraY + h / 2;
    const x2 = laser.x2 - cameraX + w / 2;
    const y2 = laser.y2 - cameraY + h / 2;
    
    if (laser.warning) {
      const alpha = 0.3 + Math.sin(performance.now() * 0.02) * 0.2;
      ctx.strokeStyle = laser.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('hsl', 'hsla');
      ctx.lineWidth = 30;
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (laser.active) {
      ctx.strokeStyle = laser.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = laser.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Core
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

function drawPortals(ctx, w, h) {
  const time = performance.now() * 0.002;
  for (const portal of portals) {
    for (const end of [portal.a, portal.b]) {
      const sx = end.x - cameraX + w / 2;
      const sy = end.y - cameraY + h / 2;
      if (sx + end.w < 0 || sx > w || sy + end.h < 0 || sy > h) continue;
      
      const cx = sx + end.w / 2;
      const cy = sy + end.h / 2;
      
      // Outer ring
      for (let i = 0; i < 3; i++) {
        const r = end.w / 2 + Math.sin(time * 2 + i) * 5 + i * 8;
        ctx.strokeStyle = end.color.replace(')', `, ${0.3 - i * 0.1})`).replace('rgb', 'rgba').replace('hsl', 'hsla');
        ctx.lineWidth = 2;
        ctx.shadowColor = end.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Inner glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, end.w);
      grad.addColorStop(0, end.color.replace(')', ', 0.8)').replace('rgb', 'rgba').replace('hsl', 'hsla'));
      grad.addColorStop(1, end.color.replace(')', ', 0)').replace('rgb', 'rgba').replace('hsl', 'hsla'));
      ctx.fillStyle = grad;
      ctx.shadowColor = end.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, end.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Particles
      for (let i = 0; i < 8; i++) {
        const angle = time * 3 + i * Math.PI / 4;
        const px = cx + Math.cos(angle) * (end.w / 2 + 10);
        const py = cy + Math.sin(angle) * (end.h / 2 + 10);
        ctx.fillStyle = end.color;
        ctx.shadowColor = end.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }
}

function drawCrystals(ctx, w, h) {
  for (const cry of crystals) {
    if (cry.collected) continue;
    const sx = cry.x - cameraX + w / 2;
    const sy = cry.y - cameraY + h / 2;
    if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
    
    const pulse = Math.sin(cry.pulse) * 0.2 + 1;
    const size = 12 * pulse;
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(cry.pulse * 0.5);
    
    // Glow
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
    grad.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.fillRect(-size * 2, -size * 2, size * 4, size * 4);
    
    // Crystal shape
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    
    // Inner
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.35, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.35, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

function drawExit(ctx, w, h) {
  if (!exit.active) return;
  const sx = exit.x - cameraX + w / 2;
  const sy = exit.y - cameraY + h / 2;
  if (sx + exit.w < 0 || sx > w || sy + exit.h < 0 || sy > h) return;
  
  const pulse = Math.sin(exit.pulse) * 0.3 + 1;
  
  // Beam
  const grad = ctx.createLinearGradient(sx, sy, sx, sy - 200);
  grad.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
  grad.addColorStop(1, 'rgba(0, 255, 136, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(sx - 50, sy - 200, exit.w + 100, 200);
  
  // Door frame
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 15 * pulse;
  roundRect(ctx, sx, sy, exit.w, exit.h, 8);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // EXIT text
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 20px Sora, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 10;
  ctx.fillText('EXIT', sx + exit.w / 2, sy + exit.h / 2);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawPlayer(ctx, w, h) {
  const p = player;
  if (p.dead) return;
  
  const sx = p.x - cameraX + w / 2;
  const sy = p.y - cameraY + h / 2;
  
  // Trail
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < p.trail.length; i++) {
    const t = p.trail[i];
    const tx = t.x - cameraX + w / 2;
    const ty = t.y - cameraY + h / 2;
    const alpha = t.life / 0.3;
    ctx.globalAlpha = alpha * 0.5;
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Player body
  ctx.save();
  ctx.translate(sx + p.w / 2, sy + p.h / 2);
  
  // Rotate based on gravity
  const g = GRAVITY_DIRS[gravityDir];
  ctx.rotate(Math.atan2(g.y, g.x) + Math.PI / 2);
  
  // Glow
  ctx.shadowColor = p.glowColor;
  ctx.shadowBlur = 15;
  
  // Body
  const grad = ctx.createLinearGradient(-p.w * 10, -p.h * 10, p.w * 10, p.h * 10);
  grad.addColorStop(0, p.color);
  grad.addColorStop(1, '#0088cc');
  ctx.fillStyle = grad;
  roundRect(ctx, -p.w * 5, -p.h * 8, p.w * 10, p.h * 16, 6);
  ctx.fill();
  
  // Core
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Visor
  ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
  ctx.shadowBlur = 0;
  roundRect(ctx, -p.w * 3, -p.h * 6, p.w * 6, 12, 4);
  ctx.fill();
  
  // Gravity indicator on player
  ctx.fillStyle = '#00d4ff';
  ctx.font = '16px Sora, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(GRAVITY_DIRS[gravityDir].label, 0, p.h * 10);
  
  ctx.restore();
}

function drawHUD(ctx, w, h) {
  // Level name
  const lvl = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 18px Sora, sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 10;
  ctx.fillText(lvl.name, 20, 35);
  ctx.shadowBlur = 0;
  
  // Gravity indicator
  ctx.fillStyle = '#fff';
  ctx.font = '14px Sora, sans-serif';
  ctx.fillText(`GRAVITY: ${GRAVITY_DIRS[gravityDir].label}`, 20, 55);
  
  // Crystals
  ctx.fillStyle = '#ffff00';
  ctx.font = '16px Sora, sans-serif';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 5;
  ctx.fillText(`◇ ${crystalsCollected}/${crystals.length}`, 20, 78);
  ctx.shadowBlur = 0;
  
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Sora, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(scoreSys.getScore()), w - 20, 40);
  
  // Combo
  if (combo.active) {
    ctx.fillStyle = '#ff0066';
    ctx.font = 'bold 18px Sora, sans-serif';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.fillText(`${combo.combo}x COMBO`, w - 20, 70);
    ctx.shadowBlur = 0;
  }
  
  ctx.textAlign = 'start';
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
  ctx.save();
  
  const shake = screenShake.getOffset();
  ctx.translate(shake.x, shake.y);
  
  drawBackground(ctx, w, h);
  drawPlatforms(ctx, w, h);
  drawLasers(ctx, w, h);
  drawPortals(ctx, w, h);
  drawCrystals(ctx, w, h);
  drawExit(ctx, w, h);
  drawPlayer(ctx, w, h);
  
  particles.draw(ctx);
  textParts.draw(ctx);
  glows.draw(ctx);
  trail.draw(ctx);
  
  drawHUD(ctx, w, h);
  
  ctx.restore();
}

function startGame(isChallenge = false) {
  if (isChallenge) {
    level = randInt(10, 30);
  } else {
    const saved = loadGameState('gravity-shift');
    if (saved && saved.maxLevel) {
      level = Math.min(saved.maxLevel + 1, maxLevel);
    } else {
      level = 1;
    }
  }
  totalCrystals = 0;
  deaths = 0;
  totalTime = 0;
  scoreSys.reset();
  generateLevel(level);
  state = 'playing';
  timer.start();
  playMusic('gravity-shift', [
    [110, 1, 'sine', 0.05],
    [146, 1, 'sine', 0.05],
    [164, 1, 'sine', 0.05],
    [220, 1, 'sine', 0.05],
    [164, 1, 'sine', 0.05],
    [146, 1, 'sine', 0.05],
    [110, 1, 'sine', 0.05],
    [82, 1, 'sine', 0.05]
  ], 80);
  $('#overlay').style.display = 'none';
  $('#btn-continue').style.display = 'block';
}

function updateChallengeDisplay() {
  const challengeStages = [
    { name: "SPEEDRUN", mod: "Complete in 60 seconds", reward: 1000 },
    { name: "NO GRAVITY SHIFT", mod: "Beat without rotating gravity", reward: 1500 },
    { name: "NO DEATH", mod: "Complete without dying", reward: 2000 },
    { name: "ALL CRYSTALS", mod: "Collect every crystal", reward: 1500 },
    { name: "PACIFIST", mod: "Don't touch any laser", reward: 2000 }
  ];
  
  $('#challenge-list').innerHTML = challengeStages.map((c, i) => `
    <div class="challenge-item" data-index="${i}">
      <span class="challenge-name">${c.name}</span>
      <span class="challenge-mod">${c.mod}</span>
      <span class="challenge-reward">${c.reward} ◇</span>
    </div>
  `).join('');
  
  $('#challenge-list').querySelectorAll('.challenge-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      challengeMods = [challengeStages[i].name];
      sfx.click();
    });
  });
}

$('#btn-play').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-challenge').addEventListener('click', () => { sfx.click(); updateChallengeDisplay(); $('#challenge-overlay').style.display = 'flex'; });
$('#btn-continue').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-challenge-start').addEventListener('click', () => { sfx.click(); $('#challenge-overlay').style.display = 'none'; startGame(true); });
$('#btn-challenge-close').addEventListener('click', () => { sfx.click(); $('#challenge-overlay').style.display = 'none'; });

$('#btn-resume').addEventListener('click', () => { sfx.click(); state = 'playing'; timer.start(); playMusic('gravity-shift', [], 80); $('#pause-overlay').style.display = 'none'; });
$('#btn-restart').addEventListener('click', () => { sfx.click(); restartLevel(); $('#pause-overlay').style.display = 'none'; });
$('#btn-menu').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#pause-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

$('#btn-next-stage').addEventListener('click', () => { sfx.click(); nextLevel(); $('#stage-complete-overlay').style.display = 'none'; });
$('#btn-menu2').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#stage-complete-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

$('#btn-retry').addEventListener('click', () => { sfx.click(); restartLevel(); $('#gameover-overlay').style.display = 'none'; });
$('#btn-menu3').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#gameover-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

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

$('#set-music').addEventListener('change', (e) => { settings.set('music', e.target.checked); if (!e.target.checked) stopMusic(); else if (state === 'playing') playMusic('gravity-shift', [], 80); });
$('#set-sfx').addEventListener('change', (e) => { settings.set('sfx', e.target.checked); });
$('#set-shake').addEventListener('change', (e) => { settings.set('screenShake', e.target.checked); });
$('#set-particles').addEventListener('change', (e) => { settings.set('particles', e.target.value); });
$('#set-difficulty').addEventListener('change', (e) => { settings.set('difficulty', e.target.value); });
$('#set-fullscreen').addEventListener('change', (e) => {
  settings.set('fullscreen', e.target.checked);
  if (e.target.checked) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

function updateStats() {
  const saved = loadGameState('gravity-shift') || {};
  $('#stat-best').textContent = saved.highScore || 0;
  $('#stat-combo').textContent = (saved.bestCombo || 0) + 'x';
  $('#stat-crystals').textContent = saved.totalCrystals || 0;
  $('#stat-stages').textContent = (saved.maxLevel || 1) - 1;
  $('#stat-time').textContent = formatTime(saved.totalTime || 0);
  $('#stat-deaths').textContent = saved.deaths || 0;
}

function formatTime(ms) {
  const m = Math.floor(ms / 60);
  const s = Math.floor(ms % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
      playMusic('gravity-shift', [], 80);
      $('#pause-overlay').style.display = 'none';
    }
  }
});

createLoop(update);
updateStats();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../../assets/js/service-worker.js', { scope: '../../..' }).catch(() => {});
}