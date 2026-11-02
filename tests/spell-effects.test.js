import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SRD_SPELLS } from '../src/data/srd-spells.js';
import { SRD_MONSTERS } from '../src/data/srd-monsters.js';
import { SPELL_EFFECTS } from '../src/data/spell-effects.js';
import { MONSTER_PLAY } from '../src/data/monster-play.js';
import { buildSpellEffects, timing } from '../scripts/import-spell-conditions.mjs';
import { buildMonsterPlay } from '../scripts/import-monster-actions.mjs';
import { parseDefenses } from '../src/engine/defenses.js';
function evidence(effect,text,duration = ''){
  assert.match(text,new RegExp(`${effect.cond} condition`,'i'));
  if (effect.save) assert.match(text,new RegExp(`${({str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'})[effect.save]} saving throw`,'i'));
  if (effect.repeat) assert.match(text,new RegExp(`at the ${effect.repeat} of each of (?:its|the target's) turns`,'i'));
  assert.ok(effect.dur);
  if (effect.expires){
    assert.match(text,new RegExp(`until the ${effect.expires.phase} of`,'i'));
    assert.match(text,effect.expires.next ? /next turn/i : /current turn/i);
    assert.equal(effect.dur.n,effect.expires.next ? 1 : 0);
    assert.equal(effect.dur.unit,'round');
  } else assert.match(text+' '+duration,new RegExp(`${effect.dur.n} ${effect.dur.unit}s?\\b`,'i'));
  for(const event of effect.endsOn){
    if(event==='damageByCasterOrAlly') assert.match(text,/you\s+or (?:one of )?your allies/i);
    else assert.match(text,({damage:/takes (?:any )?damage/i,attack:/attack roll/i,dealDamage:/deals? damage/i,castSpell:/casts? a spell/i})[event]);
  }
}
test('spell overlay is reproducible and every supported or skipped mention is accounted for', () => {
  const {effects,skipped} = buildSpellEffects();
  assert.deepEqual(effects,SPELL_EFFECTS);
  assert.equal(Object.keys(effects).length,16);
  assert.ok(Object.keys(skipped).length > 50);
  for(const s of SRD_SPELLS) if(effects[s.n]){
    evidence(effects[s.n],s.text,s.dur);
    assert.equal(effects[s.n].conc,!!s.conc);
    assert.ok(effects[s.n].note.includes(s.text.match(/[^.!?]*condition[^.!?]*/)?.[0] || s.text));
  }
  for(const n of ['Blindness/Deafness','Sleep','Flesh to Stone','Dominate Person','Hypnotic Pattern']) assert.ok(skipped[n],n);
});
test('important expiry distinctions retain source, turn phase and event direction', () => {
  assert.equal(SPELL_EFFECTS['Hold Person'].repeat,'end');
  assert.deepEqual(SPELL_EFFECTS['Color Spray'].expires,{phase:'end',who:'source',next:true});
  assert.deepEqual(SPELL_EFFECTS.Sunbeam.expires,{phase:'start',who:'source',next:true});
  assert.deepEqual(SPELL_EFFECTS.Invisibility.endsOn,['attack','dealDamage','castSpell']);
  assert.deepEqual(SPELL_EFFECTS['Charm Person'].endsOn,['damageByCasterOrAlly']);
  assert.deepEqual(timing('The effect ends if the target takes damage.').endsOn,['damage']);
  assert.deepEqual(timing('The target repeats the save at the start of each of its turns.').repeat,'start');
});
test('monster overlay regenerates exactly and each condition timing is evidenced in its own note', () => {
  assert.deepEqual(buildMonsterPlay(parseDefenses),MONSTER_PLAY);
  let covered=0, manual=0;
  for(const m of SRD_MONSTERS) for(const a of MONSTER_PLAY[m.id].actions){
    if(a.conditionManual){ manual++; assert.equal(a.cond,undefined); }
    if(a.cond){ covered++; evidence(a,a.note); }
  }
  assert.ok(covered>5); assert.ok(manual>5);
  assert.deepEqual(MONSTER_PLAY['srd-adult-bronze-dragon'].actions.find(a=>a.cond).expires,{phase:'end',who:'target',next:true});
  assert.ok(MONSTER_PLAY['srd-behir'].actions.find(a=>a.n==='Constrict').conditionManual);
  assert.deepEqual(MONSTER_PLAY['srd-pseudodragon'].actions.find(a=>a.cond).endsOn,[]);
});
