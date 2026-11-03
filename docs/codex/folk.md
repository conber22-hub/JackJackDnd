# Codex: the folk of Barovia (round 5, one task)

The valley's villages, roads and halls should feel lived in. The people there go about their day, and some of them are the Count's eyes. Claude draws them as sprites and wires them in; you write the rules underneath.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text only, never book text
- pure modules: no DOM, no Three.js
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Read `src/engine/nemesis.js` too (the Count's Court). The folk feed it.

One pull request, **`codex/folk`**, against `claude/dread-delve-v0.2`.

## Files
- `src/data/folk.js` (new): roles, names, lines, rumour templates. All invented, in the voice of the existing data (`src/data/court.js`, `src/data/npc-starter.js`).
- `src/engine/folk.js` (new): pure, every die from the `rng` passed in.
- `tests/folk.test.js` (new).
- You may add fields to a court member (`m.knows`, below) and read anything in `nemesis.js`. Change `nemesis.js` only if you must, and say why in the PR.

## The shape of a person
```js
{ id, role, name, x, y, home:{x,y}, haunts:[{x,y}], mood:'easy'|'wary'|'afraid',
  spy:null | { for:memberId },        // one of the Count's eyes; never shown to players (Claude redacts it)
  seen:[] }                            // what they've witnessed lately: [{ kind, x, y, day }]
```
A floor is the app's floor object: `W`, `H`, `grid` (walkable tiles per `src/engine/grid.js`), `rooms`, and `place` on settlement maps. Use `grid.js`'s pure helpers for walking and sight; don't write your own.

## Do
1. **`populate(floor, { place, seed, gaze, night, court })` → folk[]**
   - Who lives here, by kind of place:
     - villages and towns: farmers, a smith, children, elders, the watch, a priest, beggars
     - camps: travellers and their dogs (invent a people; don't use the module's names)
     - roads: a peddler, a pilgrim, a lost child
     - dungeons: almost no one: a hermit, a captive
   - How many: by the floor's size, fewer as his Gaze rises (people stay in), fewer at night.
   - Homes are inside buildings or rooms; haunts are open squares where people gather (a well, a market, a church door).
   - **The Count's eyes:** with Gaze 1, one in twenty folk is a spy; at Gaze 5, one in five. Each spies for a living court member, preferring one that is hunting.
2. **`stepFolk(folk, floor, { party, fight, night, rng })` → [{ id, x, y }]**
   - One tick of the day: a step of at most one square for each person who moves.
   - By day they wander between home and haunts; at night they head home and stay there.
   - They never stand on the party's squares or walk through walls.
   - In a fight they flee home, away from the fighting.
   - Spies drift towards the party but keep 3–6 squares away.
3. **`witnesses(folk, floor, event, { range = 8 })` → ids** who saw it, using `grid.js` line of sight.
   - `event`: `{ kind:'fight'|'spell'|'kill'|'theft'|'arrival', x, y, by?:heroName }`
   - Add the event to each witness's `seen`, keeping the last 5.
4. **`tellTheCourt(court, folk, ids, event, { place, day }, rng)` → news[]**
   - A spy among the witnesses tells its master. That member learns: `m.knows = { party:place, day, heroes:[…] }`. A kill or a spell teaches a little more: `m.knows.tactic` is that hero's damage type.
   - The member starts hunting, and gets a news item (`{ who, text, rumour:false }`; spies' news isn't for the players).
   - An ordinary witness to a kill spreads it as a rumour (`rumour:true`).
   - Add one hook to `pickAmbushers` (or a sibling): a member who knows where the party is ambushes more readily. Say what it does in the PR.
5. **`rumourFor(person, court, { gaze }, rng)` → `{ text, about:memberId|null, true:boolean }`**: what someone tells the party when spoken to.
   - Gossip about a court member: their haunt, a recent `court.news` item marked `rumour`, or a hint at their weakness. That hint is sometimes wrong (`true:false`), more often as his Gaze rises.
   - A spy lies, steering the party towards its master's haunt.
   - Otherwise, local colour by role and mood.
6. **`greet(person, { gaze, night }, rng)` → a line**: by role and mood. Afraid folk say little.

## Tests
- Populate is deterministic for a seed. Folk stand on walkable squares, homes are inside, and the counts fall with Gaze.
- Steps never go through walls or onto the party. Folk are home at night. They flee in a fight. Spies keep their distance.
- Witnesses respect line of sight.
- `tellTheCourt` teaches only through spies, and kills spread as rumours.
- Rumours name real living members, and a false one names the wrong weakness.
- The spy rate rises with Gaze.

## In the PR
- What's covered, what you skipped and why.
- The exact hooks Claude needs:
  - when to call `populate` (arriving on a map, at dusk and at dawn)
  - how often to call `stepFolk`
  - which game events call `witnesses` and `tellTheCourt`
  - what `m.knows` changes in an ambush
