# ChatGPT prompt: ⛨ the twelve Callings and their Paths

- **If ChatGPT can write to the repository:** it opens a pull request from `chatgpt/callings` against `claude/dread-delve-v0.2`.
- **If it can't:** paste its reply (three files) back to Claude Code, which adds them, runs the tests and wires them in.

---

You're writing the heart of a big change in **Dread Delve**, a virtual tabletop and handheld-style game for a Curse of Strahd campaign. Dread Delve is growing out of D&D into its own game, made **in memory of Chance ("Dutcher", the Dutch Oven)**, who loved Halo and history. The D&D classes are being replaced by our own **Callings**: soldiers and warriors from every age, Halo's armoured far-future fighters alongside history's hoplites, huscarls and longbowmen, all pulled by the Mists into gothic Barovia.

**Read `docs/homebrew/callings.md` first.** It's the shared design: the premise, the twelve Callings, their chassis, their signatures and their three Paths each. Write what it describes. Then read `src/data/srd.js` (`CLASSES`: each class's `features` by level, its one subclass `sub`, and which features belong to the subclass: they're named `'<Subclass short>: <Feature>'`, e.g. `'Champion: Improved Critical'`).

Write exactly three files and nothing else:

1. `src/data/callings.js`: the twelve Callings and their 36 Paths (data)
2. `src/engine/callings.js`: reading them
3. `tests/callings.test.js`: tests

## Hard rules

- **Modern ES modules**, Node 22, no dependencies, no DOM, no `Math.random`.
- **Pure:** plain JSON in and out.
- **Imports:** the data imports nothing; the engine imports `../data/callings.js` and `../data/srd.js` (for `CLASSES`). The test imports the engine, the data and `../src/data/srd.js`.
- **Tests** use `node:test` and `node:assert/strict`.
- **All original.** Inspiration comes from roles and feel, never from names: nothing that belongs to the Halo games (none of its factions, species, characters, ships, vehicles, named weapons, places or catchphrases). History is everyone's. Gothic first: whatever the age, it's Barovia.
- Respectful: this is a memorial. Grim and heroic, never silly.

## The shape

```js
export const CALLINGS = {
  vanguard: {
    id:'vanguard', name:'Vanguard', chassis:'Fighter', emblem:'⛨', color:'#rrggbb',
    era:'far-future' | 'ancient' | 'medieval' | 'barovian' | 'any',
    blurb:'one or two sentences, under 220 characters: who they are',
    look:'a line for the hero creator\'s art and the 3D figure: armour, gear, bearing (under 200 characters)',
    signature:{ n:'Ward', text:'what it does, in plain rules words' },
    // a name and words for EVERY feature in CLASSES[chassis].features that isn't the subclass's own, 'Ability Score
    // Improvement' or 'Epic Boon': { [the D&D name]: { n:'our name', text:'what it does, our words, the same rules' } }
    rename:{ 'Second Wind':{ n:'Field Patch', text:'…' }, 'Action Surge':{ n:'…', text:'…' }, … },
    paths:[ /* exactly three, the third one seep:true */
      { id:'hoplite', name:'Hoplite', seep:false, blurb:'…',
        // features at the chassis's subclass levels (the levels where CLASSES[chassis].features has the subclass's own)
        features:{ 3:[ { n:'…', text:'…', mech:{ k:'…', … } } ], 7:[…], 10:[…], 15:[…], 18:[…] } },
      …,
      { id:'hollowed', name:'Hollowed', seep:true, blurb:'…', cost:'what the rot takes in return, in rules words', features:{ … } },
    ],
  },
  … // twelve in all, one per chassis: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard
};
export const MECHS = [ /* every mech kind you use, with the fields it takes (see below) */ ];
```

### `mech`: how a feature works in the game

