# Claude / Work handoff: Barovia V, Under the Road

## Scope and dependencies

This PR adds 24 `.glb` files to `public/assets/hidden-sites/`, a JS scene catalogue, pure placement planner, optional loader, tests, source and this handoff. It modifies no existing JackJackDnd gameplay file. It can be reviewed independently of PRs #72-#75. Keep all existing `genStretch()`, dungeon generation, stair links, map transition, `walk()`, FOW and persistence code intact.

## Suggested integration sequence

1. Import `planHiddenSites` and `visibleHiddenModels` from `src/render/barovia-hidden-sites.js` in an opt-in placement adapter, not directly in the authoritative road generator. Pass the **already-generated** `layout` from `genStretch()` and a seed derived from the route and stretch ID. The planner uses 40×40 grid default, but takes explicit `W`, `H` when present.
2. Persist a stable site identifier and the DM's `revealed` state in an existing session save mechanism, if the team decides these entrances are persistent. The planner itself must remain pure.
3. Construct the renderer group as a child of the relevant `floorViews[L].group`. Use `mountHiddenVisual(group, site, {xWorld: wx, zWorld: wz, yWorld:()=>floorY(L)})`; **note** the helper currently centres the GLB using `site.x + (w-1)/2` and `site.y + (h-1)/2`. Confirm the target game's `wx/wz` match before committing the integration adapter.
4. Reveal only by a DM-authorized discovery event. A local visual `setRevealed(true)` does **not** change dungeon links or collisions. The DM must create/select an interior, site or dungeon destination and ensure both sides of the transition are reachable before enabling travel.
5. Hide DM-only fields on the network. `visibleHiddenModels(plan)` is a reduced visual projection, **not** a full FOW filter; it must still be filtered by the existing floor exploration rules.
6. Honor `gfx.quality` and use lazy loading for each visible site. On mobile load only the GLBs on the current floor and cap total scene models; `dispose()` unmounts safely while cached shared materials remain alive.
7. Avoid double-registering `showroom.html` as a production page. It is a QA resource only, accessed through Vite as `/docs/barovia/showrooms/hidden-v.html`.

## Code interface

```js
import { planHiddenSites, visibleHiddenModels, revealHiddenSite } from './render/barovia-hidden-sites.js';
import { mountHiddenVisual } from './render/barovia-hidden-loader.js';

const plan = planHiddenSites({layout,roadId:'r-east',seed:'r-east|stretch-2',maxSites:1,density:.65});
// Existing exploration rules decide when each visible model can be sent to players.
const publicModels = visibleHiddenModels(plan);
// After the DM authorizes a discovery, persist the new plan and publish new visible models.
const updatedPlan = plan.sites.length ? revealHiddenSite(plan, plan.sites[0].id) : plan;
```

## QA checklist for merge owner

- [ ] Run `node --test tests/barovia-hidden-sites.test.js` and full `npm test` after prior PRs merge.
- [ ] Run `npm run build`; verify `.glb` files from `public/assets/hidden-sites/` copy into `dist`.
- [ ] Open `/docs/barovia/showrooms/hidden-v.html` in Vite and rotate through all 12 pairs.
- [ ] Check 5-ft grid and exact exposed opening anchor alignment at the scene scale.
- [ ] In top-down view, no entrance model covers doors, bridges, stairs, road clearances or existing dungeon exits.
- [ ] Test a DM reveal while two players are connected: unrevealed notes must remain server-side, and unknown sites stay unknown.
- [ ] Reload the saved campaign and verify the visual reveal and destination link survive appropriately.
- [ ] In mobile low-quality mode, ensure models lazy-load and disposal does not delete shared meshes.

**Known limitation:** no end-to-end browser / iOS test was run during asset-authoring, and there is no built-in transition-to-interior binding. Those are deliberately left to Claude's integration PR.
