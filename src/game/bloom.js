/* 🌿 THE BLOOM IN THE WOODS at the table: the DM says how far the Bloom has got into this map's trees (Maps tab):
   untouched, creeping or rampant. The floor keeps it (f.bloom, engine/bloom-woods.js), it goes to the players with
   the map, and the woods are drawn with it (render/floors.js). A road laid while the Bloom is loose starts with some. */
import { state, ui, log } from '../engine/state.js';
import { BLOOM_LEVELS, woodsBloom } from '../engine/bloom-woods.js';
import { changed } from './session.js';
import { buildFloor } from '../render/floors.js';

export const bloomOf = (L = ui.floor) => woodsBloom(state.floors[L]);
export function setBloom(v, L = ui.floor){
  const f = state.floors[L]; if (!f) return;
  v = Math.max(0, Math.min(1, +v || 0));
  if (v) f.bloom = v; else delete f.bloom;
  const lv = BLOOM_LEVELS.reduce((a, b) => Math.abs(b.v - v) < Math.abs(a.v - v) ? b : a);
  log(v ? `${lv.icon} ${f.name}: the Bloom in the trees, ${lv.name.toLowerCase()}.` : `🌲 ${f.name}: the woods are clean of the Bloom.`, true);
  buildFloor(L); changed();
}
