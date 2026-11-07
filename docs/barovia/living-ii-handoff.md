# HANDOFF FOR CHATGPT WORK / CLAUDE: Living Terrain II

**Project:** `conber22-hub/JackJackDnd` · Dread Delve 3D VTT (NOT the GBA or DS project).

**Objective:** Safely integrate the **complete, ready-made** animated Barovia terrain bundle. All 36 GLB models from the prior pack are in this ZIP. The animation effects are ALREADY authored; do not replace them with generic placeholders or rewrite them from scratch.

## A. Install into separate namespaces

- Place `assets/*.glb` under `public/assets/terrain/`, unless identical assets already exist there. Avoid duplicate assets.
- Place `js/barovia-terrain-index.js`, `js/barovia-terrain-plan.js`, `js/barovia-terrain-three.js`, `js/barovia-living-state.js`, `js/barovia-living-three.js` under `src/render/` (or adapt imports if a separate module folder is chosen).
- Keep all Pack II imports relative, except `three`, which must resolve to the VTT's installed `three@0.169.0`.
- Do NOT edit auto-generated `dread-delve.html` and do NOT overwrite Claude's in-flight PRs. Implement as a small PR off the current target branch.

## B. Integrate at the right lifecycle hooks

Repository inspection identified:

- `src/render/scene.js`: `scene`, `wx`, `wz`, `floorY`, one unit per 5-foot tile.
- `src/render/floors.js`: `floorViews[L].group` and `buildFloor` / `buildAllFloors`; outdoor geometry is rebuilt.
- `src/main.js`: render-frame `t` and `gfx.quality` / `onGfx` hooks.
- `src/render/ambience.js`: existing snowfall and rain, so **DO NOT activate duplicate new snow at the same time**.
- `src/render/omens.js`: existing distant Mists, Gaze, ravens, sky and wither effects. New low ground fog should COMPLEMENT, not obscure or double these.
- `src/game/weather.js`: authoritative weather kind, if available.

Create a dedicated environment group for **each actual visible outdoor floor**. Attach to a stable floor group; cleanly dispose on `buildFloor`/map switches and on quality changes. Only update the visible outdoor layer; switch off inside houses, dungeons and under roofs unless a DM deliberately requests atmospheric effects.

## C. Place real scenery, protect the game's pathfinding

- Use existing Pack I `planTerrain(... allowed(x,y,spec))` for new scenery. Protect all walkable entrances, corridors, exits, stairs, bridges, town routes, interaction squares, and combat start areas.
- `createBaroviaTerrain` caches GLBs. Register existing tree Object3Ds by calling `layer.attachTree(obj,{id,seedKey})` after `place` / `placeAll`. Re-register after a rebuild; don't double-attach a tree.
- For water, call `layer.addBlackwater` ONLY at known water surfaces. The shader does not create passability or swimming rules.
- Snow is opt-in (`addSnowfall`) and should stay off whenever the native `updateAmbience` snowfall is on.
- `layer.addGroundFog({allowed})` uses one mesh for its mist patches. It is visual-only, not a blocker for line-of-sight/fog-of-war.
- `layer.addHungerMoss({origins,allowed,maxSteps,maxCells,wx,wz})` creates a purely visual, deterministic growth timeline. Supply `setMossStep(sharedStage)` from existing replicated/session state; DO NOT let every client advance it independently. Gameplay changes require separate engine hooks and DM authority.

## D. Render loop and quality

- On each frame: `layer.update(t)` with **absolute** time seconds from the app's main render loop.
- Pass `quality` from `gfx.quality` (`low`, `medium`, `high`).
- Provide a visible DM toggle for low ground mist and canopy sway, and a moss-growth stage control if the DM enables corruption. Keep player's view consistent with shared state / redaction rules.
- Under load or on older iPhones, use `low` and reduce terrain scatter. Avoid a second weather particle layer.
- Call `layer.dispose()` on every cleanup; remove the GLB terrain placements separately using the Pack I loader's established lifecycle. This controller intentionally does not dispose Pack I models.

## E. Validation and PR requirements

The bundle's `node --test tests/*.test.js` presently runs 24 tests; `python3 tests/check-glb.py` verifies all 36 GLBs. Those tests include a tiny Three.js API mock to exercise lifecycle, **not** an actual GPU snapshot.

After integration:
1. Run repository's own Node test suite and build (`npm test`, `npm run build`).
2. Run the supplied tests (port these to `tests/` as needed).
3. Capture real in-browser screenshots and check a scene in all seven biome presets.
4. On mobile/iPhone quality, check FPS, model scaling, alpha sorting, fog intensity, and visibility while panning.
5. Verify that an interior or dungeon scene never receives unwanted outdoor effects, and exits/routes never gain new blockers.
6. Test weather switch, Gaze intensity, Hunger Moss step transitions, map switch, and effect disposal/re-entry for leaks.
7. Show the results and open an unmerged, focused PR with screenshots and test evidence.

**Important:** The living showroom is a standalone preview that requires CDN Three.js access and a local HTTP server. It has not been confirmed in the live Dread Delve UI, so do not report full VTT integration or browser validation until actually performed.
