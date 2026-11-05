# Prompt for ChatGPT: the valley's weather, day by day

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/weather` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in: the DM's desk, travel, and the 3D ground's snow and puddles.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop for a Curse of Strahd campaign set in Barovia. Barovia is a valley of mist, cold rain and grey skies that its master never lets clear.
- Today the app rolls one line of weather from a flat list each time the party sets out on a journey, so tomorrow has nothing to do with today.
- Your module makes the weather **a place's own and continuous**: fronts that last a few days, a season, morning fog that lifts, snow that lies and melts, and the valley growing darker as the Count's attention (his **Gaze**, 1–10) grows.
- Everything is deterministic from a seed and the day, so the DM and every player see the same sky.

Write exactly three files and nothing else:

1. `src/engine/weather.js`: the engine
2. `src/data/weather.js`: the data (kinds, words, seasons)
3. `tests/weather.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM.
- **Deterministic:** derive every random number from a small seeded generator in the engine (mulberry32), seeded from `seed` and the day number. No `Math.random`. The same `(seed, day, opts)` always gives the same weather.
- **Continuity without state:** the weather for day N must be computable on its own, without stepping through days 1..N-1 at run time. One way is smooth periodic noise over days, plus fronts placed by hashing the week number. It must still change gradually.
- **Fast:** 1000 days in well under 100 ms.
- **Imports:**
  - The engine imports only `../data/weather.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **The repository is public.** Write every line of description yourself.

## The app's time

- A day is a whole number, starting at 1.
- An hour is 0–23.
- The DM can set the season, or it follows the calendar: day 1 is early autumn, and a season lasts 91 days (autumn, winter, spring, summer, then round again).

## What to write

### `src/data/weather.js`

- **`KINDS`**: the weather kinds, each `{ id, label, sight, travel, wet, snow, light }`:
  - `sight`: how far you can see, in feet outdoors (e.g. clear 1000, mist 60, thick fog 15)
  - `travel`: a speed multiplier (1, or 0.5 for mud or deep snow)
  - `wet`: 0–1, how much rain wets the ground
  - `snow`: 0–1, how much snow falls
  - `light`: a daylight multiplier (0.4–1)
  - At least: `overcast`, `low-fog`, `mist`, `thick-fog`, `drizzle`, `rain`, `downpour`, `storm`, `sleet`, `snow`, `blizzard`, `frost`, `clear-cold` (a rare break in the cloud), `dry-thunder` (thunder and no rain).
- **`SEASONS`**: per season, how likely each kind is, and a temperature band.
- **`LINES`**: for each kind, at least three one-sentence descriptions in the campaign's voice, grim and specific. For example: "Low fog lies in the hollows; the air does not move."
- **`GAZE_SIGNS`**: about a dozen extra half-sentences for when the Count is watching, from faint at Gaze 4 to blatant at Gaze 9–10. For example: "the rain falls a little slower near the castle road".

### `src/engine/weather.js`

Export these:

- **`weatherFor(day, { seed, season = null, gaze = 1, hour = 12 } = {})`** returns:
  ```js
  {
    day, hour, season,
    kind,                       // an id from KINDS
    label,
    temp,                       // 'bitter' | 'cold' | 'cool' | 'mild'
    wind,                       // 0–3
    line,                       // one sentence, from LINES, with a Gaze sign added when one applies
    sight,                      // feet
    obscured,                   // 'none' | 'light' | 'heavy'
    travel,                     // a multiplier
    light,                      // a multiplier
    ground: { snow, wet },      // 0–1 each: what's lying on the ground
  }
  ```
  - `obscured` follows the 5e rules: lightly obscured when sight is under 300 ft, heavily when under 30 ft.
  - `ground` is what's lying underfoot, not what's falling: snow builds over snowy days and melts over mild ones, and the ground stays wet for a day after rain.
  - Fronts last 2–5 days. Today is the same kind as yesterday about 60% of the time, and a neighbouring kind most of the rest (drizzle to rain, not clear to blizzard).
  - **Morning fog lifts:** before 9 o'clock, `low-fog` or `mist` is likelier, and it clears to the day's kind by noon.
  - **The Gaze darkens the valley:** at Gaze 6 and up, `light` drops a little more, clear days get rarer, and fog days get likelier. From Gaze 4, a `GAZE_SIGNS` half-sentence is sometimes added to `line`, oftener the higher the Gaze.
- **`forecast(day, n, opts)`** → an array of `n` `weatherFor` results for the days from `day`, at noon.
- **`groundLine(w)`** → the short words the 3D view understands, chosen from `w`:
  - `heavy snow`, `snow`, `frost`, `heavy rain`, `rain`, or `''`
  - The app shows snow cover for "snow", deep cover for "heavy snow", rime for "frost", and puddles for "rain" or "heavy rain".
- **`describe(w)`** → one line for the DM: label, temperature, wind and what it does. For example: "Thick fog, cold, still: heavily obscured beyond 15 ft; travel at half speed off the road."

## Tests (`tests/weather.test.js`)

- **Every day is valid:** for days 1–730, `kind` is in `KINDS`, `sight > 0`, `0 ≤ ground.snow, ground.wet ≤ 1`, and `obscured` matches `sight`.
- **Deterministic:** the same seed gives identical results; a different seed differs on at least 30% of days.
- **Continuity:** over 730 days, the kind stays the same as the day before on 45–80% of days, and never jumps between kinds that aren't neighbours (define the neighbours in the data). Runs of the same kind average 2–5 days.
- **Seasons:** winter has more snow days than summer, and summer has no blizzards.
- **Snow lies:**
  - after three snow days in a row, `ground.snow` is higher on the third than the first
  - after five mild days with no snow, it's back near 0
- **Morning fog:** over many days, fog kinds are commoner at hour 6 than at hour 14.
- **The Gaze:** at Gaze 9, clear days are rarer and the average `light` lower than at Gaze 1, over the same 365 days and seed.
- **`groundLine`** returns only the five words above or `''`, and says "snow" whenever `ground.snow ≥ 0.4`.
- **Speed:** 1000 `weatherFor` calls in under 100 ms (with a generous margin of 500 ms on slow machines).

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/weather`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
