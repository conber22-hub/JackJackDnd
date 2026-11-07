# The Road Watches

36 original low-poly GLBs for Dread Delve's five-foot grid. Six distinct meshes per family; wet/cold/infected treatments reuse meshes and do not count towards 36.

| Family | Models | Purpose |
| --- | ---: | --- |
| Road edges and forks | 6 | Ruts, eroded verge, split tongue, footpath transition, ditch, fading cobbles |
| Wayfinding | 6 | Milestone, cairn, blaze, crooked sign, moved stone, lantern crook |
| Crossings | 6 | Bridge approach, ford stones, raised planks, culvert, washed bank, gauge |
| Places to stop | 6 | Shrine, abandoned camp, pullout, charcoal shelter, hearth ruin, toll remnant |
| Hidden approaches | 6 | Root frame, steps, broken wall, cut fence, cloth marker, lantern recess |
| Hunger Moss | 6 | Two early, two established and two advanced silhouettes |

**Budget:** 766,588 bytes (748.6 KiB) of GLBs, 8,584 triangles across the whole pack; largest GLB 83,224 bytes. Materials are a shared 12-colour palette with bounded treatment caches in the preview. Each GLB merges geometry by material. No textures, external meshes or network downloads are required by the models. CC0 dedication accompanies the pack.

[Contact sheet](evidence/contact-sheet.jpg) · [manifest](../../public/assets/road-watches/manifest.json) · [loader report](evidence/browser-validation.json) · [replay layouts](showcases.json)

## Showcase evidence

| Native generated stretch | Desktop approaches | 390×844 approaches |
| --- | --- | --- |
| Vallaki–Krezk fork | [Forward](evidence/fork-forward-desktop.jpg), [reverse](evidence/fork-reverse-desktop.jpg) | [Forward](evidence/fork-forward-mobile.jpg), [reverse](evidence/fork-reverse-mobile.jpg) |
| Svalich Woods side trail | [Forward](evidence/woods-forward-desktop.jpg), [reverse](evidence/woods-reverse-desktop.jpg) | [Forward](evidence/woods-forward-mobile.jpg), [reverse](evidence/woods-reverse-mobile.jpg) |
| Wet crossing near Berez | [Forward](evidence/berez-forward-desktop.jpg), [reverse](evidence/berez-reverse-desktop.jpg) | [Forward](evidence/berez-forward-mobile.jpg), [reverse](evidence/berez-reverse-mobile.jpg) |

These are actual Three.js renders of native `layoutFloor` output, with the existing floor renderer, volumetric fog, daylight, weather particles and quality controls. Captures use Low quality for consistent phone/table silhouettes; Medium, High and Ultra also received smoke renders. Both camera approaches reuse the **same generated floor**, not a recreated artistic road. The separate placement tests also build native journeys in both travel directions.

Seed: `road-watches-01`. Main journey iteration: `n:2`, Gaze 3. Fork uses Vallaki→winery (`r-winery`, the road towards Krezk); Berez uses Vallaki→Berez and the actual river crossing. Woods uses the first generated side leg from the r-winery junction. Review fixtures record complete layouts and SHA-256 fingerprints; never send that file to players.

The shortcut proof calls the native exploration functions: normal Vallaki–Krezk travel remains **8 hours** until first/right/rejoin trail legs have been completed, then the known route is **6 hours**. The pack itself never changes travel time.

No physical phone or tablet was tested. Mobile evidence is a Chromium viewport, not a device-performance claim. Browser execution used headless Chromium and software WebGL in the cloud. No FPS or thermal/battery claims are made.

## Audit of the current development head

Base: `865e3fe46d9e447f4e887d052bf58c89b4cfd640` on `claude/dread-delve-v0.2`.

