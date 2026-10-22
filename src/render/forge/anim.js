/* FORGE ANIMATION — poses a forged figure every frame: its stance (heroic, on guard, spellcaster, sly, regal,
   shambling, stiff), breathing and the small shifts of someone standing in a dark place, a walk while it moves,
   and the moment of an action: a swing, a thrust, a shot, a claw, a spell, a flinch. Cloaks ripple (and stream
   out behind a walker), torches flicker, and staves, spears, bows, torches and lanterns stay upright in the hand. */
import * as THREE from 'three';

const PI = Math.PI;
// joint rotations [x, y, z] for each stance; anything missing is 0
const STANCES = {
  ready:  { spine:[.04, 0, 0], head:[-.04, 0, 0], upR:[-.32, 0, -.16], foR:[-.95, 0, 0], upL:[-.18, 0, .2], foL:[-.75, 0, 0], thL:[-.08, 0, .05], snL:[.12, 0, 0], ftL:[-.04, 0, 0], thR:[.14, 0, -.05], snR:[.1, 0, 0], ftR:[-.24, 0, 0] },
  hero:   { spine:[-.02, 0, 0], chest:[-.04, 0, 0], head:[-.08, 0, 0], upR:[-.2, 0, -.22], foR:[-.7, 0, 0], upL:[-.1, 0, .25], foL:[-.5, 0, 0], thL:[-.14, 0, .08], snL:[.18, 0, 0], ftL:[-.04, 0, 0], thR:[.16, 0, -.1], snR:[.06, 0, 0], ftR:[-.22, 0, 0] },
  caster: { spine:[.02, 0, 0], head:[-.02, 0, 0], upR:[-.25, 0, -.12], foR:[-1.05, 0, 0], upL:[-.5, 0, .25], foL:[-.9, .3, 0], thL:[-.04, 0, .03], snL:[.06, 0, 0], thR:[.06, 0, -.03], snR:[.06, 0, 0], ftR:[-.06, 0, 0] },
  sneak:  { hips:[0, .25, 0], spine:[.16, -.1, 0], chest:[.06, -.12, 0], head:[-.12, .2, 0], upR:[-.5, 0, -.25], foR:[-1.0, 0, 0], upL:[-.3, 0, .35], foL:[-1.1, 0, 0], thL:[-.35, 0, .1], snL:[.5, 0, 0], ftL:[-.12, 0, 0], thR:[.2, 0, -.12], snR:[.35, 0, 0], ftR:[-.5, 0, 0] },
  regal:  { spine:[-.04, 0, 0], chest:[-.05, 0, 0], head:[-.1, 0, 0], upR:[.05, 0, -.1], foR:[-.25, 0, 0], upL:[.05, 0, .1], foL:[-.25, 0, 0], thL:[-.02, 0, .03], thR:[.02, 0, -.03] },
  slump:  { hips:[.06, 0, 0], spine:[.28, 0, .08], chest:[.12, .1, 0], neck:[-.05, 0, 0], head:[-.2, .2, .22], upR:[-1.1, 0, -.05], foR:[-.3, 0, 0], upL:[-.9, 0, .15], foL:[-.4, 0, 0], thL:[-.15, 0, .05], snL:[.35, 0, 0], ftL:[-.15, 0, 0], thR:[.2, 0, -.06], snR:[.2, 0, 0], ftR:[-.3, 0, 0] },
  fallen: { spine:[-.1, 0, .1], head:[-.3, .5, 0], upR:[-.2, 0, -1.3], foR:[-.6, 0, 0], upL:[-.4, 0, 1.1], foL:[-.2, 0, 0], thL:[-.1, 0, .25], snL:[.4, 0, 0], thR:[.05, 0, -.15], snR:[.1, 0, 0] },
  stiff:  { head:[0, 0, 0], upR:[-.25, 0, -.08], foR:[-1.15, 0, 0], upL:[-.15, 0, .12], foL:[-.85, 0, 0], thL:[0, 0, .03], thR:[0, 0, -.03] },
};
const JOINTS = { hips:r => r.hips, spine:r => r.spine, chest:r => r.chest, neck:r => r.neck, head:r => r.head,
  upL:r => r.aL.u, foL:r => r.aL.f, haL:r => r.aL.h, upR:r => r.aR.u, foR:r => r.aR.f, haR:r => r.aR.h,
  thL:r => r.lL.t, snL:r => r.lL.sh, ftL:r => r.lL.ft, thR:r => r.lR.t, snR:r => r.lR.sh, ftR:r => r.lR.ft };
// how a weapon attacks: slash, thrust, smash, shoot, claw
const SWING = { sword:'slash', shortsword:'slash', greatsword:'smash', rapier:'thrust', scimitar:'slash', dagger:'thrust', axe:'slash', greataxe:'smash', mace:'slash', hammer:'slash', maul:'smash',
  club:'slash', spear:'thrust', glaive:'smash', staff:'smash', bow:'shoot', longbow:'shoot', crossbow:'shoot', sickle:'slash', whip:'slash', trident:'thrust', none:'claw' };
