# Muse brief, round 17: 💀 three hearts, three skulls

A hero in Dread Delve who drops to 0 hit points is going to start **dying**, the way the table plays it: on each of their turns they roll a d20, a 10 or more fills a heart, less fills a skull; three hearts and they're stable, three skulls and they're gone; a natural 20 and they're back on their feet; a natural 1 fills two skulls. ChatGPT is writing those rules (`src/engine/death-saves.js`, its own PR). This round is **the moment on screen**: the roll everyone at the table holds their breath for, and the small mark that shows a hero is dying the rest of the time.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own.
- Work on `muse/death-saves`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your module puts its own styles in a `<style id="…">` it adds once (see your `src/ui/defeat.js`); match the regal glass look in `index.html` (its colour tokens on `:root`). Work on a phone (the handheld, `body.hh`) and on a desktop.

## What's there (read; don't change)

- Your own `src/ui/defeat.js` and `src/ui/victory.js`: timers, not frames; things appear at full strength (a CSS fade-in never runs on this box's compositor); `prefers-reduced-motion`.
- Your `src/ui/captions.js`: a death save will also be captioned; your moment shouldn't sit on top of the captions' stack (it's low on the screen; yours belongs in the middle).
- The party cards: `src/ui/wander.js` `renderHud` (`#wdParty`, a card per hero with `ui/hpbar.js`'s bar) and the handheld's (`src/ui/tablehh.js`). You don't change them; your badge is a small element Claude will put on each card.

## Do

### `src/ui/deathsave.js`

`showDeathSave({ name, face, before, after, d20, outcome, words, mine }, { onDone } = {})`: the moment.
- `before` / `after`: `{ s, f }` (0..3 hearts and skulls), `d20` the natural roll (1..20), `outcome` one of `'success' | 'failure' | 'two' | 'rise' | 'stable' | 'dead'`, `words` a line to show (already filled with the name), `mine` true when it's the player's own hero (a little larger, *"You"* in the heading).
- In the middle of the screen, over the game but not the menus: the hero's face (or an initial) small and grey, their name, three hearts and three skulls (empty outlines, the `before` ones filled); a d20 that tumbles for a moment (a few timer steps of numbers), lands on `d20`, then the new heart or skull fills (two for `'two'`), with the words under it. A natural 20 is gold and warm, the face loses its grey; `'dead'` turns the whole thing to blood and ash; `'stable'` settles in a quiet blue-grey.
- It holds about **2.5 seconds** after landing, then goes, and calls `onDone` once. Any press (`deathSavePress(button)`: `'a'`, `'b'`, Space, Escape, a tap) skips to the end and closes at once. `deathSaveOpen()` while it's up. A second `showDeathSave` while one is up waits its turn (a queue), so two downed heroes both get their moment.
- Under 2 s in total with `prefers-reduced-motion` (no tumble: the number is simply there).

`dyingBadge(el, marks)`: fills a small element (on a party card, ~20px tall) with three tiny hearts and three tiny skulls from `marks = { s:[bool×3], f:[bool×3], stable, dead }` (ChatGPT's `dyingMarks` shape); `stable` shows a small calm mark instead; `null` empties it. Never throws.

## Hook for Claude (not in this PR)

`src/game/wander.js` (the hero's or a companion's turn at 0 hit points) and the table will call `showDeathSave` with the roll from ChatGPT's `deathSave`, and wait for `onDone` before the turn moves on; `src/ui/wander.js` and the handheld route presses to it while it's open, as they do for your defeat screen; the party cards get a `dyingBadge`. Describe in the PR the exact calls you'd like.

## The spec

`tests/e2e/deathsave.spec.js`: through a debug export you add (one line in `src/debug.js`, next to your `defeat` export), show a save on a plain page (no fight needed): the name and the d20's number show, the hearts and skulls match `after` once it lands (count the filled ones), a `'two'` fills two skulls, a natural 20 shows the gold look, it closes on its own and calls `onDone` once, a press closes it at once, two in a row both show (in order), `dyingBadge` shows the right marks and empties on `null`; at a phone size with `body.hh` nothing is cut off; and with reduced motion it's all there at once.
