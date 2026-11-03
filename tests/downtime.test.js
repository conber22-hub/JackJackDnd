import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/util/core.js';
import { ACTIVITIES } from '../src/data/downtime.js';
import { plan, daysCost, resolve, describe } from '../src/engine/downtime.js';

const hero = (extra = {}) => ({
  id:'ilse',name:'Ilse',sc:{Str:16,Dex:12,Con:14,Int:10,Wis:12,Cha:8},
  skills:{Athletics:5,Performance:-1,Persuasion:1,History:0},pb:2,
  tools:["Smith's Tools"],languages:['Common'],exhaustion:2,
  coins:{cp:0,sp:0,ep:0,gp:30,pp:0},...extra,
});
const folk = [
  {id:'smith',role:'smith',name:'Tavrek',mood:'afraid'},
  {id:'farmer',role:'farmer',name:'Pellena',mood:'wary'},
  {id:'elder',role:'elder',name:'Osvik',mood:'easy'},
];
const village = {kind:'village',folk};
const town = {kind:'town',folk};
const holding = {beds:6,comfort:6,defence:5,ward:2,workshops:['forge','library']};
const atHome = {kind:'holding',workshops:['forge','library'],folk};
const funds = coins => coins.cp / 100 + coins.sp / 10 + coins.ep / 2 + coins.gp + coins.pp * 10;
const fixed = total => ({raw:Math.min(20,Math.max(1,total)),total});

test('all seven activities have ids, names, flavour, sensible numbers and descriptions', () => {
  assert.equal(ACTIVITIES.length,7);
  assert.equal(new Set(ACTIVITIES.map(a => a.id)).size,7);
  for (const a of ACTIVITIES){
    assert.ok(a.id && a.n && a.flavour && typeof a.needs === 'object');
    assert.ok(Number.isInteger(a.days) && a.days > 0);
    assert.ok(Number.isFinite(a.cost) && a.cost >= 0);
    assert.deepEqual(describe(a.id),{n:a.n,flavour:a.flavour,days:a.days,cost:a.cost});
  }
  assert.equal(describe('no-such-activity'),null);
});

test('recuperating ends one exhaustion at three days, or one day with comfort six', () => {
  const ordinary = plan('recuperate',{hero:hero(),days:3,place:village});
  assert.equal(ordinary.ok,true);assert.equal(ordinary.cost,1.5);
  assert.equal(resolve(ordinary).effects.exhaustion,-1);
  assert.equal(plan('recuperate',{hero:hero(),days:2,place:village}).ok,false);
  const quick = plan('recuperate',{hero:hero(),days:1,place:atHome,holding});
  assert.equal(quick.ok,true);assert.equal(resolve(quick).effects.exhaustion,-1);
  const healed = plan('recuperate',{hero:hero(),days:3,place:atHome,holding});
  assert.equal(resolve(healed).effects.saveAdvantage,'disease or poison');
  assert.equal(resolve(plan('recuperate',{hero:hero(),days:5,place:village})).effects.saveAdvantage,'disease or poison');
  assert.equal(resolve(plan('recuperate',{hero:hero({exhaustion:0}),days:3,place:village})).effects.exhaustion,undefined);
});

test('recuperation on the road is refused', () => {
  assert.equal(plan('recuperate',{hero:hero(),days:3,place:{kind:'road'}}).why,
    'Recuperating needs somewhere safe, not the open road.');
});

test('training requires the correct teacher, all ten days, and payment including lodging', () => {
  const opts = {hero:hero(),days:10,place:village,learn:"Smith's Tools"};
  assert.equal(plan('train',{...opts,hero:hero({tools:[]}),place:{kind:'village',folk:[]}}).why,
    "Nobody here can teach Smith's Tools.");
  assert.equal(plan('train',{...opts,hero:hero({tools:[]}),days:9}).ok,false);
  const forge = plan('train',{...opts,hero:hero({tools:[]})});
  assert.equal(forge.ok,true);assert.equal(daysCost(forge),15);
  assert.equal(resolve(forge).effects.addTool,"Smith's Tools");
  assert.equal(funds(resolve(forge).effects.coins),15);
  const language = plan('train',{hero:hero(),days:10,place:town,learn:'Elvish'});
  assert.equal(language.ok,true);assert.equal(language.cost,20);
  assert.equal(resolve(language).effects.addLanguage,'Elvish');
  assert.equal(plan('train',{hero:hero({coins:{gp:12}}),days:10,place:town,learn:'Elvish'}).ok,false);
  assert.equal(plan('train',{hero:hero(),days:10,place:{kind:'road',folk},learn:'Elvish'}).ok,false);
  assert.equal(plan('train',{hero:hero(),days:10,place:village,learn:'Elvish'}).ok,true);
});

