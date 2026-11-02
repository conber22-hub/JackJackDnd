# Muse brief, round 2: two features for the DM

Your first two (#9 saves in IndexedDB, #10 the first-night walkthrough) are merged and live. Thank you.
The same rules apply:
- Read `AGENTS.md` first (it is a public repository).
- Work on `muse/<topic>` branches, one pull request per task, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite (`npx playwright test`; see `tests/e2e/README.md`) must pass.
  - In a new spec, use `preparePage(page)` from `tests/e2e/helpers.js`. It marks your tour as seen, so the tour doesn't cover what the test taps.
- Touch only the files each task names. Anything else, describe in the PR.
- Don't restyle the app. Your own new panel's CSS goes in your module, injected once, and uses the app's design tokens (`var(--…)` in `index.html`, the regal glass look).

---

## Task 1: the DM's notebook (`muse/dm-notebook`)

**Why.** Mid-session the DM jots down a name they just made up, a promise an NPC made, the loot the party left behind, a hook to pay off later. Today that goes on paper and is lost.

**Do:**
1. A notebook that slides out on the DM's screen only.
   - Open it with **N** (when no text box has focus) or a 📓 button.
   - Typing and Enter adds a note.
   - Each note keeps the time and the session it was written in: `state.campaign.session` if it exists, else the date.
2. **Tags**, tapped onto a note (or typed as `#npc` and so on): 👤 NPC, 💰 Loot, 🪝 Hook, ⚔ Fight, 📍 Place, ❗ To do.
   - Filter by tag, search the text, pin a note to the top, tick off a To do, delete with undo.
3. **📋 Tonight's notes**: copies this session's notes as plain text, grouped by tag, for a recap or a group chat.
4. **Storage.**
   - Notes live in `state.campaign.notes = [{ id, at, session, text, tags:[], pin, done }]`, so they travel with the save and with Export.
   - Add the default (`notes:[]`) in `deserialize()` in `src/game/session.js` (one line), so old saves load.
   - `state.campaign` never reaches the players: `src/engine/redact.js` deletes it. Add a test to `tests/redact.test.js` that proves notes stay hidden.
   - Call `changed()` (from `src/game/session.js`) after each edit, so it autosaves.
5. **Files:**
   - new `src/ui/notebook.js`
   - the one line in `session.js`
   - the redact test
   - new `tests/e2e/notebook.spec.js`, which proves:
     - add, tag, filter and search work
     - a note survives a reload
     - a player's screen never has the notebook or the notes
   - one hook to describe: where the 📓 button and the **N** key are wired. The key handler is `addEventListener('keydown', …)` in `src/ui/events.js`.

---

## Task 2: a command palette (`muse/command-palette`)

**Why.** The DM's screen has many tabs. At the table, "start the fight", "next turn", "send everything in the outbox", "drop a ghoul here" and "switch to the church map" should each be a few keystrokes away.

**Do:**
1. **Ctrl+K** (⌘K on a Mac) or **/** opens a palette.
   - A text box with fuzzy search, and arrow keys plus Enter to run.
   - Esc closes it.
   - On a phone, a 🔎 button opens it.
2. **What it searches:**
   - **Commands.** Look in `src/ui/events.js` for the existing `data-act` actions (switch tab, host the table, start a fight, next turn, short and long rest, the outbox's Send all), and in `window.DreadDelve` (`src/debug.js`) for the functions behind them.
   - **Creatures** from the bestiary: Enter places one at the selected square, or at the centre of view, through the same function the Beasts tab uses.
   - **Spells, items and feats**: open them in 📖 Look it up.
   - **Maps** in the map library: switch to one.
   - **Heroes and tokens** on the map: select and frame one.
3. **Players** get their own short list:
   - their hero's actions and spells
   - Look it up
   - Ping
   - Card only
4. **Design:**
   - Commands come from a registry: `registerCommands([{ id, n, hint, icon, role:'dm'|'player'|'both', run }])`. Claude can then add more later without touching your file.
   - Show the most recently used commands first.
   - You may use a small MIT fuzzy-search library with an exact pinned version, or write your own (it's about 30 lines).
5. **`?`** (outside a text box) shows a sheet of the keyboard shortcuts, the palette's included.
6. **Files:**
   - new `src/ui/palette.js`
   - new `tests/e2e/palette.spec.js`, which proves:
     - Ctrl+K opens it, and fuzzy search finds "long rest" from "lng rst"
     - running a command does it
     - a creature can be placed
     - a player sees only their list
   - one hook to describe: the key handler in `src/ui/events.js`, and the 🔎 button.

## Done means (both)
- The new spec passes, the whole browser suite still passes, and you've checked it on a desktop width and a phone width.
- The PR says what you did, what you skipped, and the exact hook lines for Claude.
