import test from 'node:test';
import assert from 'node:assert/strict';
import { implied, attackMods, saveMods, checkMods, speedOf, canAct, damageMods, exhaustionDead } from '../src/engine/conditions.js';
const c = n => ({name:'Ada',conds:n ? [{n}] : []});
const attack = (a, t, opts = {}) => attackMods({attacker:c(a),target:c(t),within5:true,melee:true,...opts});
test('every glossary condition: attack, save, check, speed and action table', () => {
  // condition, attacker dis, target adv, autoFail Dex, check dis, speed, actions
  const rows = [
    ['blinded',true,true,false,false,30,true],['charmed',false,false,false,false,30,true],
    ['deafened',false,false,false,false,30,true],['exhaustion',false,false,false,false,30,true],
    ['frightened',true,false,false,true,30,true],['grappled',false,false,false,false,0,true],
    ['incapacitated',false,false,false,false,30,false],['invisible',false,false,false,false,30,true],
    ['paralyzed',false,true,true,false,0,false],['petrified',false,true,true,false,0,false],
    ['poisoned',true,false,false,true,30,true],['prone',true,true,false,false,30,true],
    ['restrained',true,true,false,false,0,true],['stunned',false,true,true,false,30,false],
    ['unconscious',true,true,true,false,0,false],
  ];
  for (const [n,dis,adv,fail,check,speed,act] of rows){
    assert.equal(!!attack(n).dis.length,dis,n);
    assert.equal(!!attack(null,n).adv.length,adv,n);
    assert.equal(saveMods(c(n),'Dexterity').autoFail,fail,n);
    assert.equal(!!checkMods(c(n)).dis.length,check,n);
    assert.equal(speedOf(c(n),30),speed,n);
    assert.deepEqual(canAct(c(n)),{actions:act,bonus:act,reactions:act,move:speed !== 0,speak:act},n);
    assert.equal(saveMods(c(n),'wis').autoFail,false,n);
  }
});
test('implications, senses, restrained saves and stone defences', () => {
  assert.deepEqual([...implied([{n:'unconscious'}])],['unconscious','incapacitated','prone']);
  for (const n of ['paralyzed','stunned','petrified']) assert.ok(implied([{n}]).has('incapacitated'));
  assert.equal(checkMods(c('blinded'),{sight:true}).autoFail,true);
  assert.equal(checkMods(c('deafened'),{hearing:true}).autoFail,true);
  assert.equal(checkMods(c('deafened'),{sight:true}).autoFail,false);
  assert.equal(saveMods(c('restrained'),'dex').dis.length,1);
  assert.equal(saveMods(c('restrained'),'str').dis.length,0);
  assert.equal(damageMods(c('petrified')).resist.length,13);
  assert.deepEqual(damageMods(c('petrified')).condImmune,['poisoned']);
  assert.deepEqual(damageMods(c('petrified')).immune,[]);
});
test('visibility overrides invisible when special senses can see it; independent unseen reasons', () => {
  assert.equal(attack('invisible',null,{attackerSeen:false}).adv.length,1);
  assert.equal(attack('invisible',null,{attackerSeen:true}).adv.length,0);
  assert.equal(attack(null,'invisible',{targetSeen:false}).dis.length,1);
  assert.equal(attack(null,'invisible',{targetSeen:true}).dis.length,0);
  const both = attack(null,null,{attackerSeen:false,targetSeen:false});
  assert.equal(both.adv.length,1); assert.equal(both.dis.length,1);
});
test('distance, not attack kind, determines prone advantage and automatic critical hits', () => {
  for (const n of ['paralyzed','unconscious']) for (const melee of [true,false]){
    assert.equal(attack(null,n,{melee,within5:true}).autoCrit,true);
    assert.equal(attack(null,n,{melee,within5:false}).autoCrit,false);
  }
  assert.equal(attack(null,'stunned').autoCrit,false);
  assert.equal(attack(null,'prone',{melee:false}).adv.length,1);
  assert.equal(attack(null,'prone',{within5:false}).dis.length,1);
});
test('source-dependent fear and grapple', () => {
  assert.equal(attack('frightened',null,{attackerSeesSource:false}).dis.length,0);
  assert.equal(checkMods(c('frightened'),{sourceSeen:false}).dis.length,0);
  const attacker = {conds:[{n:'grappled',src:'g'}]};
  assert.equal(attackMods({attacker,target:{id:'g'}}).dis.length,0);
  assert.equal(attackMods({attacker,target:{id:'x'}}).dis.length,1);
});
test('exhaustion 0–6 changes every d20 test and speed, never grants disadvantage', () => {
  for (let exhaustion = 0; exhaustion <= 6; exhaustion++){
    const creature = {exhaustion};
    for (const mods of [attackMods({attacker:creature,target:{}}),saveMods(creature,'con'),checkMods(creature)]){
      assert.equal(mods.penalty,2*exhaustion); assert.deepEqual(mods.dis,[]);
    }
    assert.equal(speedOf(creature,30),30-5*exhaustion);
    assert.equal(exhaustionDead(creature),exhaustion===6);
  }
  assert.equal(speedOf({exhaustion:5},10),0);
});
