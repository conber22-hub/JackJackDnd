# Prompt for ChatGPT: inside the buildings

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/interiors` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and makes the village's doors open onto them.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a 3D virtual tabletop for a Curse of Strahd campaign. Its villages and towns are full of buildings, but they're solid blocks you can't go inside. Your module **generates the inside of a building** as a floor plan the app already knows how to build:
- the rooms
- the inner walls and doors
- the stairs up to a loft or down to a cellar
- the furniture

The building can be a cottage, a house, a longhouse, a hall, a barn, a hut, a tower, a windmill, a tavern, a shop, a church or a mansion.

Write exactly three files and nothing else:

1. `src/engine/interiors.js`: the generator
2. `src/data/interiors.js`: the building kinds, room programmes and furniture kits (data)
3. `tests/interiors.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM.
- **Seeded:** a small mulberry32 inside the engine from a `seed` string. No `Math.random`. The same input gives the same plan.
- **Pure:** return plain JSON.
- **Imports:**
  - The engine imports only `../data/interiors.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **The repository is public.** Invent every name and line yourself. Barovia, the Vistani and the campaign's people are fine.

## The app's layout format (what you return)

One floor of a building is a **layout**:

```js
{
  name: 'The Blue Water Inn — ground floor',
  W, H,                        // the floor's size in squares (5 ft each): the building plus a 2-square margin of solid rock round it
  rooms: [[x, y, w, h, type, name, notes, opts], …],   // rectangles of floor; opts may be { read:'…', dress:true }
  paths: [{ w:1, pts:[x0, y0, x1, y1, …] }, …],          // corridors: straight runs between points, w squares wide
  doors: [[x, y, state], …],                             // a door on an open square in a doorway; state 'closed' | 'open' | 'locked'
  props: [[kind, x, y, rot], …],                          // furniture: the top-left square of its footprint; rot 0–3 quarter turns
  up: [x, y] | null,                                     // the stairs up (to the floor above)
  down: [x, y] | null,                                   // the stairs down (to the cellar)
  exits: { up:'Up to the loft', down:'Down to the cellar' },
  fill: [[x, y], …],                                     // squares forced solid (inner walls you want thicker), rarely needed
}
```

- Squares not in a room or a path are solid wall. Rooms touching edge to edge become one open space, so **leave a one-square wall between rooms** and join them with a 1-wide path through a doorway (and put a door there if you like).
- Room `type` is one of: `chamber`, `entrance`, `safe`, `treasure`, `shrine`, `crypt`.
- **Furniture kinds** you may use, with their footprints at `rot` 0 (1×1 unless given; an odd `rot` swaps w and h):
  - **Tavern:** `table`, `longtable` (1×2), `chair`, `bench` (1×2), `stool`, `bar` (1×3), `shelf` (1×2), `hearth` (1×2), `kegs` (2×1), `barrel`
  - **Home:** `bed` (1×2), `wardrobe`, `desk`, `cradle`, `dollhouse`, `bookshelf` (1×2), `rug` (2×3), `chest`, `candelabra`, `cauldron`
  - **Holy:** `altar` (1×2), `pew` (1×2), `statue`, `banner`, `organ` (2×1), `throne`
  - **Work:** `anvil` (2×1), `forge` (2×1), `workbench` (2×1), `alchemy`, `sacks`, `crate`, `hay`, `trough` (1×2), `woodpile`
  - **The dead:** `coffin` (1×2), `sarcophagus` (1×2), `bones`, `cobweb`
- Furniture stands only on room squares, never in a doorway, never on the stairs, never on a door, and never overlapping. Wall pieces (`shelf`, `bookshelf`, `wardrobe`, `bar`, `hearth`, `organ`, `banner`) stand with their backs to a wall.

## What to write

### `src/data/interiors.js`

- **`KINDS`**: at least 12 building kinds:
  - `cottage`, `house`, `longhouse`, `hall`, `barn`, `hut`, `tower`, `windmill`
  - `tavern`, `shop`, `church`, `mansion`

  Each one gives:
  - its size range in squares
  - **its floors:** a cellar, a ground floor and upper floors, with a chance for each
  - **its programme per floor:** which rooms, how many, their relative sizes. For example, a tavern ground floor is a taproom (big), a kitchen, a snug and a cellar stair; its upper floor is guest rooms off a corridor.
- **`ROOMS`**: each room use, with:
  - its `type`
  - names (several, invented: "the Taproom", "the Snug", "the Still-room")
  - a furniture kit (props and how many)
  - two or three read-aloud lines, Barovian and grim: "A cradle by the cold hearth. No one has rocked it in a long time."

### `src/engine/interiors.js`

Export these:

- **`interior(kind, { w, h, seed, floors = 'all', name = null })`** → `{ kind, name, floors:[layout, …], order:['cellar', 'ground', 'upper', …] }`.
  - `w` and `h` are the building's outside footprint from the village, in squares (e.g. a house is 4×4).
  - Scale up for the inside: **the interior is the footprint × 3**, so a 4×4 house becomes a 12×12 ground floor. This keeps rooms playable on the 5-ft grid; the app treats the inside as its own map.
  - Each layout's `W` and `H` include the 2-square margin.
- **Floors join up:**
  - the ground floor's `down` lies at the same square as the cellar's `up`
  - the ground floor's `up` lies at the same square as the upper floor's `down`
- **The ground floor has the front door:** an `entrance` room against the building's south wall, with a door on the outside wall, and `exits.down` set to "Out to the street".
  - The app links that door to the village. Put the way out in the `down` field of the ground floor when there's no cellar, else add `out:[x, y]` to the layout.
- **Split rooms** by binary partition or a similar method, following the programme. Then:
  - join every room with doors
  - furnish from the kit, following the rules above
- **Everything joins up:**
  - every room square is reachable from the front door (or from the stairs on other floors) through rooms, paths and open doors
  - locked doors count as closed but passable

Also export:
- **`validateLayout(layout)`** → an array of problems:
  - a room outside the margin
  - rooms touching without a wall
  - a prop off a room
  - overlapping props
  - a prop on a door or the stairs
  - unreachable squares
  - stairs not on room squares
- **`KINDS`**: re-exported from the data.

## Tests (`tests/interiors.test.js`)

- **Every kind, 15 seeds:**
  - `interior()` returns floors whose layouts all pass `validateLayout`
  - layouts are JSON-serialisable
  - output is deterministic for a seed
- **Stairs line up** between floors.
- **A tavern's ground floor:**
  - has a room named from the taproom names, with a `bar`
  - has at least 3 rooms
- **A church** has an `altar` and `pew`s facing it.
- **Furniture rules:**
  - wall pieces touch a wall
  - nothing stands in a doorway, a square next to a door in the line of passage
- **Sizes:** a cottage is smaller than a mansion. Every room is at least 2×2 squares, and a programme's "big" room really is the biggest on its floor.
- **Speed:** 100 interiors in under 1 s.

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/interiors`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
