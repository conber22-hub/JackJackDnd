/* RULES — movement allowance, turn order checks, and conditions with round durations. */
import { state, ui } from '../engine/state.js';
import { CONDITIONS } from '../data/dread.js';

export const currentTurn = () => state.combat.active ? state.tokens.find(t => t.id === state.combat.order[state.combat.idx]) : null;
export const turnKey = () => `${state.combat.round}:${state.combat.idx}`;
export function canAct(t){ return !state.combat.active || currentTurn()?.id === t.id; }

export const hasCond = (t, n) => !!t.conds?.some(c => c.n === n);
// A creature's saving throw bonus for one ability (heroes from the creator have all six; others use one number).
export const saveBonus = (t, ab) => t.saves?.[String(ab).slice(0, 3).toLowerCase()] ?? t.saveMod ?? 0;
export function addCond(t, n, rounds = 1, src){
  t.conds ||= [];
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

export function moveAllowance(t){
  if (ui.freeMove && ui.role === 'dm') return 999;
  if (stopped(t)) return 0;
  let sq = Math.floor((t.speed || 30) / 5);
  if (hasCond(t, 'prone')) sq = Math.floor(sq / 2);
  if (state.combat.active) return Math.max(0, sq - (t.moved || 0));
  return Math.max(sq, 6) * 4;   // exploration pace outside combat
}
