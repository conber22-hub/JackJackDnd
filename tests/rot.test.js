import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/util/core.js';
import { CONDITIONS } from '../src/engine/defenses.js';
import { ROT_CURES, CHORUS_WHISPERS } from '../src/data/rot.js';
import { rotStage, rotSigns, chorusWhisper, cureRot, taken } from '../src/engine/rot.js';

test('rot stages are ordered, reachable and give playable rules', () => {
  const thresholds = [0, 3, 8, 16, 30];
  for (const [i, n] of thresholds.entries()){
    const stage = rotStage(n);
    assert.equal(stage.stage, i);
    assert.equal(stage.n, n);
    if (i) assert.equal(rotStage(n - 1).stage, i - 1);
    for (const rule of stage.mechanics){
      assert.ok(['condition', 'advantage', 'disadvantage'].includes(rule.kind));
      if (rule.condition) assert.ok(CONDITIONS.includes(rule.condition));
    }
  }
  assert.equal(rotStage(300).name, 'Taken');
});

test('all observers see different signs and the Count sees the most', () => {
  for (const marks of [0, 3, 8, 16, 30]){
    const signs = ['villager', 'priest', 'seep', 'count'].map(observer => rotSigns(marks, { observer }));
    assert.equal(new Set(signs).size, 4);
    assert.ok(signs.slice(0, 3).every(sign => sign.length < signs[3].length));
    assert.match(signs[3], new RegExp(`count ${marks} marks`));
  }
});

test('the Chorus offers one-mark bargains in the middle stages', () => {
  const triggers = ['rest', 'down', 'kill', 'alone'];
  assert.ok(new Set(Object.values(CHORUS_WHISPERS).flat()).size >= 24);
  for (const trigger of triggers){
    const options = { trigger, gaze:10, rng:() => 0 };
    assert.equal(chorusWhisper(7, options), null);
    assert.equal(chorusWhisper(30, options), null);
    for (const marks of [8, 16]){
      assert.deepEqual(chorusWhisper(marks, options).offer.cost, { what:'mark', n:1 });
      const dice = [0, 0, .99];
      assert.equal(chorusWhisper(marks, { ...options, rng:() => dice.shift() }).offer, null);
    }
    assert.equal(chorusWhisper(8, { ...options, rng:() => .99 }), null);
  }
});

test('each cure is limited and Taken cannot be cured', () => {
  for (const [kind, remove] of Object.entries({ holyPlace:1, holyWater:1, chaplain:2, dutchOven:1, andral:4 })){
    assert.ok(ROT_CURES[kind].limit);
    assert.equal(cureRot(10, { kind }).marks, 10 - remove);
    assert.equal(cureRot(1, { kind }).marks, 0);
    assert.equal(cureRot(10, { kind, used:true }).marks, 10);
    assert.equal(cureRot(30, { kind }).marks, 30);
  }
  assert.equal(cureRot(10, { kind:'holyPlace', clean:false }).marks, 10);
  assert.equal(cureRot(10, { kind:'chaplain', calling:'vanguard' }).marks, 10);
  assert.equal(cureRot(10, { kind:'chaplain', calling:'chaplain' }).marks, 8);
  assert.match(cureRot(10, { kind:'dutchOven' }).text, /never got Dutcher/);
});

test('taken leaves the DM several living outcomes', () => {
  assert.equal(taken({ seepMarks:29 }), null);
  const decision = taken({ seepMarks:30, hp:12 });
  assert.match(decision.text, /still alive.*DM chooses/);
  assert.equal(decision.outcomes.length, 3);
});

test('rot results are deterministic, JSON-safe and tolerate missing data', () => {
  const run = seed => {
    const rng = mulberry32(seed);
    return Array.from({ length:20 }, () => chorusWhisper(16, { trigger:'rest', gaze:7, rng }));
  };
  assert.deepEqual(run(11), run(11));
  for (const input of [null, {}, undefined]){
    const results = [rotStage(input), rotSigns(input, input), chorusWhisper(input, input), cureRot(input, input), taken(input)];
    assert.deepEqual(JSON.parse(JSON.stringify(results)), results);
  }
});
