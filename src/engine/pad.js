/* 🎮 THE CONTROLLER — a gamepad (or the keyboard) read as what the hero wants to do, for the Wanderer
   (game/wander.js, ui/wander.js). Pure: the browser's Gamepad API hands over sticks and buttons, and this turns them
   into steps and presses: a dead zone on the stick, a held stick stepping again and again (a little slower the first
   time), a button counted once when it goes down, and the stick turned to match the camera, so up on the stick is
   always away from you. */

// The standard mapping's buttons, in its order (an Xbox pad's names; a PlayStation pad's ✕ ○ □ △ are a b x y).
export const BUTTONS = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'back', 'start', 'ls', 'rs', 'up', 'down', 'left', 'right'];
export const DEAD = .45;
// The eight squares around, east first and on round clockwise (y grows southward on the map).
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

// gp: a Gamepad (or anything shaped like one) → { x, y, rx, ry, b:{ a:true… } } | null. The D-pad counts as the stick.
export function readPad(gp){
  if (!gp || !gp.buttons) return null;
  const b = {}; BUTTONS.forEach((n, i) => { const k = gp.buttons[i]; b[n] = !!(k && (k.pressed || k.value > .5)); });
  let x = +gp.axes?.[0] || 0, y = +gp.axes?.[1] || 0;
  if (b.left) x = -1; if (b.right) x = 1; if (b.up) y = -1; if (b.down) y = 1;
  return { x, y, rx:+gp.axes?.[2] || 0, ry:+gp.axes?.[3] || 0, b };
}

// Turn a stick by the camera's yaw (radians; 0 = looking north, the way the map is first shown).
export function turnBy(x, y, yaw = 0){
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x * c + y * s, -x * s + y * c];
}

// A stick → [dx, dy], one of the eight squares around, or null inside the dead zone.
export function stickDir(x, y, dead = DEAD){
  if (Math.hypot(x, y) < dead) return null;
  const k = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  return DIRS[(k + 8) % 8];
}

/* One frame: pad (from readPad), now (ms), mem (kept between frames, starts {}), yaw (the camera's).
   → { intents:[{ k:'step', dx, dy } | { k:'press', b }], mem }. A held stick steps at once, again after `first` ms,
   then every `repeat` ms; turning it to another square steps that way at once. */
export function padIntents(pad, now, mem = {}, { yaw = 0, first = 260, repeat = 170 } = {}){
  const out = [], held = { ...(mem.held || {}) };
  if (!pad) return { intents:out, mem:{ held:{}, dir:null, next:0 } };
  for (const n of BUTTONS){ if (['up', 'down', 'left', 'right'].includes(n)) continue; if (pad.b[n] && !held[n]) out.push({ k:'press', b:n }); held[n] = !!pad.b[n]; }
  const [tx, ty] = turnBy(pad.x, pad.y, yaw), dir = stickDir(tx, ty);
  let { dir:was = null, next = 0 } = mem;
  if (!dir){ was = null; next = 0; }
  else if (!was || was[0] !== dir[0] || was[1] !== dir[1]){ out.push({ k:'step', dx:dir[0], dy:dir[1] }); was = dir; next = now + first; }
  else if (now >= next){ out.push({ k:'step', dx:dir[0], dy:dir[1] }); next = now + repeat; }
  return { intents:out, mem:{ held, dir:was, next } };
}

/* The keyboard, for those without a pad: arrows or WASD walk (Q E Z C, or the number pad, the diagonals);
   Space or Enter is A, Escape is B, F is X, R is Y, Tab / Shift+Tab the shoulder buttons, G and H the triggers
   (spells, a potion), I the View button (the pack), J the left stick's click (the journal), M the menu.
   key: KeyboardEvent.key → { k:'step', dx, dy } | { k:'press', b } | null */
const KEY_STEPS = { ArrowUp:[0, -1], w:[0, -1], ArrowDown:[0, 1], s:[0, 1], ArrowLeft:[-1, 0], a:[-1, 0], ArrowRight:[1, 0], d:[1, 0],
  q:[-1, -1], e:[1, -1], z:[-1, 1], c:[1, 1], Home:[-1, -1], PageUp:[1, -1], End:[-1, 1], PageDown:[1, 1],
  8:[0, -1], 2:[0, 1], 4:[-1, 0], 6:[1, 0], 7:[-1, -1], 9:[1, -1], 1:[-1, 1], 3:[1, 1] };
const KEY_PRESS = { ' ':'a', Enter:'a', Escape:'b', f:'x', r:'y', m:'start', Tab:'rb', g:'lt', h:'rt', i:'back', j:'ls' };
export function keyIntent(key, { shift = false, yaw = 0 } = {}){
  const k = key.length === 1 ? key.toLowerCase() : key;
  if (k === 'Tab') return { k:'press', b:shift ? 'lb' : 'rb' };
  if (KEY_PRESS[k]) return { k:'press', b:KEY_PRESS[k] };
  const st = KEY_STEPS[k]; if (!st) return null;
  const dir = stickDir(...turnBy(st[0], st[1], yaw), .1);
  return dir ? { k:'step', dx:dir[0], dy:dir[1] } : null;
}
