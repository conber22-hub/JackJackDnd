# BAROVIA V: UNDER THE ROAD

An original 3D encounter-entrance pack for the JackJackDnd / Dread Delve 3D virtual tabletop.

**24 original GLBs, grouped as 12 concealed/revealed pairs.** All assets are procedurally constructed in our source generator. Every GLB is self-contained with embedded solid-colour PBR materials. 1 Three.js world unit = one five-foot grid square; +Y is up and -Z is north. Models are centred on their square footprints.

## What ships

- 12 concealed-model GLBs, from an ordinary-looking Svalich hatch to a sleeping barn's floor
- 12 revealed-model GLBs with open stairs, lifted covers, crypt entrances and underground shafts
- Plain ESM catalogue, seeded optional placement planner, Three.js GLTFLoader helper
- Read-alouds and changed-on-return moments for all 12 discoveries
- An accurate software-rendered GLB preview catalog, single-scene showroom, source script, GLB validator and Node tests

## Design guardrails

**These models do not create a new level, trap or teleport.** Existing `src/engine/overland.js`, dungeons, interior generator, path carving, doors, token movement, fog of war and save game rules remain authoritative. The planner only outputs visual placements, with corridor/road/room/stair/door/water/building exclusions. The DM decides when a site is discovered and when a separate map is entered.

Only send a public visual representation to players after the existing exploration/fog rules permit visibility; never send the DM's `approach`, `reveal`, `return`, or site discovery logic unredacted. Changing a GLB from sealed to revealed is a **visual event**, not a game-state mutation.

## Merge and use

Read `WORK_HANDOFF.md` first. This pack does not change app boot code. After merging, inspect the assets with `npm run dev` and `/docs/barovia/showrooms/hidden-v.html` on a machine with WebGL support. Unit tests are dependency-free with Node 22; the optional loader itself uses the game's existing Three.js dependency.

The pack complements the earlier 36 terrain assets (PR #73), atmospheric features (PR #72), 65 roads (PR #74), and 43 horror scenes (PR #75). It does not depend on those PRs at runtime.

## Original work

Geometry, read-alouds, data and source are authored for this project. No third-party mesh or texture libraries, asset-store models or module prose are included.
