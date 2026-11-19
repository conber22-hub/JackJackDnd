import test from 'node:test';
import assert from 'node:assert/strict';
import { FIGHT_LOOPS, STINGS } from '../src/data/battle-music.js';
import { validate, duration, events } from '../src/engine/chiptune.js';
import { tension, battleLoop, shouldChange, fightLoops } from '../src/engine/battle-music.js';

test('six distinct leads, eight complete bars and a sounding seam', () => {
  assert.deepEqual(fightLoops().sort(), ['clash','court','lastStand','peril','seep','skirmish']);
  assert.equal(new Set(FIGHT_LOOPS.map(s=>s.voices.pulse1.notes)).size,6);
  for (const song of FIGHT_LOOPS) {
    assert.deepEqual(validate(song),[]);
    assert.equal(song.loop,true);
    assert.equal(song.bars,8);
    assert.equal(song.beatsPerBar,4);
    const end = 32*60/song.bpm;
    const notes = events(song);
    assert.ok(notes.some(n=>n.freq && n.t===0),song.id);
    assert.ok(notes.some(n=>n.freq && Math.abs(n.t+n.dur-end)<1e-8),song.id);
    assert.ok(Math.abs(duration(song)-end)<1e-8,song.id);
    for (const voice of Object.values(song.voices)) {
      const beats = voice.notes.split(/\s+/).reduce((sum,token)=>{
        const length=token.split('/')[1];
        return sum + 4/parseInt(length,10)*(length.endsWith('.')?1.5:1);
      },0);
      assert.equal(beats,32,song.id);
    }
  }
});
test('both endings resolve within four seconds', () => {
  assert.deepEqual(STINGS.map(s=>s.id).sort(),['fell','won']);
  for (const sting of STINGS) {
    assert.deepEqual(validate(sting),[]);
    assert.equal(sting.loop,false);
    assert.ok(duration(sting)>0 && duration(sting)<4);
  }
});
const hero = (hp=20) => ({hp,maxHp:20});
const foe = (cr=1) => ({hp:20,maxHp:20,cr});
test('living opposition, casualties, wounds and rounds move tension', () => {
  const heroes=[hero(),hero()], foes=[foe('1/2'),foe()];
  const score=tension({heroes,foes});
  assert.ok(tension({heroes:[hero(10),hero()],foes})>score);
  assert.ok(tension({heroes:[{...hero(),down:true},hero()],foes})>score);
  assert.ok(tension({heroes,foes,round:4})>score);
  assert.ok(tension({heroes,foes:[foe(4),foe()]})>score);
  assert.ok(tension({heroes,foes:[foe(.5),{...foe(),hp:0}]})<score);
  assert.equal(score,tension({heroes,foes:[foe(.5),foe()]}));
  for (const f of [null,{}, {heroes:[null],foes:[{}]}, {heroes:[hero(0)],foes:[foe(1e6)],round:100}]) {
    assert.ok(tension(f)>=0 && tension(f)<=1);
    assert.ok(battleLoop(f).tempo>=.9 && battleLoop(f).tempo<=1.25);
  }
});
test('living court outranks Seep and both outrank a last stand', () => {
  const heroes=[hero(),hero(0)], court={...foe(),court:true}, seep={...foe(),tags:['seep']};
  assert.equal(battleLoop({heroes,foes:[seep,court]}).id,'court');
  assert.equal(battleLoop({heroes,foes:[seep,{...court,hp:0}]}).id,'seep');
  assert.equal(battleLoop({heroes,foes:[]}).id,'lastStand');
  assert.equal(battleLoop({heroes:[hero(4)]}).id,'lastStand');
  assert.equal(battleLoop({heroes:[hero(5)]}).id,'skirmish');
});
test('ordinary fights escalate through three scores and tempo rises within a score', () => {
  const heroes=[hero(),hero()], foes=[foe(12)];
  assert.equal(battleLoop({heroes,foes:[foe(.25)]}).id,'skirmish');
  const early=battleLoop({heroes,foes}), late=battleLoop({heroes,foes,round:3});
  assert.equal(early.id,'clash'); assert.equal(late.id,early.id);
  assert.ok(late.tempo>early.tempo);
  assert.equal(battleLoop({heroes:[hero(2),hero(2)],foes,round:9}).id,'peril');
});
test('four bars between changes except on entering last stand', () => {
  assert.equal(shouldChange('clash','court',{barsPlayed:3.99}),false);
  assert.equal(shouldChange('clash','court',{barsPlayed:4}),true);
  assert.equal(shouldChange('court','lastStand',{barsPlayed:0}),true);
  assert.equal(shouldChange('lastStand','lastStand',{barsPlayed:8}),false);
  assert.equal(shouldChange('lastStand','clash',{barsPlayed:1}),false);
});
