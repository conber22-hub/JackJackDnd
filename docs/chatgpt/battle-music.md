# ChatGPT prompt: 🥁 music for a fight, rising with the danger

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/battle-music` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. You already wrote its chiptune engine (`src/engine/chiptune.js`: `events`, `duration`, `validate`) and the region loops that play as the party walks the valley (`src/engine/region-music.js`, `src/data/region-music.js`: eight-bar 4/4 scores with `pulse1`, `pulse2`, `tri`, `noise` voices). Right now **a fight hushes the music**: the region loop fades and only the fight's own sounds are heard. You're writing the fight's music: loops that start when a fight breaks out and **rise with the danger**, and the engine that picks which one plays, and how fast.

Read `src/engine/region-music.js` and `src/data/region-music.js` first, and keep to exactly the same score format (so `chiptune.js` plays them unchanged), and `src/engine/chiptune.js` `validate`.

Write exactly three files and nothing else:

1. `src/engine/battle-music.js`: choosing the fight's music
2. `src/data/battle-music.js`: the fight loops (data)
3. `tests/battle-music.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no Web Audio, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the engine imports `../data/battle-music.js` and `./chiptune.js` (for `duration` / `validate` if you need them). The test imports the engine, the data and `../src/engine/chiptune.js`.
- **Tests** use `node:test` and `node:assert/strict`.
- All original: no melody, motif or rhythm taken from any existing game, film or song. Gothic, minor, Barovian: dread before thrill.

## What to write

### `src/data/battle-music.js`

`FIGHT_LOOPS`: at least **six** loops in the region-music score format (`id`, `title`, `bpm`, `loop:true`, `bars`, `beatsPerBar`, `voices`), each one that loops seamlessly (its last bar leads back to its first):
- `skirmish`: a low pulse and a heartbeat drum: wolves on the road, a couple of zombies
- `clash`: the full four voices, driving: a real fight
- `peril`: faster, higher, urgent, the bass climbing: the party is losing
- `lastStand`: sparse and desperate: one hero left standing, or the hero alone near death
- `court`: stately and cruel, an organ-like pulse: Strahd's court, a vampire spawn, anything of the Count's
- `seep`: wrong and wet, detuned against itself: the Seep (this campaign's rot)
Each must have a sounding voice at the loop's boundary (like the region loops) and stay within `validate`.

`STINGS`: two short non-looping phrases, `won` (under 4 seconds, resolving, relief more than triumph) and `fell` (under 4 seconds, a falling minor figure).

### `src/engine/battle-music.js`

Export:
- `tension(fight)` → a number 0..1, from what the app can tell you: `fight = { heroes:[{ hp, maxHp, down }], foes:[{ hp, maxHp, cr, tags, court }], round }` (any may be missing; tags is a list of words like `'seep'`, `'undead'`). It rises with the foes' strength against the heroes' (their challenge ratings against the party's size), with the heroes' hurt (the share of their hit points gone, and each one down), and a little with the rounds; it falls as foes fall. Document the formula in a comment.
- `battleLoop(fight)` → `{ id, tempo }`: which loop, and a tempo multiplier 0.9..1.25 (rising with tension within a loop). The order: a foe of the Count's court (`court:true`) → `court`; a Seep foe (tag `seep`) → `seep`; one hero standing (or the only hero under a quarter of their hit points) → `lastStand`; else by tension: `skirmish` below 0.35, `clash` below 0.7, `peril` above.
- `shouldChange(fromId, toId, { barsPlayed })` → whether to cross over now: never more often than every 4 bars, except into `lastStand` (at once).
- `fightLoops()` → every loop id (for the tests and a debug page).

### `tests/battle-music.test.js`

Prove:
- every loop and sting passes `chiptune.js` `validate`, every loop has `loop:true` and a sounding voice at its boundary, every sting is under 4 seconds (`duration`)
- the six loop ids exist; no two loops share a melody line (their `pulse1` notes differ)
- `tension` is 0..1, never throws on `{}` or `null`, rises when a hero is hurt or down, rises with a stronger foe, falls when foes fall
- `battleLoop` follows the order above, its tempo stays in 0.9..1.25, and it never throws on `{}` or `null`
- `shouldChange` holds for 4 bars, and lets `lastStand` in at once

## What Claude will do with it

`src/ui/regionmusic.js` will start the fight's loop when a fight breaks out (where the region loop now goes quiet), cross between loops as the fight turns (on `shouldChange`), play `won` or `fell` when it ends, and fade back to the region's loop. It follows the music on/off setting. Make a player's pulse quicken when a fight turns against them, before they've read a single number.
