# Classes to level 20 (task 2)

All 12 SRD 5.2.1 classes and their 12 SRD subclasses now progress through level 20.
`MAX_LEVEL`, proficiency, preparation and cantrip arrays, full/half/pact slots, class
features and level-19 Epic Boon choices are extended. Fighter also gets its level-14
feat choice. Non-casters still omit spell arrays; they do not gain spellcasting.

`FEATURES`, re-exported from `srd.js`, maps every name in `CLASSES.*.features` to SRD
text. `srd-features.js` contains 220 class/subclass feature descriptions (232 source
headings minus 12 subclass-choice headings), exposed through 183 lookup keys. Shared
names such as Spellcasting, Unarmored Defense and Epic Boon contain labelled class
variants. Improved Brutal Strike retains both its level-13 and level-17 descriptions;
the level labels matter when showing these to a lower-level character. Table labels
such as “Indomitable (three uses)” alias the complete feature description. The
subclass's name remains in `CLASSES.*.sub`.

## Sources and regeneration

The source of truth is the [official SRD 5.2.1 PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf),
classes on printed pages 28–82. Progression data is checked against an independent
PDF extraction, `tests/fixtures/srd-class-tables.json`: 12 tables, 20 levels each.
This includes Wizard's distinct high-level preparation counts and the 2024
half-caster slots starting at level 1.

Feature descriptions come from `classes.md` in
[downfallx/dnd-5e-srd-markdown](https://github.com/downfallx/dnd-5e-srd-markdown/blob/1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4/classes.md),
commit `1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4`, the same conversion used for task 1.
The generated file records the SHA-256 of its source. Descriptions preserve Markdown
and embedded HTML tables as data; a future reader must render them safely.

```sh
git clone https://github.com/downfallx/dnd-5e-srd-markdown.git /tmp/dread-srd-source
git -C /tmp/dread-srd-source checkout 1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4
node scripts/import-srd-features.mjs /tmp/dread-srd-source/classes.md
pdftotext -layout /tmp/SRD_CC_v5.2.1.pdf /tmp/srd.txt
python scripts/extract-srd-class-tables.py /tmp/srd.txt
npm test
npm run build
```

Download the linked official PDF to `/tmp/SRD_CC_v5.2.1.pdf` before extracting the
test inventory. Builds and tests use committed data and need neither download nor
Python. Do not commit the generated `dread-delve.html`.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”)
by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1
is licensed under the Creative Commons Attribution 4.0 International License,
available at https://creativecommons.org/licenses/by/4.0/legalcode.
Changes: structured progression data, feature-name aliases, labelled variants,
table extraction and original implementation notes.

## What the pure engine applies

- Proficiency through +6, spell slots through level 9, pact slots up to four at
  level 5, preparation/cantrip limits, all later feat choices, and class features.
- Rage uses/damage, Inspiration die, Channel Divinity uses/Divine Spark dice,
  Wild Shape uses/duration, Fighter resources, Favored Enemy uses, Focus/Sorcery
  Points, Lay on Hands and Hit Dice. Existing resource IDs and action handlers stay.
- Monk speed and unarmed dice, level-17 cantrip dice and four Eldritch Blast beams.
  This also corrects the existing Monk level-10 speed bonus from +15 to +20 feet.
- Primal Champion and Body and Mind (+4 to the relevant abilities, maximum 25),
  including derived HP, AC, saves and attacks. Disciplined Survivor and Slippery
  Mind grant their saving throw proficiencies.
- Devotion's level-13/17 always-prepared spells, and Bard's level-20 Power Words.
- Mystic Arcanum: store one Warlock spell of each unlocked level in the existing
  `h.spells` array. `arcanumLevels(h)` returns eligible levels. `maxSpellLevel(h)`
  remains the maximum **slot** level (5 for Warlocks); `spellPool(h)` additionally
  offers Arcanum spells. The prepared limit excludes these choices. Each gets its
  own `arcanum6`…`arcanum9` resource with `free:<spell name>`, one use per long rest,
  and **no `slot` field**, so it cannot pay for another spell or upcast. Missing,
  duplicate and ineligible Arcanum choices produce warnings.

