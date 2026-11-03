# Argon, round 2: days off, and the people who work for the party

Welcome back. The party can now build a place of their own in Barovia (a camp, a house, a fort, a keep: `src/engine/holdings.js`) and craft their own gear (`src/engine/crafting.js`). Two things are missing:
- what heroes do with the days between adventures
- the people they hire, who can be loyal, or frightened, or one of the Count's eyes

You write the rules underneath; Claude builds the screens and wires them in.

Read `AGENTS.md` first. Its rules all stand:
- The repository is public. Write your own names and text, or use SRD 5.2.1 numbers. The campaign's Curse of Strahd names are welcome (Barovia, Vallaki, the Vistani…), but never copy the book's text.
- Pure modules only: no DOM, no Three.js, and every die comes from the `rng` passed in (`rng()` returns a number from 0 up to 1).
- Never commit `dread-delve.html`.
- `npm test` and `npm run build` must pass.

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other), on `argon/downtime` and `argon/hirelings`. In each PR:
- say what's covered, what you skipped and why
- give the exact functions Claude should call, and when

Your files are the ones named below. Don't edit anything else; if you need a change elsewhere, describe it in the PR.

## What already exists (read, don't change)

- **A hero sheet** (`src/engine/hero.js`):
  - fields: `{ id, name, cls, lvl, sp, bg, ab:{ Str, Dex, Con, Int, Wis, Cha }, coins:{ cp, sp, ep, gp, pp }, inv:[…], tools:[…] }`
  - `heroStats(sheet)` gives the computed scores (`.sc`), skills (`.skills`, bonuses by name) and the proficiency bonus.
- **A holding** (`src/engine/holdings.js`):
  - `stats(holding)` returns `{ defence, ward, beds, storage, workshops:[…], upkeep, income, comfort }`.
  - `holding.hired` is a list of `{ id, name, role, spy? }`, where `spy` is `{ for:courtMemberId }` when the person is secretly one of the Count's eyes.
- **A person of the valley** (`src/engine/folk.js`): `{ id, role, name, mood:'afraid'|'wary'|'easy', spy?:{ for } }`. Roles include farmer, smith, child, elder, watch, priest, beggar, traveller, peddler, pilgrim, hermit and captive.
- **The Count's court** (`src/engine/nemesis.js`): `court.members` is a list of `{ id, name, epithet, rank, power, alive, grudge?, hunting? }`.
- **Coins:** `src/engine/coins.js` has `spendCoins(coins, gp)` and `addCoins(coins, gp)`. Use them; don't write your own.

---

## Task 1: days off (`argon/downtime`)

**Do:** write `src/engine/downtime.js`, `src/data/downtime.js` and `tests/downtime.test.js`.

