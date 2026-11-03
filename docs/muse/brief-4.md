# Muse brief, round 4: the Count's letters

Wick is live; thank you. This one is for the most Ravenloft thing a DM can do: a letter from the Count.
The same rules apply:
- Read `AGENTS.md` first (a public repository: invented text only, never the published module's letters).
- Work on `muse/letters`, one pull request, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens.

## What it is
The DM writes a letter in the app. It reaches the players' phones and the TV as aged parchment: torn edges, an ink that bleeds a little, a red wax seal that breaks when it's opened.

## Do
1. **The writing desk** (DM only), in a new `src/ui/letters.js`, opened with a ✉ button you inject, as Wick and the notebook do, and from the palette (`registerCommands`):
   - **From** (the Count, by default, or anyone), **to** (the whole party or one hero), a body, a signature, and a seal: the Count's crest (draw an original one in SVG: a bat over a tower will do), a plain wax seal, or none.
   - **Openings** to start from, in his voice and original: an invitation to dinner, a warning, a courtesy, a threat wrapped in courtesy, a forged plea for help from someone the party knows. Five or six, each a few lines. The DM edits freely.
   - **A preview**, as the players will see it.
2. **Sending.** It goes through the Curtain, like every card: `toPlayers({ t:'letter', letter }, 'world')` from `src/game/outbox.js`.
   - It waits in the outbox until the DM sends it.
   - For one hero, send it to that player alone. Look at how `src/net/table.js` sends a note to one player and describe the hook you need; Claude will add it.
3. **Receiving** (players and the TV screen, `?screen`):
   - A sealed letter arrives, with a soft sound if there's one in `src/audio/sound.js`.
   - Tapping breaks the seal, and the parchment unfolds.
   - It stays in a 📜 Letters list on the player's Your hero tab, for the rest of the campaign. Keep it in `localStorage` per table code, so a reload doesn't lose it.
4. **The DM's copy:** every letter sent is kept in `state.campaign.letters` (add the default in `deserialize()` in `src/game/session.js`, one line), listed in the desk with when and to whom.
5. **Readable everywhere:** phone width, the TV's big screen, and reduced motion (no unfolding animation, just the letter).

## Files
- new `src/ui/letters.js`
- the one line in `session.js`
- new `tests/e2e/letters.spec.js`, which proves:
  - the DM writes one from an opening, sends it from the outbox, and the player gets it sealed, opens it and finds it in their list after a reload
  - a letter to one hero doesn't reach another player
  - the TV shows it
- the hooks to describe:
  - your message handler (`m.t === 'letter'`) in `src/net/table.js`'s player and screen paths
  - sending to one player
  - the ✉ button and palette command

## Done means
- The spec and the whole suite pass, at desktop and phone widths, and on the TV screen.
- The PR lists what you did, what you skipped, and the exact hook lines.
