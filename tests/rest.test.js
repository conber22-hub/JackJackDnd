import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/util/core.js';
import { PLACES, DISTURBANCES, DREAMS } from '../src/data/rest.js';
import { restQuality, rollNight, restOutcome } from '../src/engine/rest.js';

const party = () => [{id:'a',name:'Anya',exhaustion:2,watch:true},{id:'b',name:'Borin',exhaustion:1,watch:false}];
const quality = (kind,extra={}) => restQuality({place:{kind},party:party(),gaze:2,weather:'clear',...extra});

test('every place, disturbance and dream has original usable data',()=>{
  assert.deepEqual(Object.keys(PLACES),['holding','inn','village','camp','road','dungeon']);
  for(const [kind,p] of Object.entries(PLACES)){
    assert.ok(p.chance >= 0 && p.chance <= 1,kind);
    assert.ok(['poor','fair','good','fine'].includes(p.comfort));
  }
  assert.ok(DISTURBANCES.length >= 10 && DISTURBANCES.length <= 14);
  assert.equal(new Set(DISTURBANCES.map(d=>d.id)).size,DISTURBANCES.length);
  for(const d of DISTURBANCES) assert.ok(d.id && d.n && d.text && ['noise','scare','fight'].includes(d.severity));
  assert.ok(DREAMS.length>=8 && DREAMS.length<=10);
  assert.ok(DREAMS.every(d=>typeof d==='string' && d.length>10));
});

test('a fortified holding with shrine and salt is safer than a roadside camp',()=>{
  const secure=quality('holding',{holding:{beds:6,comfort:4,defence:5,ward:2,salt:true}});
  const rough=quality('road',{holding:null});
  assert.ok(secure.chance < rough.chance);
  assert.equal(secure.comfort,'fine');
  assert.equal(rough.comfort,'poor');
  assert.ok(secure.notes.length && rough.notes.length);
});

test('gaze increases risk, watch reduces it, and rain or snow makes rough shelter worse',()=>{
  const low=quality('camp',{gaze:2});
  const high=quality('camp',{gaze:9});
  assert.ok(high.chance>low.chance);
  const noWatch=quality('camp',{party:party().map(h=>({...h,watch:false}))});
  assert.equal(Math.round((noWatch.chance-low.chance)*100),5);
  assert.equal(quality('road',{weather:'snow'}).chance,quality('road').chance+.05);
  assert.equal(quality('camp',{weather:'rain'}).comfort,'poor');
  assert.equal(quality('inn').comfort,'good');
  assert.equal(quality('village').comfort,'fair');
});

test('watch makes an interruption unsurprising; without it the sleepers are surprised',()=>{
  const q={chance:1,comfort:'fair',notes:[]};
  const watched=rollNight(q,{party:party(),gaze:2},mulberry32(42));
  const unguarded=rollNight(q,{party:party().map(h=>({...h,watch:false})),gaze:2},mulberry32(42));
  assert.equal(watched.disturbed,true);
  assert.equal(watched.surprise,false);
  assert.equal(unguarded.surprise,true);
});

test('a fight breaks the rest, but a scare costs one hour without breaking it',()=>{
  const q=quality('inn');
  const fight=restOutcome(q,{disturbed:true,event:{severity:'fight'}},{party:party()});
  assert.ok(fight.heroes.every(h=>!h.hpFull && h.hitDice==='none' && h.exhaustion===0));
  const scare=restOutcome(q,{disturbed:true,event:{severity:'scare'}},{party:party()});
  assert.ok(scare.heroes.every(h=>h.hpFull && h.hitDice==='all' && h.exhaustion===-1));
  assert.ok(scare.lines.some(s=>s.includes('hour')));
});

test('poor comfort gives full HP but half Hit Point Dice and no exhaustion reduction',()=>{
  const r=restOutcome(quality('road'),{disturbed:false},{party:party()});
  assert.ok(r.heroes.every(h=>h.hpFull && h.hitDice==='half' && h.exhaustion===0));
});

test('fine comfort grants exactly one non-dreaming hero inspiration',()=>{
  const q=quality('holding',{holding:{beds:2,comfort:4,defence:4,ward:1}});
  assert.equal(q.comfort,'fine');
  const r=restOutcome(q,{disturbed:false,dream:{id:'a',text:DREAMS[0]}},{party:party()});
  assert.deepEqual(r.heroes.map(h=>h.inspiration),[false,true]);
  const ordinary=restOutcome(q,{disturbed:false},{party:party()});
  assert.deepEqual(ordinary.heroes.map(h=>h.inspiration),[true,false]);
});

test('dreams occur only at gaze six or higher and name a hero',()=>{
  const q={chance:0,comfort:'good',notes:[]};
  for(let seed=0;seed<100;seed++) assert.equal(rollNight(q,{party:party(),gaze:5},mulberry32(seed)).dream,undefined);
  let dreams=0;
  for(let seed=0;seed<500;seed++){
    const n=rollNight(q,{party:party(),gaze:9},mulberry32(seed));
    if(n.dream){dreams++;assert.ok(['a','b'].includes(n.dream.id));assert.ok(DREAMS.includes(n.dream.text));}
  }
  assert.ok(dreams>50 && dreams<200);
});

test('fights grow likelier at gaze nine than gaze two over 500 seeded trials',()=>{
  const q={chance:1,comfort:'fair',notes:[]};
  let low=0,high=0;
  for(let seed=0;seed<500;seed++){
    if(rollNight(q,{party:party(),gaze:2},mulberry32(seed)).event.severity==='fight')low++;
    if(rollNight(q,{party:party(),gaze:9},mulberry32(seed)).event.severity==='fight')high++;
  }
  assert.ok(high>low+100,`high: ${high}, low: ${low}`);
});

test('inputs are unchanged, seeded outcomes repeat and ambient randomness is never used',()=>{
  const p=party(), h={beds:2,comfort:4,defence:5,ward:2,salt:true};
  const pBefore=structuredClone(p), hBefore=structuredClone(h);
  const old=Math.random;
  try{
    Math.random=()=>{throw new Error('ambient random used');};
    const q=restQuality({place:{kind:'holding'},party:p,holding:h,gaze:8});
    const n1=rollNight(q,{party:p,gaze:8},mulberry32(42));
    const n2=rollNight(q,{party:p,gaze:8},mulberry32(42));
    assert.deepEqual(n1,n2);
    const qBefore=structuredClone(q), nBefore=structuredClone(n1);
    assert.deepEqual(restOutcome(q,n1,{party:p}),restOutcome(q,n2,{party:p}));
    assert.deepEqual(q,qBefore);assert.deepEqual(n1,nBefore);
    assert.deepEqual(p,pBefore);assert.deepEqual(h,hBefore);
  }finally{Math.random=old;}
});
