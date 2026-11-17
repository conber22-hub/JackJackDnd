# Prompt for ChatGPT: the fight, summed up

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/fight-summary` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. Fights play out square by square, like a tactics game on a pocket console: every swing has its d20, every hit its number over the figure. What's missing is the moment **after**. When the last wolf falls, the game should sum the fight up the way a good video game does on its victory screen: who did the damage, who took it and kept standing, the biggest hit, the luckiest roll, the closest call, and a line that says what kind of fight it was.

You write the counting and the words. The app records the fight as it happens, calls you when it's over, and Muse Code draws the victory screen from what you return (`docs/muse/brief-13.md`). You don't touch any of that.

Write exactly three files and nothing else:

1. `src/engine/fight-summary.js`: the counting and the choosing
2. `src/data/fight-summary.js`: the words (data)
3. `tests/fight-summary.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no timers, no `Math.random`: where a line is chosen from several, choose it from a seed (a small seeded generator over a string hash, such as mulberry32).
- **Pure:** plain JSON in and out. Never change what you're given.
- **Imports:** the engine imports only `../data/fight-summary.js`; the test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original writing.** The repository is public. Curse of Strahd's names are welcome, but don't copy any sentence from the book. Grim, dry and short; plain British-flavoured English, no modern slang, no exclamation marks except on a critical.

## What you are given

**The roster**, everyone who was in the fight:
```js
[{ id, name, side:'party' | 'foe', bid?: 'wolf', maxHp, hp /* at the end */, dead /* at the end */ }]
```

**The events**, in the order they happened (the app records these; `round` starts at 1):
```js
{ t:'attack', round, by, at, hit, crit, nat /* the d20 that counted, 1–20 */, dmg /* 0 on a miss */, kind:'melee'|'ranged'|'spell', weapon }
{ t:'damage', round, to, n, type, from? }     // damage that wasn't an attack: a spell's save, a breath, a fall (from: who caused it, if anyone)
{ t:'save', round, who, ability, ok, dc }
{ t:'heal', round, to, n, by }                 // a spell, a potion, Second Wind
{ t:'down', round, who, by? }                  // a hero or a companion dropped to 0 HP
{ t:'up', round, who }                         // back up
{ t:'kill', round, who, by? }                  // a foe dead
{ t:'cast', round, by, spell, level }          // level 0 for a cantrip
{ t:'act', round, who, k:'dash'|'dodge'|'disengage'|'stand' }
{ t:'feature', round, who, id }                // 'wind', 'surge', 'rage'…
{ t:'potion', round, by, to }
{ t:'flee', round, who }                       // a foe slipped away
```
An `attack` that hits has its damage in `dmg`; don't count it again as a `damage` event (the app never sends both for one blow).

**Extras:** `{ won:true|false, xp:120, loot:{ gp, sp, items:['Potion of Healing'] }, seed:'fight-17' }`.

## What to write

### `src/engine/fight-summary.js`

Export **`summarize(roster, events, { won, xp = 0, loot = null, seed = '' })`** → a summary:
```js
{
  rounds,                                   // the highest round seen (at least 1)
  won,
  per: { [id]: { dealt, taken, healed, healedOthers, hits, misses, crits, fumbles, kills, downs, biggest, spells, potions } },
  biggest: { by, at, n, weapon, crit } | null,   // the biggest single blow by anyone
  luckiest: { who, nat:20, count } | null,       // the most natural 20s (null if none)
  unluckiest: { who, nat:1, count } | null,      // the most natural 1s
  closest: { who, hp, maxHp } | null,            // the party member who ended standing on the least HP as a share of their max (only if under a third)
  mvp: { id, why } | null,                       // the party member who mattered most (see below); null if the party lost
  awards: [{ id, key, title, line }],            // two to four, never two for the same key; see below
  headline,                                      // one line for the top of the victory screen
  verdict,                                       // a short line for what kind of fight it was
  xp, loot,
}
```
- **`per`** has an entry for everyone in the roster, zeros included. `taken` counts what hit them (attacks and damage events); `healed` what they got back; `healedOthers` what they gave others.
- **The MVP**: score each party member by damage dealt, plus 1.5× healing given to others, plus 8 per kill, plus 4 per foe they kept off a fallen friend… keep it simple and explain the formula in a comment. `why` is a short reason in words, taken from `MVP_WHY` (for example, "Most of the killing, and none of it wasted.").
- **Awards** from `AWARDS` (in the data), each with a rule the engine checks: most damage dealt, most damage taken and still standing, most healing given, most crits, most kills, a kill with the last blow of the fight, went down and got back up, never touched, cast the most spells, missed the most (a gentle one), drank a potion at under a quarter HP… Choose the two to four that fit best (an order of preference in the data), and only award what really happened.
- **`headline`** from `HEADLINES`, by the shape of the fight: a rout (won in 1–2 rounds, the party barely hurt), a slog (6+ rounds), a near thing (someone went down, or ended under a fifth), a clean win, a loss, a fight the foes fled. Fill in names (`{mvp}`, `{foe}`).
- **`verdict`** from `VERDICTS` by the same shape: one short line ("Over before the wolves knew it had started.").

Export **`lines(summary, names)`** → an array of up to six short strings for a plain card when there's no victory screen (names: `{ [id]: name }`), for example `"Vasha · 34 damage · 2 kills"`, `"Biggest blow: Vasha's longsword, 14 (a critical)"`.

### `src/data/fight-summary.js`

- `AWARDS`: at least 14, `{ key, title, line, prefer }`. The title is a short name ("The Butcher", "Still Standing", "The Lamp", "Untouched", "Lucky", "Last Word"); the line says why, with `{n}` and `{name}` to fill in.
- `HEADLINES`: by shape (`rout`, `clean`, `slog`, `near`, `fled`, `lost`), at least 5 each.
- `VERDICTS`: by shape, at least 5 each.
- `MVP_WHY`: by what earned it (`damage`, `healing`, `kills`, `tank`), at least 4 each.

### `tests/fight-summary.test.js`

Prove, with small hand-made fights:
- `per` counts dealt, taken, healed, hits, misses, crits, fumbles and kills correctly, and has an entry for everyone
- `biggest`, `luckiest`, `unluckiest` and `closest` pick the right ones, and are null when nothing fits
- the MVP is the obvious one in an obvious fight, and null when the party lost
- awards are 2–4, never repeat a key, and are only given when true ("Untouched" never goes to someone who took damage)
- the headline shape: a 1-round win is a rout, an 8-round win a slog, a fight where a hero went down is a near thing, a loss is a loss
- the same input and seed give the same summary; nothing passed in is changed
- `lines` gives at most six strings, each under 70 characters
- the data meets its minimums, with no repeated lines in any list

## What Claude will do with it

The app records the events from the fight as it happens (the attacks, damage, healing, casts and the rest already pass through its event bus), calls `summarize` when the fight ends, and hands the summary to Muse's victory screen. On a phone at the table, `lines` goes on the end-of-fight card. Make the numbers exact and the words worth reading on the hundredth fight.
