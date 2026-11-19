# ChatGPT prompt: 💀 death saving throws

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/death-saves` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. You already wrote its fight scorecard (`src/engine/fight-summary.js`), its fight sounds, its battle music and how heavy each weapon feels. Today, a hero who drops to 0 hit points is simply **down** until somebody heals them: no death saving throws, no clock running, no reason to rush to a friend's side. You're writing **the rules of dying**, the engine the game will run every time a hero lies at 0 hit points, and the words it says.

Read `src/engine/fight-summary.js` first for the house style (pure, defensive about missing fields).

Write exactly three files and nothing else:

1. `src/engine/death-saves.js`: the rules
2. `src/data/death-saves.js`: the words (data)
3. `tests/death-saves.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no `Math.random`. Dice are rolled by the app and passed in.
- **Pure:** plain JSON in and out; never change an argument (return new objects).
- **Imports:** the engine imports `../data/death-saves.js` only. The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- The rules are the 5e SRD's (2014 and 2024 agree here). All words are original: Gothic, quiet, Barovian; never a joke.

## The state

A dying hero carries `dying = { s, f, stable, dead }`: successes 0..3, failures 0..3, whether they're stable, whether they've died. `null` or missing means "not dying".

## What to write

### `src/engine/death-saves.js`

Export:
- `startDying({ hpBefore, damage, maxHp, crit })` → when a blow takes a hero to 0: `{ dying, outcome, words }`. Massive damage: if what's left of the blow after reaching 0 (`damage - hpBefore`) is at least `maxHp`, they die outright (`outcome:'dead'`, `dying.dead:true`); otherwise `outcome:'down'`, `dying` all zeros.
- `deathSave(dying, d20, { bonus = 0, advantage = null } = {})` → the roll on the hero's turn: `{ dying, outcome, rolled, words }`. `d20` is the natural roll (or `[a, b]` with `advantage:true|false`, taking the higher or lower). A natural 20: `outcome:'rise'`: they regain 1 hit point and stop dying (`dying` back to `null`). A natural 1: two failures. `rolled + bonus` ≥ 10: one success, else one failure. Three successes: `outcome:'stable'` (`stable:true`, counts reset to 0). Three failures: `outcome:'dead'`. Otherwise `outcome:'success'` or `'failure'`. A stable or dead hero doesn't roll: return them unchanged with `outcome:'none'`.
- `hurtWhileDown(dying, { damage, maxHp, crit = false })` → damage taken at 0 hit points: `{ dying, outcome, words }`. A hit is one failure, a critical hit two (any attack that hits an unconscious creature from within 5 feet is a critical hit: the app passes `crit:true` then). Damage at least `maxHp` in one blow kills outright. A stable hero hurt starts dying again (stable off, counts from 0, then the failure).
- `healWhileDown(dying, amount)` → any healing above 0: `{ dying:null, outcome:'rise', words }` (they're conscious with that many hit points; the app adds them).
- `stabilize(dying, { total, auto = false })` → a Medicine check (DC 10) or a sure thing (`auto`: Spare the Dying, a healer's kit): `{ dying, outcome:'stable'|'failed', words }`.
- `dyingMarks(dying)` → `{ s:[true,false,false], f:[true,true,false], stable, dead }` for a display (three of each, filled in order).
- `isDying(dying)` → at 0 hit points, not stable, not dead.
- `wordsFor(outcome, seed)` → one line for that outcome, picked from the data by an integer `seed` (the same seed, the same line), with `{name}` in the line left for the app to fill.

### `src/data/death-saves.js`

`DEATH_WORDS`: lines for each outcome: `down`, `success`, `failure`, `two` (a natural 1 or a critical while down), `rise` (a natural 20, or healing), `stable`, `dead`, `hurt` (struck while down), `failed` (a stabilize missed). At least **four** lines each, under 70 characters, each using `{name}` at most once, in the third person (*"{name} drags in a breath, and holds it."*, *"Cold creeps up {name}'s fingers."*). No two lines the same anywhere.

### `tests/death-saves.test.js`

Prove:
- massive damage kills, and a smaller blow downs
- 10 succeeds and 9 fails (and `bonus` counts); a natural 1 is two failures; a natural 20 rises; advantage and disadvantage take the right die
- three successes stabilize, three failures kill; counts never pass 3; a stable or dead hero doesn't roll
- hurt while down: one failure, two on a crit, death at `maxHp` damage; a stable hero hurt starts dying again
- healing ends dying; stabilize at 10, not 9, and always with `auto`
- no function changes its input, none throws on `null`, `{}` or `undefined`
- every outcome has at least four lines, each under 70 characters, `{name}` at most once, none repeated; `wordsFor` is the same for the same seed

## What Claude will do with it

`src/game/combat.js` will start dying when a hero drops to 0 instead of marking them dead; on their turn, the Wanderer and the table will roll their death save (with Muse's moment on screen: the die, the hearts and skulls filling); a blow on a downed hero, healing, Spare the Dying and a Medicine check will go through these rules; and the captions and the players' phones will say the words. Make a player shout "someone get to her!" across the table.
