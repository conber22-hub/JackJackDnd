/* Original Barovian fragments. Boolean trinket/page rewards resolve at placement.
   HOW_MANY.hidden is a count, capped by actual placement. Readings and lore pages
   do not repeat on one map; exhausted reading pools leave excess props unlabelled. */
export const READ = {
  "gravestone": [
    {"name":"Mara Voss","years":null,"text":"Mara Voss. She kept the last pear for her sister."},
    {"name":"Petru Bell","years":"651–722","text":"Petru Bell. He never learnt to close a door quietly."},
    {"name":"Anja Vale","years":"652–723","text":"Anja Vale. Her bread rose even in winter."},
    {"name":"Olek Durn","years":null,"text":"Olek Durn. No debt follows him here."},
    {"name":"Lida Moss","years":"654–725","text":"Lida Moss. We buried his boots; the road kept the rest."},
    {"name":"Tomas Reed","years":"655–726","text":"Tomas Reed. He asked for sunlight, not a stone."},
    {"name":"Vera Kest","years":null,"text":"Vera Kest. She mended every coat but her own."},
    {"name":"Nikol Flint","years":"657–728","text":"Nikol Flint. His dog still waits beside the gate."},
    {"name":"Elsa Tarn","years":"658–729","text":"Elsa Tarn. Someone has scratched out the word beloved."},
    {"name":"Borin Ash","years":null,"text":"Borin Ash. The grave is shorter than the name."},
    {"name":"Sava Wren","years":"660–731","text":"Sava Wren. She sang while the others counted graves."},
    {"name":"Mila Rusk","years":"661–732","text":"Mila Rusk. He forgave us before we asked."},
    {"name":"Ilya Pell","years":null,"text":"Ilya Pell. Here lies the only witness."},
    {"name":"Dora Thorn","years":"663–734","text":"Dora Thorn. Her sons paid for this stone separately."},
    {"name":"Anton Grey","years":"664–721","text":"Anton Grey. He died with both hands clean, for once."},
    {"name":"Zora Hale","years":null,"text":"Zora Hale. The dates have been cut over older dates."},
    {"name":"Pavel Wick","years":"666–723","text":"Pavel Wick. We have left room for his brother."},
    {"name":"Nadia Fen","years":"667–724","text":"Nadia Fen. She knew which mushrooms were safe."},
    {"name":"Yuri Bale","years":null,"text":"Yuri Bale. The mason has carved tomorrow’s date."},
    {"name":"Irina Holt","years":"669–726","text":"Irina Holt. Her spindle outlasted three burgomasters."},
    {"name":"Luka Wold","years":"670–727","text":"Luka Wold. He promised to return before the snow."},
    {"name":"Danya Fenn","years":null,"text":"Danya Fenn. The name is on the inside of the stone."},
    {"name":"Gregor Snow","years":"672–729","text":"Gregor Snow. His debts were divided; his kindness was not."},
    {"name":"Sonya Dell","years":"673–730","text":"Sonya Dell. She taught the children to count the stars."},
    {"name":"Radu Frost","years":null,"text":"Radu Frost. Nothing grew here until we stopped praying."},
    {"name":"Katya Quill","years":"675–732","text":"Katya Quill. He carried strangers over the ford."},
    {"name":"Emil Mere","years":"676–733","text":"Emil Mere. Her last letter was never opened."},
    {"name":"Talia Rook","years":null,"text":"Talia Rook. There is a fresh thumbprint in the granite."},
    {"name":"Viktor Clay","years":"678–721","text":"Viktor Clay. He could whistle through a broken tooth."},
    {"name":"Hana Vale","years":"727–734","text":"Hana Vale. She was seven when the river took her ribbon."},
    {"name":"Marek Hush","years":null,"text":"Marek Hush. We did not have enough wood for a lid."},
    {"name":"Alina Stone","years":"681–724","text":"Alina Stone. His wife has crossed out rested."},
    {"name":"Stefan Rain","years":"682–725","text":"Stefan Rain. He would have hated all these flowers."},
    {"name":"Nessa Crow","years":null,"text":"Nessa Crow. She saved the candle for our return."},
    {"name":"Dimitri Root","years":"684–727","text":"Dimitri Root. We buried him facing away from the castle."},
    {"name":"Ilona West","years":"685–728","text":"Ilona West. The birth year is later than the death year."},
    {"name":"Bela Fern","years":null,"text":"Bela Fern. Her name is all the family could afford."},
    {"name":"Oskar Harth","years":"687–730","text":"Oskar Harth. He kept a place at supper for the missing."},
    {"name":"Raisa Loom","years":"688–731","text":"Raisa Loom. She asked us not to be brave on her behalf."},
    {"name":"Miro Cold","years":null,"text":"Miro Cold. Under the moss: stop digging."}
  ],
  "notice": [
    {"where":"village","text":"Curtains shut at dusk. A light in an empty house is no invitation."},
    {"where":"vallaki","text":"The festival requires twelve smiling volunteers. Names have already been chosen."},
    {"where":"krezk","text":"No firewood leaves the walls until the youngest children are warm."},
    {"where":"any","text":"Missing: a red mitten, with a small hand still needing it."},
    {"where":"village","text":"Bring wolf tracks to the watch, not wolf pups."},
    {"where":"vallaki","text":"All ribbons must be returned dry. Rain is no excuse."},
    {"where":"krezk","text":"The abbey bell is not a summons to climb after dark."},
    {"where":"any","text":"Reward for a grey mare. No reward for explaining what ate her."},
    {"where":"village","text":"The miller accepts buttons until the flour runs out."},
    {"where":"vallaki","text":"Windows overlooking the procession must be occupied."},
    {"where":"krezk","text":"Visitors must give the name of someone who expects them."},
    {"where":"any","text":"Lost child: Lenka, blue scarf, answers softly. Please ask twice."},
    {"where":"village","text":"The east well is covered for a reason. Leave the stones where they are."},
    {"where":"vallaki","text":"The burgomaster reminds you that silence is not applause."},
    {"where":"krezk","text":"Grave boards may not be used to repair fences."},
    {"where":"any","text":"A cooper seeks work. Will mend barrels, not coffins."},
    {"where":"village","text":"Three hens found. Their owner may name them at the chapel."},
    {"where":"vallaki","text":"The reward for yesterday’s runaway is withdrawn. Do not ask why."},
    {"where":"krezk","text":"Leave broth at the lower gate for the night watch."},
    {"where":"any","text":"Do not follow a voice that calls from beneath a bridge."},
    {"where":"village","text":"A wedding blanket is wanted. It need not be new."},
    {"where":"vallaki","text":"Children practising the festival song must finish before curfew."},
    {"where":"krezk","text":"The western orchard is closed while we count the trees."},
    {"where":"any","text":"Wanted: one sound wheel. Payment in nails and honest bread."},
    {"where":"village","text":"The burgomaster’s seal is missing. Refuse orders stamped in blue."},
    {"where":"vallaki","text":"No masks of living officials. No exceptions for resemblance."},
    {"where":"krezk","text":"Salt is kept at the gate. Take only what your journey needs."},
    {"where":"any","text":"The bridge has one rotten plank. Walk where the moss is broken."},
    {"where":"any","text":"If you find a silver thimble, keep it. Bring back the letter wrapped round it."},
    {"where":"any","text":"Wolves have been seen near the sheepfold. Fetch your children before the sheep."}
  ],
  "shrine": [
    {"text":"A sun of bent nails honours the Morninglord. Someone has polished just one ray."},
    {"text":"Mother Night has been given a bowl of milk. Not a drop has frozen."},
    {"text":"A little boot rests beneath Saint Markovia’s name. Its pair is missing."},
    {"text":"Seven candle ends stand in a row. The smallest has never been lit."},
    {"text":"The offering is a crust wrapped in wedding lace."},
    {"text":"A carved sun has been turned towards the wall. Fresh flowers face it."},
    {"text":"Someone has left an empty medicine bottle and a grateful name."},
    {"text":"A raven feather pins a prayer to the damp wood."},
    {"text":"Under Mother Night’s cloth lies a key with no teeth."},
    {"text":"Saint Markovia’s stone hands hold a nest abandoned for winter."},
    {"text":"Two coins lie beneath the Morninglord’s lamp, both worn smooth."},
    {"text":"A farmer has offered the first bean of a poor harvest."},
    {"text":"The prayer asks for a quiet birth, in four different hands."},
    {"text":"A cracked bowl holds rainwater and one clean bandage."},
    {"text":"A tiny chair waits beside the shrine, as though a child might return."}
  ],
  "carving": [
    {"text":"Count the footsteps after yours."},
    {"text":"We went east. If this says west, burn it."},
    {"text":"Mila waited here."},
    {"text":"Do not answer from the water."},
    {"text":"The third knock is never mine."},
    {"text":"A wolf cannot promise."},
    {"text":"Turn back while you still recognise the road."},
    {"text":"Petru owes me one sunrise."},
    {"text":"The moss covers the old arrows."},
    {"text":"No one sleeps under this branch twice."},
    {"text":"I left the bread where we agreed."},
    {"text":"Hold the rope until I shout my name."},
    {"text":"We were five at the bridge."},
    {"text":"There is no ferry tonight."},
    {"text":"Look at the shadow, not the lantern."},
    {"text":"Anja and Vera, despite everything."},
    {"text":"I heard the bell beneath the roots."},
    {"text":"The white stones lead in a circle."},
    {"text":"Keep your mother’s name to yourself."},
    {"text":"A mark for each day: the cuts stop at nine."},
    {"text":"Please tell my brother I tried."},
    {"text":"This stump was a tree yesterday."},
    {"text":"The last word has been scratched through from behind."},
    {"text":"I have forgotten which side is home."},
    {"text":"If you find my knife, bury it here."}
  ],
  "statue": [
    {"text":"The stone woman holds an absent child; rain gathers in her arms."},
    {"text":"A soldier’s sword has been replaced with a broom handle."},
    {"text":"The plaque praises mercy. Every face below it has been chipped away."},
    {"text":"Someone has knitted a scarf for the stone saint."},
    {"text":"A raven has nested in the crowned head."},
    {"text":"The statue’s eyes are new stone in an old face."},
    {"text":"Only the feet remain, pointing towards Ravenloft."},
    {"text":"The carved hands have been worn smooth by frightened visitors."}
  ],
  "well": [
    {"text":"A bucket waits halfway down. The rope is tied to nothing."},
    {"text":"The rim bears the marks of small teeth."},
    {"text":"Someone has painted a sun where the water should reflect one."},
    {"text":"A brass cup is chained to the stone, with the chain carefully mended."},
    {"text":"A note asks you to lower your voice."},
    {"text":"The water smells faintly of extinguished candles."},
    {"text":"A wedding ring has been nailed above the winch."},
    {"text":"The depth is chalked on the wall, then crossed out three times."}
  ],
  "milestone": [
    {"text":"Vallaki: the number has been pecked away."},
    {"text":"Krezk is cut deep; every other name is shallow."},
    {"text":"The moss makes a second arrow beneath the first."},
    {"text":"The stone says one mile. Someone has added again."},
    {"text":"Tser Pool, beside a carved wheel half sunk in mud."},
    {"text":"Ravenloft is the only name that has not weathered."},
    {"text":"The distance is worn away, but the word home remains."},
    {"text":"Old Bonegrinder: a floury handprint covers the arrow."}
  ]
};

