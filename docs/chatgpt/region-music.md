# Prompt for ChatGPT: music for each part of the valley

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/region-music` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and plays them in the game.

---

You wrote the handheld's jingles for **Dread Delve** (`src/engine/chiptune.js` and `src/data/chiptune.js`: two square-wave voices, a triangle bass and a noise drum, in a minor, gothic, Barovian mood). They're in the game now and the table loves them. This time it's the **background music**: a quiet loop for each part of the valley, the way the old pocket-console adventure games gave every town and every route its own tune, so a player knows where they are with their eyes shut.

Write exactly three files and nothing else:

1. `src/data/region-music.js`: the loops (data, in your notation)
2. `src/engine/region-music.js`: which loop plays where, and how one hands over to the next
3. `tests/region-music.test.js`: tests

You may also make **one small change to your own `src/engine/chiptune.js`**: let `events`, `duration` and `validate` take a song object as well as an id (`events(idOrSong, opts)`), so loops kept outside `SONGS` can be played and checked. Keep every existing behaviour and test passing.

## Hard rules

- Everything from your chiptune brief still holds: modern ES modules, Node 22, no dependencies, no DOM, no Web Audio, no timers, no `Math.random`. Pure: plain JSON in and out.
- **Imports:** `src/engine/region-music.js` imports only `../data/region-music.js` (and `./chiptune.js` if it needs it). The test imports the engines and the data.
- **All original music**, as before: no quoting, adapting or "paying homage to" any game's, film's, folk song's or hymn's tune, and nothing named after a console or a game. Barovian names are welcome in titles.
- **Quiet.** These play under everything else for minutes at a time: low volumes (`vol` 0.15–0.35), sparse drums or none, no shrill high notes held long. Each loop should loop seamlessly (its last bar leads back into its first).

## What to write

### `src/data/region-music.js`

**`LOOPS`**: at least these 14, each `loop:true`, 20–60 seconds long, in the same song shape as `SONGS`:

| id | where | mood |
| --- | --- | --- |
| `village` | the Village of Barovia by day | shuttered, sad, a little hymn-like |
| `villageNight` | a village after dark | sparse, a heartbeat bass |
| `vallaki` | Vallaki | forced cheer over unease (a festival that nobody enjoys) |
| `krezk` | Krezk and the abbey's walls | cold stone, a slow processional |
| `road` | the open road by day | walking pace, onward, lonely |
| `roadNight` | the road at night | the same road, slower and darker |
| `woods` | the deep Svalich Woods | wind in the pines, something following |
| `church` | a church or shrine | an organ-like drone, still |
| `tavern` | inside a tavern | a tired fiddle-like tune, two voices |
| `house` | inside an ordinary house | small, close, a clock-like pulse |
| `crypt` | crypts, cellars, caves | low, dripping, the noise voice as water |
| `vistani` | a Vistani camp | the one warm tune in the valley, with a dance rhythm |
| `mists` | the Mist Wall and misty roads | formless, drifting, no beat |
| `castle` | near Castle Ravenloft | grand and terrible, slow |

Add others if you like (a `lake`, a `windmill`, a `bloom` for when the Bloom is loose).

### `src/engine/region-music.js`

Export:
- `regionLoop({ place, kind, inside, room, hour, gaze, fight, mist })` → a loop id, or `null` for silence:
  - `place` is a valley place id: `'mists'`, `'gates'`, `'village'`, `'crossroads'`, `'castle'`, `'coffin'`, `'tser'`, `'bonegrinder'`, `'vallaki'`, `'lake'`, `'argyn'`, `'berez'`, `'winery'`, `'krezk'`, `'yester'` or `'tower'`; `null` on a road.
  - `kind` is `'village' | 'town' | 'road' | 'woods' | 'camp' | 'landmark' | 'castle'`.
  - `inside` is a building's kind when indoors (`'tavern'`, `'church'`, `'house'`, `'cottage'`, `'mansion'`, `'shop'`, `'mill'`, `'tower'`, `'barn'`, `'hut'`…), else `null`.
  - `hour` is 0–23 (night is 20–5), `gaze` is Strahd's Gaze 1–10, `fight` is true in a fight (return `null`: the fight has its own sounds), `mist` is true on a misty road.
  - Decide sensibly: Tser Pool is `vistani`, a cellar or crypt is `crypt`, the road at night is `roadNight`, the castle and its roads `castle`…
- `handover(fromId, toId)` → `{ out, in, gap }` in seconds: how long the old loop fades out, how long the new one fades in, and a gap of silence between (e.g. into a church: a long fade and a breath of silence; road to road at dusk: a slow crossfade with no gap; the same id: `null`).
- `loopLength(id)` → the length of one loop in seconds (it must end on a bar line, so the loop is seamless).
- `variantFor(id, { gaze })` → `{ tempo, transpose }`: as Strahd's Gaze rises, the same loop plays a touch slower and lower (gaze 1 is `{ tempo:1, transpose:0 }`; gaze 10 no slower than 0.85 and no lower than −3 semitones).

### `tests/region-music.test.js`

Prove:
- every loop passes your `validate`, has 4 voices or fewer, `loop:true`, 20–60 seconds, and its length is a whole number of bars
- the 14 required ids exist; no two loops share a title
- `regionLoop` gives `null` in a fight, `roadNight` on a road at 23:00, `vistani` at Tser Pool, `crypt` in a cellar, and a loop for every place id above by day and by night
- `handover` gives `null` for the same id and positive fades otherwise
- `variantFor` stays within its limits and gaze 1 changes nothing
- the same input always gives the same output, and the existing chiptune tests still pass

## What Claude will do with it

Play the loop for wherever the hero is through Web Audio (on the same bus as the jingles, under a "Music" volume the player sets), and hand over with your fades when they walk from the village onto the road or step inside the tavern. The jingles still play on top. You don't need to do any of that: just make the valley sound like the valley.
