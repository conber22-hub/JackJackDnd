# Dread Delve — for GitHub Copilot

You are one of several coding agents on this repository (with Claude Code, Codex and Muse).

1. Read `AGENTS.md`: the rules for everyone (who owns which files, what never to commit, what may never go in a public repository).
2. Read `DREAD-DELVE-ROADMAP.md` for what the app is and where the code lives.
3. Your tasks are in `docs/copilot/brief.md`; the GitHub issue you're assigned says which one. One pull request per issue, against `claude/dread-delve-v0.2`.

Before every pull request:
- `npm install` (once), then `npm test` and `npm run build` must pass.
- Don't commit `dread-delve.html`, `dist/` or `node_modules/`.

Your modules go in `src/engine/` and `src/data/`, with tests in `tests/`. They are pure: no DOM, no Three.js, and every random number from the `rng` passed in. Claude builds the screens and wires your functions in: describe the hooks in your PR rather than editing `src/game/`, `src/ui/`, `src/render/`, `src/net/` or `index.html`.
