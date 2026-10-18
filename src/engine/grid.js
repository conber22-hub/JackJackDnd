/* MOVEMENT, SIGHT & DISCOVERY on a floor grid. Doors matter here:
   open = walk & see through · closed = walk (it opens) but blocks sight · locked / secret = wall.
   Pure: reads `state`, no DOM. */
import { T, walk } from './tiles.js';
import { doorAt } from './generator.js';
import { TRAP_KINDS } from '../data/rooms.js';
import { state, tokById, tokenAt, side } from './state.js';
import { cheb } from '../util/core.js';

export const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
export const ORTHO = DIRS.slice(0, 4);

const doorState = (f, i) => f.doors?.length ? doorAt(f, i)?.state : undefined;
export function passMove(f, i){ if (!walk(f.grid[i])) return false; const s = doorState(f, i); return s !== 'locked' && s !== 'secret'; }
export function passSight(f, i){ if (!walk(f.grid[i])) return false; const s = doorState(f, i); return !s || s === 'open'; }

export function canStep(f, x, y, dx, dy, pass = passMove){
  const nx = x + dx, ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H || !pass(f, ny * f.W + nx)) return false;
  if (dx && dy){
    if (!pass(f, y * f.W + nx) || !pass(f, ny * f.W + x)) return false;                 // no corner cutting
    if (doorState(f, y * f.W + x) || doorState(f, ny * f.W + nx)) return false;          // doors are walked through straight
  }
  return true;
}

// Breadth-first search: Map(index -> parentIndex) of every tile reachable in `limit` squares.
export function reach(L, sx, sy, limit, moverId){
  const f = state.floors[L], start = sy * f.W + sx, par = new Map([[start, -1]]), dist = new Map([[start, 0]]);
  const mover = tokById(moverId) || {};
  let q = [start];
  while (q.length){
    const nq = [];
    for (const i of q){
      const x = i % f.W, y = (i / f.W) | 0, dd = dist.get(i);
      if (dd >= limit) continue;
      for (const [dx, dy] of DIRS){
        if (!canStep(f, x, y, dx, dy)) continue;
        const ni = (y + dy) * f.W + x + dx; if (par.has(ni)) continue;
        const blocker = tokenAt(L, x + dx, y + dy);
        if (blocker && blocker.id !== moverId && side(blocker) !== side(mover)) continue; // can't walk through enemies
        par.set(ni, i); dist.set(ni, dd + 1); nq.push(ni);
      }
    }
    q = nq;
  }
  return { par, dist };
}
export function pathTo(par, W, target){ const out = []; let i = target; while (i !== -1 && i !== undefined){ out.push(i); i = par.get(i); } out.reverse(); return out.slice(1).map(i => ({ x:i % W, y:(i / W) | 0 })); }

// Flood through tiles you can see across; a closed door is itself visible but nothing past it.
export function reachSight(f, sx, sy, limit, pass = passSight){
  const start = sy * f.W + sx, dist = new Map([[start, 0]]); let q = [start];
  while (q.length){
    const nq = [];
    for (const i of q){
      const x = i % f.W, y = (i / f.W) | 0, dd = dist.get(i);
      if (dd >= limit || (i !== start && !pass(f, i))) continue;
      for (const [dx, dy] of DIRS){
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H) continue;
        const ni = ny * f.W + nx; if (dist.has(ni) || !walk(f.grid[ni])) continue;
        if (dx && dy && (!pass(f, y * f.W + nx) || !pass(f, ny * f.W + x))) continue;
        dist.set(ni, dd + 1); nq.push(ni);
      }
    }
    q = nq;
  }
  return { dist };
}

// What a creature can see: up to 7 squares through open ground, plus the whole room it stands in.
export function vision(t){
  const f = state.floors[t.floor], seen = new Set(), { dist } = reachSight(f, t.x, t.y, t.conds?.some(c => c.n === 'blinded') ? 1 : 7);
  for (const i of dist.keys()) seen.add(i);
  const r = f.rooms.find(r => t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h);
  if (r && !t.conds?.some(c => c.n === 'blinded')) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) seen.add(y * f.W + x);
  return seen;
}
export const seenNow = {};   // floor -> Set of tiles the party can see this moment
export function updateVision(){
  for (const k of Object.keys(seenNow)) delete seenNow[k];
  for (const L in state.floors) seenNow[L] = new Set();
  let grew = false;
  for (const t of state.tokens){
    if (t.kind === 'monster' || t.dead || t.flags?.gone) continue;
    for (const i of vision(t)){ seenNow[t.floor].add(i); if (!state.explored[t.floor].has(i)){ state.explored[t.floor].add(i); grew = true; } }
  }
  return grew;
}
export const canSeeTile = (L, x, y) => !!seenNow[L]?.has(y * state.floors[L].W + x);

// Passive Perception: party members notice hidden traps and secret doors within 2 squares they can see.
export function detectHidden(){
  const found = [];
  for (const t of state.tokens){
    if (t.kind === 'monster' || t.dead || t.flags?.gone) continue;
    const f = state.floors[t.floor], seen = seenNow[t.floor] || new Set();
    for (const tr of f.traps) if (!tr.found && tr.armed && seen.has(tr.i) && cheb(t.x, t.y, tr.i % f.W, (tr.i / f.W) | 0) <= 2 && (t.passive || 10) >= (tr.find ?? TRAP_KINDS[tr.kind]?.find ?? 13)){
      tr.found = true; found.push({ who:t, what:'trap', obj:tr, floor:t.floor });
    }
    for (const dr of f.doors) if (dr.state === 'secret' && cheb(t.x, t.y, dr.i % f.W, (dr.i / f.W) | 0) <= 2 && (t.passive || 10) >= dr.dc){
      dr.state = 'closed'; dr.found = true; found.push({ who:t, what:'door', obj:dr, floor:t.floor });
    }
  }
  return found;
}

export function freeTilesNear(L, x, y, n, includeSelf = false){
  const f = state.floors[L], { dist } = reachSight(f, x, y, 12, passMove);
  return [...dist.entries()].filter(([i]) => passMove(f, i)).sort((a, b) => a[1] - b[1]).map(([i]) => ({ x:i % f.W, y:(i / f.W) | 0 }))
    .filter(p => (includeSelf || p.x !== x || p.y !== y) && !tokenAt(L, p.x, p.y)).slice(0, n);
}
export function randomRoomTile(L, rng = Math.random, filter = () => true){
  const f = state.floors[L], rooms = f.rooms.filter(filter); if (!rooms.length) return null;
  for (let k = 0; k < 40; k++){
    const r = rooms[Math.floor(rng() * rooms.length)], x = r.x + Math.floor(rng() * r.w), y = r.y + Math.floor(rng() * r.h);
    if (passMove(f, y * f.W + x) && !tokenAt(L, x, y) && f.grid[y * f.W + x] === T.ROOM) return { x, y, room:r };
  }
  return null;
}
