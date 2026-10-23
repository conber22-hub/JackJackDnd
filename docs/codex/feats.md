# SRD feats (task 3)

`FEATS` now contains all 17 feats on SRD 5.2.1 pp. 87–88: four Origin, two General,
four Fighting Style and seven Epic Boon feats, plus the existing `Other` control.
Every SRD entry has `cat`, `req`, `text` and `src`. `req:'None'` means no prerequisite.
The existing `origin`, `plus`, `style`, `lists` and `skills` flags are preserved.
`repeatable` allows repeated Skilled choices; `max:30` applies the Epic Boon ability
increase without reducing scores that already exceed a normal feat's cap.

The official source is https://www.dndbeyond.com/srd. Descriptions are extracted
from `feats.md` in `downfallx/dnd-5e-srd-markdown` at commit
`1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4`. Regenerate with
`node scripts/import-srd-feats.mjs /tmp/dread-srd-source/feats.md`.
The generated data carries CC BY 4.0 attribution and its source SHA-256.
Tests use an independent name/category inventory from the official PDF.

Only existing mechanical flags plus ability caps/repeatability are applied here.
The seven boons' other benefits remain manual: automatic hits, teleportation,
Fate's 2d4 adjustment/recharge, resistance bypass/critical bonus, slot preservation,
invisibility/resistance in darkness and Truesight. These are candidates for later
game automation. Existing feat limitations also remain: Alert's initiative swap,
Grappler's conditional effects, Savage Attacker/Great Weapon Fighting/Two-Weapon
Fighting damage handling, Magic Initiate's choice of spellcasting ability, and
Skilled's tool choices need their respective game/UI support. Prerequisites are
faithful text; the creator still needs category/level/stat filtering and an Epic
Boon presentation. No UI or game files are changed.
