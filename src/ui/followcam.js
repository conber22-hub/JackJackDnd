/* 🎥 THE FOLLOW CAMERA, and what goes with playing one hero: shared by the Wanderer (ui/wander.js) and a player's
   handheld at the table (ui/tablehh.js).
     · the camera eases after a focus every frame, keeping its turn, height and distance; the right stick turns and
       cranes it; a snap turn (L / R, [ ]) or a view (V, View, the right stick's click) eases in; a drag or a pinch on
       the map (OrbitControls) is kept too; with someone else to frame (whoever is acting, what the hero just struck),
       it looks halfway between the two. engine/wander-cam.js has the numbers.
     · seeing the hero through walls (render/seethrough.js)
     · a hit, felt: the handheld buzzes and flashes, a controller rumbles; near death, the heart is heard */
import { camera, controls, camBusy, wx, wz, floorY } from '../render/scene.js';
import { toOrbit, fromOrbit, clampOrbit, crane, snapTurn, angleTo, nextView, glide, VIEWS, shoulderShot } from '../engine/wander-cam.js';
import { state, ui } from '../engine/state.js';
import { walk } from '../engine/tiles.js';
import { seeThrough, readyFloor } from '../render/seethrough.js';
import { tokenViews } from '../render/minis.js';
import { floorViews } from '../render/floors.js';
import { hh, rumble } from './handheld.js';
import { sfx } from '../audio/sound.js';
import { toast } from './hud.js';
import * as THREE from 'three';

const cam = { yaw:null, goal:null };
const offset = () => camera.position.clone().sub(controls.target).toArray();
/* ⚔ Over the shoulder (engine/wander-cam.js shoulderShot): in a fight, unless the player chose to look from above, the
   camera stands low behind the hero, off one shoulder, looking past them at what they face. L / R swap the shoulder;
   the right stick sideways peeks round (it eases back when let go); V or craning out goes up above the fight, V again
   comes back down behind them. */
const sh = { on:true, active:false, fight:false, side:1, peek:0 };
export const shoulderNow = () => sh.active;
function leaveShoulder(label){ sh.on = false; sh.active = false; const v = VIEWS.find(x => x.k === 'high'); cam.goal = { pitch:v.pitch, dist:v.dist }; toast(`🎥 ${label}`); }
export function camTurn(dir){ if (sh.active){ sh.side = -sh.side; return; } cam.yaw = snapTurn(cam.yaw ?? toOrbit(offset()).yaw, dir); }
export function camView(){
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
export const camYaw = () => { const o = camera.position.clone().sub(controls.target); return Math.atan2(o.x, o.z); };

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
  sh.fight = !!fight; if (!fight){ sh.on = true; sh.active = false; sh.peek = 0; }
  if (camBusy()) return;   // (a glide of its own is under way: a new floor, the start)
  let o = toOrbit(offset());
  const subj = fight && sh.on && me && fight.subject && fight.subject.floor === me.floor ? fight.subject : null;
  sh.active = !!subj; ui.shoulderOf = subj ? me.id : null; sh.subj = subj || null;
  if (subj){
    const a = miniFocus(me), b = miniFocus(subj), shot = shoulderShot({ x:a.x, z:a.z }, { x:b.x, z:b.z }, { side:sh.side, room:roomBehind(me, a.x, a.z, b.x, b.z) });
    if (pad && Math.abs(pad.rx) > .2) sh.peek = Math.max(-1.3, Math.min(1.3, sh.peek - pad.rx * dt * 2.2)); else sh.peek *= 1 - glide(dt, 2.5);
    const k = glide(dt, 4.5), goalYaw = shot.orbit.yaw + sh.peek;
    o.yaw += angleTo(o.yaw, goalYaw) * k; o.pitch += (shot.orbit.pitch - o.pitch) * k; o.dist += (shot.orbit.dist - o.dist) * k;
    const t = controls.target, ly = a.y + shot.look.y, kt = glide(dt, 5);
    t.x += (shot.look.x - t.x) * kt; t.y += (ly - t.y) * kt; t.z += (shot.look.z - t.z) * kt;
    cam.yaw = null; cam.goal = null;
    const [x, y, z] = fromOrbit(o); camera.position.set(t.x + x, t.y + y, t.z + z);
    return;
  }
  if (pad && Math.abs(pad.rx) > .2){ o.yaw -= pad.rx * dt * 2.4; cam.yaw = null; }
  if (pad && Math.abs(pad.ry) > .25){ o = crane(o, pad.ry * dt * 3.2); cam.goal = null; }
  if (cam.yaw !== null){ const d = angleTo(o.yaw, cam.yaw); if (Math.abs(d) < .003){ o.yaw = cam.yaw; cam.yaw = null; } else o.yaw += d * glide(dt, 9); }
  if (cam.goal){ const k = glide(dt, 6); o.pitch += (cam.goal.pitch - o.pitch) * k; o.dist += (cam.goal.dist - o.dist) * k;
    if (Math.abs(cam.goal.pitch - o.pitch) < .002 && Math.abs(cam.goal.dist - o.dist) < .02) cam.goal = null; }
  { const c = clampOrbit(o), k = glide(dt, 5); o.pitch += (c.pitch - o.pitch) * k; o.dist += (c.dist - o.dist) * k; }   // (eased, so leaving the shoulder rises smoothly)
  let f = focus;
  if (me && other && other.floor === me.floor && !other.flags?.gone && Math.max(Math.abs(other.x - me.x), Math.abs(other.y - me.y)) <= 10)
    f = { x:(wx(me.x) + wx(other.x)) / 2, y:floorY(me.floor), z:(wz(me.y) + wz(other.y)) / 2, rate:otherRate };
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
  if (want === pulseK) return; pulseK = want;
  pulseEl.getAnimations?.().forEach(a => a.cancel());
  pulseEl.style.opacity = want ? '1' : '0';
  if (want && pulseEl.animate) pulseEl.animate([{ opacity:.35 }, { opacity:1, offset:.18 }, { opacity:.45 }], { duration:want === 2 ? 850 : 1150, iterations:Infinity, easing:'ease-out' });
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
