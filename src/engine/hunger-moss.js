/* 🍄 HUNGER MOSS ON THE OPEN GROUND — where the Bloom is loose in a map's woods (engine/bloom-woods.js: the floor's
   bloom, 0–1), its moss creeps out of the treeline over the grass in a slow, uneven tide: a few trees at the edge of
   the woods start it, and it spreads square by square (ChatGPT's Living Valley II planner, render/barovia-living-state.js,
   grows it in steps from those trees). This file says where it may lie and where it starts; render/living.js draws it.
   Never on a road, a street, a door, the stairs, water, a bridge, a building, a prop or a field's rows: the ways
   through stay clear to see. Only the look: no square is harder to cross for it. Pure: no DOM, no Three.js. */
import { T } from './tiles.js';
import { propSize } from '../data/props.js';

const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));
const hash = (i, k) => { let h = Math.imul(i ^ Math.imul(k + 1, 0x9e3779b1), 2654435761); h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };

/* → null (no Bloom, nowhere for it) or { origins:[{x, y}], allowed(x, y), maxSteps, maxCells }
   for planHungerMoss. opts.seen(i): may this viewer see the square (the players see only what they've explored). */
export function mossGround(f, bloom, { seen = () => true } = {}){
  bloom = clamp(bloom);
  if (!f || !bloom || !Array.isArray(f.grid)) return null;
  const W = f.W, H = f.H, g = f.grid;
  const no = new Set([...(f.water || []), ...(f.shallow || []), ...(f.chasm || []), ...(f.span || []), ...(f.clear || []), ...(f.masonry || [])]);
  for (const d of f.doors || []) no.add(d.i);
  for (const s of [f.up, f.down]) if (s) no.add(s.y * W + s.x);
  for (const b of f.buildings || []) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) no.add(y * W + x);
  for (const p of f.props || []){ const s = propSize(p); for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++) no.add(y * W + x); }
  for (const r of f.rooms || []) if (!r.outdoor || (r.crop && r.crop !== 'orchard'))
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) no.add(y * W + x);
  if (f.height) for (let i = 0; i < g.length; i++) if (f.height[i]) no.add(i);   // (it lies flat: not on the rises)
  // open ground it may lie on: grass, not a road (T.HALL), not anything above
  const open = i => g[i] === T.ROOM && !no.has(i) && seen(i);
  // the treeline: woods squares with open ground beside them; a few of them, picked the same at every device, start it
  const share = .05 + bloom * .14, cap = 6 + Math.round(bloom * 40), edge = [];
  for (let i = 0; i < g.length; i++){
    if (g[i] !== T.ROCK || no.has(i) || hash(i, 7) >= share) continue;
    const x = i % W, y = (i / W) | 0;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < W && ny < H && open(ny * W + nx); })) edge.push(i);
  }
  // (the lowest numbers first, so a stronger Bloom keeps the trees a weaker one had and adds more)
  edge.sort((a, b) => hash(a, 7) - hash(b, 7));
  const from = new Set(edge.slice(0, cap)), origins = [...from].map(i => ({ x:i % W, y:(i / W) | 0 }));
  if (!origins.length) return null;
  let room = 0; for (let i = 0; i < g.length; i++) if (open(i)) room++;
  return {
    origins,
    allowed:(x, y) => { const i = y * W + x; return from.has(i) || open(i); },
    maxSteps:Math.round(2 + bloom * 10),
    maxCells:Math.min(1600, origins.length + Math.round(room * bloom * .3)),
  };
}
