/* 🌿 THE BLOOM IN THE WOODS — how far the Bloom has got into the trees on an outdoor map, 0 (the woods as they are)
   to 1 (taken). The floor's f.bloom: set when a road is laid while the Bloom is loose (engine/generator.js: more the
   harder the Count looks), or by the DM (Maps tab, game/bloom.js). A place the DM has given to the Moss
   (f.decay, engine/decay.js) has it in its woods too. Only the look (render/floors.js: some of the trees bloomed or
   Hunger-taken, moss at their feet); the rules are the Bloom clock's. Pure: no DOM, no Three.js. */

export const BLOOM_LEVELS = [
  { v:0, name:'Untouched', icon:'🌲' },
  { v:.3, name:'Creeping', icon:'🌱' },
  { v:.7, name:'Rampant', icon:'🌿' },
];

const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));

// How much of this floor's woods the Bloom has, 0–1.
export function woodsBloom(f){
  if (!f) return 0;
  const moss = f.decay?.stage === 'infested' ? clamp(f.decay.intensity ?? 1) * .7 : 0;
  return Math.max(clamp(f.bloom), moss);
}

// A road laid while the Bloom is loose: a little of it in the trees, more the harder he looks (gaze 1–10).
export const journeyBloom = (bloom, gaze = 1) => bloom ? Math.round((.2 + Math.min(.35, Math.max(0, gaze - 1) * .05)) * 100) / 100 : 0;

/* Which tree a square of woods carries, given its kind (healthy) and two numbers of its own (0–1):
   kind: the healthy model id, bloomed: its bloomed twin (or null); r: the square's bloom number.
   → the id to draw. The squares that turn are the same ones at every device and only ever more of them as it grows. */
export function bloomedTree(kind, bloomed, r, bloom){
  return bloomed && r < clamp(bloom) ? bloomed : kind;
}
