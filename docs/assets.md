# Art assets: what's free to use, and where it would help

Everything in Dread Delve is drawn in code today. That covers the floors' textures, the props, and the forged minis. The app also already takes your own 3D models: drop a `.glb` onto a creature or a hero, or onto the dungeon kit's wall and floor slots (Tokens / Build tabs). It's kept in that browser and sent to the players when they join.

This note lists asset sources whose licences let us **ship them inside a public app**. It also says what each would improve and how it would plug in.

## The licence rule

The app is public (GitHub plus Vercel), so anything bundled into it is redistributed. Use one of these:
- **CC0** (public domain): no strings. Preferred.
- **CC BY**: fine with credit. Add the credit to the in-app Help and to this file.

Don't bundle assets whose licence is "personal use" or "no redistribution". That includes most Patreon VTT packs (Forgotten Adventures, Tom Cartos, 2-Minute Tabletop) and anything from D&D Beyond or the books. The DM can still load those privately through the model slots, since they stay in their own browser.

## Sources worth using

| Source | Licence | What it has | Where it helps |
|---|---|---|---|
| **KayKit** (Kay Lousberg) — *Dungeon Remastered*, *Furniture Bits*, *Skeletons*, *Adventurers* | CC0 | Low-poly glTF/FBX/OBJ: dungeon walls and floors, doors, chests, barrels, tables, beds, bar pieces, rigged skeletons and adventurers | Swap our boxy props for sculpted ones, piece by piece (`src/render/props.js`). Dungeon kit wall and floor slots. Skeleton minis. |
| **Quaternius** — *Universal Animation Library* (1 & 2), *Ultimate Modular Dungeon*, monster packs | CC0 | A humanoid rig with 120+ animations (walk, run, attack, cast, hit, death, sit, crawl), modular dungeon pieces, stylised monsters | **The biggest win for the forge.** Retarget its walk, attack and death clips onto the forged figures' bones (`src/render/forge/anim.js`) instead of hand-keyed poses. Monster minis. |
| **Kenney** — *Modular Dungeon Kit*, *Furniture Kit*, *Graveyard Kit* | CC0 | glTF/OBJ dungeon pieces, furniture, gravestones, fences, crypt bits | Props, the Barovia village and graveyard dressing. |
| **Poly Haven** | CC0 | PBR textures (stone, wood, plaster, mud), HDRI skies, some models | Real stone and timber for floors and walls (`src/render/textures.js` paints them now). A night HDRI for the outdoor reflections. |
| **ambientCG** | CC0 | 2,000+ PBR materials, with a public download API | Same as Poly Haven, bigger choice: flagstones, cobbles, rotten planks, cave rock. |
| **game-icons.net** | CC BY 3.0 | 4,000+ fantasy icons (SVG) | Condition, spell and item icons in the cards and the creator, instead of emoji. Credit required. |

## How it would plug in (Claude's side)

1. **Hosted pack, not baked in.** `dread-delve.html` is one file of about 1.5 MB. Models and textures would make it 20–50 MB, which is slow on a phone over mobile data. Better: put an `assets/` folder beside it on Vercel, loaded on demand and cached. The page would still work offline with today's drawn-in-code look if the pack can't load.
2. **Props first.** Each prop key (`chest`, `bookshelf`, `barrel`…) maps to a glTF from KayKit or Kenney, scaled to our squares. The code-drawn piece stays as the fallback. The new open, broken and toppled states still apply: lids are separate nodes in those kits, so they can still swing open.
3. **Textures second.** Swap the painted floor and wall patterns for 1K PBR sets per theme (crypt, castle, mine, village), tinted by the theme colours as now.
4. **Forge animation third.** Map the Quaternius rig's bones onto the forged figure's skeleton, and play its clips through the existing action calls (`attack`, `cast`, `hit`, `death`, walking).

## What's in the app now
- **KayKit Dungeon Remastered** (Kay Lousberg, CC0): barrel, kegs, crate, chest (its lid opens), table, long table, chair, stool, bed, candelabra and the crypt's pillar, in `public/assets/props/kaykit/` with the pack's `LICENSE.txt`. Mapped in `src/data/prop-models.js`, loaded on demand by `src/render/propmodels.js`; served beside the app on Vercel, so the single file stays small. The offline file keeps the drawn props. Each device can turn them off (Table tab → 3D models).
- **KayKit Halloween Bits** (CC0): gravestone, roadside shrine, bench and dead tree, and below ground the coffin (its lid slides aside when it's opened) and bones (a ribcage), in `public/assets/props/halloween/`. Sarcophagi, banners, shelves, braziers and rubble stay drawn: they open their own way, hang, hold books, glow, or (the pack's rubble) stand as tall as a wall.
- **KayKit Medieval Hexagon** (CC0): wooden fence, dry-stone wall, wheelbarrow (the hand cart), sacks, a lumber pile and a boulder, in `public/assets/props/hexagon/`. Its buildings are bright game pieces on hex tiles, so they're left out; lanterns, lampposts and tents stay drawn (the drawn lanterns glow).
- All fetched from KayKit's public GitHub repositories (the itch.io download refuses automated clients).

## Licence and credit list (keep it current)
- KayKit — Kay Lousberg, CC0 — kaylousberg.itch.io
- Quaternius — CC0 — quaternius.com
- Kenney — CC0 — kenney.nl
- Poly Haven — CC0 — polyhaven.com
- ambientCG — CC0 — ambientcg.com
- game-icons.net — CC BY 3.0 — credit each icon's author as the site lists them
