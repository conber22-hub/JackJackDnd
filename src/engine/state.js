/* STATE — everything that is saved / shared lives in `state`; local-only view settings live in `ui`.
   Other modules read the live binding `state` and swap it with setState(). Pure: no DOM, no Three.js. */
import { uid, clamp, avgDice, parseAttacks, bus } from '../util/core.js';
import { BEST, DEFAULT_PARTY, DEFAULT_PC_ATTACKS, rebuildBestiary } from '../data/bestiary.js';
import { DREAD } from '../data/dread.js';
import { DEFAULT_SHIFT_TABLE, DEFAULT_WHIM_TABLE } from '../data/tables.js';
import { parseTable } from './tables.js';
import { genDelve } from './generator.js';
import { TEMPLATES } from '../data/themes.js';
import { CLOCKS, PLACES } from '../data/campaign.js';

export { T, walk } from './tiles.js';

export let state = null;
export function setState(s){ state = s; rebuildBestiary(s?.content?.bestiary); }

export const ui = {                 // local-only (never saved, never sent)
  role:'dm',                        // 'dm' | 'player'
  tableView:false,                  // DM casting what players see
  floor:0, view:'tilt',
  tab:'story', panelOpen: typeof innerWidth === 'undefined' ? true : innerWidth > 760,
  selected:null, mode:'select', modeData:null,
  previewFog:false, roomLabels:true, freeMove:false, whispers:true,
  bestFilter:'all', bestSearch:'', openBest:null, openPc:null, editBest:null,
  trapKind:'pit', doorState:'closed', propKind:'table', propCat:'tavern', paintType:'nest', selRoom:null, selDoor:null, selTrap:null, atkMode:'normal', stairsDir:'down',
  myToken:null, myName:'',
};
export const viewAsPlayer = () => ui.role === 'player' || ui.tableView;
export const isDM = () => ui.role === 'dm' && !ui.tableView;

export const tokById = id => state.tokens.find(t => t.id === id);
export const side = t => t.kind === 'monster' ? 'foe' : 'party';
export function tokenAt(L, x, y, alive = true){
  return state.tokens.find(t => t.floor === L && !t.flags?.gone && (!alive || !t.dead) &&
    x >= t.x && x < t.x + (t.size || 1) && y >= t.y && y < t.y + (t.size || 1));
}

export function log(msg){ state.log.push({ t:Date.now(), m:msg }); if (state.log.length > 120) state.log.shift(); bus.emit('log'); }

/* ---------- content the DM can edit in the app ---------- */
export function dreadLevel(n = state.dread){ const o = state?.content?.dread?.[n] || {}; return { ...DREAD[n], ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null)) }; }
const tableCache = new Map();
function cachedTable(text){ if (!tableCache.has(text)) tableCache.set(text, parseTable(text)); return tableCache.get(text); }
export const shiftTable = () => cachedTable(state.content.shift ?? DEFAULT_SHIFT_TABLE);
export const whimTable = () => cachedTable(state.content.grasp ?? DEFAULT_WHIM_TABLE);   // content.grasp: the Whim table (old field name)

/* ---------- token factories ---------- */
export function makePC(p){
  return { id:uid(), kind:'pc', name:p.name, color:p.color || '#e9a54a', ac:p.ac || 15, hp:p.hp || 50, maxHp:p.hp || 50,
           speed:p.speed || 30, init:p.init || 0, saveMod:3, check:p.check ?? 4, passive:p.passive ?? 13,
           attacks:parseAttacks(p.attacks || DEFAULT_PC_ATTACKS), floor:0, x:0, y:0, dead:false, flags:{}, conds:[], size:1, moved:0 };
}
export function makeMonster(bid, floor, x, y){
  const b = BEST[bid]; const hp = avgDice(b.hp);
  const n = state ? state.tokens.filter(t => t.bid === bid).length : 0;
  return { id:uid(), kind:'monster', bid, name:n ? `${b.name} ${n + 1}` : b.name, color:b.color, ac:b.ac, hp, maxHp:hp, speed:b.speed, init:b.init, saveMod:1,
           check:2, passive:12, attacks:b.attacks.map(a => ({ ...a })), floor, x, y, dead:false, flags:{}, conds:[], size:b.size || 1, moved:0 };
}
export function makeNPC(name){
  return { id:uid(), kind:'npc', name, color:'#b9a7e0', ac:12, hp:20, maxHp:20, speed:30, init:1, saveMod:1, check:2, passive:12,
           attacks:parseAttacks('Dagger | +3 | 1d4+1 | piercing'), floor:ui.floor, x:0, y:0, dead:false, flags:{}, conds:[], size:1, moved:0 };
}

export function newCampaign(){
  return { session:0, clocks:Object.fromEntries(CLOCKS.map(c => [c.id, c.start])), places:Object.fromEntries(PLACES.map(p => [p.id, 'quiet'])),
    fortune:{}, notes:{}, done:{}, gaze:'amused', day:'The first night the mist tasted of copper', weather:'Low mist. Crows on the chapel roof. No wind.', lastNight:'', counsel:'' };
}
export function newState(opts){
  const s = {
    v:2,
    // hand-built maps (Session 0) are drawn on a 40-square grid, so their delves are never smaller than that
    meta:{ name:opts.name || 'Beneath Saint Andral\'s', seed:opts.seed, floors:opts.floors, size:Math.max(opts.size || 40, TEMPLATES.find(t => t.id === opts.template)?.floors.some(f => f.layout) ? 40 : 0), template:opts.template || 'andral', ...(opts.journey ? { journey:opts.journey } : {}), ...(opts.place ? { place:opts.place } : {}) },
    dread:1, floors:[], tokens:[], explored:{}, art:{}, log:[],
    combat:{ active:false, order:[], idx:0, round:1, floor:0 },
    seats:{}, grasp:{ die:4, auto:false, last:null },   // grasp = the Whim Die (old field name)
    content:{ dread:{}, shift:null, grasp:null, bestiary:{} },
    campaign:newCampaign(), characters:{},
  };
  const prev = state; state = s;                     // the generator's populate step places tokens into `state`
  try { s.floors = genDelve(s.meta); } finally { state = prev; }
  s.floors.forEach((f, L) => s.explored[L] = new Set());
  const f0 = s.floors[0], r0 = f0.rooms[0];
  if (opts.party !== false) DEFAULT_PARTY.forEach((p, i) => {
    const t = makePC(p); t.floor = 0;
    t.x = clamp(r0.x + 1 + (i % 3), r0.x, r0.x + r0.w - 1); t.y = clamp(r0.y + 1 + Math.floor(i / 3), r0.y, r0.y + r0.h - 1);
    s.tokens.push(t);
  });
  return s;
}
