/* PROPS & BUILDINGS in 3D — small procedural pieces (boxes, cylinders, cones) so the single-file build
   stays light. Each builder makes the unturned piece centred on the origin, w squares along x and
   h squares along z (1 square = 1 unit = 5 ft; a person is about 1.2 tall). */
import * as THREE from 'three';
import { PROPS, propSize } from '../data/props.js';
import { OBJECTS } from '../data/objects.js';
import { mulberry32 } from '../util/core.js';
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
/* A part that opens (a lid, a door, a drawer): a group at its hinge. key: which rotation or position axis moves;
   a: closed, b: open. Built in its current pose; animateProp (render/floors.js) tweens between the two. */
function opener(g, p, key, a, b, x = 0, y = 0, z = 0){
  const h = new THREE.Group(); h.position.set(x, y, z); g.add(h);
  const [kind, axis] = key.split('.'); h[kind][axis] = p?.open ? b : a;
  (g.userData.openers ||= []).push({ o:h, kind, axis, a, b });
  return h;
}
const hollow = (g, w, d, y, x = 0, z = 0) => box(g, w, .01, d, '#0c0807', x, y, z, { r:1 });   // the dark inside, seen when open
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
  barrel(g, p){ cyl(g, .28, .25, .62, WOOD, 0, .31, 0); for (const y of [.12, .5]) cyl(g, .29, .29, .04, IRON, 0, y, 0, METAL);
    if (p?.open) hollow(g, .4, .4, .625); const lid = opener(g, p, 'rotation.z', 0, -1.9, .27, .63, 0); cyl(lid, .27, .27, .03, LIGHT, -.27, 0, 0); },
  kegs(g){ for (const x of [-.45, .45]){ const k = cyl(g, .28, .28, .7, WOOD, x, .3, 0); k.rotation.x = Math.PI / 2; const h = cyl(g, .29, .29, .04, IRON, x, .3, .2, METAL); h.rotation.x = Math.PI / 2; } box(g, 1.7, .06, .3, DARK, 0, .03, 0); },
  crate(g, p){ const c = box(g, .62, .58, .62, LIGHT, 0, .29, 0); c.rotation.y = .3; const s = box(g, .64, .06, .64, WOOD, 0, .45, 0); s.rotation.y = .3;
    if (p?.open) hollow(g, .5, .5, .585); const lid = opener(g, p, 'rotation.x', 0, -2.1, 0, .6, -.31); const l = box(lid, .64, .05, .64, WOOD, 0, .02, .31); void l; lid.rotation.y = .3; },
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
  gates(g){
    for (const z of [-2.05, 2.05]){
      box(g, .9, 2.6, .9, '#5e5a56', 0, 1.3, z); box(g, 1.05, .18, 1.05, '#4e4a46', 0, 2.68, z);
      // the headless guardians
      box(g, .5, .9, .42, '#6e6a64', 0, 3.22, z); box(g, .7, .14, .5, '#6e6a64', 0, 3.6, z); box(g, .16, .7, .16, '#6e6a64', .32, 3.15, z + (z < 0 ? .12 : -.12));
    }
    for (const s of [-1, 1]){   // the iron leaves, standing open
      const leaf = new THREE.Group(); leaf.position.set(0, 0, s * 1.6); leaf.rotation.y = s * 1.15; g.add(leaf);
      for (let k = 0; k < 7; k++) box(leaf, .05, 2.1, .05, IRON, 0, 1.05, -s * (.1 + k * .22), METAL);
      for (const y of [.25, 1.1, 1.95]) box(leaf, .06, .06, 1.5, IRON, 0, y, -s * .75, METAL);
      for (let k = 0; k < 7; k++) cone(leaf, .04, .16, IRON, 0, 2.2, -s * (.1 + k * .22), METAL, 4);
    }
  },
  gallows(g){ box(g, 1.8, .25, 1.8, '#4a3626', 0, .12, 0); for (const x of [-.7, .7]) box(g, .14, 2.4, .14, '#3a2a1c', x, 1.3, -.5);
    box(g, 1.7, .14, .14, '#3a2a1c', 0, 2.45, -.5); box(g, .02, .7, .02, '#b8a882', 0, 2.05, -.5); mesh(g, geo('noose', () => new THREE.TorusGeometry(.1, .018, 5, 12)), '#b8a882', 0, 1.62, -.5).rotation.y = 1.2;
    const b = box(g, .1, .9, .1, '#3a2a1c', -.7, .7, .3); b.rotation.x = .5; },
  scarecrow(g){ cyl(g, .035, .04, 1.7, '#4a3626', 0, .85, 0); box(g, 1.0, .05, .05, '#4a3626', 0, 1.3, 0);
    const coat = cone(g, .32, .9, '#4e4436', 0, 1.0, 0, {}, 6); coat.rotation.x = Math.PI; ball(g, .17, '#b0a070', 0, 1.62, 0); cone(g, .26, .3, '#3a3024', 0, 1.82, 0, {}, 8);
    for (const x of [-.06, .06]) ball(g, .025, '#2a0a0a', x, 1.65, .15, { e:'#7a1010', ei:.6 }); for (const x of [-.45, .45]) cone(g, .08, .25, STRAW, x, 1.22, 0, {}, 5); },
  mist(g){ const fog = { op:.1, r:1, e:'#9ea4b4', ei:.2 }; for (const [x, y, z, r] of [[-.4, .4, -.3, .7], [.5, .5, .2, .8], [0, .7, .5, .6], [.3, .35, -.6, .55], [-.6, .3, .6, .5]]){ const m = ball(g, r * 1.25, '#cdd1dc', x, y * .8, z, fog); m.material.depthWrite = false; m.scale.y = .4; } g.userData.spin = .04; },
  campfire(g){ for (let k = 0; k < 8; k++){ const a = k / 8 * Math.PI * 2; ball(g, .07, '#5e5a56', Math.cos(a) * .32, .05, Math.sin(a) * .32); }
    for (const a of [.3, 1.9]){ const l = cyl(g, .05, .05, .6, '#3a2618', 0, .08, 0); l.rotation.z = Math.PI / 2; l.rotation.y = a; }
    flame(g, 0, .2, 0, 2.2); flame(g, .08, .16, .05, 1.5); flame(g, -.07, .15, -.04, 1.3); },
  vardo(g){
    box(g, .95, .85, 1.75, '#7a2a24', 0, .95, 0, { r:.6 }); const roof = cyl(g, .52, .52, 1.85, '#2f5a3a', 0, 1.36, 0, { r:.6 }, 14); roof.rotation.x = Math.PI / 2; roof.scale.set(1, 1, .55);
    for (const x of [-.48, .48]) box(g, .02, .5, 1.6, '#c9a246', x, .98, 0, { r:.4, m:.5 });
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) wheel(g, .38, sx * .55, .38, sz * .55);
    box(g, .5, .7, .04, '#4a2a18', 0, .95, .88); box(g, .14, .2, .14, '#ffcf7a', .4, 1.4, .92, GLOW); for (const x of [-.12, .12]) box(g, .05, .05, .7, DARK, x, .45, -1.15);
  },
  bridge(g){ box(g, 1.02, .1, .96, '#5a4028', 0, .04, 0); for (let k = -2; k <= 2; k++) box(g, 1.02, .02, .02, '#3a2818', 0, .1, k * .18);
    for (const z of [-.46, .46]){ box(g, 1.02, .06, .06, '#4a3420', 0, .55, z); box(g, .07, .55, .07, '#4a3420', -.45, .3, z); box(g, .07, .55, .07, '#4a3420', .45, .3, z); } },
  ravens(g){ cyl(g, .03, .05, .9, '#4a4038', 0, .45, 0); box(g, .7, .03, .03, '#4a4038', 0, .85, 0);
    for (const [x, y, ry] of [[-.25, .92, .4], [.2, .92, -.6], [0, .08, 1.2]]){ const b = ball(g, .07, '#0e0c10', x, y, 0); b.scale.set(.8, .9, 1.5); b.rotation.y = ry; cone(g, .025, .08, '#2a2620', x + Math.sin(ry) * .1, y + .02, Math.cos(ry) * .1, {}, 4).rotation.x = Math.PI / 2; } },
  palisade(g){ for (const [x, h] of [[-.33, 1.6], [0, 1.8], [.33, 1.5]]){ cyl(g, .14, .15, h, '#5a4430', x, h / 2, 0, {}, 7); cone(g, .14, .3, '#4a3626', x, h + .15, 0, {}, 7); } box(g, 1, .08, .1, '#3a2a1c', 0, 1.1, .14); },
  rubble(g){ for (const [x, z, s, r] of [[-.2, -.1, .3, .4], [.2, .15, .24, 1.2], [0, .3, .2, 2.1], [.25, -.25, .18, .7]]){ const b = box(g, s, s * .7, s * 1.2, '#7a746c', x, s * .35, z); b.rotation.set(r * .3, r, r * .2); } },
  hull(g){ const p = box(g, 1.8, .1, 1.6, '#3a3e42', 0, .5, 0, { r:.45, m:.7 }); p.rotation.set(.5, .3, .35);
    const seam = box(g, 1.7, .02, .05, '#9cc23c', 0, .56, 0, { e:'#9cc23c', ei:1.4, r:1 }); seam.rotation.copy(p.rotation);
    for (let k = 0; k < 5; k++) ball(g, .03, '#6a6e72', -.7 + k * .35, .62 + k * .03, -.35, METAL); },
  boat(g){ const h = box(g, .7, .3, 1.6, '#4a3424', 0, .1, 0); cone(g, .35, .5, '#4a3424', 0, .1, -1.0, {}, 4).rotation.x = -Math.PI / 2; box(g, .6, .04, 1.4, '#2a1c12', 0, .26, .05);
    const o = box(g, .05, .05, 1.4, '#6b4a2b', .3, .3, .1); o.rotation.y = .4; },
  stone(g){ const s = box(g, .45, 1.5, .32, '#7c786e', 0, .7, 0, { r:.95 }); s.rotation.set(.06, .3, -.05); box(g, .47, .3, .34, '#4a5a3a', 0, .2, 0); },
  bloomgrowth(g){ for (const [x, z, r] of [[0, 0, .22], [.2, .15, .14], [-.18, .12, .12], [.05, -.22, .1]]){ const m = ball(g, r, '#5e7a3a', x, r * .6, z, { e:'#9cc23c', ei:.55, r:.4 }); m.scale.y = .7; } },
  vines(g){ for (const z of [-1.4, 1.4]) box(g, .08, .9, .08, '#4a3626', 0, .45, z); box(g, .02, .02, 2.8, '#6a6a60', 0, .8, 0);
    for (let k = 0; k < 7; k++) ball(g, .2, k % 2 ? '#2f4a26' : '#3a5a2c', 0, .62, -1.2 + k * .4); for (let k = 0; k < 4; k++) ball(g, .06, '#3a1a3a', .12, .5, -1 + k * .65); },
  tent(g){ const t = cone(g, 1.0, 1.3, '#7a3a2a', 0, .65, 0, { r:.9 }, 4); t.rotation.y = Math.PI / 4; t.scale.set(1, 1, .8);
    box(g, .3, .7, .02, '#2a1410', 0, .35, .78); cyl(g, .03, .03, .3, '#4a3626', 0, 1.4, 0); box(g, .5, .25, .02, '#c9a246', 0, 1.5, 0, { r:.5 }); },
  chest(g, p){ box(g, .7, .4, .45, WOOD, 0, .2, 0); for (const x of [-.25, .25]) box(g, .05, .42, .47, IRON, x, .21, 0, METAL);
    if (p?.open){ hollow(g, .6, .36, .405); for (const [x, z] of [[-.1, .05], [.08, -.06], [.15, .08]]) cyl(g, .04, .04, .015, '#d8b04a', x, .415, z, { m:.8, r:.3 }); }
    const lid = opener(g, p, 'rotation.x', 0, -1.95, 0, .4, -.225), c = cyl(lid, .225, .225, .7, LIGHT, 0, 0, .225, {}, 10); c.rotation.z = Math.PI / 2; c.scale.set(1, 1, .6);
    if (p?.lock) box(lid, .1, .12, .03, '#a8873a', 0, -.02, .46, METAL); },
  altar(g){ box(g, .8, .8, 1.7, '#8e8a82', 0, .4, 0); box(g, .9, .08, 1.8, '#a6a29a', 0, .82, 0); flame(g, 0, .95, -.5); flame(g, 0, .95, .5); },
  coffin(g, p){ box(g, .6, .4, 1.7, '#2a1c14', 0, .2, 0); if (p?.open){ hollow(g, .5, 1.6, .405); box(g, .44, .02, 1.5, '#6a2228', 0, .41, 0); }
    const lid = opener(g, p, 'position.x', 0, .55, 0, .43, 0); box(lid, .64, .06, 1.74, '#3a281c', 0, 0, 0); box(lid, .06, .02, .5, '#a8873a', 0, .04, -.2, { m:.6 });
    if (p?.open){ lid.position.y = .25; lid.rotation.z = -.6; } },
  pillar(g){ cyl(g, .3, .32, 1.5, STONE, 0, .75, 0, {}, 12); box(g, .7, .12, .7, '#8a847c', 0, 1.5, 0); box(g, .7, .12, .7, '#8a847c', 0, .06, 0); },
  bones(g){ ball(g, .1, '#e8e0cc', 0, .08, 0); for (const a of [.3, 1.4, 2.5, 3.6]){ const b = cyl(g, .025, .025, .35, '#e0d6c0', Math.cos(a) * .2, .03, Math.sin(a) * .2); b.rotation.set(Math.PI / 2, 0, a); } },
  brazier(g){ for (const a of [0, 2.1, 4.2]) box(g, .04, .6, .04, IRON, Math.cos(a) * .15, .3, Math.sin(a) * .15, METAL); cyl(g, .25, .15, .15, IRON, 0, .65, 0, METAL); flame(g, 0, .8, 0, 2); flame(g, .08, .76, .05, 1.3); },
  // manor & castle (the back of a wall piece is its -x side: the dresser turns it to face the room)
  bookshelf(g){ box(g, .32, 1.7, 1.8, DARK, 0, .85, 0); for (const y of [.3, .7, 1.1, 1.5]){ box(g, .34, .04, 1.76, LIGHT, .01, y - .06, 0);
    for (let k = 0; k < 9; k++){ const hgt = .18 + ((k * 7 + y * 10) % 5) * .025; box(g, .2, hgt, .14, ['#5a2222', '#2a3a5a', '#3a4a2a', '#6a5a3a', '#4a2a4a'][(k + Math.round(y * 10)) % 5], .04, y - .04 + hgt / 2, -.72 + k * .18); } } },
  wardrobe(g, p){ box(g, .5, 1.8, .9, DARK, -.15, .9, 0); box(g, .56, .08, .96, LIGHT, -.15, 1.82, 0);
    if (p?.open){ box(g, .02, 1.6, .8, '#0c0807', .105, .9, 0, { r:1 }); for (const z of [-.25, 0, .25]) box(g, .3, .7, .14, ['#4a2a3a', '#2a3a4a', '#5a4a2a'][Math.abs(z * 4)], -.05, 1.2, z); }
    for (const s of [-1, 1]){ const dr = opener(g, p, 'rotation.y', 0, s * 1.9, .1, .9, s * .44); box(dr, .03, 1.6, .43, '#46301e', .01, 0, -s * .215); ball(dr, .025, '#a8873a', .04, .05, -s * .4, METAL); } },
  desk(g, p){ box(g, .55, .05, .9, LIGHT, -.1, .7, 0); legs(g, .55, .9, .68); const dw = opener(g, p, 'position.x', -.1, .18, 0, .5, -.25); box(dw, .45, .25, .35, DARK, 0, 0, 0); if (p?.open) hollow(dw, .4, .3, .126); box(g, .3, .01, .22, '#e8dcc0', .0, .73, .1); cyl(g, .03, .03, .1, '#efe6cf', -.2, .78, .3); flame(g, -.2, .87, .3); box(g, .4, .05, .4, WOOD, .35, .3, 0); },
  cradle(g){ const b = box(g, .45, .3, .75, LIGHT, 0, .35, 0); for (const z of [-.38, .38]){ const r = mesh(g, geo('rock', () => new THREE.TorusGeometry(.3, .03, 6, 12, Math.PI)), DARK, 0, .2, z); r.rotation.z = Math.PI; r.position.y = .32; } box(g, .38, .06, .62, '#e2dccd', 0, .5, 0); void b; },
  dollhouse(g){ box(g, .6, .55, .6, '#6a5a4a', 0, .55, 0); box(g, .5, .02, .02, '#2a1a10', .31, .55, 0); for (const [y, z] of [[.45, -.15], [.45, .15], [.68, -.15], [.68, .15]]) box(g, .02, .1, .08, '#ffcf7a', .31, y, z, GLOW);
    const roof = cone(g, .5, .35, '#3a2a2a', 0, 1.0, 0, {}, 4); roof.rotation.y = Math.PI / 4; box(g, .62, .3, .62, DARK, 0, .14, 0); },
  throne(g){ box(g, .7, .5, .7, '#5a1c22', 0, .25, 0); box(g, .12, 1.5, .8, '#3a2a2a', -.32, .75, 0); for (const z of [-.36, .36]) box(g, .7, .3, .08, '#3a2a2a', 0, .55, z); cone(g, .08, .3, '#a8873a', -.32, 1.6, 0, METAL); box(g, .5, .08, .55, '#7a2a2e', .02, .52, 0); },
  banner(g){ cyl(g, .03, .03, 2.0, IRON, -.1, 1.0, 0, METAL); box(g, .03, .02, .7, IRON, -.1, 1.95, 0, METAL); box(g, .02, 1.1, .6, '#6a1a22', -.08, 1.38, 0, { ds:true }); box(g, .022, .3, .3, '#c9a246', -.07, 1.5, 0); },
  armor(g){ box(g, .4, .08, .4, '#4a3a30', 0, .04, 0); for (const z of [-.08, .08]) cyl(g, .05, .06, .55, '#8a8f99', 0, .35, z, METAL); box(g, .22, .5, .38, '#9aa0aa', 0, .85, 0, METAL); ball(g, .14, '#9aa0aa', 0, 1.22, 0, METAL); box(g, .05, .03, .16, '#111', .12, 1.22, 0); for (const z of [-.25, .25]) cyl(g, .045, .045, .45, '#8a8f99', 0, .85, z, METAL); },
  pew(g){ box(g, .45, .06, 1.8, WOOD, 0, .42, 0); box(g, .06, .5, 1.8, WOOD, -.2, .68, 0); for (const z of [-.85, 0, .85]) box(g, .4, .42, .06, DARK, 0, .21, z); },
  organ(g){ box(g, .6, .9, 1.8, DARK, -.3, .45, 0); for (let k = 0; k < 9; k++){ const hgt = 1.2 + Math.sin(k / 8 * Math.PI) * .9; cyl(g, .07, .07, hgt, '#b8a46a', -.42, .9 + hgt / 2, -.8 + k * .2, METAL, 8); }
    box(g, .3, .06, 1.4, '#e8e0cc', 0, .82, 0); box(g, .4, .45, .9, WOOD, .5, .22, 0); },
  // dungeon
  statue(g){ box(g, .6, .4, .6, '#7a766e', 0, .2, 0); cyl(g, .16, .22, .9, '#8e8a82', 0, .85, 0, {}, 8); ball(g, .14, '#8e8a82', 0, 1.42, 0); for (const z of [-.2, .2]){ const arm = cyl(g, .05, .05, .55, '#8e8a82', .05, 1.0, z, {}, 6); arm.rotation.x = z > 0 ? -.3 : .3; } box(g, .02, .5, .3, '#8e8a82', .15, .6, 0); },
  sarcophagus(g, p){ box(g, .75, .55, 1.8, '#7c786e', 0, .28, 0); if (p?.open) hollow(g, .6, 1.6, .56);
    const lid = opener(g, p, 'position.x', 0, .45, 0, .6, 0); box(lid, .8, .12, 1.85, '#8e8a82', 0, 0, 0); box(lid, .4, .08, 1.3, '#9a968c', 0, .1, 0); ball(lid, .12, '#9a968c', 0, .16, -.65);
    if (p?.open){ lid.rotation.y = .25; lid.rotation.z = -.12; } },
  cobweb(g){ const w = mat('#d8d4cc', { op:.35, ds:true, r:1 }); for (const [a, y] of [[0, 1.1], [1.2, .8], [2.4, 1.3]]){ const m = new THREE.Mesh(geo('web', () => new THREE.CircleGeometry(.5, 6, 0, Math.PI / 2)), w); m.position.set(-.45, y, -.45); m.rotation.set(0, a * .3 + Math.PI / 4, 0); g.add(m); } },
  cage(g){ box(g, .7, .06, .7, IRON, 0, .03, 0, METAL); box(g, .7, .06, .7, IRON, 0, 1.4, 0, METAL); for (let k = 0; k < 12; k++){ const a = k / 12 * Math.PI * 2; cyl(g, .015, .015, 1.35, IRON, Math.cos(a) * .32, .72, Math.sin(a) * .32, METAL, 5); } cyl(g, .02, .02, .6, IRON, 0, 1.75, 0, METAL); ball(g, .08, '#e8e0cc', .1, .12, .05); },
  rack(g){ box(g, .8, .5, 1.8, DARK, 0, .25, 0); for (const z of [-.85, .85]){ const r = cyl(g, .07, .07, .9, LIGHT, 0, .6, z); r.rotation.z = Math.PI / 2; } for (const x of [-.25, .25]) box(g, .02, .02, 1.6, '#8a7a5e', x, .52, 0); },
  // mine & cave
  minecart(g){ box(g, .6, .4, .8, '#5a4a3a', 0, .4, 0, METAL); box(g, .62, .05, .82, IRON, 0, .62, 0, METAL); for (const [x, z] of [[-.3, -.25], [-.3, .25], [.3, -.25], [.3, .25]]) wheel(g, .12, x, .12, z, false); for (const [x, z] of [[-.1, .1], [.12, -.1], [0, .2]]) ball(g, .1, '#9aa0aa', x, .62, z, { r:.3, m:.8 }); },
  rails(g){ for (const x of [-.25, .25]) box(g, .05, .05, 1, IRON, x, .03, 0, METAL); for (const z of [-.35, 0, .35]) box(g, .7, .04, .12, '#4a3626', 0, .015, z); },
  ore(g){ for (const [x, z, s, a] of [[0, 0, 1, 0], [.18, .12, .7, .6], [-.15, .16, .6, -.5], [.05, -.2, .55, .3]]){ const c = cone(g, .1 * s, .5 * s, '#d8dde6', x, .25 * s, z, { r:.2, m:.9, e:'#4a5a6a', ei:.4 }, 5); c.rotation.z = a * .4; } box(g, .5, .12, .5, '#5a524a', 0, .05, 0); },
  beam(g){ for (const z of [-.42, .42]) box(g, .14, 1.7, .14, '#5a4028', 0, .85, z); box(g, .16, .16, 1.0, '#4a3626', 0, 1.72, 0); },
  fungus(g){ for (const [x, z, s] of [[0, 0, 1], [.2, .15, .6], [-.18, .1, .7], [.1, -.2, .5]]){ cyl(g, .03 * s, .04 * s, .25 * s, '#d8d0c0', x, .12 * s, z); const cap = ball(g, .12 * s, '#c8c0a8', x, .26 * s, z, { e:'#6a8a5a', ei:.25 }); cap.scale.y = .45; } },
  puddle(g){ const m = mesh(g, geo('pud', () => new THREE.CircleGeometry(.42, 14)), '#0d1418', 0, .012, 0, { r:.05, m:.3 }); m.rotation.x = -Math.PI / 2; m.scale.set(1, .75, 1); },
};

