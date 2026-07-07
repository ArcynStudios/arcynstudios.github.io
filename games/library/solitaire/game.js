/**
 * Solitaire (Klondike) — click-to-select, click-to-place (no drag needed,
 * so it works identically with mouse and touch). Supports moving valid
 * multi-card sequences ("supermoves") off tableau columns. Original code.
 */
import { $, sfx, isMuted, toggleMute, bestScore } from '../shared/engine.js';

const GAME_ID = 'solitaire';
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RANK_LABELS = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

let tableau, stock, waste, foundations, selection, score, startTime, timerId, moveCount, won;

function isRed(suit) {
  return suit === 'hearts' || suit === 'diamonds';
}

function rankLabel(r) {
  return RANK_LABELS[r] || String(r);
}

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (let rank = 1; rank <= 13; rank++) deck.push({ suit, rank, faceUp: false });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function reset() {
  const deck = buildDeck();
  tableau = [];
  for (let col = 0; col < 7; col++) {
    const pile = deck.splice(0, col + 1);
    pile[pile.length - 1].faceUp = true;
    tableau.push(pile);
  }
  stock = deck;
  waste = [];
  foundations = { hearts: [], diamonds: [], clubs: [], spades: [] };
  selection = null;
  score = 0;
  moveCount = 0;
  won = false;
  startTime = performance.now();
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 500);
  $('#overlay').hidden = true;
  $('#score').textContent = '0';
  render();
}

