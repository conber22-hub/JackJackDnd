# Dread Delve

A 3D multi-floor dungeon simulator (D&D / Ravenloft, Flood-style "Seep" campaign). Read `DREAD-DELVE-ROADMAP.md` first: it has the feature list, the phases and the code map.

- `npm run dev`: live dev server. `npm run build`: bakes everything into `dread-delve.html` (commit it). `npm test`: engine tests.
- Content (creatures, Dread levels, Shift/Grasp tables, themes, templates) lives in `src/data/`. Logic in `src/engine/` must stay free of DOM and Three.js so it remains unit-testable.
- After a change, run `npm test` and `npm run build`, and check the page in a browser. `window.DreadDelve` exposes state and actions for console poking.
- Saves from older versions are migrated in `deserialize()` (`src/game/session.js`); keep that working when adding state fields.
