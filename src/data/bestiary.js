/* ---------------------------------------------------------------------
   BESTIARY — 2024-style condensed stat lines.
   attacks: n=name b=to-hit d=damage dice t=type f=flair ({A}=attacker {T}=target)
            on:{ save, dc, cond, rounds }  -> on a hit the target saves or gains the condition
            latch:true                     -> the attacker latches on (Seepling Host Seed)
   pack:true  — Pack Tide: advantage when another Seep is within 5 ft. of the target
   specials: buttons on the token card. fx language:
     spawn:<id>:<count or dice>[@near|party|nest|corpse|random]
     aoe:<radius sq>:<save|none>:<dc>:<dice>:<type>[:<condition>]   aoeall:(same, hits allies too)
     save:<ability>:<dc>:<condition>[:all|random]   — party on this floor saves or gains the condition
     condall:<tag>:<condition>:<rounds>              — every creature with that tag on the floor
     heal:<dice>   shift   dread+1   dread-1   morph:<id>   grasp:roll   grasp+1   grasp-1   alert
   hooks.onDeath / onTurnStart / onBloodied (first drop to half HP): lists of fx, plus 'divide' and 'unfinished'
   shape: which 3D mini to build (render/minis.js)   size: squares wide
   look: written appearance (feeds your art)   prompt: Grok prompt
   --------------------------------------------------------------------- */
import { BAROVIA } from './bestiary-barovia.js';

export const FAMILIES = {
  seep:   { label:'The Seep',            cls:'fam-seep',   blurb:'When Saint Andral\'s bones were stolen, the font beneath the church kept running — and what ran down into the silver mine was not water. The Seep is a parasite-tide: it takes the dead, bloats inside the living, reshapes its biomass into whatever the hunt needs, and drains every scrap of flesh and memory toward a growing mind at the bottom of the mine. Infection forms seed hosts; hosts become Husks; Husks feed Carriers; Carriers birth more seed. Kill the mind or burn everything.' },
  andral: { label:'Andral\'s Labyrinth', cls:'fam-andral', blurb:'The lich-saint\'s own defences — the hands that never stop coming, and the saint himself, still praying over a font that has turned against him. The Seep wants his mind more than anything else down here.' },
  dread:  { label:'Barovian Undead',     cls:'fam-dread',  blurb:'Fresh horrors of the Dread Zone — what Barovia grows in the dark when the sun is summoned above it.' },
  bloom:  { label:'The Bloom',           cls:'fam-seep',   blurb:'What climbed out of the Iron Coffin when it came down burning in the Svalich Woods. Above ground they call it the Bloom; once it reached the font beneath Saint Andral\'s it became the Seep. Same hunger. Sweet rot, a cough that is not a cough, flies that will not land. Seeded humanoids rise as Vessels unless burned or blessed.' },
  barovia:{ label:'Barovia',             cls:'fam-dread',  blurb:'The valley\'s own: the Count\'s wolves, the dead that walk because he allows it, hags, mist and scarecrows. The Count is the weather. The Bloom is the insult.' },
  folk:   { label:'Folk & Foes',         cls:'fam-andral', blurb:'People: villagers, guards, cultists, knights, priests and the rest — the hosts the Bloom wants most.' },
};

