import { pathToFileURL } from 'node:url';
import { BEST } from '../src/data/bestiary.js';
import { CALLINGS } from '../src/data/callings.js';
import { featuresAt } from '../src/engine/callings.js';
import { benchmarkFoe, simulate } from '../src/engine/balance.js';
import { mulberry32 } from '../src/util/core.js';

const FIGHTS = 200;
const SEED = 11;
const metrics = {
  Win:r => r.won, Rounds:r => r.rounds, DPR:r => r.dpr, Taken:r => r.dmgTaken,
};
const prices = { Marks:r => r.seep.marks, Drain:r => r.seep.drain, 'HP price':r => r.seep.hp };

function bands(rows, fields){
  return Object.entries(fields).map(([name, value]) => {
    const values = rows.map(value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sd = Math.sqrt(values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length);
    return { name, value, mean, sd };
  });
}

function flags(row, fields){
  return fields.flatMap(({ name, value, mean, sd }) => {
    const delta = value(row) - mean;
    return sd > 1e-9 && Math.abs(delta) > sd ? [`${name}${delta > 0 ? '↑' : '↓'}`] : [];
  });
}

const num = n => n.toFixed(2);
const pct = n => (100 * n).toFixed(1) + '%';
const pp = n => (n > 0 ? '+' : '') + (100 * n).toFixed(1);
const cell = text => String(text).replaceAll('|', '\\|');

export function report(levels = [3, 5, 10]){
  const lines = ['# Callings balance'];
  lines.push(`
${FIGHTS} fresh-rest fights per row (seed ${SEED} plus the level). A hero and one fixed bestiary foe at average HP start 40 feet apart in an open lane. Each side closes as needed and uses the best available attack. Summons can join. The foe uses one listed attack each turn, with its structured defence and on-hit data. A hero wins by still standing when the foe drops. The 30-round cap counts as a non-win.

Damage is actual HP removed, capped at the target’s remaining HP. DPR divides total damage dealt, including summons, by total rounds. Taken counts hero HP lost after the Ward and temporary HP. The price is the mean per fight in marks, maximum HP drain and immediate HP, with any written prices shown separately. Prices are recorded when used and do not change duel HP, stage or outcome.

Arrows flag values strictly more than one population standard deviation above or below the level’s mean. Price bands use Seep-touched rows only. Δ Path compares win percentage points to the same chassis with its Path omitted and the same starting RNG seed. The features column shows triggers or activations per fight, with Path features in bold. These counts show what fired, and Δ Path measures the bundle’s effect under this encounter.

Weapons and damage cantrips only. The model includes chassis statistics, basic combat resources and structured Calling/Path effects that apply in a duel. It skips leveled spells, narrated feature text, most chassis abilities, battlefield tactics, monster specials, and effects that require a party or terrain.
`.trim());

  for (const lvl of levels){
    const foe = benchmarkFoe(lvl), creature = BEST[foe];
    const args = { lvl, foe, fights:FIGHTS };
    const rows = Object.values(CALLINGS).flatMap(c => {
      const baseline = simulate({ ...args, calling:c.id, rng:mulberry32(SEED + lvl) });
      return c.paths.map(p => {
        const opts = { ...args, calling:c.id, path:p.id };
        const result = simulate({ ...opts, rng:mulberry32(SEED + lvl) });
        const pathNames = new Set(featuresAt(opts).filter(f => f.from === 'path').map(f => f.n));
        return { ...result, c, p, dpr:result.dmgDealt / result.rounds, delta:result.won - baseline.won, pathNames };
      });
    });
    const summary = bands(rows, metrics), priceBands = bands(rows.filter(r => r.p.seep), prices);
    lines.push(`\n## Level ${lvl} · ${creature.name} (CR ${creature.cr})\n`);
    lines.push('Mean ± SD across Paths · ' + summary.map(({ name, mean, sd }) =>
      name === 'Win' ? `Win ${pct(mean)} ± ${pct(sd)}` : `${name} ${num(mean)} ± ${num(sd)}`).join(' · '));
    lines.push('\n| Calling | Path | Win | Rounds | DPR | Taken | Seep price (mark / drain / HP) | Δ Path (pp) | Flags | Features used per fight |');
    lines.push('| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |');
    for (const r of rows){
      const triggered = Object.entries(r.featuresUsed).sort((a, b) => b[1] - a[1]);
      const pathFeatures = triggered.filter(([name]) => r.pathNames.has(name));
      const chassis = triggered.filter(([name]) => !r.pathNames.has(name));
      const features = [
        ...pathFeatures.map(([name, n]) => `**${name}** ${num(n)}`),
        ...chassis.slice(0, 3).map(([name, n]) => `${name} ${num(n)}`),
      ].join(', ');
      const price = [r.seep.marks, r.seep.drain, r.seep.hp].map(num).join(' / ');
      const written = Object.entries(r.seep.text).map(([s, n]) => `${s} (×${num(n)})`).join(', ');
      const outliers = flags(r, r.p.seep ? [...summary, ...priceBands] : summary);
      lines.push('| ' + [
        r.c.name, r.p.name, pct(r.won), num(r.rounds), num(r.dpr), num(r.dmgTaken),
        r.p.seep ? price + (written ? ` + ${written}` : '') : '—', pp(r.delta), outliers.join(', ') || '—', features || '—',
      ].map(cell).join(' | ') + ' |');
    }
  }
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href){
  const args = process.argv.slice(2);
  const lvl = Number(args[0]);
  if (args.length > 1 || args.length && (!Number.isInteger(lvl) || lvl < 1 || lvl > 20)){
    console.error('Usage: node scripts/callings-balance.mjs [level 1–20]');
    process.exitCode = 1;
  } else console.log(report(args.length ? [lvl] : undefined));
}
