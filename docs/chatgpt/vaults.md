# Prompt for ChatGPT: set-piece rooms (vaults)

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/vaults` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the dungeon generator.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a 3D virtual tabletop (three.js) for a gothic-horror D&D campaign (Curse of Strahd). Its dungeon generator lays out rooms on a square grid (each square is 5 ft) and joins them with tunnels. The rooms come out tidy but plain. Your module adds **vaults**: hand-designed set-piece rooms, drawn as small ASCII maps, which the generator stamps into a room of the right size. Examples are a crypt lined with coffin niches, a flooded shrine crossed by stepping stones, or a chapel with pews facing an altar.
- Everything you need is here.
- The app works offline, and nothing is downloaded.

Write exactly three files and nothing else:

1. `src/engine/vaults.js`: the engine
2. `src/data/vaults.js`: the vault designs (data)
3. `tests/vaults.test.js`: tests

## Hard rules

- **Modern ES modules** (`import` / `export`), Node 22. No dependencies.
- **No DOM, no three.js.** Plain objects and arrays.
- **Every random number from the `rng` you're given** (a function returning 0 ≤ x < 1). No `Math.random`.
- **Pure:** never change the floor or room objects you're given. Return what to change.
- **Imports:**
  - The engine imports only `../data/vaults.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`, run by `node --test tests/*.test.js`.
- **The repository is public.** Write all names and read-aloud text yourself. Don't copy any published adventure's text. The setting's names (Barovia, Strahd, the Vistani) are fine.

## The app's data you'll work with

### A floor
`f` is an object:
- `W` and `H`: the floor's width and height in squares.
- `grid`: an array of length `W*H`. Square (x, y) is index `i = y*W + x`.
- Each square holds a code:
  - `0`: rock
  - `1`: room floor
  - `2`: tunnel
  - `3`: stairs down
  - `4`: stairs up
- Codes 1–4 can be walked on.
- `up` and `down` are `{x, y}` or `null`: where the stairs are.
- `rooms`: an array of rooms.

### A room
`{ id, x, y, w, h, cx, cy, type, shape }`:
- `x, y, w, h`: its box. Its squares are x..x+w-1 and y..y+h-1.
- `cx, cy`: its middle square.
- `type` is one of: `chamber`, `entrance`, `crypt`, `shrine`, `library`, `barracks`, `treasure`, `prison`, `nest`, `flooded`, `sanctuary`, `lair`.
- `shape`: if it's set, the room isn't a rectangle. **Only stamp vaults into rooms with no `shape`.**

### Props
Props are furniture: `{ k, x, y, rot }`.
- `k` is the kind. `(x, y)` is the top-left square of its footprint.
- `rot` is 0–3 quarter turns. An odd `rot` swaps the footprint's width and height.
- Kinds you may use, with their footprints at `rot` 0 (1×1 unless given):
  - **Furniture:** table, longtable (1×2), chair, bench (1×2), stool, shelf (1×2), bookshelf (1×2), desk, wardrobe, bed (1×2), rug (2×3), chest, barrel, crate, sacks
  - **Holy things:** altar (1×2), pew (1×2), candelabra, statue, throne, banner, armor, organ (2×1), brazier, saltline, shrine
  - **The dead:** coffin (1×2), sarcophagus (1×2), bones, gravestone
  - **Prison:** cage, rack (1×2)
  - **Mine:** minecart, rails, ore, beam
  - **Ruin:** pillar, rubble, cobweb, fungus, puddle, well (2×2)
  - **Other:** cauldron, alchemy, bloomgrowth, vines (1×3)

### Ground under a square
Besides floor and rock, a square can be:
- **filled:** made solid rock
- **shallow:** walkable water, knee-deep
- **rough:** difficult terrain
- **chasm:** a drop: not walkable, can't be crossed

## What to write

### `src/data/vaults.js`

Export **`VAULTS`**: an array of at least 14 designs. Each one:

```js
{
  id: 'coffin-niches',
  name: 'The Niche Crypt',
  themes: ['undercroft', 'chapel', 'ossuary', 'castle', 'manor'],  // which floor looks it suits ('*' for any)
  types: ['crypt', 'chamber'],                                    // which room types it suits
  read: 'Your own one or two sentences: what the party sees on walking in.',
  map: [
    '#.#.#.#',
    '.......',
    '.C.C.C.',
    '.......',
    '...A...',
  ],
  legend: { C: { k:'coffin', rot:0 }, A: { k:'altar', rot:1 } },
}
```

Map characters:

| char | meaning |
|---|---|
| `.` | floor |
| `#` | solid rock (filled) |
| `~` | shallow water |
| `:` | rough ground |
| `_` | chasm |
| `!` | must stay open: a square the engine may never fill or block (a path, a doorway gap) |
| a letter | the top-left square of a prop from `legend` (the rest of its footprint should be `.`) |

Floor looks (themes) are: `undercroft`, `silver`, `hands`, `undertow`, `chapel`, `ossuary`, `womb`, `manor`, `wreck`, `mill`, `castle`, `burned`, `cellar`, `dungeon`.

Ideas (use these or your own, at least 14 in all, from 5×5 to about 11×9):
- a crypt with coffin niches
- a flooded shrine with stepping stones to an altar
- a collapsed library (bookshelves, rubble, one fallen into a chasm)
- an ossuary of bone-lined alcoves
- a chapel of pews facing an altar between candelabras
- a pit room with a ledge round a central chasm
- a well room
- a row of cells with cages
- a ritual circle of salt with braziers at the points
- a mine gallery with rails and a broken cart
- a throne room with pillars
- an alchemist's workroom
- a flooded cellar of floating barrels
- a nest of fungus and bloomgrowth round a pool

### `src/engine/vaults.js`

Export these:

- **`parseVault(v)`** → `{ id, w, h, cells, props }`:
  - `cells` is an array of `w*h` single characters: the map with each prop letter replaced by `.`.
  - `props` is `[{ k, x, y, rot }]` in the vault's own coordinates.
  - A bad design throws a `TypeError`: ragged rows, an unknown character, or a prop letter missing from `legend`.

- **`transformVault(p, { turn = 0, flip = false })`** → a new parsed vault:
  - turned by `turn` quarter turns clockwise, then mirrored left-to-right if `flip`
  - Turning swaps `w` and `h`.
  - Each prop's `rot` turns with it, and its `(x, y)` stays the top-left of its new footprint.
  - Footprints use this table (and odd rots swap w and h): `{ longtable:[1,2], bench:[1,2], shelf:[1,2], bookshelf:[1,2], bed:[1,2], rug:[2,3], altar:[1,2], pew:[1,2], organ:[2,1], coffin:[1,2], sarcophagus:[1,2], rack:[1,2], well:[2,2], vines:[1,3] }`. Anything else is 1×1. Put this table in the engine as `FOOTPRINTS`.

- **`fits(room, p)`** → boolean: true when `p.w <= room.w && p.h <= room.h` and the room has no `shape`.

- **`pickVault(room, themeId, rng, { used = [] } = {})`** → a vault from `VAULTS`, or `null`:
  - It must match the theme (or `'*'`) and the room's type.
  - Some turn or flip of it must fit the room.
  - Skip ids in `used`, so a floor doesn't repeat itself.
  - Choose with `rng`, and return `null` about half the time even when one fits, so most rooms stay plain.

- **`stampVault(f, room, v, rng)`** → `{ id, filled, shallow, rough, chasm, props, read }` | `null`:
  1. Try the vault's 8 orientations (4 turns × flip) in an order shuffled by `rng`, and each placement of it inside the room's box (offset when it's smaller than the room). Keep the first that passes the checks below.
  2. Outside the vault's own rectangle, leave the room as it is.
  3. `filled`, `shallow`, `rough` and `chasm` are arrays of grid indices.
  4. `props` are in floor coordinates, `{ k, x, y, rot }`.
  5. `read` is the vault's read-aloud text.

  The checks:
  - **Entrances stay open.** An entrance is a square in the room's box with an orthogonal neighbour outside the box that can be walked on (a tunnel or a doorway). Entrances, and the stairs squares if they're in the room, must end up open: not filled, not chasm, and not under a prop.
  - **Everything still joins up.** Every entrance, the stairs squares in the room, and the room's middle `(cx, cy)` must reach each other by orthogonal steps through open squares inside the room. Open means floor, shallow or rough; not filled, not chasm, not under a prop.
  - **Only real floor.** Never put a prop, water, rough ground or chasm on a square that isn't room floor (code 1) in `f.grid`.
  - **`!` squares stay open.**
  - If no placement passes, return `null`.

- **`KINDS`**: the list of prop kinds the vaults use. Every one must be among the kinds listed above.

## Tests (`tests/vaults.test.js`)

Build small floors by hand in the test (a `grid` array and one room). For example, a 12×10 floor with one 9×7 room at (1, 1), a tunnel square at (5, 0) above it as its entrance, and `up` / `down` null.

- every vault in `VAULTS` parses, its rows are even, each prop letter is in its legend, and its footprints fit inside the map
- `transformVault`:
  - 4 turns give the original back
  - a turn swaps `w` and `h`
  - a 1×2 coffin at `rot:0` turned once has `rot:1` and still sits inside the map
- `stampVault` on the hand-built floor, for every vault that fits:
  - the entrance square is open
  - the middle is open
  - they join up
  - no prop overlaps another
  - nothing lands outside the room's box
- with an entrance on each side of the room, a vault that would block one is turned or moved, or returns `null`; never a blocked entrance
- the same `rng` seed gives the same result; a shaped room (`shape:'round'`) gets `null` from both `pickVault` and `stampVault`
- `pickVault` respects themes, types and `used`

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/vaults`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
