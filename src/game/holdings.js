/* 🏰 A PLACE OF THEIR OWN — the party's camp, house, homestead, outpost, fort or keep (engine/holdings.js, Codex's),
   on a map of the DM's choosing. The DM founds it (its bounds drawn around the party), places modules on the grid
   (walls on the edge, workshops inside a building), and the work goes on as days pass: the party and hired folk
   build, the stores pay. The Count notices a rich, lightly held place: a raid by one of his court comes, and is met
   or not. Modules are drawn on the map with the app's props (the Build tab's Camp & keep pieces), so the minis walk
   among them and the players see what's been built. State: state.campaign.holdings (never sent to players). */
import { state, ui, log } from '../engine/state.js';
import { KINDS, MODULES, MODULE_BY_ID as MOD } from '../data/holdings.js';
import { canPlace, startWork, advance, stats, grow, raidCheck, resolveRaid } from '../engine/holdings.js';
import { PROPS } from '../data/props.js';
import { mulberry32, hashSeed } from '../util/core.js';
import { toast, showCard } from '../ui/hud.js';
import { changed } from './session.js';
import { ensureMapId, mapHooks } from './maps.js';
import { buildFloor } from '../render/floors.js';
import { court, dayHooks } from './court.js';

export { KINDS, MODULES };
export const KIND_NAMES = { camp:'⛺ Camp', house:'🏠 House', homestead:'🌾 Homestead', outpost:'🗼 Outpost', fort:'🏯 Fort', keep:'🏰 Keep' };
export const holdings = () => (state.campaign.holdings ||= []);
export const holdingHere = (L = ui.floor) => holdings().find(h => h.map === state.meta.mapId && h.floor === L) || null;
export const holdingById = id => holdings().find(h => h.id === id) || null;
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|hold|${Date.now()}|${tick++}`));
const day = () => state.campaign?.valley?.day ?? 0;
const floorOf = h => h.map === state.meta.mapId ? state.floors[h.floor] : null;   // only the map that's open can be drawn on

/* ---------- founding ---------- */
// The bounds a holding of this kind may take, centred on (cx, cy) and kept on the map.
export function boundsAt(kind, L, cx, cy){
  const f = state.floors[L], k = KINDS[kind], w = Math.min(k.w, f.W - 2), h = Math.min(k.h, f.H - 2);
  return { x:Math.max(1, Math.min(f.W - 1 - w, cx - (w >> 1))), y:Math.max(1, Math.min(f.H - 1 - h, cy - (h >> 1))), w, h };
}
export function found(kind = 'camp', name = '', L = ui.floor){
  if (holdingHere(L)){ toast('There is already a holding on this floor.'); return null; }
  const f = state.floors[L], hero = state.tokens.find(t => t.floor === L && t.kind === 'pc' && !t.dead);
  const cx = hero ? hero.x : f.rooms?.[0]?.cx ?? f.W >> 1, cy = hero ? hero.y : f.rooms?.[0]?.cy ?? f.H >> 1;
  const h = { id:`hold-${Date.now().toString(36)}${tick++}`, name:name.trim() || `${state.meta.name || 'The'} ${kind}`.replace(/^The camp$/, 'The camp'), kind,
    place:state.meta.name || '', map:ensureMapId(), floor:L, bounds:boundsAt(kind, L, cx, cy), modules:[], projects:[], stores:{ timber:30, stone:0, salt:0, gp:0 }, workers:[], hired:[], founded:day(), partyWorks:true, log:[] };
  holdings().push(h);
  log(`🏰 ${h.name} is founded: a ${kind} on ${h.place || 'this map'}.`);
  changed(); return h;
}
export function moveBounds(id, L, x, y){
  const h = holdingById(id); if (!h) return;
  if (h.modules.length){ toast('Its bounds are fixed once something stands there.'); return; }
  h.bounds = boundsAt(h.kind, L, x, y); changed();
}
export function abandon(id){
  const h = holdingById(id); if (!h) return;
  const f = floorOf(h); if (f){ f.props = (f.props || []).filter(p => p.hold !== h.id); buildFloor(h.floor); }
  holdings().splice(holdings().indexOf(h), 1);
  log(`🏰 ${h.name} is abandoned.`); changed();
}

/* ---------- placing ---------- */
// The floor as canPlace reads it: what's walkable, minus the squares where props that aren't the holding's stand.
function placeFloor(h){
  const f = floorOf(h); if (!f) return null;
  const filled = [...(f.filled || [])];
  for (const p of f.props || []) if (p.hold !== h.id && !p.broken) for (const i of propSquares(f, p)) filled.push(i);
  return { W:f.W, H:f.H, grid:f.grid, filled };
}
function propSquares(f, p){
  const d = PROPS[p.k] || { w:1, h:1 }, turned = (p.rot || 0) % 2, w = turned ? d.h : d.w, hh = turned ? d.w : d.h, out = [];
  for (let y = p.y; y < p.y + hh; y++) for (let x = p.x; x < p.x + w; x++) out.push(y * f.W + x);
  return out;
}
// a workshop or room set inside a building keeps off its walls (they're drawn on the edge squares)
function clearOfWalls(h, m, at){
  if (m.on !== 'inside') return true;
  const r = rect(m, at);
  return (h.modules || []).some(p => p.built && p.hp > 0 && MOD[p.module]?.gives.building && WALLED.has(p.module) && (() => { const b = rect(MOD[p.module], p); return r.x > b.x && r.y > b.y && r.x + r.w < b.x + b.w && r.y + r.h < b.y + b.h; })());
}
const rect = (m, at) => ({ x:at.x, y:at.y, w:(at.rot || 0) % 180 ? m.footprint.h : m.footprint.w, h:(at.rot || 0) % 180 ? m.footprint.w : m.footprint.h });
const WALLED = new Set(['cottage', 'hall', 'bunkhouse']);
// Could this module go here? → { ok, why }
export function check(id, moduleId, x, y, rot = 0){
  const h = holdingById(id), m = MOD[moduleId]; if (!h || !m) return { ok:false, why:'Choose a module.' };
  const fl = placeFloor(h); if (!fl) return { ok:false, why:'Open the holding\'s map first.' };
  const r = canPlace(h, m, { x, y, rot }, fl);
  if (!r.ok) return r;
  if (!clearOfWalls(h, m, { x, y, rot })) return { ok:false, why:'Inside a finished cottage, hall or bunkhouse, one square in from its walls.' };
  const short = Object.entries(m.materials).filter(([k, n]) => (h.stores[k] || 0) < n);
  if (short.length) return { ok:false, why:`Not enough in the stores: ${short.map(([k, n]) => `${n} ${k} (have ${h.stores[k] || 0})`).join(', ')}.` };
  return { ok:true, why:'' };
}
export const footprint = (moduleId, x, y, rot = 0) => { const m = MOD[moduleId]; if (!m) return []; const r = rect(m, { x, y, rot }), out = []; for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) out.push([i, j]); return out; };

export function place(id, moduleId, x, y, rot = 0){
  const h = holdingById(id), c = check(id, moduleId, x, y, rot);
  if (!c.ok){ toast(c.why); return false; }
  const r = startWork(h, moduleId, { x, y, rot, floor:placeFloor(h) });
  if (!r.ok){ toast(r.why); return false; }
  Object.assign(h, r.holding);
  log(`🏰 Work begins on a ${MOD[moduleId].n.toLowerCase()} at ${h.name}.`, true);
  draw(h); changed(); return true;
}
export function repair(id, modId){
  const h = holdingById(id), p = h?.modules.find(x => x.id === modId); if (!p) return;
  const r = startWork(h, p.module, { repairId:p.id });
  if (!r.ok){ toast(r.why); return; }
  Object.assign(h, r.holding); log(`🏰 Repairs begin on the ${MOD[p.module].n.toLowerCase()}.`, true); draw(h); changed();
}
// Take an unfinished module down (its materials come back).
export function cancel(id, modId){
  const h = holdingById(id), p = h?.modules.find(x => x.id === modId); if (!p || p.built) return;
  for (const [k, n] of Object.entries(MOD[p.module].materials)) h.stores[k] = (h.stores[k] || 0) + n;
  h.modules = h.modules.filter(x => x !== p); h.projects = h.projects.filter(x => x.target !== p.id);
  draw(h); changed();
}

/* ---------- the map: modules drawn as props ---------- */
// Each module's pieces: [prop kind, dx, dy, rot] in the module's own frame (before its quarter turn).
const line = (k, n) => Array.from({ length:n }, (_, i) => [k, i, 0, 0]);
const ring = (k, w, h) => { const out = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && !(y === h - 1 && x === (w >> 1))) out.push([k, x, y, 0]); return out; };   // a door gap mid-south
const PIECES = {
  palisade:line('palisade', 4), 'stone-wall':line('stonewall', 4), gate:[['palgate', 0, 0, 0]], watchtower:[['watchtower', 0, 0, 0], ['woodpile', 1, 1, 0]],
  ditch:line('rubble', 4), 'salt-line':line('saltline', 4), 'bedroll-ring':[['campfire', 0, 0, 0], ['bedroll', 1, 0, 0], ['bedroll', 0, 1, 0], ['bedroll', 1, 1, 0]],
  tent:[['tent', 0, 0, 0]], cottage:ring('stonewall', 4, 4), hall:ring('stonewall', 6, 6), bunkhouse:ring('palisade', 4, 4),
  kitchen:[['hearth', 0, 0, 0], ['cauldron', 1, 0, 0]], stable:[['stable', 0, 0, 0], ['woodpile', 2, 2, 0]], 'wagon-shed':[['stable', 0, 0, 0], ['stable', 2, 0, 0]],
  storehouse:[['crate', 0, 0, 0], ['barrel', 1, 0, 0], ['crate', 2, 0, 0], ['barrel', 0, 2, 0], ['crate', 2, 2, 0]], cellar:[['barrel', 0, 0, 0], ['barrel', 1, 1, 0]],
  forge:[['forge', 0, 0, 0], ['woodpile', 0, 1, 0]], carpenter:[['workbench', 0, 0, 0], ['woodpile', 1, 1, 0]], alchemist:[['alchemy', 0, 0, 0]],
  shrine:[['shrine', 0, 0, 0], ['candelabra', 1, 1, 0]], library:[['bookshelf', 0, 0, 0], ['bookshelf', 1, 0, 0]], garden:[['garden', 0, 0, 0], ['fence', 2, 0, 0], ['fence', 2, 1, 0], ['fence', 2, 2, 0]], well:[['barrel', 0, 0, 0]],
};
function pieceAt(m, p, [k, dx, dy, r]){
  const turned = (p.rot || 0) % 180;
  const d = PROPS[k] || { w:1, h:1 };
  return { k, x:p.x + (turned ? dy : dx), y:p.y + (turned ? dx : dy), rot:(r + (turned ? 1 : 0)) % 4, d };
}
// Redraw a holding's props on its floor (when it's the open map): built modules whole, unbuilt ones as a woodpile
// where the work is, and destroyed ones as debris.
export function draw(h){
  const f = floorOf(h); if (!f) return;
  f.props = (f.props || []).filter(p => p.hold !== h.id);
  for (const p of h.modules){
    const m = MOD[p.module]; if (!m) continue;
    if (!p.built){ f.props.push({ id:f.nextObj++, k:'woodpile', x:p.x, y:p.y, rot:0, hold:h.id, mod:p.id }); continue; }
    for (const piece of PIECES[p.module] || [['crate', 0, 0, 0]]){
      const q = pieceAt(m, p, piece), turned = q.rot % 2, w = turned ? q.d.h : q.d.w, hh = turned ? q.d.w : q.d.h;
      if (q.x + w > f.W || q.y + hh > f.H) continue;
      f.props.push({ id:f.nextObj++, k:q.k, x:q.x, y:q.y, rot:q.rot, hold:h.id, mod:p.id, ...(p.hp <= 0 ? { broken:true } : {}) });
    }
  }
  f.propsV = (f.propsV || 0) + 1;
  buildFloor(h.floor);
}
// A map opened again: its holding's props are drawn from the holding (in case they were changed while away).
export function drawHere(){ for (const h of holdings()) if (h.map === state.meta.mapId) draw(h); }
mapHooks.push(drawHere);

/* ---------- days: building, upkeep, raids ---------- */
// Who works today: the party (if they're here and the DM says so) and the hired folk.
function crew(h){
  const party = h.partyWorks && h.map === state.meta.mapId ? state.tokens.filter(t => t.kind === 'pc' && t.floor === h.floor && !t.dead && !t.flags?.gone).map(t => ({ id:t.id, role:'hero' })) : [];
  return [...party, ...(h.hired || [])];
}
export function workDays(id, days = 1){
  const h = holdingById(id); if (!h) return null;
  // hired hands are paid first: 1 gp a day each, from the stores
  const wages = (h.hired?.length || 0) * days;
  if (wages && (h.stores.gp || 0) < wages){ toast(`The hired hands want ${wages} gp and the stores have ${h.stores.gp || 0}: they won't work.`); }
  const paid = wages && (h.stores.gp || 0) >= wages;
  if (paid) h.stores.gp -= wages;
  const workers = paid ? crew(h) : crew(h).filter(w => w.role === 'hero');
  const r = advance(h, { days, workers, gold:h.stores.gp || 0 }, rng());
  if (!r.ok){ toast(r.why); return null; }
  Object.assign(h, r.holding); h.stores.gp = Math.max(0, (h.stores.gp || 0) - r.spentGold);
  const lines = [];
  for (const id2 of r.finished){ const p = h.modules.find(x => x.id === id2); lines.push(`The ${MOD[p.module].n.toLowerCase()} is finished.`); }
  for (const e of r.events){
    if (e.kind === 'eyes'){
      const spy = e.worker && (h.hired || []).find(w => w.id === e.worker), m = e.member && court()?.members.find(x => x.id === e.member);
      lines.push(`A worker saw a figure in the trees.${spy && m ? ` (DM: ${spy.name} is ${m.name}'s eyes.)` : ''}`);
    } else lines.push(e.text);
  }
  if (r.spentGold) lines.push(`${r.spentGold} gp paid from the stores for materials and labour.`);
  if (!workers.length) lines.push('Nobody worked: bring the party here, or hire hands (and keep gold in the stores for their wages).');
  h.log = [...(h.log || []), ...lines.map(t => `Day ${day() + 1}: ${t}`)].slice(-30);
  if (lines.length) showCard({ kind:'', title:`🏰 ${h.name}`, lines }, false);
  draw(h); changed();
  return r;
}
// Hire one of the folk on this floor (a person of the valley, who may be one of the Count's eyes).
export function hire(id, person){
  const h = holdingById(id); if (!h || !person) return;
  if ((h.hired || []).some(w => w.id === person.id)) return;
  (h.hired ||= []).push({ id:person.id, name:person.name, role:person.role, ...(person.spy ? { spy:person.spy } : {}) });
  log(`🏰 ${person.name} is hired to work at ${h.name} (1 gp a day).`, true); changed();
}
export function dismiss(id, wid){ const h = holdingById(id); if (h){ h.hired = (h.hired || []).filter(w => w.id !== wid); changed(); } }
export function adjustStore(id, k, by){ const h = holdingById(id); if (h){ h.stores[k] = Math.max(0, (h.stores[k] || 0) + by); changed(); } }
export function growTo(id, kind){
  const h = holdingById(id); if (!h) return;
  const r = grow(h, kind); if (!r.ok){ toast(r.why); return; }
  Object.assign(h, r.holding);
  // the bigger bounds, kept on the map, around the old ones
  const f = floorOf(h); if (f){ const b = h.bounds; h.bounds = { ...b, x:Math.max(1, Math.min(f.W - 1 - b.w, b.x)), y:Math.max(1, Math.min(f.H - 1 - b.h, b.y)) }; }
  log(`🏰 ${h.name} grows into a ${kind}.`); showCard({ kind:'', title:`🏰 ${h.name} is a ${kind} now`, lines:['More room, and more it can hold.'] }); changed();
}

/* Each new day: the hired hands build (the party too, if they're there), the week's upkeep and income, and the
   Count may send someone. A raid waits for the DM: met (defenders) or let fall. */
function holdingsDay(){
  for (const h of holdings()){
    if (h.projects?.length && (h.hired?.length || (h.partyWorks && h.map === state.meta.mapId))) workDays(h.id, 1);
    if ((day() - (h.founded || 0)) % 7 === 6){
      const s = stats(h), net = s.income - s.upkeep;
      h.stores.gp = Math.max(0, (h.stores.gp || 0) + net);
      h.log = [...(h.log || []), `Week's end: ${s.income} gp in, ${s.upkeep} gp upkeep.`].slice(-30);
    }
    if (!h.raid){
      const raid = raidCheck(h, court(), { gaze:state.dread || 1, day:day() }, rng());
      if (raid){
        h.raid = raid; const m = court().members.find(x => x.id === raid.member);
        showCard({ kind:'', title:`⚔ ${h.name} is to be raided`, lines:[`${m?.name || 'One of the Count\'s court'} comes for it (strength ${raid.power}).`, 'Build tab → 🏰 A place of their own: meet it, or let it fall.'] }, false);
        log(`⚔ ${m?.name || 'The court'} moves against ${h.name}.`, true);
      }
    }
  }
}
dayHooks.push(holdingsDay);

// The raid comes: defenders (heroes there, hired hands) against the raider. Damage, loot, and the court remembers.
export function meetRaid(id, defenders){
  const h = holdingById(id); if (!h?.raid) return;
  const r = resolveRaid(h, h.raid, { defenders }, rng());
  if (!r.ok){ toast(r.why); h.raid = null; changed(); return; }
  const raid = h.raid;
  Object.assign(h, r.holding); h.raid = null;
  // the court's own copy follows (the raider's fate, their memory of the place)
  const C = court(), m = r.court.members.find(x => x.id === raid.member), mine = C.members.find(x => x.id === raid.member);
  if (m && mine) Object.assign(mine, m);
  const lines = [r.fate === 'fled' ? `${mine?.name || 'The raider'} is driven off.` : `${mine?.name || 'The raider'} has their way.`];
  for (const d of r.damage){ const p = h.modules.find(x => x.id === d.id); lines.push(`The ${MOD[p.module].n.toLowerCase()} is damaged (${d.amount})${p.hp <= 0 ? ' and falls' : ''}.`); }
  if (r.loot) lines.push(`${r.loot} gp taken from the stores.`);
  h.log = [...(h.log || []), ...lines.map(t => `Day ${day() + 1}: ${t}`)].slice(-30);
  showCard({ kind:'', title:`⚔ The raid on ${h.name}`, lines });
  draw(h); changed();
}
export const defendersAt = h => crew(h).length;
export { stats };
