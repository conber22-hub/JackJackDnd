/* FLOORS — stone, walls, stairs, doors, traps, room glyphs, mist, and the Shift animation. */
import * as THREE from 'three';
import { state, ui, viewAsPlayer, T, walk } from '../engine/state.js';
import { wallSet, doorOrientation } from '../engine/generator.js';
import { THEMES } from '../data/themes.js';
import { ROOM_TYPES, TRAP_KINDS } from '../data/rooms.js';
import { mulberry32 } from '../util/core.js';
import { scene, G, mat4, col, wx, wz, floorY, WALL_H, makeLabel, tween, ease, fx } from './scene.js';
import { surfaceTextures } from './textures.js';
import { shadowsOn, gfx } from './gfx.js';
import { kitFor } from './models.js';
import { buildProp, buildBuilding, inBuilding, treeGeometry, treeMaterial, deadTreeGeometry, tuftGeometry, pebbleGeometry } from './props.js';
import { propSize } from '../data/props.js';

// Paint the floor's stone with its theme's textures (cheap: textures are cached per theme).
function dressMaterials(fv, th){
  const tx = surfaceTextures(th.id), fm = fv.mats.floor, wm = fv.mats.wall;
  if (fm.map !== tx.floor){
    fm.map = tx.floor; fm.bumpMap = tx.bumpF; fm.bumpScale = 1.2;
    fm.roughnessMap = tx.wet; fm.roughness = tx.wet ? .35 + (1 - tx.wetAmount) * .5 : .95; fm.metalness = th.id === 'wreck' ? .35 : .02;
    fm.needsUpdate = true;
  }
  if (wm.map !== tx.wall){
    wm.map = tx.wall; wm.bumpMap = tx.bumpW; wm.bumpScale = 1.6;
    wm.roughness = th.id === 'wreck' ? .55 : .88; wm.metalness = th.id === 'wreck' ? .45 : .05;
    wm.needsUpdate = true;
  }
}

export const floorViews = [];   // per floor: { group, tokens, built, mats }
const shared = m => { m.userData.shared = true; return m; };
export function ensureFloorViews(){
  while (floorViews.length > state.floors.length){ const fv = floorViews.pop(); scene.remove(fv.group); }
  state.floors.forEach((f, L) => {
    if (floorViews[L]) return;
    const group = new THREE.Group(); scene.add(group);
    const tokens = new THREE.Group(); group.add(tokens);
    const mats = {
      floor: shared(new THREE.MeshStandardMaterial({ roughness:.95, metalness:.02 })),
      wall:  shared(new THREE.MeshStandardMaterial({ roughness:.88, metalness:.05 })),
      cap:   shared(new THREE.MeshStandardMaterial({ roughness:.8, metalness:.1 })),
      fx:    shared(new THREE.MeshBasicMaterial({ color:'#e9a54a', transparent:true, opacity:.28, depthWrite:false })),
      wood:  shared(new THREE.MeshStandardMaterial({ color:'#5a3d22', roughness:.85 })),
      iron:  shared(new THREE.MeshStandardMaterial({ color:'#3a3a40', roughness:.5, metalness:.7 })),
      silver:shared(new THREE.MeshStandardMaterial({ color:'#c8cbd6', roughness:.3, metalness:.9, emissive:new THREE.Color('#40465a'), emissiveIntensity:.4 })),
      secret:shared(new THREE.MeshBasicMaterial({ color:'#9b77dc', transparent:true, opacity:.35, depthWrite:false })),
    };
    floorViews[L] = { group, tokens, mats, built:new THREE.Group() };
    group.add(floorViews[L].built);
  });
}
export function disposeGroup(g){
  for (const c of [...g.children]){
    g.remove(c);
    c.traverse(o => {
      if (o.isInstancedMesh) o.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms){ if (m.userData?.shared) continue; m.map?.dispose?.(); m.dispose?.(); }
    });
  }
}

