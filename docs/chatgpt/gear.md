# ChatGPT prompt: ⚔ weapons and armour in our own words

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/gear` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're helping **Dread Delve** grow out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. You wrote its twelve **Callings** (`src/data/callings.js`), their Origins, every spell's name in each caster's voice (`src/data/rites.js`) and each Calling's voice in a fight (`src/data/calling-voices.js`). The last D&D words a player still sees on their hero are **the gear**: a far-future Vanguard carries a *Longsword* and wears *Chain Mail*, a Huscarl a *Battleaxe*. The rules stay exactly as they are (a longsword is still 1d8 slashing, versatile). You're giving each weapon and armour **the name and line that Calling would give it**.

**Read `docs/homebrew/callings.md` first**, then `src/data/srd-items.js` (`SRD_WEAPONS`: 38 weapons, each with `n`, `d`, `ty`, `properties`, `cat`; `ARMOR_ITEMS`: 13, from Padded Armor to Shield) and `src/data/callings.js` (each Calling's era: far-future, ancient, medieval, Barovian, or drawn in from anywhere).

Write exactly three files and nothing else:

1. `src/data/gear-words.js`: the names and lines (data)
2. `src/engine/gear-words.js`: reading them
3. `tests/gear-words.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the data imports nothing; the engine imports `../data/gear-words.js`, `../data/srd-items.js` and `../data/callings.js`. The test imports the engine, the data and those two.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original.** Nothing that belongs to the Halo games (none of its factions, species, characters, ships, vehicles, **named weapons or armour**, places or catchphrases). History is everyone's, and real historical gear by its real name is welcome (*kopis*, *seax*, *aspis*, *linothorax*, *hauberk*, *brigandine*). Gothic first. Respectful: this is a memorial.

## What to write

### `src/data/gear-words.js`

`GEAR_WORDS`: for **each of the twelve Calling ids**, for **every weapon in `SRD_WEAPONS` and every armour in `ARMOR_ITEMS`**, keyed by the item's exact `n`:

```js
vanguard:{ 'Longsword':{ n:'Breaching Blade', line:'Issued, not forged. The serial number is filed half off.' }, 'Chain Mail':{ n:'…', line:'…' }, … }
```

- **Names under 32 characters**, never the D&D name or a word-for-word swap of it (*Longsword* is not *Long Blade*), and **no two items sharing a name within a Calling**.
- **Lines under 90 characters**: what it looks and feels like in their hands, in their age. Flavour only, never different rules: a Vanguard's "rifle-butt" is still a club.
- **By age:** the far-future Drawn (Vanguard, Relicborn, Archivist) give old gear the names of their own kit, salvaged and failing, or call it what a museum would; the ancient (the Pankratiast, a Hoplite-minded Vanguard) the Greek and Roman words; the medieval (Huscarl, Warden, Chaplain) the hall's and the chapter's; the Barovian-born (Seepbound, Mistwalker) the valley's plain words, or the Chorus's for the Seepbound; the Outrider, the Marksman and the Herald from wherever they were drawn.

### `src/engine/gear-words.js`

Export:
- `gearName(itemName, callingId)` → our name for that weapon or armour as that Calling knows it, or the item's own name if there's none (a Classic hero, a magic item, a DM's own)
- `gearLine(itemName, callingId)` → its line, or `''`
- `gearFor(callingId)` → `[{ item, n, line, kind:'weapon'|'armor' }]`, weapons then armour, each by the SRD's order
- `validateGearWords()` → `[]` when all's well

### `tests/gear-words.test.js`

Prove:
- every Calling has every weapon and every armour; nothing else
- names under 32 characters, lines under 90, no name equals or contains its item's D&D name (case-insensitive), no two items share a name within a Calling
- none of these words appears anywhere (case-insensitive, whole words): Master Chief, Covenant, Cortana, Spartan, Sangheili, Unggoy, Jiralhanae, Gravemind, Forerunner, UNSC, ODST, Warthog, Pelican, Needler, Halo, Flood, Arbiter, Guilty Spark, Mjolnir, MA5, Magnum, Battle Rifle, Energy Sword
- `gearName` falls back to the item's own name for an unknown item or Calling; nothing throws on `null`, `{}` or `undefined`; `validateGearWords()` is `[]`

## What Claude will do with it

The hero creator, the sheet, the pocket sheet, the attack lists, the cards and the captions will show a Calling's hero their gear by these names (the line on hover and in the pocket sheet), the rules and the figure's weapon models untouched; the Classic switch gives the SRD names back.
