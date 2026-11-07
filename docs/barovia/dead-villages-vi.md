# CLAUDE / WORK HANDOFF · BAROVIA VI: THE DEAD VILLAGES

Repo: `conber22-hub/JackJackDnd`, target `claude/dread-delve-v0.2`.

## Additive PR contents

- `public/assets/dead-villages/*.glb` (36 files, 12 archetypes × 3 states)
- `src/data/barovia-dead-villages-data.js`
- `src/engine/barovia-dead-villages.js` (imports only the data module)
- `src/render/barovia-dead-villages-loader.js` (imports Three and data)
- `tests/dead-villages.test.js`
- `docs/barovia/dead-villages-vi.md` and `docs/barovia/dead-villages-scene-cards.md`
- `docs/screens/barovia-dead-villages-vi-*.png` (visual QA)
- source building tools under `tools/barovia/dead-villages-vi/`.

## Critical integration steps

1. Choose a settlement map produced by `genPlace` in `src/engine/settlement.js`. Its layout has `W`, `H` and a `buildings` list with `{ x, y, w, h, door, name }` objects. **Use that existing layout**, not a new invented coordinate system.
2. Call `planDeadVillage({ layout, settlementId:'vallaki', seed:campaignSeed, stage:'inhabited', intensity:1 })`. Keep the entire plan on the DM/authoritative side. Do not infer `stage` from Dread/Gaze without the DM or campaign event controlling it. Use `advanceDeadVillage` for later changes; restore only with explicit `allowRestoration:true`.
3. The Three.js loader has `mountDeadVillage(floorViews[L].built, plan, { hideOriginal, floorY:0 })`. **Do not mount both original house cubes and GLB skins.** Provide `hideOriginal(i,false)` to conceal the *renderer object* for that building; don't delete any game-state `buildings` entry. Restore the rendering object when the mount is disposed. This needs a per-building mapping built during floor render; do not simply hide the entire level or any walkable room.
4. Do not apply these opaque house models over the settlement's indoor `layout.rooms` (church/tavern rooms). Those remain interactive interiors and need separate interior shells. This pack only skins `layout.buildings`, which the original VTT treats as solid exteriors.
5. Keep street navmesh, doors, stairs, indoor stairs, traps, water, FOW and map transitions **unchanged**. The GLBs are decorative skins, not navigation obstacles or gameplay portals.
6. Respect player's fog of war. Only send `playerVillageSkins(plan)` after confirming that each selected building is discovered/visible through the existing redaction path; it strips read-aloud, seed and stages but it **does not** perform FOW filtering.
7. Call `dispose()` on map changes and rebuilds. There is no automatic integration in this PR.
8. Test on mobile and 40×40 settlement maps. Each GLB has at most 14 grouped material meshes. Limit active model count for low-quality mode, or use original building cube fallback as needed. Vertex-color materials already bundled; no external textures.

## Coverage

- 12 building types: cottage, hut, longhouse, watch house, chapel, inn, ossuary, granary, market hall, schoolhouse, workshop, manor.
- Three states: inhabited, abandoned, infested.
- 36/36 GLBs pass binary and triangle geometry checks.
- `npm test` in the standalone pack: **12/12 unit tests passed**.
- A new asset-only PR does not prove production integration; run repository `npm test`, `npm run build`, browser E2E and Delta/iPhone browser playback separately.

## Story hooks

- Vallaki: preserve official town layout and locations; use visual state only for exterior row houses, under DM control.
- Berez: start abandoned or with high infestation only if the DM chooses.
- Krezk: preserve gates and protective walls. Infestation may be selective by intensity; never break the wall geometry.
- Village of Barovia: make occupied houses rare without requiring all buildings to be ruined.
- Winery: selected storehouses can wither while the navigable press house remains unchanged.

## Known limitations

- Static geometry only: fungal pulses and windows can be animated in a separate post-merge layer. This pack is **not** a replacement for the existing animated Hunger Moss in PR #72.
- `mountDeadVillage` assumes scene units equal map squares and `floorY` relative to its parent. Confirm floor-view group transforms and ensure the original building renderer can be hidden by index before invoking it.
- No authoritative quests, pathfinding, save schema, player networking or new villages are added. None should be silently claimed as implemented.
