/**
 * Battleship — local 2-player hot-seat. Manual placement (click to place,
 * toggle orientation) plus a one-tap "Randomize Fleet" shortcut, with a
 * pass-the-device gate screen between phases so players can't see each
 * other's board. Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const GAME_ID = 'battleship';
const SIZE = 8;
const FLEET = [{ name: 'Carrier', size: 4 }, { name: 'Cruiser', size: 3 }, { name: 'Sub', size: 2 }, { name: 'Patrol', size: 2 }];

let players, phase, current, orientation, placingIndex;

function idx(x, y) {
  return y * SIZE + x;
}

function emptyGrid() {
  return Array(SIZE * SIZE).fill(null);
}

function newPlayerState() {
  return { ships: emptyGrid(), shots: emptyGrid(), fleetCells: new Map() }; // fleetCells: shipId -> Set of cell indices remaining
}

function reset() {
  players = { 1: newPlayerState(), 2: newPlayerState() };
  phase = 'setup';
  current = 1;
  orientation = 'h';
  placingIndex = 0;
  $('#overlay').hidden = true;
  updateStats();
  renderSetup();
}

function updateStats() {
  const s = getStats(GAME_ID);
  $('#phase-indicator').textContent = `Player 1: Place Ships`;
}

function canPlace(grid, x, y, size, dir) {
  for (let i = 0; i < size; i++) {
    const cx = dir === 'h' ? x + i : x;
    const cy = dir === 'h' ? y : y + i;
    if (cx >= SIZE || cy >= SIZE) return false;
    if (grid[idx(cx, cy)]) return false;
  }
  return true;
}

function placeShip(grid, fleetCells, shipId, x, y, size, dir) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    const cx = dir === 'h' ? x + i : x;
    const cy = dir === 'h' ? y : y + i;
    grid[idx(cx, cy)] = shipId;
    cells.push(idx(cx, cy));
  }
  fleetCells.set(shipId, new Set(cells));
}

function randomizeFleet(player) {
  const state = players[player];
  state.ships = emptyGrid();
  state.fleetCells = new Map();
  FLEET.forEach((ship, shipId) => {
    let placed = false;
    while (!placed) {
      const dir = Math.random() < 0.5 ? 'h' : 'v';
      const x = Math.floor(Math.random() * SIZE);
      const y = Math.floor(Math.random() * SIZE);
      if (canPlace(state.ships, x, y, ship.size, dir)) {
        placeShip(state.ships, state.fleetCells, shipId, x, y, ship.size, dir);
        placed = true;
      }
    }
  });
  placingIndex = FLEET.length;
}

function renderSetup() {
  $('#phase-indicator').textContent = `Player ${current}: Place Ships`;
  const state = players[current];
  const board = $('#board');
  board.innerHTML = '';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (state.ships[idx(x, y)] !== null) cell.classList.add('ship');
      cell.addEventListener('click', () => handlePlacementClick(x, y));
      board.appendChild(cell);
    }
  }

  const fleetRow = $('#fleet-row');
  fleetRow.innerHTML = FLEET.map((ship, i) => `<span class="fleet-chip${i < placingIndex ? ' placed' : ''}">${ship.name} (${ship.size})</span>`).join('');

  const controls = $('#controls-row');
  controls.innerHTML = `
    <button class="option-btn is-active" id="orient-btn">Orientation: ${orientation === 'h' ? 'Horizontal' : 'Vertical'}</button>
    <button class="option-btn" id="random-btn">Randomize Fleet</button>
    ${placingIndex >= FLEET.length ? '<button class="option-btn" id="ready-btn" style="background:var(--g-gradient);color:#fff;">Ready →</button>' : ''}
  `;
  $('#orient-btn').addEventListener('click', () => {
    orientation = orientation === 'h' ? 'v' : 'h';
    renderSetup();
  });
  $('#random-btn').addEventListener('click', () => {
    randomizeFleet(current);
    sfx.click();
    renderSetup();
  });
  $('#ready-btn')?.addEventListener('click', proceedFromSetup);
}

function handlePlacementClick(x, y) {
  if (placingIndex >= FLEET.length) return;
  const state = players[current];
  const ship = FLEET[placingIndex];
  if (!canPlace(state.ships, x, y, ship.size, orientation)) {
    sfx.invalid();
    return;
  }
  placeShip(state.ships, state.fleetCells, placingIndex, x, y, ship.size, orientation);
  placingIndex++;
  sfx.place();
  renderSetup();
}

function proceedFromSetup() {
  if (current === 1) {
    current = 2;
    placingIndex = 0;
    orientation = 'h';
    showGate('Pass the device to Player 2', 'Player 2 will place their fleet next.', renderSetup);
  } else {
    current = 1;
    phase = 'battle';
    showGate('Fleets Deployed!', 'Pass the device to Player 1 to begin the battle.', renderBattle);
  }
}

function showGate(title, message, onContinue) {
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<div class="gate"><h1>${title}</h1><p>${message}</p><button class="g-btn" id="gate-btn">Continue</button></div>`;
  $('#gate-btn').addEventListener('click', () => {
    overlay.hidden = true;
    onContinue();
  });
}

function opponent(p) {
  return p === 1 ? 2 : 1;
}

function renderBattle() {
  $('#phase-indicator').textContent = `Player ${current}'s Turn — Fire!`;
  const target = players[opponent(current)];
  const board = $('#board');
  board.innerHTML = '';

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = idx(x, y);
      const cell = document.createElement('div');
      cell.className = 'cell';
      const shot = target.shots[i];
      if (shot === 'hit') {
        const shipId = target.ships[i];
        const sunk = shipId !== null && target.fleetCells.get(shipId).size === 0;
        cell.classList.add(sunk ? 'sunk' : 'hit');
      } else if (shot === 'miss') {
        cell.classList.add('miss');
      } else {
        cell.addEventListener('click', () => fire(x, y));
      }
      board.appendChild(cell);
    }
  }
  $('#fleet-row').innerHTML = FLEET.map((ship, id) => {
    const remaining = target.fleetCells.get(id)?.size ?? 0;
    return `<span class="fleet-chip${remaining === 0 ? ' placed' : ''}">${ship.name}</span>`;
  }).join('');
  $('#controls-row').innerHTML = '';
}

function fire(x, y) {
  const target = players[opponent(current)];
  const i = idx(x, y);
  if (target.shots[i]) return;

  const shipId = target.ships[i];
  if (shipId !== null) {
    target.shots[i] = 'hit';
    target.fleetCells.get(shipId).delete(i);
    sfx.pop();
    if (target.fleetCells.get(shipId).size === 0) sfx.win();
  } else {
    target.shots[i] = 'miss';
    sfx.invalid();
  }

  const fleetSunk = [...target.fleetCells.values()].every((set) => set.size === 0);
  if (fleetSunk) return endGame(current);

  renderBattle();
  const nextPlayer = opponent(current);
  showGate(`Player ${current} fired!`, shipId !== null ? 'Direct hit! Pass the device.' : 'Miss. Pass the device.', () => {
    current = nextPlayer;
    renderBattle();
  });
}

function endGame(winner) {
  recordResult(GAME_ID, 'win'); // hot-seat game — tracked as a completed match, not per-player W/L
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>Player ${winner} Wins!</h1><p>The enemy fleet has been sunk.</p><button class="g-btn" id="start-btn">Play Again</button>`;
  $('#start-btn').addEventListener('click', reset);
}

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

players = { 1: newPlayerState(), 2: newPlayerState() };
current = 1;
orientation = 'h';
placingIndex = 0;
renderSetup();
