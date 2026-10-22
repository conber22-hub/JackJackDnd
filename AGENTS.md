# Dread Delve — notes for Codex

A 3D multi-floor dungeon simulator and virtual tabletop for a Curse of Strahd: Flood Edition table (three.js, PeerJS, Vite). Read `DREAD-DELVE-ROADMAP.md` first: it has the feature list and the code map. Claude Code works on this repo too, so these rules keep the two of you from colliding.

## Branches and merging
- Work on your own branch (`codex/<topic>`) and open a pull request. Never push to `claude/dread-delve-v0.2` or `main`: Vercel deploys the app from them.
- **Never commit `dread-delve.html`.** It is the built app; whoever merges runs `npm run build` and commits it. Don't commit `dist/` or `node_modules/` either.
- Keep each PR to one topic. Unless the task says otherwise, stay out of `src/game/`, `src/net/` and `src/render/`, where Claude is building features. Tests, `src/data/` content and CSS are the safest places to work.
- If your task needs a change in someone else's area, say so in the PR description instead of widening the PR.

## Commands
- `npm install` once, then `npm test` (engine tests, `node --test tests/*.test.js`) and `npm run build` (bakes the app into `dread-delve.html`; run it to check the build, but don't commit the output).
- `npm run dev` gives a live dev server. After editing `src/data/campaign.js`, run `npm run campaign-doc`.
- In the browser, `window.DreadDelve` (`src/debug.js`) exposes state and actions. `DreadDelve.get()` returns the state; `DreadDelve.busy()` is true while a mini is still walking, so wait for it before checking positions.

## Rules of the code
- `src/engine/` is pure logic: no DOM and no Three.js, so it stays unit-testable. Rules that touch the scene or UI go in `src/game/`; drawing goes in `src/render/`; panels and input go in `src/ui/`.
- Saves from older versions are migrated in `deserialize()` (`src/game/session.js`). Add any new state field there with a default.
- What players receive is redacted in `src/engine/redact.js`. Never send players monster stat blocks, unexplored map, secret doors, unfound traps or DM-only log lines.
- The DM's browser is authoritative. A player's actions arrive as messages in `src/net/table.js` and must be validated there (that it is their own token, their turn, a legal move).
- Match the surrounding style: compact modern JS, ES modules, a short comment above anything non-obvious, and British-flavoured, plain player-facing text.

## Content
- Task briefs for you live in `docs/codex/` (start with `docs/codex/rules-data.md`: the full SRD 5.2.1 and a private content library).
- This repository and the app are public. Only openly licensed rules (SRD 5.2.1, CC BY 4.0, with its attribution) go in `src/data/`. Text, stat blocks and tables from other books stay out of the repo; they belong in a DM's private library file, which is imported in the browser and never committed.
- Don't reprint text from the published Curse of Strahd module (boxed text, stat blocks, unique item text). Use original names and descriptions, or SRD 5.2 material.
- Creatures, tables, themes, props, loot, the Valley's places and road events, and the campaign sessions all live in `src/data/`.

## Before opening a PR
Run `npm test` and `npm run build`. For UI changes, check the page in a browser at desktop and phone widths. Describe what you changed and how you tested it.
