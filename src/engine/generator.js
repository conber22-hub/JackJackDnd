/* DUNGEON GENERATOR + FLOOR EDITING PRIMITIVES
   Each floor = rooms + corridors (+ an optional imported base grid). The grid is always rebuilt from
   those parts by carve(), so editing a room or a corridor never loses anything else.
   The stairs-down tile of floor N is the stairs-up tile of floor N+1, so floors line up when stacked.
   Pure: no DOM, no Three.js. */
import { mulberry32, hashSeed, pickWeighted, pick, clamp } from '../util/core.js';
import { THEMES, TEMPLATES, themeIndex } from '../data/themes.js';
import { ROOM_NAMES } from '../data/rooms.js';
import { BEST } from '../data/bestiary.js';
import { T, walk } from './tiles.js';
import { furnishFloor } from './dressing.js';
import { describeRoom } from '../data/descriptions.js';
import { journeySpecs, landmarkSpecs } from './overland.js';
import { genPlace } from './settlement.js';
import { state, makeMonster } from './state.js';

const DEEP = ['hands', 'undertow', 'womb', 'ossuary'];
export function templateSpecs(meta){
  if (meta.template === 'journey' && meta.journey) return journeySpecs(meta.journey);
  if (meta.template === 'landmark' && meta.place) return landmarkSpecs(meta.place, meta.seed);
  const tpl = TEMPLATES.find(t => t.id === meta.template) || TEMPLATES[0], out = [];
  for (let L = 0; L < meta.floors; L++){
    if (tpl.floors[L]) out.push(tpl.floors[L]);
    else out.push(tpl.id === 'blank' ? { blank:true } : { theme:DEEP[(L - tpl.floors.length) % DEEP.length] });
  }
  return out;
}

// Seeded dice for generation, so the same seed places the same number of monsters.
function rollWith(expr, rng){
  let total = 0;
  for (const term of String(expr).replace(/\s+/g, '').match(/[+-]?[^+-]+/g) || []){
    const sign = term[0] === '-' ? -1 : 1, body = term.replace(/^[+-]/, ''), m = body.match(/^(\d*)d(\d+)$/i);
    if (m) for (let i = 0; i < +(m[1] || 1); i++) total += sign * (1 + Math.floor(rng() * +m[2]));
    else total += sign * (+body || 0);
  }
  return Math.max(0, total);
}

export function genDelve(meta){
  const rng = mulberry32(hashSeed(meta.seed + '|' + (meta.template || 'andral')));
  const specs = templateSpecs(meta), floors = []; let anchor = null;
  for (let L = 0; L < meta.floors; L++){
    const f = genFloor(L, meta.size, meta.size, rng, anchor, L === meta.floors - 1, specs[L]);
    floors.push(f); anchor = f.down;
  }
  // furniture and a read-aloud line for every generated room (its own seeded stream, so layouts don't change)
  floors.forEach((f, L) => {
    const sp = specs[L]; if (sp.layout || sp.place || sp.blank || !f.rooms) return;
    const drng = mulberry32(hashSeed(`${meta.seed}|dress|${L}`)), tid = THEMES[f.theme]?.id;
    furnishFloor(f, tid, drng);
    for (const r of f.rooms) r.read ||= describeRoom(r, tid, drng);
  });
  if (state) floors.forEach((f, L) => { if (specs[L].populate) populateFloor(f, L, rng, L === meta.floors - 1 || !!specs[L].boss, specs[L].populate === true ? .4 : specs[L].populate); });
  return floors;
}

