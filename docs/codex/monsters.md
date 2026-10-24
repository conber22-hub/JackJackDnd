# SRD creatures

Task 5 adds all **330** stat blocks in the SRD 5.2.1 monster chapters: 235 in Monsters A–Z and 95 animals. `SRD_MONSTERS` uses `srd-` IDs and `fam:'srd'`. The live bestiary loads these first, then the existing creatures and Barovia; custom saved creatures still override built-ins. Existing IDs, attacks and automation are unchanged. The SRD family is also eligible for existing encounter selection that uses the entire bestiary.

There are **423 explicit attack-roll actions** with to-hit bonuses, immediate damage, reach/range and typed damage components. Shrieker Fungus and Seahorse have no attack rolls; their actions remain in the traits. Roper's grappling Tentacle correctly deals zero damage. Conditional Goblin Advantage damage and Bloodied swarm alternatives are in the text, not added to every hit. Mixed damage uses the existing combined dice/type format, with separate `parts` retained for a future combat reader.

All creatures retain the complete SRD stat block, six ability scores and saves, senses, passive Perception, movement modes, size text, actions and traits. Tiny/Small occupy one grid square. Existing supported mini shapes provide schematic stand-ins (including the wolf silhouette for many beasts/dragons); these are not creature-specific artwork.

## Source and checks

Data is CC BY 4.0 with Wizards of the Coast attribution in the generated file. Import source: `downfallx/dnd-5e-srd-markdown` commit `1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4`. The official SRD 5.2.1 PDF is the authority.

The independent PDF fixture checks every creature's name, AC, initiative, HP dice/average, CR, six abilities and six saves. The community conversion has malformed ability-table cells for Ancient Red Dragon, Remorhaz and Will-o'-Wisp; the importer corrects those from the PDF, including the retained text. Young White Dragon's printed Intelligence save is +2 despite its −2 modifier; the data preserves that printed value.

Regenerate from a local checkout and the official PDF (neither source is committed):

```sh
python scripts/import-srd-monsters.py /path/to/dnd-5e-srd-markdown
pdftotext -raw /path/to/SRD_CC_v5.2.1.pdf /tmp/srd-raw.txt
python scripts/extract-srd-monster-index.py /tmp/srd-raw.txt
npm test
npm run build
```

Tests cover all 423 attack expressions and attack-editor round trips, sane CR/AC/HP, supported shapes, token construction, ID disjointness and registry precedence. Do not commit the generated `dread-delve.html`.

## Follow-up for Claude's areas

No UI, game, networking or renderer changes are included. Special actions, saving-throw actions, multiattack sequencing, spellcasting, recharge, legendary actions, resistances/immunities, on-hit riders and conditional damage remain manual with their full rules visible in traits. No existing automation is removed.

The current token factory uses generic save/check/passive values and does not copy the new per-ability saves, senses or passive Perception into token state. Wiring those through combat and save migration needs a separate change. Likewise mixed-type damage currently rolls as one total; resistance to only one component needs manual adjudication until combat consumes `parts`. The attack text editor preserves its existing five fields, so editing attacks through it loses extended metadata such as `parts`, reach/range and detailed rules. A future editor can retain those fields. Read the SRD traits when resolving these cases.
