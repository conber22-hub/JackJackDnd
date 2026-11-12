/* 🌲 THE GROUND PASS — the rest of ChatGPT's Barovia terrain pack (Terrain I, assets/terrain) on outdoor maps. Its
   trees already stand in the woods (render/floors.js, WOODS_MIX) and its Hunger Moss with the Bloom
   (engine/bloom-woods.js); here its other pieces dress the treeline beside the open ground, each by what is near it:
   · by water: cattail reeds and sodden hummocks;
   · by a graveyard: old graves, a ring of sentry stones, a ruined arch, an empty gallows;
   · by high ground (a rise or a hill): loose scree and a shale cliff;
   · by farmland: a collapsed field wall, a leaning split-rail fence;
   · beside a road: a lost milestone, a wayside shrine, a cold watchfire;
   · and wind-blown drifts where snow lies.
   They stand only on squares that are woods already (or, for the marsh's reeds and hummocks, open water off the bank):
   never where anyone can walk, on a building, a prop, an exit, or a clearing something else has taken (the Road
   Watches, a roadside horror). So it changes nothing but the look: the trees step back to make a glade for it. Pure and seeded: the same map is dressed the same way on every
   device, and dressing it again gives the same pieces. */
import { T, walk } from './tiles.js';

// The pack's footprints in squares (render/barovia-terrain-index.js): [w, h] at rot 0.
export const DRESS_SIZE = {
  tser_cattail_reeds:[2, 2], tser_sodden_hummock:[3, 3],
  forgotten_graves:[3, 3], forgotten_sentry_stones:[3, 3], ruined_vallaki_arch:[3, 1], empty_gallows:[2, 2],
  balinok_loose_scree:[3, 3], balinok_shale_cliff:[3, 2], balinok_windblown_snow:[3, 3],
  collapsed_fieldwall:[3, 1], leaning_splitrail_fence:[3, 1],
  lost_svalich_milestone:[1, 1], forsaken_road_shrine:[2, 2], abandoned_watchfire:[2, 2],
};
// What each kind of ground brings: [piece, how often, at most this many on a map]
const POOLS = {
  wet:[['tser_cattail_reeds', 5, 6], ['tser_sodden_hummock', 2, 3]],
  graves:[['forgotten_graves', 4, 2], ['forgotten_sentry_stones', 1, 1], ['ruined_vallaki_arch', 1, 1], ['empty_gallows', 1, 1]],
  high:[['balinok_loose_scree', 4, 4], ['balinok_shale_cliff', 2, 2]],
  farm:[['collapsed_fieldwall', 3, 3], ['leaning_splitrail_fence', 3, 3]],
  road:[['lost_svalich_milestone', 2, 1], ['forsaken_road_shrine', 1, 1], ['abandoned_watchfire', 1, 1]],
  snow:[['balinok_windblown_snow', 1, 3]],
};
export const DRESS_KINDS = Object.keys(POOLS);

