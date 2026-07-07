/**
 * Memory Match — classic pair-flipping concentration game. Original code.
 */
import { $, sfx, isMuted, toggleMute, bestScore } from '../shared/engine.js';

const GAME_ID = 'memory-match';
const SYMBOLS = ['🚀', '🎯', '🎮', '🧩', '⚡', '🌙', '🔥', '💎', '🍀', '🎲', '🛸', '🌊'];
const DIFFICULTIES = {
  easy: { cols: 4, rows: 3 },
  medium: { cols: 4, rows: 4 },
  hard: { cols: 6, rows: 4 }
};

let difficulty = 'medium';
let cards, flipped, matchedCount, moves, startTime, timerId, locked;

function reset() {
  const { cols, rows } = DIFFICULTIES[difficulty];
  const pairCount = (cols * rows) / 2;
  const symbols = SYMBOLS.slice(0, pairCount);
  cards = shuffle([...symbols, ...symbols]).map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));

  flipped = [];
  matchedCount = 0;
  moves = 0;
  locked = false;
  startTime = performance.now();
  $('#overlay').hidden = true;
  $('#moves').textContent = '0';

  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);

  const board = $('#board');
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.aspectRatio = `${cols}/${rows}`;
  render();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateTimer() {
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function render() {
  const board = $('#board');
  board.innerHTML = cards
    .map(
      (c) => `
    <div class="card ${c.flipped ? 'flipped' : ''} ${c.matched ? 'matched' : ''}" data-id="${c.id}">
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${c.symbol}</div>
      </div>
    </div>
  `
    )
    .join('');
  board.querySelectorAll('.card').forEach((el) => {
    el.addEventListener('click', () => flipCard(Number(el.dataset.id)));
  });
}

function flipCard(id) {
  if (locked) return;
  const card = cards.find((c) => c.id === id);
  if (!card || card.flipped || card.matched) return;

  card.flipped = true;
  flipped.push(card);
  sfx.click();
  render();

  if (flipped.length === 2) {
    moves++;
    $('#moves').textContent = moves;
    locked = true;
    setTimeout(resolvePair, 550);
  }
}

function resolvePair() {
  const [a, b] = flipped;
  if (a.symbol === b.symbol) {
    a.matched = true;
    b.matched = true;
    matchedCount += 2;
    sfx.pop();
  } else {
    a.flipped = false;
    b.flipped = false;
    sfx.invalid();
  }
  flipped = [];
  locked = false;
  render();

  if (matchedCount === cards.length) win();
}

function win() {
  clearInterval(timerId);
  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  const { isNewBest, best } = bestScore(`${GAME_ID}-${difficulty}`, Math.max(0, 10000 - moves * 10 - elapsed));
  sfx.win();

  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <h1>Board Cleared!</h1>
    <div class="overlay__score">${moves} moves</div>
    <p>Time: ${$('#time').textContent}. ${isNewBest ? 'New best score!' : `Best score: ${best}`}</p>
    <button class="g-btn" id="start-btn">Play Again</button>
  `;
  $('#start-btn').addEventListener('click', reset);
}

$('#diff-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#diff-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  difficulty = btn.dataset.diff;
  reset();
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

cards = [];
render();
