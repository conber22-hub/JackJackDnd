import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {VILLAGE_STAGES,VILLAGE_ARCHETYPES,VILLAGE_ARCHETYPE_BY_ID} from '../src/data/barovia-dead-villages-data.js';
import {chooseVillageArchetype,planDeadVillage,advanceDeadVillage,playerVillageSkins,validateDeadVillage} from '../src/engine/barovia-dead-villages.js';
const manifest=JSON.parse(readFileSync(new URL('../docs/barovia/dead-villages-vi-manifest.json',import.meta.url)));
const clone=value=>JSON.parse(JSON.stringify(value));
const sample=()=>({W:40,H:40,buildings:[
 {x:3,y:4,w:5,h:4,name:'The Last Candle Inn',door:'s',dark:false},
 {x:16,y:6,w:4,h:3,name:'The Carpenter House',door:'w',dark:true},
 {x:24,y:14,w:5,h:5,name:'The Church',door:'e',dark:false},
 {x:6,y:24,w:6,h:5,name:'An Abandoned Manor',door:'n',dark:true},
 {x:24,y:25,w:4,h:4,name:'A Cottage',door:'s'}
 ],paths:[{w:3,pts:[1,20,38,20]}],doors:[[3,20,'closed']],water:[[11,11]],up:[33,2],down:null});

