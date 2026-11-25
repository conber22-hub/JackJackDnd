/* 🎥 THE FOLLOW CAMERA, and what goes with playing one hero: shared by the Wanderer (ui/wander.js) and a player's
   handheld at the table (ui/tablehh.js).
     · the camera eases after a focus every frame, keeping its turn, height and distance; the right stick turns and
       cranes it; a snap turn (L / R, [ ]) or a view (V, View, the right stick's click) eases in; a drag or a pinch on
       the map (OrbitControls) is kept too; with someone else to frame (whoever is acting, what the hero just struck),
       it looks halfway between the two. engine/wander-cam.js has the numbers.
     · seeing the hero through walls (render/seethrough.js)
     · a hit, felt: the handheld buzzes and flashes, a controller rumbles; near death, the heart is heard */
import { camera, controls, camBusy, wx, wz, floorY } from '../render/scene.js';
import { toOrbit, fromOrbit, clampOrbit, crane, snapTurn, angleTo, nextView, glide, VIEWS, shoulderShot, eyesShot } from '../engine/wander-cam.js';
import { state, ui } from '../engine/state.js';
import { gfx } from '../render/gfx.js';
import { walk } from '../engine/tiles.js';
import { seeThrough, readyFloor } from '../render/seethrough.js';
import { tokenViews } from '../render/minis.js';
import { floorViews } from '../render/floors.js';
import { hh, rumble } from './handheld.js';
import { sfx, muffle } from '../audio/sound.js';
import { toast } from './hud.js';
import * as THREE from 'three';

const cam = { yaw:null, goal:null };
/* 🧭 THE HERO'S FACING: the camera always stands behind the hero (third person), so every screen looks the same way.
   The hero faces one of eight ways; L / R ([ ], a controller's shoulders) turn them an eighth where they stand, and the
   camera swings round behind; up on the stick or the D-pad is always forward (camYaw). In a fight the shoulder shot
   looks along it too: a foe they're turned toward is the one framed, and a new target turns them to face it. */
const EIGHTH = Math.PI / 4, snap8 = a => Math.round(a / EIGHTH) * EIGHTH;
const face = { id:null, a:null, subj:null, peek:0 };
const figOf = id => tokenViews.get(id)?.group?.userData?.fig;
function facingOf(me){
  if (!me) return null;
  if (face.id !== me.id || face.a === null){ face.id = me.id; face.subj = null;
    face.a = snap8(rawYaw() - Math.PI); const fig = figOf(me.id); if (fig) fig.userData.faceTo = face.a; }   // (they face away from where the camera is: no swing to begin with)
  return face.a;
}
// The hero turned to face a way (radians, the figure's own: atan2(dx, dz)), snapped to an eighth; its figure turns too
export function faceHero(me, a){ if (!me) return; face.id = me.id; face.a = snap8(a); const f = figOf(me.id); if (f) f.userData.faceTo = face.a; }
export const heroFacing = () => face.a;
// Is a token within reach of the way the hero faces (±67°)?
export function facingToward(me, o){ if (!me || !o || face.a === null) return false; return Math.abs(angleTo(face.a, Math.atan2(o.x - me.x, o.y - me.y))) <= EIGHTH * 1.5; }
// The nearest of `list` the hero is turned toward (for a turn in a fight to choose whom to face)
export function foeAhead(me, list){ return (list || []).filter(o => facingToward(me, o)).sort((a, b) => Math.max(Math.abs(a.x - me.x), Math.abs(a.y - me.y)) - Math.max(Math.abs(b.x - me.x), Math.abs(b.y - me.y)))[0] || null; }
const offset = () => camera.position.clone().sub(controls.target).toArray();
/* ⚔ Over the shoulder (engine/wander-cam.js shoulderShot): in a fight, unless the player chose to look from above, the
   camera stands low behind the hero, off one shoulder, looking past them at what they face. L / R swap the shoulder;
   the right stick sideways peeks round (it eases back when let go); V or craning out goes up above the fight, V again
   comes back down behind them. 👁 V from over the shoulder looks through their eyes instead (engine/wander-cam.js
   eyesShot: the hero's own figure hidden), and V again goes up above the fight. */
const sh = { on:true, active:false, fight:false, side:1, peek:0, eyes:false };
export const shoulderNow = () => sh.active;
export const eyesNow = () => sh.active && sh.eyes;
let hidden = null;   // (the hero whose figure is hidden while we look through their eyes)
function showHero(id){ if (hidden && hidden !== id){ const f = tokenViews.get(hidden)?.group.userData.fig; if (f) f.visible = true; hidden = null; }
  if (id){ const f = tokenViews.get(id)?.group.userData.fig; if (f && f.visible) f.visible = false; hidden = id; } }
