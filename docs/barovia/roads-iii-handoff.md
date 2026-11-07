# WORK / CLAUDE HANDOFF: BAROVIA ROADS & CONNECTIONS III

**Repo:** `conber22-hub/JackJackDnd`. **Application:** Dread Delve 3D VTT; not the GBA/DS games. Target branch coordinated with Claude's current work, not assumed here.

**Deliverables are already built.** Do not have Work regenerate lower-fidelity placeholders. 65 original `.glb` assets are supplied in `assets/`. The sample atlas of 16 locations and 15 route edges is grounded in the current repository `src/data/barovia-map.js`, and 15 precomputed route scene plans are provided as JSON.

## Integration sequence

1. Create a focused branch or worktree based on the current Dread Delve development branch; do not alter `dread-delve.html` (generated). Do not overwrite other in-flight visual PRs.
2. Copy `assets/*.glb` to **`public/assets/roads/`**, leaving existing `public/assets/terrain/` Pack I/II files alone. Copy `js/*.js` into a dedicated `src/render/roads/` folder (adjust relative module imports; `three` resolves to the repo's Three.js 0.169.0).
3. Source-of-truth: **import `VALLEY_ROADS`, `VALLEY_PLACES` from `src/data/barovia-map.js`** for production. `barovia-road-links.js` is a standalone snapshot for preview/test; don't duplicate live place metadata into gameplay state.
4. Inspect `src/engine/overland.js` `genStretch()`: roads already have winding point paths and actual water/bridges. The pack's `planRoadLink()` produces an independent *straight sample ribbon* of connected model tiles for preview. It does **not** modify the existing map generator. For existing 40×40 maps, either (a) adapt model placement to the centerline/bridge squares of `lay.paths` and existing water, using fitted road geometry where 8-square tiles cannot align, or (b) use `planRoadLink` for a distinct road-interchange scene. **Do not plop straight tiles over winding genStretch roads or force new impassable barriers across the map.**
5. Add the GLB visuals to a disposable child group of `floorViews[L].group`. Position using `wx`, `wz`, `floorY` (1 unit = 5 ft), `originX` / `originY` and `rot`. The `barovia-road-three.js` loader shares GLB data for repeated tiles. Remove group on map switch/rebuild, and call `dispose()` only when no instances remain. Check native floor height to avoid z-fighting with slab underlay.
6. Keep native mechanics authoritative: `T.ROOM` / `T.HALL` / `T.ROCK`, stair tiles, water, shallow water, doors, traps, fog-of-war, collision and combat remain exactly as generated. All supplied assets are scenery, not automatic walkable surfaces. For bridges, place the model only where the existing map's water crossing is already passable or where a separate deliberate engine update grants passage.
7. Integration with **Living Valley I/II**: route shoulders can use existing firs, fallen logs, reeds and abandoned graves. Do not duplicate native `src/render/ambience.js` snowfall or `src/render/omens.js` distant mist. Hunger Moss visual road variants can be paired with Pack II's synchronized moss stages; any combat damage or blockade must be authored separately.
8. Performance: use `gfx.quality`; prioritize lazily loaded model templates, instance clones (or InstancedMesh after material batching), segment-level scene groups, and no unnecessary per-frame updates. Each GLB is already consolidated to ~3–12 PBR material meshes. On phones, keep route segments brief and limit adjacent dense tree placements.

## Geometry contract

- `8 × 8` squares; x/z boundaries exactly -4 to +4; centered mesh origin. No drawn 5-ft grid.
- N=-Z, E=+X, S=+Z, W=-X.
- `road` and `cobble` passage width 3 squares; `path` and `trail` 2 squares.
- `rot = 1` means 90° clockwise when seen from above; use `rotation.y = -PI/2` for `rot=1`.
- `manifest.json` includes the complete socket styles and edge widths for each GLB, as well as bounding boxes and a mesh-count estimate.
- For 40×40 example scenes, `tilesPerStretch=5` yields 40×24 square road ribbons; use originY=8 if centering the ribbon. The repository's current `genStretch()` entrances are at x=2/37, so **manual alignment with existing map flow is mandatory**.

## Tests and evidence

`node --test tests/road-network.test.js`
`python3 tests/check-road-glb.py`

Checks include 15 routes × 25 seeds × both travel directions, socket alignment, bridge inclusion, transitions, deterministic generation, 1,000 generated links speed check, and binary GLB validity/geometry bounds. `showroom.html` is a standalone Three.js preview (requires a local HTTP server and CDN availability); do not claim actual VTT or iPhone runtime validation from the Node tests.

**Acceptance before merge:** run existing repo tests and build; screenshot real gameplay in Svalich woods, Vallaki cobbles, Tser marsh crossing and Krezk gate; verify both orientations, river passability, side branches, no tile seams or Z-fighting, route gameplay preserved, floor switches clean and iPhone/Delta is irrelevant (this is the VTT). Open a focused unmerged PR with measured test/build results and screenshots. No repository files were changed by this handoff itself.
