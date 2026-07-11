/**
 * SHADOW SURVIVAL — Arena Survival
 * Premium quality: dark atmosphere, fire particles, fog, weapon trails, explosions
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
fitCanvas(canvas, 1);

const keys = createKeyState();
const touch = createTouchState(canvas);
bindTouchButton($('#btn-move-up'), keys, 'KeyW');
bindTouchButton($('#btn-move-down'), keys, 'KeyS');
bindTouchButton($('#btn-move-left'), keys, 'KeyA');
bindTouchButton($('#btn-move-right'), keys, 'KeyD');
bindTouchButton($('#btn-dash'), keys, 'Space');
bindTouchButton($('#btn-shield'), keys, 'KeyQ');

const theme = themes.dark;

const particles = createParticleSystem();
const textParts = createTextParticles();
const screenShake = createScreenShake();
const glows = createGlowEffect();
const trail = createTrailEffect();
const ui = createUI();
const combo = createComboSystem();
const scoreSys = createScoreSystem();
const timer = createTimer();
const achievements = createAchievementSystem('shadow-survival');
const settings = createSettings();

const ARENA_RADIUS = 0.4;
const PLAYER_SPEED = 250;
const DASH_SPEED = 800;
const DASH_DURATION = 0.2;
const DASH_COOLDOWN = 1.5;
const SHIELD_DURATION = 1.5;
const SHIELD_COOLDOWN = 8;

let state = 'menu';
let player = null;
let enemies = [];
let projectiles = [];
let powerups = [];
let souls = [];
let wave = 1;
let waveTimer = 0;
let waveActive = false;
let enemiesToSpawn = 0;
let spawnTimer = 0;
let totalKills = 0;
let totalBosses = 0;
let totalRuns = 0;
let totalTime = 0;
let currentRunStart = 0;
let dashCooldown = 0;
let shieldCooldown = 0;
let isDashing = false;
let dashTime = 0;
let dashDir = { x: 0, y: 0 };
let isShielding = false;
let shieldTime = 0;
let fogParticles = [];
let cameraShake = 0;
let endlessMode = false;

const ENEMY_TYPES = [
  { name: 'Shade', hp: 30, speed: 80, size: 0.035, color: '#ff3366', glow: '#ff3366', damage: 5, xp: 10, type: 'melee' },
  { name: 'Wraith', hp: 50, speed: 60, size: 0.04, color: '#aa44ff', glow: '#aa44ff', damage: 8, xp: 20, type: 'ranged', shootCooldown: 2 },
  { name: 'Reaper', hp: 100, speed: 50, size: 0.05, color: '#ffaa00', glow: '#ffaa00', damage: 15, xp: 50, type: 'heavy' },
  { name: 'Void Walker', hp: 40, speed: 120, size: 0.03, color: '#00ffff', glow: '#00ffff', damage: 10, xp: 25, type: 'dash' },
  { name: 'Soul Eater', hp: 80, speed: 40, size: 0.055, color: '#ff00ff', glow: '#ff00ff', damage: 20, xp: 60, type: 'tank' }
];

const BOSS_TYPES = [
  { name: 'SHADOW LORD', hp: 500, speed: 30, size: 0.12, color: '#ff0066', glow: '#ff0066', damage: 25, xp: 500, phases: 3 },
  { name: 'VOID OVERLORD', hp: 800, speed: 25, size: 0.14, color: '#7c5cff', glow: '#7c5cff', damage: 30, xp: 1000, phases: 4 },
  { name: 'ABYSS KING', hp: 1200, speed: 20, size: 0.16, color: '#ffaa00', glow: '#ffaa00', damage: 35, xp: 2000, phases: 5 }
];

const POWERUP_TYPES = [
  { name: 'HEAL', color: '#00ff88', effect: 'heal' },
  { name: 'DAMAGE', color: '#ff3366', effect: 'damage' },
  { name: 'SPEED', color: '#00ffff', effect: 'speed' },
  { name: 'SHIELD', color: '#7c5cff', effect: 'shield' },
  { name: 'NUKE', color: '#ffaa00', effect: 'nuke' }
];

function resetGame() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const arenaR = Math.min(w, h) * ARENA_RADIUS;
  
  player = {
    x: w / 2, y: h / 2,
    hp: 100, maxHp: 100,
    size: 0.035 * Math.min(w, h),
    color: '#fff', glowColor: '#ffaa00',
    weaponAngle: 0, weaponTrail: [],
    invincible: 0,
    damageMultiplier: 1,
    speedMultiplier: 1,
    fireRate: 0.15,
    fireTimer: 0,
    soulMagnet: 1
  };
  
  enemies = [];
  projectiles = [];
  powerups = [];
  souls = [];
  wave = 1;
  waveTimer = 0;
  waveActive = true;
  enemiesToSpawn = 5;
  spawnTimer = 0;
  totalKills = 0;
  totalBosses = 0;
  dashCooldown = 0;
  shieldCooldown = 0;
  isDashing = false;
  isShielding = false;
  scoreSys.reset();
  combo.reset();
  timer.reset();
  currentRunStart = performance.now();
  generateFog();
  
  startWave();
}

function generateFog() {
  fogParticles = [];
  for (let i = 0; i < 80; i++) {
    fogParticles.push({
      x: rand(0, 1), y: rand(0, 1),
      size: rand(0.05, 0.15),
      speed: rand(0.002, 0.01),
      angle: rand(0, Math.PI * 2),
      alpha: rand(0.02, 0.08),
      color: ['#ff3366', '#7c5cff', '#ffaa00', '#ff00ff'][randInt(0, 3)]
    });
  }
}

function startWave() {
  waveActive = true;
  waveTimer = 60 + wave * 10;
  enemiesToSpawn = Math.min(5 + wave * 2, 50);
  spawnTimer = 0;
  
  if (wave % 5 === 0) {
    spawnBoss();
  }
}

function spawnBoss() {
  const bossIndex = Math.min(Math.floor((wave - 5) / 5), BOSS_TYPES.length - 1);
  const bossData = BOSS_TYPES[bossIndex];
  const angle = rand(0, Math.PI * 2);
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const arenaR = Math.min(w, h) * ARENA_RADIUS;
  const spawnR = arenaR * 1.2;
  
  enemies.push({
    ...bossData,
    x: w / 2 + Math.cos(angle) * spawnR,
    y: h / 2 + Math.sin(angle) * spawnR,
    maxHp: bossData.hp,
    phase: 1,
    phaseTimer: 0,
    shootCooldown: 1,
    specialCooldown: 5,
    isBoss: true,
    bossName: bossData.name,
    angle: 0
  });
  
  screenShake.shake(20, 0.5);
  sfx.levelup();
  particles.burst(w / 2, h / 2, 100, {
    color: bossData.glow, size: 15, life: 3, vx: rand(-15,15), vy: rand(-15,15), glow: true
  });
}

function spawnEnemy() {
  if (enemiesToSpawn <= 0) return;
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const arenaR = Math.min(w, h) * ARENA_RADIUS;
  const spawnR = arenaR * 1.2;
  
  const typeIndex = Math.min(randInt(0, ENEMY_TYPES.length - 1), Math.floor(wave / 2));
  const type = ENEMY_TYPES[typeIndex];
  const angle = rand(0, Math.PI * 2);
  
  enemies.push({
    ...type,
    x: w / 2 + Math.cos(angle) * spawnR,
    y: h / 2 + Math.sin(angle) * spawnR,
    maxHp: type.hp,
    shootTimer: rand(0, type.shootCooldown || 2),
    dashTimer: 0,
    state: 'approach',
    targetAngle: 0
  });
  
  enemiesToSpawn--;
}

function updatePlayer(dt, w, h) {
  const arenaR = Math.min(w, h) * ARENA_RADIUS;
  const centerX = w / 2;
  const centerY = h / 2;
  
  // Movement
  let moveX = 0, moveY = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) moveY -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) moveY += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
  
  // Touch movement
  if (touch.active) {
    const dx = touch.x - centerX;
    const dy = touch.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 30) {
      moveX = dx / dist;
      moveY = dy / dist;
    }
  }
  
  const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
  if (moveLen > 0) {
    moveX /= moveLen;
    moveY /= moveLen;
  }
  
  const speed = PLAYER_SPEED * player.speedMultiplier;
  
  if (isDashing) {
    player.x += dashDir.x * DASH_SPEED * dt;
    player.y += dashDir.y * DASH_SPEED * dt;
    dashTime -= dt;
    if (dashTime <= 0) {
      isDashing = false;
      player.invincible = 0;
    }
  } else {
    player.x += moveX * speed * dt;
    player.y += moveY * speed * dt;
  }
  
  // Clamp to arena
  const dx = player.x - centerX;
  const dy = player.y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > arenaR - player.size) {
    const nx = dx / dist;
    const ny = dy / dist;
    player.x = centerX + nx * (arenaR - player.size);
    player.y = centerY + ny * (arenaR - player.size);
  }
  
  // Dash
  if ((keys.has('Space') || keys.has('ShiftLeft')) && dashCooldown <= 0 && !isDashing && moveLen > 0) {
    isDashing = true;
    dashTime = DASH_DURATION;
    dashCooldown = DASH_COOLDOWN;
    dashDir = { x: moveX, y: moveY };
    player.invincible = DASH_DURATION;
    sfx.dash();
    screenShake.shake(8, 0.7);
    particles.burst(player.x, player.y, 30, {
      color: '#ffaa00', size: 8, life: 0.8, vx: rand(-10,10), vy: rand(-10,10), glow: true
    });
    trail.clear();
  }
  
  // Shield
  if ((keys.has('KeyQ') || keys.has('KeyE')) && shieldCooldown <= 0 && !isShielding) {
    isShielding = true;
    shieldTime = SHIELD_DURATION;
    shieldCooldown = SHIELD_COOLDOWN;
    player.invincible = SHIELD_DURATION;
    sfx.shield();
    screenShake.shake(5, 0.8);
    particles.burst(player.x, player.y, 40, {
      color: '#7c5cff', size: 10, life: 1.5, vx: rand(-8,8), vy: rand(-8,8), glow: true
    });
    glows.add(player.x, player.y, player.size * 4, '#7c5cff', SHIELD_DURATION);
  }
  
  // Cooldowns
  if (dashCooldown > 0) dashCooldown -= dt;
  if (shieldCooldown > 0) shieldCooldown -= dt;
  if (isShielding) {
    shieldTime -= dt;
    if (shieldTime <= 0) isShielding = false;
  }
  if (player.invincible > 0) player.invincible -= dt;
  
  // Auto-fire at nearest enemy
  player.fireTimer -= dt;
  if (player.fireTimer <= 0 && enemies.length > 0) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d = dx * dx + dy * dy;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    if (nearest) {
      const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
      player.weaponAngle = angle;
      projectiles.push({
        x: player.x + Math.cos(angle) * player.size * 1.5,
        y: player.y + Math.sin(angle) * player.size * 1.5,
        vx: Math.cos(angle) * 600,
        vy: Math.sin(angle) * 600,
        damage: 15 * player.damageMultiplier,
        size: 0.012 * Math.min(w, h),
        color: '#ffaa00',
        trail: [],
        life: 1
      });
      player.fireTimer = player.fireRate;
      sfx.click();
      
      // Weapon trail
      for (let i = 0; i < 5; i++) {
        player.weaponTrail.push({
          x: player.x + Math.cos(angle) * player.size * (1.5 + i * 0.3),
          y: player.y + Math.sin(angle) * player.size * (1.5 + i * 0.3),
          life: 0.1
        });
      }
    }
  }
  
  // Update weapon trail
  player.weaponTrail = player.weaponTrail.filter(t => (t.life -= dt) > 0);
  
  // Collect souls
  for (let i = souls.length - 1; i >= 0; i--) {
    const soul = souls[i];
    const dx = soul.x - player.x;
    const dy = soul.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const magnetRange = player.size * 5 * player.soulMagnet;
    
    if (dist < magnetRange) {
      soul.x += (player.x - soul.x) * dt * 5;
      soul.y += (player.y - soul.y) * dt * 5;
    }
    
    if (dist < player.size + soul.size) {
      scoreSys.add(10 * combo.multiplier);
      combo.add(1);
      souls.splice(i, 1);
      sfx.collect();
      particles.burst(player.x, player.y, 10, {
        color: '#ffff00', size: 4, life: 0.5, vx: rand(-3,3), vy: rand(-3,3), glow: true
      });
    }
  }
  
  // Collect powerups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < player.size + p.size) {
      applyPowerup(p.effect);
      powerups.splice(i, 1);
      sfx.powerup();
      screenShake.shake(10, 0.7);
      particles.burst(player.x, player.y, 30, {
        color: p.color, size: 8, life: 1, vx: rand(-8,8), vy: rand(-8,8), glow: true
      });
    }
  }
}

function applyPowerup(effect) {
  switch (effect) {
    case 'heal':
      player.hp = Math.min(player.maxHp, player.hp + 25);
      textParts.add(player.x, player.y - 50, '+25 HP', { color: '#00ff88', size: 24, glow: true });
      break;
    case 'damage':
      player.damageMultiplier = Math.min(3, player.damageMultiplier + 0.3);
      textParts.add(player.x, player.y - 50, 'DAMAGE UP', { color: '#ff3366', size: 24, glow: true });
      break;
    case 'speed':
      player.speedMultiplier = Math.min(2, player.speedMultiplier + 0.2);
      textParts.add(player.x, player.y - 50, 'SPEED UP', { color: '#00ffff', size: 24, glow: true });
      break;
    case 'shield':
      if (!isShielding && shieldCooldown <= 0) {
        isShielding = true;
        shieldTime = SHIELD_DURATION;
        player.invincible = SHIELD_DURATION;
      }
      textParts.add(player.x, player.y - 50, 'SHIELD', { color: '#7c5cff', size: 24, glow: true });
      break;
    case 'nuke':
      for (const e of enemies) {
        if (!e.isBoss) {
          e.hp = 0;
          killEnemy(e);
        } else {
          e.hp -= 100;
          if (e.hp <= 0) killEnemy(e);
        }
      }
      screenShake.shake(30, 0.5);
      sfx.explosion();
      particles.burst(player.x, player.y, 100, {
        color: '#ffaa00', size: 20, life: 2, vx: rand(-30,30), vy: rand(-30,30), glow: true
      });
      textParts.add(player.x, player.y - 50, 'NUKE!', { color: '#ffaa00', size: 32, glow: true });
      break;
  }
}

function updateEnemies(dt, w, h) {
  const centerX = w / 2;
  const centerY = h / 2;
  const arenaR = Math.min(w, h) * ARENA_RADIUS;
  
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;
    
    if (e.isBoss) {
      // Boss behavior
      e.phaseTimer += dt;
      e.shootCooldown -= dt;
      e.specialCooldown -= dt;
      
      // Move toward player but keep distance
      const idealDist = arenaR * 0.5;
      if (dist > idealDist + 50) {
        e.x += nx * e.speed * dt;
        e.y += ny * e.speed * dt;
      } else if (dist < idealDist - 50) {
        e.x -= nx * e.speed * dt * 0.5;
        e.y -= ny * e.speed * dt * 0.5;
      }
      
      // Phase transitions
      const hpPercent = e.hp / e.maxHp;
      const newPhase = Math.ceil((1 - hpPercent) * e.phases) + 1;
      if (newPhase > e.phase && newPhase <= e.phases) {
        e.phase = newPhase;
        e.speed *= 1.2;
        e.damage *= 1.15;
        sfx.levelup();
        screenShake.shake(15, 0.6);
        particles.burst(e.x, e.y, 60, {
          color: e.glow, size: 15, life: 2, vx: rand(-15,15), vy: rand(-15,15), glow: true
        });
        // Spawn minions
        for (let i = 0; i < e.phase; i++) {
          spawnMinion(e.x, e.y);
        }
      }
      
      // Attacks
      if (e.shootCooldown <= 0) {
        const spread = e.phase > 2 ? 3 : 1;
        for (let i = 0; i < spread; i++) {
          const angle = Math.atan2(player.y - e.y, player.x - e.x) + (i - (spread - 1) / 2) * 0.3;
          projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            damage: e.damage,
            size: 0.015 * Math.min(w, h),
            color: e.color,
            fromEnemy: true,
            life: 2
          });
        }
        e.shootCooldown = 1.5 / e.phase;
      }
      
      if (e.specialCooldown <= 0 && e.phase >= 2) {
        // Special attack - ring of projectiles
        const count = 8 + e.phase * 2;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            damage: e.damage * 0.7,
            size: 0.01 * Math.min(w, h),
            color: e.glow,
            fromEnemy: true,
            life: 3
          });
        }
        e.specialCooldown = 5;
        sfx.explosion();
        screenShake.shake(12, 0.7);
      }
      
    } else {
      // Regular enemy behavior
      switch (e.type) {
        case 'melee':
          if (dist > e.size + player.size) {
            e.x += nx * e.speed * dt;
            e.y += ny * e.speed * dt;
          }
          break;
        case 'ranged':
          if (dist > arenaR * 0.4) {
            e.x += nx * e.speed * dt;
            e.y += ny * e.speed * dt;
          }
          e.shootTimer -= dt;
          if (e.shootTimer <= 0 && dist < arenaR * 0.8) {
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            projectiles.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 350,
              vy: Math.sin(angle) * 350,
              damage: e.damage,
              size: 0.01 * Math.min(w, h),
              color: e.color,
              fromEnemy: true,
              life: 2
            });
            e.shootTimer = e.shootCooldown;
          }
          break;
        case 'heavy':
          if (dist > e.size + player.size) {
            e.x += nx * e.speed * dt * 0.5;
            e.y += ny * e.speed * dt * 0.5;
          }
          break;
        case 'dash':
          e.dashTimer -= dt;
          if (e.dashTimer <= 0 && dist < arenaR * 0.6 && dist > e.size + player.size + 50) {
            e.dashTimer = rand(2, 4);
            const dashAngle = Math.atan2(player.y - e.y, player.x - e.x);
            e.vx = Math.cos(dashAngle) * 400;
            e.vy = Math.sin(dashAngle) * 400;
            e.dashing = true;
            e.dashTime = 0.3;
            sfx.dash();
            particles.burst(e.x, e.y, 20, {
              color: e.glow, size: 6, life: 0.5, vx: rand(-5,5), vy: rand(-5,5), glow: true
            });
          }
          if (e.dashing) {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.dashTime -= dt;
            if (e.dashTime <= 0) e.dashing = false;
          } else if (dist > e.size + player.size) {
            e.x += nx * e.speed * dt;
            e.y += ny * e.speed * dt;
          }
          break;
        case 'tank':
          if (dist > e.size + player.size) {
            e.x += nx * e.speed * dt;
            e.y += ny * e.speed * dt;
          }
          break;
      }
    }
    
    // Collision with player
    if (dist < e.size + player.size && player.invincible <= 0 && !isShielding) {
      player.hp -= e.damage;
      player.invincible = 0.5;
      screenShake.shake(8, 0.7);
      sfx.invalid();
      particles.burst(player.x, player.y, 20, {
        color: '#ff3366', size: 6, life: 0.5, vx: rand(-5,5), vy: rand(-5,5), glow: true
      });
      textParts.add(player.x, player.y - 40, `-${e.damage}`, { color: '#ff3366', size: 20, glow: true });
      combo.reset();
      if (player.hp <= 0) {
        gameOver();
      }
    }
    
    // Keep in arena
    const edx = e.x - centerX;
    const edy = e.y - centerY;
    const edist = Math.sqrt(edx * edx + edy * edy);
    if (edist > arenaR + 100) {
      const enx = edx / edist;
      const eny = edy / edist;
      e.x = centerX + enx * (arenaR + 100);
      e.y = centerY + eny * (arenaR + 100);
    }
  }
}

function spawnMinion(x, y) {
  const type = ENEMY_TYPES[0];
  enemies.push({
    ...type,
    x: x + rand(-50, 50),
    y: y + rand(-50, 50),
    maxHp: type.hp,
    hp: type.hp * 0.5,
    shootTimer: 0,
    isMinion: true
  });
}

function updateProjectiles(dt, w, h) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    
    if (p.fromEnemy) {
      // Enemy projectile vs player
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      if (dx * dx + dy * dy < (player.size + p.size) ** 2 && player.invincible <= 0 && !isShielding) {
        player.hp -= p.damage;
        player.invincible = 0.5;
        projectiles.splice(i, 1);
        particles.burst(p.x, p.y, 10, { color: p.color, size: 4, life: 0.3, vx: rand(-3,3), vy: rand(-3,3) });
        screenShake.shake(5, 0.7);
        if (player.hp <= 0) gameOver();
        continue;
      }
    } else {
      // Player projectile vs enemies
      for (const e of enemies) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        if (dx * dx + dy * dy < (e.size + p.size) ** 2) {
          e.hp -= p.damage;
          particles.burst(p.x, p.y, 8, { color: p.color, size: 3, life: 0.2, vx: rand(-2,2), vy: rand(-2,2) });
          if (e.hp <= 0) {
            killEnemy(e);
          }
          projectiles.splice(i, 1);
          break;
        }
      }
    }
    
    if (p.life <= 0) projectiles.splice(i, 1);
  }
}

function killEnemy(enemy) {
  const idx = enemies.indexOf(enemy);
  if (idx === -1) return;
  enemies.splice(idx, 1);
  
  totalKills++;
  combo.add(1);
  const points = (enemy.xp || 10) * combo.multiplier * (enemy.isBoss ? 5 : 1);
  scoreSys.add(points);
  textParts.add(enemy.x, enemy.y, `+${points}`, { color: '#ffaa00', size: 18, glow: true });
  sfx.pop();
  
  // Souls
  const soulCount = enemy.isBoss ? 10 : randInt(1, 3);
  for (let i = 0; i < soulCount; i++) {
    souls.push({
      x: enemy.x + rand(-20, 20),
      y: enemy.y + rand(-20, 20),
      size: 8,
      vy: rand(-50, -20),
      color: enemy.isBoss ? '#ffaa00' : '#ffff00',
      life: 10
    });
  }
  
  // Powerup chance
  if (rand() < (enemy.isBoss ? 0.5 : 0.05)) {
    const ptype = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
    powerups.push({
      x: enemy.x, y: enemy.y,
      size: 16,
      color: ptype.color,
      effect: ptype.effect,
      pulse: 0,
      life: 15
    });
  }
  
  // Explosion
  particles.burst(enemy.x, enemy.y, enemy.isBoss ? 80 : 30, {
    color: enemy.glow, size: enemy.isBoss ? 12 : 6, life: enemy.isBoss ? 2 : 1,
    vx: rand(-15,15), vy: rand(-15,15), glow: true
  });
  glows.add(enemy.x, enemy.y, enemy.isBoss ? 150 : 60, enemy.glow, enemy.isBoss ? 1 : 0.5);
  screenShake.shake(enemy.isBoss ? 15 : 5, 0.6);
  
  if (enemy.isBoss) {
    totalBosses++;
    sfx.win();
    checkAchievements();
  }
}

function checkAchievements() {
  if (totalKills >= 500) achievements.unlock('slayer', 'Soul Slayer', 'Defeat 500 enemies', '⚔');
  if (totalBosses >= 10) achievements.unlock('boss-hunter', 'Boss Hunter', 'Defeat 10 bosses', '👑');
  if (wave >= 25) achievements.unlock('survivor', 'True Survivor', 'Reach wave 25', '🛡');
  if (combo.maxCombo >= 50) achievements.unlock('combo-master', 'Combo Master', 'Reach 50x combo', '⚡');
  if (totalTime >= 3600) achievements.unlock('endless', 'Eternal Night', 'Survive 1 hour total', '∞');
}

function updateWave(dt) {
  if (!waveActive) return;
  
  waveTimer -= dt;
  spawnTimer -= dt;
  
  if (spawnTimer <= 0 && enemiesToSpawn > 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.3, 1.5 - wave * 0.05);
  }
  
  if (waveTimer <= 0 && enemiesToSpawn <= 0 && enemies.filter(e => !e.isMinion).length === 0) {
    waveComplete();
  }
}

function waveComplete() {
  waveActive = false;
  wave++;
  scoreSys.add(wave * 100 * combo.multiplier);
  textParts.add(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), `WAVE ${wave}`, { color: '#ffaa00', size: 48, glow: true });
  sfx.levelup();
  screenShake.shake(10, 0.8);
  particles.burst(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), 50, {
    color: '#ffaa00', size: 10, life: 1.5, vx: rand(-15,15), vy: rand(-15,15), glow: true
  });
  
  // Heal between waves
  player.hp = Math.min(player.maxHp, player.hp + 10);
  
  setTimeout(startWave, 2000);
}

function updateSouls(dt) {
  for (let i = souls.length - 1; i >= 0; i--) {
    const s = souls[i];
    s.y += s.vy * dt;
    s.vy += 200 * dt; // gravity
    s.life -= dt;
    if (s.life <= 0 || s.y > canvas.height / (window.devicePixelRatio || 1) + 50) {
      souls.splice(i, 1);
    }
  }
}

function updatePowerups(dt) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.pulse += dt * 5;
    p.life -= dt;
    if (p.life <= 0) powerups.splice(i, 1);
  }
}

function updateFog(dt) {
  for (const f of fogParticles) {
    f.x += Math.cos(f.angle) * f.speed;
    f.y += Math.sin(f.angle) * f.speed;
    if (f.x < -0.2) f.x = 1.2;
    if (f.x > 1.2) f.x = -0.2;
    if (f.y < -0.2) f.y = 1.2;
    if (f.y > 1.2) f.y = -0.2;
  }
}

function gameOver() {
  state = 'gameover';
  stopMusic();
  sfx.lose();
  screenShake.shake(25, 0.5);
  particles.burst(player.x, player.y, 100, {
    color: '#ff3366', size: 15, life: 3, vx: rand(-20,20), vy: rand(-20,20), glow: true
  });
  
  const runTime = (performance.now() - currentRunStart) / 1000;
  totalTime += runTime;
  totalRuns++;
  
  const { best, isNewBest } = bestScore('shadow-survival', Math.floor(scoreSys.getScore()));
  saveGameState('shadow-survival', { totalKills, totalBosses, totalRuns, totalTime, highScore: best, maxWave: wave });
  
  $('#final-score').textContent = Math.floor(scoreSys.getScore());
  $('#final-stats').innerHTML = `
    <div class="final-stat">Wave Reached: ${wave}</div>
    <div class="final-stat">Enemies Slain: ${totalKills}</div>
    <div class="final-stat">Bosses Defeated: ${totalBosses}</div>
    <div class="final-stat">Max Combo: ${combo.maxCombo}x</div>
    <div class="final-stat">Survival Time: ${timer.getFormatted()}</div>
    ${isNewBest ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
  `;
  $('#gameover-overlay').style.display = 'flex';
}

function update(dt) {
  if (state === 'menu' || state === 'paused') return;
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  if (state === 'playing') {
    timer.update(dt);
    updatePlayer(dt, w, h);
    updateEnemies(dt, w, h);
    updateProjectiles(dt, w, h);
    updateSouls(dt);
    updatePowerups(dt);
    updateWave(dt);
    updateFog(dt);
    combo.update(dt);
  }
  
  particles.update(dt);
  textParts.update(dt);
  glows.update(dt);
  trail.update(dt);
  screenShake.update(dt);
  
  draw(w, h);
}

function drawBackground(ctx, w, h) {
  // Dark gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
  grad.addColorStop(0, '#1a0505');
  grad.addColorStop(0.5, '#0a0205');
  grad.addColorStop(1, '#050008');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  
  // Fog
  for (const f of fogParticles) {
    const fx = f.x * w;
    const fy = f.y * h;
    const fs = f.size * Math.min(w, h);
    ctx.globalAlpha = f.alpha;
    const fgrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fs);
    fgrad.addColorStop(0, f.color.replace(')', `, ${f.alpha * 2})`).replace('rgb', 'rgba').replace('hsl', 'hsla'));
    fgrad.addColorStop(1, f.color.replace(')', ', 0)').replace('rgb', 'rgba').replace('hsl', 'hsla'));
    ctx.fillStyle = fgrad;
    ctx.fillRect(fx - fs, fy - fs, fs * 2, fs * 2);
  }
  ctx.globalAlpha = 1;
  
  // Arena boundary
  const centerX = w / 2;
  const centerY = h / 2;
  const arenaR = Math.min(w, h) * ARENA_RADIUS;
  
  ctx.strokeStyle = 'rgba(255, 51, 102, 0.3)';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ff3366';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(centerX, centerY, arenaR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Inner glow
  const arenaGrad = ctx.createRadialGradient(centerX, centerY, arenaR * 0.8, centerX, centerY, arenaR);
  arenaGrad.addColorStop(0, 'rgba(255, 51, 102, 0)');
  arenaGrad.addColorStop(1, 'rgba(255, 51, 102, 0.05)');
  ctx.fillStyle = arenaGrad;
  ctx.fillRect(0, 0, w, h);
}

function drawPlayer(ctx, w, h) {
  if (player.hp <= 0) return;
  
  ctx.save();
  ctx.translate(player.x, player.y);
  
  // Dash trail
  if (isDashing) {
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  
  // Shield
  if (isShielding) {
    const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.1;
    ctx.strokeStyle = '#7c5cff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.005) * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 2.5 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  
  // Weapon trail
  for (const t of player.weaponTrail) {
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.globalAlpha = t.life * 5;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    const angle = player.weaponAngle;
    const x = Math.cos(angle) * player.size * 2;
    const y = Math.sin(angle) * player.size * 2;
    ctx.moveTo(x, y);
    ctx.lineTo(t.x - player.x, t.y - player.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Player body
  ctx.shadowColor = player.glowColor;
  ctx.shadowBlur = 15;
  
  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, player.size);
  bodyGrad.addColorStop(0, player.color);
  bodyGrad.addColorStop(0.5, '#ffaa00');
  bodyGrad.addColorStop(1, '#ff6600');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, player.size, 0, Math.PI * 2);
  ctx.fill();
  
  // Core
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, player.size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Weapon
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(Math.cos(player.weaponAngle) * player.size * 1.2, Math.sin(player.weaponAngle) * player.size * 1.2);
  ctx.lineTo(Math.cos(player.weaponAngle) * player.size * 2.5, Math.sin(player.weaponAngle) * player.size * 2.5);
  ctx.stroke();
  
  // Health ring
  ctx.shadowBlur = 0;
  ctx.strokeStyle = player.hp > 30 ? '#00ff88' : '#ff3366';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, player.size * 1.5, -Math.PI / 2, -Math.PI / 2 + (player.hp / player.maxHp) * Math.PI * 2);
  ctx.stroke();
  
  // Invincible flash
  if (player.invincible > 0) {
    ctx.globalAlpha = 0.3 + Math.sin(performance.now() * 0.05) * 0.3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, player.size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  ctx.restore();
}

function drawEnemies(ctx, w, h) {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    
    // Boss name
    if (e.isBoss) {
      ctx.fillStyle = e.glow;
      ctx.font = 'bold 14px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = e.glow;
      ctx.shadowBlur = 10;
      ctx.fillText(e.bossName, 0, -e.size * 5 - 20);
      ctx.shadowBlur = 0;
      
      // Health bar
      const barW = e.size * 8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, -barW/2, -e.size * 5 - 10, barW, 6, 3);
      ctx.fill();
      ctx.fillStyle = e.hp / e.maxHp > 0.3 ? '#00ff88' : '#ff3366';
      roundRect(ctx, -barW/2, -e.size * 5 - 10, barW * (e.hp / e.maxHp), 6, 3);
      ctx.fill();
    }
    
    // Body
    ctx.shadowColor = e.glow;
    ctx.shadowBlur = e.isBoss ? 25 : 12;
    
    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * Math.min(w, h));
    bodyGrad.addColorStop(0, e.color);
    bodyGrad.addColorStop(1, e.glow);
    ctx.fillStyle = bodyGrad;
    
    if (e.type === 'heavy' || e.type === 'tank' || e.isBoss) {
      // Square-ish
      roundRect(ctx, -e.size * Math.min(w, h), -e.size * Math.min(w, h), e.size * 2 * Math.min(w, h), e.size * 2 * Math.min(w, h), e.size * 0.3 * Math.min(w, h));
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, e.size * Math.min(w, h), 0, Math.PI * 2);
    }
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 5;
    const eyeOffset = e.size * 0.5 * Math.min(w, h);
    ctx.beginPath();
    ctx.arc(-eyeOffset, -eyeOffset * 0.5, e.size * 0.2 * Math.min(w, h), 0, Math.PI * 2);
    ctx.arc(eyeOffset, -eyeOffset * 0.5, e.size * 0.2 * Math.min(w, h), 0, Math.PI * 2);
    ctx.fill();
    
    // Special effects
    if (e.dashing) {
      ctx.strokeStyle = e.glow;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, e.size * 1.5 * Math.min(w, h), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    ctx.restore();
  }
}

function drawProjectiles(ctx, w, h) {
  for (const p of projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    
    if (p.fromEnemy) {
      // Enemy projectile - diamond
      ctx.beginPath();
      ctx.moveTo(0, -p.size * Math.min(w, h));
      ctx.lineTo(p.size * Math.min(w, h), 0);
      ctx.lineTo(0, p.size * Math.min(w, h));
      ctx.lineTo(-p.size * Math.min(w, h), 0);
      ctx.closePath();
    } else {
      // Player projectile - arrow
      ctx.beginPath();
      ctx.moveTo(p.size * 2 * Math.min(w, h), 0);
      ctx.lineTo(-p.size * Math.min(w, h), -p.size * Math.min(w, h));
      ctx.lineTo(-p.size * 0.5 * Math.min(w, h), 0);
      ctx.lineTo(-p.size * Math.min(w, h), p.size * Math.min(w, h));
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }
}

function drawSouls(ctx, w, h) {
  for (const s of souls) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(performance.now() * 0.002);
    
    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = s.size * (i % 2 === 0 ? 1 : 0.5);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

function drawPowerups(ctx, w, h) {
  for (const p of powerups) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1 + Math.sin(p.pulse) * 0.1, 1 + Math.sin(p.pulse) * 0.1);
    
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    
    const size = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size * 0.6}px Sora, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 5;
    const symbols = { heal: '+', damage: '⚔', speed: '⚡', shield: '🛡', nuke: '☢' };
    ctx.fillText(symbols[p.effect] || '?', 0, 1);
    
    ctx.restore();
  }
}

function drawHUD(ctx, w, h) {
  // Wave
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 24px Sora, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 10;
  ctx.fillText(`WAVE ${wave}`, w / 2, 40);
  ctx.shadowBlur = 0;
  
  // Wave timer
  if (waveActive) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Sora, sans-serif';
    ctx.fillText(`${Math.ceil(waveTimer)}s`, w / 2, 65);
  }
  
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Sora, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(Math.floor(scoreSys.getScore()).toLocaleString(), 20, 40);
  
  // Combo
  if (combo.active) {
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 20px Sora, sans-serif';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 10;
    ctx.fillText(`${combo.combo}x COMBO`, 20, 70);
    ctx.shadowBlur = 0;
  }
  
  // Cooldowns
  ctx.font = '12px Sora, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = dashCooldown > 0 ? '#666' : '#ffaa00';
  ctx.fillText(dashCooldown > 0 ? `DASH: ${dashCooldown.toFixed(1)}s` : 'DASH: READY', w - 20, h - 40);
  ctx.fillStyle = shieldCooldown > 0 ? '#666' : '#7c5cff';
  ctx.fillText(shieldCooldown > 0 ? `SHIELD: ${shieldCooldown.toFixed(1)}s` : 'SHIELD: READY', w - 20, h - 20);
  
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
  const shake = screenShake.getOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  ctx.clearRect(0, 0, w, h);
  
  drawBackground(ctx, w, h);
  drawEnemies(ctx, w, h);
  drawProjectiles(ctx, w, h);
  drawSouls(ctx, w, h);
  drawPowerups(ctx, w, h);
  drawPlayer(ctx, w, h);
  
  particles.draw(ctx);
  textParts.draw(ctx);
  glows.draw(ctx);
  trail.draw(ctx);
  
  drawHUD(ctx, w, h);
  
  ctx.restore();
}

function startGame(endless = false) {
  endlessMode = endless;
  resetGame();
  state = 'playing';
  timer.start();
  
  playMusic('shadow-survival', [
    [82, 1, 'sawtooth', 0.05],
    [92, 1, 'sawtooth', 0.05],
    [110, 1, 'sawtooth', 0.05],
    [123, 1, 'sawtooth', 0.05],
    [110, 1, 'sawtooth', 0.05],
    [92, 1, 'sawtooth', 0.05],
    [82, 1, 'sawtooth', 0.05],
    [73, 1, 'sawtooth', 0.05]
  ], 90);
  
  $('#overlay').style.display = 'none';
  $('#btn-continue').style.display = 'block';
}

function updateStats() {
  const saved = loadGameState('shadow-survival') || {};
  $('#stat-high').textContent = saved.highScore ? saved.highScore.toLocaleString() : '0';
  $('#stat-combo').textContent = (saved.bestCombo || 0) + 'x';
  $('#stat-kills').textContent = (saved.totalKills || 0).toLocaleString();
  $('#stat-bosses').textContent = (saved.totalBosses || 0).toLocaleString();
  $('#stat-time').textContent = formatTime(saved.totalTime || 0);
  $('#stat-runs').textContent = (saved.totalRuns || 0).toLocaleString();
}

function formatTime(ms) {
  const m = Math.floor(ms / 60);
  const s = Math.floor(ms % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

$('#btn-play').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-endless').addEventListener('click', () => { sfx.click(); startGame(true); });
$('#btn-continue').addEventListener('click', () => { sfx.click(); startGame(false); });

$('#btn-resume').addEventListener('click', () => { sfx.click(); state = 'playing'; timer.start(); playMusic('shadow-survival', [], 90); $('#pause-overlay').style.display = 'none'; });
$('#btn-restart').addEventListener('click', () => { sfx.click(); startGame(endlessMode); $('#pause-overlay').style.display = 'none'; });
$('#btn-menu').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#pause-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

$('#btn-retry').addEventListener('click', () => { sfx.click(); startGame(endlessMode); $('#gameover-overlay').style.display = 'none'; });
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

$('#set-music').addEventListener('change', (e) => { settings.set('music', e.target.checked); if (!e.target.checked) stopMusic(); else if (state === 'playing') playMusic('shadow-survival', [], 90); });
$('#set-sfx').addEventEventListener('change', (e) => { settings.set('sfx', e.target.checked); });
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
      playMusic('shadow-survival', [], 90);
      $('#pause-overlay').style.display = 'none';
    }
  }
});

createLoop(update);
updateStats();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../../assets/js/service-worker.js', { scope: '../../..' }).catch(() => {});
}