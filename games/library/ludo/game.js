/**
 * Ludo — 2-4 player local hot-seat. Rendered as an original stylized ring
 * track (rather than a literal cross-shaped board) so the path geometry
 * is generated parametrically and can't drift out of sync with the game
 * logic. Gameplay follows standard Ludo rules: roll a 6 to leave the
 * yard, exact rolls to reach home, captures off safe squares, an extra
 * turn on 6 or a capture or reaching home. Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult } from '../shared/engine.js';

const GAME_ID = 'ludo';
const RING_LEN = 52;
const ARM = RING_LEN / 4; // 13
const HOME_STEPS = 6;
const TOTAL_STEPS = ARM * 4 / 4 + HOME_STEPS; // placeholder, real max computed below
const MAX_POS = 50 + HOME_STEPS; // 0..50 shared ring relative positions, 51..56 home stretch, 56 = home

const COLORS = [
  { name: 'Red', hex: '#ff5c8a', start: 0, corner: 'tl' },
  { name: 'Blue', hex: '#22d3ee', start: 13, corner: 'tr' },
  { name: 'Green', hex: '#35e0a1', start: 26, corner: 'br' },
  { name: 'Yellow', hex: '#ffb444', start: 39, corner: 'bl' }
];
const SAFE_ABS = [0, 13, 26, 39];

let numPlayers = 3;
let activeColors, players, current, dieValue, sixStreak, over;

function reset() {
  activeColors = numPlayers === 2 ? [0, 2] : COLORS.slice(0, numPlayers).map((_, i) => i);
  players = activeColors.map((colorIdx) => ({ colorIdx, tokens: [-1, -1, -1, -1] }));
  current = 0;
  dieValue = null;
  sixStreak = 0;
  over = false;
  $('#overlay').hidden = true;
  updateTurnLabel();
  render();
}

function ringPoint(absIndex) {
  const side = Math.floor(absIndex / ARM);
  const t = (absIndex % ARM) / ARM;
  const pad = 0.06, span = 1 - pad * 2;
  if (side === 0) return { x: pad + t * span, y: pad };
  if (side === 1) return { x: 1 - pad, y: pad + t * span };
  if (side === 2) return { x: 1 - pad - t * span, y: 1 - pad };
  return { x: pad, y: 1 - pad - t * span };
}

function homePoint(colorIdx, relPos) {
  const start = COLORS[colorIdx].start;
  const ring = ringPoint(start);
  const t = (relPos - 50) / (HOME_STEPS + 1);
  return { x: ring.x + (0.5 - ring.x) * t, y: ring.y + (0.5 - ring.y) * t };
}

function yardPoint(colorIdx, slot) {
  const corners = { tl: [0.14, 0.14], tr: [0.86, 0.14], br: [0.86, 0.86], bl: [0.14, 0.86] };
  const [cx, cy] = corners[COLORS[colorIdx].corner];
  const dx = slot % 2 === 0 ? -0.045 : 0.045;
  const dy = slot < 2 ? -0.045 : 0.045;
  return { x: cx + dx, y: cy + dy };
}

function tokenPixel(colorIdx, pos, slot) {
  if (pos === -1) return yardPoint(colorIdx, slot);
  if (pos <= 50) return ringPoint((COLORS[colorIdx].start + pos) % RING_LEN);
  return homePoint(colorIdx, pos);
}

function updateTurnLabel() {
  if (over) return;
  const p = players[current];
  $('#turn-indicator').textContent = `${COLORS[p.colorIdx].name}'s turn`;
}

function movableTokens(player) {
  const list = [];
  player.tokens.forEach((pos, i) => {
    if (pos === -1 && dieValue === 6) list.push(i);
    else if (pos >= 0 && pos < 56 && pos + dieValue <= 56) list.push(i);
  });
  return list;
}

function rollDie() {
  if (dieValue !== null || over) return;
  const die = $('#die-btn');
  die.classList.add('rolling');
  sfx.click();
  setTimeout(() => {
    dieValue = 1 + Math.floor(Math.random() * 6);
    die.textContent = '⚀⚁⚂⚃⚄⚅'[dieValue - 1];
    die.classList.remove('rolling');
    const movable = movableTokens(players[current]);
    if (!movable.length) {
      $('#die-hint').textContent = 'No moves — passing turn';
      setTimeout(endTurn, 900);
    } else {
      $('#die-hint').textContent = 'Tap a highlighted token';
    }
    render();
  }, 350);
}

function moveToken(tokenIndex) {
  if (dieValue === null || over) return;
  const player = players[current];
  const movable = movableTokens(player);
  if (!movable.includes(tokenIndex)) return;

  let capture = false;
  let reachedHome = false;

  if (player.tokens[tokenIndex] === -1) {
    player.tokens[tokenIndex] = 0;
  } else {
    player.tokens[tokenIndex] += dieValue;
    if (player.tokens[tokenIndex] === 56) reachedHome = true;
  }

  const newPos = player.tokens[tokenIndex];
  if (newPos >= 0 && newPos <= 50) {
    const absCell = (COLORS[player.colorIdx].start + newPos) % RING_LEN;
    if (!SAFE_ABS.includes(absCell)) {
      players.forEach((other) => {
        if (other === player) return;
        other.tokens.forEach((pos, i) => {
          if (pos >= 0 && pos <= 50 && (COLORS[other.colorIdx].start + pos) % RING_LEN === absCell) {
            other.tokens[i] = -1;
            capture = true;
          }
        });
      });
    }
  }

  sfx[reachedHome ? 'win' : capture ? 'pop' : 'move']();
  render();

  if (player.tokens.every((p) => p === 56)) {
    return finishGame(player);
  }

  const extraTurn = dieValue === 6 || capture || reachedHome;
  if (dieValue === 6) {
    sixStreak++;
    if (sixStreak >= 3) return endTurn(); // three 6s in a row forfeits the turn
  } else {
    sixStreak = 0;
  }

  dieValue = null;
  if (extraTurn) {
    $('#die-hint').textContent = 'Extra turn — roll again!';
    render();
  } else {
    endTurn();
  }
}

function endTurn() {
  dieValue = null;
  sixStreak = 0;
  current = (current + 1) % players.length;
  $('#die-hint').textContent = 'Tap to roll';
  $('#die-btn').textContent = '🎲';
  updateTurnLabel();
  render();
}

function finishGame(winner) {
  over = true;
  recordResult(GAME_ID, 'win');
  sfx.win();
  render();
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>${COLORS[winner.colorIdx].name} Wins!</h1><p>All four tokens made it home.</p><button class="g-btn" id="start-btn">Play Again</button>`;
  $('#start-btn').addEventListener('click', reset);
}

function render() {
  const board = $('#board');
  board.innerHTML = '<div class="hub">🏆</div>';

  for (let i = 0; i < RING_LEN; i++) {
    const p = ringPoint(i);
    const dot = document.createElement('div');
    dot.className = `cell-dot${SAFE_ABS.includes(i) ? ' safe' : ''}`;
    dot.style.left = `${p.x * 100}%`;
    dot.style.top = `${p.y * 100}%`;
    board.appendChild(dot);
  }

  const movable = dieValue !== null && !over ? movableTokens(players[current]) : [];

  players.forEach((player, pIdx) => {
    const color = COLORS[player.colorIdx];
    player.tokens.forEach((pos, tIdx) => {
      const point = tokenPixel(player.colorIdx, pos, tIdx);
      const el = document.createElement('div');
      el.className = 'token';
      el.style.background = color.hex;
      el.style.left = `${point.x * 100}%`;
      el.style.top = `${point.y * 100}%`;
      if (pIdx === current && movable.includes(tIdx)) {
        el.classList.add('movable');
        el.addEventListener('click', () => moveToken(tIdx));
      }
      board.appendChild(el);
    });
  });
}

$('#die-btn').addEventListener('click', rollDie);

$('#player-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#player-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  numPlayers = Number(btn.dataset.players);
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

activeColors = [0, 1, 2];
players = activeColors.map((colorIdx) => ({ colorIdx, tokens: [-1, -1, -1, -1] }));
current = 0;
dieValue = null;
over = false;
render();
