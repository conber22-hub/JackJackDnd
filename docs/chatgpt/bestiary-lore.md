# Prompt for ChatGPT: the bestiary, learned

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/bestiary-lore` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. The heroes meet the valley's creatures one fight at a time: wolves on the road, zombies in the churchyard, things in the mist. Games like this keep a **bestiary** that fills in as you go: a silhouette and "???" until you've seen the thing, its name once you have, what it can take and what hurts it once you've fought it, and its story once you've killed enough of them to understand it. It gives every fight something to collect.

You write the lore and the engine that decides what's been learned. The app records who was seen, fought and killed, and Muse Code draws the book (`docs/muse/brief-13.md`). You don't touch any of that.

Write exactly three files and nothing else:

1. `src/engine/bestiary-lore.js`: what's known
2. `src/data/bestiary-lore.js`: the lore (data)
3. `tests/bestiary-lore.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no timers, no `Math.random`.
- **Pure:** plain JSON in and out; return new objects, never change what you're given.
- **Imports:** the engine imports only `../data/bestiary-lore.js`; the test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original writing.** The repository is public. Curse of Strahd's names are welcome, but **don't copy any sentence from the book or from any monster manual**, and don't copy stat blocks: the numbers come from the app (below). Write each creature as someone in the valley would describe it: a hunter, a priest, a gravedigger, a Vistani storyteller, a frightened child. Grim, specific, short.

## The creatures

The app's creatures have ids (`bid`). Write lore for **at least these 40**, the ones the valley actually throws at the party:

`wolf`, `dire-wolf`, `barovian-wolf`, `count-s-wolf`, `bloomed-wolf`, `werewolf`, `swarm-of-bats`, `swarm-of-rats`, `giant-rat`, `giant-spider`, `zombie`, `skeleton`, `ghoul`, `grave-ghoul`, `wight`, `specter`, `ghost`, `banshee`, `shadow`, `revenant`, `vampire`, `night-spawn`, `scarecrow`, `scarecrow-watcher`, `green-hag`, `night-hag`, `flameskull`, `will-o-wisp`, `animated-armor`, `flesh-golem`, `mist-thing`, `bandit`, `bandit-captain`, `cultist`, `cult-fanatic`, `berserker`, `bloom-stalker`, `sporeling`, `bloom-vessel`, `dinner-guest`

(The last few belong to this campaign's own horror, the Bloom: a fungal rot that takes the dead and the living. Write them as things the valley has only lately begun to whisper about. `dinner-guest` is a thing that sits at a table as if invited.)

Any other id gets a short generic entry built from its name.

## What to write

### `src/data/bestiary-lore.js`

`LORE`, keyed by `bid`:
```js
wolf: {
  family:'beast' | 'undead' | 'fiend' | 'fey' | 'construct' | 'humanoid' | 'monstrosity' | 'bloom',
  seen:'One line for a first sighting: what you notice before anything else.',
  fought:['Two or three lines about how it fights, learned the hard way.'],
  lore:'A paragraph (3–5 sentences) of its story in the valley, in someone's voice.',
  voice:'a Vallaki hunter',          // whose words the lore paragraph is
  tip:'One practical line, for whoever has killed enough of them.',
  killsForLore:3,                    // kills needed for the paragraph (1 for rare ones, up to 5 for common ones)
}
```
And `FAMILY`: a line about each family, for the book's section headers.

### `src/engine/bestiary-lore.js`

Export:
- `fresh()` → an empty journal (plain JSON).
- `note(journal, { t:'seen'|'fought'|'killed', bid, day })` → a new journal: counts of seen, fought and killed per `bid`, and the day each was first seen.
- `entry(journal, bid, stats)` → what the book shows for one creature:
  ```js
  { bid, tier:0|1|2|3, name:'Wolf'|'???', family, seen, fought:[…], lore, voice, tip, revealed:{ … }, counts:{ seen, fought, killed }, next:'Kill 2 more to learn its story.' | null }
  ```
  - **tier 0** (never seen): `name:'???'`, everything else blank except `family:'???'` and a `next` ("Not yet seen.").
  - **tier 1** (seen): its name (from `stats.name`), `family` and the `seen` line.
  - **tier 2** (fought): also the `fought` lines, and from `stats` what fighting it teaches: `revealed:{ ac, hp:'about 11' (its average, rounded), speed, resist:[…], immune:[…], vuln:[…] }`.
  - **tier 3** (killed `killsForLore` times): also the `lore` paragraph, `voice` and `tip`.
  - `stats` (from the app): `{ name, ac, hp, speed, resist:[], immune:[], vuln:[] }`; any of it may be missing.
- `book(journal, roster)` → `{ entries, seen, fought, mastered, of }`: `entries` is every creature in `roster` (`[{ bid, stats }]`) as its `entry`, sorted by family and then name; the counts are how many are at tier 1 or more, 2 or more, 3, and how many there are.

### `tests/bestiary-lore.test.js`

Prove:
- tier 0 → 1 → 2 → 3 as a creature is seen, fought and killed `killsForLore` times, and what each tier shows and hides
- `revealed` appears only at tier 2 and up, and copies only the fields given in `stats`
- an unknown `bid` gets a generic entry and doesn't throw
- `note` doesn't change the journal it's given, and the journal survives a JSON round trip
- `book` sorts by family and then name, and its counts are right
- every one of the 40 ids above has lore: a `seen` line, 2–3 `fought` lines, a `lore` paragraph of 3–5 sentences, a `voice`, a `tip` and a valid `family`; no two `seen` lines are the same

## What Claude will do with it

The app notes a creature as seen when the party first sees it, fought when a fight with it starts, and killed when it dies, and keeps the journal in the save. Muse's book shows it with each creature's portrait. Write it so a player wants to kill a third werewolf just to read the paragraph.
