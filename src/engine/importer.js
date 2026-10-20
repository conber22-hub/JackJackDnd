/* MAP IMPORT / EXPORT — Battle Table JSON, other grid JSON, and plain ASCII.
   The importer is deliberately forgiving: it looks for a grid under any of the usual names
   (grid, tiles, cells, map, data, layers[].data), accepts numbers / booleans / strings / objects as cells,
   and picks up rooms, doors, traps, stairs and tokens when they are there.

   ASCII legend (one character per 5-ft square, floors separated by a line starting with --- or ===):
     #  rock / wall        .  floor          +  closed door     '  open door
     L  locked door        S  secret door    ^  hidden trap     >  stairs down     <  stairs up
   Spaces count as rock. Rooms are found automatically (open areas at least 3×3) unless the JSON lists them.
   Pure: no DOM. */
import { T, walk } from './tiles.js';
import { recalcRoom, carve, nearestRoom } from './generator.js';
import { ROOM_NAMES, ROOM_TYPES, TRAP_KINDS } from '../data/rooms.js';
import { pick } from '../util/core.js';
import { PROPS } from '../data/props.js';

const ROCKS = new Set(['#', 'wall', 'walls', 'rock', 'solid', 'void', 'empty', 'none', 'blocked', 'stone', 'x', '0', '', ' ', 'null']);
const FLOORS = new Set(['.', 'floor', 'ground', 'room', 'hall', 'corridor', 'path', 'open', 'tile', 'walkable', '1', 'f', 'o']);
const DOOR_CH = { '+':'closed', "'":'open', L:'locked', S:'secret', D:'closed', d:'closed' };
const WORD_DOORS = { door:'closed', 'door-closed':'closed', closed:'closed', 'door-open':'open', opendoor:'open', 'door-locked':'locked', locked:'locked', 'door-secret':'secret', secret:'secret', secretdoor:'secret' };

// -> { kind:'rock'|'floor'|'down'|'up', door?, trap? }
function cell(v){
  if (v === null || v === undefined) return { kind:'rock' };
  if (typeof v === 'boolean') return { kind:v ? 'floor' : 'rock' };
  if (typeof v === 'number') return { kind:v === T.DOWN ? 'down' : v === T.UP ? 'up' : v > 0 ? 'floor' : 'rock' };
  if (typeof v === 'object'){
    if (v.walkable !== undefined){ if (!v.walkable) return { kind:'rock' }; const c = cell(v.type ?? v.t ?? v.tile ?? 'floor'); if (c.kind === 'rock') c.kind = 'floor'; return c; }
    if (v.wall || v.solid || v.blocked) return { kind:'rock' };
    const c = cell(v.type ?? v.t ?? v.tile ?? v.kind ?? v.value ?? (v.floor ? 'floor' : null));
    if (v.door) c.door = v.door === true ? 'closed' : String(v.door).toLowerCase();
    if (v.locked) c.door = 'locked'; if (v.secret) c.door = 'secret';
    if (v.trap) c.trap = typeof v.trap === 'string' ? v.trap : 'pit';
    return c;
  }
  const s = String(v), low = s.trim().toLowerCase();
  if (s.length === 1){
    if (s === '>') return { kind:'down' }; if (s === '<') return { kind:'up' };
    if (DOOR_CH[s]) return { kind:'floor', door:DOOR_CH[s] };
    if (s === '^') return { kind:'floor', trap:'pit' };
  }
  if (WORD_DOORS[low.replace(/[\s_]+/g, '')]) return { kind:'floor', door:WORD_DOORS[low.replace(/[\s_]+/g, '')] };
  if (/stair.*down|^down$|descend/.test(low)) return { kind:'down' };
  if (/stair.*up|^up$|ascend/.test(low)) return { kind:'up' };
  if (/trap/.test(low)) return { kind:'floor', trap:Object.keys(TRAP_KINDS).find(k => low.includes(k)) || 'pit' };
  if (ROCKS.has(low)) return { kind:'rock' };
  if (FLOORS.has(low) || /floor|ground|room|hall|corridor|water|bridge/.test(low)) return { kind:'floor' };
  return { kind:'rock' };
}

const num = (...vals) => { for (const v of vals) if (v !== undefined && v !== null && v !== '' && !isNaN(+v)) return +v; return undefined; };

