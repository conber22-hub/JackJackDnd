/* SESSION — save / load / export, migrating old saves, undo for the Build tools, and changed(). */
import { heroToken } from '../engine/hero.js';
import { fillResources } from './resources.js';
import { clearRequests } from './requests.js';
import * as THREE from 'three';
import { state, setState, ui, newCampaign } from '../engine/state.js';
import { updateVision } from '../engine/grid.js';
import { $ } from '../util/core.js';
import { camTo, viewOffset, wx, wz, floorY } from '../render/scene.js';
import { ensureFloorViews, buildAllFloors, floorViews } from '../render/floors.js';
import { syncTokens, clearTokenViews } from '../render/minis.js';
import { clearReach, clearOverlay } from '../render/effects.js';
import { renderAll, renderInit, renderSel, toast } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { broadcast, sendHost, pushState } from '../net/table.js';
import { goFloor } from './actions.js';
import { scene } from '../render/scene.js';

export { broadcast, sendHost, pushState };

export function serialize(withArt){
  return { v:2, meta:state.meta, dread:state.dread, floors:state.floors.map(f => ({ ...f, grid:f.grid.join(''), base:f.base ? f.base.join('') : null })), tokens:state.tokens,
    combat:state.combat, explored:Object.fromEntries(Object.entries(state.explored).map(([k, v]) => [k, [...v]])), log:state.log.slice(-60),
    seats:state.seats, grasp:state.grasp, content:state.content, campaign:state.campaign, characters:state.characters, ...(withArt ? { art:state.art } : {}) };
}
export function deserialize(s){
  const st = JSON.parse(JSON.stringify(s));
  st.floors = s.floors.map((f, L) => {
    const nf = { ...JSON.parse(JSON.stringify(f)), grid:[...String(f.grid)].map(Number), base:f.base ? [...String(f.base)].map(Number) : null };
    // v1 saves: rooms were identified by index, no doors/traps/corridors
    nf.dug ||= []; nf.filled ||= []; nf.doors ||= []; nf.traps ||= []; nf.corridors ||= []; nf.props ||= []; nf.buildings ||= []; nf.rough ||= [];
    if (nf.autoLink === undefined) nf.autoLink = true;
    nf.rooms.forEach((r, i) => { if (r.id === undefined) r.id = i; });
    nf.nextId ??= Math.max(-1, ...nf.rooms.map(r => r.id)) + 1;
    nf.nextObj ??= Math.max(0, ...nf.doors.map(d => d.id || 0), ...nf.traps.map(t => t.id || 0)) + 1;
    nf.level = L;
    return nf;
  });
  st.explored = {}; st.floors.forEach((f, L) => st.explored[L] = new Set(s.explored?.[L] || []));
  st.art = s.art || {}; st.seats = s.seats || {}; st.log = s.log || [];
  st.combat = s.combat || { active:false, order:[], idx:0, round:1, floor:0 };
  st.grasp = s.grasp || { die:4, auto:false, last:null };   // the Whim Die (old field name)
  st.content = { dread:{}, shift:null, grasp:null, bestiary:{}, ...(s.content || {}) };
  // the hands' Grasp table and the Seep's Dread names were replaced by the Whim table and Strahd's Gaze
  if (/Grasp Die/.test(st.content.grasp || '')){ st.content.grasp = null; st.grasp.auto = false; }
  if (/Hands Reach/.test(st.content.shift || '')) st.content.shift = null;
  const nc = newCampaign();
  st.campaign = { ...nc, ...(s.campaign || {}), clocks:{ ...nc.clocks, ...(s.campaign?.clocks || {}) }, places:{ ...nc.places, ...(s.campaign?.places || {}) } };
  st.characters = s.characters || {};
  st.meta.template ||= 'andral';
  st.tokens.forEach(t => { t.flags = t.flags || {}; t.size = t.size || 1; t.conds = t.conds || []; t.check ??= 4; t.passive ??= 12; });
  // heroes saved before slots and features: give them their resources (full) from the sheet
  for (const t of st.tokens) if (t.charId && !t.resources && st.characters[t.charId]){ const f = heroToken(st.characters[t.charId]); Object.assign(t, { resources:f.resources, casts:f.casts, attacks:f.attacks, ...(f.rageDmg ? { rageDmg:f.rageDmg } : {}) }); fillResources(t); }
  st.v = 2;
  return st;
}

