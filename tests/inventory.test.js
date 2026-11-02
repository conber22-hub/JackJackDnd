import test from 'node:test';
import assert from 'node:assert/strict';
import { SRD_WEAPONS, ARMOR_ITEMS, TOOLS, GEAR, MAGIC_ITEMS } from '../src/data/srd-items.js';
import { migrateSheet, itemInfo, canEquip, itemEffects, load, coinValueGp } from '../src/engine/inventory.js';
const row = (n, extra = {}) => ({id:n,n,qty:1,equipped:true,attuned:false,...extra});
test('migration copies old sheets, resolves aliases, preserves existing inventory and coins', () => {
  const old = {armor:'Leather',shield:true,weapons:['Longsword',''],coins:{gp:5}};
  const before = structuredClone(old), h = migrateSheet(old);
  assert.deepEqual(old,before);
  assert.deepEqual(h.inv.map(i=>i.n),['Leather Armor','Shield','Longsword']);
  assert.ok(h.inv.every(i=>i.equipped && !i.attuned && i.qty === 1));
  assert.equal(new Set(h.inv.map(i=>i.id)).size,3);
  assert.deepEqual(h.coins,{cp:0,sp:0,ep:0,gp:5,pp:0});
  assert.deepEqual(migrateSheet(h), h);
  h.inv[0].n = 'Changed'; assert.equal(old.armor,'Leather');
  assert.deepEqual(migrateSheet({armor:'None',inv:[]}).inv,[]);
});
test('every catalogue entry and all weapon/armour bonus variants resolve without mutating data', () => {
  for (const c of [SRD_WEAPONS,ARMOR_ITEMS,TOOLS,GEAR,MAGIC_ITEMS]) for (const i of c) assert.equal(itemInfo(i.n).n,i.n);
  for (const i of [...SRD_WEAPONS,...ARMOR_ITEMS]) for (const bonus of [1,2,3]){
    const info = itemInfo(`${i.n}, +${bonus}`);
    assert.equal(info.baseName,i.n);
    assert.equal(info.weight,i.weight);
    assert.equal(info.kind === 'weapon' ? info.dmgBonus : info.acBonus,bonus);
  }
  const info = itemInfo('Weapon, +1, +2, or +3'); info.variants[0].atk = 999;
  assert.equal(itemInfo('Longsword, +1').atk,1);
  assert.equal(itemInfo('Longsword, +4'),null);
});
test('effects are increments, scoped to weapons, equipped and attuned where required', () => {
  const h = {inv:[row('Plate Armor, +1'),row('Shield, +1'),row('Longsword, +2'),row('Longbow, +1'),row('Bracers of Archery',{attuned:true}),row('Cloak of Protection',{attuned:true}),row('Ring of Protection')]};
  const before = structuredClone(h);
  assert.deepEqual(itemEffects(h),{ac:3,attack:{'Longsword, +2':2,'Longbow, +1':1},damage:{'Longsword, +2':2,'Longbow, +1':3},saves:1,spellAttack:0,spellDc:0,notes:['Plate Armor, +1','Shield, +1','Longsword, +2','Longbow, +1','Bracers of Archery','Cloak of Protection']});
  assert.deepEqual(h,before);
  assert.equal(itemEffects({inv:[row('Plate Armor'),row('Shield')]}).ac,0);
  assert.equal(itemEffects({inv:[row('Plate Armor, +3',{equipped:false})]}).ac,0);
  assert.equal(itemEffects({inv:[row('Armor, +3')]}).ac,0);
});
test('equipment restrictions and proposed attunement limit', () => {
  const h = {inv:[row('Chain Mail'),row('Plate Armor',{equipped:false}),row('Shield')]};
  assert.equal(canEquip(h,'Plate Armor').ok,false);
  assert.equal(canEquip(h,'Chain Mail').ok,true);
  assert.equal(canEquip(h,'missing').ok,false);
  h.inv.push(row('Shield, +1',{equipped:false})); assert.equal(canEquip(h,'Shield, +1').ok,false);
  const attuned = {inv:['Cloak of Protection','Ring of Protection','Bracers of Archery','Amulet of Health'].map(n=>row(n,{attuned:true}))};
  assert.equal(canEquip(attuned,'Amulet of Health').ok,false);
  attuned.inv[0].attuned = false; assert.equal(canEquip(attuned,'Amulet of Health').ok,true);
  for (const n of ['Greatsword','Longbow, +2']){
    assert.equal(canEquip({inv:[row(n,{equipped:false}),row('Shield')]},n).ok,false);
    assert.equal(canEquip({inv:[row(n),row('Shield',{equipped:false})]},'Shield').ok,false);
  }
  assert.equal(canEquip({inv:[row('Longsword'),row('Shield',{equipped:false})]},'Shield').ok,true);
});
test('unknown items are carried without invented effects; weights and all coin denominations', () => {
  const h = {inv:[row('Private relic',{text:'DM text'}),row('Longsword',{qty:2,equipped:false})],coins:{cp:50,sp:10,ep:2,gp:3,pp:1}};
  assert.equal(itemInfo('Private relic'),null);
  assert.equal(canEquip(h,'Private relic').ok,true);
  assert.deepEqual(itemEffects(h).notes,['Private relic']);
  assert.equal(coinValueGp(h.coins),15.5);
  assert.deepEqual(load(h,1),{weight:7.32,capacity:15,over:false});
  assert.equal(load(h,0).over,true);
  assert.equal(coinValueGp(),0);
  assert.equal(load({inv:[row('Longsword',{qty:0})]},10).weight,0);
});

test('duplicate equipped copies and stack quantities do not multiply bonuses', () => {
  const h = {inv:[row('Longsword, +2',{qty:3}),row('Longsword, +2',{id:'second'}),row('Cloak of Protection',{attuned:true}),row('Cloak of Protection',{id:'other-cloak',attuned:true})]};
  assert.equal(itemEffects(h).attack['Longsword, +2'],2);
  assert.equal(itemEffects(h).ac,1);
});
