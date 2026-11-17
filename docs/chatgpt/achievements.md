# Prompt for ChatGPT: achievements

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/achievements` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. A hero walks the valley of Barovia like the hero of an old pocket-console adventure: villages, roads, fights, potions, level-ups. What it doesn't have yet is **achievements**: the little titles a game gives you for the things you did, some for persistence, some for luck, some for doing something odd. A banner slides in ("🏆 First Blood"), and a shelf in the menu shows them all, the locked ones as hints.

You write the list and the engine that watches what happens and says what's been earned. The app feeds you its events, and Muse Code draws the banner and the shelf (`docs/muse/brief-13.md`). You don't touch any of that.

Write exactly three files and nothing else:

1. `src/engine/achievements.js`: the tracker
2. `src/data/achievements.js`: the achievements (data)
3. `tests/achievements.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no timers, no `Math.random`, no `Date`. (The app passes a day number where you need time.)
- **Pure:** plain JSON in and out, and never change what you're given: return a new progress object.
- **Imports:** the engine imports only `../data/achievements.js`; the test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original writing.** The repository is public. Curse of Strahd's names are welcome (Barovia, Vallaki, Krezk, the Vistani, Ireena, Ismark, Madam Eva, Strahd, the Amber Temple, Argynvostholt, Old Bonegrinder, Lake Zarovich…), but don't copy any sentence from the book. Titles short and good; descriptions one line, dry, a little grim.

## The events

The app sends one event at a time. Fight events (`round` from 1):
```js
{ t:'attack', by, at, byParty:true|false, hit, crit, nat /* the d20, 1–20 */, dmg, kind:'melee'|'ranged'|'spell', weapon }
{ t:'kill', who, bid /* 'wolf', 'zombie', 'vampire-spawn'… */, by, byParty }
{ t:'down', who, hero:true|false }     // a hero (hero:true) or a companion dropped to 0
{ t:'heal', to, n, by }
{ t:'potion', by, to, hpBefore, maxHp }
{ t:'cast', by, spell, level }
{ t:'feature', who, id }               // 'wind', 'surge', 'rage'…
{ t:'act', who, k:'dash'|'dodge'|'disengage'|'stand' }
{ t:'fightStart', foes:[bid…], surprise:'none'|'party'|'foes' }
{ t:'fightEnd', won, rounds, heroTaken /* damage the hero took */, heroHp, heroMax, partyDowns, fled /* foes slipped away */ }
```
Everything else:
```js
{ t:'arrive', place /* 'village', 'vallaki', 'krezk', 'tser-pool', 'castle'… */, day }
{ t:'travel', from, to, hours }
{ t:'level', n }
{ t:'rest', kind:'short'|'long', where:'road'|'inn'|'camp' }
{ t:'find', kind:'glint'|'read'|'search'|'page', page? }
{ t:'gold', gp /* the purse now */ }
{ t:'join', who /* a companion */ }
{ t:'leave', who }
{ t:'quest', id, done }
{ t:'talk', who, check?:'Persuasion'|'Deception'|'Intimidation'|'Insight', ok? }
{ t:'death' }                          // the hero fell and the run carried on from the last rest
```

## What to write

### `src/data/achievements.js`

`ACHIEVEMENTS`: **at least 40**, each:
```js
{ id:'first-blood', name:'First Blood', text:'Your first kill in the valley.', icon:'🩸', tier:'bronze'|'silver'|'gold', hidden:false, goal:1, group:'fighting'|'luck'|'the-road'|'people'|'odd' }
```
- `goal` is how many times it takes (1 for a one-off; 10 for "kill ten wolves").
- `hidden:true` for a few surprising ones: the shelf shows "???" and a hint (`hint`) until they're earned.
- Spread them: fighting (first kill, 10 and 50 kills, a kill with a spell, a kill with a thrown weapon, three kills in one fight, a fight won without the hero taking a scratch, a fight won in the first round, a fight that lasted ten rounds), luck (a natural 20, two in one fight, a natural 1 that still… no: a natural 1 at the worst moment, a crit that kills, surviving on 1 HP), the road (every town reached, 100 hours on the road, a night camped on the road, Tser Pool, the castle gates seen), people (a companion joins, a companion leaves you, a Persuasion that works, Madam Eva's tent), and the odd (three potions in one fight, ten Dodges, running from a fight, dying once and carrying on).

### `src/engine/achievements.js`

Export:
- `fresh()` → an empty progress object (plain JSON, small enough to save).
- `track(progress, event)` → `{ progress, unlocked:[{ id, name, text, icon, tier }] }`: the new progress and anything earned by this event (most events earn nothing). Keep whatever per-fight counts you need (kills this fight, potions this fight, natural 20s this fight) and reset them on `fightStart`.
- `shelf(progress)` → every achievement, in its group, `{ id, name, text, icon, tier, got:bool, n, goal, pct, hidden }`: a hidden one not yet got has `name:'???'` and its `hint` as `text`.
- `score(progress)` → `{ got, of, bronze, silver, gold }`.

Rules:
- An achievement is earned once. `track` never returns it again.
- Counting achievements count only what their text says (kills of wolves only count wolves: the app sends `bid`; anything with "wolf" in its id counts as a wolf).
- An unknown event, or one missing fields, earns nothing and doesn't throw.

### `tests/achievements.test.js`

Prove:
- the first kill earns First Blood, and the second kill doesn't earn it again
- a counting achievement unlocks exactly at its goal
- a fight won with `heroTaken:0` earns the untouched one; a fight lost doesn't
- per-fight counts reset on `fightStart` (two natural 20s in two fights don't earn "two in one fight")
- `shelf` shows hidden ones as `???` until earned, then by name; `pct` goes 0 → 100
- unknown and malformed events don't throw and earn nothing
- `track` doesn't change the progress it's given, and progress survives `JSON.parse(JSON.stringify(…))`
- there are at least 40, ids are unique, every one has a valid tier, group and icon, and goals are whole numbers ≥ 1

## What Claude will do with it

The app keeps the progress in the Wanderer's save, sends `track` the events it already sees (fights, travel, level-ups, finds, quests), and for each unlock shows Muse's banner with a chime. Make the list something a player would scroll through on the bus home.
