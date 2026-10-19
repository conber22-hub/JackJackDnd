/* INPUT — tap / click / long-press / drag on the 3D view, and the tool modes. */
import * as THREE from 'three';
import { requestAct } from '../game/requests.js';
import { useFeature } from '../game/resources.js';
import { payLegend } from '../game/combat.js';
import { state, ui, isDM, tokById, tokenAt, viewAsPlayer, walk } from '../engine/state.js';
import { roomAt } from '../engine/generator.js';
import { renderer, camera, controls, floorY } from '../render/scene.js';
import { tokenViews } from '../render/minis.js';
import { floorViews, buildFloor } from '../render/floors.js';
import { reachState, showGhostRect, showRoomHandles, showPathPreview, clearOverlay, showHover } from '../render/effects.js';
import { rectProblem } from '../engine/generator.js';
import { $ } from '../util/core.js';
import { toast, renderDock, BUILD_TOOLS } from './hud.js';
import { renderPanel } from './panels.js';
import { select, selectDoor, selectTrap, requestMove, doPing } from '../game/actions.js';
import { doAttack, placeMonster, castSpell } from '../game/combat.js';
import { editTile, paintRoom, commitRoom, traceStep, commitCorridor, eraseAt, placeDoorAt, placeTrapAt, placeStairsAt, placePropAt, placeHouseAt } from '../game/build.js';
import { changed, snapshot } from '../game/session.js';
import { updateVision } from '../engine/grid.js';
import { rebuildFog } from '../game/actions.js';

const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function setNdc(cx, cy){ ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); raycaster.setFromCamera(ndc, camera); }
function pickToken(cx, cy){
  setNdc(cx, cy);
  const groups = [...tokenViews.values()].map(tv => tv.group).filter(g => g.visible && g.parent && g.parent.visible && g.parent.parent?.visible);
  for (const h of raycaster.intersectObjects(groups, true)){ let o = h.object; while (o && !o.userData.tokenId) o = o.parent; if (o) return o.userData.tokenId; }
  return null;
}
function pickDoor(cx, cy){
  setNdc(cx, cy);
  const fv = floorViews[ui.floor]; if (!fv) return null;
  const doors = fv.built.children.filter(c => c.userData.doorId);
  for (const h of raycaster.intersectObjects(doors, true)){ let o = h.object; while (o && !o.userData.doorId) o = o.parent; if (o) return o.userData.doorId; }
  return null;
}
export function pickTile(cx, cy){
  setNdc(cx, cy);
  const p = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY(ui.floor)), p)) return null;
  const n = state.meta.size, x = Math.floor(p.x + n / 2), y = Math.floor(p.z + n / 2);
  if (x < 0 || y < 0 || x >= n || y >= n) return null;
  return { floor:ui.floor, x, y };
}

export function setMode(mode, data = null, text = ''){
  ui.mode = mode; ui.modeData = data;
  const tool = BUILD_TOOLS.find(t => t[0] === mode);
  $('#modeHint').classList.toggle('show', mode !== 'select');
  $('#modeText').textContent = text || tool?.[3] || '';
  renderDock(); refreshBuildOverlay();
  if (ui.tab === 'build' || ui.tab === 'dungeon') renderPanel();
}
export function refreshBuildOverlay(){
  if (!state) return;
  if (isDM() && ui.mode === 'room') showRoomHandles(ui.floor); else clearOverlay();
  if (!['room', 'corridor', 'door', 'trap', 'stairs', 'erase', 'dig', 'fill', 'paint', 'prop', 'house'].includes(ui.mode)) showHover(null, null);
}