export function genFloor(L, W, H, rng, anchor, isLast, spec = {}){
  if (spec.layout) return layoutFloor(L, W, H, spec, anchor, isLast);
  // a place from the Valley (village, town, camp, tower…): built fresh from the delve's seed
  if (spec.place){ const lay = genPlace(spec.place.kind, { ...spec.place, seed:Math.floor(rng() * 1e9), last:isLast }); if (lay) return layoutFloor(L, W, H, { ...spec, layout:lay }, anchor, isLast); }
  const theme = spec.theme !== undefined ? themeIndex(spec.theme) : L % 4, th = THEMES[theme];
  const rooms = [];
  const [smin, smax] = spec.roomSize || [4, 9];
  const want = spec.blank ? 2 : Math.round(W * H / 140 * (spec.rooms || 1)) + Math.floor(rng() * 3);
  const fits = r => r.x >= 1 && r.y >= 1 && r.x + r.w <= W - 1 && r.y + r.h <= H - 1 &&
    rooms.every(o => r.x + r.w + 2 <= o.x || o.x + o.w + 2 <= r.x || r.y + r.h + 2 <= o.y || o.y + o.h + 2 <= r.y);
  if (anchor){
    const w = 5 + Math.floor(rng() * 3), h = 5 + Math.floor(rng() * 3);
    rooms.push({ x:clamp(anchor.x - Math.floor(w / 2), 1, W - w - 1), y:clamp(anchor.y - Math.floor(h / 2), 1, H - h - 1), w, h });
  } else if (spec.blank){
    rooms.push({ x:Math.floor(W / 2) - 3, y:3, w:6, h:5 });
  }
  if (spec.blank && !isLast){
    // the stairs-down landing, far from the first room
    const a = rooms[0], w = 5, h = 5;
    const far = { x:a.x < W / 2 ? W - w - 3 : 2, y:a.y < H / 2 ? H - h - 3 : 2, w, h };
    if (fits(far)) rooms.push(far); else rooms.push({ x:clamp(W - 1 - a.x - w, 1, W - w - 1), y:clamp(H - 1 - a.y - h, 1, H - h - 1), w, h });
  }
  let tries = 0;
  while (!spec.blank && (rooms.length < want || rooms.length < 3) && tries++ < 1200){
    const w = smin + Math.floor(rng() * (smax - smin + 1)), h = smin + Math.floor(rng() * (smax - smin + 1));
    const r = { x:1 + Math.floor(rng() * (W - w - 2)), y:1 + Math.floor(rng() * (H - h - 2)), w, h };
    if (fits(r)) rooms.push(r);
  }
  rooms.forEach((r, i) => { r.id = i; recalcRoom(r); r.type = 'chamber'; });
  const f = { level:L, W, H, theme, name:th.name, rooms, nextId:rooms.length, edges:[], corridors:[], autoLink:!spec.blank,
              up:anchor ? { ...anchor } : null, down:null, grid:null, dug:[], filled:[], doors:[], traps:[], base:null, nextObj:1 };
  if (!spec.blank) f.edges = linkRooms(rooms, rng);
  else if (rooms.length > 1) f.corridors.push({ id:f.nextObj++, tiles:lPath(f, rooms[0].cx, rooms[0].cy, rooms[1].cx, rooms[1].cy, rng() < .5) });
  rooms[0].type = 'entrance';
  if (!isLast){
    let best = rooms.length > 1 ? 1 : 0, bd = -1;
    rooms.forEach((r, i) => { if (!i) return; const dd = Math.abs(r.cx - rooms[0].cx) + Math.abs(r.cy - rooms[0].cy); if (dd > bd){ bd = dd; best = i; } });
    rooms[best].type = 'entrance'; f.down = { x:rooms[best].cx, y:rooms[best].cy };
    if (f.up && f.down.x === f.up.x && f.down.y === f.up.y) f.down.x = clamp(f.down.x + 1, rooms[best].x, rooms[best].x + rooms[best].w - 1);
  }
  rooms.forEach(r => { if (r.type === 'chamber' && r.id !== 0 && !spec.blank) r.type = pickWeighted(th.weights, rng); r.name = pick(ROOM_NAMES[r.type], rng); r.notes = ''; });
  carve(f);
  if (!spec.blank){ placeDoors(f, rng, spec); placeTraps(f, rng, spec); }
  return f;
}

/* A hand-built floor from a template's layout (the Session 0 tavern, village and road):
   rooms [x, y, w, h, type, name, notes, { outdoor }] · paths { w, pts:[x0, y0, x1, y1, …] } (straight runs,
   w squares wide) · doors [x, y, state] · buildings { x, y, w, h, name, door } · props [kind, x, y, rot]
   · up / down [x, y] · exits { up, down } (what the stairs are called here) · water [[x, y]…] · fill [[x, y]…]
   (squares forced solid) · masonry / clear [[x, y]…] (solid squares drawn as stone wall / left bare for a prop) · events [{ label, text, enc, x, y }] (the road's random happenings, see overland.js). */