const SAVE_KEY = 'dreaddelve.save.v1';
let saveTimer = null, warnedQuota = false;
export function saveSoon(){ if (ui.role !== 'dm') return; clearTimeout(saveTimer); saveTimer = setTimeout(saveLocal, 500); }
export function saveLocal(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize(true))); }
  catch { try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize(false))); if (!warnedQuota){ warnedQuota = true; toast('Autosave skipped art (too big) — use Export to keep it.'); } } catch {} }
}
export function loadLocal(){ try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
export function download(name, text, type = 'application/json'){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function exportDelve(){ download(`${state.meta.name.replace(/[^\w]+/g, '-').toLowerCase()}-dread-delve.json`, JSON.stringify(serialize(true), null, 1)); }
export function importDelve(file){
  const r = new FileReader();
  r.onload = () => { try { loadState(deserialize(JSON.parse(r.result))); toast('Delve loaded.'); } catch (e){ console.error(e); toast('That file is not a Dread Delve save.'); } };
  r.readAsText(file);
}
export function resetScene(){
  clearTokenViews();
  floorViews.forEach(fv => fv && scene.remove(fv.group)); floorViews.length = 0;
  clearReach(); clearOverlay(); ui.selected = null; ui.selDoor = null; ui.selTrap = null; ui.selRoom = null;
}
export function loadState(s){
  clearRequests();
  setState(s); ui.role = 'dm'; ui.tab = ui.tab === 'hero' ? 'tokens' : ui.tab; undoStack.length = 0;
  resetScene(); ensureFloorViews(); updateVision(); buildAllFloors(); syncTokens();
  const first = state.tokens.find(t => t.kind === 'pc' && !t.flags.gone);
  goFloor(first ? first.floor : 0, false);
  if (!first){ const r = state.floors[0].rooms[0]; camTo(new THREE.Vector3(wx(r.cx), floorY(0), wz(r.cy)), viewOffset(), 1.2); }
  if (first) camTo(new THREE.Vector3(wx(first.x), floorY(first.floor), wz(first.y)), viewOffset(), 1.2);
  $('#startModal').classList.add('hidden'); renderAll(); saveSoon(); pushState();
}

/* ---------- undo (Build tools) ---------- */
const undoStack = [];
export function snapshot(label){
  undoStack.push({ label, floors:JSON.stringify(state.floors.map(f => ({ ...f, grid:f.grid.join(''), base:f.base ? f.base.join('') : null }))),
    tokens:JSON.stringify(state.tokens.map(t => [t.id, t.floor, t.x, t.y])), meta:{ ...state.meta } });
  if (undoStack.length > 40) undoStack.shift();
}
export function undo(){
  const u = undoStack.pop(); if (!u){ toast('Nothing to undo.'); return false; }
  const fl = JSON.parse(u.floors);
  state.floors = fl.map(f => ({ ...f, grid:[...String(f.grid)].map(Number), base:f.base ? [...String(f.base)].map(Number) : null }));
  state.meta = u.meta;
  for (const [id, L, x, y] of JSON.parse(u.tokens)){ const t = state.tokens.find(t => t.id === id); if (t) Object.assign(t, { floor:L, x, y }); }
  state.floors.forEach((_, L) => { state.explored[L] ||= new Set(); });
  for (const k of Object.keys(state.explored)) if (+k >= state.floors.length) delete state.explored[k];
  ensureFloorViews(); updateVision(); buildAllFloors(); if (ui.floor >= state.floors.length) goFloor(state.floors.length - 1, false);
  toast(`Undone: ${u.label}`); changed();
  return true;
}
export const undoCount = () => undoStack.length;
export const dropSnapshot = () => undoStack.pop();

/* changed(): call after anything that alters state */
export function changed(){
  if (!state) return;
  syncTokens(); renderInit(); renderSel();
  const typing = document.activeElement && $('#tabBody').contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (!typing && ['tokens', 'hero', 'table', 'dread', 'build', 'story'].includes(ui.tab)) renderPanel();
  saveSoon(); pushState();
}
