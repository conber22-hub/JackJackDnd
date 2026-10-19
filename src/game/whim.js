/* THE WHIM DIE — how the Count toys with the heroes (d4 → d12). Table lives in the Gaze tab; rules in
   data/tables.js. The die is kept in state.grasp (the old name, so older saves still load). */
import { state, ui, log, whimTable } from '../engine/state.js';
import { tableRow } from '../engine/tables.js';
import { WHIM_STEPS } from '../data/tables.js';
import { d, esc } from '../util/core.js';
import { showCard, toast } from '../ui/hud.js';
import { runFx, zoneSource } from './combat.js';
import { changed } from './session.js';
import { sfx } from '../audio/sound.js';

export function whimStep(delta, why){
  const i = Math.max(0, WHIM_STEPS.indexOf(state.grasp.die)), j = Math.max(0, Math.min(WHIM_STEPS.length - 1, i + delta));
  if (i === j){ if (delta > 0) toast('The Whim Die is already at d12 — he could not be more amused.'); return; }
  state.grasp.die = WHIM_STEPS[j];
  log(`🦇 Whim Die ${delta > 0 ? 'grows' : 'shrinks'} to d${state.grasp.die}${why ? ` (${why})` : ''}.`);
  toast(`Whim Die → d${state.grasp.die}`);
  changed();
}
export function whimReset(){ state.grasp.die = WHIM_STEPS[0]; log('🦇 The Whim Die resets to d4.'); changed(); }

export function whimRoll(L = ui.floor, why){
  if (ui.role !== 'dm') return;
  const die = state.grasp.die, r = d(die);
  const row = tableRow(whimTable().rows, r) || { name:'He considers you', text:'', fx:[] };
  state.grasp.last = { r, die, name:row.name, t:Date.now() }; sfx('whisper');
  showCard({ kind:'', title:`🦇 ${row.name}`, sub:`Whim Die d${die} = ${r}${why ? ` · ${why}` : ''}`, flair:row.text });
  log(`🦇 Whim d${die} = ${r}: ${row.name}.`);
  const zs = { ...zoneSource(L), name:'The Count' };
  row.fx.forEach((fx, k) => setTimeout(() => { runFx(zs, fx); changed(); }, 600 + k * 250));
  changed();
  return { r, row };
}
export const whimText = () => `d${state.grasp.die}${state.grasp.last ? ` · last: ${state.grasp.last.r} ${esc(state.grasp.last.name)}` : ''}`;
