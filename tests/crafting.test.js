import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS } from '../src/data/crafting.js';
import { build,plan,work,finish,wares } from '../src/engine/crafting.js';
import { itemInfo,itemEffects,canEquip,load } from '../src/engine/inventory.js';
const blade={kind:'weapon',parts:{frame:'weapon-longsword',material:'steel',rune:'rune-1'}};
const ctx={crafter:{role:'smith'},tools:["Smith's Tools"],materials:{stock:100,'rune-dust':10},place:{workshops:['forge']}};
test('parts have sane numbers and frames preserve every catalogue field',()=>{
 assert.equal(new Set(PARTS.map(p=>p.id)).size,PARTS.length);
 for(const p of PARTS){for(const k of ['cost','weight','hours']) assert.ok(Number.isFinite(p[k]) && p[k]>=0,p.id);assert.ok(p.needs.dc>0);if(p.mods.base){const b=build({kind:p.kinds[0],parts:{frame:p.id}});assert.ok(b.ok);for(const [k,v] of Object.entries(p.mods.base)) if(k!=='cost' && k!=='weight') assert.deepEqual(b.item[k],v);}}
});
test('compatibility and naming',()=>{
 for(const d of [{kind:'weapon',parts:{frame:'weapon-greatsword',grip:'shield-grip'}},{kind:'wagon',parts:{frame:'handcart',team:'oxen'}},{kind:'weapon',parts:{frame:'weapon-dagger',head:'long-haft'}},{kind:'wagon',parts:{frame:'handcart',fittings:['bunks','lockbox']}},{kind:'weapon',parts:{frame:'weapon-longsword',bogus:'steel'}}]) assert.ok(build(d).why);
 assert.match(build(blade).item.n,/Steel Longsword.*\+1/);assert.equal(build({...blade,name:'Ash'}).item.n,'Ash');
});
test('custom weapons and armour equip and apply numeric runes without losing old calls',()=>{
 const item=build(blade).item, entry={id:'a',n:item.n,custom:item,equipped:true};
 const h={inv:[entry]};assert.equal(itemInfo(entry).baseName,'Longsword');assert.equal(itemInfo('Longsword').d,'1d8');assert.equal(itemEffects(h).attack[item.n],1);assert.equal(itemEffects(h).damage[item.n],1);assert.ok(canEquip(h,'a').ok);assert.equal(load(h,10).weight,item.weight);
 const armor=build({kind:'armor',parts:{frame:'armor-chain-mail',rune:'rune-1'}}).item;
 h.inv.push({id:'b',n:armor.n,custom:armor,equipped:true});assert.equal(itemEffects(h).ac,1);
 const two=build({kind:'weapon',parts:{frame:'weapon-greatsword'}}).item;
 assert.equal(canEquip({inv:[{id:'t',n:two.n,custom:two},{id:'s',n:'Shield',equipped:true}]},'t').ok,false);
});
test('wagon parts change carrying, travel and defence',()=>{
 const a=build({kind:'wagon',parts:{frame:'wagon'}}).item,b=build({kind:'wagon',parts:{frame:'wagon',axle:'iron-axle',team:'oxen',armour:'iron-bands',fittings:['bunks']}}).item;
 for(const k of ['capacity','speed','hp','ac','bunks']) assert.ok(b[k]>a[k],k);
});
test('jobs charge failed time, report ruined stock and finish only after success',()=>{
 const job=plan(blade,ctx);assert.ok(job.ok);assert.equal(finish(job),null);
 const failed=work(job,4,{roll:2},()=>.5);assert.equal(failed.progress,0);assert.equal(failed.spent,4);
 const ruined=work(failed,4,{roll:1},()=>0);assert.deepEqual(ruined.ruined,['stock']);assert.equal(ruined.replacementMaterials.stock,1);
 const done=work(ruined,job.hours,{roll:20,materials:{stock:1}},()=>.5);assert.deepEqual(finish(done),job.item);assert.equal(done.spent,job.hours+8);assert.equal(job.spent,0);
 assert.equal(plan(blade,{...ctx,crafter:{role:'peddler'}}).ok,false);assert.equal(plan(blade,{...ctx,place:{}}).ok,false);assert.equal(plan(blade,{...ctx,materials:{}}).ok,false);
});
test('wares are stable within a week and exclude non-smiths',()=>{
 assert.deepEqual(wares({id:'s',role:'smith'},{day:2,seed:7}),wares({id:'s',role:'smith'},{day:2,seed:7}));assert.equal(wares({role:'peddler'}).length,0);
});
