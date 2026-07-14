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
4: "Tell me about your favorite day that you spent with me.",
5: "Write a love letter in 45 seconds.",
6: "Sing a song whose lines remind you of me.",
7: "Propose to me to be your partner again.",
8: "Praise me in just 3 words.",
9: "Tell me your first impression of me.",
10: "Tell me what I wore when we met for the first time in the colony.",
11: "1-minute dance party on an item song.",
12: "Cuddle for the next 2 minutes.",
13: "Compliment me + kiss me.",
14: "Let me give you a gilli pappi.",
15: "Thumb fight—and the loser does whatever the winner asks.",
16: "Kiss me on the cheek at the weirdest/most random spot in the room.",
17: "Give me a warm forehead kiss and tell me one silly, adorable habit of mine that you love.",
18: "Do something cute but weird.",
19: "Make me blush without saying a single word.",
20: "Blindfold me and do anything you want (like a tickle attack or a sweet surprise) for 1 minute.",
21: "Tell me your favorite part of my face/body by kissing it.",
22: "Massage my back.",
23: "Fulfill 1 instant wish of your partner.",
24: "Kiss for 1 minute 😂",
25: "Behave like a cat.",
26: "Treat me like a baby.",
27: "Hug me as tightly as you can.",
28: "Massage my head.",
29: "Exchange one item of clothing (like a hoodie or a cap).",
30: "Apply lip balm on my lips."
   
        31: "Lift your partner in your arms and give a forehead kiss.",
        32: "Close your eyes, roll 3 times, let your partner guide you by voice to the bed, and kiss their lips (partner cannot move).",
        33: "Dance with your partner for 15 seconds (couple dance).",
        34: "Let your partner do anything playful to you for 15 seconds (they cannot remove or put hands inside clothes).",
        35: "Recreate the Titanic pose together.",
        36: "Lie on your partner stomach-to-stomach while tying hands behind your back for 8 seconds.",
        37: "Write a word on your partner's back with your fingers and have them guess it.",
        38: "Give a piggyback ride to your partner.",
        39: "Copy your partner's movements for 30 seconds.",
        40: "Attempt an upside-down 'Spiderman' kiss.",
        41: "Do a cute kiss on lips (peck).",
        42: "Do a French kiss with tongue.",
        43: "Start kissing from lips, reach till neck, go to ears, then back to lips.",
        44: "Kiss starts from hand, reaches to lips, passing by the chest.",
        45: "Kiss starts from lips, goes down to neck, then chest, then both nipples (over clothes).",
        46: "Kiss starts from backside below the neck, hands hold tight to your partner, and reach to the lips.",
        47: "Kiss 20 pecks on the face constantly.",
        48: "Hold eye contact, count to 5, and do an intense French kiss without tongue.",
        49: "Kiss while letting your fingers run into their hair.",
        50: "Hold each other's waist and kiss.",
        51: "Remove your partner's top using only one hand.",
        52: "Seductively remove your own top while maintaining intense eye contact.",
        53: "Use only your teeth and mouth to pull up or unbutton your partner's shirt.",
        54: "Slowly lift your partner's top, kissing every inch of skin as it gets revealed.",
        55: "Take off your partner's top while blindfolded, relying only on your touch.",
        56: "Crawl up to your partner on the bed, hold their waist, and slowly pull their top over their head.",
        57: "Trace your fingers along your partner's arms and neck before slowly sliding their top off.",
        58: "Whisper something hot in your partner's ear while unbuttoning or pulling off their top.",
        59: "Remove your partner's top, but you must keep your lips locked with theirs the entire time.",
        60: "Let your partner remove your top using only their teeth.",
        61: "Gently push your partner against the wall and slowly slide their shirt off their shoulders.",
        62: "Unbutton your partner's shirt, kissing their chest after every single button is undone.",
        63: "Remove your own top behind your partner's back, then hug them from behind skin-to-skin.",
        64: "Remove your partner's lower using only one hand while holding their waist with the other.",
        65: "Seductively slide off your own pants/shorts while doing a slow walk toward your partner.",
        66: "Unbutton or unzip your partner's lower using only your teeth.",
        67: "Kiss your partner's calves and thighs as you slowly slide their lower down.",
        68: "Pull your partner close and slide their lower off without breaking deep eye contact.",
        69: "Take off your own lower while standing on one foot, trying to look as smooth and seductive as possible.",
        70: "Lift your partner up onto the bed or your lap and slowly slide their lower off.",
        71: "Blindfolded, find the button or zipper of your partner's lower and remove it by feel alone.",
        72: "Kiss from your partner's waist down to their knees as you slowly pull their pants or shorts down.",
        73: "Lie back and let your partner pull off your lower using only their feet or teeth.",
        74: "Make your partner stand on the bed, hold their ankles, and slowly pull their lower down to the floor.",
        75: "Make your partner lie on their back, gently lift both of their legs by the ankles, and slowly slide their lower off.",
        76: "Remove your partner's remaining undergarment using only your teeth while keeping your hands behind your back.",
        77: "Give your partner a warm, full-body hug skin-to-skin for 20 seconds, feeling each other's heartbeat.",
        78: "Slowly trail your tongue from your partner's neck down to their belly button before removing their top undergarment.",
        79: "Blindfold yourself and remove your partner's final piece of clothing using only your sense of touch.",
        80: "Blindfold your partner, then slowly remove your own remaining clothes and press your warm body against theirs.",
        81: "Kiss your partner passionately on the lips while they slowly remove your final layer of clothing.",
        82: "Lay your partner down, trace your fingers intimately along their hip bones, and slowly slide off their lower undergarment.",
        83: "Gently bite and kiss your partner's shoulder blades, then slide your hands down to remove their final piece from behind.",
        84: "Sit on your partner's lap completely unclothed and share a deep, passionate 30-second French kiss.",
        85: "Kiss and lightly lick your partner's neck and chest as they lift their hips to let you slide their lower undergarment off.",
        86: "Hold your partner tightly by the waist, press your bodies together completely bare, and whisper a hot secret in their ear.",
        87: "Use one hand to slowly remove your partner's final clothing piece while using the other hand to gently tilt their chin up for a hot kiss.",
        88: "Lie down stomach-to-stomach with your partner completely bare and hold a tight embrace for 15 seconds without moving.",
        89: "Trace a line of soft kisses from your partner's collarbone down to their waistband before sliding it off completely.",
        90: "Have your partner stand, slowly remove their remaining undergarments, and kiss every new patch of skin exposed.",
        91: "Keep intense eye contact while you slowly pull off your own final piece of clothing and step into your partner's arms.",
        92: "Lock your lips with your partner's in a heavy make-out session while both of you work together to remove each other's remaining clothes.",
        93: "Lightly trail your fingers and tongue along your partner's spine, making them shiver before removing their final layer.",
        94: "Wrap your legs around your partner's waist and give them a deep, breathless kiss while completely bare.",
        95: "Gently push your partner onto the bed, kiss their inner thighs softly, and slide their final clothing piece away.",
        96: "Stand chest-to-chest, completely unclothed, and take turns tracing your fingers over each other's bodies for 20 seconds.",
        97: "Gently pull your partner's lower undergarment down with your teeth while holding their hands above their head.",
        98: "Share a lingering, slow-motion kiss while completely bare, exploring each other's touch gently.",
        99: "Lie side-by-side completely naked, holding each other tightly while kissing the back of their neck.",
        100: "The Ultimate Dare: A completely bare, passionate 1-minute make-out session where you can explore hugging, kissing, and touching anywhere with full intensity.",
        101: "Blindfold your partner and give them soft, teasing kisses all over their chest and stomach.",
        102: "Use your fingers to gently trace and explore your partner's most sensitive areas for 1 minute.",
        103: "Give your partner a slow, passionate session of oral pleasure, focusing purely on their enjoyment.",
        104: "Lie back and let your partner use their hands to completely guide the pace of your pleasure.",
        105: "Press your chest against your partner and move slowly to create a warm, intense full-body sensation.",
        106: "Focus entirely on your partner's neck and chest, alternating between warm breath, soft kisses, and light licks.",
        107: "Use your mouth and tongue to slowly pleasure your partner, stopping whenever they get too close to the edge.",
        108: "Use an ice cube (or cold water) to trace their inner thighs before warming the area up with your lips.",
        109: "Take control and give your partner an intense, deep session of oral pleasure for 45 seconds.",
        110: "Let your partner use their fingers to stimulate you while you keep your eyes closed and focus completely on the feel.",
        111: "Use your breasts to tease and rub against your partner's chest or face in a slow, playful rhythm.",
        112: "Give your partner oral pleasure while they gently run their fingers through your hair to guide you.",
        113: "Gently use your fingers to explore your partner at a fast pace for 30 seconds, then immediately switch to an ultra-slow pace.",
        114: "Sit on your partner's lap and focus on massaging and kissing their chest and sensitive areas.",
        115: "Give your partner a deep, slow session of oral pleasure, using your hands to support and stimulate them at the same time.",
        116: "Lie down and let your partner use their tongue to explore your inner thighs and sensitive zones completely.",
        117: "Use your hands to pleasure your partner while whispering exactly what you love about their body.",
        118: "Explore your partner's body using only your lips and tongue from their belly button downwards.",
        119: "Hold your partner's hands above their head while you use your fingers to build up their pleasure.",
        120: "Switch roles: Let your partner take total control of your oral pleasure for a full minute without you moving.",
        121: "Use lotion or body oil to give your partner an intimate, highly sensitive massage on their chest and thighs.",
        122: "Guide your partner's hand to exactly where and how you want to be touched right now.",
        123: "Perform a slow, teasing session of oral pleasure where you only touch them with the tip of your tongue.",
        124: "Press your chest against your partner's face and let them explore with their lips and tongue.",
        125: "Use your fingers to intimately pleasure your partner while keeping a deep, unbroken eye contact.",
        126: "Give your partner a continuous session of oral pleasure, changing your rhythm every 15 seconds.",
        127: "Gently tease your partner's sensitive areas with your fingers without actually giving full stimulation, making them wait.",
        128: "Let your partner use their lips and mouth to explore your chest and nipples with full intensity.",
        129: "Give your partner a passionate session of oral pleasure, incorporating deep breaths and light suction.",
        130: "Lie on your side together and use your hand to stimulate your partner from behind in a close embrace.",
        131: "Use your mouth to explore your partner's lower body, focusing entirely on the areas just around their most sensitive spots before touching the center.",
        132: "Have your partner lie down, then use your breasts to softly rub against their intimate areas.",
        133: "Dedicate a full minute to manually pleasing your partner using your hand, focusing entirely on their favorite rhythm.",
        134: "Give your partner a highly focused session of deep oral stimulation, paying close attention to their breathing patterns.",
        135: "Let your partner use both hands to stimulate your sensitive zones simultaneously while you remain completely still.",
        136: "Alternate between using your fingers and your tongue to pleasure your partner intimately.",
        137: "Sit over your partner and slowly lower yourself to kiss their chest, stomach, and lower body sequentially.",
        138: "Give your partner a slow, deep session of oral pleasure, ensuring you use plenty of moisture and soft movements.",
        139: "Use your fingertips to very lightly feather-touch your partner's most sensitive areas until they ask for more pressure.",
        140: "Let your partner guide the depth and pace of your oral pleasure completely using their hands on your hips.",
        141: "Give your partner 10 soft kisses on their inner thighs, getting closer to the center with each kiss.",
        142: "Use your hand to pleasure your partner at a steady, intense pace while kissing them deeply on the mouth.",
        143: "Spend a full minute focusing oral pleasure entirely on your partner's chest, nipples, and stomach area.",
        144: "Use your fingers to intimately pleasure your partner while they try to stay completely silent.",
        145: "Lie flat on your back and let your partner perform an intense session of oral pleasure on you.",
        146: "Use a combination of soft friction and warm kisses to stimulate your partner's lower body manually.",
        147: "Give your partner an intense, deep session of oral pleasure, focusing on a strong, steady rhythm.",
        148: "Use your hands to stimulate your partner's intimate areas while gently biting their neck or earlobe.",
        149: "Let your partner use their tongue to slowly build up your pleasure from a gentle tickle to full intensity.",
        150: "Spend 2 full minutes completely focused on each other's non-penetrative pleasure—using oral, manual, and body contact to bring each other as close to the edge as possible.",
        151: "Place a soft pillow under your partner's hips for the perfect natural angle, and enter gently in missionary.",
        152: "Lie on your sides and enter in a spooning position—perfect for a relaxed, low-effort, and slow-paced session.",
        153: "Have one partner lie on the edge of the bed with knees bent, while the other stands or kneels on the floor for easy depth control.",
        154: "Let the partner go on top but lean forward, resting their hands on your chest to fully control the angle and speed.",
        155: "Lie facing each other on your sides, lift one leg over your partner's hip, and enter slowly with maximum eye contact.",
        156: "Go into classic missionary, lock your hands tightly with your partner's, and move in a slow, steady rhythm.",
        157: "Lie flat on your stomach with a pillow under your hips while your partner enters gently from behind.",
        158: "Sit cross-legged on the bed and have your partner sit on your lap, wrapping their legs around your waist for close, slow grinding.",
        159: "Try missionary but bring your knees up toward your chest, allowing for shallow, gentle, and highly stimulating movements.",
        160: "Choose any comfortable position and do exactly 15 ultra-slow, gentle thrusts, focusing entirely on the connection.",
        161: "Get into spooning position, but prop yourself up on one elbow to kiss your partner's neck and back during penetration.",
        162: "Slowly slide in only halfway, hold still for 5 seconds, slide out, and repeat 5 times to get comfortable.",
        163: "Have one partner lean back against the wall for support while the other lifts one of their legs slightly for an easy standing entry.",
        164: "In missionary, place your feet flat on the bed with knees bent, using your feet to gently lift and control your hip movements.",
        165: "Lie flat on your stomach with hips slightly propped on a pillow for a very comfortable and low-effort rear-entry position.",
        166: "In a slow missionary position, press your chests flat together and synchronize your breathing for 10 deep breaths.",
        167: "Start with a tight, full-body hug on your side, and slowly slide in without breaking the tight embrace.",
        168: "Place two pillows under your partner's hips to tilt their pelvis, making the entry completely friction-free and smooth.",
        169: "In missionary, gently hold your partner's knees to steady the movement and keep the pace comfortable.",
        170: "Lie on your sides facing opposite directions, slide close from behind, and enter in a highly relaxed spooning angle.",
        171: "While fully inserted, stop all movement completely for 10 seconds and just kiss deeply to let your bodies adapt.",
        172: "Sit on a sturdy chair and have your partner sit facing you on your lap, holding each other tightly as you move slowly.",
        173: "Stay fully inserted in missionary and, instead of thrusting, slowly grind your hips together in circular motions.",
        174: "Let the partner on top sit upright but keep their feet flat on the bed, gently sliding and grinding instead of moving up and down.",
        175: "Spend 1 minute in slow, shallow missionary with a pillow under the hips, keeping continuous eye contact and whispering sweet things.",
        176: "Lie on your sides facing each other, lift your top leg over your partner's waist, and enter in a super relaxed, shallow angle.",
        177: "Stay fully inserted in missionary and, instead of moving in and out, gently roll your hips together in slow, comforting circles.",
        178: "Enter slowly in a tight front-facing embrace while lying down, focusing entirely on the warmth of being connected.",
        179: "Sit cross-legged and have your partner sit on your lap, wrapping their arms and legs around you as you rock slowly back and forth.",
        180: "Move slowly but only penetrate halfway to keep things completely comfortable, pain-free, and highly sensitive.",
        181: "Have your partner lie flat on the edge of the bed while you kneel on the floor, giving you perfect control over the pace.",
        182: "Move in a slow, wave-like rhythm—gently tilting your pelvis up and down rather than straight thrusting.",
        183: "Go fully inside and completely stop all movement for 30 seconds. Just hold each other, kiss, and feel your heartbeats.",
        184: "In missionary, let your partner rest their legs comfortably over your shoulders or sides to open up the angle naturally.",
        185: "Lie on your side in a spooning position, pulling your partner's top leg slightly higher for effortless and gentle entry.",
        186: "Do exactly 10 very slow, deep thrusts, pausing for 3 seconds after each one to enjoy the sensation fully.",
        187: "Let your partner place their hands on your hips to guide the depth and speed exactly how they find it most comfortable.",
        188: "Maintain continuous, unbroken eye contact while moving in a very slow, shallow missionary rhythm.",
        189: "While moving slowly, gently run your fingers through your partner's hair and kiss their forehead to keep them relaxed.",
        190: "Have your partner sit on top but lean their entire upper body forward, resting on your chest for a highly secure and comfortable feel.",
        191: "Move in and out using tiny, one-inch movements—incredibly safe, easy, and highly stimulating.",
        192: "Rest your foreheads together while slowly moving, syncing your breathing to match each other perfectly.",
        193: "Lie on your sides with your legs interlocked like scissors for a shallow, effortless, and very intimate pace.",
        194: "Align your movements with your breathing—thrust gently only when your partner exhales to maximize relaxation.",
        195: "Let the partner on top keep their feet flat on the bed, gently sliding back and forth instead of moving up and down.",
        196: "Go into missionary, lock your fingers tightly with your partner's, and move in a slow, comforting rhythm.",
        197: "Do slow, gentle missionary while using one hand to softly stimulate your partner's sensitive areas to keep them completely relaxed.",
        198: "Spoon from behind but turn slightly toward each other to create a highly relaxed and effortless entry angle.",
        199: "Go into whichever position felt the absolute best and most comfortable so far, and do 30 steady, gentle thrusts.",
        200: "THE ULTIMATE VICTORY (YOU WON): Bring the game to a beautiful finish! In your favorite position, let go of all rules, hold each other tightly, and guide each other to the ultimate climax together."
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
          }

          const img = document.createElement('img');
          img.src = state.players[id].img;
          img.alt = state.players[id].name;
          t.appendChild(img);
          tokenWrap.appendChild(t);
        });

        sq.appendChild(tokenWrap);
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
  if (player.accepted % 3 === 0) {
    player.skips += 1;
  }

  closeTaskModal();
  renderTurnPill();
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
    <div class="win-banner-avatar"><img src="${player.img}" alt="${player.name}"></div>
    <h2>${player.name} Wins!</h2>
    <p>Reached square 200 first 👑</p>
    <button class="modal-btn modal-btn-accept" id="btn-play-again" style="max-width:200px;padding:14px 28px;">Play Again</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('btn-play-again').addEventListener('click', () => {
    banner.remove();
    resetGame();
  });
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
   Init
   ---------------------------------------------------------- */
render();