function parseAsciiFloor(lines, name){
  const rows = lines.map(l => l.replace(/\r$/, '')).filter((l, i, a) => l.trim() || (i > 0 && i < a.length - 1));
  while (rows.length && !rows[rows.length - 1].trim()) rows.pop();
  const H = rows.length, W = Math.max(0, ...rows.map(r => r.length));
  return { name, W, H, cells:rows.map(r => [...r.padEnd(W, ' ')].map(cell)) };
}

function gridFrom(obj){
  let g = obj.grid ?? obj.tiles ?? obj.cells ?? obj.map ?? obj.data ?? obj.layers?.find?.(l => Array.isArray(l.data))?.data;
  const W0 = num(obj.width, obj.w, obj.cols, obj.columns, obj.layers?.[0]?.width), H0 = num(obj.height, obj.h, obj.rows, obj.layers?.[0]?.height);
  if (typeof g === 'string') g = g.split('\n');
  if (!Array.isArray(g) || !g.length) return null;
  // sparse list of {x, y, ...}
  if (typeof g[0] === 'object' && !Array.isArray(g[0]) && g[0] !== null && 'x' in g[0] && 'y' in g[0]){
    const W = W0 ?? Math.max(...g.map(c => +c.x)) + 1, H = H0 ?? Math.max(...g.map(c => +c.y)) + 1;
    const cells = Array.from({ length:H }, () => Array.from({ length:W }, () => ({ kind:'rock' })));
    for (const c of g) if (cells[+c.y]?.[+c.x]) cells[+c.y][+c.x] = cell(c.type ?? c.t ?? c.tile ?? c.kind ?? (c.wall ? 'wall' : c));
    return { W, H, cells };
  }
  if (typeof g[0] === 'string') return { W:Math.max(...g.map(r => r.length)), H:g.length, cells:g.map(r => [...r.padEnd(Math.max(...g.map(q => q.length)), ' ')].map(cell)) };
  if (Array.isArray(g[0])) return { W:Math.max(...g.map(r => r.length)), H:g.length, cells:g.map(r => Array.from({ length:Math.max(...g.map(q => q.length)) }, (_, x) => cell(r[x]))) };
  // flat array
  const W = W0 ?? Math.round(Math.sqrt(g.length)), H = H0 ?? Math.ceil(g.length / W);
  return { W, H, cells:Array.from({ length:H }, (_, y) => Array.from({ length:W }, (_, x) => cell(g[y * W + x]))) };
}

