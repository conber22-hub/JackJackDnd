import { PLACE_NAMES } from '../src/engine/nemesis.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { populate, stepFolk, witnesses, tellTheCourt, rumourFor, greet } from '../src/engine/folk.js';
import { newCourt, pickAmbushers } from '../src/engine/nemesis.js';
import { passMove, canStep } from '../src/engine/grid.js';
import { mulberry32 } from '../src/util/core.js';
import { WEAKNESSES } from '../src/data/court.js';
import { T } from '../src/engine/tiles.js';
import { genPlace } from '../src/engine/settlement.js';
import { layoutFloor } from '../src/engine/generator.js';
const floor = () => ({W:20,H:20,grid:Array(400).fill(T.ROOM),doors:[],props:[],rooms:[{x:1,y:1,w:6,h:6},{x:1,y:8,w:18,h:10,outdoor:true,name:'Market square'}]});
const person = (extra = {}) => ({id:'p',name:'Test',role:'farmer',x:10,y:10,home:{x:2,y:2},haunts:[{x:15,y:15}],mood:'easy',spy:null,seen:[],...extra});
const apply = (folk,moves) => {for(const m of moves)Object.assign(folk.find(p=>p.id===m.id),m);};
const court = () => ({members:[{id:'a',name:'Orren',epithet:'the Tollkeeper',alive:true,hunting:false,haunt:'tower',weaknesses:['fire']}],news:[]});
const d = (a,b) => Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
test('seeded population has unique indoor homes, valid haunts and decreasing counts', () => {
  const f=floor(), c=newCourt(mulberry32(9)), opts={place:{kind:'town',id:'test'},seed:41,court:c};
  const before=structuredClone(f), low=populate(f,{...opts,gaze:0});
  assert.deepEqual(populate(f,{...opts,gaze:0}),low);
  assert.deepEqual(f,before);
  assert.equal(new Set(low.map(p=>p.id)).size,low.length);
  assert.equal(new Set(low.map(p=>`${p.x},${p.y}`)).size,low.length);
  assert.ok(populate(f,{...opts,gaze:5}).length<low.length);
  assert.ok(populate(f,{...opts,night:true}).length<low.length);
  for(const p of low){
    assert.ok(passMove(f,p.y*f.W+p.x));
    assert.ok(p.home.x>=1&&p.home.x<7&&p.home.y>=1&&p.home.y<7);
    for(const h of p.haunts)assert.ok(passMove(f,h.y*f.W+h.x));
  }
  assert.deepEqual(populate({...f,rooms:[]},{...opts}),[]);
  assert.deepEqual(populate({...f,grid:Array(400).fill(T.ROCK)},opts),[]);
});
test('real settlement maps support folk using the existing floor format', () => {
  for(const kind of ['village','town','camp']){
    const layout=genPlace(kind,{seed:7,name:'Test',last:true});
    const f=layoutFloor(0,40,40,{layout,theme:'village'},null,true);
    const folk=populate(f,{place:{kind},seed:7,court:court()});
    assert.ok(folk.length,kind);
    for(const p of folk)assert.ok(passMove(f,p.y*f.W+p.x),`${kind}: home`);
  }
});
test('roles distinguish camps, roads and sparse dungeons; spies serve living hunters', () => {
  const f=floor(), c=court();c.members.push({...c.members[0],id:'hunter',hunting:true});
  const camp=populate(f,{place:'camp',seed:4});
  assert.ok(camp.every(p=>['traveller','dog'].includes(p.role)));
  assert.ok(populate(f,{place:'road',seed:4}).every(p=>['peddler','pilgrim','lostChild'].includes(p.role)));
  assert.ok(populate(f,{place:'dungeon',seed:4}).length<=2);
  let low=0,high=0,nLow=0,nHigh=0;
  for(let seed=0;seed<300;seed++){
    for(const gaze of [1,5]){
      const folk=populate(f,{place:'town',seed,gaze,court:c});
      for(const p of folk)if(p.spy)assert.equal(p.spy.for,'hunter');
      if(gaze===1){low+=folk.filter(p=>p.spy).length;nLow+=folk.length;}
      else {high+=folk.filter(p=>p.spy).length;nHigh+=folk.length;}
    }
  }
  assert.ok(low/nLow>.025&&low/nLow<.085);
  assert.ok(high/nHigh>.15&&high/nHigh<.27);
  assert.ok(high/nHigh>low/nLow);
  c.members.forEach(m=>m.alive=false);
  assert.ok(populate(f,{place:'town',seed:5,gaze:5,court:c}).every(p=>!p.spy));
});
test('steps route around walls, avoid occupied party footprints, and do not mutate inputs', () => {
  const f=floor();for(let y=0;y<18;y++)f.grid[y*f.W+8]=T.ROCK;
  const folk=[person()],party=[{x:9,y:9,size:2}],before=structuredClone(folk);
  const moves=stepFolk(folk,f,{party,night:true,rng:mulberry32(1)});
  assert.deepEqual(folk,before);
  for(const m of moves){assert.ok(canStep(f,folk[0].x,folk[0].y,m.x-folk[0].x,m.y-folk[0].y));assert.ok(!(m.x>=9&&m.x<=10&&m.y>=9&&m.y<=10));}
  for(let i=0;i<80;i++)apply(folk,stepFolk(folk,f,{party:[],night:true,rng:mulberry32(i)}));
  assert.deepEqual({x:folk[0].x,y:folk[0].y},folk[0].home);
  assert.deepEqual(stepFolk(folk,f,{night:true,rng:()=>0}),[]);
});
test('closed/locked doors and diagonal walls use shared grid rules; folk never overlap', () => {
  const f=floor();f.grid[2*f.W+3]=T.ROCK;f.grid[3*f.W+2]=T.ROCK;
  f.doors=[{i:1*f.W+2,state:'locked'}];
  const folk=[person({x:2,y:2,home:{x:4,y:4}}),person({id:'other',x:3,y:3,home:{x:4,y:4}})];
  for(let i=0;i<10;i++){
    const moves=stepFolk(folk,f,{night:true,rng:()=>0});
    for(const m of moves){const p=folk.find(p=>p.id===m.id);assert.ok(canStep(f,p.x,p.y,m.x-p.x,m.y-p.y));}
    apply(folk,moves);assert.notDeepEqual([folk[0].x,folk[0].y],[folk[1].x,folk[1].y]);
  }
});
test('fleeing increases distance from a fight; spies approach and maintain a 3–6 square band', () => {
  const f=floor(),party=[{x:12,y:12}];
  const folk=[person()];
  const moves=stepFolk(folk,f,{party,fight:true,rng:()=>0});
  assert.equal(moves.length,1);assert.ok(d(moves[0],party[0])>d(folk[0],party[0]));assert.ok(d(moves[0],folk[0].home)<d(folk[0],folk[0].home));
  for(const start of [{x:1,y:1},{x:11,y:11}]){
    const spy=[person({...start,spy:{for:'a'}})];
    for(let i=0;i<20;i++){
      const before=point(spy[0]),moves=stepFolk(spy,f,{party,rng:()=>0});
      for(const m of moves)assert.ok(d(m,before)<=1);
      apply(spy,moves);
    }
    assert.ok(d(spy[0],party[0])>=3&&d(spy[0],party[0])<=6);
  }
});
const point=p=>({x:p.x,y:p.y});
test('witnesses respect sight, distance and five-event memory', () => {
  const f=floor();for(let y=0;y<f.H;y++)f.grid[y*f.W+8]=T.ROCK;
  const folk=[person({x:4,y:5}),person({id:'hidden',x:10,y:5})];
  for(let day=0;day<8;day++)assert.deepEqual(witnesses(folk,f,{kind:'spell',x:5,y:5,day}),['p']);
  assert.deepEqual(folk[0].seen.map(e=>e.day),[3,4,5,6,7]);assert.deepEqual(folk[1].seen,[]);
  assert.deepEqual(witnesses(folk,f,{kind:'arrival',x:7,y:5},{range:1}),[]);
});
test('only witnessing spies teach living masters; kills produce public rumours separately', () => {
  const c=court(),folk=[person(),person({id:'spy',spy:{for:'a'}})],event={kind:'kill',by:'Mira',type:'fire',x:10,y:10};
  tellTheCourt(c,folk,['p'],event,{place:'town',day:2},()=>0);
  assert.equal(c.members[0].knows,undefined);assert.equal(c.news[0].rumour,true);
  const news=tellTheCourt(c,folk,['p','spy','spy'],event,{place:'town',day:2},()=>0);
  assert.deepEqual(c.members[0].knows,{party:'town',day:2,heroes:['Mira'],tactic:'fire'});
  assert.equal(c.members[0].hunting,true);assert.equal(news.filter(n=>!n.rumour).length,1);
  tellTheCourt(c,folk,['spy'],{kind:'arrival',by:'Ada'},{place:'road',day:3},()=>0);
  assert.deepEqual(c.members[0].knows.heroes,['Mira','Ada']);assert.equal(c.members[0].knows.tactic,'fire');
  c.members[0].alive=false;
  assert.deepEqual(tellTheCourt(c,folk,['spy'],event,{place:'town',day:4},()=>0),[]);
});
test('route knowledge improves ambush chance only on a matching route', () => {
  const c=court();c.members[0].hunting=true;c.members[0].knows={party:'town',day:2,heroes:[]};
  assert.equal(pickAmbushers(c,{gaze:1,path:['town']},()=>.6).length,1);
  assert.equal(pickAmbushers(c,{gaze:1,path:['road']},()=>.6).length,0);
  c.members[0].alive=false;assert.equal(pickAmbushers(c,{gaze:1,path:['town']},()=>0).length,0);
});
test('rumours use living names, never private news, and false weakness hints are actually wrong', () => {
  const c=court();c.members.push({...c.members[0],id:'dead',name:'Dead',alive:false});
  c.news=[{who:'a',text:'PRIVATE REPORT',rumour:false}];
  // gossip, member, weakness, lie roll, wrong weakness, template
  const draws=[0,0,0,0,0,0];let i=0;
  const falseHint=rumourFor(person(),c,{gaze:5},()=>draws[i++]);
  assert.equal(falseHint.about,'a');assert.equal(falseHint.true,false);
  assert.ok(!falseHint.text.includes('fire'));
  assert.ok(Object.entries(WEAKNESSES).some(([k,w])=>k!=='fire'&&falseHint.text.includes(w.n.toLowerCase())));
  for(let seed=0;seed<100;seed++){
    const r=rumourFor(person(),c,{gaze:1},mulberry32(seed));
    assert.ok(r.about===null||r.about==='a');assert.ok(!r.text.includes('PRIVATE REPORT'));
  }
  const lure=rumourFor(person({spy:{for:'a'}}),c,{},()=>0);
  assert.equal(lure.true,false);assert.ok(lure.text.includes(PLACE_NAMES.tower || 'tower'))   // (by its name in the valley);assert.equal(lure.about,'a');
  assert.ok(greet(person({mood:'afraid'}),{},()=>0).length<30);
  assert.equal(rumourFor(person(),{members:[],news:[]},{},()=>0).about,null);
});
test('higher Gaze makes weakness gossip less reliable', () => {
  const c=court();let low=0,high=0;
  for(let seed=0;seed<500;seed++){
    if(!rumourFor(person(),c,{gaze:1},mulberry32(seed)).true)low++;
    if(!rumourFor(person(),c,{gaze:8},mulberry32(seed)).true)high++;
  }
  assert.ok(high>low*2);
});
test('folk functions never use ambient random numbers', () => {
  const old=Math.random, f=floor(), c=court(), rng=mulberry32(1);
  try {
    Math.random=()=>{throw new Error('ambient randomness');};
    const folk=populate(f,{place:'town',seed:'fixed',court:c});
    stepFolk(folk,f,{rng});greet(folk[0],{},rng);rumourFor(folk[0],c,{},rng);
    const event={kind:'kill',x:folk[0].x,y:folk[0].y};
    tellTheCourt(c,folk,witnesses(folk,f,event),event,{place:'town',day:1},rng);
  } finally {Math.random=old;}
});
test('ordinary witnesses can pass on public local killing rumours', () => {
  const c=court(), folk=[person()];
  const news=tellTheCourt(c,folk,['p'],{kind:'kill'},{place:'the ferry',day:3},()=>0);
  assert.deepEqual(rumourFor(folk[0],c,{},()=>0),{text:news[0].text,about:null,true:true});
});
