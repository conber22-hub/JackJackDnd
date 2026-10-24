# Dread Delve — notes for the coding agents (Codex, Argon, Cursor)

A 3D multi-floor dungeon simulator and virtual tabletop for a Curse of Strahd: Flood Edition table (three.js, PeerJS, Vite). Read `DREAD-DELVE-ROADMAP.md` first: it has the feature list and the code map. Agents on this repo: **Claude Code** (integration, UI, game rules, merging), **Codex** (rules data), **Cursor** (tests, plus the pure engine modules and data overlays first briefed to Argon), **Muse Code** (Meta: two self-contained features) and **Argon** (Gemini, paused). If Argon comes back, it takes only a task that has no `cursor/` branch yet. These rules keep you from colliding.

## Who works where
| Agent | Branches | Owns | Briefs |
| --- | --- | --- | --- |
| Claude Code | `claude/dread-delve-v0.2` (the default) | `src/game/`, `src/net/`, `src/render/`, `src/ui/`, `index.html` (all CSS), `src/main.js`, merging, the built `dread-delve.html` | — |
| Codex | `codex/<topic>` | the SRD rules data: `src/data/srd-*.js` and `scripts/import-srd-*` (but `src/data/spell-play.js` is Claude's) | `docs/codex/` |
| Muse Code (Meta) | `muse/<topic>` | the files its brief names: autosave in `src/game/session.js` (save functions only) and a new `src/ui/tour.js`, with the one-line hooks it lists | `docs/muse/` |
| Argon (Gemini) | `argon/<topic>` | paused (out of credits); its tasks have moved to Cursor's track B | `docs/argon/` |
| Cursor | `cursor/<topic>` | track A: new test files (`tests/e2e/*.spec.js` it creates, `tests/fixtures/saves/`); track B: the files `docs/argon/brief.md` names (`src/engine/defenses.js`, `src/data/monster-play.js` and its script, `src/engine/inventory.js`, and their tests) | `docs/cursor/` |

Shared files (`src/engine/hero.js`, `src/data/srd.js`, `src/data/bestiary.js`, `src/engine/state.js`): change them only if your task says so, and keep the change small. If your task needs a change in someone else's area, describe it in the PR instead of making it.

## Branches and merging
- Work on your own branch (`codex/<topic>`, `cursor/<topic>`, `muse/<topic>` or `argon/<topic>`) and open a pull request against `claude/dread-delve-v0.2`. Never push to `claude/dread-delve-v0.2` or `main`: Vercel deploys the app from them. Claude reviews, merges, wires the UI and deploys.
- **Never commit `dread-delve.html`.** It is the built app; whoever merges runs `npm run build` and commits it. Don't commit `dist/` or `node_modules/` either.
- Keep each PR to one topic. Don't stack a PR on another agent's unmerged branch.
- Don't restyle: the look (regal glass, `index.html`) is Claude's.

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
- Task briefs live in `docs/codex/` (Codex: start with `docs/codex/rules-data.md`), `docs/argon/` (Argon: `docs/argon/brief.md`) `docs/cursor/` (Cursor: `docs/cursor/brief.md`) and `docs/muse/` (Muse: `docs/muse/brief.md`).
- This repository and the app are public. Only openly licensed rules (SRD 5.2.1, CC BY 4.0, with its attribution) go in `src/data/`. Text, stat blocks and tables from other books stay out of the repo; they belong in a DM's private library file, which is imported in the browser and never committed.
- Don't reprint text from the published Curse of Strahd module (boxed text, stat blocks, unique item text). Use original names and descriptions, or SRD 5.2 material.
- Creatures, tables, themes, props, loot, the Valley's places and road events, and the campaign sessions all live in `src/data/`.

## Before opening a PR
Run `npm test` and `npm run build`. For UI changes, check the page in a browser at desktop and phone widths. Describe what you changed and how you tested it.
