# Dread Delve — Roadmap

A 3D virtual tabletop for **Curse of Strahd: Flood Edition**: multi-floor maps with furniture, minis, fog of war, the Count's Gaze, players' own characters, and sessions 0–10 ready to run.

When you start a Claude Code session, say: *"Read DREAD-DELVE-ROADMAP.md, then help me with…"* and it will know how the app is put together.

---

## How to run it

- **Play online:** the site is hosted on **Vercel**, which rebuilds and republishes it on every push to the default branch (`claude/dread-delve-v0.2`). Saves live in each browser, per address: a delve saved from the offline file doesn't show up online, so use Export / Import to move it.
- **Just play offline:** double-click `dread-delve.html` (Chrome or Edge). Everything, including Three.js and PeerJS, is baked into that one file, so the 3D works offline. Multiplayer still needs internet, because players find each other through the free PeerJS server.
- **Edit it:** `npm install` once, then `npm run dev`, then open http://localhost:5173. Changes show up live.
- **Bake a new single file:** `npm run build` writes `dread-delve.html` (copied from `dist/index.html`). Commit it so players always get the latest version.
- **Tests:** `npm test` runs the engine tests (generator, stairs alignment, doors, tables, import).

---

## v1.13 — the painted style (prototype)

A second look for the world, after hand-painted 1970s film posters (inspired by, not a copy): **Table tab → Graphics & sound → Style → 🎨 Painted**. Medium or High quality only. Before and after: `docs/screens/painted-*.jpg`.
- **Oil paint**: a Kuwahara filter turns flat areas (floors, walls, roofs, trees) into brush-stroke patches. Fine detail stays crisp, so minis, faces, weapons and runes keep their shape. Edges darken a little, like a painter's line.
- **Poster grade**: warm lights glow amber, cool lights and shadows go teal-violet, and the blacks lift to ink rather than a void.
- **Airbrushed glow**: the bloom is wider and softer.
- **Rim light**: a warm light behind the scene from the camera's view, so figures stand out from the dark.
- **Canvas**: a fine weave and a slow mottle over everything.
- **Name plates** sit on their own layer (`LABELS` in `render/scene.js`), so the paint never smears them. They are drawn on top, so a plate behind a wall stays readable.
- In `render/post.js` (`PaintShader`), `render/gfx.js` (`gfx.style`, `painted()`) and `main.js` (the rim light).
- Next, if the direction is right: hand-painted textures for stone, wood and roofs, and "poster moments" on the TV (a framed, painted still with a title when a boss appears or a session starts).

## v1.12 — the whole SRD at the table

- **Codex's PR #6**: the SRD's equipment: 38 weapons (Lance, Blowgun, Musket and Pistol are new in the creator), armour (with Padded), tools, gear and packs, and **258 magic items** with their full text (`src/data/srd-items.js`).
- **Codex's PR #7**: **all 330 SRD creatures**, monsters and animals, as a new "SRD 5.2.1" family in the Beasts tab (`src/data/srd-monsters.js`). They come with their full stat lines, saves, senses and 423 parsed attacks; their other actions are traits to read.
- Claude's side:
  - A placed SRD creature carries its own saving throws and passive Perception.
  - Random encounters on "any creatures" keep to the campaign's own; pick the SRD family to roll from it.
  - The Beasts tab's "All" lists the campaign's creatures (the SRD's are under their chip, or found by search), so the tab stays quick.
- **📖 Look it up** (Table tab for the DM, Hero tab for players): every spell, magic item, feat and class feature, the DM's books, and for the DM every creature. Read in full.

## v1.11 — regal glass

A new look for the DM and the players, after Apple's glass design with a gothic court's gold:
- **Glass surfaces**: every floating surface is frosted glass with a lit top edge, soft deep shadows and a gold hairline catching the light. That covers the top bar, side panel, initiative, hero card, tool dock, roll cards, banners and dialogs.
- **Capsule controls**: the top bar is a row of glass pills; the view switch and the panel's tabs are capsule segmented controls. On desktop every tab is in sight; on a phone they swipe.
- **Gold and type**: buttons are glass, with small ones as capsules, and the primary ones gilded. Inputs are glass wells with a gold focus ring and gold chevrons. Champagne gold replaces the orange accent. **Inter** is the interface face; Cormorant Garamond and Cinzel are for titles and small-caps section labels.
- **Motion**: springy and quick; cards rise, banners drop from the top like a phone's, buttons give under a tap.
- **On a phone**: the top bar is one swipeable row instead of three, the panel is a bottom sheet with a grabber, and "Start a fight" is one gold pill until a fight begins. Card-only heroes get round step keys.
- The start screen's panels and doors share the same glass and gold.
- All in `index.html`'s stylesheet. The tokens at the top (`--glass`, `--gold`, `--spec`, `--lift`, `--r-*`, `--spring`) restyle everything at once.

## v1.10 — heroes to level 20

- **Codex's PR #4**: all 12 classes and their SRD subclasses go to **level 20**:
  - slots, preparation and cantrips, and proficiency +5 at 13 and +6 at 17
  - the features' scaling: Rage, Bardic Inspiration, Channel Divinity, Wild Shape, Action Surge, Indomitable, Eldritch Blast beams, cantrip dice, Monk speed and dice
  - capstones, and Warlock **Mystic Arcanum** (once a long rest, never a pact slot)
  - `src/data/srd-features.js` holds the SRD text of every class feature
- **Codex's PR #5**: all 17 SRD feats with their category, prerequisite and full text (`src/data/srd-feats.js`), including the 7 **Epic Boons** (their +1 can go to 30) and repeatable feats.
- The creator's side (Claude):
  - spells up to level 9
  - Mystic Arcanum as its own "choose one" group, outside the prepared count
  - the feat pick grouped by category (General, Origin, Fighting Style, Epic Boon from level 19, your books)
  - prerequisites shown, and each feat's text under "What it does"
  - **📖 What your features do** on every sheet: the SRD's words for each class feature (its own class's section of a shared one like Extra Attack), plus species traits and the DM's books
- Rests: Arcane Recovery never restores a slot of level 6 or higher, and Eldritch Master (Warlock 20) brings back all pact slots.

## v1.9 — your books, at your table

- **📚 Your books** (Table tab, DM): import the compendium export from your character app (a `.prism` file, or its JSON). `src/engine/library.js` converts it; `src/game/library.js` keeps it in **this browser's IndexedDB** (idb-keyval) and merges it into the app's tables at start-up. None of it is in the code, the built page or the website, and `.gitignore` keeps `*.prism` files out of git.
  - **Spells**: about 210 that the SRD doesn't have (Xanathar's, Tasha's and the rest), with their full text. They roll what the description says plainly: a spell attack, a save, the dice and damage type, half on a success, a condition on a failed save, an area. Upcasting reads their higher-level sentence like the SRD's. Everything else is `util`, for the DM to read.
  - **Species** (with subraces as options), **backgrounds**, **feats** (with their +1 choices) and **subclasses** join the character creator in a "📚 Your books" group. A library subclass replaces the class's own subclass features on the sheet (the built-in one stays the default, since its mechanics are wired in), and comes at its first feature's level. **📖 What your features do** on the sheet shows the text.
  - **Creatures** go in the Beasts tab (family "📚 Your books"): AC, HP, speed, CR and XP, with attacks read from the stat block (several damage parts, ranges). The rest of the actions, traits, reactions and legendary actions become traits. When an attack's damage didn't come through in the export, a stand-in die is used and the creature says so. A placed creature is copied into the delve, so players' screens and the save have it. Random encounters on "any creatures" stay with the campaign's own; choose the family to use the books.
  - **Look it up**: a search box for every spell, magic item, creature, feat, species, background and subclass, read in full.
  - **Choose what to use**: Official books / Unearthed Arcana / Homebrew toggles (official and UA by default). The app's own entries win any name clash (Fireball, Dwarf, Alert…), because those are the ones the rules are wired to.
  - **Players' phones**: when a player joins, the DM's app offers the version it has (a hash). A phone that lacks it asks once, and gets the creator's part (no creatures or items) gzipped over the table connection. The phone keeps it for next time.
- Not yet: the compendium's classes (Artificer, Blood Hunter…). Since v1.10 the app goes to level 20. Magic items are for reading and handing out by hand; there's no inventory yet.

## v1.8 — every spell, cast properly, and a table that's easy to join

