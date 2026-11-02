// Only unconditional entries fit this shape. Qualified defences stay in the DM's traits.
export const DAMAGE_TYPES = 'acid bludgeoning cold fire force lightning necrotic piercing poison psychic radiant slashing thunder'.split(' ');
export const CONDITIONS = 'blinded charmed deafened exhaustion frightened grappled incapacitated invisible paralyzed petrified poisoned prone restrained stunned unconscious'.split(' ');
export function parseDefenses(traits = []){
  const out = { resist:[], immune:[], vuln:[], condImmune:[] };
  for (const trait of traits){
    const m = /^\s*(Resistances|Immunities|Vulnerabilities)\.\s*(.*)$/i.exec(trait.replace(/<[^>]*>/g, ''));
    if (!m) continue;
    const key = { resistances:'resist', immunities:'immune', vulnerabilities:'vuln' }[m[1].toLowerCase()];
    for (const word of m[2].toLowerCase().split(/[,;]/).map(s => s.trim())){
      const dest = DAMAGE_TYPES.includes(word) ? key : key === 'immune' && CONDITIONS.includes(word) ? 'condImmune' : null;
      if (dest && !out[dest].includes(word)) out[dest].push(word);
    }
  }
  return out;
}
export function applyDefenses(parts, defenses = {}){
  const lines = parts.map(({ t, n }) => {
    t = t.toLowerCase();
    const was = n, reasons = [];
    if (defenses.immune?.includes(t)){ n = 0; reasons.push('immune'); }
    else {
      if (defenses.resist?.includes(t)){ n = Math.floor(n / 2); reasons.push('resistant'); }
      if (defenses.vuln?.includes(t)){ n *= 2; reasons.push('vulnerable'); }
    }
    return { t, n, was, why:reasons.join(', ') };
  });
  return { total:lines.reduce((sum, l) => sum + l.n, 0), lines };
}
export const conditionImmune = (defenses, cond) => !!defenses?.condImmune?.includes(cond.toLowerCase());
