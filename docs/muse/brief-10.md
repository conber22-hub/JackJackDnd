# Muse brief, round 10: 📖 the pocket sheet

The Soundscape is live; thank you. The table's players now hold their phones like a pocket console: the **handheld** (`src/ui/handheld.js`) is the standard way to play a seated hero (`src/ui/tablehh.js`), and the solo Wanderer uses it too (`src/ui/wander.js`). The map is on the shell's screen and the rest of the phone is the controller: a D-pad, A B X Y, L and R, and Select / View / Start. Read `DREAD-DELVE-ROADMAP.md` → v1.27 and the Wanderer's 🕹 section first, then open the app on a phone-sized window and play a little.

One gap: **Select opens the hero's sheet**, and today that's the classic Hero tab dropped over the whole phone. It's a long scrolling page made for a finger, not a D-pad, and it covers the shell. This round is **the pocket sheet**: the hero's sheet as a few small pages on the handheld's own screen, read and turned with the buttons, like the status screens of the old handheld games we grew up with (in this app's own look: no console's name, badge or art).

The same rules apply:
- Read `AGENTS.md` first. The repository is public: invented text only.
- Work on `muse/pocket-sheet`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens. When it styles anything inside `.modal .box`, make your selectors at least that specific.

## What's there (read; don't change)

- **The handheld** (`src/ui/handheld.js`):
  - Draws the world into the shell's screen with `setViewRect` (`src/render/scene.js`).
  - Sets the screen's place on `body` as CSS variables: `--hh-scr-x`, `--hh-scr-y`, `--hh-scr-w` and `--hh-scr-h`, in px.
  - `body.hh` is on while it shows, and `body.hh-table` at the table.
  - The screen's HUD (`#wanderHud`, `#tableHud`) sits at z-index 40.
  - `hhHost()` says who holds it: `'wander'` or `'table'`.
- **A press** reaches the host as a name:
  - `a`, `b`
  - `x` / `y` (as the host's legend maps them)
  - `lb`, `rb`
  - `back` (Select), `rs` (View), `start`
  - the D-pad as steps of `{ dx, dy }`
- **The hero:** a seated player's token is `tokById(ui.myToken)` (`src/engine/state.js`), and the Wanderer's is `hero()` in `src/game/wander.js`. A token has:
  - `name`, `cls` ("Cleric 3 · Life"), `ac`, `hp`, `maxHp`, `speed`
  - `conds:[{ n }]`, `mods` and `saves` (`{ str, dex, … }`), `skills`
  - `attacks:[{ n, b, d }]`, `casts:[{ n, l, k }]`
  - `resources:[{ id, n, max, slot }]`; what's left of each is `left(t, id)` (`src/game/resources.js`)
- **The sheet behind it:** `state.characters[t.charId]` (when the phone has it). It holds:
  - `name`, `cls`, `lvl`, `sp` (species), `bg`, `ab` (the six scores), `inv`, `coins`, `spells`, `portrait` (a data URL, or none)
  - Read it through `migrateSheet` and `itemInfo` (`src/engine/inventory.js`) and `heroStats` (`src/engine/hero.js`). Never write to it.
- **Notes and letters:** a player's notes are `ui.notes` (`[{ text, strahd }]`); their letters come from `src/ui/letters.js` (read how the Hero tab lists them).

## Do

1. **`src/ui/pocketsheet.js` (new)**, exporting:
   - `openPocketSheet({ token, sheet = null, extras = {}, onClose })`: shows the sheet over the handheld's screen, exactly where `--hh-scr-*` put it, at z-index 45. Outside the handheld (no `body.hh`) it's a centred card the size of a phone screen.
   - `pocketPress(name)`: handles `a`, `b`, `lb`, `rb`, `back`, `start`, `up`, `down`, `left` and `right`. It returns `true` if it took the press, `false` if the sheet isn't open.
   - `pocketOpen()` → boolean.
   - `closePocketSheet()`.
2. **The pages**, turned with L and R (and ◀ ▶ arrows you can tap), with a dot row showing which page:
   - **Hero:**
     - the portrait (or a large initial in the hero's colour)
     - name, species, class and level
     - AC, HP as a bar and numbers, speed
     - the conditions as chips
     - the six abilities with their modifiers
   - **Fighting:** each attack with its bonus and damage. Then the spells by level, with slot pips (filled = left) and each spell's level, and features with their uses left.
   - **Saves & skills:** the six saves, then the skills sorted best first, proficient ones marked.
   - **Pack:** what's carried (`sheet.inv` through `itemInfo`), equipped things marked, the coins. Read-only.
   - **Notes:** the DM's notes to them (`extras.notes`), Strahd's in red, then their letters' titles (`extras.letters`). A letters page opens one in full with A.
   - Pages with nothing on them say so in a line, in the app's voice ("Nothing in your pack but lint and worry").
3. **The buttons on it:**
   - D-pad up and down move a highlight through the page's rows, and A opens a row that has more (a spell's or a feature's text, if your row has it, or a letter).
   - B goes back a step, then closes.
   - Select (`back`) and Start close it too.
   - Every row is also tappable, and it scrolls itself to keep the highlight in sight.
4. **Looks:**
   - **The old-console status screen, in the app's own style:**
     - a dark screen inside the bezel
     - a thin bright frame
     - small caps headings
     - pixel-crisp dividers
     - the candle-gold accent for what's highlighted
   - **The pixel screen:** with `body.hh-lcd` on, use a squarer, pixel-like look (`image-rendering` for the portrait, no soft shadows).
   - **Fit:** it must fit the screen at both phone orientations (the screen is about 320 × 420 upright and 450 × 280 sideways): no page scrolls sideways.
   - **Motion:** respect `prefers-reduced-motion` when pages turn.
5. **Nothing leaves the phone.** The sheet only reads. No messages to the DM, no state changes.

## The hook (for Claude)

Don't change `src/ui/tablehh.js` or `src/ui/wander.js`. In the PR, describe the lines Claude adds:
- **At the table:** in `tablehh.js` `openSheet()`, call `openPocketSheet(...)` instead of the classic overlay, keeping the classic Hero tab one menu item away ("The full sheet"). In its `press`/`step`, give the press to `pocketPress` first.
- **In the Wanderer:** the same, from the pack/journal menu ("Your hero").

Add `export * as pocket from './ui/pocketsheet.js';` to `src/debug.js` (that one line) so your spec can drive it.

## Files

- new `src/ui/pocketsheet.js`
- one line in `src/debug.js`
- new `tests/e2e/pocket-sheet.spec.js`. Start a Wanderer on a phone viewport with the handheld forced on (`localStorage['dreaddelve.handheld.v1'] = '{"mode":"on","full":false}'`; see `tests/e2e/handheld.spec.js` for starting one). Then call `DreadDelve.pocket.openPocketSheet({ token:DreadDelve.wander.hero(), sheet:DreadDelve.wander.sheetOf(), extras:{ notes:[{ text:'Trust no one.' }] } })`. It proves:
  - it opens over the screen's rect
  - L and R turn the pages, and the Hero page shows the name and HP
  - the Fighting page lists an attack
  - the D-pad moves the highlight, and B closes it
  - at 390 × 844 and 844 × 390 nothing overflows sideways

## Not this round

- No editing the sheet.
- No new art files: draw with CSS and inline SVG.
- No changes to the handheld's shell or the HUD.
