# Muse brief, round 6: the 🎨 Look panel and 📸 photo mode

"Our place" is live; thank you. The DM wants the app to look as good as it can, on a big TV as much as on a phone. This round is the controls for that, plus a photo mode for the moments worth keeping.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: invented text only.
- Work on `muse/look`, one pull request, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens.

## What's there (read; don't change)

`src/render/gfx.js` holds the per-device settings:
- `gfx = { quality:'low'|'medium'|'high', style:'classic'|'painted', omens, volume, music, sfx }`, kept in `localStorage`
- `setGfx(patch)` saves a change and tells the renderer
- `onGfx(fn)` lets you hear changes

What each setting does:
- **quality:**
  - `low`: fast, for phones
  - `medium`: bloom and film grain
  - `high`: adds torch shadows
- **style:** `painted` is an illustrated-poster look; it needs medium or high.
- **omens:** the moving signs of Strahd's Gaze on outdoor maps.

These are reachable today only from scattered toggles.

## Do

1. **`src/ui/look.js` (new): the 🎨 Look panel.** A sheet opened from a 🎨 button you inject (as the notebook's 📓 and the letters' ✉ are) and from the palette (`registerCommands`), **for the DM and players alike**: each device chooses for itself.
   - **Quality:** low / medium / high, plus **ultra**, which Claude will make real: sharper shadows, every torch casting them, full device resolution. Just set `quality:'ultra'`; describe the hook you need from the renderer, and anything ultra should mean that you think matters.
   - **Style:** classic / painted, with a one-line description of each and a small preview swatch: a CSS gradient or an SVG is fine, no screenshots.
   - **Omens** on/off; **sound:** volume, music, effects.
   - **A "For this screen" preset row:** 📱 Phone (low), 💻 Laptop (medium), 📺 TV (high, or ultra if it keeps up). Each sets several values at once.
2. **Keeping up.** A small frame-time watcher (`requestAnimationFrame` timing, nothing heavier):
   - If the last 5 seconds average under 24 fps at the current quality, offer once, in a quiet toast with a button: "This screen is struggling: drop to medium?"
   - If it runs over 55 fps steadily at high on a big screen (wider than 1600 px), offer ultra once.
   - Never change anything without the person's tap. Remember "don't ask again" per device.
   - Show the current fps in the panel.
3. **📸 Photo mode** (DM, players and the TV):
   - Hides every panel and button, leaving only the 3D view and a small ✕.
   - Lets the camera move freely, as now.
   - **Capture** saves a PNG of the view. Ask Claude for a `capture({ scale })` hook from the renderer: it must render a frame and read it before the buffer clears. Describe exactly what you need; until it lands, read the canvas right after a `requestAnimationFrame`, which may come out blank on some devices, and say so in the PR.
   - An optional frame and caption (the place's name, the day from the valley clock) drawn onto the PNG.
   - **DM only:** "📜 Send to the table as a handout", through the Curtain like every card. Look at how the Night tab's handouts reach the players (`src/game/night.js`) and describe the hook you need.

## Files

- new `src/ui/look.js`
- one line in `src/ui/events.js` to start it, as the letters do
- new `tests/e2e/look.spec.js`, which proves:
  - the panel opens and a preset changes `gfx` (and survives a reload)
  - photo mode hides the panels and shows them again
  - capture produces a PNG data URL of a sensible size
- **the hooks to describe in the PR:**
  - `quality:'ultra'` in the renderer, and what you'd like it to mean
  - `capture({ scale })`
  - sending a captured picture as a handout
