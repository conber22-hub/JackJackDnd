# Prompt for ChatGPT: natural caverns

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/caverns` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in as a new kind of floor.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a 3D virtual tabletop for a gothic-horror D&D campaign. Its dungeon floors are built from rooms and tunnels on a square grid (5 ft a square). Even its caves are rooms with roughened edges.

Your module makes **true caverns**: open, organic underground spaces grown by cellular automata. The result should have:
- wide chambers joined by narrow necks
- side passages
- an underground lake with a shallow edge

The app turns your output into a floor its players walk through.
- Everything you need is here.
- No downloads; it works offline.

Write exactly three files and nothing else:

1. `src/engine/caverns.js`: the generator
2. `src/data/caverns.js`: presets (data)
3. `tests/caverns.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no three.js.
- **Seeded:** write a small mulberry32 inside the engine, seeded from the `seed` string (hash it). No `Math.random`. The same inputs give identical output.
- **Fast:** an 80×80 cavern in under 50 ms in Node.
- **Imports:**
  - The engine imports only `../data/caverns.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.

## The grid

- Square (x, y) is index `i = y*W + x`.
- Steps are **orthogonal** (N, E, S, W): a cavern must never depend on a diagonal squeeze.
- The outermost **2 squares** on every side are always rock.

## What to write

### `src/data/caverns.js`

Export **`PRESETS`**: named settings, each a set of options for `cavern()`.

At least:

| preset | what it is |
|---|---|
| `grotto` | small and tight |
| `hall` | a few big chambers |
| `warren` | many small chambers and twisting passages |
| `lake` | a cavern round a large underground lake |
| `chasm` | a long cavern split by a drop crossed in one place |

### `src/engine/caverns.js`

Export **`cavern(W, H, opts)`**. Options, all with sensible defaults:
- `seed`: a string
- `fill`: 0.42–0.5, the starting share of rock
- `steps`: 4–6 smoothing passes
- `minChamber`: the smallest region kept as a chamber, in squares
- `lake`: 0–1, how much water
- `chasm`: true or false
- `preset`: a name from `PRESETS`, whose values sit under any options given explicitly

It returns:

```js
{
  W, H,
  open: Uint8Array(W*H),     // 1 = open floor (walkable: dry ground and shallow water), 0 = rock, deep water or the drop
  deep: [i, …],              // deep water: not walkable, can be seen across
  shallow: [i, …],           // knee-deep water: walkable, difficult terrain (these squares are open)
  chasm: [i, …],             // a drop: not walkable, can be seen across
  bridge: [i, …],            // squares across the chasm that are walkable (open)
  chambers: [{ id, x, y, w, h, cx, cy, size }, …],  // the wide places: bounding box, a middle square that is open and dry, size in squares
  necks: [i, …],             // squares in the narrowest gaps between chambers (good spots for a door or an ambush)
  up: { x, y }, down: { x, y },  // the way in and the way on: open, dry, not in water, as far apart as the cavern allows
}
```

How to grow it:
1. Fill with random rock at `fill`, keeping the 2-square border solid.
2. Run `steps` passes of the 4-5 rule: a square becomes rock if 5 or more of its 8 neighbours are rock, and open if 3 or fewer are.
3. Find the open regions (orthogonal steps):
   - Keep the largest.
   - Join every other region bigger than `minChamber` to it with a winding tunnel 1–2 squares wide.
   - Fill in the rest (tiny pockets).
4. **Chambers:**
   - Split the open area into chambers at its narrow places. One way: a distance transform, where each open square's distance to the nearest rock. Find the local maxima, grow regions from them, and treat the squares where regions meet in narrow places as `necks`.
   - Every open square belongs to exactly one chamber.
   - Give each chamber its bounding box and an open, dry middle square near its centre.
5. **Water:**
   - With `lake > 0`, flood the open squares farthest from `up`, or the lowest-lying of a separate noise field.
   - Use deep water in the middle and a ring of shallow at its edge, up to about `lake` × 30% of the open area.
   - **The lake must never cut anything off:** every open square must still reach `up`, walking through dry ground and shallow.
6. **Chasm:**
   - With `chasm`, cut a band 1–3 squares wide across the cavern.
   - Leave **exactly one** crossing of 1–2 bridge squares, so the far side is reachable only by the bridge.
7. `up` and `down`: two dry open squares far apart. Pick the farthest pair by walking distance (two BFS passes are enough).

**Guarantees** (the tests check them):
- Every open square reaches `up` by orthogonal steps through open squares.
- `down` is open, dry and reachable.
- `deep` and `chasm` squares aren't open; `shallow` and `bridge` squares are.
- The lists don't overlap.

Also export:
- **`toAscii(c)`**: a string map for debugging and the tests. `#` rock, `.` floor, `~` deep, `,` shallow, `_` chasm, `=` bridge, `<` up, `>` down, one row per line.
- **`chamberAt(c, x, y)`**: the chamber containing a square, or `null`.

## Tests (`tests/caverns.test.js`)

- Each preset at 60×60 for 20 seeds:
  - one connected whole from `up`
  - the border is rock
  - the lists are well formed
  - the open area is 30–70% of the inner squares
- **Chambers:**
  - at least 3 for `hall` and 6 for `warren` at 60×60
  - every chamber's middle is open and dry
  - chambers cover every open square exactly once
  - `necks` are open squares between two chambers
- **Lake:**
  - with `lake: 0.5`, `deep` and `shallow` are non-empty
  - removing the deep squares never disconnects anything
  - the shallow ring touches the deep
- **Chasm:**
  - with `chasm: true`, `chasm` is non-empty and `bridge` has 1–2 squares
  - if a bridge square is made rock, `down` can no longer be reached from `up` (or the chasm doesn't separate them, and then the test checks the bridge is still the only crossing of the band)
- `up` and `down` are at least half the cavern's width apart by walking distance.
- The same seed gives identical output; a different seed differs.
- `toAscii` has `H` lines of `W` characters.
- 80×80 takes under 50 ms (assert under 300 ms for slow machines).

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/caverns`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
