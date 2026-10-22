/* THE FORGE — builds a figure from a look (engine/look.js): a jointed body (hips, spine, chest, neck, head,
   shoulders, elbows, hands, knees, feet) sculpted from lathed and shaped parts, dressed in its outfit, with a face,
   hair, beard, horns or a tail, a cloak, a helm, and the weapons from its sheet in its hands.
   Facing +z, standing on y = 0 (the top of the base), about 1 unit tall for a human. Parts that never move on
   their own are merged per joint and material (compact), so a figure is a few dozen draw calls, not hundreds.
   render/forge/anim.js poses and animates it through fig.userData.rig. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BODIES } from '../../data/looks.js';
import { METALS } from '../../engine/look.js';
import { mat, shade } from './mat.js';
import { lathe, smoothProfile, limb, shell, taperTube, plate, sphere, ellipsoid, cylinder, cone, box, torus, dome, headGeo, cloakGeo, cached, furRing, skinned } from './geo.js';

const PI = Math.PI;
function put(parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], s = null){
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); if (s) o.scale.set(...(Array.isArray(s) ? s : [s, s, s]));
  parent.add(o); return o;
}
const J = (parent, name, p = [0, 0, 0]) => { const g = new THREE.Bone(); g.name = name; g.position.set(...p); parent.add(g); return g; };
// A piece that bends with two joints (its own, and its neighbour's across jy): bound once the skeleton is built.
function flex(rig, own, other, geo, m, jy, below, band = .035, p = [0, 0, 0]){
  const sm = new THREE.SkinnedMesh(skinned(geo, jy - p[1], below, band), m); sm.position.set(...p); own.add(sm); sm.userData.live = 1; rig.skins.push([sm, own, other]); return sm;
}

/* ---------- the figure ---------- */
export function buildForge(look){
  const L = look, B = BODIES[L.body] || BODIES.human;
  const fig = new THREE.Group(), root = J(fig, 'root', [0, .07, 0]);
  const H = B.h * L.height; root.scale.setScalar(H);
  const Wd = B.sh * (.88 + L.frame * .24), G = B.heft * (.82 + L.build * .4), hs = B.head;
  const bones = !!B.bones;
  // materials
  const metalCol = METALS[L.metal] || METALS.steel;
  const M = {
    skin:mat(bones ? 'bone' : 'skin', L.skin), c1:mat('cloth', L.c1), c1d:mat('cloth', shade(L.c1, -.08)), c2:mat('cloth', L.c2), lea:mat('leather', L.leather),
    leaD:mat('leather', shade(L.leather, -.08)), metal:mat('metal', metalCol), chain:mat('chain', metalCol), brass:mat('metal', METALS.brass), hair:mat('hair', L.hairCol),
    dark:mat('dark', '#120d10'), wood:mat('wood', '#5a3d24'), lip:mat('skin', shade(L.skin, -.12, .05)),
  };
  // joints
  const legs = .445, hips = J(root, 'hips', [0, legs, 0]), spine = J(hips, 'spine', [0, .075, 0]), chest = J(spine, 'chest', [0, .085, 0]);
  const neck = J(chest, 'neck', [0, .132, 0]), head = J(neck, 'head', [0, .036, 0]);
  const arm = side => { const s = J(chest, `sh${side}`, [side === 'L' ? .102 * Wd : -.102 * Wd, .115, 0]), u = J(s, `up${side}`), f = J(u, `fo${side}`, [0, -.165, 0]), h = J(f, `ha${side}`, [0, -.15, 0]); return { s, u, f, h }; };
  const leg = side => { const t = J(hips, `th${side}`, [side === 'L' ? .05 * G : -.05 * G, -.02, 0]), sh = J(t, `sn${side}`, [0, -.215, 0]), ft = J(sh, `ft${side}`, [0, -.195, 0]); return { t, sh, ft }; };
  const aL = arm('L'), aR = arm('R'), lL = leg('L'), lR = leg('R');
  const rig = { root, hips, spine, chest, neck, head, aL, aR, lL, lR, H, look:L, cloaks:[], flames:[], glows:[], items:{}, skins:[] };
  fig.userData.rig = rig;

  const wear = outfitParts(L, M, G, Wd);
  if (bones) skeletonBody(rig, M, G, Wd); else fleshBody(rig, M, G, Wd, wear);
  dressUp(rig, M, G, Wd, wear);
  face(rig, L, M, B, hs, bones);
  if (!bones) hairAndBeard(rig, L, M, B, hs);
  hornsAndTail(rig, L, M, B, hs, G);
  cloakAndHelm(rig, L, M, B, hs, Wd);
  gear(rig, L, M);
  // bind the bending pieces in the rest pose (every joint straight)
  fig.updateMatrixWorld(true);
  for (const [sm, a, b] of rig.skins){ sm.bind(new THREE.Skeleton([a, b])); sm.frustumCulled = false; }
  compact(fig);
  fig.traverse(o => { if (o.isMesh) o.userData.forge = 1; });
  return fig;
}

