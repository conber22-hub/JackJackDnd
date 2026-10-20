/* INPUT — tap / click / long-press / drag on the 3D view, and the tool modes. */
import * as THREE from 'three';
import { requestAct } from '../game/requests.js';
import { useFeature } from '../game/resources.js';
import { payLegend } from '../game/combat.js';
import { makeNoise } from '../game/noise.js';
import { state, ui, isDM, tokById, tokenAt, viewAsPlayer, walk } from '../engine/state.js';
import { roomAt } from '../engine/generator.js';
import { renderer, camera, controls, floorY } from '../render/scene.js';
import { tokenViews } from '../render/minis.js';
import { floorViews, buildFloor } from '../render/floors.js';
import { reachState, showGhostRect, showRoomHandles, showPathPreview, clearOverlay, showHover, showMovePath, clearMovePath } from '../render/effects.js';
import { extendPath, provokers } from '../engine/movement.js';
import { pathTo, pathCost } from '../engine/grid.js';
import { moveAllowance } from '../game/rules.js';
import { mayMove, toggleGroup, pausedMover } from '../game/moves.js';
import { rectProblem } from '../engine/generator.js';
import { $, esc } from '../util/core.js';
import { toast, renderDock, renderSel, BUILD_TOOLS } from './hud.js';
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
  if (!['room', 'corridor', 'door', 'trap', 'stairs', 'erase', 'dig', 'fill', 'rough', 'paint', 'prop', 'house', 'noise'].includes(ui.mode)) showHover(null, null);
}

