# WORK / CLAUDE HANDOFF: THE ROAD WATCHES (BAROVIA IV)

**Repo:** `conber22-hub/JackJackDnd` · **App:** Dread Delve (Three.js 3D VTT), NOT Barovia GBA/NDS.

## Deliverable

43 new original validated GLBs, 13 three-stage DM horror scenes, seeded safe placement, renderer and optional stagecraft. Complete visuals and supporting code are in this ZIP; don't replace them with placeholder primitives.

## Merge safely

1. Work on a focused branch based on the current Dread Delve development head. Do not edit generated `dread-delve.html`, do not rewrite `src/engine/overland.js` or conflict with Claude's road/interior work.
2. Copy `assets/*.glb` to **`public/assets/horror/`**. Keep Pack I `public/assets/terrain/` and Pack III `public/assets/roads/` intact. Put `js/*.js` in **`src/render/horror/`**, adjusting relative import paths if moved.
3. Generate the 40×40 overworld layout with the existing `src/engine/overland.js` `genStretch()`. `planHorrorRoad({layout,roadId,seed,gaze,bloom,density})` reads the resulting `paths`, `rooms`, `buildings`, `water`, `doors`, `fill`, etc. `roadId` should be a valid ID from `VALLEY_ROADS` (`src/data/barovia-map.js`). All 15 route IDs are recognized.
4. Keep native gameplay mechanics authoritative: **never modify** `T.ROCK`, `T.ROOM`, `T.HALL`, water/bridge passability, collision, fog of war, door status, trap status or player navigation based on an asset alone. Even the `hidden_cellar_hatch`, culvert or root tunnel require a separately tested, DM-approved gameplay link before characters can enter.
5. Instantiate a disposable model group per floor. The pack's `createHorrorRenderer` caches GLB templates. Use the VTT helpers `wx`, `wz`, `floorY`; heights can be grounded against the real per-square terrain (`groundY`) if needed. Position the GLB origin at each placement `x,y`; they are **NOT** 8-square road connectors.
6. If you turn on `createHorrorStagecraft`, call `update(t,{gaze,wind,dmReveal})` from the existing frame loop. `dmReveal` is controlled by an explicit GM action, not auto-deduced from player movement. `dispose()` the effects before removing the model group. Tie quality to existing `gfx.quality` and skip extra spore particles on low mode.
7. Use `HORROR_SCENES` as *optional DM-facing cues*. `beats.approach`, `beats.reveal`, `beats.aftermath` should be individually selectable; never force a PC to act or automatically roll a fear save because a scene exists. `access.requiresGameplayPathCheck` is deliberately true. If a new path is wanted, validate it in the native engine first.
8. Avoid double fog/weather. Dread Delve already renders ambient snow/rain and distant mist (`src/render/ambience.js` and `src/render/omens.js`). Pack IV only enhances a **specific horror set piece**.
9. Reuse the same seed (plus road ID and relevant Gaze/Bloom flags) on all screens or transmit the resulting plain JSON plan through existing table sync. **Do not seed with local clock** or compute different scenes per player.
10. Before merging, run `node --test tests/*.test.js`, `npm run build`, and real screenshots in Barovia Village, Svalich Road, Berez, and mountain passes. Verify features in both route directions, fog-of-war discipline, road clearance for mounts, no visual overlap with houses, no frame-rate regression on iPhone, stagecraft teardown on floor switch, and no unrequested scary flashes/accessibility surprises.

## Immediate repro

```js
const plan=planHorrorRoad({layout:genStretch(spec),roadId:spec.road.id,
  seed:String(spec.seed),gaze:state.dread,bloom:!!state.campaign?.bloom,
  density:gfx.quality==='low'?'sparse':'standard'});
const failures=validateHorrorPlan(layout,plan);
if(failures.length) console.warn(failures);
```

**Important:** The example above is conceptual: ensure the actual `layout` variable and `spec` fields match the integration call site. Do not invoke `genStretch()` twice, accidentally rolling duplicate events. Prefer `const layout=genStretch(spec);` then plan from that same object.

## Verified and not verified

- **Passed:** 43 GLBs have valid binary geometry and material groups; original low-poly source is included. JS planner tests cover 15 road IDs × 20 seeds, determinism, extra exclusion squares, negative overlap cases and basic performance. 13 scene references and all 43 asset IDs are validated.
- **Not yet verified:** Browser/WebGL loader, interactive showroom (CDN unreachable in asset builder), in-game rendering, exact VTT code integration, mobile/GPU performance, actual walkability on a generated overland floor. Do not claim those passed until real integration tests are done.

The goal is not more jump scares. A crooked inn with a single warm window should become a location the players debate whether to enter. That dread is what this pack is built to support.
