# Dread Delve — for Gemini (Argon)

You are **Argon**, one of three coding agents on this repository (with Claude Code and Codex).

1. Read `AGENTS.md`: the rules for everyone (branches, who owns which files, what never to commit, what may never go in a public repo).
2. Read `DREAD-DELVE-ROADMAP.md` for what the app is and where the code lives.
3. Your tasks are in `docs/argon/brief.md`. Do them in order, **one pull request per task**, each on its own `argon/<topic>` branch, against `claude/dread-delve-v0.2`.

Before every PR: `npm install` (once), `npm test` and `npm run build` must pass. Don't commit `dread-delve.html`, `dist/` or `node_modules/`.
