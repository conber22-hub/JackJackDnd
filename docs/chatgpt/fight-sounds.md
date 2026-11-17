# Prompt for ChatGPT: the sounds of a fight

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/fight-sounds` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. Its fights play like a tactics game on a pocket console, and its music is chiptune: you wrote the engine for that earlier (`src/engine/chiptune.js`, which turns note text into timed events, and the app's `playTune(events)` plays them on square, triangle and noise voices). Right now every blow in a fight makes one of three sounds: hit, miss or crit. A game like this has **a little sound for everything**: steel on steel when a sword is parried, a thwip for an arrow, a shimmer for a spell in the spell's own colour, a thump on a critical, a rising arpeggio for healing, a whoosh for a Dash, a clank for armour taking the blow, a wet crunch for a bite.

You write the sound recipes, as chiptune events, and the engine that picks the right one for what happened. The app plays them; you don't touch audio.

Write exactly three files and nothing else:

1. `src/engine/fight-sfx.js`: choosing a sound
2. `src/data/fight-sfx.js`: the sounds (data)
3. `tests/fight-sfx.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no audio, no timers, no `Math.random`: variation (so ten sword hits don't sound identical) comes from a seed you're given.
- **Pure:** plain JSON in and out.
- **Imports:** the engine imports `../data/fight-sfx.js` and `./chiptune.js` (only its exported `parseVoice` and `noteFreq`; read that file for the note syntax: `C5/16`, `r/8`, drums `x/16` `X/16` `h/32`, dotted `.` and triplet `t`). The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- All original: no samples, no copied melodies; build everything from short notes and noise.

## The event format the app plays

`playTune` takes a list of `{ t, dur, freq?, drum?, wave:'square'|'triangle'|'noise', vol }`: `t` and `dur` in seconds from the start, `freq` in hertz for a tone, `drum` (`x`, `X` or `h`) for noise. Every sound you make must be a list like that, **under 0.6 seconds long** (a critical or a death may run to 0.9), with at most 12 events.

## What happens (what you're asked to sound)

The app calls you with one of these:
```js
{ t:'swing', kind:'melee'|'ranged'|'spell', weapon:'Longsword', dmgType:'slashing'|'piercing'|'bludgeoning'|'fire'|'cold'|'radiant'|'necrotic'|'lightning'|'force'|'acid'|'poison'|'thunder'|'psychic', by:'pc'|'monster' }
{ t:'land', hit, crit, nat, dmgType, kind, armour:'none'|'light'|'medium'|'heavy'|'hide', by:'pc'|'monster', bite:bool }   // the blow arriving
{ t:'heal', n }
{ t:'cast', spell, level, school:'evocation'|'necromancy'|'abjuration'|'conjuration'|'divination'|'enchantment'|'illusion'|'transmutation' }
{ t:'act', k:'dash'|'dodge'|'disengage'|'stand' }
{ t:'feature', id:'wind'|'surge'|'rage'|'channel'|'lay'|… }
{ t:'cond', n:'prone'|'poisoned'|'frightened'|'blessed'|… }
{ t:'down', hero:bool }           // someone dropped
{ t:'kill' }                      // a foe dead
{ t:'turn', mine:bool }           // a turn begins (a small tick; mine: the player's own, a brighter one)
{ t:'potion' }
```

## What to write

### `src/data/fight-sfx.js`

`SFX`: at least **30 named recipes**, each a short score in the chiptune syntax per voice plus a tempo and a gain, for example:
```js
'steel-hit': { bpm:480, gain:.5, pulse1:'E6/32 B5/32', noise:'X/32 h/32' },
'arrow-thwip': { bpm:720, gain:.35, pulse2:'C7/32 G6/32', noise:'h/16' },   // (the parser takes lengths down to 32nds: raise bpm for anything quicker)
```
Cover: swings (blade, blunt, bow, thrown, claw, bite), lands (on flesh, on light armour, on heavy armour with a clank, on bone, a parry or glance for a miss, a whiff for a clean miss), a critical (big and short), each damage type's colour for spells (fire crackles, cold rings, radiant rises, necrotic falls and buzzes, lightning snaps, force hums, thunder booms, acid fizzes, poison bubbles, psychic wobbles), healing (rising), each turn act, the features, a condition taking hold (a short sting: bad for prone, poisoned, frightened; good for blessed), a hero going down (a falling minor phrase), a foe dying, a turn beginning, a potion (glug).

`PICK`: the rules for which recipe answers which event, in data where you can (a table from `dmgType` to a spell recipe, from `armour` to a land recipe…).

### `src/engine/fight-sfx.js`

Export:
- `sfxFor(event, { seed = '' } = {})` → `{ id, events }` or `null` for an event that shouldn't make a sound. `events` is the list `playTune` takes, built from the recipe with `parseVoice` (assign each voice its `wave`: pulse voices `'square'`, `tri` `'triangle'`, `noise` `'noise'`, and scale `vol` by the recipe's `gain`).
- **Variation:** from the seed, nudge the pitch of tone events by up to ±3% and the gain by up to ±10%, so repeats differ a little; the same seed gives the same result.
- **Combining:** `sfxFor({ t:'land', crit:true, … })` layers the critical recipe over the land recipe (merged and sorted by `t`, still within the length and count limits).
- `ids()` → every recipe id (for the tests and the app's debug page).

### `tests/fight-sfx.test.js`

Prove:
- every recipe parses, is under its length limit and has at most 12 events; every event has a finite `t`, `dur > 0`, a `wave`, and a `freq` or a `drum`
- each event kind in the list above gets a sound (or `null` where you decide it shouldn't, with a comment), and the land on heavy armour differs from the land on flesh
- each spell damage type picks a different recipe
- a critical land is the land plus the critical, sorted by time, within the limits
- the same seed gives the same events; different seeds give slightly different pitches (within ±3%)
- an unknown event returns `null` and doesn't throw

## What Claude will do with it

The app already passes each blow, spell, heal and turn through its event bus; it will call `sfxFor` there and play the result with `playTune` on the effects channel (the player's sound setting turns it off). Make it so that someone playing with their eyes closed could tell a sword hit on plate from a wolf's bite on leather.