/* ---------- pointer handling ---------- */
const cv = renderer.domElement;
let press = null, pressTimer = null, drag = null;
const pointers = new Set();
const DRAG_MODES = ['room', 'corridor', 'dig', 'fill'];
cv.addEventListener('pointerdown', e => {
  pointers.add(e.pointerId);
  if (!state) return;
  if (pointers.size > 1){ cancelDrag(); controls.enabled = true; return; }   // a second finger: pinch / pan the camera
  press = { x:e.clientX, y:e.clientY, moved:false, pinged:false, btn:e.button };
  clearTimeout(pressTimer);
  if (isDM() && DRAG_MODES.includes(ui.mode) && e.button === 0){
    const tile = pickTile(e.clientX, e.clientY);
    if (tile){ controls.enabled = false; startDrag(tile); return; }
  }
  pressTimer = setTimeout(() => { if (press && !press.moved){ const t = pickTile(press.x, press.y); if (t){ doPing(t); press.pinged = true; } } }, 650);
}, { capture:true });
cv.addEventListener('pointermove', e => {
  if (!state) return;
  if (drag){ const tile = pickTile(e.clientX, e.clientY); if (tile) updateDrag(tile); return; }
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8){ press.moved = true; clearTimeout(pressTimer); }
  if (e.pointerType === 'mouse' && isDM() && ui.mode !== 'select' && !press){ const t = pickTile(e.clientX, e.clientY); showHover(ui.floor, t ? t.x : null, t?.y); }
});
const up = e => {
  pointers.delete(e.pointerId);
  clearTimeout(pressTimer);
  if (drag){ endDrag(); controls.enabled = true; press = null; return; }
  controls.enabled = true;
  if (e.type === 'pointercancel' || !press || press.moved || press.pinged || press.btn !== 0){ press = null; return; }
  press = null; handleTap(e.clientX, e.clientY);
};
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
cv.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- drags: rooms, corridors, dig / fill strokes ---------- */
function startDrag(tile){
  const f = state.floors[tile.floor], i = tile.y * f.W + tile.x;
  if (ui.mode === 'room'){
    let op = null;
    for (const r of f.rooms){
      const corners = [[r.x, r.y, r.x + r.w - 1, r.y + r.h - 1], [r.x + r.w - 1, r.y, r.x, r.y + r.h - 1], [r.x, r.y + r.h - 1, r.x + r.w - 1, r.y], [r.x + r.w - 1, r.y + r.h - 1, r.x, r.y]];
      const c = corners.find(([cx, cy]) => cx === tile.x && cy === tile.y);
      if (c && (r.w > 1 || r.h > 1)){ op = { kind:'resize', L:tile.floor, id:r.id, anchor:{ x:c[2], y:c[3] }, rect:{ x:r.x, y:r.y, w:r.w, h:r.h } }; break; }
    }
    const r = !op && roomAt(f, tile.x, tile.y);
    if (!op && r) op = { kind:'move', L:tile.floor, id:r.id, off:{ x:tile.x - r.x, y:tile.y - r.y }, rect:{ x:r.x, y:r.y, w:r.w, h:r.h } };
    if (!op) op = { kind:'create', L:tile.floor, start:{ x:tile.x, y:tile.y }, rect:{ x:tile.x, y:tile.y, w:1, h:1 } };
    drag = { mode:'room', op, start:tile, moved:false };
  } else if (ui.mode === 'corridor'){
    drag = { mode:'corridor', L:tile.floor, tiles:[i], last:i, start:tile, moved:false };
    showPathPreview(tile.floor, drag.tiles);
  } else {
    snapshot(ui.mode);
    drag = { mode:ui.mode, L:tile.floor, last:i, start:tile, moved:false, changed:editTile(tile, ui.mode) };
    if (drag.changed) buildFloor(tile.floor);
  }
}
function updateDrag(tile){
  const f = state.floors[drag.start.floor], i = tile.y * f.W + tile.x;
  if (tile.x !== drag.start.x || tile.y !== drag.start.y) drag.moved = true;
  if (drag.mode === 'room'){
    const op = drag.op;
    if (op.kind === 'move') op.rect = { ...op.rect, x:tile.x - op.off.x, y:tile.y - op.off.y };
    else { const a = op.kind === 'resize' ? op.anchor : op.start; op.rect = { x:Math.min(a.x, tile.x), y:Math.min(a.y, tile.y), w:Math.abs(a.x - tile.x) + 1, h:Math.abs(a.y - tile.y) + 1 }; }
    if (drag.moved) showGhostRect(op.L, op.rect, !rectProblem(f, op.rect, op.id));
  } else if (drag.mode === 'corridor'){
    if (i === drag.last) return;
    drag.tiles.push(...traceStep(f, drag.last, i)); drag.last = i;
    showPathPreview(drag.L, drag.tiles);
  } else {
    if (i === drag.last) return;
    let any = false;
    for (const k of traceStep(f, drag.last, i)) if (editTile({ floor:drag.L, x:k % f.W, y:(k / f.W) | 0 }, drag.mode)) any = true;
    drag.last = i;
    if (any){ drag.changed = true; buildFloor(drag.L); }
  }
}
function endDrag(){
  const dg = drag; drag = null;
  if (dg.mode === 'room'){
    if (!dg.moved){
      const r = dg.op.kind !== 'create' ? dg.op.id : null;
      ui.selRoom = r; buildFloor(dg.op.L); renderPanel();
      if (r === null && ui.tab !== 'build') toast('Drag on bare rock to draw a room.');
    } else commitRoom(dg.op);
    refreshBuildOverlay();
  } else if (dg.mode === 'corridor'){
    clearOverlay();
    if (dg.tiles.length > 1) commitCorridor(dg.L, dg.tiles); else toast('Drag to trace a corridor.');
  } else {
    if (dg.changed){ updateVision(); rebuildFog(dg.L); changed(); }
    else import('../game/session.js').then(m => m.dropSnapshot());
  }
}
function cancelDrag(){ if (!drag) return; const dg = drag; drag = null; clearOverlay(); if (dg.mode !== 'room' && dg.mode !== 'corridor' && dg.changed){ buildFloor(dg.L); changed(); } refreshBuildOverlay(); }