/* ---------- what an outfit covers ---------- */
function outfitParts(L, M, G, Wd){
  const o = L.outfit, trou = mat('cloth', shade(L.leather, -.02, -.1));
  const w = { top:M.c1, upArm:M.c1, foArm:M.skin, hand:M.skin, pelvis:trou, thigh:trou, shin:trou, boot:M.lea, skirt:null, sleeveFlare:false };
  if (o === 'robe' || o === 'vestments'){ Object.assign(w, { foArm:M.c1, skirt:{ len:.43, flare:.17, m:M.c1, trim:M.c2 }, sleeveFlare:true, pelvis:M.c1, thigh:M.c1d, shin:M.c1d }); }
  if (o === 'tunic') Object.assign(w, { skirt:{ len:.11, flare:.1, m:M.c1 } });
  if (o === 'leather') Object.assign(w, { top:M.lea, upArm:M.c1, foArm:M.leaD, hand:M.leaD, skirt:{ len:.08, flare:.095, m:M.lea } });
  if (o === 'hide') Object.assign(w, { top:M.lea, upArm:M.skin, foArm:M.skin, skirt:{ len:.12, flare:.11, m:mat('hair', '#6a5a46'), fur:true } });
  if (o === 'chain') Object.assign(w, { top:M.chain, upArm:M.chain, foArm:M.lea, hand:M.leaD, skirt:{ len:.13, flare:.105, m:M.chain } });
  if (o === 'half') Object.assign(w, { top:M.chain, upArm:M.chain, foArm:M.metal, hand:M.leaD, skirt:{ len:.12, flare:.105, m:M.c1 } });
  if (o === 'plate') Object.assign(w, { top:M.metal, upArm:M.metal, foArm:M.metal, hand:M.metal, pelvis:M.chain, thigh:M.metal, shin:M.metal, boot:M.metal, skirt:{ len:.09, flare:.1, m:M.chain } });
  if (o === 'monk') Object.assign(w, { foArm:mat('cloth', '#d8ccb0'), thigh:M.c1d, shin:mat('cloth', '#d8ccb0'), pelvis:M.c1d, boot:M.skin });
  if (o === 'rags') Object.assign(w, { top:mat('cloth', shade(L.c1, -.05, -.25)), upArm:M.skin, thigh:mat('cloth', shade(L.c2, -.1, -.25)), shin:M.skin, boot:M.skin, skirt:{ len:.1, flare:.105, m:mat('cloth', shade(L.c1, -.05, -.25)), torn:true } });
  if (o === 'noble') Object.assign(w, { upArm:M.c1, foArm:M.c1, hand:mat('leather', '#1a1418'), thigh:mat('cloth', '#1a1418'), shin:mat('leather', '#141012'), boot:mat('leather', '#141012') });
  if (o === 'none') Object.assign(w, { top:M.skin, upArm:M.skin, foArm:M.skin, pelvis:M.skin, thigh:M.skin, shin:M.skin, boot:M.skin });
  if (L.off === 'claw') w.hand = M.skin;
  return w;
}

/* ---------- a body of flesh ---------- */
function fleshBody(rig, M, G, Wd, w){
  const { hips, spine, chest, neck, aL, aR, lL, lR } = rig;
  // pelvis, belly, chest: one silhouette in three pieces, so it bends at the waist
  put(hips, shell('pelvis', [[.04, -.075], [.072, -.05], [.086, -.015], [.083, .03], [.075, .075]], G, .74), w.pelvis);
  // belly and chest are one piece that bends at the waist
  const torso = shell(`torso|${G.toFixed(3)}|${Wd.toFixed(3)}`, [[.0005, -.03], [.06, -.022], [.07, -.005], [.068, .03], [.073, .062], [.084, .095], [.094, .12], [.103, .155], [.108, .185], [.1, .207], [.072, .223], [.03, .233], [.0005, .235]], Wd, .68, 20);
  flex(rig, spine, chest, torso, w.top, .085, true, .03);
  put(neck, cylinder(.031 * G, .038 * G, .06, 12), rig.look.outfit === 'plate' ? M.metal : M.skin, [0, .012, 0]);
  for (const [a, side] of [[aL, 1], [aR, -1]]){
    put(a.s, sphere(.038 * G, 12, 10), w.upArm, [0, -.005, 0], [0, 0, 0], [1, 1, .9]);              // the shoulder's round
    flex(rig, a.u, a.f, limb(.034 * G, .029 * G, .165), w.upArm, -.165, true);                          // upper arm, bending into the elbow
    flex(rig, a.f, a.u, limb(.029 * G, .022 * G, .15), w.foArm, 0, false);                               // forearm, bending out of it
    if (w.sleeveFlare) put(a.f, cylinder(.032 * G, .052 * G, .07, 14, true), w.upArm, [0, -.12, 0]);   // a wizard's sleeve
    put(a.h, ellipsoid(.022 * G, .028, .026, 12, 10), w.hand, [0, -.022, .004]);
    put(a.h, ellipsoid(.009, .018, .009, 8, 6), w.hand, [side * .018 * G, -.014, .016], [.3, 0, side * -.5]);   // thumb
    if (rig.look.off === 'claw') for (let i = 0; i < 4; i++) put(a.h, cone(.004, .03, 6), M.lip === w.hand ? M.lip : mat('bone', '#d8cfb8'), [(-.015 + i * .01) * G, -.05, .012], [PI + .3, 0, 0]);
  }
  for (const l of [lL, lR]){
    flex(rig, l.t, l.sh, limb(.05 * G, .04 * G, .215), w.thigh, -.215, true);
    flex(rig, l.sh, l.t, limb(.04 * G, .029 * G, .195), w.shin, 0, false);
    // boots: a shaft over the calf and a foot that points forward
    if (w.boot !== M.skin) put(l.sh, limb(.039 * G, .033 * G, .1, 1.02), w.boot, [0, -.095, 0]);
    put(l.ft, ellipsoid(.031 * G, .024, .056, 12, 8), w.boot, [0, -.012, .022]);
    if (w.boot !== M.skin) put(l.ft, ellipsoid(.033 * G, .008, .058, 12, 6), mat('leather', '#1a1210'), [0, -.033, .022]);   // sole
  }
}

/* ---------- a skeleton ---------- */
function skeletonBody(rig, M, G, Wd){
  const { hips, spine, chest, neck, aL, aR, lL, lR } = rig, bone = M.skin;
  put(hips, torus(.055, .016, 8, 16), bone, [0, -.01, 0], [PI / 2, 0, 0], [1, .75, 1]);                // pelvis
  put(hips, ellipsoid(.03, .025, .02), bone, [0, -.04, -.01]);
  for (let i = 0; i < 4; i++) put(spine, cylinder(.014, .016, .016, 8), bone, [0, i * .022, -.02]);       // vertebrae
  for (let i = 0; i < 5; i++) put(chest, torus(.068 * Wd - Math.abs(i - 1.5) * .006, .0075, 6, 20, PI * 1.6), bone, [0, .03 + i * .023, -.004], [PI / 2 + .15, 0, PI * .7], [1, .72, 1]);   // ribs, open at the front
  put(chest, box(.012, .1, .01), bone, [0, .07, .045]);                                                   // breastbone
  put(chest, cylinder(.007, .007, .2 * Wd, 6), bone, [0, .13, .01], [0, 0, PI / 2]);                     // collarbones
  put(neck, cylinder(.012, .014, .06, 8), bone, [0, .01, -.01]);
  for (const a of [aL, aR]){
    put(a.s, sphere(.02, 10, 8), bone);
    put(a.u, cylinder(.011, .009, .16, 8), bone, [0, -.082, 0]); put(a.u, sphere(.016, 8, 6), bone, [0, -.162, 0]);
    put(a.f, cylinder(.009, .007, .145, 8), bone, [0, -.075, 0]);
    put(a.h, ellipsoid(.016, .02, .01, 8, 6), bone, [0, -.018, 0]);
    for (let i = 0; i < 3; i++) put(a.h, cylinder(.0035, .003, .03, 5), bone, [-.008 + i * .008, -.045, .004]);
  }
  for (const l of [lL, lR]){
    put(l.t, cylinder(.014, .011, .21, 8), bone, [0, -.105, 0]); put(l.t, sphere(.02, 8, 6), bone, [0, -.21, 0]);
    put(l.sh, cylinder(.011, .009, .19, 8), bone, [0, -.095, 0]);
    put(l.ft, ellipsoid(.018, .01, .045, 8, 6), bone, [0, -.01, .02]);
  }
}

