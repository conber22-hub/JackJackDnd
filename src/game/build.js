/* BUILD — hand-building floors: rooms (drag / resize / draw), corridors, doors, traps, stairs, dig & fill,
   templates, populate, adding floors, and importing Battle Table / ASCII maps. Every edit is undoable. */
import { state, ui, newState, log, tokenAt, makeMonster, makePC } from '../engine/state.js';
import { T, walk } from '../engine/tiles.js';
import { carve, roomAt, roomById, rectProblem, addRoom, deleteRoom, recalcRoom, moveStairs, appendFloor, populateFloor, addTrap,
         doorAt, trapAt, lPath, ensureConnected, inRoom } from '../engine/generator.js';
import { parseMapInput, buildImportedFloor, farStairs } from '../engine/importer.js';
import { updateVision } from '../engine/grid.js';
import { BEST, bestList } from '../data/bestiary.js';
import { ROOM_NAMES } from '../data/rooms.js';
import { pick, clamp, uid } from '../util/core.js';
import { goToMap, shelveForImport } from './maps.js';
import { isTraveller } from '../engine/maps.js';
import { buildFloor, buildAllFloors, ensureFloorViews } from '../render/floors.js';
import { syncTokens } from '../render/minis.js';
import { toast, showCard } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { changed, snapshot, dropSnapshot, loadState } from './session.js';
import { goFloor, nearestOpen } from './actions.js';
import { PROPS, propAt, HOUSES } from '../data/props.js';

const rebuild = (...Ls) => { for (const L of Ls) if (state.floors[L]) buildFloor(L); };
const keepTokens = L => state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone).map(t => ({ x:t.x, y:t.y }));

/* ---------- stone ---------- */
export function editTile(tile, mode){
  const f = state.floors[tile.floor], i = tile.y * f.W + tile.x, v = f.grid[i];
  if (v === T.DOWN || v === T.UP) return false;
  if (mode === 'rough' || mode === 'smooth'){
    const has = (f.rough ||= []).includes(i);
    if (mode === 'rough' && !has && walk(v)) f.rough.push(i); else if (mode === 'smooth' && has) f.rough = f.rough.filter(k => k !== i); else return false;
    return true;
  }
  if (mode === 'dig' && !walk(v)){ f.dug.push(i); f.filled = f.filled.filter(k => k !== i); }
  else if (mode === 'fill' && walk(v) && !tokenAt(tile.floor, tile.x, tile.y, false)){ f.filled.push(i); f.dug = f.dug.filter(k => k !== i); f.doors = f.doors.filter(d => d.i !== i); f.traps = f.traps.filter(t => t.i !== i); }
  else return false;
  carve(f, keepTokens(tile.floor)); return true;
}
export function paintRoom(tile, type){
  const f = state.floors[tile.floor], r = roomAt(f, tile.x, tile.y); if (!r){ toast('Tap inside a room.'); return; }
  snapshot('paint room');
  r.type = type; r.name = pick(ROOM_NAMES[type] || ROOM_NAMES.chamber); rebuild(tile.floor); changed(); renderPanel();
}

