/* ROLL TABLES — the d100 Shift table and the Whim Die table.
   One row per line:   range | name | what the DM reads out | effects (comma separated)
   range: "07", "01-10", or "00" (00 = 100 on a d100).  Lines starting with # are ignored.
   Both are editable in the app (Gaze tab) and saved with the delve.

   Effects that work anywhere (same fx language as the bestiary):
     spawn:<id>:<n or dice>[@near|party|nest|corpse|random]
     party:<save>:<dc>:<dice or 0>:<damage type>:<condition, pit or ->:<all|random>
         — the party on this floor saves; on a fail they take the damage and the condition
           ('pit' = dragged down to the floor below)
     dread+1  dread-1 (the Gaze)   whim+1  whim-1  whim:roll  whim:reset   whisper  alert  heal:seep:<dice>
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
67-72 | The Mist Comes In | Fog pours through the new seams and something in it is pleased with you. | rewire, whim+1, whisper
73-78 | Pressure Wave | The air thickens. Ears pop. Somewhere above, he turns to look. | rewire, dread+1
79-84 | The Halls Fold | The floor folds like paper. When it opens again, you are not where you were — and not together. | rewire, scatter
85-90 | Tide Surge | Black water pours from the seams, and the Seep rides it in. | spawn:seepling:1d4+1@nest, spawn:husk:1@corpse, heal:seep:2d10
91-95 | Secret Ways | The labyrinth hides a door from you — and shows you another that was never there. | rewire, doors:secret
96-99 | The Choir Speaks | Every Taken voice on this floor says your names, in order. | dread+1, party:wis:14:0:psychic:frightened:all
00 | Reality Tears | The Dread Zone stops pretending to be a place. | rewire, swap, scatter, dread+1, spawn:husk:2@party`;

/* WHIM DIE — how the Count amuses himself with the heroes (d4 → d12).
   It steps UP when the heroes catch his interest: one of his creatures falls (once a round), they refuse a gift,
   insult him, or do something brave in his sight (press + in the Gaze tab). It steps DOWN when they bow, accept
   his hospitality, or rest somewhere holy. Roll it whenever the night is too quiet, or each round if Auto is on.
   Bigger die = crueller games in reach. */
export const WHIM_STEPS = [4, 6, 8, 10, 12];
export const DEFAULT_WHIM_TABLE = `# Whim Die — read the result
01 | Indifference | He looks away. For now, you are not interesting. |
02 | A Raven | A raven lands within reach and watches one hero far too long. That hero has disadvantage on their next Stealth check. | whisper
03 | A Gift | Something left where you will find it: a bottle of very good wine, a silk ribbon, a pressed rose, a card in a fine hand that says only "Welcome." | note
04 | The Mists Close | The way you came is gone, and the way ahead is new. | shift
05 | Wolves on the Wind | They come out of the mist in a loose ring and sit down. Not yet. Not yet. | spawn:barovian-wolf:2@party
06 | An Invitation | A letter sealed in red wax, addressed to one hero by name: dinner, at the castle, at their convenience. | whisper
07 | Remember Me | His voice, warm as wine, in one hero's head. | party:wis:13:0:psychic:charmed:random
08 | Bats | The air is suddenly full of wings. | spawn:swarm-of-bats:2@party
09 | A Borrowed Friend | Someone the heroes trust turns toward them with his eyes. | party:wis:14:0:psychic:charmed:random, whisper
10 | His Hounds | The wolves stop pretending. | spawn:barovian-wolf:2@party, spawn:count-s-wolf:1@party
11 | He Is Here | For one heartbeat he stands among you, smiling; then he is not. | party:wis:15:0:psychic:frightened:all, dread+1
12 | The Game Ends | His patience is gone, and the night itself comes for you. | dread+1, spawn:night-spawn:1@party, spawn:barovian-wolf:2@party, whim:reset`;
