# Dread Delve

A 3D multi-floor dungeon simulator (D&D / Ravenloft, Flood-style "Seep" campaign). Read `DREAD-DELVE-ROADMAP.md` first: it has the feature list, the phases and the code map.

- `npm run dev`: live dev server. `npm run build`: bakes everything into `dread-delve.html` (commit it). `npm test`: engine tests. Pushing to the default branch republishes the app on Vercel.
- Content (creatures, Strahd's Gaze levels, Shift/Whim tables, props, themes, templates and hand-built maps, the Valley overworld's places, roads and road events, the Curse of Strahd: Flood Edition sessions, SRD rules for the character creator) lives in `src/data/`. After editing `src/data/campaign.js`, run `npm run campaign-doc` to refresh `docs/curse-of-strahd-flood-edition.md`. Logic in `src/engine/` must stay free of DOM and Three.js so it remains unit-testable.
- After a change, run `npm test` and `npm run build`, and check the page in a browser. `window.DreadDelve` exposes state and actions for console poking.
- Saves from older versions are migrated in `deserialize()` (`src/game/session.js`); keep that working when adding state fields.
