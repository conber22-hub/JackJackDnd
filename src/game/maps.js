/* MAPS IN PLAY — moving the table from one map to another without losing any of them. The map being left goes
   on the shelf (state.campaign.maps, see engine/maps.js) as it stands; the map being opened comes off the shelf
   if it's been built before (a session's dungeon, a place in the Valley…) or is built fresh. The party comes too
   and arrives where it last stood there, or at the way in.
   Setting up: the DM can open a map *without* the party (prep). The party waits where it was
   (state.campaign.away), the players' screens hold still under a veil until the DM brings the party over or
   goes back to them. */
import { state, ui, newState, log } from '../engine/state.js';
import { isTraveller, packMap, arrivalAnchor, arrivalSpots, trimRoads } from '../engine/maps.js';
import { uid } from '../util/core.js';
import { toast, showCard } from '../ui/hud.js';
import { loadState, deserialize, changed, broadcast } from './session.js';
import { freshTurn } from './moves.js';
import { updateVision } from '../engine/grid.js';
import { rebuildFog, goFloor } from './actions.js';
import { syncTokens } from '../render/minis.js';
import { focusTile } from '../render/scene.js';

export const library = () => (state.campaign.maps ||= {});
export const away = () => state?.campaign?.away || null;
// Is a map with this key loaded now ('here'), on the shelf ('shelf'), or never built (null)?
export const mapStatus = key => !key || !state ? null : state.meta.key === key ? 'here' : Object.values(state.campaign.maps || {}).some(e => e.key === key) ? 'shelf' : null;
export function ensureMapId(){ state.meta.mapId ||= uid(); state.meta.kind ||= state.meta.template === 'journey' ? 'road' : 'delve'; return state.meta.mapId; }

// Put the loaded map on the shelf. → the travellers who were on it (the party, if it was here)
export function shelveForImport(){ return shelve(); }
function shelve(){
  ensureMapId();
  if (state.combat.active){ log('The fight is left where it stands.'); state.combat = { active:false, order:[], idx:0, round:1, floor:0 }; }
  const lib = library(), prev = lib[state.meta.mapId], e = packMap(state);
  if (!e.left && prev?.left) e.left = prev.left;
  lib[state.meta.mapId] = e;
  return state.tokens.filter(isTraveller);
}
// What the campaign carries from map to map (the desk, the characters, the Gaze, the art, the edited tables).
const carried = () => ({ campaign:state.campaign, characters:state.characters, dread:state.dread, grasp:state.grasp, art:state.art, content:state.content, march:state.march, log:state.log });

// Lay the party out around a spot, marching order first. Mutates the tokens.
function settle(s, party, at){
  const L = s.floors[at.floor] ? at.floor : 0, f = s.floors[L], ids = s.march || [], rank = t => { const k = ids.indexOf(t.id); return k < 0 ? 1e6 + party.indexOf(t) : k; };
  const order = [...party].sort((a, b) => rank(a) - rank(b));
  const others = s.tokens.filter(t => !party.includes(t) && !t.dead && !t.flags?.gone && t.floor === L);
  const occ = (x, y) => others.some(o => x >= o.x && x < o.x + (o.size || 1) && y >= o.y && y < o.y + (o.size || 1));
  const spots = arrivalSpots(f, at, order.length, occ);
  order.forEach((t, i) => { const p = spots[i] || spots[spots.length - 1] || at; Object.assign(t, { floor:L, x:p.x, y:p.y }); freshTurn(t); });
}

/* Go to a map. id: one on the shelf. key: a map built from `meta` (reused from the shelf if one has that key,
   unless fresh). party: 'bring' (they travel and arrive), 'stay' (prep: they wait where they are), 'drop' (a
   new start: the old party is left out). → the new state */
