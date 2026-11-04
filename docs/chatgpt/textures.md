# Prompt for ChatGPT: materials that tile (stone, wood, earth)

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/texgen` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the 3D renderer.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a 3D virtual tabletop (three.js) for a gothic-horror D&D campaign. Today its floors and walls are flat painted patterns. Your module generates **physically based material maps** in pure JavaScript, so the renderer can give every floor and wall real depth: an albedo, a height, a normal map, roughness and ambient occlusion, all tiling seamlessly.
- Everything you need is here.
- Nothing is downloaded: the app works offline.

Write exactly three files and nothing else:

1. `src/engine/texgen.js`: the generator
2. `src/data/materials.js`: the material recipes (data)
3. `tests/texgen.test.js`: tests

## Hard rules

- **Modern ES modules** (`import` / `export`), Node 22. No dependencies.
- **No DOM:** no `document`, no canvas, no `ImageData`, no three.js. Just typed arrays, so it runs in Node tests and in a browser worker alike.
- **Every random number from a seeded generator.** Write a small mulberry32 inside the engine from the `seed` you're given, so the same seed gives the same pixels. No `Math.random`.
- **Imports:**
  - The engine imports only `../data/materials.js`.
  - The test imports the engine and the data.
- **Seamless tiling:** every map wraps; the left edge continues the right, the top continues the bottom. Make every noise, cell pattern and brick layout **periodic** over the texture size.
- **Fast enough:** one 256×256 material (all its maps) in well under 200 ms in Node.
- **Tests** use `node:test` and `node:assert/strict`, run by `node --test tests/*.test.js`.

## What to write

### `src/engine/texgen.js`

Export these:

- **The building blocks**, all periodic on a `size`×`size` grid, returning `Float32Array(size*size)` in 0..1:
  - `valueNoise(size, { freq, seed })`
  - `fbm(size, { freq, octaves, gain, lacunarity, seed })`
  - `worley(size, { cells, seed, metric:'f1'|'f2-f1' })`: cellular; `f2-f1` gives cracks and cell edges
- **`bricks(size, { rows, cols, mortar, jitter, seed })`** → `{ height:Float32Array, id:Int32Array }`
  - Running-bond courses; each brick's id lets you vary its tone.
  - Mortar is low, brick faces high with a soft bevel.
- **`stones(size, { cells, gap, seed })`** → `{ height, id }`: irregular flagstones or cobbles from Worley cells, with gaps between them.
- **`planks(size, { boards, seed })`** → `{ height, id }`
  - Boards along one axis, staggered ends, a grain running along each board (stretched fbm), and a dark seam between boards.
- **`normalFromHeight(height, size, { strength })`** → `Uint8ClampedArray(size*size*4)`
  - A tangent-space normal map (OpenGL convention: +Y up, +Z out of the surface), wrapping at the edges, alpha 255.
- **`makeMaterial(kind, { size = 256, seed = 1 })`** → `{ size, albedo, height, normal, roughness, ao }`:
  - `albedo`: `Uint8ClampedArray` RGBA, **greyscale with slight warmth**. The app tints it by the theme's colour, so keep the hue near neutral and put the character in the values.
  - `height`: `Float32Array` 0..1
  - `normal`: `Uint8ClampedArray` RGBA
  - `roughness`: `Uint8ClampedArray` RGBA, the value in R, G and B. Wet or polished is lower; dry stone and earth are higher.
  - `ao`: `Uint8ClampedArray` RGBA, the value in R, G and B. Darker in gaps and mortar.
  - An unknown `kind` throws a `RangeError`.
- **`KINDS`**: the list of material kinds, from the data file.

### `src/data/materials.js`

**`MATERIALS`:** a recipe per kind, each built from the blocks above, with numbers for scale, contrast, roughness and how deep the gaps are. The kinds the app uses now:

| kind | what it is |
|---|---|
| `flag` | large worn flagstones with dark gaps |
| `cobble` | small rounded cobbles, deep gaps, a little moss-dark in them |
| `plank` | old floorboards, grain, dark seams, a few knots |
| `rock` | natural cave rock: fbm plus cracks (worley f2-f1), no pattern |
| `dirt` | packed earth with pebbles |
| `mud` | wet, smooth, low roughness, puddle-dark patches |
| `brick` | village brick in running bond, rough mortar |
| `ashlar` | large dressed castle stone blocks, thin joints |
| `plaster` | rough plaster, a few cracks, patches where it has fallen |
| `snow` | soft, bright, low contrast, a faint crust |
| `bone` | a wall of packed bones and skulls for the ossuary: worley blobs with a lumpy height. Abstract is fine. |

## Tests (`tests/texgen.test.js`)

- every kind in `KINDS` builds at size 64, with arrays of the right lengths and types
- values are in range: height 0..1, every byte 0..255, normal alpha 255
- normals: decoded `(r/255*2-1, g/255*2-1, b/255*2-1)` have length ≈ 1 (within 0.05), and a flat height gives (128, 128, 255)
- **seamless**, for at least `fbm`, `worley`, `bricks` and `makeMaterial('flag')`: the average difference between column 0 and column size−1 is no bigger than 1.5× the average difference between neighbouring columns inside; the same for rows
- the same seed gives identical bytes; a different seed differs
- roughness: `mud` averages lower than `rock`
- ao: the gaps (where height is lowest) are darker on average than the faces
- one 256×256 `makeMaterial('cobble')` takes under 500 ms (a generous margin for slow test machines)

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/texgen`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
