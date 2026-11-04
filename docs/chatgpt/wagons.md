# Prompt for ChatGPT: the wagon on the road

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/wagons` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the app.

---

You're writing one small, self-contained JavaScript module for **Dread Delve**. It's a 3D virtual tabletop for a Curse of Strahd campaign (D&D 5e, SRD 5.2.1). The party can build a wagon from parts in a workshop. This module decides what the wagon does on the valley's roads: how far it goes, what its fittings are good for, and what happens to it. Everything you need is here. Write exactly three files and nothing else:

1. `src/engine/wagons.js`: the rules
2. `src/data/wagons.js`: what each fitting does (data)
3. `tests/wagons.test.js`: tests

## Hard rules

- **Modern ES modules** (`import` / `export`), Node 22. No dependencies, no DOM, no browser APIs, no `Math.random`.
- **Every random number comes from an `rng` argument:** a function returning a number from 0 up to 1. A d20 is `1 + Math.floor(rng() * 20)`.
- **Imports:**
  - The engine imports only `../data/wagons.js`.
  - The test may import `{ mulberry32 } from '../src/util/core.js'`; `mulberry32(42)` returns a seeded rng.
- **Text:**
  - Write your own text: short and plain, British spelling.
  - Never copy text from a published book.
  - Barovian names (Barovia, Vallaki, the Vistani, the Svalich Woods, the Mists) are welcome.
- **Never mutate inputs:** return new objects (`structuredClone` is fine).
- **Tests** use `node:test` and `node:assert/strict`, run by `node --test tests/*.test.js`.

## What exists (inputs you receive)

**A wagon**, as the workshop builds it:

```js
{ id:'wagon-1', kind:'wagon', n:'The Lantern Cart', capacity:500 /* lb */, speed:20 /* miles a day on a good road */,
  hp:40, ac:12, seats:2, bunks:0,
  fittings:['lockbox', 'lantern-hooks', 'spare-wheel', 'bunks', 'smithy-box', 'salt-barrels', 'hidden-compartment', 'ward-runes'] /* any of these */,
  damage:0 /* hp lost so far; may be missing (= 0) */ }
```

**A leg of a journey:**

```js
{ miles:12, road:'road' | 'track' | 'wild', weather:'clear' | 'rain' | 'snow' | 'fog', night:false }
```

**The cargo:** a weight in lb (the party's packs and stores).

**`gaze`:** the Count's attention, 1 to 10.

**A road event** the app has already rolled for a leg. Its `kind` is one of:
- `'ambush'`: the Count's servants or bandits
- `'mists'`: the Mists close in
- `'bloom'`: the creeping rot this campaign calls the Bloom; salt keeps it back
- `'theft'`: something goes missing in the night
- `'breakdown'`: a wheel or an axle
- `'search'`: the Count's men stop and search the wagon
- `'storm'`

## What to write

### `src/data/wagons.js`

- **`FITTINGS`:** one entry per fitting id above: `{ id, n, does }`, where `does` is one plain sentence for the DM.
  - **lockbox:** theft takes nothing from the box.
  - **lantern-hooks:** travel at night without the night penalty.
  - **spare-wheel:** a breakdown costs an hour, not half a day.
  - **bunks:** sleepers in the wagon get a long rest on the road; without bunks, a night on the road is a poor rest.
  - **smithy-box:** repair 1d6 + 2 hp a day on the road.
  - **salt-barrels:** a Bloom event passes them by, and they can lay a salt line at camp.
  - **hidden-compartment:** a search finds what's hidden only on a DC 18 check.
  - **ward-runes:** −2 to any check the Mists or the Count's servants make against the wagon, and the Mists turn it back less often.
- **`ROAD_FACTOR`:** `{ road:1, track:.75, wild:.5 }`
- **`WEATHER_FACTOR`:** `{ clear:1, rain:.8, snow:.5, fog:.75 }`
- **`NIGHT_FACTOR`:** `.5`

### `src/engine/wagons.js`

Export these:

- **`legSpeed(wagon, leg, { cargo })`** → `{ milesPerDay, hours, why:[…] }`.
  - The wagon's `speed` × road × weather × (night, unless lantern hooks).
  - Overloaded: cargo over `capacity` halves it; more than twice capacity can't move at all, `{ milesPerDay:0, why:['Too heavy to move.'] }`.
  - Damaged below half hp: −25%.
  - `hours` is the time for the leg at 8 hours of travel a day.
  - `why` lists each reason in plain words, so the DM can see them.
- **`meetEvent(wagon, event, { gaze }, rng)`** → `{ effects, lines }`: what the fittings change about an event the app rolled.
  - The `effects` keys you may use:
    - `avoided:true` (it passes them by)
    - `checkMod:-2` (to the other side's roll)
    - `delayHours:n`, `damage:n` (to the wagon), `lost:'what was taken'`
    - `found:true|false` (a search), `campRest:'long'|'poor'`
  - For example:
    - `'bloom'` with salt barrels: `{ avoided:true }`
    - `'breakdown'`: 12 hours' delay, or 1 with a spare wheel, plus `damage` of 1d6
    - `'theft'`: `lost` names something unless there's a lockbox
    - `'search'`: `found` follows a d20 + 5 against DC 18 with a hidden compartment (DC 10 without); this is the searchers' roll
    - `'mists'` and `'ambush'`: `checkMod:-2` with ward-runes, and the mists turn the wagon back at 50% − 10% per point of `gaze` under 5 (minimum 10%; ward-runes halve it)
    - `'storm'`: `damage` of 1d4 and 4 hours' delay
  - `lines` are one or two short sentences for the DM's card.
- **`nightOnTheRoad(wagon, { sleepers })`** → `{ rest:'long'|'poor', why }`: a long rest for up to `bunks` sleepers; poor for the rest.
- **`repairDay(wagon, rng)`** → the new wagon.
  - `damage` goes down by 1d6 + 2 with a smithy box, or 1 without; never below 0.
- **`describeWagon(wagon)`** → a short line with its numbers and what each fitting does, for the UI.

## Tests (`tests/wagons.test.js`)

- every fitting has an id, a name and what it does
- speed falls on a track, in snow, at night, and when overloaded
- lantern hooks remove the night penalty
- more than twice capacity can't move
- salt barrels avoid the Bloom
- a spare wheel turns a 12-hour breakdown into 1 hour
- a lockbox stops theft taking anything
- a hidden compartment is found less often than without one (500 seeded trials)
- ward-runes make the Mists turn the wagon back less often (500 seeded trials)
- bunks give long rests up to their number
- a smithy box repairs more than nothing
- inputs aren't mutated
- the same seed gives the same result

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/wagons`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
