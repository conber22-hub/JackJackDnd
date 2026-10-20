/* EFFECTS — selection ring, reachable-tile glow, pings, blood/seep bursts, and the Build-mode overlays. */
import * as THREE from 'three';
import { state, ui, tokById, tokenAt, isDM } from '../engine/state.js';
import { reach } from '../engine/grid.js';
import { fits } from '../engine/movement.js';
import { scene, G, mat4, wx, wz, tween } from './scene.js';
import { floorViews } from './floors.js';
import { tokenViews } from './minis.js';
import { moveAllowance } from '../game/rules.js';
import { sfx } from '../audio/sound.js';

export const selRing = new THREE.Mesh(new THREE.RingGeometry(.5, .6, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color:'#e9a54a', transparent:true, opacity:.9, depthWrite:false }));
selRing.visible = false; scene.add(selRing);
export function refreshSelectionRing(){
  const t = ui.selected && state && tokById(ui.selected);
  const tv = t && tokenViews.get(t.id);
  refreshGroupRings();
  if (!t || !tv || !tv.group.visible){ selRing.visible = false; return; }
  selRing.visible = true; selRing.scale.setScalar(t.size || 1);
}

/* Where the selected creature can go: bright squares are its move, dimmer red-orange ones need the Dash
   (in a fight, if it hasn't dashed yet — walking there takes it). */
export const reachState = { mesh:null, data:null };
const dashMat = new THREE.MeshBasicMaterial({ color:'#d0603a', transparent:true, opacity:.16, depthWrite:false });
export function showReach(t){
  clearReach();
  if (!t || t.dead) return;
  const canMove = ui.role === 'dm' ? !ui.tableView : t.id === ui.myToken;
  if (!canMove || !floorViews[t.floor]) return;
  const base = moveAllowance(t), free = ui.freeMove && ui.role === 'dm';
  const most = state.combat.active && !t.dashed && !free ? moveAllowance(t, { dash:true }) : base;
  if (most <= 0) return;
  const data = reach(t.floor, t.x, t.y, most, t.id);
  const f = state.floors[t.floor], size = t.size || 1;
  const tiles = [...data.par.keys()].filter(i => i !== t.y * f.W + t.x && fits(t.floor, i % f.W, (i / f.W) | 0, size, t.id));
  data.tiles = new Set(tiles); data.base = base;
  const near = tiles.filter(i => data.dist.get(i) <= base), far = tiles.filter(i => data.dist.get(i) > base);
  const meshes = [[near, floorViews[t.floor].mats.fx], [far, dashMat]].filter(([l]) => l.length).map(([list, mat]) => {
    const mesh = new THREE.InstancedMesh(G.plane, mat, list.length);
    list.forEach((i, n) => { mat4.makeTranslation(wx(i % f.W), .025, wz((i / f.W) | 0)); mat4.scale(new THREE.Vector3(.9, 1, .9)); mesh.setMatrixAt(n, mat4); });
    floorViews[t.floor].group.add(mesh); return mesh;
  });
  reachState.mesh = meshes; reachState.data = data;
}
export function clearReach(){ for (const m of reachState.mesh || []){ m.parent?.remove(m); m.dispose(); } reachState.mesh = null; reachState.data = null; }

/* The way a move will go, square by square: candle-coloured within its move, orange where it needs the Dash,
   red where it leaves an enemy's reach (an opportunity attack), with a ring where it ends. */
const pathMeshes = [];
const dotMat = new THREE.MeshBasicMaterial({ color:'#ffffff', transparent:true, opacity:.85, depthWrite:false });
const lineMat = new THREE.LineBasicMaterial({ color:'#f4d9a8', transparent:true, opacity:.75, depthWrite:false });
const endMat = new THREE.MeshBasicMaterial({ color:'#f4d9a8', transparent:true, opacity:.9, depthWrite:false, side:THREE.DoubleSide });
const C_OK = new THREE.Color('#f4c46a'), C_DASH = new THREE.Color('#e0703a'), C_OA = new THREE.Color('#ff3030');
export function clearMovePath(){ for (const m of pathMeshes.splice(0)){ m.parent?.remove(m); if (m.geometry !== G.plane) m.geometry.dispose(); if (m.isInstancedMesh) m.dispose(); } }
export function showMovePath(t, path, { base = Infinity, oa = [] } = {}){
  clearMovePath();
  const fv = floorViews[t.floor]; if (!fv || !path.length) return;
  const f = state.floors[t.floor], rough = new Set(f.rough || []), s = ((t.size || 1) - 1) / 2;
  const pts = [new THREE.Vector3(wx(t.x + s), .07, wz(t.y + s))];
  const dots = new THREE.InstancedMesh(G.plane, dotMat, path.length), col = new THREE.Color();
  let cost = 0;
  path.forEach((p, n) => {
    cost += rough.has(p.y * f.W + p.x) ? 2 : 1;
    mat4.makeTranslation(wx(p.x + s), .06, wz(p.y + s)); mat4.scale(new THREE.Vector3(.26, 1, .26)); dots.setMatrixAt(n, mat4);
    dots.setColorAt(n, col.copy(oa.includes(n) ? C_OA : cost > base ? C_DASH : C_OK));
    pts.push(new THREE.Vector3(wx(p.x + s), .07, wz(p.y + s)));
  });
  if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
  const e = path[path.length - 1], r = .42 * (t.size || 1);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - .07, r, 32).rotateX(-Math.PI / 2), endMat);
  ring.position.set(wx(e.x + s), .065, wz(e.y + s));
  endMat.color.copy(oa.length ? C_OA : cost > base ? C_DASH : C_OK); lineMat.color.copy(endMat.color);
  for (const m of [dots, line, ring]){ fv.group.add(m); pathMeshes.push(m); }
  return cost;
}