function rngFor(seed){
  let h = 2166136261; for (const c of String(seed)){ h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { let t = h = (h + 0x6D2B79F5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* f: a floor; o.snow: snow lies on the ground; o.seed: the map's own (its seed and level).
   → [{ id, x, y, rot, size:[w, h], cells:[i…], kind }]  (x, y: the top-left square; rot in quarter turns) */
export function planDressing(f, { seed = 'barovia', snow = false, max = 14 } = {}){
  const { W, H, grid:g } = f; if (!W || !H || !g) return [];
  const at = (x, y) => y * W + x, inside = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1;
  const open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && walk(g[at(x, y)]);
  // squares nothing may stand on: wet, cleared for something else, a building or its doorstep, a prop, near an exit
  const taken = new Set([...(f.shallow || []), ...(f.chasm || []), ...(f.mists || []), ...(f.filled || []), ...(f.clear || []), ...(f.masonry || [])]);
  for (const b of f.buildings || []) for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) taken.add(at(x, y));
  for (const p of f.props || []) taken.add(at(p.x, p.y));
  for (const e of [f.up, f.down].filter(Boolean)) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) taken.add(at(e.x + dx, e.y + dy));
  for (const w of f.roadWatches || []) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) taken.add(at(w.x + dx, w.y + dy));
  // open water: no place for anything but the marsh's own, and those only off the bank (a ford, a bridge or a shore path
  // stays clear) and near enough to it to be seen
  const pool = new Set(f.water || []), byBank = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (open(x + dx, y + dy)) return true; return false; };
  const freeSq = (x, y, wet = false) => inside(x, y) && !open(x, y) && !taken.has(at(x, y)) && (!pool.has(at(x, y)) || wet && !byBank(x, y));
  // what lies near a square (within r): marks for each kind of ground
  const wet = new Set([...(f.water || []), ...(f.shallow || [])]), graves = (f.props || []).filter(p => p.k === 'gravestone');
  const farm = new Set(); for (const r of f.rooms || []) if (r.crop) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) farm.add(at(x, y));
  for (let i = 0; i < W * H; i++) if (f.ground?.[i] === 'furrow') farm.add(i);
  const high = new Set(); if (f.height) for (let i = 0; i < W * H; i++) if (f.height[i] > 0) high.add(i);
  const near = (x, y, r, test) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++){ const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && test(at(nx, ny), nx, ny)) return true; } return false; };
  const kindAt = (x, y) => graves.some(p => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 6) ? 'graves'
    : near(x, y, 3, i => wet.has(i)) ? 'wet' : near(x, y, 3, i => high.has(i)) ? 'high' : near(x, y, 4, i => farm.has(i)) ? 'farm'
    : near(x, y, 2, i => g[i] === T.HALL) ? 'road' : snow ? 'snow' : null;
  // the treeline: woods squares one to three from open ground, in an order of the map's own
  const rand = rngFor(`${seed}|dress`), cands = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++){
    if (!freeSq(x, y, true)) continue;
    let d = 9; for (let dy = -3; dy <= 3 && d > 1; dy++) for (let dx = -3; dx <= 3; dx++) if (open(x + dx, y + dy)) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
    if (d <= 3) cands.push({ x, y, d, r:rand() });
  }
  cands.sort((a, b) => a.r - b.r);
  const used = new Set(), count = {}, out = []; let roadside = 0;
  const fits = (x, y, w, h, wet) => { for (let yy = y - 1; yy <= y + h; yy++) for (let xx = x - 1; xx <= x + w; xx++){ const inFoot = xx >= x && yy >= y && xx < x + w && yy < y + h;
    if (inFoot && !freeSq(xx, yy, wet)) return false; if (used.has(at(xx, yy))) return false; } return true; };
  const WET = new Set(POOLS.wet.map(e => e[0]));
  const pick = pool => { const live = pool.filter(([id, , cap]) => (count[id] || 0) < cap); if (!live.length) return null;
    let n = rand() * live.reduce((s, e) => s + e[1], 0); for (const e of live) if ((n -= e[1]) < 0) return e[0]; return live.at(-1)[0]; };
  for (const c of cands){
    if (out.length >= max) break;
    const kind = kindAt(c.x, c.y); if (!kind || kind === 'road' && (rand() > .25 || roadside >= 2)) continue;   // (a roadside piece now and then, not at every bend)
    if (pool.has(at(c.x, c.y)) && kind !== 'wet') continue;
    const id = pick(snow && kind !== 'wet' && rand() < .3 ? POOLS.snow : POOLS[kind]) || pick(POOLS[kind]); if (!id) continue;
    const [w0, h0] = DRESS_SIZE[id], turns = rand() < .5 ? [0, 1, 2, 3] : [1, 0, 3, 2];
    for (const rot of turns){
      const [w, h] = rot % 2 ? [h0, w0] : [w0, h0];
      // the square found is one corner of the piece; it may sit up, down, left or right of it
      const x = c.x - (rand() < .5 ? 0 : w - 1), y = c.y - (rand() < .5 ? 0 : h - 1);
      if (!fits(x, y, w, h, WET.has(id))) continue;
      const cells = []; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++){ cells.push(at(xx, yy)); used.add(at(xx, yy)); }
      count[id] = (count[id] || 0) + 1; if (kind === 'road') roadside++; out.push({ id, x, y, rot, size:[w, h], cells, kind }); break;
    }
  }
  return out;
}
