# Codex, round 7: the workshop, and a home in Barovia

The DM wants a mix-and-match builder for things, like a ship builder: pick a frame, swap parts, watch the numbers change, name it. Weapons, armour, shields, trinkets and **wagons**. Players craft; the valley's smiths (your folk and trade engines) craft to sell. The second builder is for a place of the party's own: a house, a camp, a fort, an outpost, a castle, built piece by piece and attacked by the Count's court.

Claude builds the screens, the 3D and the wiring. You write the rules underneath.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text, or SRD 5.2.1 numbers, never book text
- pure modules: no DOM, no Three.js, every die from the `rng` passed in
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other). In each, say what's covered, what you skipped and why, and the exact hooks for Claude.

---

## Task 1: the workshop (`codex/crafting`)

**Do:** write `src/engine/crafting.js`, `src/data/crafting.js` and `tests/crafting.test.js`.

1. **Kinds and their slots** (the ship-builder idea):
   - **weapon:** `frame` (an SRD weapon: its dice, damage type, properties; from `src/data/srd-items.js`), `head` (blade or head shape: changes the damage type within reason, or adds a property such as reach or versatile from the SRD list, at a cost), `grip`, `material`, `finish`, and `rune` (optional)
   - **armor / shield:** `frame` (an SRD armour or the Shield), `lining`, `plates`, `material`, `finish`, `rune`
   - **trinket:** `vessel` (ring, amulet, lantern, charm, flask), `material`, `rune`
   - **wagon:** `frame` (handcart, cart, wagon, covered wagon, vardo), `wheels`, `axle`, `team` (none, pony, draft horse, oxen), `cover`, `armour` (none, planking, iron bands), `fittings` (any number, up to the frame's slots: lockbox, lantern hooks, spare wheel, bunks, smithy box, salt barrels, hidden compartment, ward-runes)
2. **Parts** (`src/data/crafting.js`): each with `{ id, n, slot, kinds, cost (gp), weight, hours, needs:{ tool, skill, dc, materials:[…] }, mods:{…}, flavour }`.
   - **Materials:** plain iron, steel, silvered (SRD: silvered weapons), cold iron, bone, Barovian blackwood, and adamantine (SRD adamantine armour: no critical hits; for weapons, double damage to objects). Use SRD numbers where they exist; anything else is small and honest.
   - **Runes** are where magic comes in, and only as SRD effects: +1/+2/+3 (rare, costly, with long hours and a high DC), or a single minor property such as glowing as a torch or never rusting.
   - **Wagon numbers:** capacity (lb), speed (miles a day on Valley roads; a team changes it), HP and AC (planking and iron bands raise them), seats and bunks.
3. **`build(design)` → `{ ok, item, why }`.** A design is `{ kind, parts:{ slot:partId | [partIds] }, name? }`. It validates the slots, checks compatibility (a two-handed frame takes no shield grip, a team suits a frame), and returns the finished thing:
   - a weapon, armour or shield: the same shape `src/engine/inventory.js` understands for a catalogue item (`n`, `d`, `ty`, `p`, `rng`, `weight`, `cost`, `ac`, `dex`, `t`, plus `atk` / `dmgBonus` / `acBonus` for runes), with `custom:true`, the `design`, a `rarity`, and a generated name if none is given ("Blackwood Longsword of Embers")
   - a wagon: `{ kind:'wagon', n, capacity, speed, hp, ac, seats, bunks, fittings, cost, weight, design }`
4. **`plan(design, { crafter, tools, materials, place })` → the job.** What it costs in coin and materials, the hours of work, the tool needed and the check (an ability check with the tool: crafter's bonus against the parts' highest DC).
   - `crafter` is a hero sheet or a folk person: a smith with smith's tools, a peddler can't.
   - **`work(job, hours, { roll }, rng)`** advances it; a failed check costs time, and a fumble ruins a material.
   - **`finish(job)`** → the item.
5. **Teach the pack about crafted things:** `itemInfo` in `src/engine/inventory.js` should accept an inventory entry carrying a `custom` definition (`{ n, custom:{…} }`) and return it as it does a catalogue item. Keep every existing call working.
   - `itemEffects` and `canEquip` must work with them, so a crafted +1 rune blade counts on the token like any +1 weapon.
6. **Folk who craft to sell:** **`wares(person, { place, gaze, day, seed })`** → a few seeded crafted designs a smith has made this week, each with its price. Claude adds them to the trade window beside the catalogue stock.

**Tests:**
- every part's numbers are sane, and the SRD-based frames match the catalogue
- incompatible designs are refused with a reason
- a built weapon or armour works through `itemInfo`, `itemEffects` and `canEquip`, and a rune +1 counts
- a wagon's capacity, speed, HP and AC change with its parts
- `plan`, `work` and `finish` add up (hours, failed checks, a ruined material)
- `wares` is deterministic for a day
- names are generated from the parts, and a given name is kept

---

## Task 2: holdings (`codex/holdings`)

**Do:** write `src/engine/holdings.js`, `src/data/holdings.js` and `tests/holdings.test.js`.

1. **Kinds of holding:** camp, house, homestead, outpost, fort, keep (a small castle). Each kind allows a footprint size and a list of modules, and you can grow one into the next (a camp into an outpost, a fort into a keep) by building what it needs.
2. **Modules** (`src/data/holdings.js`): `{ id, n, kinds, footprint:{ w, h }, on:'ground'|'wall'|'inside', cost, materials, days, labour (workers), needs:[module ids], gives:{…}, flavour }`.
   - **Walls and ways:** palisade, stone wall, gate, watchtower, ditch, salt line (the Bloom won't cross it).
   - **Rooms and buildings:** bedroll ring, tent, cottage, hall, bunkhouse, kitchen, stable, wagon shed, storehouse, cellar.
   - **Workshops:** forge (crafting needs it for metal, see Task 1), carpenter (wagons), alchemist's bench, shrine (to the Morninglord, a ward), library, garden, well.
   - **What they give:** safe long rests, storage (lb), defence, a ward (Gaze effects against the place are weaker), workshops for crafting, comfort (morale), income (a garden or a forge selling to the folk).
3. **Placing:** **`canPlace(holding, module, { x, y, rot }, floor)` → `{ ok, why }`.** On the map's grid: walkable ground, inside the holding's bounds, not overlapping, walls on the edge, insides inside a building.
4. **Building over days:** **`startWork(holding, moduleId, at)`**, then **`advance(holding, { days, workers, gold }, rng)`** progresses projects. Workers are the party, hired folk (your folk engine's people, by role) and coin. It returns finished modules and events: a supply cart late; a worker who saw something in the trees, and is one of the Count's eyes.
5. **The holding's numbers:** **`stats(holding)`** → `{ defence, ward, beds, storage, workshops:[…], upkeep (gp a week), income, comfort }`.
6. **The Count notices:** **`raidCheck(holding, court, { gaze, day }, rng)`** → a raid by a court member (your nemesis engine), or null. More likely as his Gaze rises, if they've crossed his court, if the place is rich and lightly defended, and less likely behind a ward and a salt line.
   - **`resolveRaid(holding, raid, { defenders }, rng)`** → damage to modules (to be repaired with `startWork`), loot taken, the raider's fate. It feeds the court through `recordFight`.
7. **A plain data shape** Claude stores in the campaign:
   ```js
   state.campaign.holdings = [{ id, name, kind, place, map, modules:[{ id, module, x, y, rot, built, hp }], projects:[…], stores:{…}, workers:[…] }]
   ```

**Tests:**
- placing is refused off the ground, over another module, and outside the bounds
- building takes the days it says, and more workers make it faster within reason
- stats add up from the modules
- growing a camp into an outpost
- a ward and a salt line make raids rarer
- a raid damages modules and is recorded in the court

**Hook to describe:** Claude builds the holding builder (a Build-tab palette that places modules on a map of the party's own, drawn with the app's houses and new pieces) and a Holdings panel (projects, workers, stores, the week's upkeep). Say which functions to call when a day passes (`courtDay`), and when the party rests there.
