# Dread Delve — Roadmap

A 3D, multi-floor dungeon simulator for the Dread Zone beneath Saint Andral's. Built in honor of Chance.

When you start a Claude Code session, say: *"Read DREAD-DELVE-ROADMAP.md, then help me with…"* and it will know how the app is put together.

---

## How to run it

- **Just play:** double-click `dread-delve.html` (Chrome or Edge). Everything, including Three.js and PeerJS, is baked into that one file, so the 3D works offline. Multiplayer still needs internet, because players find each other through the free PeerJS server.
- **Edit it:** `npm install` once, then `npm run dev`, then open http://localhost:5173. Changes show up live.
- **Bake a new single file:** `npm run build` writes `dread-delve.html` (copied from `dist/index.html`). Commit it so players always get the latest version.
- **Tests:** `npm test` runs the engine tests (generator, stairs alignment, doors, tables, import).

---

## What v0.2 does

Everything from v0.1 is still there: seeded multi-floor generation, the Tilt/Top/Stack views, Dread 1–10, the Shift, 16 horrors with Grok prompts, initiative and attacks, multiplayer with fog of war, art standees, autosave and export. On top of that:

### Phase 1 — Made it yours (done: Flood-style Seep campaign)
- **Dread levels 1–10 renamed and given rules.** The levels track the Seep's infestation: Uneasy Gloom → Damp Stone → Spore Drift → Weeping Walls → The Tide Stirs → Shifting Halls → Biomass Bloom → The Seep Rises → Choir of the Taken → Reality Collapse. Each level has read-aloud text and **automatic effects in combat**: Seep regeneration, a Seep to-hit bonus, a chance each round that a Seepling buds, a chance each round that unclaimed corpses get taken, and the Shift chance. Rename or rewrite any level in the **Dread tab**.
- **Full statblocks** for the Monstrosity of Hands (CR 9) and Saint Andral (CR 21). Andral gets a second phase, *Saint Andral, Half-Taken* (CR 22), which triggers automatically at half HP. Both bosses have legendary and lair actions.
- **New Seep creatures:** Husk-Templar (CR 4, a taken church knight), the Budding Mind (CR 10, the proto-mind), and the Reliquary Colossus (CR 12, the juggernaut form). Each has its own 3D mini. That makes 22 creatures.
- **Seep mechanics that run on their own:**
  - *Host Seed:* a Seepling latches on when it hits. If the host dies while it's latched, the host rises as a Husk next round unless healed first; a fallen PC becomes "Husk of Gribbles".
  - *Pack Tide* gives advantage automatically.
  - *Burst Sac:* any single hit of 5+ pops a Seepling.
  - *Unfinished Death* now also ends to fire, not just radiant.
  - *All Flesh Returns* heals the Undertow when Seep die near it.
  - *Overmind Link* stuns the floor's Seep when the Mind dies.
- **On-hit saves and conditions:** attacks carry an `on:{save, dc, cond}` field, such as the Bellmouth's paralysis, Sinew Line's restraint, and Silver Cough's blindness. Conditions show on the minis and the cards, count down by round, stop movement (restrained, grappled, paralyzed, stunned), and grant advantage or disadvantage automatically.
- **The d100 Shift table.** Every Shift rolls d100 and applies a row: rewire, rooms swap, forgetting halls, doors lock or fly open, a room becomes a nest, the stairs wander, hidden traps grow, the party is scattered, and more. The whole table is plain text you can edit in the Dread tab, or use the "roll" box to call a specific result.
- **The Grasp Die** (d4 → d12) escalates Andral's hands. It grows when Hands die (unless radiant killed them) and shrinks when the Monstrosity dies. It auto-rolls at round end while hands are present, and the Monstrosity makes it roll twice and keep the higher. The 12-row Grasp table is editable too. The ✋ badge in the top bar opens it.
- **Party:** Gribbles, Mulan, Milson, Alexander and Vlad gained *Tools* (lockpicking/disarm bonus) and *Passive Perception* (spots traps and secret doors). **Their numbers are still placeholders.** Put the real sheets in the Tokens tab.
- **Bestiary editor:** ✎ Edit on any creature opens its statblock as JSON. *Save* overrides it in this delve; *Save as new creature* adds one. Edits travel with the save and reach players.
- **Copy every Grok prompt** in one click (Bestiary tab).