- [Merged PR #56](https://github.com/conber22-hub/JackJackDnd/pull/56) supplies the road exploration engine, original trail content and tests. `newRoadExploration`, `branchingJourneySpecs`, `discoverTrailhead`, `trailOptions`, `trailLegSpecs`, `completeTrailLeg`, `trailsForPlayers` and `knownRoadRoute` exist. At the audited head, production game/UI files do **not** import those functions. The PR's live host controls and map transitions remain a Claude integration pass.
- `src/engine/overland.js` already builds seeded road spines, roadside set pieces, river bridge tiles, ford/shallow cells and arrival landmarks. `layoutFloor` preserves trailhead event fields. This pack uses those outputs without carving a replacement road.
- Existing renderer assets are the KayKit Dungeon Remastered, Halloween Bits and Medieval Hexagon props documented in `docs/assets.md`, plus native procedural terrain/PBR materials and horror/decay rendering. These informed scale and visual compatibility; none of their meshes or textures are embedded in this pack.
- No separate terrain/road/horror GLB pack or “The Road Watches” handoff document was present in the checkout or attached files. PR #56's actual merged handoff was used instead of assuming additional integration exists.

## Rebuild and preview

From the repository root after installing its normal dependencies:

```sh
node scripts/build-road-watches.mjs
npm run dev -- --host 0.0.0.0
```

Open `/previews/road-watches/`. Choose the stretch, reverse approach, growth stage, quality and material treatment. “Walk to fork” verifies a native `passMove` path to the real event before calling `discoverTrailhead` in this isolated fixture.

```sh
node scripts/capture-road-watches-layouts.mjs
BROWSER_PATH=/usr/bin/chromium node scripts/verify-road-watches.mjs
python3 scripts/contact-road-watches.py
npm test
npm run build
```

The browser verifier uses the existing Playwright dependency; the optional contact-sheet compositor uses Python/Pillow. `ROAD_WATCHES_URL` can select another running dev-server URL. Asset generation itself only uses Node and the project's existing Three.js dependency. Do not commit `dread-delve.html` or `dist/` after the build.

Generation was run twice with byte-for-byte identical GLBs and manifest. All 36 binaries have distinct SHA-256 content; treatments add no asset count.

## Claude handoff — exact integration points

1. **Road topology first:** in `src/game/overworld.js` / the native journey-spec entry point in `src/engine/generator.js`, finish PR #56's host-owned book and branch transitions. Use `branchingJourneySpecs(book,journey)` and keep native event/arrival checks authoritative. Call `completeTrailLeg` only on confirmed arrival. The preview's fixture helpers are not live table authorisation.
2. **Decorative placement:** after `layoutFloor`, call `planRoadWatches(f,spec,manifest,{seed:book.seed,discovered,stage})` from the game/render adapter. Pass the exact generated spec and stable seed, not render-loop randomness. Stage is `early`, `established` or `advanced`. It returns placement records and visual tree-clear cells; it does not alter grids, doors, props, events, travel, collision or exploration state.
3. **Protected geometry:** `roadReservations` reserves every event plus a one-cell margin, entry/exit plus two cells, existing props/bridge decks, building extents and water/shallow/mist/fill cells. Solid placement cells must be outside every native walkable cell, leaving the full existing road/mount lane intact. Crossing pieces are bank dressing: bridge-wing requires a bridge, ford-stones requires shallow water. They never replace a bridge deck or invent a new crossing. Skip placement when it does not fit.
4. **Openings:** only root-opening auto-places, over the actual trailhead spur after discovery. Its two feet are solid; the centre has over two squares of headroom. Other opening models are intentionally withheld unless an explicit DM-reveal fixture is requested. That reveal must be backed by an authored playable route/map transition before showing it in a live game. A visual hole never creates a route.
5. **Visibility/redaction:** call `roadWatchesForPlayers(plan,{explored,discovered})` with explored cell keys `"x,y"`. A prop's entire footprint must be explored. Unrevealed frames and DM-reveal props are withheld. Keep the full plan/book on the host; send only filtered placements alongside `trailsForPlayers(book,visibleBaseIds)`. The showcase uses a surveyed stretch (fully explored floor tiles) to inspect art; separate tests check empty/partial visibility and hidden topology. It is not a production fog-of-war replacement.
6. **Renderer:** in `src/render/floors.js buildFloor`, after existing props, parent loaded meshes under the floor group using `wx(p.x), floorY(L)+groundY(...), wz(p.y)` and rotation **`-p.rot`**. GLBs have centred X/Z, ground Y=0, one unit per five-foot cell. Use full measured bounds for clearance. Use `plan.clear` as visual forest suppression in a renderer copy/adapter; do not make those cells walkable. `previews/road-watches/preview.js` is the runnable adapter and material-cache example. Shared clone geometry/materials must not be disposed on each redraw.
7. **Quality/weather:** use existing `gfx`/`setGfx`, `daylight`, `groundWeather`, `updateAmbience` and fog; do not add a second weather system. Treatments are material swaps, not separate GLBs. Emissive lanterns work without new lights; if adding point lights, allocate them through the native quality-limited ambience pool. A custom pack prop registry and disposal/cache lifecycle remain live wiring work.
8. **Save/reveal validation:** persist only the stable book and any deliberate DM overrides. Reconstruct decoration from the same layout identity. Apply discovery on the host when a token reaches a trailhead; validate ownership and route completion. Keep unknown destination IDs, fixtures and full layout specs out of player payloads. Preserve paused main-road map/return tile when following a side trail as PR #56 describes.

Only new pack/data/engine/preview/scripts/tests/docs files are changed. Claude-owned renderer/game/net/UI files, shared state and the built app remain untouched.

## Verification and practical limits

- Actual Three.js `GLTFLoader` loaded all 36 GLBs: finite geometry, nonempty meshes, measured triangle counts and ground pivots checked; zero browser JavaScript errors.
- Placement tests cover all 13 eligible base roads in both directions over three seeds (138 native main-road maps), plus forward/reverse side-leg layouts. Assertions cover deterministic placement, non-mutation, protected cells, full bounds and collision masks, overlap, open lane preservation and player filtering. Native engine movement/discovery tests still run unchanged.
- `npm test`: all **76 test files passed** on Node 22. `npm run build`: passed. Generated builds are excluded.
- Twelve desktop/mobile approach captures, all-model labeled contact sheet, native shortcut proof and machine-readable loader report are committed.
- This is a reviewable asset pack and executable integration preview. It does not claim the live Valley has been wired, deployed, or physically device-tested. Complex rising terrain may require per-part ground fitting; the showcase roads use the native flat layouts. User perception/playtesting and live multiplayer scene transitions remain Claude's review work.