test('12 archetypes each have three original stage models (36 GLBs)',()=>{
 assert.equal(VILLAGE_ARCHETYPES.length,12);assert.deepEqual(VILLAGE_STAGES,['inhabited','abandoned','infested']);
 assert.equal(manifest.archetypeCount,12);assert.equal(manifest.modelCount,36);
 assert.equal(new Set(VILLAGE_ARCHETYPES.map(x=>x.id)).size,12);
 for(const kind of VILLAGE_ARCHETYPES){assert.equal(VILLAGE_ARCHETYPE_BY_ID[kind.id],kind);assert.equal(kind.read.length,3);
  assert.equal(Object.keys(kind.states).length,3);for(const s of VILLAGE_STAGES)assert.ok(kind.states[s].endsWith(`_${s}.glb`));}
});
test('all GLBs exist, embed geometry, have valid headers and low draw counts',()=>{
 for(const a of manifest.models){const file=readFileSync(new URL('../public/assets/dead-villages/'+a.file,import.meta.url));
  assert.equal(file.toString('ascii',0,4),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
  assert.ok(file.length>1000&&file.length<90000,`${a.id} size`);assert.ok(a.drawCalls<=14,`${a.id} draw calls`);
  assert.ok(a.parts>10);assert.equal(a.visualOnly,true);
 }
});
test('stage variants keep exact footprint and common ground anchor',()=>{
 for(const kind of VILLAGE_ARCHETYPES){const all=manifest.models.filter(m=>m.kind===kind.id);
  assert.equal(all.length,3);const [w,h]=kind.footprint;
  for(const asset of all){const [[xmin,ymin,zmin],[xmax,ymax,zmax]]=asset.bounds;
   assert.ok(xmin>=-w/2-.001&&xmax<=w/2+.001,asset.id+' x');assert.ok(zmin>=-h/2-.001&&zmax<=h/2+.001,asset.id+' z');
   assert.ok(ymin>=-.02&&ymin<.1);assert.ok(ymax>1.5);assert.deepEqual(asset.footprint,kind.footprint);
  }
  const z=all.map(m=>m.bounds[1][2]);assert.ok(Math.max(...z)-Math.min(...z)<.003,kind.id+' front door anchor');
 }
});
test('all named buildings map to the correct intended archetype',()=>{
 for(const [name,expected] of [['The Last Candle Inn','last_candle_inn'],['Saint Andral Church','morning_chapel'],['Village Manor','burgomaster_manor'],['Watch Tower','gallows_watch'],['The Market','market_stallhouse'],['Cooper Workshop','charcoal_workshop'],['Granary','river_granary'],['Old Ossuary','mourners_ossuary'],['Schoolhouse','bell_schoolhouse'],['Peat Hut','peat_hut']])assert.equal(chooseVillageArchetype({name,w:5,h:4}),expected);
});
test('100 seeds generate deterministic, pure plans that preserve every building footprint and door',()=>{
 const layout=sample(),before=clone(layout);
 for(let i=0;i<100;i++){
  const o={layout,seed:'dead-village-'+i,settlementId:'vallaki',stage:'abandoned',intensity:.75};
  const a=planDeadVillage(o);assert.deepEqual(planDeadVillage(o),a);assert.deepEqual(clone(a),a);
  assert.deepEqual(validateDeadVillage(layout,a),[]);
  assert.equal(a.skins.length,layout.buildings.length);
  for(const b of a.skins){const source=layout.buildings[b.buildingIndex];assert.deepEqual([b.x,b.y,b.w,b.h,b.door],[source.x,source.y,source.w,source.h,source.door]);}
 }
 assert.deepEqual(layout,before);
});
test('all four door orientations produce stable output rotations',()=>{
 const l=sample();const p=planDeadVillage({layout:l,seed:'rotation',settlementId:'barovia'});
 assert.deepEqual(p.skins.slice(0,4).map(s=>s.rot),[0,3,1,2]);
});
test('no imported map props, roads, stairs, water or door state are mutated',()=>{
 const l=sample(),original=clone(l),plan=planDeadVillage({layout:l,stage:'infested',settlementId:'village',seed:'bad-news'});
 assert.equal(plan.visualOnly,true);assert.deepEqual(original,l);assert.equal('paths' in plan,false);assert.equal('water' in plan,false);
 assert.deepEqual(validateDeadVillage(l,plan),[]);
});
test('visual states advance without moving buildings, reversing stage or changing kind',()=>{
 const l=sample();const first=planDeadVillage({layout:l,seed:'remember',settlementId:'berez',stage:'inhabited'});
 const abandoned=advanceDeadVillage(first,{stage:'abandoned',intensity:1});
 const infested=advanceDeadVillage(abandoned,{stage:'infested',intensity:1});
 assert.ok(first.skins.every(s=>s.stage==='inhabited'));
 assert.ok(abandoned.skins.every(s=>s.stage==='abandoned'));
 assert.ok(infested.skins.every(s=>s.stage==='infested'));
 for(let i=0;i<first.skins.length;i++){
  const base=first.skins[i],evil=infested.skins[i];
  assert.deepEqual([evil.x,evil.y,evil.w,evil.h,evil.door,evil.rot,evil.kind,evil.roll],[base.x,base.y,base.w,base.h,base.door,base.rot,base.kind,base.roll]);
 }
 assert.ok(first.skins.every(s=>s.stage==='inhabited'));
 assert.throws(()=>advanceDeadVillage(infested,{stage:'abandoned'}),/Restoration/);
 const revived=advanceDeadVillage(infested,{stage:'inhabited',allowRestoration:true});assert.ok(revived.skins.every(s=>s.stage==='inhabited'));
});
test('at intermediate intensities, only known states are selected and corruption spreads monotonically',()=>{
 const l=sample();
 for(let seed=0;seed<40;seed++){
  let p=planDeadVillage({layout:l,seed:'spread'+seed,settlementId:'krezk',stage:'infested',intensity:0});
  const count=()=>p.skins.filter(s=>s.stage==='infested').length;
  let prev=count();assert.equal(prev,0);
  for(let k=1;k<=10;k++){
   p=advanceDeadVillage(p,{stage:'infested',intensity:k/10});const cur=count();assert.ok(cur>=prev);prev=cur;
  }
  assert.equal(count(),l.buildings.length);
 }
});
test('players see only required render fields, not narrative, seed, stages, rolls or future surprises',()=>{
 const p=planDeadVillage({layout:sample(),settlementId:'village',seed:'secret-plot',stage:'infested',intensity:.64});
 const out=playerVillageSkins(p);assert.equal(out.length,p.skins.length);
 for(const s of out)assert.deepEqual(Object.keys(s).sort(),['door','h','id','model','w','x','y']);
 const json=JSON.stringify(out);assert.ok(!json.includes('read'));assert.ok(!json.includes('roll'));assert.ok(!json.includes('intensity'));assert.ok(!json.includes('secret-plot'));
});
test('invalid options, layouts and copied/tampered plans fail closed',()=>{
 const l=sample();
 assert.throws(()=>planDeadVillage({layout:l,settlementId:'bad;code'}),/seed|settlementId/);
 assert.throws(()=>planDeadVillage({layout:l,stage:'end-times'}),/stage/);
 assert.throws(()=>planDeadVillage({layout:l,intensity:NaN}),/stage|intensity/);
 assert.throws(()=>planDeadVillage({layout:{W:40,H:40}}),/layout/);
 const broken=sample();broken.buildings[0].x=-2;assert.throws(()=>planDeadVillage({layout:broken}),/footprint/);
 const wrong=sample();wrong.buildings[0].door='ceiling';assert.throws(()=>planDeadVillage({layout:wrong}),/door/);
 const p=planDeadVillage({layout:l,settlementId:'vallaki'});const q=clone(p);q.skins[0].x+=1;q.skins[1].model='poison.glb';
 assert.equal(validateDeadVillage(l,q).length,2);
});
test('600 buildings plan in under one second',()=>{
 const l={W:512,H:512,buildings:Array.from({length:600},(_,i)=>({x:(i%40)*11+2,y:Math.floor(i/40)*11+2,w:4,h:4,name:i%2?'Cottage':'Inn',door:'s'}))};
 const t=performance.now();for(let i=0;i<25;i++)planDeadVillage({layout:l,seed:'speed'+i,settlementId:'crowded',stage:'infested',intensity:.5});
 assert.ok(performance.now()-t<1000);
});
