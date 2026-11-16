/* ✨ FINDING THINGS (the Wanderer): glints on the ground (some seen only up close, by a sharp-eyed hero), gravestones,
   shrines, notices and carvings to read, barrels and chests worth one search. engine/finds-lite.js says where and what
   (ChatGPT's fuller engine, docs/chatgpt/finds.md, will take its place); this keeps them with the map (f.finds), so
   what's taken stays taken, and hands out what they give: coins, keepsakes, a healing draught, and torn pages for the
   journal. Ⓐ on (or beside) one does it (game/wander.js hereAction); render/glints.js draws the glints the hero sees. */
import { state } from '../engine/state.js';
import { placeFinds, noticed, outcome, pageById } from '../engine/finds-lite.js';
import { frontDoor } from '../engine/ways.js';
import { walk, T } from '../engine/tiles.js';
import { placeById } from '../engine/overland.js';
import { valley } from './overworld.js';
import { W, hero, gainLoot } from './wander.js';
import { showCard, toast } from '../ui/hud.js';
import { changed } from './session.js';

const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
// What kind of ground this floor is, for what's to be found on it
function kindOf(L){
  const tpl = state.meta.template;
  if (tpl === 'journey') return 'road';
  if (tpl === 'interior'){ const it = state.meta.interior; return it?.kind === 'church' ? 'church' : L === 0 && state.floors.length > 1 ? 'crypt' : 'interior'; }
  const p = placeById(valley().at), k = p?.kind;
  return k === 'village' ? 'village' : k === 'town' ? 'town' : k === 'castle' ? 'castle' : k === 'camp' ? 'camp' : 'woods';
}
// The floor as the finds engine reads it
function floorFor(L){
  const f = state.floors[L], open = [], path = [];
  for (let i = 0; i < f.grid.length; i++){ if (!walk(f.grid[i])) continue; const x = i % f.W, y = (i / f.W) | 0; open.push([x, y]); if (f.grid[i] === T.HALL) path.push([x, y]); }
  const props = (f.props || []).filter(p => !p.broken).map(p => ({ kind:p.k, x:p.x, y:p.y }));
  // (a building's doorstep, for a notice on its door)
  for (const b of f.buildings || []){ if (b.decay === 'abandoned' || b.decay === 'infested') continue; const s = frontDoor(b).steps[0]; if (s && walk(f.grid[s.y * f.W + s.x])) props.push({ kind:'house', x:s.x, y:s.y }); }
  const r0 = f.rooms?.[0];
  return { W:f.W, H:f.H, kind:kindOf(L), open, path, props, rooms:r0 ? [{ x:r0.x, y:r0.y, w:r0.w, h:r0.h }] : [] };
}
// The floor's finds, placed once (they stay with the map on the shelf)
export function ensureFinds(L){
  const f = state.floors[L]; if (!f || f.finds) return f?.finds || [];
  try { f.finds = placeFinds(floorFor(L), { seed:`${state.meta.seed}|${state.meta.mapId || ''}|${L}`, gaze:state.dread || 1 }); } catch (e){ console.warn(e); f.finds = []; }
  return f.finds;
}
const passiveOf = t => t?.passive || 10;
// The glints the hero can see now (for render/glints.js); a hidden one seen for the first time says so
export function glintsSeen(){
  const t = hero(); if (!t) return [];
  const list = ensureFinds(t.floor).filter(fd => fd.kind === 'glint' && !fd.done && noticed(fd, { passive:passiveOf(t), dist:cheb(fd, t) }));
  for (const fd of list) if (fd.hidden && !fd.spotted){ fd.spotted = true; toast('✨ Something glints, right by your feet.'); }
  return list;
}
// What Ⓐ would take up here: a glint, something to search, something to read (beside the hero, or under them)
export function findNear(t = hero()){
  if (!t) return null;
  const list = ensureFinds(t.floor).filter(fd => !fd.done && cheb(fd, t) <= 1 && noticed(fd, { passive:passiveOf(t), dist:cheb(fd, t) }));
  const order = { glint:0, search:1, read:2 };
  return list.sort((a, b) => order[a.kind] - order[b.kind] || cheb(a, t) - cheb(b, t))[0] || null;
}
const READ_LABEL = { gravestone:'Read the gravestone', shrine:'Look at the shrine', altar:'Look at the altar', notice:'Read the notice', statue:'Look at the statue', well:'Look into the well', milestone:'Read the milestone' };
export function findLabel(fd){
  if (fd.kind === 'glint') return 'Something glints: pick it up';
  if (fd.kind === 'search') return `Search the ${{ sacks:'sacks', kegs:'kegs', hay:'hay' }[fd.on] || fd.on}`;
  return READ_LABEL[fd.on] || 'Look at the carving';
}
const TITLE = { gravestone:'A gravestone', shrine:'A wayside shrine', altar:'An altar', notice:'A notice', statue:'A statue', well:'The well', milestone:'A milestone' };
// Do it: read it, search it, or pick it up
export function useFind(fd){
  if (!fd) return false;
  if (fd.kind === 'read'){ showCard({ kind:'', title:TITLE[fd.on] || 'Carved here', flair:fd.text }, false); return true; }
  const o = outcome(fd), got = [];
  fd.done = true;
  if (o.gp){ gainLoot({ gp:o.gp }); got.push(`${o.gp} gp`); }
  if (o.trinket){ gainLoot({ items:[o.trinket] }); got.push(o.trinket); }
  if (o.potion){ gainLoot({ items:['Potion of Healing'] }); got.push('a Potion of Healing'); }
  const page = o.page && pageById(o.page);
  if (page){ const w = W(); w.pages ||= []; if (!w.pages.includes(page.id)){ w.pages.push(page.id); got.push(`a page for your journal: “${page.title}”`); } }
  const say = `${fd.kind === 'search' ? '🔍' : '✨'} ${o.say}${got.length ? ` You take ${got.join(', ')}.` : ''}`;
  if (page) showCard({ kind:'', title:page.title, flair:page.text, lines:[say] }, false); else toast(say);
  changed();
  return true;
}
// The pages found, in order (a writer's pages together, by number)
export const pagesFound = () => (W()?.pages || []).map(pageById).filter(Boolean).sort((a, b) => (a.thread || a.id).localeCompare(b.thread || b.id) || (a.n || 0) - (b.n || 0));