export const swingOf = rig => SWING[rig.items.main?.userData.kind || 'none'] || 'slash';
// keyframes for actions: [time 0..1, { joint:[x,y,z] offsets }]
const ACTIONS = {
  slash:  [[0, {}], [.3, { upR:[-2.4, 0, -.4], foR:[-.5, 0, 0], haR:[-.5, 0, 0], chest:[0, .35, 0], spine:[-.06, .15, 0] }], [.52, { upR:[-.6, 0, .25], foR:[-.2, 0, 0], haR:[1.5, 0, 0], chest:[.12, -.45, 0], spine:[.12, -.2, 0], thR:[.25, 0, 0] }], [1, {}]],
  smash:  [[0, {}], [.35, { upR:[-2.7, 0, -.1], upL:[-2.5, 0, .1], foR:[-.4, 0, 0], foL:[-.4, 0, 0], haR:[-.6, 0, 0], spine:[-.15, 0, 0] }], [.55, { upR:[-.5, 0, .05], upL:[-.5, 0, -.05], foR:[-.2, 0, 0], foL:[-.2, 0, 0], haR:[1.3, 0, 0], spine:[.3, 0, 0], thL:[-.3, 0, 0], snL:[.3, 0, 0] }], [1, {}]],
  thrust: [[0, {}], [.3, { upR:[.3, 0, -.1], foR:[-1.6, 0, 0], chest:[0, .25, 0] }], [.5, { upR:[-1.45, 0, 0], foR:[-.05, 0, 0], chest:[.08, -.3, 0], spine:[.12, 0, 0], thL:[-.45, 0, 0], snL:[.35, 0, 0], thR:[.3, 0, 0] }], [1, {}]],
  shoot:  [[0, {}], [.25, { upL:[-1.45, .1, .05], foL:[.7, 0, 0], upR:[-1.35, 0, -.2], foR:[-1.4, 0, 0], chest:[0, -.5, 0], head:[0, .3, 0] }], [.7, { upL:[-1.5, .1, .05], foL:[.75, 0, 0], upR:[-1.2, 0, -.6], foR:[-2.2, 0, 0], chest:[0, -.55, 0], head:[0, .35, 0] }], [.78, { upL:[-1.5, .1, .05], foL:[.75, 0, 0], upR:[-1.0, 0, -.4], foR:[-1.0, 0, 0], chest:[0, -.5, 0], head:[0, .35, 0] }], [1, {}]],
  claw:   [[0, {}], [.3, { upR:[-2.0, 0, -.5], upL:[-2.0, 0, .5], spine:[-.15, 0, 0] }], [.55, { upR:[-.6, 0, .3], upL:[-.6, 0, -.3], spine:[.4, 0, 0], head:[.2, 0, 0], thL:[-.3, 0, 0] }], [1, {}]],
  cast:   [[0, {}], [.35, { upL:[-1.6, 0, .5], foL:[-.3, 0, 0], upR:[-1.4, 0, -.4], foR:[-.4, 0, 0], head:[-.2, 0, 0], chest:[-.1, 0, 0] }], [.7, { upL:[-2.0, 0, .2], foL:[-.1, 0, 0], upR:[-1.9, 0, -.2], foR:[-.1, 0, 0], head:[-.25, 0, 0], chest:[-.12, 0, 0] }], [1, {}]],
  hit:    [[0, {}], [.18, { spine:[-.35, .1, .1], chest:[-.2, 0, 0], head:[-.4, .2, 0], upR:[.3, 0, -.3], upL:[.3, 0, .3] }], [1, {}]],
};
const DUR = { slash:.65, smash:.85, thrust:.6, shoot:1.1, claw:.7, cast:1.1, hit:.45 };
const v3 = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e = new THREE.Euler();
function sample(frames, k, name){
  let a = frames[0], b = frames[frames.length - 1];
  for (let i = 0; i < frames.length - 1; i++) if (k >= frames[i][0] && k <= frames[i + 1][0]){ a = frames[i]; b = frames[i + 1]; break; }
  const span = b[0] - a[0] || 1, u = (k - a[0]) / span, s = u * u * (3 - 2 * u);
  const va = a[1][name] || [0, 0, 0], vb = b[1][name] || [0, 0, 0];
  return [va[0] + (vb[0] - va[0]) * s, va[1] + (vb[1] - va[1]) * s, va[2] + (vb[2] - va[2]) * s];
}
// Start an action on a forged figure: 'attack' (picked by its weapon), 'cast', 'hit', or a swing kind.
export function playAction(rig, kind){
  if (!rig) return;
  const k = kind === 'attack' ? swingOf(rig) : kind;
  if (!ACTIONS[k]) return;
  rig.action = { k, t0:performance.now() / 1000, dur:DUR[k] };
}
// Turn the figure to face a point (in its parent's space); it turns there over a few frames.
export function faceToward(fig, x, z){
  const p = fig.parent?.parent ? fig.parent.position : null; void p;
  const g = fig.parent; if (!g) return;
  fig.userData.faceTo = Math.atan2(x - g.position.x, z - g.position.z);
}

