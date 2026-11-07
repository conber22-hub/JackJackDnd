import test from 'node:test';
import assert from 'node:assert/strict';
import { BAROVIA_CODEX, classNames, subclassNames, newCharacterDraft, validateCodex, validateDraft, featureProgression, proficiencyBonus, maxSpellLevel, spellLimits, eligibleFeats, selectableSpells, allowedFeatForSlot, exportDraft, draftPreview } from '../src/engine/barovia-character-builder.js';

test('content counts and all cross-links are valid',()=>{
 assert.deepEqual([Object.keys(BAROVIA_CODEX.classes).length,Object.keys(BAROVIA_CODEX.subclasses).length,Object.keys(BAROVIA_CODEX.species).length,Object.keys(BAROVIA_CODEX.backgrounds).length,Object.keys(BAROVIA_CODEX.feats).length,BAROVIA_CODEX.spells.length,BAROVIA_CODEX.starters.length],[4,20,8,12,48,60,12]);
 assert.deepEqual(validateCodex(),[]);
});
test('all four classes progress from level 1 to 20 with no missing levels',()=>{
 for(const [name,C] of Object.entries(BAROVIA_CODEX.classes)){
  assert.equal(Object.keys(C.features).length,20);
  for(let l=1;l<=20;l++){assert.ok(C.features[l]?.length>0,`${name} ${l}`);}
  assert.ok(C.subclasses.length===2);
  assert.equal(subclassNames(name).length,2);
 }
});
test('all 12 core SRD classes have an additional original subclass',()=>{
 for(const n of ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'])assert.ok(subclassNames(n).length>=1,n);
 assert.equal(classNames().length,16);
});
test('12 starter drafts are valid and export JSON safely',()=>{
 for(let i=0;i<12;i++){let d=newCharacterDraft(i);assert.deepEqual(validateDraft(d),[]);assert.equal(exportDraft(d).format,'barovia-codex-vii-draft');assert.ok(JSON.parse(JSON.stringify(d)).className);}
});
test('subclass features reveal at unlock level and retain class-specific identities',()=>{
 for(let i=0;i<12;i++){const d=newCharacterDraft(i);d.level=2;assert.ok(!featureProgression(d).some(x=>x.source==='subclass'));
 d.level=3;assert.ok(featureProgression(d).some(x=>x.source==='subclass'));
 d.level=20;assert.equal(featureProgression(d).filter(x=>x.source==='subclass').length,4);}
});
test('spell caps follow full, half, noncaster, and obey level',()=>{
 const full=newCharacterDraft(2),half=newCharacterDraft(0),non=newCharacterDraft(1);
 for(let l=1;l<=20;l++){full.level=half.level=non.level=l;
  assert.equal(maxSpellLevel(full),Math.min(9,Math.ceil(l/2)));
  assert.equal(maxSpellLevel(half),Math.min(5,1+Math.floor((l-1)/4)));
  assert.equal(maxSpellLevel(non),0);assert.equal(selectableSpells(non).length,0);
  assert.ok(selectableSpells(full).every(s=>s.level<=maxSpellLevel(full)&&s.classes.includes('Ashbinder')));
  assert.ok(selectableSpells(half).every(s=>s.level<=maxSpellLevel(half)&&s.classes.includes('Lantern Marshal')));
 }
});
test('origin, general, style and epic feat levels are distinct',()=>{
 const d=newCharacterDraft();assert.ok(eligibleFeats(d,{category:'Origin'}).length>=12);assert.equal(eligibleFeats(d,{category:'Epic Boon'}).length,0);
 assert.equal(allowedFeatForSlot('Boon of the Last Lantern',18),false);assert.equal(allowedFeatForSlot('Boon of the Last Lantern',19),true);
 assert.equal(allowedFeatForSlot('Gatehold',4),true);assert.equal(allowedFeatForSlot('Wickwise',4),false);
 d.level=19;assert.equal(eligibleFeats(d,{category:'Epic Boon'}).length,4);
});
test('invalid feats, duplicate slots, wrong subclass and unknown spells are rejected',()=>{
 const d=newCharacterDraft();d.level=8;d.feats=[{level:4,feat:'Gatehold'},{level:4,feat:'Gatehold'}];d.spells=['Unknown Spell'];d.subclass='The Keyless';
 const er=validateDraft(d);assert.ok(er.some(x=>x.field==='feats'));assert.ok(er.some(x=>x.field==='spells'));assert.ok(er.some(x=>x.field==='subclass'));
 assert.throws(()=>exportDraft(d));
});
test('origin feats are unique and every spell tier contains six original choices',()=>{
 const origin=Object.values(BAROVIA_CODEX.backgrounds).map(x=>x.feat);assert.equal(new Set(origin).size,12);
 for(let i=0;i<=9;i++)assert.equal(BAROVIA_CODEX.spells.filter(s=>s.level===i).length,6);
});
test('data is JSON serializable and preview strips networking secrets',()=>{
 const d=newCharacterDraft();d.owner='not for export';d.key='secret';const exp=exportDraft(d);
 assert.ok(!('owner' in exp.character));assert.ok(!('key' in exp.character));
 assert.equal(draftPreview(d).level,1);assert.deepEqual(JSON.parse(JSON.stringify(BAROVIA_CODEX)),BAROVIA_CODEX);
});
test('stress test 1000 progression validations, feat picks and spell slices',()=>{
 for(let i=0;i<1000;i++){
  const d=newCharacterDraft(i%12);d.level=1+i%20;
  if(d.level>=4)d.feats=[{level:4,feat:'Gatehold'}];
  d.spells=selectableSpells(d).filter(x=>x.level===0).slice(0,Math.min(spellLimits(d).cantrips,i%4)).map(s=>s.name);
  assert.deepEqual(validateDraft(d),[],`draft ${i}`);
  const p=draftPreview(d);assert.ok(p.proficiency>=2&&p.proficiency<=6);
 }
});
