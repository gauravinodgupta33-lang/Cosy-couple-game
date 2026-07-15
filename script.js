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
        1: "Hold my hand in a manner that you love the most",
        2: "Let me bite you",
        3: "Tell me how you imagine us in future",
        4: "Tell me about your favourite day that you spent with me",
        5: "Write a love letter in 45 seconds",
        6: "Sing a song whose lines remind you of me",
        7: "Propose me to be your gf/bf again",
        8: "Praise me in just 3 words",
        9: "Tell me your first impression of me",
        10: "Tell me what i wore when we first for the first time in colony",
        11: "1 minute dance party on item song",
        12: "Cuddle for next 2 minutes",
        13: "Compliment me+ kiss me",
        14: "Let me give you gillli pappi",
        15: "Thumb fight and loser does what the other person askes to do",
        16: "Kiss me at the weirdest place",
        17: "Remove one of your clothing item",
        18: "Do something cute but weird",
        19: "Make me blush without saying a word",
        20: "Blindfold me and do anything you want for 1 minute",
        21: "Tell me your fav part of my body by kissing it",
        22: "Massage by back",
        23: "Fulfill 1 wish of your partner",
        24: "Kiss for 1 minute😂",
        25: "Behave like a cat",
        26: "Treat me like a baby",
        27: "Hug me tightly",
        28: "Massage by head",
        29: "Exchange our clothes (not all)",
        30: "Apply lipbalm on my lips",
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
        51: "Put your hands inside your partner's bottom underwear and keep it there doing anything for 30 seconds.",
        52: "Put your hands inside your partner's vest or bra for 30 seconds and press their chest or nipple while kissing.",
        53: "Get into a sex pose (missionary, cowgirl, doggy, or any other) and pretend to have sex.",
        54: "Kiss deeply while continuously rubbing your partner's private area.",
        55: "Wrap your arms around each other in a tight hug and roll across the bed together.",
        56: "Stand up, grab your partner's leg to pull them close so both abdomens touch, have them wrap their leg around your waist, and French kiss.",
        57: "Sit face-to-face in each other's laps, slipping your hands completely inside each other's clothing to stroke their back and waist.",
        58: "Lie down on top of your partner, pinning their wrists above their head with one hand while using your other hand to explore beneath their clothes.",
        59: "Stand close behind your partner, wrapping your arms around them to reach inside their clothes from the front while kissing their neck.",
        60: "Press your partner firmly against a wall, slide your hands inside the back of their pants, and pull them tightly against you during an intense kiss.",
        61: "Put your hand inside your partner's underwear and watch 10 reels together without breaking focus.",
        62: "Press your entire face firmly against your partner's chest and try to hold a normal conversation.",
        63: "Lean over and get spanked by your partner, but you have to thank them politely after every single slap.",
        64: "Slide your hand inside your partner's underwear and trace the alphabet on their skin with your finger, while they have to spell out a funny word you whisper in their ear.",
        65: "Slide your hand inside your partner's underwear and keep it there while whispering a completely boring, unsexy list (like grocery items or math tables) in your absolute sexiest, deepest voice.",
        66: "Pin your partner's hands gently above their head on the bed, slowly slide their top up using only your teeth, and kiss your way up their exposed stomach.",
        67: "Sit directly on your partner's lap facing them, slowly lifting your top up and off while grinding your hips against theirs, letting them watch every movement before pulling them in for an intense kiss.",
        68: "Slowly unbutton your partner's shirt with your teeth, one by one, while keeping your hands inside their underwear to keep them warm and distracted.",
        69: "Sit straddling your partner's lap, slide your hands under their top to squeeze and massage their bare chest/breasts, and then slowly pull the shirt off over their head while kissing them deeply.",
        70: "Take off your top completely, press your bare chest flat against your partner's clothed chest, and rub against them until they desperately pull their own shirt off to feel your skin.",
        71: "Blindfold your partner, slide your hand up under their top to trace and pinch their nipples playfully, and then slowly slide the shirt off their shoulders while whispering what you want to do next.",
        72: "Have your partner stand up, pull their top halfway up to trap their arms over their head, and leave them helpless while you intensely kiss and bite their exposed neck, chest, and stomach.",
        73: "Sit on your partner's chest, slide your hands inside their shirt to caress them, and slowly lift your top off, letting them watch every second of it before dropping it onto their face.",
        74: "Push your partner onto the bed, grab the hem of their shirt, and slowly slide it up to their chest so you can lick and kiss around their nipples before pulling the shirt completely off.",
        75: "Lock lips in a deep, wet French kiss, and without breaking the kiss for even a second, aggressively work together to rip or pull off both of your tops at the exact same time.",
        76: "Pin your partner’s hands tightly above their head, crawl between their legs, and slowly slide their pants down while pressing your lips hard against their inner thighs, moving higher with every inch you pull.",
        77: "Stand face-to-face, lock lips in a deep French kiss, and use your feet to playfully hook and slide your partner's pants all the way down to their ankles.",
        78: "Sit on your partner's lap, slide your hands completely inside the back of their pants to squeeze their bare bottom, and then slowly pull the pants down together.",
        79: "Have your partner stand against the wall while you get down on your knees, slowly unbutton/unzip their pants with your teeth, and slide them down to the floor.",
        80: "Slide your hand inside the front of your partner's pants to touch them intimately for 20 seconds, then slowly pull the pants down while keeping intense eye contact.",
        81: "Pull your partner's pants down halfway down their thighs to restrict their movement, leaving them helpless on the bed while you kiss and bite your way up their legs.",
        82: "Slide your hands deeply inside the back of your partner's pants to pull them as close as possible, then use your teeth to catch the waistband and slowly tug their pants down while grinding against them.",
        83: "Blindfold your partner, slowly unzip their pants, and use your lips and tongue to trace the waistband before pulling them completely off.",
        84: "Lie stomach-to-stomach on the bed, and work together using only one hand each to wriggle and pull each other's pants off at the same time.",
        85: "Press your partner flat against the bed, slide your hands down inside the front of their pants to touch them intimately, and then aggressively pull their pants down to their ankles in one hot, swift motion.",
        86: "The Blindfold Unclip: Blindfold your partner, sit on their lap facing them, and make them unhook your bra or slide off your vest using only one hand while you kiss their neck deeply.",
        87: "The Teeth Tug: Lie flat on top of your partner, slide your hands inside their underwear to hold them close, and use only your teeth to pull their vest up or tug their bra straps down.",
        88: "The Blind Back-Massage: Sit behind your partner, slide your hands under their top underwear to give them a warm back massage, and then slowly unclip or slide it off, planting a soft bite on their shoulder blade immediately after.",
        89: "The Wall Press Tease: Press your partner firmly against the wall, lock their hands above their head, and use your lips and tongue to trace all the way around their vest or bra lines before slowly sliding it off and pressing your bare chest against theirs.",
        90: "The Heavy Grind Reveal: Sit directly on your partner's lap facing them, grind slowly against them, and have them slowly peel off your vest/bra from behind while you look directly into their eyes.",
        91: "The Wrist Lock: Pin both of your partner's wrists to the bed with one hand, use your other hand to slowly slide off their vest or unclip their bra, and immediately press your bare chest against theirs.",
        92: "The Teasing Slide: Lie stomach-to-string on the bed, slowly slide each other's vest or bra halfway up/down just to tease, and hold that position while kissing for 30 seconds before taking them completely off.",
        93: "The Mirror Temptation: Stand behind your partner in front of a mirror, cup their chest from behind over their underwear, and slowly slide it off while making intense eye contact in the reflection.",
        94: "The Dramatic Ghost: Pull your freshly removed vest/bra over your partner’s entire face like a ghost mask, and make them try to give you an intense, passionate kiss through the fabric while you make spooky ghost noises.",
        95: "The Extreme Tickle Defense: Put your freshly removed vest or bra over your partner's head like a goofy hat. They have to wear it like that and loudly recite a poem or sing a nursery rhyme, while you try your absolute best to tickle them the entire time. If they break character or laugh, you get to draw a funny face on their stomach.",
        96: "The Blindfold Trace: Blindfold your partner, lie on top of them, and slowly slide your hands inside their underwear to trace their skin. Use your fingers to slowly hook the sides and pull them down over their legs using only your feet.",
        97: "The Teeth Tug-of-War: Lay your partner on their back, hold their ankles up on your shoulders, and slowly pull their underwear down using only your teeth, kissing your way down their thighs as the fabric slides off.",
        98: "The Back-to-Front Whisper: Stand close behind your partner, wrapping your arms around their waist. Slide your hands inside their underwear to cup them, whisper something incredibly dirty in their ear, and slowly slide the underwear down to the floor.",
        99: "The Slow-Motion Slide: Sit directly face-to-face in each other's laps, lock eyes, and slowly slide each other's underwear down inch by inch at the exact same time, kissing passionately every time the fabric moves.",
        100: "The Wall Pin Tease: Press your partner firmly against the wall, lift one of their legs to wrap around your waist, and slide your hand inside their underwear to touch them intimately before slowly pulling the fabric off.",
        101: "The Handcuff Hold: Pin your partner's hands behind their back with one of your hands, use your other hand to slowly slide their underwear down to their knees, and leave them trapped like that while you kiss and bite their lower stomach.",
        102: "The Friction Grind (Underwear On): With both of you down to just your bottom underwear, sit directly on your partner’s lap and grind heavily against them, letting the friction and heat build up intensely without any other clothes in the way.",
        103: "The Blindfold Guessing Game (Underwear On): Blindfold your partner. Slide your hands inside their underwear to touch them intimately while kissing them, and make them guess exactly which finger or part of your hand you are using to tease them.",
        104: "The Bare-Skin Blankets: Lie stomach-to-stomach on the bed completely naked, and try to roll from one side of the bed to the other wrapped tightly together like a human burrito in a single blanket, without letting any body parts slip out.",
        105: "The Blind-Man's Buff: Blindfold one partner. The naked, blindfolded partner has to find the other naked partner on the bed using only their sense of smell and touch, while the other partner slowly and quietly shifts positions to dodge them.",
        106: "The Naked Sumo Stance: Both of you stand up completely naked on the bed, get into a deep sumo wrestler stance, and try to push each other off-balance using only your hips. The first one to lose their balance or laugh has to give the winner a 2-minute foot massage.",
        107: "The Goofy Statue Pose: Strike a ridiculous, dramatic classical art pose together (like a naked Greek statue) and try to hold it perfectly still for 30 seconds without laughing. The first person to crack a smile or wiggle has to do 10 naked jumping jacks while singing a nursery rhyme.",
        108: "The Heartbeat Sync: Lie completely naked chest-to-chest, wrapping your arms and legs tightly around each other. Close your eyes and lie completely still for two minutes, focusing only on the feeling of your bare skin and matching the rhythm of your partner's heartbeat.",
        109: "The Bare-Skin Trail: Have your partner lay on their back. Starting from their forehead, press slow, warm kisses all the way down the center of their body, over their chest and stomach, down to their toes, and then trace your way back up.",
        110: "The Direct-Gaze Grind: Sit on your partner's lap facing them, fully naked. Wrap your arms around their neck and grind slowly against them, keeping locked, intense eye contact without looking away for even a second.",
        111: "The Blindfolded Feather-Touch: Blindfold your partner. Use only your fingertips or your hair to gently trace the contours of their naked body, moving so lightly that they get goosebumps, making them wait in anticipation for where you'll touch next.",
        112: "The Whisper & Trace: Lie side-by-side, facing each other. Use one finger to trace their facial features—lips, nose, eyes—while whispering three things you find incredibly sexy about their naked body.",
        113: "The Mirror Appreciation: Stand together in front of a full-length mirror, pressed chest-to-back. Wrap your arms around them from behind, hold them close, and whisper into their ear what you love most about seeing both of your naked bodies together in the reflection.",
        114: "The Temperature Play: Take an ice cube (or a warm sip of water) and hold it in your mouth, then slowly kiss your way down your partner's bare chest and stomach, letting them feel the intense contrast of temperature on their sensitive skin.",
        115: "The Dominant Pin: Gently pin your partner’s wrists to the bed above their head, hover your naked body just inches above theirs so they can feel your heat, and tease them with light kisses on their neck and collarbones until they beg you to pull them closer.",
        116: "The Naked Back-Tracer: Have your partner lie on their stomach. Sit on the back of their thighs and use your lips, tongue, and fingers to slowly massage and trace patterns down their spine, finishing with a soft bite on their shoulder.",
        117: "The Slow-Motion French Kiss: Sit cross-legged facing each other, knees touching. Hold each other's faces in your hands and share the slowest, deepest, most passionate French kiss of the night, letting your bare bodies lean into each other.",
        118: "The Breath Control: Lie directly on top of your partner. Breathe slowly into their ear and neck, tracing your fingers through their hair, keeping your bodies pressed so tightly together that there is absolutely no space between you.",
        119: "The Ultimate Seduction Walk: Have your partner sit on the edge of the bed. Stand a few feet away, lock eyes, and walk toward them as slowly and seductively as possible, letting them appreciate your entire naked body before you crawl into their lap.",
        120: "The Eternal Embrace: Wrap yourselves completely around each other on the bed, tangle your legs together, and hold each other in a deep, naked embrace while whispering your final, dirtiest, and most loving desires for how the night should end.",
        121: "Kiss your partner whole chest and stomach region passionately with licking",
        122: "lickorsuck your partner where they say 2 mins",
        123: "Blind fold yourself and give your hands to you partner they'll order you the task 2 mins",
        124: "perform a naked dance with partner 2 mins",
        125: "Lie down and let the partner do anything to you for 2 mins",
        126: "Finger or stroke you partner while kissing them 2 mins",
        127: "Be naked cats 2 mins",
        128: "Rub your partner's private part 2 mins",
        129: "slap partner but don't use hands 2 times",
        130: "Eat anything on your partner's body",
        131: "Give a short blow job or licking pussi 2 mins",
        132: "Give boob job or rubb pussi and press nipple",
        133: "kiss rubbing your body to your partner body 2 mins",
        134: "The Naked Mirror Charades: Stand in front of a full-length mirror together. You have to act out a movie title, animal, or object using only your completely naked body movements (no talking or sounds allowed). Your partner has 1 minute to guess what you are.",
        135: "The Human Slip-N-Slide: Put a generous amount of massage oil or lotion on each other's chests and stomachs. Lie face-to-face on the bed and try to wriggle, slide, and rotate 360 degrees against each other without using your hands or feet for help.",
        136: "The Naked Blindfold Taste Test: Blindfold your partner. Bring 3 different finger foods from the kitchen (like a piece of chocolate, a grape, or a chip). Place the food somewhere on your bare body (like your stomach or shoulder) and make them find it and eat it using only their mouth.",
        137: "The Rock-Paper-Scissors Tickle Penalty: Play 5 quick rounds of Rock-Paper-Scissors. The loser of each round must sit completely still and defenseless for 15 seconds while the winner gets to tickle them anywhere they want.",
        138: "The Naked Accent Challenge: Spend the next 5 minutes completely naked talking to each other only in a hilarious, over-the-top accent (like an aggressive pirate, a fancy royalty accent, or a cartoon villain). You must try to have a completely serious conversation about your future plans while staying fully in character.",
        139: "The Bare-Skin Balloon Keepy-Uppy: Both of you stand completely naked on the bed and try to keep a balloon or soft pillow in the air for as long as possible without using your hands or feet—only using your hips, shoulders, chest, or heads.",
        140: "The Ultimate Floor-Is-Lava: Pretend the bedroom floor is lava. Both of you must move from one side of the room to the other using only the bed, pillows, or chairs without letting a single bare body part touch the actual floor. If anyone falls, they owe the other a 2-minute massage.",
        141: "You'll use your tongue and do whatever your partner says to do untill they are satisfied",
        142: "Freestyle task — Partner chooses an action!",
        143: "You'll use your mouth and do whatever your partner says to do untill they are satisfied",
        144: "You'll use your hand and do whatever your partner says to do untill they are satisfied",
        145: "You'll use your fingers and do whatever your partner says to do untill they are satisfied",
        146: "Kiss all the way from head to middle of legs",
        147: "You'll use your chest / boobs and do whatever your partner says to do untill they are satisfied",
        148: "You'll use your pushie/dihh and do whatever your partner says to do untill they are satisfied",
        149: "Aram se let jao 3 mins ke liye ache se baat kro ya bss aram se shant lete raho ek dusre ke sath",
        150: "Forehead kiss",
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
        197: "Do slow, gentle missionary while using one hand to softly stimulate your partner’s sensitive areas to keep them completely relaxed.",
        198: "Spoon from behind but turn slightly toward each other to create a highly relaxed and effortless entry angle.",
        199: "Go into whichever position felt the absolute best and most comfortable so far, and do 30 steady, gentle thrusts.",
        200: "THE ULTIMATE VICTORY (YOU WON): Bring the game to a beautiful finish! In your favorite position, let go of all rules, hold each other tightly, and guide each other to the ultimate climax together."
    };

    return tasks[squareNumber] || `Square ${squareNumber}: Freestyle it — do any fun little action!`;
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
   Ambient ember field (enhancement only — decorative, no
   effect on game state). Spawns a handful of slow-rising
   motes behind the app and keeps replenishing them so the
   page never looks static.
   ---------------------------------------------------------- */
function initEmberField() {
  const field = document.getElementById('ember-field');
  if (!field) return;

  const MAX_EMBERS = 14;

  function spawnEmber() {
    const mote = document.createElement('span');
    mote.className = 'ember-mote';
    const left = Math.random() * 100;
    const duration = 9 + Math.random() * 8;
    const drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
    mote.style.left = `${left}%`;
    mote.style.setProperty('--drift', drift);
    mote.style.animationDuration = `${duration}s`;
    field.appendChild(mote);

    // remove once its rise animation finishes, then spawn a replacement
    setTimeout(() => {
      mote.remove();
      spawnEmber();
    }, duration * 1000);
  }

  // stagger the initial spawns so they don't all rise in unison
  for (let i = 0; i < MAX_EMBERS; i++) {
    setTimeout(spawnEmber, i * 700);
  }
}

initEmberField();

/* ----------------------------------------------------------
   Init
   ---------------------------------------------------------- */
render();
