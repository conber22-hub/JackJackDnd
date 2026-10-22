/* WHAT PLAYERS RECEIVE — the DM's delve with the secrets taken out, so a curious player opening the browser's
   developer tools finds nothing the party hasn't earned. Pure: takes a serialized delve (game/session.js
   serialize) and what the party can see / has explored; returns a new object.
   · the map: squares the party has explored, plus one square of edge (so a corridor visibly runs on into the
     dark); everything else is solid rock. Secret doors are rock. Unfound traps, hand-drawn corridor lists,
     the generator's base grid, room types and notes, and unexplored floors' names are gone.
   · creatures: monsters and allies are sent only while the party can see them (a corpse stays where it fell
     if that square was explored). Their statblock numbers — HP, AC, attacks, saves, resources, hidden flags —
     stay with the DM. Monsters in the fight that nobody can see go as a blank "something unseen".
   · content: the DM's Shift and Whim tables, and custom creatures nobody can see, stay home; the log keeps
     only the lines meant for everyone (entries marked dm:true are the DM's). */
const KEEP_FLAGS = ['gone', 'taken', 'bloodied'];
const MON_FIELDS = ['id', 'kind', 'bid', 'name', 'color', 'size', 'floor', 'x', 'y', 'dead', 'conds', 'moved', 'initRoll', 'speed', 'dodge', 'look'];

export function redactForPlayers(s, { seen = {}, explored = {} } = {}){
  const out = { ...s, meta:{ ...s.meta } };
  delete out.campaign; delete out.characters;
  // the seed would let someone regenerate the whole delve: send a stand-in that still tells delves apart
  out.meta.seed = 'h' + hash(String(s.meta.seed));
  if (out.meta.journey) out.meta.journey = { from:s.meta.journey.from, to:s.meta.journey.to };
  out.floors = s.floors.map((f, L) => redactFloor(f, new Set(explored[L] || [])));
  // creatures
  const party = t => t.kind === 'pc';
  const visible = t => {
    const W = s.floors[t.floor]?.W, sn = seen[t.floor], ex = explored[t.floor]; if (!W) return false;
    for (let dy = 0; dy < (t.size || 1); dy++) for (let dx = 0; dx < (t.size || 1); dx++){
      const i = (t.y + dy) * W + t.x + dx;
      if (sn?.has(i) || (t.dead && (ex instanceof Set ? ex.has(i) : ex?.includes?.(i)))) return true;
    }
    return false;
  };
  const inFight = new Set(s.combat?.active ? s.combat.order : []);
  out.tokens = [];
  for (const t of s.tokens){
    if (party(t)){ const p = { ...t }; out.tokens.push(p); continue; }
    if (!t.flags?.gone && visible(t)){
      const m = {}; for (const k of MON_FIELDS) if (t[k] !== undefined) m[k] = t[k];
      m.flags = Object.fromEntries(KEEP_FLAGS.filter(k => t.flags?.[k]).map(k => [k, true]));
      m.hp = t.dead ? 0 : 1; m.maxHp = 1; m.attacks = [];
      if (t.kind === 'npc') Object.assign(m, { ac:t.ac, hp:t.hp, maxHp:t.maxHp });   // allies fight beside the party
      out.tokens.push(m);
    }
    else if (inFight.has(t.id)) out.tokens.push({ id:t.id, kind:t.kind, unseen:true, name:'something unseen', floor:t.floor, x:-99, y:-99, size:1, dead:!!t.dead, hp:t.dead ? 0 : 1, maxHp:1, attacks:[], conds:[], flags:{ gone:true }, initRoll:t.initRoll });
  }
  // content: only what the player's app needs to draw what it can see
  const shown = new Set(out.tokens.map(t => t.bid).filter(Boolean));
  out.content = { dread:s.content?.dread || {}, shift:null, grasp:null,
    bestiary:Object.fromEntries(Object.entries(s.content?.bestiary || {}).filter(([id]) => shown.has(id))) };
  out.log = (s.log || []).filter(e => !e.dm);
  out.explored = Object.fromEntries(Object.entries(explored).map(([L, v]) => [L, [...v]]));
  return out;
}

function redactFloor(f, exp){
  const W = f.W, H = f.H, g = String(f.grid), n = g.length;
  // explored squares and one square of edge around them
  const keep = new Uint8Array(n);
  for (const i of exp){ const x = i % W, y = (i / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) keep[ny * W + nx] = 1; } }
  const secret = new Set((f.doors || []).filter(d => d.state === 'secret').map(d => d.i));
  let grid = ''; for (let i = 0; i < n; i++) grid += keep[i] && !secret.has(i) ? g[i] : '0';
  const kept = i => keep[i] && !secret.has(i);
  const rectKept = (x, y, w, h, pad = 0) => { for (let yy = y - pad; yy < y + h + pad; yy++) for (let xx = x - pad; xx < x + w + pad; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H && exp.has(yy * W + xx)) return true; return false; };
  const seenAny = exp.size > 0;
  return {
    ...f, grid, base:null,
    name:seenAny ? f.name : 'Unexplored',
    rooms:(f.rooms || []).filter(r => rectKept(r.x, r.y, r.w, r.h, 1)).map(r => ({ id:r.id, x:r.x, y:r.y, w:r.w, h:r.h, cx:r.cx, cy:r.cy, type:'chamber', name:'', notes:'', ...(r.outdoor ? { outdoor:true } : {}) })),
    doors:(f.doors || []).filter(d => d.state !== 'secret' && kept(d.i)).map(d => ({ id:d.id, i:d.i, state:d.state, dc:d.dc, ...(d.found ? { found:true } : {}) })),
    traps:(f.traps || []).filter(t => t.found && kept(t.i)),
    corridors:[], dug:[], filled:[], events:[],
    props:(f.props || []).filter(p => rectKept(p.x, p.y, 3, 3, 1)),
    buildings:(f.buildings || []).filter(b => rectKept(b.x, b.y, b.w, b.h, 1)).map(b => { const c = { ...b }; delete c.name; return c; }),
    water:(f.water || []).filter(kept), masonry:(f.masonry || []).filter(kept), clear:(f.clear || []).filter(kept), rough:(f.rough || []).filter(kept),
    up:f.up && kept(f.up.y * W + f.up.x) ? f.up : null,
    down:f.down && kept(f.down.y * W + f.down.x) ? f.down : null,
  };
}
function hash(str){ let h = 2166136261; for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
