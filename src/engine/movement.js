/* MOVEMENT RULES — the parts of moving that are pure logic: tracing a dragged route, checking a route a player
   sends, who threatens which squares, where a move provokes opportunity attacks, the party trailing its
   leader in marching order, a group keeping its formation, and a monster closing in on the nearest foe.
   Pure: reads `state`, no DOM, no Three.js. Positions are top-left squares (a Large creature covers 2×2). */
import { state, tokenAt, side } from './state.js';
import { reach, canStep, pathTo, pathCost, roughSet, passMove } from './grid.js';
import { DIRS } from './grid.js';

const RANGED = /(bow|sling)\b|\b(darts?|javelins?|throw|thrown|spit|blast|ray|bolt|sacred flame|spray|breath|net)\b/i;
const LONG = /\b(glaive|halberd|pike|lance|whip)\b/i;
const NO_REACTION = ['paralyzed', 'stunned', 'incapacitated', 'restrained', 'unconscious'];

// Melee attacks: a hero's weapons are marked (m), spells carry a level or a spell name; a monster's are
// melee unless they read like something thrown or shot.
export const meleeAttacks = t => (t.attacks || []).map((a, i) => ({ a, i })).filter(({ a }) => a.m || (!a.l && !a.sn && !a.rays && !RANGED.test(a.n || '')));
// Reach in squares: 2 for a reach weapon (or an attack marked reach:2), else 1. No melee attack: no reach.
export function threatReach(t){
  const ms = meleeAttacks(t); if (!ms.length) return 0;
  return ms.some(({ a }) => (a.reach || 0) >= 2 || LONG.test(a.n || '')) ? 2 : 1;
}
// The melee attack to swing with on an opportunity: the best to-hit.
export const bestMelee = t => meleeAttacks(t).sort((p, q) => (q.a.b || 0) - (p.a.b || 0))[0]?.i ?? null;

// Squares between two footprints (0 = overlapping, 1 = touching).
export function gap(ax, ay, as, bx, by, bs){
  const dx = Math.max(0, bx - (ax + as - 1), ax - (bx + bs - 1)), dy = Math.max(0, by - (ay + as - 1), ay - (by + bs - 1));
  return Math.max(dx, dy);
}
export const tokGap = (a, b, ax = a.x, ay = a.y) => gap(ax, ay, a.size || 1, b.x, b.y, b.size || 1);

// Can this creature make an opportunity attack right now?
export const canReact = o => !o.dead && !o.flags?.gone && !o.reacted && !(o.conds || []).some(c => NO_REACTION.includes(c.n)) && threatReach(o) > 0;

/* Where does walking `path` from (t.x, t.y) leave an enemy's reach? → [{ by, at }] with `at` the index in the
   path of the last square still in reach (-1 = the start square). Each enemy once, in path order.
   `skip` holds enemies that already passed on this move. Disengaging, or moving outside a fight, provokes nothing. */
export function provokers(t, path, { skip = [], tokens = state.tokens } = {}){
  if (!state.combat?.active || t.disengaged || !path.length) return [];
  const pos = [{ x:t.x, y:t.y }, ...path], out = [];
  for (const o of tokens){
    if (o.id === t.id || o.floor !== t.floor || side(o) === side(t) || skip.includes(o.id) || !canReact(o)) continue;
    const R = threatReach(o);
    for (let k = 0; k < pos.length - 1; k++){
      if (tokGap(t, o, pos[k].x, pos[k].y) <= R && tokGap(t, o, pos[k + 1].x, pos[k + 1].y) > R){ out.push({ by:o.id, at:k - 1 }); break; }
    }
  }
  return out.sort((p, q) => p.at - q.at);
}

// Every square of a creature's space is open ground with no one else in it.
export function fits(L, x, y, size, selfId, taken){
  const f = state.floors[L];
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++){
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H || !passMove(f, ny * f.W + nx)) return false;
    const o = tokenAt(L, nx, ny); if (o && o.id !== selfId) return false;
    if (taken?.has(ny * f.W + nx)) return false;
  }
  return true;
}

/* Check a route someone sent (a dragged path from a player's device): every step a legal one, no enemy in the
   way, not ending on anyone, and within `limit` squares (difficult terrain double). → its cost, or -1. */
export function checkPath(t, path, limit){
  const f = state.floors[t.floor]; if (!Array.isArray(path) || !path.length || path.length > 200) return -1;
  let x = t.x, y = t.y;
  for (const p of path){
    if (!p || !Number.isInteger(p.x) || !Number.isInteger(p.y)) return -1;
    const dx = p.x - x, dy = p.y - y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (!dx && !dy) || !canStep(f, x, y, dx, dy)) return -1;
    const o = tokenAt(t.floor, p.x, p.y); if (o && o.id !== t.id && side(o) !== side(t)) return -1;
    x = p.x; y = p.y;
  }
  const end = path[path.length - 1];
  if (!fits(t.floor, end.x, end.y, t.size || 1, t.id)) return -1;
  const cost = pathCost(f, path);
  return cost <= limit ? cost : -1;
}

/* Tracing a route by dragging: the finger passes over (x, y). Back over a square already on the route cuts the
   route back to it; the next square along is added; a jump is bridged with the shortest way there.
   `limit` caps how far the route can go (the whole move with a Dash). Returns the new route (a new array). */