export function layoutFloor(L, W, H, spec, anchor, isLast = true){
  const lay = spec.layout, theme = themeIndex(spec.theme), th = THEMES[theme];
  const f = { level:L, W, H, theme, name:lay.name || th.name, rooms:[], nextId:0, edges:[], corridors:[], autoLink:false,
              up:null, down:null, grid:null, dug:[], filled:[], doors:[], traps:[], base:null, nextObj:1, props:[], buildings:[], exits:lay.exits || null };
  for (const [x, y, w, h, type = 'chamber', name, notes = '', o = {}] of lay.rooms)
    f.rooms.push(recalcRoom({ id:f.nextId++, x, y, w, h, type, name:name || pick(ROOM_NAMES[type] || ROOM_NAMES.chamber), notes, free:true, ...(o.outdoor ? { outdoor:true } : {}) }));
  for (const path of lay.paths || []){
    const w = path.w || 1, off = Math.floor((w - 1) / 2), tiles = new Set(), pts = path.pts;
    const brush = (x, y) => { for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++){ const nx = x - off + dx, ny = y - off + dy; if (nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1) tiles.add(ny * W + nx); } };
    for (let k = 0; k + 3 < pts.length; k += 2){
      let x = pts[k], y = pts[k + 1]; const x1 = pts[k + 2], y1 = pts[k + 3]; brush(x, y);
      while (x !== x1 || y !== y1){ if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y); brush(x, y); }
    }
    f.corridors.push({ id:f.nextObj++, tiles:[...tiles] });
  }
  const xy = a => a ? { x:a[0], y:a[1] } : null;
  f.up = anchor ? { ...anchor } : xy(lay.up); f.down = xy(lay.down);
  if (!f.down && !isLast){
    // more floors were asked for than the layout has: the way on is in the room farthest from the way in
    const from = f.up || { x:f.rooms[0].cx, y:f.rooms[0].cy };
    const far = f.rooms.reduce((a, r) => Math.abs(r.cx - from.x) + Math.abs(r.cy - from.y) > Math.abs(a.cx - from.x) + Math.abs(a.cy - from.y) ? r : a, f.rooms[0]);
    f.down = { x:far.cx, y:far.cy };
  }
  f.filled = (lay.fill || []).map(([x, y]) => y * W + x).filter(i => !(f.up && i === f.up.y * W + f.up.x));
  carve(f);
  // water (rivers, ponds, lakes) is impassable; it is drawn as water instead of trees
  f.water = [...new Set((lay.water || []).map(([x, y]) => y * W + x))].filter(i => !walk(f.grid[i]));
  f.events = (lay.events || []).map(e => ({ id:f.nextObj++, ...e, done:false }));
  // squares drawn as stone wall (a village wall) or left bare for a prop to stand on (a palisade) on outdoor floors
  if (lay.masonry?.length) f.masonry = [...new Set(lay.masonry.map(([x, y]) => y * W + x))].filter(i => !walk(f.grid[i]));
  if (lay.clear?.length) f.clear = lay.clear.map(([x, y]) => y * W + x);
  for (const [x, y, state = 'closed'] of lay.doors || []){ const i = y * W + x; if (walk(f.grid[i])) f.doors.push({ id:f.nextObj++, i, state, dc:state === 'locked' ? 15 : 14 }); }
  for (const [x, y, kind = 'pit'] of lay.traps || []){ const i = y * W + x; if (walk(f.grid[i])) addTrap(f, i, kind); }
  f.buildings = (lay.buildings || []).map(b => ({ ...b }));
  f.props = (lay.props || []).map(([k, x, y, rot = 0]) => ({ id:f.nextObj++, k, x, y, rot }));
  // difficult terrain: listed squares, and with `mud` every open square beside the water (a marsh)
  const rough = new Set((lay.rough || []).map(([x, y]) => y * W + x));
  if (lay.mud){ const wet = new Set(f.water); for (let i = 0; i < f.grid.length; i++) if (f.grid[i] === T.ROOM && [1, -1, W, -W].some(o => wet.has(i + o))) rough.add(i); }
  f.rough = [...rough].filter(i => walk(f.grid[i]) && f.grid[i] !== T.DOWN && f.grid[i] !== T.UP);
  return f;
}

