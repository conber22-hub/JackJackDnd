import test from 'node:test';
import assert from 'node:assert/strict';
import { CALLINGS, MECHS } from '../src/data/callings.js';
import { CLASSES } from '../src/data/srd.js';
import { callingList, callingOf, callingForChassis, pathOf, pathFeatures, featuresAt, featureView, validateCallings } from '../src/engine/callings.js';

test('twelve original callings cover every chassis and its progressions',()=>{
  assert.deepEqual(validateCallings(),[]);
  assert.equal(callingList().length,12);
  const seen=new Set(), banned=new Set(Object.keys(CLASSES));
  for(const c of Object.values(CLASSES)){banned.add(c.sub); Object.values(c.features).flat().forEach(n=>banned.add(n));}
  for(const [id,c] of Object.entries(CALLINGS)){
    assert.equal(id,c.id); assert.equal(callingForChassis(c.chassis),c);
    assert.ok(!seen.has(c.name)); seen.add(c.name);
    assert.match(c.color,/^#[a-f0-9]{6}$/); assert.ok(c.blurb.length<220 && c.look.length<200);
    for(const f of Object.values(c.rename)){assert.ok(!banned.has(f.n),f.n);assert.ok(f.text && f.text.length<500);}
    for(const p of c.paths){
      assert.ok(!seen.has(p.id)); seen.add(p.id);
      assert.ok(!banned.has(p.name) && p.blurb.length<220);
      for(const f of pathFeatures(id,p.id,20)){
        assert.ok(f.text.length<500 && !banned.has(f.n));
        for(const m of [f.mech,...(f.mech.also??[]),f.mech.does,f.mech.gives].filter(Boolean)){
          assert.ok(MECHS.some(def=>def.k===m.k && def.fields.every(k=>k in m)));
          if(m.k==='like') assert.ok(Object.values(CLASSES[c.chassis].features).flat().includes(m.feature));
        }
        if(p.seep) assert.equal(f.mech.also[0].what,p.cost);
      }
    }
  }
  assert.doesNotMatch(JSON.stringify(CALLINGS),/\b(master chief|covenant|cortana|spartan|sangheili|unggoy|jiralhanae|gravemind|forerunner|unsc|odst|warthog|pelican|needler|halo|flood|arbiter|guilty spark|mjolnir)\b/i);
});
test('level-five Hoplite shows its Ward, drill and own path in order',()=>{
  const fs=featuresAt({calling:'vanguard',path:'hoplite',lvl:5});
  for(const n of ['Ward','Field Patch','Shield Rim','Follow Through']) assert.ok(fs.some(f=>f.n===n),n);
  assert.deepEqual(fs.map(f=>f.lvl),fs.map(f=>f.lvl).sort((a,b)=>a-b));assert.ok(fs.every(f=>f.lvl<=5));
  assert.equal(fs.find(f=>f.n==='Shield Rim').from,'path');
  assert.deepEqual(featureView('vanguard','Champion: Improved Critical'),{n:'Champion: Improved Critical',text:''});
  for(const h of [null,{}, {calling:'constructor'}]){assert.equal(callingOf(h),null);assert.deepEqual(featuresAt(h),[]);}
  assert.equal(pathOf(null,null),null);
});