function parseJsonFloor(obj, name, warnings){
  const unit = num(obj.cellSize, obj.gridSize, obj.tileSize, obj.grid_size, obj.cell_size, obj.scale) || 1;
  const u = v => v === undefined ? undefined : Math.floor(+v / unit);
  const fl = gridFrom(obj) || { W:num(obj.width, obj.w) || 0, H:num(obj.height, obj.h) || 0, cells:null };
  if (!fl.cells && !fl.W){
    const rs = obj.rooms || obj.areas || obj.regions || [];
    fl.W = Math.max(0, ...rs.map(r => u(r.x) + u(r.w ?? r.width))) + 2; fl.H = Math.max(0, ...rs.map(r => u(r.y) + u(r.h ?? r.height))) + 2;
  }
  if (!fl.cells) fl.cells = Array.from({ length:fl.H }, () => Array.from({ length:fl.W }, () => ({ kind:'rock' })));
  fl.name = obj.name || obj.title || name;
  const rooms = (obj.rooms || obj.areas || obj.regions || []).map(r => ({
    x:u(r.x ?? r.left ?? r.bounds?.x), y:u(r.y ?? r.top ?? r.bounds?.y), w:Math.max(1, u(r.w ?? r.width ?? r.bounds?.w ?? r.bounds?.width) || 1), h:Math.max(1, u(r.h ?? r.height ?? r.bounds?.h ?? r.bounds?.height) || 1),
    name:r.name || r.label || r.title || '', type:ROOM_TYPES[String(r.type || '').toLowerCase()] ? String(r.type).toLowerCase() : 'chamber', notes:r.notes || r.description || '' }))
    .filter(r => !isNaN(r.x) && !isNaN(r.y));
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (fl.cells[y]?.[x] && fl.cells[y][x].kind === 'rock') fl.cells[y][x] = { kind:'floor' };
  for (const dr of obj.doors || []){ const x = u(dr.x), y = u(dr.y); if (!fl.cells[y]?.[x]) continue;
    const st = dr.secret ? 'secret' : dr.locked ? 'locked' : dr.open ? 'open' : (WORD_DOORS[String(dr.state || dr.type || '').toLowerCase()] || 'closed');
    fl.cells[y][x] = { kind:'floor', door:st }; }
  for (const tr of obj.traps || []){ const x = u(tr.x), y = u(tr.y); if (!fl.cells[y]?.[x]) continue;
    const k = String(tr.kind || tr.type || tr.name || '').toLowerCase(); fl.cells[y][x] = { kind:'floor', trap:TRAP_KINDS[k] ? k : Object.keys(TRAP_KINDS).find(q => k.includes(q)) || 'pit' }; }
  for (const st of obj.stairs || []){ const x = u(st.x), y = u(st.y); if (!fl.cells[y]?.[x]) continue;
    fl.cells[y][x] = { kind:/up|ascend/i.test(st.dir || st.type || st.direction || '') ? 'up' : 'down' }; }
  if (obj.up && fl.cells[u(obj.up.y)]?.[u(obj.up.x)]) fl.cells[u(obj.up.y)][u(obj.up.x)] = { kind:'up' };
  if (obj.down && fl.cells[u(obj.down.y)]?.[u(obj.down.x)]) fl.cells[u(obj.down.y)][u(obj.down.x)] = { kind:'down' };
  fl.rooms = rooms;
  // props and houses round-trip from Dread Delve's own floor JSON
  fl.props = (obj.props || []).filter(p => PROPS[p.k]).map(p => ({ k:p.k, x:u(p.x), y:u(p.y), rot:(+p.rot || 0) % 4 }));
  fl.rough = (obj.rough || []).map(p => ({ x:u(p.x), y:u(p.y) }));
  fl.buildings = (obj.buildings || []).map(b => ({ ...b, x:u(b.x), y:u(b.y), w:u(b.w), h:u(b.h) })).filter(b => b.w > 0 && b.h > 0);
  fl.tokens = (obj.tokens || obj.units || obj.monsters || obj.creatures || obj.minis || obj.pieces || []).map(t => ({
    name:t.name || t.label || 'Token', x:u(t.x), y:u(t.y), bid:t.bid || t.monster || t.creature || t.type || null, kind:t.kind || (t.pc || t.player ? 'pc' : null), hp:num(t.hp), ac:num(t.ac) }))
    .filter(t => !isNaN(t.x) && !isNaN(t.y));
  if (unit !== 1) warnings.push(`Coordinates divided by a cell size of ${unit}.`);
  return fl;
}

/* ---------- Battle Table (your DM screen) saves: { v:2, levels:[{ name, parts:[…] }], roster:[…] } ----------
   Parts are rectangles in squares (x, y, w, h) with connections on their edges: { e:'n'|'e'|'s'|'w', o:offset, t:type }.
   Shared edges become a wall; door / secret connections become doors, arches / gaps / stairs / windows become openings
   (windows stay wall). Stairwell parts become stairs. The roster puts creatures on their level. */
const BT_KIND_SIZE = { chamber:[6,5], hall:[10,6], corridor:[6,2], crypt:[7,5], cells:[8,5], shrine:[6,6], vault:[5,4], stairs:[3,5], collapse:[6,5], pit:[4,4],
  cave:[8,7], tunnel:[7,3], chasm:[8,6], river:[9,5], fungus:[7,6], spires:[8,6], clearing:[8,7], forest:[8,8], road:[10,4], ford:[9,6], hill:[8,7], ruin:[8,7],
  camp:[8,6], street:[10,5], room:[5,4], inn:[9,7], keep:[11,8], shop:[6,5], courtyard:[9,8], sewer:[8,6], gatehouse:[8,6], graveyard:[8,7], dock:[10,6], throne:[10,8] };