// What the stairs are called on this floor ("▼ Out to the village square" on the Session 0 floors).
export const exitLabel = (f, dir) => (dir === 'down' ? '▼ ' : '▲ ') + (f?.exits?.[dir] || (dir === 'down' ? 'Descend' : 'Ascend'));

export function recalcRoom(r){ r.cx = r.x + Math.floor(r.w / 2); r.cy = r.y + Math.floor(r.h / 2); return r; }
export const roomById = (f, id) => f.rooms.find(r => r.id === id);
export function roomAt(f, x, y){ return f.rooms.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h); }
export function nearestRoom(f, x, y, except){ let best = null, bd = 1e9; for (const r of f.rooms){ if (r.id === except) continue; const dd = Math.abs(r.cx - x) + Math.abs(r.cy - y); if (dd < bd){ bd = dd; best = r; } } return best; }

export function linkRooms(rooms, rng){
  const n = rooms.length; if (n < 2) return [];
  const inT = rooms.map((_, i) => i === 0), edges = [];
  const dist = (a, b) => Math.abs(rooms[a].cx - rooms[b].cx) + Math.abs(rooms[a].cy - rooms[b].cy);
  const has = (a, b) => edges.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  for (let k = 1; k < n; k++){
    let best = null;
    for (let i = 0; i < n; i++) if (inT[i]) for (let j = 0; j < n; j++) if (!inT[j]){
      const dd = dist(i, j) + rng() * 6; if (!best || dd < best.d) best = { a:i, b:j, d:dd };
    }
    inT[best.b] = true; edges.push({ a:rooms[best.a].id, b:rooms[best.b].id, bend:rng() < .5 });
  }
  const extra = 1 + Math.floor(rng() * 3);
  for (let e = 0; e < extra * 4 && edges.length < n - 1 + extra; e++){
    const a = Math.floor(rng() * n), b = Math.floor(rng() * n);
    if (a !== b && dist(a, b) < 22 && !has(rooms[a].id, rooms[b].id)) edges.push({ a:rooms[a].id, b:rooms[b].id, bend:rng() < .5 });
  }
  return edges;
}
// Re-link any rooms the edge graph no longer reaches (after a room is added or deleted).
export function ensureConnected(f){
  if (!f.autoLink || f.rooms.length < 2) return;
  const ids = f.rooms.map(r => r.id), comp = new Map(ids.map(id => [id, id]));
  const find = a => { while (comp.get(a) !== a) a = comp.get(a); return a; };
  f.edges = f.edges.filter(e => comp.has(e.a) && comp.has(e.b));
  for (const e of f.edges) comp.set(find(e.a), find(e.b));
  for (;;){
    const root = find(ids[0]), out = f.rooms.filter(r => find(r.id) !== root);
    if (!out.length) break;
    let best = null;
    for (const a of f.rooms) if (find(a.id) === root) for (const b of out){
      const dd = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy); if (!best || dd < best.d) best = { a, b, d:dd };
    }
    f.edges.push({ a:best.a.id, b:best.b.id, bend:Math.random() < .5 }); comp.set(find(best.b.id), root);
  }
}

// Tiles of an L-shaped path (excluding the start), used for corridors and connectors.
export function lPath(f, x0, y0, x1, y1, bend){
  const out = []; let x = x0, y = y0;
  if (bend){ while (x !== x1){ x += Math.sign(x1 - x); out.push(y * f.W + x); } while (y !== y1){ y += Math.sign(y1 - y); out.push(y * f.W + x); } }
  else     { while (y !== y1){ y += Math.sign(y1 - y); out.push(y * f.W + x); } while (x !== x1){ x += Math.sign(x1 - x); out.push(y * f.W + x); } }
  return out;
}

