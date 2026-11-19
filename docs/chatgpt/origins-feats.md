# ChatGPT prompt: 🧭 Origins, backgrounds and feats

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/origins-feats` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're helping **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign, grow out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. **Read `docs/homebrew/callings.md` first**: the premise is that the Mists pull warriors from every age into gothic Barovia (Halo-like far-future soldiers, history's hoplites, huscarls and longbowmen, and Barovia's own). The classes become our own **Callings** (your other prompt, `docs/chatgpt/callings.md`). This prompt replaces the rest of what a hero is built from: **species → Origins, backgrounds, feats.**

Then read `src/data/srd.js` (`SPECIES`, `BACKGROUNDS`, `FEATS`) and `src/data/srd-feats.js` (the flags the hero engine reads on a feat: `origin`, `skills`, `alert`, `savage`, `hp`, `ab`…). Ours sit on top of those the same way a Calling sits on a D&D class: each names the D&D one whose mechanics it reuses (`like`), so the hero engine keeps working, and gives it our own name and words.

Write exactly three files and nothing else:

1. `src/data/origins.js`: Origins, backgrounds and feats (data)
2. `src/engine/origins.js`: reading them
3. `tests/origins.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the data imports nothing; the engine imports `../data/origins.js`, `../data/srd.js` and `../data/srd-feats.js`. The test imports the engine and the data, and `../src/data/srd.js`.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original.** Nothing that belongs to the Halo games (none of its factions, species, characters, ships, vehicles, named weapons, places or catchphrases); history is everyone's. Gothic first. Respectful: this is a memorial.

## What to write

### `src/data/origins.js`

`ORIGINS`: at least **nine**, in three groups:
- **The Drawn** (pulled in by the Mists from another age): `drawn-ancient` (bronze, the phalanx, the old gods), `drawn-medieval` (steel, the oath, plague and crusade), `drawn-future` (a war not yet fought: armour, a failing suit, relic gear)
- **Born in Barovia**: a villager, the Vistani-raised, the old blood (the Count's line, at a distance)
- **Stranger kin**: at least three of the valley's other peoples (elf-like, dwarf-like, small-folk-like, or your own), under our own names

Each: `{ id, name, group:'drawn' | 'barovian' | 'kin', like:'<a SPECIES key>', blurb (under 220), traits:[{ n, text }] (our words for what `like` gives, adjusted to fit: a far-future Drawn's "darkvision" is a helmet's failing night-sight), opts? (a choice, as a SPECIES has: `{ 'Label':['…'] }`), look (a line for the art, under 200) }`.

`BACKS` (backgrounds): at least **ten**, what you did before the Mists, across the ages: soldier, field medic, archivist, smuggler, scout, smith, priest, sailor, gravedigger, outlaw… Each: `{ id, name, like:'<a BACKGROUNDS key>', ab:['Str'|…, three], skills:[two real skills], feat:'<one of our feat ids>', blurb, gear:'a line of what they carry' }`.

`FEATS`: at least **twenty-four**, ours, built around a soldier's life and the valley: *Hold the Line*, *No One Left Behind*, *Steady Hands*, *Second Breath*, *Old Habits*, *Relic Tinker*, *Seep-Scarred*, … Each: `{ id, name, cat:'origin' | 'general' | 'epic', req:'…', like:'<an SRD_FEATS key, when it reuses one>' | null, text (under 500), mech:{ … } }`, where `mech` uses the same vocabulary as the Callings (`docs/chatgpt/callings.md`, "mech"). At least eight origin feats (one for each background to give), at least four that only Seep-touched heroes can take (`req` says so, and they cost something).

### `src/engine/origins.js`

Export:
- `originList()`, `backList()`, `featList({ cat })`: for pickers
- `originView(id)`, `backView(id)`, `featView(id)`: our name, words and traits, or `null`
- `asClassic(hero)`: what the hero engine needs to keep working: `{ sp, spOpt, bg, feats }` in D&D keys (from each one's `like`), so a hero built from Origins still gets the right speed, size, skills and feat flags
- `validateOrigins()`: `[]` when all's well

### `tests/origins.test.js`

Prove:
- counts at least as above; ids and names unique; every `like` a real key (`SPECIES`, `BACKGROUNDS`, `SRD_FEATS`); every background's feat one of ours and an origin feat; every skill real
- texts under their limits; no name is a D&D species, background or feat name
- none of these words appears anywhere (case-insensitive, whole words): Master Chief, Covenant, Cortana, Spartan, Sangheili, Unggoy, Jiralhanae, Gravemind, Forerunner, UNSC, ODST, Warthog, Pelican, Needler, Halo, Flood, Arbiter, Guilty Spark, Mjolnir
- `asClassic` maps a Drawn-future soldier to keys the hero engine knows; nothing throws on `null`, `{}` or an unknown id

## What Claude will do with it

The hero creator will offer Origins, backgrounds and feats in place of the D&D ones, the sheet will show our names and words, and `asClassic` will keep every rule that already works working. Make a player's first choice ("where, and *when*, are you from?") feel like the start of a story.
