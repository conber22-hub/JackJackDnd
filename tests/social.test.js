import test from 'node:test';
import assert from 'node:assert/strict';
import {attitudeOf,influence,remember,recall,rumour,forPlayers} from '../src/engine/social.js';
import {mulberry32} from '../src/util/core.js';
const person=(extra={})=>({id:'p',name:'Mara',role:'priest',mood:'wary',day:0,...extra});
const act=(p,extra={})=>influence(p,{approach:'persuade',hero:{id:'h',skills:{Persuasion:0}},rng:()=>.5,...extra});
test('moods, Gaze, fear and DC bands govern requests',()=>{
 for(const [mood,attitude,dc] of [['easy','friendly',10],['wary','indifferent',15],['afraid','hostile',20]]){assert.equal(attitudeOf(person({mood}),{gaze:1}),attitude);assert.equal(act(person({mood})).dc,dc);}
 assert.equal(attitudeOf(person(),{gaze:8}),'hostile');assert.equal(act(person({fearActive:true})).dc,null);assert.equal(act(person({mood:'afraid'}),{request:'dangerous'}).ok,false);
 assert.notEqual(attitudeOf(person({fearActive:true,fearResolved:true})),'terrified');
});
test('wants and fears lower DCs; fear costs warmth and reports witnesses',()=>{
 const p=person();assert.equal(act(p,{want:true}).dc,10);
 const a=act(p,{approach:'intimidate',fear:true,roll:20}),b=act(p,{approach:'intimidate',fear:false,roll:20});assert.ok(a.dc<b.dc);assert.ok(a.person.memories.some(m=>m.kind==='intimidated'));assert.equal(a.cost.witness.person,p.id);assert.equal(a.cost.witness.hero,'h');
 const insight=act(p,{approach:'insight',roll:20});assert.match(insight.text,/dead buried/);assert.equal(insight.shift,0);
});
test('bad failures worsen attitudes; promises and bribes are explicit costs',()=>{
 const a=act(person(),{roll:1});assert.equal(a.shift,-1);assert.equal(attitudeOf(a.person),'hostile');
 const b=act(person(),{approach:'bribe',offer:25,roll:20,promise:'Bury the forgotten dead.'});assert.equal(b.cost.gp,25);assert.ok(b.person.memories.some(m=>m.debt));assert.equal(b.cost.promise,'Bury the forgotten dead.');
});
test('ordinary memories fade, rescue lasts through weeks of Gaze, debts never fade or evict',()=>{
 let p=remember(person(),{kind:'rescue',text:'They saved my son.'});assert.equal(attitudeOf(p,{gaze:10,day:21}),'friendly');assert.ok(recall(p,{day:60})[0].weight<recall(p,{day:1})[0].weight);
 p=remember(p,{kind:'promise',debt:true,weight:2,text:'An unpaid promise.'});for(let i=0;i<30;i++)p=remember(p,{kind:'paid'});
 assert.equal(recall(p,{day:10000}).find(m=>m.debt).weight,2);assert.ok(p.memories.length<=21);
});
test('exposed lies are remembered; rumour veracity stays DM-only',()=>{
 const a=act(person(),{approach:'deceive',exposed:true,roll:1});assert.ok(a.person.memories.some(m=>m.kind==='lie'));
 for(const [mood,veracity] of [['easy','true'],['wary','half'],['afraid','lie']]){const p=person({mood}),r=rumour(p,{truth:'The west gate is watched.',half:'The west gate may be watched.',lie:'The west gate is unguarded.'},()=>0);assert.equal(r.veracity,veracity);assert.deepEqual(forPlayers({...p,rumour:r,secret:'spy',memories:[{weight:100}],dc:20}),{id:'p',name:'Mara',role:'priest',rumour:{text:r.text}});}
});
test('seeded results are JSON-safe and inputs stay unchanged',()=>{
 const p=person(),before=structuredClone(p),options={approach:'perform',hero:{skills:{Performance:3}}};
 const a=influence(p,{...options,rng:mulberry32(42)});assert.deepEqual(a,influence(p,{...options,rng:mulberry32(42)}));assert.deepEqual(JSON.parse(JSON.stringify(a)),a);assert.deepEqual(p,before);
});
