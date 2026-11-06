# Prompt for ChatGPT: adventure sites (the big one)

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/sites` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them into the dungeon generator and the DM's panels.

This is a bigger task than the earlier ones. Take your time and get it right; the tests are the measure.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a 3D virtual tabletop for a Curse of Strahd campaign (gothic horror, D&D 5e). Its generator builds dungeon floors: rooms on a square grid, joined by tunnels, with stairs up and down. The rooms get furniture and a line of description, but the floor has **no plot**: no reason to go one way rather than another, no locked door with its key somewhere else, no faction living there, and no build-up to a climax.

Your module is the **dramaturge**. Given a floor's rooms and how they connect, it writes the site's plan:
- who lives here and why
- which room is the lair, the shrine, the treasury, the trap, the place of rest
- which doors are locked or secret, and where their keys or levers are
- where the clues lie
- how the visit builds: hook → rising danger → climax → aftermath

The app then places the monsters, the treasure, the locks and the read-alouds from your plan.

Everything you need is here. Write exactly three files and nothing else:

1. `src/engine/sites.js`: the planner
2. `src/data/sites.js`: the site kinds, factions, room roles, keys and text (data)
3. `tests/sites.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no three.js.
- **Seeded:** a small mulberry32 inside the engine, seeded from the `seed` string you're given. No `Math.random`. The same input gives an identical plan.
- **Pure:** never change the input; return a new plan. The plan is plain JSON (no `Map`, `Set` or functions), because the app saves it and sends parts of it to players.
- **Fast:** a 30-room floor in under 20 ms.
- **Imports:**
  - The engine imports only `../data/sites.js`.
  - The test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **The repository is public.** Write every name, line and description yourself. The campaign's names are welcome: Barovia, Strahd (the Count), the Vistani, the Abbot, Vallaki, the Order of the Silver Dragon, Saint Andral. Don't copy any published adventure's text or stat blocks.

## The input

`planSite(floor, opts)` where:

```js
floor = {
  rooms: [{ id, x, y, w, h, type, size }],
  links: [{ a, b, kind }],
  up: roomId | null,
  down: roomId | null,
}
```

- **Rooms:**
  - `size` is the room's area in squares.
  - `type` is the generator's own guess: one of `chamber`, `entrance`, `safe`, `trap`, `treasure`, `lair`, `shrine`, `crypt`, `nest`. You may override it.
- **Links** are the ways between rooms:
  - `kind` is `'door'`, `'open'` (an archway or tunnel with nothing to lock) or `'secret'` (already secret: leave it).
  - The links make a connected graph. It may have loops.
- **Stairs:** `up` is the room with the way in; `down` is the room with the way on, or `null` on the last floor.

```js
opts = {
  seed:'…',
  kind:null,      // a site kind from SITE_KINDS, or null to choose one that suits `theme`
  theme:'undercroft',
  depth:0,        // which floor of the delve (0 = the top)
  last:false,     // the last floor: the climax lives here
  gaze:1,         // the Count's attention, 1–10: higher means darker sites, more of his servants, nastier twists
  level:3,        // the party's level
}
```

Themes: `undercroft`, `silver`, `hands`, `undertow`, `chapel`, `ossuary`, `womb`, `manor`, `wreck`, `mill`, `castle`, `burned`, `cellar`, `dungeon`.

