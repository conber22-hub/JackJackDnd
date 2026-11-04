/* Original Barovian night events and the shelter they interrupt. */
export const PLACES = {
  holding:{chance:.20,comfort:'fair'},
  inn:{chance:.10,comfort:'good'},
  village:{chance:.15,comfort:'fair'},
  camp:{chance:.25,comfort:'fair'},
  road:{chance:.35,comfort:'poor'},
  dungeon:{chance:.40,comfort:'poor'},
};

export const DISTURBANCES = [
  {id:'wolf',n:'A nearby howl',severity:'noise',text:'A wolf howls just beyond the firelight.'},
  {id:'shutters',n:'Scratching shutters',severity:'noise',text:'Something scratches the shutters, then stops.'},
  {id:'bells',n:'Distant bells',severity:'noise',text:'A bell tolls once from an empty road.'},
  {id:'steps',n:'Footsteps outside',severity:'noise',text:'Slow footsteps circle the shelter and fade.'},
  {id:'window',n:'A face at the glass',severity:'scare',text:'A pale face looks in, then vanishes.'},
  {id:'voice',n:'A familiar voice',severity:'scare',text:'A voice in the dark calls a hero by name.'},
  {id:'mist',n:'The creeping Mists',severity:'scare',text:'The Mists press against the door and refuse to thin.'},
  {id:'knock',n:'Three knocks',severity:'scare',text:'Three knocks come from a wall without a door.'},
  {id:'wolves',n:'Wolves at the gate',severity:'fight',text:'Hungry wolves force their way into the shelter.'},
  {id:'raiders',n:'Midnight raiders',severity:'fight',text:'Armed strangers rush the sleeping place.'},
  {id:'dead',n:'The restless dead',severity:'fight',text:'Cold hands break through the earth beside the camp.'},
  {id:'shadows',n:'Shadows in the hall',severity:'fight',text:'A moving shadow attacks anyone who wakes.'},
];

export const DREAMS = [
  'A black carriage waits at a crossroads that has no signs.',
  'The church bell rings beneath a frozen lake.',
  'A stranger at the hearth knows the name you have forgotten.',
  'You follow a red thread through a house without doors.',
  'The Mists part to show your childhood home, empty and unlit.',
  'A raven drops a silver key into a well that never ends.',
  'Someone has sewn your shadow to a velvet curtain.',
  'At dawn, every window in Vallaki shows the same face.',
  'A candle burns blue as a voice counts the missing.',
];
