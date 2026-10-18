/* THE GRASP DIE — Andral's hands escalate (d4 → d12). Table lives in the Dread tab; rules in data/tables.js. */
import { state, ui, log, graspTable } from '../engine/state.js';
import { tableRow } from '../engine/tables.js';
import { GRASP_STEPS } from '../data/tables.js';
import { d, esc } from '../util/core.js';
import { showCard, toast } from '../ui/hud.js';
import { runFx, zoneSource } from './combat.js';
import { changed } from './session.js';

export function graspStep(delta, why){
  const i = Math.max(0, GRASP_STEPS.indexOf(state.grasp.die)), j = Math.max(0, Math.min(GRASP_STEPS.length - 1, i + delta));
  if (i === j){ if (delta > 0) toast('The Grasp Die is already at d12 — the hands cannot get any closer.'); return; }
  state.grasp.die = GRASP_STEPS[j];
  log(`✋ Grasp Die ${delta > 0 ? 'grows' : 'shrinks'} to d${state.grasp.die}${why ? ` (${why})` : ''}.`);
  toast(`Grasp Die → d${state.grasp.die}`);
  changed();
}
export function graspReset(){ state.grasp.die = GRASP_STEPS[0]; log('✋ The Grasp Die resets to d4.'); changed(); }

export function graspRoll(L = ui.floor, why){
  if (ui.role !== 'dm') return;
  const die = state.grasp.die, heart = state.tokens.some(t => t.bid === 'handmass' && !t.dead);
  const r1 = d(die), r2 = heart ? d(die) : 0, r = Math.max(r1, r2);
  const row = tableRow(graspTable().rows, r) || { name:'The hands stir', text:'', fx:[] };
  state.grasp.last = { r, die, name:row.name, t:Date.now() };
  showCard({ kind:'', title:`✋ ${row.name}`, sub:`Grasp Die d${die} = ${heart ? `${r1}, ${r2} → ` : ''}${r}${why ? ` · ${why}` : ''}`, flair:row.text,
    lines:heart ? ['<span class="muted">Heart of the Grasp: the Monstrosity lives, so the higher of two rolls counts.</span>'] : [] });
  log(`✋ Grasp d${die} = ${r}: ${row.name}.`);
  const zs = zoneSource(L);
  row.fx.forEach((fx, k) => setTimeout(() => { runFx(zs, fx); changed(); }, 600 + k * 250));
  changed();
  return { r, row };
}
export const graspText = () => `d${state.grasp.die}${state.grasp.last ? ` · last: ${state.grasp.last.r} ${esc(state.grasp.last.name)}` : ''}`;
