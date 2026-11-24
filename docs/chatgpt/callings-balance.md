# ChatGPT prompt: ⚖ a balance pass on the Callings

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/callings-balance` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (the changed file and the report) back to Claude Code, which adds them, runs the tests and wires them in.

---

You wrote **Dread Delve**'s twelve **Callings** (`src/data/callings.js`), made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. Codex has now built a balance check that plays every Calling and Path in 200 duels at levels 3, 5 and 10 through the real feature engine: `src/engine/balance.js`, and the report from `node scripts/callings-balance.mjs` (or `node scripts/callings-balance.mjs 5` for one level). Its reading is in the description of pull request #118. **Read `docs/homebrew/callings.md`, then run the report.**

The duel has limits, and they decide what you may change: one hero against one foe in an open lane, **weapons and damage cantrips only** (no leveled spells), no allies, no cover. So:
- **Tune only what the duel measures fairly:** the martial Callings (Vanguard, Huscarl, Marksman, Warden, Pankratiast), the summons, and the Seep prices.
- **Don't tune the casting Callings** (Archivist, Relicborn, Seepbound, Chaplain, Herald, Mistwalker) or the Outrider on these numbers: they look weak only because the duel leaves out their spells and their ally-based Sneak Attack. Say so in the report; Codex will add spells and allies to the duel next.

Change exactly one file, `src/data/callings.js`, plus a short report `docs/chatgpt/callings-balance-report.md`. Keep every feature's name, voice and idea; change numbers, uses, recharges and triggers.

## What the report shows (aim for these)

1. **The Vanguard's Ward** carries all three Vanguard Paths to 98–100% at every level. Make it smaller, or slower to come back (e.g. recharge on a short rest rather than each round untouched), until the Vanguard Paths sit near the top of the martial Callings but not alone at 100%.
2. **The Pankratiast's Focus** keeps all three of its Paths at 75–94%. Trim the shared engine (uses per rest, or the cadence of its extra strikes) before the Paths; Olympian's *Sand Throw* may come down a die.
3. **The Penitent's *Brand the Blight*** fires every hit and lifts level-10 wins from 56% to 82%. Once per turn.
4. **The early summons** (the Swarm's *Small Envoy*, the Wolfkin's *Answering Howl*) add 41–55 points at level 5. Lower their hit points at low levels (e.g. `'3*lvl'` until level 6, `'5*lvl'` after), or make them arrive as a bonus action that costs the turn's attack.
5. **The Seep prices:** Rotblood pays about 26 HP and Fused about 28 at level 10, while Fused gains half a point of wins. A Seep-touched Path should be **strong and costly**, not costly and weak: make Fused's *Split Filament* cost proficiency once a turn, and lift what it gives so its win rate is in line with its Calling's other Paths.
6. **Seep-touched Paths that never fire their price in the duel** (it's written as words for the table) are fine as they are; list them.

**Targets:** at each level, every martial Path within one standard deviation of the martial mean, and no Path above 97% or below 40% at level 5 against the level-5 foe. Report before and after for every row you touched.

## Hard rules

- Plain data only; the shapes of `mech` stay exactly as `src/engine/mech.js` reads them (its tests and the data's tests must pass: `npm test`).
- **All original.** Nothing that belongs to the Halo games. Respectful: this is a memorial.
- Don't edit any other source file.
