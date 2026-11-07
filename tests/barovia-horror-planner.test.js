import test from 'node:test';
import assert from 'node:assert/strict';
import {HORROR_ASSETS,ASSET_BY_ID} from '../src/render/horror-assets-index.js';
import {HORROR_SCENES,makeProtectedMask,planHorrorRoad,validateHorrorPlan} from '../src/render/barovia-horror-planner.js';

const ROADS=['r-mist','r-gates','r-east','r-castle','r-cut','r-tser','r-west','r-vallaki','r-lake','r-argyn','r-berez','r-winery','r-krezk','r-yester','r-tower'];
const fixture=()=>({W:40,H:40,paths:[{w:3,pts:[2,19,12,19,12,14,26,14,26,23,37,23]}],
 rooms:[[1,17,5,5,'entrance','Road entry'],[30,21,8,7,'entrance','Road exit']],
 water:[[24,32],[25,32],[26,32],[27,32]],buildings:[{x:32,y:2,w:4,h:4}],
 doors:[[3,19,'closed']],down:[36,24]});
const straight=()=>({W:40,H:40,paths:[{w:3,pts:[2,19,37,19]}],rooms:[[2,16,4,7],[34,16,4,7]]});

// The source index intentionally includes more models than a single run can place.
test('43 distinct original assets with consistent scene footprint metadata',()=>{
 assert.equal(HORROR_ASSETS.length,43);
 assert.equal(new Set(HORROR_ASSETS.map(a=>a.id)).size,43);
 for(const a of HORROR_ASSETS){
  assert.match(a.id,/^[a-z_]+$/);assert.ok(a.footprint.every(n=>n>=1&&n<=6));
  assert.ok(a.dmWhisper.length>=25);assert.ok(a.height>0);assert.equal(ASSET_BY_ID.get(a.id),a);
 }
});
test('all scene references resolve and horror beats have 3 unique stages',()=>{
 assert.ok(HORROR_SCENES.length>=12);
 for(const s of HORROR_SCENES){
  assert.ok(ASSET_BY_ID.has(s.primary));assert.ok(s.satellites.length>=3);
  assert.ok(s.satellites.every(x=>ASSET_BY_ID.has(x)));
  assert.ok(new Set([s.approach,s.reveal,s.aftermath]).size===3);
  assert.ok(!s.bloom||s.gaze>=3);
 }
});
test('15 routes × 20 seeds: deterministic, JSON, safe placement and unchanged input',()=>{
 for(const roadId of ROADS)for(let seed=0;seed<20;seed++){
  const layout=seed%2?fixture():straight(),before=JSON.stringify(layout);
  const opts={layout,roadId,seed:`wolf-${seed}`,gaze:seed%10+1,bloom:seed%3===0,density:'standard'};
  const p=planHorrorRoad(opts);
  assert.equal(JSON.stringify(layout),before);
  assert.deepEqual(planHorrorRoad(opts),p);
  assert.deepEqual(JSON.parse(JSON.stringify(p)),p);
  assert.deepEqual(validateHorrorPlan(layout,p),[],`${roadId} ${seed}: ${JSON.stringify(validateHorrorPlan(layout,p))}`);
  assert.equal(p.width,40);assert.equal(p.height,40);
  assert.ok(p.scenes.length<=2);
  for(const scene of p.scenes){assert.ok(scene.beats.approach&&scene.beats.reveal&&scene.beats.aftermath);
   assert.equal(scene.access.requiresGameplayPathCheck,true);}
 }
});
test('exclusion zones protect corridors, waters, rooms and extraProtected cells',()=>{
 const layout=straight(),extra=[[5,5],[6,5],[7,5],[5,6],[6,6],[7,6]];
 const p=planHorrorRoad({layout,roadId:'r-east',seed:'mask-test',gaze:10,bloom:true,density:'dense',extraProtected:extra});
 assert.deepEqual(validateHorrorPlan(layout,p,{extraProtected:extra}),[]);
 const a=makeProtectedMask(layout,{extra});
 assert.equal(a.mask[5*40+6],1);
 assert.equal(a.mask[19*40+20],1);
 assert.equal(a.mask[17*40+2],1);
});
test('rejects tampered placements that overlap a path or an existing model',()=>{
 const layout=straight(),p=planHorrorRoad({layout,seed:'tamper',roadId:'r-east',gaze:10,bloom:true});
 const x=structuredClone(p);x.placements.push({id:'last_light_inn',x:15,y:19,rot:0,footprint:[5,4]});
 assert.match(validateHorrorPlan(layout,x).join(' / '),/protected/);
 if(p.placements.length){const bad=structuredClone(p);bad.placements.push({...p.placements[0]});
  assert.match(validateHorrorPlan(layout,bad).join(' / '),/protected/);}
});
test('Gaze, Bloom and density control scene selection without inventing mechanical effects',()=>{
 const layout=straight();
 for(let gaze=1;gaze<=10;gaze++)for(const bloom of [false,true]){
  const p=planHorrorRoad({layout,gaze,bloom,density:'dense',seed:`g${gaze}`});
  for(const s of p.scenes){const def=HORROR_SCENES.find(x=>x.id===s.id);
   assert.ok(def.gaze<=gaze);assert.ok(bloom||!def.bloom);}
  assert.match(p.notes,/Visual-only/);
 }
});
test('a clean route yields a discoverable horror site at high Gaze',()=>{
 const layout=straight();let found=0,unique=new Set();
 for(let i=0;i<30;i++){
  const p=planHorrorRoad({layout,gaze:9,bloom:true,density:'dense',seed:`scarlet-${i}`,roadId:'r-cut'});
  if(p.scenes.length){found++;for(const s of p.scenes)unique.add(s.id);}
 }
 assert.ok(found>=25,`only ${found}/30 had a scene`);
 assert.ok(unique.size>=2,`Only ${unique.size} distinct scene types`);
});
test('performance: 250 deterministic plans under 3 seconds',()=>{
 const layout=straight(),start=performance.now();
 for(let i=0;i<250;i++)planHorrorRoad({layout,roadId:ROADS[i%ROADS.length],seed:i,gaze:i%10+1,bloom:true,density:'sparse'});
 const ms=performance.now()-start;assert.ok(ms<3000,`took ${ms.toFixed(1)} ms`);
});
