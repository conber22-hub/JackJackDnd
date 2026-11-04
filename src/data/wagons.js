// Original road rules for the valley; fitting IDs match the workshop catalogue.
export const FITTINGS = [
  {id:'lockbox',n:'Lockbox',does:'Theft takes nothing from the locked box.'},
  {id:'lantern-hooks',n:'Lantern hooks',does:'Lanterns remove the night travel penalty.'},
  {id:'spare-wheel',n:'Spare wheel',does:'A breakdown delays the wagon for one hour instead of twelve.'},
  {id:'bunks',n:'Bunks',does:'Sleepers with a bunk get a long rest on the road; the rest sleep poorly.'},
  {id:'smithy-box',n:'Smithy box',does:'Tools repair 1d6 + 2 HP each day on the road.'},
  {id:'salt-barrels',n:'Salt barrels',does:'Salt keeps a Bloom event away and can mark a salt line at camp.'},
  {id:'hidden-compartment',n:'Hidden compartment',does:'Searchers need a DC 18 check to find what is hidden.'},
  {id:'ward-runes',n:'Ward-runes',does:'The Mists and the Count’s servants take −2 on checks against the wagon, and the Mists turn it back half as often.'},
];
export const ROAD_FACTOR = {road:1,track:.75,wild:.5};
export const WEATHER_FACTOR = {clear:1,rain:.8,snow:.5,fog:.75};
export const NIGHT_FACTOR = .5;
