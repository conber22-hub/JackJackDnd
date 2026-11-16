/* 🐈 THE VALLEY'S ANIMALS — the dogs, cats, ravens and rats that make a village feel lived in and a road feel
   watched, and the one crow that takes an interest in the party. Small, low-poly, built in code from three.js
   shapes with a few shared materials (no models or images from elsewhere), each with its own idle and moving
   animation. They are scenery: they never change a rule, a square or what anyone can see, and they don't block
   anyone. setCritters puts them on a floor from a kind and a seed, so the same map has the same animals each
   visit; updateCritters runs every frame and makes them move and react. The hook (Claude's) calls setCritters
   when the hero arrives on a floor, updateCritters in the frame loop, and clearCritters when the map changes. */
import * as THREE from 'three';
import { state } from '../engine/state.js';
import { walk } from '../engine/tiles.js';
import { groundY } from '../engine/grid.js';
import { scene, floorY, wx, wz } from './scene.js';
import { PROP_TOP, PROP_HOP, PROP_BLOCK, propSize } from '../data/props.js';

/* ---------- a seeded roll, so the same map has the same animals each visit ---------- */
const rng = seed => { let s = (seed >>> 0) || 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const MAX = 16;   // never more than about sixteen on a map at once

/* ---------- shared looks: a few materials and unit shapes, scaled per part ---------- */
const MAT = {
  black: new THREE.MeshStandardMaterial({ color:'#0c0b0e', roughness:.7, side:THREE.DoubleSide }),
  crow: new THREE.MeshStandardMaterial({ color:'#050405', roughness:.55, side:THREE.DoubleSide }),
  dog: new THREE.MeshStandardMaterial({ color:'#6b4a30', roughness:.85 }),
  dogTan: new THREE.MeshStandardMaterial({ color:'#a08050', roughness:.85 }),
  cat: new THREE.MeshStandardMaterial({ color:'#7a7568', roughness:.9 }),
  catDark: new THREE.MeshStandardMaterial({ color:'#4a4640', roughness:.9 }),
  rat: new THREE.MeshStandardMaterial({ color:'#5a5550', roughness:.9 }),
  bat: new THREE.MeshStandardMaterial({ color:'#2a2233', roughness:.8, side:THREE.DoubleSide }),
  goat: new THREE.MeshStandardMaterial({ color:'#ddd6c4', roughness:.95 }),
  goatBrown: new THREE.MeshStandardMaterial({ color:'#8a6f4d', roughness:.95 }),
  horn: new THREE.MeshStandardMaterial({ color:'#c9b896', roughness:.7 }),
  pink: new THREE.MeshStandardMaterial({ color:'#c98a7a', roughness:.8 }),
};
const SPH = new THREE.SphereGeometry(1, 8, 6);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CONE = new THREE.ConeGeometry(1, 1, 6);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 6);
const WING = (() => { const g = new THREE.BufferGeometry();   // a flat wing, like the omens' ravens
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.06, 0, 0, .1, .34, .02, .02], 3)); g.computeVertexNormals(); return g; })();
const part = (geo, mat, sx, sy, sz, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); return m; };