/* Rings under the rest of a picked group (they move with the selected creature). */
const groupRings = [];
const groupMat = new THREE.MeshBasicMaterial({ color:'#8fb8e8', transparent:true, opacity:.75, depthWrite:false });
export function refreshGroupRings(){
  const ids = [...(ui.group || [])].filter(id => tokenViews.get(id)?.group.visible);
  while (groupRings.length < ids.length){ const m = new THREE.Mesh(selRing.geometry, groupMat); scene.add(m); groupRings.push(m); }
  groupRings.forEach((m, k) => { m.visible = k < ids.length; m.userData.id = ids[k]; if (m.visible) m.scale.setScalar(tokById(ids[k])?.size || 1); });
}
export function updateGroupRings(){
  for (const m of groupRings){ if (!m.visible) continue; const tv = tokenViews.get(m.userData.id); if (!tv){ m.visible = false; continue; } tv.group.getWorldPosition(m.position); m.position.y += .07; }
}

export const pings = [];
export function spawnPing(L, x, y, color = '#e9a54a'){
  sfx('ping', false);
  const m = new THREE.Mesh(new THREE.RingGeometry(.3, .42, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent:true, depthWrite:false }));
  m.position.set(wx(x), .05, wz(y)); floorViews[L]?.group.add(m);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 4, 8), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.5, depthWrite:false }));
  beam.position.set(wx(x), 2, wz(y)); floorViews[L]?.group.add(beam);
  pings.push({ m, beam, t0:performance.now() });
}
export function updatePings(now){
  for (let i = pings.length - 1; i >= 0; i--){ const p = pings[i], k = (now - p.t0) / 2500;
    p.m.scale.setScalar(1 + k * 3); p.m.material.opacity = 1 - k; p.beam.material.opacity = .5 * (1 - k);
    if (k >= 1){ p.m.parent?.remove(p.m); p.beam.parent?.remove(p.beam); p.m.geometry.dispose(); p.beam.geometry.dispose(); pings.splice(i, 1); } }
}
export function burst(L, x, y, color){
  const geo = new THREE.BufferGeometry(), n = 60, pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++){ pos.set([wx(x), .3, wz(y)], i * 3); vel.push(new THREE.Vector3((Math.random() - .5) * 3, Math.random() * 3, (Math.random() - .5) * 3)); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size:.12, transparent:true, depthWrite:false }));
  floorViews[L]?.group.add(p);
  tween(1, k => { const a = geo.attributes.position; for (let i = 0; i < n; i++){ a.array[i*3] += vel[i].x * .016; a.array[i*3+1] += (vel[i].y - k * 5) * .016; a.array[i*3+2] += vel[i].z * .016; } a.needsUpdate = true; p.material.opacity = 1 - k; },
    () => { p.parent?.remove(p); geo.dispose(); p.material.dispose(); });
}

/* ---------- Build overlays (DM only) ---------- */
const overlay = new THREE.Group(); scene.add(overlay);
const okMat = new THREE.LineBasicMaterial({ color:'#7fe0a0' }), badMat = new THREE.LineBasicMaterial({ color:'#ff5a5a' });
const handleMat = new THREE.MeshBasicMaterial({ color:'#e9a54a' }), pathMat = new THREE.MeshBasicMaterial({ color:'#7fe0a0', transparent:true, opacity:.45, depthWrite:false });
const hoverMat = new THREE.MeshBasicMaterial({ color:'#ffffff', transparent:true, opacity:.12, depthWrite:false });
const handleGeo = new THREE.BoxGeometry(.34, .34, .34);
export function clearOverlay(){ for (const c of [...overlay.children]){ overlay.remove(c); if (c.geometry && c.geometry !== handleGeo && c.geometry !== G.plane) c.geometry.dispose(); if (c.isInstancedMesh) c.dispose(); } }
function placeOverlay(L){ const fv = floorViews[L]; overlay.position.y = fv ? fv.group.position.y : 0; }

// rect = { x, y, w, h } in tiles; ok = green, else red
export function showGhostRect(L, rect, ok){
  clearOverlay(); placeOverlay(L);
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(rect.w, 1.6, rect.h));
  const box = new THREE.LineSegments(geo, ok ? okMat : badMat);
  box.position.set(wx(rect.x) + rect.w / 2 - .5, .8, wz(rect.y) + rect.h / 2 - .5); overlay.add(box);
}
// Corner handles for the rooms on a floor (shown in Room mode).
export function showRoomHandles(L){
  clearOverlay(); placeOverlay(L);
  if (!isDM() || !state.floors[L]) return;
  for (const r of state.floors[L].rooms){
    for (const [x, y] of [[r.x, r.y], [r.x + r.w - 1, r.y], [r.x, r.y + r.h - 1], [r.x + r.w - 1, r.y + r.h - 1]]){
      const h = new THREE.Mesh(handleGeo, handleMat); h.position.set(wx(x), .25, wz(y)); overlay.add(h);
    }
  }
}
export function showPathPreview(L, tiles){
  clearOverlay(); placeOverlay(L);
  const f = state.floors[L], m = new THREE.InstancedMesh(G.plane, pathMat, Math.max(1, tiles.length)); m.count = tiles.length;
  tiles.forEach((i, n) => { mat4.makeTranslation(wx(i % f.W), .04, wz((i / f.W) | 0)); m.setMatrixAt(n, mat4); });
  overlay.add(m);
}
const hover = new THREE.Mesh(G.plane, hoverMat); hover.visible = false; scene.add(hover);
export function showHover(L, x, y){
  const fv = floorViews[L]; if (x === null || !fv){ hover.visible = false; return; }
  hover.visible = true; hover.position.set(wx(x), fv.group.position.y + .03, wz(y));
}
