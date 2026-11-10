/* 🏚 DEAD VILLAGES at the table (engine/decay.js over ChatGPT's planner). The DM says how far this place has fallen
   (Maps tab): lived-in, abandoned, or taken by the Moss, and how much of it (some of the houses, most, all). Each
   house then carries its own state (b.decay: 'abandoned' | 'infested'; none = lived-in), which goes to the players
   with the map and is how it is drawn (render/props.js: boarded and dark, or overgrown and glowing). The floor
   remembers what was asked (f.decay = { stage, intensity }). Only the look and the DM's lines: doors, walls and the
   insides are as they were. */
import { state, ui, log } from '../engine/state.js';
import { planDecay, DECAY_NAMES } from '../engine/decay.js';
import { changed } from './session.js';
import { buildFloor } from '../render/floors.js';

const seedFor = L => `${state.meta.seed}|${state.meta.name}|${L}`;
export const decayOf = (L = ui.floor) => state.floors[L]?.decay || { stage:'inhabited', intensity:1 };
// The houses and the DM's line for each, as they stand now.
export const decayLines = (L = ui.floor) => { const d = decayOf(L); return planDecay(state.floors[L], { seed:seedFor(L), stage:d.stage, intensity:d.intensity }); };

export function setDecay(stage, intensity = decayOf().intensity, L = ui.floor){
  const f = state.floors[L]; if (!f) return;
  const plan = planDecay(f, { seed:seedFor(L), stage, intensity });
  if (!plan.length) return;
  for (const p of plan){ const b = f.buildings[p.index]; if (p.stage === 'inhabited') delete b.decay; else b.decay = p.stage; }
  if (stage === 'inhabited') delete f.decay; else f.decay = { stage, intensity };
  const n = plan.filter(p => p.stage !== 'inhabited').length;
  log(stage === 'inhabited' ? `🏠 ${f.name}: the houses are lived in again.` : `🏚 ${f.name}: ${DECAY_NAMES[stage].toLowerCase()} (${n} of ${plan.length} houses).`, true);
  buildFloor(L); changed();
}
