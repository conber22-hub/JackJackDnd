# Muse brief, round 11: 🎨 shells and stickers

A second, smaller handheld task, separate from round 10 (the pocket sheet); it can be done before or after it. Everyone at the table now plays from the same pocket console (`src/ui/handheld.js`), and the joy of a handheld is making it yours. Today there are five shells (Dusk violet, Bone, Old blood, Bog moss, Smoke glass), picked in the menu's **Handheld & camera** page. This round adds **more shells** and **stickers** a player can put on their shell, so four friends' phones on the table look like four different consoles.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you draw is your own (inline SVG and CSS); no images from elsewhere, and no console maker's names, logos or trade dress.
- Work on `muse/shells`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once.

## What's there (read; don't change)

- **The shell** is `#handheld` > `.hh-body`, with these inside it:
  - `.hh-sh` (L and R), `.hh-bezel` (the screen, its Lantern light and the name under it)
  - `.hh-left` (the D-pad), `.hh-right` (A B X Y and the speaker grille), `.hh-pills` (Select, View, Start)
  - Landscape and portrait are two grid layouts (`@media (orientation:portrait)` in `index.html`).
- **A shell's colours** are CSS variables set on `#handheld[data-shell="<k>"]` in `index.html`:
  - `--hh-a` and `--hh-b`: the body's two gradient stops
  - `--hh-edge`: the highlight
  - `--hh-ink`: legends
  - `--hh-key`, `--hh-key-hi`, `--hh-key-ink`: D-pad, small keys
  - `--hh-ab`, `--hh-ab-hi`: A and B
  - `--hh-bezel`
- **The list** the menu cycles through is `SHELLS` in `src/engine/wander-cam.js` (`{ k, label }`). `handheld.js` sets `data-shell` and keeps the choice in `localStorage['dreaddelve.handheld.v1'].shell`.
- **The buttons** listen for `pointerdown` on `[data-hh]` elements. Anything you put on the shell must not get in their way.

## Do

1. **`src/ui/shells.js` (new)**, exporting:
   - `SHELL_PACK`: at least 8 new shells, `{ k, label, vars:{ '--hh-a':…, … }, css }`. `css` is optional extra CSS for that shell only, all scoped under `#handheld[data-shell="<k>"]`: a texture from gradients or an inline-SVG pattern, a different A/B colour, a translucent body. Make them Barovian and distinct:
     - **Ravenloft obsidian:** black glass, a thin red edge
     - **Vistani painted:** a lacquered wagon red with a gold scroll pattern
     - **Amber Temple:** honey translucent, with a dark core showing through
     - **Krezk whitewash:** chalk white and slate keys
     - **Svalich pine:** wood grain
     - **Wedding of the Count:** ivory and old lace
     - **Moonlit frost:** pale blue with rime at the edges
     - **Bloodmoon:** deep red, with the D-pad black
     - Name them your own way.
   - `injectShells()`: adds the pack's CSS once.
   - `mountStickers(shellEl)`: puts the player's saved stickers on `.hh-body`, and keeps them right when the phone turns. Stickers sit between the body and the controls (`pointer-events:none`, below the buttons), so they never block a press.
   - `openStickerBook({ onClose })`: the sticker editor.
2. **Stickers:**
   - **The set:** at least 16, all inline SVG you draw. For example:
     - a bat, a rose, a raven, a candle, a d20, a skull, a Vistani wheel, a sun, a crescent moon
     - an amber shard, a garlic bulb, a holy symbol, a wolf's head, a coffin, a "Don't wake the Count" scroll, a little ghost
     - Give them a vinyl look: a white die-cut edge and a slight shine.
   - **The sticker book:**
     - a sheet over the phone (it can cover the shell while you edit), with the stickers in a tray
     - drag one onto the shell, drag it to move it, twist it with two fingers (or tap ⟲ ⟳ buttons), pinch or tap −/+ to scale, and drag it back to the tray to peel it off
     - at most 12 on a shell
     - **Clear** and **Done**
   - **Kept** per device in `localStorage['dreaddelve.stickers.v1']`, separately for portrait and landscape (the layouts differ), as positions in % of `.hh-body`'s box, so they survive any phone size.
3. **Looks:** stickers stay crisp at any device pixel ratio. A sticker over the screen's bezel is allowed, but never over the screen itself (`#hhScreen`'s rect): snap it off the screen if dropped there.

## The hook (for Claude)

Don't change `handheld.js`, `wander-cam.js`, `ui/wander.js`, `ui/tablehh.js` or `index.html`. In the PR, describe the lines Claude adds:
- Merge `SHELL_PACK` into the menu's shell list (and accept its keys in `relayout`).
- Call `injectShells()` and `mountStickers(el)` when the shell is built.
- Add a **Stickers…** item on the Handheld & camera page of both menus, calling `openStickerBook`.

Add `export * as shells from './ui/shells.js';` to `src/debug.js` (that one line) so your spec can drive it.

## Files

- new `src/ui/shells.js`
- one line in `src/debug.js`
- new `tests/e2e/shells.spec.js`. Force the handheld on in a Wanderer on a phone viewport (`localStorage['dreaddelve.handheld.v1'] = '{"mode":"on","full":false}'`; see `tests/e2e/handheld.spec.js`). Then call your functions through `window.DreadDelve.shells`. It proves:
  - every pack shell applies its variables (the body's computed background changes)
  - the sticker book places a sticker, which is kept after a reload
  - a sticker never sits over `#hhScreen`
  - with stickers on, a tap on A still reaches the button (the boot is skipped: `#hhBoot` hides)