/* ---------- clothes and armour on top ---------- */
function dressUp(rig, M, G, Wd, w){
  const { hips, spine, chest, neck, aL, aR, lL, lR, look:L } = rig, o = L.outfit;
  if (o === 'none') return;
  // a belt (most outfits), with a buckle
  if (!['robe', 'vestments', 'none'].includes(o)) { put(hips, torus(.085, .012, 6, 28), o === 'monk' ? M.c2 : M.leaD, [0, .058, 0], [PI / 2, 0, 0], [G, .74 * G, 1]); put(hips, box(.024, .022, .008), M.brass, [0, .058, .066 * G]); }
  // skirts: robes to the floor, tunics and mail to the thigh, a barbarian's fur kilt, a zombie's tatters
  if (w.skirt){
    const s = w.skirt, n = s.torn ? 'torn' : s.fur ? 'fur' : 'skirt', pts = [[.084, .07], [.088, .02], [(.088 + s.flare) / 2, -s.len * .5], [s.flare, -s.len]];
    const g = shell(`${n}|${s.len}|${s.flare}`, pts, G, .78, s.torn ? 10 : 22);
    put(hips, g, s.m.side === THREE.DoubleSide ? s.m : twoSided(s.m));
    if (s.trim) put(hips, torus(s.flare * .995, .007, 6, 32), s.trim, [0, -s.len + .004, 0], [PI / 2, 0, 0], [G, .78 * G, 1]);
  }
  if (o === 'robe' || o === 'vestments'){
    put(spine, torus(.078, .012, 6, 24), M.c2, [0, .01, 0], [PI / 2, 0, 0], [G, .72 * G, 1]);           // sash
    put(chest, plate('collarV', [[-.05, 0], [0, -.06], [.05, 0], [.05, .012], [0, -.045], [-.05, .012]], .004, .001), M.c2, [0, .135, .06 * Wd], [-.35, 0, 0]);
  }
  if (o === 'vestments'){                                                                                    // a stole and a sun on the chest
    for (const s of [-1, 1]) put(chest, box(.022, .32, .006), M.c2, [s * .03, -.03, .072], [-.08, 0, s * .06]);
    put(chest, cylinder(.022, .022, .004, 16), M.brass, [0, .085, .074], [PI / 2, 0, 0]);
  }
  if (o === 'chain' || o === 'half'){                                                                       // a tabard over the mail
    for (const z of [1, -1]) put(hips, plate('tabard', [[-.05, .14], [.05, .14], [.055, -.15], [0, -.17], [-.055, -.15]], .004, .0015), M.c1, [0, .02, z * .066 * G], [z > 0 ? .05 : -.05, 0, 0]);
    if (o === 'chain') put(chest, plate('tabTop', [[-.06, -.01], [.06, -.01], [.055, .12], [-.055, .12]], .004, .0015), M.c1, [0, -.0, .068 * Wd], [-.12, 0, 0]);
  }
  if (o === 'half' || o === 'plate'){                                                                       // breastplate and pauldrons
    put(chest, shell('breast', [[.088, -.01], [.098, .03], [.108, .07], [.11, .1], [.096, .125], [.06, .14]], Wd * 1.04, .72), M.metal);
    if (o === 'plate') put(spine, shell('plackart', [[.078, -.015], [.076, .03], [.084, .07], [.09, .095]], G * 1.04, .74), M.metal);
    for (const [a, sd] of [[aL, 1], [aR, -1]]){
      put(a.s, dome(.05 * G, 1.4, 16, 8), M.metal, [sd * .006, .012, 0], [0, 0, sd * -.35], [1, .85, 1.05]);
      put(a.s, dome(.046 * G, 1.2, 16, 6), M.metal, [sd * .012, -.008, 0], [0, 0, sd * -.5], [1, .8, 1.05]);
    }
  }
  if (o === 'plate'){
    put(neck, cylinder(.04, .046, .04, 14), M.metal, [0, -.005, 0]);                                         // gorget
    for (let i = 0; i < 3; i++) put(hips, torus(.088 + i * .006, .01, 6, 28), M.metal, [0, .045 - i * .028, 0], [PI / 2, 0, 0], [G, .76 * G, 1]);   // faulds
    for (const a of [aL, aR]) put(a.h, ellipsoid(.026, .016, .03, 10, 6), M.metal, [0, .002, .004]);       // gauntlet cuffs
    for (const l of [lL, lR]){ put(l.sh, ellipsoid(.036 * G, .034, .022, 12, 8), M.metal, [0, .0, .03 * G]); put(l.ft, ellipsoid(.034 * G, .02, .062, 10, 6), M.metal, [0, -.008, .028]); }   // knee cops, sabatons
    put(hips, plate('tabardP', [[-.045, .02], [.045, .02], [.05, -.24], [0, -.27], [-.05, -.24]], .004, .0015), M.c1, [0, .02, .075 * G], [.06, 0, 0]);
  }
  if (o === 'leather'){
    put(chest, box(.026, .3, .008), M.leaD, [0, .06, .068 * Wd], [0, 0, .62]);                             // a bandolier
    put(aL.s, dome(.046 * G, 1.3, 14, 6), M.leaD, [.006, .01, 0], [0, 0, -.4]);                             // one shoulder guard
    for (const x of [-.05, .045]) put(hips, box(.028, .026, .016), M.lea, [x * G, .03, .07 * G]);           // pouches
  }
  if (o === 'hide'){                                                                                         // fur collar
    const fur = mat('hair', '#7a6a54');
    put(chest, furRing(.075, .03), fur, [0, .128, -.004], [PI / 2, 0, 0], [Wd * 1.05, .78 * Wd, 1]);
    for (const a of [aL, aR]) put(a.f, cylinder(.026 * G, .024 * G, .05, 10), mat('cloth', '#b8a888'), [0, -.11, 0]);   // wrist wraps
  }
  if (o === 'monk'){
    for (const s of [-1, 1]) put(hips, box(.016, .1, .005), M.c2, [s * .018 + .03, -.01, .072 * G], [0, 0, s * .1]);   // sash ends
    put(chest, plate('giV', [[-.045, .14], [0, .06], [.045, .14], [.035, .14], [0, .075], [-.035, .14]], .003, .001), mat('skin', L.skin), [0, 0, .07 * Wd]);
  }
  if (o === 'noble'){
    for (let i = 0; i < 5; i++) put(chest, sphere(.006, 6, 5), M.brass, [0, .01 + i * .025, .071 * Wd - i * .001]);   // buttons
    put(neck, cylinder(.04, .034, .05, 16, true), twoSided(M.c2), [0, .01, -.004]);                           // a high collar
    for (const a of [aL, aR]) put(a.s, ellipsoid(.046 * G, .04, .044, 12, 8), M.c1, [0, -.01, 0]);         // puffed shoulders
    put(chest, torus(.07, .004, 5, 24, PI), M.brass, [0, .135, .02], [PI / 2 + .5, 0, PI], [Wd, 1, 1]);      // a chain of office
    for (const l of [lL, lR]) put(l.sh, cylinder(.042 * G, .04 * G, .02, 12), mat('leather', '#141012'), [0, -.02, 0]);   // tall boot cuffs
  }
  if (o === 'rags'){                                                                                          // a torn sleeve, a wound
    put(aR.u, limb(.037 * G, .033 * G, .08, 1), w.top, [0, 0, 0]);
    put(spine, ellipsoid(.022, .016, .006), mat('skin', '#5a1a1a'), [.03, .04, .07 * G], [0, .3, 0]);
  }
}
// a cloth that shows from both sides (skirts, cloaks, hoods)
function twoSided(m){ const k = m.userData.two; if (k) return k; const c = m.clone(); c.side = THREE.DoubleSide; c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; m.userData.two = c; return c; }