Creature families: `barovia` (the valley's own: wolves, his servants, hags), `dread` (Barovian undead), `seep` (a creeping fungal corruption, the campaign's own), `bloom` (its later form), `andral` (the Labyrinth's hands), `folk` (people and bandits), `srd` (anything).

## What to write

### `src/data/sites.js`

- **`SITE_KINDS`**: at least 10. Each:
  ```js
  {
    id, name,
    themes:[…],
    blurb,
    factions:[…],
    roles:{ …weights },
    keys:[…],
    twists:[…],
    hooks:[…],
  }
  ```
  - `factions`: ids from `FACTIONS`
  - `roles`: how often each room role turns up
  - `keys`: ids from `KEYS`
  - `twists`: at least 3 per kind
  - `hooks`: at least 3 per kind

  Ideas:
  - a crypt the dead have woken in
  - a Seep-taken mine
  - a hag's larder under a mill
  - a smugglers' cellar
  - a forgotten shrine of the Morninglord
  - a vampire spawn's nest
  - a cult's chapel
  - the Count's own catacomb
  - a drowned vault
  - a bandit hideout
  - an alchemist's sealed workshop
  - a wolf den in old ruins
- **`FACTIONS`**: at least 10. Each:
  ```js
  {
    id, name,
    fam:'dread',
    goal,
    attitude:'hostile'|'wary'|'bargain'|'desperate',
    sign,
    leader,
    relations:{ otherId:'hates'|'fears'|'serves'|'trades' },
  }
  ```
  - `sign`: the evidence they leave, e.g. "scratched tally marks", "salt circles broken from inside"
  - `leader`: a short description, not a stat block
- **`ROLES`**: each room role with `{ id, label, needs, encounter, treasure, read:[…], dm:[…] }`:
  - `needs`: a minimum size, or a dead end, or more than one door, and so on
  - `encounter`: `'none'`, `'low'`, `'moderate'` or `'high'`
  - `treasure`: `0`–`3`
  - `read`: at least 2 read-aloud lines
  - `dm`: at least 2 lines of DM notes
  - Roles, at least:
    - `entry`, `guardpost`, `barracks`, `lair`, `boss`, `shrine`, `treasury`, `trap`, `puzzle`, `prison`
    - `library`, `workshop`, `larder`, `rest` (somewhere safe to take a short rest)
    - `clue`: a room that tells the story: a body, a journal, a mural
    - `vista`: somewhere dramatic, a gallery over a drop
    - `empty`: an empty room is good pacing too
- **`KEYS`**: what opens what, `{ id, name, opens:'door'|'secret'|'gate', where:'carried'|'hidden'|'puzzle', text }`. Examples: an iron key on the gaoler, a silver key in a reliquary, a lever behind a tapestry, a word spoken at the door, a puzzle that opens a gate.
- **`BEATS`**: the shape of a visit, with lines for each beat: `hook`, `rising`, `climax`, `aftermath`.

### `src/engine/sites.js`

Export **`planSite(floor, opts)`**, which returns:

```js
{
  seed, kind:'crypt-awake', name:'The Restless Crypt', theme, blurb,
  factions:[{ id, name, fam, goal, attitude, sign, leader, relations }],   // 1–3, the first is the site's owner
  rooms:{ [roomId]: {
    role:'lair',
    faction:'id'|null,
    encounter:null | { fam, difficulty:'low'|'moderate'|'high', note },
    treasure:0–3,
    read:'one or two sentences for the players',
    dm:'notes for the DM: what's here, what happens',
    clue:null | { id, text, points:roomId },   // a clue that points somewhere else
    beat:'hook'|'rising'|'climax'|'aftermath'|null,
  } },
  locks:[{ a, b, kind:'locked'|'sealed'|'secret', key:{ id, name, in:roomId, how:'carried'|'hidden'|'puzzle' } }],
  route:[roomId, …],      // the main way through from `up` to `down` (or to the climax room on the last floor)
  loops:[[roomId, …], …], // alternate routes that rejoin the main one
  climax: roomId,
  twist:'…',              // one twist, from the kind's list, made concrete with the plan's own rooms and factions
  hook:'…',               // why the party comes here: a line for the DM to use
  summary:'…',            // a short paragraph for the DM: the site at a glance
  forPlayers:{ name, hook },  // the only part the players may see before they explore
}
```

How to plan:

1. **Choose the kind** from `opts.kind`, or from the kinds whose themes include `opts.theme`. On the last floor, prefer kinds with a big climax.
2. **Find the shape of the graph:**
   - the main route: the shortest path from `up` to `down`; on the last floor, to the room farthest from `up`
   - dead ends, which make good treasuries, prisons and lairs
   - loops
   - the articulation points: the rooms you can't avoid
3. **Cast the roles:**
   - `up` is `entry`. The climax is the biggest room far along the route: `boss` on the last floor, else `lair`.
   - Treasuries and prisons go in dead ends, and guardposts on the route just before the climax.
   - Put a `rest` room somewhere off the route around halfway, and a `clue` early.
   - Fill the rest by the kind's role weights, with `empty` for pacing. At least a quarter of the rooms should have no fight.
   - A room's `needs` must hold; a `boss` needs at least 30 squares.
4. **Factions and fights:**
   - Assign rooms to factions, the owner holding the most.
   - **Difficulty rises along the route:** `low` early, `moderate` in the middle, `high` at the climax.
   - A higher Gaze adds the Count's servants (`barovia` or `dread`) as a second faction or a twist.
5. **Locks and keys:**
   - Lock 1–3 doors (`kind:'door'` links only, never the only way to `up`).
   - **Every key must be reachable without passing the lock it opens.** Check this by searching the graph with that lock closed. No key may sit behind its own lock, directly or through a chain.
   - A `secret` lock may hide a loop or a treasury: never the only way to `down`.
   - On the main route, a lock's key lies off the route a little, so the party has to explore.
6. **Clues:** two or three clues that point at a lock's key, the climax, or the twist. Each names the room it points to.
7. **Beats:**
   - `hook` at the entry
   - `rising` along the route
   - `climax` at the climax room
   - `aftermath` in a room beyond it, or the treasury
8. **Text:**
   - `read` and `dm` come from the role's lines, filled in with the faction's name, sign and leader.
   - Don't repeat the same line twice on a floor.
   - `twist`, `hook` and `summary` name real rooms by their role ("the barracks", "the flooded shrine") and real factions.

Also export:

- **`validateSite(floor, plan)`** → an array of problems (empty when it's sound). It checks:
  - keys are reachable
  - no lock cuts off `up`
  - the climax and the route exist
  - every room has a role
  - roles meet their needs
- **`forPlayers(plan)`** → only `{ name, hook }`, plus, for rooms the party has explored, their `read`. Call it as `forPlayers(plan, exploredRoomIds)`. Never send `dm`, `twist`, keys or encounters.
- **`describeSite(plan)`** → a text page for the DM, to print: the kind, the factions, each room's role, read-aloud and notes in route order, the locks and where their keys are, the clues, and the twist.

## Tests (`tests/sites.test.js`)

Build test floors in the test:
- a line of 5 rooms
- a loop of 8
- a tree of 12 with dead ends
- a grid-like 20-room floor
- a random connected 30-room graph from a seed

Each room is `{ id, x, y, w, h, type:'chamber', size:w*h }`, with sizes 12–60.

- **Every kind × several seeds × several floors:**
  - `validateSite` returns `[]`
  - the plan is JSON-serialisable
  - it's deterministic for the same seed
- **Keys:**
  - for every lock, with that link removed, the key's room is still reachable from `up`
  - no key is in a room only reachable through its own lock
- **Locks:** no lock is on a link that's the only way to `up`. On a non-last floor, `down` is reachable by some path with all `secret` links removed (but `locked` ones open, since their keys are reachable).
- **Climax:** on a last floor, the climax is a `boss` room of at least 30 squares, and at least as far from `up` as half the farthest room.
- **Pacing:**
  - at least a quarter of the rooms have no encounter
  - difficulty along `route` never goes from `high` back to `low` before the climax
- **Dead ends:** treasuries and prisons prefer them; across many seeds, more than half the treasuries are in dead ends.
- **Gaze:** at Gaze 9, a `barovia` or `dread` faction is present in at least 80% of plans; at Gaze 1, in under 50%.
- **Text:**
  - no `read` line repeats on a floor
  - `summary`, `twist` and `hook` are non-empty and mention at least one faction name
- **`forPlayers`:**
  - never contains `dm`, `twist`, `locks` or `encounter`
  - only includes `read` for the rooms passed in
- **Speed:** 30 rooms in under 20 ms (assert under 200 ms).

If you can write to the GitHub repository `conber22-hub/JackJackDnd`:
- put the three files on a new branch `chatgpt/sites`
- open a pull request against `claude/dread-delve-v0.2`
- don't touch any other file, and never commit `dread-delve.html`

Otherwise, reply with the three files, each complete, in its own code block headed by its path.
