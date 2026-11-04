# Muse brief, round 5: "Our place", on the players' phones

The letters are live; thank you, they're lovely. This one is about the party's own home.

The DM can now:
- build the party a camp, house or fort in Barovia (the 🏰 section of the Build tab)
- hire villagers to work it
- craft them weapons and wagons in the 🔨 Workshop

The players can't see any of it yet: it all lives in `state.campaign`, which never reaches them (`src/engine/redact.js` deletes it). Your job is to give them a view of what's theirs, without ever showing what the DM keeps hidden.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: invented text only.
- Work on `muse/estate`, one pull request, against `claude/dread-delve-v0.2`.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your CSS goes in your module, injected once, using the app's tokens (look at how `src/ui/letters.js` does it).

## What's there (read these; don't change them)

**`state.campaign.holdings`:** a list; the party usually has one. Its shape:

```js
{ id, name, kind:'camp'|'house'|'homestead'|'outpost'|'fort'|'keep', place, map, floor,
  modules:[{ id, module:'palisade'|'tent'|'cottage'|…, built:true|false, hp }],
  projects:[{ target, module, remaining /* worker-days left */ }],
  stores:{ timber, stone, salt, gp },
  hired:[{ id, name, role, skill, wage, loyalty, devoted, spy?, exposed?, turned? }],
  raid?:{…}, watch?:{…}, log:[…] }
```

- `stats(holding)` from `src/engine/holdings.js` gives `{ defence, ward, beds, storage, workshops, upkeep, income, comfort }`.
- Module names are in `MODULE_BY_ID` (`src/data/holdings.js`, `.n`).

**`state.campaign.jobs`:** Workshop jobs.

```js
{ id, n, kind, crafter:{ name, smith }, for /* a character id */, forName, job:{ progress, hours, check:{ dc } } }
```

**`state.campaign.transport`:** the party's wagons.

```js
{ id, n, capacity, speed, hp, ac, seats, bunks, fittings:[ids], owner }
```

**Never shown to players:**
- a hand's `spy`, `exposed` or `turned`
- the holding's `raid`, `watch` and `log`
- `stores` other than gp; you may decide gp is fine
- anything about the Count's court
- jobs for another player's hero: a player sees only their own

## Do

1. **`src/ui/estate.js` (new): the summary.** `estateSummary(campaign, { charId })` → a small, safe object:
   - the holding: name, kind, its numbers (beds, comfort, defence)
   - what stands (module names, built) and what's being built (name, % done)
   - the crew: name, role, ⭐ if devoted, and nothing else about them
   - the wagons: name, capacity, speed, seats and bunks, fittings named in words
   - that hero's own Workshop jobs: name, % done
   - Write it so the hidden fields **can't** leak: copy the fields you want; don't copy and delete. Make it a pure function your spec can test directly.
2. **Sending.** `sendEstate()` (DM only) builds one summary per seated player (each with their own hero's jobs) and sends it through the Curtain:
   - `toPlayers({ t:'estate', estate }, 'world')` from `src/game/outbox.js`
   - For per-player summaries, describe the hook you need to send to one player. The letters used `sendToSeat`, which the outbox now uses for any message that names a hero; look at `deliver` in `src/game/outbox.js`.
   - The TV gets the party's version (no jobs).
3. **Receiving.** `receiveEstate(estate)`, set as `net.onEstate` when your module starts (as the letters do with `net.onLetter`):
   - Keep the last one in `localStorage` per table code.
   - Show a **🏰 Our place** section on the player's Your hero tab, beside the 📜 Letters list.
   - A drawing of the place would be lovely: an SVG plan from the modules, or just good cards.
   - Phone width first. The TV shows it big when it arrives.
   - Reduced motion is respected.
4. **The palette command**, `Show the players our place` (`registerCommands`, DM only), which calls `sendEstate()`.

## Files

- new `src/ui/estate.js`
- new `tests/e2e/estate.spec.js`, which proves:
  - the summary never contains a spy, `exposed`, `turned`, a raid, a watch or the log, even when the holding has them (test `estateSummary` directly with such a holding)
  - the DM sends it and a player sees 🏰 Our place with the holding's name, a devoted hand's ⭐ and their own job, but not another hero's
  - it survives a reload
- **the hooks to describe in the PR:**
  - your message handler (`m.t === 'estate'` → `net.onEstate?.(m.estate)`) in `src/net/table.js`'s player and screen paths
  - sending one player their own summary
  - a "📤 Show the players" button in the holding section (`src/ui/holdings.js`)
  - whether it should go out by itself when something changes (a module finished, a hand hired, a job done), and when
