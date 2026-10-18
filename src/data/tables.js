/* ROLL TABLES — the d100 Shift table and the Grasp Die table.
   One row per line:   range | name | what the DM reads out | effects (comma separated)
   range: "07", "01-10", or "00" (00 = 100 on a d100).  Lines starting with # are ignored.
   Both are editable in the app (Dread tab) and saved with the delve.

   Effects that work anywhere (same fx language as the bestiary):
     spawn:<id>:<n or dice>[@near|party|nest|corpse|random]
     party:<save>:<dc>:<dice or 0>:<damage type>:<condition, pit or ->:<all|random>
         — the party on this floor saves; on a fail they take the damage and the condition
           ('pit' = dragged down to the floor below)
     dread+1  dread-1  grasp+1  grasp-1  grasp:roll  grasp:reset  whisper  alert  heal:seep:<dice>
   Shift-only effects (they act on the floor that shifted):
     rewire   corridors re-link              swap      two empty rooms trade places
     forget   players' map of the halls fades scatter   everyone on the floor is moved to a random room
     stairs   the stairs down wander to another room (the floor below follows)
     nest     an empty room becomes a Seep Nest (and buds)
     trap:<n> n hidden traps arm in the corridors
     doors:lock | doors:open | doors:secret
*/
export const DEFAULT_SHIFT_TABLE = `# d100 — what the Dread Zone does when the halls shift
01-10 | Holding Breath | The stone groans, settles — and stops. Nothing has moved. This time. | whisper
11-22 | Grinding Rewire | Stone grinds against stone. The corridors are not where they were. | rewire
23-30 | Rooms Trade Places | Two rooms slide past each other like drawers in a cabinet. | rewire, swap
31-36 | The Forgetting Halls | The way you came is gone, and so is the memory of it. Your map is wrong. | rewire, forget
37-42 | The Doors Remember | Every closed door on this floor slams and locks itself. | doors:lock
43-48 | Open Mouths | Every door flies open at once — and something was waiting behind them. | doors:open, spawn:seepling:2@random
49-54 | Budding Wall | An empty room swells, splits, and becomes wet. Something is gestating in it. | nest
55-60 | The Long Stair Wanders | The stairs down are no longer where you left them. | rewire, stairs
61-66 | Hidden Teeth | New traps have grown in the corridors. | rewire, trap:2
67-72 | The Hands Reach | Andral's hands push up through the new seams. | rewire, grasp+1, spawn:handswarm:1@party
73-78 | Pressure Wave | The air thickens. Ears pop. The Dread deepens. | rewire, dread+1
79-84 | The Halls Fold | The floor folds like paper. When it opens again, you are not where you were — and not together. | rewire, scatter
85-90 | Tide Surge | Black water pours from the seams, and the Seep rides it in. | spawn:seepling:1d4+1@nest, spawn:husk:1@corpse, heal:seep:2d10
91-95 | Secret Ways | The labyrinth hides a door from you — and shows you another that was never there. | rewire, doors:secret
96-99 | The Choir Speaks | Every Taken voice on this floor says your names, in order. | dread+1, party:wis:14:0:psychic:frightened:all
00 | Reality Tears | The Dread Zone stops pretending to be a place. | rewire, swap, scatter, dread+1, spawn:husk:2@party`;

/* GRASP DIE — Andral's hands escalate.
   The die starts at d4. It steps UP (d4 → d6 → d8 → d10 → d12) when a Hand dies to anything but radiant,
   when Andral or the Monstrosity clench, or when the DM says the party has lingered. It steps DOWN when the
   Monstrosity dies or the party rests in a Sanctuary. Roll it at the end of each combat round while hands
   are on the floor (or on the Hand-Warrens), or whenever the DM likes. Bigger die = worse rows in reach. */
export const GRASP_STEPS = [4, 6, 8, 10, 12];
export const DEFAULT_GRASP_TABLE = `# Grasp Die — read the result
01 | Stillness | The hands withdraw into the stone. For a moment, nothing grips. |
02 | Fingertips | A cold touch on the back of someone's neck. | party:dex:12:0:bludgeoning:prone:random
03 | Scratching Below | Fingernails drag under the flagstones, following the party. No short rest on this floor until the Grasp Die steps down. | whisper
04 | A Hand Rises | A single grey hand pulls itself out of the floor — then the rest of the swarm. | spawn:handswarm:1@party
05 | Ankle-Grip | Something grips an ankle and does not let go. | party:str:13:1d6:bludgeoning:restrained:random
06 | The Floor Grabs | Every flagstone sprouts fingers. | party:str:13:1d6:bludgeoning:restrained:all
07 | Many Hands | The walls are crawling. | spawn:handswarm:2@party
08 | Dragged | One of you is hauled toward the wall by a hundred hands. | party:str:14:2d6:bludgeoning:grappled:random, spawn:handswarm:1@party
09 | Grave-Choke | Hands close around a throat from behind. There is no one behind. | party:con:14:3d8:bludgeoning:-:random
10 | The Wall of Hands | The walls are hands. All of them. | spawn:handswarm:3@party, party:str:15:2d6:bludgeoning:restrained:all
11 | Pull Under | The floor opens like a mouth and one of you goes down into it. | party:str:15:2d6:bludgeoning:pit:random
12 | The Monstrosity Wakes | Every hand in the labyrinth comes together into one shape. | spawn:handmass:1@party, grasp:reset`;