/* ---------- the face ---------- */
function face(rig, L, M, B, hs, bones){
  const head = rig.head, r = .074 * hs, cy = .072;
  const hg = put(head, headGeo(r, B.tusks ? 1.15 : B.body === 'dwarf' ? 1.1 : 1, B.snout ? 1.0 : 0), M.skin, [0, cy, 0]);
  void hg;
  const eyeGlow = L.glow ? L.eyes : null, zf = r * .93;
  if (bones){                                                                                                 // a skull: sockets, a jaw, teeth
    for (const s of [-1, 1]){ put(head, sphere(r * .2, 10, 8), M.dark, [s * r * .36, cy + r * .08, zf * .92]); if (eyeGlow) put(head, sphere(r * .08, 8, 6), mat('gem', L.eyes, L.eyes, 3), [s * r * .36, cy + r * .08, zf * .98]); }
    put(head, cone(r * .1, r * .18, 3), M.dark, [0, cy - r * .2, zf * 1.02], [PI, 0, 0]);
    put(head, box(r * .9, r * .14, r * .1), M.skin, [0, cy - r * .62, zf * .7]);
    for (let i = 0; i < 6; i++) put(head, box(r * .1, r * .1, r * .05), mat('bone', '#efe8d6'), [(-.25 + i * .1) * r, cy - r * .5, zf * .95]);
    return;
  }
  for (const s of [-1, 1]){
    const ex = s * r * .36, ey = cy + r * .08;
    put(head, ellipsoid(r * .15, r * .11, r * .08, 10, 8), mat('skin', '#f2ece4'), [ex, ey, zf * .97]);                       // the white
    put(head, sphere(r * .085, 10, 8), mat('gem', L.eyes, eyeGlow, eyeGlow ? 2.6 : 1), [ex, ey, zf * 1.035]);               // the iris
    put(head, sphere(r * .04, 6, 5), M.dark, [ex, ey, zf * 1.075]);                                                          // pupil
    put(head, box(r * .34, r * .07, r * .08), M.hair, [ex, ey + r * .2, zf * 1.0], [0, 0, s * .12]);                        // brow
    put(head, ellipsoid(r * .19, r * .06, r * .06, 10, 6), M.skin, [ex, ey + r * .1, zf * 1.0]);                           // eyelid
    // ears
    if (B.ears === 'round') put(head, ellipsoid(r * .14, r * .25, r * .1, 8, 6), M.skin, [s * r * .9, cy, -r * .05]);
    if (B.ears === 'pointed' || B.ears === 'long'){ const len = B.ears === 'long' ? r * .9 : r * .5; put(head, cone(r * .15, len, 8), M.skin, [s * (r * .9 + len * .3), cy + len * .25, -r * .1], [-.3, 0, s * -1.15], [1, 1, .45]); }
    if (B.tusks) put(head, cone(r * .06, r * .3, 6), mat('bone', '#ece4cc'), [s * r * .28, cy - r * .5, zf * .9], [-.1, 0, s * -.15]);
    if (B.fangs) put(head, cone(r * .03, r * .12, 5), mat('bone', '#f4f0e8'), [s * r * .1, cy - r * .5, zf * .97], [PI, 0, 0]);
  }
  if (B.snout){                                                                                               // a dragon's muzzle: nostrils and a crest
    for (const s of [-1, 1]) put(head, sphere(r * .06, 6, 5), M.dark, [s * r * .16, cy - r * .22, r * 1.72]);
    for (let i = 0; i < 4; i++) put(head, cone(r * .12, r * (.45 - i * .06), 6), mat('skin', shade(L.skin, -.12)), [0, cy + r * (.9 - i * .25), -r * (.1 + i * .3)], [-.9 - i * .2, 0, 0]);
    put(head, box(r * .55, r * .05, r * .7), M.lip, [0, cy - r * .5, r * 1.25]);
  } else {
    put(head, ellipsoid(r * .11 * (B.nose || 1), r * .2, r * .13 * (B.nose || 1), 10, 8), M.skin, [0, cy - r * .1, zf * 1.08]);   // nose
    put(head, ellipsoid(r * .26, r * .045, r * .05, 10, 6), M.lip, [0, cy - r * .46, r * .9]);                                   // mouth
  }
}