// 🎬 a big moment (a crit, a kill): over the shoulder, the camera pushes in for ms, then eases back (not with calm effects)
export function camBeat(ms = 900, k = .3){ if (gfx.calm) return; sh.beat = { at:performance.now() + 300, ms, k }; }
function leaveShoulder(label){ sh.on = false; sh.active = false; sh.eyes = false; showHero(null); const v = VIEWS.find(x => x.k === 'high'); cam.goal = { pitch:v.pitch, dist:v.dist }; toast(`🎥 ${label}`); }
// L / R: the hero turns an eighth where they stand (+1 to their left), and the camera comes round behind them
export function camTurn(dir){
  if (face.a === null){ cam.yaw = snapTurn(cam.yaw ?? toOrbit(offset()).yaw, dir); return; }
  face.a = snap8(face.a + (dir > 0 ? 1 : -1) * EIGHTH); face.peek = 0;
  const f = face.id && figOf(face.id); if (f) f.userData.faceTo = face.a;
}
export function camView(){
  if (sh.active && !sh.eyes){ sh.eyes = true; toast('🎥 Through their eyes'); return; }
  if (sh.active){ leaveShoulder('Above the fight'); return; }
  if (sh.fight && !sh.on){ sh.on = true; toast('🎥 Over the shoulder'); return; }
  const v = nextView(cam.goal || toOrbit(offset())); cam.goal = { pitch:v.pitch, dist:v.dist }; toast(`🎥 ${v.label}`);
}
// Ease into the first view (Close), the way a run begins: when the table's handheld takes over a camera set for the map.
export function camStart(){ cam.goal = { pitch:VIEWS[0].pitch, dist:VIEWS[0].dist }; }
export function camCrane(k){ if (sh.active){ if (k > 0) leaveShoulder('Above the fight'); return; } const o = crane(cam.goal ? { yaw:0, ...cam.goal } : toOrbit(offset()), k * 1.4); cam.goal = { pitch:o.pitch, dist:o.dist }; }
/* A fight breaks out: the camera rises and draws back to take in the ground it's fought over (radius: in squares), then,
   once the moment's past, eases back to where the player had it. */
let heldView = null;
export function camWide(radius){ const o = toOrbit(offset()), was = { pitch:cam.goal?.pitch ?? o.pitch, dist:cam.goal?.dist ?? o.dist };
  if (!heldView) heldView = was;
  const w = clampOrbit({ yaw:o.yaw, pitch:Math.max(was.pitch, 52 * Math.PI / 180), dist:Math.max(was.dist * 1.3, radius * 2.2) }); cam.goal = { pitch:w.pitch, dist:w.dist }; }
export function camBack(){ if (heldView){ cam.goal = heldView; heldView = null; } }
// the camera's yaw: which way "up on the stick" walks
const rawYaw = () => { const o = camera.position.clone().sub(controls.target); return Math.atan2(o.x, o.z); };
export const camYaw = () => face.a !== null ? face.a + Math.PI : rawYaw();   // (behind the hero: "up" is the way they face)

/* One frame. dt in seconds; pad: a controller (readPad) or null; focus: { x, y, z, rate } in the world (where to look);
   me / other: tokens: with another on the same floor within 10 squares, the camera frames the two (rate: how fast). */
// How far behind the hero (squares, along the way from `s` to them) before something solid: where the camera can stand.
function roomBehind(me, hx, hz, sx, sz){
  const f = state?.floors?.[me.floor]; if (!f?.grid) return Infinity;
  let dx = hx - sx, dz = hz - sz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
  for (let d = .5; d <= 3.6; d += .25){ const x = Math.round(me.x + dx * d), y = Math.round(me.y + dz * d);
    if (x < 0 || y < 0 || x >= f.W || y >= (f.H || f.W) || !walk(f.grid[y * f.W + x])) return d; }
  return Infinity;
}
/* fight: { subject } — a fight is on (subject: the token the hero faces) — or null. While the over-the-shoulder view
   holds, focus and other are set aside. */
