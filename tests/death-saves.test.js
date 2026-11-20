import test from 'node:test';
import assert from 'node:assert/strict';
import {DEATH_WORDS} from '../src/data/death-saves.js';
import {startDying,deathSave,hurtWhileDown,healWhileDown,stabilize,dyingMarks,isDying,wordsFor} from '../src/engine/death-saves.js';
const start=Object.freeze({s:0,f:0,dead:false,stable:false});
test('massive damage uses overflow on the first hit and full damage at zero',()=>{
  assert.equal(startDying({hpBefore:3,damage:13,maxHp:10}).outcome,'dead');
  assert.deepEqual(startDying({hpBefore:3,damage:12,maxHp:10}).dying,start);
  assert.equal(hurtWhileDown(start,{damage:10,maxHp:10}).outcome,'dead');
});
test('DC, bonuses, natural rolls and advantage use the selected die',()=>{
  for(const [die,opt,out] of [[9,{},'failure'],[10,{},'success'],[9,{bonus:1},'success'],[[1,20],{advantage:true},'rise']]){
    assert.equal(deathSave(start,die,opt).outcome,out);
  }
  const bad=deathSave(start,[20,1],{advantage:false,bonus:20});
  assert.equal(bad.rolled,1);assert.equal(bad.dying.f,2);
  assert.equal(deathSave(start,20).dying,null);
});
test('three marks end rolls; treatment, stable injuries and terminal death',()=>{
  const stable=deathSave({...start,s:2},10).dying;
  assert.deepEqual(stable,{...start,stable:true});
  const dead=deathSave({...start,f:2},1).dying;
  assert.equal(dead.dead,true); assert.equal(dead.f,3);
  for(const d of [stable,dead]) assert.deepEqual(deathSave(d,20).dying,d);
  assert.equal(healWhileDown(dead,5).outcome,'none');
  assert.equal(healWhileDown(stable,1).outcome,'rise');
  assert.deepEqual(hurtWhileDown(stable,{damage:1}).dying,{...start,f:1});
  assert.equal(hurtWhileDown(start,{damage:1,crit:true}).dying.f,2);
  assert.equal(stabilize(start,{total:9}).outcome,'failed');
  assert.equal(stabilize(start,{total:10}).outcome,'stable');
  assert.equal(stabilize(start,{auto:true}).outcome,'stable');
  assert.deepEqual(dyingMarks({...start,s:1,f:2}),{s:[true,false,false],f:[true,true,false],stable:false,dead:false});
  for(const v of [null,undefined,{}]) for(const fn of [startDying,deathSave,hurtWhileDown,healWhileDown,stabilize,dyingMarks,isDying,wordsFor]) assert.doesNotThrow(()=>fn(v,v,v));
});
test('each outcome has four original deterministic captions',()=>{
  const lines=Object.values(DEATH_WORDS).flat();assert.equal(new Set(lines).size,lines.length);
  for(const key of 'down success failure two rise stable dead hurt failed'.split(' ')){
    assert.ok(DEATH_WORDS[key].length>=4);
    for(const line of DEATH_WORDS[key]) assert.ok(line.length<70 && line.split('{name}').length<=2);
    assert.equal(wordsFor(key,-1),DEATH_WORDS[key].at(-1));
  }
});
