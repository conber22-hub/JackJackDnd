# ChatGPT prompt: ✦ every spell in our own words

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/rites` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're helping **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign, grow out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. You already wrote its twelve **Callings** (`src/data/callings.js`) and its Origins, backgrounds and feats (`src/data/origins.js`). The last big piece of D&D left in a hero is **the spells**: a Seepbound still casts *Eldritch Blast*, an Archivist *Magic Missile*. Their rules stay exactly as they are (the d20 core stays). You're giving every spell **our own name and a line in our voice**, in the voice of the Calling that casts it.

**Read `docs/homebrew/callings.md` first**, then `src/data/srd-spells.js` (`SRD_SPELLS`: 339 spells; each has `n` its name, `l` its level, `c` the letters of the classes that cast it: `W` wizard, `S` sorcerer, `B` bard, `C` cleric, `D` druid, `P` paladin, `R` ranger, `K` warlock, `school`, `text`), and `src/data/callings.js` (which Calling stands on which class).

Write exactly three files and nothing else:

1. `src/data/rites.js`: the names and lines (data)
2. `src/engine/rites.js`: reading them
3. `tests/rites.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the data imports nothing; the engine imports `../data/rites.js` and `../data/srd-spells.js`. The test imports the engine, the data and `../src/data/srd-spells.js`.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original.** Nothing that belongs to the Halo games (none of its factions, species, characters, ships, vehicles, named weapons, places or catchphrases). History is everyone's. Gothic first. Respectful: this is a memorial.

## What to write

### `src/data/rites.js`

`TRADITIONS`: how each Calling that casts names its magic, one per caster Calling:
- `archivist` *Protocols* (the Ghostlight's: precise, archival, a little uncanny: *"Protocol of the Burning Index"*)
- `chaplain` *Rites* (field liturgy and battlefield medicine: *"The Rite of Closing Wounds"*)
- `seepbound` *Gifts* (of the Chorus: intimate, wet, generous in a way that frightens: *"The Chorus Gives Its Breath"*)
- `relicborn` *Shardworks* (the First Builders' engines answering the blood: *"Lattice Spear"*)
- `herald` *Cadences* (drum, call and standard: *"The Cadence of Holding Fast"*)
- `mistwalker` *Mistcraft* (fog, root and beast: *"Root-Grasp"*)
- `warden` *Vows* (oaths spoken aloud: *"The Vow Against the Dark"*)
- `marksman` *Fieldcraft* (the scout's and the archer's: *"Ghost the Trail"*)
Each: `{ id, calling, word:'Protocol', plural:'Protocols', voice:'a sentence on how they sound' }`.

`RITES`: for **every spell in `SRD_SPELLS`**, keyed by its exact `n`:
```js
'Magic Missile': { by:{ archivist:{ n:'Protocol of Three Sparks', line:'under 90 characters, what it looks and feels like here' }, relicborn:{ n:'…', line:'…' } } }
```
A name for each caster Calling whose class can cast it (from the spell's `c` letters: W archivist, S relicborn, K seepbound, C chaplain, B herald, D mistwalker, P warden, R marksman). Names under 40 characters, never the D&D name or a word-for-word swap of it (*Magic Missile* is not *Arcane Missile*), and no two spells sharing a name within a tradition. The line is flavour only: never different rules.

### `src/engine/rites.js`

Export:
- `riteName(spellName, callingId)` → our name for that spell as that Calling casts it, or the spell's own name if there's none (a Classic hero, or a spell from a DM's book)
- `riteLine(spellName, callingId)` → its line, or `''`
- `tradition(callingId)` → the tradition, or `null`
- `ritesFor(callingId)` → every spell that Calling can cast, `[{ spell, n, line, l }]`, by level then name
- `validateRites()` → `[]` when all's well

### `tests/rites.test.js`

Prove:
- every spell in `SRD_SPELLS` has an entry, and each has a name for exactly the caster Callings its `c` letters give
- names are under 40 characters, lines under 90, no name equals or contains its spell's D&D name, no two spells share a name within a tradition
- eight traditions, each tied to a real Calling id
- none of these words appears anywhere (case-insensitive, whole words): Master Chief, Covenant, Cortana, Spartan, Sangheili, Unggoy, Jiralhanae, Gravemind, Forerunner, UNSC, ODST, Warthog, Pelican, Needler, Halo, Flood, Arbiter, Guilty Spark, Mjolnir
- `riteName` falls back to the spell's own name for an unknown spell or Calling, and nothing throws on `null`, `{}` or `undefined`

## What Claude will do with it

The hero creator, the sheet, the spell lists, the cast menus, the cards and the captions will show a Calling's hero their spells by our names and lines (the rules underneath untouched, the D&D names under the Classic switch). Make a Seepbound's player feel the Chorus give, not a wizard cast.
