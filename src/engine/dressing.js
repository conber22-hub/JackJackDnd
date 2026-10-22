/* DRESSING — furniture and clutter for generated rooms, by the room's type and the floor's theme, so a crypt
   has coffins, a mine gallery has carts and ore, and the Narrow House has bedrooms, a library and a nursery.
   Pure: works on a floor object (rooms, grid, doors, stairs) and a seeded rng; adds to f.props.
   Rooms of the manor and castle themes also get a use (bedroom, library, great hall…) and a name to match.
   Tall pieces (shelves, statues, pillars…) block movement, so the dresser keeps doorways and stairs clear,
   never lets a blocking piece cut a room in two, and puts wall pieces with their backs to the wall. */
import { T, walk } from './tiles.js';
import { PROPS, PROP_BLOCK } from '../data/props.js';
import { ROOM_USES, THEME_KIT, TYPE_KIT } from '../data/dressing.js';

const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];
// back of a wall piece → rot: wall to the west 0, north 1, east 2, south 3
const SIDES = [[-1, 0, 0], [0, -1, 1], [1, 0, 2], [0, 1, 3]];

export function furnishFloor(f, themeId, rng){
  f.props ||= [];
  const taken = new Set();                     // each use once a floor before any repeats (one nursery, one library…)
  for (const r of f.rooms) furnishRoom(f, r, themeId, rng, { taken });
  return f;
}

