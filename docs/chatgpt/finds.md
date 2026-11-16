# Prompt for ChatGPT: things to find and read in Barovia

Copy everything below the line into ChatGPT, or tell ChatGPT to read this file in the repository and do it.
- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/finds` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. A hero walks the valley of Barovia square by square, like the old pocket-console adventure games: villages, roads through the woods, churches, graveyards, the inside of houses. What's missing is **things to find and read**: a glint in the grass that turns out to be a few coins or a torn diary page, a gravestone with a line on it, a notice nailed to a door, a shrine with an offering, a warning scratched into a tree, a barrel that's worth a look (or not).

You write the content as data and a pure engine that places it on a map and says what's found. The app draws the glints, shows the text and gives the loot; you don't touch any of that.

Write exactly three files and nothing else:

1. `src/engine/finds.js`: the placer and the rules
2. `src/data/finds.js`: the content (data)
3. `tests/finds.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no timers, no `Math.random`: every bit of chance comes from a seed (write a small seeded generator in the engine, such as mulberry32 over a string hash).
- **Pure:** plain JSON in and out.
- **Imports:** the engine imports only `../data/finds.js`; the test imports the engine and the data.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original writing.** The repository is public. Curse of Strahd's names are welcome (Barovia, Vallaki, Krezk, the Svalich Woods, the Vistani, the Morninglord, Mother Night, Strahd, Ireena, the burgomasters, the Abbey of Saint Markovia, Lake Zarovich, Tser Pool, Old Bonegrinder, Argynvostholt…), but **don't copy any sentence from the book**, its boxed text, its handouts or its letters. Write your own. Keep it grim, quiet and specific; short lines, plain British-flavoured English, no modern slang.

## The map you are given

```js
floor = {
  W, H,                                   // squares (usually 40 × 40)
  kind: 'village' | 'town' | 'road' | 'woods' | 'church' | 'graveyard' | 'interior' | 'crypt' | 'castle' | 'camp',
  open: [[x, y], …],                      // squares someone can stand on
  path: [[x, y], …],                      // squares of road or track (a subset of open)
  props: [{ kind, x, y }, …],             // what stands on the map (kinds below)
  rooms: [{ x, y, w, h, name, outdoor }], // named areas
}
```

Prop kinds you can hang finds on (others exist; ignore them): `gravestone`, `signpost`, `milestone`, `shrine`, `statue`, `well`, `barrel`, `kegs`, `crate`, `sacks`, `cart`, `wagon`, `chest`, `bookshelf`, `desk`, `wardrobe`, `bed`, `coffin`, `sarcophagus`, `altar`, `pew`, `deadtree`, `boulder`, `stump`, `scarecrow`, `gallows`, `hay`, `woodpile`, `cottage`, `house`, `hall`.

## What to write

### `src/data/finds.js`

- **`READ`**: lines to read, keyed by what they're on. At least:

| key | on | at least |
| --- | --- | --- |
| `gravestone` | a grave | 40 epitaphs: a name, years in the Barovian calendar or none, a line (some tender, some bitter, a few that are wrong in a way you notice) |
| `notice` | a notice on a door, wall or post in a village or town | 30, with a `where` of `'village'`, `'vallaki'`, `'krezk'` or `'any'` (a curfew, a missing child, a festival, a reward, a warning about wolves, the burgomaster's orders) |
| `shrine` | a wayside shrine or altar | 15 (to the Morninglord, to Mother Night, to Saint Markovia; what has been left there) |
| `carving` | a dead tree, a boulder, a stump, a gallows | 25 warnings or names scratched by travellers |
| `statue` | a statue | 8 |
| `well` | a well | 8 |
| `milestone` | a milestone | 8 (worn numbers, a name, moss) |

- **`PAGES`**: at least 30 **lore pages**, torn from the diaries, letters and ledgers of people who came into the valley and didn't leave. `{ id, title, text, where:[kinds] }`; text is 2–4 sentences. A few belong to the same writer and read as a thread if found in order (give them a shared `thread` id and an `n`).
- **`TRINKETS`**: at least 30 small Barovian keepsakes worth picking up (`{ n, gp }`: a value of 0 to 5 gold pieces): a tin wolf charm, a child's tooth in a locket, a candle stub stamped with a sun…
- **`SEARCH`**: what searching a prop turns up, by prop kind: a list of outcomes `{ w (weight), say, gp?, trinket?, page?, potion? }`. Mostly nothing, said in a way worth reading ("Salt, gone hard. Nothing else."); now and then something.
- **`GLINT`**: what a glint on the ground can be, by floor kind: weighted outcomes as above.
- **`HOW_MANY`**: by floor kind, how many glints `{ min, max }` and how many of them are hidden (seen only up close by a sharp-eyed hero).

### `src/engine/finds.js`

Export:
- `placeFinds(floor, { seed, gaze = 1, taken = [] })` → a list of finds:
  ```js
  { id, x, y, kind:'glint' | 'read' | 'search', on:propKind|null, hidden:bool, dc, text?, out? }
  ```
  - `id` is stable for the same seed and map (so the app remembers what's been taken).
  - Leave out anything in `taken`.
  - **`read`:** one for each gravestone, statue, shrine, well and milestone, plus a notice on a few village and town buildings (on an `open` square next to the building) and a carving on a few dead trees, boulders, stumps and gallows. Its `text` is chosen from `READ`, without repeats on one map.
  - **`search`:** on barrels, crates, sacks, chests and the like; each with its outcome `out` already rolled from `SEARCH`.
  - **`glint`:** placed on `open` squares, not on `path`, not on a prop, at least 4 squares apart, never in the first room (where the hero comes in). Their `out` is rolled from `GLINT`.
  - **`hidden` and `dc`:** hidden glints have a `dc` of 12–16, higher with Strahd's Gaze (`gaze`, 1–10); visible ones have a `dc` of 0.
- `noticed(find, { passive, dist })` → true when the hero can see it: a visible glint within 6 squares; a hidden one only within 2 squares and with `passive >= dc`; `read` and `search` finds always.
- `outcome(find)` → `{ say, gp, trinket, page, potion }`: what taking it gives (a `say` line always; the rest 0 or null). The same find always gives the same thing.
- `signpost(here, ways)` → the text of a signpost: `here` is the place's name, `ways` is `[{ to, dir:'n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'nw', hours }]`. For example: "← Vallaki, a day's walk · Krezk, two days →", in your own words, one line per way, with arrows for the directions.

### `tests/finds.test.js`

Prove:
- the same floor and seed give the same finds (ids, places and outcomes), and a different seed gives different glints
- every `read` sits on or next to its prop, every glint on an `open` square that is not a `path` and not a prop, glints at least 4 apart, none in the first room
- `taken` leaves those out, and nothing else moves
- a hidden glint isn't `noticed` from 3 squares, or with too low a passive; it is from 1 square with enough
- `outcome` is the same every time, and `gp` is a whole number from 0 to 25
- `HOW_MANY` and the counts in `READ`, `PAGES` and `TRINKETS` meet the minimums, and no two texts in one list are the same
- `signpost` gives one line per way and an arrow that matches the direction

## What Claude will do with it

The app makes `floor` from its maps and calls `placeFinds` when the hero arrives on one. It draws a faint sparkle for each glint the hero has `noticed`, and shows "Read", "Search" or "Pick up" on Ⓐ. Pages go into the hero's journal, in order by thread. You don't need to do any of that: write things a player will stop and read, and make the engine exact.