- **The whole SRD spellbook** (Codex's PR #3): `src/data/srd-spells.js` holds all 339 SRD 5.2.1 spells, levels 0–9, with school, casting time, range, components, duration, Concentration, Ritual, the full text and the higher-level line. It also has 4 extra spells (`extra-spells.js`) and 10 Flood homebrew spells (`flood-spells.js`). Codex's PR #2 added the NPC name tables (`npc-starter.js`).
- **Spells at the table** (`src/data/spell-play.js`): the import marks anything it can't model exactly as manual (`util`). That's honest, but Magic Missile, Spirit Guardians, Hold Person, Moonbeam and about 20 more had stopped rolling. This layer restores their dice, save and condition on top of the faithful data (`srd.js` applies it), with notes for what the dice can't carry. Spells that really are the DM's call stay manual: Bane, Command, Heal, Meteor Swarm, Power Word Kill, Sorcerous Burst.
- **Upcasting** (`src/engine/spellcast.js`): with more than one slot level left, casting asks which slot to use. The extra dice are read from the spell's higher-level line ("increases by 1d6 for each slot level above 3"): Fireball at 5 rolls 10d6, Cure Wounds adds 1d8 a level, Magic Missile adds a dart, Scorching Ray adds a ray. This works from the DM's card, a player's request and a card-only phone, and the card says "cast at level N".
- **🌀 Concentration** (`game/rules.js` `startConc` / `endConc`):
  - A caster holds one concentration spell at a time.
  - Damage calls for a Constitution save at DC 10 or half the damage (up to 30); the app rolls it and shows a card.
  - Incapacitating conditions and death end it.
  - When it ends, the conditions it imposed (tagged `conc:<caster>`) lift from everyone.
  - A 🌀 chip on the hero's card lets go on purpose, and 🌀 shows in the initiative list and on the TV.
- **Joining by QR** (`src/util/qr.js`, [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT): the Table tab shows the invite link as a QR code. The Night tab's **📲 Join card** puts the code and the QR big on the TV for players sitting down, and a ▦ QR for the screen link sets up a tablet as the screen. Links only this computer can open (the offline file, localhost) get no QR.
- **Staying awake** (`src/util/wake.js`, the Screen Wake Lock API): the TV screen and card-only phones don't dim or lock mid-session. It is asked for again whenever the page comes back. This needs https (the Vercel site); elsewhere it quietly does nothing.
- **Installable**: `public/manifest.webmanifest` and the icons (the Gaze in a blood moon) let phones "Add to Home Screen" from the Vercel site and open it full-screen like an app. Vite copies `public/` next to the page; the offline file doesn't need them.
- More libraries worth adding, and why some aren't: `docs/libraries.md`.

## v1.7 — game night, part two

- **🎲 Ask the table for a roll** (`src/engine/checks.js`, `src/game/asks.js`).
  - The DM picks any save, skill or ability check, a DC (shown or secret), advantage or disadvantage, and who rolls.
  - Seated players get a prompt on their phone (twenty buttons for their real d20, or "roll for me"). For everyone else the DM types the die or lets the app roll.
  - A bar at the top of the DM's screen shows who has rolled. **Reveal** rolls the rest and shows everyone's result: a card for the table, and on the TV a staggered reveal with faces, totals, ✓/✗ and the group verdict (half or more succeed).
  - Hero tokens now carry their skill bonuses and ability modifiers (`heroToken` → `skills`, `mods`; older saves are filled in by `deserialize()`).
- **Real-dice initiative**: with real dice on, the fight picker has a d20 box for each hero (`rollOrder`'s `fixed`).
- **The dice moment**: every attack card carries its d20, and the TV tumbles a die across the screen that lands on it (gold on a 20, blood on a 1), then steps aside for the card.
- **Turns**: phones buzz on their hero's turn and tap when they're next ("up next" on the TV's ribbon too).
- **🤫 Pass a note**: one player's phone buzzes with something only they see, optionally in Strahd's voice. The TV can show that a note changed hands, not what it says. Players keep their notes in the Hero tab.
- **📜 Previously on…**: the story so far from the public log (fights won, places reached, finds, what fell), dropped into the read-aloud box to trim and show.
- **A face for everyone**: introducing a creature without art or a sheet portrait uses its forged figure's head and shoulders. If it has no forged figure, it uses a portrait of its mini (`studio.portraitOfObject`).

## v1.6 — game night: playing in person

- **The table screen** (`src/ui/screen.js`, `src/net/screen.js`): the view for the TV.
  - **Night tab → 📺 Open the table screen** opens a window to drag onto the TV or a second monitor (⛶ goes full screen). It talks to the DM's window over a BroadcastChannel, so it needs no internet and no open table. It opens with `noopener`, so drawing the TV never slows the DM's window.
  - On another device (a smart TV's browser, a tablet), it joins with the table code: `?screen=CODE`, and the link is in the Night tab.
  - It's a player's view (redacted the same way, no seat).
  - The initiative ribbon across the top shows faces (the heroes' portraits); the party is along the bottom with HP and conditions.
  - The camera follows the action north-up and closer in: the creature whose turn it is, if seen, else the party. Turn banners and dice cards are bigger.
- **The Night tab** (`src/game/night.js`):
  - the map, or 🕯 lights out (black, one candle)
  - follow the action on or off, and 👁 show what I see (the TV takes the DM's camera for a while)
  - read-aloud text on the TV, typed in or taken from the party's room, the session's opening or the Gaze
  - 🎭 introduce someone: their forged portrait (or art), their name and a line
  - handouts: a picture, scaled down, shown full screen and kept for the evening
  - a turn timer (a ring that empties on the TV over each hero's turn)
  - 🔇 quiet this laptop (let the TV's speakers do the sound)
- **Real dice**: the d20 the players roll at the table, used instead of the app's.
  - When a hero attacks, the DM gets twenty big buttons (or "roll it for them"). Players' requests can carry their roll, and the request queue has a d20 box.
  - `combat.doAttack`'s `d20` option uses the die and still adds the bonuses, cover, AC and damage. Cards say "🎲 at the table".
- **📇 Card only** (`src/ui/cards.js`), a player's phone when the TV has the map:
  - no 3D (the render loop skips drawing), just the hero as a big card
  - attacks, spells and features as big buttons, with a list of targets (what's in reach first; area spells centre on the one picked)
  - their real d20 if the table uses real dice
  - a pad to step one square at a time, north-up like the TV

## v1.5 — maps you can move between, and smoother fights

- **The map library** (`src/engine/maps.js`, `src/game/maps.js`; the Dungeon tab is now the **Maps** tab).
  - Every map the table leaves goes on a shelf in the campaign (`state.campaign.maps`), with its fog, doors, furniture, dead and living creatures, and where the party stood.
  - Session dungeons (Story tab), Valley places and generated delves all switch through it. A map built before (same key: `session:<n>:<template>`, `place:<id>:<map>`) comes back off the shelf instead of being rebuilt: the Story and Valley buttons say **Back to…**.
  - Road maps are trimmed to the last three.
  - The party (heroes, and NPCs unless 🚩 Stays) travels with the table. It arrives where it last stood on that map, else at the way in (the stairs up, the road's start), else the first room, laid out in marching order.
- **Setting up** a map without the party (✎ Set it up, or Generate to set up).
  - The party waits in `state.campaign.away`. The players' screens hold still under a "The DM is setting the scene…" veil: state pushes pause, and a reconnecting player is seated on their waiting hero.
  - It ends when the DM brings the party over (📍 tap where they arrive) or goes back to them.
- **📍 Move the party**: tap a square and the party regroups there in marching order. Outside a fight, the party follows whoever takes the stairs (🚩 Stays keeps one behind).
- **Fights** (`src/engine/fight.js`).
  - **⚔ Start a fight…** opens a picker. The party and the creatures in sight, within 12 squares or alerted are ticked; the far end of the map stays out.
  - Identical creatures can share one roll. Surprise gives that side disadvantage on initiative (2024 rules).
  - **🤖 Its turn** runs a monster's turn: hit whoever it can reach (the most hurt first), else shoot, else close in and hit.
  - **⏭** holds back the current creature and **✕** takes one out of the fight. HP bars show in the initiative list.
  - When every foe in the fight is down, a card calls the win with its XP, and **🏆 End the fight** takes the place of Next.

## v1.4 — furniture you can use

- **Objects** (`src/data/objects.js`, `src/engine/objects.js`, `src/game/objects.js`): tap a piece, or a 🪑 chip on a hero's card for what's beside them.
  - **Open and shut** chests, coffins, sarcophagi (Strength to heave the lid), wardrobes, desks, barrels, crates and cages. The first opening shows what's inside: the DM's text, or a roll on its table in `data/loot.js`.
  - **Pick or force** a lock (forcing is noisy).
  - **Push** a piece a square away from you. Light things just move; heavier ones need Athletics DC 10 or 15. It never goes into a wall, a doorway, a person or another piece.
  - **Topple** a tall one (shelf, bookshelf, wardrobe, statue, suit of armour, banner, candelabra, brazier): it falls one or two squares away from you. Anyone there makes a DC 13 Dex save or takes its damage and falls prone. It then lies there as climbable rubble, and a shelf spills its books or bottles.
  - **Smash** anything solid: an attack against its AC (by material), damage against its HP (by size, from the SRD object rules). It breaks into debris (rough ground), spilling its contents.
- **Secrets**: the dresser locks some chests, desks, wardrobes and cages, tucks hidden stashes into some furniture (found with Search), and stands a bookshelf or wardrobe in front of some secret doors. Find the door and the shelf swings aside on its hinge; push, topple or smash the shelf and the door is exposed. A whole-floor check makes sure a hiding shelf never walls anything else off.
- **DM controls** on the prop card: lock DC, what's inside, a hidden stash and its DC, and ↺ to set a piece back.
- Players' moves arrive as `{ t:'prop' }` and are checked on the DM's side: their own hero, beside the piece, on their turn, with an action the rules offer them. What's inside, unfound stashes and which shelf hides a door are stripped from what players receive. Animations (lids, slides, falls, swings, smashes) play on every screen.
- **For Codex**: `docs/codex/rules-data.md` (the full SRD 5.2.1, and a private library format for the DM's own books, kept out of this public repo). **Art**: `docs/assets.md` (CC0 sources and how they'd plug in).

## v1.3 — first playtest fixes

- **Joining from anywhere**: every table now uses relays (STUN and a public TURN) by default, so a player behind a phone carrier or a strict router can get through. The DM sees each knock in the Table tab and a toast; a player who can't get through after 9 s is flagged ("can't get through") with a pointer to **Table tab → Relay**, where the DM can add their own TURN relay (URLs, username, credential), test it, and send it out in the invite link. Players don't need to be accepted: a knock that connects comes straight in.
- **Phones and foldables**: the creator's 3D preview no longer swallows swipes (it lets vertical scrolls through and is capped in height), modals scroll inside themselves, and the creator puts the preview inside the Looks section on narrow screens. Tested on a Z Fold's folded and unfolded sizes.
- **Feats** (SRD 5.2): at each Ability Score Improvement level choose +2 / +1 +1 or a feat: Alert, Grappler, Magic Initiate (Cleric, Druid or Wizard), Savage Attacker, Skilled, Archery, Defense, Great Weapon Fighting, Two-Weapon Fighting, or Other (write in any feat, with its +1 and extra HP per level). Their effects flow into the sheet, attacks, initiative, skills and spell lists.
- **Furniture you can climb**: minis go round tall props (shelves, statues, pillars, hearths, trees), climb onto low ones and stand on top (tables, chairs, crates, beds, altars; difficult terrain), and hop fences, with a jump in their step. The room dresser never lets a tall piece wall off part of a room, and every template is checked for that.

## v1.2 — forged minis

- **Every hero, ally and humanoid foe is a forged mini** (`render/forge/`): a jointed figure — hips, waist, chest, neck, head, shoulders, elbows, wrists, knees, feet — sculpted from lathed and shaped parts, with skinned arms, legs and torso that bend smoothly at the joints. Faces (eyes, brows, nose, mouth, ears by folk), ten hair styles, beards, horns, tails, a dragonborn's muzzle and crest, an orc's tusks, a vampire's fangs, glowing eyes for the dead and the fiendish.
- **Built from the sheet** (`engine/look.js`): folk sets the body (a stocky dwarf, a small halfling, a tall goliath…); armour sets the outfit (robes, leathers, hide and fur, mail and tabard, breastplate, full plate, a monk's gi, vestments); weapons go in the hands (22 sculpted weapons — swords, axes, maces, spears, glaives, staves with glowing crystals, bows, crossbows…), a shield, a book, an orb, a holy symbol or a torch in the other, and a lantern at the belt. Class sets the stance and the cloak, hood, mantle or hat. Change the sheet and the mini changes.
- **The Look studio** in the character creator: the hero turns on a candlelit stage at the top of the sheet; drag to spin them, ⚔ / ✨ / 🚶 to see them swing, cast and walk. Skin, hair, beard, eyes, horns, height, build, shoulders, clothes and trim, cloak and its colour, headwear, stance, and outfit / weapon overrides. 🎲 Surprise me; ↺ Back to my sheet. **📸 Take it from my mini** makes the hero's portrait from the figure. Players can still choose to stand their own picture on the map instead.
- **They come to life**: breathing and small shifts of weight; a walk with a stride, a bob and a cloak that streams behind; they turn to face where they go and what they fight. Attacks by weapon — a slash with a wrist snap, an overhead smash, a thrust, a drawn bow, a zombie's claw — a spellcaster's raised hands, a flinch when hit, a sprawl when they fall. Cloaks ripple, torches flicker, staves, spears and lanterns stay upright. Players see every swing.
- **Foes and folk**: bandits, cultists, guards, scouts, veterans, nobles, priests, zombies, ghouls, revenants, skeletons, wights and the Count have presets (`src/data/looks.js`); any humanoid creature holds what it fights with; every one varies by its own seed — height, skin, hair, rags, the tilt of a head — so a pack of zombies is a pack, not one zombie copied. Wolves, swarms and the Seep's things keep their own shapes; creature art and dropped-in GLB models still win.
- **🎲 Roll an NPC** (Tokens tab): villager, Vistani, guard, priest, noble, bandit, cultist, hunter or adventurer — a name, a portrait from their mini, one line of what the party sees (`describeLook`), a quirk and a want; place them as an ally or as a foe. The DM sees their notes on their card. Starter tables in `src/data/npc-starter.js`.
- Materials: cloth, leather, chainmail and brushed-metal bump textures painted at load, a painted surrounding for metal to reflect, and a soft cold rim light on every forged figure so minis read against dark floors. Parts that don't bend are merged per joint and material (~35–50 draw calls a figure).
- Tests: `tests/look.test.js`, `tests/e2e/forge.spec.js`.

## v1.1 — targeting and areas

- **Reach and range** (`engine/targeting.js`): melee needs reach (5 ft., 10 ft. with a glaive, halberd, pike, lance or whip); weapons use their SRD normal/long range (beyond normal: disadvantage); spells their SRD range (`SPELL_RANGE` in `src/data/srd.js`). A ranged attack with a hostile creature beside the attacker has disadvantage; a prone target is easy up close and hard far off. Picking an attack or spell shades its reach on the map.
- **Cover** by the grid rule: from the attacker's best corner, lines to the target square's four corners; walls and closed doors block (a seam through solid wall counts, an edge doesn't). 1–2 lines: half cover (+2 AC), 3: three-quarters (+5), 4: total (can't be targeted); a creature in the way gives half. Hovering a target draws the lines (green / gold / red) with a tip: distance, cover, disadvantage.
- **Area spells you aim**: spheres and cylinders centred on a square in range and sight; cubes (from the caster, or centred); cones and lines from the caster in the direction you point; auras around the caster that spare friends; walls (Wall of Fire) across your line of sight. The template follows the pointer, rings everyone it would catch (friends in gold) and stops at walls. On a phone, tap to place and tap again to cast. A creature with cover from the blast adds +2/+5 to its Dexterity save. The squares flash in the spell's colour for everyone (players only see the flash where they've been).
- **Players can't take shots they can't make** (out of reach, behind total cover, out of sight); the DM's table checks every request again. The DM can, with a second tap — the card notes it was the DM's call.
- Saves from before keep working: heroes' weapons and spells get their range, reach and area by name (`addRanges` in `engine/hero.js`).
- Tests: `tests/targeting.test.js` (engine), `tests/e2e/targeting.spec.js` (browser: cover tip, second tap, Fireball, touch).

## v1.0 — moving

- **Drag your mini** along the way you want it to walk (back over the route shortens it; a jump is bridged the shortest way). A dotted path and a tip show the cost in feet, what's left of the move, rough ground, and a warning if the route leaves an enemy's reach. With a mouse, hovering any square you can reach shows the same. Arrow keys and the number pad step one square, up the screen. Players' traced routes are checked by the DM's table (`engine/movement.js` `checkPath`) before they walk.
- **The party follows its leader**: outside a fight, when the DM moves a hero, the others within 8 squares fall in behind single file in marching order (Tokens tab: ⇡ to reorder, 🚩 Stays, 🚶 Party follows on/off). **Groups**: Shift-click creatures, or 👥 Select party / Select its kind, and they move with the selected one in formation, each finding its own way.
- **Battle movement**: the reach glow is two-tone (the move left, then the Dash zone — walking into it takes the Dash). The card has 🏃 Dash, 🛡 Disengage, 🌀 Dodge (attacks against it at disadvantage until its next turn), ⤒ Stand up (half its speed), and ↶ Undo move (the DM any time this turn; a player while the move revealed nothing).
- **Opportunity attacks**: leaving an enemy's reach (1 square, 2 with a glaive, halberd, pike, lance or whip) stops the walk at the edge of it. The DM gets *"⚔ X leaves Y's reach — Strike / Let them go"*; when Y is a hero, its player gets the prompt for their own reaction. A strike uses the best melee attack and spends the reaction (back at the start of its turn); then the walk carries on unless the mover dropped. Disengaging, being stunned, paralysed or restrained, or having no melee attack means no strike.
- **🐾 Close in** (DM, on a monster): walks it to the nearest hero, as close as its move allows, ending within reach when it can.
- Code: `engine/movement.js` (pure, tested in `tests/movement.test.js`), `game/moves.js` (groups, turn actions, undo, opportunity attacks, key steps).

## v0.9 — Castle Ravenloft

- **The castle is a place you can walk into** (`engine/castle.js`, the **Castle Ravenloft** template, 56×56 squares): five hand-shaped floors instead of generated ones, every room named, furnished and given a read-aloud, every room reachable.
  1. **The Approach** — the cliff road, a drawbridge over a bottomless chasm, the gatehouse between two round towers, and a fog-filled courtyard of statues and dead trees under the keep's walls, with the stables, the black carriage, and the chapel spire.
  2. **The Great Halls** — the Hall of Arrival, the Great Hall, the Count's dining room and its pipe organ, the chapel (with a secret door into the vestry), guardrooms, the gallery, the kitchens and larder, the Hall of Arms and the Grand Stair.
  3. **The Upper Keep** — the audience hall and its throne, a locked treasury, the library and study, the hall of portraits, guest rooms, the Bride's Room, the Moon Terrace and the Servants' Stair.
  4. **The Dungeons** — a row of twelve cells, the Question Room, the oubliette, wine vaults, storerooms, a black cistern, and the Crypt Stair.
  5. **The Catacombs** — a grid of crypts (32 names, new each delve) around the Tomb of the Count behind four locked doors, with traps in the aisles.
- **The keep stands on the courtyard map**: a 3D keep with battlements, corner towers, a spire and one red window; round turrets with slate cones for the gate and the chapel.
- **It is always on the horizon** (`render/skyline.js`): on every outdoor map in the valley — a road, a village, a landmark — the castle stands in a band along the top of the view, in its true direction from where the party is. It slides like a compass as the camera turns, looms larger when you face it and the nearer you are, glows redder as Strahd's Gaze rises, and at Gaze 6+ lightning breaks behind it. It steps aside indoors, in Stack view, and at the castle itself.
- **On the Valley map** the castle is drawn on its crag above the village, its windows glowing with the Gaze; at Gaze 3+ a red thread runs from it to the party's lantern.
- **On the road**: "The castle lights up" (Gaze 2+) and "The black carriage" (Gaze 3+) join the road events.
- New floor themes: **The Approach to Ravenloft** (`grounds`) and **The Dungeons of Ravenloft** (`dungeon`).

## v0.8 — maps that feel lived in

- **Every generated room is furnished** (`engine/dressing.js`, kits in `src/data/dressing.js`): by its type (a crypt's coffins and sarcophagi, a shrine's altar and pews, a treasure room's chests, a Seep nest's growths and black puddles, a sanctuary's brazier and salt) and by its floor (the mine's rails, carts, pit props and silver ore; the ossuary's bones; the mill's sacks; the cellar's barrels; the wreck's hull plates). Wall pieces stand with their backs to a wall, doorways, stairs and doors stay clear, nothing overlaps, and big rooms get more. Rooms in **the Narrow House** become bedrooms, a library, a dining room, a parlour, a nursery (cradle, dollhouse), a kitchen and servants' rooms; in **castles** and **Argynvostholt** a great hall, a chapel with pews and an organ, a library, bedchambers, an armoury, a gallery of statues and the cells — each named to match, each use once a floor before any repeats.
- **New props**: bookshelf, wardrobe, writing desk, cradle, dollhouse, throne, banner, suit of armour, pew, pipe organ, statue, sarcophagus, cobwebs, cage, rack, mine cart, rails, silver ore, pit props, pale fungus, black puddle.
- **Read-aloud for every room** (`src/data/descriptions.js`): a line from what the room is and a line from the air of the floor. The Dungeon tab shows it (editable) with **📜 Read aloud**, **🪑 Furnish** and **✕ Clear furniture** per room, and **Furnish empty rooms** / **Describe rooms** for a whole floor (older saves, hand-drawn rooms).
- **Room prompts**: the first time a hero walks into a room, the DM gets *"📜 The party enters the Nursery — Read it aloud / Not now"* at the top of the screen (Dungeon tab → Room prompts to turn it off). Players never receive the read-aloud text or room names until it is read.
- **Candles and fires give light**: the nearest few candelabras, braziers, hearths, lanterns, lamp posts, campfires and altars light the room around them with a flicker (4 lights on Medium, 8 on High, none on Low).
- **Weather you can see**: rain, drizzle, sleet or snow falls on outdoor maps when the day's weather says so (the Dark Lord desk, or the weather rolled for a journey); players see it too.
- **Day and night outdoors**: on outdoor maps the valley's clock sets the light — grey day, dim dawn and dusk, dark night.
- **Each place sounds like itself**: under the drone, rain on outdoor maps when it's raining (wind when it isn't), a crackling hearth in the tavern, slow drips in stone halls, deep water in the Undertow, the cellars and the Bloom.
- **Search the furniture**: a hero who searches next to a chest, coffin, sarcophagus, desk, bookshelf, wardrobe, crate, barrel, sack, cradle, dollhouse, altar, cage, mine cart, ore or Vistani wagon opens it — one roll on its table in `src/data/loot.js` (coins, potions, letters, keys, scrolls, salt, garlic, and the odd thing that is still warm). Lines starting "DM:" go to the DM alone (the occupant opens its eyes; a child hiding in the wardrobe); everyone else sees only that something isn't right. Each container opens once.

## v0.7 — multiplayer you can rely on (Phase 6, done)

- **Phones that sleep come back on their own.** A player whose connection drops (phone locked, Wi-Fi blip, the DM reloading) reconnects by itself: it backs off (1, 2, 4… 30 s, a little random), tries again the moment the phone wakes or comes back online, and keeps a 5-second heartbeat so a dead connection is noticed. Their name, secret word and seat come back with them. The badge says *reconnecting…*; after a few minutes of nothing, the Hero tab offers **↻ Try again**. When the DM closes the table, players are told.
- **Joining before the DM is ready works**: the start page stays up with a status line ("Waiting for the DM to open table HX7Q…") and keeps knocking.
- **The table keeps its code.** The DM's code is remembered in the browser for 12 hours: reloading and choosing *Return to the table* reopens the same table, and everyone's phone finds it again with no one typing anything. (The server can remember the old page for up to a minute; the app keeps retrying the same code before giving up and picking a new one.) If the DM's own link to the signalling server drops, it re-registers by itself; players already at the table never notice.
- **Seats are remembered by who you are** (name + secret word), DM-side, so a player always gets their hero back — even one the DM seated by hand. Someone typing a hero's name can no longer take a hero that's locked to another player's secret word.
- **The DM's copy of a sheet wins** when it's newer (levelled up or edited at the table), and edits reach the player's browser straight away.
- **Players' browsers no longer receive secrets** (`engine/redact.js`): only the explored map plus one square of edge (everything else is solid rock to them), no secret doors or unfound traps, no room types or notes, no names of floors they haven't seen, monsters only while the party can see them — and then without HP, AC, attacks or hidden flags — and a blank *something unseen* for hidden monsters in the fight. The Shift and Whim tables stay home, and DM-only log lines (🔒 in the DM's log: what a noise woke, rolled encounters, what waits on the road) aren't sent.
- **Invite link**: Table tab → 📋 Copy invite. It opens the player's door with the code filled in (and carries the relay server setting).
- **Your own relay server** (Table tab → Relay server): host, port, path, key, https, plus an optional TURN server for phones on mobile data. **Test** checks it answers. Run one with `npx peer --port 9000 --key dreaddelve` (any PeerJS server works).

## v0.6 — deeper rules (Phase 5, done)

- **Players roll from their own device.** A player selects their hero and taps an attack, a spell or a feature, then a target. The DM gets a request at the top of the screen: **✓ Roll it**, **▲ Adv**, **▼ Dis** or **✕ No** (the player hears "the DM says no"). The DM's app does the rolling, so every screen gets the same card. **Table tab → Players roll freely** skips the approval. In a fight a player can only act on their own turn.
- **Spell slots and class resources** on every hero from the creator: slots by level, pact slots, Rage, Bardic Inspiration, Channel Divinity, Lay on Hands (5 HP a tap from the pool), Wild Shape, Second Wind, Action Surge, Indomitable, Focus Points, Sorcery Points, Favored Enemy (a free Hunter's Mark), Arcane Recovery and Magical Cunning (slots back), Heroic Inspiration, and Hit Dice. Casting spends the lowest slot that fits (and refuses when none is left). Slots show as pips on the hero's card; the DM can nudge any of them ± on the Tokens tab. **Rage** halves bludgeoning, piercing and slashing damage and adds rage damage to melee hits. Buff and utility spells now have buttons too (they show a card and spend the slot); Divine Smite lands as radiant damage (+1d8 against the undead); Lesser and Greater Restoration clear Seeded, Blinded, Paralyzed and Poisoned.
- **Rests**: Tokens tab → ☕ Short rest (short-rest features back; one charge of the one-a-rest ones) and 🌙 Long rest (full HP, everything back, conditions gone except Seeded). Making camp on the road is a long rest.
- **True line of sight** (`lineClear` / `canSee` in `engine/grid.js`): a square is seen if a straight line reaches it from the viewer's square (to its middle or near a corner) without crossing rock, a building, a tree or a closed door, out to 60 ft. (a token's own `sight` in squares overrides it; Blinded is 1). Buildings and trees cast real shadows in the villages and woods.
- **Legendary and lair actions** (`src/data/legendary.js`): the Count, Saint Andral (both forms), the Budding Mind and the Undertow. Their card shows the legendary actions left this round (back at the start of their turn) with a button for each — attacks then ask for a target — and **🛡 Legendary Resistance** (3 a day). When a lair creature is in the fight, each new round puts a **🏰 Lair** button in the initiative list: one lair action on initiative 20, never the same one twice running.
- **Encounter generator** (Beasts tab → Encounter; `engine/encounter.js`): low / moderate / high, any creatures or one family. The budget is the 2024 XP budget for the party's levels (from their sheets, or the session's level), raised by his Gaze (×1.06 per step above 1); at Gaze 4+ his own creatures turn up more often. A leader plus its kind, no bosses, at most two per hero. **Place on this floor** drops it in a room away from the party.
- **Noise carries** (`game/noise.js`): starting a fight, forcing a door, a trap going off, and thunder or fire spells with an area wake creatures nearby and on the floors above and below (very loud ones two floors away). The DM sees a red ping where the sound arrives on the other floors and a toast of who heard it. **📢 Noise** in the dock makes a noise wherever you tap.
- **Difficult terrain** (`f.rough`): costs 2 squares to cross; movement and the reach glow follow it (it takes the cheaper way round). **Build tab → ≋ Rough** paints it (start a stroke on rough ground to clear it). Berez's banks are mud. Drawn as dark wet ground with stones.

## v0.5 — the Valley: a Barovian overworld

- **The Valley tab** (DM) shows a map of Barovia: 16 places (the Mist Wall, the Gates, the Village, the Gallows Crossroads, Castle Ravenloft, the Iron Coffin, Tser Pool, Old Bonegrinder, Vallaki, Lake Zarovich, Argynvostholt, Berez, the Wizard of Wines, Krezk, Yester Hill, the Lonely Tower) joined by 15 named roads, paths and trails, with forests, the river, the lakes and mist around the edge. A lantern marks the party; places they haven't reached are dim. **⤢ Enlarge** opens it big.
- **Travel.** Tap a place, then **Set out**: the app finds the way along the roads and builds it as a chain of maps (one per stretch of road, at most six), with the party at the start. Each stretch is generated from modules (`src/engine/overland.js`): a winding road with bends, sometimes a river and a bridge, and roadside set pieces (a wolf den, a scarecrow field, a hanging tree, roadside graves, an abandoned Vistani wagon, a wayside shrine, a raven's tree, a black pond, a lonely farmstead, standing stones, a bank of mist, a fork that wasn't there). The road's **shape** is seeded by the road, so it's the same road every time; **what's on it** is rolled per journey from `ROAD_EVENTS` (wolves, the Count's hounds, ghouls dragging a coffin, the Mist Thing, a rider in fine clothes, the Bloom once it's loose…), and the Gaze unlocks the nastier ones.
- **The road's events** are violet runes on the map (DM only) and cards in the Valley tab: 📜 read it out, ⚔ spring it (drops the creatures there), ◎ show it, ✓ done. **✦ Something on the road** rolls a new one somewhere ahead of the party.
- **Arriving.** The last stretch ends at the destination's landmark: the Gates with their headless guardians, the village street in the mist, the gallows at the crossroads, the Vistani camp and its pool, the windmill, a palisade town with its gate, the burned furrow and iron plates of the crash, a castle gatehouse, a lake jetty, a burned hall, a drowned hut, vineyard rows, a ring of stones, a tower in a tarn. **Arrive** marks it on the map and reads the place out; **Enter** builds the place's own map where there is one (the Village → the Village of Barovia, Old Bonegrinder, the Iron Coffin, Vallaki → Saint Andral's, Castle Ravenloft).
- **Sessions know where they happen**: the Story tab shows a 🧭 link to each session's place.
- **A map for every place** (`src/engine/settlement.js`): procedural villages (main street, square and well, the church on a rise with its graveyard and the stairs to its undercroft, walk-in tavern and shop, the burgomaster's house, streets of houses and back houses, the Narrow House at the edge of the Village of Barovia), a palisade town with gates (Vallaki — or Saint Andral's, sessions 8–10), a stone-walled village with the abbey road (Krezk), a drowned village of huts on islands and causeways (Berez), the Vistani camp with the reader's tent and the pool (Tser Pool), the vineyard, press house and storehouse over the wine cellars (the Wizard of Wines), a lakeshore with a walkable jetty (Lake Zarovich), the stone ring on Yester Hill, a three-floor tower on an island in a tarn, Argynvostholt (a burned hall), and Castle Ravenloft. The Gates, the crossroads and the Mist Wall use the road's landmark as a map of their own. Layouts can mark stone-wall squares (`masonry`) and bare squares (`clear`, for a palisade prop).
- **Share the map with the table**: players get a Map tab with only the places they have reached, rumours ("?") of the places next door, the roads between, the lantern, the day and the weather.
- **Time and weather**: each stretch takes 2–4 hours (road, path, trail); arriving moves the clock on (Day N · dusk); each journey rolls Barovian weather onto the Dark Lord desk; **⛺ Make camp** passes eight hours, reads an omen, and (at Gaze 3+) brings something to the fire.
- **Build tab → 🏠 Houses**: cottage, house, longhouse, hall, barn, hut, tower and windmill, on bare rock; tap to turn the door, Erase takes it down.
- **Woods**: some of the trees are dead and grey; grass tufts in the clearings and stones on the roads.
- New props: the Gates of Barovia, gallows, scarecrow, mist bank, campfire, Vistani wagon, bridge planks, ravens, palisade, rubble, iron hull plate, rowing boat, standing stone, Bloom growth, vine rows. Floors can carry **water** (rivers, ponds, lakes — impassable, drawn as water rather than trees), solid squares, and windmills and towers among the houses.

## v0.4 — a new campaign: Session 0, Strahd's Gaze, props

- **The threshold.** The start page is now the Dark Powers' invitation: a slow crimson spiral, drifting fog, a pair of eyes that open now and then, and lines in their voice. Two arched doors: *Take the Count's seat* (DM: continue, **Begin Session Zero**, or pick any dungeon from Foundry-style world cards) and *Accept the invitation* (players: sign in, hero cards, join with the code). It remembers which door you used last.
- **Strahd's Gaze replaces the Dread** (top bar, 1–10; still `state.dread` in code and saves). How closely the Count is watching: thicker mist and redder light as it rises, and in combat his creatures (the Barovia family) regenerate and hit harder, the fallen get up as his zombies, the land rearranges itself, and from 8 his voice charms one hero each round (Wisdom save). Rename or rewrite levels in the **Gaze tab**.
- **The Whim Die replaces Andral's Grasp Die** (🦇, d4 → d12; kept in `state.grasp`). How he toys with the heroes: a raven, a gift, the mists closing, wolves, an invitation, a charm, bats, a borrowed friend, his hounds, him, and finally the end of the game. It grows once a round when one of his creatures falls, and when the DM presses +. `W` rolls it. Old saves drop the hands' table automatically.
- **Props** (Build tab → 🪑 Props): 48 pieces — tavern furniture, a bar, hearths, barrels, a well, market stalls, carts, a carriage and an overturned one, fallen horses, split salt sacks, pines, dead trees, altars, coffins and more. Tap to place, tap again to turn, Erase removes. Minis climb up onto low pieces and stand on top (tables, crates, beds, altars: difficult terrain to get onto), hop fences, and walk round tall ones (shelves, statues, pillars, hearths), which block movement. No prop blocks sight. The room dresser never lets a tall piece wall off part of a room. Saved with the delve and in floor JSON.
- **Outdoor floors.** Themes can set `walls:'trees'` (the edges are forest, several rows deep) or `walls:'mixed'` (walls next to indoor rooms are buildings, the rest is forest). Floors can carry solid **houses** with gabled roofs, chimneys and lit windows. Overland exits get a soft beacon instead of a stairwell, and named buttons ("▼ Take the Old Salt Road").
- **Hand-built maps in templates.** A template floor can carry a `layout` (rooms, paths, doors, houses, props, exits) instead of being generated — see `layoutFloor` in `src/engine/generator.js` and `src/data/session0.js`.
- **Session 0 — Salt for the Lantern & Ladle.** The salt carriage never arrived. Three furnished maps: the Lantern & Ladle tavern (common room, kitchen, larder with empty salt crocks, the Snug, stable yard, stables), the village of Hollin's Ford (market square, chapel, provisioner, smithy, cottages), and the Old Salt Road (wayshrine clearing, the overturned carriage in a ring of spilled salt, the Mist Wall). New faces (Marta Holloway, the stranger in the Snug), a wolves encounter, and a **salt** rule: the Bloom is wet and salt dries it. A new clock, *The salt runs out*.
- The tribute from the earlier campaign was removed for this new one (it's in git history). The GitHub Pages workflow was removed now that the site is on Vercel.
- Fixed: the moon and sky light never dimmed with the Gaze (a comment had swallowed the code), and lighting now eases at the same speed at any frame rate.

## What v0.2 does

Everything from v0.1 is still there: seeded multi-floor generation, the Tilt/Top/Stack views, Dread 1–10, the Shift, 16 horrors with Grok prompts, initiative and attacks, multiplayer with fog of war, art standees, autosave and export. On top of that:

### Phase 1 — Made it yours (done: Flood-style Seep campaign)
- **Dread levels 1–10 renamed and given rules.** The levels track the Seep's infestation: Uneasy Gloom → Damp Stone → Spore Drift → Weeping Walls → The Tide Stirs → Shifting Halls → Biomass Bloom → The Seep Rises → Choir of the Taken → Reality Collapse. Each level has read-aloud text and **automatic effects in combat**: Seep regeneration, a Seep to-hit bonus, a chance each round that a Seepling buds, a chance each round that unclaimed corpses get taken, and the Shift chance. Rename or rewrite any level in the **Dread tab**.
- **Full statblocks** for the Monstrosity of Hands (CR 9) and Saint Andral (CR 21). Andral gets a second phase, *Saint Andral, Half-Taken* (CR 22), which triggers automatically at half HP. Both bosses have legendary and lair actions.
- **New Seep creatures:** Husk-Templar (CR 4, a taken church knight), the Budding Mind (CR 10, the proto-mind), and the Reliquary Colossus (CR 12, the juggernaut form). Each has its own 3D mini. That makes 22 creatures.
- **Seep mechanics that run on their own:**
  - *Host Seed:* a Seepling latches on when it hits. If the host dies while it's latched, the host rises as a Husk next round unless healed first; a fallen PC becomes "Husk of Gribbles".
  - *Pack Tide* gives advantage automatically.
  - *Burst Sac:* any single hit of 5+ pops a Seepling.
  - *Unfinished Death* now also ends to fire, not just radiant.
  - *All Flesh Returns* heals the Undertow when Seep die near it.
  - *Overmind Link* stuns the floor's Seep when the Mind dies.
- **On-hit saves and conditions:** attacks carry an `on:{save, dc, cond}` field, such as the Bellmouth's paralysis, Sinew Line's restraint, and Silver Cough's blindness. Conditions show on the minis and the cards, count down by round, stop movement (restrained, grappled, paralyzed, stunned), and grant advantage or disadvantage automatically.
- **The d100 Shift table.** Every Shift rolls d100 and applies a row: rewire, rooms swap, forgetting halls, doors lock or fly open, a room becomes a nest, the stairs wander, hidden traps grow, the party is scattered, and more. The whole table is plain text you can edit in the Dread tab, or use the "roll" box to call a specific result.
- **The Grasp Die** (d4 → d12) escalates Andral's hands. It grows when Hands die (unless radiant killed them) and shrinks when the Monstrosity dies. It auto-rolls at round end while hands are present, and the Monstrosity makes it roll twice and keep the higher. The 12-row Grasp table is editable too. The ✋ badge in the top bar opens it.
- **Party:** Gribbles, Mulan, Milson, Alexander and Vlad gained *Tools* (lockpicking/disarm bonus) and *Passive Perception* (spots traps and secret doors). **Their numbers are still placeholders.** Put the real sheets in the Tokens tab.
- **Bestiary editor:** ✎ Edit on any creature opens its statblock as JSON. *Save* overrides it in this delve; *Save as new creature* adds one. Edits travel with the save and reach players.
- **Copy every Grok prompt** in one click (Bestiary tab).

### Phase 2 — Build floors by hand (done)
- **Build tab** (or press **B**). Its tools sit in the dock:
  - **Room:** drag a room to move it (tokens, traps and stairs come along, and the floor below follows the stairs); drag a corner to resize; drag on bare rock to draw a new room; tap a room to select, rename, retype, populate or delete it.
  - **Hall:** trace a corridor with your finger or mouse.
  - **Door:** open, closed, locked or secret.
  - **Trap:** Hinged Floor (drops you a floor), Silver Wire, Spore Vent (spawns Seeplings), Drowning Font, Bone Grinder, Tolling Bell (Dread +1 and alerts the floor), Grasping Floor (rolls the Grasp Die), Collapsing Shaft.
  - **Stairs:** move them; the next floor lines up.
  - **Erase**, **Dig**, **Fill** (drag to paint), and **Undo** (Ctrl+Z).
- **Auto-link on/off.** Turning it off freezes the generated corridors into hand-drawn ones you can erase and redraw. The Shift then stops rewiring that floor but keeps doing everything else.
- **Doors in play:** closed doors open as you walk through and block sight; locked doors need a Pick (Tools vs DC) or a Force (noisy: it alerts the floor); secret doors look like wall to players until found.
- **Traps in play:** they fire when a party member steps on them. Heroes whose passive Perception beats the trap's DC spot it on their own and stop before walking in. **Search** actively checks 15 ft; **Disarm** uses Tools, and failing by 5 or more sets the trap off. Players only ever see traps they've found.
- **Templates:**
  - *The Descent of Saint Andral*
  - *Castle above, crypt below, mine under that* (chapel → ossuary → silver vein)
  - *Outbreak* (pre-populated; Budding Mind in the Womb, Undertow at the bottom)
  - *Andral's Labyrinth* (small rooms, many locked and secret doors, double traps)
  - *Blank stone* (build by hand)

  There are three new floor looks: the Chapel, the Ossuary Deeps and the Budding Womb.
- **Populate** a floor or a single room from its theme's denizens. **Add a floor** below the bottom, or remove the bottom one.
- **Import maps.** The importer accepts Battle Table JSON and any grid JSON, whether cells are numbers, strings, booleans, objects or a sparse `{x,y,type}` list. It picks up rooms, doors, traps, stairs and tokens (matched to the bestiary by name). It also takes **ASCII**: `#` rock, `.` floor, `+` door, `'` open, `L` locked, `S` secret, `^` trap, `>` down, `<` up, with `=== Name ===` between floors. You can **replace this floor** or **import a whole delve**. Stairs are re-aligned so the stack still lines up, and the import card lists anything it changed.
- **Export a floor** as ASCII (to edit in a text editor and paste back) or as JSON.

  > ⚠ I didn't have a sample Battle Table export to test against. If yours isn't recognized, drop one file in this folder and ask Claude Code to teach the importer its format (`src/engine/importer.js`).

### Phase 3 — Split into a project (done)
v0.1's single file is now a Vite project. `npm run build` bakes it back into one HTML file to hand to players.

---

## v0.3 — Curse of Strahd: Flood Edition, Phase 4, and the character creator

### The campaign (Story tab)
- **Sessions 0–10 of Curse of Strahd: Flood Edition**, built from your Battle Table's Dark Lord desk and Bloom bestiary. The premise: an iron vessel fell into the Svalich Woods carrying the Bloom; when it reached the font beneath Saint Andral's in Vallaki, it became the Seep. Strahd did not invite it, and that is the whole of his interest in it.
  - **0:** Session zero.
  - **1–2:** The Narrow House.
  - **3:** The Village of Barovia, and the Bloomed chapel.
  - **4:** Tser Pool and the cards.
  - **5:** The Iron Coffin.
  - **6:** Old Bonegrinder.
  - **7:** Vallaki.
  - **8:** The Bones of Saint Andral.
  - **9:** Beneath Saint Andral's.
  - **10:** The Hand-Warrens and the Undertow, ending on the Count's dinner invitation.
- **Each session has:**
  - a hook and a premise;
  - what to run from your book, and what the Flood Edition changes;
  - a read-aloud you can push to every player's screen;
  - scenes with checkable beats, a **one-tap dungeon build** and **one-tap encounters**;
  - the faces involved, loot, suggested clock ticks, an ending, levelling, notes, and a print button.

  **Nothing reprints the module** — run the locations from your own book.
- **The Dark Lord desk:**
  - clocks: the Count's patience, the Bloom tide (each quarter raises the Dread), Vallaki riot, Abbey mercy, Heart's rest;
  - places and their states, the gaze, day and weather;
  - the card reading, recorded so it is never lost;
  - Roll the night: omen, roadside, dinner, rumour, stain, plus counsel;
  - the faces, and how the Bloom hunts.

  Players never receive the desk.
- **`docs/curse-of-strahd-flood-edition.md`** is the whole guide as a document (`npm run campaign-doc` regenerates it).
- **52 more creatures** from the Battle Table: the Bloom (Sporeling, Bloom Vessel, Carrier Hulk, Cyst Node, Bloom Stalker, Bloomed Wolf), the Barovian originals (Barovian Wolf, Count's Wolf, Scarecrow Watcher, Night Spawn, Mist Thing, Grave Ghoul, Dinner Guest), and SRD 5.2 undead and folk, with new minis for each.
- **Seeded:** Bloom attacks can seed humanoids, who rise as Bloom Vessels next round unless healed or burned.
- **New floor looks:** the Narrow House, the Svalich Woods, the Iron Coffin, Old Bonegrinder, the Village of Barovia, Castle Halls. Each has its own campaign template.
- **Battle Table import:** real Battle Table saves come across. Levels become floors, pieces become rooms with shared walls, connections become doors, secret doors and openings, stairwells become stairs, and the roster lands on its level.

### Phase 4 — Make it beautiful (done)
1. **GLB models:** creature, hero and dungeon-kit (wall and floor) slots. They are kept in the browser's IndexedDB and sent to players; animations play.
2. **Textures:** procedural per floor look, with bump maps and wet roughness. Nothing to download.
3. **Post-processing:** bloom, film grain, vignette and colour fringe that worsen with the Dread. Torch shadows on High. Quality is set per device in the Table tab.
4. **Sound:** synthesised. A drone that thickens with the Dread, plus grinding on the Shift, bell tolls, hand-skitter, door creaks, trap clicks, hits and misses, Bloom bursts and whispers. The DM's sounds play on every player's device.
5. **Animated minis:** swaying tendrils and fingers, hands that climb walls, breathing, prowling wolves.

### The character creator (done)
- **On the start screen**, players use **Create a character**: SRD 5.2, 12 classes (each with its SRD subclass), 9 species, 4 backgrounds, levels 1–10.
  - Ability scores by standard array, point buy, manual entry, or 4d6.
  - Ability score increases, skills and expertise, armour, shield, weapons, fighting style and invocation.
  - Spells, with cantrip and prepared limits; subclass and species spells are added automatically.
  - A portrait, and the Session Zero questions (who they'd go back for, what they're ashamed of, why they walk into the fog, the smell of home).
  - A live character sheet as they build.
- **Heroes are kept in the player's browser.** When they join a table, the sheet is sent to the DM: the token appears with the right AC, HP, speed, initiative, per-ability saves, passive Perception, attacks, and castable spells.
- **Signing in.** Players type a name and a secret word on the start screen. The DM's campaign save remembers which sheets belong to whom (only a key made from the word is stored, never the word).
  - Next session, on any phone or computer, they join with the same name and word and choose **★ My characters at the DM's table**. With one character they're seated straight away; with several, they pick from their Your hero tab, which can also make a new character mid-session.
  - Their sheets are copied back into that browser, including any changes the DM made.
  - Locked sheets (🔒) can't be taken by someone else typing the same name. In Characters the DM can change a sheet's player, or **Unlock** it if someone forgets their word.
  - This is table-level privacy, not real accounts: there is no server, so the DM's browser (or an exported save) is where the characters live. Export the campaign now and then as a backup.
- **The player can level up** from their Your hero tab, and the DM's token updates while keeping damage.
- **The DM's Tokens tab → Characters** keeps every sheet in the campaign save. From there you can open it, edit it, place it, or create characters yourself.
- **New campaigns start with an empty party** (tick the demo-party box for Gribbles and friends).
- **Heroes' spells are buttons** on their card: save spells, area spells centred on a target, heals and auto-hits all resolve with the hero's own DC.

### Phase 5 — Deeper rules (done — see v0.6 above)
Still open, for later: concentration, upcasting damage, reactions (Shield, Hellish Rebuke) as prompts, auras as terrain (the Monstrosity of Hands, the Bloat-Mourner's slick trail), and a "Dread Zone switch" that brings back the old Dread levels and the Grasp hand when the campaign goes deep.

### Phase 6 — Harden multiplayer (done — see v0.7 above)
Later, maybe: a self-hosted relay in this repo (a tiny PeerJS server on Vercel/Fly), spectators (a read-only TV view that joins like a player), and end-to-end checks that players can't send moves for tokens they don't own (the DM's app already refuses them).

---

## Code map

```
index.html              page markup + all CSS
src/main.js             boot + the render loop (fog, flicker, mist, whispers)
src/debug.js            window.DreadDelve console handle (also used by the smoke tests)
src/util/core.js        dice, seeded random, tiny event bus
src/util/qr.js          invite links as QR codes (qrcode-generator)
src/game/library.js     your books in this browser (IndexedDB): merge at start-up, share the creator's part with the table, look up
src/util/wake.js        keep the TV and card-only phones awake (Screen Wake Lock)
src/data/               ← the content. Edit freely.
  dread.js              Strahd's Gaze 1–10 (look + rules + read-aloud), whispers, conditions
  legendary.js          legendary actions, Legendary Resistance and lair actions
  props.js              PROPS (furniture & scenery for the Build tab), footprints, which ones block / can be climbed / hopped
  objects.js            what furniture is made of (AC, HP), how heavy, what opens or topples, hidden-stash text
  session0.js           Session 0's hand-built maps: tavern, village, the Old Salt Road
  barovia-map.js        the Valley: places, roads, and what the road throws at travellers
  bestiary.js           FAMILIES, BESTIARY, default party
  looks.js              forged minis' parts, palettes, class styles and creature presets
  npc-starter.js        names, quirks and wants for Roll an NPC
  themes.js             floor themes (+ denizens, Grok prompts) and TEMPLATES
  rooms.js              room types & names, TRAP_KINDS, DOOR_STATES
  tables.js             the d100 Shift table and the Whim Die table (+ the effect list)
src/engine/             pure logic: no DOM, no Three.js, unit-tested
  state.js              state + ui, token factories, newState
  generator.js          floors, rooms, corridors, carve(), doors, traps, stairs, populate
  grid.js               movement (difficult terrain), line of sight, passive Perception
  importer.js           Battle Table / grid JSON / ASCII import, ASCII & JSON export
  tables.js             roll-table parser
  overland.js           the Valley: routes, journeys, and procedural stretches of road from modules
  encounter.js          XP budgets and the encounter generator
  look.js               a figure's recipe: from a sheet, a creature's preset (varied), an NPC roll; describeLook
  targeting.js          reach and range, cover (grid corner rule), area templates and who they catch
  movement.js           dragged routes, threat & opportunity attacks, following in marching order, formations, Close in
  castle.js             Castle Ravenloft's five hand-shaped floors (approach, halls, upper keep, dungeons, catacombs)
  dressing.js           furnishing generated rooms (kits in src/data/dressing.js, read-aloud in src/data/descriptions.js); locks, stashes, shelves over secret doors
  objects.js            furniture rules: beside, push / topple targets, damage, what a hero can do with a piece
  maps.js               the map library: who travels, packing a map for the shelf, where the party arrives
  fight.js              who's in a fight, initiative (grouped, surprise, real dice), victory and XP
  checks.js             checks & saves at the table: bonuses from a sheet, a roll against a DC, group checks
  library.js            your books: a compendium export (.prism) → spells, species, backgrounds, feats, subclasses, creatures, items (pure)
  spellcast.js          upcasting (dice per slot level from the higher-level text, extra rays) and the Concentration DC
  settlement.js         the Valley's places: villages, towns, Krezk, Berez, the camp, the vineyard, the lake, the hill, the tower
src/game/               rules that touch the scene and UI
  combat.js             initiative, attacks, damage, death hooks, the fx language, round-end Gaze effects
  shift.js              the Shift (rolls the d100 table)
  whim.js               the Whim Die
  resources.js          spell slots, class features, Hit Dice, short and long rests
  requests.js           players' attack / spell / feature requests and the DM's approval queue
  fights.js             rolling and placing an encounter
  noise.js              noise that carries to nearby creatures and the floors above and below
  moves.js              the party following, groups, Dash / Disengage / Dodge / Stand up, undo, opportunity-attack prompts, arrow keys
  npcgen.js             🎲 Roll an NPC: name, look, line, quirk, want; place as ally or foe
  rooms.js              read a room aloud, furnish by hand, the DM's prompt when the party enters a room
  overworld.js          travelling: set out, the road's events, arrive, enter a place
  actions.js            select, move (doors / traps), stairs, falling, doors, search, disarm, floors, dread
  objects.js            open / pick / force / push / topple / smash / swing furniture, stashes, the DM's prop edits
  asks.js               ask the table for a roll: the DM's bar, the phones' prompt, the reveal; notes passed to one player
  night.js              game night: driving the table screen, read-alouds, introductions, handouts, timer, real dice (the d20 prompt)
  maps.js               switching maps (shelve, restore, build), setting up without the party, the players' veil, moving the party
  build.js              Build tools, templates, populate, add/remove floors, import
  rules.js              movement allowance, conditions
  session.js            save / load / export, v1 save migration, undo, changed()
src/render/             Three.js
  scene.js              renderer, camera, lights, tweens, labels
  floors.js             stone, walls (or forest), stairs / exits, doors, traps, houses, props, mist, the Shift animation
  props.js              the 3D props, houses with roofs, the instanced pine
  minis.js              procedural 3D minis (SHAPES) + syncing tokens
  effects.js            selection ring, reach glow, pings, bursts, Build overlays
  ambience.js           candle and fire light from props, rain and snow outdoors
  forge/                forged minis: build.js (the jointed, sculpted figure), geo.js (shapes, skinning), mat.js (materials, rim light),
                        anim.js (stances, walk, actions, cloaks), studio.js (the creator's live stage, portraits)
  skyline.js            Castle Ravenloft on the horizon of every outdoor valley map, by compass bearing
src/net/table.js        multiplayer: host, join, reconnect, heartbeats, seats by identity, relay settings, invite links
src/engine/redact.js    what players are sent (the delve with the DM's secrets taken out)
src/audio/sound.js      synthesised drone and sound effects
src/data/campaign.js    Curse of Strahd: Flood Edition — sessions, clocks, faces, the night tables
src/data/bestiary-barovia.js  creatures ported from the Battle Table
src/data/srd.js         SRD 5.2 classes, species, backgrounds, weapons, armour; SPELLS = the library + table play
src/data/srd-spells.js  every SRD 5.2.1 spell, 0–9, with full text (generated by scripts/import-srd-spells.mjs; Codex's)
src/data/spell-play.js  the combat fields the table rolls with, over the faithful spell data
src/data/srd-features.js  the SRD text of every class feature, by the names the sheets use (Codex's)
src/data/srd-feats.js   the 17 SRD feats: category, prerequisite, text, flags (Codex's)
src/data/srd-items.js   SRD weapons, armour, tools, gear and 258 magic items (Codex's)
src/data/srd-monsters.js  all 330 SRD creatures in the bestiary format, family 'srd' (Codex's)
src/data/npc-starter.js names, Vistani names, quirks and wants for generated NPCs (Codex's)
src/engine/hero.js      character sheet → stats, attacks, spells, token (pure, tested)
src/game/campaign.js    building session dungeons, placing encounters, clocks, printing the guide
src/game/heroes.js      players' heroes (their browser) and the DM's character roster
src/ui/creator.js       the character creator
src/ui/valley.js        the Valley tab and its map (SVG)
src/ui/screen.js        the table screen for the TV (?screen): ribbon, party, follow camera, read-alouds, faces, handouts, lights out
src/ui/cards.js         card only: a player's phone at an in-person game (big buttons, target list, move pad)
src/net/screen.js       the table screen's local wire (BroadcastChannel) between the DM's window and the TV's
src/render/textures.js · post.js · models.js · gfx.js   Phase 4: textures, post-processing, GLB models, quality settings
src/ui/                 hud.js (top bar, dock, cards) · panels.js (tabs) · input.js (taps & drags) · events.js (buttons)
tests/engine.test.js · hero.test.js · overland.test.js · encounter.test.js · redact.test.js · movement.test.js · targeting.test.js · look.test.js · e2e/ (Playwright: npm run e2e)    node --test
```

## Adding a monster
Copy any entry in `src/data/bestiary.js`, or use **✎ Edit → Save as new creature** in the app. The useful levers:

- `shape` picks the mini: seepling, husk, templar, bloat, stalker, quill, bulwark, colossus, mind, undertow, hand, handmass, lich, wraith, bellghoul, weaver, candle, dwarf or vampire. Ask Claude Code for a new one if none fit.
- `attacks[].on` is a save-or-condition on hit, e.g. `{ save:'con', dc:12, cond:'paralyzed', rounds:1 }`. `latch:true` latches on (Host Seed).
- `pack:true` gives Pack Tide advantage.
- `specials` are buttons on the creature's card, written in the fx language:
  - `spawn:husk:2@corpse` (the `@` part is optional: `near`, `party`, `nest`, `corpse` or `random`)
  - `aoe:2:con:12:2d6:poison:poisoned` (radius in squares, save, DC, damage, type, condition); `aoeall` hits allies too
  - `party:str:13:1d6:bludgeoning:restrained:random` (the party on this floor saves; the condition can be `pit`)
  - `condall:seep:stunned:1` · `heal:2d10` · `heal:seep:2d10` · `shift` · `dread+1` (Gaze) · `whim:roll` · `whim+1` · `morph:quill` · `alert` · `whisper`
- `hooks.onDeath`, `hooks.onTurnStart` and `hooks.onBloodied` use the same fx language, plus `divide` and `unfinished`.

## Prompts that work well with Claude Code
- "Read DREAD-DELVE-ROADMAP.md. Put in the real stats for Gribbles: [paste sheet]."
- "Here is a Battle Table export [file]. Make the importer understand it."
- "Add a new monster: [paste your statblock]. Give it a new 3D shape that looks like …"
- "Make Phase 4 step 4 happen: a drone per Dread level and a grinding sound on Shift."
- "Automate legendary actions with a counter on the initiative bar."

Small asks, one at a time, and run `npm run dev` after each change to check it. Run `npm run build` when you're happy, so `dread-delve.html` is up to date.
