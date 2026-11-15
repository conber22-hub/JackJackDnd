/* Original tips. Conditions are ANDed; see engine/coach.js for the small vocabulary.
   Button labels name the action's control, so X (spells) is LT / G on pad / keys.
   Table-only actions stay out of the Wanderer, whose Y and Select have other jobs. */
export const COOLDOWN_MS = 45000;
export const FIGHT_COOLDOWN_MS = 20000;
const calm = { fight:false, down:false, waitingOnDM:false };
const turn = { fight:true, myTurn:true, down:false, waitingOnDM:false };
const buttons = { in:['handheld', 'pad', 'keys'] };
const tip = (id, when, text, priority, teaches, after = [], cooldownMs = 0) =>
  ({ id, when, text, priority, teaches, once:true, cooldownMs, after });
export const TIPS = [
  tip('down-table', { down:true, where:'table' }, 'You are down. Tell your DM; your friends may still bring you back.', 110, 'down'),
  tip('down-wander', { down:true, where:'wander' }, 'You are down. Let the game finish the turn; your tale may not be over.', 110, 'down'),
  tip('dm-wait', { where:'table', waitingOnDM:true }, 'Your request is with the DM. Give them a moment to decide.', 105, 'request'),
  tip('low-potion', { ...turn, 'hp/maxHp':{ lt:.3 }, potions:{ gt:0 } }, 'Your health is low. Drink a potion before the dark closes in.', 100, 'potion'),
  tip('low-heal', { ...turn, 'hp/maxHp':{ lt:.3 }, hasHealing:true, potions:0 }, 'You are hurt. Use your healing now, if you have it ready.', 99, 'heal'),
  tip('ally-down', { ...turn, alliesDown:{ gt:0 }, hasHealing:true }, 'Your friend is down. A healing spell may get them back on their feet.', 98, 'healAlly'),
  tip('stand-up', { ...turn, where:'table', conditions:{ includes:'prone' } }, 'You are prone: on the ground. {Y} → Stand up gets you to your feet.', 97, 'stand'),
  tip('welcome', { ...calm, where:'table', sessionMs:{ lt:60000 } }, 'Welcome to Barovia. Your hero is yours to guide; take your time.', 90, 'welcome'),
  tip('welcome-wander', { ...calm, where:'wander', sessionMs:{ lt:60000 } }, 'Welcome, wanderer. Your first step is enough; the valley can wait.', 90, 'welcome'),
  tip('walk-closer', { ...turn, 'target.seen':true, 'target.inReach':false, moveLeft:{ gt:0 } }, 'Your foe is out of reach. Move closer: {DPAD}.', 85, 'reach'),
  tip('turn-strike', { ...turn, 'target.seen':true, 'target.inReach':true }, 'Your turn. Strike: {A}. End turn: {B}.', 80, 'strike'),
  tip('choose-target', { ...turn, foesSeen:{ gt:0 }, 'target.seen':false }, 'Choose your target: {R}. Look for the 🎯.', 79, 'aim'),
  tip('no-move', { ...turn, 'target.seen':true, 'target.inReach':false, moveLeft:0, where:'table' }, 'You have no move left. {Y} → Dash can give you more, using your action.', 78, 'dash'),
  tip('many-foes', { ...turn, foesSeen:{ gt:1 }, mode:buttons }, 'You choose who to face: {L} or {R} changes the 🎯 target.', 77, 'aim'),
  tip('first-spell', { ...turn, hasSpells:true }, 'Your spells: {X}. Choose one, then check its target and reach.', 76, 'cast'),
  tip('slot-spent', { ...turn, hasSpells:true, justDid:'cast', slotsLeft:{ gt:0 } }, 'Your levelled spells spend slots. Keep an eye on how many you have left.', 75, 'slots'),
  tip('cantrip', { ...turn, hasSpells:true, cantrips:{ gt:0 }, slotsLeft:0 }, 'Your slots are spent. A cantrip is a spell that needs no slot.', 75, 'cantrip'),
  tip('end-turn', { ...turn, justDid:{ in:['strike', 'cast'] } }, 'Finished moving and acting? Use {B} to pass your turn.', 74, 'endTurn'),
  tip('wait-turn', { fight:true, myTurn:false, down:false, where:'table', waitingOnDM:false }, 'Your friends need their turns too. Plan your next move while you wait.', 73, 'waitTurn'),
  tip('wait-wander', { fight:true, myTurn:false, down:false, where:'wander' }, 'Your companions and foes act now. Watch, then choose your next move.', 73, 'waitTurn'),
  tip('stairs-buttons', { ...calm, onStairs:{ in:['up', 'down'] }, mode:buttons }, 'You are on the stairs. {A} takes you to the next floor.', 70, 'stairs'),
  tip('stairs-touch', { ...calm, onStairs:{ in:['up', 'down'] }, mode:'touch' }, 'You are on the stairs. Tap them to change floors.', 70, 'stairs'),
  tip('door-buttons', { ...calm, 'doorNear.open':false, 'doorNear.locked':false, doorNear:{ present:true }, mode:buttons }, 'There is a door beside you. {A} opens it.', 69, 'door'),
  tip('door-touch', { ...calm, 'doorNear.open':false, 'doorNear.locked':false, doorNear:{ present:true }, mode:'touch' }, 'There is a door beside you. Tap it to see what you can do.', 69, 'door'),
  tip('locked-door', { ...calm, 'doorNear.locked':true, where:'table' }, 'You have found a locked door. Tell your DM how you want to tackle it.', 68, 'lock'),
  tip('locked-wander', { ...calm, 'doorNear.locked':true, where:'wander' }, 'You have found a locked door. Check its choices, or try another route.', 68, 'lock'),
  tip('walk', { ...calm, where:'table' }, 'Guide your hero one step at a time: {DPAD}.', 60, 'step', ['welcome']),
  tip('walk-wander', { ...calm, where:'wander' }, 'Your next step: {DPAD}. You can pause to look around.', 60, 'step', ['welcome-wander']),
  tip('camera-shoulders', { ...calm, mode:{ in:['handheld', 'pad'] }, justDid:'step' }, 'You can turn the camera with {L} and {R} outside a fight.', 59, 'camera'),
  tip('camera-keys', { ...calm, mode:'keys', justDid:'step' }, 'You can turn the camera with [ and ]. V changes your view.', 59, 'camera'),
  tip('camera-touch', { ...calm, mode:'touch', justDid:'step' }, 'You can drag to turn the camera and pinch to zoom.', 59, 'camera'),
  tip('camera-view', { ...calm, mode:buttons, sessionMs:{ gt:90000 } }, 'Lost sight of yourself? {VIEW} changes your camera view.', 58, 'camera'),
  tip('menu', { ...calm, sessionMs:{ gt:60000 } }, 'For settings and choices, use your menu: {START}.', 55, 'menu'),
  tip('sheet', { ...calm, where:'table', sessionMs:{ gt:90000 } }, 'Your hero has a story. {SELECT} opens your sheet, notes and letters.', 54, 'sheet'),
  tip('pack-wander', { ...calm, where:'wander', sessionMs:{ gt:90000 } }, 'Your belongings travel with you. Open your pack to see what you carry.', 54, 'pack'),
  tip('cards', { ...calm, justDid:'tap', mode:buttons }, 'When you open a card, {B} puts it away outside a fight.', 53, 'card'),
  tip('cards-touch', { ...calm, justDid:'tap', mode:'touch' }, 'When you open a card, its close button brings you back to the map.', 53, 'card'),
  tip('dash', { ...turn, where:'table', moveLeft:{ lt:10 }, round:{ gt:1 } }, 'Need to go further? {Y} → Dash spends your action on extra movement.', 52, 'dash', ['walk-closer']),
  tip('disengage', { ...turn, where:'table', 'target.inReach':true, round:{ gt:1 } }, 'Need to retreat? {Y} → Disengage avoids free strikes as you leave.', 51, 'disengage', ['turn-strike']),
  tip('dodge', { ...turn, where:'table', round:{ gt:1 } }, 'Under pressure? {Y} → Dodge spends your action making you harder to hit.', 50, 'dodge', ['turn-strike']),
  tip('second-wind', { ...turn, where:'table', 'hp/maxHp':{ lt:.5 }, hasHealing:true }, 'Your {Y} actions include your features. Look for healing such as Second Wind.', 49, 'features'),
  tip('cantrip-later', { ...turn, cantrips:{ gt:0 }, slotsLeft:{ gt:0 } }, 'You can save your slots: cantrips need none, though they still take time to cast.', 48, 'cantrip', ['first-spell']),
  tip('move-after', { ...turn, justDid:'strike', moveLeft:{ gt:0 } }, 'You can still move after striking if you have movement left. Mind nearby foes.', 47, 'moveAfter'),
  tip('no-target', { ...turn, foesSeen:0 }, 'You see no foes. Look around and plan before you end your turn.', 46, 'look'),
  tip('dm-decides', { ...calm, where:'table', sessionMs:{ gt:180000 } }, 'You can try more than buttons offer. Tell your DM your plan; they decide what happens.', 40, 'ruling'),
  tip('game-decides', { ...calm, where:'wander', sessionMs:{ gt:180000 } }, 'You choose your path here; the game handles the rolls and your foes.', 40, 'ruling'),
  tip('idle-table', { ...calm, where:'table', idleMs:{ gt:90000 } }, 'No rush. If you are unsure, ask your DM what your hero can see.', 39, 'idle'),
  tip('idle-wander', { ...calm, where:'wander', idleMs:{ gt:90000 } }, 'No rush. Your menu has more choices: {START}.', 39, 'idle'),
  tip('gaze', { ...calm, sessionMs:{ gt:600000 } }, 'You walk beneath the Count’s Gaze. Even a small kindness matters in Barovia.', 15, 'gaze'),
  tip('mists', { ...calm, sessionMs:{ gt:900000 } }, 'You need not brave the Mists alone. Keep your friends close.', 14, 'mists', ['gaze']),
  tip('pixel-screen', { ...calm, mode:'handheld', sessionMs:{ gt:1800000 } }, 'Want a chunkier view? Your pixel screen is in {START} → Handheld & camera.', 10, 'pixel'),
  tip('shells', { ...calm, mode:'handheld', sessionMs:{ gt:2400000 } }, 'Make it yours. Choose a shell in {START} → Handheld & camera.', 9, 'shell', ['pixel-screen'], 120000),
];
