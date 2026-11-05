// Original valley weather. Multipliers describe outdoor daylight and travel, not indoor light.
export const KINDS = [
  { id:'overcast', label:'Overcast', sight:1000, travel:1, wet:0, snow:0, light:.8 },
  { id:'low-fog', label:'Low fog', sight:90, travel:1, wet:0, snow:0, light:.7 },
  { id:'mist', label:'Mist', sight:60, travel:1, wet:0, snow:0, light:.72 },
  { id:'thick-fog', label:'Thick fog', sight:15, travel:.5, wet:0, snow:0, light:.55 },
  { id:'drizzle', label:'Drizzle', sight:240, travel:.9, wet:.35, snow:0, light:.7 },
  { id:'rain', label:'Rain', sight:180, travel:.75, wet:.65, snow:0, light:.62 },
  { id:'downpour', label:'Downpour', sight:45, travel:.5, wet:1, snow:0, light:.48 },
  { id:'storm', label:'Storm', sight:60, travel:.5, wet:1, snow:0, light:.4 },
  { id:'sleet', label:'Sleet', sight:120, travel:.75, wet:.55, snow:.12, light:.6 },
  { id:'snow', label:'Snow', sight:90, travel:.75, wet:.1, snow:.65, light:.65 },
  { id:'blizzard', label:'Blizzard', sight:15, travel:.5, wet:.1, snow:1, light:.4 },
  { id:'frost', label:'Frost', sight:800, travel:1, wet:0, snow:0, light:.82 },
  { id:'clear-cold', label:'Clear and cold', sight:1200, travel:1, wet:0, snow:0, light:1 },
  { id:'dry-thunder', label:'Dry thunder', sight:600, travel:1, wet:0, snow:0, light:.6 },
];

// Weights choose the heart of a spell. It arrives and departs through the related kinds below.
// Temperature bands are Celsius; returned temperatures are the four plain-language bands.
export const SEASONS = {
  autumn:{ temperature:[-3,10], weights:{ overcast:8,'low-fog':8,mist:10,'thick-fog':10,drizzle:14,rain:16,downpour:8,storm:5,sleet:5,snow:3,blizzard:0,frost:5,'clear-cold':2,'dry-thunder':2 } },
  winter:{ temperature:[-9,3], weights:{ overcast:5,'low-fog':5,mist:6,'thick-fog':7,drizzle:3,rain:2,downpour:0,storm:1,sleet:14,snow:30,blizzard:14,frost:8,'clear-cold':3,'dry-thunder':0 } },
  spring:{ temperature:[-1,13], weights:{ overcast:8,'low-fog':7,mist:9,'thick-fog':6,drizzle:18,rain:18,downpour:9,storm:7,sleet:4,snow:1,blizzard:0,frost:2,'clear-cold':2,'dry-thunder':2 } },
  summer:{ temperature:[8,18], weights:{ overcast:14,'low-fog':5,mist:8,'thick-fog':5,drizzle:14,rain:14,downpour:8,storm:7,sleet:0,snow:0,blizzard:0,frost:0,'clear-cold':1,'dry-thunder':10 } },
};

// Each 13-day window contains four fronts of 2–5 days: overcast, approach, heart, retreat.
// Seven windows fit a season exactly. Boundaries always pass through overcast, even at New Year.
export const FRONT_PATHS = {
  overcast:['mist','overcast','mist'],
  'low-fog':['mist','low-fog','mist'],
  mist:['low-fog','mist','low-fog'],
  'thick-fog':['low-fog','thick-fog','low-fog'],
  drizzle:['mist','drizzle','mist'],
  rain:['drizzle','rain','drizzle'],
  downpour:['rain','downpour','rain'],
  storm:['rain','storm','rain'],
  sleet:['drizzle','sleet','drizzle'],
  snow:['sleet','snow','sleet'],
  blizzard:['snow','blizzard','snow'],
  frost:['mist','frost','mist'],
  'clear-cold':['frost','clear-cold','frost'],
  'dry-thunder':['mist','dry-thunder','mist'],
};
export const NEIGHBOURS = {
  overcast:['low-fog','mist','drizzle','rain','sleet','snow','frost'],
  'low-fog':['overcast','mist','thick-fog'],
  mist:['overcast','low-fog','drizzle','frost','dry-thunder'],
  'thick-fog':['low-fog'],
  drizzle:['overcast','mist','rain','sleet'],
  rain:['overcast','drizzle','downpour','storm'],
  downpour:['rain'], storm:['rain'],
  sleet:['overcast','drizzle','snow'],
  snow:['overcast','sleet','blizzard'], blizzard:['snow'],
  frost:['overcast','mist','clear-cold'], 'clear-cold':['frost'], 'dry-thunder':['mist'],
};