/* ---------- rooms ---------- */
// op = { kind:'move'|'resize'|'create', L, id?, rect }
export function commitRoom(op){
  const f = state.floors[op.L], r = op.id !== undefined ? roomById(f, op.id) : null;
  const problem = rectProblem(f, op.rect, r?.id);
  if (problem){ toast(problem); return false; }
  snapshot(op.kind === 'create' ? 'new room' : op.kind === 'move' ? 'move room' : 'resize room');
  const touched = [op.L];
  if (op.kind === 'create'){
    const nr = addRoom(f, op.rect, 'chamber'); ui.selRoom = nr.id;
    if (!f.autoLink) toast('Room added — auto-link is off, so draw a corridor to it.');
  } else if (op.kind === 'move'){
    const dx = op.rect.x - r.x, dy = op.rect.y - r.y;
    // tokens and stairs inside the room travel with it
    for (const t of state.tokens) if (t.floor === op.L && inRoom(r, t.x, t.y)){ t.x += dx; t.y += dy; }
    const stairs = [];
    if (f.down && inRoom(r, f.down.x, f.down.y)) stairs.push(['down', f.down.x + dx, f.down.y + dy]);
    if (f.up && inRoom(r, f.up.x, f.up.y)) stairs.push(['up', f.up.x + dx, f.up.y + dy]);
    for (const tr of f.traps) if (inRoom(r, tr.i % f.W, (tr.i / f.W) | 0)) tr.i += dy * f.W + dx;
    f.rough = (f.rough || []).map(i => inRoom(r, i % f.W, (i / f.W) | 0) ? i + dy * f.W + dx : i);   // its mud goes with it
    for (const p of f.props || []) if (inRoom(r, p.x, p.y)){ p.x += dx; p.y += dy; }                  // and its furniture
    Object.assign(r, op.rect, { free:true }); recalcRoom(r);
    for (const [dir, x, y] of stairs){
      const err = moveStairs(state.floors, op.L, dir, x, y);
      if (!err){ touched.push(dir === 'down' ? op.L + 1 : op.L - 1); toast(`The stairs ${dir} moved with the room — floor ${dir === 'down' ? op.L + 2 : op.L} follows.`); }
    }
  } else {
    if (f.down && inRoom(r, f.down.x, f.down.y) && !inRoom(op.rect, f.down.x, f.down.y)){ toast('Keep the stairs inside the room (or move the stairs first).'); return false; }
    if (f.up && inRoom(r, f.up.x, f.up.y) && !inRoom(op.rect, f.up.x, f.up.y)){ toast('Keep the stairs inside the room (or move the stairs first).'); return false; }
    Object.assign(r, op.rect, { free:true }); recalcRoom(r);
  }
  carve(f, keepTokens(op.L)); updateVision(); rebuild(...new Set(touched)); syncTokens(); changed(); renderPanel();
  return true;
}
export function removeRoom(L, id){
  const f = state.floors[L];
  snapshot('delete room');
  const err = deleteRoom(f, id); if (err){ dropSnapshot(); toast(err); return; }
  if (ui.selRoom === id) ui.selRoom = null;
  carve(f, keepTokens(L)); rebuild(L); changed(); renderPanel();
}
export function setAutoLink(L, on){
  const f = state.floors[L]; snapshot(on ? 'auto-link on' : 'auto-link off');
  if (!on){
    // bake the generated corridors into hand corridors so nothing moves
    for (const e of f.edges){ const a = roomById(f, e.a), b = roomById(f, e.b); if (a && b) f.corridors.push({ id:f.nextObj++, tiles:lPath(f, a.cx, a.cy, b.cx, b.cy, e.bend), baked:true }); }
    f.edges = []; f.autoLink = false; toast('Corridors frozen — they are yours to edit now. Shifts no longer rewire this floor.');
  } else { f.autoLink = true; f.corridors = f.corridors.filter(c => !c.baked); ensureConnected(f); toast('Auto-link on — rooms re-link themselves.'); }
  carve(f, keepTokens(L)); rebuild(L); changed(); renderPanel();
}

/* ---------- corridors ---------- */
// Orthogonal tiles from a to b (inclusive of b), for tracing with a finger or mouse.
export function traceStep(f, a, b){
  const out = []; let x = a % f.W, y = (a / f.W) | 0; const x1 = b % f.W, y1 = (b / f.W) | 0;
  while (x !== x1 || y !== y1){
    if (Math.abs(x1 - x) >= Math.abs(y1 - y)) x += Math.sign(x1 - x); else y += Math.sign(y1 - y);
    out.push(y * f.W + x);
  }
  return out;
}
export function commitCorridor(L, tiles){
  const f = state.floors[L], uniq = [...new Set(tiles)].filter(i => i % f.W > 0 && i % f.W < f.W - 1 && ((i / f.W) | 0) > 0 && ((i / f.W) | 0) < f.H - 1);
  if (uniq.length < 1) return;
  snapshot('draw corridor');
  f.corridors.push({ id:f.nextObj++, tiles:uniq });
  f.filled = f.filled.filter(i => !uniq.includes(i));
  carve(f, keepTokens(L)); updateVision(); rebuild(L); changed(); renderPanel();
}
// Erase: a door or trap on the tile, else the hand corridor through it, else a dug square.
export function eraseAt(tile){
  const f = state.floors[tile.floor], i = tile.y * f.W + tile.x;
  snapshot('erase');
  const hs = houseAt(f, tile.x, tile.y);
  if (hs){ f.buildings = f.buildings.filter(b => b !== hs); toast(`${hs.name} taken down.`); rebuild(tile.floor); changed(); return; }
  const pr = propAt(f, tile.x, tile.y);
  if (pr){ f.props = f.props.filter(p => p !== pr); toast(`${PROPS[pr.k]?.n || 'Prop'} removed.`); rebuild(tile.floor); changed(); return; }
  if (doorAt(f, i)){ f.doors = f.doors.filter(d => d.i !== i); toast('Door removed.'); }
  else if (trapAt(f, i)){ f.traps = f.traps.filter(t => t.i !== i); toast('Trap removed.'); }
  else {
    const c = f.corridors.find(c => c.tiles.includes(i));
    if (c){ f.corridors = f.corridors.filter(o => o !== c); toast('Corridor erased.'); }
    else if (f.dug.includes(i)){ f.dug = f.dug.filter(k => k !== i); toast('Dug square filled back in.'); }
    else if (f.autoLink && f.grid[i] === T.HALL) { toast('That is a generated corridor — turn auto-link off to edit it, or use Fill.'); return; }
    else { toast('Nothing to erase there.'); return; }
  }
  carve(f, keepTokens(tile.floor)); updateVision(); rebuild(tile.floor); changed(); renderPanel();
}