export const BESTIARY = [
  // ----------------------------- THE SEEP -----------------------------
  { id:'seepling', fam:'seep', name:'Seepling', cr:'1/2', ac:12, hp:'2d4+1', speed:30, spd:'30 ft., climb 30 ft.', init:2, size:1,
    shape:'seepling', color:'#7d8a46', eye:'#c6ff5a', tags:['seep'], pack:true,
    attacks:[{n:'Latch', b:4, d:'1d4+2', t:'piercing', latch:true, f:'{A} skitters up {T} and finds bare skin.'}],
    traits:['<b>Host Seed.</b> A creature reduced to 0 HP while a Seepling is latched to it rises as a Seep-Husk at the start of the next round unless it gets magical healing first. <i>(Automatic.)</i>',
            '<b>Pack Tide.</b> Advantage on attacks against a creature that another Seep is within 5 ft. of. <i>(Automatic.)</i>',
            '<b>Burst Sac.</b> Dies to any damage of 5 or more from a single hit — and spatters.'],
    look:'A palm-sized sac of grey-green membrane on six hooked filaments, pulsing with a wet inner glow. It smells of old church water and copper pennies.',
    prompt:'grimdark fantasy creature, palm-sized parasitic sac of translucent grey-green membrane on six hooked filament legs, sickly inner glow, crawling on wet stone in a silver mine, gothic horror, torchlight, highly detailed' },

  { id:'husk', fam:'seep', name:'Seep-Husk', cr:'2', ac:13, hp:'5d8+10', speed:30, spd:'30 ft.', init:1, size:1,
    shape:'husk', color:'#5d6b4a', eye:'#c6ff5a', tags:['seep'],
    attacks:[{n:'Lash', b:5, d:'1d8+3', t:'bludgeoning', f:'A ropy limb bursts from {A}\'s sleeve and whips across {T}.'},
             {n:'Host\'s Weapon', b:5, d:'1d10+3', t:'slashing', f:'{A} still remembers the swing. The arm doing it does not.'}],
    traits:['<b>Multiattack.</b> Lash and Host\'s Weapon.',
            '<b>Unfinished Death.</b> The first time it drops to 0 HP from anything but radiant or fire damage, it falls — and rises at 1 HP on its next turn. <i>(Automatic.)</i>',
            '<b>Keeps Its Kit.</b> It wears whatever the host wore. Raise AC for armored hosts.',
            '<b>Ballast.</b> When it finally dies, a Seepling may be hiding in the chest cavity (DM: 1 in 3).'],
    hooks:{ onDeath:['unfinished'] },
    look:'A dead miner or pilgrim split open at the ribs, grey-green tendrils knitting through the wound and out of the fingertips. The head lolls, the jaw hangs — but the eyes still track you.',
    prompt:'grimdark horror, reanimated dead silver miner split open at the chest, grey-green parasitic tendrils threading out of the wound and fingertips, lolling head, still holding a rusted pick, dark mine tunnel, Ravenloft, painterly concept art' },

  { id:'husktemplar', fam:'seep', name:'Husk-Templar', cr:'4', ac:18, hp:'8d8+24', speed:30, spd:'30 ft.', init:0, size:1,
    shape:'templar', color:'#6d7560', eye:'#c6ff5a', tags:['seep'],
    attacks:[{n:'Taken Longsword', b:6, d:'2d8+3', t:'slashing', f:'{A} brings the blade down in a perfect templar\'s cut. The tendrils in its wrists did that, not the knight.'},
             {n:'Shield Bash', b:6, d:'1d6+3', t:'bludgeoning', on:{ save:'str', dc:14, cond:'prone', rounds:1 }, f:'{A} drives its shield of St. Andral into {T}.'}],
    traits:['<b>Multiattack.</b> Two Taken Longsword attacks, or one and a Shield Bash.',
            '<b>Unfinished Death.</b> As Seep-Husk. <i>(Automatic.)</i>',
            '<b>Shield Wall (Reaction).</b> When a Seep creature within 5 ft. is hit, add +3 to its AC against that attack.',
            '<b>Oathbroken Plate.</b> Silvered weapons ignore its armor: it is AC 13 against them.'],
    hooks:{ onDeath:['unfinished'] },
    look:'A knight of the church still in tarnished plate stamped with Andral\'s silver sunburst. Grey-green growth has burst the visor open from inside, and tendrils grip the sword hilt where the gauntlet has rotted through.',
    prompt:'grimdark horror, undead church knight in tarnished silver-stamped plate armor, visor burst open by grey-green parasitic growth, tendrils gripping a longsword, cracked kite shield with a silver sunburst, flooded crypt, Ravenloft, painterly concept art' },

  { id:'bloat', fam:'seep', name:'Bloat-Mourner', cr:'1', ac:9, hp:'4d10+4', speed:15, spd:'15 ft.', init:-2, size:1,
    shape:'bloat', color:'#8b8a5a', eye:'#c6ff5a', tags:['seep'],
    attacks:[{n:'Smother', b:3, d:'1d6+1', t:'bludgeoning', on:{ save:'con', dc:11, cond:'poisoned', rounds:1 }, f:'{A} leans its swollen weight onto {T}, humming a funeral hymn.'}],
    traits:['<b>Gravid.</b> When it dies it bursts: each creature within 10 ft. makes a DC 12 Con save (2d6 poison, half on success), and 1d4+1 Seeplings spill out. <i>(Automatic.)</i>',
            '<b>Weeping Gait.</b> It leaves a slick trail; the squares it passes through are difficult terrain until the end of the round.',
            '<b>Carrier.</b> It walks toward the party, not away. It wants to be popped.'],
    hooks:{ onDeath:['aoeall:2:con:12:2d6:poison','spawn:seepling:1d4+1'] },
    look:'A swollen mourner in a sodden funeral shawl, belly distended to bursting with sloshing, glowing ichor. Its mouth is sealed with membrane, but it still hums the hymn.',
    prompt:'horror creature, bloated corpse of a village mourner in a soaked black funeral shawl, grotesquely swollen glowing green belly, mouth sealed by membrane, shuffling through a flooded crypt, gothic horror, painterly' },

  { id:'stalker', fam:'seep', name:'Hollowstalker', cr:'5', ac:15, hp:'9d8+27', speed:40, spd:'40 ft., climb 40 ft.', init:4, size:1,
    shape:'stalker', color:'#6f7a52', eye:'#d8ff7a', tags:['seep'],
    attacks:[{n:'Claw', b:7, d:'2d6+4', t:'slashing', f:'{A} comes off the wall at {T} like something thrown.'}],
    traits:['<b>Multiattack.</b> Three Claws.', '<b>Wall-Runner.</b> Moves along walls and ceilings without slowing.',
            '<b>Reshape (Bonus Action).</b> Becomes a Quill-Choir or an Ossuary Bulwark, keeping its damage.',
            '<b>Hunting Shape.</b> Invisible while motionless in dim light until it attacks.'],
    specials:[{n:'Reshape: Quill-Choir', fx:'morph:quill'},{n:'Reshape: Bulwark', fx:'morph:bulwark'}],
    look:'A long, low thing of stretched membrane over borrowed bones, too many joints in each limb, a head that is mostly jaw. It moves on the ceiling by preference.',
    prompt:'grimdark creature, long low predator of stretched grey-green membrane over mismatched human bones, too many joints in each limb, eyeless head that is mostly jaw, clinging to a mine ceiling, horror concept art' },

  { id:'quill', fam:'seep', name:'Quill-Choir', cr:'4', ac:14, hp:'8d8+16', speed:10, spd:'10 ft.', init:0, size:1,
    shape:'quill', color:'#7a7f4e', eye:'#e3ff8a', tags:['seep'],
    attacks:[{n:'Spine Volley (120 ft.)', b:6, d:'2d8+3', t:'piercing', f:'The choir sings one note and {A} empties a volley of bone quills into {T}.'}],
    traits:['<b>Multiattack.</b> Two Spine Volleys.', '<b>Rooted.</b> While rooted, it can\'t be moved against its will.',
            '<b>Many Throats.</b> It sings in the voices of those the Seep has taken.'],
    specials:[{n:'Reshape: Stalker', fx:'morph:stalker'}],
    look:'A pulsing bulb on a fleshy stalk, bristling with bone quills, each quill hole a tiny mouth singing a different hymn.',
    prompt:'horror creature, pulsing membrane bulb on a fleshy stalk rooted to cave floor, bristling with long bone quills, small singing mouths between the quills, sickly green glow, gothic horror concept art' },

  { id:'bulwark', fam:'seep', name:'Ossuary Bulwark', cr:'7', ac:17, hp:'12d10+48', speed:25, spd:'25 ft.', init:-1, size:2,
    shape:'bulwark', color:'#6a6a4c', eye:'#c6ff5a', tags:['seep'],
    attacks:[{n:'Slam', b:9, d:'3d10+5', t:'bludgeoning', on:{ save:'str', dc:16, cond:'prone', rounds:1 }, f:'{A} brings down an arm made of six arms. {T} is underneath it.'}],
    traits:['<b>Bone Wall (Reaction).</b> +4 AC to an ally within 5 ft. against one attack.', '<b>Siege Mass.</b> Double damage to objects and structures.'],
    specials:[{n:'Reshape: Stalker', fx:'morph:stalker'}],
    look:'A hulking mound of many bodies fused and armored with ribcages and skull-plates, two enormous arms built from bundled limbs.',
    prompt:'massive horror brute fused from many corpses, armored with ribcages and skull plates, two enormous arms made of bundled limbs, grey-green membrane binding it, mine cavern, grimdark concept art' },

  { id:'colossus', fam:'seep', name:'Reliquary Colossus', cr:'12', ac:18, hp:'16d12+80', speed:30, spd:'30 ft.', init:0, size:3,
    shape:'colossus', color:'#5e624a', eye:'#ff6a3a', tags:['seep','boss'],
    attacks:[{n:'Reliquary Fist', b:11, d:'4d10+6', t:'bludgeoning', on:{ save:'str', dc:19, cond:'prone', rounds:1 }, f:'{A} swings a fist with a whole reliquary fused into the knuckles. {T} is in the way.'},
             {n:'Bone Lance (60 ft.)', b:11, d:'3d12+6', t:'piercing', f:'{A} tears a fused spine out of its own back and throws it at {T}.'}],
    specials:[{n:'Shockwave Stomp', fx:'aoe:2:dex:18:4d8:thunder:prone', f:'It lifts the whole of itself and comes down. The floor ripples like water.'},
              {n:'Shed Biomass', fx:'spawn:husk:2', f:'Two bodies peel off its flank, unfold, and stand.'}],
    traits:['<b>Multiattack.</b> Two Reliquary Fists, or one Fist and a Bone Lance.',
            '<b>Juggernaut.</b> It moves through Medium creatures as difficult terrain; they make a DC 18 Str save or are knocked prone.',
            '<b>Seep Engine.</b> When it dies it comes apart into two Hollowstalkers. <i>(Automatic.)</i>',
            '<b>Silver Reliquaries.</b> Silvered and radiant damage against it ignore resistance.'],
    hooks:{ onDeath:['spawn:stalker:2'] },
    look:'Three times a man\'s height and built out of the Seep\'s whole harvest — dozens of bodies braided into a war-shape, silver reliquaries and church bells grown into its shoulders like armor plates, a single furnace-orange eye in a chest of fused ribs.',
    prompt:'colossal parasite juggernaut built from dozens of fused corpses, silver reliquaries and church bells grown into its shoulders as armor, single glowing orange eye in a ribcage chest, grey-green membrane, flooded cavern, grimdark epic concept art' },

  { id:'mind', fam:'seep', name:'The Budding Mind', cr:'10', ac:14, hp:'15d10+45', speed:0, spd:'0 ft. (rooted)', init:3, size:2,
    shape:'mind', color:'#6b6a48', eye:'#ffcf5a', tags:['seep','boss'],
    attacks:[{n:'Tendril Lash (reach 15 ft.)', b:9, d:'3d8+5', t:'bludgeoning', on:{ save:'str', dc:17, cond:'grappled', rounds:1 }, f:'A tendril as thick as a man unspools from {A} and wraps {T}.'}],
    specials:[{n:'Psychic Hymn', fx:'aoe:6:wis:17:5d8:psychic:frightened', f:'"We were afraid too. Then we were together."'},
              {n:'Command the Tide', fx:'alert', f:'Every Seep creature on this floor turns its head at once — and starts moving toward the Mind\'s enemies.'},
              {n:'Call the Seep', fx:'spawn:seepling:3'}, {n:'Birth a Husk', fx:'spawn:husk:1@corpse'}],
    traits:['<b>Proto-Mind.</b> The Undertow in miniature — a mind still growing. Seep creatures within 60 ft. have advantage on saves against being charmed or frightened.',
            '<b>Overmind Link.</b> When it dies, every Seep creature on this floor is stunned until the end of its next turn. <i>(Automatic.)</i>',
            '<b>Speaks With the Taken.</b> It talks — reasonably, warmly — in the voices of the people it has eaten. It will bargain.',
            '<b>Legendary (2/round).</b> Tendril Lash · Call the Seep (costs 2).'],
    hooks:{ onTurnStart:['spawn:seepling:1@nest'], onDeath:['condall:seep:stunned:1'] },
    look:'A wet, wrinkled mound the size of a cart, folded like a brain and sheathed in translucent membrane. Faces press outward from inside it, mouths moving. Feeding tendrils run from it into every wall of the chamber.',
    prompt:'grotesque proto-hivemind, cart-sized wrinkled brain-like mass sheathed in translucent grey-green membrane, human faces pressing outward from inside, feeding tendrils running into the walls of a flesh-covered cavern, bioluminescent glow, cosmic horror concept art' },

  { id:'undertow', fam:'seep', name:'The Undertow', cr:'16', ac:16, hp:'20d12+120', speed:0, spd:'0 ft. (rooted)', init:2, size:3,
    shape:'undertow', color:'#4f5a3a', eye:'#ff5a5a', tags:['seep','boss'],
    attacks:[{n:'Tide Lash (reach 30 ft.)', b:12, d:'4d10+6', t:'bludgeoning', on:{ save:'str', dc:20, cond:'restrained', rounds:1 }, f:'A rope of fused bodies uncoils from {A} and drags {T} across the floor.'}],
    specials:[{n:'Mind-Flood', fx:'aoe:12:wis:20:4d10:psychic:stunned', f:'Every voice it has ever stolen speaks at once.'},
              {n:'Call the Seep', fx:'spawn:seepling:3'}, {n:'Birth a Husk', fx:'spawn:husk:1@corpse'},
              {n:'Swallow the Halls', fx:'shift', f:'The Undertow inhales. The whole floor bends toward it.'}],
    traits:['<b>The Many Speak.</b> It talks in the voices of everyone it has absorbed — including people the party knew.',
            '<b>Legendary (3/round).</b> Tide Lash · Call the Seep · Mind-Flood (costs 3).',
            '<b>Tidal Heart.</b> Each turn a new Seepling buds from its trunk. <i>(Automatic.)</i>',
            '<b>All Flesh Returns.</b> Seep creatures that die within 60 ft. heal it for 10 HP.',
            '<b>Lair (initiative 20).</b> The water rises (difficult terrain everywhere) · a corpse rises as a Husk · the halls shift.'],
    hooks:{ onTurnStart:['spawn:seepling:1'], onBloodied:['dread+1','spawn:husk:2'] },
    look:'A cathedral-sized knot of fused corpses and membrane anchored to the deepest floor of the mine. Dozens of mouths open along its trunk, each speaking with a stolen voice.',
    prompt:'colossal cosmic horror hive-mind, cathedral-sized mass of fused corpses and grey-green membrane rooted in a flooded cavern, dozens of mouths along a central trunk, tendrils of bodies, sickly green and blood-red glow, Ravenloft, epic dark fantasy painting' },

  // --------------------------- ANDRAL'S LABYRINTH ---------------------------
  { id:'handswarm', fam:'andral', name:'Hand-Swarm', cr:'1', ac:12, hp:'4d8', speed:30, spd:'30 ft., climb 30 ft.', init:3, size:1,
    shape:'hand', color:'#d9cdb8', eye:'#ffffff', tags:['hands'],
    attacks:[{n:'Grasp', b:4, d:'2d4+2', t:'bludgeoning', on:{ save:'str', dc:12, cond:'grappled', rounds:1 }, f:'Fingers close around {T}\'s ankle. Then the wrist. Then the throat.'}],
    traits:['<b>Endless Division.</b> When it dies, roll a d6: on 5–6, two more Hand-Swarms crawl up out of the earth nearby. <i>(Automatic.)</i>',
            '<b>Feeds the Grasp.</b> Each Hand that dies to anything but radiant damage steps the Grasp Die up. <i>(Automatic.)</i>'],
    hooks:{ onDeath:['divide'] },
    look:'A scuttling mass of severed, grey-pale hands moving like crabs, nails black with grave dirt.',
    prompt:'horror swarm of severed pale human hands scuttling like crabs across a crypt floor, black grave-dirt fingernails, candlelight, Ravenloft, dark fantasy concept art' },

  { id:'handmass', fam:'andral', name:'Monstrosity of Hands', cr:'9', ac:15, hp:'15d10+45', speed:30, spd:'30 ft., climb 30 ft.', init:2, size:2,
    shape:'handmass', color:'#cfc1a9', eye:'#ffffff', tags:['hands','boss'],
    attacks:[{n:'Crushing Grip', b:9, d:'3d8+5', t:'bludgeoning', on:{ save:'str', dc:17, cond:'grappled', rounds:2 }, f:'A hundred hands take hold of {T} at once.'},
             {n:'Fling', b:9, d:'3d6+5', t:'bludgeoning', on:{ save:'dex', dc:17, cond:'prone', rounds:1 }, f:'{A} passes {T} hand over hand over hand — and throws.'}],
    specials:[{n:'Endless Division', fx:'spawn:handswarm:2'},
              {n:'Rising Tide of Fingers', fx:'aoe:2:str:16:3d6:bludgeoning:restrained', f:'The floor around it becomes a field of reaching fingers.'},
              {n:'Clench the Grasp', fx:'grasp:roll', f:'Every hand in the labyrinth tightens at once.'}],
    traits:['<b>Multiattack.</b> Three Crushing Grips; it can hold up to four creatures. One Grip can be a Fling instead.',
            '<b>Endless Division.</b> At the start of each of its turns a Hand-Swarm claws up through the earth beside it. <i>(Automatic.)</i>',
            '<b>Killing a hand does nothing.</b> Resistant to bludgeoning, piercing and slashing; vulnerable to radiant and fire.',
            '<b>Heart of the Grasp.</b> While it lives, the Grasp Die is rolled twice and the higher result is used. <i>(Automatic.)</i>',
            '<b>Grasping Aura.</b> Squares within 10 ft. of it are difficult terrain for everyone else.'],
    hooks:{ onTurnStart:['spawn:handswarm:1'], onDeath:['grasp-1','grasp-1'] },
    look:'A rolling mound of hundreds of hands gripping one another, fingers constantly reaching outward.',
    prompt:'gigantic horror mound made of hundreds of pale human hands gripping each other, fingers reaching outward, rolling through a crypt corridor, silver mine, Ravenloft, dark fantasy concept art' },

  { id:'andral', fam:'andral', name:'Saint Andral, the Silver Lich', cr:'21', ac:18, hp:'24d8+120', speed:30, spd:'30 ft.', init:5, size:1,
    shape:'lich', color:'#9aa0b4', eye:'#cfe8ff', tags:['boss','undead'],
    attacks:[{n:'Sacred Rot', b:12, d:'4d8+4', t:'necrotic', on:{ save:'con', dc:20, cond:'no healing', rounds:1 }, f:'{A} lays a saint\'s blessing on {T}. It rots.'},
             {n:'Hallowed Ray (120 ft.)', b:12, d:'4d10+5', t:'radiant', f:'Light the colour of tarnished silver pours from {A}\'s eye sockets into {T}.'}],
    specials:[{n:'Nail Storm', fx:'aoe:4:dex:20:6d8:piercing', f:'The halo of silver nails flies apart and comes back through everyone.'},
              {n:'Benediction of Rot', fx:'aoe:6:con:20:8d8:necrotic:no healing', f:'He raises both hands in blessing. The blessing is the wrong one.'},
              {n:'Raise the Faithful', fx:'spawn:handswarm:2@party', f:'The hands of everyone ever buried beneath his church answer the call.'},
              {n:'Reorganize Sector', fx:'shift', f:'The saint gestures. The labyrinth obeys.'},
              {n:'Clench the Grasp', fx:'grasp:roll'}],
    traits:['<b>Multiattack.</b> Two attacks, in any combination.',
            '<b>Legendary Resistance (3/day).</b> When he fails a save, he can succeed instead.',
            '<b>Radiant-Necrotic Duality.</b> Whichever of the two he takes, he answers with the other: his next attack deals that type as the opposite.',
            '<b>Rejuvenation.</b> While his stolen bones are not returned to the font, he reforms in 1d10 days in the Shrine of the Font.',
            '<b>Turn Resistance.</b> Advantage on saves against effects that turn undead.',
            '<b>Half-Taken.</b> The first time he drops to half HP, the Seep in his marrow wakes and he becomes Saint Andral, Half-Taken. <i>(Automatic.)</i>',
            '<b>Legendary (3/round).</b> Hallowed Ray · Nail Step (teleport 30 ft.) · Reorganize Sector (costs 3).',
            '<b>Lair (initiative 20).</b> Roll the Grasp Die · the font floods one room (DC 18 Str or restrained) · one door seals itself.'],
    hooks:{ onBloodied:['morph:andral2','dread+1'] },
    look:'A gaunt saint in tarnished silver vestments, skin like old candle wax, a halo of floating silver nails.',
    prompt:'lich saint in tarnished silver priestly vestments, gaunt waxen face, eyes of pale silver light, halo of floating silver nails, ruined silver mine cathedral, Ravenloft, dark fantasy portrait, painterly' },

  { id:'andral2', fam:'andral', name:'Saint Andral, Half-Taken', cr:'22', ac:16, hp:'24d8+120', speed:40, spd:'40 ft., climb 40 ft.', init:5, size:1,
    shape:'lich', color:'#7e8c6a', eye:'#c6ff5a', tags:['boss','undead','seep'],
    attacks:[{n:'Rot-Silver Claw', b:13, d:'4d10+6', t:'necrotic', latch:true, on:{ save:'con', dc:21, cond:'poisoned', rounds:1 }, f:'Something that used to be {A}\'s hand opens into tendrils around {T}.'},
             {n:'Corrupted Ray (120 ft.)', b:13, d:'5d10', t:'radiant', f:'The silver light has gone green at the edges. It still burns {T}.'}],
    specials:[{n:'Two Hymns at Once', fx:'aoe:8:wis:21:6d10:psychic:frightened', f:'The saint\'s prayer and the Seep\'s hymn come out of the same mouth.'},
              {n:'Seed the Faithful', fx:'spawn:seepling:4@party'},
              {n:'Reorganize Sector', fx:'shift'}],
    traits:['<b>The Seep Wakes.</b> Tendrils split his vestments; the halo of nails has rusted green. He fights like two things sharing a body.',
            '<b>Two Wills.</b> At the start of each of his turns, roll a d6. On a 1, the saint wins for a moment: he takes no action except to beg the party to finish it.',
            '<b>Regeneration.</b> Regains 15 HP at the start of his turn unless he took radiant or fire damage since his last turn.',
            '<b>Legendary (3/round).</b> Corrupted Ray · Seed the Faithful (costs 2) · Reorganize Sector (costs 3).'],
    hooks:{ onTurnStart:['heal:15'] },
    look:'The saint\'s silver vestments torn open by grey-green growth; half his waxen face has bloomed into membrane, one eye still silver and weeping, the other a glowing green pustule. The halo of nails has rusted and slowly drips.',
    prompt:'lich saint half-consumed by grey-green parasitic growth, tarnished silver vestments torn open by tendrils, half the face bloomed into membrane with a glowing green eye, the other eye silver and weeping, rusted halo of floating nails, ruined mine cathedral, Ravenloft, painterly horror portrait' },

  // ----------------------------- BAROVIAN UNDEAD -----------------------------
  { id:'candlewight', fam:'dread', name:'Candlewight', cr:'3', ac:13, hp:'8d8+8', speed:30, spd:'30 ft.', init:1, size:1,
    shape:'candle', color:'#d9c690', eye:'#ffb347', tags:['undead','host'],
    attacks:[{n:'Molten Grasp', b:5, d:'2d6+3', t:'fire', f:'{A}\'s wax hand closes on {T}. It is still hot.'}],
    specials:[{n:'Wick-Drain', fx:'aoe:2:none:0:1d6:necrotic:no healing', f:'The wick gutters and pulls the warmth out of everything nearby.'}],
    traits:['<b>Wick-Drain.</b> Creatures starting their turn within 10 ft. of the lit wick take 1d6 necrotic and can\'t regain HP until their next turn.',
            '<b>Douse the Wick.</b> An action (or 5+ cold damage) snuffs it: no Wick-Drain, and it is vulnerable to all damage until relit.',
            '<b>Poured, Not Buried.</b> Someone dipped these corpses in tallow. Someone is still doing it.'],
    look:'A corpse dipped layer on layer in tallow until it is a man-shaped candle, a thick wick driven through the crown of the skull and burning low and blue.',
    prompt:'horror undead, corpse dipped repeatedly in tallow until it is a man-shaped candle, dripping wax, thick wick through the skull burning with a low blue flame, dark crypt, gothic horror, painterly' },

  { id:'silverlung', fam:'dread', name:'Silver-Lung Miner', cr:'2', ac:14, hp:'6d8+12', speed:25, spd:'25 ft.', init:0, size:1,
    shape:'dwarf', color:'#8a8f99', eye:'#e8f0ff', tags:['undead','host'],
    attacks:[{n:'Pick', b:5, d:'1d8+3', t:'piercing', f:'{A} swings the pick it died holding.'}],
    specials:[{n:'Silver Cough', fx:'aoe:1:con:12:2d4:poison:blinded', f:'A cloud of glittering silver dust bursts from its lungs.'}],
    traits:['<b>Silver Cough.</b> Creatures that fail are also blinded until the end of their next turn. <i>(Automatic.)</i>',
            '<b>Khundrim Dead.</b> The Yield still clings to them. A sworn Khundrim can use an action (Persuasion DC 15) to make one stand down for 1 minute.'],
    look:'A dwarf miner whose lungs filled with silver dust until he drowned in it — skin crusted with glittering silver, breath a shimmering cloud.',
    prompt:'undead dwarf miner, skin crusted with glittering silver dust, coughing shimmering silver clouds, iron pick, ragged mining leathers, dark silver mine tunnel, gothic dark fantasy concept art' },

  { id:'unbaptized', fam:'dread', name:'The Unbaptized', cr:'4', ac:13, hp:'9d8+9', speed:40, spd:'0 ft., fly 40 ft. (hover)', init:3, size:1,
    shape:'wraith', color:'#8fb6d6', eye:'#e6f6ff', tags:['undead'],
    attacks:[{n:'Drowning Touch', b:6, d:'3d6+3', t:'necrotic', f:'{T}\'s lungs fill with cold church water.'}],
    traits:['<b>Font-Born.</b> Resistant to nonmagical damage; vulnerable to radiant.',
            '<b>Baptism Denied.</b> A creature it drops to 0 HP can\'t be stabilized without magic.'],
    look:'A translucent figure of moving water in the shape of a child in a christening gown, dripping constantly, leaving wet footprints where it doesn\'t walk.',
    prompt:'ghostly translucent figure made of moving water shaped like a child in a christening gown, constantly dripping, pale blue glow, flooded church crypt, eerie gothic horror, painterly' },

  { id:'bellmouth', fam:'dread', name:'Bellmouth Ghoul', cr:'3', ac:13, hp:'7d8+14', speed:30, spd:'30 ft.', init:2, size:1,
    shape:'bellghoul', color:'#6b5f55', eye:'#ffcc66', tags:['undead','host'],
    attacks:[{n:'Bite', b:5, d:'2d6+3', t:'piercing', on:{ save:'con', dc:12, cond:'paralyzed', rounds:1 }, f:'{A}\'s bell-jaw clangs shut on {T}.'}],
    specials:[{n:'Toll', fx:'dread+1', f:'It rings itself. Every creature within 30 ft. makes a DC 13 Wis save or is frightened — and the Dread deepens.'}],
    traits:['<b>Paralytic Bite.</b> DC 12 Con save or paralyzed until the end of its next turn. <i>(Automatic.)</i>', '<b>Toll.</b> Ringing raises the Dread by one.'],
    look:'A starved ghoul whose lower jaw has been replaced with a cracked bronze church bell. It rings when it runs.',
    prompt:'emaciated ghoul whose lower jaw is a cracked bronze church bell, ragged bell-ringer robes, running on all fours through a ruined belfry crypt, gothic horror, painterly' },

  { id:'weaver', fam:'dread', name:'Ossuary Weaver', cr:'6', ac:15, hp:'11d10+33', speed:40, spd:'40 ft., climb 40 ft.', init:3, size:2,
    shape:'weaver', color:'#d7cbb3', eye:'#ff4a4a', tags:['undead'],
    attacks:[{n:'Rib-Sickle', b:8, d:'2d10+4', t:'slashing', f:'{A} folds a ribcage shut around {T}.'},
             {n:'Sinew Line (60 ft.)', b:8, d:'1d8', t:'bludgeoning', on:{ save:'str', dc:15, cond:'restrained', rounds:2 }, f:'A wet cord of sinew snaps around {T} and pulls.'}],
    traits:['<b>Web of Tendons.</b> Its lair is strung with sinew; difficult terrain to everyone but it.'],
    look:'A spider assembled from ribcages and finger bones, its body a reliquary, eight legs of stacked femurs.',
    prompt:'giant spider assembled from human ribcages and finger bones, body like a silver reliquary, legs of stacked femurs, sinew webs strung across an ossuary, gothic horror concept art' },

  { id:'spawn', fam:'dread', name:'Vampire Spawn', cr:'5', ac:15, hp:'11d8+33', speed:30, spd:'30 ft., climb 30 ft.', init:3, size:1,
    shape:'vampire', color:'#6a5a66', eye:'#ff2b3a', tags:['undead','host'],
    attacks:[{n:'Claw', b:6, d:'2d4+3', t:'slashing', on:{ save:'str', dc:13, cond:'grappled', rounds:1 }, f:'{A} rakes {T} with nails like knives.'},
             {n:'Bite', b:6, d:'1d6+3+2d6', t:'piercing + necrotic', f:'{A} finds {T}\'s neck.'}],
    traits:['<b>Sunlight Hypersensitivity.</b> 20 radiant at the start of its turn in sunlight.', '<b>Spider Climb.</b> Climbs walls and ceilings.'],
    look:'A pale, hungry servant of the castle with an aristocrat\'s collar gone to rags and eyes like coals.',
    prompt:'pale vampire spawn in ragged aristocratic clothes, high torn collar, glowing red eyes, crouched on a crypt wall, Ravenloft, gothic horror portrait, painterly' },
];

