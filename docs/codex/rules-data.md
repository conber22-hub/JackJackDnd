# Codex brief: the rules data (SRD 5.2.1) and a private content library

Read `AGENTS.md` first; its rules still apply. Work on `codex/*` branches, one pull request per numbered task below, and never commit `dread-delve.html`.

## Why this is split in two

This repository is **public on GitHub** and the app is **public on Vercel**. Anything committed here is published to the world, so:

1. **The repo holds only openly licensed rules:** the *System Reference Document 5.2.1* (Wizards of the Coast, **CC BY 4.0**). SRD text may be copied word for word as long as the attribution stays. That attribution is already at the top of `src/data/srd.js`; keep it on every new data file.
2. **Material from the owner's own books stays private:** that's anything from the Player's Handbook, Monster Manual, Xanathar's, Tasha's, Curse of Strahd and so on that is not in the SRD. It goes in a *library file* the DM imports into their own browser (task 7). Library files never go in the repo. `.gitignore` already ignores `library/` and `*.library.json`. Don't add book text, stat blocks or tables that aren't in the SRD to `src/data/`, even as samples or fixtures.

Source of truth for the SRD: the official SRD 5.2.1 PDF from Wizards of the Coast (dndbeyond.com/srd). The community conversion `downfallx/dnd-5e-srd-markdown` on GitHub (also CC BY 4.0) is handy to parse, but check anything odd against the PDF.

## What exists today

- `src/data/srd.js`:
  - 12 classes to **level 10**, each with its one SRD subclass
  - 9 species and 4 backgrounds
  - weapons and armour
  - 11 feats (`FEATS`)
  - **every SRD 5.2.1 spell, levels 0–9** (task 1, done: `srd-spells.js`, re-exported as `SPELLS` with the table-play layer from `spell-play.js` on top; see `docs/codex/spell-library.md`)
- `src/engine/hero.js` turns a sheet into stats, attacks, spell lists and resources. It is pure, and covered by `tests/hero.test.js`.
- `src/data/bestiary.js` plus `bestiary-barovia.js`: about 72 creatures in a condensed format (the comment at the top of `bestiary.js` explains every field).
- The character creator (`src/ui/creator.js`) and the combat code read all of this. Claude owns `src/ui`, `src/game`, `src/net` and `src/render`. If a task needs a UI change, describe it in the PR instead of making it.

## Tasks (one PR each, in this order)

Lesson from task 1: faithful data is right, but don't take automation away. If a field the app rolls with (`k`, `d`, `sv`, `cond`, `area`…) was set before and you can't model the spell exactly, say so in the PR. Don't silently turn it into `util`: Claude keeps a table-play layer for those (`spell-play.js`), and the tests should show what changed.

### 1. All SRD spells, levels 0–9 — DONE (PR #3)
- Put every SRD 5.2.1 spell in a new `src/data/srd-spells.js`. Keep the existing format and re-export `SPELLS` from `srd.js` so nothing else changes.
- Add these fields:
  - `school`, `time` (action / bonus / reaction / 1 minute…), `range` text, `comp` (V/S/M plus the material in brackets), `dur`, `conc:true`, `ritual:true`
  - `text`: the SRD description
  - `hl`: the "Using a Higher-Level Spell Slot" line
- Keep the mechanical fields (`k`, `d`, `ty`, `sv`, `half`, `area`, `cond`, `cs`, `r`) accurate: combat and the area templates (`src/engine/targeting.js`) use them. If a spell doesn't fit them, give it `k:'util'` and let the text carry it.
- Tests:
  - every spell has a name, level and class letters, and no duplicates
  - every `area` shape is one `targeting.js` knows
  - the spell count matches the SRD

### 2. Classes to level 20
- Raise `MAX_LEVEL` to 20.
- Extend all of these to 20:
  - every class's `features`, `cantrips` and `prep` arrays
  - `SLOTS_FULL`, `SLOTS_HALF` and `PACT`
  - `profBonus` (+5 at 13, +6 at 17)
- Include each SRD subclass's features to 20, plus the Epic Boon at 19.
- Add a `FEATURES` map (feature name → SRD text) so the sheet can show what each one does.
- Update `src/engine/hero.js` wherever it assumes 10 levels, and extend `tests/hero.test.js` with level 20 sheets for a full caster, a half caster, a Warlock and a martial class.

### 3. All SRD feats
- Add every SRD 5.2.1 feat to `FEATS`, keeping the flags the engine understands (`origin`, `plus`, `style`, `lists`, `skills`).
- Origin, General, Fighting Style and Epic Boon feats each need `cat`, `req` (prerequisite) and `text`.
- The engine applies effects only for the flags it knows. Text-only feats are fine; list the ones that could get real effects in the PR description.

### 4. Equipment and magic items
- Create `src/data/srd-items.js` with:
  - all SRD weapons (with mastery properties) and armour
  - adventuring gear, tools and packs (cost, weight)
  - SRD magic items: `n`, `type`, `rarity`, `attune`, `text`, plus mechanical fields where simple (`ac:+1`, `atk:+1`, `dmg:'1d6 fire'`)
- Tests for shape and duplicates.

### 5. SRD monsters
- Put every SRD 5.2.1 creature in `src/data/srd-monsters.js`, in the bestiary format (`id`, `name`, `cr`, `ac`, `hp` dice, `speed`/`spd`, `size` in squares, `init`, `attacks` with to-hit and damage, `traits`, `saves`, `senses`, `look`).
- Set `fam:'srd'` and a `shape` that `src/engine/look.js` presets can map (humanoid, beast, undead…).
- Export a list and add it to `rebuildBestiary()` behind the existing ones: Barovia's versions win on id clashes.
- Split the work by CR band if it's too big for one PR.
- Tests:
  - every attack parses
  - CR, AC and HP are sane
  - no id clashes with `bestiary.js` and `bestiary-barovia.js`

### 6. Species and backgrounds check
Compare `SPECIES` and `BACKGROUNDS` with SRD 5.2.1:
- traits by level, including Dragonborn's breath scaling
- equipment choices, languages and tool proficiencies

Fix any gaps.

### 7. The private library: schema, validator and merge (no UI)
This is what lets the owner use their own books at their own table without publishing them.
- `docs/library-format.md` documents a JSON format whose sections mirror the data files above:
  - `{ name, version, spells:[], feats:{}, classes:{}, subclasses:{}, species:{}, backgrounds:{}, items:[], monsters:[] }`
  - every entry uses the same fields as the SRD data
- `src/engine/library.js` must stay pure. It exports:
  - `validateLibrary(json)` → `{ ok, errors:[…], counts }`, with readable errors like "spells[12]: no level"
  - `mergeLibrary(base, lib)`: library entries add to the SRD or override it by name or id, and a merged entry carries `src:'<library name>'`
  - `stripText(lib)`: the same library with long text fields removed, for sending over the network when only the numbers are needed
- Add a small example library `tests/fixtures/homebrew.library.json`. Fill it with **made-up homebrew only**: a "Lantern Warden" subclass, two invented spells, one invented monster.
- Tests for the validator (good and bad files) and for merge precedence.
- Claude will then build:
  - the import UI (Library tab: load a file; it's stored in this browser's IndexedDB)
  - sending the needed parts to players at the table
  - the creator and bestiary reading the merged data

## Done means
`npm test` and `npm run build` pass. Each PR description lists:
- what was added
- the counts against the SRD
- anything left out and why