// What the current viewer is allowed to see of floor L.
function viewGrid(f, L){
  const pv = viewAsPlayer();
  if (!pv) return f.grid;
  return f.grid.map((v, i) => f.doors.some(d => d.i === i && d.state === 'secret') ? T.ROCK : v);
}

// Rebuilds the stone of one floor. `opt.walls` = Set of wall indices to draw statically (used by the shift animation).
export function buildFloor(L, opt = {}){
  const f = state.floors[L], fv = floorViews[L], th = THEMES[f.theme] || THEMES[0];
  if (!f || !fv) return;
  disposeGroup(fv.built);
  dressMaterials(fv, th);
  const shadows = shadowsOn();
  const pv = viewAsPlayer(), exp = state.explored[L];
  const showTile = i => !pv || exp.has(i);
  const g = opt.grid || viewGrid(f, L);
  // floor tiles
  const tiles = [];
  for (let i = 0; i < g.length; i++) if (walk(g[i]) && g[i] !== T.DOWN && showTile(i)) tiles.push(i);
  const kitFloor = kitFor('floor');
  const fm = new THREE.InstancedMesh(kitFloor ? kitFloor.geometry : G.tile, kitFloor ? kitFloor.material : fv.mats.floor, Math.max(1, tiles.length)); fm.count = tiles.length;
  const rng = mulberry32(L * 999 + 7);
  const base = new THREE.Color(th.floor), hall = new THREE.Color(th.hall);
  const roomOf = new Map(); for (const r of f.rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) roomOf.set(y * f.W + x, r);
  tiles.forEach((i, n) => {
    const x = i % f.W, y = (i / f.W) | 0;
    mat4.makeTranslation(wx(x), -.1, wz(y)); fm.setMatrixAt(n, mat4);
    col.copy(g[i] === T.HALL ? hall : base).multiplyScalar(.82 + rng() * .3);
    const r = roomOf.get(i);
    if (r && !pv && r.type !== 'chamber') col.lerp(new THREE.Color(ROOM_TYPES[r.type]?.color || '#888'), r.id === ui.selRoom ? .45 : .22);
    else if (r && !pv && r.id === ui.selRoom) col.lerp(new THREE.Color('#e9a54a'), .3);
    if (!pv && ui.previewFog && !exp.has(i)) col.multiplyScalar(.3);
    fm.setColorAt(n, col);
  });
  if (fm.instanceColor) fm.instanceColor.needsUpdate = true;
  fm.userData.floorTiles = 1; fm.receiveShadow = shadows;
  fv.built.add(fm);
  // walls (on outdoor floors the edges are forest, and houses stand on their own footprints)
  const all = opt.walls || wallSet(f, g);
  const seen = i => { if (!pv) return true; const x = i % f.W, y = (i / f.W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && exp.has(ny * f.W + nx) && walk(g[ny * f.W + nx])) return true; }
    return false; };
  const kitWall = kitFor('wall'), outdoor = !kitWall && (th.walls === 'trees' || th.walls === 'mixed');
  // which walls are a building's (next to an indoor room square) and which are the woods
  const indoor = i => { const r = roomOf.get(i); return r ? !r.outdoor : false; };
  const isBuildingWall = i => { if (th.walls === 'trees') return false; const x = i % f.W, y = (i / f.W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && walk(g[ny * f.W + nx]) && indoor(ny * f.W + nx)) return true; }
    return false; };
  const wl = [], trees = [], water = new Set(f.water || []), masonry = new Set(f.masonry || []), bare = new Set(f.clear || []);
  const hr = (i, k) => { let h = Math.imul(i ^ Math.imul(k + 1, 0x9e3779b1), 2654435761) ^ Math.imul(L + 1, 40503); h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  for (const i of all){
    if (water.has(i) || bare.has(i) || inBuilding(f, i % f.W, (i / f.W) | 0) || !seen(i)) continue;
    if (outdoor && !isBuildingWall(i) && !masonry.has(i)) trees.push(i); else wl.push(i);
  }
  for (const i of masonry) if (!all.has(i) && (!pv || seen(i))) wl.push(i);   // a village wall runs all the way round, streets or not
  if (outdoor && !opt.walls){
    // a second, thinner row of trees behind the first so the road runs through woods, not past a fence
    const near = new Map();   // rock square -> how far it is from the first row of trees
    for (const i of trees){ const x = i % f.W, y = (i / f.W) | 0;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){ const nx = x + dx, ny = y + dy, j = ny * f.W + nx, dd = Math.max(Math.abs(dx), Math.abs(dy));
        if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && !walk(g[j]) && !all.has(j) && !water.has(j) && !bare.has(j) && !masonry.has(j) && !inBuilding(f, nx, ny) && !(near.get(j) <= dd)) near.set(j, dd); } }
    const seen2 = j => { const x = j % f.W, y = (j / f.W) | 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){ const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && exp.has(ny * f.W + nx)) return true; }
      return false; };
    for (const [j, dd] of near) if (hr(j, 9) < (dd <= 2 ? .5 : .32) && (!pv || seen2(j))) trees.push(j);
  }
  const wm = new THREE.InstancedMesh(kitWall ? kitWall.geometry : G.wall, kitWall ? kitWall.material : fv.mats.wall, Math.max(1, wl.length)); wm.count = wl.length;
  wm.castShadow = wm.receiveShadow = shadows;
  const wc = new THREE.Color(th.wall), trim = new THREE.Color(th.trim);
  wl.forEach((i, n) => {
    const x = i % f.W, y = (i / f.W) | 0;
    mat4.makeTranslation(wx(x), WALL_H / 2, wz(y)); wm.setMatrixAt(n, mat4);
    col.copy(wc).multiplyScalar(.75 + rng() * .45); if (rng() < .06) col.lerp(trim, .35);
    wm.setColorAt(n, col);
  });
  if (wm.instanceColor) wm.instanceColor.needsUpdate = true;
  fv.built.add(wm);
  const cm = new THREE.InstancedMesh(G.cap, fv.mats.cap, Math.max(1, kitWall ? 0 : wl.length)); cm.count = kitWall ? 0 : wl.length;
  const capc = new THREE.Color(th.wall).lerp(trim, .28).multiplyScalar(1.5);
  wl.forEach((i, n) => { mat4.makeTranslation(wx(i % f.W), WALL_H + .03, wz((i / f.W) | 0)); cm.setMatrixAt(n, mat4); cm.setColorAt(n, col.copy(capc).multiplyScalar(.85 + rng() * .25)); });
  if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
  fv.built.add(cm);
  // the Svalich woods are not all alive: some of the trees are dead and grey
  const deadShare = th.id === 'woods' ? .12 : th.walls === 'mixed' ? .06 : 0;
  const dead = deadShare ? trees.filter(i => hr(i, 11) < deadShare) : [];
  if (dead.length){
    const dm = new THREE.InstancedMesh(deadTreeGeometry(), treeMaterial, dead.length), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    dead.forEach((i, n) => { const s = .9 + hr(i, 12) * .6; ps.set(wx(i % f.W) + (hr(i, 2) - .5) * .4, 0, wz((i / f.W) | 0) + (hr(i, 3) - .5) * .4); q.setFromAxisAngle(up, hr(i, 4) * 6.28); sc.set(s, s, s); mat4.compose(ps, q, sc); dm.setMatrixAt(n, mat4); dm.setColorAt(n, col.setRGB(1, 1, 1).multiplyScalar(.75 + hr(i, 6) * .4)); });
    if (dm.instanceColor) dm.instanceColor.needsUpdate = true; dm.castShadow = shadows; fv.built.add(dm);
  }
  if (dead.length){ const ds = new Set(dead); for (let k = trees.length - 1; k >= 0; k--) if (ds.has(trees[k])) trees.splice(k, 1); }
  if (trees.length){
    const tm = new THREE.InstancedMesh(treeGeometry(), treeMaterial, trees.length), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const tint = new THREE.Color(th.trim);
    trees.forEach((i, n) => {
      const x = i % f.W, y = (i / f.W) | 0, s = .85 + hr(i, 1) * .6;
      ps.set(wx(x) + (hr(i, 2) - .5) * .35, 0, wz(y) + (hr(i, 3) - .5) * .35); q.setFromAxisAngle(up, hr(i, 4) * 6.28); sc.set(s, s * (.9 + hr(i, 5) * .4), s);
      mat4.compose(ps, q, sc); tm.setMatrixAt(n, mat4);
      tm.setColorAt(n, col.setRGB(1, 1, 1).lerp(tint, .15).multiplyScalar(.7 + hr(i, 6) * .45));
    });
    if (tm.instanceColor) tm.instanceColor.needsUpdate = true;
    tm.castShadow = tm.receiveShadow = shadows; tm.userData.trees = 1;
    fv.built.add(tm);
  }
  // ground clutter on outdoor floors: grass tufts in the clearings, stones on the roads
  if (outdoor){
    const tufts = [], pebbles = [];
    for (const i of tiles){
      const r = roomOf.get(i); if (r && !r.outdoor) continue;
      const road = g[i] === T.HALL, n = Math.floor(hr(i, 21) * (road ? 1.6 : 3.2));
      for (let k = 0; k < n; k++) (road || hr(i, 30 + k) < .25 ? pebbles : tufts).push([i, k]);
    }
    for (const [list, geo] of [[tufts, tuftGeometry()], [pebbles, pebbleGeometry()]]){
      if (!list.length) continue;
      const cm2 = new THREE.InstancedMesh(geo, treeMaterial, list.length), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      list.forEach(([i, k], n) => { const s = .7 + hr(i, 40 + k) * .8; ps.set(wx(i % f.W) + (hr(i, 50 + k) - .5) * .85, -.02, wz((i / f.W) | 0) + (hr(i, 60 + k) - .5) * .85); q.setFromAxisAngle(up, hr(i, 70 + k) * 6.28); sc.set(s, s, s); mat4.compose(ps, q, sc); cm2.setMatrixAt(n, mat4); cm2.setColorAt(n, col.setRGB(1, 1, 1).multiplyScalar(.7 + hr(i, 80 + k) * .5)); });
      if (cm2.instanceColor) cm2.instanceColor.needsUpdate = true; cm2.receiveShadow = shadows; fv.built.add(cm2);
    }
  }
  // difficult terrain: a dark wet patch with stones and debris on it
  const rt = (f.rough || []).filter(i => !pv || exp.has(i));
  if (rt.length){
    const mud = new THREE.InstancedMesh(G.tile, fv.mats.mud ||= shared(new THREE.MeshStandardMaterial({ color:'#3d3122', roughness:.3, metalness:.08, transparent:true, opacity:.85, depthWrite:false })), rt.length);
    rt.forEach((i, n) => { mat4.compose(new THREE.Vector3(wx(i % f.W), .012, wz((i / f.W) | 0)), new THREE.Quaternion(), new THREE.Vector3(.94, .05, .94)); mud.setMatrixAt(n, mat4); mud.setColorAt(n, col.setRGB(1, 1, 1).multiplyScalar(.8 + hr(i, 90) * .4)); });
    if (mud.instanceColor) mud.instanceColor.needsUpdate = true; mud.receiveShadow = shadows; fv.built.add(mud);
    const bits = []; for (const i of rt) for (let k = 0; k < 3; k++) bits.push([i, k]);
    const st = new THREE.InstancedMesh(pebbleGeometry(), treeMaterial, bits.length), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    bits.forEach(([i, k], n) => { const s2 = .9 + hr(i, 91 + k) * 1.1; ps.set(wx(i % f.W) + (hr(i, 94 + k) - .5) * .75, .0, wz((i / f.W) | 0) + (hr(i, 97 + k) - .5) * .75); q.setFromAxisAngle(up, hr(i, 100 + k) * 6.28); sc.set(s2, s2 * .8, s2); mat4.compose(ps, q, sc); st.setMatrixAt(n, mat4); st.setColorAt(n, col.setRGB(.55, .5, .42).multiplyScalar(.7 + hr(i, 103 + k) * .5)); });
    if (st.instanceColor) st.instanceColor.needsUpdate = true; st.receiveShadow = shadows; fv.built.add(st);
  }
  // water: rivers, ponds and lakes (impassable, and no trees grow in it)
  const wt = [...water].filter(i => !pv || seen(i) || exp.has(i));
  if (wt.length){
    const wm2 = new THREE.InstancedMesh(G.tile, fv.mats.water ||= shared(new THREE.MeshStandardMaterial({ color:'#16242c', roughness:.42, metalness:.1, emissive:new THREE.Color('#081014'), transparent:true, opacity:.94 })), wt.length);
    wt.forEach((i, n) => { mat4.makeTranslation(wx(i % f.W), -.16, wz((i / f.W) | 0)); wm2.setMatrixAt(n, mat4); wm2.setColorAt(n, col.setRGB(1, 1, 1).multiplyScalar(.85 + hr(i, 7) * .3)); });
    if (wm2.instanceColor) wm2.instanceColor.needsUpdate = true;
    wm2.receiveShadow = shadows; fv.built.add(wm2);
  }
  // the road's happenings (DM only): a violet rune where each one waits
  if (!pv) for (const e of f.events || []){
    if (e.done) continue;
    const m = new THREE.Mesh(G.rune, new THREE.MeshBasicMaterial({ color:'#c39bff', transparent:true, opacity:.75, depthWrite:false })); m.position.set(wx(e.x), .04, wz(e.y)); m.scale.setScalar(.8); m.userData.spin = -.8; fv.built.add(m);
    if (ui.roomLabels){ const lb = makeLabel('✦ ' + e.label, '#c39bff', 20); lb.position.set(wx(e.x), 1.4, wz(e.y)); lb.scale.multiplyScalar(.8); fv.built.add(lb); }
  }
  // houses
  (f.buildings || []).forEach((b, k) => {
    if (pv){ let any = false; for (let y = b.y - 1; y <= b.y + b.h && !any; y++) for (let x = b.x - 1; x <= b.x + b.w && !any; x++) if (exp.has(y * f.W + x)) any = true; if (!any) return; }
    const m = buildBuilding(b, k); if (shadows) m.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    fv.built.add(m);
    if (!pv && ui.roomLabels && b.name){ const lb = makeLabel(b.name, '#d8cfb8', 20); lb.position.set(wx(b.x + b.w / 2 - .5), 3.4, wz(b.y + b.h / 2 - .5)); lb.scale.multiplyScalar(.85); fv.built.add(lb); }
  });
  // props
  for (const p of f.props || []){
    if (pv){ const s = propSize(p); let any = false; for (let y = p.y; y < p.y + s.h && !any; y++) for (let x = p.x; x < p.x + s.w && !any; x++) if (exp.has(y * f.W + x) || seen(y * f.W + x)) any = true; if (!any) continue; }
    const m = buildProp(p); if (shadows) m.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    fv.built.add(m);
  }
  // stairs
  const stairMat = new THREE.MeshStandardMaterial({ color:'#3a3238', roughness:.9 });
  if (f.down && showTile(f.down.y * f.W + f.down.x) && f.exits?.down) fv.built.add(exitMarker(f.down, '#e9a54a'));
  else if (f.down && showTile(f.down.y * f.W + f.down.x)){
    const s = new THREE.Group(); s.position.set(wx(f.down.x), 0, wz(f.down.y));
    const pit = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color:'#000' })); pit.position.y = -.9; s.add(pit);
    for (let k = 0; k < 4; k++){ const st = new THREE.Mesh(G.step, stairMat); st.position.set(0, -.2 - k * .22, -.35 + k * .24); s.add(st); }
    const r = new THREE.Mesh(G.rune, new THREE.MeshBasicMaterial({ color:'#e9a54a', transparent:true, opacity:.85 })); r.position.y = .02; s.add(r); r.userData.spin = 1;
    fv.built.add(s);
  }
  if (f.up && showTile(f.up.y * f.W + f.up.x) && f.exits?.up) fv.built.add(exitMarker(f.up, '#c8cbd6'));
  else if (f.up && showTile(f.up.y * f.W + f.up.x)){
    const s = new THREE.Group(); s.position.set(wx(f.up.x), 0, wz(f.up.y));
    for (let k = 0; k < 4; k++){ const st = new THREE.Mesh(G.step, stairMat); st.position.set(0, .11 + k * .22, .35 - k * .24); s.add(st); }
    const r = new THREE.Mesh(G.rune, new THREE.MeshBasicMaterial({ color:'#c8cbd6', transparent:true, opacity:.8 })); r.position.y = .02; s.add(r); r.userData.spin = -1;
    fv.built.add(s);
  }
  // doors
  for (const dr of f.doors){
    if (pv && (dr.state === 'secret' || !exp.has(dr.i))) continue;
    fv.built.add(buildDoor(f, dr, fv.mats));
  }
  // traps
  for (const tr of f.traps){
    if (pv && (!tr.found || !exp.has(tr.i))) continue;
    fv.built.add(buildTrap(f, tr, pv));
  }
  // room glyphs + labels (DM only)
  if (!pv){
    for (const r of f.rooms){
      if (r.type !== 'chamber'){
        const m = new THREE.Mesh(G.glyph, new THREE.MeshBasicMaterial({ color:ROOM_TYPES[r.type]?.color || '#888', transparent:true, opacity:.55, depthWrite:false }));
        m.position.set(wx(r.cx), .03, wz(r.cy)); m.userData.spin = .3; fv.built.add(m);
      }
      if (ui.roomLabels){ const lb = makeLabel(r.name, ROOM_TYPES[r.type]?.color || '#ccc', 22); lb.position.set(wx(r.x + r.w / 2 - .5), 1.2, wz(r.y + .2)); lb.scale.multiplyScalar(.9); fv.built.add(lb); }
    }
  }
  applyFloorLook();
}
export function buildAllFloors(){ ensureFloorViews(); state.floors.forEach((_, L) => buildFloor(L)); }

