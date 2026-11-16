# Muse brief, round 12: 🐈 the valley's animals

Barovia is a valley where people keep their shutters closed, but it isn't empty. This round adds **its animals**: the dogs, cats, ravens and rats that make a village feel lived in and a road feel watched, the way the old pocket-console adventure games filled their towns with little creatures that scatter when you walk by. One of them, a crow, takes an interest in the party and follows it from place to place.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own (built in code from three.js shapes; no models, images or sounds from elsewhere).
- Work on `muse/critters`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here.

## What's there (read; don't change)

- **The scene** is `scene` from `src/render/scene.js` (three.js 0.169). One square is one unit; +Y is up. Square `(x, y)` on floor `L` is at world `(wx(x), floorY(L), wz(y))`, using `wx`, `wz` and `floorY` from the same file.
- **The map:** `state.floors[L]` (`src/engine/state.js`), with `W`, `H` and `grid` (a square is walkable when `grid[y * W + x] > 0`), `props` (`{ kind, x, y }`; `PROP_BLOCK` in `src/data/props.js` lists the ones that can't be walked through), `water` and `rooms` (each may be `outdoor`).
- **The party:** the hero and their companions are tokens in `state.tokens` (`{ x, y, floor, kind:'pc'|'npc'|'monster' }`). In the Wanderer, `window.DreadDelve.wander.hero()` is the hero.
- **The look of things:** `src/render/folk.js` draws the villagers (read it for how a figure is built, lit and moved); `src/render/omens.js` already has ravens circling high overhead when Strahd's Gaze is 2 or more. Yours are on the ground, on fences and on rooftops, and go about their own business.
- **Time and weather:** `state.campaign.valley.hour` (0–23) and `state.campaign.wx` (the day's weather: rain, snow, fog…).

## Do

**`src/render/critters.js` (new)**, exporting:
- `setCritters(L, { kind, seed })`: who lives on floor `L` of this map, chosen from `kind` (`'village' | 'town' | 'road' | 'woods' | 'camp' | 'interior' | 'crypt'`) and a seed, so the same map has the same animals each visit. Clears the last floor's.
- `updateCritters(dt, { party:[{ x, y, floor }], hour, rain })`: every frame. Moves them, animates them, and makes them react.
- `clearCritters()`.
- `crowAt()`: where the crow is (`{ x, y, floor } | null`), for the app's tests and for a later "the crow is watching" line.

**The animals.** Small (a cat is a quarter of a square long), low-poly but characterful, built from three.js shapes with a few materials, each with its own idle and moving animation. At least:
- **Dogs** in villages and camps: a thin dog that trots about, sniffs, sits, and follows the party a few steps with its tail low, then loses interest; it barks (a little head toss) at night.
- **Cats** on doorsteps, fences and rooftops: they wash, watch and flick their tails, and slink off if the party comes within two squares.
- **Ravens** on the ground in the fields, on fences and on gravestones: they hop, peck, and burst up and fly off (out of the map, or to a roof) when anyone comes within three squares; later they come back.
- **Rats** in cellars, crypts, barns and alleys: they scurry along walls, dart under things and vanish.
- **Bats** at dusk and in crypts: a flutter overhead.
- **Goats or sheep** on the farms in villages and on roads by fields: they graze and drift slowly.
- **The crow:** one crow, larger and blacker than the ravens, that appears on every outdoor map the party reaches, perched somewhere they will see it (a fence, a signpost, a dead tree, a gallows), and moves to a new perch ahead of them now and then. It never comes within two squares. It tilts its head.

**Behaviour:**
- Animals keep to walkable squares, props they can perch on, and roofs. They don't walk through blocking props, buildings or water.
- Fewer in rain and snow; none of the day ones out at night, more bats.
- Never more than about 16 on a map at once, and cheap to draw: share geometries and materials, and use instancing where it helps. The page must stay smooth on a phone.
- They're scenery: they never change a rule, a square or what anyone can see, and they don't block anyone.

## The hook (for Claude)

Don't change other files. In the PR, describe the lines Claude adds: `setCritters` when the hero arrives on a floor, `updateCritters` in the frame loop and `clearCritters` when the map changes.

Add `export * as critters from './render/critters.js';` to `src/debug.js` (that one line) so your spec can drive it.

## Files

- new `src/render/critters.js`
- one line in `src/debug.js`
- new `tests/e2e/critters.spec.js`. Start a Wanderer in the Village of Barovia (see `tests/e2e/wander.spec.js` for how), call `setCritters` through `window.DreadDelve.critters`, and prove:
  - animals appear, on walkable squares or perches
  - a raven or cat within reach of the hero moves away after a few frames
  - the crow is on the map and never within two squares of the hero
  - `clearCritters` removes them all
  - no errors in the console
