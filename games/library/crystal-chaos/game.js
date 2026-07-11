/**
 * CRYSTAL CHAOS — Chain Reaction Puzzle
 * Premium quality: luxury crystal rendering, glow, bloom, dust particles, dynamic cave lighting
 */

import {
  fitCanvas, createKeyState, createTouchState, createLoop, bindTouchButton, $,
  overlap, clamp, rand, randInt, lerp, bestScore, bestTime, saveGameState, loadGameState,
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

const theme = themes.crystal;

const particles = createParticleSystem();
const textParts = createTextParticles();
const screenShake = createScreenShake();
const glows = createGlowEffect();
const trail = createTrailEffect();
const ui = createUI();
const combo = createComboSystem();
const scoreSys = createScoreSystem();
const timer = createTimer();
const achievements = createAchievementSystem('crystal-chaos');
const settings = createSettings();

const COLS = 8;
const ROWS = 8;
const GEM_TYPES = 6;
const GEM_SIZE = 0.11;
const GEM_PADDING = 0.005;

const GEM_COLORS = [
  '#ff0066', // Red
  '#00d4ff', // Cyan
  '#ffaa00', // Gold
  '#7c5cff', // Purple
  '#00ff88', // Green
  '#ff5c8a'  // Pink
];

const GEM_GLOWS = [
  '#ff0066', '#00d4ff', '#ffaa00', '#7c5cff', '#00ff88', '#ff5c8a'
];

const SPECIAL_GEMS = {
  ROW_CLEAR: 'row',
  COL_CLEAR: 'col',
  BOMB: 'bomb',
  RAINBOW: 'rainbow',
  BOSS: 'boss'
};

let state = 'menu';
let grid = [];
let selectedGem = null;
let swapping = false;
let swapData = null;
let falling = false;
let moves = 0;
let maxMoves = 25;
let level = 1;
let maxLevel = 50;
let totalCrystals = 0;
let perfectClears = 0;
let puzzlesSolved = 0;
let bossActive = false;
let bossHealth = 0;
let bossMaxHealth = 0;
let bossGem = null;
let shakeTime = 0;
let caveLighting = [];
let ambientParticles = [];

function createGem(type, special = null, boss = false) {
  return {
    type,
    special,
    boss,
    health: boss ? 3 : 1,
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    scale: 1,
    rotation: 0,
    pulse: rand(0, Math.PI * 2),
    matched: false,
    clearing: false,
    clearDelay: 0,
    newGem: true,
    fallDelay: 0
  };
}

function generateLevel(levelNum) {
  const lvl = LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];
  grid = [];
  moves = 0;
  maxMoves = lvl.moves;
  combo.reset();
  bossActive = false;
  
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      let gem = null;
      let attempts = 0;
      do {
        const type = randInt(0, GEM_TYPES - 1);
        gem = createGem(type);
        attempts++;
      } while (wouldCreateMatch(x, y, gem) && attempts < 10);
      grid[y][x] = gem;
      setGemPosition(gem, x, y);
      gem.targetX = gem.x;
      gem.targetY = gem.y;
      gem.fallDelay = (ROWS - y) * 0.05;
    }
  }
  
  // Add special gems
  const specialCount = Math.min(2 + Math.floor(levelNum / 5), 8);
  for (let i = 0; i < specialCount; i++) {
    const x = randInt(0, COLS - 1);
    const y = randInt(0, ROWS - 1);
    if (!grid[y][x].special) {
      const specials = [SPECIAL_GEMS.ROW_CLEAR, SPECIAL_GEMS.COL_CLEAR, SPECIAL_GEMS.BOMB];
      grid[y][x].special = specials[randInt(0, specials.length - 1)];
    }
  }
  
  // Add boss gem every 10 levels
  if (levelNum % 10 === 0) {
    const x = randInt(2, COLS - 3);
    const y = randInt(2, ROWS - 3);
    grid[y][x] = createGem(randInt(0, GEM_TYPES - 1), SPECIAL_GEMS.BOSS, true);
    grid[y][x].health = 3 + Math.floor(levelNum / 10);
    bossActive = true;
    bossHealth = grid[y][x].health;
    bossMaxHealth = bossHealth;
    bossGem = grid[y][x];
    setGemPosition(grid[y][x], x, y);
  }
  
  // Add rainbow gem every 7 levels
  if (levelNum % 7 === 0) {
    const x = randInt(0, COLS - 1);
    const y = randInt(0, ROWS - 1);
    if (!grid[y][x].special && !grid[y][x].boss) {
      grid[y][x].special = SPECIAL_GEMS.RAINBOW;
    }
  }
  
  generateCaveLighting();
  generateAmbientParticles();
}

function wouldCreateMatch(x, y, gem) {
  // Check horizontal
  if (x >= 2 && grid[y][x-1] && grid[y][x-2] &&
      grid[y][x-1].type === gem.type && grid[y][x-2].type === gem.type) return true;
  if (x >= 1 && x < COLS - 1 && grid[y][x-1] && grid[y][x+1] &&
      grid[y][x-1].type === gem.type && grid[y][x+1].type === gem.type) return true;
  if (x < COLS - 2 && grid[y][x+1] && grid[y][x+2] &&
      grid[y][x+1].type === gem.type && grid[y][x+2].type === gem.type) return true;
  
  // Check vertical
  if (y >= 2 && grid[y-1] && grid[y-2] &&
      grid[y-1][x].type === gem.type && grid[y-2][x].type === gem.type) return true;
  if (y >= 1 && y < ROWS - 1 && grid[y-1] && grid[y+1] &&
      grid[y-1][x].type === gem.type && grid[y+1][x].type === gem.type) return true;
  if (y < ROWS - 2 && grid[y+1] && grid[y+2] &&
      grid[y+1][x].type === gem.type && grid[y+2][x].type === gem.type) return true;
  
  return false;
}