/* ---------- props: tap to place, tap again to turn ---------- */
export function placePropAt(tile, k = ui.propKind){
  const f = state.floors[tile.floor]; f.props ||= [];
  if (!PROPS[k]) return;
  snapshot('prop');
  const p = propAt(f, tile.x, tile.y);
  if (p){ if (p.fallen || p.broken) return; p.rot = ((p.rot || 0) + 1) % 4; f.propsV = (f.propsV || 0) + 1; }   // its footprint turned: movement re-reads it (a toppled or smashed piece stays put)
  else f.props.push({ id:f.nextObj++, k, x:tile.x, y:tile.y, rot:0 });
  rebuild(tile.floor); changed();
}

/* ---------- houses: solid buildings on rock; tap one again to turn its door ---------- */
export const houseAt = (f, x, y) => (f.buildings || []).find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
export function placeHouseAt(tile, kind = ui.houseKind){
  const f = state.floors[tile.floor], hk = HOUSES[kind]; if (!hk) return;
  f.buildings ||= [];
  const b0 = houseAt(f, tile.x, tile.y);
  if (b0){ snapshot('house'); b0.door = { n:'e', e:'s', s:'w', w:'n' }[b0.door || 's']; rebuild(tile.floor); changed(); return; }
  const r = { x:tile.x, y:tile.y, w:hk.w, h:hk.h };
  if (r.x + r.w > f.W - 1 || r.y + r.h > f.H - 1){ toast('Not enough room at the edge of the map.'); return; }
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++)
    if (walk(f.grid[y * f.W + x]) || houseAt(f, x, y)){ toast('Houses stand on solid ground — tap bare rock (the house fills squares to the right and down).'); return; }
  snapshot('house');
  const { n, w, h, ...flags } = hk;
  f.buildings.push({ ...r, name:n, door:'s', ...flags, ...(ui.houseDark ? { dark:true } : {}) });
  rebuild(tile.floor); changed();
}

/* ---------- doors, traps, stairs ---------- */
export function placeDoorAt(tile, st = ui.doorState){
  const f = state.floors[tile.floor], i = tile.y * f.W + tile.x, v = f.grid[i];
  if (!walk(v) || v === T.UP || v === T.DOWN){ toast('Doors go on open floor — a corridor mouth is best.'); return; }
  snapshot('door');
  const dr = doorAt(f, i);
  if (dr){ if (dr.state === st){ f.doors = f.doors.filter(d => d !== dr); toast('Door removed.'); } else { dr.state = st; dr.auto = false; } }
  else f.doors.push({ id:f.nextObj++, i, state:st, dc:15 });
  updateVision(); rebuild(tile.floor); changed();
}
export function placeTrapAt(tile, kind = ui.trapKind){
  const f = state.floors[tile.floor], i = tile.y * f.W + tile.x;
  if (!walk(f.grid[i]) || f.grid[i] === T.UP || f.grid[i] === T.DOWN){ toast('Traps go on open floor.'); return; }
  snapshot('trap');
  const tr = trapAt(f, i);
  if (tr){ if (tr.kind === kind){ f.traps = f.traps.filter(t => t !== tr); toast('Trap removed.'); } else { tr.kind = kind; tr.armed = true; } }
  else addTrap(f, i, kind);
  rebuild(tile.floor); changed();
}
export function placeStairsAt(tile, dir){
  const f = state.floors[tile.floor], i = tile.y * f.W + tile.x;
  if (dir === 'down' && !state.floors[tile.floor + 1]){ toast('This is the bottom floor — add a floor below first.'); return; }
  if (dir === 'up' && tile.floor === 0){ toast('Nothing above the first floor.'); return; }
  if (f.doors.some(d => d.i === i) || f.traps.some(t => t.i === i)){ toast('Clear the door or trap off that square first.'); return; }
  snapshot('move stairs');
  const err = moveStairs(state.floors, tile.floor, dir, tile.x, tile.y);
  if (err){ toast(err); return; }
  const other = dir === 'down' ? tile.floor + 1 : tile.floor - 1;
  updateVision(); rebuild(tile.floor, other); changed();
  toast(`Stairs ${dir} moved — floor ${other + 1} lines up with them.`);
}