const BT_CONN_W = { door:1, arch:1.4, gap:1.6, secret:1, stair:1.6, window:1 };
const BT_TAG_TYPE = { Trap:'trap', Treasure:'treasure', 'Safe room':'safe', 'Boss lair':'lair', Ambush:'lair', 'Guard post':'chamber', Shrine:'shrine', 'Ritual site':'shrine', Prison:'crypt', 'Rest stop':'safe' };
const BT_KIND_TYPE = { crypt:'crypt', shrine:'shrine', vault:'treasure', stairs:'entrance', graveyard:'crypt', fungus:'nest', cells:'crypt', throne:'lair' };
export const isBattleTable = d => d && typeof d === 'object' && Array.isArray(d.levels) && d.levels.some(l => Array.isArray(l?.parts));
export function parseBattleTable(data){
  const warnings = [];
  const norm = p => { const sz = BT_KIND_SIZE[p.k] || [6, 5]; return { ...p, x:Math.round(+p.x || 0), y:Math.round(+p.y || 0), w:Math.max(1, Math.round(+p.w || sz[0])), h:Math.max(1, Math.round(+p.h || sz[1])) }; };
  const levels = data.levels.map(l => ({ ...l, parts:(l.parts || []).map(norm) }));
  const all = levels.flatMap(l => l.parts);
  if (!all.length) throw new Error('That Battle Table save has no map pieces on any level.');
  const x0 = Math.min(...all.map(p => p.x)) - 1, y0 = Math.min(...all.map(p => p.y)) - 1;
  const W = Math.max(...all.map(p => p.x + p.w)) - x0 + 1, H = Math.max(...all.map(p => p.y + p.h)) - y0 + 1;
  const floors = levels.map((lv, L) => {
    const owner = Array.from({ length:H }, () => new Array(W).fill(-1));
    const cells = Array.from({ length:H }, () => Array.from({ length:W }, () => ({ kind:'rock' })));
    lv.parts.forEach((p, k) => { for (let y = p.y - y0; y < p.y - y0 + p.h; y++) for (let x = p.x - x0; x < p.x - x0 + p.w; x++){ owner[y][x] = k; cells[y][x] = { kind:'floor' }; } });
    // shared edges become wall (on the left / upper piece)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const a = owner[y][x]; if (a < 0) continue;
      const r = x + 1 < W ? owner[y][x + 1] : -1, d = y + 1 < H ? owner[y + 1][x] : -1;
      if ((r >= 0 && r !== a) || (d >= 0 && d !== a)) cells[y][x] = { kind:'rock', wall:true };
    }
    // connections reopen the wall
    lv.parts.forEach((p, pi) => {
      for (const c of p.conns || []){
        const w = BT_CONN_W[c.t] ?? 1, px = p.x - x0, py = p.y - y0, a = +c.o || 0, b = a + w;
        const tiles = [], single = c.t === 'door' || c.t === 'secret';
        const t0 = single ? Math.floor((a + b) / 2) : Math.floor(a + .001), t1 = single ? t0 + 1 : Math.ceil(b - .001);
        for (let t = t0; t < t1; t++){
          // [inside cell, outside cell] for this step along the edge (edges run clockwise from each corner)
          if (c.e === 'n') tiles.push([[px + t, py], [px + t, py - 1]]);
          else if (c.e === 'e') tiles.push([[px + p.w - 1, py + t], [px + p.w, py + t]]);
          else if (c.e === 's') tiles.push([[px + p.w - 1 - t, py + p.h - 1], [px + p.w - 1 - t, py + p.h]]);
          else tiles.push([[px, py + p.h - 1 - t], [px - 1, py + p.h - 1 - t]]);
        }
        const mid = Math.floor((tiles.length - 1) / 2), [ox, oy] = { n:[0, -1], e:[1, 0], s:[0, 1], w:[-1, 0] }[c.e] || [0, 0];
        // a connection into empty space: the Battle Table lets pieces float a square or two apart, so bridge the gap
        if (c.t !== 'window') for (const [, [sx, sy]] of tiles){
          if (!cells[sy]?.[sx] || cells[sy][sx].kind !== 'rock' || cells[sy][sx].wall) continue;
          const path = []; let hit = false;
          for (let k = 0, x = sx, y = sy; k < 4 && cells[y]?.[x]; k++, x += ox, y += oy){
            if (cells[y][x].kind !== 'rock' || cells[y][x].wall){ hit = true; for (const [px2, py2] of path) cells[py2][px2] = { kind:'floor' }; break; }
            path.push([x, y]);
          }
          if (hit) continue;
          // not straight ahead: join the nearest other piece within 6 squares with an L-shaped passage
          let best = null;
          for (let y = sy - 6; y <= sy + 6; y++) for (let x = sx - 6; x <= sx + 6; x++){
            if (!cells[y]?.[x] || cells[y][x].kind === 'rock' || owner[y][x] === pi || owner[y][x] < 0) continue;
            const dd = Math.abs(x - sx) + Math.abs(y - sy); if (!best || dd < best.d) best = { x, y, d:dd };
          }
          if (best){
            let x = sx, y = sy; const open = () => { if (cells[y][x].kind === 'rock') cells[y][x] = { kind:'floor' }; };
            open(); while (x !== best.x){ x += Math.sign(best.x - x); open(); } while (y !== best.y){ y += Math.sign(best.y - y); open(); }
          }
        }
        tiles.forEach((pair, i) => {
          for (const [cx, cy] of pair){
            const cell = cells[cy]?.[cx]; if (!cell || !cell.wall) continue;
            if (c.t === 'window') continue;
            cells[cy][cx] = { kind:'floor', ...((c.t === 'door' || c.t === 'secret') && i === mid ? { door:c.t === 'secret' ? 'secret' : 'closed' } : {}) };
          }
        });
      }
    });
    // stairwells
    for (const p of lv.parts.filter(p => p.k === 'stairs')){
      const cx = p.x - x0 + Math.floor(p.w / 2), cy = p.y - y0 + Math.floor(p.h / 2);
      cells[cy][cx] = { kind:p.dir === 'up' ? 'up' : 'down' };
    }
    const rooms = lv.parts.filter(p => p.k !== 'corridor' && p.k !== 'tunnel' && p.k !== 'road').map(p => ({
      x:p.x - x0, y:p.y - y0, w:p.w, h:p.h, name:p.name || p.k, type:BT_TAG_TYPE[p.tag] || BT_KIND_TYPE[p.k] || 'chamber', notes:[p.tag, p.notes].filter(Boolean).join(' — ') }));
    const tokens = (data.roster || []).filter(t => (t.lvl ?? 0) === L && !t.dead).map(t => ({
      name:t.name + (t.n > 1 ? ` ${t.n}` : ''), x:Math.round(+t.x) - x0, y:Math.round(+t.y) - y0, bid:t.mid || null, hp:t.hp, ac:t.ac, kind:t.pid ? 'pc' : null }));
    if (lv.bg?.src) warnings.push(`${lv.name || `Level ${L + 1}`}: the painting under the map was left behind (Dread Delve builds its own 3D stone).`);
    return { name:lv.name || `Level ${L + 1}`, W, H, cells, rooms, tokens, notes:lv.notes || '' };
  });
  return { floors, warnings, name:data.name && data.name !== 'Untitled Map' ? data.name : null, active:Math.min(+data.active || 0, floors.length - 1) };
}

