/* 🚪 THE WAYS BETWEEN PLACES — where a map lets the party out, and in. Pure, no DOM: game/ways.js asks.
     · a place's ways out: one for each road that leaves it, at the walkable square farthest out on the side the road
       goes (the valley map's direction to the next place), each with a signpost beside it
     · a building's front door: the square in the middle of its door side, and the doorstep in front of it
     · an inside's way out: the doorway square at the front, and which way is out of it
     · a road's ends: whether the hero is at the edge it runs off (on, or back) */
import { walk } from './tiles.js';

const DIRS8 = [[0, -1, 'n'], [1, -1, 'ne'], [1, 0, 'e'], [1, 1, 'se'], [0, 1, 's'], [-1, 1, 'sw'], [-1, 0, 'w'], [-1, -1, 'nw']];
// A direction (dx, dy, either scale) → its compass point
export function compass(dx, dy){
  if (!dx && !dy) return '';
  const a = Math.atan2(dy, dx), k = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;   // 0 = east, counting toward south
  return ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'][k];
}
export const ARROW = { n:'↑', ne:'↗', e:'→', se:'↘', s:'↓', sw:'↙', w:'←', nw:'↖' };
export const stepOf = c => { const d = DIRS8.find(o => o[2] === c); return d ? [d[0], d[1]] : [0, 0]; };

/* Where each road leaves a place's map. f: { W, H, grid, props? }; ways: [{ to, dx, dy }] (the valley map's direction
   from here to there; +y is south). blocked(x, y): squares to keep clear of (props that stand in the way).
   → [{ to, x, y, dir, sign:{ x, y } | null }]: the way out, and a square beside it (inward, off the road) for a signpost.
   Each way is the open square that goes farthest in its direction (then nearest the map's edge), at least 6 squares
   from the others; a road out (a path square) is preferred where one runs that way. */
export function placeWays(f, ways, blocked = () => false){
  const { W, H, grid } = f, cx = (W - 1) / 2, cy = (H - 1) / 2, out = [];
  const open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && walk(grid[y * W + x]) && !blocked(x, y);
  // squares that reach the map's middle (no way out on an island cut off from the rest)
  const reach = new Set(), mid = nearestOpen(f, Math.round(cx), Math.round(cy), open);
  if (mid){ const q = [mid.y * W + mid.x]; reach.add(q[0]);
    for (let h = 0; h < q.length; h++){ const i = q[h], x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy, j = ny * W + nx; if (open(nx, ny) && !reach.has(j)){ reach.add(j); q.push(j); } } } }
  for (const w of ways){
    const len = Math.hypot(w.dx, w.dy) || 1, ux = w.dx / len, uy = w.dy / len;
    let best = null, bestS = -Infinity;
    for (const i of reach){
      const x = i % W, y = (i / W) | 0;
      if (out.some(o => Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) < 6)) continue;
      const along = (x - cx) * ux + (y - cy) * uy, side = Math.abs((x - cx) * uy - (y - cy) * ux);
      const s = along - side * .35 + (grid[i] === 2 ? 3 : 0);   // (straight out that way, a little off it allowed; a road out counts for more)
      if (s > bestS){ bestS = s; best = { x, y }; }
    }
    if (!best) continue;
    const dir = compass(w.dx, w.dy), [sx, sy] = stepOf(dir);
    // the signpost: beside the way out, a step or two back in, not on the road and not in the way (nearest first;
    // signs: the next best, for when something already stands on the first)
    const signs = [];
    for (let r = 1; r <= 3; r++) for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++){
      if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
      const x = best.x + ox, y = best.y + oy, back = -(ox * sx + oy * sy);   // (how far back in from the way)
      if (back < 0 || !open(x, y) || (x === best.x && y === best.y)) continue;
      const road = grid[y * W + x] === 2;   // (on the road only when there's no ground beside it: a wide road to the edge)
      const edge = road && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !open(x + a, y + b));   // (its verge, not its middle)
      signs.push({ x, y, k:r * 10 - back * 3 + Math.abs(ox * sy - oy * sx) + (road ? (edge ? 100 : 200) : 0) });
    }
    signs.sort((a, b) => a.k - b.k);
    const sign = signs[0] ? { x:signs[0].x, y:signs[0].y } : null;
    out.push({ to:w.to, x:best.x, y:best.y, dir, sign, signs:signs.map(({ x, y }) => ({ x, y })) });
  }
  return out;
}
function nearestOpen(f, x0, y0, open){
  for (let r = 0; r < Math.max(f.W, f.H); r++) for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++)
    if (Math.max(Math.abs(x - x0), Math.abs(y - y0)) === r && open(x, y)) return { x, y };
  return null;
}
// One step back in from a way out (where the party stands when they come in by it), or the way itself if there's none.
export function inFrom(f, way, open = (x, y) => walk(f.grid[y * f.W + x])){
  const [sx, sy] = stepOf(way.dir);
  for (const k of [2, 1]) for (const [ox, oy] of [[0, 0], [sy, -sx], [-sy, sx]]){
    const x = way.x - sx * k + ox, y = way.y - sy * k + oy;
    if (x >= 0 && y >= 0 && x < f.W && y < f.H && open(x, y)) return { x, y };
  }
  return { x:way.x, y:way.y };
}

