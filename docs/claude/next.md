# Next up (Claude): the model packs and engines still to wire

Merged, tested by their own unit tests, not yet in the app. Each line: what it is, where it lives, how it plugs in.

## Models (public/assets/…)
- ✅ done (9 Nov): **Bloom creatures** (`creatures/barovian-bloom`, PR #68) and **wild beasts** (`creatures/barovian-wilds`, #70):
  map bestiary ids to files in `render/models.js` (the GLB-per-creature path), fall back to the forge mini.
- ✅ the terrain pack's trees and undergrowth are in the woods (10 Nov, `WOODS_MIX` in `render/floors.js`); ✅ the Bloom's trees too (11 Nov, `engine/bloom-woods.js`: bloomed beeches and willows, Hunger-taken firs, moss; ✅ the orchard apples too, 11 Nov: `engine/orchard.js`, a field's crop 'orchard'): **Bloom trees** (`terrain/barovian-wilds`, #70): extra woods trees via `instancedModel` in `render/floors.js`,
  chosen when the Bloom is loose (`bloomLoose()`).
- ✅ Living Valley II's ground fog done (10 Nov, `render/groundfog.js`; the tree sway is `render/wind.js`, on the instanced woods; its snow, blackwater and Hunger Moss still to do). Terrain I still to do: **Terrain I + Living Valley II** (#73, #72): `render/barovia-terrain-*.js`, `render/barovia-living-*.js` planners;
  mount on outdoor floors after `buildFloor`, gated by `gfx.quality`.
- ✅ the timber bridge is in (10 Nov, river crossings: `engine/bridges.js`); the kit's road tiles are whole 8×8 squares of land and don't fit the winding roads; its gates were looked at and passed over (posts and a beam: the town gates are drawn in code instead, `render/props.js`); ✅ its stone/foot/marsh/rope bridges are in (11 Nov, each river road names its own); its approaches can be lifted the same way (`instancedLoose(path, null, tint, keep)`): **Roads and bridges** (#74): `render/barovia-road-*.js`; dress journey/trail maps like the Road Watches
  (generator: plan at generation, `f.clear` the cells, draw with `looseModel`).
- ✅ done (11 Nov, journeys; `game/horror.js`, Maps tab): **Roadside horror** (#75): `render/barovia-horror-*.js`; stage at road events (`f.events`), DM-only until sprung.
- ✅ done by Muse (PR #89, refuge entrances): **Hidden entrances** (#77): `render/barovia-hidden-*.js`; sealed/revealed pairs, pair with the refuges engine below.
- ✅ done with the planner and drawn decay, not the pack's models (11 Nov, `game/decay.js`, Maps tab): **Dead villages** (#80): `engine/barovia-dead-villages.js` + loader; swap `f.buildings` looks by decay stage
  (inhabited → abandoned → Moss) on settlement maps; hide the code-drawn building it replaces.
- ✅ done by Muse (PR #87, `render/atlas.js`): **Overworld atlas** (#71): `overworld/*.glb`, landmarks; a 3D valley view beside the Valley tab's SVG map.

## Engines
- ✅ done (9 Nov, `game/refuges.js`; entrances use the prop-pack models, not yet #77's): **Hidden refuges** (`engine/hidden-refuges.js`, #60): `campaign.refuges`; seed on eligible floors, clue via the
  ledger, search from a hero's square, enter as a map (`goToMap`), the entrance drawn with the #77 models.
- ✅ voices done (9 Nov, `ui/voices.js`); the players' voice workshop still to do: **Action voices + voice workshop** (`engine/action-voices.js`, `audio/action-voices.js`, `engine/voice-workshop.js`,
  #61/#62): call `planActionVoice` after each resolved attack/spell; captions + opt-in speech; the players' editor
  in the hero card, DM approval in the Table tab.
- **Lantern drill** (`engine/lantern-drill.js`, #59) with the **party lobby** (`engine/party-lobby.js`, #58) and the
  **remembered table** (`engine/table-entry.js`, #57): one piece of work (lobby scene, phone controls, seat checks).

Rule as ever: unit tests, build, the specs touched, then the full e2e suite (check its log says "N passed") before a push.
