/* CAVES — the mines, the Hand-Warrens and the deep places are dug, not built. After a floor is carved from its
   rooms and corridors, cavify() roughens it: room edges are eaten away and bulge out into the rock, and the tunnels
   wander wider and narrower. Every square that could be walked to before can still be walked to, the stairs stay
   where they are, and the room rectangles (which the dresser, the labels and the read-alouds use) don't move.
   It works only through the floor's own editing lists (dug, filled), so the Build tools keep working on a cave.
   Pure: no DOM, no Three.js. */
import { T, walk } from './tiles.js';
import { carve } from './generator.js';

// Every walkable square reachable from `from`, stepping orthogonally (a cave must not hide behind a diagonal).
export function reachable(f, from){
  const seen = new Set([from]), q = [from], W = f.W;
  while (q.length){
    const i = q.pop(), x = i % W;
    for (const j of [x + 1 < W ? i + 1 : -1, x > 0 ? i - 1 : -1, i + W, i - W])
      if (j >= 0 && j < f.grid.length && !seen.has(j) && walk(f.grid[j])){ seen.add(j); q.push(j); }
  }
  return seen;
}

// The square everything should be reachable from: the way up, else the first room's centre.
const startOf = f => f.up ? f.up.y * f.W + f.up.x : f.rooms[0].cy * f.W + f.rooms[0].cx;

/* rough: 0..1, how ragged. Returns the floor (changed in place). */
export function cavify(f, rng, rough = .5){
  const W = f.W, H = f.H, at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? T.ROCK : f.grid[y * W + x];
  const before = reachable(f, startOf(f)), apart = new Set();   // apart: squares that were already cut off (left alone)
  f.grid.forEach((v, i) => { if (walk(v) && !before.has(i)) apart.add(i); });
  const cutOff = now => { const out = []; for (let i = 0; i < f.grid.length; i++) if (walk(f.grid[i]) && !now.has(i) && !apart.has(i)) out.push(i); return out; };
  const stairs = new Set([f.up, f.down].filter(Boolean).map(s => s.y * W + s.x));
  const keep = i => stairs.has(i) || [...stairs].some(s => Math.abs(s % W - i % W) + Math.abs(((s / W) | 0) - ((i / W) | 0)) <= 1);
  const fills = new Set(), digs = new Set(), inside = (x, y) => x >= 2 && y >= 2 && x < W - 2 && y < H - 2;
  for (const r of f.rooms){
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++){
      const edge = x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1; if (!edge) continue;
      const i = y * W + x, corner = (x === r.x || x === r.x + r.w - 1) && (y === r.y || y === r.y + r.h - 1);
      // never where a tunnel comes in, never by the stairs
      if (keep(i) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) === T.HALL)) continue;
      if (rng() < (corner ? .45 + rough * .45 : rough * .4)) fills.add(i);
    }
    // the rock round the room: bulges, two deep in places
    for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++){
      const i = y * W + x; if (!inside(x, y) || at(x, y) !== T.ROCK) continue;
      const corner = (x === r.x - 1 || x === r.x + r.w) && (y === r.y - 1 || y === r.y + r.h); if (corner) continue;
      if (rng() < rough * .45){ digs.add(i); const ox = x < r.x ? -1 : x >= r.x + r.w ? 1 : 0, oy = y < r.y ? -1 : y >= r.y + r.h ? 1 : 0;
        if (rng() < rough * .35 && inside(x + ox, y + oy) && at(x + ox, y + oy) === T.ROCK) digs.add((y + oy) * W + x + ox); }
    }
  }
  // tunnels wander: here and there a square of the rock beside them is dug out
  for (let i = 0; i < f.grid.length; i++){
    if (f.grid[i] !== T.HALL || rng() > rough * .3) continue;
    const x = i % W, y = (i / W) | 0, [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rng() * 4)];
    if (inside(x + dx, y + dy) && at(x + dx, y + dy) === T.ROCK) digs.add((y + dy) * W + x + dx);
  }
  const dug0 = f.dug.slice(), filled0 = f.filled.slice();
  f.dug = [...new Set([...f.dug, ...digs])]; f.filled = [...new Set([...f.filled, ...[...fills].filter(i => !digs.has(i))])];
  carve(f);
  // nothing that could be reached before may be cut off: give back the eaten squares beside anything cut off, until it all joins up
  for (let pass = 0; pass < 6; pass++){
    const now = reachable(f, startOf(f)), lost = [...before].filter(i => walk(f.grid[i]) && !now.has(i)), pockets = cutOff(now);
    if (!lost.length && !pockets.length) return f;
    const give = new Set(); for (const i of [...lost, ...pockets]) for (const o of [1, -1, W, -W]) if (fills.has(i + o)) give.add(i + o);
    if (!give.size) break;
    f.filled = f.filled.filter(i => !give.has(i)); for (const i of give) fills.delete(i);
    carve(f);
  }
  // still not joined: undo the roughening altogether
  const now = reachable(f, startOf(f));
  if ([...before].some(i => walk(f.grid[i]) && !now.has(i)) || cutOff(now).length){ f.dug = dug0; f.filled = filled0; carve(f); }
  return f;
}
