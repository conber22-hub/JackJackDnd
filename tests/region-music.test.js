import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOOPS } from '../src/data/region-music.js';
import { SONGS } from '../src/data/chiptune.js';
import { validate, events, duration, parseVoice } from '../src/engine/chiptune.js';
import { regionLoop, handover, loopLength, variantFor } from '../src/engine/region-music.js';
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
test('regional scores include all fourteen required themes and fit quiet eight-bar loops', () => {
  const ids = 'village villageNight vallaki krezk road roadNight woods church tavern house crypt vistani mists castle'.split(' ');
  for (const id of ids) assert.ok(LOOPS.some(s => s.id === id));
  assert.equal(new Set(LOOPS.map(s => s.id)).size, LOOPS.length);
  assert.equal(new Set(LOOPS.map(s => s.title)).size, LOOPS.length);
  for (const s of LOOPS){
    assert.deepEqual(validate(s), []); assert.equal(s.loop,true); assert.ok(Object.keys(s.voices).length<=4);
    const length = loopLength(s.id); assert.ok(length>=20 && length<=60); near(length, s.bars*s.beatsPerBar*60/s.bpm);
    for (const v of Object.values(s.voices)){
      assert.ok(v.vol>=.15 && v.vol<=.35);
      // Append a probe note: its start includes trailing rests and proves each voice spans full bars.
      const probe = parseVoice(v.notes + (v.wave==='noise' ? ' x/4' : ' C4/4'), { bpm:s.bpm }).at(-1);
      near(probe.t,length);
    }
    const ev=events(s); for (const e of ev) assert.ok(e.t+e.dur<=length+1e-9);
    for (const voice of Object.keys(s.voices)){
      const notes=ev.filter(e=>e.voice===voice);
      for(let i=1;i<notes.length;i++) assert.ok(notes[i].t+1e-9>=notes[i-1].t+notes[i-1].dur);
    }
  }
});
test('song objects extend the API without changing any jingle', () => {
  for(const s of SONGS){ assert.deepEqual(events(s),events(s.id)); near(duration(s),duration(s.id)); assert.deepEqual(validate(s.id),[]); }
  assert.ok(validate('missing').length); assert.throws(()=>events({id:'broken'}));
  for(const s of LOOPS){ near(duration(s,{tempo:2}),duration(s)/2); const a=events(s),b=events(s,{transpose:12}); a.forEach((e,i)=>e.freq ? near(b[i].freq,e.freq*2) : assert.deepEqual(b[i],e)); }
});
test('location priority follows rooms, battle, time and terrain', () => {
  assert.equal(regionLoop({fight:true,place:'castle',inside:'cellar'}),null);
  assert.equal(regionLoop({kind:'road',hour:23}),'roadNight');
  assert.equal(regionLoop({place:'tser'}),'vistani');
  assert.equal(regionLoop({place:'vallaki',inside:'cellar'}),'crypt');
  assert.equal(regionLoop({room:{name:'Wine cellar'}}),'crypt');
  assert.equal(regionLoop({place:'castle',kind:'road'}),'castle');
  assert.equal(regionLoop({kind:'road',mist:true}),'mists');
  assert.equal(regionLoop({place:'vallaki',inside:'tavern'}),'tavern');
  assert.equal(regionLoop({place:'krezk',inside:'church'}),'church');
  assert.equal(regionLoop({inside:'cottage'}),'house');
  for(const hour of [0,5,20,23]) assert.equal(regionLoop({kind:'village',hour}),'villageNight');
  for(const hour of [6,19]) assert.equal(regionLoop({kind:'road',hour}),'road');
  for(const place of 'mists gates village crossroads castle coffin tser bonegrinder vallaki lake argyn berez winery krezk yester tower'.split(' ')) for(const hour of [12,23]) assert.ok(LOOPS.some(s=>s.id===regionLoop({place,hour})),place);
});
test('handover includes silence and asymmetric church transitions', () => {
  const ids=[null,...LOOPS.map(s=>s.id)];
  for(const a of ids) for(const b of ids){ const h=handover(a,b); if(a===b) assert.equal(h,null); else {assert.ok(h.out>0 && h.in>0 && h.gap>=0);assert.deepEqual(h,handover(a,b));} }
  assert.equal(handover('road','roadNight').gap,0); assert.ok(handover('road','church').gap>0);
  assert.throws(()=>handover('bad','road'),RangeError); assert.throws(()=>loopLength('bad'),RangeError);
});
test('gaze is bounded, deterministic, and does not mutate scores or options', () => {
  const saved=JSON.stringify(LOOPS);
  for(const s of LOOPS){
    assert.deepEqual(variantFor(s.id,{gaze:1}),{tempo:1,transpose:0});
    let last=1;
    for(const gaze of [-5,1,2,4.5,7,10,20]){ const v=variantFor(s.id,{gaze}); assert.ok(v.tempo>=.85&&v.tempo<=last); assert.ok(v.transpose>=-3&&v.transpose<=0); last=v.tempo; }
    const opts=Object.freeze({gaze:9}); assert.deepEqual(variantFor(s.id,opts),variantFor(s.id,opts));
  }
  assert.equal(JSON.stringify(LOOPS),saved);
  assert.equal(regionLoop({}),regionLoop({}));
});
test('lake and mill have their own identities without overriding indoor scenes or combat',()=>{
  for(const hour of [3,12,23]){
    assert.equal(regionLoop({place:'lake',hour}),'lake');
    assert.equal(regionLoop({place:'bonegrinder',hour}),'windmill');
    assert.equal(regionLoop({place:'lake',inside:'house',hour}),'house');
    assert.equal(regionLoop({place:'bonegrinder',inside:'cellar',hour}),'crypt');
  }
  assert.equal(regionLoop({inside:'mill'}),'windmill');
  assert.equal(regionLoop({place:'lake',fight:true}),null);
  assert.equal(regionLoop({place:'vallaki',kind:'camp'}),'vallaki');
  assert.equal(regionLoop({place:'argyn',kind:'woods'}),'castle');
  for(const s of LOOPS){const opts=variantFor(s.id,{gaze:10});near(duration(s,opts),loopLength(s.id)/opts.tempo);}
});
test('two consecutive cycles meet at the bar boundary without overlapping notes',()=>{
  for(const s of LOOPS) for(const gaze of [1,5,10]){
    const opts=variantFor(s.id,{gaze}),length=duration(s,opts),ev=events(s,opts);
    for(const voice of Object.keys(s.voices)){
      const notes=ev.filter(e=>e.voice===voice);if(!notes.length)continue;
      assert.ok(notes.at(-1).t+notes.at(-1).dur<=length+notes[0].t+1e-9);
    }
    near(length*s.bpm*opts.tempo/60,32);
  }
});
