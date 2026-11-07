# Barovia VII: The Character Codex

Original supplementary character material for JackJackDnd / Dread Delve. **This PR is additive and does not silently alter the existing 2024 SRD classes or game saves.** No text from the DM's private `.prism` compendium is copied or published.

## Inventory

- **4 original classes** with 20 levels of narrative/mechanical features: Lantern Marshal (d10 guardian, half caster), Veilwalker (d8 scout, no innate casting), Ashbinder (d6 occult scholar, full caster), and Thornbound (d10 nature guardian, half caster). Each has two original subclasses.
- **20 original subclasses:** one for each of the 12 standard SRD classes, plus two per new class. They come with unique level-based features, designed for manual DM rulings until combat automation has been reviewed.
- **8 original species:** Ashkin, Mireborn, Duskling, Bellforged, Gravekin, Thornmarked, Palecrest, Crowblood.
- **12 original backgrounds** with a unique origin feat and campaign hook each.
- **48 feats:** 12 Origin, 24 General, 8 Fighting Style, 4 Epic Boon.
- **60 spells:** six at every spell level 0 through 9, each with a description, class access, level, school, and duration. They're **all deliberately marked `mode:'manual'`**. The live cast engine should not treat these as combat-damage or healing automation without a mechanical review.
- **12 complete concept starters** and a responsive, standalone character-forge prototype at `docs/barovia/character-forge-vii.html`.

## Browser showroom

`docs/barovia/character-forge-vii.html` is a self-contained HTML document with **no CDN, network request, login, or remote dependencies**. It allows class, subclass, species, background, level, ability, spell and feat choices, shows the progression, runs validation, and exports a draft JSON. A private `.prism` file can be audited on the local device: counts and additional class names only, no remote transfer. This is an **authoring proof of concept**, not a production character sheet or a multiplayer endpoint.

## Engine library

Import `src/data/barovia-character-codex-vii.js` for pure records. `src/engine/barovia-character-builder.js` provides:

`newCharacterDraft(starter)`, `classNames()`, `subclassNames(cls)`, `spellLimits(draft)`, `maxSpellLevel(draft)`, `selectableSpells(draft)`, `eligibleFeats(draft)`, `featureProgression(draft)`, `validateDraft(draft)`, `draftPreview(draft)`, `exportDraft(draft)`, and `validateCodex()`.

### Claude's integration checklist

1. Do not append all new objects directly to `CLASSES`, `SPELLS`, `SPECIES`, and `FEATS` without reviewing mechanical schemas and saved-game compatibility. `src/data/srd.js` has 12 built-in classes and `tests/classes.test.js` asserts exactly 12 before any optional content is enabled.
2. For the 12 new standard-class subclasses, adapt each level array to the existing `SUBCLASSES[class][name] = {features, texts, text, ...}` shape, then check the creator's subclass selection and `heroStats` display. **Do not overwrite an imported DM subclass with the same name**.
3. For the four new classes, implement class feature resources, saving throws, armor, 1–20 level progression, casting limits and each class's supported spell set. The draft engine currently exposes **estimated HP and simplified spell access**, not game-complete casting slots. Do not claim live battle support before it is implemented.
4. Replace the creator's current single invocation/style choices with scalable feature/feat slots only after compatibility checks. Epic Boons are level-gated; origin feats attach to background.
5. The current `src/game/library.js` clears `SUBCLASSES` while applying the DM's compendium. Integrate homebrew subclasses using a stable registry and source-specific merge/delete logic so an imported `.prism` library and the original codex can coexist.
6. Existing game saves, network ownership, FOW, import/export, and character sheet fields must continue to behave unchanged when the optional pack is disabled. Only forward player-approved character choices; never forward the DM's private source descriptions en masse.
7. **Playtest** action economy, HP, spell availability, ancestry powers, feats, and subclass features. The current rules are creative proposals, not approved balances or automatic combat effects.

## Verification

Run `node --test tests/barovia-character-codex-vii.test.js`. Locally checked against Node 22 and in headless Chromium at desktop and mobile viewport. The HTML prototype's class change, level 12 spell choices, feat slots, JSON download and narrow viewport passed. It was **not** built into the live VTT; full `npm test`, `npm run build`, server/client integration and iPhone performance checks remain for Claude.

The source builders are `tools/barovia/character-vii/build_codex.py` and `build_showroom.py`, with no private book dependencies. No `.prism` file, protected book content, generated `dread-delve.html`, or real-person data may be committed.
