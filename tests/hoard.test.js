import test from 'node:test';
import assert from 'node:assert/strict';
import {hoard,keyItems,value,split} from '../src/engine/hoard.js';
import {SRD_WEAPONS,ARMOR_ITEMS,TOOLS,GEAR,MAGIC_ITEMS} from '../src/data/srd-items.js';
import {mulberry32} from '../src/util/core.js';
const roll=(tier,level=1,fam='folk',seed=42)=>hoard(tier,{level,fam,rng:mulberry32(seed)});
test('wealth rises with tier and level over many seeds',()=>{
 const avg=(t,l)=>Array.from({length:300},(_,s)=>value(roll(t,l,'folk',s))).reduce((a,b)=>a+b,0)/300;
 assert.equal(avg(0,1),0);assert.ok(avg(1,1)<avg(2,1));assert.ok(avg(2,1)<avg(3,1));assert.ok(avg(3,1)<avg(3,10));assert.ok(avg(3,10)<avg(3,20));
});
test('every selected item is a real catalogue name and rarity is level capped',()=>{
 const names=new Set([...SRD_WEAPONS,...ARMOR_ITEMS,...TOOLS,...GEAR,...MAGIC_ITEMS].map(i=>i.n)),rank={mundane:-1,common:0,uncommon:1,rare:2};
 for(const level of [1,4,5,10,11,20]) for(let s=0;s<200;s++) for(const item of roll(3,level,'folk',s).items){assert.ok(names.has(item.id));assert.ok(rank[item.rarity]<=(level<5?0:level<11?1:2));}
});
test('seep spoils valuables; the Count sometimes marks his tithe',()=>{
 let spoiled=0,marked=0;
 for(let s=0;s<100;s++){
  const a=roll(3,12,'folk',s),b=roll(3,12,'seep',s);assert.ok(value(b)<=value(a));spoiled+=b.items.filter(i=>i.spoiled).length;
  for(const i of [...b.items,...b.art].filter(i=>i.spoiled)) assert.equal(i.gp,i.originalGp/2);
  const c=roll(3,12,'barovia',s);marked+=c.items.filter(i=>i.counts).length;assert.ok(c.items.filter(i=>i.counts).length<=1);
 }assert.ok(spoiled>0);assert.ok(marked>0 && marked<100);
});
test('keys preserve placement and real graph door IDs, excluding secrets',()=>{
 const locks=[{a:1,b:2,kind:'locked',key:{id:'k1',name:'Bone key',how:'carried',in:0}},{a:2,b:3,kind:'sealed',key:{id:'k2',name:'Sigil',how:'hidden',in:1}},{a:3,b:4,kind:'secret',key:{name:'Lever'}}];
 const keys=keyItems(locks,{links:[{a:1,b:2,doors:[10,11]},{a:2,b:3,doors:[12]}]});assert.equal(keys.length,2);assert.deepEqual(keys[0].opens,[10,11]);assert.equal(keys[0].placement,'leader');assert.equal(keys[1].placement,'container');assert.equal(keys[0].weight,0);
});
test('value and split account for every denomination and preserve inputs',()=>{
 const h={coins:{cp:17,sp:13,ep:9,gp:101,pp:3},items:[{gp:2.5,qty:2}],art:[{gp:25}]},before=structuredClone(h);
 assert.equal(value(h),166.97);const s=split(h,4);for(const k of Object.keys(h.coins)) assert.equal(s.shares.reduce((n,c)=>n+c[k],0)+s.remainder[k],h.coins[k]);assert.deepEqual(h,before);s.shares[0].gp=0;assert.notEqual(s.shares[1].gp,0);assert.throws(()=>split(h,0),RangeError);
});
test('seeded outputs are deterministic and JSON-safe',()=>{const a=roll(3,12,'barovia');assert.deepEqual(a,roll(3,12,'barovia'));assert.deepEqual(JSON.parse(JSON.stringify(a)),a);assert.notDeepEqual(a,roll(3,12,'barovia',43));});
