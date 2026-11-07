import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { HIDDEN_SITES, HIDDEN_SITE_BY_ID } from '../src/render/barovia-hidden-data.js';
import { ROAD_IDS,hiddenProtectedMask,planHiddenSites,validateHiddenPlan,revealHiddenSite,visibleHiddenModels,dmHiddenSites } from '../src/render/barovia-hidden-sites.js';
const manifest=JSON.parse(readFileSync(new URL('../public/assets/hidden-sites/manifest.json',import.meta.url)));
const clone=o=>JSON.parse(JSON.stringify(o));
function map(){return {W:40,H:40,rooms:[[1,2,5,5,'entrance'],[32,20,5,7,'chamber']],paths:[{w:3,pts:[2,18,36,18]},{w:2,pts:[10,18,10,29]}],water:[[2,11],[2,12],[3,12]],doors:[[4,18,'closed']],up:[5,4],down:[35,23],buildings:[{x:21,y:23,w:5,h:4}],props:[['pine',29,8,0]]};}
test('the catalogue contains 12 paired, independently authored sites and 24 GLBs',()=>{
 assert.equal(HIDDEN_SITES.length,12);assert.equal(manifest.pairs.length,12);assert.equal(manifest.modelCount,24);
 assert.equal(new Set(HIDDEN_SITES.map(s=>s.id)).size,12);
 for(const s of HIDDEN_SITES){assert.ok(s.title&&s.approach&&s.reveal&&s.return);assert.equal(HIDDEN_SITE_BY_ID[s.id],s);assert.ok(s.roads.length);}
});
test('every GLB is self-contained and each sealed/revealed pair keeps footprint and base anchor',()=>{
 for(const item of manifest.assets){
  const file=readFileSync(new URL('../public/assets/hidden-sites/'+item.file,import.meta.url));
  assert.equal(file.toString('ascii',0,4),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
  assert.ok(item.bytes<130000);assert.ok(item.drawCalls<=14);
 }
 for(const s of HIDDEN_SITES){
  const a=manifest.assets.find(x=>x.id===s.sealed),b=manifest.assets.find(x=>x.id===s.revealed);
  assert.deepEqual(a.footprint,b.footprint);
  for(const i of [0,2]){assert.ok(Math.abs(a.bounds[0][i]-b.bounds[0][i])<.001);assert.ok(Math.abs(a.bounds[1][i]-b.bounds[1][i])<.28);}
 }
});
test('protected mask reserves road, water, rooms, doors, stair locations, prop and building footprints',()=>{
 const l=map(),m=hiddenProtectedMask(l);const safe=(x,y)=>m[y*40+x];
 for(const pt of [[12,18],[21,24],[2,11],[4,18],[5,4],[35,23],[29,8],[2,3]])assert.equal(safe(...pt),1,String(pt));
 assert.equal(safe(17,8),0);
});
test('all 15 valley roads have valid deterministic placements over 20 seeds',()=>{
 const l=map(),before=clone(l);
 for(const roadId of ROAD_IDS)for(let seed=0;seed<20;seed++){
  const opts={layout:l,roadId,seed:`road-${seed}`,gaze:1+seed%10,bloom:seed%2===0};
  const p=planHiddenSites(opts);assert.deepEqual(p,planHiddenSites(opts));assert.deepEqual(validateHiddenPlan(l,p),[]);assert.deepEqual(clone(p),p);
  assert.equal(p.visualOnly,true);assert.ok(p.sites.length<=2);
 }
 assert.deepEqual(l,before);
});
test('revelation changes only visual state and does not mutate original plans or the layout',()=>{
 const l=map(),p=planHiddenSites({layout:l,seed:'discover',roadId:'r-cut',density:1,maxSites:3});assert.ok(p.sites.length);
 const first=p.sites[0],original=clone(p),rev=revealHiddenSite(p,first.id);
 assert.deepEqual(p,original);assert.equal(rev.sites.find(s=>s.id===first.id).revealed,true);
 assert.deepEqual(rev.sites.map(x=>[x.id,x.x,x.y,x.w,x.h]),p.sites.map(x=>[x.id,x.x,x.y,x.w,x.h]));
 assert.deepEqual(validateHiddenPlan(l,rev),[]);
});
test('player visuals never contain DM-only read-alouds, return clues, road ids, or discovery flags',()=>{
 const p=planHiddenSites({layout:map(),seed:'no-leak',roadId:'r-east',density:1});
 const visual=visibleHiddenModels(p);for(const o of visual)assert.deepEqual(Object.keys(o).sort(),['h','model','w','x','y']);
 assert.ok(dmHiddenSites(p).every(s=>s.approach&&s.reveal&&s.return));
 assert.ok(!JSON.stringify(visual).includes('approach'));assert.ok(!JSON.stringify(visual).includes('revealed')); // sealed models only
});
test('bad inputs fail closed; malicious/unknown ids cannot be revealed',()=>{
 assert.throws(()=>planHiddenSites({layout:map(),roadId:'fake'}),/road/);
 assert.throws(()=>planHiddenSites({layout:map(),maxSites:7}),/maxSites/);
 assert.throws(()=>planHiddenSites({layout:map(),density:NaN}),/density/);
 assert.throws(()=>hiddenProtectedMask(map(),{W:9999}),/dimensions/);
 assert.throws(()=>revealHiddenSite({sites:[]},'invalid'),/Unknown/);
});
test('planner rejects colliding / out of bounds fabricated sites',()=>{
 const l=map(),a={id:'svalich_road_hatch',x:12,y:18,w:3,h:3,revealed:false};
 const p={W:40,H:40,roadId:'r-east',sites:[a,{...a}]};
 assert.ok(validateHiddenPlan(l,p).some(e=>/protected|overlap/.test(e)));
});
test('planner does not block a path under 250 randomized allocations',()=>{
 const l=map(),t=performance.now();for(let i=0;i<250;i++){
  const p=planHiddenSites({layout:l,roadId:ROAD_IDS[i%ROAD_IDS.length],seed:'stress-'+i,maxSites:6,density:1,gaze:10});
  assert.deepEqual(validateHiddenPlan(l,p),[]);
 }
 assert.ok(performance.now()-t<2500);
});