// On overland floors the "stairs" are a way out (a gate, a road): a spinning rune and a soft column of light.
function exitMarker(at, color){
  const s = new THREE.Group(); s.position.set(wx(at.x), 0, wz(at.y));
  const r = new THREE.Mesh(G.rune, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.85 })); r.position.y = .03; r.userData.spin = .6; s.add(r);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.32, .42, 1.6, 16, 1, true), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.12, depthWrite:false, side:THREE.DoubleSide }));
  beam.position.y = .8; s.add(beam);
  return s;
}
const OPEN_ANGLE = -Math.PI / 2 * .92;
function buildDoor(f, dr, mats){
  const x = dr.i % f.W, y = (dr.i / f.W) | 0, o = doorOrientation(f, dr.i);
  const g = new THREE.Group(); g.position.set(wx(x), 0, wz(y)); g.rotation.y = o === 'x' ? 0 : Math.PI / 2;
  g.userData.doorId = dr.id;
  const secret = dr.state === 'secret';
  for (const s of [-1, 1]){ const p = new THREE.Mesh(G.post, secret ? mats.secret : mats.iron); p.position.set(s * .5, .65, 0); g.add(p); }
  const leaf = new THREE.Group(); leaf.position.x = -.46; g.add(leaf); g.userData.leaf = leaf;
  const panel = new THREE.Mesh(G.door, secret ? mats.secret : mats.wood); panel.position.set(.46, .59, 0); leaf.add(panel);
  if (!secret){
    for (const h of [.25, .95]){ const b = new THREE.Mesh(G.band, mats.iron); b.position.set(.46, h, 0); leaf.add(b); }
    if (dr.state === 'locked'){
      const lk = new THREE.Mesh(G.handle, mats.silver); lk.scale.set(.9, 1.1, .6); lk.position.set(.8, .6, 0); leaf.add(lk);
      const bar = new THREE.Mesh(G.band, mats.silver); bar.scale.set(1, 1.4, 1.2); bar.position.set(.46, .6, 0); leaf.add(bar);
    }
  }
  leaf.rotation.y = dr.state === 'open' ? OPEN_ANGLE : 0;
  return g;
}
export function animateDoor(L, id, open){
  const fv = floorViews[L]; if (!fv) return;
  const g = fv.built.children.find(c => c.userData.doorId === id), leaf = g?.userData.leaf; if (!leaf) return;
  const a0 = open ? 0 : OPEN_ANGLE, a1 = open ? OPEN_ANGLE : 0;
  leaf.rotation.y = a0; tween(.45, k => leaf.rotation.y = a0 + (a1 - a0) * ease(k));
}