/* ---------- the builds: each returns a group whose named parts the animation moves ---------- */
function buildDog(mat){
  const g = new THREE.Group(), body = part(SPH, mat, .2, .07, .07, 0, .13, 0);
  const head = new THREE.Group(); head.position.set(.22, .17, 0);
  head.add(part(BOX, mat, .09, .08, .08), part(BOX, mat, .07, .05, .05, .07, -.01, 0), part(CONE, mat, .02, .04, .02, -.01, .06, .03), part(CONE, mat, .02, .04, .02, -.01, .06, -.03));
  const tail = new THREE.Group(); tail.position.set(-.2, .16, 0); tail.add(part(BOX, mat, .13, .025, .025, -.06, .03, 0));
  const legs = [];
  for (const [lx, lz] of [[.13, .04], [.13, -.04], [-.13, .04], [-.13, -.04]]){ const l = part(BOX, mat, .03, .12, .03, lx, .06, lz); legs.push(l); g.add(l); }
  g.add(body, head, tail); g.userData = { body, head, tail, legs };
  return g;
}
function buildCat(mat){
  const g = new THREE.Group(), body = part(SPH, mat, .13, .06, .06, 0, .07, 0);
  const head = new THREE.Group(); head.position.set(.13, .11, 0);
  head.add(part(SPH, mat, .05, .05, .05), part(CONE, mat, .02, .035, .02, .01, .06, .03), part(CONE, mat, .02, .035, .02, .01, .06, -.03));
  const tail = new THREE.Group(); tail.position.set(-.12, .09, 0); tail.add(part(CYL, mat, .012, .14, .012, 0, .06, 0));
  tail.children[0].rotation.z = .5;   // the tail curls up behind
  g.add(body, head, tail); g.userData = { body, head, tail };
  return g;
}
function buildBird(mat, big){
  const g = new THREE.Group(), s = big ? 1.5 : 1;
  const body = part(SPH, mat, .1 * s, .06 * s, .06 * s, 0, .1 * s, 0);
  const head = new THREE.Group(); head.position.set(.1 * s, .15 * s, 0);
  head.add(part(SPH, mat, .045 * s, .045 * s, .045 * s), part(CONE, mat, .05 * s, .02 * s, .02 * s, .06 * s, 0, 0));
  head.children[1].rotation.z = -Math.PI / 2;   // the beak points forward
  const wl = new THREE.Mesh(WING, mat); wl.scale.setScalar(.55 * s); wl.position.set(0, .12 * s, .05 * s);
  const wr = new THREE.Mesh(WING, mat); wr.scale.set(-.55 * s, .55 * s, .55 * s); wr.position.set(0, .12 * s, -.05 * s);
  const tail = part(BOX, mat, .1 * s, .012 * s, .05 * s, -.12 * s, .09 * s, 0);
  g.add(body, head, wl, wr, tail); g.userData = { body, head, wl, wr, tail };
  return g;
}
function buildRat(){
  const g = new THREE.Group(), body = part(SPH, MAT.rat, .08, .04, .04, 0, .05, 0);
  const head = new THREE.Group(); head.position.set(.08, .06, 0);
  head.add(part(SPH, MAT.rat, .035, .035, .035), part(CONE, MAT.rat, .015, .03, .015, .01, .045, .02), part(CONE, MAT.rat, .015, .03, .015, .01, .045, -.02));
  const tail = part(CYL, MAT.rat, .008, .16, .008, -.14, .04, 0); tail.rotation.z = Math.PI / 2 - .2;
  g.add(body, head, tail); g.userData = { body, head, tail };
  return g;
}
function buildBat(){
  const g = new THREE.Group(), body = part(SPH, MAT.bat, .05, .04, .04, 0, 0, 0);
  const wl = new THREE.Mesh(WING, MAT.bat); wl.scale.setScalar(.5); wl.position.set(0, 0, .04);
  const wr = new THREE.Mesh(WING, MAT.bat); wr.scale.set(-.5, .5, .5); wr.position.set(0, 0, -.04);
  g.add(body, wl, wr); g.userData = { body, wl, wr };
  return g;
}
function buildGoat(mat){
  const g = new THREE.Group(), body = part(SPH, mat, .2, .13, .11, 0, .26, 0);
  const head = new THREE.Group(); head.position.set(.22, .36, 0);
  head.add(part(BOX, mat, .09, .09, .08), part(CONE, MAT.horn, .02, .06, .02, -.02, .07, .03), part(CONE, MAT.horn, .02, .06, .02, -.02, .07, -.03));
  const legs = [];
  for (const [lx, lz] of [[.13, .05], [.13, -.05], [-.13, .05], [-.13, -.05]]){ const l = part(BOX, mat, .04, .2, .04, lx, .1, lz); legs.push(l); g.add(l); }
  g.add(body, head); g.userData = { body, head, legs };
  return g;
}
const BUILD = {
  dog: r => buildDog(r() < .5 ? MAT.dog : MAT.dogTan),
  cat: r => buildCat(r() < .5 ? MAT.cat : MAT.catDark),
  raven: () => buildBird(MAT.black, false),
  crow: () => buildBird(MAT.crow, true),
  rat: () => buildRat(),
  bat: () => buildBat(),
  goat: r => buildGoat(r() < .5 ? MAT.goat : MAT.goatBrown),
};

