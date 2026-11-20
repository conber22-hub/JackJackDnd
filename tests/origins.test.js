import test from 'node:test';
import assert from 'node:assert/strict';
import { ORIGINS,BACKS,FEATS } from '../src/data/origins.js';
import { SPECIES,BACKGROUNDS,FEATS as classicFeats } from '../src/data/srd.js';
import { originList,backList,featList,originView,backView,featView,validateOrigins,asClassic } from '../src/engine/origins.js';
test('catalogues, rules references, choices and names agree',()=>{
  assert.deepEqual(validateOrigins(),[]);
  assert.ok(originList().length>=9 && backList().length>=10 && featList().length>=24);
  for(const g of ['drawn','barovian','kin']) assert.ok(originList().filter(o=>o.group===g).length>=3);
  const all=[...originList(),...backList(),...featList()];
  assert.equal(new Set(all.map(x=>x.id)).size,all.length);
  assert.equal(new Set(all.map(x=>x.name)).size,all.length);
  for(const x of all){
    assert.ok(![...Object.keys(SPECIES),...Object.keys(BACKGROUNDS),...Object.keys(classicFeats)].includes(x.name));
    assert.ok((x.blurb??'').length<220 && (x.look??'').length<200 && (x.text??'').length<500);
  }
  assert.ok(featList({cat:'origin'}).length>=8);
  assert.ok(featList().filter(f=>f.req.includes('Seep-touched') && f.mech.also?.some(a=>a.k==='seepCost' && a.what)).length>=4);
  assert.doesNotMatch(JSON.stringify([ORIGINS,BACKS,FEATS]),/\b(master chief|covenant|cortana|spartan|sangheili|unggoy|jiralhanae|gravemind|forerunner|unsc|odst|warthog|pelican|needler|halo|flood|arbiter|guilty spark|mjolnir)\b/i);
});
test('classic bridge resolves actual species, training, feats and lineage options',()=>{
  assert.deepEqual(asClassic({origin:'drawn-future',back:'levy-veteran',feats:['hold-the-line','old-habits','seep-scarred']}),{sp:'Orc',spOpt:null,bg:'Soldier',feats:['Savage Attacker','Magic Initiate']});
  assert.equal(asClassic({origin:'old-blood',originOpt:'Crypt key'}).spOpt,'Chthonic');
  const classic={sp:'Elf',spOpt:'Wood Elf',bg:'Sage',feats:['Alert']};
  assert.deepEqual(asClassic(classic),classic);
  for(const id of [null,{},'constructor']) for(const fn of [originView,backView,featView])assert.equal(fn(id),null);
  assert.deepEqual(asClassic(null),{sp:null,spOpt:null,bg:null,feats:[]});
});