export function poseRig(fig, t, dt, moving = false, stance = null){
  const rig = fig.userData.rig; if (!rig) return;
  const L = rig.look, st = STANCES[stance || L.pose] || STANCES.ready, seed = (L.seed % 1000) / 1000 * 6.28;
  // the action under way (0..1), if any
  let act = null, ak = 0;
  if (rig.action){ ak = (t - rig.action.t0) / rig.action.dur; if (ak >= 1 || ak < 0) rig.action = null; else act = ACTIONS[rig.action.k]; }
  // walking: a stride blended in while the mini moves along its path
  rig.walk = (rig.walk || 0) + ((moving ? 1 : 0) - (rig.walk || 0)) * Math.min(1, dt * 8);
  const w = rig.walk, ph = t * 10 + seed, slump = L.pose === 'slump';
  const breathe = Math.sin(t * 1.7 + seed), drift = Math.sin(t * .37 + seed * 2), look = Math.sin(t * .23 + seed) * Math.sin(t * .61 + seed * 3);
  for (const [name, get] of Object.entries(JOINTS)){
    const j = get(rig); if (!j) continue;
    const b = st[name] || [0, 0, 0];
    let x = b[0], y = b[1], z = b[2];
    // standing about: breathing, a shift of weight, a glance now and then
    if (name === 'chest') x += breathe * .02;
    if (name === 'spine') { x += drift * .015; z += drift * .02 * (1 - w); }
    if (name === 'head'){ y += look * .35 * (1 - w); x += breathe * .01; }
    if (name === 'hips') z += drift * .03 * (1 - w);
    if (name === 'upL' || name === 'upR') x += breathe * .025;
    // the stride
    if (w > .01){
      const s = Math.sin(ph), c = Math.cos(ph);
      if (name === 'thL') x += -s * .55 * w; if (name === 'thR') x += s * .55 * w;
      if (name === 'snL') x += Math.max(0, c) * .7 * w; if (name === 'snR') x += Math.max(0, -c) * .7 * w;
      if (name === 'upL') x += s * .35 * w; if (name === 'upR') x += -s * (rig.items.main ? .15 : .35) * w;
      if (name === 'hips') y += s * .08 * w;
      if (name === 'chest') y += -s * .1 * w;
      if (slump && name === 'head') z += s * .15 * w;
    }
    if (act){ const o = sample(act, ak, name); x += o[0]; y += o[1]; z += o[2]; }
    j.rotation.set(x, y, z);
  }
  // a tilt that makes each of a pack its own (zombies lean, skeletons cock their heads)
  rig.spine.rotation.z += L.tilt * .12; rig.head.rotation.z += L.tilt * .18;
  // walking bobs the whole body; breathing lifts the chest
  rig.hips.position.y = .445 + (w > .01 ? Math.abs(Math.sin(ph)) * .015 * w : 0) - (L.pose === 'sneak' ? .03 : 0) - (slump ? .02 : 0);
  // turn to face where it's going or what it's fighting
  if (fig.userData.faceTo !== undefined){
    let d = fig.userData.faceTo - fig.rotation.y; while (d > PI) d -= PI * 2; while (d < -PI) d += PI * 2;
    fig.rotation.y += d * Math.min(1, dt * 7);
  }
  // items held upright (staves, spears at rest, bows at rest, torches, lanterns, holy symbols)
  const aiming = act && (rig.action?.k === 'thrust' || rig.action?.k === 'smash' || rig.action?.k === 'slash');
  fig.updateMatrixWorld(true);
  for (const it of [rig.items.main, rig.items.off]){
    if (!it || !it.userData.upright) continue;
    if (aiming && it === rig.items.main){ it.rotation.set(PI / 2, 0, 0); continue; }
    it.parent.getWorldQuaternion(q1); fig.getWorldQuaternion(q2);
    it.quaternion.copy(q1.invert().multiply(q2));
    e.set(.08, 0, it === rig.items.off ? .1 : -.1); q2.setFromEuler(e); it.quaternion.multiply(q2);
  }
  // cloaks ripple, and stream behind a walker
  for (const c of rig.cloaks){
    const g = c.geometry, p = g.attributes.position, rest = g.userData.rest, len = c.userData.cloak.len;
    for (let i = 0; i < p.count; i++){
      const rx = rest[i * 3], ry = rest[i * 3 + 1], rz = rest[i * 3 + 2], v = Math.min(1, -ry / len), vv = Math.pow(v, 1.5);
      const wave = Math.sin(t * 1.6 + rx * 18 + seed) * .012 + Math.sin(t * 2.7 + ry * 9) * .006;
      p.setXYZ(i, rx + Math.sin(t * 1.1 + v * 4 + seed) * .006 * v, ry + vv * w * .05, rz - vv * (wave + w * (.09 + Math.sin(ph * .5) * .02)) - vv * .015);
    }
    p.needsUpdate = true; g.computeVertexNormals();
  }
  for (const f of rig.flames){ const k = .8 + Math.random() * .4; f.scale.set(k, .85 + Math.random() * .3, k); }
}
