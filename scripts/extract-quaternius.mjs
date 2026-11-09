/* Extract Quaternius animation clips into the JSON the forge plays.
   The pack's GLB is binary (6.7 MB) and cannot travel through the repo's
   snapshot push, so it is fetched once, offline, and only the rotations the
   forge needs are extracted — as text — into public/assets/anim/quaternius.json.
   The hand-keyed poses in render/forge/anim.js stay as the fallback.

   Source: Quaternius Universal Animation Library, Standard tier (CC0 1.0).
   Fetch: https://store.godotengine.org/asset/quaternius/universal-animation-library/download/44/
   (Universal_Animation_LibraryStandard.zip) and unzip it; the GLB is
   "Animation Library[Standard]/Godot/AnimationLibrary_Godot_Standard.glb".
   That file is Standard-1.0 (2025-06-23), Blender Rigify "DEF-" bones,
   30 fps, in-place locomotion. A fresh itch download (v2/v3) changed the rig
   naming and added root motion — re-check the bone map before re-extracting.

   What is extracted, per clip: for each forge joint, the bone's world
   orientation relative to its rest pose, as keyframed quaternions
   (Δ = R_rest^-1 * R(t), composed down the source skeleton). Rotations
   only — root and pelvis translation are ignored: the app moves figures
   along their own paths, and poseRig already bobs the hips. The forge's
   joints rest at identity, so Δ applies directly in the figure's frame;
   the mannequin faces +Z in glTF world space, the same way a forged
   figure faces +z, so no yaw correction is needed (verified below by the
   rest-pose joint positions).

   Usage: node scripts/extract-quaternius.mjs <path-to-...Standard.glb> [out.json]
   Default out: public/assets/anim/quaternius.json (relative to the repo root). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The clips Dread Delve plays, and the app kind each one serves.
const CLIPS = {
  Walk_Loop: 'walk', Sword_Attack: 'slash', Punch_Jab: 'thrust', Punch_Cross: 'claw',
  Spell_Simple_Enter: 'cast-enter', Spell_Simple_Shoot: 'cast-shoot', Hit_Chest: 'hit',
};
// Trim (seconds, in the clip's own time) to the strike: Sword_Attack opens with
// the sword held ready and closes by settling back; the swing itself runs
// ~0.2–1.1 s. The rest is cut — the player's fade back to the stance covers it.
const TRIM = { Sword_Attack: [0.2, 1.1] };
// Forge joint <- source bone. The forge's chest carries the whole upper spine
// (spine.002 + spine.003 compose into it in world space); fingers and toes
// have no forge joint and are dropped.
const BONES = {
  hips: 'DEF-hips', spine: 'DEF-spine.001', chest: 'DEF-spine.003', neck: 'DEF-neck', head: 'DEF-head',
  shL: 'DEF-shoulder.L', upL: 'DEF-upper_arm.L', foL: 'DEF-forearm.L', haL: 'DEF-hand.L',
  shR: 'DEF-shoulder.R', upR: 'DEF-upper_arm.R', foR: 'DEF-forearm.R', haR: 'DEF-hand.R',
  thL: 'DEF-thigh.L', snL: 'DEF-shin.L', ftL: 'DEF-foot.L',
  thR: 'DEF-thigh.R', snR: 'DEF-shin.R', ftR: 'DEF-foot.R',
};
const Q0 = [0, 0, 0, 1];
const qmul = (a, b) => { const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]; };
const qinv = a => [-a[0], -a[1], -a[2], a[3]];
const qnorm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
const qangle = (a, b) => { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return 2 * Math.acos(Math.min(1, d)); };
function slerp(a, b, t){
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0){ b = b.map(v => -v); d = -d; }
  if (d > .9995){ const r = a.map((v, i) => v + (b[i] - v) * t); return qnorm(r); }
  const th = Math.acos(Math.min(1, d)), s = Math.sin(th), u = Math.sin((1 - t) * th) / s, v = Math.sin(t * th) / s;
  return a.map((x, i) => x * u + b[i] * v);
}
const r3 = v => Math.round(v * 1000) / 1000;

function readGLB(buf){
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('not a glTF binary');
  let off = 12; const chunks = {};
  while (off < buf.length){ const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4); chunks[type] = buf.subarray(off + 8, off + 8 + len); off += 8 + len; }
  const json = JSON.parse(chunks[0x4E4F534A].toString('utf8')), bin = chunks[0x4E4942];
  return { json, bin };
}
function accessor(json, bin, i){
  const a = json.accessors[i], bv = json.bufferViews[a.bufferView], base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const n = a.count, comp = a.componentType, type = a.type;
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
  const out = new Array(n);
  for (let k = 0; k < n; k++){
    const o = base + k * size * (comp === 5126 ? 4 : comp === 5123 ? 2 : comp === 5125 ? 4 : 4);
    const v = []; for (let c = 0; c < size; c++) v.push(comp === 5126 ? bin.readFloatLE(o + c * 4) : comp === 5123 ? bin.readUInt16LE(o + c * 2) : bin.readUInt32LE(o + c * 4));
    out[k] = size === 1 ? v[0] : v;
  }
  return out;
}

const [,, glbPath, outPath] = process.argv;
if (!glbPath){ console.error('usage: node scripts/extract-quaternius.mjs <Standard.glb> [out.json]'); process.exit(1); }
const { json, bin } = readGLB(readFileSync(glbPath));
const nodes = json.nodes, parents = {};
nodes.forEach((n, i) => (n.children || []).forEach(c => parents[c] = i));
const nodeByName = {}; nodes.forEach((n, i) => nodeByName[n.name] = i);
const restQ = i => nodes[i].rotation || Q0;
const restT = i => nodes[i].translation || [0, 0, 0];
// rest world orientation and position of every node (root's -90° about X included)
const restWQ = {}, restWP = {};
(function walk(i, pq, pp){
  const q = qnorm(qmul(pq, restQ(i))), t = restT(i);
  const [x, y, z] = t, [qx, qy, qz, qw] = pq;
  // rotate t by pq: v' = v + 2 * q_xyz × (q_xyz × v + qw * v)
  const cx = qy * z - qz * y, cy = qz * x - qx * z, cz = qx * y - qy * x;
  const rx = x + 2 * (qy * (cz + qw * z) - qz * (cy + qw * y));
  const ry = y + 2 * (qz * (cx + qw * x) - qx * (cz + qw * z));
  const rz = z + 2 * (qx * (cy + qw * y) - qy * (cx + qw * x));
  restWQ[i] = q; restWP[i] = [pp[0] + rx, pp[1] + ry, pp[2] + rz];
  (nodes[i].children || []).forEach(c => walk(c, q, restWP[i]));
})(nodeByName.Rig ?? 0, Q0, [0, 0, 0]);
// The mannequin faces +Z in glTF world space: hands out to the sides and low,
// head up, toes forward. If a re-export ever changes this, the deltas below
// would need a yaw correction before they match a forged figure facing +z.
const p = n => restWP[nodeByName[n]].map(v => v.toFixed(2)).join(',');
console.log('rest pose (world): head', p('DEF-head'), '| hand.L', p('DEF-hand.L'), '| hand.R', p('DEF-hand.R'), '| foot.L', p('DEF-foot.L'), '| toe.L', p('DEF-toe.L'));

// animation channels: node -> { times, quats } for rotation paths
function clipData(anim){
  const chans = {};
  for (const ch of anim.channels){
    if (ch.target.path !== 'rotation') continue;
    const s = anim.samplers[ch.sampler];
    if (s.interpolation && s.interpolation !== 'LINEAR') throw new Error(`${anim.name}: sampler interpolation ${s.interpolation} — only LINEAR is handled`);
    chans[ch.target.node] = { times: accessor(json, bin, s.input), quats: accessor(json, bin, s.output).map(qnorm) };
  }
  return chans;
}
function sampleAt(ch, t){
  const { times, quats } = ch;
  if (t <= times[0]) return quats[0];
  if (t >= times[times.length - 1]) return quats[times.length - 1];
  let i = 0; while (i < times.length - 2 && times[i + 1] < t) i++;
  return slerp(quats[i], quats[i + 1], (t - times[i]) / (times[i + 1] - times[i]));
}

const out = {
  source: 'Quaternius Universal Animation Library, Standard tier (46 clips)',
  url: 'https://store.godotengine.org/asset/quaternius/universal-animation-library/download/44/',
  version: 'Standard-1.0 (2025-06-23)',
  licence: 'CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/',
  note: 'Rotations only, world-relative to the rest pose (Δ = R_rest^-1 * R(t)), per forge joint, 30 fps. Translations (root motion, hips bob) are ignored: the app moves figures itself.',
  clips: {},
};
for (const anim of json.animations){
  if (!CLIPS[anim.name]) continue;
  const chans = clipData(anim);
  const allTimes = [...new Set(Object.values(chans).flatMap(c => c.times))].sort((a, b) => a - b);
  const [tr0, tr1] = TRIM[anim.name] || [allTimes[0], allTimes[allTimes.length - 1]];
  const times = allTimes.filter(t => t >= tr0 - 1e-6 && t <= tr1 + 1e-6);
  const t0 = times[0], dur = times[times.length - 1] - t0;
  const joints = {};
  for (const [joint, bone] of Object.entries(BONES)){
    const ni = nodeByName[bone];
    // world orientation of this bone at time t: compose the clip's local
    // rotations down the chain from the root (bones without a channel keep rest)
    const worldAt = t => {
      const chain = []; let i = ni; while (i !== undefined){ chain.unshift(i); i = parents[i]; }
      let q = Q0;
      for (const n of chain){ const ch = chans[n]; q = qmul(q, ch ? sampleAt(ch, t) : restQ(n)); }
      return qnorm(q);
    };
    const frames = [];
    for (const t of times){
      const d = qnorm(qmul(qinv(restWQ[ni]), worldAt(t)));
      if (qangle(d, Q0) < .0005 && frames.length && t !== times[times.length - 1]) continue; // drop still frames, keep first and last
      frames.push([r3(t - t0), ...d.map(r3)]);
    }
    joints[joint] = frames;
  }
  out.clips[anim.name] = { kind: CLIPS[anim.name], dur: r3(dur), fps: 30, joints };
  // motion profile: the biggest single-frame turn across the mapped joints
  let peak = 0, active = [0, 0];
  for (const t of times){
    let m = 0;
    for (const bone of Object.values(BONES)){ const ni = nodeByName[bone]; const ch = chans[ni]; if (!ch) continue; m = Math.max(m, qangle(sampleAt(ch, t), sampleAt(ch, Math.max(t0, t - 1 / 30)))); }
    if (m > .02){ if (!active[0]) active[0] = t - t0; active[1] = t - t0; }
    peak = Math.max(peak, m);
  }
  console.log(`${anim.name}: ${times.length} keys, ${dur.toFixed(2)}s, active ${(active[0]).toFixed(2)}–${active[1].toFixed(2)}s, peak turn/frame ${(peak * 57.3).toFixed(1)}°`);
}
// sanity: A_TPose is the rest pose, so its deltas should be ~identity
const tp = json.animations.find(a => a.name === 'A_TPose');
if (tp){
  const chans = clipData(tp); let worst = 0;
  for (const bone of Object.values(BONES)){ const ni = nodeByName[bone]; const ch = chans[ni]; if (!ch) continue;
    for (const q of ch.quats) worst = Math.max(worst, qangle(q, restQ(ni))); }
  console.log(`A_TPose check: worst joint off rest by ${(worst * 57.3).toFixed(2)}° (should be ~0)`);
}
const outFile = outPath || resolve(ROOT, 'public/assets/anim/quaternius.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(out) + '\n');   // compact: the served file, not the readable source (this script is)
console.log(`wrote ${outFile} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
