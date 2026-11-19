# ChatGPT prompt: 🪓 how heavy a weapon feels

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/weapon-heft` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. Every blow in a fight is now *felt* on the map (`src/engine/punch.js`, drawn by `src/render/punch.js`): the world holds still for an instant at the impact (the hit-stop), the one struck is knocked back, the camera shakes and narrows for a moment, and a melee swing leaves a bright arc through the air (`src/render/trails.js`). But all of it is worked out from **how much of the target's hit points the blow took**, never from **what struck them**: a dagger's scratch and a greataxe's cleave of the same damage feel identical, and every sword, axe and maul leaves the same pale arc. You're writing the table that gives each weapon (and each kind of natural attack) its own weight, and the engine that reads it.

Read `src/engine/punch.js` first (`impactOf`: the numbers a blow is felt by) and `src/data/srd-items.js` (`SRD_WEAPONS`: each weapon has `n` its name, `d` its damage dice, `ty` its damage type, `p` its property letters, among them `2` two-handed, `H` heavy, `L` light, `F` finesse, `T` thrown, `R` reach, `A` ammunition, and `cat` its category, `s` simple or `m` martial; `rng` 0 for melee or `[normal, long]`).

Write exactly three files and nothing else:

1. `src/engine/weapon-heft.js`: choosing a weapon's heft
2. `src/data/weapon-heft.js`: the hefts (data)
3. `tests/weapon-heft.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no Three.js, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the engine imports `../data/weapon-heft.js` only. The test imports the engine, the data and `../src/data/srd-items.js` (for `SRD_WEAPONS`).
- **Tests** use `node:test` and `node:assert/strict`.
- All original. Colours are `#rrggbb` strings.

## What a heft is

Multipliers and choices layered on top of `impactOf`'s numbers (1 means "as it is now"):
```js
{
  stop:0.6..1.8,    // the hit-stop: a dagger barely pauses the world, a maul stops it dead
  knock:0.5..2,     // how far the one struck is thrown back
  shake:0.5..2,     // how hard the camera shakes
  kick:0.6..1.6,    // how much the view narrows (the punch-in)
  lunge:0.6..1.5,   // how far the attacker drives in
  swing:'slash'|'chop'|'smash'|'thrust'|'flick'|'claw'|'bite'|'none',   // how its arc looks (none: a shot or a throw)
  arc:{ col:'#rrggbb', width:0.4..2.2, life:0.6..1.6 },   // the swing's ribbon: its colour, how wide, how long it lingers
  ring:'steel'|'wood'|'bone'|'thud'|'wet'|null,           // what the impact rings with (a hint for the sounds)
  words:'under 50 characters, what the blow feels like'   // e.g. 'A short bite of steel.' / 'The whole yard shudders.'
}
```

## What to write

### `src/data/weapon-heft.js`

`HEFT`: a heft for **every weapon in `SRD_WEAPONS`** by its exact `n` name. Make the families distinct and honest: the light and quick (Dagger, Shortsword, Sickle, Scimitar) small stops, small knocks, thin quick arcs; the versatile middle (Longsword, Battleaxe, Warhammer, Morningstar, Mace, Spear) in between; the heavy two-handers (Greataxe, Greatsword, Maul, Halberd, Glaive, Pike, Greatclub) long stops, big knocks, wide slow arcs; whips and flails their own flick; bows, crossbows, slings, darts and blowguns `swing:'none'`, small knocks, no arc (`arc.width` at its minimum). Colours: steel a pale blue-white, a wooden club warm brown-gold, a silvered or holy look is not a weapon property: leave it out.

`NATURAL`: a heft for the kinds of natural attack a creature in the bestiary has, by a keyword in the attack's name: at least `bite`, `claw`, `slam`, `tail`, `gore`, `horn`, `tentacle`, `talon`, `fist`, `sting`, `touch`, `tusk`, `wing`, `hoof`, `beak`, `spit`. A wolf's bite is not a giant's slam.

`BY_TYPE`: a fallback heft for each damage type `bludgeoning`, `piercing`, `slashing` (a weapon or attack not named anywhere).

### `src/engine/weapon-heft.js`

Export:
- `heftFor(attack, { size } = {})` → a complete heft. `attack` is what the app has: `{ n, t, d, rng }` (its name, damage type, damage dice, range; any may be missing). The order: the exact weapon name in `HEFT` (case-insensitive), else a `NATURAL` keyword found in the name (as a whole word: "Bite", "Claws", "Tail Swipe"), else `BY_TYPE[t]`, else a neutral heft (all 1s, `swing:'slash'`, a pale arc). `size` is the attacker's size in squares (1 medium, 2 large, 3 huge, 4 gargantuan): a bigger creature's natural attack is heavier, scaling `stop`, `knock` and `shake` up (and `arc.width`), by at most ×1.6 at size 4, never past the ranges above. A ranged attack (`rng` a non-zero range, or the name a bow, crossbow, sling, dart or blowgun) always has `swing:'none'`.
- `applyHeft(impact, heft)` → `impactOf`'s result (`{ stop, slowMs, slowScale, knock, back, shake, kick, flash, screen, last }`) with the heft applied: `stop`, `knock`, `shake`, `kick` multiplied and clamped to sane bounds (stop ≤ 260 ms, knock ≤ 0.7 tiles, shake ≤ 1, kick ≤ 14), everything else untouched. A miss (`stop` 0) stays a miss.
- `hefted()` → every name in `HEFT` (for the tests and a debug page).

### `tests/weapon-heft.test.js`

Prove:
- every name in `HEFT` is a real weapon in `SRD_WEAPONS` (spelled exactly), and every weapon has one
- every heft (in `HEFT`, `NATURAL`, `BY_TYPE`) has every field, numbers in their ranges, a valid colour, a known `swing` and `ring`, and `words` under 50 characters
- the families are ordered: every heavy two-hander's `stop` and `knock` are above every light weapon's
- every ranged weapon has `swing:'none'`
- `heftFor` finds a weapon by name in any case, a natural attack by keyword (`'Bite'`, `'Claws'`, `'Tail Swipe'`), falls back by damage type, then to neutral, never throws on `{}`, `null` or an unknown name, and returns a fresh object each time (changing it doesn't change the table)
- `size` makes a natural attack heavier and stays in range
- `applyHeft` multiplies and clamps, leaves a miss a miss, and doesn't change its input

## What Claude will do with it

`src/render/punch.js` will run each blow's `impactOf` through `applyHeft(heftFor(attack))`, so a maul stops the world longer and throws them further than a dagger; the attacker's lunge will scale by `lunge`; `src/render/trails.js` will draw the swing's arc in the heft's colour, width and life (a thrust a narrow streak, a chop a heavy wedge, a claw three thin rakes); and `words` will join the fight captions on a critical hit. Make a player feel the difference between a rapier and a greatclub with their eyes shut.
