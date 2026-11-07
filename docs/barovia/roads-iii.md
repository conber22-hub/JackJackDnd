# BAROVIA: ROADS & CONNECTIONS III

**Original modular 3D scenery for `conber22-hub/JackJackDnd` / Dread Delve.** This is the JackJackDnd virtual tabletop, not Barovia GBA or DS. Made to complement Packs I and II, not overwrite them. No third-party art meshes or textures.

## What is included

- **65 distinct, original `.glb` models**: 15 Svalich dirt-road connectors, 11 footpath connectors, 11 narrow mountain-trail connectors, 7 cobblestone street connectors, 4 transitions, and 17 bridges, gates and destination approaches.
- Real connectors: straight N/S and E/W, four bends, T-junctions, crossroads, four one-ended stubs for side paths. Other styles have a focused selection of those shapes. Socket widths are included in `manifest.json`.
- Water crossings: stone bridge, timber bridge, footbridge, marsh boardwalk, rope crossing. Destination features: Barovia/Vallaki/Krezk gateways, Tser Pool landing, Bonegrinder, vineyard rows, mountain switchbacks and Hunger Moss blight.
- Exact **8×8 five-foot square** base per GLB, centered on 0,0,0; one Three.js world unit per five-foot square. **+Y is up; north is -Z.** Tile edges meet x/z = ±4 exactly. Adjacent sockets share centered boundaries and exact width.
- `js/barovia-road-network.js`: seeded road link generation, 40×24-square sample stretches, side-branch caps, continuity checker, reverse travel and shortest/fastest routes across the 15 links and 16 destinations found in `src/data/barovia-map.js`.
- `js/barovia-road-three.js`: scene-local lazy GLB loader, clones that share geometry/materials, scene groups that can be removed on map switch; `dispose()` for final GPU release. Three.js 0.169.0.
- `showroom.html`: orbit the actual models in a browser, choose any road and any seed, preview bridge/cobble changes, inspect connectors. Uses Three.js from a public CDN and must be served by local HTTP.
- `/previews`: software-rendered images of the actual source GLB geometry (depth tested), including a scene combining Pack III roads and Pack I foliage. Includes a schematic based on the repository's valley coordinates.
- `/examples`: 15 fully seeded road link plans plus a valley route-graph JSON. Python builder sources and Node tests included.

## Tile contract

| Route surface | Visual passage width | Socket type |
| --- | --- | --- |
| Old Svalich Road / dirt | 3 squares (15 ft) | `road` |
| Vallaki cobbles | 3 squares (15 ft) | `cobble` |
| Footpath / boardwalk | 2 squares (10 ft) | `path` |
| Cliff / hill trail | 2 squares (10 ft) | `trail` |

A plain room cannot be made walkable by placing these models. **All GLBs are visual-only.** Do not change a collision grid, door state, bridge passability, or fog-of-war simply by adding or removing them. A water crossing is scenic geometry, not an automatic bridge in the game engine.

All tiled road/transition assets have a ground base and a top road surface intended for a separate route scenery layer, **not for indiscriminate overlay on the VTT's existing floor mesh**. Align it or hide the underlying floor to avoid z-fighting. Decorative trees/props from Packs I/II are added separately to the shoulders, not directly atop the walking lane.

**Rotation:** `rot=1` is 90° clockwise viewed top-down. In Three.js use `mesh.rotation.y = -rot*Math.PI/2`. Thus socket `N` rotated once becomes `E`.

## Route generator

```js
import { planRoadLink, planValleyTrip, validateRoadPlan } from './js/barovia-road-network.js';
const plan=planRoadLink('r-east',{seed:'session-12'});
console.log(plan.from,plan.to,plan.segments.length);
// Village of Barovia -> Gallows Crossroads, 2 stretches, each 40×24 squares
console.assert(validateRoadPlan(plan).length===0);

const trip=planValleyTrip('village','krezk',{seed:'party-42'});
console.log(trip.places, trip.stretches, trip.hours);
```

`planRoadLink()` is a **sample corridor/ribbon planner**, not a replacement for `genStretch()` in the VTT. The current gameplay generator draws organically winding 40×40 maps and owns all doors, walkability, water and event set pieces. Work should fit these models to existing geometry rather than replace its path logic. Five eight-square tiles fit along a 40-square map axis; 3 rows occupy 24 squares, so `originY=8` centers a sample ribbon in a 40×40 map, but this alone does **not** guarantee it matches the existing generated route.

## Three.js loader

```js
import { createBaroviaRoadAssets } from './js/barovia-road-three.js';
import { wx, wz, floorY } from './src/render/scene.js'; // adjust to installed path
const roadAssets=createBaroviaRoadAssets({baseURL:'/assets/roads/'});
const group=await roadAssets.placePlan(floorViews[L].group,plan.segments[0].tiles,{
  wx,wz,groundY:floorY(L),originX:0,originY:8,
});
// On travel / rebuild:
scene.remove(group);
// At final teardown only: await roadAssets.dispose();
```

## Preview locally

From this directory run `python3 -m http.server 8000` and open `http://localhost:8000/showroom.html` in a browser. Needs internet access to load Three.js CDN modules, but the GLB files themselves are local.

## Checks

```bash
node --test tests/*.test.js
python3 tests/check-road-glb.py
```

The tests cover 25 seeds × 2 travel directions × 15 routes, connector width/style matching, deterministic branch caps, route graph connectivity, JSON serialization, and a 1,000-route speed check. The binary test loads all 65 GLBs, validates bounds and mesh/material constraints. **This pack has not been installed or browser-tested inside JackJackDnd; that is Work/Claude's integration step.**

## Licensing

Entire Pack III mesh/manifest/planner/source work is original and may be edited for this user's game. Existing Pack I/II assets in any master bundle keep their own original pack license metadata. No commercially sourced meshes, texture downloads or third-party art models were used to build Pack III.