/* ---------- who lives where (before the weather and the hour thin them) ---------- */
const ROSTER = {
  village: { dog:2, cat:3, raven:3, goat:2, rat:1, crow:1 },
  town: { dog:2, cat:3, raven:2, rat:2, crow:1 },
  road: { dog:1, raven:2, goat:2, crow:1 },
  woods: { raven:2, bat:2, crow:1 },
  camp: { dog:2, cat:1, raven:1, goat:1, crow:1 },
  interior: { rat:2, cat:1 },
  crypt: { rat:3, bat:2 },
};
const DAY = new Set(['dog', 'cat', 'raven', 'goat']);   // none of these out at night
const PERCH = {   // what an animal can sit on, and how high its top is
  fence:.5, drystone:.5, gravestone:.6, signpost:.9, deadtree:1.1, gallows:1.3, stump:.3, barrel:.62, crate:.56, bench:.29, chair:.29,
  sarcophagus:.8, coffin:.46, stonewall:1.4, palisade:1.4, boulder:.42, log:.37, hay:.66, cart:.51,
};
const CROW_PERCH = ['signpost', 'deadtree', 'gallows', 'fence', 'gravestone'];   // where they will see it

/* ---------- the floor's ground: walkable squares, water, blocked squares, perches ---------- */
let group = null, floor = 0, animals = [], crow = null, seedNow = 0;
const blocked = new Set(), perches = [];
function squareBlocked(f, x, y){
  if (x < 0 || y < 0 || x >= f.W || y >= f.H) return true;
  const i = y * f.W + x;
  if (!walk(f.grid[i]) || f.water?.includes(i) || blocked.has(i)) return true;
  return false;
}
function groundAt(f, x, y){ return groundY(f, Math.max(0, Math.min(f.W - 1, Math.round(x))), Math.max(0, Math.min(f.H - 1, Math.round(y)))); }

export function setCritters(L, { kind = 'village', seed = null } = {}){
  clearCritters();
  const f = state?.floors?.[L]; if (!f) return;
  floor = L; seedNow = seed ?? ((state.meta?.seed || 'barovia').toString().split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + L * 97);
  const r = rng(seedNow);
  // blocked squares: the blocking props (and the ones animals perch on — they walk round a barrel, not through it)
  blocked.clear(); perches.length = 0;
  for (const p of f.props || []){
    const { w, h } = propSize(p);
    if (PROP_BLOCK.has(p.k) || PROP_TOP[p.k] || PERCH[p.k]) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) blocked.add((p.y + dy) * f.W + (p.x + dx));
    if (PERCH[p.k]) perches.push({ x:p.x + (w - 1) / 2, y:p.y + (h - 1) / 2, h:PERCH[p.k], kind:p.k });
  }
  const tokens = new Set((state.tokens || []).filter(t => t.floor === L).map(t => t.y * f.W + t.x));
  const open = [];   // walkable squares no one stands on
  for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++){ const i = y * f.W + x; if (walk(f.grid[i]) && !f.water?.includes(i) && !blocked.has(i) && !tokens.has(i)) open.push({ x, y }); }
  if (!open.length && !perches.length) return;
  group = new THREE.Group(); group.name = 'critters'; scene.add(group);
  const roster = ROSTER[kind] || ROSTER.village;
  const spots = [...open];   // shuffled, so the same seed deals the same squares
  for (let i = spots.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  let si = 0;
  const place = (kindName, perchFirst) => {
    if (animals.length >= MAX) return null;
    let at = null, perchH = 0;
    if (perchFirst && perches.length){ const p = pick(r, perches); at = { x:p.x, y:p.y }; perchH = p.h; }
    else if (si < spots.length){ at = spots[si++]; }
    else if (perches.length){ const p = pick(r, perches); at = { x:p.x, y:p.y }; perchH = p.h; }
    if (!at) return null;
    const g = BUILD[kindName](r); group.add(g);
    const a = { kind:kindName, g, x:at.x, y:at.y, floor:L, tx:at.x, ty:at.y, perch:perchH, state:perchH ? 'perch' : 'idle', idx:animals.length,
      speed:kindName === 'dog' ? 1.1 : kindName === 'cat' ? .8 : kindName === 'raven' ? .9 : kindName === 'rat' ? 1.6 : kindName === 'goat' ? .35 : kindName === 'crow' ? 2.5 : 0,
      t:0, wait:1 + r() * 4, ph:r() * 6.28, dir:r() * 6.28, gone:0, follow:0, home:{ x:at.x, y:at.y } };
    g.rotation.y = a.dir; animals.push(a); return a;
  };
  for (const [k, n] of Object.entries(roster)) for (let i = 0; i < n; i++) place(k, k === 'cat' || k === 'raven' || k === 'crow');
  // the crow: one, larger and blacker, on a perch they will see (a fence, a signpost, a dead tree, a gallows)
  const c = animals.find(a => a.kind === 'crow');
  if (c){ crow = c; const good = perches.filter(p => CROW_PERCH.includes(p.kind));
    if (good.length){ const p = pick(r, good); c.x = c.tx = p.x; c.y = c.ty = p.y; c.perch = p.h; c.state = 'perch'; } }
}

