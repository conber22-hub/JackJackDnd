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

/* Difficult terrain (f.rough: square indexes — mud, rubble, black water to the knee) costs 2 squares to enter.
   reach: every square reachable within `limit` squares of movement → { par: index -> parent, dist: index -> cost } */
export const roughSet = f => new Set(f.rough || []);
export function reach(L, sx, sy, limit, moverId){
  const f = state.floors[L], start = sy * f.W + sx, par = new Map([[start, -1]]), dist = new Map([[start, 0]]);
  const mover = tokById(moverId) || {}, rough = roughSet(f), buckets = [[start]];
  for (let d = 0; d < buckets.length; d++) for (const i of buckets[d] || []){
    if (dist.get(i) !== d || d >= limit) continue;
    const x = i % f.W, y = (i / f.W) | 0;
    for (const [dx, dy] of DIRS){
      if (!canStep(f, x, y, dx, dy)) continue;
      const ni = (y + dy) * f.W + x + dx, nd = d + (rough.has(ni) ? 2 : 1);
      if (nd > limit || (dist.has(ni) && dist.get(ni) <= nd)) continue;
      const blocker = tokenAt(L, x + dx, y + dy);
      if (blocker && blocker.id !== moverId && side(blocker) !== side(mover)) continue; // can't walk through enemies
      par.set(ni, i); dist.set(ni, nd); (buckets[nd] ||= []).push(ni);
    }
  }
  return { par, dist };
}
// What walking a path costs, in squares (difficult terrain counts double).
export function pathCost(f, path){ const rough = roughSet(f); return path.reduce((s, p) => s + (rough.has(p.y * f.W + p.x) ? 2 : 1), 0); }
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

/* LINE OF SIGHT — a square is seen if a straight line reaches it from the middle of the viewer's square
   (to its middle or near one of its corners) without crossing anything that blocks sight: rock, buildings,
   trees, closed doors. A line squeezing between two blocking squares that touch at a corner is blocked.
   Props don't block (they are scenery). The blocking square itself is seen, so walls and doors show. */
export function lineClear(f, x0, y0, x1, y1, pass = passSight){
  let x = Math.floor(x0), y = Math.floor(y0);
  const tx = Math.floor(x1), ty = Math.floor(y1), dx = x1 - x0, dy = y1 - y0, sx = Math.sign(dx), sy = Math.sign(dy);
  const open = (a, b) => a >= 0 && b >= 0 && a < f.W && b < f.H && pass(f, b * f.W + a);
  let tMaxX = dx ? ((sx > 0 ? x + 1 : x) - x0) / dx : Infinity, tMaxY = dy ? ((sy > 0 ? y + 1 : y) - y0) / dy : Infinity;
  const tdx = dx ? Math.abs(1 / dx) : Infinity, tdy = dy ? Math.abs(1 / dy) : Infinity;
  for (let guard = 0; guard < 400 && (x !== tx || y !== ty); guard++){
    if (Math.abs(tMaxX - tMaxY) < 1e-9){
      if (!open(x + sx, y) && !open(x, y + sy)) return false;
      x += sx; y += sy; tMaxX += tdx; tMaxY += tdy;
    } else if (tMaxX < tMaxY){ x += sx; tMaxX += tdx; }
    else { y += sy; tMaxY += tdy; }
    if (x === tx && y === ty) return true;
    if (!open(x, y)) return false;
  }
  return true;
}
const AIM = [[.5, .5], [.15, .15], [.85, .15], [.15, .85], [.85, .85]];
export function canSee(f, x0, y0, x1, y1, pass = passSight){
  if (x0 === x1 && y0 === y1) return true;
  return AIM.some(([ax, ay]) => lineClear(f, x0 + .5, y0 + .5, x1 + ax, y1 + ay, pass));
}
// How far a creature sees (squares): 12 (60 ft.), a creature's own `sight` if it has one, 1 when blinded.
export const sightRange = t => t.conds?.some(c => c.n === 'blinded') ? 1 : t.sight || 12;
export function vision(t){
  const f = state.floors[t.floor], seen = new Set(), R = sightRange(t), R2 = (R + .5) * (R + .5);
  for (let y = Math.max(0, t.y - R); y <= Math.min(f.H - 1, t.y + R); y++) for (let x = Math.max(0, t.x - R); x <= Math.min(f.W - 1, t.x + R); x++){
    const i = y * f.W + x;
    if (!walk(f.grid[i]) || (x - t.x) ** 2 + (y - t.y) ** 2 > R2) continue;
    if (canSee(f, t.x, t.y, x, y)) seen.add(i);
  }
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
