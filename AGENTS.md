# Dread Delve — notes for the coding agents (Codex, Muse, Cursor, and ChatGPT by hand)

A 3D multi-floor dungeon simulator and virtual tabletop for a Curse of Strahd: Flood Edition table (three.js, PeerJS, Vite). Read `DREAD-DELVE-ROADMAP.md` first: it has the feature list and the code map. Agents on this repo: **Claude Code** (integration, UI, game rules, merging), **Codex** (rules data), **Cursor** (tests), **Muse Code** (Meta: self-contained UI features) and **ChatGPT** (chat only: it can't reach the repository, so the DM pastes a self-contained prompt from `docs/chatgpt/` and brings back the files, which Claude adds and wires). These rules keep you from colliding.

## Who works where
| Agent | Branches | Owns | Briefs |
| --- | --- | --- | --- |
| Claude Code | `claude/dread-delve-v0.2` (the default) | `src/game/`, `src/net/`, `src/render/`, `src/ui/`, `index.html` (all CSS), `src/main.js`, merging, the built `dread-delve.html` | — |
| Codex | `codex/<topic>` | the SRD rules data: `src/data/srd-*.js` and `scripts/import-srd-*` (but `src/data/spell-play.js` is Claude's); and the rules-engine tasks (`src/engine/defenses.js`, `src/data/monster-play.js` and its script, `src/engine/inventory.js`, and their tests: see `docs/codex/rules-engine.md` and `docs/codex/rules-engine-brief.md`); round 4 (`docs/codex/table-rules.md`): `src/engine/conditions.js`, `src/data/spell-effects.js` and its script, and the `srd:`/`def:` fields in `src/data/bestiary-barovia.js` and `src/data/bestiary.js`; round 5 (`docs/codex/folk.md`): `src/engine/folk.js`, `src/data/folk.js`; round 6 (`docs/codex/round-6.md`): `src/engine/tactics.js`, `src/engine/trade.js`, `src/data/trade.js`; round 7 (`docs/codex/round-7.md`): `src/engine/crafting.js`, `src/data/crafting.js`, `src/engine/holdings.js`, `src/data/holdings.js` (and `itemInfo` in `src/engine/inventory.js` for crafted things) | `docs/codex/` |
| Muse Code (Meta) | `muse/<topic>` | the files its brief names (round 2, `docs/muse/brief-2.md`: `src/ui/notebook.js`, `src/ui/palette.js`; round 3, `docs/muse/brief-3.md`: `src/ui/ghost.js`, Wick the guide; round 4, `docs/muse/brief-4.md`: `src/ui/letters.js`, the Count's letters; with the one-line hooks they list) | `docs/muse/` |
| ChatGPT (chat) | none: Claude commits its files | `docs/chatgpt/days-off.md`: `src/engine/downtime.js`, `src/data/downtime.js`, `tests/downtime.test.js`; `docs/chatgpt/hired-hands.md`: `src/engine/hirelings.js`, `src/data/hirelings.js`, `tests/hirelings.test.js` | `docs/chatgpt/` (each prompt is self-contained) |
| Cursor | `cursor/<topic>` | track A: new test files (`tests/e2e/*.spec.js` it creates, `tests/fixtures/saves/`). (Track B has moved to Codex.) | `docs/cursor/` |

Shared files (`src/engine/hero.js`, `src/data/srd.js`, `src/data/bestiary.js`, `src/engine/state.js`): change them only if your task says so, and keep the change small. If your task needs a change in someone else's area, describe it in the PR instead of making it.

## Branches and merging
- Work on your own branch (`codex/<topic>`, `cursor/<topic>` or `muse/<topic>`) and open a pull request against `claude/dread-delve-v0.2`. Never push to `claude/dread-delve-v0.2` or `main`: Vercel deploys the app from them. Claude reviews, merges, wires the UI and deploys.
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
- Task briefs live in `docs/codex/` (Codex: start with `docs/codex/rules-data.md`), `docs/chatgpt/` (ChatGPT: self-contained prompts the DM pastes), `docs/cursor/` (Cursor: `docs/cursor/brief.md`) and `docs/muse/` (Muse: `docs/muse/brief.md`).
- This repository and the app are public. Only openly licensed rules (SRD 5.2.1, CC BY 4.0, with its attribution) go in `src/data/`. Text, stat blocks and tables from other books stay out of the repo; they belong in a DM's private library file, which is imported in the browser and never committed.
- This is the DM's own Curse of Strahd campaign, for their table only. **The module's names are welcome**: Strahd, Barovia, Vallaki, Krezk, the Vistani, Ireena, Ismark, Madam Eva, the Abbot and the rest. Use them as the campaign does; don't invent stand-ins.
- But don't copy the book's own words or numbers into the repository: no boxed text, no stat blocks, no unique item or spell text from it. Write your own descriptions, and use SRD 5.2 numbers. The DM's private library (`.prism`, imported in the browser, never committed) is where the book's text lives.
- Creatures, tables, themes, props, loot, the Valley's places and road events, and the campaign sessions all live in `src/data/`.

## Before opening a PR
Run `npm test` and `npm run build`. For UI changes, check the page in a browser at desktop and phone widths. Describe what you changed and how you tested it.
