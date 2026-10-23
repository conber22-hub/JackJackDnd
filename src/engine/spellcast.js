/* CASTING HIGHER, AND HOLDING ON — upcasting (a spell cast with a higher slot than it needs: more dice, more
   rays) and Concentration (one spell at a time; damage calls for a Constitution save). Pure: the dice strings
   and numbers; game/combat.js and game/rules.js do the casting and the dropping.
   2024 rules: the Concentration DC is 10 or half the damage taken, whichever is higher, up to 30. */

// Dice per slot level above the spell's own, read from its higher-level text ("The damage increases by 1d6 for
// each spell slot level above 3"), or given outright (sp.up). → '1d6' or null
const UP = /(?:damage|healing)[^.]*?increases by (\d+d\d+(?:\s*\+\s*\d+)?) for (?:each|every) (?:spell )?slot level above (\d)/i;
export function upDice(sp){
  if (sp?.up) return sp.up;
  const m = UP.exec(sp?.hl || ''); return m ? m[1].replace(/\s+/g, '') : null;
}
// More rays for each level above (Scorching Ray).
export const upRays = sp => /additional ray for each (?:spell )?slot level above/i.test(sp?.hl || '');

// Add n lots of a die expression to a dice string, folding like dice together: ('8d6', '1d6', 2) → '10d6'.
export function addDice(expr, die, n){
  if (!n || !die) return expr;
  const terms = new Map(); let flat = 0;
  for (const part of `${expr}+${Array(n).fill(die).join('+')}`.replace(/\s+/g, '').split('+').filter(Boolean)){
    const m = /^(\d*)d(\d+)$/i.exec(part);
    if (m) terms.set(+m[2], (terms.get(+m[2]) || 0) + +(m[1] || 1)); else flat += +part || 0;
  }
  return [...terms.entries()].sort((a, b) => b[0] - a[0]).map(([f, k]) => `${k}d${f}`).concat(flat ? [String(flat)] : []).join('+');
}
// A spell's dice cast at a slot level (the base dice if it's no higher, or nothing scales).
export function diceAt(sp, slot){
  const extra = Math.max(0, (slot || 0) - (sp?.l || 0)), up = upDice(sp);
  return sp?.d && extra && up ? addDice(sp.d, up, extra) : sp?.d;
}
export const concDC = dmg => Math.min(30, Math.max(10, Math.floor(dmg / 2)));
// Conditions that end Concentration (Incapacitated, and everything that includes it).
export const BREAKS_CONC = new Set(['incapacitated', 'paralyzed', 'stunned', 'unconscious', 'petrified']);
