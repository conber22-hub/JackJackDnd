# Codex, round 10: fear, and the mob

Round 9 is in: people remember the party, and chases have rules. Thank you.

This is a horror campaign, and two things the table keeps reaching for have no rules underneath them:
- **Fear and its marks.** In Barovia, what the heroes see should cost them something besides hit points: a shaking hand, a night without sleep, a habit that won't stop.
- **The mob.** A village rising with torches. Thirty zombies in a churchyard. Fifty bats out of a tower. That's too many for one turn each.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text, or SRD 5.2.1 numbers, never book text
- pure modules: no DOM, no Three.js, every die from the `rng` passed in, and every state plain JSON
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other). In each, say what's covered, what you skipped and why, and the exact hooks for Claude.

## What's there (read; don't change)

- **Conditions** (yours, `src/engine/conditions.js`): the SRD conditions including `frightened`, with timing and exhaustion.
- **Heroes** (`src/engine/hero.js`): ability scores, saves, proficiency.
- **Rest** (`src/engine/rest.js`, ChatGPT's): long and short rests and their interruptions.
- **His Gaze:** `state.dread`, 1–10.
- **The site's garrison** (yours, `src/engine/garrison.js`) and **encounters** (`src/engine/encounter.js`).
- **Swarms in the SRD:** swarm statblocks exist. The mob rules below are for many individual creatures fighting as one.

---

## Task 1: fear (`codex/horror`)

**Do:** write `src/engine/horror.js`, `src/data/horror.js` and `tests/horror.test.js`. Invent the rules: in the spirit of the game, but not any book's horror or madness tables.

1. **Horror checks:** `horrorCheck(hero, { source, dc, gaze, rng })` → `{ ok, roll, dc, effect, text }`. A Wisdom saving throw.
   - **Sources:** the dead rising, a friend's corpse, the Count's presence, the Seep's growth, a betrayal, a child in danger, the impossible.
   - **The DC** comes from the source, plus Gaze above 5. A hero who has passed this source before gets advantage.
   - **On a fail**, an **effect** from the source's table:
     - frightened for 1 minute
     - a short-term mark (until a long rest)
     - at worst, a **lasting mark**
2. **Marks** are the heart of it. Write at least 30, each `{ id, n, kind:'short'|'lasting', mechanics, text, cure }`.
   - **Mechanics are small and playable, using conditions and the SRD's advantage and disadvantage**, e.g.:
     - "disadvantage on Perception checks in the dark"
     - "can't take a long rest without a light burning"
     - "must succeed on a DC 10 Wisdom save to willingly enter water"
   - **The text** is a line for the player ("Your hands won't stop shaking until you've washed them").
   - **The cure:** a long rest (short marks), or lasting ones by a deed or service:
     - a night at a holy place
     - a ritual
     - the *Lesser Restoration* or *Greater Restoration* spells, as the SRD has them
     - confronting the source
3. **Stress (optional for the DM):** `stress(hero)` counts fails since the last long rest. At 3, the next fail gives a lasting mark. A long rest in a safe place clears one point; `relief(hero, kind)` handles the good things (a hot meal, a prayer, a song, a friend's hand).
4. **His Gaze:** at Gaze 7 and up, some lasting marks gain a whisper: Claude may let the Count speak through them once per session.
5. **Tests:**
   - DCs scale with the source and the Gaze
   - advantage after a past success with the same source
   - effects follow the fail margin (worse fails, worse marks)
   - short marks clear on a long rest and lasting ones don't
   - each lasting mark has a cure that works
   - stress at 3 forces a lasting mark
   - every mark's mechanics use valid condition ids or advantage/disadvantage words
   - deterministic for a seed

## Task 2: the mob (`codex/mobs`)

**Do:** write `src/engine/mobs.js`, `src/data/mobs.js` and `tests/mobs.test.js`. Write your own mob rules: many identical creatures fighting as one.

1. **`makeMob(creature, n, { rng })`** → a mob `{ id, b, n, hp:[…], ac, attack, morale, formation }`.
   - `creature` is an SRD statblock, as the bestiary has it, with `ac`, `hp`, `attacks` and `cr`.
   - `hp` holds each member's hit points, so damage removes whole members.
2. **Attacking as a mob:** `mobAttack(mob, target, { rng })` → `{ hits, damage, text }`.
   - **Don't roll 30 attacks:** work out how many members need to attack to hit the target's AC on average, and use that. Your own table goes in the data, e.g. AC needing a 16+ means 1 hit per 5 attackers.
   - Only members who can reach attack, up to the number that fit round a creature of the target's size (8 round a Medium target).
3. **Damage to a mob:** `hitMob(mob, damage, { area = false })`.
   - Single-target damage kills members one at a time, carrying over.
   - **Area damage** hits every member in the area: give the count from the area's squares and the mob's formation.
4. **Morale:** `moraleCheck(mob, { leaderDead, lost, gaze, rng })`.
   - When it loses a quarter, then half, or its leader, it makes a check.
   - A mob of villagers breaks easily; undead never break, but a Turn Undead effect breaks them as the SRD's Turn Undead says.
   - It returns `{ holds, flees:n, text }`.
5. **Moving a mob:** `formation(mob, squares)` → the squares the mob fills on the grid (one square per Medium member, closest first), for Claude to draw as many minis or one big swarm-like token.
6. **Village risings:** `rising({ place, gaze, cause, rng })` → a mob of commoners or guards with:
   - a leader (an invented name and grievance)
   - torches
   - a demand

   It can be talked down: Claude will use Codex's social engine against the leader.
7. **Tests:**
   - a 30-zombie mob does sensible damage against AC 12, 16 and 20 (averages within a range you state)
   - only members who can reach attack
   - single damage removes members one by one and area damage hits many
   - morale thresholds trigger
   - undead don't break except to turning
   - `formation` returns distinct open squares
   - a rising has a leader and a demand
   - deterministic for a seed; JSON state

Give each a short section in the PR for Claude:
- where a horror check is called for (a creature with a `horror` tag appearing, a friend dying, the Count arriving)
- how the mob should look on the map