### Phase 2 — Build floors by hand (done)
- **Build tab** (or press **B**). Its tools sit in the dock:
  - **Room:** drag a room to move it (tokens, traps and stairs come along, and the floor below follows the stairs); drag a corner to resize; drag on bare rock to draw a new room; tap a room to select, rename, retype, populate or delete it.
  - **Hall:** trace a corridor with your finger or mouse.
  - **Door:** open, closed, locked or secret.
  - **Trap:** Hinged Floor (drops you a floor), Silver Wire, Spore Vent (spawns Seeplings), Drowning Font, Bone Grinder, Tolling Bell (Dread +1 and alerts the floor), Grasping Floor (rolls the Grasp Die), Collapsing Shaft.
  - **Stairs:** move them; the next floor lines up.
  - **Erase**, **Dig**, **Fill** (drag to paint), and **Undo** (Ctrl+Z).
- **Auto-link on/off.** Turning it off freezes the generated corridors into hand-drawn ones you can erase and redraw. The Shift then stops rewiring that floor but keeps doing everything else.
- **Doors in play:** closed doors open as you walk through and block sight; locked doors need a Pick (Tools vs DC) or a Force (noisy: it alerts the floor); secret doors look like wall to players until found.
- **Traps in play:** they fire when a party member steps on them. Heroes whose passive Perception beats the trap's DC spot it on their own and stop before walking in. **Search** actively checks 15 ft; **Disarm** uses Tools, and failing by 5 or more sets the trap off. Players only ever see traps they've found.
- **Templates:**
  - *The Descent of Saint Andral*
  - *Castle above, crypt below, mine under that* (chapel → ossuary → silver vein)
  - *Outbreak* (pre-populated; Budding Mind in the Womb, Undertow at the bottom)
  - *Andral's Labyrinth* (small rooms, many locked and secret doors, double traps)
  - *Blank stone* (build by hand)

  There are three new floor looks: the Chapel, the Ossuary Deeps and the Budding Womb.
- **Populate** a floor or a single room from its theme's denizens. **Add a floor** below the bottom, or remove the bottom one.
- **Import maps.** The importer accepts Battle Table JSON and any grid JSON, whether cells are numbers, strings, booleans, objects or a sparse `{x,y,type}` list. It picks up rooms, doors, traps, stairs and tokens (matched to the bestiary by name). It also takes **ASCII**: `#` rock, `.` floor, `+` door, `'` open, `L` locked, `S` secret, `^` trap, `>` down, `<` up, with `=== Name ===` between floors. You can **replace this floor** or **import a whole delve**. Stairs are re-aligned so the stack still lines up, and the import card lists anything it changed.
- **Export a floor** as ASCII (to edit in a text editor and paste back) or as JSON.

  > ⚠ I didn't have a sample Battle Table export to test against. If yours isn't recognized, drop one file in this folder and ask Claude Code to teach the importer its format (`src/engine/importer.js`).

### Phase 3 — Split into a project (done)
v0.1's single file is now a Vite project. `npm run build` bakes it back into one HTML file to hand to players.

---

## Phases from here

### Phase 4 — Make it beautiful
1. Real 3D models (GLB): free CC0 dungeon kits from Kenney and Quaternius for walls, doors, torches and props. Load them in `src/render/minis.js` and `src/render/floors.js`; the procedural shapes stay as the fallback.
2. Stone and wet-floor textures per floor theme.
3. Torch shadows, bloom on glowing eyes and runes, and a film-grain/vignette pass.
4. Sound: a drone per Dread level, stone grinding on Shift, hand-skitter loops, the Bellmouth's toll, a creak when doors open, and a click when a trap triggers.
5. Animated minis: the Undertow's tendrils sway and hands crawl along walls.

### Phase 5 — Deeper rules
Partly started: conditions with round durations and automatic advantage/disadvantage are in.
1. True line-of-sight fog. Doors already block sight, but walls still only block it by walking distance.
2. A legendary action counter, and lair actions on initiative 20. These are written into the statblocks but not yet automated.
3. Players request attacks and the DM approves the roll.
4. An encounter generator per Dread level from your d10 tables. *Populate* is the seed of this.
5. Multi-floor events: something on Floor 3 hears the fight on Floor 2. The *alert* flag already exists.
6. Difficult terrain: the Bloat-Mourner's slick trail, the Monstrosity's aura, and floodwater.

