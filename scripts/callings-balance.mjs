import { pathToFileURL } from 'node:url';
import { BEST } from '../src/data/bestiary.js';
import { CALLINGS } from '../src/data/callings.js';
import { featuresAt } from '../src/engine/callings.js';
import { benchmarkFoe, benchmarkParty, simulate, simulateParty } from '../src/engine/balance.js';
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

function table(lines, rows, party){
  const fields = party ? { ...metrics, 'Group DPR':r => r.partyDpr, Standing:r => r.standing } : metrics;
  const summary = bands(rows, fields), priceBands = bands(rows.filter(r => r.p.seep), prices);
  lines.push('Mean ± SD across Paths · ' + summary.map(({ name, mean, sd }) =>
    ['Win', 'Standing'].includes(name) ? `${name} ${pct(mean)} ± ${pct(sd)}` : `${name} ${num(mean)} ± ${num(sd)}`).join(' · '));
  const headers = ['Calling', 'Path', 'Win', ...(party ? ['Hero wins', 'Party DPR'] : []), 'Rounds', 'DPR', 'Taken',
    'Seep price (mark / drain / HP)', 'Δ Path (pp)', ...(party ? [] : ['Δ Spells (pp)']), 'Flags', 'Features and rites per fight'];
  lines.push('\n| ' + headers.join(' | ') + ' |');
  lines.push('| ' + headers.map(h => ['Calling', 'Path', 'Flags', 'Features and rites per fight'].includes(h) ? '---' : '---:').join(' | ') + ' |');
  for (const r of rows){
    const triggered = Object.entries(r.featuresUsed).sort((a, b) => b[1] - a[1]);
    const features = [
      ...triggered.filter(([name]) => r.pathNames.has(name)).map(([name, n]) => `**${name}** ${num(n)}`),
      ...triggered.filter(([name]) => !r.pathNames.has(name)).slice(0, 3).map(([name, n]) => `${name} ${num(n)}`),
      ...Object.entries(r.spells.casts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, n]) => `*${name}* ${num(n)}`),
    ];
    const price = [r.seep.marks, r.seep.drain, r.seep.hp].map(num).join(' / ');
    const written = Object.entries(r.seep.text).map(([s, n]) => `${s} (×${num(n)})`).join(', ');
    const outliers = flags(r, r.p.seep ? [...summary, ...priceBands] : summary);
    lines.push('| ' + [
      r.c.name, r.p.name, pct(r.won), ...(party ? [pct(r.standing), num(r.partyDpr)] : []),
      num(r.rounds), num(r.dpr), num(r.dmgTaken), r.p.seep ? price + (written ? ` + ${written}` : '') : '—',
      pp(r.delta), ...(party ? [] : [pp(r.spellDelta)]), outliers.join(', ') || '—', features.join(', ') || '—',
    ].map(cell).join(' | ') + ' |');
  }
}

function biggestChanges(rows){
  const means = Object.values(CALLINGS).map(c => {
    const paths = rows.filter(r => r.c === c);
    return { name:c.name, delta:paths.reduce((sum, r) => sum + r.spellDelta, 0) / paths.length };
  });
  const list = direction => means.filter(r => direction * r.delta > 0).sort((a, b) => direction * (b.delta - a.delta))
    .slice(0, 3).map(r => `${r.name} ${pp(r.delta)} pp`).join(', ');
  const down = list(-1);
  return `Largest changes from the weapons and damage-cantrip duel, averaged across Paths — gains ${list(1) || 'none'}${down ? ` · losses ${down}` : ''}.`;
}

export function report(levels = [3, 5, 10], fights = FIGHTS){
  const lines = ['# Callings balance'];
  lines.push(`
${fights} fresh-rest fights per row (seed ${SEED} plus the level), on an open lane. The party pairs the tested hero with a level-matched Vanguard Hoplite who starts five feet ahead. One listed attack per foe each turn. Party foes attack the nearest opponent they can reach. The 30-round cap counts as a non-win. In a party win, at least one hero stands when the last foe drops. Hero wins count fights where the tested hero also stands. A fallen hero can get back up through healing.

Casters prepare damage and support spells from their chassis list, with the chassis's usual bonus spells. A slot attack needs at least two more expected damage (or 20% more, whichever is higher) than the best free action. The policy discounts higher slots and replacing an active concentration spell, upcasts for enough extra value, and uses healing or protection when a hero is hurt. In a party, the same area can cover multiple foes. Concentration can drop on damage or incapacitation.

DPR is actual enemy HP removed per round, including the tested hero's summons. Party DPR includes the Hoplite. Taken is the tested hero's HP lost after Ward and temporary HP. Prices are means per fight and track the effects that fired. They do not change HP or rot in these trials.

Arrows flag values more than one population standard deviation from that table's mean in either direction. Standing flags use hero wins, and Group DPR flags use party DPR. Price bands use Seep-touched rows only. Δ Path compares to the same build with its Path omitted. Δ Spells compares the same hero to the former weapons and damage-cantrip duel. Both changes are in win percentage points. Path features are bold and the most-used slotted rites are italicised.

These trials model selected combat spells and structured features. They omit most control spells, non-damage riders handled by the DM, cover, opportunity attacks, death saves, monster specials and adventuring-day attrition.
`.trim());

  for (const lvl of levels){
    const foe = benchmarkFoe(lvl), creature = BEST[foe];
    const group = benchmarkParty(lvl);
    const partner = { calling:'vanguard', path:'hoplite', lvl };
    const seed = () => mulberry32(SEED + lvl);
    const duel = (hero, spells = true) => simulate({ ...hero, foe, spells, fights, rng:seed() });
    const party = hero => simulateParty({ heroes:[hero, partner], foes:group.foes, fights, rng:seed() });
    const duelRows = [], partyRows = [];
    for (const c of Object.values(CALLINGS)){
      const chassis = { lvl, calling:c.id };
      const baseline = duel(chassis).won, partyBaseline = party(chassis).party.won;
      for (const p of c.paths){
        const hero = { ...chassis, path:p.id };
        const pathNames = new Set(featuresAt(hero).filter(f => f.from === 'path').map(f => f.n));
        const d = duel(hero), old = duel(hero, false);
        duelRows.push({ ...d, c, p, pathNames, dpr:d.dmgDealt / d.rounds, delta:d.won - baseline, spellDelta:d.won - old.won });
        const { heroes:[h], party:g } = party(hero);
        partyRows.push({ ...h, c, p, pathNames, standing:h.won, won:g.won, dpr:h.dmgDealt / g.rounds,
          partyDpr:g.dmgDealt / g.rounds, delta:g.won - partyBaseline });
      }
    }
    lines.push(`
## Level ${lvl} · ${creature.name} (CR ${creature.cr})
`);
    lines.push('### Duel with spells\n');
    table(lines, duelRows, false);
    lines.push('\n' + biggestChanges(duelRows));
    const names = [...new Set(group.foes)].map(id => `${group.foes.filter(f => f === id).length} × ${BEST[id].name} (CR ${BEST[id].cr})`);
    lines.push(`
### Two-hero party

${names.join(', ')} · ${group.xp} of ${group.budget} XP (high).
`);
    table(lines, partyRows, true);
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