export const PAGES = [
  {"id":"cooper-1","title":"An advance","text":"I took the burgomaster’s silver for twelve barrels. He would not say what they should hold.","where":["village","town","interior","road"],"thread":"cooper","n":1},
  {"id":"cooper-2","title":"The measure","text":"Every barrel must fit through the chapel door. I measured it while the priest slept.","where":["village","town","interior","road"],"thread":"cooper","n":2},
  {"id":"cooper-3","title":"A wrong sound","text":"My apprentice knocked on the first finished cask. Something knocked from the timber before we had fitted its bottom.","where":["village","town","interior","road"],"thread":"cooper","n":3},
  {"id":"cooper-4","title":"The apprentice","text":"I sent the boy home with my supper. His mother returned the bowl and asked why it was warm.","where":["village","town","interior","road"],"thread":"cooper","n":4},
  {"id":"cooper-5","title":"Extra hoops","text":"The ironmonger wants payment before he bends another hoop. He has begun wearing gloves to bed.","where":["village","town","interior","road"],"thread":"cooper","n":5},
  {"id":"cooper-6","title":"A refused delivery","text":"The chapel would not take the barrels. The priest counted thirteen on my cart.","where":["village","town","interior","road"],"thread":"cooper","n":6},
  {"id":"cooper-7","title":"The spare","text":"I rolled the extra cask into the yard. In the morning it stood inside my locked workshop.","where":["village","town","interior","road"],"thread":"cooper","n":7},
  {"id":"cooper-8","title":"A remedy","text":"I bored a hole in every stave. The water drained out, though none had been filled.","where":["village","town","interior","road"],"thread":"cooper","n":8},
  {"id":"cooper-9","title":"Last account","text":"There is silver enough to pay the boy’s mother. I have written her name over mine in the ledger.","where":["village","town","interior","road"],"thread":"cooper","n":9},
  {"id":"cooper-10","title":"The open door","text":"I have taken the workshop door off its hinges. Whatever comes tonight will not need to knock.","where":["village","town","interior","road"],"thread":"cooper","n":10},
  {"id":"surveyor-1","title":"First mile","text":"I promised you an honest map. The road has already made a liar of one milestone.","where":["road","woods","camp","castle"],"thread":"surveyor","n":1},
  {"id":"surveyor-2","title":"The fork","text":"Both tracks bear our wheel marks. I drew the left one in pencil so I could change my mind.","where":["road","woods","camp","castle"],"thread":"surveyor","n":2},
  {"id":"surveyor-3","title":"Camp marks","text":"We cut our initials into a pine before sleeping. At dawn the cuts were higher than we could reach.","where":["road","woods","camp","castle"],"thread":"surveyor","n":3},
  {"id":"surveyor-4","title":"The assistant","text":"My assistant has started leaving empty spaces on the map. He says that is where we are being watched.","where":["road","woods","camp","castle"],"thread":"surveyor","n":4},
  {"id":"surveyor-5","title":"The bridge","text":"The river runs beneath the same bridge twice. I know the missing nail in its handrail.","where":["road","woods","camp","castle"],"thread":"surveyor","n":5},
  {"id":"surveyor-6","title":"A borrowed compass","text":"A woman at Tser Pool lent me a compass. Its needle points towards whoever is holding my letters.","where":["road","woods","camp","castle"],"thread":"surveyor","n":6},
  {"id":"surveyor-7","title":"The horizon","text":"Ravenloft stayed ahead of us all afternoon. We were walking away from it.","where":["road","woods","camp","castle"],"thread":"surveyor","n":7},
  {"id":"surveyor-8","title":"A correction","text":"I crossed out the road home. It was the first accurate mark I made.","where":["road","woods","camp","castle"],"thread":"surveyor","n":8},
  {"id":"surveyor-9","title":"The last camp","text":"My assistant left his boots beside the fire. His footprints continued into the trees.","where":["road","woods","camp","castle"],"thread":"surveyor","n":9},
  {"id":"surveyor-10","title":"For the finder","text":"Fold this page into a bird if you cannot deliver it. I should like something of mine to leave the ground.","where":["road","woods","camp","castle"],"thread":"surveyor","n":10},
  {"id":"laundress-1","title":"Work taken","text":"The Abbey sent down seven linen sheets. Six smelled of soap and one of crushed apples.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":1},
  {"id":"laundress-2","title":"A small stain","text":"I could not lift a brown mark from the smallest sheet. It moved nearer the hem while I boiled the water.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":2},
  {"id":"laundress-3","title":"Names","text":"I stitched a name into each corner so nothing would be lost. By morning there were eight names.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":3},
  {"id":"laundress-4","title":"A visitor","text":"A woman came for a sheet without a name. She paid me with a thimble that fitted neither of us.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":4},
  {"id":"laundress-5","title":"The window","text":"I hung the washing inside because of the rain. It blew towards the closed window.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":5},
  {"id":"laundress-6","title":"Sunday","text":"I left the strange linen at the church. The next bell sounded like a spoon against a washbasin.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":6},
  {"id":"laundress-7","title":"A kindness","text":"The priest returned it folded round a loaf. We ate the bread without speaking of the cloth.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":7},
  {"id":"laundress-8","title":"The cold wash","text":"My hands no longer warm the water. I have asked my sister to finish the delivery.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":8},
  {"id":"laundress-9","title":"The sister’s hand","text":"I found this book beneath the basin. My sister’s name has appeared in every sheet.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":9},
  {"id":"laundress-10","title":"Clean linen","text":"I have washed out the names and left the cloth on the grass. Let the rain decide who needs it now.","where":["church","graveyard","crypt","interior","town"],"thread":"laundress","n":10}
];