// The live registry: built-ins plus any creatures the DM has edited or added (state.content.bestiary).
export const BEST = {};
export function rebuildBestiary(custom = {}){
  for (const k of Object.keys(BEST)) delete BEST[k];
  for (const b of BESTIARY) BEST[b.id] = b;
  for (const b of BAROVIA) BEST[b.id] = b;
  for (const [id, b] of Object.entries(custom || {})) if (b && b.name) BEST[id] = { ...b, id, custom:true };
}
rebuildBestiary();
export const bestList = () => Object.values(BEST);
export const isHost = t => t.kind !== 'monster' || !!BEST[t.bid]?.tags?.includes('host');
export const hasTag = (t, tag) => !!BEST[t.bid]?.tags?.includes(tag);

/* DEFAULT PARTY — Gribbles, Mulan, Milson, Alexander, Vlad.
   Placeholder numbers until the real sheets go in: edit in the Tokens tab, or here.
   check = lockpicking / disarming / forcing bonus · passive = passive Perception (spots traps & secret doors) */
export const DEFAULT_PARTY = [
  { name:'Gribbles',  color:'#e6b422', ac:14, hp:76,  speed:25, init:2, check:7, passive:15 },
  { name:'Mulan',     color:'#d9534f', ac:16, hp:90,  speed:30, init:3, check:5, passive:14 },
  { name:'Milson',    color:'#7fb069', ac:15, hp:120, speed:30, init:1, check:4, passive:13 },
  { name:'Alexander', color:'#f3d36b', ac:17, hp:95,  speed:30, init:2, check:4, passive:14 },
  { name:'Vlad',      color:'#5aa9e6', ac:18, hp:110, speed:25, init:0, check:3, passive:12 },
];
export const DEFAULT_PC_ATTACKS = 'Weapon | +7 | 1d8+4 | slashing\nRadiant strike | +7 | 2d8+4 | radiant';
