import test from 'node:test';
import assert from 'node:assert/strict';
import { TRADITIONS, RITES } from '../src/data/rites.js';
import { SRD_SPELLS } from '../src/data/srd-spells.js';
import { validateRites, riteName, riteLine, tradition, ritesFor } from '../src/engine/rites.js';

const letters={archivist:'W',relicborn:'S',seepbound:'K',chaplain:'C',herald:'B',mistwalker:'D',warden:'P',marksman:'R'};
test('every caster reads every eligible spell in their own tradition',()=>{
  assert.deepEqual(validateRites(),[]);
  assert.deepEqual(Object.keys(TRADITIONS).sort(),Object.keys(letters).sort());
  assert.deepEqual(Object.keys(RITES).sort(),SRD_SPELLS.map(s=>s.n).sort());
  for(const [id,letter] of Object.entries(letters)){
    const info=tradition(id);
    assert.equal(info.id,id); assert.equal(info.calling,id);assert.ok(info.word && info.plural && info.voice);
    const list=ritesFor(id), expected=SRD_SPELLS.filter(s=>s.c.includes(letter));
    assert.deepEqual(list.map(r=>r.spell).sort(),expected.map(s=>s.n).sort());
    assert.equal(new Set(list.map(r=>r.n.toLowerCase())).size,list.length);
    assert.deepEqual(list,[...list].sort((a,b)=>a.l-b.l || a.n.localeCompare(b.n,'en')));
    for(const {n,c,l} of SRD_SPELLS){
      if(!c.includes(letter)){assert.equal(riteName(n,id),n);assert.equal(riteLine(n,id),'');continue;}
      const row=list.find(r=>r.spell===n);
      assert.deepEqual(row,{spell:n,n:riteName(n,id),line:riteLine(n,id),l});
      assert.ok(row.n.length>0 && row.n.length<40 && !row.n.toLowerCase().includes(n.toLowerCase()));
      assert.ok(row.line.length>0 && row.line.length<90);
    }
  }
  assert.doesNotMatch(JSON.stringify([TRADITIONS,RITES]),/\b(master chief|covenant|cortana|spartan|sangheili|unggoy|jiralhanae|gravemind|forerunner|unsc|odst|warthog|pelican|needler|halo|flood|arbiter|guilty spark|mjolnir)\b/i);
});
test('one shared working can be read in eight distinct voices',()=>{
  const views=Object.values(RITES['Detect Magic'].by);
  for(const field of ['n','line'])assert.equal(new Set(views.map(v=>v[field])).size,8);
});
test('classic sheets, private book spells and malformed selections have safe fallbacks',()=>{
  for(const id of [null,{},undefined,'fighter','constructor']){
    assert.equal(tradition(id),null);assert.deepEqual(ritesFor(id),[]);
    assert.equal(riteName('Magic Missile',id),'Magic Missile');assert.equal(riteLine('Magic Missile',id),'');
  }
  for(const n of ['My Private Spell','__proto__',null,{},undefined]){
    assert.equal(riteName(n,'archivist'),typeof n==='string'?n:'');assert.equal(riteLine(n,'archivist'),'');
  }
});
