/* PROPS & BUILDINGS in 3D — small procedural pieces (boxes, cylinders, cones) so the single-file build
   stays light. Each builder makes the unturned piece centred on the origin, w squares along x and
   h squares along z (1 square = 1 unit = 5 ft; a person is about 1.2 tall). */
import * as THREE from 'three';
import { PROPS, propSize } from '../data/props.js';
import { wx, wz } from './scene.js';

const mats = new Map(), geos = new Map();
function mat(color, o = {}){
  const key = color + '|' + JSON.stringify(o);
  if (!mats.has(key)){
    const m = new THREE.MeshStandardMaterial({ color, roughness:o.r ?? .85, metalness:o.m ?? 0,
      emissive:new THREE.Color(o.e || '#000000'), emissiveIntensity:o.ei ?? 1, transparent:(o.op ?? 1) < 1, opacity:o.op ?? 1, side:o.ds ? THREE.DoubleSide : THREE.FrontSide });
    m.userData.shared = true; mats.set(key, m);
  }
  return mats.get(key);
}
const geo = (key, make) => { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); };
function mesh(g, geometry, color, x, y, z, o){ const m = new THREE.Mesh(geometry, mat(color, o)); m.position.set(x, y, z); g.add(m); return m; }
const box = (g, w, h, d, color, x = 0, y = 0, z = 0, o) => mesh(g, geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), color, x, y, z, o);
const cyl = (g, rt, rb, h, color, x = 0, y = 0, z = 0, o, seg = 12) => mesh(g, geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), color, x, y, z, o);
const cone = (g, r, h, color, x = 0, y = 0, z = 0, o, seg = 8) => mesh(g, geo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), color, x, y, z, o);
const ball = (g, r, color, x = 0, y = 0, z = 0, o) => mesh(g, geo(`s${r}`, () => new THREE.SphereGeometry(r, 12, 8)), color, x, y, z, o);

const WOOD = '#6b4a2b', DARK = '#3f2a19', LIGHT = '#8a6a42', IRON = '#34343a', STONE = '#77716a', STRAW = '#b8a05a', SALT = '#ece8de';
const FIRE = { e:'#ff7a2a', ei:2.2, r:1 }, GLOW = { e:'#ffb060', ei:1.6, r:1 }, METAL = { r:.45, m:.7 };

function legs(g, w, d, h, color = DARK, t = .06){ for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, t, h, t, color, sx * (w / 2 - t), h / 2, sz * (d / 2 - t)); }
function wheel(g, r, x, y, z, turn = true){
  const w = mesh(g, geo(`wh${r}`, () => new THREE.TorusGeometry(r, r * .12, 6, 16)), DARK, x, y, z);
  if (turn) w.rotation.y = Math.PI / 2;
  const hub = cyl(g, r * .2, r * .2, .08, IRON, x, y, z, METAL); hub.rotation.z = Math.PI / 2; if (!turn) hub.rotation.set(Math.PI / 2, 0, 0);
  return w;
}
function flame(g, x, y, z, s = 1){ cone(g, .06 * s, .16 * s, '#ffd27a', x, y, z, FIRE, 6); }
function pineAt(g, x, z, s = 1, tint = '#1f3a24'){
  cyl(g, .07 * s, .1 * s, .5 * s, '#3e2c1c', x, .25 * s, z);
  cone(g, .48 * s, .9 * s, tint, x, .85 * s, z); cone(g, .38 * s, .75 * s, tint, x, 1.25 * s, z); cone(g, .24 * s, .6 * s, tint, x, 1.62 * s, z);
}

