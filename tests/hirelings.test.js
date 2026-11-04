import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/util/core.js';
import { RATES, SKILL_OF, TELLS, MORALE_LINES } from '../src/data/hirelings.js';
import { canHire, hire, payDay, moraleCheck, watchForEyes, week, defenders } from '../src/engine/hirelings.js';

const person = (extra={}) => ({id:'f1',name:'Anya',role:'farmer',mood:'wary',...extra});
const hand = (extra={}) => ({id:'h1',name:'Anya',role:'farmer',skill:'labour',wage:.2,loyalty:10,devoted:false,...extra});

test('data includes sane wages, skills, tells and morale lines',()=>{
  assert.equal(RATES.farmer,.2);assert.equal(RATES.smith,1);assert.equal(RATES.watch,.5);
  for(const [role,rate] of Object.entries(RATES)){
    assert.ok(rate>0 && rate<=1);assert.ok(['labour','guard','craft','cook','scout'].includes(SKILL_OF[role]));
  }
  assert.ok(TELLS.length>=8 && TELLS.length<=12 && new Set(TELLS).size===TELLS.length);
  for(const cause of ['raid','unpaid','horror','death']){
    assert.ok(MORALE_LINES[cause].stay.length);assert.ok(MORALE_LINES[cause].leave.length);
  }
});

test('children, lost people and dogs cannot be hired',()=>{
  for(const role of ['child','lostChild','lost','dog']) assert.equal(canHire(person({role})).ok,false);
  assert.equal(canHire(person()).ok,true);
  assert.equal(canHire(person({role:'dragon'})).ok,false);
});

test('mood and wages determine loyalty; spies start indistinguishably',()=>{
  const poor = hire(person({mood:'afraid'}),{wage:.1},()=>.5);
  const rich = hire(person({mood:'easy'}),{wage:.3},()=>.5);
  assert.equal(poor.loyalty,3);assert.equal(rich.loyalty,14);
  assert.equal(poor.skill,'labour');assert.equal(poor.devoted,false);
  const spy=hire(person({spy:{for:'court-2'}}),{wage:.3},()=>.5);
  const honest=hire(person(),{wage:.3},()=>.5);
  assert.equal(spy.loyalty,honest.loyalty);assert.deepEqual(spy.spy,{for:'court-2'});
  assert.equal(hire(person({role:'dog'}),{},()=>.5).ok,false);
  assert.equal(hire(person(),{wage:-1},()=>.5).ok,false);
});

test('payDay pays in list order and subtracts two loyalty for unpaid hands',()=>{
  const workers=[hand({id:'a',wage:.2,loyalty:1}),hand({id:'b',wage:.5,loyalty:5}),hand({id:'c',wage:.2,loyalty:8})];
  const before=structuredClone(workers);
  const r=payDay(workers,{gold:.4});
  assert.deepEqual(r.paid,['a','c']);assert.deepEqual(r.unpaid,['b']);assert.equal(r.spent,.4);
  assert.deepEqual(r.hirelings.map(h=>h.loyalty),[1,3,8]);
  assert.deepEqual(workers,before);
  assert.equal(payDay([hand({loyalty:1})],{gold:0}).hirelings[0].loyalty,0);
});

test('gaze nine raises morale failures; ward four lowers them across 500 seeded trials',()=>{
  const h=hand({loyalty:10});let low=0,high=0,warded=0;
  for(let seed=0;seed<500;seed++){
    if(!moraleCheck(h,{cause:'raid',gaze:2,ward:0},mulberry32(seed)).stays)low++;
    if(!moraleCheck(h,{cause:'raid',gaze:9,ward:0},mulberry32(seed)).stays)high++;
    if(!moraleCheck(h,{cause:'raid',gaze:9,ward:4},mulberry32(seed)).stays)warded++;
  }
  assert.ok(high>low+100,`${high} vs ${low}`);
  assert.ok(warded<high-60,`${warded} vs ${high}`);
});

test('devoted always stay; natural one fails and natural twenty stays',()=>{
  const devoted=hand({devoted:true,loyalty:0});
  assert.equal(moraleCheck(devoted,{cause:'horror',gaze:10,ward:0},()=>0).stays,true);
  assert.equal(moraleCheck(hand({loyalty:20}),{cause:'death',gaze:1},()=>0).stays,false);
  assert.equal(moraleCheck(hand({loyalty:0}),{cause:'unpaid',gaze:10},()=>.999).stays,true);
});

test('watch detects only spies, each once, more often with a strong watch',()=>{
  const hands=[hand({id:'spy',spy:{for:'court-2'}}),hand({id:'honest'}),hand({id:'other',spy:{for:'court-3'}})];
  let low=0,high=0;
  for(let seed=0;seed<500;seed++){
    const a=watchForEyes(hands,{watchBonus:0,days:2},mulberry32(seed));
    const b=watchForEyes(hands,{watchBonus:10,days:2},mulberry32(seed));
    low+=a.length;high+=b.length;
    for(const found of [a,b]){
      assert.ok(found.every(f=>f.id!=='honest' && ['court-2','court-3'].includes(f.member) && TELLS.includes(f.tell)));
      assert.equal(new Set(found.map(f=>f.id)).size,found.length);
    }
  }
  assert.ok(high>low*2,`${high} vs ${low}`);
  assert.deepEqual(watchForEyes([hand()],{watchBonus:10,days:100},()=>0),[]);
});

test('weekly loyalty is capped at twenty and a devoted spy turns permanently',()=>{
  const original=[hand({loyalty:14,spy:{for:'court-2'}}),hand({id:'other',loyalty:19})];
  const before=structuredClone(original);
  const updated=week(original,{comfort:4,paidInFull:true,raidsWon:1});
  assert.equal(updated[0].loyalty,18);assert.equal(updated[0].devoted,true);
  assert.equal(updated[0].spy,undefined);assert.equal(updated[0].turned,true);
  assert.equal(updated[1].loyalty,20);
  assert.deepEqual(original,before);
  const next=week(updated,{comfort:0,paidInFull:false,raidsWon:0});
  assert.equal(next[0].devoted,true);assert.equal(next[0].turned,true);
  assert.equal(next[0].spy,undefined);
});

test('defenders counts guards as one, others as half, devoted double',()=>{
  assert.equal(defenders([hand({skill:'guard'}),hand({skill:'labour'}),hand({skill:'guard',devoted:true})]),3.5);
  assert.equal(defenders([]),0);
});

test('seeded outcomes repeat, all functions preserve their inputs, and ambient random is unused',()=>{
  const p=person({spy:{for:'court-2'}}),before=structuredClone(p);
  const old=Math.random;
  try{
    Math.random=()=>{throw new Error('ambient random called');};
    assert.deepEqual(hire(p,{wage:.2},mulberry32(42)),hire(p,{wage:.2},mulberry32(42)));
    const h=hire(p,{wage:.2},mulberry32(42)),copy=structuredClone(h);
    assert.deepEqual(moraleCheck(h,{cause:'raid',gaze:4},mulberry32(42)),moraleCheck(h,{cause:'raid',gaze:4},mulberry32(42)));
    assert.deepEqual(watchForEyes([h],{watchBonus:10,days:30},mulberry32(42)),watchForEyes([h],{watchBonus:10,days:30},mulberry32(42)));
    assert.deepEqual(h,copy);assert.deepEqual(p,before);
  }finally{Math.random=old;}
});
