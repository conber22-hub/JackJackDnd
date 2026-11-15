# Prompt for ChatGPT: the coach (a tip at the right moment)

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/coach` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and shows the tips on the players' handhelds.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop for a Curse of Strahd campaign. Every player now plays from their phone held like a pocket console: a D-pad, A B X Y, L and R, and Select / View / Start, with the map on the phone's screen. Some players have never played D&D, and some have never held a game controller. Your module is **the coach**: it watches what's happening and, now and then, offers *one* short tip that fits the moment. For example: "Your turn. A strikes the one with the 🎯. B ends your turn." It never repeats itself, and it goes quiet once the player clearly knows.

Write exactly three files and nothing else:

1. `src/engine/coach.js`: the coach
2. `src/data/coach.js`: the tips (data)
3. `tests/coach.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no timers, no `Date.now()` (time comes in as a number).
- **Pure:** plain JSON in and out. No `Math.random`; where a choice is needed, take the first by priority.
- **Imports:**
  - The engine imports only `../data/coach.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **The repository is public.** Write every tip yourself, in plain, warm, slightly gothic British English: short (under 110 characters), second person, no jargon without a hint. Curse of Strahd's places and names (Barovia, the Count, the Mists) are welcome; don't copy any book's text.

## What it sees: a snapshot

The app builds this each time something changes and asks the coach. Every field may be missing, so treat missing as false, 0 or empty.
```js
{
  now: 125000,                 // ms, from the app's clock
  mode: 'handheld',            // 'handheld' | 'pad' (a controller) | 'keys' (a keyboard) | 'touch' (the classic screen)
  where: 'table',              // 'table' (a seated player) | 'wander' (playing alone)
  fight: true, myTurn: true, round: 1,
  hp: 9, maxHp: 24, down: false, conditions: ['prone'],
  moveLeft: 30,                // ft. this turn
  target: { name:'Zombie', inReach: false, seen: true },   // or null
  foesSeen: 2, alliesDown: 0,
  hasSpells: true, slotsLeft: 2, cantrips: 1, hasHealing: true, potions: 1,
  onStairs: 'down',            // 'down' | 'up' | null
  doorNear: { open:false, locked:false },                 // or null
  cardUp: false, menuOpen: false, sheetOpen: false,
  waitingOnDM: false,          // a request is with the DM
  justDid: 'strike',           // the last thing the player did: 'step', 'strike', 'cast', 'endTurn', 'menu', 'sheet', 'tap', 'none'
  idleMs: 40000,               // since the player last pressed anything
  sessionMs: 600000            // since they sat down tonight
}
```

## What it says: a tip

```js
{ id:'turn-strike', text:'Your turn. {A} strikes the one with the 🎯 · {B} ends your turn.', buttons:['A','B'], priority:80 }
```
- `{A}`, `{B}`, `{X}`, `{Y}`, `{L}`, `{R}`, `{SELECT}`, `{START}`, `{VIEW}` and `{DPAD}` are placeholders that `fill` turns into the right words for the player's `mode`:

  | mode | {A} | {B} | {L} / {R} | {DPAD} |
  | --- | --- | --- | --- | --- |
  | handheld | A | B | L / R | the D-pad |
  | pad | Ⓐ | Ⓑ | LB / RB | the stick |
  | keys | Space | Esc | Shift+Tab / Tab | WASD |
  | touch | tap Strike | tap End turn | tap a foe | tap the ground |

  Fill in X, Y, SELECT, START and VIEW the same way.

## What to write

### `src/data/coach.js`

- **`TIPS`**: at least 45, each `{ id, when, text, priority, once = true, cooldownMs, after = [] }`.
  - `when` is a plain condition object the engine checks against the snapshot: for example `{ fight:true, myTurn:true, 'target.inReach':false }`, or `{ 'hp/maxHp':{ lt:.3 }, hasHealing:true }`. Define the small vocabulary you need in the engine (equals, `lt`, `gt`, `in`, ratios like `'hp/maxHp'`) and use only that.
  - `after`: ids of tips that must have been shown first (to teach in order).
  - **Cover at least:**
    - first sitting down
    - walking
    - the camera (L/R, View)
    - the menu and the sheet
    - stairs, doors, cards
    - **a first fight:**
      - your turn, out of reach (walk closer)
      - in reach (strike)
      - several foes (L/R picks)
      - spells (X), a slot spent, cantrips cost nothing
      - healing an ally who's down, your own low health (a potion, or Y → Second Wind and the like)
      - prone (Stand up in Y)
      - Dash, Disengage, Dodge
      - ending a turn, waiting while it's someone else's
    - "the DM decides", waiting on the DM
    - being idle a long time
    - the Gaze and the Mists (one or two flavour lines)
    - the pixel screen and shells (late in the night, once)
  - Some tips are for `where:'wander'` only (no DM there: the game decides) and some for `'table'` only.
- **`COOLDOWN_MS`**: the default gap between any two tips (say 45 s), and `FIGHT_COOLDOWN_MS` (say 20 s).

### `src/engine/coach.js`

Export:
- `test(when, snapshot)` → boolean: does a condition object hold?
- `nextTip(snapshot, memory = {})` → `{ tip, memory }` (`tip` is null when nothing is due).
  - `memory` is `{ seen:{ id:timesShown }, lastAt, muted, learnt:{ skill:true } }`, plain JSON. The app keeps it per device and hands it back each time; return a new object and never mutate the old one.
  - **Rules:**
    - nothing while `cardUp`, `menuOpen` or `sheetOpen`
    - respect the cooldowns
    - a `once` tip never twice
    - the highest priority that holds wins (ties: the order in `TIPS`)
- `learn(memory, action)` → new memory: an action the player did (`'strike'`, `'cast'`, `'endTurn'`, `'aim'`, `'camera'`, `'sheet'`, `'menu'`, `'stairs'`, `'door'`, `'dash'`…). It marks the skill as learnt, and tips that teach a learnt skill stop (give tips a `teaches:'strike'` field).
- `mute(memory, on = true)` → new memory (the player can say "no more tips").
- `fill(text, mode)` → the text with its placeholders filled for the mode.
- `reset()` → a fresh memory.

### `tests/coach.test.js`

Prove:
- every tip has a unique id, its `when` keys are all in the engine's vocabulary, its text is under 110 characters once filled for each mode, and every placeholder in it is known
- every `after` id exists, and there are no cycles
- first seating gives the welcome tip, then nothing until the cooldown passes
- in a fight, on your turn, out of reach: the "walk closer" tip; in reach: the "strike" one
- a `once` tip never comes twice
- `learn(…, 'strike')` silences strike tips
- `mute` silences everything
- `fill` gives "Space" for `{A}` in keys mode and "A" in handheld mode
- nothing while a card is up
- `nextTip` doesn't mutate the memory it's given
- the same snapshot and memory always give the same answer

## What Claude will do with it

Build the snapshot from the game in `src/ui/tablehh.js` and `src/ui/wander.js`, show the tip as a small line on the handheld's screen (a tap or any press puts it away), keep the memory in `localStorage`, and add "Tips: on/off" to the menu. You don't need to do any of that: just make the engine and data solid.