/* ---------- hair and beards ---------- */
function hairAndBeard(rig, L, M, B, hs){
  const head = rig.head, r = .074 * hs, cy = .072, hide = L.cloak === 'hood' || L.helm === 'great';
  const style = B.snout ? 'bald' : L.hair;
  if (!hide && style !== 'bald'){
    const cap = (k = 1.07, th = 1.2) => put(head, dome(r * k, th, 22, 10), M.hair, [0, cy, -r * .02], [-.25, 0, 0]);
    const back = (k = 1.08, len = .95) => put(head, dome(r * k, len, 22, 8, PI / 2 + 1.35, PI * 2 - 2.7, .95), twoSided(M.hair), [0, cy, 0]);
    if (style === 'mohawk'){ for (let i = 0; i < 6; i++) put(head, cone(r * .14, r * (.5 - Math.abs(i - 2.5) * .06), 6), M.hair, [0, cy + r * Math.cos(-.4 + i * .3), r * Math.sin(-.4 + i * .3) * -1], [-(-.4 + i * .3), 0, 0]); }
    else {
      cap(style === 'crop' ? 1.04 : 1.07, style === 'crop' ? 1.05 : 1.2);
      if (style !== 'crop' && style !== 'topknot') back();
      if (style === 'long' || style === 'wild'){
        const g = cached(`hairLong|${r}`, () => { const pts = smoothProfile([[r * 1.06, 0], [r * 1.1, -r * .6], [r * 1.25, -r * 1.4], [r * 1.35, -r * 2.1]], 16); const gg = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 18, 1.25, PI * 2 - 2.5); gg.scale(1, 1, .8); return gg; });
        put(head, g, twoSided(M.hair), [0, cy, -r * .05]);
      }
      if (style === 'wild') for (let i = 0; i < 9; i++){ const a = -1.1 + i * .28; put(head, cone(r * .16, r * .5, 6), M.hair, [Math.sin(a) * r * .95, cy + r * (.55 + Math.cos(i) * .1), -Math.cos(a) * r * .5], [-.9, a, Math.sin(a) * .9]); }
      if (style === 'tied') put(head, taperTube('pony', [[0, 0, 0], [0, -.01, -.03], [0, -.05, -.045], [0, -.1, -.04]], r * .25, r * .08), M.hair, [0, cy + r * .1, -r * .95]);
      if (style === 'braid'){ for (let i = 0; i < 8; i++) put(head, sphere(r * (.24 - i * .015), 8, 6), M.hair, [0, cy - r * (.1 + i * .3), -r * (1.0 + i * .03)]); }
      if (style === 'topknot' || style === 'bun') put(head, sphere(r * .32, 12, 10), M.hair, style === 'bun' ? [0, cy + r * .3, -r * .95] : [0, cy + r * 1.05, -r * .2]);
    }
  }
  // beards
  const bd = L.beard;
  if (bd && bd !== 'none'){
    const bm = bd === 'stubble' ? mat('skin', shade(L.skin, -.08, -.1)) : M.hair, zf = r * .86;
    if (bd === 'moustache' || bd === 'full' || bd === 'long' || bd === 'braided') for (const s of [-1, 1]) put(head, ellipsoid(r * .22, r * .07, r * .08, 8, 6), M.hair, [s * r * .14, cy - r * .36, zf * 1.0], [0, 0, s * -.35]);
    if (bd === 'stubble') put(head, dome(r * 1.005, 1.1, 18, 8, PI / 2 - 1.2, 2.4, PI - 1.15), bm, [0, cy, 0]);
    if (bd === 'short') put(head, ellipsoid(r * .7, r * .5, r * .55, 14, 10), M.hair, [0, cy - r * .6, r * .45]);
    if (bd === 'full' || bd === 'long' || bd === 'braided'){
      put(head, ellipsoid(r * .82, r * .7, r * .62, 16, 12), M.hair, [0, cy - r * .62, r * .42]);
      for (const sd of [-1, 1]) put(head, ellipsoid(r * .3, r * .5, r * .35, 10, 8), M.hair, [sd * r * .62, cy - r * .3, r * .3]);   // sideburns into the beard
      if (bd !== 'full') put(head, cone(r * .6, r * 1.7, 12), M.hair, [0, cy - r * 1.75, r * .6], [PI - .3, 0, 0]);
      if (bd === 'braided') for (const y of [1.3, 1.8]) put(head, torus(r * .2, r * .05, 6, 12), M.brass, [0, cy - r * y, r * .63 - (y - 1.3) * r * .25], [PI / 2 - .25, 0, 0]);
    }
  }
}

/* ---------- horns and tails ---------- */
function hornsAndTail(rig, L, M, B, hs, G){
  const head = rig.head, r = .074 * hs, cy = .072, hm = mat('bone', L.hornCol);
  if (L.horns && L.horns !== 'none' && L.helm !== 'great'){
    const P = { curled:[[0, 0, 0], [.01, .03, -.02], [.02, .04, -.05], [.03, .02, -.07], [.03, -.01, -.06]], swept:[[0, 0, 0], [.008, .03, -.03], [.012, .05, -.07], [.012, .06, -.11]],
      small:[[0, 0, 0], [.004, .02, -.006], [.006, .032, -.016]], ram:[[0, 0, 0], [.02, .03, -.02], [.05, .025, -.05], [.06, -.01, -.04], [.045, -.035, -.005], [.03, -.03, .015]] }[L.horns];
    const g = taperTube(`horn|${L.horns}`, P, r * .17, r * .03, 20, 8);
    for (const s of [-1, 1]) put(head, g, hm, [s * r * .5, cy + r * .72, r * .2], [0, 0, 0], [s, 1, 1]);
  }
  if (L.tail){
    const drag = L.body === 'dragonborn', g = taperTube(`tail|${drag}`, [[0, 0, 0], [0, -.06, -.06], [0, -.18, -.12], [.03, -.3, -.14], [.06, -.38, -.08]], drag ? .03 * G : .012, drag ? .006 : .004, 26, 8);
    const tm = drag ? M.skin : mat('skin', shade(L.skin, -.04));
    put(rig.hips, g, tm, [0, 0, -.06 * G]);
    if (!drag) put(rig.hips, cone(.02, .035, 4), tm, [.06, -.385, -.14], [-.6, 0, -.4]);              // the spade at its tip
  }
}