// What a smashed piece leaves: planks, stone chunks, twisted iron, rags or shards, in its own colours.
const DEBRIS_LOOK = { wood:[WOOD, LIGHT], stone:['#7c786e', '#9a968c'], iron:[IRON, '#5a5a62'], glass:['#c8d8d0', '#3a5a4a'], cloth:['#8a7a5a', STRAW], bone:['#e0d6c0', '#c8bea8'] };
function debris(g, p, s){
  const m = OBJECTS[p.k]?.m || 'wood', [c1, c2] = DEBRIS_LOOK[m], rnd = mulberry32(p.id * 7919 + 13), n = 5 + s.w * s.h * 3;
  for (let k = 0; k < n; k++){
    const x = (rnd() - .5) * (s.w - .15), z = (rnd() - .5) * (s.h - .15), c = rnd() < .5 ? c1 : c2, r = rnd() * Math.PI;
    const b = m === 'wood' ? box(g, .5 + rnd() * .3, .04, .1, c, x, .03 + rnd() * .05, z) : m === 'iron' ? box(g, .5, .03, .03, c, x, .03, z, METAL)
      : m === 'cloth' ? ball(g, .14, c, x, .04, z) : m === 'glass' ? box(g, .08, .01, .05, c, x, .01, z, { r:.1, m:.3 }) : box(g, .14 + rnd() * .12, .1, .16, c, x, .05, z);
    b.rotation.set(rnd() * .4, r, rnd() * .3); if (m === 'cloth') b.scale.y = .35;
  }
  if (m === 'glass'){ const st = mesh(g, geo('stain', () => new THREE.CircleGeometry(.4, 14)), '#2a1410', 0, .008, 0, { r:.1, op:.8 }); st.rotation.x = -Math.PI / 2; }
}
/* A prop as it stands now: whole (lids open or shut), smashed to debris, fallen on its side across the squares
   it landed on, or (a secret shelf) swung out from the wall on its hinge. The outer group is placed in world
   space; animateProp finds the moving part through userData (pivot, hinge, openers). */