const LEVELS = [
  { name: "CAVERN ENTRANCE", moves: 30, target: 1000 },
  { name: "CRYSTAL VEIN", moves: 28, target: 1500 },
  { name: "SPARKLING DEPTHS", moves: 26, target: 2000 },
  { name: "AMETHYST HALL", moves: 25, target: 2500 },
  { name: "SAPPHIRE CHAMBER", moves: 24, target: 3000 },
  { name: "RUBY CORE", moves: 23, target: 3500 },
  { name: "EMERALD VAULT", moves: 22, target: 4000 },
  { name: "DIAMOND SANCTUM", moves: 21, target: 5000 },
  { name: "OPAL ABYSS", moves: 20, target: 6000 },
  { name: "PRISM THRONE", moves: 20, target: 7000, boss: true },
  { name: "QUARTZ LABYRINTH", moves: 19, target: 8000 },
  { name: "TOPAZ TUNNELS", moves: 19, target: 9000 },
  { name: "GARNET GROTTO", moves: 18, target: 10000 },
  { name: "PERIDOT PASSAGE", moves: 18, target: 11000 },
  { name: "AQUAMARINE ABYSS", moves: 17, target: 12000 },
  { name: "CITRINE CITADEL", moves: 17, target: 13000, boss: true },
  { name: "MOONSTONE MAZE", moves: 16, target: 14000 },
  { name: "ALEXANDRITE ARCHIVE", moves: 16, target: 15000 },
  { name: "TANZANITE TEMPLE", moves: 15, target: 16000 },
  { name: "ZIRCON ZENITH", moves: 15, target: 18000, boss: true },
  { name: "SPINEL SPIRE", moves: 14, target: 20000 },
  { name: "CHRYSOBERYL CRYPT", moves: 14, target: 22000 },
  { name: "PHENOKITE PALACE", moves: 13, target: 24000 },
  { name: "BENITOITE BASTION", moves: 13, target: 26000, boss: true },
  { name: "TAAFFEITE TOWER", moves: 12, target: 28000 },
  { name: "PAINITE PEAK", moves: 12, target: 30000 },
  { name: "RED BERYL REALM", moves: 11, target: 35000, boss: true },
  { name: "JADEITE JUNCTION", moves: 11, target: 40000 },
  { name: "SERENDIBITE SHRINE", moves: 10, target: 45000 },
  { name: "GRANDIDIERITE GATE", moves: 10, target: 50000, boss: true },
  { name: "MUSGRAVITE MIRAGE", moves: 9, target: 60000 },
  { name: "CRYSTAL CHAOS CORE", moves: 8, target: 75000, boss: true },
  { name: "INFINITE LATTICE", moves: 25, target: 100000 },
  { name: "ETERNAL GEODE", moves: 24, target: 125000 },
  { name: "CELESTIAL CRYSTAL", moves: 23, target: 150000 },
  { name: "VOID PRISM", moves: 22, target: 200000 },
  { name: "ASTRAL AMETHYST", moves: 21, target: 250000 },
  { name: "COSMIC CITRINE", moves: 20, target: 300000 },
  { name: "GALACTIC GARNET", moves: 19, target: 400000 },
  { name: "NEBULAR OPAL", moves: 18, target: 500000 },
  { name: "STELLAR SAPPHIRE", moves: 17, target: 750000 },
  { name: "QUASAR QUARTZ", moves: 16, target: 1000000 },
  { name: "PULSAR PERIDOT", moves: 15, target: 1500000 },
  { name: "MAGNETAR MOONSTONE", moves: 14, target: 2000000 },
  { name: "BLACK HOLE BERYL", moves: 13, target: 3000000 },
  { name: "EVENT HORIZON EMERALD", moves: 12, target: 5000000 },
  { name: "SINGULARITY SPINEL", moves: 10, target: 10000000 },
  { name: "OMEGA OBSIDIAN", moves: 8, target: 25000000 }
];

function generateCaveLighting() {
  caveLighting = [];
  for (let i = 0; i < 20; i++) {
    caveLighting.push({
      x: rand(0, 1), y: rand(0, 1),
      radius: rand(0.1, 0.3),
      color: `hsla(${rand(260, 320)}, 70%, ${rand(30, 60)}%, ${rand(0.1, 0.3)})`,
      pulse: rand(0, Math.PI * 2),
      speed: rand(0.2, 0.5)
    });
  }
}

function generateAmbientParticles() {
  ambientParticles = [];
  for (let i = 0; i < 50; i++) {
    ambientParticles.push({
      x: rand(0, 1), y: rand(0, 1),
      size: rand(0.5, 3),
      speed: rand(0.005, 0.02),
      angle: rand(0, Math.PI * 2),
      color: GEM_COLORS[randInt(0, GEM_COLORS.length - 1)],
      alpha: rand(0.1, 0.4)
    });
  }
}

function setGemPosition(gem, x, y) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const boardSize = Math.min(w, h) * 0.9;
  const startX = (w - boardSize) / 2;
  const startY = (h - boardSize) / 2;
  const cellSize = boardSize / COLS;
  
  gem.x = startX + x * cellSize + cellSize / 2;
  gem.y = startY + y * cellSize + cellSize / 2;
  gem.targetX = gem.x;
  gem.targetY = gem.y;
  gem.gridX = x;
  gem.gridY = y;
}

