# THE LIVING VALLEY · Barovia Terrain Pack I

**36 original, mobile-friendly, low-poly 3D terrain pieces for JackJackDnd / Dread Delve.**

All GLBs are authored specifically for this pack. No photographs, kitbashes, external meshes, or third-party IP assets are embedded.

## Contents

- `assets/`: 36 self-contained PBR-colored binary `.glb` terrain models
- `manifest.json`: names, footprint sizes, categories, collision hints, bounds, source tags, piece and mesh counts
- `js/barovia-terrain-index.js`: importable terrain catalog
- `js/barovia-terrain-plan.js`: pure deterministic biome-based scatter planner with safe-placement predicate
- `js/barovia-terrain-three.js`: Three.js `GLTFLoader` cache, cloning, placement and disposal
- `previews/`: 36-up visual catalog + six biome-specific galleries
- `showroom.html`: optional interactive 3D asset viewer (requires a local HTTP server and internet for a Three.js CDN import)
- `tests/`: automated JS + GLB integrity tests
- `source/`: reproducible Python asset generator and contact-sheet renderer

## Art direction

Svalich forest: black, wind-bent firs; bare oaks; pale birches; hollow stumps; brambles.

Roads and villages: ruts, farm tracks, cracked Vallaki stones, slumped fences, fieldstone ruins, bridges and milestones.

Tser Pool: dark wet soil, blackwater pools, cattails, boardwalks and bog hummocks.

Balinoks: cliffs, scree, snowdrifts, frozen streams and cave mouths.

Ominous landmarks: roadside shrines, empty gallows, graves, sentry stones, abandoned fires and broken arches.

Hunger Moss: infected firs, glow-tipped growth, spreading colonies and reclaimed roads.

## Integration with Dread Delve

Dread Delve uses **one Three.js world unit per five-foot grid square**. These GLBs follow exactly that scale, use **+Y up**, a centered origin, and ground at about `y=0`. Each asset has an integer grid footprint recorded in `manifest.json`. Trees may have a small natural bough overhang; footprints describe game collision, not leaf spread.

1. Copy `assets/*.glb` into the repo's `public/assets/terrain/` directory.
2. Copy the three `js/barovia-terrain-*.js` files into `src/render/` (keeping them beside one another).
3. From an outdoor renderer, import the loader and optional planner:

```js
import { createBaroviaTerrain } from './barovia-terrain-three.js';
import { planTerrain, featureAt } from './barovia-terrain-plan.js';
import { wx, wz, floorY } from './scene.js';

const terrain = createBaroviaTerrain({ baseURL: '/assets/terrain/' });

// Example: explicit landmark by top-left grid cell.
await terrain.place(scene, featureAt('crooked_oak', 5, 8), {
  wx, wz, groundY: floorY(ui.floor),
});

// Example: outdoors ONLY. Protect roads, stairs, doorways and tactical clearings.
const plan = planTerrain({
  width: f.W, height: f.H, seed: 'svalich-east|' + f.name,
  biome: 'svalichWoods', density: .035,
  allowed: (x, y, spec) => {
    const tile = f.grid[y * f.W + x];
    // Replace this sample predicate with your OWN app's safe decoration policy.
    return tileIsBuildableScenery(tile, x, y, spec);
  },
});
const objects = await terrain.placeAll(scene, plan, {
  wx, wz, groundY: floorY(ui.floor),
});
// When changing a map: objects.forEach(object => object.removeFromParent());
```

**Important:** GLBs are visual scenery. The helper deliberately **does not** change tile movement, pathfinding, fog of war, collisions, interactions or scene-wide lighting. Do not treat `placement: 'portal'` as automatic cave teleportation. Integrate these through the VTT's existing tile/event systems. Plan terrain into allowed cells only; never stamp obstacle assets over routes, stairs, town doors or combat start points.

### Suggested biome presets

`'svalichWoods'`, `'winterForest'`, `'tserBog'`, `'balinokFoothills'`, `'vallakiOutskirts'`, `'ancientGraves'`, `'hungerMoss'`

If the Gaze rises or Hunger Moss spreads, change the biome seed and preset to `hungerMoss` for a persistent, deterministic overgrown state. Swap select firs for `hunger_taken_fir` and roads for `hunger_claimed_road` as the area deteriorates.

### Performance

The pack contains 1,420 small authored geometric elements, consolidated by PBR material into **186 merged GPU meshes** over all 36 models (2–10 material batches per model). The entire GLB catalog is under 1 MB, compressed in the ZIP. Loading uses a cache and cloned scenes sharing the same GPU geometry/materials. For a 40x40 map, begin around `density: .02` or `.035` and test on an actual iPhone before increasing.

Avoid heavy real-time shadow casting on every sprig of grass; `instance(id, {castShadow:false})` can help. Real world height is in world units, not meters.

### Testing

Run from the package root (Node 22):

```sh
node --test tests/barovia-terrain.test.js
python tests/check-glb.py   # requires pip install trimesh numpy
```

### Visual showroom

From the package root:

```sh
python -m http.server 8080
```

Visit `http://localhost:8080/showroom.html`. Browsers need network access to load Three.js from the CDN. The static preview PNGs require no server.

## License

Original geometry is provided under **CC0-1.0**. No proprietary sourcebook artwork, outside model packs or copied maps were used.
