# Muse brief: two features for game night

Read `AGENTS.md` first; its rules apply to you, including the public-repo rules. Then read `DREAD-DELVE-ROADMAP.md` for the code map.

- Work on `muse/<topic>` branches, **one pull request per task**, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`; Claude rebuilds and deploys after merging.
- Before each PR, `npm test` and `npm run build` must pass, and so must the browser suite (`npx playwright test`; see `tests/e2e/README.md`).
- Touch only the files each task names. If you need something else changed, describe it in the PR.

---

## Task 1 — autosave that can't run out of room (`muse/idb-saves`)

**Why.** The DM's delve autosaves to `localStorage` (`src/game/session.js`: `saveLocal`, `loadLocal`, key `dreaddelve.save.v1`). That's about 5 MB per site. Portraits and handouts are data URLs, so a long campaign hits the ceiling; today it then drops the art and shows a toast. The DM's imported books already live in IndexedDB through **idb-keyval** (`src/game/library.js` shows how).

**Do:**
1. Save to IndexedDB with idb-keyval, art included.
2. **Migrate once.** If an old `localStorage` save exists and IndexedDB has none, move it across, then remove the old key. Never lose a save: if writing to IndexedDB fails, keep `localStorage` working as before.
3. **Startup stays synchronous where it is now.** `loadLocal()` is called at boot (`src/ui/events.js`, the start screen's *Continue*, *new campaign* confirm, and the boot check) and returns synchronously. Keep that contract:
   - add an async `initSaves()` that reads the save into a cache before the start screen appears
   - have `loadLocal()` return the cache
   - call `initSaves()` from `src/main.js` before `showStart`
4. Debounced saving (`saveSoon`) and Export/Import stay as they are.
5. **Tests:** `tests/e2e/idb-saves.spec.js` (new) proves three things:
   - a delve with a large handout-sized image (several MB) survives a reload
   - an old `localStorage` save is migrated and then loads
   - the start screen's *Continue* still works

**Files:**
- `src/game/session.js` (the save functions only)
- `src/main.js` (one call)
- the new spec

## Task 2 — a first-night walkthrough (`muse/first-night`)

**Why.** Friends join on their phones mid-session and don't know where anything is.

**Do:**
1. Add [driver.js](https://github.com/kamranahmedse/driver.js) (MIT, pin an exact version). Write the tour in a new `src/ui/tour.js`.
2. **The player's tour** runs once per device, the first time a player is seated on a hero (remember it in `localStorage`, key `dreaddelve.tour.v1`). Steps:
   - your hero card (`#selCard`)
   - an attack button
   - "then tap a target on the map"
   - the move pad or the map (in card-only mode, the hero card's step keys)
   - the Hero tab's **📇 Card only** and **📖 Look it up**
   - Keep it to 5–6 short steps, in the app's voice: plain, a little gothic, never cute.
3. **The DM's tour** is a "Show me around" button in the help modal (`#helpModal`): Night tab, Table tab (invite and QR), Beasts, Story.
4. **Style.** Make driver.js's popover match the app's regal-glass look: dark glass background, gold accents, the `--glass`, `--gold`, `--line` and `--r-lg` tokens from `index.html`'s `:root`. Put the CSS in a `<style>` block that `tour.js` injects, **not** in `index.html` (that file is Claude's).
5. **Hooks.** Two small call sites, both described in the PR with exact lines:
   - where a player gets seated: `src/net/table.js` (the client's `'you'`/`'yours'` handling) or `src/ui/panels.js` (the hero tab)
   - the help button
6. **Tests:** `tests/e2e/tour.spec.js` (new) checks:
   - the player tour shows once and not again after a reload
   - it doesn't block taps once dismissed
   - the DM's "Show me around" opens

**Files:**
- `package.json` (the dependency)
- the new `src/ui/tour.js`
- the two one-line hooks
- the new spec

## Done means (both)
- `npm test`, `npm run build` and `npx playwright test` pass.
- The PR describes:
  - what changed
  - how you tested it on a phone-sized viewport
  - any hook Claude should double-check
