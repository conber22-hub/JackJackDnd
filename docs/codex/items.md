# Equipment and magic items (task 4)

`src/data/srd-items.js` contains 38 weapons, 13 armour/shield entries, 25 tool
families, 82 adventuring gear/pack entries and 258 magic-item entries from SRD
5.2.1. `SRD_WEAPONS`, `ARMOR_ITEMS`, `TOOLS`, `GEAR` and `MAGIC_ITEMS` are separate
exports: a mundane gear reference to a magic item is not a second magic item.
Variant families retain their complete tables/descriptions; the count is of SRD
headings, not every possible magic-item variant.

`srd.js` now exposes the complete weapon list and armour choices while preserving
old saved-sheet names (e.g. Leather and Half Plate) and the separate shield toggle.
The four added weapons are Lance, Blowgun, Musket and Pistol; Padded armour is also
added. Existing weapon damage, mastery, category, range and property sets are
unchanged. Full property text also records ammunition and Loading rules.

Prices are in GP and weights in pounds; `costText` and `weightText` preserve the
printed units and qualifications (such as a full Waterskin). `null` means Varies,
not free. A printed dash for negligible weight becomes zero. Tool and focus
variants retain their individual prices and weights, and pack contents remain
in the description. Shields have their own entry in `ARMOR_ITEMS` but are excluded
from the creator's body-armour list to avoid counting them twice.

Magic entries have `n`, `type`, `rarity`, `attune`, `text` and `src`. An empty
`attune` string means no attunement requirement. Full rarity/attunement conditions
are retained. +1/+2/+3 weapons, ammunition, armour and shields have explicit
bonus variants. Ring/Cloak of Protection record AC/save bonuses; Bracers of Archery
record their bow-specific damage bonus. These are data for a future inventory,
not automatic equipment effects. Activation-dependent damage, charges, curses,
tables and complex effects stay in the full text. Embedded creature stat blocks
remain within their parent item and are not mistaken for new magic items.

Source of truth: [official SRD 5.2.1 PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf).
Descriptions/tables come from `equipment.md` and `magic-items.md` in
`downfallx/dnd-5e-srd-markdown`, pinned at
`1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4`. Attribution and source SHA-256 hashes are
in the generated file. Regenerate with:

```sh
python scripts/import-srd-items.py /workspace/srd-reference
pdftotext -raw /workspace/SRD_CC_v5.2.1.pdf /tmp/srd-raw.txt
python scripts/extract-srd-item-index.py /tmp/srd-raw.txt
npm test
npm run build
```

The independent official-PDF index verifies all 258 magic-item names and pages.
Tests also cover counts, duplicate names within each catalogue, numeric fields,
JSON round trips, all weapons through the hero engine, fractional weights,
variant prices, pack contents and preserved embedded stat blocks.

No UI or inventory system is added. Claude can expose gear/tools/magic items in
the reader and later apply inventory bonuses/attunement. Mounts, vehicles,
hireling prices and service tables are outside the task's requested equipment
categories; these are not claimed as imported. No spell data or table-play fields
are changed, and the generated app is not committed.
