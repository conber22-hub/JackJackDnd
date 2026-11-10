/* QUATERNIUS CLIPS — the forged figures' movement, from the Quaternius Universal Animation Library (Standard tier,
   CC0 1.0), extracted to public/assets/anim/quaternius.json by scripts/extract-quaternius.mjs. Rotations only,
   world-relative to the rest pose, per forge joint: the app moves figures along its own paths, and poseRig already
   bobs the hips, so no translation is ever read. The file loads on demand, like the prop models; if it can't load
   (the offline single file, no network) every action keeps the hand-keyed poses in anim.js — nothing breaks.
   A clip owns the joints it drives while it plays, blended over poseRig's stance and stride so a swing starts and
   ends without a snap; joints the clip doesn't cover (the head's glance, cloaks, flames) keep poseRig. */
import * as THREE from 'three';

// app kind -> clip name(s) in quaternius.json. Smash and shoot have no matching clip in the Standard tier (no
// overhead two-handed swing, no bow draw), so they keep the hand-keyed poses. Cast is a sequence: the raise, then the release.
// Death is a sequence of one: the fall, which holds its final pose (see applyClips) instead of fading back.
export const CLIP_FOR = {
  walk: 'Walk_Loop', slash: 'Sword_Attack', thrust: 'Punch_Jab', claw: 'Punch_Cross',
  cast: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], hit: 'Hit_Chest', death: 'Death01',
};
const WALK = 'Walk_Loop';
let data = null, failed = false, loading = null;
const base = () => (typeof location !== 'undefined' && location.protocol !== 'file:') ? 'assets/anim/' : null;
// Fetch the clips (once). Kicked off when anim.js loads, so they are usually here before the first swing.
export function loadClips(){
  if (data) return Promise.resolve(data);
  if (failed) return Promise.resolve(null);
  if (!loading){
    const root = base();
    loading = root ? fetch(root + 'quaternius.json').then(r => { if (!r.ok) throw new Error('no clips'); return r.json(); })
      .then(d => { data = d; return d; }).catch(() => { failed = true; return null; }) : Promise.resolve(null);
  }
  return loading;
}
export function injectClips(d){ data = d; failed = false; }   // the e2e spec: the harness serves only the baked page, so assets 404 there
export const clipsReady = () => !!data;
export const clipNames = () => data ? Object.keys(data.clips) : [];
const namesFor = kind => { const c = CLIP_FOR[kind]; return c ? (Array.isArray(c) ? c : [c]) : null; };
// How long an action kind's clip(s) run, or null (no clip, or not loaded yet).
export function clipDuration(kind){
  if (!data) return null;
  const names = namesFor(kind); if (!names) return null;
  let total = 0; for (const n of names){ const c = data.clips[n]; if (!c) return null; total += c.dur; }
  return total;
}
export const hasClip = kind => clipDuration(kind) != null;
// Start a clip action on a rig. rig.action keeps the shape playAction always set ({ k, t0, dur }), so the studio's
// phase-freeze and the forge spec keep reading it; rig.clip carries the clip names for the player.
export function playClip(rig, kind){
  const dur = clipDuration(kind); if (dur == null) return false;
  rig.action = { k: kind, t0: performance.now() / 1000, dur };
  rig.clip = { kind, names: namesFor(kind), t0: rig.action.t0, dur };
  return true;
}

const PARENT = { hips: 'root', spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  shL: 'chest', upL: 'shL', foL: 'upL', haL: 'foL', shR: 'chest', upR: 'shR', foR: 'upR', haR: 'foR',
  thL: 'hips', snL: 'thL', ftL: 'snL', thR: 'hips', snR: 'thR', ftR: 'snR' };
