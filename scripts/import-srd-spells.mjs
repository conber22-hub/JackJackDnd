// Run with the pinned community spells.md listed in docs/codex/spell-library.md.
// No network access at build/test time. Never infer damage from prose: a summon, rider or table
// can contain dice which are not the spell's damage. Only reviewed mechanics below are automated.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-srd-spells.mjs /path/to/spells.md');
const raw = readFileSync(input), source = raw.toString('utf8');
const classes = { Bard:'B', Cleric:'C', Druid:'D', Paladin:'P', Ranger:'R', Sorcerer:'S', Warlock:'K', Wizard:'W' };
const headings = [...source.matchAll(/^#### (.+)\n\n_(?:Level (\d) (\w+)|(\w+) Cantrip) \(([^)]+)\)_/gm)];
const attack = (d, ty, extra = {}) => ({ k:'atk', d, ty, ...extra });
const save = (sv, d, ty, extra = {}) => ({ k:'save', sv, d, ty, ...extra });
const mechanics = {
  'Acid Splash':save('dex', '1d6', 'acid', { cs:1, area:['sphere', 5] }),
  'Fire Bolt':attack('1d10', 'fire', { cs:1 }),
  'Chill Touch':attack('1d10', 'necrotic', { cs:1, note:'The target cannot regain Hit Points until the end of your next turn.' }),
  'Eldritch Blast':attack('1d10', 'force', { beams:1 }),
  'Poison Spray':attack('1d12', 'poison', { cs:1 }),
  'Ray of Frost':attack('1d8', 'cold', { cs:1, note:'Reduce the target’s Speed by 10 feet until the start of your next turn.' }),
  'Shocking Grasp':attack('1d8', 'lightning', { cs:1, note:'The target cannot make Opportunity Attacks until the start of its next turn.' }),
  'Starry Wisp':attack('1d8', 'radiant', { cs:1, note:'On a hit, the target sheds Dim Light for 10 feet and cannot become Invisible until the end of your next turn.' }),
  'Sacred Flame':save('dex', '1d8', 'radiant', { cs:1, note:'The target gains no benefit from Half Cover or Three-Quarters Cover.' }),
  'Vicious Mockery':save('wis', '1d6', 'psychic', { cs:1, note:'On a failed save, the target has Disadvantage on its next attack roll before the end of its next turn.' }),
  'Burning Hands':save('dex', '3d6', 'fire', { half:true, area:['cone', 15] }),
  'Thunderwave':save('con', '2d8', 'thunder', { half:true, area:['cube', 15], note:'On a failed save, push the creature 10 feet away. Unsecured objects are pushed too.' }),
  'Guiding Bolt':attack('4d6', 'radiant', { note:'The next attack roll against the target before the end of your next turn has Advantage.' }),
  'Inflict Wounds':save('con', '2d10', 'necrotic', { half:true }),
  'Hellish Rebuke':save('dex', '2d10', 'fire', { half:true }),
  // hero.js has explicit support for three separately rolled rays and the Divine Smite rider.
  'Scorching Ray':attack('2d6', 'fire'),
  'Divine Smite':{ k:'util', d:'2d8', ty:'radiant', r:5 },
  'Shatter':save('con', '3d8', 'thunder', { half:true, area:['sphere', 10], note:'Constructs have Disadvantage on the save; unattended nonmagical objects also take damage.' }),
  'Fireball':save('dex', '8d6', 'fire', { half:true, area:['sphere', 20] }),
  'Lightning Bolt':save('dex', '8d6', 'lightning', { half:true, area:['line', 100] }),
  'Cone of Cold':save('con', '8d8', 'cold', { half:true, area:['cone', 60] }),
  'Circle of Death':save('con', '8d8', 'necrotic', { half:true, area:['sphere', 60] }),
  'Cure Wounds':{ k:'heal', d:'2d8' },
  'Healing Word':{ k:'heal', d:'2d4' },
  'Mass Cure Wounds':{ k:'heal', d:'5d8' },
  'Mass Healing Word':{ k:'heal', d:'2d4' },
  'Bless':{ k:'buff' }, 'Guidance':{ k:'buff' }, 'Shield':{ k:'buff' },
  'Mage Armor':{ k:'buff' }, 'Shield of Faith':{ k:'buff' }, 'Death Ward':{ k:'buff' },
  'Lesser Restoration':{ note:'End Blinded, Deafened, Paralyzed or Poisoned. Flood Edition: also burn the Bloom’s seed out of a living host.' },
  'Greater Restoration':{ note:'Choose one effect to end as described by the spell. Flood Edition: also burn the Bloom’s seed out of a living host.' },
};

const spells = headings.map((h, i) => {
  const body = source.slice(h.index + h[0].length, headings[i + 1]?.index ?? source.length).trim();
  const field = key => { const m = body.match(new RegExp(`^\\*\\*${key}:\\*\\* (.+)$`, 'm')); assert.ok(m, `${h[1]}: ${key}`); return m[1]; };
  const range = field('Range'), time = field('Casting Time'), dur = field('Duration');
  const distance = range.match(/^(\d+) (feet|mile|miles)$/);
  // A finite, JSON-safe sentinel disables the numeric cap for text-governed ranges.
  // Sight, same-plane and cross-plane restrictions still require the DM's ruling.
  const r = range === 'Self' ? 0 : range === 'Touch' ? 5 : distance ? +distance[1] * (distance[2] === 'feet' ? 1 : 5280) : Number.MAX_SAFE_INTEGER;
  assert.ok(distance || ['Self', 'Touch', 'Special', 'Sight', 'Unlimited'].includes(range), range);
  const after = body.slice(body.indexOf('**Duration:**') + '**Duration:**'.length).replace(/^[^\n]*\n/, '').trim();
  const higher = after.match(/^_Using a Higher-Level Spell Slot\._ (.+)$/m);
  const text = after.replace(/^_Using a Higher-Level Spell Slot\._ .+\n?/m, '').trim();
  const c = h[5].split(', ').map(n => { assert.ok(classes[n], n); return classes[n]; }).join('');
  return {
    n:h[1], l:+(h[2] ?? 0), c, k:'util', r, ...mechanics[h[1]],
    school:h[3] || h[4], time, range, comp:field('Components?'), dur,
    ...(/Concentration/.test(dur) ? { conc:true } : {}), ...(/Ritual/.test(time) ? { ritual:true } : {}),
    text, ...(higher ? { hl:higher[1] } : {}), src:'SRD 5.2.1',
  };
});
const index = JSON.parse(readFileSync(new URL('../tests/fixtures/srd-spell-index.json', import.meta.url)));
assert.equal(spells.length, 339);
assert.deepEqual(spells.map(({ n, l, c, school }) => ({ n, l, c, school })).sort((a, b) => a.n.localeCompare(b.n)),
  index.map(({ n, l, c, school }) => ({ n, l, c, school })).sort((a, b) => a.n.localeCompare(b.n)));
for (const n of Object.keys(mechanics)) assert.ok(spells.some(s => s.n === n), `Unknown override: ${n}`);
const header = `/* This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the
   Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative
   Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

   Generated by scripts/import-srd-spells.mjs; provenance and limitations: docs/codex/spell-library.md.
   Changes: structured metadata, reviewed combat fields, separate higher-slot text and Flood Edition notes.
   Source SHA-256: ${createHash('sha256').update(raw).digest('hex')}
   c: B bard, C cleric, D druid, P paladin, R ranger, S sorcerer, K warlock, W wizard.
   k: atk / save / heal / buff / util. d: dice per attack or effect; ty: damage type; sv: save ability.
   half: half damage on a save; area: [shape, feet]; cond: failed-save condition; cs: cantrip dice scaling.
   r: feet (0 self, 5 touch, MAX_SAFE_INTEGER text-governed); conc / ritual: flags.
   Complex effects stay util without damage dice: hero.js treats util + d as Divine Smite.
   Descriptions retain source Markdown and embedded tables/stat blocks. */
import { EXTRA_SPELLS } from './extra-spells.js';
import { FLOOD_SPELLS } from './flood-spells.js';

export const SRD_SPELLS = [\n`;
const rows = spells.map(sp => `  ${JSON.stringify(sp)},`).join('\n');
writeFileSync(new URL('../src/data/srd-spells.js', import.meta.url), header + rows + '\n];\n\nexport const SPELLS = [...SRD_SPELLS, ...EXTRA_SPELLS, ...FLOOD_SPELLS];\n');
console.log(`Imported ${spells.length} SRD spells.`);
