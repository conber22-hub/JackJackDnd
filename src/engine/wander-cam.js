/* 🎥 THE WANDERER'S CAMERA, and the phone held like a handheld: pure numbers, no DOM, no Three.js. ui/wander.js and
   ui/handheld.js ask these and move the real camera and read the real fingers.
     · an orbit: where the camera sits around what it looks at, as a turn (yaw), a height (pitch) and a distance; to and
       from the offset the camera keeps from its target
     · turning in eighths (a shoulder button, [ and ]), craning up and back or down and close (the right stick's up and
       down, - and =), and three views to cycle through (the right stick's click, V)
     · gliding: how far to close a gap this frame, the same at any frame rate
     · the touch D-pad: where a thumb sits on it → a stick
     · whether the handheld skin shows: asked for, or (left to itself) on a touch screen with no controller */

const DEG = Math.PI / 180;
export const CAM = { minPitch:24 * DEG, maxPitch:80 * DEG, minDist:6, maxDist:34 };
// The views, nearest first. close: how the Wanderer begins (low behind the hero); over: down at the shoulder; high: the
// whole fight from above.
export const VIEWS = [
  { k:'close', label:'Close', pitch:51 * DEG, dist:13.5 },
  { k:'over', label:'Over the shoulder', pitch:30 * DEG, dist:8.5 },
  { k:'high', label:'High', pitch:70 * DEG, dist:24 },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// [x, y, z] (the camera's place minus its target) → { yaw, pitch, dist }. yaw 0 looks north (the camera south of
// its target, the way the map is first shown); pitch is the height above the ground, in radians.
export function toOrbit([x, y, z]){
  const dist = Math.hypot(x, y, z) || 1;
  return { yaw:Math.atan2(x, z), pitch:Math.asin(clamp(y / dist, -1, 1)), dist };
}
export function fromOrbit({ yaw, pitch, dist }){
  const h = Math.cos(pitch) * dist;
  return [Math.sin(yaw) * h, Math.sin(pitch) * dist, Math.cos(yaw) * h];
}
// Kept inside what the Wanderer allows (never under the ground, never so far the hero is a speck).
export const clampOrbit = o => ({ yaw:o.yaw, pitch:clamp(o.pitch, CAM.minPitch, CAM.maxPitch), dist:clamp(o.dist, CAM.minDist, CAM.maxDist) });

// The shortest way round from a to b (radians, −π..π).
export const angleTo = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
// Turning a step (dir +1 / −1): to the next eighth of a circle that way, so turns land square to the map.
// (Already a hair past an eighth: the next one, not a turn of nothing.)
export function snapTurn(yaw, dir = 1, step = Math.PI / 4){
  const k = yaw / step, n = dir > 0 ? Math.floor(k + 1e-3) + 1 : Math.ceil(k - 1e-3) - 1;
  return n * step;
}
// Craning: k > 0 swings up and back (higher and farther), k < 0 down and close. One unit is about a fifth of the way.
export function crane(o, k){
  return clampOrbit({ yaw:o.yaw, pitch:o.pitch + k * 9 * DEG, dist:o.dist * Math.exp(k * .2) });
}
// The view after the nearest one to how the camera sits now (the yaw is kept).
export function nextView(o){
  const near = VIEWS.map((v, i) => ({ i, d:Math.abs(v.pitch - o.pitch) / (10 * DEG) + Math.abs(Math.log(v.dist / o.dist)) / .25 })).sort((a, b) => a.d - b.d)[0].i;
  return VIEWS[(near + 1) % VIEWS.length];
}
// How much of a gap to close this frame (dt in seconds, rate per second): frame-rate independent smoothing.
export const glide = (dt, rate) => 1 - Math.exp(-Math.max(0, dt) * rate);

/* The touch D-pad: a thumb at (dx, dy) from its middle (y grows downward), on a pad of radius r. → { x, y } a stick
   (length 1 in the direction of the thumb), or { x:0, y:0 } on the middle dimple. */
export function dpadStick(dx, dy, r = 60, dead = .22){
  const len = Math.hypot(dx, dy);
  if (len < r * dead) return { x:0, y:0 };
  return { x:dx / len, y:dy / len };
}

/* Should the handheld skin show? mode: 'on' | 'off' | 'auto'. auto: on a touch screen (coarse pointer) with no
   controller plugged in. */
export function skinWanted(mode = 'auto', { coarse = false, pad = false } = {}){
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return coarse && !pad;
}
// The shells it comes in.
export const SHELLS = [
  { k:'dusk', label:'Dusk violet' },
  { k:'bone', label:'Bone' },
  { k:'blood', label:'Old blood' },
  { k:'moss', label:'Bog moss' },
  { k:'smoke', label:'Smoke glass' },
];

/* ⚔ OVER THE SHOULDER: in a fight the camera stands low behind the hero, just off their right shoulder, looking past
   them at what they face (the foe they aim at, or whoever is coming for them), the way their own eyes would see the
   fight: the hero big in the near corner of the screen, the foe beyond. Positions in the world (x, z: one per square).
     h: the hero's feet { x, z }; s: what they face { x, z }
     room: how far behind the hero the camera can stand before a wall (squares; it creeps in closer and higher)
     side: +1 the right shoulder, −1 the left
   → { look:{ x, y, z } where to look (y above the floor), orbit:{ yaw, pitch, dist } the camera from there } */
export const SHOULDER = { back:3.6, up:2.4, side:1.15, ahead:.38, maxAhead:2.5, lookUp:.7, minBack:1.4 };
export function shoulderShot(h, s, { room = Infinity, side = 1 } = {}){
  let dx = s.x - h.x, dz = s.z - h.z, l = Math.hypot(dx, dz);
  if (l < .01){ dx = 0; dz = -1; l = 1; }
  const fx = dx / l, fz = dz / l, rx = -fz * side, rz = fx * side;   // facing, and the shoulder's side of it
  const back = clamp(room - .35, SHOULDER.minBack, SHOULDER.back), tight = (SHOULDER.back - back) / (SHOULDER.back - SHOULDER.minBack);
  const up = SHOULDER.up + tight * .9;   // backed against a wall: over their head instead
  const ahead = Math.min(SHOULDER.maxAhead, l * SHOULDER.ahead);
  const look = { x:h.x + fx * ahead + rx * .75, y:SHOULDER.lookUp, z:h.z + fz * ahead + rz * .75 };   // (the hero to one side, the foe clear of them)
  const cam = [h.x - fx * back + rx * SHOULDER.side, up, h.z - fz * back + rz * SHOULDER.side];
  return { look, orbit:toOrbit([cam[0] - look.x, cam[1] - look.y, cam[2] - look.z]) };
}

/* 👁 Through their eyes (a fight's third view, after over the shoulder): the camera at the hero's eye height, a hand's
   width behind their head, looking at the foe's chest. h: the hero's place, s: the foe's (x, z, in world units);
   eye: the eye height. → { look, orbit } like shoulderShot (the hero's own figure is hidden by the caller). */
export const EYES = { eye:1.32, back:.16, chest:.72 };
export function eyesShot(h, s, { eye = EYES.eye } = {}){
  let dx = s.x - h.x, dz = s.z - h.z, l = Math.hypot(dx, dz);
  if (l < .01){ dx = 0; dz = -1; l = 1; }
  const fx = dx / l, fz = dz / l;
  const look = { x:s.x, y:EYES.chest, z:s.z };
  const cam = [h.x - fx * EYES.back, eye, h.z - fz * EYES.back];
  return { look, orbit:toOrbit([cam[0] - look.x, cam[1] - look.y, cam[2] - look.z]) };
}