export function camFrame(dt, pad, { focus = null, me = null, other = null, otherRate = 3, fight = null } = {}){
  // (the view the player had before the fight, to go back to after it)
  if (fight && !sh.fight){ const o0 = toOrbit(offset()); sh.before = heldView || cam.goal || { pitch:o0.pitch, dist:o0.dist }; }
  if (!fight && sh.fight && sh.before){ cam.goal = { pitch:sh.before.pitch, dist:sh.before.dist }; sh.before = null; }
  sh.fight = !!fight; if (!fight){ sh.on = true; sh.active = false; sh.peek = 0; sh.eyes = false; }
  if (camBusy()) return;   // (a glide of its own is under way: a new floor, the start)
  let o = toOrbit(offset());
  const subj = fight && sh.on && me && fight.subject && fight.subject.floor === me.floor ? fight.subject : null;
  sh.active = !!subj; ui.shoulderOf = subj ? me.id : null; sh.subj = subj || null;
  showHero(subj && sh.eyes ? me.id : null);
  if (me) facingOf(me);
  if (subj && subj.id !== face.subj){ face.subj = subj.id; faceHero(me, Math.atan2(subj.x - me.x, subj.y - me.y)); }   // (a new target: turn to it)
  if (!subj) face.subj = null;
  if (subj){
    // what's framed: the foe if they're turned toward it, else the ground ahead of them
    const a = miniFocus(me), b = facingToward(me, subj) ? miniFocus(subj) : { x:a.x + Math.sin(face.a) * 4, y:a.y, z:a.z + Math.cos(face.a) * 4 }, shot = sh.eyes ? eyesShot({ x:a.x, z:a.z }, { x:b.x, z:b.z })
      : shoulderShot({ x:a.x, z:a.z }, { x:b.x, z:b.z }, { side:sh.side, room:roomBehind(me, a.x, a.z, b.x, b.z) });
    if (pad && Math.abs(pad.rx) > .2) sh.peek = Math.max(-1.3, Math.min(1.3, sh.peek - pad.rx * dt * 2.2)); else sh.peek *= 1 - glide(dt, 2.5);
    const k = glide(dt, 4.5), goalYaw = shot.orbit.yaw + sh.peek;
    // (a beat: in close, quickly, then back out slowly)
    const bt = sh.beat ? (performance.now() - sh.beat.at) / sh.beat.ms : -1, be = bt < 0 || bt > 1 ? 0 : bt < .2 ? bt / .2 : 1 - (bt - .2) / .8;
    if (bt > 1) sh.beat = null;
    const goalDist = shot.orbit.dist * (1 - (sh.beat?.k || 0) * be), kd = be > 0 ? glide(dt, 9) : k;
    o.yaw += angleTo(o.yaw, goalYaw) * k; o.pitch += (shot.orbit.pitch - o.pitch) * k; o.dist += (goalDist - o.dist) * kd;
    const t = controls.target, ly = a.y + shot.look.y, kt = glide(dt, 5);
    t.x += (shot.look.x - t.x) * kt; t.y += (ly - t.y) * kt; t.z += (shot.look.z - t.z) * kt;
    cam.yaw = null; cam.goal = null;
    { const tv = tokenViews.get(me.id), f = tv?.group?.userData?.fig; if (f && !tv.anim && !f.userData.rig?.action && f.userData.faceTo !== face.a) f.userData.faceTo = face.a; }
    const [x, y, z] = fromOrbit(o); camera.position.set(t.x + x, t.y + y, t.z + z);
    return;
  }
  // behind the hero, always (the right stick peeks round and eases back when let go)
  if (pad && Math.abs(pad.rx) > .2) face.peek = Math.max(-1.6, Math.min(1.6, face.peek - pad.rx * dt * 2.4)); else face.peek *= 1 - glide(dt, 2.5);
  if (me && facingOf(me) !== null){ cam.yaw = null; o.yaw += angleTo(o.yaw, face.a + Math.PI + face.peek) * glide(dt, 6);
    const tv = tokenViews.get(me.id), f = tv?.group?.userData?.fig; if (f && !tv.anim && f.userData.faceTo !== face.a) f.userData.faceTo = face.a; }   // (standing: they face their way again)
  if (pad && Math.abs(pad.ry) > .25){ o = crane(o, pad.ry * dt * 3.2); cam.goal = null; }
  if (cam.yaw !== null){ const d = angleTo(o.yaw, cam.yaw); if (Math.abs(d) < .003){ o.yaw = cam.yaw; cam.yaw = null; } else o.yaw += d * glide(dt, 9); }
  if (cam.goal){ const k = glide(dt, 6); o.pitch += (cam.goal.pitch - o.pitch) * k; o.dist += (cam.goal.dist - o.dist) * k;
    if (Math.abs(cam.goal.pitch - o.pitch) < .002 && Math.abs(cam.goal.dist - o.dist) < .02) cam.goal = null; }
  { const c = clampOrbit(o), k = glide(dt, 5); o.pitch += (c.pitch - o.pitch) * k; o.dist += (c.dist - o.dist) * k; }   // (eased, so leaving the shoulder rises smoothly)
  let f = focus;
  if (me && other && other.floor === me.floor && !other.flags?.gone && Math.max(Math.abs(other.x - me.x), Math.abs(other.y - me.y)) <= 10)
    f = { x:(wx(me.x) + wx(other.x)) / 2, y:floorY(me.floor), z:(wz(me.y) + wz(other.y)) / 2, rate:otherRate };
  if (f && f === focus && me && face.a !== null) f = { ...f, x:f.x + Math.sin(face.a) * 1.3, y:f.y + .45, z:f.z + Math.cos(face.a) * 1.3 };   // (third person: a little ahead of them, so the way on shows)
  if (f){ const k = glide(dt, f.rate || 7), t = controls.target; t.x += (f.x - t.x) * k; t.y += (f.y - t.y) * k; t.z += (f.z - t.z) * k; }
  const [x, y, z] = fromOrbit(o); camera.position.set(controls.target.x + x, controls.target.y + y, controls.target.z + z);
}
// Where a token's mini stands now (mid-step too), for the camera to follow: { x, y, z, rate } or null.
const wp = new THREE.Vector3();
export function miniFocus(t, rate = 8){
  const tv = t && tokenViews.get(t.id); if (!tv?.group?.parent) return t ? { x:wx(t.x), y:floorY(t.floor), z:wz(t.y), rate } : null;
  tv.group.getWorldPosition(wp); return { x:wp.x, y:floorY(t.floor), z:wp.z, rate };
}