/* ---------- cloaks, hoods and helms ---------- */
function cloakAndHelm(rig, L, M, B, hs, Wd){
  const { chest, head } = rig, r = .074 * hs, cy = .072, cm = mat('cloth', L.cloakCol), cm2 = twoSided(cm);
  if (L.cloak !== 'none'){
    const cape = L.cloak === 'cape', len = cape ? .3 : .6, g = cloakGeo(.105 * Wd, cape ? .14 * Wd : .19 * Wd, len, cape ? 1.45 : 1.75);
    const c = put(chest, g, cm2, [0, .128, -.01]); c.userData.cloak = { len }; c.userData.live = 1; rig.cloaks.push(c);
    for (const s of [-1, 1]) put(chest, sphere(.011, 8, 6), M.brass, [s * .05 * Wd, .128, .05 * Wd]);   // clasps
    if (L.cloak === 'hood'){                                                                                    // a hood, open at the face
      put(head, dome(r * 1.32, 1.95, 22, 12, PI / 2 + .75, PI * 2 - 1.5), cm2, [0, cy + r * .05, -r * .12], [-.15, 0, 0], [1, 1.08, 1.12]);
      put(chest, torus(.07 * Wd, .02, 8, 20), cm, [0, .14, -.005], [PI / 2, 0, 0], [1, .75, 1]);
    }
    if (L.cloak === 'mantle'){                                                                                  // a high collar flaring behind the head
      const col = cached('mantleCollar', () => { const pts = smoothProfile([[.066, 0], [.074, .035], [.09, .08], [.108, .115]], 14); const gg = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 18, 1.15, PI * 2 - 2.3); gg.scale(1, 1, .8); return gg; });
      put(chest, col, cm2, [0, .125, -.01]);
      put(chest, col, twoSided(mat('cloth', L.c2)), [0, .125, -.004], [0, 0, 0], [.96, .97, .96]);
    }
  }
  const metal = mat('metal', METALS[L.metal] || METALS.steel);
  switch (L.helm){
    case 'cap': put(head, dome(r * 1.12, 1.25, 20, 8), mat('leather', L.leather), [0, cy, -r * .03], [-.2, 0, 0]); break;
    case 'open':
      put(head, dome(r * 1.14, 1.45, 22, 10), metal, [0, cy, -r * .02], [-.12, 0, 0]);
      put(head, torus(r * 1.13, r * .06, 6, 28), metal, [0, cy + r * .1, -r * .02], [PI / 2 - .12, 0, 0]);
      put(head, box(r * .14, r * .55, r * .08), metal, [0, cy + r * .02, r * 1.1]);                         // nasal guard
      break;
    case 'great':
      put(head, shell('greathelm', [[r * 1.05, -r * .95], [r * 1.12, -r * .2], [r * 1.12, r * .6], [r * .9, r * 1.05], [.0005, r * 1.18]], 1, 1, 20, true), metal, [0, cy, 0]);
      put(head, box(r * 1.4, r * .1, r * .2), M.dark, [0, cy + r * .18, r * 1.03]);                         // eye slit
      put(head, box(r * .08, r * .9, r * .06), metal, [0, cy - r * .2, r * 1.15]);
      break;
    case 'circlet': put(head, torus(r * 1.02, r * .05, 6, 28), M.brass, [0, cy + r * .45, 0], [PI / 2 - .15, 0, 0]); put(head, sphere(r * .1, 8, 6), mat('gem', L.c2, L.c2, 1.5), [0, cy + r * .5, r * 1.0]); break;
    case 'hat': {
      const hm = mat('leather', shade(L.leather, -.05));
      put(head, cylinder(r * 2.1, r * 2.1, r * .06, 28), hm, [0, cy + r * .55, 0], [-.08, 0, 0]);
      put(head, cylinder(r * .82, r * .98, r * .8, 22), hm, [0, cy + r * .95, -r * .03], [-.08, 0, 0]);
      put(head, cylinder(r * .99, r * .99, r * .16, 22, true), mat('cloth', L.c1), [0, cy + r * .66, -r * .03], [-.08, 0, 0]);
      break;
    }
    case 'pointed':
      put(head, cylinder(r * 1.9, r * 1.9, r * .05, 28), M.c1, [0, cy + r * .58, 0], [-.06, 0, 0]);
      put(head, taperTube('wizhat', [[0, 0, 0], [0, .06, -.005], [0, .12, -.02], [0, .16, -.05], [0, .18, -.08]], r * 1.0, r * .03, 24, 18), M.c1, [0, cy + r * .6, 0]);
      put(head, torus(r * .99, r * .07, 6, 24), M.c2, [0, cy + r * .66, 0], [PI / 2 - .06, 0, 0]);
      break;
  }
}