export function carve(f, keep = []){
  const N = f.W * f.H, g = f.base && f.base.length === N ? f.base.slice() : new Array(N).fill(T.ROCK);
  const hall = i => { if (g[i] === T.ROCK) g[i] = T.HALL; };
  // imported floors keep their own walls inside room rectangles, unless the DM has since moved or drawn the room
  const keepBase = r => f.base && f.base.length === N && !r.free;
  for (const r of f.rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++){ const i = y * f.W + x; if (!keepBase(r) || walk(f.base[i])) g[i] = T.ROOM; }
  if (f.autoLink !== false) for (const e of f.edges){
    const a = roomById(f, e.a), b = roomById(f, e.b); if (a && b) lPath(f, a.cx, a.cy, b.cx, b.cy, e.bend).forEach(hall);
  }
  for (const c of f.corridors) c.tiles.forEach(hall);
  for (const i of f.dug) hall(i);
  for (const i of f.filled) g[i] = T.ROCK;
  for (const k of keep){                       // creatures standing in a hall that vanished keep their footing
    const i = k.y * f.W + k.x;
    if (g[i] === T.ROCK){ g[i] = T.HALL; const r = nearestRoom(f, k.x, k.y); if (r) lPath(f, k.x, k.y, r.cx, r.cy, Math.random() < .5).forEach(hall); }
  }
  // stairs always connect to something
  for (const [s, code] of [[f.down, T.DOWN], [f.up, T.UP]]){
    if (!s) continue;
    const i = s.y * f.W + s.x; g[i] = code;
    let linked = false;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = s.x + dx, ny = s.y + dy; if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && walk(g[ny * f.W + nx])) linked = true; }
    if (!linked){ const r = nearestRoom(f, s.x, s.y); if (r) lPath(f, s.x, s.y, r.cx, r.cy, true).forEach(hall); }
  }
  for (const r of f.rooms){ r.stairsUp = !!(f.up && inRoom(r, f.up.x, f.up.y)); r.stairsDown = !!(f.down && inRoom(r, f.down.x, f.down.y)); }
  f.grid = g;
  f.doors = (f.doors || []).filter(dr => walk(g[dr.i]) && g[dr.i] !== T.UP && g[dr.i] !== T.DOWN);
  f.traps = (f.traps || []).filter(tr => walk(g[tr.i]));
  if (f.rough?.length) f.rough = f.rough.filter(i => walk(g[i]) && g[i] !== T.UP && g[i] !== T.DOWN);
}
export const inRoom = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

export function wallSet(f, g = f.grid){
  const out = new Set(), W = f.W, H = f.H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const i = y * W + x; if (walk(g[i])) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++){
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (walk(g[ny * W + nx])){ near = true; break; }
    }
    if (near) out.add(i);
  }
  return out;
}

/* ---------- doors & traps ---------- */
// A doorway is a hall tile with a room on one side, more hall on the other, and rock on both flanks.
export function isDoorway(f, i, g = f.grid){
  const x = i % f.W, y = (i / f.W) | 0, at = (xx, yy) => xx < 0 || yy < 0 || xx >= f.W || yy >= f.H ? T.ROCK : g[yy * f.W + xx];
  if (g[i] !== T.HALL) return false;
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const n = at(x + dx, y + dy);
    if (n !== T.ROOM) continue;
    if (!walk(at(x - dx, y - dy))) continue;
    if (!walk(at(x + dy, y + dx)) && !walk(at(x - dy, y - dx))) return true;
  }
  return false;
}
export function doorOrientation(f, i, g = f.grid){
  const x = i % f.W, y = (i / f.W) | 0, open = (xx, yy) => xx >= 0 && yy >= 0 && xx < f.W && yy < f.H && walk(g[yy * f.W + xx]);
  // walls left & right -> the door panel spans x (people pass along y)
  if (!open(x - 1, y) && !open(x + 1, y)) return 'x';
  if (!open(x, y - 1) && !open(x, y + 1)) return 'z';
  return open(x, y - 1) || open(x, y + 1) ? 'x' : 'z';
}
export const doorAt = (f, i) => f.doors?.find(d => d.i === i);
export const trapAt = (f, i) => f.traps?.find(t => t.i === i);