/* ---------- the frame: move them, animate them, make them react ---------- */
const NIGHT = h => h == null ? false : h >= 20 || h < 6;
const DUSK = h => h != null && (h >= 17 || h < 7);
function nearestParty(a, party){ let best = null, bd = 1e9; for (const p of party || []){ if (p.floor !== a.floor) continue; const d = Math.max(Math.abs(p.x - a.x), Math.abs(p.y - a.y)); if (d < bd){ bd = d; best = p; } } return { p:best, d:bd }; }
function farSquare(f, r, from, away, minD, maxD){
  for (let k = 0; k < 20; k++){ const a = r() * 6.28, d = minD + r() * (maxD - minD), x = Math.round(from.x + Math.cos(a) * d), y = Math.round(from.y + Math.sin(a) * d);
    if (squareBlocked(f, x, y)) continue;
    if (away && Math.max(Math.abs(x - away.x), Math.abs(y - away.y)) < minD) continue;
    return { x, y }; }
  return null;
}
function stepTo(a, dt){
  const f = state.floors[a.floor]; if (!f) return true;
  const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
  if (d < .05) return true;
  const s = Math.min(d, a.speed * dt), nx = a.x + dx / d * s, ny = a.y + dy / d * s;
  // stay on walkable ground: try the step, then each axis alone, then stop
  if (!squareBlocked(f, Math.round(nx), Math.round(ny))){ a.x = nx; a.y = ny; }
  else if (!squareBlocked(f, Math.round(nx), Math.round(a.y))){ a.x = nx; }
  else if (!squareBlocked(f, Math.round(a.x), Math.round(ny))){ a.y = ny; }
  else return true;
  a.dir = Math.atan2(-(dy), dx);   // facing the way it goes (the builds face +x)
  return false;
}
function put(a, t){
  const f = state.floors[a.floor]; if (!f) return;
  const gy = groundAt(f, a.x, a.y) + (a.perch || 0);
  a.g.position.set(wx(a.x), floorY(a.floor) + gy + (a.lift || 0), wz(a.y));
  a.g.rotation.y = a.dir;
  a.g.visible = a.hidden !== true && a.state !== 'gone';   // 'gone' ones have darted under something or flown off
}
export function updateCritters(dt, { party = [], hour = null, rain = false } = {}){
  if (!group || !state) return;
  dt = Math.min(Math.max(dt || 0, 0), .5);   // a stalled frame must not fling them across the map
  const f = state.floors[floor]; if (!f) return;
  const night = NIGHT(hour), dusk = DUSK(hour);
  const t = performance.now() / 1000;
  for (const a of animals){
    const u = a.g.userData, { p:near, d:nd } = nearestParty(a, party);
    // the hour and the weather thin them: no day ones out at night, more bats at dusk, fewer in rain and snow.
    // The crow keeps its watch whatever the hour.
    a.hidden = a.kind !== 'crow' && ((night && DAY.has(a.kind)) || (!dusk && !night && a.kind === 'bat') || (rain && DAY.has(a.kind) && (a.idx || 0) % 2 === 0));
    if (a.hidden){ a.g.visible = false; continue; }
    a.t += dt;
    // --- the crow: perched, tilting its head; never within two squares; a new perch ahead now and then
    if (a.kind === 'crow'){
      const relocate = () => {   // a perch ahead, 4–9 squares from the party (a fence, a signpost, a dead tree)
        const inRange = perches.filter(p => { const d = near ? Math.max(Math.abs(p.x - near.x), Math.abs(p.y - near.y)) : 9; return d >= 4 && d <= 9; });
        if (inRange.length){ const p = inRange[Math.floor(Math.random() * inRange.length)]; a.tx = p.x; a.ty = p.y; a.perch = p.h; a.state = 'walk'; return true; }
        const to = farSquare(f, rng((seedNow + 29) | 0), a, near, 4, 9);
        if (to){ const perch = perches.find(p => Math.abs(p.x - to.x) < 1 && Math.abs(p.y - to.y) < 1); a.perch = perch ? perch.h : 0; a.tx = to.x; a.ty = to.y; a.state = 'walk'; return true; }
        return false;
      };
      if (nd <= 2 && near) relocate();
      else if (a.state === 'perch' && a.t > 30 + a.ph * 4){ a.t = 0; relocate(); }
      if (a.state === 'walk'){ a.lift = Math.min(1.5, (a.lift || 0) + dt * 2);   // up and away to the new perch
        const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);   // it flies: the ground's blocks don't bind it
        if (d < .1){ a.state = 'perch'; a.t = 0; a.lift = 0; }
        else { const s = Math.min(d, a.speed * dt); a.x += dx / d * s; a.y += dy / d * s; a.dir = Math.atan2(-dy, dx); } }
      u.head.rotation.z = Math.sin(t * .7 + a.ph) * .35;   // tilting its head
      u.head.rotation.y = Math.sin(t * .23 + a.ph) * .6;
      put(a, t); continue;
    }
    // --- the dog: trots, sniffs, sits; follows the party a few steps with its tail low, then loses interest; barks at night
    if (a.kind === 'dog'){
      if (night && near && nd <= 5 && a.state !== 'bark'){ a.state = 'bark'; a.t = 0; }
      else if (a.state === 'bark'){ u.head.rotation.x = -Math.sin(Math.min(1, a.t * 3)) * .5; if (a.t > 1.2){ a.state = 'idle'; a.t = 0; u.head.rotation.x = 0; } }
      else if (near && nd <= 4 && a.follow < 3 && a.state !== 'follow'){ a.state = 'follow'; a.follow++; a.tx = near.x; a.ty = near.y; }
      else if (a.state === 'follow'){ u.tail.rotation.y = 0; u.tail.rotation.x = -.4;   // the tail low
        if (nd > 4 || a.t > 6){ a.state = 'idle'; a.t = 0; a.wait = 2 + Math.random() * 4; u.tail.rotation.x = 0; }
        else { a.tx = near.x; a.ty = near.y; stepTo(a, dt); u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 10 + i * Math.PI) * .5; }); } }
      else if (a.state === 'idle'){ u.legs.forEach(l => { l.rotation.x = 0; }); u.tail.rotation.y = Math.sin(t * 2 + a.ph) * .4;
        if (a.t > a.wait){ a.t = 0; if (Math.random() < .5){ const to = farSquare(f, rng((seedNow + (a.t * 997 | 0)) | 0), a, null, 1, 3); if (to){ a.tx = to.x; a.ty = to.y; a.state = 'walk'; } else a.wait = 2 + Math.random() * 4; } else { a.wait = 2 + Math.random() * 5; a.sniff = a.t; } }
        if (a.sniff != null && a.t - a.sniff < 1.5) u.head.rotation.x = .5; else { u.head.rotation.x = 0; a.sniff = null; } }
      else if (a.state === 'walk'){ if (stepTo(a, dt)){ a.state = 'idle'; a.t = 0; a.wait = 2 + Math.random() * 4; a.follow = 0; } u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 10 + i * Math.PI) * .5; }); }
      put(a, t); continue;
    }
    // --- the cat: washes, watches, flicks its tail; slinks off if the party comes within two squares
    if (a.kind === 'cat'){
      if (near && nd <= 2 && a.state !== 'flee'){ a.state = 'flee'; const to = farSquare(f, rng((seedNow + 41) | 0), a, near, 3, 5); if (to){ a.tx = to.x; a.ty = to.y; } a.perch = 0; }
      else if (a.state === 'flee'){ a.g.userData.body.scale.y = .045;   // low and stretched, slinking
        if (stepTo(a, dt) || nd > 3){ a.state = 'idle'; a.t = 0; a.wait = 3 + Math.random() * 4; a.g.userData.body.scale.y = .06; } }
      else { u.tail.rotation.y = Math.sin(t * 1.4 + a.ph) * .7;   // flicking its tail
        u.head.rotation.y = near ? Math.atan2(-(near.y - a.y), near.x - a.x) - a.dir : Math.sin(t * .4 + a.ph) * .5;   // watching
        if (a.t > a.wait){ a.t = 0; const to = farSquare(f, rng((seedNow + 53) | 0), a, null, 1, 2); if (to){ a.tx = to.x; a.ty = to.y; a.state = 'walk'; a.perch = 0; } else a.wait = 3 + Math.random() * 4; } }
      if (a.state === 'walk' && stepTo(a, dt)){ a.state = 'idle'; a.t = 0; a.wait = 3 + Math.random() * 4; }
      put(a, t); continue;
    }
    // --- the raven: hops, pecks, and bursts up and flies off when anyone comes within three squares; later it comes back
    if (a.kind === 'raven'){
      if (a.state === 'gone'){ if (a.t > a.gone){ const spot = perches.length ? perches[Math.floor(Math.random() * perches.length)] : null;
          if (spot){ a.x = a.tx = spot.x; a.y = a.ty = spot.y; a.perch = spot.h; } else { const to = farSquare(f, rng((seedNow + 67) | 0), a, near, 2, 5); if (to){ a.x = a.tx = to.x; a.y = a.ty = to.y; a.perch = 0; } }
          a.state = 'perch'; a.t = 0; a.lift = 0; } put(a, t); continue; }
      if (near && nd <= 3 && a.state !== 'fly'){ a.state = 'fly'; a.t = 0; a.perch = 0; a.flyTo = farSquare(f, rng((seedNow + 71) | 0), a, near, 5, 9) || { x:a.x + 6, y:a.y }; }
      if (a.state === 'fly'){ a.lift = Math.min(2.5, (a.lift || 0) + dt * 2);   // bursting up
        const dx = a.flyTo.x - a.x, dy = a.flyTo.y - a.y, d = Math.hypot(dx, dy);
        if (d > .1){ a.x += dx / d * 2.2 * dt; a.y += dy / d * 2.2 * dt; a.dir = Math.atan2(-dy, dx); }
        const flap = Math.sin(t * 14 + a.ph) * .8; u.wl.rotation.z = flap; u.wr.rotation.z = -flap;
        if (a.t > 2.5){ a.state = 'gone'; a.t = 0; a.gone = 15 + Math.random() * 25; a.g.visible = false; } }
      else { u.wl.rotation.z = Math.sin(t * 2 + a.ph) * .08; u.wr.rotation.z = -Math.sin(t * 2 + a.ph) * .08;
        if (a.state === 'perch' && a.t > a.wait){ a.t = 0; a.state = 'idle'; a.wait = 2 + Math.random() * 4; }
        else if (a.state === 'idle'){ a.lift = a.hopUntil && t < a.hopUntil ? .12 : 0;
          if (!a.hopUntil && Math.random() < dt * .25) a.hopUntil = t + .22;   // a hop, now and then
          if (a.hopUntil && t >= a.hopUntil) a.hopUntil = 0;
          if (a.t > a.wait){ a.t = 0; if (Math.random() < .4){ const to = farSquare(f, rng((seedNow + 83) | 0), a, null, 1, 2); if (to){ a.tx = to.x; a.ty = to.y; a.state = 'walk'; a.perch = 0; } else a.wait = 2 + Math.random() * 4; } else { a.wait = 2 + Math.random() * 4; a.peck = a.t; } }
          if (a.peck != null && a.t - a.peck < .8) u.head.rotation.x = .6; else { u.head.rotation.x = 0; a.peck = null; } }
        else if (a.state === 'walk' && stepTo(a, dt)){ a.state = 'idle'; a.t = 0; a.wait = 2 + Math.random() * 4; } }
      put(a, t); continue;
    }
    // --- the rat: scurries along walls, darts under things and vanishes
    if (a.kind === 'rat'){
      if (a.state === 'gone'){ if (a.t > a.gone){ const to = farSquare(f, rng((seedNow + 97) | 0), a, null, 2, 6); if (to){ a.x = a.tx = to.x; a.y = a.ty = to.y; a.state = 'idle'; a.t = 0; a.g.visible = true; } } put(a, t); continue; }
      if (a.t > a.wait){ a.t = 0;
        if (Math.random() < .25){ a.state = 'gone'; a.t = 0; a.gone = 8 + Math.random() * 20; a.g.visible = false; }   // darted under something
        else { const to = farSquare(f, rng((seedNow + 101) | 0), a, null, 1, 3); if (to){ a.tx = to.x; a.ty = to.y; a.state = 'walk'; } a.wait = 1 + Math.random() * 3; } }
      if (a.state === 'walk'){ const moving = !stepTo(a, dt); a.g.position.y += moving ? Math.abs(Math.sin(t * 16 + a.ph)) * .02 : 0; if (!moving && Math.hypot(a.tx - a.x, a.ty - a.y) < .05){ a.state = 'idle'; a.t = 0; a.wait = 1 + Math.random() * 3; } }
      put(a, t); continue;
    }
    // --- the bat: a flutter overhead, at dusk and in crypts
    if (a.kind === 'bat'){
      const cx = a.home.x, cy = a.home.y, r = .8 + (a.ph % 1);
      a.x = cx + Math.cos(t * .9 + a.ph) * r; a.y = cy + Math.sin(t * .9 + a.ph) * r;
      a.dir = Math.atan2(-Math.cos(t * .9 + a.ph), -Math.sin(t * .9 + a.ph));
      a.lift = 2.2 + Math.sin(t * 1.7 + a.ph) * .4;
      const flap = Math.sin(t * 16 + a.ph) * .9; u.wl.rotation.z = flap; u.wr.rotation.z = -flap;
      a.g.position.set(wx(a.x), floorY(a.floor) + a.lift, wz(a.y)); a.g.rotation.y = a.dir; a.g.visible = true; continue;
    }
    // --- the goat or sheep: grazes and drifts slowly
    if (a.kind === 'goat'){
      if (a.state === 'idle'){ if (a.t > a.wait){ a.t = 0; if (Math.random() < .5){ const to = farSquare(f, rng((seedNow + 113) | 0), a, null, 1, 2); if (to){ a.tx = to.x; a.ty = to.y; a.state = 'walk'; } } else a.wait = 4 + Math.random() * 5; a.graze = a.t; }
        if (a.graze != null && a.t - a.graze < 2.5) u.head.rotation.x = .7; else { u.head.rotation.x = 0; a.graze = null; } }   // head down, grazing
      else if (a.state === 'walk'){ if (stepTo(a, dt)){ a.state = 'idle'; a.t = 0; a.wait = 4 + Math.random() * 5; } u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 4 + i * Math.PI) * .25; }); }
      put(a, t); continue;
    }
  }
}

export function clearCritters(){
  if (group){ scene.remove(group); group = null; }   // the materials and geometries are shared module-level: never disposed
  animals = []; crow = null; blocked.clear(); perches.length = 0;
}
export const crowAt = () => crow && crow.g.visible !== false ? { x:Math.round(crow.x), y:Math.round(crow.y), floor:crow.floor } : null;
/* A snapshot for the app's tests: kind, square, floor, and whether it's perched. */
export const list = () => animals.filter(a => a.g.visible !== false).map(a => ({ kind:a.kind, x:+a.x.toFixed(2), y:+a.y.toFixed(2), floor:a.floor, perch:!!a.perch, state:a.state }));
