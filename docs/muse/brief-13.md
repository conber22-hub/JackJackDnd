# Muse brief, round 13: 🏆 the screens between the fights

The Wanderer's fights now play like a tactics game on a pocket console: the d20 tumbles and lands, the odds float over the target, the turn order runs along the top as faces. What it doesn't have yet are **the screens between the fights**, the ones a good game uses to make what you did feel like it counted: the victory screen, a bestiary that fills in, achievements popping up, and a level-up worth stopping for. This round is four of them, each its own module.

ChatGPT is writing the logic behind three of them at the same time (`docs/chatgpt/fight-summary.md`, `docs/chatgpt/achievements.md`, `docs/chatgpt/bestiary-lore.md`). **Don't wait for it, and don't import it:** each of your screens takes plain data (the shapes are below, copied from those prompts), and your spec feeds it hand-made data of that shape. Claude connects the two.

The same rules apply:
- Read `AGENTS.md` first. The repository is public: everything you make is your own.
- Work on `muse/screens`, one pull request, against `claude/dread-delve-v0.2`. Start from the current branch.
- Never commit `dread-delve.html`.
- `npm test`, `npm run build` and the browser suite must pass (`preparePage(page)` in new specs).
- Touch only what's named here. Each module puts its own styles in a `<style id="…">` it adds once (see how `src/ui/pocketsheet.js` does it); match the regal glass look in `index.html` (its colour tokens are on `:root`: `--candle`, `--ink`, `--dim`, `--line`, `--blood`…). Work on a phone (the handheld, `body.hh`) and on a desktop.

## What's there (read; don't change)

- **Faces:** `faceOf(token)` in `src/game/night.js` returns a portrait (a data URL) for any token: its art, its forged face, or a portrait of its mini. It takes a moment: call it once per face, after your screen is up, and fill the faces in as they come. `src/ui/orderstrip.js` shows the pattern.
- **Sound:** `sfx(name)` from `src/audio/sound.js` (`chime`, `rise`, `crit`, `hit`, `roll`, `ping`, `turn`…) and `tune(id)` from `src/ui/hhlife.js` (the chiptune jingles; it stays quiet when the player has turned them off).
- **Input:** a screen opens over everything and is closed with Ⓑ / Escape / a tap on its close button, or Ⓐ / Space / a tap to go on. The Wanderer sends presses through `press(b)` in `src/ui/wander.js`; while one of your screens is open it gives every press to your module (the hook below), the same way it does for the pocket sheet (`pocketPress`).
- **The look of a fight's end today:** a card from `showCard` (`src/ui/hud.js`) saying "The fight is over" with the XP and loot. Your victory screen replaces it in the Wanderer.

## Do

### 1. 🏆 `src/ui/victory.js`: the victory screen

`openVictory(summary, { party, names, faces, xp, onClose })`, `victoryOpen()`, `victoryPress(b)`, `closeVictory()`.

`summary` is ChatGPT's (`docs/chatgpt/fight-summary.md`):
```js
{ rounds, won, per:{ [id]:{ dealt, taken, healed, healedOthers, hits, misses, crits, kills, biggest, … } },
  biggest:{ by, at, n, weapon, crit } | null, luckiest, unluckiest, closest, mvp:{ id, why } | null,
  awards:[{ id, key, title, line }], headline, verdict, xp, loot:{ gp, sp, items:[…] } | null }
```
`party`: the ids of the heroes and companions, in order (`summary.per` has the foes too); `names`: `{ [id]: name }`; `faces`: `{ [id]: dataUrl }` (some may be missing: show the initial, and accept `setVictoryFace(id, url)` to fill them in later); `xp`: `{ before, after, next, level }`.