export function placeDoors(f, rng, spec = {}){
  const chance = spec.doors ?? .35, locked = spec.locked ?? .12, secret = spec.secret ?? .06;
  f.doors = f.doors.filter(d => !d.auto);
  for (let i = 0; i < f.grid.length; i++){
    if (!isDoorway(f, i) || doorAt(f, i)) continue;
    const x = i % f.W, y = (i / f.W) | 0;
    if (f.doors.some(d => Math.abs(d.i % f.W - x) + Math.abs(((d.i / f.W) | 0) - y) <= 1)) continue;
    if (rng() > chance) continue;
    const r = rng(), st = r < secret ? 'secret' : r < secret + locked ? 'locked' : rng() < .3 ? 'open' : 'closed';
    f.doors.push({ id:f.nextObj++, i, state:st, dc:13 + Math.floor(rng() * 5), auto:true });
  }
}
// Which trap kinds suit each theme.
export const THEME_TRAPS = { undercroft:['pit','wire','bell'], silver:['collapse','wire','pit'], hands:['hands','pit','grinder'],
  undertow:['spore','font'], chapel:['bell','pit','wire'], ossuary:['grinder','wire','bell'], womb:['spore','font','spore'] };
export function placeTraps(f, rng, spec = {}){
  const kinds = THEMES[f.theme].traps || THEME_TRAPS[THEMES[f.theme].id] || ['pit', 'wire'];
  const free = r => { const out = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++){ const i = y * f.W + x; if (f.grid[i] === T.ROOM && !trapAt(f, i)) out.push(i); } return out; };
  for (const r of f.rooms) if (r.type === 'trap'){
    const tiles = free(r);
    for (let k = 0; k < (spec.traps ?? 1) && tiles.length; k++) addTrap(f, tiles.splice(Math.floor(rng() * tiles.length), 1)[0], pick(kinds, rng), true);
  }
  if (rng() < .4){
    const halls = f.grid.map((v, i) => v === T.HALL && !doorAt(f, i) ? i : -1).filter(i => i >= 0);
    if (halls.length) addTrap(f, pick(halls, rng), pick(kinds, rng), true);
  }
}
export function addTrap(f, i, kind, auto = false){
  const tr = { id:f.nextObj++, i, kind, armed:true, found:false, auto }; f.traps.push(tr); return tr;
}

/* ---------- room editing (used by the Build tools) ---------- */
export function rectProblem(f, rect, ignoreId){
  if (rect.w < 2 || rect.h < 2) return 'Rooms need to be at least 2×2.';
  if (rect.x < 1 || rect.y < 1 || rect.x + rect.w > f.W - 1 || rect.y + rect.h > f.H - 1) return 'Off the edge of the floor.';
  for (const o of f.rooms){
    if (o.id === ignoreId) continue;
    if (rect.x < o.x + o.w + 1 && o.x < rect.x + rect.w + 1 && rect.y < o.y + o.h + 1 && o.y < rect.y + rect.h + 1) return `Too close to ${o.name}.`;
  }
  return null;
}
export function addRoom(f, rect, type = 'chamber', rng = Math.random){
  const r = recalcRoom({ id:f.nextId++, x:rect.x, y:rect.y, w:rect.w, h:rect.h, type, name:pick(ROOM_NAMES[type] || ROOM_NAMES.chamber, rng), notes:'', free:true });
  f.rooms.push(r);
  if (f.autoLink && f.rooms.length > 1){ const n = nearestRoom(f, r.cx, r.cy, r.id); f.edges.push({ a:n.id, b:r.id, bend:rng() < .5 }); }
  return r;
}
export function deleteRoom(f, id){
  const r = roomById(f, id); if (!r) return 'No such room.';
  if (f.rooms.length <= 1) return 'A floor needs at least one room.';
  if (r.stairsUp || r.stairsDown) return 'That room holds the stairs — move the stairs out first.';
  f.rooms = f.rooms.filter(o => o.id !== id);
  f.edges = f.edges.filter(e => e.a !== id && e.b !== id);
  ensureConnected(f);
  return null;
}

