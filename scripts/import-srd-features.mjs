// Pinned source and regeneration instructions: docs/codex/classes-20.md.
// Class-specific variants must not overwrite one another (e.g. Unarmored Defense).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-srd-features.mjs /path/to/classes.md');
const raw = readFileSync(input), source = raw.toString('utf8');
const prefixes = { Barbarian:'Berserker', Bard:'Lore', Cleric:'Life', Druid:'Land', Fighter:'Champion', Monk:'Open Hand', Paladin:'Devotion', Ranger:'Hunter', Rogue:'Thief', Sorcerer:'Draconic', Warlock:'Fiend', Wizard:'Evoker' };
const aliases = { 'Lay On Hands':'Lay on Hands', 'Circle of the Land Spells':'Circle Spells' };
const variants = new Map();
let count = 0;
for (const [, cls, body] of source.matchAll(/^## (\w+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)){
  const subclass = body.indexOf(`### ${cls} Subclass:`);
  assert.ok(prefixes[cls] && subclass > 0, cls);
  for (const h of body.matchAll(/^#### Level (\d+): (.+)\n\n([\s\S]*?)(?=^#{2,4} |$(?![\s\S]))/gm)){
    if (h[2].endsWith(' Subclass')) continue;
    let name = aliases[h[2]] || h[2];
    if (h.index > subclass && !['Open Hand Technique', 'Draconic Spells'].includes(name)) name = `${prefixes[cls]}: ${name}`;
    const entries = variants.get(name) || [];
    entries.push({ cls, level:+h[1], text:h[3].trim() });
    variants.set(name, entries); count++;
  }
}
assert.equal(Object.keys(prefixes).length, 12);
assert.equal(count, 220, 'SRD class/subclass feature headings, excluding subclass-choice placeholders');
const features = Object.fromEntries([...variants].map(([name, entries]) => [name, entries.length === 1 ? entries[0].text : entries.map(e => `### ${e.cls}, level ${e.level}\n\n${e.text}`).join('\n\n')]));
for (const level of [6, 7, 8, 9]) features[`Mystic Arcanum (level ${level} spell)`] = features['Mystic Arcanum'];
for (const [name, uses] of [['Action Surge', 'two'], ['Indomitable', 'two'], ['Indomitable', 'three']]) features[`${name} (${uses} uses)`] = features[name];
const attribution = `/* This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of
   the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the
   Creative Commons Attribution 4.0 International License, available at
   https://creativecommons.org/licenses/by/4.0/legalcode.
   Changes: extracted feature descriptions, existing sheet-name aliases, labelled class/level variants.
   Generated from downfallx/dnd-5e-srd-markdown, commit 1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4.
   classes.md SHA-256: ${createHash('sha256').update(raw).digest('hex')}
   Regenerate with scripts/import-srd-features.mjs. Markdown/HTML is data, not trusted markup. */\n`;
writeFileSync(new URL('../src/data/srd-features.js', import.meta.url), attribution + 'export const FEATURES = ' + JSON.stringify(features, null, 2) + ';\n');
console.log(`${count} feature descriptions; ${Object.keys(features).length} lookup keys.`);