export const TRINKETS = [
  {"n":"Tin wolf charm","gp":0},
  {"n":"Child’s tooth in a copper locket","gp":1},
  {"n":"Sun-stamped candle stub","gp":2},
  {"n":"Blue glass mourning bead","gp":3},
  {"n":"Bent silver thimble","gp":4},
  {"n":"Raven feather in a brass tube","gp":5},
  {"n":"Wooden spoon with two initials","gp":0},
  {"n":"One velvet doll’s shoe","gp":1},
  {"n":"Wedding button of yellow bone","gp":2},
  {"n":"Cracked watch face without hands","gp":3},
  {"n":"Tiny iron horseshoe","gp":4},
  {"n":"Red ribbon sewn round a pebble","gp":5},
  {"n":"Copper bell with a woollen tongue","gp":0},
  {"n":"Porcelain eye from a broken doll","gp":1},
  {"n":"Black chess pawn carved as a priest","gp":2},
  {"n":"Amber bead holding a gnat","gp":3},
  {"n":"Small key tied to a milk tooth","gp":4},
  {"n":"Pressed violet in a tin frame","gp":5},
  {"n":"Ivory-coloured wooden comb","gp":0},
  {"n":"Woollen mitten sized for a thumb","gp":1},
  {"n":"Pewter sun with one missing ray","gp":2},
  {"n":"Clay whistle shaped like a hen","gp":3},
  {"n":"Bottle of blue sand","gp":4},
  {"n":"Brass buckle engraved with a hare","gp":5},
  {"n":"Silver pin bent into a fishhook","gp":0},
  {"n":"Bone die with two blank faces","gp":1},
  {"n":"Painted walnut shell","gp":2},
  {"n":"Copper coin folded into a boat","gp":3},
  {"n":"Carved acorn on a frayed cord","gp":4},
  {"n":"Little mirror backed with a prayer","gp":5}
];

