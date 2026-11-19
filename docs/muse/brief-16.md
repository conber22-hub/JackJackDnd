# Muse brief, round 16: 🌫 when the party falls

A won fight in Dread Delve ends on your round 13 victory screen: the headline, the MVP, each hero's numbers counting up, the awards, the XP. A **lost** fight ends on a plain card (*"The Mists close over you"*, `LOST` in `src/data/wander.js`), and a moment later the game quietly carries on from the last save. That's the moment a player most needs the game to land well: losing should feel like part of the story, Barovia's story, not like a crash. This round is **the defeat screen**.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own.
- Work on `muse/defeat`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your module puts its own styles in a `<style id="…">` it adds once (see `src/ui/victory.js`, your own); match the regal glass look in `index.html` (its colour tokens on `:root`). Work on a phone (the handheld, `body.hh`) and on a desktop.

## What's there (read; don't change)

- Your own `src/ui/victory.js`: how the victory screen is opened (`openVictory(summary, { party, names, faces, xp, onClose })`), pressed (`victoryPress`) and closed. The defeat screen should feel like its dark twin and work the same way (Ⓐ / Space goes on, Ⓑ / Escape closes, a tap works, the handheld routes its presses to it while it's open).
- The fight's scorecard: ChatGPT's `src/engine/fight-summary.js` `summarize(roster, events, { won:false, … })`, already called by `src/game/record.js` `fightEnds(false, …)`. Read what it returns for a lost fight (its headline, verdict, each hero's numbers, the awards).
- `src/game/wander.js` `fallen()`: what happens now when the whole party is down (the card, then the last save after 2.6 s).

## Do

### `src/ui/defeat.js`

`openDefeat(summary, { party, names, faces, from, onClose })`, `defeatOpen()`, `defeatPress(button)` (`'a'`, `'b'`, the arrows), `closeDefeat()`, and `setDefeatFace(id, url)` (portraits arrive a moment later, as on the victory screen).

What it shows, in this order, unhurried (the Mists don't rush):
1. The screen dims from the edges inward to a grey-violet mist; the words **The Mists close over you** rise slowly in the serif (the card's own title, so the two agree).
2. The fight's headline and verdict from the summary, and a line of Barovian consolation in the Mists' voice: original, quiet, never a joke (*"The valley is not finished with you."*, *"You wake to the smell of rain and woodsmoke."*), a handful to choose from, picked from the summary so the same fight always says the same.
3. Each hero's face in a row, greyed, with what they did (dealt, taken, the blow that felled them if the summary knows it): their numbers don't count up as on the victory screen; they're simply there, like names on a stone.
4. One line saying where they'll wake: `from` (*"the last place you rested"*, *"the Blood of the Vine tavern"*, given by the host).
5. A single button, **Rise**, at the bottom (Ⓐ / Space / tap), and Ⓑ / Escape does the same.

Respect `prefers-reduced-motion` (no rise, no slow dim: it's simply there). Use timers, not `requestAnimationFrame` (your notes in round 13 and 14 say why).

## Hook for Claude (not in this PR)

`src/game/wander.js` `fallen()` will call `openDefeat` with the summary from `fightEnds(false, …)`, the party, their faces and where they'll wake, and carry on to the last save on `onClose` (instead of after 2.6 seconds); `src/ui/wander.js` and the handheld will route presses to it while it's open, as they do for the victory screen. Describe the exact call you'd like in the PR.

## The spec

`tests/e2e/defeat.spec.js`: open it through a debug export you add (one line in `src/debug.js`, next to your `screens` export), with a summary from `window.DreadDelve` (or a hand-made one shaped like `summarize`'s), and check: the words show; each hero of the party appears with their name; the consolation is the same for the same summary twice; **Rise** (and Escape) close it and call `onClose` once; at a phone size with `body.hh` nothing is cut off; and with reduced motion (`page.emulateMedia({ reducedMotion:'reduce' })`) it's all there at once.
