import test from 'node:test';
import assert from 'node:assert/strict';
import {startChase,chaseRound,result} from '../src/engine/chase.js';
import {COMPLICATIONS,TERRAINS} from '../src/data/chase.js';
import {mulberry32} from '../src/util/core.js';
const start=(extra={})=>startChase({quarry:[{id:'q',speed:30,con:10,dex:10}],pursuers:[{id:'p',speed:30,con:10,dex:10}],terrain:'road',light:'day',weather:'clear',rng:()=>.99,...extra});
const q=s=>s.participants.find(p=>p.id==='q');
test('six terrains each have at least twelve checked original complications',()=>{
 assert.equal(TERRAINS.length,6);for(const table of Object.values(COMPLICATIONS)){assert.ok(table.length>=12);assert.equal(new Set(table.map(c=>c.id)).size,table.length);for(const c of table){assert.ok(c.text);assert.ok(['con','dex'].includes(c.check.ability));assert.ok(c.check.dc>=10);assert.ok(Object.keys(c.effect).length);}}
});
test('three plus Con modifier Dashes are free, then DC 10 Con failures exhaust',()=>{
 let s=start({quarry:[{id:'q',speed:30,con:14,position:1000}]});for(let i=0;i<5;i++){const r=chaseRound(s,{q:'dash'},()=>0);s=r.state;assert.ok(!r.events.some(e=>e.kind==='dash-check'));}
 const r=chaseRound(s,{q:'dash'},()=>0);assert.equal(q(r.state).exhaustion,1);assert.equal(r.events.find(e=>e.kind==='dash-check').dc,10);
 const passed=chaseRound(s,{q:'dash'},()=>.99);assert.equal(q(passed.state).exhaustion,undefined);
});
test('speed differences close or widen the lead; capture and giving up resolve',()=>{
 const a=start({pursuers:[{id:'p',speed:60}]});const s=chaseRound(a,{},()=>.99).state;assert.equal(q(s).position-s.participants[1].position,30);
 const slow=chaseRound(start({pursuers:[{id:'p',speed:10}]}),{},()=>.99).state;assert.equal(q(slow).position-slow.participants[1].position,80);
 assert.equal(result(chaseRound(s,{},()=>.99).state).how,'captured');
 assert.equal(result(chaseRound(start(),{q:'giveup'},()=>.99).state).how,'gave up');
});
test('hiding needs both distance and cover',()=>{
 assert.ok(chaseRound(start(),{q:'hide'},()=>.99).events.some(e=>e.kind==='cannot-hide'));
 const good=chaseRound(start({light:'dim'}),{q:'hide'},()=>.99);assert.equal(result(good.state).how,'escaped');
 const close=chaseRound(start({light:'dim',quarry:[{id:'q',speed:30,position:20}]}),{q:'hide'},()=>.99);assert.ok(close.events.some(e=>e.kind==='cannot-hide'));
});
test('obstacles slow a pursuer after a failed check',()=>{
 const rolls=[.99,0,.99,.99,.99];const r=chaseRound(start(),{q:'obstacle'},()=>rolls.shift() ?? .99);assert.equal(r.state.participants[1].position,15);assert.ok(r.events.some(e=>e.kind==='obstacle-check' && !e.ok));
});
test('mount/team speed, damaged wagons and attacks are represented',()=>{
 const horse=chaseRound(start({quarry:[{id:'q',speed:30,mount:'riding horse'}]}),{},()=>.99).state;assert.equal(q(horse).position,120);
 const cart=chaseRound(start({quarry:[{id:'q',speed:30,cart:{team:'draft horse',hp:40,damage:21}}]}),{},()=>.99).state;assert.equal(q(cart).position,90);
 const hit=chaseRound(start({quarry:[{id:'q',speed:30,hp:20}],pursuers:[{id:'p',speed:30,range:100,attackBonus:20}]}),{p:{type:'attack',target:'q'}},()=>.99);assert.ok(q(hit.state).hp<20);assert.ok(hit.events.some(e=>e.kind==='attack'));
});
test('chases end within twenty rounds, repeat seeds and never mutate inputs',()=>{
 const original=start(),before=structuredClone(original),run=()=>{let s=original;const rng=mulberry32(42);for(let i=0;i<20 && !result(s).over;i++)s=chaseRound(s,{},rng).state;return s;};
 const a=run();assert.ok(result(a).over);assert.deepEqual(a,run());assert.deepEqual(original,before);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
});