function getGemAtScreenPos(sx, sy) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const boardSize = Math.min(w, h) * 0.9;
  const startX = (w - boardSize) / 2;
  const startY = (h - boardSize) / 2;
  const cellSize = boardSize / COLS;
  
  const x = Math.floor((sx - startX) / cellSize);
  const y = Math.floor((sy - startY) / cellSize);
  
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
    return { x, y, gem: grid[y][x] };
  }
  return null;
}

function findMatches() {
  const matches = [];
  const matched = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
  
  // Horizontal
  for (let y = 0; y < ROWS; y++) {
    let x = 0;
    while (x < COLS) {
      let matchLen = 1;
      while (x + matchLen < COLS && 
             grid[y][x + matchLen] && 
             grid[y][x + matchLen].type === grid[y][x].type &&
             !grid[y][x + matchLen].boss) {
        matchLen++;
      }
      if (matchLen >= 3) {
        for (let i = 0; i < matchLen; i++) {
          matched[y][x + i] = true;
        }
        matches.push({ type: 'horizontal', x, y, length: matchLen, gems: [] });
        for (let i = 0; i < matchLen; i++) {
          matches[matches.length - 1].gems.push(grid[y][x + i]);
        }
      }
      x += matchLen;
    }
  }
  
  // Vertical
  for (let x = 0; x < COLS; x++) {
    let y = 0;
    while (y < ROWS) {
      let matchLen = 1;
      while (y + matchLen < ROWS && 
             grid[y + matchLen][x] && 
             grid[y + matchLen][x].type === grid[y][x].type &&
             !grid[y + matchLen][x].boss) {
        matchLen++;
      }
      if (matchLen >= 3) {
        for (let i = 0; i < matchLen; i++) {
          matched[y + i][x] = true;
        }
        matches.push({ type: 'vertical', x, y, length: matchLen, gems: [] });
        for (let i = 0; i < matchLen; i++) {
          matches[matches.length - 1].gems.push(grid[y + i][x]);
        }
      }
      y += matchLen;
    }
  }
  
  return { matches, matched };
}

function processMatches() {
  const { matches, matched } = findMatches();
  if (matches.length === 0) return false;
  
  let totalGemsCleared = 0;
  let specialsTriggered = [];
  
  for (const match of matches) {
    for (const gem of match.gems) {
      if (gem.matched) continue;
      gem.matched = true;
      totalGemsCleared++;
      
      if (gem.special) {
        specialsTriggered.push({ gem, type: gem.special, x: gem.gridX, y: gem.gridY });
      }
      if (gem.boss) {
        gem.health--;
        if (gem.health <= 0) {
          bossHealth = 0;
          screenShake.shake(20, 0.5);
        } else {
          gem.matched = false;
          screenShake.shake(10, 0.5);
          sfx.shield();
        }
      }
    }
  }
  
  // Process specials
  for (const sp of specialsTriggered) {
    triggerSpecial(sp.type, sp.x, sp.y);
  }
  
  // Check for new specials created by large matches
  for (const match of matches) {
    if (match.length >= 5) {
      const centerX = match.x + Math.floor(match.length / 2);
      const centerY = match.type === 'horizontal' ? match.y : match.y + Math.floor(match.length / 2);
      if (grid[centerY] && grid[centerY][centerX] && !grid[centerY][centerX].special && !grid[centerY][centerX].boss) {
        grid[centerY][centerX].special = SPECIAL_GEMS.BOMB;
      }
    } else if (match.length === 4) {
      const centerX = match.x + Math.floor(match.length / 2);
      const centerY = match.type === 'horizontal' ? match.y : match.y + Math.floor(match.length / 2);
      if (grid[centerY] && grid[centerY][centerX] && !grid[centerY][centerX].special && !grid[centerY][centerX].boss) {
        grid[centerY][centerX].special = match.type === 'horizontal' ? SPECIAL_GEMS.ROW_CLEAR : SPECIAL_GEMS.COL_CLEAR;
      }
    }
  }
  
  // Start clearing animation
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (matched[y][x] && grid[y][x] && !grid[y][x].boss) {
        grid[y][x].clearing = true;
        grid[y][x].clearDelay = rand(0, 0.2);
      }
    }
  }
  
  combo.add(matches.length);
  scoreSys.add(totalGemsCleared * 100 * combo.multiplier);
  totalCrystals += totalGemsCleared;
  
  // Particles and effects
  for (const match of matches) {
    for (const gem of match.gems) {
      const color = GEM_COLORS[gem.type];
      particles.burst(gem.x, gem.y, 25, {
        color, size: 6, life: 1, vx: rand(-5,5), vy: rand(-5,5), glow: true
      });
      glows.add(gem.x, gem.y, 60, color, 0.6);
    }
  }
  
  screenShake.shake(5 * matches.length, 0.8);
  sfx.combo();
  
  return true;
}