const BUILD = {
  table(g){ cyl(g, .42, .42, .06, LIGHT, 0, .48, 0); cyl(g, .06, .1, .45, DARK, 0, .23, 0); cyl(g, .06, .05, .1, '#9a8a6a', .15, .56, .05); },
  longtable(g){ box(g, .8, .06, 1.8, LIGHT, 0, .48, 0); legs(g, .8, 1.8, .45); for (const z of [-.55, 0, .55]) cyl(g, .12, .12, .02, '#c9c0ad', -.18, .52, z); flame(g, .2, .6, 0); cyl(g, .03, .03, .1, '#e8dcc0', .2, .53, 0); },
  chair(g){ box(g, .4, .05, .4, WOOD, 0, .26, 0); box(g, .4, .45, .05, WOOD, 0, .5, -.18); legs(g, .4, .4, .25); },
  bench(g){ box(g, .32, .05, 1.7, WOOD, 0, .26, 0); legs(g, .32, 1.7, .25); },
  stool(g){ cyl(g, .16, .16, .05, WOOD, 0, .3, 0); cyl(g, .04, .06, .28, DARK, 0, .14, 0); },
  bar(g){ box(g, .65, .58, 2.9, DARK, 0, .29, 0); box(g, .8, .06, 2.96, LIGHT, 0, .61, 0); for (const z of [-1, -.4, .5, 1.1]) cyl(g, .06, .05, .12, '#a89060', .1, .7, z); },
  shelf(g){ box(g, .3, 1.3, 1.8, DARK, 0, .65, 0); for (const y of [.45, .85, 1.2]){ box(g, .32, .04, 1.78, LIGHT, .02, y - .04, 0); for (let k = 0; k < 6; k++) cyl(g, .04, .04, .2, ['#2f5a2a', '#5a3a1e', '#7a2a2a'][k % 3], .05, y + .08, -.75 + k * .3, { r:.3 }); } },
  hearth(g){
    box(g, .55, 1.5, 1.9, '#5f5a55', 0, .75, 0); box(g, .4, .7, 1.0, '#120c0a', .1, .35, 0);
    for (const z of [-.2, 0, .2]) flame(g, .2, .12, z, 1.8);
    box(g, .2, .05, .7, '#3a2618', .2, .05, 0); box(g, .6, .12, 2.0, '#6e6862', .03, 1.52, 0);
  },
  cauldron(g){ const b = mesh(g, geo('caul', () => new THREE.SphereGeometry(.3, 14, 10, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65)), '#1e1c1c', 0, .33, 0, METAL); b.rotation.x = Math.PI;
    cyl(g, .26, .26, .02, '#6a5a3a', 0, .42, 0, { r:.4 }); for (const a of [0, 2.1, 4.2]) box(g, .04, .2, .04, IRON, Math.cos(a) * .2, .08, Math.sin(a) * .2); flame(g, 0, .02, 0, 1.4); },
  saltcrock(g){ cyl(g, .2, .16, .38, '#b9a98a', 0, .19, 0, { r:.6 }); cyl(g, .21, .21, .04, '#8a7a5e', .12, .4, .1).rotation.z = .5; },
  bed(g){ box(g, .9, .3, 1.9, DARK, 0, .15, 0); box(g, .82, .12, 1.75, '#c8bfa8', 0, .36, .05); box(g, .5, .1, .3, '#e2dccd', 0, .45, -.7); box(g, .9, .6, .08, DARK, 0, .3, -.95); box(g, .84, .06, 1.1, '#6a2228', 0, .44, .35); },
  rug(g){ box(g, 1.8, .015, 2.8, '#5e1c22', 0, .01, 0); box(g, 1.5, .02, 2.5, '#7a2a2e', 0, .012, 0); box(g, .9, .025, 1.8, '#a07a3a', 0, .014, 0); },
  candelabra(g){ cyl(g, .03, .05, 1.1, IRON, 0, .55, 0, METAL); cyl(g, .18, .18, .03, IRON, 0, 1.1, 0, METAL); for (const a of [0, 2.1, 4.2]){ cyl(g, .025, .025, .12, '#efe6cf', Math.cos(a) * .15, 1.18, Math.sin(a) * .15); flame(g, Math.cos(a) * .15, 1.3, Math.sin(a) * .15); } },
  barrel(g){ cyl(g, .28, .25, .62, WOOD, 0, .31, 0); for (const y of [.12, .5]) cyl(g, .29, .29, .04, IRON, 0, y, 0, METAL); },
  kegs(g){ for (const x of [-.45, .45]){ const k = cyl(g, .28, .28, .7, WOOD, x, .3, 0); k.rotation.x = Math.PI / 2; const h = cyl(g, .29, .29, .04, IRON, x, .3, .2, METAL); h.rotation.x = Math.PI / 2; } box(g, 1.7, .06, .3, DARK, 0, .03, 0); },
  crate(g){ const c = box(g, .62, .62, .62, LIGHT, 0, .31, 0); c.rotation.y = .3; const s = box(g, .64, .06, .64, WOOD, 0, .52, 0); s.rotation.y = .3; },
  sacks(g){ for (const [x, z, s] of [[-.15, -.1, 1], [.18, .05, .9], [-.02, .2, .8]]){ const b = ball(g, .2 * s, '#a08a62', x, .14 * s, z); b.scale.set(1, .75, 1.2); } },
  well(g){
    cyl(g, .7, .75, .55, '#6e6a64', 0, .27, 0, {}, 16); cyl(g, .55, .55, .02, '#0a0d10', 0, .56, 0, { r:.1 }, 16);
    for (const s of [-1, 1]) box(g, .1, 1.3, .1, DARK, s * .62, .9, 0);
    box(g, 1.4, .08, .08, DARK, 0, 1.5, 0); const r1 = box(g, 1.6, .05, .7, '#4a3a30', 0, 1.7, -.22); r1.rotation.x = .55; const r2 = box(g, 1.6, .05, .7, '#4a3a30', 0, 1.7, .22); r2.rotation.x = -.55;
    cyl(g, .12, .1, .18, WOOD, .2, 1.1, 0);
  },
  stall(g){
    box(g, 1.8, .5, .7, WOOD, 0, .25, .05); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .07, 1.4, .07, DARK, sx * .85, .7, sz * .35);
    const aw = box(g, 2, .04, 1.0, '#7a1f24', 0, 1.42, 0); aw.rotation.x = -.18;
    for (let k = 0; k < 5; k++) ball(g, .1, ['#b8402a', '#cfa23a', '#5a7a32', '#d8cfa8', '#7a3a5a'][k], -.7 + k * .35, .58, .05);
  },
  cart(g){ box(g, .8, .12, 1.3, WOOD, 0, .45, 0); for (const sx of [-1, 1]) box(g, .05, .3, 1.3, WOOD, sx * .4, .62, 0); for (const sx of [-1, 1]) wheel(g, .32, sx * .48, .32, .1); for (const sx of [-1, 1]) box(g, .05, .05, .9, DARK, sx * .25, .45, -1.05); box(g, .4, .3, .5, STRAW, 0, .66, .1); },
  hay(g){ for (const [x, y, z] of [[-.18, .18, 0], [.2, .18, .05], [0, .5, 0]]) box(g, .45, .32, .62, STRAW, x, y, z); },
  fence(g){ for (const x of [-.45, .45]) box(g, .08, .7, .08, DARK, x, .35, 0); for (const y of [.3, .58]) box(g, 1, .06, .05, WOOD, 0, y, 0); },
  lamppost(g){ cyl(g, .04, .06, 1.7, IRON, 0, .85, 0, METAL); box(g, .3, .04, .04, IRON, .12, 1.65, 0, METAL); box(g, .14, .2, .14, '#ffcf7a', .24, 1.5, 0, GLOW); },
  signpost(g){ box(g, .08, 1.4, .08, DARK, 0, .7, 0); const a = box(g, .7, .14, .04, LIGHT, .25, 1.2, 0); a.rotation.z = .05; const b = box(g, .6, .14, .04, LIGHT, -.2, .95, 0); b.rotation.y = .5; },
  trough(g){ box(g, .55, .35, 1.6, WOOD, 0, .18, 0); box(g, .44, .02, 1.48, '#1d2a30', 0, .34, 0, { r:.2 }); },
  gravestone(g){ box(g, .45, .55, .1, '#8a8780', 0, .28, 0); cyl(g, .225, .225, .1, '#8a8780', 0, .55, 0).rotation.x = Math.PI / 2; box(g, .5, .05, .7, '#3a3a2a', 0, .03, .3); },
  shrine(g){ box(g, .35, .9, .35, STONE, 0, .45, 0); box(g, .55, .08, .55, '#4a3a30', 0, .95, 0); cone(g, .38, .3, '#4a3a30', 0, 1.12, 0, {}, 4).rotation.y = Math.PI / 4; cyl(g, .03, .03, .08, '#efe6cf', 0, .62, .19); flame(g, 0, .7, .19); },
  anvil(g){ box(g, .9, .7, .9, '#5a5450', -.45, .35, 0); box(g, .5, .25, .5, '#1a0c08', -.45, .7, 0); flame(g, -.45, .82, 0, 1.6); box(g, .18, .35, .18, DARK, .5, .18, 0); box(g, .5, .14, .2, IRON, .5, .42, 0, METAL); },
  carriage(g){
    box(g, 1.25, 1.0, 1.8, '#2a1e1a', 0, 1.0, .1, { r:.5 }); box(g, 1.3, .06, 1.86, '#a8873a', 0, 1.52, .1, { r:.4, m:.6 });
    for (const sx of [-1, 1]) box(g, .02, .35, .45, '#ffcf7a', sx * .63, 1.15, .1, GLOW);
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) wheel(g, .45, sx * .7, .45, sz * .85 + .1);
    box(g, 1.0, .12, .6, DARK, 0, 1.0, -1.15); box(g, .08, .08, 1.2, DARK, 0, .5, -1.6);
  },
  wreck(g){
    const body = new THREE.Group(); body.position.set(-.1, .62, 0); body.rotation.z = Math.PI / 2 - .15; g.add(body);
    box(body, 1.25, 1.0, 1.8, '#2a1e1a', 0, 0, 0, { r:.5 }); box(body, 1.3, .06, 1.86, '#a8873a', 0, .52, 0, { r:.4, m:.6 });
    box(body, .04, .5, .55, '#0a0806', .63, .05, .1);
    wheel(g, .45, .55, 1.3, .7, false).rotation.set(.3, .2, 0); wheel(g, .45, .55, 1.25, -.7, false).rotation.set(-.2, 0, .1);
    const loose = wheel(g, .45, 1.1, .06, 1.1, false); loose.rotation.set(Math.PI / 2, 0, .3);
    box(g, .08, .08, 1.3, DARK, -1.0, .06, -.9).rotation.y = .6;
    for (const [x, z] of [[-.9, .8], [.8, -1.0], [-.3, 1.2]]){ const s = ball(g, .18, '#a08a62', x, .1, z); s.scale.set(1, .6, 1.3); cone(g, .28, .12, SALT, x + .1, .06, z + .15, { r:.9 }, 10); }
  },
  horse(g){
    const b = ball(g, .3, '#4a3424', 0, .25, .1); b.scale.set(1, .9, 2.2);
    const n = cyl(g, .1, .14, .55, '#4a3424', .05, .2, -.7); n.rotation.x = 1.3; const hd = box(g, .2, .2, .42, '#3e2c1e', .1, .14, -1.0); hd.rotation.y = .2;
    for (const [x, z, r] of [[.25, -.2, .6], [.3, .1, .9], [.25, .5, .5], [.3, .7, 1.1]]){ const l = cyl(g, .045, .045, .6, '#3e2c1e', x + .2, .1, z); l.rotation.z = Math.PI / 2 - r * .3; }
    box(g, 1.1, .01, 1.6, '#3a0c10', -.1, .012, .1, { r:.3 });
  },
  wheel(g){ const w = wheel(g, .42, 0, .06, 0, false); w.rotation.x = Math.PI / 2; for (const a of [.4, 1.5, 2.6]){ const s = box(g, .8, .03, .04, WOOD, 0, .07, 0); s.rotation.y = a; } },
  saltspill(g){
    for (const [x, z, r] of [[-.4, -.3, .2], [.35, .2, -.4], [-.2, .5, 1.1]]){ const s = ball(g, .24, '#a08a62', x, .14, z); s.scale.set(1, .6, 1.4); s.rotation.y = r; }
    for (const [x, z, rr] of [[.1, -.1, .45], [-.5, .25, .3], [.5, -.5, .28], [.2, .6, .22]]) cone(g, rr, rr * .45, SALT, x, rr * .2, z, { r:.95, e:'#ffffff', ei:.08 }, 14);
  },
  pine(g){ pineAt(g, 0, 0, 1.25); },
  deadtree(g){ cyl(g, .07, .14, 1.6, '#5a5048', 0, .8, 0); for (const [y, a, l] of [[1.1, .7, .7], [1.35, -.9, .6], [.8, 2.3, .5], [1.5, 2.9, .45]]){ const br = cyl(g, .025, .045, l, '#5a5048', Math.cos(a) * l * .35, y, Math.sin(a) * l * .35); br.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); } },
  stump(g){ cyl(g, .26, .32, .3, '#4a3626', 0, .15, 0); cyl(g, .25, .25, .01, '#a08460', 0, .305, 0); },
  boulder(g){ const b = mesh(g, geo('boulder', () => new THREE.DodecahedronGeometry(.4, 0)), '#6a6660', 0, .25, 0); b.scale.set(1.1, .7, .9); b.rotation.y = .7; },
  log(g){ const l = cyl(g, .18, .2, 1.8, '#4a3626', 0, .18, 0); l.rotation.x = Math.PI / 2; },
  bush(g){ for (const [x, z, r] of [[-.15, 0, .26], [.15, .1, .22], [0, -.18, .2]]) ball(g, r, '#2a4428', x, r * .8, z); },
  milestone(g){ box(g, .35, .7, .2, '#8a8478', 0, .35, 0); cyl(g, .175, .175, .2, '#8a8478', 0, .7, 0).rotation.x = Math.PI / 2; },
  lantern(g){ box(g, .16, .22, .16, '#ffcf7a', 0, .13, 0, GLOW); box(g, .2, .03, .2, IRON, 0, .26, 0, METAL); box(g, .2, .03, .2, IRON, 0, .01, 0, METAL); const h = mesh(g, geo('lh', () => new THREE.TorusGeometry(.07, .012, 4, 10, Math.PI)), IRON, 0, .29, 0, METAL); h.rotation.y = .4; },
  chest(g){ box(g, .7, .4, .45, WOOD, 0, .2, 0); const lid = cyl(g, .225, .225, .7, LIGHT, 0, .4, 0, {}, 10); lid.rotation.z = Math.PI / 2; lid.scale.set(1, 1, .6); for (const x of [-.25, .25]) box(g, .05, .46, .47, IRON, x, .23, 0, METAL); },
  altar(g){ box(g, .8, .8, 1.7, '#8e8a82', 0, .4, 0); box(g, .9, .08, 1.8, '#a6a29a', 0, .82, 0); flame(g, 0, .95, -.5); flame(g, 0, .95, .5); },
  coffin(g){ box(g, .6, .4, 1.7, '#2a1c14', 0, .2, 0); box(g, .64, .06, 1.74, '#3a281c', 0, .43, 0); box(g, .06, .02, .5, '#a8873a', 0, .47, -.2, { m:.6 }); },
  pillar(g){ cyl(g, .3, .32, 1.5, STONE, 0, .75, 0, {}, 12); box(g, .7, .12, .7, '#8a847c', 0, 1.5, 0); box(g, .7, .12, .7, '#8a847c', 0, .06, 0); },
  bones(g){ ball(g, .1, '#e8e0cc', 0, .08, 0); for (const a of [.3, 1.4, 2.5, 3.6]){ const b = cyl(g, .025, .025, .35, '#e0d6c0', Math.cos(a) * .2, .03, Math.sin(a) * .2); b.rotation.set(Math.PI / 2, 0, a); } },
  brazier(g){ for (const a of [0, 2.1, 4.2]) box(g, .04, .6, .04, IRON, Math.cos(a) * .15, .3, Math.sin(a) * .15, METAL); cyl(g, .25, .15, .15, IRON, 0, .65, 0, METAL); flame(g, 0, .8, 0, 2); flame(g, .08, .76, .05, 1.3); },
};

