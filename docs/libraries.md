# Libraries: what's in, what's next, what's out

Dread Delve ships as **one HTML file** (`npm run build` → `dread-delve.html`) that also runs from the Vercel site. A library earns its place only if it:

- bakes into that file: no loose asset folders, WASM it fetches at run time, or CDN calls;
- carries a licence that lets a public repo ship it (MIT, BSD, Apache, CC0, CC BY with credit);
- and does something we'd otherwise write badly.

## In the app

| What | Licence | Used for |
| --- | --- | --- |
| [three.js](https://threejs.org) 0.169 | MIT | the 3D table, minis, forge figures |
| [PeerJS](https://peerjs.com) 1.5.4 | MIT | the table's connections (DM ↔ players ↔ TV) |
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4 | MIT | invite link and screen link as QR codes (`src/util/qr.js`) |
| Screen Wake Lock (browser API) | — | the TV and card-only phones stay awake (`src/util/wake.js`) |
| Web App Manifest (browser) | — | "Add to Home Screen" from the Vercel site (`public/manifest.webmanifest`) |

Dev only: Vite with vite-plugin-singlefile, Playwright, `peer` (a local signalling server for the tests).

## Worth adding next (best first)

1. **[idb-keyval](https://github.com/jakearchibald/idb-keyval)** (Apache-2.0, under 1 KB): keep saves in IndexedDB instead of `localStorage`. `localStorage` holds about 5 MB per site, and portraits and handouts are data URLs, so a long campaign with art will hit that ceiling. It's a small change in `src/game/session.js`, with a one-time move of the old save.
2. **[marked](https://github.com/markedjs/marked)** (MIT) **+ [DOMPurify](https://github.com/cure53/DOMPurify)** (Apache-2.0 / MPL-2.0): the new spell text is Markdown with embedded tables and stat blocks (Animate Objects, Teleport…). A "read the spell" card in the creator and on the hero card would render it properly. DOMPurify matters because the private library (Codex task 7) is imported text.
3. **[driver.js](https://github.com/kamranahmedse/driver.js)** (MIT): a first-night walkthrough for a new player ("this is your card, tap an attack, tap a target"). It's cheap and helps the friend who joins on a phone.
4. **[three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)** (MIT): faster picking and line-of-sight raycasts on big maps (Castle Ravenloft, the Valley), if those ever feel slow on a phone.
5. **[rot.js](https://github.com/ondras/rot.js)** (BSD-3): cellular-automaton caves and natural tunnels for the Seep's growth, beside our room-and-corridor generator. Its FOV isn't needed: ours already does true line of sight.

Not a library, but built in and better than one: **`CompressionStream('gzip')`** can shrink Export files and the state the DM sends on join. Reach for [fflate](https://github.com/101arrowz/fflate) (MIT) only if a browser we care about lacks it.

## Looked at, and not for now

- **[@3d-dice/dice-box](https://github.com/3d-dice/dice-box)**: lovely physics dice, but it runs on Babylon.js and Ammo (WASM) and loads its themes and workers from an assets folder. That's a second 3D engine, and it doesn't fit a single file. The TV's tumbling d20 does the job; a three.js die with a few faces' worth of physics would be the in-house next step.
- **[troika-three-text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text)**: crisp 3D labels, but it fetches fonts and spins up workers at run time. The name plates we draw on canvas are enough.
- **Howler.js / Tone.js**: the drone and sound effects are synthesised with Web Audio; there are no sound files to manage.
- **[5e-bits/5e-database](https://github.com/5e-bits/5e-database)**: handy JSON, but it's SRD **5.1**. The app follows SRD **5.2.1** (2024 rules), so Codex imports from the 5.2.1 PDF and its Markdown conversion instead (see `docs/codex/rules-data.md`).

## Art and asset sources

See `docs/assets.md` (Kenney, Quaternius, Poly Haven, game-icons.net and the rest, with licences).
