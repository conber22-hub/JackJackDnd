import test from 'node:test';
import assert from 'node:assert/strict';
import { setState, state, T } from '../src/engine/state.js';
import { planTurn, resistWorthIt } from '../src/engine/tactics.js';
import { areaOf, areaSquares, caughtIn, rangeCheck } from '../src/engine/targeting.js';
import { planToward, checkPath } from '../src/engine/movement.js';
const tok=(id,x,y,extra={})=>({id,name:id,kind:id==='m'?'monster':'pc',floor:0,x,y,size:1,hp:20,maxHp:20,ac:12,speed:30,flags:{},conds:[],attacks:[{n:'Sword',b:4,d:'1d6'}],...extra});
function run(me,foes,allies=[],court){
  const floor={W:12,H:10,grid:Array(120).fill(T.ROOM),doors:[],rooms:[],rough:[]};
  setState({floors:[floor],tokens:[me,...foes,...allies],combat:{active:true}});
  const before=JSON.stringify(state), p=planTurn(me,{foes,allies,floor,court},()=>.5);
  assert.equal(JSON.stringify(state),before);
  if(p.kind==='attack') assert.ok(rangeCheck(me,foes.find(t=>t.id===p.target),me.attacks[p.i]).ok);
  if(p.to) assert.ok(checkPath(me,planToward(me,p.to.x,p.to.y,6),6)>=0);
  return p;
}
test('breath chooses three in a line, spares allies and respects recharge',()=>{
  const m=tok('m',1,4,{casts:[{n:'Breath',k:'save',r:0,area:['line',30],recharge:5}]}), foes=[tok('a',3,4),tok('b',4,4),tok('c',5,4)];
  let p=run(m,foes);assert.equal(p.kind,'cast');
  const area=areaOf(m.casts[p.i]);assert.equal(caughtIn(m,area,areaSquares(m,area,p.aim).squares,foes).length,3);
  const ally=tok('ally',4,4,{kind:'monster'});
  p=run(m,[tok('a',3,4,{hp:5})],[ally]);
  if(p.kind==='cast') assert.equal(caughtIn(m,area,areaSquares(m,area,p.aim).squares,[ally]).length,0);
  m.spent={Breath:true};assert.notEqual(run(m,foes).kind,'cast');
});
test('wounded goblin flees but court captain holds its ground',()=>{
  const m=tok('m',4,4,{bid:'goblin',hp:3}), foe=tok('a',5,4);
  assert.equal(run(m,[foe]).kind,'flee');m.nem='captain';assert.equal(run(m,[foe]).kind,'attack');
});
test('archer backs away and court avoids a known fire user',()=>{
  const m=tok('m',4,4,{attacks:[{n:'Shortbow',rng:[80,320],d:'1d6'}]});
  assert.equal(run(m,[tok('a',5,4)]).kind,'move');
  m.nem='n';const wizard=tok('wizard',7,4,{hp:1,casts:[{ty:'fire'}]}), fighter=tok('fighter',6,6);
  assert.equal(run(m,[wizard,fighter],[],{members:[{id:'n',alive:true,knows:{tactic:'fire'}}]}).target,'fighter');
});
test('fallen foes are spared except grudges and hunters; wolf drags',()=>{
  const m=tok('m',4,4), body=tok('body',5,4,{hp:0,dead:true});
  assert.equal(run(m,[body]).kind,'dodge');m.nem='n';
  assert.equal(run(m,[body],[],{members:[{id:'n',alive:true,grudge:{hero:'body'}}]}).kind,'attack');
  m.bid='count-s-wolf';assert.equal(run(m,[body,tok('standing',6,4)]).kind,'drag');
});
test('conditions stop actions and movement; distant foes require movement',()=>{
  const m=tok('m',1,1), foe=tok('a',10,8);
  assert.equal(run(m,[foe]).kind,'move');m.conds=[{n:'restrained'}];assert.equal(run(m,[foe]).kind,'dodge');
  m.conds=[{n:'stunned'}];assert.equal(run(m,[foe]).kind,'hold');
});
test('Legendary Resistance is reserved for failed, consequential saves',()=>{
  for(const cond of ['paralyzed','stunned','charmed','banished','petrified']) assert.ok(resistWorthIt({hp:100},false,{cond}));
  assert.ok(resistWorthIt({hp:100},false,{dmg:25}));assert.equal(resistWorthIt({hp:100},false,{dmg:24}),false);
  assert.equal(resistWorthIt({hp:100},true,{cond:'stunned'}),false);
});
test('walls block attacks and areas; retreat and approach respect occupied squares',()=>{
  const m=tok('m',2,4,{casts:[{n:'Breath',k:'save',r:0,area:['line',30]}]}), foes=[tok('a',4,4),tok('b',5,4)];
  run(m,foes);
  for(let y=0;y<10;y++) state.floors[0].grid[y*12+3]=T.ROCK;
  const p=planTurn(m,{foes,floor:state.floors[0]});
  assert.equal(p.kind,'dodge');
});
test('short-range archer stops as soon as a shot is possible',()=>{
  const m=tok('m',1,4,{attacks:[{n:'Dart',rng:[10,10],d:'1d4'}]}), foe=tok('a',7,4);
  const p=run(m,[foe]);assert.equal(p.kind,'move');
  assert.ok(rangeCheck({...m,...p.to},foe,m.attacks[0]).ok);
  assert.ok(Math.max(Math.abs(p.to.x-foe.x),Math.abs(p.to.y-foe.y))>1);
});
