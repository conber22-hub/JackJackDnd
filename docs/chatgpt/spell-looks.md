# ChatGPT prompt: ✨ what each spell looks like

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/spell-looks` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing one self-contained JavaScript module for **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. Every spell cast in a fight is now drawn on the map (`src/render/spellfx.js`): a Fireball flies and goes off, Burning Hands pours out of the caster, Lightning Bolt cracks down its line, Sacred Flame comes down as a pillar. But the drawing only knows a spell by its **damage type and its shape**, so every fire spell looks alike and every spell with no damage (Bless, Hold Person, Web, Fog Cloud, Sleep, Shield, Misty Step) gets the same plain rings. You're writing the table that gives each spell its own look, and the engine that reads it.

Read `src/engine/spellfx.js` first: it is the current, generic answer (`spellLook`, `spellPath`). Your module adds a per-spell layer over it; it doesn't replace it.

Write exactly three files and nothing else:

1. `src/engine/spell-looks.js`: choosing a spell's look
2. `src/data/spell-looks.js`: the looks (data)
3. `tests/spell-looks.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no Three.js, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the engine imports `../data/spell-looks.js` and `./spellfx.js` (for `spellLook` and `spellPath`, as the fallback). The test imports the engine and the data, and may import `../src/data/srd.js` for the list of spells (`SPELLS`: each has `n` its name, `l` its level, `school`, and for many `ty` its damage type).
- **Tests** use `node:test` and `node:assert/strict`.
- All original. Colours are `#rrggbb` strings.

## What a look is

The drawing already knows how to do these things; a look chooses among them and colours them:
```js
{
  path:'burst'|'cone'|'line'|'aura'|'pillar'|'darts'|'touch',   // how it travels (spellfx.js spellPath: leave it out to keep the shape's own)
  col:'#rrggbb', col2:'#rrggbb',      // the bright core, and the edge, smoke or afterglow
  motes:'rise'|'fall'|'burst'|'swirl', // how its particles move
  light:0..4,                          // the flash it throws (0: it darkens rather than lights)
  shock:0..1,                          // a shockwave ring and dome (thunder and force hit hardest)
  mark:null|'chains'|'halo'|'web'|'cloud'|'shield'|'stars'|'runes'|'roots'|'flames'|'frost'|'eyes'|'hands'|'bubble',
                                       // what stays on the target while the spell lasts (Hold Person's chains, Bless's halo,
                                       // Entangle's roots, Web's strands, Fog Cloud's cloud, Shield's shell…)
  linger:0..60,                        // seconds the area stays visible on the ground (a cloud, a web, a wall); 0 for a flash
  sound:'fire'|'cold'|…|null,          // which of the fight sounds' spell colours fits (src/data/fight-sfx.js PICK.elements and schools)
  words:'a short line, under 60 characters, of what a player sees' // e.g. 'Grey threads lash round them and hold.'
}
```

## What to write

### `src/data/spell-looks.js`

`LOOKS`: a look for **at least 120 SRD spells** by their exact `n` name in `SPELLS`, including every cantrip and every spell of levels 1 to 3, and the famous higher ones (Cone of Cold, Wall of Fire, Banishment, Polymorph, Dimension Door, Greater Invisibility, Hold Monster, Cloudkill, Disintegrate, Chain Lightning, Finger of Death, Sunbeam, Meteor Swarm…). Make the families distinct: no two fire spells the same (Fire Bolt a spitting mote; Burning Hands a fan of orange; Fireball a swelling orange ball with black smoke; Wall of Fire a lingering curtain), and the non-damage spells recognisable at a glance (Sleep a drift of pale motes falling, Hold Person grey chains, Bless a gold halo, Bane a sickly purple, Shield a pale hexagon shell, Misty Step silver mist where they were and where they land, Faerie Fire violet outlines, Darkness an inky sphere that drinks the light).

`SCHOOL`: a look for each of the eight schools, used for a spell not in `LOOKS` and with no damage type.

### `src/engine/spell-looks.js`

Export:
- `lookFor(spell)` → a complete look. `spell` is what the app has: `{ n, ty, k, cond, school, shape }` (any may be missing). The order: the spell's own entry in `LOOKS`, else its damage type through `spellLook` from `./spellfx.js`, else its school from `SCHOOL`, else `spellLook({})`. Fill anything the entry leaves out from the fallback, so the result always has every field. Leave `path` out of the result when neither the entry nor the shape says it (the app keeps its own).
- `hasLook(name)` → whether `LOOKS` has that spell.
- `looked()` → every spell name in `LOOKS` (for the tests and a debug page).

### `tests/spell-looks.test.js`

Prove:
- every name in `LOOKS` is a real spell in `SPELLS` (spelled exactly)
- every cantrip and every level 1–3 spell in `SPELLS` has an entry
- every entry has valid colours, a known `motes`, `mark` and `path` (or none), `light` and `shock` in range, `linger` in range, and `words` under 60 characters
- no two fire spells (or two cold, or two necrotic) share both colours and motes
- `lookFor` always returns every field, prefers the spell's own entry, falls back to the damage type then the school, and never throws on `{}` or an unknown name

## What Claude will do with it

`src/render/spellfx.js` will call `lookFor` in place of its generic `spellLook`, draw the `mark` on the target for as long as the spell holds (next to `src/render/condfx.js`, which already draws conditions on the figures), keep `linger` areas on the ground until they go, and show `words` as the spell's caption. Make it so a player could name the spell from across the table without reading the card.
