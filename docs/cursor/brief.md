# Cursor brief

You have two tracks. They don't touch the same files, so **run them as two background agents at the same time** if you can.
- **Track A, QA**: this file, tasks A1 and A2 below.
- **Track B, the rules engine**: the three tasks in `docs/argon/brief.md`, first written for Gemini (Argon), which ran out before it published anything. Do them in its order, using **your** branch names:
  - B1 damage defenses: `cursor/defenses`
  - B2 monster actions: `cursor/monster-actions`
  - B3 inventory engine: `cursor/inventory`

  Everything else in that brief stands: its files, its tests, its "Done means", and describing the hook Claude needs in the PR. Where it says `argon/…`, read `cursor/…`.

If your time runs short, the most valuable order is **B1, A1, B3, B2, A2**.

# Track A: QA for game night

Read `AGENTS.md` first; its rules apply to you. Track A is **tests only**.

- Work on `cursor/<topic>` branches, **one pull request per task, in order**, each against `claude/dread-delve-v0.2`.
- Never edit app code (`src/`, `index.html`). Never commit `dread-delve.html`.
- **If a test exposes a bug, don't fix it:**
  1. Open a GitHub issue titled `Bug: …` with the exact steps, what happened and what should have happened.
  2. Leave that test out of the PR, and link the issue in the PR description.
  3. Claude fixes the bug and adds the test back.

## How the browser tests work

Read `tests/e2e/README.md` and `tests/e2e/helpers.js` before writing anything.
- The suite runs against the **built** single file (`dread-delve.html`) on a local server with a local PeerJS signalling server (`tests/e2e/server.js`). The `webServer` in `playwright.config.js` builds it first.
- Run it with `npx playwright test` (add `PW_CHROMIUM=/path/to/chromium` if Playwright's own browser can't be installed).
- In the page, `window.DreadDelve` (`src/debug.js`) exposes state and actions:
  - `DreadDelve.get()` returns the state.
  - `DreadDelve.busy()` is true while a mini is still walking; poll with `expectPositions()` rather than waiting a fixed time.
- Use the helpers:
  - `arena(page, heroes)` builds a small known map.
  - `startDM(page, template)` starts a real delve.
  - `selectHero`, `clickTile`, `frameMap`, `tilePoint`, `expectPositions`.
- Every test fails on any uncaught browser error, and should keep doing so.
- **Test the way a person plays.** Click the real buttons and tabs (find their `data-act` / `data-edit` attributes in `src/ui/panels.js`, `src/ui/hud.js` and `src/ui/events.js`). Use `DreadDelve` only to set the scene or read the result.
- **Keep each test under about 60 seconds** on a laptop, and wait on conditions (`expect.poll`, `toBeVisible`), never fixed sleeps. Graphics run on a software renderer in CI, so clicks are slow.
- Name tests in plain English, like the existing ones ("a hero walks to a clicked tile and the party follows in marching order").

---

## A1 — the untested flows (`cursor/e2e-coverage`)

New spec files only, one per area. Each covers the main path of something people do at the table that no test touches yet:

1. **`valley.spec.js`: the Valley tab.**
   - Pick a place, travel the road, and arrive.
   - Day and hour advance, and the journey panel shows the road.
   - Enter the place: its map opens.
   - Players see only the places they have visited (if the DM shares the map).
2. **`build.spec.js`: the Build tab.**
   - Draw a room, add a door and a trap.
   - Place a prop, undo, and erase.
   - The minis can walk into the new room.
3. **`story.spec.js`: the Story tab.**
   - Start Session 0 from the start screen ("Begin Session Zero") or the Story tab.
   - Its maps are built and its beats can be ticked.
   - The session's Gaze button sets Strahd's Gaze.
4. **`gaze.spec.js`: the Gaze tab and the top bar.**
   - Raising Strahd's Gaze changes its level name.
   - The Whim Die rolls.
   - The Shift rolls and changes the floor.
5. **`rests.spec.js`: resources.**
   - A caster spends a slot by casting, and the slot is gone.
   - A short rest gives back what it should (Warlock pact slots, one Channel Divinity); a long rest gives back everything.
   - Hit Dice heal on a short rest.
   - Build the hero through the character creator (Tokens tab → Create a character), not by poking state.
6. **`save.spec.js`: export and import.**
   - Export a delve from the Table tab (catch the download).
   - Change things, then import the file.
   - The delve comes back as it was: floors, tokens with their HP, the log, the campaign's session.
   - Autosave survives a reload.
7. **`phone-play.spec.js`: a player's phone at the table** (two browser contexts, like `multiplayer.spec.js` and `night.spec.js`).
   - **Ask the table:** the DM asks for a save, the player's phone gets the prompt, the player taps their d20, and the DM's bar shows them as rolled.
   - **Pass a note:** a note to that player arrives on their phone only.
   - **Reload:** after the player reloads, they rejoin on the same hero.

**Done means:**
- Every new test passes three times in a row: `npx playwright test <file> --repeat-each=3`.
- The whole suite still passes.
- The PR lists what each file covers and any issues opened.

## A2 — old saves keep loading (`cursor/save-compat`)

People's delves live in their browsers and in exported files. A save from any earlier version must load. `deserialize()` in `src/game/session.js` migrates old shapes; this task proves each migration works.

1. **One fixture per old shape.** Create `tests/fixtures/saves/`, holding one small exported-delve JSON per old shape that `deserialize()` handles:
   - a v1 save whose rooms have no `id`, and floors without doors, traps, corridors, props, buildings or rough ground
   - a save without `campaign`, `characters`, `march`, `combat` or `art`
   - the old `grasp` (Grasp Die) and Dread content tables
   - heroes with a `charId` and a sheet in `characters`, but no `resources`, `skills`/`mods`, `look` or weapon ranges
   - tokens without `flags`, `size`, `conds`, `check` or `passive`
   - **Build the fixtures from the current export format, then remove or rename fields** to match each old shape. Use `git log -p src/game/session.js` to see when each field arrived.
   - Use invented names and content only (this repo is public).
2. **`tests/e2e/save-compat.spec.js`.** For each fixture:
   - Import it through the Table tab's **⬆ Import**. No errors.
   - The delve draws and a hero can be selected and walks one square.
   - The migrated fields exist: a hero's casts, slots and skills; room ids; the campaign clocks.
3. **`tests/save-compat.test.js` (optional).** A unit test over the same fixtures, if you can do it without importing DOM code. If `deserialize()` can't be imported in Node, say so in the PR and skip this part.

**Done means:**
- Every fixture loads, and the whole suite passes.
- The PR lists each fixture and the migration it covers, and any issue opened for a save that doesn't load.