export const LINES = {
  overcast:[
    'Cloud presses low enough to hide the watchtower roofs.',
    'The sky has the colour of old pewter, with no seam where the sun should be.',
    'A flat grey light leaves every window looking empty.',
  ],
  'low-fog':[
    'Fog fills the ditches and leaves the fence posts standing like markers in a flood.',
    'White vapour lies beneath the orchard branches without stirring a leaf.',
    'The road vanishes at ankle height where it drops into the hollow.',
  ],
  mist:[
    'Mist beads on the gate hinges and muffles the sound of the next house.',
    'The trees fade one by one into a veil the wind cannot lift.',
    'Every traveller wears a silver fringe of moisture along their sleeves.',
  ],
  'thick-fog':[
    'The fog swallows a raised hand before the arm is fully straight.',
    'A bell sounds close by, but even the nearest fence has disappeared.',
    'Water gathers on your eyelashes while the road ends three paces ahead.',
  ],
  drizzle:[
    'Fine rain sifts through the bare branches and finds every loose seam.',
    'The drizzle makes no sound except where it collects in broken gutters.',
    'Small drops hang from the roadside thorns like unfinished tears.',
  ],
  rain:[
    'Rain drums on the shuttered houses and runs brown between the cobbles.',
    'Water pours from the mouths of the roof carvings into the empty street.',
    'The road shines black beneath a steady curtain of rain.',
  ],
  downpour:[
    'Rain beats the ditch water flat and strips fresh earth from the banks.',
    'The cart ruts have become streams too muddy to judge by eye.',
    'Sheets of water hide the far end of every crossing.',
  ],
  storm:[
    'Thunder shakes dust from the rafters while rain drives beneath the doors.',
    'Lightning lays the valley bare for a heartbeat and leaves it darker afterwards.',
    'The wind bends the roadside crosses towards the mud.',
  ],
  sleet:[
    'Sleet rattles against the milestones and gathers in the folds of your cloak.',
    'Hard white grains bounce from the road before sinking into the black slush.',
    'The rain turns sharp enough to sting wherever skin is bare.',
  ],
  snow:[
    'Snow settles in the wheel tracks and softens the edges of the graveyard wall.',
    'Large flakes drift past the windows while the valley grows quiet.',
    'Fresh snow catches on every thorn and hides the shallow roadside graves.',
  ],
  blizzard:[
    'Driven snow erases the last footprints before the next step lands.',
    'The wind carries so much snow that the trees seem to move sideways.',
    'White drifts climb the doors and seal the lower windows.',
  ],
  frost:[
    'Frost whitens the gate chain and fixes each link against the next.',
    'A brittle skin of ice holds the shapes of leaves in the puddles.',
    'The grass cracks underfoot while pale rime feathers the gravestones.',
  ],
  'clear-cold':[
    'A pale opening in the cloud reveals the mountain ridges without warming them.',
    'Thin sunlight reaches the valley floor and stops short of the castle walls.',
    'The sky briefly clears to a washed blue above the smoking chimneys.',
  ],
  'dry-thunder':[
    'Thunder rolls behind the mountains, but the dust on the road stays dry.',
    'A light flickers inside the clouds without a single drop reaching the roofs.',
    'The valley waits beneath a rumbling sky that gives it no rain.',
  ],
};

export const GAZE_SIGNS = [
  { min:4, line:'a raven keeps its face towards the castle' },
  { min:4, line:'one shutter taps after the wind has stopped' },
  { min:5, line:'the clouds leave a narrow shadow on your road' },
  { min:5, line:'the mist parts around an empty patch beside you' },
  { min:6, line:'the light withdraws from every threshold at once' },
  { min:6, line:'your breath drifts towards Ravenloft against the wind' },
  { min:7, line:'a second shadow waits where yours should end' },
  { min:7, line:'the valley falls silent when you speak his name' },
  { min:8, line:'the clouds fold into the shape of a watching face' },
  { min:8, line:'every roadside raven turns its head at the same instant' },
  { min:9, line:'the castle windows shine through the clouds like open eyes' },
  { min:10, line:'a vast shadow raises one hand across the valley' },
];