export function parseMapInput(input){
  const warnings = [];
  let data = input;
  if (typeof input === 'string'){
    const s = input.trim();
    if (s.startsWith('{') || s.startsWith('[')){ try { data = JSON.parse(s); } catch (e){ throw new Error('That looks like JSON but does not parse: ' + e.message); } }
    else {
      const chunks = []; let cur = [], nm = null;
      for (const line of s.split('\n')){
        const m = line.match(/^\s*(?:---|===)\s*(.*?)\s*(?:---|===)?\s*$/);
        if (m){ if (cur.some(l => l.trim())) chunks.push(parseAsciiFloor(cur, nm)); cur = []; nm = m[1] || null; }
        else cur.push(line);
      }
      if (cur.some(l => l.trim())) chunks.push(parseAsciiFloor(cur, nm));
      if (!chunks.length) throw new Error('No map found in that text.');
      return { floors:chunks.map(c => ({ ...c, rooms:[], tokens:[] })), warnings };
    }
  }
  if (isBattleTable(data)) return parseBattleTable(data);
  let list;
  if (Array.isArray(data)){
    if (typeof data[0] === 'string' || Array.isArray(data[0])) list = [{ grid:data }];
    else list = data;
  } else list = data.floors || data.levels || data.maps || data.scenes || data.pages || [data];
  const floors = list.map((o, i) => parseJsonFloor(o || {}, o?.name || `Imported floor ${i + 1}`, warnings));
  if (!floors.some(f => f.cells?.some(r => r.some(c => c.kind !== 'rock')))) throw new Error('Found a file, but no walkable squares in it. Send this file to Claude Code to teach the importer its format.');
  return { floors, warnings, name:data.name || data.title };
}

