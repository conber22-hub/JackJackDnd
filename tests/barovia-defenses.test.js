import test from 'node:test';
import assert from 'node:assert/strict';
import { BAROVIA } from '../src/data/bestiary-barovia.js';
import { BESTIARY } from '../src/data/bestiary.js';
import { SRD_MONSTERS } from '../src/data/srd-monsters.js';
import { defensesFor, parseDefenses, DAMAGE_TYPES, CONDITIONS, applyDefenses } from '../src/engine/defenses.js';
const entries = [...BAROVIA,...BESTIARY];
test('all 72 local creatures resolve and every direct defence value is known', () => {
  assert.equal(entries.length,72);
  for(const b of entries){
    assert.ok(b.srd || b.def, b.id);
    const d = defensesFor(b);
    for(const k of ['resist','immune','vuln','condImmune']){
      assert.ok(Array.isArray(d[k]),`${b.id}: ${k}`);
      for(const v of d[k]) assert.ok((k==='condImmune'?CONDITIONS:DAMAGE_TYPES).includes(v),`${b.id}: ${v}`);
    }
  }
});
test('all SRD links agree in name, AC, HP dice and speed', () => {
  const linked=entries.filter(b=>b.srd);
  assert.equal(linked.length,26);
  for(const b of linked){
    const s=SRD_MONSTERS.find(s=>s.id===b.srd);
    assert.ok(s,b.srd);
    for(const k of ['name','ac','hp','speed'])assert.equal(b[k],s[k],`${b.id}: ${k}`);
    assert.deepEqual(defensesFor(b),parseDefenses(s.traits));
  }
});
test('precedence is SRD link, explicit override, then traits; returns independent arrays', () => {
  const traits=['<b>Vulnerabilities.</b> Fire'];
  const def={immune:['cold']};
  assert.deepEqual(defensesFor({srd:'srd-skeleton',def,traits}),parseDefenses(SRD_MONSTERS.find(s=>s.id==='srd-skeleton').traits));
  assert.deepEqual(defensesFor({def,traits}),{resist:[],immune:['cold'],vuln:[],condImmune:[]});
  assert.deepEqual(defensesFor({traits}).vuln,['fire']);
  assert.deepEqual(defensesFor({srd:'unknown',def}).immune,['cold']);
  assert.deepEqual(defensesFor(),parseDefenses());
  const d=defensesFor({def});d.immune.push('fire');assert.deepEqual(def.immune,['cold']);
  const b=entries.find(b=>b.srd);defensesFor(b).immune.push('force');assert.ok(!defensesFor(b).immune.includes('force'));
});
test('explicit homebrew mechanics work; conditional mechanics are not broadened', () => {
  const byId=id=>entries.find(b=>b.id===id);
  assert.deepEqual(defensesFor(byId('handmass')).resist,['bludgeoning','piercing','slashing']);
  assert.deepEqual(defensesFor(byId('handmass')).vuln,['radiant','fire']);
  assert.deepEqual(defensesFor(byId('cyst-node')).condImmune,['prone']);
  assert.deepEqual(defensesFor(byId('unbaptized')).resist,[]);
  assert.deepEqual(defensesFor(byId('unbaptized')).vuln,['radiant']);
  assert.deepEqual(defensesFor(byId('candlewight')).vuln,[]);
  for(const id of ['will-o-wisp','shadow']){
    assert.ok(defensesFor(byId(id)).resist.includes('acid'));
    assert.ok(!defensesFor(byId(id)).resist.includes('piercing'));
  }
  assert.equal(applyDefenses([{t:'poison',n:10}],defensesFor(byId('skeleton'))).total,0);
  assert.equal(applyDefenses([{t:'necrotic',n:9}],defensesFor(byId('vampire'))).total,4);
});