export function buildProp(p){
  const outer = new THREE.Group(); outer.userData.propId = p.id;
  if (p.broken){ const s = propSize(p); debris(outer, p, s); outer.position.set(wx(p.x) + (s.w - 1) / 2, 0, wz(p.y) + (s.h - 1) / 2); outer.userData.debris = true; return outer; }
  const g = new THREE.Group(); (BUILD[p.k] || BUILD.crate)(g, p);
  g.rotation.y = -(p.rot || 0) * Math.PI / 2;
  outer.userData.openers = g.userData.openers;
  const fl = p.fallen, s = fl ? { w:fl.ow, h:fl.oh } : propSize(p), x0 = fl ? fl.ox : p.x, y0 = fl ? fl.oy : p.y;
  const cx = wx(x0) + (s.w - 1) / 2, cz = wz(y0) + (s.h - 1) / 2;
  if (fl){
    // it tips over the edge of its footprint, and comes to rest lying on the floor
    const px = cx + fl.dx * s.w / 2, pz = cz + fl.dy * s.h / 2, pivot = new THREE.Group();
    pivot.position.set(px, 0, pz); outer.add(pivot); g.position.set(cx - px, 0, cz - pz); pivot.add(g);
    const axis = fl.dx ? 'z' : 'x', end = fl.dx ? -fl.dx * Math.PI / 2 : fl.dy * Math.PI / 2;
    pivot.rotation[axis] = end; outer.updateMatrixWorld(true);
    const lift = -new THREE.Box3().setFromObject(pivot).min.y; pivot.position.y = lift;
    outer.userData.pivot = { o:pivot, axis, end, lift };
    // a toppled shelf spills what was on it
    if (p.k === 'shelf' || p.k === 'bookshelf'){
      const rnd = mulberry32(p.id * 31 + 7), fs = propSize(p);
      for (let k = 0; k < 9; k++){
        const x = wx(p.x) - .5 + rnd() * fs.w, z = wz(p.y) - .5 + rnd() * fs.h, c = ['#5a2222', '#2a3a5a', '#3a4a2a', '#6a5a3a', '#2f5a2a'][k % 5];
        const b = p.k === 'shelf' ? cyl(outer, .04, .04, .2, c, x, .04, z, { r:.3 }) : box(outer, .2, .05, .14, c, x, .03, z);
        b.rotation.set(p.k === 'shelf' ? Math.PI / 2 : 0, rnd() * 3, 0);
      }
    }
    return outer;
  }
  if (p.swung){
    // a hinge at one end of its back edge: it stands out from the wall like an open door
    const len = (PROPS[p.k]?.h || 1) * .95, hinge = new THREE.Group(), inner = new THREE.Group();
    hinge.position.set(-.3, 0, len / 2); inner.position.set(.3, 0, -len / 2); hinge.add(inner);
    while (g.children.length) inner.add(g.children[0]);
    g.add(hinge); hinge.rotation.y = -1.35; outer.userData.hinge = { o:hinge, end:-1.35 };
  }
  g.position.set(cx, 0, cz); outer.add(g);
  return outer;
}

