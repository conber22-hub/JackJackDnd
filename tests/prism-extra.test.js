import test from 'node:test';import assert from 'node:assert/strict';import{gunzipSync}from'node:zlib';import{readFileSync}from'node:fs';
import {prismClassName,convertPrismClass,prismExtraCatalog} from '../src/engine/prism-extra.js';
const d=JSON.parse(gunzipSync(readFileSync(new URL('../public/assets/compendium/all-you-need2026.prism.gz',import.meta.url))));
const core=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const e=prismExtraCatalog(d,core);
test('2024 core classes retain existing SRD rules, with exactly five non-SRD class choices',()=>{
 assert.deepEqual(Object.keys(e.classes).sort(),['Artificer','Blood Hunter','Mystic','Ranger, Revised','Savant'].sort());
 assert.equal(prismClassName('Wizard 2024'),'Wizard');
});
test('five class chassis survive JSON and support 20 level progression with no holes',()=>{
 for(const [n,c] of Object.entries(e.classes)){
  assert.ok(c.hd>=6,n);assert.equal(c.sv.length,2,n);assert.ok(c.armor,n);
  assert.ok(c.skills[1].length>=c.skills[0],n);assert.ok(c.sub,n);
  assert.deepEqual(Object.keys(c.features).map(Number),Array.from({length:20},(_,i)=>i+1),n);
  assert.ok(Object.values(c.features).flat().length>3,n);
  if(c.cast){assert.equal(c.cantrips.length,20);assert.equal(c.prep.length,20);}
  assert.deepEqual(JSON.parse(JSON.stringify(c)),c);
 }
});
test('Artificer spells start at level one; all unsupported powers explicitly remain manual',()=>{
 assert.equal(e.classes.Artificer.cast,'Int');assert.equal(e.classes.Artificer.half,true);
 assert.equal(e.classes.Artificer.cantrips[0],2);
 assert.equal(e.classes['Ranger, Revised'].letter,'R');
 assert.equal(e.classes.Mystic.manual,true);
 assert.equal(e.classes['Blood Hunter'].manual,true);
});
test('invocations, selection groups and feature descriptions survive the conversion',()=>{
 assert.equal(e.invocations.length,22);assert.equal(e.selectionGroups.length,136);
 assert.equal(e.features.length,3285-177-8);
 assert.ok(e.invocations.every(i=>i.n.length>0));
 for(const arr of [e.invocations,e.selectionGroups,e.features])assert.deepEqual(JSON.parse(JSON.stringify(arr)),arr);
});
test('conversion is deterministic and leaves the uploaded source untouched',()=>{
 const before=JSON.stringify(d.classes[0]);
 assert.deepEqual(prismExtraCatalog(d,core),e);
 assert.equal(JSON.stringify(d.classes[0]),before);
});
