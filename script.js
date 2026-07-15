/* ==========================================================
   LOVESICK — Game Logic
   ========================================================== */

const BOARD_SIZE = 200;
const PAGE_SIZE = 60;      // squares shown at once (6 rows of 10)
const ROW_LEN = 10;        // squares per row (matches 10-col CSS grid)

/* ----------------------------------------------------------
   Helper: used for the hopping animation
   ---------------------------------------------------------- */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ----------------------------------------------------------
   Game State
   ---------------------------------------------------------- */
const state = {
  players: {
    vamp:   { name: 'Vamp',   img: 'assets/vamp.png',   position: 1, skips: 0, accepted: 0 },
    rabbit: { name: 'Rabbit', img: 'assets/rabbit.png', position: 1, skips: 0, accepted: 0 }
  },
  turnOrder: ['vamp', 'rabbit'],
  currentTurnIndex: 0,
  isRolling: false,
  isModalOpen: false,
  pendingSquare: null,      // square number currently showing a task
  history: []                // for UNDO — snapshots of state
};

/* ----------------------------------------------------------
   DOM References
   ---------------------------------------------------------- */
const boardEl        = document.getElementById('board');
const diceBtn         = document.getElementById('dice-btn');
const diceFace        = document.getElementById('dice-face');
const diceLabel       = document.getElementById('dice-label');
const turnName        = document.getElementById('turn-name');
const turnPill        = document.getElementById('turn-pill');
const skipBadge       = document.getElementById('skip-badge');
const btnRules        = document.getElementById('btn-rules');
const btnCloseRules   = document.getElementById('btn-close-rules');
const rulesModal      = document.getElementById('rules-modal');

const taskModal       = document.getElementById('task-modal');
const modalSquareLabel = document.getElementById('modal-square-label');
const modalTaskText   = document.getElementById('modal-task-text');
const modalHint       = document.getElementById('modal-hint');
const btnAccept       = document.getElementById('btn-accept');
const btnSkip         = document.getElementById('btn-skip');

const progressVamp    = document.getElementById('progress-vamp');
const progressRabbit  = document.getElementById('progress-rabbit');
const scoreVamp       = document.getElementById('score-vamp');
const scoreRabbit     = document.getElementById('score-rabbit');
const pageChipVamp    = document.getElementById('page-chip-vamp');
const pageChipRabbit  = document.getElementById('page-chip-rabbit');

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/* ----------------------------------------------------------
   Task Hook — add more square numbers as you write more tasks.
   Any square without an explicit entry falls back to the
   default line below.
   ---------------------------------------------------------- */       
function getTaskForSquare(squareNumber) {
    const tasks = {
        1: "Hold my hand in a manner that you love the most.",
        2: "Let me bite you.",
        3: "Tell me how you imagine us in the future.",
    };

    // Agar task list mein mila toh wo dikhao, varna default message
    return tasks[squareNumber] || `Square ${squareNumber}: Ek sweet baat bolo!`;
}

/* ----------------------------------------------------------
   Snake-order board math
   ---------------------------------------------------------- */
function rowOf(n) {
  return Math.floor((n - 1) / ROW_LEN);
}

function isReversedRow(rowIndex) {
  return rowIndex % 2 === 1;
}

function buildPageSquares(pageStart) {
  const squares = [];
  const rowsInPage = PAGE_SIZE / ROW_LEN;
  const baseRow = Math.floor((pageStart - 1) / ROW_LEN);

  for (let r = 0; r < rowsInPage; r++) {
    const globalRow = baseRow + r;
    const rowStartNum = globalRow * ROW_LEN + 1;
    const rowNums = [];
    for (let c = 0; c < ROW_LEN; c++) {
      rowNums.push(rowStartNum + c);
    }
    if (isReversedRow(globalRow)) rowNums.reverse();
    squares.push(...rowNums);
  }
  return squares;
}

function pageOf(squareNumber) {
  return Math.floor((squareNumber - 1) / PAGE_SIZE);
}

/* ----------------------------------------------------------
   Rendering
   ---------------------------------------------------------- */
let currentPage = 0;

// Enhancement-only tracking var: which player's token most recently
// finished landing, so renderBoard() knows when to play the ripple.
let lastLandedPlayerId = null;

function render() {
  renderBoard();
  renderPlayerBar();
  renderTurnPill();
}

