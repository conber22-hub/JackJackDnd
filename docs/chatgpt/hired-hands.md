# Prompt for ChatGPT: hired hands (hirelings)

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from a `chatgpt/<topic>` branch against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the app.

---

You're writing one small, self-contained JavaScript module for **Dread Delve**. It's a 3D virtual tabletop for a Curse of Strahd campaign (D&D 5e, the 2024 rules / SRD 5.2.1). In this campaign the party can build a camp, house or fort of their own in Barovia and hire local folk to work there, and Count Strahd has spies among the valley's people. You can't see the repository, so everything you need is here. Write exactly three files and nothing else:

1. `src/engine/hirelings.js`: the rules
2. `src/data/hirelings.js`: wages, skills and tells (data)
3. `tests/hirelings.test.js`: tests

## Hard rules

- **Modern ES modules** (`import` / `export`), Node 22. No dependencies, no DOM, no browser APIs, no `Math.random`.
- **Every random number comes from an `rng` argument:** a function returning a number from 0 up to 1. A d20 is `1 + Math.floor(rng() * 20)`.
- **Only one import is allowed:** `import { mulberry32 } from '../src/util/core.js';` in the test, for a seeded rng (`mulberry32(42)` returns an rng). The engine imports only its own data file, `../data/hirelings.js`.
- **Text:**
  - Write your own text: short and plain, British spelling.
  - Never copy text from a published book.
  - Barovian names (Barovia, Vallaki, the Vistani, the Count) are welcome.
- **Never mutate inputs:** return new objects (`structuredClone` is fine).
- **Tests** use `node:test` and `node:assert/strict`, run by `node --test tests/*.test.js`.

## What exists (inputs you receive; don't write these)

**A person of the valley**, who can be hired:

```js
{ id: 'folk-123', role: 'farmer', name: 'Anya Petrova', mood: 'afraid' | 'wary' | 'easy', spy: { for: 'court-2' } /* only if secretly the Count's eyes */ }
```

Roles:
- farmer, smith, child, elder, watch, priest, beggar, traveller, peddler, pilgrim, hermit, dog
- **Children, the lost and dogs can't be hired.**

**The Count's court**, members who send spies and raids:

```js
{ members: [ { id: 'court-2', name: 'Velkan', epithet: 'the Tithe-Taker', rank: 2, power: 3, alive: true } ] }
```

**The holding's numbers:** `{ comfort: 4, ward: 2, defence: 5 }`.

**`gaze`:** the Count's attention, 1 to 10.

## What to write

### `src/data/hirelings.js`

- **`RATES`:** the usual wage in gp per day by role. Keep them small and honest (labourers 2 sp a day, a smith 1 gp, a watchman 5 sp…).
- **`SKILL_OF`:** each role's skill: `'labour' | 'guard' | 'craft' | 'cook' | 'scout'` (watch → guard, smith → craft, traveller → scout, and so on).
- **`TELLS`:** 8 to 12 original one-line ways a spy gives themselves away, e.g. "seen at the treeline at dusk, talking to no one". Write your own.
- **`MORALE_LINES`:** a few short lines for staying and for leaving, per cause.

### `src/engine/hirelings.js`

Export these:

- **`canHire(person)`** → `{ ok, why }`.
- **`hire(person, { wage }, rng)`** → the hireling:
  - shape: `{ id, name, role, skill, wage, loyalty, devoted:false, spy? }`
  - starting loyalty (0–20) follows mood (afraid 6, wary 9, easy 12), +2 if the wage is at least 1.5× the role's rate, −3 if below the rate, ±1 random
  - a spy keeps their `spy` field but gets no visible difference: their loyalty is computed the same way
- **`payDay(hirelings, { gold })`** → `{ hirelings, paid:[ids], unpaid:[ids], spent }`.
  - Pay in list order while the gold lasts.
  - Each unpaid hireling loses 2 loyalty (not below 0).
- **`moraleCheck(hireling, { cause, ward, gaze }, rng)`** → `{ stays, hireling, line }`.
  - Causes: `'raid' | 'unpaid' | 'horror' | 'death'`.
  - Roll a d20 + a loyalty modifier (`Math.floor((loyalty - 10) / 2)`) against DC 10 + (gaze − 3, minimum 0) − ward.
  - Devoted hirelings always stay.
  - A natural 20 always stays; a natural 1 always fails.
  - On failure they leave (`stays:false`).
- **`watchForEyes(hirelings, { watchBonus, days }, rng)`** → found spies.
  - Each day, each spy has a (3% + 1% per point of `watchBonus`) chance to slip.
  - Each found spy comes back once, as `[{ id, member, tell }]`, where `member` is `spy.for` and `tell` is from `TELLS`.
  - **Never return someone who isn't a spy.**
- **`week(hirelings, { comfort, paidInFull, raidsWon })`** → new hirelings.
  - +1 loyalty for a week paid in full, +1 if comfort is 4 or more, +2 per raid beaten off together; maximum 20.
  - At 18 or more a hireling becomes `devoted:true`. Devoted is permanent.
  - **A devoted spy stops being a spy:** they've turned. Remove `spy`, and add `turned:true` so the caller can tell the DM.
- **`defenders(hirelings)`** → a number: guards count 1, everyone else 0.5, devoted count double.

## Tests (`tests/hirelings.test.js`)

- `canHire` refuses children, the lost and dogs
- hiring follows mood and wage (easy and well paid > afraid and underpaid)
- unpaid wages cost 2 loyalty, and gold runs out in list order
- morale fails more at gaze 9 than gaze 2, and less with ward 4 (500 seeded trials each)
- devoted always stay
- `watchForEyes` finds spies more often with `watchBonus: 10` than 0, and never returns a non-spy
- loyalty reaches devoted at 18; a devoted spy turns
- `defenders` adds up (guard 1, labourer 0.5, devoted guard 2)
- inputs aren't mutated
- the same seed gives the same result

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch named after this task (`chatgpt/downtime` or `chatgpt/hirelings`)
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
