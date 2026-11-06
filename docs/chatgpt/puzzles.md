# Prompt for ChatGPT: puzzle rooms

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/puzzles` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and builds the puzzles into the 3D rooms, with the controls on the players' phones.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop for a gothic-horror D&D campaign (Curse of Strahd). The DM wants **puzzle rooms** the players solve together at the table, each from their own phone:
- levers to pull in the right order
- statues to turn
- dials to set
- a door that asks a riddle
- mirrors to turn until a beam of light finds its mark

Your module is the pure logic: each puzzle as a small **state machine**. The app draws it and sends the players' moves to it.

Write exactly three files and nothing else:

1. `src/engine/puzzles.js`: the engine
2. `src/data/puzzles.js`: the puzzle kinds, clues and riddles (data)
3. `tests/puzzles.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM.
- **Seeded:** a small mulberry32 inside the engine, seeded from a `seed` string. No `Math.random`.
- **Pure:** never change the state you're given; return a new one. States are plain JSON (no functions, no classes, no `Map`/`Set`), because the app saves them and sends them over the network.
- **Imports:**
  - The engine imports only `../data/puzzles.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **The repository is public.** Write every riddle, clue and line yourself, in a gothic-horror voice. Don't copy riddles from books or games; well-known folk riddles must be reworded in your own words.

## What to write

### `src/data/puzzles.js`

**`KINDS`**: at least these six, each `{ id, name, blurb, difficulty:[1,2,3] }`.

| id | the puzzle |
|---|---|
| `levers` | 3–6 levers: pull them in the right order. A wrong pull resets them all with a grinding sound (and maybe a trap). |
| `statues` | 3–5 statues, each facing N/E/S/W. Turning one also turns its neighbours (a lights-out variant). All must face the altar. |
| `dials` | 3–4 dials of 6 symbols each, set to a combination hinted by clues in the room. |
| `riddle` | a door with a carved face that asks a riddle. Accept the answer and its listed synonyms, case- and punctuation-blind. |
| `mirrors` | a small grid (5×5 to 7×7) of fixed walls and turnable mirrors (`/` or `\`). A beam enters from one edge and must reach the target. |
| `weights` | a scale with a set of objects of hidden weights; place some on the pan to match a given weight exactly. |

Also:
- **`RIDDLES`**: at least 12 `{ text, answer, also:[…], hint }`. Answers like a shadow, a candle, a grave, a key, the mist, time, silence, a coffin, a name, an echo, blood or a mirror.
- **`CLUES`**: for `dials` and `levers`, phrases that encode the solution, written to be read aloud from the room ("the third bell is the first to ring"). Generate them from the solution with templates.
- **`SYMBOLS`**: the dial symbols: 🌙 moon, 🦇 bat, 🗝 key, 🕯 candle, 💀 skull, 🌹 rose, ⚰ coffin, 👁 eye.
- **`FAIL`**: what a wrong move can set off, by difficulty. Use app trap kinds: `darts`, `pit`, `gas`, `blade`, `alarm`, `none`.

### `src/engine/puzzles.js`

Export these:

- **`makePuzzle(kind, { seed, difficulty = 2 })`** → a state:
  ```js
  { kind, seed, difficulty, solved:false, moves:0, fails:0, ...kind-specific fields, secret:{ solution, … } }
  ```
  `secret` holds everything the players mustn't see.
  - **Every generated puzzle must be solvable.** For `statues`, generate by scrambling a solved state with legal moves. For `mirrors`, place the mirrors so a solution exists, then turn some.
- **`act(state, action)`** → `{ state, event, text }`:
  - Actions:
    - `{ type:'pull', lever }`
    - `{ type:'turn', statue }`
    - `{ type:'set', dial, symbol }`
    - `{ type:'answer', text }`
    - `{ type:'rotate', x, y }`
    - `{ type:'place', item }` and `{ type:'remove', item }`
    - `{ type:'check' }`: for dials and weights, "try it"
  - `event` is one of:
    - `'moved'`
    - `'wrong'`: a wrong move with nothing worse
    - `'reset'`
    - `'trap'`: a wrong move sets off `FAIL`; give the trap kind in `state.lastTrap`
    - `'solved'`
    - `'invalid'`: a bad action; the state comes back unchanged
  - `text` is one line to read aloud, e.g. "The second lever drops with a clank. Something below the floor answers."
  - Once a puzzle is solved, every action is `'invalid'`.
- **`view(state, { dm = false })`** → what to draw:
  - For players, no `secret` and nothing that gives the solution away. Include the clues, the current positions, and the beam's current path for mirrors (computed: the squares it passes and where it stops).
  - For the DM, the solution too.
- **`hint(state, level)`** → a hint, from vague (1) to nearly the answer (3), for a successful Investigation or Wisdom check.
- **`beamPath(grid, entry)`** → the squares the beam passes and where it ends (mirrors). Export it for the tests.
- **`KINDS`**: re-exported from the data.

## Tests (`tests/puzzles.test.js`)

- Every kind at every difficulty for 30 seeds:
  - `makePuzzle` gives JSON-serialisable state: `JSON.parse(JSON.stringify(s))` deep-equals `s`
  - it isn't already solved
  - it can be solved by applying the solution from `secret` with `act`
- **Purity:** `act` never changes the state passed in (deep-freeze it in the test and check nothing throws).
- **Levers:** a wrong pull resets the order; the right order solves.
- **Statues:** turning one turns its neighbours; from the scrambled state, the stored solution solves.
- **Riddles:**
  - the answer and its synonyms work regardless of case and punctuation ("A shadow!" and "shadow" both)
  - a wrong answer counts a fail
  - `RIDDLES` has at least 12, with no duplicate answers
- **Mirrors:**
  - `beamPath` follows `/` and `\` correctly on a hand-built 3×3 grid
  - a solved state's beam ends at the target
- **Weights:** some subset of the items matches the target weight.
- **`view`:**
  - for players, it never contains `secret`, and the solution doesn't appear in it for levers or dials (check the serialised view doesn't contain the solution array)
  - for the DM, it does
- **`hint`:** levels 1–3 give three different strings.
- **Invalid actions** return the state unchanged with `event:'invalid'`.

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/puzzles`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