/* A prop's moment: a lid or door opening or shutting, a shove (slide in from where it was), a topple, a swing
   on its hinge, a smash (the pieces drop and scatter) or a blow that doesn't break it (a shudder). */
export function animateProp(L, id, fx){
  const fv = floorViews[L]; if (!fv || !fx) return;
  const g = fv.built.children.find(c => c.userData.propId === id); if (!g) return;
  const u = g.userData, set = (o, kind, axis, v) => { o[kind][axis] = v; };
  if (fx === 'open' || fx === 'close') for (const op of u.openers || []){ const [a, b] = fx === 'open' ? [op.a, op.b] : [op.b, op.a]; set(op.o, op.kind, op.axis, a); tween(.5, k => set(op.o, op.kind, op.axis, a + (b - a) * ease(k))); }
  else if (fx.slide){ const x0 = g.position.x, z0 = g.position.z; tween(.45, k => { const e = 1 - ease(k); g.position.x = x0 + fx.slide.dx * e; g.position.z = z0 + fx.slide.dy * e; }); }
  else if (fx === 'topple' && u.pivot){ const { o, axis, end, lift } = u.pivot; tween(.7, k => { const e = k * k; o.rotation[axis] = end * e; o.position.y = lift * e; }); }
  else if (fx === 'swing' && u.hinge){ const { o, end } = u.hinge; tween(.9, k => o.rotation.y = end * ease(k)); }
  else if (fx === 'break'){ const kids = [...g.children]; kids.forEach(c => { const y = c.position.y; tween(.45, k => c.position.y = y + (1 - k) * (1 - k) * .6); }); }
  else if (fx === 'shake'){ const x0 = g.position.x; tween(.35, k => g.position.x = x0 + Math.sin(k * 40) * .04 * (1 - k)); }
}

