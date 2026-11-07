# Work / Claude integration task: The Living Valley terrain GLB pack

Target repository: `conber22-hub/JackJackDnd` (Dread Delve 3D VTT, not Barovia GBA or DS).

This archive contains **36 ORIGINAL, completed binary GLB assets**, plus an asset manifest and dependency-free placement planner. Don't regenerate them as primitive placeholders. The source model meshes already exist, and models parse correctly as glTF 2.0 binary.

## Integrate

1. Copy all `assets/*.glb` to `public/assets/terrain/`.
2. Copy `js/barovia-terrain-*.js` to `src/render/` while keeping them side-by-side. These are separate modules to avoid conflicts with another agent's Three.js asset work.
3. Import `createBaroviaTerrain` from `src/render/barovia-terrain-three.js` and `planTerrain` / `featureAt` from `src/render/barovia-terrain-plan.js`.
4. Use existing `scene.js` helpers `wx`, `wz`, `floorY`, and map grid bounds. `placement.x, placement.y` are TOP-LEFT GRID CELLS; do not treat them as world-space coordinates. The library adjusts for footprint size to center each GLB correctly.
5. Start with **landmark placement** at Svalich road shoulders, Tser Pool, village boundaries, cliffs and crossroads. Then add **seeded biome scatter** for forest edges and marshes.
6. Implement a game-aware `allowed(x,y,spec)` predicate that prevents every occupied footprint square from overlapping roads needed for movement, doorways, stairs, bridges, map entry points, combat start zones, villages, or interactive geometry. Never allow the terrain planner to decide collision or passability by itself.
7. Keep movement/collisions dictated by the engine's tile grid. For any blocking obstacle, explicitly update game semantics through existing APIs, not by rendering alone. `portal` assets need deliberate cave/door links.
8. Do not overwrite existing work from other agents, do not commit generated HTML builds, and open a small focused PR with integration and tests.

## Mood / biomes

- Svalich Woods: thick black pines, hollow branches, abrupt clearings, soft low mist, pale birches.
- Vallaki countryside: collapsed drystone borders, ruts, bowed timber fences, scattered shrines.
- Tser Pool: blackwater, cattails, bog mats, slippery boardwalks.
- Balinok foothills: fractured shale, scree, snowbanks, ice and cave mouths.
- Ancient graveyard: stones, dead oaks, broken arches, an empty gallows.
- High Gaze or Hunger Moss: infected conifers, glowing pods, spreading corrupted floor and road states.

## Notes for mobile

Packed GLB data ~652 KiB across 36 unique models. The models were generated from 1,420 details and pre-merged into 186 material-specific draw meshes total. Reuse loaded instances from the cache; no texture downloads or source credits required beyond CC0 attribution if you choose to give it. Begin at low terrain density.

## Verification

`node --test tests/barovia-terrain.test.js` passes 8 tests. `python tests/check-glb.py` passed binary round-trip inspection of all 36 files. Three.js browser showroom exists but rendering inside the actual VTT is NOT yet tested. Please verify in Playwright/mobile browser before merging integration.
