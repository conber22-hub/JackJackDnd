import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SONGS } from '../src/data/chiptune.js';
import { noteFreq, parseVoice, events, duration, songs, validate } from '../src/engine/chiptune.js';
const near = (a, b, eps = 1e-10) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const required = ['boot', 'turnStart', 'turnOther', 'levelUp', 'victory', 'defeat', 'questNew', 'questDone', 'save', 'load', 'menuMove', 'menuOk', 'menuBack', 'heal', 'hit', 'crit', 'door', 'stairs', 'gazeRises', 'lowHealth'];
const sample = () => ({ id:'test', title:'Test', bpm:120, loop:false, voices:{ pulse1:{ wave:'square', duty:.25, vol:.5, notes:'C4/4' } } });
function freeze(v){ if (v && typeof v === 'object'){ Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
test('equal temperament, octaves, accidentals and written octave bounds', () => {
  assert.equal(noteFreq('A4'), 440); assert.equal(noteFreq('A5'), 880);
  near(noteFreq('C4'), 261.6255653005986); near(noteFreq('C#4'), 277.1826309768721);
  for (const [flat, sharp] of [['Db4','C#4'], ['Eb4','D#4'], ['Gb4','F#4'], ['Ab4','G#4'], ['Bb4','A#4'], ['Cb4','B3'], ['B#3','C4']]) assert.equal(noteFreq(flat), noteFreq(sharp));
  assert.ok(noteFreq('C0') > 0); assert.ok(noteFreq('B8') > noteFreq('C8'));
  for (const name of ['H4', 'C9', 'C-1', 'A', 'C##4', 'C4/4', '', null]) assert.throws(() => noteFreq(name), RangeError);
});
test('quarter, dotted eighth and triplet lengths at 120 bpm', () => {
  near(parseVoice('C4/4', { bpm:120 })[0].dur, .5);
  near(parseVoice('C4/8.', { bpm:120 })[0].dur, .375);
  near(parseVoice('C4/8t', { bpm:120 })[0].dur, 1/6);
  for (const n of [1, 2, 4, 8, 16, 32]){
    near(parseVoice(`A4/${n}`, { bpm:120 })[0].dur, 2/n);
    near(parseVoice(`A4/${n}.`, { bpm:120 })[0].dur, 3/n);
    near(parseVoice(`A4/${n}t`, { bpm:120 })[0].dur, 4/(3*n));
  }
});
test('rests leave gaps, whitespace is harmless, and parsing stays on the beat', () => {
  const notes = parseVoice(' r/4\n C4/8\t r/16 D4/16 r/2 ', { bpm:120 });
  assert.equal(notes.length, 2); near(notes[0].t, .5); near(notes[1].t, .875);
  near(notes[1].t + notes[1].dur, 1);
  const triplets = parseVoice(`${'C4/32t '.repeat(24)}D4/4`, { bpm:120 });
  near(triplets.at(-1).t, 1);
  assert.deepEqual(parseVoice('r/1', { bpm:120 }), []);
  assert.deepEqual(parseVoice('', { bpm:120 }), []);
});
test('drums carry no pitch, with quiet hats and louder heavy hits', () => {
  const [x, X, h] = parseVoice('x/16 X/8 h/32', { bpm:120 });
  assert.equal(x.drum, 'x'); assert.equal(X.drum, 'X'); assert.equal(h.drum, 'h');
  assert.ok(h.vol < x.vol && x.vol < X.vol); assert.ok(X.dur > x.dur);
  for (const e of [x, X, h]) assert.equal('freq' in e, false);
});
test('catalogue has every requested song, unique ids, valid voices and short stings', () => {
  assert.equal(new Set(SONGS.map(s => s.id)).size, SONGS.length);
  for (const id of required) assert.ok(SONGS.some(s => s.id === id), id);
  for (const s of SONGS){
    assert.deepEqual(validate(s), [], s.id); assert.ok(Object.keys(s.voices).length <= 4);
    assert.ok(duration(s.id) > 0); if (!s.loop) assert.ok(duration(s.id) < 3, s.id);
  }
  assert.ok(duration('boot') >= 1.5 && duration('boot') <= 2);
  assert.ok(duration('turnStart') < 1);
  for (const id of ['levelUp', 'victory', 'defeat']) assert.ok(duration(id) >= 2);
  near(duration('save'), .5); near(duration('questDone'), 2);
  assert.equal(events('turnOther').length, 2);
  for (const e of events('turnOther')) assert.ok(e.vol <= .08);
});
test('merged events sort by time with stable voice ordering and do not overlap within voices', () => {
  const order = ['pulse1', 'pulse2', 'tri', 'noise'];
  for (const s of SONGS){
    const ev = events(s.id);
    for (let i = 1; i < ev.length; i++){
      assert.ok(ev[i].t >= ev[i-1].t);
      if (ev[i].t === ev[i-1].t) assert.ok(order.indexOf(ev[i].voice) >= order.indexOf(ev[i-1].voice));
    }
    for (const v of order){
      const notes = ev.filter(e => e.voice === v);
      for (let i = 1; i < notes.length; i++) assert.ok(notes[i].t + 1e-12 >= notes[i-1].t + notes[i-1].dur, `${s.id}/${v}`);
    }
    for (const e of ev){
      assert.ok(Number.isFinite(e.t) && e.t >= 0); assert.ok(Number.isFinite(e.dur) && e.dur > 0);
      assert.ok(e.vol >= 0 && e.vol <= 1);
      assert.equal('drum' in e, e.wave === 'noise'); assert.equal('freq' in e, e.wave !== 'noise');
      assert.equal('duty' in e, e.wave === 'square');
      if (e.freq) assert.ok(Number.isFinite(e.freq) && e.freq > 0);
    }
  }
});
test('tempo scales every onset and duration; transposition leaves drums and gains alone', () => {
  for (const s of SONGS){
    const normal = events(s.id), fast = events(s.id, { tempo:2 }), up = events(s.id, { transpose:12 }), down = events(s.id, { transpose:-12 });
    near(duration(s.id, { tempo:2 }), duration(s.id) / 2);
    normal.forEach((e, i) => {
      near(fast[i].t, e.t/2); near(fast[i].dur, e.dur/2);
      assert.equal(fast[i].freq, e.freq); assert.equal(up[i].t, e.t); assert.equal(up[i].dur, e.dur);
      assert.equal(up[i].vol, e.vol);
      if ('freq' in e){ near(up[i].freq, 2 * e.freq); near(down[i].freq, e.freq/2); }
      else assert.deepEqual(up[i], e);
    });
  }
});
test('low health is a quiet, two-bar loop with a full ending and room for play', () => {
  const s = SONGS.find(s => s.id === 'lowHealth'); assert.equal(s.loop, true);
  near(duration(s.id), 8 * 60/s.bpm);
  for (const e of events(s.id)) assert.ok(e.vol <= .08);
  assert.equal(songs().find(s => s.id === 'lowHealth').loop, true);
});
test('validation reports bad tokens, lengths, voices, waves and incompatible drums', () => {
  for (const token of ['H4/4', 'C4/3', 'C9/4', 'C4/8.t', 'C4/4~', 'r', 'x/7']){
    const s = sample(); s.voices.pulse1.notes = token;
    assert.ok(validate(s).some(p => p.includes(token)), token);
    assert.throws(() => parseVoice(token, { bpm:120 }), SyntaxError);
  }
  const s = sample(); s.voices.extra = { wave:'sawtooth', vol:2, notes:'H4/3' };
  const errors = validate(s).join(' '); assert.match(errors, /Unknown voice/); assert.match(errors, /unknown wave/); assert.match(errors, /vol/); assert.match(errors, /H4\/3/);
  s.voices.pulse1.notes = 'x/4'; assert.match(validate(s).join(' '), /pitched note/);
  s.voices.noise = { wave:'noise', vol:.1, notes:'C4/4' }; assert.match(validate(s).join(' '), /drum note/);
  s.voices.tri = { wave:'square', vol:.1, duty:.25, notes:'E3/4' }; assert.match(validate(s).join(' '), /expected triangle/);
});
test('validation handles malformed data and public APIs reject invalid parameters', () => {
  for (const s of [null, [], {}, { ...sample(), voices:null }, { ...sample(), voices:{} }, { ...sample(), voices:{ noise:null } }]) assert.ok(validate(s).length);
  for (const bpm of [0, -1, NaN, Infinity, '120']){
    assert.throws(() => parseVoice('C4/4', { bpm }), RangeError); assert.ok(validate({ ...sample(), bpm }).length);
  }
  for (const duty of [0, 1, -.5, undefined]){ const s = sample(); s.voices.pulse1.duty = duty; assert.ok(validate(s).length); }
  assert.throws(() => parseVoice(null, { bpm:120 }), TypeError);
  assert.throws(() => events('missing'), RangeError); assert.throws(() => duration('missing'), RangeError);
  for (const tempo of [0, -1, NaN, Infinity, '2']) assert.throws(() => events('boot', { tempo }), RangeError);
  for (const transpose of [NaN, Infinity, '12', 1e10, -1e10]) assert.throws(() => events('boot', { transpose }), RangeError);
});
test('outputs are fresh JSON, inputs untouched, and the schedule is deterministic', () => {
  freeze(SONGS); const opts = freeze({ tempo:1.25, transpose:-3 });
  for (const s of SONGS) assert.deepEqual(events(s.id, opts), JSON.parse(JSON.stringify(events(s.id, opts))));
  const before = songs(), ev = events('boot'); ev[0].vol = 999; ev.pop();
  const list = songs(); list[0].title = 'changed'; assert.deepEqual(songs(), before);
  for (const s of before) near(s.duration, duration(s.id));
  assert.equal(events('boot')[0].vol, SONGS[0].voices.pulse1.vol);
});
