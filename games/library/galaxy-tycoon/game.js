/**
 * Galaxy Tycoon — idle resource management sim. Tap to mine, buy
 * generators for passive income. Original code, plain DOM.
 * Progress persists in localStorage so a return visit continues the save.
 */
import { $ } from '../shared/engine.js';

const SAVE_KEY = 'arcyn-galaxy-tycoon-save';

const BUILDINGS = [
  { id: 'panel', name: 'Solar Panel', desc: '+0.5 energy/sec', baseCost: 10, rate: 0.5 },
  { id: 'drone', name: 'Mining Drone', desc: '+3 energy/sec', baseCost: 50, rate: 3 },
  { id: 'station', name: 'Space Station', desc: '+12 energy/sec', baseCost: 220, rate: 12 },
  { id: 'core', name: 'Fusion Core', desc: '+60 energy/sec', baseCost: 1000, rate: 60 }
];

let energy = 0;
let owned = {};
let clickPower = 1;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved) {
      energy = saved.energy || 0;
      owned = saved.owned || {};
    }
  } catch {
    /* corrupt or unavailable save — start fresh */
  }
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ energy, owned }));
  } catch {
    /* localStorage unavailable — progress just won't persist */
  }
}

function costFor(building) {
  const n = owned[building.id] || 0;
  return Math.round(building.baseCost * Math.pow(1.15, n));
}

function totalRate() {
  return BUILDINGS.reduce((sum, b) => sum + (owned[b.id] || 0) * b.rate, 0);
}

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString();
}

function renderShop() {
  const shop = $('#shop');
  shop.innerHTML = BUILDINGS.map((b) => {
    const cost = costFor(b);
    const count = owned[b.id] || 0;
    const affordable = energy >= cost;
    return `
      <div class="shop-item${affordable ? '' : ' disabled'}">
        <div class="shop-item__info">
          <strong>${b.name} <span style="color:var(--g-cyan);">x${count}</span></strong>
          <span>${b.desc} · cost ${formatNumber(cost)}</span>
        </div>
        <button data-buy="${b.id}" ${affordable ? '' : 'disabled'}>Buy</button>
      </div>
    `;
  }).join('');

  shop.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', () => buy(btn.dataset.buy));
  });
}

function buy(id) {
  const building = BUILDINGS.find((b) => b.id === id);
  const cost = costFor(building);
  if (energy < cost) return;
  energy -= cost;
  owned[id] = (owned[id] || 0) + 1;
  renderAll();
  save();
}

function renderAll() {
  $('#energy').textContent = formatNumber(energy);
  $('#rate').textContent = formatNumber(totalRate());
  renderShop();
}

$('#mine-btn').addEventListener('click', () => {
  energy += clickPower;
  renderAll();
});

let lastTick = performance.now();
function tick(now) {
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  energy += totalRate() * dt;
  renderAll();
  requestAnimationFrame(tick);
}

let autosaveTimer;

function start() {
  $('#overlay').hidden = true;
  load();
  renderAll();
  lastTick = performance.now();
  requestAnimationFrame(tick);
  clearInterval(autosaveTimer);
  autosaveTimer = setInterval(save, 5000);
}

$('#start-btn').addEventListener('click', start);
window.addEventListener('beforeunload', save);

load();
renderAll();