No new persisted sheet/token fields are required. No spell combat field is removed
or changed; `srd-spells.js` and `spell-play.js` are untouched. The tests retain the
original low-level hero cases and exercise level-20 Wizard, Paladin, Warlock and
Fighter sheets, plus all class progression rows and scaling boundaries.

## Follow-up for Claude (UI and game code are outside this PR)

The level selector already reads `MAX_LEVEL`, but `src/ui/creator.js` renders spell
groups from `[0, 1, 2, 3, 4, 5]`. Extend those groups through 9. Give Warlocks a
separate one-per-level Arcanum selection/count using `arcanumLevels`, and exclude
those spells from the UI's ordinary prepared count, matching `heroWarnings`.
The current import/export path can already carry those choices in `h.spells`.

Add a safe feature-text reader using `FEATURES`; currently the sheet displays only
names. Label level 19 as Epic Boon or another qualifying feat. The existing `Other`
choice can record a boon name/note, but the full boon catalogue, prerequisites and
effects belong to task 3. In particular, its current +1 ability input still caps
at 20 and does not model a boon's higher cap. Multiple invocations, additional
fighting styles, scaled mastery choices, Spell Mastery and Signature Spells need
dedicated choice controls rather than guessed selections.

Two existing recovery handlers need attention with the higher level cap:

- `src/game/resources.js:recoverSlots` currently allows any slot within the Arcane
  Recovery budget. At Wizard 11+, restrict recovered slots to levels 1–5 (the SRD
  restriction is included in the resource text). Keep the full half-level budget;
  lowering it would incorrectly remove recovery of multiple lower-level slots.
- The same handler always restores half the pact slots for Magical Cunning. At
  Warlock 20, Eldritch Master requires all four. The existing `recover`/`pact`
  automation is retained; the text describes the upgrade, but the handler still
  needs to apply it. Until then, adjust these resources manually.

Other high-level features are available as names and full rules text, with manual
resolution wherever the current engine has no mechanic. These include:

| Class | Remaining high-level automation |
| --- | --- |
| Barbarian | Relentless/Persistent Rage, Brutal Strike choices, Indomitable Might and Intimidating Presence; the game's Rage duration is still its existing duration. |
| Bard | Peerless Skill, Superior Inspiration and the second Power Word target. |
| Cleric | Improved Blessed Strikes, Supreme Healing and Greater Divine Intervention. |
| Druid | Nature's Sanctuary, Improved Elemental Fury, Beast Spells and Archdruid. |
| Fighter | Attack-action counts, Studied Attacks, Superior Critical and Survivor. |
| Monk | Fleet Step, Deflect Energy, save rerolls, initiative Focus recovery, Quivering Palm and Superior Defense. |
| Paladin | Radiant Strikes' separate Radiant die, Restoring Touch, Smite of Protection, aura expansion and Holy Nimbus. |
| Ranger | Hunter riders/reactions, Relentless/Precise Hunter, Nature's Veil, Feral Senses and Foe Slayer's Hunter's Mark die. |
| Rogue | Cunning/Devious Strike choices, Use Magic Device, Thief's Reflexes, Elusive and Stroke of Luck. |
| Sorcerer | Extra Metamagic selections, Dragon Wings/Companion and Arcane Apotheosis. |
| Warlock | Additional invocation selections, Hurl Through Hell and the Eldritch Master recovery change above. |
| Wizard | Overchannel, at-will Spell Mastery and Signature Spells' free castings. |

These are not new claims of automatic combat support. Existing simplified
low-level subclass spell selections and feature automation are otherwise retained;
this task does not silently replace their working combat fields with manual spells.