function renderBoard(animateSwap = false) {
  const doRender = () => {
    const pageStart = currentPage * PAGE_SIZE + 1;
    const squareNums = buildPageSquares(pageStart);

    boardEl.innerHTML = '';
    squareNums.forEach(num => {
      const sq = document.createElement('div');
      sq.className = 'square';
      sq.dataset.square = num;

      if (num === BOARD_SIZE) sq.classList.add('square-final');

      // occupants on this square
      const occupants = state.turnOrder.filter(id => state.players[id].position === num);
      if (occupants.length) sq.classList.add('square-current');

      if (num === BOARD_SIZE) {
        const crown = document.createElement('span');
        crown.className = 'square-crown';
        crown.textContent = '👑';
        sq.appendChild(crown);
      }

      const numEl = document.createElement('span');
      numEl.className = 'square-number';
      numEl.textContent = num;
      sq.appendChild(numEl);

      if (occupants.length) {
        const tokenWrap = document.createElement('div');
        tokenWrap.className = 'square-tokens';
        occupants.forEach(id => {
          const t = document.createElement('div');
          t.className = 'token' + (id === 'rabbit' ? ' token-rabbit' : '');

          // mark the currently-hopping token so its landing animation plays
          const movingId = state.turnOrder[state.currentTurnIndex];
          if (state.isRolling && id === movingId) {
            t.classList.add('animate-hop');

            // faint trail ghost left behind on each hop step (enhancement,
            // purely decorative — does not affect game state)
            const trail = document.createElement('div');
            trail.className = 'token-trail';
            t.appendChild(trail);
          }

          const img = document.createElement('img');
          img.src = state.players[id].img;
          img.alt = state.players[id].name;
          t.appendChild(img);
          tokenWrap.appendChild(t);
        });

        sq.appendChild(tokenWrap);

        // Landing ripple: fires once the token has finished its hop
        // sequence and is no longer mid-roll (enhancement only).
        if (!state.isRolling && occupants.some(id => id === lastLandedPlayerId)) {
          const ripple = document.createElement('div');
          ripple.className = 'square-land-ripple';
          sq.appendChild(ripple);
          sq.addEventListener('animationend', () => ripple.remove(), { once: true });
        }
      }

      boardEl.appendChild(sq);
    });
  };

  if (animateSwap) {
    boardEl.classList.add('board-swap');
    setTimeout(() => {
      doRender();
      boardEl.classList.remove('board-swap');
    }, 200);
  } else {
    doRender();
  }
}

function renderPlayerBar() {
  const vamp = state.players.vamp;
  const rabbit = state.players.rabbit;

  progressVamp.style.width = `${(vamp.position / BOARD_SIZE) * 100}%`;
  progressRabbit.style.width = `${(rabbit.position / BOARD_SIZE) * 100}%`;

  scoreVamp.textContent = `${vamp.position} / ${BOARD_SIZE}`;
  scoreRabbit.textContent = `${rabbit.position} / ${BOARD_SIZE}`;

  updatePageChip(pageChipVamp, vamp.position);
  updatePageChip(pageChipRabbit, rabbit.position);
}

// Shows a small tappable chip when a player's token is on a
// different 50-square page than the one currently visible.
function updatePageChip(chipEl, position) {
  if (!chipEl) return;
  const playerPage = pageOf(position);
  if (playerPage === currentPage) {
    chipEl.hidden = true;
    return;
  }
  const rangeStart = playerPage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(rangeStart + PAGE_SIZE - 1, BOARD_SIZE);
  chipEl.hidden = false;
  chipEl.textContent = `on ${rangeStart}-${rangeEnd} →`;
  chipEl.onclick = () => {
    currentPage = playerPage;
    renderBoard(true);
    renderPlayerBar();
  };
}

function renderTurnPill() {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const player = state.players[currentId];

  turnName.textContent = player.name;

  if (player.skips > 0) {
    skipBadge.hidden = false;
    skipBadge.textContent = `${player.skips} skip${player.skips > 1 ? 's' : ''}`;
  } else {
    skipBadge.hidden = true;
  }

  // Highlight whichever player's turn it is with a brighter bezel;
  // the other player quietly dims.
  const vampEl = document.getElementById('player-vamp');
  const rabbitEl = document.getElementById('player-rabbit');
  if (vampEl && rabbitEl) {
    vampEl.classList.toggle('is-active', currentId === 'vamp');
    rabbitEl.classList.toggle('is-active', currentId === 'rabbit');
  }
}

/* ----------------------------------------------------------
   Page auto-scroll
   ---------------------------------------------------------- */
function ensurePageVisible(squareNumber, animate = true) {
  const targetPage = pageOf(squareNumber);
  if (targetPage !== currentPage) {
    currentPage = targetPage;
    renderBoard(animate);
  } else {
    renderBoard(false);
  }
  renderPlayerBar();
}

/* ----------------------------------------------------------
   History (Undo) — snapshot before every roll/move
   ---------------------------------------------------------- */