// Open areas at least 3×3 become rooms (bounding boxes of 3×3-clear "interior" squares, grown by one).
export function detectRooms(cells, W, H){
  const open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && cells[y][x].kind !== 'rock' && !cells[y][x].door;
  const interior = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!open(x + dx, y + dy)) return false; return true; };
  const seen = new Set(), rooms = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    if (seen.has(y * W + x) || !interior(x, y)) continue;
    let x0 = x, x1 = x, y0 = y, y1 = y; const q = [[x, y]]; seen.add(y * W + x);
    while (q.length){
      const [cx, cy] = q.pop(); x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = cx + dx, ny = cy + dy; if (!seen.has(ny * W + nx) && nx >= 0 && ny >= 0 && nx < W && ny < H && interior(nx, ny)){ seen.add(ny * W + nx); q.push([nx, ny]); } }
    }
    // grow by one where the border is open
    const r = { x:x0 - 1, y:y0 - 1, w:x1 - x0 + 3, h:y1 - y0 + 3 };
    r.x = Math.max(0, r.x); r.y = Math.max(0, r.y); r.w = Math.min(W - r.x, r.w); r.h = Math.min(H - r.y, r.h);
    rooms.push({ ...r, name:'', type:'chamber', notes:'' });
  }
  return rooms;
}

/* Turn one parsed floor into a Dread Delve floor of size×size (cropped or padded, top-left aligned).
   link = { up, down } forces the stairs to line up with the floors above/below. */
export function buildImportedFloor(pf, L, size, theme, link = {}){
  const warnings = [];
  if (pf.W > size || pf.H > size) warnings.push(`${pf.name || 'Floor'} is ${pf.W}×${pf.H}; cropped to ${size}×${size}.`);
  const N = size * size, base = new Array(N).fill(T.ROCK), doors = [], traps = []; let up = null, down = null;
  const f = { level:L, W:size, H:size, theme, name:pf.name || `Imported Floor ${L + 1}`, rooms:[], nextId:0, edges:[], corridors:[], autoLink:false,
              up:null, down:null, grid:null, dug:[], filled:[], doors, traps, base, nextObj:1, imported:true };
  for (let y = 0; y < Math.min(size, pf.H); y++) for (let x = 0; x < Math.min(size, pf.W); x++){
    const c = pf.cells[y][x], i = y * size + x;
    if (c.kind === 'rock') continue;
    base[i] = T.HALL;
    if (c.kind === 'down') down = { x, y }; if (c.kind === 'up') up = { x, y };
    if (c.door) doors.push({ id:f.nextObj++, i, state:['open', 'closed', 'locked', 'secret'].includes(c.door) ? c.door : 'closed', dc:14 });
    if (c.trap) traps.push({ id:f.nextObj++, i, kind:TRAP_KINDS[c.trap] ? c.trap : 'pit', armed:true, found:false });
  }
  const crop = r => ({ ...r, w:Math.min(r.w, size - r.x), h:Math.min(r.h, size - r.y) });
  const rooms = (pf.rooms?.length ? pf.rooms : detectRooms(pf.cells, pf.W, pf.H)).filter(r => r.x < size && r.y < size).map(crop).filter(r => r.w > 0 && r.h > 0);
  for (const r of rooms){
    const room = recalcRoom({ id:f.nextId++, x:r.x, y:r.y, w:r.w, h:r.h, type:r.type || 'chamber', name:r.name || pick(ROOM_NAMES[r.type || 'chamber']), notes:r.notes || '' });
    f.rooms.push(room);
    for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++){ const i = y * size + x; if (base[i] === T.HALL && !doors.some(d => d.i === i)) base[i] = T.ROOM; }
  }
  if (!f.rooms.length){
    // no open areas: make a 1×1 "room" at the first walkable square so the rest of the app has an anchor
    const i = base.findIndex(walk); if (i < 0) throw new Error('That floor has no walkable squares.');
    f.rooms.push(recalcRoom({ id:f.nextId++, x:i % size, y:(i / size) | 0, w:1, h:1, type:'chamber', name:'Landing', notes:'' }));
  }
  // stairs: the neighbours win, so the stack still lines up
  if (link.up !== undefined){ if (up && link.up && (up.x !== link.up.x || up.y !== link.up.y)) warnings.push('Stairs up moved to line up with the floor above.'); up = link.up; }
  if (link.down !== undefined){ if (down && link.down && (down.x !== link.down.x || down.y !== link.down.y)) warnings.push('Stairs down moved to line up with the floor below.'); down = link.down; }
  f.up = up; f.down = down;
  const landing = up ? f.rooms.find(r => up.x >= r.x && up.x < r.x + r.w && up.y >= r.y && up.y < r.y + r.h) || nearestRoom(f, up.x, up.y) : null;
  if (landing){ f.rooms.splice(f.rooms.indexOf(landing), 1); f.rooms.unshift(landing); landing.type = 'entrance'; }
  carve(f);
  f.props = (pf.props || []).filter(p => p.x < size && p.y < size).map(p => ({ id:f.nextObj++, ...p }));
  f.buildings = (pf.buildings || []).filter(b => b.x < size && b.y < size);
  f.rough = (pf.rough || []).filter(p => p.x < size && p.y < size).map(p => p.y * f.W + p.x).filter(i => walk(f.grid[i]) && f.grid[i] !== T.UP && f.grid[i] !== T.DOWN);
  return { floor:f, warnings, tokens:pf.tokens || [] };
}

