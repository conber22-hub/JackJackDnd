# Prompt for ChatGPT: a night's rest

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/rest` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the app.

---

You're writing one small, self-contained JavaScript module for **Dread Delve**. It's a 3D virtual tabletop for a Curse of Strahd campaign (D&D 5e, SRD 5.2.1). In Barovia, where the party sleeps matters: a fortified house with a shrine is safe; a camp on the road under Strahd's gaze is not. This module decides how a long rest goes, given where they sleep. Everything you need is here. Write exactly three files and nothing else:

1. `src/engine/rest.js`: the rules
2. `src/data/rest.js`: places, interruptions and dreams (data)
3. `tests/rest.test.js`: tests

## Hard rules

- **Modern ES modules** (`import` / `export`), Node 22. No dependencies, no DOM, no browser APIs, no `Math.random`.
- **Every random number comes from an `rng` argument:** a function returning a number from 0 up to 1.
- **Imports:**
  - The engine imports only `../data/rest.js`.
  - The test may import `{ mulberry32 } from '../src/util/core.js'`; `mulberry32(42)` returns a seeded rng.
- **The rules:** SRD 5.2.1 long-rest rules are the baseline; describe them in your own words.
  - A long rest is 8 hours.
  - It restores all HP and spent Hit Point Dice.
  - It reduces exhaustion by 1.
  - An interruption by combat, or an hour or more of strenuous activity, breaks it.
- **Text:**
  - Write your own text: short and plain, British spelling.
  - Never copy text from a published book.
  - Barovian names (Barovia, Vallaki, the Vistani, the Mists, the Count) are welcome.
- **Never mutate inputs:** return new objects.
- **Tests** use `node:test` and `node:assert/strict`, run by `node --test tests/*.test.js`.

## What exists (inputs you receive)

**Where they sleep:**

```js
{ kind: 'holding' | 'inn' | 'village' | 'camp' | 'road' | 'dungeon', name: 'The Lantern House' }
```

**The party's holding**, if they sleep there (its stats are already worked out):

```js
{ beds:6, comfort:4, defence:5, ward:2, salt:true /* a salt line is built */, workshops:['shrine'] }
```

- `ward` comes from a shrine to the Morninglord.
- `defence` comes from walls and towers.

**The party:** `[{ id, name, exhaustion:0, watch:true|false /* takes a turn on watch */ }]`.

**A wagon with bunks**, if they sleep in it: `{ bunks:2 }` (optional).

**`gaze`:** the Count's attention, 1 to 10. **`weather`:** `'clear' | 'rain' | 'snow' | 'fog'`.

## What to write

### `src/data/rest.js`

- **`PLACES`:** per kind, a base chance of a night disturbance and a comfort level.
  - holding: depends on its stats
  - inn 10%; village 15%; camp 25%; road 35%; dungeon 40%
- **`DISTURBANCES`:** 10 to 14 original night events, each `{ id, n, severity:'noise'|'scare'|'fight', text }`.
  - noise: a wolf howling close by, something scratching at the shutters
  - scare: a figure at the window, a child's voice calling a name
  - fight: something comes in
  - Your own words.
- **`DREAMS`:** 8 to 10 short, original Barovian nightmares and odd dreams, used when gaze is high.

### `src/engine/rest.js`

Export these:

- **`restQuality({ place, holding, wagon, party, gaze, weather })`** → `{ chance, comfort, notes:[…] }`. The chance of a disturbance in the night:
  - **Base:** the place's chance (at a holding, 20% − 2% per point of defence − 3% per point of ward, minimum 2%).
  - **Gaze:** +3% per point of gaze over 3.
  - **Sleeping rough:** +5% in rain or snow when not under a roof (camp, road).
  - **A salt line:** −5%.
  - **Lookouts:** −5% if at least one hero keeps watch; nobody on watch makes any disturbance a surprise.
  - **Comfort:**
    - `'poor'`: the road without a wagon bunk, or a camp in rain or snow
    - `'fair'`: a camp, a village
    - `'good'`: an inn, a holding with beds for everyone
    - `'fine'`: a holding with comfort 4 or more and beds for everyone
  - `notes` say why, in plain words.
- **`rollNight(quality, { party, gaze }, rng)`** → `{ disturbed, event?, surprise, dream? }`.
  - Roll against the chance.
  - If disturbed, pick an event, more likely `'fight'` as gaze rises.
  - At gaze 6 or more, one hero (picked with `rng`) may dream: a 25% chance, with a dream from `DREAMS`.
- **`restOutcome(quality, night, { party })`** → `{ heroes:[{ id, hpFull, hitDice:'all'|'half'|'none', exhaustion:-1|0, inspiration:boolean }], lines }`.
  - A `'fight'` breaks the rest: no recovery, `hitDice:'none'`, exhaustion 0.
  - A `'scare'` costs 1 hour; it still counts.
  - `'poor'` comfort: HP full, but only half the Hit Point Dice back and no exhaustion recovery.
  - `'fine'` comfort: the hero who slept best gains Heroic Inspiration (SRD 5.2). If nobody dreamed, it's the first hero; otherwise the first hero who didn't dream.
  - `lines` are short sentences for the DM's card.

## Tests (`tests/rest.test.js`)

- every disturbance has an id, a severity and text; every dream has text
- a holding with walls, a shrine and a salt line is safer than a road camp
- gaze raises the chance
- keeping watch lowers it, and no watch makes disturbances a surprise
- a fight breaks the rest
- poor comfort gives only half the Hit Point Dice and no exhaustion recovery
- fine comfort gives one hero inspiration
- dreams come only at gaze 6 or more
- fights are likelier at gaze 9 than gaze 2 (500 seeded trials)
- inputs aren't mutated
- the same seed gives the same result

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/rest`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
