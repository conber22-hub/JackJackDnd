/* NOISE — loud things carry: through the floor to the levels above and below (the floors stack square over
   square), and further when it is very loud. Creatures that hear it are alerted, and the DM sees where the sound
   arrived on the other floors. loud: 1 (a forced door, a trap, a fight starting) · 2 (thunder, an explosion, a bell) */
import { state, ui, log, isDM } from '../engine/state.js';
import { spawnPing } from '../render/effects.js';
import { toast } from '../ui/hud.js';

export function makeNoise(L, x, y, loud = 1, why = 'A noise'){
  const reachOf = dl => dl === 0 ? 8 + 6 * loud : Math.abs(dl) === 1 ? 4 + 5 * loud : loud >= 2 ? 6 : -1;
  const heard = {};
  for (let dl = -2; dl <= 2; dl++){
    const F = L + dl, R = reachOf(dl); if (R < 0 || !state.floors[F]) continue;
    for (const t of state.tokens){
      if (t.floor !== F || t.kind !== 'monster' || t.dead || t.flags.gone || t.flags.alert || Math.hypot(t.x - x, t.y - y) > R) continue;
      t.flags.alert = true; (heard[F] ||= []).push(t);
    }
    if (dl && isDM() && state.floors[F] && (heard[F] || loud >= 2)) spawnPing(F, x, y, '#c0303a');
  }
  const floors = Object.keys(heard).map(Number);
  if (!floors.length) return [];
  const say = floors.map(F => `${heard[F].length} on ${F === L ? 'this floor' : state.floors[F].name}`).join(', ');
  log(`📢 ${why} — heard by ${say}.`, true);
  if (ui.role === 'dm') toast(`📢 ${why}: ${say} heard it.`);
  return floors.flatMap(F => heard[F]);
}