/* ---------- pointer handling ---------- */
const cv = renderer.domElement;
let press = null, pressTimer = null, drag = null;
const pointers = new Set();
const DRAG_MODES = ['room', 'corridor', 'dig', 'fill', 'rough'];
cv.addEventListener('pointerdown', e => {
  pointers.add(e.pointerId);
  if (!state) return;
  if (pointers.size > 1){ cancelDrag(); if (tdrag){ tdrag = null; clearMovePath(); hideTip(); } if (press) press.tok = null; controls.enabled = true; return; }   // a second finger: pinch / pan the camera
  press = { x:e.clientX, y:e.clientY, moved:false, pinged:false, btn:e.button, shift:e.shiftKey || e.ctrlKey || e.metaKey };
  clearTimeout(pressTimer);
  // pressing on a creature you may move: dragging walks it (the camera stays put)
  if (ui.mode === 'select' && e.button === 0){
    const id = pickToken(e.clientX, e.clientY), t = id && tokById(id);
    if (t && mayMove(t) && !t.dead && !press.shift){ press.tok = id; controls.enabled = false; }
  }
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
  if (press?.tok && press.moved){ if (!tdrag) startTokenDrag(press.tok); if (tdrag){ dragToken(e.clientX, e.clientY); return; } }
  if (e.pointerType === 'mouse' && isDM() && ui.mode !== 'select' && !press){ const t = pickTile(e.clientX, e.clientY); showHover(ui.floor, t ? t.x : null, t?.y); }
  if (e.pointerType === 'mouse' && ui.mode === 'select' && !press) hoverMove(e.clientX, e.clientY);
});
const up = e => {
  pointers.delete(e.pointerId);
  clearTimeout(pressTimer);
  if (drag){ endDrag(); controls.enabled = true; press = null; return; }
  controls.enabled = true;
  if (tdrag){ const td = tdrag; tdrag = null; press = null; endTokenDrag(td, e.type === 'pointercancel'); return; }
  if (e.type === 'pointercancel' || !press || press.moved || press.pinged || press.btn !== 0){ press = null; return; }
  const shift = press.shift; press = null; handleTap(e.clientX, e.clientY, shift);
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
    const mode = ui.mode === 'rough' && (f.rough || []).includes(i) ? 'smooth' : ui.mode;   // a stroke that starts on rough ground clears it
    drag = { mode, L:tile.floor, last:i, start:tile, moved:false, changed:editTile(tile, mode) };
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
function handleTap(cx, cy, shift = false){
  if (!state) return;
  const tokId = pickToken(cx, cy), tile = pickTile(cx, cy), f = state.floors[ui.floor];
  const ti = tile ? tile.y * f.W + tile.x : -1;
  switch (ui.mode){
    case 'attack': if (tokId && tokId !== ui.modeData.attacker){
      if (ui.role === 'player') requestAct({ kind:'attack', id:ui.modeData.attacker, i:ui.modeData.i, target:tokId, mode:ui.atkMode });
      else if (ui.modeData.legend != null){ const a = tokById(ui.modeData.attacker); if (a && payLegend(a, ui.modeData.legend)) doAttack(a.id, tokId, ui.modeData.i, ui.atkMode); }
      else doAttack(ui.modeData.attacker, tokId, ui.modeData.i, ui.atkMode);
      ui.atkMode = 'normal'; setMode('select'); renderSel(); } return;
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
    case 'noise':  if (tile){ if (makeNoise(tile.floor, tile.x, tile.y, 2, 'A loud noise').length) changed(); else toast('Nothing near enough heard it.'); } setMode('select'); return;
    case 'paint':  if (tile) paintRoom(tile, ui.modeData.type); return;
    case 'door':   if (tile) placeDoorAt(tile); return;
    case 'trap':   if (tile) placeTrapAt(tile); return;
    case 'stairs': if (tile) placeStairsAt(tile, ui.stairsDir); return;
    case 'erase':  if (tile) eraseAt(tile); return;
    case 'prop':   if (tile) placePropAt(tile); return;
    case 'house':  if (tile) placeHouseAt(tile); return;
  }
  if (tokId){ if (shift && isDM() && ui.selected && toggleGroup(tokId)) return; select(tokId); return; }
  const sel = ui.selected && tokById(ui.selected);
  if (tile && sel && reachState.data?.tiles?.has(ti)){ clearMovePath(); hideTip(); requestMove(sel, tile.x, tile.y); return; }
  // doors and traps
  const pv = viewAsPlayer(), exp = state.explored[ui.floor];
  const doorId = pickDoor(cx, cy) ?? (tile && f.doors.find(d => d.i === ti)?.id);
  const door = doorId && f.doors.find(d => d.id === doorId);
  if (door && (!pv || (door.state !== 'secret' && exp.has(door.i)))){ selectDoor(ui.floor, door.id); return; }
  const trap = tile && f.traps.find(t => t.i === ti);
  if (trap && (!pv || (trap.found && exp.has(trap.i)))){ selectTrap(ui.floor, trap.id); return; }
  ui.selDoor = null; ui.selTrap = null; select(null);
}

/* ---------- moving a creature: drag along a route, or hover to see the way ---------- */
let tdrag = null, hoverKey = '';
const tip = () => $('#moveTip');
function hideTip(){ tip()?.classList.remove('show'); }
function showTip(cx, cy, html){ const el = tip(); if (!el) return; el.innerHTML = html; el.style.left = `${cx + 16}px`; el.style.top = `${cy - 10}px`; el.classList.add('show'); }
// What a route costs and what it risks, for the tip beside the finger / cursor.
function describeRoute(t, path){
  const f = state.floors[t.floor], base = moveAllowance(t), cost = pathCost(f, path);
  const pv = provokers(t, path), oaIdx = pv.map(p => p.at + 1);
  showMovePath(t, path, { base, oa:oaIdx });
  let h = `<b>${cost * 5} ft</b>`;
  if (state.combat.active) h += cost > base ? ' · <span class="dash">Dash</span>' : ` · ${(base - cost) * 5} ft left`;
  if ((f.rough || []).length && path.some(p => (f.rough || []).includes(p.y * f.W + p.x))) h += ' · rough ground';
  if (pv.length) h += `<div class="warn">⚠ ${pv.map(p => esc(tokById(p.by)?.name || '?')).join(', ')} may strike as ${t.kind === 'pc' && t.id === ui.myToken ? 'you leave' : 'it leaves'}</div>`;
  return h;
}
function startTokenDrag(id){
  const t = tokById(id); if (!t || pausedMover(t.id) || tokenViews.get(t.id)?.anim){ press.tok = null; controls.enabled = true; return; }
  if (ui.selected !== id) select(id);
  if (!reachState.data){ press.tok = null; controls.enabled = true; toast(state.combat.active && ui.role === 'player' ? 'Wait for your turn.' : `${t.name} can't move now.`); return; }
  tdrag = { id, path:[] };
}
function dragToken(cx, cy){
  const t = tokById(tdrag.id), tile = pickTile(cx, cy); if (!t || !tile || tile.floor !== t.floor) return;
  const most = state.combat.active && !t.dashed && !(ui.freeMove && ui.role === 'dm') ? moveAllowance(t, { dash:true }) : moveAllowance(t);
  const next = extendPath(t, tdrag.path, tile.x, tile.y, Math.max(most, 0));
  if (next !== tdrag.path) tdrag.path = next;
  if (!tdrag.path.length){ clearMovePath(); hideTip(); return; }
  showTip(cx, cy, describeRoute(t, tdrag.path));
}
function endTokenDrag(td, cancelled){
  clearMovePath(); hideTip();
  const t = tokById(td.id); if (!t || cancelled || !td.path.length) return;
  const e = td.path[td.path.length - 1];
  requestMove(t, e.x, e.y, td.path);
}
// With a mouse: hovering a square the selected creature can reach shows the way and what it costs.
function hoverMove(cx, cy){
  const t = ui.selected && tokById(ui.selected), R = reachState.data;
  if (!t || !R || tokenViews.get(t.id)?.anim){ if (hoverKey){ hoverKey = ''; clearMovePath(); hideTip(); } return; }
  const tile = pickTile(cx, cy), f = state.floors[t.floor], i = tile && tile.floor === t.floor ? tile.y * f.W + tile.x : -1;
  if (i < 0 || !R.tiles.has(i)){ if (hoverKey){ hoverKey = ''; clearMovePath(); hideTip(); } return; }
  const key = `${t.id}:${t.x},${t.y}>${i}`;
  if (key !== hoverKey){ hoverKey = key; tip().dataset.html = describeRoute(t, pathTo(R.par, f.W, i)); }
  showTip(cx, cy, tip().dataset.html);
}
