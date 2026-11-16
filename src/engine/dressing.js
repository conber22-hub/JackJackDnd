/* DRESSING — furniture and clutter for generated rooms, by the room's type and the floor's theme, so a crypt
   has coffins, a mine gallery has carts and ore, and the Narrow House has bedrooms, a library and a nursery.
   Pure: works on a floor object (rooms, grid, doors, stairs) and a seeded rng; adds to f.props.
   Rooms of the manor and castle themes also get a use (bedroom, library, great hall…) and a name to match.
   Tall pieces (shelves, statues, pillars…) block movement, so the dresser keeps doorways and stairs clear,
   never lets a blocking piece cut a room in two, and puts wall pieces with their backs to the wall. */
import { T, walk } from './tiles.js';
import { PROPS, PROP_BLOCK, PROP_TOP, PROP_HOP, propSize } from '../data/props.js';
import { ROOM_USES, THEME_KIT, TYPE_KIT } from '../data/dressing.js';
import { OBJECTS, STASHES } from '../data/objects.js';

const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];
// back of a wall piece → rot: wall to the west 0, north 1, east 2, south 3
const SIDES = [[-1, 0, 0], [0, -1, 1], [1, 0, 2], [0, 1, 3]];

export function furnishFloor(f, themeId, rng){
  f.props ||= [];
  const taken = new Set();                     // each use once a floor before any repeats (one nursery, one library…)
  for (const r of f.rooms) if (!r.vault) furnishRoom(f, r, themeId, rng, { taken });   // (a set piece comes furnished: engine/vaults.js)
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
  const free = new Set(), wet = new Set([...(f.shallow || []), ...(f.span || [])]);   // not in the water, not on a rope bridge
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++){
    const i = y * W + x; if (f.grid[i] !== T.ROOM || doorAt.has(i) || wet.has(i)) continue;
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
const sizeOf = propSize;

/* SECRETS — after furnishing: some chests, desks and wardrobes are locked, some furniture has a hidden stash
   (found with Search), and a secret door may hide behind a bookshelf or a wardrobe standing in front of it
   on the room side (find the door, then swing the shelf aside). Its own rng, so layouts don't shift. */
// How many squares the party can walk to from the stairs (secret doors shut, tall furniture in the way).
function reachable(f){
  const W = f.W, block = new Set();
  for (const p of f.props) if (PROP_BLOCK.has(p.k) && !p.swung && !p.broken && !p.fallen){ const s = sizeOf(p); for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++) block.add(y * W + x); }
  for (const d of f.doors || []) if (d.state === 'secret') block.add(d.i);
  const st = f.up || f.down || (f.rooms?.[0] && { x:f.rooms[0].x, y:f.rooms[0].y }); if (!st) return 0;
  const s0 = st.y * W + st.x, seen = new Set([s0]), q = [s0];
  while (q.length){ const i = q.pop(); for (const j of [i + 1, i - 1, i + W, i - W]){ if (j < 0 || j >= f.grid.length || Math.abs((j % W) - (i % W)) > 1 || seen.has(j) || block.has(j) || !walk(f.grid[j])) continue; seen.add(j); q.push(j); } }
  return seen.size;
}
export function hideSecrets(f, rng){
  f.props ||= [];
  for (const p of f.props){
    const o = OBJECTS[p.k];
    if (o?.lockable && rng() < .3) p.lock = 12 + Math.floor(rng() * 5);
    if (STASHES[p.k] && rng() < .12) p.stash = { dc:12 + Math.floor(rng() * 5), text:pickOne(STASHES[p.k], rng) };
  }
  const W = f.W, open = (x, y) => x >= 0 && y >= 0 && x < W && y < f.H && walk(f.grid[y * W + x]);
  const wet = new Set([...(f.shallow || []), ...(f.span || [])]);   // no shelf stands in the water or on a rope bridge
  const taken = (x, y) => wet.has(y * W + x) || f.props.some(p => { const s = sizeOf(p); return x >= p.x && x < p.x + s.w && y >= p.y && y < p.y + s.h; })
    || (f.doors || []).some(d => d.i === y * W + x) || [f.up, f.down].some(s => s && Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
  const inRoom = (x, y) => (f.rooms || []).some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  // never in front of another way in or out (an opening, a corridor mouth), only the hidden door
  const doorway = (x, y, door) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => (x + a) + (y + b) * W !== door && open(x + a, y + b) && !inRoom(x + a, y + b));
  for (const dr of (f.doors || []).filter(d => d.state === 'secret')){
    if (rng() > .6) continue;
    const dx0 = dr.i % W, dy0 = (dr.i / W) | 0;
    // the room square in front of the door, and which way the wall runs there
    for (const [dx, dy, rot] of SIDES){
      const x = dx0 - dx, y = dy0 - dy;          // the door is on this square's (dx, dy) side
      if (!open(x, y) || !inRoom(x, y) || taken(x, y) || doorway(x, y, dr.i)) continue;
      const along = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      let placed = null;
      // a bookshelf (two squares along the wall) if the next square along has wall behind it, else a wardrobe
      for (const [ax, ay] of along){
        const x2 = x + ax, y2 = y + ay;
        if (!open(x2, y2) || !inRoom(x2, y2) || taken(x2, y2) || open(x2 + dx, y2 + dy) || doorway(x2, y2, dr.i)) continue;
        placed = { k:'bookshelf', x:Math.min(x, x2), y:Math.min(y, y2), rot }; break;
      }
      placed ||= { k:'wardrobe', x, y, rot };
      const before = reachable(f);
      const p = { id:f.nextObj++, ...placed, hides:dr.id }; f.props.push(p);
      if (reachable(f) < before - sizeOf(p).w * sizeOf(p).h) f.props.pop();   // it would wall something off
      break;
    }
  }
  f.propsV = (f.propsV || 0) + 1;
}
// Take a room's furniture out (Build tab → Clear).
export function clearRoomProps(f, r){
  const before = (f.props || []).length;
  f.props = (f.props || []).filter(p => !(p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h));
  return before - f.props.length;
}

