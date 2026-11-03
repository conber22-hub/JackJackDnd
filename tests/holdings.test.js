import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULES,MODULE_BY_ID as M } from '../src/data/holdings.js';
import { canPlace,startWork,advance,stats,grow,raidCheck,resolveRaid } from '../src/engine/holdings.js';
import { newCourt } from '../src/engine/nemesis.js';
import { mulberry32 } from '../src/util/core.js';
const floor={W:40,H:40,grid:Array(1600).fill(1)};
const home=()=>({id:'h',name:'Hearth',kind:'camp',place:'village',map:'m',modules:[],projects:[],stores:{timber:1000,gp:500},workers:[]});
const built=(module,x,y)=>({id:module,module,x,y,rot:0,built:true,hp:M[module].hp});
test('catalogue numbers and placement guards',()=>{
 for(const m of MODULES) for(const k of ['cost','days','labour','hp']) assert.ok(Number.isFinite(m[k]) && m[k]>0);
 const h=home();assert.ok(canPlace(h,'tent',{x:1,y:1},floor).ok);
 assert.equal(canPlace(h,'tent',{x:11,y:11},floor).ok,false);
 assert.equal(canPlace(h,'tent',{x:1,y:1},{...floor,grid:Array(1600).fill(0)}).ok,false);
 assert.equal(canPlace(h,'palisade',{x:2,y:2},floor).ok,false);
 assert.equal(canPlace(h,'forge',{x:1,y:1},floor).ok,false);
 h.modules.push(built('cottage',1,1));assert.ok(canPlace(h,'forge',{x:1,y:1},floor).ok);
 assert.equal(canPlace(h,'tent',{x:2,y:2},floor).ok,false);
 h.modules.push(built('forge',1,1));assert.equal(canPlace(h,'kitchen',{x:1,y:1},floor).ok,false);
});
test('projects reserve materials, require gold, and use a shared capped labour budget',()=>{
 const original=home(),start=startWork(original,'cottage',{x:1,y:1,floor});assert.ok(start.ok);assert.equal(original.modules.length,0);
 const h=start.holding;assert.equal(h.stores.timber,985);
 assert.equal(advance(h,{days:5,workers:3,gold:0},()=>.5).finished.length,0);
 const slow=advance(h,{days:4,workers:3,gold:150},()=>.5);assert.equal(slow.finished.length,0);
 assert.equal(advance(slow.holding,{days:1,workers:3,gold:0},()=>.5).finished.length,1);
 assert.equal(advance(h,{days:2.5,workers:6,gold:150},()=>.5).finished.length,1);
 assert.equal(advance(h,{days:1,workers:999,gold:150},()=>.5).finished.length,0);
 assert.equal(advance(h,{days:5,workers:3,gold:150},()=>0).events[0].kind,'delay');
 assert.equal(startWork(h,'tent',{x:1,y:1,floor}).ok,false);
});
test('stats, workshops and camp growth',()=>{
 const h=home();h.modules=[built('palisade',0,0),built('gate',4,0),built('watchtower',6,0),built('cottage',1,3),built('forge',1,3)];
 assert.equal(stats(h).defence,10);assert.equal(stats(h).income,5);assert.equal(stats(h).beds,4);assert.deepEqual(stats(h).workshops,['forge']);
 assert.ok(grow(h,'outpost').ok);assert.equal(grow(home(),'outpost').ok,false);
 h.modules.find(m=>m.module==='cottage').hp=0;assert.deepEqual(stats(h).workshops,[]);
});
test('wards and salt reduce seeded raid frequency; raids damage, steal, record and repair',()=>{
 const h=home();h.modules=[built('cottage',1,1)];const protectedHome=structuredClone(h);protectedHome.modules.push(built('shrine',6,6),built('salt-line',0,0));
 const court=newCourt(mulberry32(42));let a=0,b=0;
 for(let day=0;day<1000;day++){if(raidCheck(h,court,{gaze:5,day},mulberry32(day))) a++;if(raidCheck(protectedHome,court,{gaze:5,day},mulberry32(day))) b++;}assert.ok(b<a);
 const raid=raidCheck(h,court,{gaze:9,day:1},()=>0);assert.ok(raid);
 const result=resolveRaid(h,raid,{defenders:0},()=>0);assert.ok(result.damage.length);assert.ok(result.loot>0);assert.ok(result.court.members.find(m=>m.id===raid.member).history.length);assert.equal(court.members.find(m=>m.id===raid.member).history.length,0);
 assert.equal(resolveRaid(result.holding,raid,{},()=>0).ok,false);
 const repair=startWork(result.holding,'cottage',{repairId:'cottage'});assert.ok(repair.ok);const repaired=advance(repair.holding,{days:10,workers:6,gold:1000},()=>.5);assert.equal(repaired.holding.modules[0].hp,M.cottage.hp);
});
