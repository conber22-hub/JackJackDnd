# Next up (Claude): the model packs and engines still to wire

Merged, tested by their own unit tests, not yet in the app. Each line: what it is, where it lives, how it plugs in.

## Models (public/assets/…)
- **Bloom creatures** (`creatures/barovian-bloom`, PR #68) and **wild beasts** (`creatures/barovian-wilds`, #70):
  map bestiary ids to files in `render/models.js` (the GLB-per-creature path), fall back to the forge mini.
- **Bloom trees** (`terrain/barovian-wilds`, #70): extra woods trees via `instancedModel` in `render/floors.js`,
  chosen when the Bloom is loose (`bloomLoose()`).
- **Terrain I + Living Valley II** (#73, #72): `render/barovia-terrain-*.js`, `render/barovia-living-*.js` planners;
  mount on outdoor floors after `buildFloor`, gated by `gfx.quality`.
- **Roads and bridges** (#74): `render/barovia-road-*.js`; dress journey/trail maps like the Road Watches
  (generator: plan at generation, `f.clear` the cells, draw with `looseModel`).
- **Roadside horror** (#75): `render/barovia-horror-*.js`; stage at road events (`f.events`), DM-only until sprung.
- **Hidden entrances** (#77): `render/barovia-hidden-*.js`; sealed/revealed pairs, pair with the refuges engine below.
- **Dead villages** (#80): `engine/barovia-dead-villages.js` + loader; swap `f.buildings` looks by decay stage
  (inhabited → abandoned → Moss) on settlement maps; hide the code-drawn building it replaces.
- **Overworld atlas** (#71): `overworld/*.glb`, landmarks; a 3D valley view beside the Valley tab's SVG map.

## Engines
- **Hidden refuges** (`engine/hidden-refuges.js`, #60): `campaign.refuges`; seed on eligible floors, clue via the
  ledger, search from a hero's square, enter as a map (`goToMap`), the entrance drawn with the #77 models.
- **Action voices + voice workshop** (`engine/action-voices.js`, `audio/action-voices.js`, `engine/voice-workshop.js`,
  #61/#62): call `planActionVoice` after each resolved attack/spell; captions + opt-in speech; the players' editor
  in the hero card, DM approval in the Table tab.
- **Lantern drill** (`engine/lantern-drill.js`, #59) with the **party lobby** (`engine/party-lobby.js`, #58) and the
  **remembered table** (`engine/table-entry.js`, #57): one piece of work (lobby scene, phone controls, seat checks).

Rule as ever: unit tests, build, the specs touched, then the full e2e suite (check its log says "N passed") before a push.