function buildTrap(f, tr, pv){
  const x = tr.i % f.W, y = (tr.i / f.W) | 0, k = TRAP_KINDS[tr.kind] || TRAP_KINDS.pit;
  const armed = tr.armed, c = !armed ? '#6a6a6a' : tr.found ? '#ff5a4a' : '#b3303a';
  const g = new THREE.Group(); g.position.set(wx(x), 0, wz(y)); g.userData.trapId = tr.id;
  const ring = new THREE.Mesh(G.rune, new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:pv ? .9 : (tr.found ? .85 : .5), depthWrite:false }));
  ring.position.y = .025; ring.scale.setScalar(1.1); g.add(ring);
  if (armed){
    const sm = new THREE.MeshStandardMaterial({ color:'#d8d2c6', metalness:.6, roughness:.4, transparent:!tr.found && !pv, opacity:tr.found || pv ? 1 : .5 });
    for (let n = 0; n < 5; n++){ const a = n / 5 * Math.PI * 2; const s = new THREE.Mesh(G.spike, sm); s.position.set(Math.cos(a) * .22, .1, Math.sin(a) * .22); g.add(s); }
    g.userData.pulse = 1;
  }
  if (!pv){ const lb = makeLabel(`${k.icon} ${k.n}${tr.found ? ' (found)' : ''}${armed ? '' : ' — spent'}`, c, 18); lb.position.y = .55; lb.scale.multiplyScalar(.7); g.add(lb); }
  return g;
}