function triggerSpecial(type, x, y) {
  const cleared = [];
  
  if (type === SPECIAL_GEMS.ROW_CLEAR) {
    for (let i = 0; i < COLS; i++) {
      if (grid[y][i] && !grid[y][i].matched && !grid[y][i].boss) {
        grid[y][i].matched = true;
        grid[y][i].clearing = true;
        cleared.push(grid[y][i]);
      }
    }
    sfx.explosion();
    particles.burst(grid[y][x].x, grid[y][x].y, 40, {
      color: GEM_GLOWS[grid[y][x].type], size: 8, life: 1.5, vx: rand(-8,8), vy: rand(-8,8), glow: true
    });
    screenShake.shake(12, 0.7);
  } else if (type === SPECIAL_GEMS.COL_CLEAR) {
    for (let i = 0; i < ROWS; i++) {
      if (grid[i][x] && !grid[i][x].matched && !grid[i][x].boss) {
        grid[i][x].matched = true;
        grid[i][x].clearing = true;
        cleared.push(grid[i][x]);
      }
    }
    sfx.explosion();
    particles.burst(grid[y][x].x, grid[y][x].y, 40, {
      color: GEM_GLOWS[grid[y][x].type], size: 8, life: 1.5, vx: rand(-8,8), vy: rand(-8,8), glow: true
    });
    screenShake.shake(12, 0.7);
  } else if (type === SPECIAL_GEMS.BOMB) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] && !grid[ny][nx].matched && !grid[ny][nx].boss) {
          grid[ny][nx].matched = true;
          grid[ny][nx].clearing = true;
          cleared.push(grid[ny][nx]);
        }
      }
    }
    sfx.explosion();
    particles.burst(grid[y][x].x, grid[y][x].y, 50, {
      color: '#ffff00', size: 10, life: 2, vx: rand(-10,10), vy: rand(-10,10), glow: true
    });
    screenShake.shake(15, 0.6);
  } else if (type === SPECIAL_GEMS.RAINBOW) {
    // Rainbow clears all of one color - pick most common
    const counts = Array(GEM_TYPES).fill(0);
    for (let ry = 0; ry < ROWS; ry++) {
      for (let rx = 0; rx < COLS; rx++) {
        if (grid[ry][rx] && !grid[ry][rx].boss) counts[grid[ry][rx].type]++;
      }
    }
    const targetType = counts.indexOf(Math.max(...counts));
    for (let ry = 0; ry < ROWS; ry++) {
      for (let rx = 0; rx < COLS; rx++) {
        if (grid[ry][rx] && grid[ry][rx].type === targetType && !grid[ry][rx].matched && !grid[ry][rx].boss) {
          grid[ry][rx].matched = true;
          grid[ry][rx].clearing = true;
          cleared.push(grid[ry][rx]);
        }
      }
    }
    sfx.powerup();
    particles.burst(grid[y][x].x, grid[y][x].y, 60, {
      color: '#fff', size: 8, life: 2, vx: rand(-10,10), vy: rand(-10,10), glow: true
    });
    screenShake.shake(18, 0.7);
  }
  
  scoreSys.add(cleared.length * 50 * combo.multiplier);
  totalCrystals += cleared.length;
}

function applyGravity() {
  falling = false;
  for (let x = 0; x < COLS; x++) {
    let writeY = ROWS - 1;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y][x] && !grid[y][x].matched) {
        if (writeY !== y) {
          grid[writeY][x] = grid[y][x];
          grid[writeY][x].gridY = writeY;
          grid[y][x] = null;
          falling = true;
        }
        writeY--;
      } else if (grid[y][x] && grid[y][x].matched) {
        grid[y][x] = null;
      }
    }
    while (writeY >= 0) {
      const newGem = createGem(randInt(0, GEM_TYPES - 1));
      newGem.gridX = x;
      newGem.gridY = writeY;
      newGem.newGem = true;
      newGem.fallDelay = (ROWS - writeY) * 0.05;
      setGemPosition(newGem, x, writeY);
      newGem.y = newGem.targetY - (ROWS - writeY) * (canvas.height / (window.devicePixelRatio || 1) * 0.9 / ROWS);
      grid[writeY][x] = newGem;
      falling = true;
      writeY--;
    }
  }
}

function updateGems(dt) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const gem = grid[y][x];
      if (!gem) continue;
      
      gem.pulse += dt * 3;
      
      // Smooth movement to target
      const speed = 15;
      gem.x += (gem.targetX - gem.x) * Math.min(dt * speed, 1);
      gem.y += (gem.targetY - gem.y) * Math.min(dt * speed, 1);
      
      // Scale animation for new gems
      if (gem.newGem) {
        gem.scale = Math.min(1, gem.scale + dt * 5);
        if (gem.scale >= 1) gem.newGem = false;
      }
      
      // Clearing animation
      if (gem.clearing) {
        gem.clearDelay -= dt;
        if (gem.clearDelay <= 0) {
          gem.scale = Math.max(0, gem.scale - dt * 8);
          gem.rotation += dt * 10;
          if (gem.scale <= 0) {
            gem.clearing = false;
            gem.matched = false;
          }
        }
      }
      
      // Boss gem pulse
      if (gem.boss) {
        gem.scale = 1.1 + Math.sin(gem.pulse * 2) * 0.05;
      }
    }
  }
  
  // Handle swap animation
  if (swapping && swapData) {
    swapData.time += dt;
    const t = Math.min(swapData.time / 0.2, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    const gem1 = grid[swapData.y1][swapData.x1];
    const gem2 = grid[swapData.y2][swapData.x2];
    if (gem1 && gem2) {
      gem1.x = lerp(swapData.startX1, swapData.endX1, ease);
      gem1.y = lerp(swapData.startY1, swapData.endY1, ease);
      gem2.x = lerp(swapData.startX2, swapData.endX2, ease);
      gem2.y = lerp(swapData.startY2, swapData.endY2, ease);
    }
    
    if (t >= 1) {
      swapping = false;
      swapData = null;
      
      // Check if match created
      const { matches } = findMatches();
      if (matches.length === 0) {
        // Swap back
        const temp = grid[swapData.y1][swapData.x1];
        grid[swapData.y1][swapData.x1] = grid[swapData.y2][swapData.x2];
        grid[swapData.y2][swapData.x2] = temp;
        swapBack(swapData);
      } else {
        moves++;
        processMatches();
      }
    }
  }
}