const ORDER = ['hips', 'spine', 'chest', 'neck', 'head', 'shL', 'upL', 'foL', 'haL', 'shR', 'upR', 'foR', 'haR', 'thL', 'snL', 'ftL', 'thR', 'snR', 'ftR'];
const JOINT = { hips: r => r.hips, spine: r => r.spine, chest: r => r.chest, neck: r => r.neck, head: r => r.head,
  shL: r => r.aL.s, upL: r => r.aL.u, foL: r => r.aL.f, haL: r => r.aL.h, shR: r => r.aR.s, upR: r => r.aR.u, foR: r => r.aR.f, haR: r => r.aR.h,
  thL: r => r.lL.t, snL: r => r.lL.sh, ftL: r => r.lL.ft, thR: r => r.lR.t, snR: r => r.lR.sh, ftR: r => r.lR.ft };
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _fig = new THREE.Quaternion();
const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
// The clip and the time inside it for a sequence at elapsed seconds.
function at(names, el){
  let t = el;
  for (const n of names){ const c = data.clips[n]; if (t < c.dur || n === names[names.length - 1]) return { clip: c, t: Math.min(t, c.dur) }; t -= c.dur; }
  return { clip: data.clips[names[names.length - 1]], t: 0 };
}
// Sample a clip at time t (seconds) into out (joint -> Quaternion, reused).
function sample(clip, t, out){
  for (const [joint, frames] of Object.entries(clip.joints)){
    let i = 0; while (i < frames.length - 2 && frames[i + 1][0] < t) i++;
    const a = frames[i], b = frames[i + 1] || a, span = b[0] - a[0] || 1, u = Math.min(1, Math.max(0, (t - a[0]) / span));
    _q1.set(a[1], a[2], a[3], a[4]); _q2.set(b[1], b[2], b[3], b[4]);
    (out[joint] ||= new THREE.Quaternion()).copy(_q1).slerp(_q2, u);
  }
  return out;
}
// Blend the active clip over poseRig's output. Called at the end of poseRig, so the stance, stride, tilt and
// facing are already in the joints; walkPhase is poseRig's stride phase (t * 10 + seed), which drives the walk
// clip so the feet stay with the ground. figure-local space throughout: the clip's stored deltas are the joints'
// orientation in the figure's frame, and the figure's yaw lives in the scene graph, not in the joints.
const sampled = {};
export function applyClips(fig, t, dt, walkPhase){
  void dt;
  const rig = fig.userData.rig; if (!rig || !data) return;
  let names = null, ct = 0, w = 0, endClip = false;
  // Death is allowed through without rig.action: poseRig clears the action the moment it ends
  // (ak >= 1), and that is the very frame the final pose must be written — see the endClip branch.
  if (rig.clip && (rig.action || rig.clip.kind === 'death')){
    const el = t - rig.clip.t0;
    if (el >= 0 && el < rig.clip.dur){
      names = rig.clip.names; ct = el;
      // Death holds its final pose: it ramps in like any clip, but never ramps out — a corpse
      // does not stand back up. Every other clip fades back to the stance.
      w = rig.clip.kind === 'death' ? smooth(Math.min(el / .1, 1)) : smooth(Math.min(el / .1, (rig.clip.dur - el) / .1));
    }
    else if (rig.clip.kind === 'death'){
      // The clip is over, but the figure must not snap back to standing on this frame: apply
      // the final frame once, at full weight, then clear the clip. The main loop skips the
      // dead figure from here on, so its joints freeze at the last frame (see main.js).
      names = rig.clip.names; ct = rig.clip.dur; w = 1; endClip = true;
    }
    else rig.clip = null;
  }
  if (!names && !rig.action && rig.walk > .01){
    const c = data.clips[WALK];
    if (c){ names = [WALK]; ct = ((((walkPhase / (Math.PI * 2)) % 1) + 1) % 1) * c.dur; w = rig.walk; }
  }
  rig.clipWalk = !!(names && names[0] === WALK);   // the spec reads this: the walk clip is driving the stride
  if (!names || w <= 0) return;
  const { clip, t: lt } = at(names, ct);
  sample(clip, lt, sampled);
  fig.updateMatrixWorld(true);
  fig.getWorldQuaternion(_fig); _fig.invert();   // figure-local = world, minus the figure's own turn
  const stance = {}, blended = { root: new THREE.Quaternion() };
  for (const name of ORDER){
    const j = JOINT[name](rig); if (!j) continue;
    j.getWorldQuaternion(_q1);
    stance[name] = _q1.clone().premultiply(_fig);
  }
  for (const name of ORDER){
    const j = JOINT[name](rig), cq = sampled[name];
    if (!j || !cq || !stance[name]) continue;
    _q2.copy(stance[name]).slerp(cq, w);
    blended[name] = _q2.clone();
    const parent = PARENT[name] === 'root' ? blended.root : blended[PARENT[name]];
    if (!parent) continue;
    _q3.copy(parent).invert().multiply(_q2);
    j.quaternion.copy(_q3);
  }
  if (endClip) rig.clip = null;   // the death clip's final frame is in the joints; now let the main loop rest the figure
}