/* ---------- floors ---------- */
export function addFloorBelow(themeId){
  snapshot('add floor');
  const f = appendFloor(state.floors, state.meta, themeId ? { theme:themeId } : {});
  state.explored[f.level] = new Set();
  ensureFloorViews(); rebuild(f.level - 1, f.level); updateVision(); changed();
  toast(`${f.name} added as floor ${f.level + 1}.`);
  return f;
}
export function removeBottomFloor(){
  if (state.floors.length <= 1){ toast('A delve needs at least one floor.'); return; }
  const L = state.floors.length - 1;
  snapshot('remove floor');
  state.tokens = state.tokens.filter(t => t.floor !== L || t.kind !== 'monster');
  for (const t of state.tokens) if (t.floor === L){ t.floor = L - 1; const s = state.floors[L - 1].down; if (s){ const o = nearestOpen(L - 1, s.x, s.y) || s; t.x = o.x; t.y = o.y; } }
  state.floors.pop(); delete state.explored[L];
  const last = state.floors[L - 1]; last.down = null; carve(last);
  state.meta.floors = state.floors.length;
  ensureFloorViews(); if (ui.floor >= state.floors.length) goFloor(state.floors.length - 1, false);
  rebuild(L - 1); updateVision(); changed();
}
export function populate(L){
  snapshot('populate');
  const placed = populateFloor(state.floors[L], L, Math.random, !!state.floors[L].boss || L === state.floors.length - 1);
  syncTokens(); changed(); renderPanel();
  toast(placed.length ? `${placed.length} creatures placed on ${state.floors[L].name}.` : 'No room for anything to live here.');
}
export function clearMonsters(L){
  snapshot('clear monsters');
  state.tokens = state.tokens.filter(t => !(t.floor === L && t.kind === 'monster'));
  state.combat.order = state.combat.order.filter(id => state.tokens.some(t => t.id === id));
  changed(); renderPanel();
}

/* ---------- new delves & import ---------- */
// The campaign desk and the players' characters live above any one dungeon: they travel to the next delve.
function carryCampaign(s){ if (!state) return; if (state.campaign) s.campaign = state.campaign; if (state.characters) s.characters = state.characters; s.dread = state.dread; s.grasp = state.grasp; }
/* A new map. With the party (the usual way): the map being left goes on the shelf (Maps tab) and the party
   travels — through game/maps.js, which also reuses a map already built under the same key. Without it
   (a new campaign, the e2e arena): a clean start that keeps only the campaign desk and the art. */
