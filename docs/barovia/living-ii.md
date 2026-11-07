# THE LIVING VALLEY II · Barovia Animated Terrain

**A compatible add-on to the original 36 terrain GLBs for JackJackDnd / Dread Delve.**

This is a complete distribution: Pack I's **36 original GLBs** and terrain-placement modules, plus Pack II's atmospheric effects. All mesh art is original, CC0. Animation code is original and may be used in the user's game. The scene effects are procedurally constructed by Three.js at runtime; there are **no extra .glb animations** in this second batch.

## Pack II: Five living systems

1. **Swaying firs, oaks and birches.** Register an existing Pack I GLB tree with `attachTree`. Trees move subtly in the wind, and medium/high quality uses a cached vertex shader to bend the canopy without modifying shared model geometry.
2. **Rolling ground fog.** A batch of translucent, drifting quads is drawn using **one mesh/draw call** per layer. Each wisp has a distinct phase and size.
3. **Moving blackwater.** Lightweight shader-animated ripples for existing ponds, marshes and dark streams; water is only visual and doesn't affect movement.
4. **GPU drifting snow.** A single point cloud per effect volume; deterministic particles use the shader's time uniform instead of CPU vertex changes per frame. Disable this if Dread Delve's existing `render/ambience.js` is already drawing snowfall.
5. **Expanding Hunger Moss.** Seeded, 4-direction spread; visible stages rise monotonically. Glowing organic 3D colonies are drawn as two instanced meshes. `allowed(x,y)` protects roads, stairs, exits and combat lanes; game rules remain authoritative.

## Package layout

- `assets/` — 36 low-poly Barovia terrain GLBs from Pack I, unchanged.
- `manifest.json` — footprints, IDs and metadata for those 36 assets.
- `js/barovia-terrain-*` — Pack I's deterministic placement and GLB cache.
- `js/barovia-living-state.js` — Pack II's deterministic plans and atmosphere presets (no dependencies).
- `js/barovia-living-three.js` — Pack II's Three.js 0.169.0 renderer, controller and disposal.
- `living-showroom.html` — interactive atmospheric diorama, with biome, wind, weather, Gaze, moss-stage and quality controls.
- `showroom.html` — original 36-model catalog showroom.
- `previews/` — original Pack I static terrain illustrations.
- `tests/` — planning, ownership, lifecycle and GLB validation tests (24 JavaScript tests total).
- `WORK_HANDOFF.md` — focused integration task for Work / Claude.

## Coordinates and ownership

- **One Three.js unit = one 5-foot grid square.** +Y is up.
- `width`, `height` are grid dimensions. The internal effect layer centres itself about local origin; its parent should be at the centre of the outdoor map.
- All terrain models are positioned using the existing Pack I GLB placement helper.
- Use a **dedicated effect group** on the current outdoor floor. When a floor is removed/rebuilt, call `layer.dispose()`, then remove the effect group's model instances separately.
- No browser APIs, global timers, DOM, singleton scene, collision edits, fog-of-war changes, gameplay events, or network changes are caused by the module itself.

## Example: create the atmosphere near Svalich

Install the two Pack II JS modules alongside the three Pack I modules in `src/render/`.

```js
import * as THREE from 'three';
import { createLivingValley } from './barovia-living-three.js';

// Put this beneath a dedicated outdoor floor group; do not attach to a temporary
// mesh container that the renderer recreates every frame.
const fxGroup = new THREE.Group();
outdoorFloorGroup.add(fxGroup);

const fx = createLivingValley({
  parent:fxGroup, width:40, height:40,
  seed:'barovia|svalich-east|level-0',
  biome:'svalichWoods', quality:'low', groundY:0,
  showSnow:false,
});
fx.addGroundFog({count:14});
// Optional only if the existing VTT snow layer is turned OFF:
// fx.addSnowfall({enabled:true});

for (const placedTree of existingTerrainModels) {
  fx.attachTree(placedTree.object, {
    id:placedTree.id, seedKey:`${placedTree.x},${placedTree.y}`,
  });
}

// The app's frame loop already calculates t = performance.now() / 1000.
// Add this to that same loop, once for the current visible outdoor floor:
fx.update(t);
// At the end of the map's lifetime:
fx.dispose();
fxGroup.removeFromParent();
```

## Example: a protected Hunger Moss outbreak

```js
const fx = createLivingValley({
  parent:fxGroup,width:f.W,height:f.H,seed:regionSeed,
  biome:'hungerMoss',quality:'low',groundY:0,
});
const blocked = new Set([/* cells for doors, routes, stair squares, buildings, spawn points */]);
fx.addHungerMoss({
  origins:[{x:6,y:7}],maxSteps:12,maxCells:140,
  allowed:(x,y)=> !blocked.has(y*f.W+x),
  wx,wz, // app grid/world coordinate helpers, optional when centred on the map
});
fx.setMossStep(sharedMossStage); // network/session state must supply this integer
fx.update(t);                  // visual animation, NOT progression
```

**Crucial:** `setMossStep` changes visuals only. If Hunger Moss imposes difficult terrain, damage, conditions, or new encounters, that must be implemented through Dread Delve's existing engine and synchronized state. Never treat the visuals as automatic gameplay.

## Mobile quality budgets

| Quality | Fog patches | GPU snow particles | Moss buds/cell | Canopy shader |
|---|---:|---:|---:|---|
| low | 14 | 180 | 2 | off, lightweight whole-tree sway |
| medium | 32 | 480 | 3 | on |
| high | 58 | 900 | 4 | on |

Effects are opt-in. Match `gfx.quality` to one of these three levels; never add a second snowfall over Dread Delve's built-in snow. Trees and model geometry are shared with Pack I's GLB loader; original objects and meshes remain the owner's responsibility.

## Preview and tests

From the ZIP's root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/living-showroom.html`. The viewer uses the same Three.js **0.169.0** pinned by the VTT, via a CDN import map. Your browser needs internet access to load the library. Older static images are under `previews/` and work offline.

Run the dependency-free Node 22 tests:

```bash
node --test tests/*.test.js
python3 tests/check-glb.py   # requires trimesh + numpy
```

The Node suite checks every original GLB asset entry, seeded plans, protected-cell spread, and an API-mocked runtime lifecycle. **A mocked Three.js runtime is not a GPU render test.** Real WebGL screenshots, iPhone frame rate, and collision/fog-of-war interactions still need checking after VTT integration.

## License

Original Barovia GLB geometry: CC0-1.0. Runtime scenery code: CC0-1.0. No external art, brand assets or proprietary sourcebook images are included.
