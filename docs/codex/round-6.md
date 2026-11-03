# Codex, round 6: monsters that fight smart, and the folk's trade and troubles

Your folk engine (#19) is live, and so are the court, the conditions, the defences, the breath weapons and the pack. These two tasks build on them.

Read `AGENTS.md` first; its rules all stand:
- a public repository: invented names and text only, never book text
- pure modules: no DOM, no Three.js, every die from the `rng` passed in
- never commit `dread-delve.html`
- `npm test` and `npm run build` must pass

Two pull requests, each based on `claude/dread-delve-v0.2` (not on each other). In each, say what's covered, what you skipped and why, and the exact hook Claude adds.

---

## Task 1: tactics (`codex/tactics`)

**Why.** A monster's turn on autopilot (`autoTurn` in `src/game/combat.js`) only closes in and swings at whoever is most hurt. The creatures have far better options now:
- breath weapons and other save actions on `t.casts` (shaped like spells, with `area`, `recharge` and `t.spent`)
- the conditions engine (`src/engine/conditions.js`)
- the court's knowledge (`m.knows` from your folk engine)

**Do:** write `src/engine/tactics.js` and `tests/tactics.test.js`.
- `planTurn(me, { allies, foes, floor, round, court }, rng)` → one plan:
  `{ kind:'cast'|'attack'|'move'|'flee'|'drag'|'dodge'|'hold', i?, target?, aim?:{x,y}, to?:{x,y}, why:'one plain line for the DM' }`
  - A creature is a token as the app keeps it: `x, y, size, hp, maxHp, ac, conds, attacks, casts, spent, bid, nem` (a court member's id), `flags`. Use `src/engine/targeting.js` (`rangeCheck`, `coverOf`, `areaOf`, `areaSquares`, `caughtIn`) and `src/engine/movement.js` (`planToward`). Don't write your own geometry.
- **What a clever creature does**, in order of preference, each with a short `why`:
  - **A save action that's ready** (not in `me.spent`): use it when its area catches two or more foes and no ally (or one foe at half HP or less). Aim it at the point that catches the most.
  - **A creature with a written trick** (the Count's Wolf drags a downed body; see its traits): use it when it applies.
  - **Finish the fallen?** Only creatures that would: an undead hunter or one of the court with a grudge against that hero (`m.grudge.hero`). Everything else turns to a standing foe.
  - **Focus:** the foe it can reach and hurt most, preferring one already wounded, one that is concentrating (to break it), and one with low AC.
  - **The court remembers:** a court member whose `knows.tactic` is a damage type keeps its distance from the hero who deals it, and goes for someone else.
  - **Cowards and the wounded:** a beast or a minion below a quarter of its HP flees (moves away, and Dodges if it can't get clear). The court's servants and bosses never flee.
  - **Ranged creatures** stay at range and step back from a foe beside them.
  - **Nothing in reach:** move towards the best target, or Dodge if that would only provoke attacks.
- `resistWorthIt(me, save, { cond, dmg })` → bool: spend Legendary Resistance on a failed save? Yes for paralysed, stunned, charmed, banished, petrified, or damage of 25% of its HP or more; not for a scratch.

**Tests:**
- a dragon breathes on three heroes in a line, not on one beside its ally
- a spent breath isn't used
- a goblin at 3 HP flees, and a court captain doesn't
- an archer steps back from a sword
- a court member who knows the party uses fire avoids the wizard who cast it
- Legendary Resistance is saved for what matters
- every plan is legal for the app: the target is in range, and the aim catches what it says

**Hook to describe:** `autoTurn` asks `planTurn` and carries out the plan, showing its `why` on the DM's card.

---

## Task 2: trade and troubles (`codex/trade`)

**Why.** The valley's folk can be talked to now. The smith, the peddler and the priest should sell things, and folk in trouble should ask for help, in ways that lead into the court.

**Do:** write `src/engine/trade.js`, `src/data/trade.js` (invented lines, the voice of `src/data/folk.js`) and `tests/trade.test.js`.
1. **`stockFor(person, { place, gaze, day, seed })` → `[{ n, qty, gp }]`**: what they sell.
   - smith: weapons, armour and tools
   - peddler: gear, and now and then something odd
   - priest: holy water, healing potions, candles
   - Names from `src/data/srd-items.js`. Prices from the catalogue's `cost`, rising with his Gaze (the valley is short of everything): +10% a point above 2.
   - Stock is steady for a day (seeded by person, place and day), and smaller in a village than in a town.
2. **`haggle(price, { roll, dc }, rng)` → `{ gp, line }`**: a Persuasion check against the seller's DC. Success takes 10–20% off; a fumble insults them, and the price goes up.
3. **`buy(sheet, item, gp)` / `sell(sheet, itemId, { person })`**: pure, using `src/engine/inventory.js` (coins with change, the pack). Selling is for half the catalogue cost; magic items don't sell to a village smith.
4. **`troublesFor(folk, court, { place, gaze, day }, rng)` → `[{ id, by:personId, kind, text, goal, reward, links? }]`**: what the folk ask for help with, at most one per few folk.
   - **Kinds:** a lost child to bring home (an actual `lostChild` on a road map); a captive to free (a dungeon `captive`); a raid on a farm, written from a recent `court.news` raid item, with `links:{ member }` (the trouble leads to that court member's haunt); a missing person who is in fact one of the Count's eyes, who comes back and asks questions.
   - **Rewards:** coins scaled by Gaze (they're poor), a favour (a free night, the smith's work), a rumour that is true.
   - **`resolve(trouble, outcome)`**: `done`, `failed` or `ignored`. It moves the folk's mood a step (better or worse), and can tell the court (failing a raid trouble makes its member bolder).

**Tests:**
- deterministic stock per day; prices rise with Gaze
- buying and selling move coins correctly with change, and the pack holds the item
- haggling's success and fumble
- troubles only name living folk and living court members, and a raid trouble links to a real raid
- resolving moves mood

**Hook to describe:** tapping a seller offers 🛒 Trade (a panel Claude builds), and folk with a trouble offer ❗; where troubles are kept (`state.campaign.troubles`).
