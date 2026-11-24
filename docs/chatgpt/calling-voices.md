# ChatGPT prompt: 🗣 each Calling's own voice in a fight

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/calling-voices` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're helping **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign, grow out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. You wrote its twelve **Callings** (`src/data/callings.js`), their Origins (`src/data/origins.js`) and every spell's name in each caster's voice (`src/data/rites.js`). In a fight, heroes say a short line when they attack, hit, miss, heal, go down, and so on (`src/data/action-voices.js`, `VOICE_LINES.hero`). Right now every hero says the same generic lines. You're giving **each Calling its own voice**: a Vanguard sounds like a soldier from a war that hasn't happened yet, a Huscarl like a hall-guard, a Chaplain like field liturgy, a Seepbound like someone the Chorus is generous with.

**Read `docs/homebrew/callings.md` first**, then `src/data/callings.js` (the twelve, their Paths, which Paths are Seep-touched), `src/data/action-voices.js` (the triggers, and the tone of the lines already there: short, said between dice rolls, never a speech) and `src/engine/action-voices.js` (how a line is chosen and how `{target}` is filled in).

Write exactly three files and nothing else:

1. `src/data/calling-voices.js`: the lines (data)
2. `src/engine/calling-voices.js`: reading them
3. `tests/calling-voices.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the data imports nothing; the engine imports `../data/calling-voices.js`, `../data/callings.js` and `../data/action-voices.js` (for `VOICE_TRIGGERS`). The test imports the engine, the data and those two.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original.** Nothing that belongs to the Halo games (none of its factions, species, characters, ships, vehicles, named weapons, places or catchphrases). History is everyone's. Gothic first. Respectful: this is a memorial. No slurs, no real-world faiths named, nothing cruel about the wounded.

## What to write

### `src/data/calling-voices.js`

`CALLING_VOICES`: for **each of the twelve Calling ids**, for **every trigger in `VOICE_TRIGGERS`** (`attack`, `hit`, `miss`, `critical`, `spell`, `heal`, `help`, `guard`, `dodge`, `dash`, `hurt`, `down`, `rally`, `retreat`, `interact`, `reveal`), **two to four lines**:

```js
vanguard:{ attack:['Contact front.', 'Moving up.'], hit:['…', '…'], … }
```

- Each line **under 60 characters**, said aloud between two dice rolls. Most are 2–6 words.
- `{target}` may appear (the one they're acting on, e.g. `'On my mark, {target}.'`); nothing else in braces.
- In the Calling's voice and age: the far-future Drawn (Vanguard, Relicborn, Archivist) clipped, procedural and a little tired; the ancient (Hoplite-minded Vanguard Paths aside, the Pankratiast) plain and proud; the medieval (Huscarl, Warden, Chaplain) oath and hall; the Barovian-born (Seepbound, Mistwalker) of the valley. The Herald sings or calls cadence. The Marksman counts.
- A Calling that doesn't cast still has `spell` lines (for an item, a scroll, a borrowed trick).

`SEEP_VOICES`: for **each Seep-touched Path** (the Paths with `seep:true`, keyed `'calling/path'`, e.g. `'vanguard/hollowed'`), **one or two extra lines** for each of `hurt`, `down`, `critical` and `rally`, where the Chorus slips in: "we" where "I" should be, a word that isn't theirs. Unsettling, never gory.

### `src/engine/calling-voices.js`

Export:
- `callingLines(callingId, trigger, pathId = null)` → the lines for that Calling and trigger, with the Seep-touched Path's extra lines added when there are any; `[]` for an unknown Calling or trigger
- `voiceOf(callingId)` → `{ id, lines:{ trigger:[…] } }` or `null`
- `validateCallingVoices()` → `[]` when all's well (a list of what's wrong otherwise)

### `tests/calling-voices.test.js`

Prove:
- all twelve Callings, every trigger, two to four lines each; every Seep-touched Path in `SEEP_VOICES` and nothing else, with one or two lines for each of its four triggers
- every line under 60 characters, no braces but `{target}`, no line repeated within a Calling
- none of these words appears anywhere (case-insensitive, whole words): Master Chief, Covenant, Cortana, Spartan, Sangheili, Unggoy, Jiralhanae, Gravemind, Forerunner, UNSC, ODST, Warthog, Pelican, Needler, Halo, Flood, Arbiter, Guilty Spark, Mjolnir
- `callingLines('vanguard', 'hurt', 'hollowed')` has more lines than `callingLines('vanguard', 'hurt')`; nothing throws on `null`, `{}` or `undefined`; `validateCallingVoices()` is `[]`

## What Claude will do with it

`src/engine/action-voices.js` will ask `callingLines` first for a hero with a Calling (a player's own written lines still win, as they do now), so a Huscarl and an Archivist side by side no longer sound alike, and the Hollowed starts saying "we".