function updateTimer() {
  if (won) return;
  const secs = Math.floor((performance.now() - startTime) / 1000);
  $('#time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function cardEl(card, extraClass = '') {
  const el = document.createElement('div');
  if (!card.faceUp) {
    el.className = `card face-down ${extraClass}`;
    return el;
  }
  el.className = `card ${isRed(card.suit) ? 'red' : 'black'} ${extraClass}`;
  el.innerHTML = `<span>${rankLabel(card.rank)}${SUIT_SYMBOLS[card.suit]}</span><span style="align-self:flex-end;">${SUIT_SYMBOLS[card.suit]}</span>`;
  return el;
}

function render() {
  renderStockWaste();
  renderFoundations();
  renderTableau();
}

function renderStockWaste() {
  const stockEl = $('#stock');
  stockEl.innerHTML = '<div class="pile-slot"></div>';
  if (stock.length) {
    const el = cardEl({ faceUp: false });
    stockEl.appendChild(el);
  }
  stockEl.onclick = handleStockClick;

  const wasteEl = $('#waste');
  wasteEl.innerHTML = '<div class="pile-slot"></div>';
  if (waste.length) {
    const top = waste[waste.length - 1];
    const el = cardEl(top, selection?.source === 'waste' ? 'selected' : '');
    el.onclick = (e) => {
      e.stopPropagation();
      handleWasteClick();
    };
    wasteEl.appendChild(el);
  }
}

function renderFoundations() {
  document.querySelectorAll('.foundation').forEach((pileEl) => {
    const suit = pileEl.dataset.suit;
    const pile = foundations[suit];
    pileEl.innerHTML = `<div class="pile-slot"><div class="card-rank">${SUIT_SYMBOLS[suit]}</div></div>`;
    if (pile.length) {
      const top = pile[pile.length - 1];
      const el = cardEl(top, selection?.source === 'foundation' && selection.suit === suit ? 'selected' : '');
      el.onclick = (e) => {
        e.stopPropagation();
        handlePileClick('foundation', suit);
      };
      pileEl.appendChild(el);
    }
    pileEl.onclick = () => handlePileClick('foundation', suit);
  });
}

function renderTableau() {
  const container = $('#tableau');
  container.innerHTML = '';
  tableau.forEach((pile, col) => {
    const colEl = document.createElement('div');
    colEl.className = 'tableau-col';
    colEl.style.minHeight = `${Math.max(160, 24 * pile.length + 100)}px`;

    pile.forEach((card, i) => {
      const isSelected = selection?.source === 'tableau' && selection.col === col && i >= selection.cardIndex;
      const el = cardEl(card, isSelected ? 'selected' : '');
      el.style.top = `${i * 24}px`;
      el.style.zIndex = i;
      if (card.faceUp) {
        el.onclick = (e) => {
          e.stopPropagation();
          handleTableauCardClick(col, i);
        };
      }
      colEl.appendChild(el);
    });

    colEl.onclick = () => handlePileClick('tableau', col);
    container.appendChild(colEl);
  });
}

function handleStockClick() {
  if (stock.length) {
    const card = stock.pop();
    card.faceUp = true;
    waste.push(card);
    sfx.place();
  } else if (waste.length) {
    while (waste.length) {
      const card = waste.pop();
      card.faceUp = false;
      stock.push(card);
    }
    sfx.click();
  }
  selection = null;
  render();
}

function handleWasteClick() {
  if (selection?.source === 'waste') {
    tryAutoFoundation(waste[waste.length - 1], () => waste.pop());
    return;
  }
  if (!waste.length) return;
  selection = { source: 'waste' };
  sfx.click();
  render();
}

function handleTableauCardClick(col, cardIndex) {
  const pile = tableau[col];
  const isTopOfSelection = selection?.source === 'tableau' && selection.col === col && selection.cardIndex === cardIndex;

  if (isTopOfSelection && cardIndex === pile.length - 1) {
    tryAutoFoundation(pile[cardIndex], () => pile.pop());
    return;
  }

  if (selection && selection.source === 'tableau' && selection.col === col) {
    selection = null;
    render();
    return;
  }

  if (selection) {
    if (attemptMoveToTableau(col)) return;
  }

  selection = { source: 'tableau', col, cardIndex };
  sfx.click();
  render();
}

function tryAutoFoundation(card, removeFn) {
  const pile = foundations[card.suit];
  const topRank = pile.length ? pile[pile.length - 1].rank : 0;
  if (card.rank === topRank + 1) {
    removeFn();
    card.faceUp = true;
    pile.push(card);
    flipNewTopIfNeeded();
    score += 10;
    $('#score').textContent = score;
    sfx.pop();
    selection = null;
    render();
    checkWin();
  } else {
    selection = null;
    render();
  }
}

function handlePileClick(type, key) {
  if (!selection) return;
  if (type === 'foundation') attemptMoveToFoundation(key);
  else attemptMoveToTableau(key);
}

function getSelectedCards() {
  if (!selection) return [];
  if (selection.source === 'waste') return waste.length ? [waste[waste.length - 1]] : [];
  if (selection.source === 'foundation') {
    const pile = foundations[selection.suit];
    return pile.length ? [pile[pile.length - 1]] : [];
  }
  return tableau[selection.col].slice(selection.cardIndex);
}

function removeSelectedCards() {
  if (selection.source === 'waste') return [waste.pop()];
  if (selection.source === 'foundation') return [foundations[selection.suit].pop()];
  return tableau[selection.col].splice(selection.cardIndex);
}

function attemptMoveToFoundation(suit) {
  const cards = getSelectedCards();
  if (cards.length !== 1) {
    sfx.invalid();
    selection = null;
    return render();
  }
  const card = cards[0];
  if (card.suit !== suit) {
    sfx.invalid();
    selection = null;
    return render();
  }
  const pile = foundations[suit];
  const topRank = pile.length ? pile[pile.length - 1].rank : 0;
  if (card.rank !== topRank + 1) {
    sfx.invalid();
    selection = null;
    return render();
  }

  removeSelectedCards();
  pile.push(card);
  flipNewTopIfNeeded();
  score += 10;
  moveCount++;
  $('#score').textContent = score;
  sfx.pop();
  selection = null;
  render();
  checkWin();
}

function attemptMoveToTableau(col) {
  const cards = getSelectedCards();
  if (!cards.length) {
    selection = null;
    render();
    return false;
  }
  const destPile = tableau[col];
  const bottomCard = cards[0];
  const destTop = destPile[destPile.length - 1];

  const valid = destTop
    ? destTop.faceUp && destTop.rank === bottomCard.rank + 1 && isRed(destTop.suit) !== isRed(bottomCard.suit)
    : bottomCard.rank === 13;

  if (!valid) {
    sfx.invalid();
    selection = null;
    render();
    return false;
  }

  // Guard against a no-op "move" (selecting a tableau card and re-targeting its own column).
  if (selection.source === 'tableau' && selection.col === col) {
    selection = null;
    render();
    return false;
  }

  removeSelectedCards();
  destPile.push(...cards);
  flipNewTopIfNeeded();
  moveCount++;
  score = Math.max(0, score - 2);
  $('#score').textContent = score;
  sfx.place();
  selection = null;
  render();
  return true;
}

function flipNewTopIfNeeded() {
  tableau.forEach((pile) => {
    if (pile.length && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1].faceUp = true;
    }
  });
}

function checkWin() {
  const total = Object.values(foundations).reduce((sum, p) => sum + p.length, 0);
  if (total === 52) {
    won = true;
    clearInterval(timerId);
    sfx.win();
    const { isNewBest, best } = bestScore(GAME_ID, score);
    const overlay = $('#overlay');
    overlay.hidden = false;
    overlay.innerHTML = `
      <h1>You Win!</h1>
      <div class="overlay__score">${score} pts</div>
      <p>${$('#time').textContent}. ${isNewBest ? 'New best score!' : `Best score: ${best}`}</p>
      <button class="g-btn" id="start-btn">Deal Again</button>
    `;
    $('#start-btn').addEventListener('click', reset);
  }
}

document.addEventListener('click', (e) => {
  if (e.target === document.body || e.target.classList.contains('table')) {
    selection = null;
    render();
  }
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);

tableau = Array.from({ length: 7 }, () => []);
stock = [];
waste = [];
foundations = { hearts: [], diamonds: [], clubs: [], spades: [] };
render();
