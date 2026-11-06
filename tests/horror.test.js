import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKS,SOURCES} from '../src/data/horror.js';
import {horrorCheck,stress,longRest,relief,cure,whisper} from '../src/engine/horror.js';
import {mulberry32} from '../src/util/core.js';
const hero=extra=>({id:'h',saves:{wis:0},...extra});
const check=(h,extra={})=>horrorCheck(h,{source:'dead-rising',gaze:1,rng:mulberry32(42),...extra});
test('source DCs and Gaze scale, and previous success grants advantage',()=>{
 for(const source of Object.keys(SOURCES)){assert.equal(check(hero(),{source,roll:[20]}).dc,SOURCES[source].dc);assert.equal(check(hero(),{source,gaze:8,roll:[20]}).dc,SOURCES[source].dc+3);}
 const a=check(hero(),{roll:[20]}),dice=[1,20],b=check(a.hero,{roll:dice});assert.equal(b.ok,true);assert.equal(b.roll.advantage,true);assert.deepEqual(b.roll.dice,[1,20]);assert.deepEqual(dice,[1,20]);
});
test('margins choose frightened, short and lasting marks; stress at three forces lasting',()=>{
 assert.equal(check(hero(),{dc:12,roll:[11]}).effect.kind,'frightened');assert.equal(check(hero(),{dc:12,roll:[7]}).effect.kind,'short');assert.equal(check(hero(),{dc:12,roll:[2]}).effect.kind,'lasting');
 const h=hero({horror:{enabled:true,fails:3}}),a=check(h,{dc:12,roll:[11]});assert.equal(a.effect.kind,'lasting');assert.equal(stress(a.hero),4);assert.equal(stress(h),3);
});
test('thirty unique marks have playable mechanics and all lasting cures work',()=>{
 assert.ok(MARKS.length>=30);assert.equal(new Set(MARKS.map(m=>m.id)).size,MARKS.length);
 for(const m of MARKS){assert.ok(m.n && m.text);assert.ok(m.mechanics.disadvantage || m.mechanics.advantage || m.mechanics.conditions?.every(c=>['frightened','prone'].includes(c)));
 if(m.kind==='lasting')for(const treatment of m.cure){const h=hero({horror:{marks:[{id:m.id}]}});assert.equal(cure(h,m.id,treatment).ok,true);assert.equal(cure(h,m.id,treatment).hero.horror.marks.length,0);assert.equal(h.horror.marks.length,1);}}
});
test('long rests remove short marks, safe rest clears one stress, relief is bounded',()=>{
 const short=MARKS.find(m=>m.kind==='short'),lasting=MARKS.find(m=>m.kind==='lasting'),h=hero({horror:{fails:3,marks:[{id:short.id},{id:lasting.id}]}});
 const a=longRest(h,{safe:true});assert.deepEqual(a.horror.marks,[{id:lasting.id}]);assert.equal(stress(a),2);assert.equal(stress(longRest(h)),3);assert.equal(stress(relief(a,'meal')),1);assert.equal(stress(relief(hero(),'prayer')),0);
 assert.equal(cure(h,lasting.id,'long-rest').ok,false);
});
test('whispers require an eligible lasting mark and high Gaze, once per session',()=>{
 const m=MARKS.find(m=>m.whisper),h=hero({horror:{marks:[{id:m.id}]}});
 assert.equal(whisper(h,m.id,{gaze:6,session:'s',rng:()=>0}).ok,false);
 const a=whisper(h,m.id,{gaze:8,session:'s',rng:()=>0});assert.equal(a.ok,true);assert.equal(whisper(a.hero,m.id,{gaze:8,session:'s',rng:()=>0}).ok,false);assert.equal(whisper(a.hero,m.id,{gaze:8,session:'t',rng:()=>0}).ok,true);
});
test('seeded outputs are JSON-safe and inputs do not mutate',()=>{
 const h=hero(),before=structuredClone(h),a=check(h,{dc:25});assert.deepEqual(a,check(h,{dc:25}));assert.deepEqual(JSON.parse(JSON.stringify(a)),a);assert.deepEqual(h,before);
});