function swapBack(data) {
  const gem1 = grid[data.y1][data.x1];
  const gem2 = grid[data.y2][data.x2];
  if (!gem1 || !gem2) return;
  
  swapping = true;
  swapData = {
    ...data,
    time: 0,
    startX1: gem1.x, startY1: gem1.y,
    endX1: data.startX1, endY1: data.startY1,
    startX2: gem2.x, startY2: gem2.y,
    endX2: data.startX2, endY2: data.startY2
  };
}

function checkGameState() {
  if (moves >= maxMoves) {
    // Check if any moves possible
    let hasMoves = false;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (x < COLS - 1) {
          // Try swap right
          [grid[y][x], grid[y][x+1]] = [grid[y][x+1], grid[y][x]];
          const { matches } = findMatches();
          [grid[y][x], grid[y][x+1]] = [grid[y][x+1], grid[y][x]];
          if (matches.length > 0) hasMoves = true;
        }
        if (y < ROWS - 1) {
          // Try swap down
          [grid[y][x], grid[y+1][x]] = [grid[y+1][x], grid[y][x]];
          const { matches } = findMatches();
          [grid[y][x], grid[y+1][x]] = [grid[y+1][x], grid[y][x]];
          if (matches.length > 0) hasMoves = true;
        }
      }
    }
    if (!hasMoves) {
      // Shuffle
      shuffleBoard();
      moves = 0;
    } else {
      state = 'gameover';
      stopMusic();
      const { best, isNewBest } = bestScore('crystal-chaos', Math.floor(scoreSys.getScore()));
      saveGameState('crystal-chaos', { totalCrystals, perfectClears, puzzlesSolved, highScore: best, maxLevel: level });
      $('#final-score').textContent = Math.floor(scoreSys.getScore());
      $('#final-stats').innerHTML = `
        <div class="final-stat">Level: ${level}</div>
        <div class="final-stat">Crystals: ${totalCrystals}</div>
        <div class="final-stat">Perfect Clears: ${perfectClears}</div>
        <div class="final-stat">Time: ${timer.getFormatted()}</div>
        ${isNewBest ? '<div class="new-best">NEW HIGH SCORE!</div>' : ''}
      `;
      $('#gameover-overlay').style.display = 'flex';
    }
  }
  
  // Check level complete
  const lvl = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  if (scoreSys.getScore() >= lvl.target) {
    levelComplete();
  }
}

function levelComplete() {
  state = 'levelcomplete';
  timer.stop();
  puzzlesSolved++;
  
  const remainingMoves = maxMoves - moves;
  const moveBonus = remainingMoves * 500;
  const comboBonus = combo.maxCombo * 200;
  const totalBonus = moveBonus + comboBonus;
  scoreSys.add(totalBonus);
  
  if (remainingMoves === maxMoves) {
    perfectClears++;
    achievements.unlock('perfect', 'Perfect Clear', 'Complete a level without using any moves', '◇');
  }
  
  textParts.add(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), `+${totalBonus} BONUS`, { color: '#ffff00', size: 32, glow: true });
  particles.burst(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), 80, {
    color: '#00d4ff', size: 10, life: 2, vx: rand(-12,12), vy: rand(-12,12), glow: true
  });
  screenShake.shake(15, 0.7);
  sfx.win();
  
  $('#level-score').textContent = `Score: ${Math.floor(scoreSys.getScore())}`;
  $('#level-stats').innerHTML = `
    <div class="stage-stat">Moves Left: ${remainingMoves} (+${moveBonus})</div>
    <div class="stage-stat">Max Combo: ${combo.maxCombo}x (+${comboBonus})</div>
    <div class="stage-stat">Time: ${timer.getFormatted()}</div>
  `;
  $('#level-complete-overlay').style.display = 'flex';
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

function shuffleBoard() {
  const allGems = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] && !grid[y][x].boss) {
        allGems.push(grid[y][x]);
        grid[y][x] = null;
      }
    }
  }
  
  // Shuffle
  for (let i = allGems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
  }
  
  // Place back
  let idx = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!grid[y][x]) {
        const gem = allGems[idx++];
        if (gem) {
          gem.gridX = x;
          gem.gridY = y;
          gem.newGem = true;
          gem.scale = 0;
          gem.fallDelay = (ROWS - y) * 0.05;
          setGemPosition(gem, x, y);
          gem.y = gem.targetY - (ROWS - y) * (canvas.height / (window.devicePixelRatio || 1) * 0.9 / ROWS);
          grid[y][x] = gem;
        }
      }
    }
  }
  
  sfx.shield();
  particles.burst(canvas.width / 2 / (window.devicePixelRatio || 1), canvas.height / 2 / (window.devicePixelRatio || 1), 50, {
    color: '#7c5cff', size: 8, life: 1.5, vx: rand(-10,10), vy: rand(-10,10), glow: true
  });
  screenShake.shake(10, 0.7);
}

function updateCaveLighting(dt) {
  for (const light of caveLighting) {
    light.pulse += dt * light.speed;
  }
}