/* ---------- weapons, shields and what's in the off hand ---------- */
const BLADE = (w, len, tip = .03) => [[-w, 0], [w, 0], [w * .9, len - tip], [0, len], [-w * .9, len - tip]];
function grip(g, M, len = .06, pom = true){ put(g, cylinder(.0085, .0085, len, 8), M.lea, [0, len / 2 - .02, 0]); if (pom) put(g, sphere(.013, 10, 8), M.brass, [0, -.025, 0]); }
export function weaponMesh(kind, M, accent = '#8fd0ff'){
  const g = new THREE.Group(), steel = mat('metal', '#e2e6ec'), wood = M.wood;
  switch (kind){
    case 'sword': case 'shortsword': case 'greatsword': case 'dagger': {
      const len = { sword:.27, shortsword:.19, greatsword:.42, dagger:.11 }[kind], w = { sword:.012, shortsword:.012, greatsword:.016, dagger:.009 }[kind], gl = kind === 'greatsword' ? .1 : kind === 'dagger' ? .045 : .06;
      grip(g, M, gl); put(g, box(kind === 'greatsword' ? .1 : kind === 'dagger' ? .04 : .07, .012, .016), M.brass, [0, gl - .02 + .006, 0]);
      put(g, plate(`blade|${kind}`, BLADE(w, len), .005, .002), steel, [0, gl - .01, 0]);
      put(g, box(.0025, len * .7, .0062), mat('metal', '#8a9098'), [0, gl - .01 + len * .4, 0]);                // the fuller
      break;
    }
    case 'rapier':
      grip(g, M, .06); put(g, plate('rapier', BLADE(.005, .32, .02), .004, .0012), steel, [0, .045, 0]);
      put(g, dome(.03, 1.3, 14, 6), M.brass, [0, .05, 0], [PI, 0, 0]); put(g, torus(.035, .003, 5, 14, PI), M.brass, [0, .02, .0], [0, PI / 2, PI / 2]);
      break;
    case 'scimitar': {
      grip(g, M, .06); put(g, box(.05, .01, .014), M.brass, [0, .046, 0]);
      const pts = []; for (let i = 0; i <= 8; i++){ const t = i / 8; pts.push([.012 + Math.sin(t * 1.2) * .04 - .0, t * .26]); } for (let i = 8; i >= 0; i--){ const t = i / 8; pts.push([-.004 + Math.sin(t * 1.2) * .04 * (t < .95 ? 1 : 1.1) - (1 - t) * .008, t * .25]); }
      put(g, plate('scimitar', pts, .005, .0015), steel, [0, .05, 0]);
      break;
    }
    case 'axe': case 'greataxe': {
      const h = kind === 'axe' ? .3 : .48; put(g, cylinder(.009, .01, h, 8), wood, [0, h / 2 - .05, 0]);
      const head = [[0, .03], [.04, .05], [.07, .075], [.075, .0], [.07, -.075], [.04, -.05], [0, -.03]];
      put(g, plate(`axe|${kind}`, head, .008, .002), steel, [.006, h - .09, 0]);
      if (kind === 'greataxe') put(g, plate(`axe|${kind}`, head, .008, .002), steel, [-.006, h - .09, 0], [0, PI, 0]);
      break;
    }
    case 'mace': case 'hammer': case 'maul': case 'club': {
      const h = kind === 'maul' ? .45 : .27; put(g, cylinder(.009, kind === 'club' ? .022 : .01, h, 8), kind === 'club' ? wood : wood, [0, h / 2 - .04, 0]);
      if (kind === 'mace'){ put(g, sphere(.024, 12, 10), steel, [0, h - .04, 0]); for (let i = 0; i < 6; i++) put(g, box(.004, .05, .02), steel, [Math.cos(i * PI / 3) * .022, h - .04, Math.sin(i * PI / 3) * .022], [0, -i * PI / 3, 0]); }
      if (kind === 'hammer') put(g, box(.075, .036, .036), steel, [0, h - .04, 0]);
      if (kind === 'maul') put(g, box(.11, .062, .062), steel, [0, h - .05, 0]);
      if (kind === 'club') put(g, sphere(.026, 10, 8), wood, [0, h - .04, 0]);
      break;
    }
    case 'spear': case 'glaive': case 'trident': {
      put(g, cylinder(.0085, .0085, .62, 8), wood, [0, .08, 0]);
      if (kind === 'spear') put(g, plate('leaf', [[-.014, 0], [.014, 0], [.02, .04], [0, .1], [-.02, .04]], .005, .0015), steel, [0, .39, 0]);
      if (kind === 'glaive') put(g, plate('glaive', [[-.01, 0], [.02, 0], [.045, .08], [.03, .16], [0, .2], [-.01, .1]], .005, .0015), steel, [0, .38, 0]);
      if (kind === 'trident'){ put(g, box(.07, .01, .01), steel, [0, .4, 0]); for (const x of [-.03, 0, .03]) put(g, cone(.007, .08, 6), steel, [x, .445, 0]); }
      g.userData.upright = 1;
      break;
    }
    case 'staff':
      put(g, taperTube('staff', [[0, -.3, 0], [.008, -.1, .004], [-.006, .1, -.004], [.006, .3, .002], [-.01, .4, 0]], .011, .008, 30, 7), wood);
      put(g, new THREE.OctahedronGeometry(.022), mat('gem', accent, accent, 2.2), [-.01, .43, 0]).userData.live = 1;
      g.userData.upright = 1; g.userData.glow = accent;
      break;
    case 'bow': case 'longbow': {
      const s = kind === 'longbow' ? .34 : .25, g1 = taperTube(`bow|${kind}`, [[0, -s, -.02], [0, -s * .5, .02], [0, 0, .035], [0, s * .5, .02], [0, s, -.02]], .009, .009, 28, 6);
      put(g, g1, wood); put(g, cylinder(.0012, .0012, s * 2, 4), mat('cloth', '#e8e0cc'), [0, 0, -.02]);
      put(g, cylinder(.011, .011, .05, 8), M.lea, [0, 0, .035]);
      g.userData.upright = 1;
      break;
    }
    case 'crossbow':
      put(g, box(.025, .025, .2), wood, [0, 0, .06]); put(g, taperTube('xbow', [[-.12, 0, 0], [-.05, 0, .025], [0, 0, .03], [.05, 0, .025], [.12, 0, 0]], .008, .008, 20, 6), steel, [0, .005, .15]);
      put(g, cylinder(.001, .001, .24, 4), mat('cloth', '#e8e0cc'), [0, .01, .148], [0, 0, PI / 2]);
      break;
    case 'sickle':
      put(g, cylinder(.009, .009, .1, 8), wood, [0, .03, 0]);
      put(g, taperTube('sickle', [[0, .07, 0], [.04, .11, 0], [.05, .16, 0], [.02, .2, 0], [-.02, .19, 0]], .008, .002, 20, 6), steel);
      break;
    case 'whip':
      put(g, cylinder(.009, .008, .08, 8), M.lea, [0, .02, 0]);
      put(g, taperTube('whip', [[0, .06, 0], [.02, .02, .05], [.03, -.08, .07], [0, -.14, .03], [-.03, -.12, -.02]], .006, .002, 26, 5), M.lea);
      break;
  }
  return g;
}
function offItem(kind, L, M){
  const g = new THREE.Group();
  if (kind === 'shield'){
    const round = (L.seed % 3) === 0, sc = mat('cloth', L.shieldCol), rim = mat('metal', METALS[L.metal] || METALS.steel);
    if (round){
      put(g, shell('rshield', [[.0005, .014], [.06, .011], [.105, 0], [.105, -.006], [.0005, -.004]], 1, 1, 26, false), sc, [0, 0, 0], [PI / 2, 0, 0]);
      put(g, torus(.105, .007, 6, 30), rim, [0, 0, 0]); put(g, sphere(.026, 12, 8), rim, [0, 0, .012], [0, 0, 0], [1, 1, .6]);
    } else {
      const out = [[-.085, .1], [.085, .1], [.085, .02], [.06, -.07], [0, -.12], [-.06, -.07], [-.085, .02]];
      put(g, plate('heater', out, .014, .005), sc);
      const em = (L.seed >> 3) % 3;
      if (em === 0) put(g, plate('chev', [[-.06, -.01], [0, .05], [.06, -.01], [.06, -.04], [0, .02], [-.06, -.04]], .004, .001), mat('cloth', L.c2), [0, -.01, .015]);
      if (em === 1){ put(g, box(.025, .19, .004), mat('cloth', L.c2), [0, -.01, .015]); put(g, box(.16, .025, .004), mat('cloth', L.c2), [0, .03, .015]); }
      if (em === 2) put(g, cylinder(.03, .03, .004, 20), mat('metal', METALS.brass), [0, .01, .015], [PI / 2, 0, 0]);
    }
    g.userData.shield = 1;
  }
  if (kind === 'dagger') return weaponMesh('dagger', M);
  if (kind === 'torch'){ put(g, cylinder(.009, .007, .2, 8), M.wood, [0, .06, 0]); put(g, cylinder(.014, .012, .03, 8), mat('cloth', '#3a2a1a'), [0, .16, 0]);
    const fl = put(g, cone(.02, .07, 8), mat('gem', '#ffb347', '#ff8a2a', 4), [0, .2, 0]); fl.userData.flame = 1; fl.userData.live = 1; g.userData.upright = 1; g.userData.light = '#ffb070'; }
  if (kind === 'lantern') lanternMesh(g, M);
  if (kind === 'book'){ put(g, box(.046, .062, .018), mat('leather', shade(L.c1, -.04)), [0, .02, .02]); put(g, box(.042, .058, .015), mat('cloth', '#e8dcc0'), [.004, .02, .02]); for (const [x, y] of [[-1, 1], [-1, -1]]) put(g, box(.01, .01, .02), M.brass, [x * .02, .02 + y * .027, .02]); g.userData.upright = 1; }
  if (kind === 'orb'){ const o = put(g, sphere(.028, 16, 12), mat('gem', L.c2, L.c2, 2.4), [0, .03, .02]); o.userData.live = 1; g.userData.glow = L.c2; }
  if (kind === 'holy'){ put(g, cylinder(.024, .024, .005, 18), M.brass, [0, .045, .02], [PI / 2, 0, 0]); for (let i = 0; i < 8; i++){ const a = i * PI / 4; put(g, cone(.006, .02, 4), M.brass, [Math.cos(a) * .032, .045 + Math.sin(a) * .032, .02], [0, 0, a - PI / 2]); } put(g, cylinder(.004, .004, .05, 6), M.wood, [0, .01, .02]); g.userData.upright = 1; }
  return g;
}
function lanternMesh(g, M){
  put(g, box(.032, .042, .032), mat('gem', '#ffd890', '#ffb050', 3), [0, -.035, 0]).userData.live = 1;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(g, cylinder(.0025, .0025, .048, 4), M.brass, [x * .017, -.035, z * .017]);
  put(g, cone(.026, .018, 4), M.brass, [0, -.006, 0], [0, PI / 4, 0]); put(g, torus(.012, .002, 4, 10), M.brass, [0, .01, 0]);
  g.userData.light = '#ffb870'; g.userData.upright = 1;
  return g;
}
function gear(rig, L, M){
  const accent = L.c2 && L.outfit === 'robe' ? '#8fd0ff' : '#8fd0ff';
  // the hand socket points an item's +y along the hand's +z (up and forward when the forearm is raised)
  const socket = (hand, item) => { const s = J(hand, 'socket', [0, -.03, .004]); s.rotation.x = PI / 2; s.add(item); return s; };
  if (L.main && L.main !== 'none'){ const w = weaponMesh(L.main, M, accent); rig.items.main = socket(rig.aR.h, w); rig.items.main.userData.kind = L.main; Object.assign(rig.items.main.userData, w.userData); }
  if (L.off && !['none', 'claw'].includes(L.off)){
    const it = offItem(L.off, L, M);
    if (it.userData.shield){ const s = J(rig.aL.f, 'shield', [.035, -.075, .035]); s.rotation.set(-.15, .45, 0); s.add(it); rig.items.off = s; }
    else { rig.items.off = socket(rig.aL.h, it); Object.assign(rig.items.off.userData, it.userData); }
    rig.items.off.userData.kind = L.off;
  }
  if (L.lantern){ const g = new THREE.Group(); lanternMesh(g, M); const s = J(rig.hips, 'beltLantern', [-.088, .03, .03]); s.add(g); rig.items.belt = s; }
  for (const it of Object.values(rig.items)) it.traverse(o => { if (o.userData.flame) rig.flames.push(o); });
}