/* DOORWAYS — after everything else has put its pieces down (hand-built maps place theirs at fixed spots, set pieces
   stamp whole rooms): nothing you'd have to climb, hop or go round stands on a door, on the squares either side of
   it, or on and beside the stairs. Such a piece is moved to the nearest free square (a wall piece, a hearth or a shelf,
   to one with a wall at its back), or taken away if there's nowhere for it. A shelf hiding a secret door is meant to
   be in front of it, and stays. Returns how many pieces moved or went. */
export function keepDoorwaysClear(f){
  if (!f?.props?.length || !f.grid) return 0;
  const W = f.W, H = f.H, keep = new Set();
  const open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && walk(f.grid[y * W + x]);
  const solid = (x, y) => !open(x, y);
  const doorAt = new Set((f.doors || []).map(d => d.i));
  for (const d of f.doors || []){
    const x = d.i % W, y = (d.i / W) | 0; keep.add(d.i);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y + dy)) keep.add((y + dy) * W + x + dx);
  }
  for (const s of [f.up, f.down]) if (s) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (open(s.x + dx, s.y + dy)) keep.add((s.y + dy) * W + s.x + dx);
  if (!keep.size) return 0;
  const inWay = p => PROP_BLOCK.has(p.k) || p.k in PROP_TOP || PROP_HOP.has(p.k);
  const squares = (p, x = p.x, y = p.y, rot = p.rot) => { const s = sizeOf({ ...p, rot }), out = [];
    for (let yy = y; yy < y + s.h; yy++) for (let xx = x; xx < x + s.w; xx++) out.push([xx, yy]); return out; };
  const wet = new Set([...(f.shallow || []), ...(f.span || []), ...(f.water || [])]);
  const roomOf = (x, y) => (f.rooms || []).find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) || null;
  const backed = (p, x, y, rot) => { const s = sizeOf({ ...p, rot }), [dx, dy] = SIDES[(rot || 0) % 4];
    for (let yy = y; yy < y + s.h; yy++) for (let xx = x; xx < x + s.w; xx++){
      const onBack = dx < 0 ? xx === x : dx > 0 ? xx === x + s.w - 1 : dy < 0 ? yy === y : yy === y + s.h - 1;
      if (onBack && !solid(xx + dx, yy + dy)) return false; }
    return true; };
  let changed = 0;
  for (const p of [...f.props]){
    if (p.hides || !inWay(p) || p.fallen || p.broken) continue;
    if (!squares(p).some(([x, y]) => keep.has(y * W + x))) continue;
    const wallPiece = backed(p, p.x, p.y, p.rot), home = roomOf(p.x, p.y);
    const others = new Set(); for (const q of f.props) if (q !== p) for (const [x, y] of squares(q)) others.add(y * W + x);
    const fits = (x, y, rot) => squares(p, x, y, rot).every(([xx, yy]) => { const i = yy * W + xx;
      return open(xx, yy) && !keep.has(i) && !doorAt.has(i) && !others.has(i) && !wet.has(i) && roomOf(xx, yy) === home; });
    // the nearest squares first, out to a few steps, in the same room (or outdoors, if it stood outdoors)
    let spot = null;
    for (let d = 1; d <= 6 && !spot; d++){
      for (let dy = -d; dy <= d && !spot; dy++) for (let dx = -d; dx <= d && !spot; dx++){
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
        const x = p.x + dx, y = p.y + dy;
        if (wallPiece){ for (let rot = 0; rot < 4 && !spot; rot++) if (fits(x, y, rot) && backed(p, x, y, rot)) spot = [x, y, rot]; }
        else if (fits(x, y, p.rot)) spot = [x, y, p.rot];
        // a blocking piece mustn't wall anything off where it goes
        if (spot && PROP_BLOCK.has(p.k)){ const was = [p.x, p.y, p.rot], before = reachable(f);
          [p.x, p.y, p.rot] = spot; const after = reachable(f); [p.x, p.y, p.rot] = was;
          if (after < before - squares(p).length) spot = null; }
      }
    }
    if (spot){ [p.x, p.y] = spot; if (spot[2] !== undefined) p.rot = spot[2]; else delete p.rot; changed++; }
    else if (!p.stash && !p.lock && !p.items && !p.loot){ f.props.splice(f.props.indexOf(p), 1); changed++; }
  }
  if (changed) f.propsV = (f.propsV || 0) + 1;
  return changed;
}
