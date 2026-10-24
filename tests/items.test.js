import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SRD_WEAPONS, ARMOR_ITEMS, TOOLS, GEAR, MAGIC_ITEMS } from '../src/data/srd-items.js';
import { WEAPONS, ARMOR } from '../src/data/srd.js';
import { newHero, heroAttacks, heroStats } from '../src/engine/hero.js';
const index = JSON.parse(readFileSync(new URL('./fixtures/srd-magic-item-index.json', import.meta.url)));

test('equipment and magic item counts, shapes and names match the SRD', () => {
  assert.deepEqual([SRD_WEAPONS.length, ARMOR_ITEMS.length, TOOLS.length, GEAR.length, MAGIC_ITEMS.length], [38,13,25,82,258]);
  assert.deepEqual(MAGIC_ITEMS.map(x => x.n).sort(), index.map(x => x.n).sort());
  for (const entries of [SRD_WEAPONS, ARMOR_ITEMS, TOOLS, GEAR, MAGIC_ITEMS]){
    assert.equal(new Set(entries.map(x => x.n.toLowerCase())).size, entries.length);
    for (const x of entries){
      assert.ok(x.n); assert.equal(x.src, 'SRD 5.2.1');
      if (entries === MAGIC_ITEMS){ assert.ok(x.type && x.rarity && x.text); assert.equal(typeof x.attune, 'string'); }
      else { assert.ok(x.cost === null || Number.isFinite(x.cost) && x.cost >= 0); assert.ok(x.weight === null || Number.isFinite(x.weight) && x.weight >= 0); assert.ok(x.costText && x.weightText); }
    }
    assert.deepEqual(JSON.parse(JSON.stringify(entries)), entries);
  }
});

test('weapon mastery, armour aliases and new equipment work with the existing hero engine', () => {
  assert.equal(WEAPONS, SRD_WEAPONS);
  for (const w of WEAPONS){
    assert.match(w.d, /^(?:\d+d\d+|\d+)$/);
    assert.ok(['Cleave','Graze','Nick','Push','Sap','Slow','Topple','Vex'].includes(w.ms));
    const h = { ...newHero('Fighter'), weapons:[w.n], shield:false };
    const attack = heroAttacks(h)[0]; assert.equal(attack.n, w.n); assert.ok(Number.isFinite(attack.b));
  }
  assert.equal(heroAttacks({ ...newHero('Fighter'), weapons:['Musket'] })[0].d, '1d12+2');
  assert.equal(heroAttacks({ ...newHero('Fighter'), weapons:['Lance'] })[0].reach, 2);
  assert.equal(ARMOR.Leather.ac, 11); assert.equal(ARMOR['Studded Leather'].dex, 99);
  assert.equal(ARMOR.Padded.ac, 11); assert.equal(ARMOR.Shield, undefined, 'the creator has a separate shield toggle');
  assert.equal(heroStats(newHero('Fighter')).ac, 19);
  assert.equal(SRD_WEAPONS.find(w => w.n === 'Dart').weight, .25);
});

test('costs, fractional weights, variants and pack contents survive conversion', () => {
  const get = n => GEAR.find(x => x.n === n);
  assert.equal(get('Ball Bearings').cost, 1); assert.equal(get('Candle').cost, .01);
  assert.equal(get("Entertainer's Pack").weight, 58.5);
  assert.equal(get('Waterskin').weight, 5); assert.match(get('Waterskin').weightText, /full/);
  assert.equal(get('Mirror').weight, .5);
  assert.equal(get('Poison, Basic').weight, 0, 'the SRD lists negligible weight');
  assert.match(get("Explorer's Pack").text, /10 Torches/);
  assert.equal(get('Ammunition').variants.find(v => v.n === 'Bolts').weight, 1.5);
  assert.equal(get('Ammunition').variants.find(v => v.n === 'Arrows').amount, 20);
  assert.equal(TOOLS.find(t => t.n === 'Musical Instrument').variants.length, 10);
  assert.equal(TOOLS.find(t => t.n === 'Gaming Set').variants.length, 4);
  assert.equal(TOOLS.find(t => t.n === 'Musical Instrument').cost, null, 'variable prices are not free');
});

test('magic item variants and embedded stat blocks are retained without invented automation', () => {
  const get = n => MAGIC_ITEMS.find(x => x.n === n);
  assert.deepEqual(get('Weapon, +1, +2, or +3').variants.map(v => v.atk), [1,2,3]);
  assert.equal(get('Ring of Protection').ac, 1); assert.equal(get('Ring of Protection').saves, 1);
  assert.match(get('Flame Tongue').text, /2d6/); assert.equal(get('Flame Tongue').dmg, undefined, 'activation-dependent damage remains text');
  assert.match(get('Bag of Tricks').text, /<table>/);
  assert.match(get('Figurine of Wondrous Power').text, /Large Beast/);
  assert.match(get('Mysterious Deck').text, /Medium Undead/);
  assert.match(get('Potions of Healing').text, /10d4 \+ 20/);
});
