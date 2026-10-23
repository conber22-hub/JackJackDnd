/* RULES — movement allowance, turn order checks, and conditions with round durations. */
import { state, ui } from '../engine/state.js';
import { CONDITIONS } from '../data/dread.js';
import { log } from '../engine/state.js';
import { BREAKS_CONC } from '../engine/spellcast.js';

export const currentTurn = () => state.combat.active ? state.tokens.find(t => t.id === state.combat.order[state.combat.idx]) : null;
export const turnKey = () => `${state.combat.round}:${state.combat.idx}`;
export function canAct(t){ return !state.combat.active || currentTurn()?.id === t.id; }

export const hasCond = (t, n) => !!t.conds?.some(c => c.n === n);
// A creature's saving throw bonus for one ability (heroes from the creator have all six; others use one number).
export const saveBonus = (t, ab) => t.saves?.[String(ab).slice(0, 3).toLowerCase()] ?? t.saveMod ?? 0;
export function addCond(t, n, rounds = 1, src){
  t.conds ||= [];
  if (t.conc && BREAKS_CONC.has(n)) endConc(t, `is ${n}`);
  const c = t.conds.find(c => c.n === n);
  if (c) c.r = rounds < 0 || c.r < 0 ? -1 : Math.max(c.r, rounds);
  else t.conds.push({ n, r:rounds, at:state.combat.active ? turnKey() : null, ...(src ? { src } : {}) });
}
export function removeCond(t, n){ t.conds = (t.conds || []).filter(c => c.n !== n); }
// End of a creature's own turn: tick its conditions (ones applied during this very turn wait one more).
export function tickConds(t){
  if (!t?.conds?.length) return;
  const key = turnKey();
  for (const c of t.conds){ if (c.at === key){ c.at = null; continue; } if (c.r > 0) c.r--; }
  t.conds = t.conds.filter(c => c.r !== 0);
}
export const stopped = t => (t.conds || []).some(c => CONDITIONS[c.n]?.stop);

// Squares a creature can still move. In a fight: its speed (twice that with the Dash) less what it has moved;
// crawling while prone costs double. dash:true asks what it would have if it took the Dash now.
export const speedSquares = t => Math.floor((t.speed || 30) / 5);
export function moveAllowance(t, { dash = false } = {}){
  if (ui.freeMove && ui.role === 'dm') return 999;
  if (stopped(t)) return 0;
  let sq = speedSquares(t);
  if (state.combat.active){ sq *= t.dashed || dash ? 2 : 1; if (hasCond(t, 'prone')) sq = Math.floor(sq / 2); return Math.max(0, sq - (t.moved || 0)); }
  if (hasCond(t, 'prone')) sq = Math.floor(sq / 2);
  return Math.max(sq, 6) * 4;   // exploration pace outside combat
}

/* Concentration (engine/spellcast.js): t.conc = { n:spell } while a creature holds one. Ending it lifts the
   conditions that spell laid on anyone (src 'conc:<caster id>') and the sustained effect, if it was that one. */
// A fresh casting: whatever it held before ends first, even the same spell (a second Hold Person frees the first
// target). Using a sustained spell again on a later turn (Spiritual Weapon, Moonbeam) isn't a fresh casting: callers skip it.
export function startConc(t, name){
  if (t.conc) endConc(t, `starts concentrating on ${name}`);
  t.conc = { n:name };
}
export function endConc(t, why = ''){
  if (!t?.conc) return null;
  const n = t.conc.n, src = `conc:${t.id}`;
  t.conc = null;
  for (const o of state.tokens) if (o.conds?.some(c => c.src === src)) o.conds = o.conds.filter(c => c.src !== src);
  if (t.sustain === n) t.sustain = null;
  log(`🌀 ${t.name} ${why ? `${why} — ` : ''}${n} ends.`);
  return n;
}
