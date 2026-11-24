# Codex, round 12: the casters, and the party, in the balance check

Round 11 is in: the rot has stages, cures and a voice, and the balance report reads the Callings. Thank you; both are wired into the game now. The rot plays through `src/game/rot.js`, and your report's reading went to ChatGPT as a tuning pass on the martial Callings (`docs/chatgpt/callings-balance.md`).

Your report is honest about its limits: weapons and damage cantrips only, one hero, an open lane. That leaves half the Callings unjudged. The Archivist, Relicborn, Seepbound, Chaplain, Herald and Mistwalker are casters, and the Outrider needs an ally beside its target for Sneak Attack. Their low win rates are the duel's blind spot, not ours. This round closes it.

Read `AGENTS.md` first; its rules all stand (a public repository; invented names or SRD 5.2.1 numbers, never book text; nothing from the Halo games; pure modules, every die from the `rng` passed in, plain JSON; never commit `dread-delve.html`; `npm test` and `npm run build` pass).

One pull request, `codex/balance-casters`, based on `claude/dread-delve-v0.2`. Change `src/engine/balance.js`, `scripts/callings-balance.mjs` and `tests/balance.test.js`; read everything else.

## What's there (read; don't change)

- **Your duel** (`src/engine/balance.js`) and the report.
- **The spells:** `src/data/srd-spells.js` (yours), and how the game plays them: `src/data/spell-play.js` and `src/engine/spellcast.js` (damage, saves, areas, upcasting), `src/engine/hero.js` (`heroSpells`, the slots), `src/engine/rest.js`. A Calling's hero casts its chassis class's spells; their names in our words are ChatGPT's `src/data/rites.js` (the report should use those names for a Calling).
- **Summons** (`src/engine/mech.js` `summonToken`), already in your duel.

## Do

1. **Spells in the duel.** A caster prepares a sensible list for its level (`heroSpells`, the chassis's defaults), spends slots on the turns a slot is worth more than a cantrip (a simple rule you state), upcasts when it helps, and uses healing and protection spells when hurt. Damage, saves, half on a save, concentration (one at a time; it breaks on a failed Constitution save) as the SRD has them. Areas count one target in a duel.
2. **A party fight** beside the duel: `simulateParty({ heroes:[{ calling, path, lvl }], foes, fights, rng })` → the same results per hero plus the party's. Two heroes (the Calling under test and a fixed partner: a level-matched Vanguard Hoplite) against a foe group of the level's CR budget. Allies make Sneak Attack, auras, *No One Left Behind*-style reactions and healing others count.
3. **The report** gains, for each level, a **party table** beside the duel table, and the duel table uses spells. Flags as before (one standard deviation, both ways), and a line saying which Callings changed most from the old weapons-only duel.
4. **Tests:** deterministic for a seed; a level 5 Archivist now beats its level's duel foe more often than with weapons only; a caster's slots run out and it falls back to cantrips; concentration holds one spell at a time; the party fight gives the Outrider Sneak Attack; every Calling and Path at levels 1–10 runs both without throwing.

In the PR, paste the level 3, 5 and 10 tables (duel with spells, and party) and your reading: which Callings and Paths are still out of line, and what you'd change in their data (ChatGPT will make the changes).
