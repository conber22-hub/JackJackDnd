import test from 'node:test';
import assert from 'node:assert/strict';
import { SRD_WEAPONS } from '../src/data/srd-items.js';
import { HEFT, NATURAL, BY_TYPE } from '../src/data/weapon-heft.js';
import { hefted, heftFor, applyHeft } from '../src/engine/weapon-heft.js';

test('every SRD weapon and natural family has a complete bounded profile', () => {
  assert.deepEqual(hefted().sort(), SRD_WEAPONS.map(w => w.n).sort());
  for (const n of 'bite claw slam tail gore horn tentacle talon fist sting touch tusk wing hoof beak spit'.split(' ')) assert.ok(NATURAL[n], n);
  assert.deepEqual(Object.keys(BY_TYPE).sort(), ['bludgeoning','piercing','slashing']);
  for (const [n,h] of Object.entries({...HEFT,...NATURAL,...BY_TYPE})) {
    for (const [v,min,max] of [[h.stop,.6,1.8],[h.knock,.5,2],[h.shake,.5,2],[h.kick,.6,1.6],[h.lunge,.6,1.5],[h.arc.width,.4,2.2],[h.arc.life,.6,1.6]]) {
      assert.ok(Number.isFinite(v) && v >= min && v <= max, n);
    }
    assert.match(h.arc.col,/^#[0-9a-f]{6}$/);
    assert.ok(['slash','chop','smash','thrust','flick','claw','bite','none'].includes(h.swing),n);
    assert.ok(['steel','wood','bone','thud','wet',null].includes(h.ring),n);
    assert.ok(typeof h.words==='string' && h.words.trim() && h.words.length < 50,n);
  }
});
test('heavy melee lands harder than light blades at the same damage', () => {
  for (const heavy of ['Greataxe','Greatsword','Maul','Halberd','Glaive','Pike','Greatclub']) {
    for (const light of ['Dagger','Shortsword','Sickle','Scimitar']) {
      for (const k of ['stop','knock','arc']) {
        if (k==='arc') assert.ok(HEFT[heavy].arc.width > HEFT[light].arc.width);
        else assert.ok(HEFT[heavy][k] > HEFT[light][k]);
      }
    }
  }
});
test('shots and throws leave no ribbon, even if they have a melee counterpart', () => {
  for (const attack of [...SRD_WEAPONS.filter(w=>w.rng), {n:'Ancient Longbow'}, {n:'Hidden Dart'}, {n:'Spit'}, {n:'Tentacle',rng:30}]) {
    const h=heftFor(attack,{size:4});
    assert.equal(h.swing,'none',attack.n); assert.equal(h.arc.width,.4);
  }
  assert.equal(heftFor({n:'Dagger',rng:0}).swing,'thrust');
});
test('whole words select natural attacks, then type and neutral provide fallbacks', () => {
  assert.deepEqual(heftFor({n:'mAuL',t:'piercing'}),HEFT.Maul);
  for (const [n,k] of [['Bite','bite'],['Claws','claw'],['Tail Swipe','tail'],['Iron Hooves','hoof']]) {
    assert.deepEqual(heftFor({n,t:'slashing'}),NATURAL[k]);
  }
  assert.deepEqual(heftFor({n:'Frostbite',t:'piercing'}),BY_TYPE.piercing);
  for (const input of [null,{}, {n:'constructor',t:'__proto__'}]) {
    const h=heftFor(input); assert.deepEqual([h.stop,h.knock,h.shake,h.kick,h.lunge,h.arc.width,h.arc.life],[1,1,1,1,1,1,1]);
    assert.equal(h.swing,'slash');
  }
  const h=heftFor({n:'Club'}); h.arc.width=999; h.stop=0;
  assert.deepEqual(heftFor({n:'Club'}),HEFT.Club); assert.notEqual(HEFT.Club.arc.width,999);
});
test('size scales only natural weight and saturates at four squares', () => {
  for (const n of Object.keys(NATURAL)) {
    const medium=heftFor({n}), large=heftFor({n},{size:2}), giant=heftFor({n},{size:4});
    for (const [k,max] of [['stop',1.8],['knock',2],['shake',2]]) {
      assert.ok(large[k]>medium[k]); assert.ok(giant[k]>=large[k] && giant[k]<=max && giant[k]<=medium[k]*1.6);
    }
    if (medium.swing!=='none') assert.ok(giant.arc.width>medium.arc.width && giant.arc.width<=2.2);
    assert.deepEqual(heftFor({n},{size:9}),giant);
  }
  assert.deepEqual(heftFor({n:'Maul'},{size:4}),HEFT.Maul);
});
test('impact scales four channels, keeps timing and flags, and preserves misses', () => {
  const i=Object.freeze({stop:80,knock:.2,shake:.3,kick:4,back:false,screen:'kill',slowMs:1150,slowScale:.18,last:true,flash:100});
  const h=HEFT.Maul;
  assert.deepEqual(applyHeft(i,h),{...i,stop:80*h.stop,knock:.2*h.knock,shake:.3*h.shake,kick:4*h.kick});
  assert.deepEqual(applyHeft({...i,stop:250,knock:.6,shake:.9,kick:13},h),{...i,stop:260,knock:.7,shake:1,kick:14});
  const miss={...i,stop:0,knock:0,shake:0,kick:0}; assert.deepEqual(applyHeft(miss,h),miss);
});
