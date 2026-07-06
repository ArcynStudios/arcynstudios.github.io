/**
 * Mythic Clash — reaction-duel "fighting" game: wait for the cue, strike
 * first to land the hit, jump the gun and eat the counter instead.
 * Original code, plain DOM.
 */
import { rand, clamp, $ } from '../shared/engine.js';

const arena = $('#arena');
const roundMsg = $('#round-msg');

let youHp, rivalHp, phase, clashTimer, aiTimer, clashStart, running;

function reset() {
  youHp = 100;
  rivalHp = 100;
  running = true;
  updateBars();
  $('#overlay').hidden = true;
  roundMsg.textContent = '';
  nextRound();
}

function updateBars() {
  $('#you-hp').style.width = `${clamp(youHp, 0, 100)}%`;
  $('#rival-hp').style.width = `${clamp(rivalHp, 0, 100)}%`;
}

function nextRound() {
  if (!running) return;
  phase = 'waiting';
  arena.className = 'arena wait';
  arena.textContent = 'Wait for it…';
  roundMsg.textContent = '';

  clearTimeout(clashTimer);
  clearTimeout(aiTimer);

  const delay = rand(900, 2600);
  clashTimer = setTimeout(startClash, delay);
}

function startClash() {
  if (!running) return;
  phase = 'clash';
  clashStart = performance.now();
  arena.className = 'arena clash';
  arena.textContent = 'CLASH!';

  // The rival's own reaction time — gets a little sharper as the duel wears on.
  const rivalReaction = rand(280, 520) - (100 - youHp) * 0.4;
  aiTimer = setTimeout(() => resolveRound('rival', Math.max(120, rivalReaction)), Math.max(120, rivalReaction));
}

function resolveRound(winner, reactionMs) {
  if (!running || phase === 'resolved') return;
  phase = 'resolved';
  clearTimeout(clashTimer);
  clearTimeout(aiTimer);

  const damage = winner === 'you' ? Math.round(24 - clamp(reactionMs / 40, 0, 14)) : 16;

  if (winner === 'you') {
    rivalHp -= Math.max(10, damage);
    arena.className = 'arena';
    arena.textContent = 'Hit!';
    roundMsg.textContent = `You struck in ${Math.round(reactionMs)}ms`;
  } else {
    youHp -= damage;
    arena.className = 'arena';
    arena.textContent = 'Countered!';
    roundMsg.textContent = 'The rival was faster that round.';
  }

  updateBars();

  if (youHp <= 0 || rivalHp <= 0) {
    return setTimeout(endMatch, 500);
  }
  setTimeout(nextRound, 900);
}

function falseStart() {
  if (!running || phase !== 'waiting') return;
  phase = 'resolved';
  clearTimeout(clashTimer);
  youHp -= 14;
  arena.className = 'arena early';
  arena.textContent = 'Too soon!';
  roundMsg.textContent = 'You flinched before the cue.';
  updateBars();

  if (youHp <= 0) return setTimeout(endMatch, 500);
  setTimeout(nextRound, 900);
}

function onStrike() {
  if (phase === 'clash') {
    const reaction = performance.now() - clashStart;
    resolveRound('you', reaction);
  } else if (phase === 'waiting') {
    falseStart();
  }
}

function endMatch() {
  running = false;
  const won = rivalHp <= 0 && youHp > 0;
  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>${won ? 'Victory' : 'Defeated'}</h1>
    <p>${won ? 'Your reflexes carried the day.' : 'The rival matched you blow for blow this time.'}</p>
    <button class="g-btn" id="start-btn">${won ? 'Fight Again' : 'Rematch'}</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

arena.addEventListener('pointerdown', onStrike);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    onStrike();
  }
});

$('#start-btn').addEventListener('click', reset);