/* A building's front door. b: { x, y, w, h, door:'n'|'s'|'e'|'w' } → { cells:[{x,y}], steps:[{x,y}], out:[dx, dy] }:
   the squares of the wall the door is in (one, or two for an even side) and the doorstep in front of each. */
export function frontDoor(b){
  const side = b.door || 's', out = { n:[0, -1], s:[0, 1], e:[1, 0], w:[-1, 0] }[side];
  const along = out[0] ? b.h : b.w, mids = along % 2 ? [Math.floor(along / 2)] : [along / 2 - 1, along / 2];
  const cells = mids.map(k => out[0] ? { x:out[0] > 0 ? b.x + b.w - 1 : b.x, y:b.y + k } : { x:b.x + k, y:out[1] > 0 ? b.y + b.h - 1 : b.y });
  return { cells, steps:cells.map(c => ({ x:c.x + out[0], y:c.y + out[1] })), out };
}
// Which building's door is walked into: the hero at (x, y) stepping (dx, dy). → the building's index, or -1
export function doorWalkedInto(buildings, x, y, dx, dy){
  if (dx && dy) return -1;
  return (buildings || []).findIndex(b => { const d = frontDoor(b); return d.out[0] === -dx && d.out[1] === -dy && d.steps.some(s => s.x === x && s.y === y); });
}

/* An inside's way out: the doorway square at the front (out: [x, y]) and the way out of it, the side with no floor.
   f: { W, H, grid } → [dx, dy] | null */
export function outOfDoorway(f, at){
  if (!at) return null;
  const [x, y] = Array.isArray(at) ? at : [at.x, at.y], open = (xx, yy) => xx >= 0 && yy >= 0 && xx < f.W && yy < f.H && walk(f.grid[yy * f.W + xx]);
  const sides = [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dx, dy]) => !open(x + dx, y + dy) && open(x - dx, y - dy));
  return sides[0] || null;
}

/* On a stretch of road: is the hero at the edge it runs off, going that way? t: { x, y }; end: the square the road
   runs off at ({ x, y }); dx: the way they're stepping. The edge is whichever side of the map the end is on. */
export function offTheEdge(f, t, end, dx){
  if (!end) return false;
  const edge = end.x <= f.W / 2 ? -1 : 1, band = edge < 0 ? t.x <= end.x : t.x >= end.x;
  return dx === edge && band && Math.abs(t.y - end.y) <= 2;
}

// The signpost's lines: here, and [{ to (a name), dir, far (a few words) }] → ['← Vallaki · two stretches', …]
export function signLines(ways){
  const order = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
  return [...ways].sort((a, b) => order.indexOf(a.dir) - order.indexOf(b.dir))
    .map(w => /w$/.test(w.dir) ? `${ARROW[w.dir]} ${w.to}${w.far ? ` · ${w.far}` : ''}` : `${w.to}${w.far ? ` · ${w.far}` : ''} ${ARROW[w.dir]}`);
}
