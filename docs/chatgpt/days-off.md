# Prompt for ChatGPT: days off (downtime)

Copy everything below the line into ChatGPT. Paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the app.

---

You're writing one small, self-contained JavaScript module for **Dread Delve**. It's a 3D virtual tabletop for a Curse of Strahd campaign (D&D 5e, the 2024 rules / SRD 5.2.1). You can't see the repository, so everything you need is here. Write exactly three files and nothing else:

1. `src/engine/downtime.js`: the rules
2. `src/data/downtime.js`: the activities (data)
3. `tests/downtime.test.js`: tests

## Hard rules

- **Modern ES modules** (`import` / `export`), Node 22. No dependencies, no DOM, no browser APIs, no `Math.random`.
- **Every random number comes from an `rng` argument:** a function returning a number from 0 up to 1. A d20 is `1 + Math.floor(rng() * 20)`.
- **Only these imports are allowed** (they exist; their code is below):
  - `import { spendCoins, addCoins } from './coins.js';` (in the engine file)
  - `import { mulberry32 } from '../src/util/core.js';` (in the test, for a seeded rng)
- **Text:**
  - Write your own text: short and plain, British spelling.
  - SRD 5.2.1 rules numbers are fine. Never copy text from a published book.
  - Barovian names (Barovia, Vallaki, the Vistani) are welcome.
- **Tests** use `node:test` and `node:assert/strict`, run by `node --test tests/*.test.js`.

## What exists (inputs you receive; don't write these)

**A hero** (the caller has already worked out the numbers):

```js
{
  id: 'ilse', name: 'Ilse',
  sc: { Str: 16, Dex: 12, Con: 14, Int: 10, Wis: 12, Cha: 8 },   // ability scores
  skills: { Athletics: 5, Performance: -1, Persuasion: 1, History: 0 },  // skill bonuses by name
  pb: 2,                                                          // proficiency bonus
  tools: ["Smith's Tools"],                                      // tool proficiencies
  languages: ['Common'],
  exhaustion: 0,
  coins: { cp: 0, sp: 0, ep: 0, gp: 30, pp: 0 }
}
```

**A place:**

```js
{
  kind: 'village' | 'town' | 'holding' | 'road',
  workshops: ['forge', 'carpenter', 'alchemist', 'library'],   // any of these
  folk: [ { id: 'f1', role: 'smith', name: 'Tavrek', mood: 'afraid' | 'wary' | 'easy' } ]
}
```

Folk roles: farmer, smith, child, elder, watch, priest, beggar, traveller, peddler, pilgrim, hermit.

**The party's holding** (optional; present when they're at their own camp or house). Its stats are already worked out:

```js
{ beds: 6, comfort: 4, defence: 5, ward: 2, workshops: ['forge'] }
```

**`gaze`:** the Count's attention, a whole number from 1 to 10.

