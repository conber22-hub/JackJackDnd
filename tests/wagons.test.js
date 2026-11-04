import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/util/core.js';
import { FITTINGS, ROAD_FACTOR, WEATHER_FACTOR, NIGHT_FACTOR } from '../src/data/wagons.js';
import { legSpeed, meetEvent, nightOnTheRoad, repairDay, describeWagon } from '../src/engine/wagons.js';
const wagon=(extra={})=>({id:'w1',kind:'wagon',n:'The Lantern Cart',capacity:500,speed:20,hp:40,ac:12,seats:2,bunks:0,fittings:[],...extra});
const leg=(extra={})=>({miles:12,road:'road',weather:'clear',night:false,...extra});
const event=(kind,w=wagon(),rng=()=>0,gaze=5)=>meetEvent(w,{kind},{gaze},rng);
const fitted=(...fittings)=>wagon({fittings});

test('every fitting has an ID, name and description, with the specified factors',()=>{
  assert.deepEqual(FITTINGS.map(f=>f.id).sort(),['lockbox','lantern-hooks','spare-wheel','bunks','smithy-box','salt-barrels','hidden-compartment','ward-runes'].sort());
  for(const f of FITTINGS){assert.ok(f.n.trim());assert.ok(f.does.trim());}
  assert.deepEqual(ROAD_FACTOR,{road:1,track:.75,wild:.5});
  assert.deepEqual(WEATHER_FACTOR,{clear:1,rain:.8,snow:.5,fog:.75});assert.equal(NIGHT_FACTOR,.5);
});
test('speed factors, eight-hour travel days and explanations',()=>{
  assert.deepEqual(legSpeed(wagon(),leg(),{cargo:500}),{milesPerDay:20,hours:4.8,why:[]});
  for(const [change,speed] of [[{road:'track'},15],[{road:'wild'},10],[{weather:'rain'},16],[{weather:'snow'},10],[{weather:'fog'},15],[{night:true},10]]){
    const result=legSpeed(wagon(),leg(change),{cargo:0});assert.equal(result.milesPerDay,speed);assert.equal(result.hours,12/speed*8);assert.equal(result.why.length,1);
  }
  assert.equal(legSpeed(wagon(),leg(),{cargo:501}).milesPerDay,10);
  assert.equal(legSpeed(wagon(),leg(),{cargo:1000}).milesPerDay,10);
  assert.deepEqual(legSpeed(wagon(),leg(),{cargo:1001}),{milesPerDay:0,why:['Too heavy to move.']});
  assert.equal(legSpeed(wagon({damage:20}),leg()).milesPerDay,20);
  assert.equal(legSpeed(wagon({damage:21}),leg()).milesPerDay,15);
  const stacked=legSpeed(wagon({damage:21}),leg({road:'track',weather:'snow',night:true}),{cargo:600});
  assert.equal(stacked.milesPerDay,20*.75*.5*.5*.5*.75);assert.equal(stacked.why.length,5);
  assert.equal(legSpeed(wagon(),leg({miles:0})).hours,0);
});
test('lantern hooks remove only the night penalty',()=>{
  const w=fitted('lantern-hooks');assert.equal(legSpeed(w,leg({night:true})).milesPerDay,20);
  assert.equal(legSpeed(w,leg({night:true,weather:'snow'})).milesPerDay,10);
});
test('salt avoids Bloom, spare wheels shorten breakdowns, and lockboxes protect goods',()=>{
  assert.deepEqual(event('bloom',fitted('salt-barrels')).effects,{avoided:true});
  assert.deepEqual(event('bloom').effects,{});
  assert.deepEqual(event('breakdown').effects,{delayHours:12,damage:1});
  assert.deepEqual(event('breakdown',fitted('spare-wheel'),()=>.999).effects,{delayHours:1,damage:6});
  assert.ok(event('theft').effects.lost);assert.equal(event('theft',fitted('lockbox')).effects.lost,undefined);
  assert.deepEqual(event('storm',wagon(),()=>.999).effects,{damage:4,delayHours:4});
});
test('search DC boundaries and ward penalty belong to the searchers',()=>{
  assert.equal(event('search',wagon(),()=>.15).effects.found,false); // 4 + 5
  assert.equal(event('search',wagon(),()=>.2).effects.found,true); // 5 + 5
  assert.equal(event('search',fitted('hidden-compartment'),()=>.55).effects.found,false); // 12 + 5
  assert.equal(event('search',fitted('hidden-compartment'),()=>.6).effects.found,true); // 13 + 5
  assert.deepEqual(event('search',fitted('hidden-compartment','ward-runes'),()=>.6).effects,{checkMod:-2,found:false});
  assert.deepEqual(event('ambush',fitted('ward-runes')).effects,{checkMod:-2});
});
test('hidden compartments are found less often over 500 seeded searches',()=>{
  const a=mulberry32(42),b=mulberry32(42);let open=0,hidden=0;
  for(let i=0;i<500;i++){open+=Number(event('search',wagon(),a).effects.found);hidden+=Number(event('search',fitted('hidden-compartment'),b).effects.found);}
  assert.ok(hidden>0 && hidden<open && open<500);
});
test('Mists probability floor, Gaze threshold and ward halving',()=>{
  for(const gaze of [1,2,3,4,5,10]){
    const chance=Math.max(10,50-10*Math.max(0,5-gaze))/100;
    assert.equal(event('mists',wagon(),()=>chance-.001,gaze).effects.delayHours,8);
    assert.equal(event('mists',wagon(),()=>chance,gaze).effects.avoided,true);
    assert.equal(event('mists',fitted('ward-runes'),()=>chance/2,gaze).effects.avoided,true);
  }
  assert.equal(event('mists',fitted('ward-runes')).effects.checkMod,-2);
});
test('ward-runes reduce turnbacks over 500 seeded trials',()=>{
  const a=mulberry32(42),b=mulberry32(42);let plain=0,warded=0;
  for(let i=0;i<500;i++){plain+=Number(!event('mists',wagon(),a).effects.avoided);warded+=Number(!event('mists',fitted('ward-runes'),b).effects.avoided);}
  assert.ok(warded>0 && warded<plain && plain<500);
});
test('rest follows numeric bunk capacity, including frame bunks and overflow',()=>{
  const w=wagon({bunks:2,fittings:['bunks']});
  for(const sleepers of [0,1,2]) assert.equal(nightOnTheRoad(w,{sleepers}).rest,'long');
  const overflow=nightOnTheRoad(w,{sleepers:3});assert.equal(overflow.rest,'poor');assert.match(overflow.why,/2 of 3.*1 get a poor/);
  assert.equal(nightOnTheRoad(wagon(),{sleepers:1}).rest,'poor');
  assert.equal(nightOnTheRoad(wagon({bunks:2}),{sleepers:2}).rest,'long');
  assert.equal(nightOnTheRoad(fitted('bunks'),{sleepers:1}).rest,'poor');
});
test('daily repair is 1 HP or 1d6+2, floored at zero, with missing damage supported',()=>{
  const w=wagon({damage:20});assert.equal(repairDay(w,()=>0).damage,19);
  assert.equal(repairDay({...w,fittings:['smithy-box']},()=>0).damage,17);
  assert.equal(repairDay({...w,fittings:['smithy-box']},()=>.999).damage,12);
  assert.equal(repairDay(wagon({damage:1,fittings:['smithy-box']}),()=>.999).damage,0);
  assert.equal(repairDay(wagon(),()=>0).damage,0);
});
test('description includes numbers and each installed fitting, without unknown fitting errors',()=>{
  const w=wagon({damage:5,fittings:[...FITTINGS.map(f=>f.id),'unknown']});const text=describeWagon(w);
  for(const value of [w.n,'500 lb','20 miles/day','35/40 HP','AC 12','2 seats','0 bunks',...FITTINGS.map(f=>f.does)]) assert.ok(text.includes(value),value);
});
test('inputs stay unchanged and identical seeds reproduce results',()=>{
  const w=wagon({damage:20,bunks:2,fittings:FITTINGS.map(f=>f.id),design:{parts:{frame:'wagon'}}}),l=leg({night:true}),ctx={gaze:4},cargo={cargo:600},sleep={sleepers:3};
  const events=['ambush','mists','bloom','theft','breakdown','search','storm'].map(kind=>({kind}));
  const inputs=[w,l,ctx,cargo,sleep,events],before=structuredClone(inputs);
  const run=()=>{const rng=mulberry32(42);return [legSpeed(w,l,cargo),...events.map(e=>meetEvent(w,e,ctx,rng)),nightOnTheRoad(w,sleep),repairDay(w,rng),describeWagon(w)];};
  assert.deepEqual(run(),run());assert.deepEqual(inputs,before);
  const repaired=repairDay(w,()=>0);repaired.design.parts.frame='cart';repaired.fittings.push('new');assert.deepEqual(inputs,before);
});