export function newDelve(meta, keepParty = true, { key = null, kind = null, party = 'bring', fresh = false } = {}){
  if (state && keepParty) return goToMap({ meta, key, kind:kind || (meta.template === 'journey' ? 'road' : 'delve'), party, fresh });
  const art = state?.art || {}, content = state?.content;
  const s = newState(meta);
  s.art = art; if (content) s.content = content; carryCampaign(s);
  s.meta.mapId = uid(); s.meta.kind = kind || 'delve'; s.meta.key = key;
  loadState(s);
}
// mode 'floor' replaces the current floor; mode 'delve' starts a new delve from every floor in the file.
export function importMap(text, mode = 'floor'){
  let parsed;
  try { parsed = parseMapInput(text); } catch (e){ toast(e.message); return false; }
  const warnings = [...parsed.warnings];
  const bestByName = name => { const n = String(name || '').toLowerCase().replace(/\s+\d+$/, ''); return bestList().find(b => b.id === n || b.name.toLowerCase() === n) || bestList().find(b => n && (b.name.toLowerCase().includes(n) || n.includes(b.id))); };
  const placeTokens = (list, L) => {
    for (const it of list){
      const f = state.floors[L]; if (!walk(f.grid[it.y * f.W + it.x])) continue;
      const pc = state.tokens.find(t => t.kind !== 'monster' && t.name.toLowerCase() === String(it.name).toLowerCase());
      if (pc){ Object.assign(pc, { floor:L, x:it.x, y:it.y }); continue; }
      const b = BEST[it.bid] || bestByName(it.bid) || bestByName(it.name);
      if (b) state.tokens.push(Object.assign(makeMonster(b.id, L, it.x, it.y), it.hp ? { hp:it.hp, maxHp:it.hp } : {}, it.ac ? { ac:it.ac } : {}));
      else if (it.kind === 'pc'){ const t = makePC({ name:it.name }); Object.assign(t, { floor:L, x:it.x, y:it.y }); state.tokens.push(t); }
      else warnings.push(`Skipped token "${it.name}" — no matching creature.`);
    }
  };
  if (mode === 'floor'){
    const L = ui.floor, old = state.floors[L];
    snapshot('import floor');
    const link = { up:L > 0 ? state.floors[L - 1].down : null };
    if (state.floors[L + 1]) link.down = state.floors[L + 1].up;
    const pick0 = parsed.floors[parsed.active || 0];
    const { floor, warnings:w, tokens } = buildImportedFloor(pick0, L, state.meta.size, old.theme, link);
    warnings.push(...w);
    floor.name = pick0.name || old.name;
    state.floors[L] = floor; state.explored[L] = new Set();
    state.tokens = state.tokens.filter(t => !(t.floor === L && t.kind === 'monster'));
    for (const t of state.tokens) if (t.floor === L && !walk(floor.grid[t.y * floor.W + t.x])){ const o = nearestOpen(L, floor.rooms[0].cx, floor.rooms[0].cy); if (o){ t.x = o.x; t.y = o.y; } }
    placeTokens(tokens, L);
    updateVision(); rebuild(L); syncTokens(); changed(); renderPanel();
  } else {
    const size = Math.max(32, ...parsed.floors.map(f => Math.max(f.W, f.H)));
    if (size > 96) warnings.push('Maps over 96 squares are cropped.');
    const S = Math.min(96, Math.ceil(size / 8) * 8);
    const s = newState({ seed:parsed.name || 'imported', floors:1, size:S, name:parsed.name || 'Imported Delve', template:'blank' });
    s.floors = [];
    parsed.floors.forEach((pf, L) => {
      const link = { up:L > 0 ? s.floors[L - 1].down : null };
      const { floor, warnings:w, tokens } = buildImportedFloor(pf, L, S, L % 4, link);
      warnings.push(...w);
      if (L < parsed.floors.length - 1 && !floor.down){ floor.down = farStairs(floor); carve(floor); }
      if (L === parsed.floors.length - 1 && floor.down){ floor.down = null; carve(floor); }
      floor._tokens = tokens; s.floors.push(floor);
    });
    s.meta.floors = s.floors.length; s.explored = {}; s.floors.forEach((_, L) => s.explored[L] = new Set());
    const r0 = s.floors[0].rooms[0], party = state ? state.tokens.filter(isTraveller) : s.tokens;
    s.tokens = party.map((t, i) => { const p = { ...t, floor:0, dead:false, conds:[], flags:{} }; p.x = clamp(r0.x + i % 3, r0.x, r0.x + r0.w - 1); p.y = clamp(r0.y + Math.floor(i / 3), r0.y, r0.y + r0.h - 1); return p; });
    s.art = state?.art || {}; if (state?.content) s.content = state.content;
    if (state){ shelveForImport(); carryCampaign(s); }
    s.meta.mapId = uid(); s.meta.kind = 'imported';
    loadState(s);
    s.floors.forEach((f, L) => { placeTokens(f._tokens || [], L); delete f._tokens; });
    for (const t of state.tokens) if (!walk(state.floors[t.floor].grid[t.y * state.meta.size + t.x])){ const o = nearestOpen(t.floor, r0.cx, r0.cy); if (o){ t.x = o.x; t.y = o.y; } }
    updateVision(); buildAllFloors(); syncTokens(); changed();
  }
  log(`Map imported (${parsed.floors.length} floor${parsed.floors.length === 1 ? '' : 's'}).`);
  showCard({ kind:'', title:'Map imported', sub:`${parsed.floors.length} floor${parsed.floors.length === 1 ? '' : 's'}`, lines:warnings.length ? warnings.map(w => `• ${w}`) : ['Everything came across cleanly.'] }, false);
  return true;
}
export function randomSeed(){ return pick(['ash', 'bell', 'silver', 'hollow', 'font', 'wick', 'marrow', 'choir', 'tithe', 'vein', 'brine', 'spore']) + '-' + pick(['saint', 'hands', 'seep', 'tallow', 'nave', 'shaft', 'undertow', 'tide', 'husk']) + '-' + (100 + Math.floor(Math.random() * 900)); }
