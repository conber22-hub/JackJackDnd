/* 16 locations + 15 road links, mirrored from JackJackDnd src/data/barovia-map.js
   (claude/dread-delve-v0.2, inspected Nov 2026). For production pass VALLEY_ROADS
   from the repository to planRoadLink to prevent independent catalog drift. */
export const PLACES = Object.freeze({
  mists:'The Mist Wall',gates:'The Gates of Barovia',village:'Village of Barovia',
  crossroads:'The Gallows Crossroads',castle:'Castle Ravenloft',coffin:'The Iron Coffin',
  tser:'Tser Pool',bonegrinder:'Old Bonegrinder',vallaki:'Vallaki',lake:'Lake Zarovich',
  argyn:'Argynvostholt',berez:'Berez',winery:'The Wizard of Wines',krezk:'Krezk',
  yester:'Yester Hill',tower:'The Lonely Tower',
});
export const LINKS = Object.freeze([
  {id:'r-mist',a:'mists',b:'gates',name:'Out of the mist',len:1,way:'road',mist:true},
  {id:'r-gates',a:'gates',b:'village',name:'Old Svalich Road (the gates)',len:2,way:'road'},
  {id:'r-east',a:'village',b:'crossroads',name:'Old Svalich Road',len:2,way:'road',river:true},
  {id:'r-castle',a:'crossroads',b:'castle',name:'The castle road',len:2,way:'road'},
  {id:'r-cut',a:'crossroads',b:'coffin',name:'The burned cut',len:2,way:'trail'},
  {id:'r-tser',a:'crossroads',b:'tser',name:'The Tser Pool path',len:1,way:'path',river:true},
  {id:'r-west',a:'tser',b:'bonegrinder',name:'Old Svalich Road (west)',len:2,way:'road'},
  {id:'r-vallaki',a:'bonegrinder',b:'vallaki',name:'Old Svalich Road (to Vallaki)',len:2,way:'road'},
  {id:'r-lake',a:'vallaki',b:'lake',name:'The lake path',len:1,way:'path'},
  {id:'r-argyn',a:'vallaki',b:'argyn',name:'The cliff path',len:2,way:'trail'},
  {id:'r-berez',a:'vallaki',b:'berez',name:'The river path',len:2,way:'path',river:true},
  {id:'r-winery',a:'vallaki',b:'winery',name:'Old Svalich Road (to Krezk)',len:2,way:'road'},
  {id:'r-krezk',a:'winery',b:'krezk',name:'The Krezk road',len:2,way:'road'},
  {id:'r-yester',a:'krezk',b:'yester',name:'The hill path',len:1,way:'trail'},
  {id:'r-tower',a:'berez',b:'tower',name:'The tarn path',len:2,way:'trail',river:true},
]);