// Furnish one room (also used by the Build tab's "Furnish" button). Returns how many props went in.
export function furnishRoom(f, r, themeId, rng, { rename = true, taken = null } = {}){
  const W = f.W, area = r.w * r.h;
  if (area < 4) return 0;
  // a use for chambers in houses and castles: names the room and picks its furniture
  let kit = null;
  const uses = ROOM_USES[themeId];
  if (uses && r.type === 'chamber'){
    const fit = uses.filter(x => !x.min || area >= x.min), fresh = fit.filter(x => !taken?.has(x.id));
    const u = r.use ? uses.find(x => x.id === r.use) : pickOne(fresh.length ? fresh : fit, rng) || uses[0];
    if (u){ r.use = u.id; taken?.add(u.id); kit = u.kit; if (rename && !r.named) r.name = pickOne(u.names, rng); }
  }
  // big rooms get more of the floor's clutter
  const mult = area >= 56 ? 3 : area >= 28 ? 2 : 1;
  const clutter = (THEME_KIT[themeId] || THEME_KIT.default).map(([k, lo, hi, w]) => [k, lo * mult, hi * mult, w]);
  kit = kit ? [...kit, ...clutter.filter(([k]) => !kit.some(([k2]) => k2 === k)).map(([k, lo, hi, w]) => [k, 0, Math.ceil(hi / 2), w])] : [...(TYPE_KIT[r.type] || []), ...clutter];
  // free squares: the room's own floor, not stairs, not a door, not a doorway (next to a door or an opening)
  const inRoom = (x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  const doorAt = new Set((f.doors || []).map(d => d.i));
  const stairs = [f.up, f.down].filter(Boolean).map(s => s.y * W + s.x);
  const free = new Set();
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++){
    const i = y * W + x; if (f.grid[i] !== T.ROOM || doorAt.has(i)) continue;
    if (stairs.some(s => Math.abs((s % W) - x) <= 1 && Math.abs(((s / W) | 0) - y) <= 1)) continue;
    let doorway = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const nx = x + dx, ny = y + dy, j = ny * W + nx;
      if (doorAt.has(j) || (!inRoom(nx, ny) && nx >= 0 && ny >= 0 && nx < W && ny < f.H && walk(f.grid[j]))) doorway = true;
    }
    if (!doorway) free.add(i);
  }
  for (const p of f.props || []){ const s = sizeOf(p); for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++) free.delete(y * W + x); }
  const solid = (x, y) => x < 0 || y < 0 || x >= W || y >= f.H || !walk(f.grid[y * W + x]);
  const budget = Math.max(1, Math.floor(area * (area <= 12 ? .25 : .32)));   // squares of furniture at most
  let used = 0, placed = 0;
  // squares a blocking piece stands on; one more must leave the rest of the room's floor in one piece
  const blocked = new Set();
  for (const p of f.props || []) if (PROP_BLOCK.has(p.k)){ const s = sizeOf(p); for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++) blocked.add(y * W + x); }
  const splits = (k, x, y, rot) => {
    if (!PROP_BLOCK.has(k)) return false;
    const s = sizeOf({ k, rot }), add = new Set();
    for (let yy = y; yy < y + s.h; yy++) for (let xx = x; xx < x + s.w; xx++) add.add(yy * W + xx);
    const open = [];
    for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++){ const i = yy * W + xx; if (walk(f.grid[i]) && !blocked.has(i) && !add.has(i)) open.push(i); }
    if (!open.length) return true;
    const ok = new Set(open), seen = new Set([open[0]]), q = [open[0]];
    while (q.length){ const i = q.pop(); for (const j of [i + 1, i - 1, i + W, i - W]){ if (Math.abs((j % W) - (i % W)) > 1 || !ok.has(j) || seen.has(j)) continue; seen.add(j); q.push(j); } }
    return seen.size < open.length;
  };
  const take = (k, x, y, rot) => {
    const s = sizeOf({ k, rot });
    for (let yy = y; yy < y + s.h; yy++) for (let xx = x; xx < x + s.w; xx++) free.delete(yy * W + xx);
    if (PROP_BLOCK.has(k)) for (let yy = y; yy < y + s.h; yy++) for (let xx = x; xx < x + s.w; xx++) blocked.add(yy * W + xx);
    f.props.push({ id:f.nextObj++, k, x, y, rot }); used += s.w * s.h; placed++;
  };
  const fits = (k, x, y, rot) => { const s = sizeOf({ k, rot }); for (let yy = y; yy < y + s.h; yy++) for (let xx = x; xx < x + s.w; xx++) if (!free.has(yy * W + xx)) return false; return !splits(k, x, y, rot); };
  for (const [k, lo, hi, where = 'scatter'] of kit){
    if (!PROPS[k]) continue;
    const n = lo + Math.floor(rng() * (hi - lo + 1));
    for (let c = 0; c < n; c++){
      const base = PROPS[k];
      if (used + base.w * base.h > budget) break;
      const spots = [];
      for (const i of free){
        const x = i % W, y = (i / W) | 0;
        if (where === 'wall' || where === 'corner'){
          for (const [dx, dy, rot] of SIDES){
            if (!fits(k, x, y, rot)) continue;
            const s = sizeOf({ k, rot }); let back = true;
            // every square along the back edge has a wall behind it
            for (let yy = y; yy < y + s.h && back; yy++) for (let xx = x; xx < x + s.w && back; xx++){
              const onBack = dx < 0 ? xx === x : dx > 0 ? xx === x + s.w - 1 : dy < 0 ? yy === y : yy === y + s.h - 1;
              if (onBack && !solid(xx + dx, yy + dy)) back = false;
            }
            if (!back) continue;
            if (where === 'corner'){ const side = dx ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]]; if (!side.some(([sx, sy]) => solid(x + sx, y + sy))) continue; }
            spots.push([x, y, rot]);
          }
        } else {
          const rot = base.w !== base.h ? (rng() < .5 ? 0 : 1) : Math.floor(rng() * 4);
          if (!fits(k, x, y, rot)) continue;
          if (where === 'center'){ const s = sizeOf({ k, rot }); const cx = x + s.w / 2, cy = y + s.h / 2; spots.push([x, y, rot, Math.hypot(cx - (r.x + r.w / 2), cy - (r.y + r.h / 2))]); }
          else spots.push([x, y, rot]);
        }
      }
      if (!spots.length) break;
      if (where === 'center'){ spots.sort((a, b) => a[3] - b[3]); const [x, y, rot] = spots[Math.min(spots.length - 1, Math.floor(rng() * 2))]; take(k, x, y, rot); }
      else { const [x, y, rot] = pickOne(spots, rng); take(k, x, y, rot); }
    }
  }
  return placed;
}
function sizeOf(p){ const d = PROPS[p.k] || { w:1, h:1 }; return (p.rot || 0) % 2 ? { w:d.h, h:d.w } : { w:d.w, h:d.h }; }
// Take a room's furniture out (Build tab → Clear).
export function clearRoomProps(f, r){
  const before = (f.props || []).length;
  f.props = (f.props || []).filter(p => !(p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h));
  return before - f.props.length;
}
