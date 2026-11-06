import test from 'node:test';
import assert from 'node:assert/strict';
import {SRD_MONSTERS} from '../src/data/srd-monsters.js';
import {makeMob,mobAttack,hitMob,moraleCheck,formation,rising,advanceMob} from '../src/engine/mobs.js';
import {mulberry32} from '../src/util/core.js';
const creature=n=>SRD_MONSTERS.find(b=>b.name===n),mob=(n=30,name='Zombie')=>makeMob(creature(name),n,{rng:mulberry32(42)});
test('30 zombies attack with only eight reachable; average damage ranges are explicit',()=>{
 const m=mob();for(const [ac,min,max] of [[12,20,25],[16,13,18],[20,4,9]]){const rng=mulberry32(42);let sum=0;for(let i=0;i<2000;i++){const a=mobAttack(m,{ac,size:1},{rng});assert.equal(a.attackers,8);sum+=a.damage;}assert.ok(sum/2000>=min && sum/2000<=max);}
 assert.equal(mobAttack(m,{ac:12,distance:20},{rng:()=>0}).hits,0);
});
test('formation uses distinct open nearest squares and actual reach',()=>{
 const m=mob(3),squares=[{x:0,y:0},{x:0,y:0},{x:2,y:0,blocked:true},{x:1,y:0},{x:10,y:10},{x:3,y:3,open:false}];
 m.formation=formation(m,squares);assert.equal(m.formation.length,3);assert.equal(new Set(m.formation.map(s=>`${s.x},${s.y}`)).size,3);
 assert.equal(mobAttack(m,{ac:10,x:0,y:1,size:1},{rng:()=>0}).attackers,2);
});
test('single hits carry between members; areas hit occupants independently',()=>{
 const m=mob(5),a=hitMob(m,32);assert.equal(a.killed,2);assert.deepEqual(a.mob.hp,[13,15,15]);assert.equal(m.n,5);
 m.formation=formation(m,Array.from({length:5},(_,x)=>({x,y:0})));
 const b=hitMob(m,15,{area:true,squares:[{x:0,y:0},{x:1,y:0},{x:2,y:0}]});assert.equal(b.killed,3);assert.equal(b.affected,3);assert.equal(b.mob.n,2);
 assert.equal(hitMob(m,5,{area:true,count:4}).affected,4);
});
test('morale triggers at quarter, half and leader death, without repeating',()=>{
 const m=mob(20,'Commoner'),a=moraleCheck(m,{lost:4,rng:()=>0});assert.equal(a.triggered,false);
 const b=moraleCheck(m,{lost:5,rng:()=>0});assert.equal(b.holds,false);assert.equal(b.flees,10);
 assert.equal(moraleCheck(b.mob,{lost:5,rng:()=>0}).triggered,false);assert.equal(moraleCheck(b.mob,{lost:10,rng:()=>0}).triggered,true);
 assert.equal(moraleCheck(m,{leaderDead:true,rng:()=>0}).triggered,true);
});
test('undead only recoil from explicit failed Turn Undead saves; damage and time end it',()=>{
 const m=mob(10);assert.equal(moraleCheck(m,{lost:10,leaderDead:true,gaze:10,rng:()=>0}).holds,true);
 const a=moraleCheck(m,{turned:4,rng:()=>0});assert.equal(a.flees,4);assert.deepEqual(a.mob.turned[0].conditions,['frightened','incapacitated']);
 assert.equal(mobAttack(a.mob,{ac:12},{rng:()=>0}).attackers,6);assert.equal(hitMob(a.mob,1).mob.turned.length,3);assert.equal(advanceMob(a.mob,10).turned.length,0);
});
test('rising leaders have a demand, torches and social-compatible roles; JSON/seed/input safety',()=>{
 const a=rising({place:'vallaki',gaze:8,cause:'Bring back the child.',rng:mulberry32(42)}),b=rising({place:'vallaki',gaze:8,cause:'Bring back the child.',rng:mulberry32(42)});
 assert.deepEqual(a,b);assert.ok(a.leader.name);assert.equal(a.leader.role,'watch');assert.equal(a.demand,'Bring back the child.');assert.ok(a.torches>0);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
 const before=structuredClone(a);mobAttack(a,{ac:10},{rng:()=>0});hitMob(a,3);moraleCheck(a,{lost:20,rng:()=>0});formation(a,[{x:0,y:0}]);assert.deepEqual(a,before);
});
