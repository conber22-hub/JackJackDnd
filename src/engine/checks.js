/* CHECKS & SAVES AT THE TABLE — "everyone, a Dexterity saving throw": what's being rolled, each creature's bonus
   for it (a hero's from their sheet: saves, skills, ability modifiers; anyone else from their one save and check
   numbers), the result of a d20 against a DC, and how a group check comes out (2024 rules: at least half the
   group succeeds). Pure (game/asks.js runs it at the table, with dice from phones or typed in). */
import { ABILITIES, ABILITY_NAMES, SKILLS } from '../data/srd.js';

// Everything the DM can ask for: { id, label, kind:'save'|'skill'|'ability', ab, skill }
export const CHECKS = [
  ...ABILITIES.map(a => ({ id:`save:${a}`, label:`${ABILITY_NAMES[a]} saving throw`, short:`${a} save`, kind:'save', ab:a })),
  ...Object.entries(SKILLS).map(([sk, a]) => ({ id:`skill:${sk}`, label:`${sk} (${a}) check`, short:sk, kind:'skill', ab:a, skill:sk })),
  ...ABILITIES.map(a => ({ id:`ability:${a}`, label:`${ABILITY_NAMES[a]} check`, short:`${a} check`, kind:'ability', ab:a })),
];
export const checkById = id => CHECKS.find(c => c.id === id) || null;

// A creature's bonus for a check (heroes have the lot; monsters and simple NPCs fall back to their numbers).
export function bonusFor(t, c){
  if (!t || !c) return 0;
  const ab = c.ab.toLowerCase();
  if (c.kind === 'save') return t.saves?.[ab] ?? t.saveMod ?? 0;
  if (c.kind === 'skill') return t.skills?.[c.skill] ?? (c.skill === 'Perception' && Number.isFinite(t.passive) ? t.passive - 10 : t.check ?? t.mods?.[ab] ?? 0);
  return t.mods?.[ab] ?? t.check ?? 0;
}
// One roll: d20 + bonus against a DC (no DC: just the total). A natural 20 or 1 is noted for the table's
// drama, but on checks and saves it doesn't succeed or fail by itself. → { d20, bonus, total, ok, nat20, nat1 }
export function resolveRoll(d20, bonus, dc){
  const total = d20 + bonus;
  return { d20, bonus, total, ok:dc == null ? null : total >= dc, nat20:d20 === 20, nat1:d20 === 1 };
}
// A group check: does at least half the group succeed? results: [{ ok }]
export const groupOk = results => results.length > 0 && results.filter(r => r.ok).length * 2 >= results.length;
// With advantage or disadvantage, which of two dice counts.
export const keepDie = (a, b, mode) => mode === 'adv' ? Math.max(a, b) : mode === 'dis' ? Math.min(a, b) : a;