test('work pays poor, modest, comfortable and wealthy rates by total', () => {
  const p = plan('work',{hero:hero(),days:5,place:village,skill:'Athletics'});
  assert.equal(p.ok,true);assert.deepEqual(p.check,{ability:'Str',skill:'Athletics',dc:0,bonus:5});
  for (const [score,wage] of [[8,.5],[12,5],[17,10],[22,20]]){
    const r=resolve(p,{roll:fixed(score)});
    assert.equal(r.effects.gp,wage);
    assert.equal(funds(r.effects.coins),30-2.5+wage);
  }
  const tool = plan('work',{hero:hero(),days:1,place:town,tool:"Smith's Tools"});
  assert.deepEqual(tool.check,{ability:'Int',tool:"Smith's Tools",dc:0,bonus:2});
  assert.equal(plan('work',{hero:hero(),days:1,place:atHome,holding}).ok,false);
  assert.equal(plan('work',{hero:hero(),days:1,place:town,tool:"Thieves' Tools"}).ok,false);
});

test('research respects the library and all four margins against DC 15', () => {
  assert.equal(plan('research',{hero:hero(),days:1,place:village}).why,'Research needs a library, or a town.');
  const p = plan('research',{hero:hero(),days:1,place:town});
  assert.equal(p.check.dc,15);
  for (const [total,quality] of [[9,'nothing'],[10,'nothing'],[11,'a rumour'],[14,'a rumour'],[15,'a true thing'],[19,'a true thing'],[20,'a true thing and a lead']])
    assert.equal(resolve(p,{roll:fixed(total)}).effects.research,quality);
  const atLibrary = plan('research',{hero:hero(),days:2,place:atHome,holding});
  assert.equal(atLibrary.ok,true);
});

test('carousing success can make a contact, but a natural one always causes a mess', () => {
  const p=plan('carouse',{hero:hero(),days:1,place:village,gaze:1});
  const good=resolve(p,{roll:{raw:18,total:19}},mulberry32(4));
  assert.ok(['smith','farmer'].includes(good.effects.mood?.id));
  assert.equal(good.effects.mood.to,'easy');
  assert.equal(good.effects.mess,undefined);
  const bad=resolve(p,{roll:{raw:1,total:21}},mulberry32(1));
  assert.ok(['a fine','a fight','a debt'].includes(bad.effects.mess));
  assert.equal(plan('carouse',{hero:hero(),days:1,place:{kind:'road'}}).ok,false);
});

test('gaze nine causes significantly more carousing messes than gaze one in 500 seeded trials', () => {
  const low=plan('carouse',{hero:hero(),days:1,place:village,gaze:1});
  const high=plan('carouse',{hero:hero(),days:1,place:village,gaze:9});
  let a=0,b=0;
  for(let seed=0;seed<500;seed++){
    if(resolve(low,{roll:{raw:15,total:16}},mulberry32(seed)).effects.mess)a++;
    if(resolve(high,{roll:{raw:15,total:16}},mulberry32(seed)).effects.mess)b++;
  }
  assert.equal(a,0);assert.ok(b>120 && b<230,`gaze nine gave ${b} messes`);
});

test('lodging costs half a gold in a village, one in town, zero in a bedded holding', () => {
  const p=plan('craft',{hero:hero(),days:2,place:atHome,holding});
  assert.equal(p.ok,true);assert.equal(p.cost,0);assert.equal(daysCost(p,{holding}),0);
  assert.equal(resolve(p).effects.hours,16);
  assert.equal(plan('craft',{hero:hero(),days:2,place:village}).cost,1);
  assert.equal(plan('craft',{hero:hero(),days:2,place:town}).cost,2);
  const watch=plan('watch',{hero:hero(),days:10,place:atHome,holding});
  assert.equal(watch.ok,true);
  assert.equal(resolve(watch).effects.defence,1);
  assert.equal(resolve(watch).effects.watchBonus,10);
  assert.equal(plan('watch',{hero:hero(),days:1,place:town,holding}).ok,false);
});

test('the same seed always gives the same result, without mutating inputs or ambient randomness', () => {
  const h=hero(), before=structuredClone(h), p=plan('carouse',{hero:h,days:1,place:village,gaze:9});
  const old=Math.random;
  try {
    Math.random=()=>{throw new Error('ambient randomness');};
    assert.deepEqual(resolve(p,{},mulberry32(99)),resolve(p,{},mulberry32(99)));
    assert.deepEqual(h,before);
    assert.equal(resolve(plan('work',{hero:h,days:1,place:town}),{},mulberry32(8)).lines.length,1);
  } finally {Math.random=old;}
});