function updateAmbientParticles(dt) {
  for (const p of ambientParticles) {
    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;
    if (p.x < -0.1) p.x = 1.1;
    if (p.x > 1.1) p.x = -0.1;
    if (p.y < -0.1) p.y = 1.1;
    if (p.y > 1.1) p.y = -0.1;
  }
}

function update(dt) {
  if (state === 'menu' || state === 'paused') return;
  
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  
  if (state === 'playing') {
    timer.update(dt);
    updateGems(dt);
    updateCaveLighting(dt);
    updateAmbientParticles(dt);
    combo.update(dt);
    checkGameState();
    
    if (!swapping && !falling) {
      const hasMatches = processMatches();
      if (!hasMatches) {
        applyGravity();
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

function drawGem(ctx, gem, w, h) {
  if (!gem || gem.scale <= 0) return;
  
  ctx.save();
  ctx.translate(gem.x, gem.y);
  ctx.rotate(gem.rotation);
  ctx.scale(gem.scale, gem.scale);
  
  const size = (Math.min(w, h) * 0.9 / COLS) * 0.45;
  const color = GEM_COLORS[gem.type];
  const glowColor = GEM_GLOWS[gem.type];
  
  // Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15 * gem.scale;
  
  // Gem shape - faceted crystal
  const facets = 6;
  const innerSize = size * 0.5;
  
  // Outer glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
  grad.addColorStop(0, glowColor.replace(')', `, ${0.4 * gem.scale})`).replace('rgb', 'rgba').replace('hsl', 'hsla'));
  grad.addColorStop(1, glowColor.replace(')', ', 0)').replace('rgb', 'rgba').replace('hsl', 'hsla'));
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
    const r = size * 1.3;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Main crystal body
  const bodyGrad = ctx.createLinearGradient(-size, -size, size, size);
  bodyGrad.addColorStop(0, color);
  bodyGrad.addColorStop(0.3, lerpColor(color, '#fff', 0.4));
  bodyGrad.addColorStop(0.7, color);
  bodyGrad.addColorStop(1, lerpColor(color, '#000', 0.3));
  ctx.fillStyle = bodyGrad;
  ctx.shadowBlur = 10 * gem.scale;
  
  ctx.beginPath();
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
    const r = size;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Inner reflection
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
    const r = innerSize;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Facet lines
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
    const x1 = Math.cos(angle) * innerSize;
    const y1 = Math.sin(angle) * innerSize;
    const x2 = Math.cos(angle) * size;
    const y2 = Math.sin(angle) * size;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  
  // Center highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(0, 0, innerSize * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Special gem indicators
  if (gem.special) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size * 0.8}px Sora, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbols = {
      [SPECIAL_GEMS.ROW_CLEAR]: '⟷',
      [SPECIAL_GEMS.COL_CLEAR]: '⟱',
      [SPECIAL_GEMS.BOMB]: '✦',
      [SPECIAL_GEMS.RAINBOW]: '✧'
    };
    ctx.fillText(symbols[gem.special] || '★', 0, 0);
    ctx.shadowBlur = 0;
  }
  
  // Boss gem
  if (gem.boss) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0066';
    ctx.strokeStyle = '#ff0066';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Health bars
    for (let i = 0; i < gem.health; i++) {
      ctx.fillStyle = '#ff0066';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(Math.cos(i * Math.PI * 2 / 3) * size * 1.5, Math.sin(i * Math.PI * 2 / 3) * size * 1.5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  
  // Clearing effect
  if (gem.clearing && gem.clearDelay <= 0) {
    ctx.globalAlpha = gem.scale;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    for (let i = 0; i < facets; i++) {
      const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
      const r = size * (2 - gem.scale);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  ctx.restore();
}

function drawBoard(ctx, w, h) {
  const boardSize = Math.min(w, h) * 0.9;
  const startX = (w - boardSize) / 2;
  const startY = (h - boardSize) / 2;
  
  // Board background
  const grad = ctx.createLinearGradient(startX, startY, startX + boardSize, startY + boardSize);
  grad.addColorStop(0, '#0a0510');
  grad.addColorStop(0.5, '#100515');
  grad.addColorStop(1, '#0a0510');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#7c5cff';
  ctx.shadowBlur = 30;
  roundRect(ctx, startX - 10, startY - 10, boardSize + 20, boardSize + 20, 20);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Grid lines
  ctx.strokeStyle = 'rgba(124, 92, 255, 0.1)';
  ctx.lineWidth = 1;
  const cellSize = boardSize / COLS;
  for (let i = 1; i < COLS; i++) {
    const x = startX + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + boardSize);
    ctx.stroke();
  }
  for (let i = 1; i < ROWS; i++) {
    const y = startY + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + boardSize, y);
    ctx.stroke();
  }
  
  // Cave lighting
  for (const light of caveLighting) {
    const lx = startX + light.x * boardSize;
    const ly = startY + light.y * boardSize;
    const lr = light.radius * boardSize * (0.8 + Math.sin(light.pulse) * 0.2);
    
    const lgrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lgrad.addColorStop(0, light.color);
    lgrad.addColorStop(1, light.color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = lgrad;
    ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  }
}

function drawAmbientParticles(ctx, w, h) {
  const boardSize = Math.min(w, h) * 0.9;
  const startX = (w - boardSize) / 2;
  const startY = (h - boardSize) / 2;
  
  for (const p of ambientParticles) {
    const px = startX + p.x * boardSize;
    const py = startY + p.y * boardSize;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

function drawHUD(ctx, w, h) {
  // Level
  const lvl = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 20px Sora, sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 10;
  ctx.fillText(lvl.name, 20, 35);
  ctx.shadowBlur = 0;
  
  // Moves
  ctx.fillStyle = '#fff';
  ctx.font = '16px Sora, sans-serif';
  ctx.fillText(`Moves: ${moves}/${maxMoves}`, 20, 55);
  
  // Target score
  ctx.fillStyle = '#00d4ff';
  ctx.font = '14px Sora, sans-serif';
  ctx.fillText(`Target: ${lvl.target.toLocaleString()}`, 20, 75);
  
  // Boss health
  if (bossActive && bossGem) {
    ctx.fillStyle = '#ff0066';
    ctx.font = 'bold 18px Sora, sans-serif';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'right';
    ctx.fillText(`BOSS HP: ${bossHealth}/${bossMaxHealth}`, w - 20, 35);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
  
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Sora, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(scoreSys.getScore()).toLocaleString(), w - 20, h - 30);
  
  // Combo
  if (combo.active) {
    ctx.fillStyle = '#ff0066';
    ctx.font = 'bold 20px Sora, sans-serif';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.fillText(`${combo.combo}x COMBO`, w - 20, h - 60);
    ctx.shadowBlur = 0;
  }
  
  ctx.textAlign = 'start';
}

function drawSelection(ctx, w, h) {
  if (selectedGem) {
    const size = (Math.min(w, h) * 0.9 / COLS) * 0.5;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.setLineDash([5, 5]);
    roundRect(ctx, selectedGem.x - size, selectedGem.y - size, size * 2, size * 2, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
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

function draw(w, h) {
  const shake = screenShake.getOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  ctx.clearRect(0, 0, w, h);
  
  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#050510');
  bgGrad.addColorStop(0.5, '#0a0515');
  bgGrad.addColorStop(1, '#050510');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  
  drawAmbientParticles(ctx, w, h);
  drawBoard(ctx, w, h);
  
  // Draw gems
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) drawGem(ctx, grid[y][x], w, h);
    }
  }
  
  drawSelection(ctx, w, h);
  
  particles.draw(ctx);
  textParts.draw(ctx);
  glows.draw(ctx);
  trail.draw(ctx);
  
  drawHUD(ctx, w, h);
  
  ctx.restore();
}

function startGame(isDaily = false) {
  if (isDaily) {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    Math.seedrandom = (s) => { let sd = s; Math.random = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }; };
    Math.seedrandom(seed);
    level = randInt(5, 25);
  } else {
    const saved = loadGameState('crystal-chaos');
    if (saved && saved.maxLevel) {
      level = Math.min(saved.maxLevel, maxLevel);
    } else {
      level = 1;
    }
    Math.random = Math.random;
  }
  
  totalCrystals = 0;
  perfectClears = 0;
  puzzlesSolved = 0;
  scoreSys.reset();
  generateLevel(level);
  state = 'playing';
  timer.start();
  
  playMusic('crystal-chaos', [
    [220, 1, 'sine', 0.04],
    [261, 1, 'sine', 0.04],
    [329, 1, 'sine', 0.04],
    [392, 1, 'sine', 0.04],
    [329, 1, 'sine', 0.04],
    [261, 1, 'sine', 0.04],
    [220, 1, 'sine', 0.04],
    [196, 1, 'sine', 0.04]
  ], 70);
  
  $('#overlay').style.display = 'none';
  $('#btn-continue').style.display = 'block';
}

function updateStats() {
  const saved = loadGameState('crystal-chaos') || {};
  $('#stat-best').textContent = saved.highScore ? saved.highScore.toLocaleString() : '0';
  $('#stat-combo').textContent = (saved.bestCombo || 0) + 'x';
  $('#stat-crystals').textContent = (saved.totalCrystals || 0).toLocaleString();
  $('#stat-solved').textContent = (saved.puzzlesSolved || 0).toLocaleString();
  $('#stat-perfect').textContent = (saved.perfectClears || 0).toLocaleString();
  $('#stat-time').textContent = formatTime(saved.totalTime || 0);
}

function formatTime(ms) {
  const m = Math.floor(ms / 60);
  const s = Math.floor(ms % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateDailyDisplay() {
  const today = new Date();
  $('#daily-date').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const mods = ['LIMITED MOVES', 'BOSS LEVEL', 'NO SPECIALS', 'TIME ATTACK', 'CHAIN ONLY'];
  $('#daily-mods').innerHTML = mods.slice(0, 3).map(m => `<span class="mod-tag">${m}</span>`).join('');
}

$('#btn-play').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-daily').addEventListener('click', () => { sfx.click(); updateDailyDisplay(); $('#daily-overlay').style.display = 'flex'; });
$('#btn-continue').addEventListener('click', () => { sfx.click(); startGame(false); });
$('#btn-daily-play').addEventListener('click', () => { sfx.click(); $('#daily-overlay').style.display = 'none'; startGame(true); });
$('#btn-daily-close').addEventListener('click', () => { sfx.click(); $('#daily-overlay').style.display = 'none'; });

$('#btn-resume').addEventListener('click', () => { sfx.click(); state = 'playing'; timer.start(); playMusic('crystal-chaos', [], 70); $('#pause-overlay').style.display = 'none'; });
$('#btn-restart').addEventListener('click', () => { sfx.click(); restartLevel(); $('#pause-overlay').style.display = 'none'; });
$('#btn-menu').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#pause-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

$('#btn-next-level').addEventListener('click', () => { sfx.click(); nextLevel(); $('#level-complete-overlay').style.display = 'none'; });
$('#btn-menu2').addEventListener('click', () => { sfx.click(); state = 'menu'; stopMusic(); $('#level-complete-overlay').style.display = 'none'; $('#overlay').style.display = 'flex'; updateStats(); });

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

$('#set-music').addEventListener('change', (e) => { settings.set('music', e.target.checked); if (!e.target.checked) stopMusic(); else if (state === 'playing') playMusic('crystal-chaos', [], 70); });
$('#set-sfx').addEventListener('change', (e) => { settings.set('sfx', e.target.checked); });
$('#set-shake').addEventListener('change', (e) => { settings.set('screenShake', e.target.checked); });
$('#set-particles').addEventListener('change', (e) => { settings.set('particles', e.target.value); });
$('#set-difficulty').addEventListener('change', (e) => { settings.set('difficulty', e.target.value); });
$('#set-fullscreen').addEventListener('change', (e) => {
  settings.set('fullscreen', e.target.checked);
  if (e.target.checked) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Touch/mouse handling
let dragStart = null;

canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'playing' || swapping || falling) return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const result = getGemAtScreenPos(sx, sy);
  if (result && result.gem && !result.gem.clearing && !result.gem.matched) {
    dragStart = { x: result.x, y: result.y, gem: result.gem, startX: sx, startY: sy };
    selectedGem = result.gem;
    sfx.click();
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragStart || state !== 'playing' || swapping || falling) return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  
  const dx = sx - dragStart.startX;
  const dy = sy - dragStart.startY;
  const threshold = 30;
  
  if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
    let targetX = dragStart.x;
    let targetY = dragStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      targetX += dx > 0 ? 1 : -1;
    } else {
      targetY += dy > 0 ? 1 : -1;
    }
    
    if (targetX >= 0 && targetX < COLS && targetY >= 0 && targetY < ROWS) {
      const targetGem = grid[targetY][targetX];
      if (targetGem && !targetGem.clearing && !targetGem.matched) {
        // Swap
        const gem1 = grid[dragStart.y][dragStart.x];
        const gem2 = grid[targetY][targetX];
        
        swapping = true;
        swapData = {
          x1: dragStart.x, y1: dragStart.y,
          x2: targetX, y2: targetY,
          startX1: gem1.x, startY1: gem1.y,
          endX1: gem2.x, endY1: gem2.y,
          startX2: gem2.x, startY2: gem2.y,
          endX2: gem1.x, endY2: gem1.y,
          time: 0
        };
        
        [grid[dragStart.y][dragStart.x], grid[targetY][targetX]] = [grid[targetY][targetX], grid[dragStart.y][dragStart.x]];
        grid[dragStart.y][dragStart.x].gridX = dragStart.x;
        grid[dragStart.y][dragStart.x].gridY = dragStart.y;
        grid[targetY][targetX].gridX = targetX;
        grid[targetY][targetX].gridY = targetY;
        
        dragStart = null;
        selectedGem = null;
      }
    }
  }
});

canvas.addEventListener('pointerup', () => {
  dragStart = null;
});

canvas.addEventListener('pointerleave', () => {
  dragStart = null;
});

canvas.addEventListener('click', (e) => {
  if (state !== 'playing' || swapping || falling) return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const result = getGemAtScreenPos(sx, sy);
  if (result && result.gem && !result.gem.clearing && !result.gem.matched) {
    if (selectedGem === result.gem) {
      selectedGem = null;
    } else if (selectedGem) {
      // Check if adjacent
      const dx = Math.abs(result.x - selectedGem.gridX);
      const dy = Math.abs(result.y - selectedGem.gridY);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        // Swap
        const gem1 = grid[selectedGem.gridY][selectedGem.gridX];
        const gem2 = grid[result.y][result.x];
        
        swapping = true;
        swapData = {
          x1: selectedGem.gridX, y1: selectedGem.gridY,
          x2: result.x, y2: result.y,
          startX1: gem1.x, startY1: gem1.y,
          endX1: gem2.x, endY1: gem2.y,
          startX2: gem2.x, startY2: gem2.y,
          endX2: gem1.x, endY2: gem1.y,
          time: 0
        };
        
        [grid[selectedGem.gridY][selectedGem.gridX], grid[result.y][result.x]] = [grid[result.y][result.x], grid[selectedGem.gridY][selectedGem.gridX]];
        grid[selectedGem.gridY][selectedGem.gridX].gridX = selectedGem.gridX;
        grid[selectedGem.gridY][selectedGem.gridX].gridY = selectedGem.gridY;
        grid[result.y][result.x].gridX = result.x;
        grid[result.y][result.x].gridY = result.y;
        
        selectedGem = null;
      } else {
        selectedGem = result.gem;
      }
    } else {
      selectedGem = result.gem;
    }
    sfx.click();
  } else if (selectedGem) {
    selectedGem = null;
  }
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
      playMusic('crystal-chaos', [], 70);
      $('#pause-overlay').style.display = 'none';
    }
  }
  if (e.key === 'z' || e.key === 'Z') {
    // Undo - shuffle
    if (state === 'playing' && !swapping && !falling) {
      shuffleBoard();
      sfx.move();
    }
  }
});

createLoop(update);
updateStats();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../../assets/js/service-worker.js', { scope: '../../..' }).catch(() => {});
}