1. **Activities** (`src/data/downtime.js`), each with `{ id, n, days (minimum), cost (gp per day), needs:{ place?:'town'|'holding'|'any', workshop?, skill?, tool? }, flavour }`:
   - **Recuperate:** rest somewhere safe.
     - Three days end one level of exhaustion.
     - Five days give advantage on a save against a lingering disease or poison (SRD 5.2 recuperating, in your own words).
     - A holding's comfort makes it a day quicker per 3 comfort, to a minimum of 1 day.
   - **Work:** earn a living with a skill or tool (Performance, Athletics, a set of artisan's tools).
     - The check total sets the pay per day: poor, modest or comfortable.
     - Keep the numbers small and honest.
   - **Train:** learn a tool proficiency or a language.
     - It takes a number of days and gp, with a teacher: a folk role who can teach it (a smith teaches smith's tools; a priest teaches a language).
     - It adds the name to the sheet's `tools` (or `languages`).
   - **Research:** days in a library (the holding's `library` workshop, or a town).
     - An Intelligence check against a DC learns one of a few true or false things about a topic the DM names.
     - Return the result's quality (`nothing`, `a rumour`, `a true thing`, `a true thing and a lead`). The DM writes the actual words, so no lore text in the data.
   - **Carouse:** spend coin in a tavern; make a contact (a folk person whose mood moves to `easy`) or a mess (a fine, a fight, a debt).
     - Higher Gaze makes messes likelier: the valley is afraid of strangers.
   - **Keep watch:** a hero at the holding.
     - Adds to its defence while they're there.
     - Raises the chance of spotting the Count's eyes among the hired hands (see Task 2: return the bonus; don't call into Task 2).
   - **Craft:** hand back how many hours a crafting job gets (8 a day). `src/engine/crafting.js`'s `work()` does the rest. Don't reimplement it.
2. **`plan(activity, { hero, days, place:{ kind, workshops, folk }, holding?, gaze })` → `{ ok, why, days, cost, check:{ ability, skill?, tool?, dc }? }`**
   - Check the needs (the right place, workshop, teacher, tool) and refuse with a plain reason.
3. **`resolve(plan, { roll? }, rng) → { effects, lines }`**
   - `roll` is an optional `{ raw, total }` for real dice from a phone; without it, roll with `rng`.
   - `effects` is plain data Claude applies to the game. Use these keys:
     - `{ exhaustion:-1 }`, `{ gp:+n }`, `{ addTool:'Smith\'s Tools' }`, `{ addLanguage:'…' }`
     - `{ research:'a true thing' }`, `{ mood:{ id, to:'easy' } }`, `{ fine:n }`, `{ defence:+n }`, `{ watchBonus:+n }`, `{ hours:n }`
   - `lines` are one or two short, plain sentences for the DM's card.
4. **`daysCost(plan)`** → the gp the days cost (lodging, unless at the party's own holding with beds for them: then nothing).

**Tests:**
- every activity's numbers are sane
- the needs are refused with a reason (no teacher, no library, wrong place)
- recuperating ends exhaustion in three days, and comfort shortens it
- pay follows the check's total
- training adds the tool, and only after the full days and gp
- research's quality follows the margin over the DC
- carousing's messes get likelier with Gaze
- everything is deterministic for a seeded `rng`

---

## Task 2: hired hands (`argon/hirelings`)

**Do:** write `src/engine/hirelings.js`, `src/data/hirelings.js` and `tests/hirelings.test.js`.

1. **Hiring** (`hire(person, { wage?, holding? }, rng)` → the hireling):
   - The hireling is `{ id, name, role, wage (gp a day), loyalty (0 to 20), skill:'labour'|'guard'|'craft'|'cook'|'scout', spy? }`.
   - Starting loyalty follows the person's mood (afraid → low, easy → high) and the wage offered against the role's usual rate (`src/data/hirelings.js`).
   - A spy hides it: a spy's loyalty shows as the same as anyone's.
2. **A day's pay** (`payDay(hirelings, { gold }) → { paid:[ids], unpaid:[ids], spent }`):
   - The wage comes from what's in the stores.
   - The unpaid lose loyalty.
3. **Morale** (`moraleCheck(hireling, { cause:'raid'|'unpaid'|'horror'|'death of a friend', ward, gaze }, rng) → { stays, loyalty, line }`):
   - Use a d20 plus a loyalty modifier against a DC that rises with Gaze and falls with the holding's ward.
   - A failure means they leave (`stays:false`), or run during a raid.
   - Write it in your own words; SRD 5.2 has no morale rule, so make it small and clear.
4. **The Count's eyes** (`watchForEyes(hirelings, { watchBonus, days }, rng) → [{ id, member, how }]`):
   - Each day there's a small chance a spy gives themselves away ("seen at the treeline at dusk", "a letter in a hand they shouldn't know"), better with a hero keeping watch (Task 1's `watchBonus`).
   - Return who was found and for whom.
   - Write a handful of original tells in `src/data/hirelings.js`.
5. **Loyalty that grows** (`week(hirelings, { comfort, paidInFull, raidsWon })`):
   - A good week (paid in full, comfort, a raid beaten off together) raises loyalty.
   - At 18 or more a hireling becomes **devoted** (`devoted:true`): they fight in a raid as a defender, and are never made a spy later.
6. **Defenders** (`defenders(hirelings)` → a number):
   - Guards count fully, everyone else half; the devoted count double.
   - Claude passes it to `resolveRaid`'s `defenders`.

**Tests:**
- hiring follows mood and wage
- unpaid wages cost loyalty
- morale fails more as Gaze rises and less behind a ward
- a spy is found more often with a watch kept, and never a non-spy
- devoted hirelings count double and stay devoted
- `defenders` adds up
- everything is deterministic for a seeded `rng`

---

**Hooks to describe in your PRs** (Claude does them):
- where in the holdings panel each activity and hireling action belongs
- which functions to call when a day passes (`courtDay` in `src/game/court.js` already runs a list of day hooks, `dayHooks`), and when a raid comes (`meetRaid` in `src/game/holdings.js`)
