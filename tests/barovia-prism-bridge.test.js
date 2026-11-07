import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPrism,proposePrismClass,classIsSRD} from '../src/engine/barovia-prism-bridge.js';

test('class audit returns counts and names without rule descriptions',()=>{
 const fake={classes:[{name:'Ranger 2024',source:{sourceType:'canon'},hitDice:10,subclasses:[]},{name:'Savant',source:{sourceType:'homebrew'},hitDice:8,subclasses:[]}],feats:[{type:'feat'},{type:'leveledFeature'},{type:'fightingStyle'}],races:[{name:'Bogkin'}],spells:[]};
 const result=inspectPrism(fake);assert.equal(result.counts.classes,2);assert.equal(result.selectableFeats,2);assert.equal(result.additionalClasses.length,1);
 assert.ok(!JSON.stringify(result).includes('featureDescription'));assert.throws(()=>inspectPrism('{}'));
});
test('manual class proposals retain twenty tiers and don’t claim combat automation',()=>{
 const fake={name:'Savant',hitDice:8,numSelectionSkills:2,savingThrows:{intelligence:true,wisdom:true},primaryStats:{intelligence:true},selectionSkills:{investigation:true,sleightOfHand:true},armorProficiencies:{light:true},newFeatures:[{customFeat:{name:'Studied Foe',level:3}}],spellTable:{one:{known:2,cantrips:1,slots:{one:2}},twenty:{known:8,slots:{nine:1}}},subclasses:[{name:'Occultist'}]};
 const c=proposePrismClass(fake);assert.equal(c.name,'Savant');assert.deepEqual(c.saves,['Int','Wis']);assert.equal(c.features[3][0],'Studied Foe');assert.equal(c.spellTable.length,20);
 assert.equal(c.spellTable[0].slots[0][0],1);assert.equal(c.readyForCombat,false);assert.equal(classIsSRD('Ranger 2024'),true);
});

test('2014/2024 class aliases do not count as new classes',()=>{
 const r=inspectPrism({classes:[{name:'Wizard 2024'},{name:'Artificer'},{name:'Ranger, Revised'}],feats:[]});
 assert.deepEqual(r.additionalClasses.map(x=>x.name),['Artificer','Ranger, Revised']);
});
test('proposal tolerates missing or malformed optional import fields',()=>{
 const r=proposePrismClass({name:'Blood Hunter',hitDice:10});
 assert.equal(r.hitDie,10);assert.equal(r.spellTable,null);assert.equal(r.readyForCombat,false);
});
