# Codex: the rules engine (three tasks)

These three tasks were first written for Argon, then given to Cursor; neither published anything, so they are yours now.
The full brief is **`docs/argon/brief.md`**: its files, its rules, its tests, and its "Done means" all stand. Where it says `argon/…`, use **`codex/…`**.

Do them **in this order**, one pull request each, against `claude/dread-delve-v0.2`:

1. **`codex/defenses`**: `src/engine/defenses.js` and `tests/defenses.test.js`. Damage resistances, immunities, vulnerabilities and condition immunities, parsed from every SRD creature's traits, and applied part by part to a hit.
   - This one matters most: right now a skeleton takes full damage from poison.
2. **`codex/monster-actions`**: `scripts/import-monster-actions.mjs`, `src/data/monster-play.js` and `tests/monster-actions.test.js`. Breath weapons and the other save-for-half actions, shaped like spells so the app can aim them, with recharge, and Legendary Actions and Legendary Resistance counts.
   - Every number must come from the creature's own text.
3. **`codex/inventory`**: `src/engine/inventory.js` and `tests/inventory.test.js`. Things a hero carries, equips and attunes; +1 armour and weapons that count; weight and coins.
   - Old hero sheets must keep working.

## The rules for all three

- Read `AGENTS.md` first. It is a public repository: invented names and SRD 5.2.1 only, never book text.
- Pure modules: no DOM, no Three.js. Don't touch `src/game/`, `src/net/`, `src/render/`, `src/ui/` or `index.html`; Claude wires the results into the app.
- Never commit `dread-delve.html`.
- `npm test` and `npm run build` must pass.
- In the PR description, say:
  - what is covered
  - what you skipped and why
  - the exact hook Claude needs to add (the brief says which, for each task)