function snapshotState() {
  state.history.push(JSON.parse(JSON.stringify({
    players: state.players,
    currentTurnIndex: state.currentTurnIndex,
    currentPage
  })));
  // cap history so it doesn't grow unbounded
  if (state.history.length > 30) state.history.shift();
}

function undo() {
  if (state.isRolling || state.isModalOpen) return;
  const prev = state.history.pop();
  if (!prev) return;

  state.players = prev.players;
  state.currentTurnIndex = prev.currentTurnIndex;
  currentPage = prev.currentPage;

  render();
}

/* ----------------------------------------------------------
   Dice Roll
   ---------------------------------------------------------- */
function rollDice() {
  if (state.isRolling || state.isModalOpen) return;

  state.isRolling = true;
  diceBtn.disabled = true;
  diceFace.classList.add('rolling');
  diceLabel.textContent = 'Rolling…';

  let spins = 0;
  const spinInterval = setInterval(() => {
    diceFace.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    spins++;
    if (spins > 8) {
      clearInterval(spinInterval);
      finishRoll();
    }
  }, 60);
}

function finishRoll() {
  const result = Math.floor(Math.random() * 6) + 1;
  diceFace.textContent = DICE_FACES[result - 1];
  diceFace.classList.remove('rolling');
  diceLabel.textContent = 'Tap to roll';

  // Enhancement: a quick settle squash on the die once the result lands
  diceFace.classList.add('settling');
  diceFace.addEventListener('animationend', () => {
    diceFace.classList.remove('settling');
  }, { once: true });

  snapshotState();
  // Initiate the async hop movement
  moveCurrentPlayer(result);
}

/* ----------------------------------------------------------
   Movement with "Hopping" Animation
   ---------------------------------------------------------- */
async function moveCurrentPlayer(steps) {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const player = state.players[currentId];

  // Loop through steps to create the hopping effect
  for (let i = 0; i < steps; i++) {
    if (player.position >= BOARD_SIZE) break;

    player.position += 1;

    // Refresh view for each hop
    ensurePageVisible(player.position, false);

    // Pause for the hop animation
    await sleep(250);
  }

  state.isRolling = false;
  diceBtn.disabled = false;

  // Enhancement: mark this player as "just landed" and re-render so the
  // landing square gets its ripple burst, then clear the flag shortly
  // after so it doesn't replay on unrelated re-renders.
  lastLandedPlayerId = currentId;
  renderBoard(false);
  setTimeout(() => { lastLandedPlayerId = null; }, 700);

  if (player.position >= BOARD_SIZE) {
    player.position = BOARD_SIZE;
    render(); // Final render
    setTimeout(() => showWin(currentId), 400);
    return;
  }

  // open the task popup ONLY after hops complete
  setTimeout(() => openTaskModal(currentId, player.position), 350);
}

/* ----------------------------------------------------------
   Task Modal (Accept / Skip)
   ---------------------------------------------------------- */
function openTaskModal(playerId, squareNumber) {
  state.isModalOpen = true;
  state.pendingSquare = { playerId, squareNumber };

  modalSquareLabel.textContent = `Square ${squareNumber}`;
  modalTaskText.textContent = getTaskForSquare(squareNumber);

  const player = state.players[playerId];
  const remaining = 3 - (player.accepted % 3);
  modalHint.textContent = player.skips > 0
    ? `You have ${player.skips} skip${player.skips > 1 ? 's' : ''} banked · ${remaining} more accepted task${remaining > 1 ? 's' : ''} for another`
    : `Complete 3 accepted tasks to earn 1 skip · ${remaining} to go`;

  taskModal.hidden = false;
}

function closeTaskModal() {
  taskModal.hidden = true;
  state.isModalOpen = false;
  state.pendingSquare = null;
}

function handleAccept() {
  if (!state.pendingSquare) return;
  const { playerId } = state.pendingSquare;
  const player = state.players[playerId];

  player.accepted += 1;
  const earnedSkip = player.accepted % 3 === 0;
  if (earnedSkip) {
    player.skips += 1;
  }

  closeTaskModal();
  renderTurnPill();

  // Enhancement: brief gold pulse on the score that just went up, and a
  // celebratory pop on the skip badge if this accept earned a new skip.
  const scoreEl = playerId === 'vamp' ? scoreVamp : scoreRabbit;
  if (scoreEl) {
    scoreEl.classList.remove('streak-pop');
    void scoreEl.offsetWidth; // restart animation if triggered rapidly
    scoreEl.classList.add('streak-pop');
  }
  if (earnedSkip && !skipBadge.hidden) {
    skipBadge.classList.remove('skip-earned');
    void skipBadge.offsetWidth;
    skipBadge.classList.add('skip-earned');
  }

  endTurn();
}

