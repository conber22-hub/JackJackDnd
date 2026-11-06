# Muse brief, round 9: 🎻 the Soundscape

The Chronicle is live; thank you. One note from the merge: its cream page lost to the app's `.modal .box` background, because that rule is more specific than `.chronicle-book`. Claude made the book's selector win. When your module styles a sheet inside `.modal .box`, write your selectors at least that specific.

The table plays at night, in a dark room, with a TV and everyone's phones. Sound is half of horror, and today the app has only a few built-in ambiences (rain, wind, drips, fire, water) and some effects, chosen for the DM by the map. This round is a **Soundscape board**: the DM layers and mixes the night's sound and plays a cue at the right moment. Everything is generated in code (Web Audio), so it works offline with no sound files.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: invented text only, and no recorded or downloaded audio.
- Work on `muse/soundscape`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch, and keep your `events.js` change to the line you add.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens.

## What's there (read; don't change)

`src/audio/sound.js` is the app's sound:
- one `AudioContext` and a master volume from `gfx.volume`, `gfx.music` and `gfx.sfx`
- a drone that deepens with the Count's Gaze (`setDrone`)
- `setAmbience(kind)` for `rain`, `wind`, `drips`, `fire` and `water`, chosen automatically by the map (`src/main.js`)
- `sfx(name)` for short effects: `grind`, `toll`, `skitter`, `door`, `trap`, `hit`, `crit`, `miss`, `burst`, `whisper`, `ping`, `turn`, `rise`, `boom`, `roll`. The DM's effects are sent to players as `{ t:'sfx', name }`.
- `unlock()`: browsers need a tap before sound plays

Read how it builds sounds from noise and oscillators: copy the approach, not the file. Your board should **not** change `sound.js`. Make your own nodes on the same `AudioContext`; if you need it exported, say so in the PR and Claude will add `export const audioCtx = () => ctx`. Until then, create your own context lazily on the first tap.

## Do

1. **`src/ui/soundscape.js` (new): the 🎻 board,** for the DM. A sheet opened from a 🎻 button you inject (as 📜 is) and from the palette.
   - **Layers:** at least 10 looping beds, each with its own volume slider and on/off. All are generated, and none should sound like a buzzing synth: shape noise with filters, slow modulation and random grains.
     - rain on stone
     - rain on leaves
     - wind in pines
     - a howling gale
     - cave drips
     - a crackling hearth
     - a tavern murmur (filtered babble)
     - a distant choir drone (stacked detuned sines with slow swells)
     - a heartbeat (speeds up with a "dread" knob)
     - wolves far off (occasional howls)
     - creaking timber
     - the Mist's hiss
   - **Scenes:** one-tap mixes that crossfade over 3 seconds: Tavern night, Svalich Woods, The Crypt, Castle Ravenloft, Storm on the road, The Mists, and Silence. The DM can save the current mix as their own scene (kept in `localStorage`).
   - **Cues:** one-shot stingers on big buttons:
     - a thunderclap
     - a scream far off
     - a door slamming somewhere above
     - a bell tolling thrice
     - a raven's caw
     - a wolf howl close by
     - a heart that stops
     - the Count's laugh: low, processed, unmistakable, and original
     - Cues may reuse `sfx` names where those fit.
   - **The map's own ambience:** a toggle, "Let the map choose", on by default. It keeps today's automatic `setAmbience`. Off, the board's mix replaces it.
   - **The Gaze:** a "Follow his Gaze" toggle that adds dread as `state.dread` rises: the choir darkens and the heartbeat quickens.
   - **Volume:** respects `gfx.volume` and `gfx.music`.
2. **The table hears it.** The DM's board is what the players' phones and the TV play, if they've unlocked sound.
   - **Send the mix** as `{ t:'soundscape', layers:{ id:volume }, scene, fade }` and cues as `{ t:'soundcue', id }`, through `toPlayers(msg, 'dm')` (`src/game/outbox.js`).
   - **Hook for Claude:** `src/net/table.js` must call your receiver for those two message kinds. Describe the one line needed (`else if (m.t === 'soundscape') net.onSoundscape?.(m)`, and the same for cues), and set `net.onSoundscape` and `net.onSoundcue` when your module starts, as the letters do with `net.onLetter`.
   - A player's own settings choose whether they hear it: phones may want only cues, the TV the whole mix. Add a small player-side control: "Table sound: off · cues only · everything".
3. **Looks:**
   - a mixing desk in the app's style: each layer a vertical fader with its icon, and scenes as large tiles with a small waveform glyph
   - it must work on a phone (faders become horizontal sliders below 480 px) and on a laptop
   - respect `prefers-reduced-motion`
4. **Battery:** stop every node of a layer when it's off. Keep the CPU light: 10 layers playing together shouldn't drop the frame rate on a phone (check with the Look panel's fps).

## Files

- new `src/ui/soundscape.js`
- one line in `src/ui/events.js` to start it
- new `tests/e2e/soundscape.spec.js`, which proves:
  - the board opens for the DM
  - a scene turns the right layers on (check your module's state, exposed on `window.DreadDelveSoundscape`)
  - a saved scene survives a reload
  - a cue sends a `soundcue` message (spy on `toPlayers`, or expose a send hook)
  - with "Let the map choose" on, the board doesn't override the map
  - a player set to "cues only" ignores a `soundscape` message and plays a `soundcue`
  - Audio can't be heard in tests: check the graph's state (layers running, gains), not sound.
- **In the PR, describe:** the two lines needed in `src/net/table.js`, and whether you'd like `audioCtx` exported from `sound.js`.
