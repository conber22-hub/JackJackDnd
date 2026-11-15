/* 🎥 THE FOLLOW CAMERA, and what goes with playing one hero: shared by the Wanderer (ui/wander.js) and a player's
   handheld at the table (ui/tablehh.js).
     · the camera eases after a focus every frame, keeping its turn, height and distance; the right stick turns and
       cranes it; a snap turn (L / R, [ ]) or a view (V, View, the right stick's click) eases in; a drag or a pinch on
       the map (OrbitControls) is kept too; with someone else to frame (whoever is acting, what the hero just struck),
       it looks halfway between the two. engine/wander-cam.js has the numbers.
     · seeing the hero through walls (render/seethrough.js)
     · a hit, felt: the handheld buzzes and flashes, a controller rumbles; near death, the heart is heard */
import { camera, controls, camBusy, wx, wz, floorY } from '../render/scene.js';
import { toOrbit, fromOrbit, clampOrbit, crane, snapTurn, angleTo, nextView, glide, VIEWS } from '../engine/wander-cam.js';
import { seeThrough, readyFloor } from '../render/seethrough.js';
import { tokenViews } from '../render/minis.js';
import { floorViews } from '../render/floors.js';
import { hh, rumble } from './handheld.js';
import { sfx } from '../audio/sound.js';
import { toast } from './hud.js';
import * as THREE from 'three';

const cam = { yaw:null, goal:null };
const offset = () => camera.position.clone().sub(controls.target).toArray();
export function camTurn(dir){ cam.yaw = snapTurn(cam.yaw ?? toOrbit(offset()).yaw, dir); }
export function camView(){ const v = nextView(cam.goal || toOrbit(offset())); cam.goal = { pitch:v.pitch, dist:v.dist }; toast(`🎥 ${v.label}`); }
// Ease into the first view (Close), the way a run begins: when the table's handheld takes over a camera set for the map.
export function camStart(){ cam.goal = { pitch:VIEWS[0].pitch, dist:VIEWS[0].dist }; }
export function camCrane(k){ const o = crane(cam.goal ? { yaw:0, ...cam.goal } : toOrbit(offset()), k * 1.4); cam.goal = { pitch:o.pitch, dist:o.dist }; }
// the camera's yaw: which way "up on the stick" walks
export const camYaw = () => { const o = camera.position.clone().sub(controls.target); return Math.atan2(o.x, o.z); };

/* One frame. dt in seconds; pad: a controller (readPad) or null; focus: { x, y, z, rate } in the world (where to look);
   me / other: tokens: with another on the same floor within 10 squares, the camera frames the two (rate: how fast). */
export function camFrame(dt, pad, { focus = null, me = null, other = null, otherRate = 3 } = {}){
  if (camBusy()) return;   // (a glide of its own is under way: a new floor, the start)
  let o = toOrbit(offset());
  if (pad && Math.abs(pad.rx) > .2){ o.yaw -= pad.rx * dt * 2.4; cam.yaw = null; }
  if (pad && Math.abs(pad.ry) > .25){ o = crane(o, pad.ry * dt * 3.2); cam.goal = null; }
  if (cam.yaw !== null){ const d = angleTo(o.yaw, cam.yaw); if (Math.abs(d) < .003){ o.yaw = cam.yaw; cam.yaw = null; } else o.yaw += d * glide(dt, 9); }
  if (cam.goal){ const k = glide(dt, 6); o.pitch += (cam.goal.pitch - o.pitch) * k; o.dist += (cam.goal.dist - o.dist) * k;
    if (Math.abs(cam.goal.pitch - o.pitch) < .002 && Math.abs(cam.goal.dist - o.dist) < .02) cam.goal = null; }
  o = clampOrbit(o);
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
const at = new THREE.Vector3();
let readyAt = 0, holeOpen = false;
export function lookThrough(t, now = performance.now()){
  const tv = t && tokenViews.get(t.id);
  if (!hh.seeThru || !tv?.group?.parent){ closeLook(); return; }
  if (now - readyAt > 500){ readyAt = now; readyFloor(floorViews[t.floor]); }
  tv.group.getWorldPosition(at); const feet = at.y; at.y += .75;
  seeThrough(at, feet); holeOpen = true;
}
export function closeLook(){ if (holeOpen){ seeThrough(null); holeOpen = false; } }

/* ---------- a hit, felt ---------- */
let hpSeen = null, heroSeen = null, beatAt = 0;
export function feelHits(t, gp){
  if (!t){ hpSeen = heroSeen = null; return; }
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
}
