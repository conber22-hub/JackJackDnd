# Muse brief, round 7: 🗺️ the Map Book

The Look panel and photo mode are live; thank you. The maps have grown a lot since then:
- **Shaped rooms:** round, eight-sided, cross and L-shaped
- **Caves**, villages and roads through the woods
- **Many floors**, and a shelf of maps the party can come back to

Players see where they've been only in the 3D view, one floor at a time. This round is a **Map Book**: each player's own hand-drawn record of the places they've explored, on their phone, with their own notes on it. It's the kind of map a party sketches on graph paper.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: invented text only.
- Work on `muse/mapbook`, one pull request, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens.

## What's there (read; don't change)

`state` (from `src/engine/state.js`) is what every device holds. On a player's device it's the copy the DM's app sends them, with everything they haven't seen taken out (`src/engine/redact.js`).

- **`state.floors[L]`** is a floor:
  - `W`, `H`: its size in squares
  - `name`
  - `grid`: an array or a string of `W*H` codes. Read square i as `+grid[i]`:
    - `0`: rock, or not yet seen
    - `1`: room floor
    - `2`: tunnel
    - `3`: stairs down
    - `4`: stairs up
  - `rooms`: `{ id, x, y, w, h, cx, cy, shape, name }`, where `name` is empty on a player's copy
  - `doors`: `{ i, state }`, where `state` is `'open'`, `'closed'` or `'locked'`
  - `shallow`, `chasm`, `water`: lists of square indices
- **`state.explored[L]`** is a `Set` of the squares the party has seen on floor L. On a player's device, what's been sent is all they know.
- **`state.tokens`**: `{ id, kind:'pc'|…, name, floor, x, y }`. The party are `kind:'pc'`.
- **`state.meta.name`** is the current map's name. **`state.campaign.maps`** is the DM's shelf of maps; the players don't get it.
- **`ui.role`** is `'dm'` or `'player'`. **`ui.floor`** is the floor in view.
- **Hooks you can use:**
  - `bus.on('state', fn)` (from `src/util/core.js`) fires when a new state arrives on a player's device, after it's been applied (`applyRemoteState` in `src/net/table.js`).
  - `changed()` runs on the DM's side after any change.
- Look at `src/ui/letters.js` and `src/ui/estate.js` for how a module starts, injects its button and CSS, and registers palette commands.

## Do

1. **`src/ui/mapbook.js` (new): the 🗺️ Map Book.**
   - A sheet opened from a 🗺️ button you inject (as 📓 and ✉ are), and from the palette.
   - For players and the DM alike.
   - **The drawing:**
     - On a `<canvas>`, draw the explored squares of each floor as a hand-drawn map on parchment.
     - **Walls:** ink lines along every edge between an explored open square and rock. Give them a little wobble so it reads as hand-drawn, but seed the wobble from the square so it doesn't jitter between redraws.
     - **Shaped rooms:** round and eight-sided rooms (`room.shape` is `'round'` or `'octagon'`) get their stepped corners drawn as diagonal strokes. Copy the idea from how the 3D view does it: a rock square with that room's floor on two sides that meet, and nothing open on its other two sides.
     - **Marks:**
       - doors as small bars across the gap
       - stairs as hatching with an arrow (▲ up, ▼ down)
       - water as wavy lines
       - a chasm as cross-hatching
     - **The party:** a small dot where each hero stands, on the floor they're on.
     - **No grid lines,** except a faint 5-ft tick along the margin for scale.
   - **Floors as pages:**
     - one page per floor, turned with ‹ › and a swipe
     - each page titled with the floor's name, or "Floor 2" when the name is hidden
     - opens at the floor the party is on
   - **Pinch and drag** to zoom and pan on phones, and a "fit" button.
   - **Your own notes:**
     - Tap a square to drop a pin with a short note: "lever here", "smelled smoke", "Ireena's locket?".
     - Pins are kept per device in `localStorage`, keyed by the map's name and the floor.
     - Tap a pin to edit or remove it.
     - Notes are private: nothing is sent to anyone.
   - **Export:** "Save as picture" downloads the current page as a PNG, the parchment and pins included.
   - **Live:** the page redraws when a new state arrives (players) or after `changed()` (DM), at most a few times a second.
2. **The DM's view.** The DM sees the same book, drawn from everything that's been explored. One toggle, "Show the whole floor", draws unexplored squares faintly. This is for preparing, and it isn't shown to players.
3. **Looks.**
   - Parchment from a CSS or canvas gradient and a little noise, and ink in dark sepia.
   - The app's serif for titles.
   - It must work in portrait on a phone (360 px wide) and on a laptop.

## Files

- new `src/ui/mapbook.js`
- one line in `src/ui/events.js` to start it, as the letters do
- new `tests/e2e/mapbook.spec.js`, which proves:
  - the book opens, and draws a non-empty canvas for a delve with explored squares
  - a shaped room draws a diagonal stroke: test a helper you export, such as `wallSegments(floor, explored)`, which returns line segments, and check that one isn't axis-aligned
  - a pin can be added, survives a reload, and can be removed
  - "Save as picture" produces a PNG data URL
- **In the PR, describe:** anything you needed that isn't there, such as a `bus` event that doesn't fire on players' devices.