What it does, in beats a player can skip (Ⓐ jumps to the end of the current beat, then goes on):
1. The headline slides in large, the verdict under it, `Round N` small.
2. **The MVP:** their portrait in a gold frame, their name, `mvp.why`.
3. **The party, one card each:** portrait, damage dealt, taken, healed, kills, crits, with the numbers counting up.
4. **The awards**, flipping in one at a time like cards: title, the hero's face, the line.
5. **XP:** a bar filling from `xp.before` to `xp.after` against `xp.next`; if it crosses `next`, the bar flashes and says **Level up** (the level-up screen is #4, opened by Claude after this one closes).
6. **Loot:** each thing found appears in a slot, coins as a count.
7. "Ⓐ Carry on".

A lost fight gets none of this: Claude keeps its own card for that.

### 2. 📕 `src/ui/bestiary.js`: the bestiary book

`openBestiary(book, { faces, onClose })`, `bestiaryOpen()`, `bestiaryPress(b)`, `closeBestiary()`, `setBestiaryFace(bid, url)`.

`book` is ChatGPT's (`docs/chatgpt/bestiary-lore.md`): `{ seen, fought, mastered, of, entries:[{ bid, tier:0|1|2|3, name, family, seen, fought:[…], lore, voice, tip, revealed:{ ac, hp, speed, resist, immune, vuln }, counts:{ seen, fought, killed }, next }] }`, sorted by family.

- A book: a grid of entries by family (a header for each), with `seen / of` at the top. Tier 0 is a dark silhouette with `???`; tier 1 a face and a name; tier 2 adds a small ⚔; tier 3 a gold edge.
- An entry opened: its face large, the name, the family, the counts, then what its tier shows: the `seen` line; the `fought` lines and the revealed numbers (resistances and the like as small tags); the `lore` paragraph with `— {voice}` under it; and the `tip`. What isn't unlocked yet is a locked line with `next` ("Kill 2 more to learn its story.").
- The D-pad moves through the grid, Ⓐ opens, Ⓑ goes back.

### 3. 🏅 `src/ui/trophies.js`: achievements, as they happen and on a shelf

`trophyBanner({ name, text, icon, tier })`: a banner that slides in at the top of the screen (under the turn order), with a chime, holds three seconds and slides away. Several at once queue. It never takes input or blocks a press.
`openTrophies(shelf, score, { onClose })`, `trophiesOpen()`, `trophiesPress(b)`, `closeTrophies()`: the shelf.

`shelf` and `score` are ChatGPT's (`docs/chatgpt/achievements.md`): `shelf` is `[{ id, name, text, icon, tier:'bronze'|'silver'|'gold', got, n, goal, pct, hidden, group }]`, `score` is `{ got, of, bronze, silver, gold }`.
- Grouped by `group`, earned ones bright with a tier rim (bronze, silver, gold), unearned ones dim with a progress bar (`n / goal`), hidden ones as `???` and their hint.

### 4. ⬆ `src/ui/levelup.js`: the level-up fanfare

`openLevelUp({ name, face, from, to, hp:{ before, after }, gains:[{ kind:'feature'|'spell'|'slot'|'stat'|'feat', name, text }] }, { onClose })`, `levelUpOpen()`, `levelUpPress(b)`, `closeLevelUp()`.
- The screen darkens, a burst of light, the hero's face, **Level 4**; the hit points climb from `before` to `after`; then each gain flips in with its kind's icon and a line of what it does. A chiptune flourish (`tune('levelUp')` if it exists, else `sfx('rise')`).
- Ⓐ through it, Ⓑ closes.

## The hooks (for Claude)

Don't change other files. In the PR, describe the lines Claude adds:
- In `src/game/wander.js` `finishFight`: the summary, then `openVictory` in place of the card (and the level-up after it).
- In `src/ui/wander.js` `press(b)`: while any of your screens is open, the press goes to it (`victoryPress`, `bestiaryPress`, `trophiesPress`, `levelUpPress`).
- Menu lines for the 📕 Bestiary and the 🏆 Achievements.
- `trophyBanner` wherever ChatGPT's tracker reports an unlock.

Add one line to `src/debug.js`: `export * as screens from './ui/screens-debug.js';` and a tiny `src/ui/screens-debug.js` that re-exports your four modules' open/close functions, so your spec can drive them.

## Files

- new `src/ui/victory.js`, `src/ui/bestiary.js`, `src/ui/trophies.js`, `src/ui/levelup.js`, `src/ui/screens-debug.js`
- one line in `src/debug.js`
- new `tests/e2e/screens.spec.js`. Start a Wanderer in the Village of Barovia (see `tests/e2e/wander.spec.js` for how), then through `window.DreadDelve.screens`, with hand-made data in the shapes above, prove:
  - the victory screen shows the headline, the MVP's name, an award's title and the loot, and Ⓐ / Space steps through to "Carry on" and closes it
  - the bestiary shows `???` for a tier-0 entry and the lore paragraph for a tier-3 one, and Ⓑ goes back from an entry to the grid
  - a trophy banner appears and is gone after a few seconds; two in a row both show, one after the other; the shelf shows a hidden one as `???`
  - the level-up screen shows the new level and every gain's name
  - each one closes with Escape
  - no errors in the console, at a desktop size and a phone size with the handheld on (`preparePage(page, { handheld:true })`)
