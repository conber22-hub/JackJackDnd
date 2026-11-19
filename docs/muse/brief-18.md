# Muse brief, round 18: ⛨ choose your Calling

Dread Delve is growing out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. The D&D classes are being replaced by our own **Callings**: soldiers and warriors from every age, Halo-like armoured far-future fighters alongside history's hoplites, huscarls and longbowmen, all pulled by the Mists into gothic Barovia. **Read `docs/homebrew/callings.md` first**: the twelve Callings, their emblems, colours and three Paths each.

ChatGPT is writing the Callings' data (`src/data/callings.js` and `src/engine/callings.js`, its own PR). This round is **the moment a player chooses who they are**: the Calling picker in the hero creator, and the twelve emblems.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own.
- Work on `muse/callings`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your module puts its own styles in a `<style id="…">` it adds once; match the regal glass look in `index.html` (its colour tokens on `:root`). Work on a phone (the handheld, `body.hh`, and the plain phone) and on a desktop.
- **All original**: nothing that belongs to the Halo games (none of its symbols, factions, names or logos). History is everyone's. Gothic first. Respectful: this is a memorial.

## What's there (read; don't change)

- `src/ui/creator.js`: the hero creator; its class `<select>` today (`CLASSES` from `src/data/srd.js`). You don't change it: Claude will put your picker in its place.
- The table in `docs/homebrew/callings.md`: each Calling's name, chassis, emblem, who they are and its Paths. Until ChatGPT's data lands, work from a small stand-in list in your spec shaped like its `callingList()`: `[{ id, name, chassis, emblem, color, era, blurb }]`, with Paths `[{ id, name, seep, blurb }]`.

## Do

### `src/ui/callingpicker.js`

`openCallingPicker({ callings, current, onPick, onClose })`, `callingPickerOpen()`, `callingPickerPress(button)` (the arrows, `'a'`, `'b'`), `closeCallingPicker()`.
- A grid of the twelve (four by three on a desktop, a scrolling two-wide list on a phone): each a card with its **emblem** (yours, below), name, era ("The Drawn: far-future", "Ancient", "Barovian"…) and a one-line who-they-are; its colour as the card's accent.
- Choosing one turns it over (or opens it beside the grid): the blurb, the signature, and its three **Paths**, the Seep-touched one marked (a green-black bloom, a word of warning). **Choose** (Ⓐ / Enter / tap) calls `onPick({ calling, path })` (a Path is optional: it's chosen at level 3, but a player may decide now); Ⓑ / Escape goes back, then closes.
- Grouped or filterable by era: *The Drawn* (far-future, ancient, medieval) and *Born in Barovia*.
- Respect `prefers-reduced-motion`; timers, not frames.

### `src/ui/emblems.js`

`emblemSvg(callingId, { size, color })`: twelve original emblems as inline SVG, one per Calling, in one consistent style: simple, heraldic, readable at 24px on a party card and handsome at 160px on the picker. A shield-and-spear for the Hoplite's Vanguard, an axe-and-hall for the Huscarl, a hooded rider for the Outrider, a drawn bow for the Marksman, a sworn hand for the Warden, a bell and cross-of-bandage for the Chaplain, a lantern with an eye of light for the Archivist (the Ghostlight), a shard for the Relicborn, a spore-bloom for the Seepbound, a drum for the Herald, a wolf in fog for the Mistwalker, a laurel and fist for the Pankratiast. None borrowed from any game's symbols. An unknown id returns a plain shield.

## Hook for Claude (not in this PR)

`src/ui/creator.js` will open the picker in place of its class `<select>` (with the Classic switch beside it), and the party cards, the sheet and the victory screen will show the emblems. Describe in the PR the exact calls you'd like.

## The spec

`tests/e2e/callingpicker.spec.js`: through a debug export you add (one line in `src/debug.js`), open the picker with a stand-in list of twelve: all twelve show with their names and emblems (an `<svg>` each), the Seep-touched Path is marked, the arrows move the choice and Ⓐ picks (`onPick` once, with the right ids), Escape goes back then closes, a tap works; `emblemSvg` returns an `<svg>` for each id and a shield for an unknown one; at a phone size (with `body.hh`, and without) nothing is cut off and it scrolls; with reduced motion everything is simply there.
