# Muse brief, round 14: 💬 fight captions

A fight in Dread Delve is now mostly seen and heard: a blow lunges in and the world holds still for an instant, the one struck is knocked back, a slash of light crosses them, spells go off in their own colours, foes wind up and a red arrow shows who they're going for, and every one of those has its own little chiptune sound. That is a lot for a player who can't hear the sounds, who has the calm effects on, or who simply looked away for a second. This round is **captions**: a short, readable line for each thing that happens in a fight, the way a good game subtitles its combat.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own.
- Work on `muse/captions`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Your module puts its own styles in a `<style id="…">` it adds once (see `src/ui/pocketsheet.js`); match the regal glass look in `index.html` (its colour tokens on `:root`: `--candle`, `--ink`, `--dim`, `--line`, `--blood`…). Work on a phone (the handheld, `body.hh`) and on a desktop.

## What's there (read; don't change)

Everything in a fight already passes through the game's event bus (`bus` from `src/util/core.js`: `bus.on(name, fn)`). These are the events, and what they carry:
- `acted` `{ actor, target, trigger, action, dmg, dmgType, ranged, spell, die }`: `trigger` is `'hit'`, `'miss'`, `'critical'` for a blow, `'spell'` or `'heal'` for a spell cast; `die` is the d20 (`{ n, hit, crit, tot, ac, mode }`).
- `hurt` `{ t, n, type, by }`: someone took `n` damage (`t.dead` if it killed them).
- `healed` `{ t, n }` · `turnAct` `{ t, k }` (`dash`, `dodge`, `disengage`, `stand`) · `feature` `{ t, id, n }` (Second Wind, Rage…) · `cond` `{ t, n }` (a condition taken on).
- `turnStart` `{ t }`: someone's turn begins · `aims` `{ by, at }`: a foe in the Wanderer shows who it's going for, half a second before it acts.

Tokens have `name`, `kind` (`'pc'`, `'npc'` or `'monster'`), `hp`, `maxHp`, `dead`. Who is "you": `window.DreadDelve.ui.myToken` at the table, the Wanderer's hero (`state.campaign.wander.heroTok`) when playing alone.

On a player's phone at the table these events don't fire (the DM's app runs the fight); a player sees the cards it sends. **This round is the DM's app and the Wanderer**: a phone at the table is a later round.

## Do

### `src/ui/captions.js`

`startCaptions()` (wires the bus, once), `captionsOn()`, `setCaptions(on)` (remembered per device in `localStorage` under `dreaddelve.captions.v1`; **off by default** on the DM's app, **on by default** in the Wanderer if the device asks for reduced motion, else off), and `captionLines()` (the last lines shown, newest last, for the spec).

What it shows: a small stack of at most **three** lines, low on the screen and clear of the fight bar, the turn order along the top and the cards (in the Wanderer: just above `#wdFight`; elsewhere: bottom-left, clear of `#dock`), each line fading in, holding about three seconds, and fading out; a new one pushes the oldest off. Plain words, a few at a time, **from the player's side**:
- a blow: *Vasha hits the wolf for 7.* · *A critical! Vasha hits the wolf for 16.* · *The wolf misses you.* · *The wolf bites you for 5.*
- a kill: *The wolf falls.* · a hero down: *Ilse is down!* (in red)
- a spell: *Vasha casts Burning Hands.* then each one it hurt: *The wolf burns for 9.* (the damage type's verb: burns, freezes, is shocked, is blasted, withers, is seared…)
- healing: *Ilse heals you for 6.* · acts and features: *Vasha dodges.* · *Vasha rages.* · conditions: *The wolf is knocked prone.* · *You are frightened.*
- a turn: *Your turn.* (gold) · *The wolf's turn.* · aims: *The wolf goes for you!* (red)
Several things in one instant (a Fireball catching three) make one line where they can (*The Fireball burns the wolf, the bat and the ghoul.*), so the stack never floods.

Colours, sparingly: gold for your own good news, red for what's done to you, the ink colour for the rest. A small icon at the start of each line is welcome (⚔ 🎯 ✦ ✚ ☠ 🛡), never more than one.

## Hooks for Claude (not in this PR)

1. `src/main.js`: `startCaptions()` once at start, next to `wireFightFx()`.
2. The 🎨 Look panel (`src/ui/look.js`, under **Fights**, next to *Calm effects*): a *Captions* checkbox bound to `captionsOn()` / `setCaptions()`. Describe the exact lines in the PR; Claude adds them.

## The spec

`tests/e2e/captions.spec.js`: start the Wanderer, set up a fight (the pattern in `tests/e2e/punch.spec.js` `fight()`), turn captions on, then drive it with `window.DreadDelve.wander.heroAttack(0)` and ending the turn: a line naming the hero and the foe appears, then the foe's turn and its blow; at most three lines are ever on screen; with captions off, none. Check it at a phone size with the handheld on (`preparePage(page, { handheld:true })`), and that nothing is cut off at the side.
