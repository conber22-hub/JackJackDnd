# Muse brief, round 3: Wick, the ghost who shows the DM what's next

Your tour, notebook and palette are live. This one makes the app hard to get lost in, for the DM above all.
The same rules apply:
- Read `AGENTS.md` first (a public repository).
- Work on `muse/ghost-guide`, one pull request, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass.
  - In a new spec, use `preparePage(page)` from `tests/e2e/helpers.js`. It also needs to keep Wick quiet: add an option, as `tour` has one.
- Touch only what's named here. Anything else, describe in the PR.
- Your CSS goes in your module, injected once, using the app's tokens (`var(--…)`, the regal glass look).

## What it is
**Wick** is a small ghost, a child with a candle: pale, a little transparent, drawn in SVG in your module. He floats beside the thing the DM most likely wants to press next, with a one-line speech bubble.
- He drifts there gently, bobs while he waits, and fades if the DM ignores him for a while.
- He never covers what he points at.

## Do
1. **A guide of steps**, in a new `src/ui/ghost.js`:
   ```js
   export const STEPS = [{ id, when:(state, ui) => bool, target:'css selector', say:'one line', done?:(state, ui) => bool, tab?:'tokens' }]
   ```
   The first step whose `when` is true, that isn't done or dismissed, and whose target is on screen is the one he shows. If the target is in a panel tab that isn't open, he points at that tab first ("Open Tokens").
2. **Steps for the DM**, in roughly this order. Look up the real selectors in `index.html`, `src/ui/panels.js`, `src/ui/hud.js` and `src/ui/events.js`, and check each one in the browser.
   - **Start screen:** pick tonight's session (Session 0 if they've none), or Continue.
   - **No heroes on the map:** the Table tab, then Open the table, so players can join.
   - **Table open, nobody joined:** show the code or QR to the players.
   - **Someone joined:** seat them on a hero (when one isn't seated).
   - **Prep, before the night:** the Story tab, tonight's session; read the Hook.
   - **The 📤 outbox has something:** Send it, or Edit it first.
   - **A player's request waits:** approve it (✓📤 & show).
   - **Creatures in sight and no fight:** ⚔ Start a fight…
   - **In a fight, on a monster's turn:** its actions on the bar, or Next turn.
   - **A fight just ended:** a rest, or the Gaze tab to see what he thinks of it.
   - **On a road in the Valley:** travel on, or Enter the place.
   - **Long quiet:** 📓 jot it down, or Ctrl+K for anything.
   - Add any others you find a DM would miss. Keep each line short and plain, in the app's voice.
3. **Controls:**
   - Tapping Wick: "Got it" dismisses that step (remembered in `localStorage`), and "Show me" flashes the target.
   - **🕯 Wick** in the help modal turns him on and off. He's on for a new device and off once the DM turns him off.
   - **Ctrl+K** ("what next") brings him back for one step even when he's off. Register that with the palette's `registerCommands`.
4. **Players:** a smaller set, on by default, off in Card only:
   - tap your hero
   - the glowing tiles are where you can go
   - your turn: your actions
   - a request is with the DM
   
   Keep it to four or five steps.
5. **Quiet when it matters:**
   - Never during the first-night tour (`src/ui/tour.js`).
   - Never over an open modal (except the start screen).
   - Never on the TV screen (`?screen`).
   - Respect `prefers-reduced-motion`.
   - On a phone, he sits in a corner with the bubble and an arrow, rather than over the button.
6. **Re-check cheaply:** on the app's existing redraws (`renderAll` and the panel renders), not on a timer that runs every frame.

## Files
- new `src/ui/ghost.js`
- new `tests/e2e/ghost.spec.js`, which proves:
  - a fresh DM is pointed at the right thing at three stages (start screen, no heroes, an outbox item)
  - "Got it" moves him on
  - turning him off keeps him off after a reload
  - a player's screen gets only the player steps
  - the TV screen never has him
- the `preparePage` option in `tests/e2e/helpers.js`
- one hook to describe, where he's started (as `ensureTourButton` is).

## Done means
- The spec and the whole suite pass, checked at desktop and phone widths.
- The PR lists every step with its selector, what you skipped, and the hook line.