// Ghosting / stacking of floors depending on the view.
export function applyFloorLook(){
  floorViews.forEach((fv, L) => {
    if (!fv || !state.floors[L]) return;
    fv.group.position.y = floorY(L);
    const cur = L === ui.floor, stack = ui.view === 'stack';
    fv.group.visible = stack || cur;
    const op = cur ? 1 : .38, th = THEMES[state.floors[L].theme] || THEMES[0];
    const ghostGlow = new THREE.Color(th.wall).lerp(new THREE.Color(th.trim), .45);
    for (const m of [fv.mats.floor, fv.mats.wall, fv.mats.cap]){
      m.transparent = op < 1; m.opacity = op; m.depthWrite = op === 1;
      if (m !== fv.mats.wall){ m.emissive.copy(cur ? new THREE.Color(0) : ghostGlow); m.emissiveIntensity = cur ? 0 : .55; }
    }
    fv.tokens.visible = cur || stack;
  });
  mist.position.y = floorY(ui.floor);
}

/* ---------- mist ---------- */
export const mist = (() => {
  const n = 900, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++){ pos[i*3] = (Math.random() - .5) * 60; pos[i*3+1] = Math.random() * 1.6; pos[i*3+2] = (Math.random() - .5) * 60; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ size:2.2, map:new THREE.CanvasTexture(c), transparent:true, opacity:.12, depthWrite:false, color:'#8a8098' }));
  scene.add(p); return p;
})();