Every Path feature has a `mech` that says how the game runs it, from this small vocabulary (Claude implements each kind once, and every feature that uses it works):
- `{ k:'text' }`: the DM runs it from the text (use sparingly: travel, talk, lore)
- `{ k:'like', feature:'Champion: Improved Critical' }`: works exactly like an existing D&D subclass feature of the same chassis (name it exactly as in `CLASSES`)
- `{ k:'tempHp', amount:'1d10+lvl', when:'bonus' | 'rest' | 'turnStart' | 'kill' }`
- `{ k:'ward', max:'lvl*2', recharge:'turnUnhurt' }` (a shield of temporary hit points that comes back)
- `{ k:'advantage', on:'attack' | 'save' | 'check', vs:'str' | … | 'frightened' | … , when:'…' }`
- `{ k:'resist', types:['necrotic', …], when:'always' | 'fury' | … }`
- `{ k:'extraDamage', dice:'1d6', type:'…', when:'firstHitEachTurn' | 'crit' | 'vsSeep' | … }`
- `{ k:'heal', amount:'2d8+wis', range:5, uses:'pb/longRest' }`
- `{ k:'aura', radius:10, gives:{ k:'advantage' | 'resist' | 'save', … } }`
- `{ k:'reaction', trigger:'allyHit' | 'allyDown' | 'missed' | …, does:{ … another mech … } }`
- `{ k:'summon', what:'spore-form' | 'wolf' | 'ghostlight' | …, hp:'5*lvl', lasts:'1min' }`
- `{ k:'move', feet:10, when:'…', provokes:false }`
- `{ k:'seepCost', what:'…' }` (combine with another in `also:[…]`: the price a Seep-touched feature takes)

You may add **at most five** new kinds if a feature truly needs one, each listed in `MECHS` with its fields and a sentence on how it works.

### The Seep-touched Paths (our Flood parallels)

The third Path of every Calling draws on the Seep, the rot that spreads through Barovia in this campaign: it infects, it grows, it remembers, and **the Chorus**, the mind of the rot, speaks through it. These Paths are strong and always cost something (`cost`, and `seepCost` on the features that take it): a hit point maximum that shrinks until a long rest, a creeping mark that the faithful see, a voice that asks for things, a chance the rot acts on its own. Make each one a different kind of horror. The **Seepbound** (the Warlock chassis) is the Calling that goes all the way: its whole pact is with the Chorus.

## `src/engine/callings.js`

Export:
- `callingList()`: the twelve, in a sensible order for a picker: `[{ id, name, chassis, emblem, color, era, blurb }]`
- `callingOf(hero)`: the Calling for a hero (`hero.calling`), or `null` (a classic D&D hero)
- `callingForChassis(chassis)`: the Calling that stands on that D&D class
- `featureView(callingId, ddName)`: `{ n, text }`, our name for a chassis feature (subclass features and anything unknown come back as `{ n:ddName, text:'' }`)
- `pathOf(callingId, pathId)` and `pathFeatures(callingId, pathId, lvl)`: the Path's features up to that level, in level order
- `featuresAt(hero)`: everything the hero has at their level, in our words: `[{ lvl, n, text, mech, from:'calling' | 'path' }]` (`hero = { calling, path, lvl }`)
- `validateCallings()`: `[]` when all's well, else a list of problems (used by the tests and a debug page)

## `tests/callings.test.js`

Prove:
- exactly twelve Callings, one per chassis, every chassis a real `CLASSES` key; ids, names and every Path id unique
- every Calling renames **every** non-subclass feature of its chassis (other than 'Ability Score Improvement' and 'Epic Boon'), and no name is a D&D class, subclass or feature name
- three Paths each, the third `seep:true` with a `cost`; every Path has features at exactly the chassis's subclass levels
- every `mech` uses a kind in the vocabulary or in `MECHS`; every `like` names a real subclass feature of that chassis
- texts under 500 characters, blurbs under 220, colours `#rrggbb`
- none of these words appears anywhere (case-insensitive, whole words): Master Chief, Covenant, Cortana, Spartan, Sangheili, Unggoy, Jiralhanae, Gravemind, Forerunner, UNSC, ODST, Warthog, Pelican, Needler, Halo, Flood, Arbiter, Guilty Spark, Mjolnir
- `featuresAt` gives a level 5 Vanguard of the Hoplite Path its Calling's and Path's features, in our words, and nothing past level 5; nothing throws on `null`, `{}` or an unknown id

## What Claude will do with it

The hero creator will offer the Callings in place of the classes (Muse is building the picker), a hero's sheet and the fights will show our names and words, each `mech` kind will be made to work in the game, and the D&D classes will stay behind a "Classic" switch until the Callings are complete. Make a player say "I'm a Hoplite" the way they'd once have said "I'm a Fighter", and mean more by it.