/* Buildings: solid houses on outdoor floors (the squares under them stay rock). Lit windows at night. */
const ROOFS = ['#6a3a32', '#585a62', '#7a6440', '#4e5258'], WALLS = ['#b0a088', '#9a8c74', '#c0b094', '#8e8070'];
/* A castle keep (Ravenloft): a tall dark block with battlements, round corner towers with slate cones, a spire,
   and narrow lit windows. Also used for the castle on the skyline (render/skyline.js). */
export function buildKeep(w, h, o = {}){
  const g = new THREE.Group(), H = o.H || 3.6, STONE_K = '#2b2830', SLATE = '#1b1922', LIT = { e:'#ff9a40', ei:1.6, r:1 }, RED = { e:'#ff3030', ei:1.4, r:1 };
  box(g, w - .2, H, h - .2, STONE_K, 0, H / 2, 0, { r:.95 });
  // battlements
  for (let x = -w / 2 + .5; x <= w / 2 - .5; x += 1) for (const z of [-h / 2 + .15, h / 2 - .15]) box(g, .45, .4, .3, STONE_K, x, H + .2, z);
  for (let z = -h / 2 + .5; z <= h / 2 - .5; z += 1) for (const x of [-w / 2 + .15, w / 2 - .15]) box(g, .3, .4, .45, STONE_K, x, H + .2, z);
  // corner towers
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){
    const tx = sx * (w / 2 - .6), tz = sz * (h / 2 - .6), th = H + 1.8 + ((sx + sz + 2) % 3) * .6;
    cyl(g, .95, 1.05, th, STONE_K, tx, th / 2, tz, { r:.95 }, 14); cone(g, 1.25, 2.2, SLATE, tx, th + 1.1, tz, { r:.7 }, 14);
    for (const a of [0, 2.1, 4.2]) box(g, .14, .4, .06, '#ffb060', tx + Math.cos(a) * 1.0, th * .7, tz + Math.sin(a) * 1.0, LIT);
  }
  // the great tower and its spire, off-centre at the back
  const gx = w * .12, gz = -h * .18, gh = H + 5.5;
  cyl(g, 1.5, 1.7, gh, STONE_K, gx, gh / 2, gz, { r:.95 }, 16); cone(g, 1.9, 4.2, SLATE, gx, gh + 2.1, gz, { r:.7 }, 16);
  box(g, .3, .6, .08, '#ff5a3a', gx, gh * .82, gz + 1.55, RED);                  // the one window that is always lit
  // windows along the walls
  for (let x = -w / 2 + 1.5; x < w / 2 - 1; x += 2.2) for (const z of [-1, 1]) if ((Math.round(x * 7) + z) % 3) box(g, .2, .55, .06, '#ffb060', x, H * .62, z * (h / 2 - .08), LIT);
  // the great doors
  if (o.door !== false){ box(g, 1.4, 1.6, .1, '#140c0a', 0, .8, h / 2 - .02); cone(g, .72, .5, '#140c0a', 0, 1.82, h / 2 - .02, {}, 3).rotation.z = 0; }
  return g;
}
export function buildBuilding(b, k = 0){
  if (b.keep){ const g = buildKeep(b.w, b.h); g.position.set(wx(b.x) + (b.w - 1) / 2, 0, wz(b.y) + (b.h - 1) / 2); return g; }
  if (b.turret){   // a round castle tower: dark stone, a slate cone, one lit slit
    const g = new THREE.Group(), r = Math.min(b.w, b.h) / 2 - .05, H = b.H || 4.6;
    cyl(g, r, r + .08, H, '#2b2830', 0, H / 2, 0, { r:.95 }, 16); cone(g, r + .3, r * 2, '#1b1922', 0, H + r, 0, { r:.7 }, 16);
    for (let k = 0; k < 8; k++){ const a = k / 8 * Math.PI * 2; box(g, .28, .3, .28, '#2b2830', Math.cos(a) * (r - .1), H + .1, Math.sin(a) * (r - .1)); }
    box(g, .1, .45, .06, '#ffb060', 0, H * .7, r + .01, { e:'#ff9a40', ei:1.5, r:1 });
    g.position.set(wx(b.x) + (b.w - 1) / 2, 0, wz(b.y) + (b.h - 1) / 2); return g;
  }
  const g = new THREE.Group(), H = b.tower ? 4.2 : b.mill ? 3.2 : b.tall ? 2.6 : 1.8, long = b.w >= b.h;
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
  if (!b.noChimney && !b.tower && !b.mill) box(g, .35, rise + .6, .35, '#5f5a55', (long ? b.w * .28 : 0), H + (rise + .6) / 2, (long ? 0 : b.h * .28));
  // door and windows on the street side
  const side = b.door || 's', out = { n:[0, -1], s:[0, 1], e:[1, 0], w:[-1, 0] }[side], along = out[0] ? b.h : b.w;
  const facePos = (t, y) => out[0] ? [out[0] * (b.w / 2 + .01), y, t] : [t, y, out[1] * (b.h / 2 + .01)];
  const dm = box(g, out[0] ? .04 : .45, .8, out[0] ? .45 : .04, '#2a1c14', ...facePos(0, .4));
  dm.userData.door = 1;
  for (const t of [-along / 3, along / 3]) if (Math.abs(t) > .5){
    const lit = b.dark ? '#141210' : '#ffc46a';
    box(g, out[0] ? .04 : .32, .3, out[0] ? .32 : .04, lit, ...facePos(t, H * .55), b.dark ? {} : { e:'#ffaa50', ei:1.2, r:1 });
  }
  // a windmill's sails, on the street side
  if (b.mill){
    const hub = new THREE.Group(), [fx, , fz] = facePos(0, 0); hub.position.set(fx * 1.06, H * .82, fz * 1.06);
    if (out[0]) hub.rotation.y = Math.PI / 2; g.add(hub); hub.userData.spinZ = .25;
    for (let k = 0; k < 4; k++){ const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2 + .3; hub.add(arm); box(arm, .08, 2.2, .06, DARK, 0, 1.1, 0); box(arm, .45, 1.8, .02, '#c9bca0', .26, 1.25, 0, { r:.95 }); }
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
// A dead tree for the woods (grey trunk, bare branches), and small ground clutter: grass tufts and stones.
function merged(parts){
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'color']){
    const size = parts[0].attributes[k].itemSize, arr = new Float32Array(parts.reduce((s, p) => s + p.attributes[k].array.length, 0)); let o = 0;
    for (const p of parts){ arr.set(p.attributes[k].array, o); o += p.attributes[k].array.length; }
    out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  return out;
}
function painted(gm, c, m){ gm.applyMatrix4(m); gm = gm.index ? gm.toNonIndexed() : gm; const col = new THREE.Color(c), a = new Float32Array(gm.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) col.toArray(a, i); gm.setAttribute('color', new THREE.BufferAttribute(a, 3)); return gm; }
let deadGeo = null, tuftGeo = null, pebbleGeo = null;
export function deadTreeGeometry(){
  if (deadGeo) return deadGeo;
  const m = (x, y, z, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(1, 1, 1));
  deadGeo = merged([
    painted(new THREE.CylinderGeometry(.06, .13, 1.9, 6), '#5a5248', m(0, .95, 0)),
    painted(new THREE.CylinderGeometry(.025, .05, .8, 5), '#5a5248', m(.22, 1.35, 0, 0, -.9)),
    painted(new THREE.CylinderGeometry(.02, .045, .7, 5), '#5a5248', m(-.2, 1.55, .05, 0, .8)),
    painted(new THREE.CylinderGeometry(.02, .04, .6, 5), '#5a5248', m(0, 1.2, .2, .9, 0)),
    painted(new THREE.CylinderGeometry(.015, .03, .5, 4), '#5a5248', m(.05, 1.75, -.15, -.7, .2)),
  ]);
  return deadGeo;
}
export function tuftGeometry(){
  if (tuftGeo) return tuftGeo;
  const m = (x, z, r) => new THREE.Matrix4().compose(new THREE.Vector3(x, .09, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r, 0, -r)), new THREE.Vector3(1, 1, 1));
  tuftGeo = merged([painted(new THREE.ConeGeometry(.035, .2, 3), '#3e5434', m(0, 0, .1)), painted(new THREE.ConeGeometry(.03, .16, 3), '#4a5e3a', m(.05, .03, -.3)), painted(new THREE.ConeGeometry(.03, .18, 3), '#36482e', m(-.04, -.03, .35))]);
  return tuftGeo;
}
export function pebbleGeometry(){ if (!pebbleGeo) pebbleGeo = painted(new THREE.DodecahedronGeometry(.07, 0), '#6a665e', new THREE.Matrix4().makeScale(1, .55, 1.2)); return pebbleGeo; }
export const treeMaterial = (() => { const m = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.9 }); m.userData.shared = true; return m; })();
