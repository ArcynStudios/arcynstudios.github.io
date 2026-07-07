/**
 * Dots and Boxes — draw edges, complete boxes, go again on a completion.
 * AI heuristic: take free boxes when available, otherwise avoid handing
 * the opponent a free box (the standard "safe move" strategy). Original code.
 */
import { $, sfx, isMuted, toggleMute, recordResult, getStats } from '../shared/engine.js';

const GAME_ID = 'dots-and-boxes';
let ROWS = 4, COLS = 4; // boxes, not dots

let hEdges, vEdges, boxOwner, current, mode, gameOver;

function reset() {
  hEdges = Array.from({ length: ROWS + 1 }, () => Array(COLS).fill(false));
  vEdges = Array.from({ length: ROWS }, () => Array(COLS + 1).fill(false));
  boxOwner = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  current = 1;
  gameOver = false;
  $('#overlay').hidden = true;
  updateStats();
  updateScores();
  render();
  updateTurn();
}

function updateStats() {
  $('#stat-wins').textContent = getStats(GAME_ID).wins;
}

function updateScores() {
  let p1 = 0, p2 = 0;
  boxOwner.forEach((row) => row.forEach((v) => { if (v === 1) p1++; else if (v === 2) p2++; }));
  $('#score-p1').textContent = p1;
  $('#score-p2').textContent = p2;
  return { p1, p2 };
}

function updateTurn() {
  if (gameOver) return;
  const el = $('#turn-indicator');
  if (mode === 'two-player') el.textContent = `Player ${current}'s turn`;
  else el.textContent = current === 1 ? 'Your turn' : 'AI thinking…';
}

function render() {
  const grid = $('#grid');
  const dotSize = 8;
  const gap = window.innerWidth < 480 ? 34 : 46;
  grid.style.gridTemplateColumns = `repeat(${COLS}, ${dotSize}px ${gap}px) ${dotSize}px`;
  grid.style.gridTemplateRows = `repeat(${ROWS}, ${dotSize}px ${gap}px) ${dotSize}px`;
  grid.innerHTML = '';

  const totalRows = ROWS * 2 + 1;
  const totalCols = COLS * 2 + 1;

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const evenR = r % 2 === 0;
      const evenC = c % 2 === 0;
      const el = document.createElement('div');

      if (evenR && evenC) {
        el.className = 'dot';
      } else if (evenR && !evenC) {
        const br = r / 2, bc = (c - 1) / 2;
        const filled = hEdges[br][bc];
        el.className = `hedge${filled ? ' filled p' + filled : ''}`;
        if (typeof filled === 'number') el.classList.add(`p${filled}`);
        if (!filled) el.addEventListener('click', () => playEdge('h', br, bc));
      } else if (!evenR && evenC) {
        const br = (r - 1) / 2, bc = c / 2;
        const filled = vEdges[br][bc];
        el.className = `vedge${filled ? ' filled p' + filled : ''}`;
        if (!filled) el.addEventListener('click', () => playEdge('v', br, bc));
      } else {
        const br = (r - 1) / 2, bc = (c - 1) / 2;
        const owner = boxOwner[br][bc];
        el.className = `box${owner ? ` owned p${owner}` : ''}`;
        el.textContent = owner ? (owner === 1 ? '●' : '●') : '';
      }
      grid.appendChild(el);
    }
  }
}

function boxesForEdge(type, r, c) {
  // Returns the box coordinates adjacent to this edge.
  if (type === 'h') {
    const boxes = [];
    if (r > 0) boxes.push([r - 1, c]);
    if (r < ROWS) boxes.push([r, c]);
    return boxes;
  }
  const boxes = [];
  if (c > 0) boxes.push([r, c - 1]);
  if (c < COLS) boxes.push([r, c]);
  return boxes;
}

function boxComplete(br, bc) {
  return hEdges[br][bc] && hEdges[br + 1][bc] && vEdges[br][bc] && vEdges[br][bc + 1];
}

