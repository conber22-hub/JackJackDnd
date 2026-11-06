# Codex, round 9: talking, and running

Round 8 is in: the garrison stocks the sites and raises the alarm, and the hoards are real. Thank you.

Two things the table does every night still have no rules underneath them:
- **Talking to people.** Barovians are frightened, proud and watched. What one of them thinks of the party should matter, should change, and should be remembered.
- **Running from things.** The Count's wolves, a mob with torches, a carriage that won't stop.

Claude builds the screens and the wiring. You write the rules underneath.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text, or SRD 5.2.1 numbers, never book text
- pure modules: no DOM, no Three.js, every die from the `rng` passed in, and every state plain JSON
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other). In each, say what's covered, what you skipped and why, and the exact hooks for Claude.

## What's there (read; don't change)

- **The folk** (`src/engine/folk.js`, yours from round 5):
  - people `{ id, role, name, mood:'easy'|'wary'|'afraid', home, haunts, … }`
  - `greet`, `rumourFor`, `witnesses`, `tellTheCourt`
- **The Count's court** (`src/engine/nemesis.js`): his servants, who hear what witnesses tell.
- **His Gaze:** `state.dread`, 1–10.
- **Checks:** `src/engine/checks.js`. **Heroes:** `src/engine/hero.js`, with ability scores, skills, proficiency and passive scores.
- **Movement and terrain** (`src/engine/movement.js`):
  - difficult ground
  - exhaustion levels on creatures, with the conditions engine (yours) in `src/engine/conditions.js`
- **Your tactics** (`src/engine/tactics.js`) and **garrison** (`src/engine/garrison.js`).

---

## Task 1: talking (`codex/social`)

**Do:** write `src/engine/social.js`, `src/data/social.js` and `tests/social.test.js`.

1. **The SRD's attitudes** for every person the party deals with: `hostile`, `indifferent`, `friendly`. Add a Barovian `terrified`: they won't help, whatever is said, until the danger they fear is dealt with.
   - **`attitudeOf(person, { gaze, party, place })`:** start from their mood and role, darken it as his Gaze rises, and adjust it by what they remember of the party.
2. **Influence:** `influence(person, { approach, hero, offer, rng })` → `{ ok, roll, dc, shift, text, cost }`.
   - Approaches:
     - `persuade`, `deceive`, `intimidate`
     - `bribe`, with `offer` in gp
     - `perform`
     - `insight`: read them first, and learn what they want and fear
   - **DCs follow the SRD:** easy for a friendly person's small favour, hard or impossible for a hostile person's big one.
   - **Each person has wants and fears** (from the data, by role: a priest wants the dead buried properly and fears the Church being shamed). Speaking to a want lowers the DC; touching a fear helps intimidation but costs warmth later.
   - **Results:** a success can shift the attitude one step; a bad failure (fail by 5 or more) shifts it one step worse. A deception that's found out is remembered.
   - **The cost:** a bribe paid, a promise made (a debt the person will call in), or a witness to an intimidation. Witnesses go to `witnesses()`, so the court may hear.
3. **Memory:** `remember(person, event)` and `recall(person)`. Each person keeps a short record:
   - "they saved my son"
   - "they lied about the burgomaster"
   - "they paid well"

   Each record has a weight and fades with days, except debts, which never fade. Attitude is recomputed from the memories, so a good deed weeks ago still counts. `forPlayers(person)` → only what the party could know, never the numbers.
4. **Rumours by attitude:** a friendly person tells the truth, an indifferent one a half-truth, a hostile one a lie that sounds true. Mark which in the DM's view only.
5. **Tests:**
   - attitudes and DCs follow the SRD bands
   - wants lower DCs, and fears help intimidation and cost warmth
   - a bad failure worsens the attitude
   - memories fade and debts don't
   - a remembered rescue keeps someone friendly through a rising Gaze
   - a found-out lie is remembered
   - witnesses are reported
   - `forPlayers` never shows numbers or the truth of a rumour
   - deterministic for a seed; JSON state

## Task 2: running (`codex/chase`)

**Do:** write `src/engine/chase.js`, `src/data/chase.js` and `tests/chase.test.js`.

Write chase rules of your own: in the spirit of the game, but no book's chase tables.

1. **`startChase({ quarry:[…], pursuers:[…], terrain, light, weather, rng })`** → a chase state.
   - The quarry and pursuers are creatures, each `{ id, speed, con, dex, exhaustion, size, mount?, cart? }`.
   - Terrain is one of: `village street`, `woods`, `road`, `marsh`, `castle halls`, `rooftops`.
   - Positions are distances in feet along the chase, with a lead.
2. **Rounds:** `chaseRound(state, actions, rng)` → `{ state, events }`.
   - Each participant moves its speed, or **Dashes**. The SRD allows free Dashes up to 3 + Con modifier times; after that each needs a DC 10 Constitution check or a level of exhaustion.
   - Other actions:
     - `hide` (Stealth against the pursuers' passive Perception, if the lead and the light allow)
     - `obstacle` (knock something down: a DC for the pursuers)
     - `attack` (in reach or range)
     - `help` (a slower friend)
3. **Complications:** each round, roll on the terrain's table (data). At least 12 per terrain, invented and Barovian. For example:
   - a funeral procession blocks the street
   - a root snags a foot
   - mist rolls in (the lead counts double for hiding)
   - a wolf howl answers from ahead
   - a cart overturns
   - a bell starts ringing

   Each has a check and an effect.
4. **Ends:**
   - the quarry gets away (out of sight with a big enough lead, or hidden at the end of a round)
   - the pursuers catch up (within 5 ft at the end of a round: a fight starts, and Claude places them)
   - someone gives up (exhaustion, or morale for monsters)

   `result(state)` → `{ over, who, how, positions }`.
5. **Mounts and carts:**
   - A mount's or cart's speed counts (from the SRD's mounts and vehicles: a riding horse 60 ft, a draft horse 40 ft, a cart pulled at its team's speed).
   - The quarry's wagon (Claude's wagons) can be chased, with its HP and damage.
6. **Tests:**
   - the Dash limit and exhaustion follow the rule above
   - a faster pursuer closes and a slower one falls behind
   - hiding needs both lead and cover
   - obstacles slow pursuers on a failed check
   - every terrain has 12 or more complications with valid checks
   - a chase always ends within a cap (e.g. 20 rounds)
   - deterministic for a seed; JSON state

Give each a short section in the PR for Claude:
- where talking plugs in: the folk's tap card (`src/render/folk.js`, `src/game/folk.js`), and an NPC's card in the Night tab
- what a chase needs from the table: who's in it, the terrain from the map's theme, the weather from `state.campaign.wx`