export function extendPath(t, path, x, y, limit){
  const f = state.floors[t.floor];
  if (x === t.x && y === t.y) return [];
  const at = path.findIndex(p => p.x === x && p.y === y);
  if (at >= 0) return path.slice(0, at + 1);
  const end = path.length ? path[path.length - 1] : { x:t.x, y:t.y }, used = pathCost(f, path);
  if (used >= limit) return path;
  const dx = x - end.x, dy = y - end.y;
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && canStep(f, end.x, end.y, dx, dy)){
    const o = tokenAt(t.floor, x, y);
    if ((!o || o.id === t.id || side(o) === side(t)) && used + pathCost(f, [{ x, y }]) <= limit) return [...path, { x, y }];
  }
  const R = reach(t.floor, end.x, end.y, limit - used, t.id), i = y * f.W + x;
  if (!R.par.has(i)) return path;
  const bridge = pathTo(R.par, f.W, i);
  // a bridge never doubles back over the route already traced
  const seen = new Set(path.map(p => p.y * f.W + p.x));
  return bridge.some(p => seen.has(p.y * f.W + p.x)) ? path : [...path, ...bridge];
}

/* Where each follower goes when the leader walks `path` (outside a fight): single file along the leader's
   trail, in marching order — the first takes the square the leader left last, and so on; a short move has
   the line close up behind (each follower takes the square of the one ahead). → [{ id, x, y }] */
export function trailTargets(leader, path, followers){
  const trail = [...path].reverse().slice(1);
  trail.push({ x:leader.x, y:leader.y });
  for (const f of followers) trail.push({ x:f.x, y:f.y });
  const out = [], used = new Set([`${path.length ? path[path.length - 1].x : leader.x},${path.length ? path[path.length - 1].y : leader.y}`]);
  let k = 0;
  for (const fo of followers){
    while (k < trail.length && used.has(`${trail[k].x},${trail[k].y}`)) k++;
    const p = trail[Math.min(k, trail.length - 1)]; used.add(`${p.x},${p.y}`); k++;
    out.push({ id:fo.id, x:p.x, y:p.y });
  }
  return out;
}
// A group keeps its shape: each member goes to the leader's end square plus its offset from the leader.
export function formationTargets(leader, end, members){
  return members.map(m => ({ id:m.id, x:end.x + (m.x - leader.x), y:end.y + (m.y - leader.y) }));
}

/* Plan the way for one creature to (or as near as it can get to) a target square: the reachable square
   closest to the target (then the cheapest), skipping squares already claimed by the group. → path or null. */
export function planToward(t, tx, ty, limit, taken){
  const f = state.floors[t.floor], R = reach(t.floor, t.x, t.y, limit, t.id), size = t.size || 1;
  let best = null, bd = Infinity, bc = Infinity;
  for (const [i, c] of R.dist){
    const x = i % f.W, y = (i / f.W) | 0;
    if (!fits(t.floor, x, y, size, t.id, taken)) continue;
    const dd = Math.max(Math.abs(x - tx), Math.abs(y - ty));
    if (dd < bd || (dd === bd && c < bc)){ best = i; bd = dd; bc = c; }
  }
  if (best === null || best === t.y * f.W + t.x) return null;
  return pathTo(R.par, f.W, best);
}
// Mark the squares a creature will stand on, so the next member of a group doesn't plan to stand there too.
export function claim(taken, f, x, y, size = 1){ for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) taken.add((y + dy) * f.W + x + dx); }

/* A monster closes in: the reachable square nearest to the nearest enemy, ideally within its reach (or, with
   no melee attack, wherever it gets closest). Ties go to the shortest walk. → { path, target } or null. */
export function closeIn(t, limit, foes = null){
  const f = state.floors[t.floor], size = t.size || 1, R = reach(t.floor, t.x, t.y, limit, t.id), rr = Math.max(1, threatReach(t));
  const list = (foes || state.tokens.filter(o => o.floor === t.floor && !o.dead && !o.flags?.gone && side(o) !== side(t)));
  if (!list.length) return null;
  const nearest = list.reduce((b, o) => tokGap(t, o) < tokGap(t, b) ? o : b);
  if (tokGap(t, nearest) <= rr) return { path:[], target:nearest };    // already there
  let best = null, score = Infinity;
  for (const [i, c] of R.dist){
    const x = i % f.W, y = (i / f.W) | 0;
    if (!fits(t.floor, x, y, size, t.id)) continue;
    const g = Math.min(...list.map(o => gap(x, y, size, o.x, o.y, o.size || 1)));
    const s = Math.max(g, rr) * 1000 + c;
    if (g > 0 && s < score){ score = s; best = i; }
  }
  if (best === null || best === t.y * f.W + t.x) return null;
  return { path:pathTo(R.par, f.W, best), target:nearest };
}

// Is the square one step from (x, y) in direction (dx, dy) a legal step for this creature?
export function stepTo(t, dx, dy){
  const f = state.floors[t.floor];
  if (!canStep(f, t.x, t.y, dx, dy)) return null;
  return { x:t.x + dx, y:t.y + dy };
}
export { DIRS, roughSet };