function playEdge(type, r, c, silent = false) {
  if (gameOver) return false;
  if (type === 'h') {
    if (hEdges[r][c]) return false;
    hEdges[r][c] = current;
  } else {
    if (vEdges[r][c]) return false;
    vEdges[r][c] = current;
  }

  let claimed = false;
  boxesForEdge(type, r, c).forEach(([br, bc]) => {
    if (!boxOwner[br][bc] && boxComplete(br, bc)) {
      boxOwner[br][bc] = current;
      claimed = true;
    }
  });

  if (!silent) {
    sfx[claimed ? 'pop' : 'place']();
    render();
    updateScores();
  }

  const totalBoxes = ROWS * COLS;
  const filledBoxes = boxOwner.flat().filter(Boolean).length;
  if (filledBoxes === totalBoxes) {
    endGame();
    return true;
  }

  if (!claimed) {
    current = current === 1 ? 2 : 1;
    if (!silent) updateTurn();
  }

  if (!silent && mode !== 'two-player' && current === 2 && !gameOver) {
    setTimeout(aiTurn, 500);
  }
  return true;
}

function allEdges() {
  const edges = [];
  for (let r = 0; r <= ROWS; r++) for (let c = 0; c < COLS; c++) if (!hEdges[r][c]) edges.push({ type: 'h', r, c });
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS; c++) if (!vEdges[r][c]) edges.push({ type: 'v', r, c });
  return edges;
}

function wouldCompleteBox(edge) {
  return boxesForEdge(edge.type, edge.r, edge.c).some(([br, bc]) => {
    if (boxOwner[br][bc]) return false;
    const sides = [hEdges[br][bc], hEdges[br + 1][bc], vEdges[br][bc], vEdges[br][bc + 1]];
    const filled = sides.filter(Boolean).length;
    // Simulate this edge being added.
    return filled === 3;
  });
}

function makesUnsafe(edge) {
  // Would this edge give a box exactly 3 sides (handing the opponent a free box next turn)?
  return boxesForEdge(edge.type, edge.r, edge.c).some(([br, bc]) => {
    if (boxOwner[br][bc]) return false;
    const sides = [hEdges[br][bc], hEdges[br + 1][bc], vEdges[br][bc], vEdges[br][bc + 1]];
    const filled = sides.filter(Boolean).length;
    return filled === 2;
  });
}

function aiTurn() {
  if (gameOver) return;
  const edges = allEdges();
  const hard = mode === 'ai-hard';

  const completions = edges.filter(wouldCompleteBox);
  let choice;
  if (completions.length) {
    choice = completions[Math.floor(Math.random() * completions.length)];
  } else if (hard) {
    const safe = edges.filter((e) => !makesUnsafe(e));
    choice = (safe.length ? safe : edges)[Math.floor(Math.random() * (safe.length ? safe.length : edges.length))];
  } else {
    choice = edges[Math.floor(Math.random() * edges.length)];
  }

  playEdge(choice.type, choice.r, choice.c);
}

function endGame() {
  gameOver = true;
  const { p1, p2 } = updateScores();
  render();

  let title, statResult;
  if (p1 === p2) {
    title = "It's a Draw";
    statResult = 'draw';
    sfx.click();
  } else if (mode === 'two-player') {
    title = `Player ${p1 > p2 ? 1 : 2} Wins!`;
    statResult = 'win';
    sfx.win();
  } else if (p1 > p2) {
    title = 'You Win!';
    statResult = 'win';
    sfx.win();
  } else {
    title = 'AI Wins';
    statResult = 'loss';
    sfx.lose();
  }

  recordResult(GAME_ID, statResult);
  updateStats();

  const overlay = $('#overlay');
  overlay.hidden = false;
  overlay.innerHTML = `<h1>${title}</h1><div class="overlay__score">${p1} — ${p2}</div><button class="g-btn" id="start-btn">Play Again</button>`;
  $('#start-btn').addEventListener('click', reset);
}

$('#mode-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  $('#mode-row').querySelectorAll('.option-btn').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  mode = btn.dataset.mode;
  reset();
});

$('#mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  $('#mute-btn').textContent = muted ? '🔇' : '🔊';
});
$('#mute-btn').textContent = isMuted() ? '🔇' : '🔊';

$('#restart-btn').addEventListener('click', reset);
$('#start-btn').addEventListener('click', reset);
window.addEventListener('resize', render);

mode = 'ai-easy';
hEdges = Array.from({ length: ROWS + 1 }, () => Array(COLS).fill(false));
vEdges = Array.from({ length: ROWS }, () => Array(COLS + 1).fill(false));
boxOwner = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
render();
