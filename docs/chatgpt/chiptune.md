# Prompt for ChatGPT: the handheld's little tunes (chiptune jingles)

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/chiptune` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and plays them on the handheld.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop for a Curse of Strahd campaign. Every player now plays from their phone held like a pocket console, with a D-pad and buttons, and the table loves the feeling of four friends on four old handhelds. What's missing is **the little tunes**: a short jingle when it switches on, when it's your turn, a level-up fanfare, a victory sting, a sad fall, a quest done. They should be written the way the old handheld chips sounded: two square-wave voices, one triangle bass and one noise drum, but in a **minor, gothic, Barovian** mood.

You write the music as data and a pure engine that turns it into timed note events. The app's own code plays the events through Web Audio; you don't touch audio at all.

Write exactly three files and nothing else:

1. `src/engine/chiptune.js`: the parser and scheduler
2. `src/data/chiptune.js`: the songs (data)
3. `tests/chiptune.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no Web Audio, no timers.
- **Pure:** plain JSON in and out. No `Math.random`.
- **Imports:**
  - The engine imports only `../data/chiptune.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original music.** Every melody is your own composition. Don't quote, adapt or "pay homage to" any existing game's, film's or song's tune (no famous jingles, no folk songs, no chants), and name nothing after a console or a game. The repository is public. Barovian names are welcome in titles and comments.

## The notation (yours to design, within this)

A song is plain data:
```js
{ id:'levelUp', title:'A step further into the dark', bpm:132, loop:false,
  voices:{
    pulse1:  { wave:'square', duty:.25, vol:.5, notes:'E5/8 G5/8 B5/8 E6/4. ...' },
    pulse2:  { wave:'square', duty:.5,  vol:.35, notes:'...' },
    tri:     { wave:'triangle',         vol:.6, notes:'E3/4 B2/4 ...' },
    noise:   { wave:'noise',            vol:.3, notes:'x/8 r/8 x/16 x/16 ...' } } }
```
- A note is a pitch (`C`–`B`, with `#` or `b`, and an octave 0–8) or `r` (a rest), a slash and a length: `1`, `2`, `4`, `8`, `16` or `32`, with an optional `.` for dotted and `t` for a triplet.
- In the noise voice, pitches are drum hits: `x` (a short hit), `X` (a loud long hit), `h` (a hat).
- Add these if you want them: a tie (`~`), a per-note volume (`!` loud, `?` soft), and a slide. Document whatever you add in the data file's comment.

## What to write

### `src/data/chiptune.js`

**`SONGS`**: at least these 20, each short. Durations are a guide; keep stings under 3 s.

| id | when | about |
| --- | --- | --- |
| `boot` | switching on (an eye opens on a black screen) | 1.5–2 s, ominous then bright |
| `turnStart` | your turn in a fight | under 1 s, a call to arms |
| `turnOther` | someone else's turn | very soft, 2 notes |
| `levelUp` | a level gained | 2–3 s, triumphant but still minor-key |
| `victory` | a fight won | 2–3 s |
| `defeat` | the party falls | 2–3 s, falling, final |
| `questNew` | a quest taken | about 1 s |
| `questDone` | a quest finished | about 2 s |
| `save` | a save state written | about 0.5 s |
| `load` | a save state loaded | about 0.7 s, a rewind feel |
| `menuMove` | moving through a menu | one blip |
| `menuOk` | choosing | two blips |
| `menuBack` | back | a low blip |
| `heal` | healing | a rising shimmer |
| `hit` | the hero takes a hit | a crunch |
| `crit` | a critical hit | a bright stab |
| `door` | a door opens | creak-like, use the noise voice |
| `stairs` | the stairs | a run down, or up |
| `gazeRises` | Strahd's Gaze rises | low, unsettling, dissonant |
| `lowHealth` | the hero near death | `loop:true`, a quiet two-bar pulse to sit under play |

Add others if you like (a Vistani `campfire` loop, a `mists` sting, a `bell` for a church).

### `src/engine/chiptune.js`

Export:
- `noteFreq(name)`: the frequency in Hz, equal temperament, with A4 = 440 (`'C#4'` → 277.18…).
- `parseVoice(text, { bpm })` → `[{ t, dur, freq, vol }]` in seconds from the start. A rest leaves a gap; a drum gives `{ t, dur, drum:'x', vol }`.
- `events(id, { tempo = 1, transpose = 0 } = {})` → all of the song's voices merged and sorted by time: `[{ t, dur, voice, wave, duty, freq | drum, vol }]`. `tempo` scales the speed; `transpose` shifts the pitched voices by semitones.
- `duration(id, opts)` → seconds (the end of the last note). A looping song gives the length of one loop.
- `songs()` → the list of `{ id, title, loop, duration }`.
- `validate(song)` → `[]`, or a list of readable problems (a bad token, a note out of range, a voice that doesn't exist, an unknown wave).

### `tests/chiptune.test.js`

Prove:
- `noteFreq`: A4 = 440, A5 = 880, C4 ≈ 261.63, and flats equal their sharps (`Db4` = `C#4`)
- a quarter note at 120 bpm lasts 0.5 s, a dotted eighth 0.375 s, an eighth-note triplet 1/6 s
- rests leave gaps, and notes in one voice never overlap
- `events` is sorted by time, and `tempo:2` halves the duration
- `transpose:12` doubles every pitched frequency and leaves drums alone
- every song in `SONGS` passes `validate` and has the 4 voices or fewer
- stings are under 3 s at tempo 1, `lowHealth` loops, and the 20 required ids all exist
- `validate` catches a bad token (`'H4/4'`) and a bad length (`'C4/3'`)
- the same input always gives the same output

## What Claude will do with it

Play `events()` through Web Audio, on the same bus as the app's sound effects (square waves with the duty you give, a triangle, filtered noise for the drums), respecting the player's volume and sound settings. It will play them on the handheld at those moments, with a "Music: chip / off" setting. You don't need to do any of that: just make the tunes good and the engine exact.
