/* The Living Valley: deterministic terrain scattering, standalone and DOM-free.
   Every x/y in the result is the TOP-LEFT grid cell, not world coordinates. */
import { TERRAIN_INDEX } from './barovia-terrain-index.js';

export const BIOMES = Object.freeze({
  svalichWoods: [
    ['svalich_black_fir', 8], ['windworn_fir', 3], ['crooked_oak', 2],
    ['pale_birch_thicket', 2], ['thorn_choked_brambles', 3],
    ['mushroom_stump', 2], ['hollow_fallen_log', 1], ['hollow_witch_tree', 1],
  ],
  winterForest: [
    ['snow_crowned_fir', 8], ['windworn_fir', 2], ['crooked_oak', 3],
    ['pale_birch_thicket', 2], ['hollow_fallen_log', 1],
    ['balinok_windblown_snow', 2],
  ],
  tserBog: [
    ['tser_cattail_reeds', 6], ['tser_sodden_hummock', 5],
    ['tser_blackwater_pool', 2], ['mushroom_stump', 2],
    ['thorn_choked_brambles', 1],
  ],
  balinokFoothills: [
    ['balinok_loose_scree', 6], ['balinok_shale_cliff', 3],
    ['windworn_fir', 2], ['snow_crowned_fir', 2],
    ['balinok_windblown_snow', 1],
  ],
  vallakiOutskirts: [
    ['collapsed_fieldwall', 4], ['leaning_splitrail_fence', 3],
    ['lost_svalich_milestone', 1], ['mushroom_stump', 1],
    ['forsaken_road_shrine', 1], ['abandoned_watchfire', 1],
  ],
  ancientGraves: [
    ['forgotten_graves', 5], ['crooked_oak', 2],
    ['ruined_vallaki_arch', 1], ['forgotten_sentry_stones', 1],
    ['thorn_choked_brambles', 3], ['empty_gallows', 1],
  ],
  hungerMoss: [
    ['hunger_moss_colony', 5], ['hunger_moss_spires', 3],
    ['hunger_taken_fir', 4], ['hunger_claimed_road', 1],
  ],
});

function rngFor(seed) {
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { let t = h = (h + 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function choose(weighted, roll) {
  let n = roll * weighted.reduce((sum, x) => sum + x[1], 0);
  for (const [id, weight] of weighted) if ((n -= weight) < 0) return id;
  return weighted.at(-1)[0];
}

/**
 * Pure seeded scatter plan; will NEVER place over a cell rejected by allowed(x,y,spec).
 * x/y are map-grid indices; locations and IDs are stable for the same seed and inputs.
 * The default allow-all is useful for tests and showcases, not live encounter maps.
 * Passing a walkability/exit-safe predicate is required for actual player maps.
 */
export function planTerrain({ width, height, seed = 'barovia', biome = 'svalichWoods',
  density = 0.035, allowed = () => true, maxTries = 0 } = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width > 4096 || height > 4096) throw new RangeError('Invalid grid dimensions');
  if (!Number.isFinite(density) || density < 0 || density > 1) throw new RangeError('Density must be between 0 and 1');
  if (typeof allowed !== 'function') throw new TypeError('allowed must be a function');
  const pool = BIOMES[biome];
  if (!pool) throw new RangeError(`Unknown biome: ${biome}`);
  const random = rngFor(`${seed}|${biome}|${width}x${height}`);
  const target = Math.round(width * height * density);
  const occupied = new Set();
  const plan = [];
  const tries = maxTries || target * 35 + 64;
  for (let attempt = 0; attempt < tries && plan.length < target; attempt++) {
    const id = choose(pool, random()), spec = TERRAIN_INDEX[id];
    const [w, h] = spec.size;
    if (w > width || h > height) continue;
    const x = Math.floor(random() * (width - w + 1));
    const y = Math.floor(random() * (height - h + 1));
    const rot = Math.floor(random() * 4);
    // Footprints for odd rotations: rectangular assets swap width and height.
    const [rw, rh] = rot % 2 ? [h, w] : [w, h];
    if (x + rw > width || y + rh > height) continue;
    let fits = true;
    for (let yy = y; yy < y + rh && fits; yy++) for (let xx = x; xx < x + rw; xx++) {
      if (occupied.has(yy * width + xx) || !allowed(xx, yy, spec)) { fits = false; break; }
    }
    if (!fits) continue;
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) occupied.add(yy * width + xx);
    plan.push({ id, x, y, rot, size: [rw, rh] });
  }
  return plan;
}

/** A list of explicit landmark objects, with offsets in tile coordinates. */
export function featureAt(id, x, y, rot = 0) {
  const spec = TERRAIN_INDEX[id];
  if (!spec) throw new RangeError(`Unknown terrain: ${id}`);
  const [w,h] = spec.size;
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(rot) || rot < 0 || rot > 3)
    throw new RangeError('Bad tile position or rotation');
  return { id, x, y, rot, size: rot % 2 ? [h,w] : [w,h] };
}