export const SEARCH = {
  "barrel": [
    {"w":75,"say":"Salt, gone hard. Nothing else."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "kegs": [
    {"w":75,"say":"A sour smell and a drowned beetle."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "crate": [
    {"w":75,"say":"Packing straw, folded as neatly as hair."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "sacks": [
    {"w":75,"say":"Grain husks. Mice have been thorough."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "cart": [
    {"w":75,"say":"Mud has filled the gap beneath the seat."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "wagon": [
    {"w":75,"say":"An empty blanket still holds the shape of knees."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "chest": [
    {"w":75,"say":"The lining has been cut out."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "bookshelf": [
    {"w":75,"say":"The books have swollen shut."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "desk": [
    {"w":75,"say":"A pen has dried halfway through a name."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "wardrobe": [
    {"w":75,"say":"One coat, eaten through at the heart."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "bed": [
    {"w":75,"say":"The straw mattress has been searched before."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "coffin": [
    {"w":75,"say":"A handful of wilted flowers. Let them lie."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "sarcophagus": [
    {"w":75,"say":"Stone dust and a carefully folded shroud."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "altar": [
    {"w":75,"say":"Wax fills every crack."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "pew": [
    {"w":75,"say":"A child has counted the knots in the wood."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "hay": [
    {"w":75,"say":"Dry stalks and the smell of summer long past."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ],
  "woodpile": [
    {"w":75,"say":"Beetles vanish beneath the bark."},
    {"w":10,"say":"A few coins wrapped in dirty linen.","gp":3},
    {"w":9,"say":"A small thing someone meant to keep.","trinket":true},
    {"w":5,"say":"A folded page, spared by the damp.","page":true},
    {"w":1,"say":"A sealed healing draught beneath the dust.","potion":"healing"}
  ]
};

export const GLINT = {
  "village": [
    {"w":40,"say":"A coin lies beneath a broken doorstep.","gp":1},
    {"w":35,"say":"A keepsake has fallen through someone’s apron.","trinket":true},
    {"w":20,"say":"A page is tucked under a loose fence stone.","page":true},
    {"w":5,"say":"A little purse has split beside the well.","gp":12}
  ],
  "town": [
    {"w":40,"say":"A coin has rolled into the gutter.","gp":1},
    {"w":35,"say":"A small keepsake lies beneath a discarded festival ribbon.","trinket":true},
    {"w":20,"say":"A page has been trodden into the mud, writing inward.","page":true},
    {"w":5,"say":"A purse is caught beneath a market stall’s peg.","gp":12}
  ],
  "road": [
    {"w":40,"say":"A coin gleams in a wheel rut.","gp":1},
    {"w":35,"say":"A keepsake hangs from a blackthorn beside the road.","trinket":true},
    {"w":20,"say":"A traveller’s page is folded into a dry boot print.","page":true},
    {"w":5,"say":"A severed purse cord trails across the verge.","gp":12}
  ],
  "woods": [
    {"w":40,"say":"A coin rests in the cup of a fallen leaf.","gp":1},
    {"w":35,"say":"A small keepsake lies in a hollow between roots.","trinket":true},
    {"w":20,"say":"A page is caught under a curl of birch bark.","page":true},
    {"w":5,"say":"A purse has been buried badly by something with claws.","gp":12}
  ],
  "church": [
    {"w":40,"say":"A coin has slipped beyond the collection bowl.","gp":1},
    {"w":35,"say":"A keepsake rests beside an extinguished votive.","trinket":true},
    {"w":20,"say":"A folded page supports the short leg of a prayer stool.","page":true},
    {"w":5,"say":"A purse has fallen behind the last pew.","gp":12}
  ],
  "graveyard": [
    {"w":40,"say":"A coin has sunk into the earth beside an unmarked grave.","gp":1},
    {"w":35,"say":"A keepsake lies outside the wreath that once held it.","trinket":true},
    {"w":20,"say":"A page is folded beneath a stone to keep it from blowing away.","page":true},
    {"w":5,"say":"A little purse lies tangled in dead ivy.","gp":12}
  ],
  "interior": [
    {"w":40,"say":"A coin glints between two floorboards.","gp":1},
    {"w":35,"say":"A keepsake waits in the dust beneath a chair.","trinket":true},
    {"w":20,"say":"A page has slipped behind the skirting board.","page":true},
    {"w":5,"say":"A purse is sewn into the hem of a fallen curtain.","gp":12}
  ],
  "crypt": [
    {"w":40,"say":"A coin rests in a dry hollow of the stone.","gp":1},
    {"w":35,"say":"A keepsake lies among the fragments of a broken urn.","trinket":true},
    {"w":20,"say":"A page survives inside a crack above the damp line.","page":true},
    {"w":5,"say":"A purse has fallen through the fingers of a stone effigy.","gp":12}
  ],
  "castle": [
    {"w":40,"say":"A coin lies where the carpet has worn through.","gp":1},
    {"w":35,"say":"A keepsake rests beneath a tarnished wall sconce.","trinket":true},
    {"w":20,"say":"A page is wedged in the frame of a portrait turned to the wall.","page":true},
    {"w":5,"say":"A purse has been hidden under a loose mosaic tile.","gp":12}
  ],
  "camp": [
    {"w":40,"say":"A coin shines beside a cold fire ring.","gp":1},
    {"w":35,"say":"A keepsake is tangled in an abandoned tent cord.","trinket":true},
    {"w":20,"say":"A page has been folded round a handful of dry tinder.","page":true},
    {"w":5,"say":"A purse lies beneath a blanket left for the next traveller.","gp":12}
  ]
};

export const HOW_MANY = {
  "village": {"min":3,"max":8,"hidden":2},
  "town": {"min":3,"max":8,"hidden":2},
  "road": {"min":3,"max":8,"hidden":2},
  "woods": {"min":3,"max":8,"hidden":2},
  "church": {"min":2,"max":5,"hidden":2},
  "graveyard": {"min":3,"max":8,"hidden":2},
  "interior": {"min":2,"max":5,"hidden":2},
  "crypt": {"min":2,"max":5,"hidden":2},
  "castle": {"min":3,"max":8,"hidden":2},
  "camp": {"min":3,"max":8,"hidden":2}
};