/* ---------- floors ---------- */
// Adds a fresh floor under the deepest one (giving the old bottom floor stairs down).
export function appendFloor(floors, meta, spec = {}){
  const last = floors[floors.length - 1], rng = mulberry32(hashSeed(meta.seed + '|extra|' + floors.length));
  if (!last.down){
    let best = last.rooms[0], bd = -1;
    for (const r of last.rooms){ if (r.stairsUp) continue; const dd = Math.abs(r.cx - last.rooms[0].cx) + Math.abs(r.cy - last.rooms[0].cy); if (dd > bd){ bd = dd; best = r; } }
    last.down = { x:best.cx, y:best.cy };
    if (last.up && last.up.x === best.cx && last.up.y === best.cy) last.down.x = clamp(best.cx + 1, best.x, best.x + best.w - 1);
    if (best.type === 'chamber') best.type = 'entrance';
    carve(last);
  }
  const L = floors.length;
  const f = genFloor(L, meta.size, meta.size, rng, last.down, true, spec.theme ? spec : { ...spec, theme:DEEP[(L - 1) % DEEP.length] });
  floors.push(f); meta.floors = floors.length;
  return f;
}
// Move the stairs between floor L and L+1 (dir 'down' on L == 'up' on L+1) and re-carve both.
export function moveStairs(floors, L, dir, x, y){
  const upper = dir === 'down' ? L : L - 1, lower = upper + 1;
  if (!floors[upper] || !floors[lower]) return 'There is no floor on the other side of those stairs.';
  const other = dir === 'down' ? floors[upper].up : floors[lower].down;
  if (other && other.x === x && other.y === y) return 'Both staircases can\'t share a tile.';
  floors[upper].down = { x, y }; floors[lower].up = { x, y };
  floors[upper].filled = floors[upper].filled.filter(i => i !== y * floors[upper].W + x);
  floors[lower].filled = floors[lower].filled.filter(i => i !== y * floors[lower].W + x);
  carve(floors[upper]); carve(floors[lower]);
  return null;
}

/* ---------- populate: drop the theme's denizens into fitting rooms ---------- */
export function freeFootprint(f, room, size, taken, rng){
  const spots = [];
  for (let y = room.y; y <= room.y + room.h - size; y++) for (let x = room.x; x <= room.x + room.w - size; x++){
    let ok = true;
    for (let dy = 0; dy < size && ok; dy++) for (let dx = 0; dx < size && ok; dx++){
      const i = (y + dy) * f.W + x + dx;
      if (f.grid[i] !== T.ROOM || taken.has(i)) ok = false;
    }
    if (ok) spots.push({ x, y });
  }
  return spots.length ? spots[Math.floor(rng() * spots.length)] : null;
}
export function populateFloor(f, L, rng = Math.random, withBoss = false, chance = .4){
  const th = THEMES[f.theme], placed = [];
  const taken = new Set(state.tokens.filter(t => t.floor === L).flatMap(t => { const s = t.size || 1, a = []; for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) a.push((t.y + dy) * f.W + t.x + dx); return a; }));
  const put = (bid, room) => {
    const b = BEST[bid]; if (!b) return;
    const spot = freeFootprint(f, room, b.size || 1, taken, rng); if (!spot) return;
    const m = makeMonster(bid, L, spot.x, spot.y); state.tokens.push(m); placed.push(m);
    for (let dy = 0; dy < (b.size || 1); dy++) for (let dx = 0; dx < (b.size || 1); dx++) taken.add((spot.y + dy) * f.W + spot.x + dx);
  };
  const rooms = f.rooms.filter(r => !r.stairsUp && !r.stairsDown && r.type !== 'safe' && r.type !== 'entrance');
  if (withBoss && th.boss){
    const lair = rooms.filter(r => r.type === 'lair' || r.type === 'nest').sort((a, b) => b.w * b.h - a.w * a.h)[0] || rooms.sort((a, b) => b.w * b.h - a.w * a.h)[0];
    if (lair){ put(th.boss, lair); rooms.splice(rooms.indexOf(lair), 1); }
  }
  for (const r of rooms){
    if (rng() > chance) continue;
    const groups = (th.denizens || []).filter(g => g.where.includes(r.type));
    const group = groups.length ? pick(groups, rng) : rng() < .35 ? pick(th.denizens || [], rng) : null;
    if (!group) continue;
    for (const [bid, n] of group.group){ const count = typeof n === 'number' ? n : rollWith(n, rng); for (let k = 0; k < count; k++) put(bid, r); }
  }
  return placed;
}
