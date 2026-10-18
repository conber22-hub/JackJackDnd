// Writes docs/curse-of-strahd-flood-edition.md from src/data/campaign.js (run: npm run campaign-doc).
import { writeFileSync } from 'node:fs';
import { CAMPAIGN, SESSIONS, CLOCKS, CAST, NIGHT } from '../src/data/campaign.js';
import { BEST } from '../src/data/bestiary.js';
import { TEMPLATES } from '../src/data/themes.js';

const strip = s => String(s).replace(/<\/?b>/g, '**').replace(/<[^>]+>/g, '');
const name = id => BEST[id]?.name || id, cr = id => BEST[id]?.cr ?? '?';
const out = [`# ${CAMPAIGN.name}`, '', `*${CAMPAIGN.tagline}*`, '', `${CAMPAIGN.levels}. Built for Dread Delve: every dungeon below is one tap in the Story tab, and every encounter drops onto the map.`, '',
  '> This guide reprints nothing from the module. Run each location from your own book; use this for what the Flood Edition changes.', '',
  '## Pillars', ...CAMPAIGN.pillars.map(p => `- ${p}`), '', '## The Seeded rule', strip(CAMPAIGN.seeded), '',
  '## Clocks', ...CLOCKS.map(c => `- **${c.label}** (${c.max}, starts at ${c.start}) — ${c.full}`), ''];
for (const s of SESSIONS){
  out.push(`## Session ${s.n} · ${s.title}`, '', `*Level ${s.level} · start at Dread ${s.dread} · ${s.length}*`, '',
    `**Hook.** ${s.hook}`, '', s.premise, '', `**From your book.** ${s.book}`, '', `**Flood Edition.** ${s.flood}`, '', `> ${s.open}`, '');
  for (const sc of s.scenes){
    out.push(`### ${sc.t}`, ...sc.beats.map(b => `- ${b}`));
    if (sc.delve) out.push(`- ▦ **Dungeon:** ${(TEMPLATES.find(t => t.id === sc.delve.template) || {}).name || sc.delve.template} — ${sc.delve.note || ''}`);
    if (sc.enc) out.push(`- ⚔ **${sc.enc.label}:** ${sc.enc.group.map(([b, n]) => `${n} × ${name(b)} (CR ${cr(b)})`).join(', ')}`);
    out.push('');
  }
  if (s.npcs?.length) out.push(`**Faces.** ${s.npcs.map(id => CAST.find(c => c.id === id)?.name || id).join(' · ')}`, '');
  if (s.loot?.length) out.push(`**Loot.** ${s.loot.join(' · ')}`, '');
  out.push(`**Clocks.** ${Object.entries(s.tick || {}).map(([k, v]) => `${CLOCKS.find(c => c.id === k)?.label || k} ${v > 0 ? '+' : ''}${v}`).join(' · ') || '—'}`, '',
    `**End on.** ${s.ending}`, '', `**Level.** ${s.levelUp}`, '');
}
out.push('## Faces', ...CAST.map(c => `- **${c.name}** — ${c.look} *Want:* ${c.want} *Fear:* ${c.fear} *Lever:* ${c.lever} (${c.die})`), '');
for (const [k, list] of Object.entries(NIGHT)) out.push(`## ${k[0].toUpperCase() + k.slice(1)}`, ...list.map((x, i) => `${i + 1}. ${x}`), '');
writeFileSync('docs/curse-of-strahd-flood-edition.md', out.join('\n'));
console.log('docs/curse-of-strahd-flood-edition.md written');
