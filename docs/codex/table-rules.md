# Codex: rules for the table (three tasks, round 4)

Your three rules-engine PRs (#11 defences, #12 monster actions, #13 inventory) are merged and wired into the app. These three build on them.
Read `AGENTS.md` first; its rules all stand:
- a public repository: SRD 5.2.1 (CC BY 4.0) and invented names only, never book text
- pure modules: no DOM, no Three.js
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Do them **in this order**, one pull request each, against `claude/dread-delve-v0.2`. Base each on that branch, not on each other. In each PR, say what is covered, what you skipped and why, and the exact hook Claude needs to add.

---

## Task 1: what conditions do (`codex/conditions`)

**Why.** Today only a few conditions change a roll: in `src/game/combat.js` (about lines 202–206), prone, restrained, paralysed, stunned and blinded do; poisoned and frightened affect only the attacker. These are missing:
- Invisible
- Unconscious (advantage, and an automatic crit within 5 feet)
- Petrified
- Incapacitated
- Exhaustion (not tracked at all)
- Saves that fail automatically: paralysed, stunned and unconscious fail Strength and Dexterity saves
- Disadvantage on Dexterity saves while restrained
- The checks blinded and deafened creatures fail

**Do:** write `src/engine/conditions.js` and `tests/conditions.test.js`, following the SRD 5.2.1 Rules Glossary exactly (the 2024 rules).
- A creature is a plain object: `{ conds:[{ n:'prone' }, …], exhaustion:0..6 }`. Condition names are lower case, as `src/game/rules.js` stores them.
- `implied(conds)`: the full set, including what each condition brings with it. Paralysed, stunned, petrified and unconscious mean incapacitated; unconscious also means prone.
- `attackMods({ attacker, target, melee, within5, attackerSeen = true, targetSeen = true, attackerSeesSource = true })`
  - Returns `{ adv:[reasons], dis:[reasons], autoCrit:bool }`.
  - Reasons are short and plain, for the card: `'Ada prone'`, `'the wight unseen'`.
  - Covers invisible and unseen attackers and targets in both directions, frightened only while its source is in sight, and exhaustion.
  - In 2024, exhaustion takes 2 per level off every d20 test: return that as `penalty`, not as disadvantage.
- `saveMods(creature, ability)`: `{ autoFail:bool, adv:[], dis:[], penalty }`.
- `checkMods(creature, { sight = false, hearing = false } = {})`: `{ autoFail, adv, dis, penalty }`.
- `speedOf(creature, base)`: 0 when grappled, restrained or incapacitated-and-down, as the glossary says, and 5 ft less per exhaustion level.
- `canAct(creature)`: `{ actions, bonus, reactions, move, speak }`.
- `damageMods(creature)`: petrified gives resistance to all damage and immunity to poison. Return it in the `{ resist, immune, vuln }` shape of `src/engine/defenses.js`, so the two can be joined.
- `exhaustionDead(creature)`: level 6.

**Tests:** a table of every condition against attack, save, check, speed and actions. Also:
- the implied conditions
- invisible against unseen, both ways
- a crit within 5 feet only, for paralysed and unconscious
- frightened with and without its source in sight
- exhaustion 0–6

**Hook to describe:**
- Replace the condition lines in `doAttack` with `attackMods`.
- The save paths call `saveMods`.
- Movement calls `speedOf`.
- Exhaustion is stored as `t.exhaustion`.

---

## Task 2: how long a condition lasts, and the save that ends it (`codex/condition-timing`)

**Why.** When Hold Person or a ghoul's claws paralyse someone, the app adds the condition with a round count. The rules instead say how it ends:
- "repeats the save at the end of each of its turns"
- "until the end of the caster's next turn"
- "until it takes damage"
- concentration, up to 1 minute

**Do:**
1. Write `scripts/import-spell-conditions.mjs`, `src/data/spell-effects.js` (generated) and `tests/spell-effects.test.js`.
   - For every SRD spell in `src/data/srd-spells.js` whose text gives a condition on a failed save (or with no save), record: `{ cond, save, repeat:'end'|'start'|null, endsOn:['damage', …], dur:{ n, unit:'round'|'minute'|'hour' }, conc:bool }`.
   - Keep the condition's own sentence in `note`.
2. Extend `scripts/import-monster-actions.mjs`: monster actions with a `cond` get the same `repeat`, `endsOn` and `dur` fields. Regenerate `src/data/monster-play.js`.
3. Like #12, every value must be found in the item's own text, and a test proves it.
   - Skip what doesn't fit (a condition with a choice, or one that ends on a condition of its own), and list what you skipped in the PR.
   - `src/data/spell-play.js` is Claude's: don't edit it.

**Hook to describe:**
- When the condition is applied, store `repeat`, `endsOn` and `dur` on it.
- Roll the repeated save at the start or end of the creature's turn.
- End the condition on damage, or when concentration is lost.

---

## Task 3: defences for the Barovian creatures (`codex/barovia-defenses`)

**Why.** #11 covers the 330 SRD creatures. `src/data/bestiary-barovia.js` (52 creatures) and `src/data/bestiary.js` (20) have no defence lines, so a Barovian Wolf, a Night Spawn or a Mist Thing takes full damage from everything.
- About half of the Barovian creatures are SRD creatures under their usual names.
- The rest are the table's own homebrew (Barovian Wolf, Count's Wolf, Scarecrow Watcher, Night Spawn, Mist Thing, Grave Ghoul, Dinner Guest, the Bloom).

**Do:**
1. Add `defensesFor(entry)` to `src/engine/defenses.js`. It returns the first of these that applies:
   - the SRD creature's defences, if the entry links one (`srd:'srd-…'`)
   - `entry.def`
   - `parseDefenses(entry.traits)`
2. In both bestiary files (this task names them, so you may edit them):
   - Add `srd:` to every entry that is an SRD creature: match by name, and check the stats agree.
   - Add `def:` to the homebrew entries, and only where the entry's own traits or kind make the defence plain (an undead with "Undead Nature", a mist creature that is "formless"). Leave the rest empty, and list them in the PR with what you would suggest, so the DM can decide.
3. `tests/barovia-defenses.test.js`:
   - every entry resolves
   - each `srd:` link exists and agrees on name and AC
   - every `def` value is a known damage type or condition

**Hook to describe:** the app calls `defensesFor(BEST[t.bid])` instead of looking up the SRD creature.