function handleSkip() {
  if (!state.pendingSquare) return;

  // Consume a skip charge if the player has one
  const { playerId } = state.pendingSquare;
  const player = state.players[playerId];

  if (player.skips > 0) {
    player.skips -= 1;
  }

  closeTaskModal();
  renderTurnPill();
  // Turn does NOT change — same player keeps their turn
}

/* ----------------------------------------------------------
   Turn management
   ---------------------------------------------------------- */
function endTurn() {
  state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
  renderTurnPill();

  // Enhancement: a soft gold glow sweep on the turn pill to mark the handoff
  if (turnPill) {
    turnPill.classList.remove('turn-switch');
    void turnPill.offsetWidth;
    turnPill.classList.add('turn-switch');
  }
}

/* ----------------------------------------------------------
   Win state
   ---------------------------------------------------------- */
function showWin(playerId) {
  const player = state.players[playerId];

  const banner = document.createElement('div');
  banner.className = 'win-banner';
  banner.id = 'win-banner';
  banner.innerHTML = `
    <div class="win-banner-avatar"><span class="win-banner-rays"></span><img src="${player.img}" alt="${player.name}"></div>
    <h2>${player.name} Wins!</h2>
    <p>Reached square 200 first 👑</p>
    <button class="modal-btn modal-btn-accept" id="btn-play-again" style="max-width:200px;padding:14px 28px;">Play Again</button>
  `;
  document.body.appendChild(banner);

  // Enhancement: a brief confetti burst layered above the banner
  spawnConfetti();

  document.getElementById('btn-play-again').addEventListener('click', () => {
    banner.remove();
    const confettiLayer = document.getElementById('confetti-layer');
    if (confettiLayer) confettiLayer.remove();
    resetGame();
  });
}

/* ----------------------------------------------------------
   Confetti (enhancement only — no effect on game state)
   ---------------------------------------------------------- */
function spawnConfetti() {
  const existing = document.getElementById('confetti-layer');
  if (existing) existing.remove();

  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.id = 'confetti-layer';

  const colors = ['#f0cd96', '#d9a86e', '#e5637f', '#c4405f', '#f8ece1', '#f0c9ce'];
  const pieceCount = 46;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 6;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.4}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    layer.appendChild(piece);
  }

  document.body.appendChild(layer);

  // Clean up automatically if the player never taps "Play Again"
  // right away — keeps the DOM tidy after the animation settles.
  setTimeout(() => {
    if (document.getElementById('confetti-layer') === layer) {
      layer.remove();
    }
  }, 4500);
}

function resetGame() {
  state.players.vamp = { name: 'Vamp', img: 'assets/vamp.png', position: 1, skips: 0, accepted: 0 };
  state.players.rabbit = { name: 'Rabbit', img: 'assets/rabbit.png', position: 1, skips: 0, accepted: 0 };
  state.currentTurnIndex = 0;
  state.history = [];
  currentPage = 0;
  render();
}

/* ----------------------------------------------------------
   Rules Modal
   ---------------------------------------------------------- */
function openRules() {
  rulesModal.hidden = false;
}
function closeRules() {
  rulesModal.hidden = true;
}

/* ----------------------------------------------------------
   Event Listeners
   ---------------------------------------------------------- */
diceBtn.addEventListener('click', rollDice);
btnRules.addEventListener('click', openRules);
btnCloseRules.addEventListener('click', closeRules);
btnAccept.addEventListener('click', handleAccept);
btnSkip.addEventListener('click', handleSkip);

// Close modals by tapping the dark overlay outside the card
taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) {
    // Require explicit choice — no-op
  }
});

rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) closeRules();
});

/* ----------------------------------------------------------
   Tap ripple (enhancement only — purely visual, added on top
   of the existing buttons without altering their listeners)
   ---------------------------------------------------------- */
function attachRipple(el) {
  if (!el) return;
  el.addEventListener('click', (e) => {
    el.classList.remove('btn-ripple');
    void el.offsetWidth;
    // position the ripple origin at the pointer if available
    const rect = el.getBoundingClientRect();
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top;
    el.style.setProperty('--ripple-x', `${x}px`);
    el.style.setProperty('--ripple-y', `${y}px`);
    el.classList.add('btn-ripple');
  });
}
[diceBtn, btnRules, btnAccept, btnSkip, btnCloseRules].forEach(attachRipple);

/* ----------------------------------------------------------
   Init
   ---------------------------------------------------------- */
render();
