# Codex, round 11: the rot, and the balance of the Callings

Round 10 is in: fear has marks, and a mob fights as one. Thank you.

Dread Delve is growing out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history (`docs/homebrew/callings.md`). The heroes are now twelve **Callings**: soldiers of every age pulled into Barovia by the Mists, and Barovians the Seep has touched. ChatGPT wrote them (`src/data/callings.js`); every feature carries a `mech` that Claude's engine plays (`src/engine/mech.js`, pure; `src/game/mechfx.js`). The third Path of every Calling is **Seep-touched**: strong, and each use takes a price. Two things that needs have no rules underneath them yet:
- **The rot itself.** A Seep-touched feature can leave a **mark of the rot** (`t.seepMarks`, a count, and it already shows on the hero's mini). Nothing happens as the marks pile up. It should: this is what the Seep-touched Paths are *about*.
- **Balance.** Twelve Callings and 36 Paths, written fast. Nobody knows which ones are too strong or too weak in an actual fight.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text, or SRD 5.2.1 numbers, never book text
- **all original, and nothing from the Halo games** (none of its factions, species, characters, ships, vehicles, named weapons, places or catchphrases); history is everyone's; gothic first; respectful, this is a memorial
- pure modules: no DOM, no Three.js, every die from the `rng` passed in, and every state plain JSON
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other). In each, say what's covered, what you skipped and why, and the exact hooks for Claude.

## What's there (read; don't change)

- **The Callings** (`src/data/callings.js`: `CALLINGS`, each with `paths`, `seep:true` on the Seep-touched Path, and features by level with a `mech`; `src/engine/callings.js`: `callingOf`, `pathOf`, `featuresAt`).
- **The feature engine** (`src/engine/mech.js`): `amountOf`, `mechEdge`, `mechResist`, `mechExtraDamage`, `mechWard`, `mechResources`, `seepCosts` (the price of a use: `maxHp`, `hp`, `mark` or words), `mechReaction`, `summonToken`. Its tests in `tests/mech.test.js` show the shapes.
- **How a price is paid in play** (`src/game/mechfx.js`, `payPrice`): `t.seepMarks` grows by the price's count; `t.seepDrain` is hit point maximum lost until a long rest.
- **Fear's marks** (yours, `src/engine/horror.js`): the same idea for terror. The rot's stages should sit beside them, not replace them.
- **Conditions** (yours, `src/engine/conditions.js`), **heroes** (`src/engine/hero.js`: ability scores, saves, proficiency), **the fight engine** (`src/engine/fight.js`, `src/engine/tactics.js`), **the bestiary** (`src/data/bestiary.js`, `src/data/bestiary-barovia.js`: the Seep's creatures have `fam:'seep'`).
- **His Gaze:** `state.dread`, 1–10.

---

## Task 1: the rot (`codex/rot`)

**Do:** write `src/engine/rot.js`, `src/data/rot.js` and `tests/rot.test.js`. Invent the rules.

1. **Stages.** `rotStage(marks)` → `{ stage, n, name, text, mechanics }`, about five stages from *untouched* to *taken*, at mark counts you choose (the first should come after two or three uses of a Seep-touched feature; the last should take a long campaign of using them carelessly).
   - **Mechanics are small and playable,** using conditions and the SRD's advantage and disadvantage, and they cut both ways: the rot gives as well as takes. E.g. "advantage on saves against the Seep's spores", "the Seep's creatures ignore you until you attack", "disadvantage on Charisma checks with anyone who isn't Seeded", "you can't be healed by holy water".
   - **The text** is the line the player reads ("Your sweat smells of wet pages").
2. **What others see.** `rotSigns(marks, { observer })` → the words someone sees: a villager, a priest (who sees more), the Count (who sees everything), the Seep's own creatures (who see kin). Plain strings for Claude's cards.
3. **The Chorus.** `chorusWhisper(marks, { trigger, gaze, rng })` → `null` or `{ text, offer }`: from the middle stages on, at moments (`'rest'`, `'down'`, `'kill'`, `'alone'`), the Chorus speaks to the hero, and sometimes offers something (a reroll, a few hit points, the name of what's hunting them) for one more mark. At least 24 whispers, in a voice that is intimate and generous in a way that frightens. Never gory.
4. **Cures.** `cureRot(marks, { kind, rng })` → `{ marks, text }`. Ways to take marks back off, each with its limit:
   - a night at a holy place that is still clean
   - holy water, which burns
   - a Chaplain's rite (`calling:'chaplain'`: Claude will offer it)
   - a night at **the Dutch Oven** in the Village of Barovia (Dutcher's bakehouse, `src/data/memorial.js`): the warmth there takes one mark, once per visit; the Seep never got Dutcher, and it doesn't like the smell of his bread
   - the finger-bone of Saint Andral (campaign loot)
   - none of them works on the last stage
5. **The last stage.** `taken(hero)` → what happens when a hero is taken: not death. Give the DM a choice of two or three outcomes (e.g. the hero walks into the fog and becomes a recurring figure; the hero stays, and the Chorus plays them one night a week) as data with words for the table.
6. **Tests:**
   - every stage reachable, in order, with valid condition ids or advantage/disadvantage words
   - signs differ by observer, and the Count's say the most
   - whispers only from the middle stages; offers always cost a mark
   - each cure has its limit; nothing cures the last stage
   - deterministic for a seed; JSON state; nothing throws on `null` or `{}`

## Task 2: the balance of the Callings (`codex/callings-balance`)

**Do:** write `src/engine/balance.js`, `tests/balance.test.js` and `scripts/callings-balance.mjs` (which prints a report). Use the real data and the real feature engine; change neither.

1. **A duel simulator.** `simulate({ calling, path, lvl, foe, fights, rng })` → `{ won, rounds, dmgDealt, dmgTaken, hpLeft, featuresUsed }` averaged over `fights` (default 200).
   - The hero: the Calling's chassis class at that level (`src/engine/hero.js` for the numbers; a sensible standard array and starting weapon), its features at that level (`featuresAt`) read through `src/engine/mech.js` (advantage, extra damage, resistance, the Ward, temporary hit points, healing, holdAtOne). Uses per rest are counted; the Seep prices are counted too (`seepCosts`): report marks and drain, don't apply them to the fight.
   - The foe: a bestiary creature of a CR you choose for the level (e.g. level 3 against a CR 2), or two smaller ones.
   - A simple, honest turn: move into reach, best attack, use a feature when it helps. No spells beyond cantrips (spell play is Claude's, `src/game/combat.js`); say so in the report.
2. **The report.** `node scripts/callings-balance.mjs [lvl]` prints, for levels 3, 5 and 10 by default, every Calling and Path: win rate, rounds, damage per round, and the Seep price per fight for the Seep-touched Paths. Flag anything more than one standard deviation from the mean, both ways, and the features that drive it.
3. **Tests:**
   - deterministic for a seed
   - a level 5 hero beats a CR 1/4 foe nearly always, and loses to a CR 8 nearly always
   - every Calling and Path at levels 1–10 simulates without throwing
   - the report has every Calling and Path
4. **In the PR,** paste the level 3, 5 and 10 tables and your reading of them: which Callings or Paths look out of line, and what you'd change in their data (Claude and ChatGPT will make the changes; don't edit `src/data/callings.js`).

Give each a short section in the PR for Claude:
- where the rot should show (the token card, the pocket sheet, a card at a rest, the Chorus at a kill or a fall) and what the DM sees that the player doesn't
- how to read the balance report