**`./coins.js`** (exists; import it, don't rewrite it):

```js
/* Pay gp from a purse: the small coins first, then one bigger coin broken, the change given
   back in gold, silver and copper. → coins | null */
const COIN = [['cp', 1], ['sp', 10], ['ep', 50], ['gp', 100], ['pp', 1000]];
export function spendCoins(coins, gp){ /* … */ }        // → new coins object, or null if not enough
export function addCoins(coins, gp){ /* … */ }          // → new coins object with gp added (as gp/sp/cp)
```

## What to write

### `src/data/downtime.js`

`export const ACTIVITIES = [...]`, each entry shaped `{ id, n, days (minimum), cost (gp per day, before lodging), needs:{ place?, workshop?, skill?, tool?, teacher? }, flavour }`. The activities:

- **`recuperate`** (Recuperate)
  - Rest somewhere safe: not `'road'`.
  - Three days end one level of exhaustion.
  - Five days give advantage on the next save against a lingering disease or poison.
  - At a holding, each 3 comfort makes it one day quicker, to a minimum of 1 day.
- **`work`** (Work for pay)
  - Earn a living with a skill (Athletics, Performance, Persuasion…) or a tool the hero is proficient with.
  - A check sets the pay per day:
    - total 9 or less: 1 sp a day ("poor")
    - 10–14: 1 gp a day ("modest")
    - 15–20: 2 gp a day ("comfortable")
    - 21 or more: 4 gp a day ("wealthy")
  - Only in a village or town.
- **`train`** (Train)
  - Learn one tool proficiency or one language: 10 days, 1 gp a day.
  - Needs a teacher among the folk:
    - a smith teaches Smith's Tools
    - a farmer teaches Carpenter's Tools
    - a priest, elder or pilgrim teaches a language
    - a hermit teaches the Herbalism Kit
  - Not on the road.
- **`research`** (Research)
  - Days in a library: the holding's `library` workshop, or a town.
  - An Intelligence check (with History as a bonus if the hero has it), DC 15. The quality of what's learned:
    - fail by 5 or more: `'nothing'`
    - fail: `'a rumour'` (may be false)
    - succeed: `'a true thing'`
    - succeed by 5 or more: `'a true thing and a lead'`
  - **No lore text in the data:** the DM writes the actual words.
- **`carouse`** (Carouse)
  - A village or town tavern: 2 gp a day.
  - A Charisma (Persuasion) check, DC 12.
    - Success: a contact. The caller gets the id of one folk person to move to `'easy'` (pick one who isn't already easy, if any).
    - Failure, or a natural 1: a mess, one of a fine (1d6 gp), a fight (the DM decides) or a debt (1d10 gp).
  - The chance of a mess goes up by 5% per point of gaze over 2 even on a success: the valley is afraid of strangers.
- **`watch`** (Keep watch)
  - Only at the holding.
  - While they're there: +1 to the holding's defence per hero keeping watch.
  - A `watchBonus` (+2 per day kept, up to +10) that another module uses to spot spies among the hired hands. Just return the number.
- **`craft`** (Craft)
  - Hands back how many hours of crafting the days give: 8 a day.
  - Another module does the crafting; don't reimplement it.

### `src/engine/downtime.js`

Export these:

- **`plan(activityId, { hero, days, place, holding, gaze })`** → `{ ok:true, activity, days, cost, check }` or `{ ok:false, why }`.
  - `check` is `{ ability, skill?, tool?, dc, bonus }`: the bonus the roll will add. Use `skills[skill]` if present, else the ability modifier `Math.floor((score - 10) / 2)`, plus `pb` for a tool the hero is proficient with.
  - For `train`, `plan` takes `{ learn: "Smith's Tools" | 'Elvish' }` as well.
  - Refuse with one plain sentence:
    - "Recuperating needs somewhere safe, not the open road."
    - "Nobody here can teach Smith's Tools."
    - "Research needs a library, or a town."
    - not enough days for the minimum
- **`daysCost(plan, { holding })`** → gp.
  - The activity's cost per day, plus lodging: 5 sp a day in a village, 1 gp in a town, nothing at a holding with beds (`holding.beds > 0`).
  - If the hero can't afford it, `plan` says so (use `spendCoins`, which returns null when it can't pay).
- **`resolve(plan, { roll }, rng)`** → `{ effects, lines }`.
  - `roll` is optional: `{ raw, total }` from real dice. Without it, roll a d20 with `rng` and add `check.bonus`.
  - `effects` is a plain object using only these keys:
    - `exhaustion` (−1), `saveAdvantage` (`'disease or poison'`)
    - `gp` (+earned, or −fine/−debt), `coins` (the hero's coins after paying: use `spendCoins`/`addCoins`)
    - `addTool`, `addLanguage`, `research` (the quality string)
    - `mood: { id, to: 'easy' }`, `mess: 'a fine' | 'a fight' | 'a debt'`
    - `defence`, `watchBonus`, `hours`
  - `lines` are one or two short sentences for the DM's card, e.g. "Ilse works the forge for 5 days: modest pay, 5 gp."
- **`describe(activityId)`** → `{ n, flavour, days, cost }` for the UI.

## Tests (`tests/downtime.test.js`)

- every activity has sane numbers and an id, a name and flavour
- recuperating ends exhaustion in 3 days; a holding with comfort 6 makes it 1 day
- recuperating on the road is refused
- training needs the right teacher, adds the tool only after the full 10 days, and costs 10 gp plus lodging
- work pay follows the total (test with fixed `roll` values: 8, 12, 17, 22)
- research quality follows the margin over DC 15
- carousing's messes are likelier at gaze 9 than gaze 1 (run 500 seeded trials each)
- lodging is free at a holding with beds
- the same seed gives the same result

Reply with the three files, each complete, in its own code block headed by its path.
