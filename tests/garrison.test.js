import test from 'node:test';
import assert from 'node:assert/strict';
import {stock,patrol,raise,calm} from '../src/engine/garrison.js';
import {buildEncounter} from '../src/engine/encounter.js';
import {mulberry32} from '../src/util/core.js';
const graph={rooms:Array.from({length:10},(_,id)=>({id})),links:Array.from({length:9},(_,i)=>({a:i,b:i+1,kind:'open'}))};
const list=[{id:'rat',fam:'folk',cr:'1/4'},{id:'wolf',fam:'dread',cr:'1/2'}];
const site={rooms:Object.fromEntries(graph.rooms.map(r=>[r.id,{role:r.id===1?'barracks':'guardpost',faction:'a',encounter:{fam:'folk',difficulty:'low'}}])),factions:[{id:'a',attitude:'hostile'}],route:[]};
const fresh=()=>stock(site,graph,{list,levels:[2,2],gaze:1,rng:mulberry32(42)});
test('stock follows catalogue family, budget and role and is reproducible',()=>{
 const a=fresh();assert.deepEqual(a,fresh());assert.equal(a.groups.length,10);assert.equal(a.groups[0].posture,'guard');assert.ok(['sleep','feast'].includes(a.groups[1].posture));
 const expected=buildEncounter(list,{levels:[2,2],difficulty:'low',fam:'folk',gaze:1,rng:mulberry32(42)});assert.equal(a.groups[0].budget,expected.budget);assert.ok(a.groups.every(g=>g.members.every(m=>m.b==='rat')));
 assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
});
test('noise fades with distance, and closed/secret doors muffle it',()=>{
 const a=fresh(),b=raise(a,{room:0,loud:5,round:1});assert.equal(b.groups[0].alert,3);assert.ok(b.alert[1]>0);assert.equal(b.alert[9],0);assert.equal(a.groups[0].alert,0);
 const closed=fresh();closed.graph.links[0].kind='door';const c=raise(closed,{room:0,loud:5,round:1});assert.ok(c.alert[1]<b.alert[1]);
 closed.graph.links[0].kind='secret';assert.equal(raise(closed,{room:0,loud:5,round:1}).alert[1],0);
});
test('sleepers wake later than guards, and runners deliver alarms on arrival',()=>{
 const a=fresh();a.groups[1].posture='sleep';const b=raise(a,{room:0,loud:6,round:1});assert.equal(b.groups[1].alert,0);assert.equal(b.groups[1].wakeAt,3);
 const c=raise(b,{room:0,loud:0,round:3});assert.ok(c.groups[1].alert>=2);assert.equal(c.groups[1].posture,'guard');assert.ok(c.messages.some(m=>m.delivered));
});
test('shortest unlocked routes carry runners; patrols respect keys',()=>{
 const a=fresh();a.graph.links=[{a:0,b:1,kind:'door',state:'locked',doors:['d']},{a:0,b:2,kind:'open'},{a:2,b:1,kind:'open'}];a.groups=a.groups.slice(0,3);
 const b=raise(a,{room:0,loud:6,round:1}),runner=b.moves.find(m=>m.group===a.groups[0].id && m.kind==='runner');assert.deepEqual(runner.path,[0,2]);assert.equal(runner.arrives,2);
 a.groups[0].posture='patrol';a.graph.links=[{a:0,b:1,kind:'door',state:'locked',doors:['d']}];assert.deepEqual(patrol(a.groups,a.graph,{hour:2,rng:()=>0})[0].rooms,[0]);
 a.groups[0].keys=['d'];assert.deepEqual(patrol(a.groups,a.graph,{hour:2,rng:()=>0})[0].rooms,[0,1,0]);
});
test('allies reinforce, rivals wait, wounded groups flee and calm restores posts',()=>{
 const a=fresh();a.groups=a.groups.slice(0,3);a.groups[1].posture='guard';a.groups[2].faction='b';a.factions.push({id:'b',attitude:'hostile',relations:{a:'hates'}});
 let b=raise(a,{room:0,loud:8,round:1});assert.ok(b.moves.some(m=>m.group===a.groups[1].id && m.why.includes('allies')));assert.equal(b.groups[2].reaction,'ambush-winner');assert.ok(!b.moves.some(m=>m.group===a.groups[2].id && m.kind==='group'));
 a.groups[1].hpFraction=.1;a.groups[0].xp=1000;b=raise(a,{room:1,loud:8,round:2});assert.ok(b.moves.some(m=>m.group===a.groups[1].id && m.to===0));
 const c=calm(b,30);assert.ok(c.groups.every(g=>g.room===g.post && g.alert===0));assert.ok(c.groups.every(g=>g.posture!=='sleep'));assert.deepEqual(JSON.parse(JSON.stringify(c)),c);
 assert.equal(calm(c,60).groups[1].posture,c.groups[1].homePosture);
});
test('boss selection stays within budget; empty groups never react',()=>{
 const s=structuredClone(site);s.rooms[0].role='boss';const a=stock(s,graph,{list:[...list,{id:'boss',fam:'folk',cr:'1/2',tags:['boss']}],levels:[2,2],gaze:1,rng:mulberry32(42)});
 assert.deepEqual(a.groups[0].members,[{b:'boss',n:1}]);assert.ok(a.groups[0].xp<=a.groups[0].budget);
 a.groups[0].members=[];assert.ok(!raise(a,{room:0,loud:8,round:1}).moves.some(m=>m.group===a.groups[0].id));
});
test('open secrets carry sound; quiet updates preserve elapsed quiet time',()=>{
 const a=fresh();a.graph.links[0]={a:0,b:1,kind:'secret',state:'open'};assert.equal(raise(a,{room:0,loud:4,round:1}).alert[1],3);
 a.quietMinutes=9;assert.equal(raise(a,{room:0,loud:0,round:1}).quietMinutes,9);
 a.groups[0].room=2;a.groups[0].alert=0;assert.equal(calm(a,30).groups[0].room,0);
});
