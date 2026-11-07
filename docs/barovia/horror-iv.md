# BAROVIA IV: THE ROAD WATCHES

**43 original game-ready low-poly `.glb` models**, 13 optional unsettling roadside vignettes, a visual-only seeded placement engine, Three.js loader and optional scene-local stagecraft for `conber22-hub/JackJackDnd` (Dread Delve VTT).

This is **not** a ROM or a GBA/DS game. This pack extends Packs I–III. All models are new original mesh geometry, no third-party art.

## What's inside

- `assets/*.glb`: 43 original, colored low-poly PBR mesh assets. 12 structures, 16 horror props, 10 corrupted/terrifying natural features, 5 secret-entrance/discovery pieces.
- `manifest.json`: metadata for all 43 meshes, footprints, categories, biomes, read-aloud hooks, geometry counts and extent checks.
- `js/horror-assets-index.js`: JavaScript copy of the asset catalog for fast selection.
- `js/barovia-horror-planner.js`: seeded pure generator. References the **existing** 15 valley route IDs from `src/data/barovia-map.js`, works with existing `genStretch()` layout paths, and maintains protected squares around roads, rooms, water, doors, landmarks and stairs. Never calls `Math.random`.
- `js/barovia-horror-three.js`: Three.js 0.169 loader/scene attachment with caching and cleanup.
- `js/barovia-horror-stagecraft.js`: optional animated *local* window shadow, lantern flicker, moss heartbeat/spores, eerie water, rope sway; **the DM reveals** these and may set Gaze/wind.
- `showroom.html`: orbit original 3D GLBs and trigger story phases (requires an HTTP server and Three.js CDN).
- `DM_SCENE_CARDS.md`: 13 original three-stage encounters with investigation and return-visit changes.
- `examples/15-valley-horror-plans.json`: 15 demonstration scenes on synthetic road layouts for each real route ID (not substitutes for the live map).
- `previews/`: z-buffer-rasterized images of actual GLBs, including three assembled scenes mixing roads from Pack III and foliage from Pack I.
- `tests/`: deterministic planner tests and mesh validation, `source/`: editable original geometric model builder and software renderer.

## Full model categories

Structures (12): haunted inn, plague tollhouse, shuttered farmhouse, flooded chapel, watchtower, burned stable, hunter's hideout, bellkeeper's hut, granary, guard post, crypt entry, rootswallowed cottage.

Horror props (16): triple gallows, noose oak, blood well, last lantern, wrong-way signpost, stacked coffins, bone chimes, prison cage, effigies/scarecrow, candle memorial, doll shrine, handprint shutter, graves, funeral cart, fallen angel.

Corruption and terrain (10): Hunger root arch, spore vent, reaching stalks, swallowed wagon, heart tree, red stones, bog hands, eyeless stump, wolf cairn, blackwater sinkhole.

Discoveries (5): root tunnel, thorn arcade, culvert, cellar hatch, cave mouth.

## Scale and layout contract

- 1 unit = one 5-foot Dread Delve grid square. **+Y up. North = -Z.** Models are centered on origin; bottoms near Y=0.
- Each asset has a rectangular footprint measured in **squares**, not 8×8 tiles. Many are large (5×4). Unlike Pack III roads, they are **standalone scenic objects for clearings and roadside verges**. DO NOT plug them into the road socket planner.
- Asset render placement: `worldX = wx(p.x)`, `worldZ = wz(p.y)` (with map coordinate origin handled by native `wx/wz`). `rot=1` is clockwise viewed from above, runtime `rotation.y = -Math.PI/2`.
- The placement planner reserves path centerlines with a safe buffer, all existing room and building rectangles, water and forbidden squares. It never changes tiles or creates a road leading to a secret entrance automatically.
- These visuals **cannot open doors, trigger secrets, spawn enemies, change map collision, inflict status, or block a road**. DM/engine gameplay is a separate integration task.

## Generation

```js
import { planHorrorRoad, validateHorrorPlan } from './js/barovia-horror-planner.js';
const layout = genStretch({...}); // existing Dread Delve layout; do not replace it
const horror = planHorrorRoad({layout,roadId:'r-east',seed:'day-9',gaze:7,bloom:false,density:'standard'});
console.log(horror.scenes.map(s=>s.name));
console.assert(validateHorrorPlan(layout,horror).length===0);
```

`planHorrorRoad` optionally accepts `extraProtected:[[x,y],...]`. On densely populated maps a set piece may not fit: it is **skipped**, never forced onto a path. No changes to the gameplay grid occur.

## Three.js placement

```js
import {createHorrorRenderer} from './js/barovia-horror-three.js';
import {createHorrorStagecraft} from './js/barovia-horror-stagecraft.js';
const art=createHorrorRenderer({baseURL:'/assets/horror/'});
const visualGroup=await art.attach(floorViews[L].group,horror,{wx,wz,groundY:floorY(L),limit:36});
const stage=createHorrorStagecraft(visualGroup,{quality:gfx.quality});
// On each render frame: stage.update(timeSeconds,{gaze:state.dread,wind:.4,dmReveal:false});
// On floor switch/rebuild: stage.dispose(); art.detach(visualGroup);
// On total VTT teardown: art.dispose();
```

Stagecraft is **optional and separate from the current weather/omen systems**, deliberately does not create fog, rain or Strahd watchers that would duplicate `src/render/ambience.js` and `src/render/omens.js`. DM reveal defaults to false; no automatic forced camera movement or audio playback.

## Run and test

```sh
node --test tests/horror-planner.test.js
python3 tests/check-horror-glb.py
python3 -m http.server 8000
# open http://localhost:8000/showroom.html
```

The available container cannot resolve the Three.js CDN, so the browser showroom is delivered but **has not been runtime/WebGL-tested here**. The preview images are accurate software z-buffer renders of source GLB meshes, not browser captures. Actual VTT integration and iPhone performance remain for Work/Claude to test.

## License

All newly authored meshes, JS, text, previews and builder source in Pack IV are original. They can be used, modified and redistributed with the user's Dread Delve campaign. Pack I–III contents in any combined bundle retain their original embedded license metadata.
