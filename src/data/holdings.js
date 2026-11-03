/* Original valley construction rules. Costs are gp; storage is lb; time is days
   with the listed crew. Damage disables a module only when its hp reaches zero. */
export const KINDS={
 camp:{w:12,h:12,next:['house','outpost'],needs:[]},
 house:{w:16,h:16,next:['homestead'],needs:['cottage']},
 homestead:{w:20,h:20,next:['outpost'],needs:['cottage','garden','well']},
 outpost:{w:24,h:24,next:['fort'],needs:['palisade','gate','watchtower']},
 fort:{w:32,h:32,next:['keep'],needs:['stone-wall','gate','bunkhouse']},
 keep:{w:40,h:40,next:[],needs:['stone-wall','gate','hall','watchtower']},
};
const all=Object.keys(KINDS);
const m=(id,n,w,h,on,cost,days,labour,gives,needs=[])=>({id,n,kinds:all,footprint:{w,h},on,cost,materials:{[id==='salt-line'?'salt':['stone-wall','well','shrine','forge'].includes(id)?'stone':'timber']:Math.max(1,Math.ceil(cost/10))},days,labour,needs,gives,hp:Math.max(10,days*10),flavour:`${n}: a little shelter against the valley.`});
// Every kind can build its successor's prerequisites; footprint limits constrain growth.
export const MODULES=[
 m('palisade','Palisade',4,1,'wall',40,2,2,{defence:3,upkeep:1}),
 m('stone-wall','Stone Wall',4,1,'wall',200,5,4,{defence:8,upkeep:2}),
 m('gate','Gate',2,1,'wall',50,2,2,{defence:2}),
 m('watchtower','Watchtower',2,2,'ground',150,4,3,{defence:5}),
 m('ditch','Ditch',4,1,'wall',10,1,2,{defence:2}),
 m('salt-line','Salt Line',4,1,'wall',10,1,1,{ward:2,salt:true,upkeep:2}),
 m('bedroll-ring','Bedroll Ring',2,2,'ground',5,1,1,{beds:4,comfort:1}),
 m('tent','Tent',2,2,'ground',10,1,1,{beds:2,comfort:1,building:true}),
 m('cottage','Cottage',4,4,'ground',150,5,3,{beds:4,comfort:3,building:true,upkeep:2}),
 m('hall','Hall',6,6,'ground',600,10,5,{beds:8,comfort:4,building:true,upkeep:5}),
 m('bunkhouse','Bunkhouse',4,4,'ground',200,5,3,{beds:12,comfort:2,building:true,upkeep:3}),
 m('kitchen','Kitchen',2,2,'inside',50,2,2,{comfort:2,upkeep:1}),
 m('stable','Stable',3,3,'ground',80,3,2,{storage:200,building:true,upkeep:1}),
 m('wagon-shed','Wagon Shed',4,3,'ground',60,2,2,{storage:400,building:true}),
 m('storehouse','Storehouse',3,3,'ground',100,3,2,{storage:1000,building:true,upkeep:1}),
 m('cellar','Cellar',2,2,'inside',80,3,2,{storage:500}),
 m('forge','Forge',2,2,'inside',200,4,2,{workshops:['forge'],income:5,upkeep:2}),
 m('carpenter','Carpenter',2,2,'inside',100,3,2,{workshops:['carpenter'],income:3,upkeep:1}),
 m('alchemist','Alchemist’s Bench',1,1,'inside',250,4,1,{workshops:['alchemist'],upkeep:2}),
 m('shrine','Morninglord Shrine',2,2,'ground',100,3,2,{ward:3,comfort:1}),
 m('library','Library',2,2,'inside',200,4,2,{comfort:2,workshops:['library']}),
 m('garden','Garden',3,3,'ground',20,2,1,{income:2,comfort:1}),
 m('well','Well',1,1,'ground',50,3,2,{comfort:1}),
];
export const MODULE_BY_ID=Object.fromEntries(MODULES.map(m=>[m.id,m]));