### Phase 6 — Harden multiplayer
1. Auto-reconnect when a phone sleeps.
2. Strip hidden data from what players receive. They don't **see** hidden traps, secret doors, room types or monster HP, but the data still reaches their browser.
3. An optional relay server of your own, so you don't depend on the free public one.

---

## Code map

```
index.html              page markup + all CSS
src/main.js             boot + the render loop (fog, flicker, mist, whispers)
src/debug.js            window.DreadDelve console handle (also used by the smoke tests)
src/util/core.js        dice, seeded random, tiny event bus
src/data/               ← the content. Edit freely.
  dread.js              Dread levels 1–10 (look + rules + read-aloud), whispers, conditions
  bestiary.js           FAMILIES, BESTIARY, default party
  themes.js             floor themes (+ denizens, Grok prompts) and TEMPLATES
  rooms.js              room types & names, TRAP_KINDS, DOOR_STATES
  tables.js             the d100 Shift table and the Grasp table (+ the effect list)
src/engine/             pure logic: no DOM, no Three.js, unit-tested
  state.js              state + ui, token factories, newState
  generator.js          floors, rooms, corridors, carve(), doors, traps, stairs, populate
  grid.js               movement, sight, passive Perception
  importer.js           Battle Table / grid JSON / ASCII import, ASCII & JSON export
  tables.js             roll-table parser
src/game/               rules that touch the scene and UI
  combat.js             initiative, attacks, damage, death hooks, the fx language, round-end Dread effects
  shift.js              the Shift (rolls the d100 table)
  grasp.js              the Grasp Die
  actions.js            select, move (doors / traps), stairs, falling, doors, search, disarm, floors, dread
  build.js              Build tools, templates, populate, add/remove floors, import
  rules.js              movement allowance, conditions
  session.js            save / load / export, v1 save migration, undo, changed()
src/render/             Three.js
  scene.js              renderer, camera, lights, tweens, labels
  floors.js             stone, walls, stairs, doors, traps, mist, the Shift animation
  minis.js              procedural 3D minis (SHAPES) + syncing tokens
  effects.js            selection ring, reach glow, pings, bursts, Build overlays
src/net/table.js        multiplayer (host, join, messages)
src/ui/                 hud.js (top bar, dock, cards) · panels.js (tabs) · input.js (taps & drags) · events.js (buttons)
tests/engine.test.js    node --test
```

## Adding a monster
Copy any entry in `src/data/bestiary.js`, or use **✎ Edit → Save as new creature** in the app. The useful levers:

- `shape` picks the mini: seepling, husk, templar, bloat, stalker, quill, bulwark, colossus, mind, undertow, hand, handmass, lich, wraith, bellghoul, weaver, candle, dwarf or vampire. Ask Claude Code for a new one if none fit.
- `attacks[].on` is a save-or-condition on hit, e.g. `{ save:'con', dc:12, cond:'paralyzed', rounds:1 }`. `latch:true` latches on (Host Seed).
- `pack:true` gives Pack Tide advantage.
- `specials` are buttons on the creature's card, written in the fx language:
  - `spawn:husk:2@corpse` (the `@` part is optional: `near`, `party`, `nest`, `corpse` or `random`)
  - `aoe:2:con:12:2d6:poison:poisoned` (radius in squares, save, DC, damage, type, condition); `aoeall` hits allies too
  - `party:str:13:1d6:bludgeoning:restrained:random` (the party on this floor saves; the condition can be `pit`)
  - `condall:seep:stunned:1` · `heal:2d10` · `heal:seep:2d10` · `shift` · `dread+1` · `grasp:roll` · `grasp+1` · `morph:quill` · `alert` · `whisper`
- `hooks.onDeath`, `hooks.onTurnStart` and `hooks.onBloodied` use the same fx language, plus `divide` and `unfinished`.

## Prompts that work well with Claude Code
- "Read DREAD-DELVE-ROADMAP.md. Put in the real stats for Gribbles: [paste sheet]."
- "Here is a Battle Table export [file]. Make the importer understand it."
- "Add a new monster: [paste your statblock]. Give it a new 3D shape that looks like …"
- "Make Phase 4 step 4 happen: a drone per Dread level and a grinding sound on Shift."
- "Automate legendary actions with a counter on the initiative bar."

Small asks, one at a time, and run `npm run dev` after each change to check it. Run `npm run build` when you're happy, so `dread-delve.html` is up to date.
