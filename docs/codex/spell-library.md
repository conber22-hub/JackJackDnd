# Spell library (task 1)

`src/data/srd.js` re-exports the same `SPELLS` array from `srd-spells.js`. It now contains
353 entries: all **339 SRD 5.2.1 spells**, four existing supplemental spells, and ten original
Halo Flood-inspired spells for the campaign's Bloom and Seep. Every old spell name is retained.

| Level | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRD 5.2.1 | 27 | 57 | 57 | 42 | 34 | 38 | 31 | 20 | 17 | 16 | 339 |

## Sources and regeneration

The source of truth is the [official SRD 5.2.1 PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf),
spell descriptions on printed pages 107–175. `tests/fixtures/srd-spell-index.json` is an independent
inventory extracted from the PDF's spell headings and class lines; each entry includes its page.
All 339 names, levels, schools and class lists match. Casting times, ranges, components and durations
were also compared with the PDF (allowing typography, line-break hyphenation and the conversion's
added comma in Protection from Evil and Good's duration).

Descriptions come from [downfallx/dnd-5e-srd-markdown](https://github.com/downfallx/dnd-5e-srd-markdown),
commit [`1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4`](https://github.com/downfallx/dnd-5e-srd-markdown/blob/1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4/spells.md).
The importer recognises spell headings by their level/school/class line, so embedded creature
headings are preserved inside their spell, not mistaken for new spells. It accepts both
`Component` and `Components`. It separates the higher-slot paragraph into `hl` without losing
the stat block that sometimes follows it. Cantrip upgrades remain in `text`.

To regenerate after changing the reviewed combat mapping:

```sh
git clone https://github.com/downfallx/dnd-5e-srd-markdown.git /tmp/dread-srd-source
git -C /tmp/dread-srd-source checkout 1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4
node scripts/import-srd-spells.mjs /tmp/dread-srd-source/spells.md
npm test
npm run build
```

The generated file records the source SHA-256. Builds and tests use committed data and need no
source download. Do not commit the generated `dread-delve.html`.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the
Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative
Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Changes to that material: structured fields, combat mappings, a separate higher-slot field,
and explicitly labelled Flood Edition restoration notes. Markdown and embedded HTML tables from
the conversion remain in `text`; these are data, not trusted HTML for direct insertion into the DOM.

## Combat behaviour and follow-up work

`c` contains class letters; `cs` means cantrip dice scaling. `r` is feet: self is 0, touch is 5,
and miles are converted to feet. Sight, Special and Unlimited use the JSON-safe
`Number.MAX_SAFE_INTEGER` to avoid imposing a made-up distance cap; their textual restrictions
still need a DM ruling. Divine Smite retains its existing 5-foot target range for the damage rider,
while its rules `range` is Self. Scorching Ray stores 2d6 per ray; `hero.js` already rolls three rays.

Reviewed single attacks, immediate saves, ordinary healing and supported areas retain combat
fields. Other spells use `k:'util'`, without `d`: the engine treats **util + damage dice as a smite**.
This avoids, for example, frightening a target with Bane, making every Command knock someone prone,
combining Ice Storm's two damage types into Cold, or resolving Meteor Swarm as a single fire hit.
Conditional dice, mixed damage, choosing damage types, multi-stage conditions, persistent zones,
and fixed healing without an ability modifier require manual resolution. Spell attacks with riders
still require the DM to apply those riders; the existing attack UI does not show their `note`.

The engine and UI were not changed. The new `text`, `hl`, `conc` and `ritual` fields supply rules
data; they do not add automatic upcasting, concentration tracking or ritual casting. A rules reader
in the creator/cast card remains UI work. Existing manual spell cards already show `note`, so the
new Flood spells include their full instructions there. Levels 6–9 are in the data, but the current
character creator still stops at level 10; raising it is task 2 in `rules-data.md`.

## Supplemental and Flood material

The owner's instruction for this task overrides the brief's SRD-only content restriction.
`extra-spells.js` retains Armor of Agathys, Thorn Whip, Toll the Dead and Word of Radiance, with
original concise summaries. They are excluded from the verified SRD count. The other physical
supplements, including Tasha's and the collection described as “kaju”, were not available to read;
this PR does **not** claim complete coverage of them or reproduce unverified book descriptions.
Adding that coverage needs accessible source text and an exact title/edition list.

`flood-spells.js` adds one original spell at each level 0–9: Spore Needle, Quarantine Seal,
Cyst Rupture, Synapse Sever, Carrier's Lure, Recall the Lost, Starfire Quarantine, Silence the
Chorus, Biomass Prison and Sever the Gravemind. They address parasitic infection, collective
awareness and containment, not a biblical flood. They carry `homebrew:true` and
`src:'Flood Edition homebrew'`. Their rules are unofficial and need table playtesting.

## Validation

`tests/spells.test.js` checks the independent official inventory, per-level counts, names, metadata,
class letters, duplicates, JSON round trips, retained embedded creatures/tables, higher-slot rules,
actual targeting of every automated area, unsupported-effect regressions, existing hero conversion,
and Flood spell selection/casting data. Existing hero and targeting tests remain unchanged.

## After the merge (Claude)

- **Table play** (`src/data/spell-play.js`, applied in `src/data/srd.js`): about 25 spells that the import left as `util` got their combat fields back on top of the faithful data, so they roll at the table again. These include Magic Missile, Spirit Guardians, Hold Person, Moonbeam, Sleep, Toll the Dead and Flame Strike. `srd-spells.js` stays exactly as generated, so re-running the importer never loses them. `tests/spells.test.js` checks both layers. **If you regenerate `srd-spells.js`, don't touch `spell-play.js`; if a spell's name changes, the test will say so.**
- **Upcasting and Concentration are now in the engine** (`src/engine/spellcast.js`, `src/game/rules.js`), driven by the `hl` and `conc` fields from this PR. So the `hl` line matters: keep the SRD wording "increases by XdY for each spell slot level above N"; the parser reads it. A spell whose extra dice aren't in that wording can carry `up:'1d4+1'` (dice per level above).
