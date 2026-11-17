/* 🎯 THE ODDS OF A BLOW — before it's struck, what it will likely do: the chance to hit, the chance of a critical,
   and the damage it carries on average. Pure: no DOM, no state.
   The rules (SRD 5.2): a d20 plus the bonus against the target's AC (cover added); a natural 20 always hits, and is a
   critical; a natural 1 always misses. Advantage rolls twice and keeps the higher, disadvantage the lower, and having
   both is having neither. A blow that crits on any hit (a helpless foe struck from 5 ft.) still has to hit. */
import { avgDice } from '../util/core.js';

// The chance a single d20 comes up n or more (n clamped to what a die can do)
const atLeast = n => Math.min(20, Math.max(0, 21 - n)) / 20;

/* → { hit, crit, need } for bonus vs AC.
   hit, crit: 0…1; need: the number the die must show (2…20: a 1 never hits, a 20 always does). */
export function hitOdds(bonus, ac, { adv = false, dis = false, autoCrit = false } = {}){
  const need = Math.min(20, Math.max(2, ac - bonus));
  const one = atLeast(need), c1 = 1 / 20;
  const both = adv && dis, a = adv && !both, d = dis && !both;
  const roll = p => a ? 1 - (1 - p) ** 2 : d ? p ** 2 : p;
  const hit = roll(one);
  return { hit, crit:autoCrit ? hit : roll(c1), need };
}

/* The damage on average, counting the misses and the criticals (a critical doubles the dice, not the bonus).
   dice: '1d8+3'; extra: a flat bonus added on a hit (Rage). */
export function expectedDamage(dice, odds, extra = 0){
  const all = avgDice(dice), flat = flatPart(dice), diceOnly = all - flat;
  const plain = Math.max(0, odds.hit - odds.crit);
  return plain * (all + extra) + odds.crit * (all + diceOnly + extra);
}
const flatPart = expr => (String(expr || '').replace(/\s+/g, '').match(/[+-]?[^+-]+/g) || []).filter(t => /^[+-]?\d+$/.test(t)).reduce((n, t) => n + +t, 0);

// "65%": the chance as people say it (never 0% or 100% for a roll that can come up 20 or 1)
export const pct = p => `${Math.round(Math.min(.99, Math.max(.01, p)) * 100)}%`;

/* The edge on a roll, in a few words: ⇈ advantage (why), ⇊ disadvantage (why), or both cancelling.
   → { mark:'⇈'|'⇊'|'⇅'|'', text } */
export function edgeWords({ adv = [], dis = [] } = {}){
  const list = xs => [...new Set(xs)].join(', ');
  if (adv.length && dis.length) return { mark:'⇅', text:`advantage and disadvantage cancel (${list([...adv, ...dis])})` };
  if (adv.length) return { mark:'⇈', text:`advantage: ${list(adv)}` };
  if (dis.length) return { mark:'⇊', text:`disadvantage: ${list(dis)}` };
  return { mark:'', text:'' };
}
