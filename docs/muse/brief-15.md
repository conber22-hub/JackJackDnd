# Muse brief, round 15: 🎯 the target card

A fight in Dread Delve is now seen over your hero's shoulder, close: the foe you're going for stands right there, a red ring at its feet, its name over its head. What a player *can't* see is what they'd want to know before they swing: is it hurt? is it frightened, prone, held? and what have they learned about it: does fire work, does it shrug off blades? Today the fight bar only gives the target's name and a thin red bar. This round is **the target card**: a small, handsome card for the foe you're aiming at, that tells you about it at a glance.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own.
- Work on `muse/target-card`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your module puts its own styles in a `<style id="…">` it adds once (see `src/ui/captions.js`); match the regal glass look in `index.html` (its colour tokens on `:root`: `--candle`, `--ink`, `--dim`, `--line`, `--blood`, `--glass-strong`…). Work on a phone (the handheld, `body.hh`) and on a desktop.

## What's there (read; don't change)

- The token you'd show: `window.DreadDelve.tokById(id)`: `name`, `kind` (`'monster'` for a foe), `bid` (its kind in the bestiary), `hp`, `maxHp`, `dead`, `conds` (`[{ n, rounds }]`: `prone`, `frightened`, `restrained`, `paralyzed`, `poisoned`, `blinded`, `charmed`, `stunned`, `grappled`…), `flags.bloodied`, `size`.
- What the party knows about a kind of creature (Muse's own round 13 bestiary, over `src/game/record.js` `beastBook()` and ChatGPT's `src/engine/bestiary-lore.js` `entry`): `beastBook().entries` has one per creature kind, `{ bid, tier, name, counts:{ seen, fought, killed }, revealed }`. `tier` is 0 unseen, 1 seen, 2 fought, 3 mastered; `revealed` holds what's been learned, from tier 2 on: `ac`, `speed`, and `resist`, `immune`, `vuln` (arrays of damage types). Show only what's in `revealed`.
- Its face: `faceOf(token)` in `src/game/night.js` returns a small portrait (a data URL) or `null`.
- The hero's chance to hit it with the weapon in hand, already worked out for the fight bar: the Wanderer passes it to you (see the hook below) as `{ pct, edge }` (`edge.mark` `'▲'` advantage, `'▼'` disadvantage, or `''`; `edge.text` why).

**Never show a foe's hit points as numbers.** Players see health in words, as the table does: *Unhurt* (full), *Scratched* (more than three quarters), *Hurt* (more than half), *Bloodied* (half or less), *Near death* (a quarter or less), *Down*.

## Do

### `src/ui/targetcard.js`

`renderTargetCard(el, { token, known, odds, face })` fills `el` (a `<div>` the host gives you) with the card, and empties it for `token: null`. `known` is that creature's entry from `beastBook().entries` (or `null`); `odds` the `{ pct, edge }` above (or `null`); `face` a portrait URL (or `null`, then a tasteful initial). It returns nothing and never throws on missing fields. `healthWord(hp, maxHp, dead)` exported too (for the spec, and for Claude to reuse).

What it shows, in a compact card no taller than the fight bar's own lines (about 64px on a desktop, 44px on the handheld):
- the face in a small round frame, ringed in the health word's colour (gold unhurt → candle → amber → blood red near death)
- the name, and the health word under it (never a number)
- its conditions as small icons with a tooltip (`title`) and a few letters each (🛌 prone, 😱 frightened, ⛓ restrained/paralyzed/grappled, ☠ poisoned, 👁 blinded…): at most four, then "+2"
- what's known: "Weak to fire", "Resists slashing", "Immune to poison", AC once fought; "Not yet known" in dim when nothing is
- the odds on the right in big figures (the edge's mark before it, the why in its `title`)
A change of target slides the new card in; a change of health eases the ring's colour. Respect `prefers-reduced-motion` (no slide).

## Hook for Claude (not in this PR)

`src/ui/wander.js` and `src/ui/tablehh.js` (the fight bar's `🎯` line) will call `renderTargetCard` with the aimed token, its bestiary entry, the odds they already compute and `faceOf(token)`. Describe in the PR the exact call you'd like, and the size of the element.

## The spec

`tests/e2e/targetcard.spec.js`: call `renderTargetCard` directly on a `<div>` you add to the page (no fight needed), through a debug export you add (`export * as targetCard from './ui/targetcard.js'` in `src/debug.js`, one line): a wolf at full health reads *Unhurt*; at 9 of 11 *Scratched*; at 4 of 11 *Bloodied*; at 2 *Near death*; dead *Down*; never its hit points anywhere in the card's text; three conditions show three icons, six show four and "+2"; a known resistance shows; `null` empties it. Check it at a phone size with `body.hh` and on a desktop, and that nothing spills out of the card.