/* ---------- 👁 seeing the hero through walls ---------- */
const at = new THREE.Vector3(), foeAt = new THREE.Vector3();
let readyAt = 0, holeOpen = false;
export function lookThrough(t, now = performance.now()){
  const tv = t && tokenViews.get(t.id);
  if (!hh.seeThru || !tv?.group?.parent){ closeLook(); return; }
  if (now - readyAt > 500){ readyAt = now; readyFloor(floorViews[t.floor]); }
  tv.group.getWorldPosition(at); const feet = at.y; at.y += .75;
  // over the shoulder: what they face is kept in sight too (a trunk between the camera and the foe is thinned away)
  const fv = sh.active && sh.subj && tokenViews.get(sh.subj.id); let foe = null;
  if (fv?.group?.parent){ foe = fv.group.getWorldPosition(foeAt); foe.y += .7; }
  seeThrough(at, feet, 1.5, foe); holeOpen = true;
}
export function closeLook(){ if (holeOpen){ seeThrough(null); holeOpen = false; } }

/* ---------- a hit, felt ---------- */
let hpSeen = null, heroSeen = null, beatAt = 0;
// 💓 near death, the screen's edges pulse red with the heart (stronger the closer to it); gone when they're whole again
let pulseEl = null, pulseK = -1;
function nearDeath(k){
  if (typeof document === 'undefined') return;
  if (!pulseEl){ pulseEl = document.createElement('div'); pulseEl.id = 'nearDeath';
    Object.assign(pulseEl.style, { position:'fixed', inset:'0', pointerEvents:'none', zIndex:'5', opacity:'0', transition:'opacity .6s',
      background:'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 48%, rgba(150,0,12,.55) 100%)' });
    document.body.appendChild(pulseEl); }
  const want = k <= 0 ? 0 : k <= .12 ? 2 : k <= .25 ? 1 : 0;
  if (want === pulseK) return; pulseK = want; muffle(want);   // (and the music goes far away: audio/sound.js)
  pulseEl.getAnimations?.().forEach(a => a.cancel());
  pulseEl.style.opacity = want ? '1' : '0';
  if (want && pulseEl.animate && !gfx.calm) pulseEl.animate([{ opacity:.35 }, { opacity:1, offset:.18 }, { opacity:.45 }], { duration:want === 2 ? 850 : 1150, iterations:Infinity, easing:'ease-out' });
}
export const nearDeathNow = () => pulseK;
export function feelHits(t, gp){
  if (!t){ hpSeen = heroSeen = null; nearDeath(0); return; }
  if (heroSeen !== t.id){ heroSeen = t.id; hpSeen = t.hp; return; }
  if (hpSeen !== null && t.hp < hpSeen){
    const k = (hpSeen - t.hp) / Math.max(1, t.maxHp);
    rumble(k);
    try { gp?.vibrationActuator?.playEffect?.('dual-rumble', { duration:Math.round(120 + Math.min(1, k) * 380), strongMagnitude:Math.min(1, .35 + k * 1.5), weakMagnitude:.6 }); } catch {}
  }
  hpSeen = t.hp;
  // near death, the heart is heard
  const k = t.hp / Math.max(1, t.maxHp), now = performance.now();
  if (t.hp > 0 && k <= .25 && now > beatAt){ beatAt = now + (k <= .12 ? 850 : 1150); sfx('thump', false); }
  nearDeath(t.hp > 0 ? k : 0);
}
