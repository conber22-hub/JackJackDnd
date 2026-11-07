# Prism for everyone at the table

The owner's full `All you need2026.prism` source is stored **byte-for-byte** in `public/assets/compendium/all-you-need2026.prism.gz` (13,308,025 bytes before compression; SHA-256 recorded in the loader). It includes all 15 root sections, including classes, class features, species, subclasses, spells, backgrounds, feats, invocations, equipment and monsters. No official or third-party claims of authorship are made. Original source references remain in the archive.

**Visibility warning:** This is a *public GitHub repository*, so merging this PR publishes every source entry. A private Vercel game/table session does **not** restrict GitHub access. The owner has explicitly authorized publication and stated that they hold permission. Claude should reconfirm source redistribution rights and repo visibility during review, before merging.

On a hosted build, `loadLibrary()` now offers the bundle as a fallback. The player's or DM's explicitly imported books take precedence, then the table-shared library, then the built-in bundled book. The existing conversion, kind-selection and player-side filtering still apply. The bundled content is not replicated into `dread-delve.html`; the standalone offline HTML retains its previous SRD fallback. Full offline support requires an additional opt-in asset copy or archive import.

The current converter consumes spells, species, subclasses for the 12 existing classes, backgrounds, pickable feats, monsters and magic items. The archive additionally preserves class definitions, invocations and selection groups; these are not all automatable yet. A **separate mechanical integration PR** should extend class selection, level slots, feat prerequisites and extra spell lists without treating prose as implemented actions.

When serving `.gz`, do not add an HTTP `Content-Encoding: gzip` header or the client will double-decompress. Serve as ordinary static binary.

Run: `node --test tests/bundled-prism.test.js`, then `npm test && npm run build`. On deployed Vercel, confirm the asset returns 200 and Chrome/iPhone Safari can decompress it. The DM controls which books/variants are permitted at the table, and hidden bestiary entries must never be included in `creatorPart`.
