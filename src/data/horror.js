// Original fear rules and marks for this table, not a published madness table.
const short=[
 ['shaking','Shaking Hands','Sleight of Hand','while handling fragile things','Your hands shake until you have washed them.'],
 ['dark-corners','Dark Corners','Perception','in darkness','Every dark corner seems occupied.'],
 ['broken-voice','Broken Voice','Persuasion','when speaking above a whisper','Your voice catches when you try to speak loudly.'],
 ['startled','Easily Startled','Stealth','when a sudden noise interrupts you','A dropped cup makes you flinch.'],
 ['cold-fingers','Cold Fingers','Thieves’ Tools','while picking a lock','Your fingers feel cold and clumsy.'],
 ['distant-song','Distant Song','Perception','when listening for quiet sounds','You hear a song just beyond the room.'],
 ['averted-eyes','Averted Eyes','Insight','when meeting a stranger’s gaze','You keep looking away from other people’s eyes.'],
 ['stiff-step','Stiff Step','Acrobatics','when balancing above a drop','Your knees lock when you look down.'],
 ['sour-mouth','Sour Mouth','Performance','when singing','Every song tastes of grave dust.'],
 ['lost-words','Lost Words','History','when recalling a person’s name','The names you need slip away.'],
 ['false-shadows','False Shadows','Investigation','in dim light','Shadows seem to point in the wrong direction.'],
 ['racing-heart','Racing Heart','Animal Handling','with a frightened animal','Your heart races faster than the animal’s.'],
 ['torn-prayer','Torn Prayer','Religion','when recalling a rite','The middle of every prayer goes missing.'],
 ['scattered-thought','Scattered Thought','Arcana','when studying an unfamiliar symbol','Letters rearrange themselves when you blink.'],
 ['empty-stomach','Empty Stomach','Survival','when preparing food','The smell of food turns your stomach.'],
];
const lasting=[
 ['lamp','Keep the Lamp','Perception','in darkness','You cannot sleep without a light burning.','holy-night','rest-light'],
 ['water','Black Water','Athletics','when entering deep water','You must steady yourself before entering water.','confront-source','water-save'],
 ['bells','Distant Bells','Perception','while bells are ringing','Every bell sounds like a warning meant for you.','ritual'],
 ['doors','Open Door','Stealth','when closing a door behind you','You need to leave a door open behind you.','service'],
 ['mirrors','Borrowed Face','Insight','when looking through a reflection','Your reflection seems a moment too slow.','ritual'],
 ['names','Remember Their Names','History','when recalling the dead','You write the names of the dead before you can rest.','service'],
 ['soil','Grave Soil','Survival','while digging','Fresh soil smells like an opened grave.','holy-night'],
 ['silence','Answer the Silence','Stealth','in complete silence','You whisper to make certain you are still there.','confront-source'],
 ['crows','Count the Crows','Perception','while ravens are nearby','You cannot stop counting the birds overhead.','service'],
 ['hands','Clean Hands','Sleight of Hand','with blood on your hands','You scrub at stains nobody else can see.','ritual'],
 ['guest','Unseen Guest','Persuasion','when inviting someone inside','You set a place for someone who never arrives.','holy-night'],
 ['embers','Watch the Embers','Investigation','near a dying fire','You watch every fire until its last ember fades.','confront-source'],
 ['oaths','Weight of Oaths','Deception','when making a promise','A promise feels like a chain round your wrist.','service'],
 ['roots','Listening Roots','Nature','near fungal growth','You hear roots moving beneath the floor.','confront-source'],
 ['footsteps','Second Footsteps','Perception','when listening behind you','A second set of footsteps stops when you do.','ritual'],
];
export const MARKS=[...short.map(([id,n,skill,when,text])=>({id,n,kind:'short',mechanics:{disadvantage:{skill,when}},text,cure:['long-rest','Lesser Restoration']})),...lasting.map(([id,n,skill,when,text,deed,extra],i)=>({id,n,kind:'lasting',mechanics:{disadvantage:{skill,when},...(extra==='rest-light'?{longRestRequires:'light'}:{}),...(extra==='water-save'?{entrySave:{ability:'wis',dc:10,terrain:'water'}}:{})},text,cure:[deed,'Greater Restoration'],whisper:i%3===0}))];
export const MARK_BY_ID=Object.fromEntries(MARKS.map(m=>[m.id,m]));
export const SOURCES=Object.fromEntries([
 ['dead-rising',12,'The dead stand up.'],['friend-corpse',14,'A friend lies still.'],['count',16,'The Count is here.'],['seep-growth',13,'The Seep changes before your eyes.'],['betrayal',12,'Someone trusted has betrayed you.'],['child-danger',13,'A child is in danger.'],['impossible',15,'Something impossible has happened.'],
].map(([id,dc,text],i)=>[id,{id,dc,text,short:short.filter((_,n)=>n%3===i%3).map(m=>m[0]),lasting:lasting.filter((_,n)=>n%3===i%3).map(m=>m[0])}]));
export const RELIEF={meal:1,prayer:1,song:1,friend:1};
export const WHISPERS=['You have left a door open for me.','Keep the lamp burning. I know where its light falls.','You remember my valley, and my valley remembers you.'];