export function buildProp(p){
  const g = new THREE.Group(), s = propSize(p);
  (BUILD[p.k] || BUILD.crate)(g);
  g.rotation.y = -(p.rot || 0) * Math.PI / 2;
  g.position.set(wx(p.x) + (s.w - 1) / 2, 0, wz(p.y) + (s.h - 1) / 2);
  g.userData.propId = p.id;
  return g;
}

/* Buildings: solid houses on outdoor floors (the squares under them stay rock). Lit windows at night. */
const ROOFS = ['#6a3a32', '#585a62', '#7a6440', '#4e5258'], WALLS = ['#b0a088', '#9a8c74', '#c0b094', '#8e8070'];
export function buildBuilding(b, k = 0){
  const g = new THREE.Group(), H = b.tall ? 2.6 : 1.8, long = b.w >= b.h;
  const wallC = b.wall || WALLS[k % WALLS.length], roofC = b.roof || ROOFS[k % ROOFS.length];
  box(g, b.w - .1, H, b.h - .1, wallC, 0, H / 2, 0, { r:.95 });
  // timber frame
  for (const s of [-1, 1]){ box(g, b.w, .1, .12, DARK, 0, H - .05, s * (b.h / 2 - .02)); box(g, .12, .1, b.h, DARK, s * (b.w / 2 - .02), H - .05, 0); }
  // roof: two slopes along the long side, with gable ends
  const span = long ? b.h : b.w, len = (long ? b.w : b.h) + .3, rise = span * .45, slope = Math.hypot(span / 2 + .15, rise);
  const ang = Math.atan2(rise, span / 2 + .15);
  for (const s of [-1, 1]){
    const r = box(g, long ? len : slope, .08, long ? slope : len, roofC, 0, H + rise / 2, 0, { r:.8 });
    if (long){ r.position.z = s * (span / 4 + .04); r.rotation.x = s * ang; } else { r.position.x = s * (span / 4 + .04); r.rotation.z = -s * ang; }
  }
  const tri = geo(`gable${span}`, () => { const sh = new THREE.Shape(); sh.moveTo(-span / 2, 0); sh.lineTo(span / 2, 0); sh.lineTo(0, rise); sh.closePath(); return new THREE.ShapeGeometry(sh); });
  for (const s of [-1, 1]){ const m = new THREE.Mesh(tri, mat(wallC, { ds:true, r:.95 })); m.position.y = H; if (long){ m.rotation.y = Math.PI / 2; m.position.x = s * (b.w / 2 - .05); } else m.position.z = s * (b.h / 2 - .05); g.add(m); }
  // chimney
  if (!b.noChimney) box(g, .35, rise + .6, .35, '#5f5a55', (long ? b.w * .28 : 0), H + (rise + .6) / 2, (long ? 0 : b.h * .28));
  // door and windows on the street side
  const side = b.door || 's', out = { n:[0, -1], s:[0, 1], e:[1, 0], w:[-1, 0] }[side], along = out[0] ? b.h : b.w;
  const facePos = (t, y) => out[0] ? [out[0] * (b.w / 2 + .01), y, t] : [t, y, out[1] * (b.h / 2 + .01)];
  const dm = box(g, out[0] ? .04 : .45, .8, out[0] ? .45 : .04, '#2a1c14', ...facePos(0, .4));
  dm.userData.door = 1;
  for (const t of [-along / 3, along / 3]) if (Math.abs(t) > .5){
    const lit = b.dark ? '#141210' : '#ffc46a';
    box(g, out[0] ? .04 : .32, .3, out[0] ? .32 : .04, lit, ...facePos(t, H * .55), b.dark ? {} : { e:'#ffaa50', ei:1.2, r:1 });
  }
  g.position.set(wx(b.x) + (b.w - 1) / 2, 0, wz(b.y) + (b.h - 1) / 2);
  return g;
}
export const inBuilding = (f, x, y) => (f.buildings || []).some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);