export function goToMap({ id = null, key = null, meta = null, kind = 'delve', party = 'bring', fresh = false, at = null } = {}){
  const fromId = ensureMapId(), fromName = state.meta.name, here = shelve(), lib = library();
  if (fresh && key) for (const e of Object.values(lib)) if (e.key === key) delete lib[e.id];
  const entry = id ? lib[id] : key ? Object.values(lib).find(e => e.key === key) : null;
  if (!entry && !meta){ toast('That map is no longer on the shelf.'); return null; }
  const c = carried(), waiting = c.campaign.away;
  let s;
  if (entry){
    s = deserialize({ v:2, meta:{ ...entry.meta, left:entry.left }, floors:entry.floors, explored:entry.explored, tokens:entry.tokens, seats:{}, march:c.march, grasp:c.grasp, content:c.content, dread:c.dread });
    Object.assign(s, c);   // the same desk, characters and art, not copies
    delete lib[entry.id];
  } else {
    const travellers = here.length ? here : waiting?.tokens || [];
    s = newState({ ...meta, party:travellers.length ? false : meta.party });
    Object.assign(s, c); s.meta.mapId = uid(); s.meta.key = key; s.meta.kind = kind;
  }
  s.combat = { active:false, order:[], idx:0, round:1, floor:0 };
  // the party: back where they waited, brought over, or left behind
  let msg = '';
  if (waiting && s.meta.mapId === waiting.mapId){ s.tokens.push(...waiting.tokens); s.campaign.away = null; msg = 'Back with the party.'; }
  else if (party === 'bring'){
    const travellers = here.length ? here : waiting?.tokens || [];
    if (travellers.length){ settle(s, travellers, at || arrivalAnchor(entry || s)); s.tokens.push(...travellers); }
    s.campaign.away = null;
  } else if (party === 'stay'){
    if (here.length) s.campaign.away = { mapId:fromId, name:fromName, tokens:JSON.parse(JSON.stringify(here)) };
    msg = `Setting up ${s.meta.name}. The party waits in ${s.campaign.away?.name || fromName}; the players' screens hold still.`;
  }
  // players keep their seats wherever their heroes are
  s.seats = Object.fromEntries(Object.entries(state.seats || {}).filter(([, tid]) => s.tokens.some(t => t.id === tid) || s.campaign.away?.tokens.some(t => t.id === tid)));
  const gone = trimRoads(s.campaign.maps || {});
  loadState(s);
  if (gone.length) log(`Old road maps cleared from the shelf (${gone.length}).`, true);
  if (msg) toast(msg);
  log(`🗺 ${away() ? 'Setting up' : 'The table moves to'} ${s.meta.name}.`, true);
  prepSignal();
  return s;
}
export const returnToParty = () => away() && goToMap({ id:away().mapId });
export function bringPartyHere(at = null){
  const w = away(); if (!w) return;
  settle(state, w.tokens, at || arrivalAnchor(state));
  state.tokens.push(...w.tokens); state.campaign.away = null;
  updateVision(); rebuildFog(); syncTokens();
  const lead = w.tokens[0]; if (lead){ goFloor(lead.floor, false); focusTile(lead.floor, lead.x, lead.y); }
  log(`🗺 The party arrives at ${state.meta.name}.`);
  prepSignal(); changed();
}
// Move every traveller on this map to a spot (the 📍 tool): the party regroups there in marching order.
export function moveParty(L, x, y){
  const party = state.tokens.filter(t => isTraveller(t) && !t.dead && !t.flags?.gone);
  if (!party.length){ bringPartyHere({ floor:L, x, y }); return; }
  const others = state.tokens.filter(t => !party.includes(t));
  settle({ floors:state.floors, tokens:others, march:state.march }, party, { floor:L, x, y });
  updateVision(); rebuildFog(); syncTokens(); goFloor(L, false);
  log(`🗺 The party gathers on ${state.floors[L].name}.`, true); changed();
}
export function forgetMap(id){
  if (away()?.mapId === id){ toast('The party is waiting there — go back to them first.'); return; }
  delete library()[id]; changed();
}
// The players' veil: while the DM sets up a map without the party, their screens hold still.
let veiled = false;
export function prepSignal(){
  const on = !!away();
  if (on !== veiled){ veiled = on; broadcast({ t:'prep', on, text:on ? 'The DM is setting the scene…' : '' }); }
}
// Show the library in a card when nothing else explains where everyone went.
export function whereIsEveryone(){ const w = away(); if (w) showCard({ kind:'', title:'Setting up', sub:state.meta.name, lines:[`The party waits in <b>${w.name}</b>.`, 'Bring them here (📍) or go back to them from the Maps tab.'] }, false); }
