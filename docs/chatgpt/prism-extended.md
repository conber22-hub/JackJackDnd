# Prism Character Creator II: 5 additional classes and complete option indexing

**Stacked after PR #82** (`chatgpt/prism-bundled-creator`). This PR depends on that branch's bundled source asset and automatic import. Do not merge it first or without its base.

Adds five class chassis from the provided `.prism` export: **Artificer, Blood Hunter, Mystic, Ranger, Revised, Savant**. Existing 2024 SRD classes are untouched. All 17 classes are now potential creator choices, and the VTT can render their features, subclass information and levels 1–20 without pretending that every special ability is automated.

The importer additionally retains **22 invocations, 136 option groups, and 3,100 non-feat feature descriptions** along with the already supported source spells, species, subclasses, backgrounds and 185 pickable feats/styles. Artificer spells use the `A` class filter. Invalid or missing source metadata should not crash the creator. Explicitly imported personal libraries always supersede the hosted default.

**Important limits**

- Newly added class features, psionic talents, Blood Hunter rites, and advanced invocations are **reference/manual**, not new combat automation. No unsafe automatic rule assumptions.
- The `Artificer` and `Ranger, Revised` chassis use the current 2024 engine's half-caster slot table. For a 2014 spell-table mismatch, use source-text adjudication until a dedicated progression renderer is merged.
- Extra item/equipment entries remain in the owner-provided original source archive, but the existing gear API controls mechanical items. The PR does not silently add unvalidated item effects or equipment categories.
- Some UA and homebrew class/subclass combinations may need playtesting and may conflict with the 2024 SRD rules; retain their source labels.
- Avoid leaking DM-only monster information to players. Player library projection still excludes monsters/items; class/feat/spell texts are sent in the allowed catalog.

**Testing:** `node --test tests/prism-extra.test.js` passes 5 focused tests on the real archived source. When stacked onto PR #82, `node --test tests/{prism-extra,bundled-prism}.test.js` passes 8 tests. Run `npm test`, `npm run build`, and Playwright/iPhone creator QA after Claude merges. Browser boot, source download latency and offline fallbacks need end-to-end validation.

**Other source sections** (languages, weapons, armor, general items and monster records) are retained in the complete compressed original. Enabling new equipment effects is separately reviewable work, not a pretense that textual rules imply working physics or spell behavior.
