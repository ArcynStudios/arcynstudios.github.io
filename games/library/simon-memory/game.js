/**
 * Simon Memory — classic 4-pad "watch and repeat" sequence game.
 * Original code.
 */
import { $, sfx, isMuted, toggleMute, bestScore } from '../shared/engine.js';

const GAME_ID = 'simon-memory';
const PAD_SOUNDS = [sfx.click, sfx.move, sfx.place, sfx.pop];
const SPEEDS = { slow: 900, normal: 650, fast: 420 };

let sequence, playerStep, speed, playing, accepting;

function reset() {
  sequence = [];
  playerStep = 0;
  playing = false;
  accepting = false;
  $('#overlay').hidden = true;
  $('#round').textContent = '0';
  $('#best').textContent = bestScoreValue();
  nextRound();
}

function bestScoreValue() {
  return Number(localStorage.getItem(`arcyn-best-${GAME_ID}`) || 0);
}

function nextRound() {
  sequence.push(Math.floor(Math.random() * 4));
  playerStep = 0;
  $('#round').textContent = sequence.length;
  playSequence();
}

async function playSequence() {
  playing = true;
  accepting = false;
  await sleep(500);
  for (const pad of sequence) {
    await flash(pad);
    await sleep(SPEEDS[speed] * 0.35);
  }
  playing = false;
  accepting = true;
}

function flash(pad) {
  return new Promise((resolve) => {
    const el = $(`.pad[data-pad="${pad}"]`);
    el.classList.add('active');
    PAD_SOUNDS[pad]();
    setTimeout(() => {
      el.classList.remove('active');
      resolve();
    }, SPEEDS[speed] * 0.65);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function handlePad(pad) {
  if (!accepting || playing) return;
  flash(pad);

  if (pad !== sequence[playerStep]) return fail();

  playerStep++;
  if (playerStep === sequence.length) {
    accepting = false;
    setTimeout(nextRound, 700);
  }
}

function fail() {
  accepting = false;
  sfx.lose();
  const score = sequence.length - 1;
  const { isNewBest, best } = bestScore(GAME_ID, score);
  $('#best').textContent = best;

  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Sequence Broken</h1>
    <div class="overlay__score">Round ${sequence.length}</div>
    <p>${isNewBest ? 'New personal best!' : `Best round: ${best}`}</p>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

$('#board').addEventListener('click', (e) => {
  const btn = e.target.closest('.pad');
  if (!btn) return;
  handlePad(Number(btn.dataset.pad));
});

$('#speed-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#speed-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  speed = btn.dataset.speed;
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

speed = 'normal';
$('#best').textContent = bestScoreValue();