/* ---------- taps ---------- */
function handleTap(cx, cy){
  if (!state) return;
  const tokId = pickToken(cx, cy), tile = pickTile(cx, cy), f = state.floors[ui.floor];
  const ti = tile ? tile.y * f.W + tile.x : -1;
  switch (ui.mode){
    case 'attack': if (tokId && tokId !== ui.modeData.attacker){
      if (ui.role === 'player') requestAct({ kind:'attack', id:ui.modeData.attacker, i:ui.modeData.i, target:tokId, mode:ui.atkMode });
      else if (ui.modeData.legend != null){ const a = tokById(ui.modeData.attacker); if (a && payLegend(a, ui.modeData.legend)) doAttack(a.id, tokId, ui.modeData.i, ui.atkMode); }
      else doAttack(ui.modeData.attacker, tokId, ui.modeData.i, ui.atkMode);
      ui.atkMode = 'normal'; setMode('select'); } return;
    case 'cast': if (tokId){
      if (ui.role === 'player') requestAct({ kind:'cast', id:ui.modeData.caster, i:ui.modeData.i, target:tokId });
      else castSpell(ui.modeData.caster, tokId, ui.modeData.i);
      setMode('select'); } return;
    case 'feat': if (tokId){
      if (ui.role === 'player') requestAct({ kind:'feat', id:ui.modeData.user, res:ui.modeData.res, target:tokId });
      else { const u = tokById(ui.modeData.user); if (u) useFeature(u, ui.modeData.res, tokById(tokId)); }
      setMode('select'); } return;
    case 'place':  if (tile && walk(f.grid[ti]) && !tokenAt(tile.floor, tile.x, tile.y)) placeMonster(ui.modeData.bid, tile); return;
    case 'placeTok': if (tile && walk(f.grid[ti])){ const t = tokById(ui.modeData.id); if (t){ t.floor = tile.floor; t.x = tile.x; t.y = tile.y; t.flags.gone = false; updateVision(); rebuildFog(); changed(); } setMode('select'); } return;
    case 'ping':   if (tile) doPing(tile); setMode('select'); return;
    case 'paint':  if (tile) paintRoom(tile, ui.modeData.type); return;
    case 'door':   if (tile) placeDoorAt(tile); return;
    case 'trap':   if (tile) placeTrapAt(tile); return;
    case 'stairs': if (tile) placeStairsAt(tile, ui.stairsDir); return;
    case 'erase':  if (tile) eraseAt(tile); return;
    case 'prop':   if (tile) placePropAt(tile); return;
    case 'house':  if (tile) placeHouseAt(tile); return;
  }
  if (tokId){ select(tokId); return; }
  const sel = ui.selected && tokById(ui.selected);
  if (tile && sel && reachState.data?.tiles?.has(ti)){ requestMove(sel, tile.x, tile.y); return; }
  // doors and traps
  const pv = viewAsPlayer(), exp = state.explored[ui.floor];
  const doorId = pickDoor(cx, cy) ?? (tile && f.doors.find(d => d.i === ti)?.id);
  const door = doorId && f.doors.find(d => d.id === doorId);
  if (door && (!pv || (door.state !== 'secret' && exp.has(door.i)))){ selectDoor(ui.floor, door.id); return; }
  const trap = tile && f.traps.find(t => t.i === ti);
  if (trap && (!pv || (trap.found && exp.has(trap.i)))){ selectTrap(ui.floor, trap.id); return; }
  ui.selDoor = null; ui.selTrap = null; select(null);
}
