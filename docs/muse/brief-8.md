# Muse brief, round 8: 📜 the Chronicle

The Map Book is live; thank you, it looks lovely. One note for this round: your `events.js` was written from an older copy and dropped two features that had landed since (Claude put them back). **Start from the current `claude/dread-delve-v0.2`, and keep your `events.js` change to the lines you add.**

## What it's for

A campaign night produces a lot the players want to keep, and today most of it is gone once it's off the screen:
- **cards** the DM shows: a read-aloud, a new face introduced, a trap found, a death
- **pictures** sent as handouts
- the Count's **letters**
- **whispers** in their heads
- secret **notes** to one player
- the **days and places** of the journey

This round is the **Chronicle**: each device's own record of the story as it reached them, kept across sessions, to look back through and to read out at the start of the next night.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: invented text only.
- Work on `muse/chronicle`, one pull request, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens.

## What's there (read; don't change)

- **`bus.on('table', m => …)`** (from `src/util/core.js`) fires on a player's device for everything that reaches their screen from the table. `m.t` is one of:
  - `'card'`: `m.c` is `{ title, sub, flair, lines:[html], kind, portrait? }`
  - `'whisper'`: `m.text`
  - `'letter'`: `m.letter`, `{ title, from, sig, body, seal, to }`
  - `'handout'`: `{ title, caption, url }`, where `url` is a picture data URL
  - `'note'`: a secret note to this player, `{ text, strahd }`, where `strahd` is true when it's his voice
  - `'banner'`: `m.text`, e.g. "Your turn"
  - `'estate'`: their holding
  - Look at how each is shown today (`src/net/table.js`, `src/ui/screen.js`, `src/ui/letters.js`) for the exact fields, and code defensively: any field may be missing.
- **`bus.on('sent', ({ msg, to, at }) => …)`** fires on the **DM's** device for everything it sends the table, with the same message shapes. `to` is a hero id when it went to one player only, else `null`.
- **`bus.on('state', …)`** fires on a player's device when a new state arrives.
- **`state.campaign.valley`** (DM) or **`state.valley`** (players, when the DM shares the valley map):
  - `day`, `hour`
  - `at`: the place id
  - `visited`
  - `weather`: a line
- Place names are in `VALLEY_PLACES` (`src/data/barovia-map.js`).
- `state.meta.name` is the current map.
- Look at `src/ui/letters.js` and `src/ui/mapbook.js` for how a module starts, injects its button and CSS, and registers palette commands.

## Do

1. **`src/ui/chronicle.js` (new): the 📜 Chronicle.**
   - A sheet opened from a 📜 button you inject (as 🗺️ is) and from the palette, for players and the DM.
   - **Recording:**
     - Every message from `bus.on('table')` (players) or `bus.on('sent')` (DM) becomes an entry: `{ id, at, day, hour, place, map, kind, title, text, picture? }`.
     - Strip HTML from card lines to plain text.
     - **Skip noise:** "Your turn" banners, repeated identical cards within a minute, and roll results. Rolls are cards whose `kind` or text says hit, miss, damage or save; give the DM and players a "keep rolls" toggle, off by default.
     - Keep entries in `localStorage` per device, keyed by the campaign: the valley's `seed` when there is one, else `state.meta.seed`.
     - Pictures can be big: keep at most the 30 most recent handout pictures, downscaled to 800 px wide JPEG, and drop older pictures' data while keeping their entries. Stay under about 4 MB, and fail gracefully when storage is full.
   - **Reading:**
     - **Group entries into nights:** a gap of more than 6 hours between entries starts a new night. Each night is headed by its in-game day and place ("Day 4 · Vallaki") and the real date.
     - Inside a night, show a timeline: an icon per kind, the title, the text folded to two lines (tap to open), and handout pictures as thumbnails (tap for full size).
     - Letters show on a small parchment, as the letters module does.
     - **Search** box: across titles and text.
     - **Filter** chips: All · Cards · Letters · Whispers · Pictures · Notes.
   - **"Previously…":**
     - A button that builds a short recap of the last night: its day and place, then its five most important entries. Letters, handouts and cards with a portrait count as important.
     - Show it big and readable, so a player can read it out to start the next session.
     - It's built from the entries alone; no AI.
   - **Export:** "Save as text" downloads the whole Chronicle as a `.txt` (nights, times, titles, text), and "Save night as picture" renders the current night as a PNG page.
   - **Private:** nothing is ever sent anywhere. A player's whispers and notes stay on their own device.
   - **"Clear the Chronicle"** with a confirm.
2. **The DM's side.** The DM's Chronicle records what they sent, marked "to all" or "to Ada" (using `to` and the hero's name from `state.tokens`). This shows the DM what each player has been told, so a whisper to one player doesn't slip out to the others.
3. **Looks.**
   - A bound journal, distinct from the Map Book's single page: a darker leather edge, cream pages, the app's serif.
   - It must work in portrait on a 360 px phone and on a laptop, and respect `prefers-reduced-motion`.

## Files

- new `src/ui/chronicle.js`
- one line in `src/ui/events.js` to start it (keep that file's other lines exactly as they are on the current branch)
- new `tests/e2e/chronicle.spec.js`, which proves:
  - on a player's device, a `table` card, letter and handout become entries that survive a reload
  - a "Your turn" banner and a repeated card don't
  - search and the Letters filter narrow the list
  - "Previously…" shows the last night's day and its letter
  - "Save as text" downloads a `.txt` containing an entry's title
  - on the DM's side, a `sent` whisper to one hero shows "to <name>"
  - Drive the events with `page.evaluate` and the bus. Expose what the test needs on your own `window.DreadDelveChronicle`, as the Map Book did.
- **In the PR, describe:** anything else you needed.