/* ---------- merge what doesn't move on its own ---------- */
// For every joint, its mesh children that share a material become one mesh (positions baked in).
export function compact(root){
  const parents = []; root.traverse(o => { if (o.children.some(c => c.isMesh && !c.userData.live)) parents.push(o); });
  for (const p of parents){
    const byMat = new Map();
    for (const c of [...p.children]) if (c.isMesh && !c.isSkinnedMesh && !c.userData.live && !c.userData.cloak){ (byMat.get(c.material) || byMat.set(c.material, []).get(c.material)).push(c); }
    for (const [m, list] of byMat){
      if (list.length < 2) continue;
      const geos = list.map(c => { c.updateMatrix(); let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); g.applyMatrix4(c.matrix); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; });
      const merged = mergeGeometries(geos, false); geos.forEach(g => g.dispose());
      if (!merged) continue;
      for (const c of list) p.remove(c);
      const mesh = new THREE.Mesh(merged, m); mesh.userData.merged = 1; p.add(mesh);
    }
  }
  return root;
}
// Free what one figure owns (merged geometry, cloaks); shared geometry and materials stay cached.
export function disposeForge(fig){ fig.traverse(o => { if (o.isMesh && (o.userData.merged || o.userData.cloak)) o.geometry.dispose(); }); }
