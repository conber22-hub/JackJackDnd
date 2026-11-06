# Codex, round 8: the garrison, and the hoard

Every generated floor now has a **plot**. ChatGPT's site planner (`src/engine/sites.js`) decides:
- who holds the place, and each room's part
- the fights: each room's `encounter` is `{ fam, difficulty, note }`
- the treasure: each room's `treasure` is 0–3
- the locks and their keys

But the monsters in those rooms still stand where they're put and wait, and the treasure is a number. This round makes the site **live**: its creatures stocked, alert and moving, and its hoards real.

Claude builds the screens, the 3D and the wiring. You write the rules underneath.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text, or SRD 5.2.1 numbers, never book text
- pure modules: no DOM, no Three.js, every die from the `rng` passed in
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other). In each, say what's covered, what you skipped and why, and the exact hooks for Claude.

## What's there (read; don't change)

- **`src/engine/sitegraph.js`**: `siteGraph(f)` turns a floor into the planner's input.
  - `{ rooms:[{ id, x, y, w, h, type, size }], links:[{ a, b, kind:'open'|'door'|'secret', doors:[ids] }], up, down }`
  - After planning, each `f.rooms[i]` carries `role`, `faction`, `encounter`, `treasure` and `beat`.
  - `f.site` is the whole plan, with `factions:[{ id, name, fam, attitude, … }]`.
- **The creatures:**
  - `src/engine/encounter.js`: `buildEncounter(list, { levels, difficulty:'low'|'moderate'|'high', gaze, fam, rng })` → `{ budget, xp, group:[{ b, n }] }`, using the bestiary list (`bestList()` in `src/data/bestiary.js`).
  - A creature entry has `id, fam, name, cr, hp, ac, speed, tags`. A `boss` tag means a lone leader.
- **Noise between floors:** `src/game/noise.js`. **Tactics:** `src/engine/tactics.js` (yours, round 6).
- **Items:**
  - `src/data/srd-items.js`: SRD equipment and magic items, with `rarity` and `cost` where the SRD gives them.
  - `src/engine/inventory.js`: `itemInfo`, the pack.
  - `src/data/loot.js`: the app's own container tables.
- **Families:** `srd`, `seep`, `andral`, `dread`, `bloom`, `barovia`, `folk`.

---

## Task 1: the garrison (`codex/garrison`)

**Do:** write `src/engine/garrison.js`, `src/data/garrison.js` and `tests/garrison.test.js`.

1. **`stock(site, graph, { list, levels, gaze, rng })`** → `{ groups:[…] }`. For each room with an `encounter`, build a group with `buildEncounter`, using its `fam` and `difficulty`. Each group:
   ```js
   {
     id, room, faction,
     members:[{ b, n }],
     posture:'guard'|'sleep'|'lair'|'patrol'|'ritual'|'feast',
     alert:0,
     orders:{ hold, flee, call },
   }
   ```
   - `orders.flee` is the HP fraction at which the group runs; `orders.call` is which rooms it calls for help.
   - Choose the posture by the room's role (from the data):
     - `guardpost` → guard
     - `barracks` → sleep or feast
     - `lair` or `boss` → lair
     - `shrine` → ritual
     - a route room → a patrol, sometimes
2. **Patrols:** `patrol(groups, graph, { hour, rng })` → for each patrolling group, the rooms it walks this hour (a loop along links, never through a locked door its faction has no key to), and where it is at each quarter hour.
3. **Alarms** are the heart of it. `raise(state, { room, loud, round })` → a new state. `state` is `{ groups, alert:{ roomId:0-3 } }`.
   - A noise (a fight, a scream, a door forced) spreads along links. Each step costs loudness; a closed door costs more, a secret door more again.
   - Each group hears it by its posture: sleeping groups hear less, guards hear more. Its `alert` rises:
     - 1: uneasy
     - 2: searching
     - 3: hunting
   - **Groups act on their alert:**
     - **Guards** send a runner to the nearest friendly group: the room, and the round it arrives.
     - **Allied factions** come to help.
     - **Rival factions** (`relations:'hates'`) wait and pick off the winner.
     - **A group at `flee`** goes to its faction's strongest room.
   - Return the moves as `{ group, from, to, arrives:round, why }`, so Claude can animate them and tell the DM.
4. **`calm(state, minutes)`**: alerts fall over time. A group that searched and found nothing goes back to its post, warier than before (it can't sleep again for an hour).
5. **The data:** postures and what they hear; how noise carries through open ways, doors and secret doors; each faction attitude's reaction (`hostile`, `wary`, `bargain`, `desperate`); and lines for the DM ("Boots on the stair: the guard from the Tithe Cache is coming").
6. **Tests:**
   - stocking follows the encounter difficulty and family
   - a loud fight in one room alerts its neighbours and not the far end of a long floor
   - a closed door muffles
   - sleepers wake later than guards
   - runners take the shortest unlocked route
   - allies come and rivals don't
   - a fleeing group heads for its faction's stronghold
   - `calm` returns everyone to post
   - everything is deterministic for a seed and JSON-serialisable

## Task 2: the hoard (`codex/hoard`)

**Do:** write `src/engine/hoard.js`, `src/data/hoard.js` and `tests/hoard.test.js`.

1. **`hoard(tier, { level, fam, theme, gaze, rng })`** → `{ coins:{ cp, sp, ep, gp, pp }, items:[…], art:[…], notes }`. `tier` is 0–3, the site planner's number.
   - **`coins`:** scaled to the party's level and the tier. Invent your own tables in the spirit of the SRD's wealth guidance; no book tables.
   - **`items`:** chosen from `src/data/srd-items.js` by rarity:
     - tier 1 at low levels is mostly mundane gear and potions
     - tier 3 at higher levels has a chance of an uncommon or rare magic item
     - never anything above the level's sensible rarity
   - **`art`:** valuables with an invented description and a gp value, e.g. "a silver locket with a lock of black hair, 25 gp".
   - **Barovian flavour by family:**
     - `dread`: grave goods, coins of a dead currency
     - `seep`: things half-grown over with fungus, some of them spoiled (half value)
     - `folk`: honest coin and tools
     - `barovia`: tithes to the Count, with one item marked as his ("taking it will be noticed": Claude raises his Gaze when it's taken)
   - **`notes`:** one or two lines for the DM about the hoard.
2. **`keyItems(locks)`**: the key items the site's locks name (`lock.key.name`, `lock.key.how`), as pack items:
   ```js
   { id, name, kind:'key', opens:[doorIds], weight:0, desc }
   ```
   A carried key goes with a group's leader; a hidden one goes in a container in its room.
3. **`value(h)`** → the total gp. **`split(h, n)`** → a fair share of coins for n heroes, with the remainder named.
4. **Tests:**
   - tiers and levels scale sensibly: averages over many seeds rise with tier and level
   - no item above the allowed rarity for the level
   - every item id exists in `srd-items.js`
   - `seep` spoils some value
   - a `barovia` hoard sometimes has the Count's item
   - `keyItems` makes one key per locked or sealed lock, and none for secret ones
   - `split` sums back to the whole
   - everything is deterministic for a seed

Give each a short section in the PR for Claude: where you'd call `stock` (after `planFloorSite` in `src/engine/generator.js`), and what `raise` needs from the table (what counts as loud, and when).
