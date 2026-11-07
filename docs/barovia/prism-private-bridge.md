# A private route for `.prism` classes

The user's compendium is **not** in this repository, in any PR, or in the browser showroom's source. It remains a DM-owned private file. The VTT already imports *much* of `.prism` through `src/engine/library.js` and `src/game/library.js`, including spells, species, backgrounds, feats, known subclasses and bestiary. However, the importer deliberately ignores new base classes such as Artificer and Blood Hunter, so those cannot yet be safely chosen in the live hero creator.

## Two pure, privacy-safe helpers

`src/engine/barovia-prism-bridge.js` exports:

- `inspectPrism(raw)` to describe counts, pickable feat types, edition aliases, and extra class names without returning third-party descriptions or feat texts.
- `proposePrismClass(rawClass)` to generate **manual-only** class metadata: hit die, save proficiencies, skill options, armor proficiency, level-based feature names, subclass choices, and spell table row proposals. This is *not* registered automatically. It includes `readyForCombat:false`, `automation:'manual'`, and a warning.
- `classIsSRD(name)` to normalize exact 2024 names without treating all legacy classes as equivalent.

Run the audit locally:

```sh
node tools/barovia/character-vii/audit_private_prism.mjs "/path/to/All you need2026.prism"
```

The output contains only counts and class names. Nothing is saved or transmitted by the script. `tests/barovia-prism-bridge.test.js` uses entirely synthetic specimens.

## Claude integration guide

1. Store approved additional classes privately with the DM's imported compendium; distinguish 2024 and older edition mechanics.
2. Verify first-level proficiencies, resource counters, spell slots and upcasting, feature triggers, subclass unlock levels, class-specific spell lists, and multi-class rules. Missing details must remain manual and visibly flagged.
3. Do not mutate the core 12-class SRD set on page load; install additional classes only when a DM has enabled their library. Preserve old sheets if a custom class disappears from the device.
4. Do not publish the `.prism` file or embed any non-SRD class descriptions in the public site/repo. The user's personal access to a book does not grant public redistribution rights.

## Local source audit (not committed)

The owner's uploaded export showed **17 class records**, including 12 2024 core-class aliases and five additional class entries (Artificer, Blood Hunter, Mystic, Ranger, Revised, Savant); **118 species records**, **181 subclass records**, **918 spell records**, **3,285 feature/feat records**, and **185 actually selectable feat/style entries**. Those are raw counts, not an assertion that every record is usable with the VTT's 2024 mechanics. Published supplements and homebrew vary in licensing and balance.