// Pick a stairs-down spot: the walkable square farthest (in room-centre terms) from the stairs up.
export function farStairs(f){
  const from = f.up || { x:f.rooms[0].cx, y:f.rooms[0].cy };
  let best = null, bd = -1;
  for (const r of f.rooms){ const dd = Math.abs(r.cx - from.x) + Math.abs(r.cy - from.y); if (dd > bd && !(r.cx === from.x && r.cy === from.y)){ bd = dd; best = r; } }
  if (best) return { x:best.cx, y:best.cy };
  const i = f.grid.findIndex((v, i) => walk(v) && i !== from.y * f.W + from.x); return i < 0 ? null : { x:i % f.W, y:(i / f.W) | 0 };
}

export function floorToAscii(f){
  const rows = [];
  for (let y = 0; y < f.H; y++){
    let s = '';
    for (let x = 0; x < f.W; x++){
      const i = y * f.W + x, v = f.grid[i], dr = f.doors.find(d => d.i === i), tr = f.traps.find(t => t.i === i);
      s += v === T.DOWN ? '>' : v === T.UP ? '<' : !walk(v) ? '#' : dr ? { open:"'", closed:'+', locked:'L', secret:'S' }[dr.state] : tr ? '^' : '.';
    }
    rows.push(s);
  }
  // trim fully-rock border rows at the bottom/right to keep it readable
  while (rows.length > 1 && /^#*$/.test(rows[rows.length - 1]) && /^#*$/.test(rows[rows.length - 2])) rows.pop();
  return `=== ${f.name} ===\n` + rows.join('\n');
}
export function floorToJSON(f){
  const rows = []; for (let y = 0; y < f.H; y++){ let s = ''; for (let x = 0; x < f.W; x++){ const v = f.grid[y * f.W + x]; s += v === T.DOWN ? '>' : v === T.UP ? '<' : walk(v) ? '.' : '#'; } rows.push(s); }
  const xy = i => ({ x:i % f.W, y:(i / f.W) | 0 });
  return { name:f.name, width:f.W, height:f.H, grid:rows,
    rooms:f.rooms.map(r => ({ x:r.x, y:r.y, w:r.w, h:r.h, name:r.name, type:r.type, notes:r.notes })),
    doors:f.doors.map(d => ({ ...xy(d.i), state:d.state })), traps:f.traps.map(t => ({ ...xy(t.i), kind:t.kind })),
    stairs:[...(f.up ? [{ ...f.up, dir:'up' }] : []), ...(f.down ? [{ ...f.down, dir:'down' }] : [])],
    props:(f.props || []).map(p => ({ k:p.k, x:p.x, y:p.y, rot:p.rot || 0 })), buildings:f.buildings || [], rough:(f.rough || []).map(i => ({ x:i % f.W, y:(i / f.W) | 0 })) };
}