/* Trees for the edges of outdoor floors: one merged pine (trunk + three tiers) for an InstancedMesh. */
let treeGeo = null;
export function treeGeometry(){
  if (treeGeo) return treeGeo;
  const parts = [], paint = (gm, c) => { const col = new THREE.Color(c), n = gm.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.toArray(a, i * 3); gm.setAttribute('color', new THREE.BufferAttribute(a, 3)); return gm; };
  const add = (gm, c, y) => { gm.translate(0, y, 0); parts.push(paint(gm.index ? gm.toNonIndexed() : gm, c)); };
  add(new THREE.CylinderGeometry(.08, .12, .6, 6), '#4a3424', .3);
  add(new THREE.ConeGeometry(.55, 1.0, 7), '#24402a', .95);
  add(new THREE.ConeGeometry(.43, .85, 7), '#2a4a30', 1.4);
  add(new THREE.ConeGeometry(.28, .7, 7), '#30543a', 1.82);
  // merge by hand (all non-indexed, same attributes)
  const keys = ['position', 'normal', 'color'], out = new THREE.BufferGeometry();
  for (const k of keys){
    const size = parts[0].attributes[k].itemSize, total = parts.reduce((s, p) => s + p.attributes[k].array.length, 0), arr = new Float32Array(total); let o = 0;
    for (const p of parts){ arr.set(p.attributes[k].array, o); o += p.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  treeGeo = out; return out;
}
export const treeMaterial = (() => { const m = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.9 }); m.userData.shared = true; return m; })();