/* ---------- shift animation: walls rise and sink ---------- */
export function animateGridChange(L, oldGrid, newGrid){
  const f = state.floors[L], fv = floorViews[L]; if (!fv) return;
  const oldW = wallSet(f, oldGrid), newW = wallSet(f, newGrid);
  const rising = [...newW].filter(i => !oldW.has(i)), sinking = [...oldW].filter(i => !newW.has(i));
  const steady = new Set([...newW].filter(i => oldW.has(i)));
  const union = newGrid.map((v, i) => walk(v) ? v : (walk(oldGrid[i]) ? T.HALL : v));
  buildFloor(L, { walls:steady, grid:union });
  const mk = list => { const m = new THREE.InstancedMesh(G.wall, fv.mats.wall, Math.max(1, list.length)); m.count = list.length; fv.group.add(m); return m; };
  const rm = mk(rising), sm = mk(sinking), wc = new THREE.Color((THEMES[f.theme] || THEMES[0]).wall);
  [rm, sm].forEach(m => { for (let n = 0; n < m.count; n++) m.setColorAt(n, col.copy(wc).multiplyScalar(.8 + Math.random() * .4)); if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  const place = (m, list, y) => { list.forEach((i, n) => { mat4.makeTranslation(wx(i % f.W), y, wz((i / f.W) | 0)); m.setMatrixAt(n, mat4); }); m.instanceMatrix.needsUpdate = true; };
  if (L === ui.floor) fx.shake = .35;
  tween(1.8, k => { const e = ease(k); place(rm, rising, -WALL_H / 2 + e * WALL_H - .05); place(sm, sinking, WALL_H / 2 - e * WALL_H - .05); },
    () => { fv.group.remove(rm); fv.group.remove(sm); rm.dispose(); sm.dispose(); buildFloor(L); });
}
