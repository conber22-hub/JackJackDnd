import test from 'node:test';
import assert from 'node:assert/strict';
import { CALLING_VOICES, SEEP_VOICES } from '../src/data/calling-voices.js';
import { CALLINGS } from '../src/data/callings.js';
import { VOICE_TRIGGERS } from '../src/data/action-voices.js';
import { callingLines, voiceOf, validateCallingVoices } from '../src/engine/calling-voices.js';

const seepTriggers = ['hurt', 'down', 'critical', 'rally'];
const sortedKeys = value => Object.keys(value).sort();

function checkBank(bank, triggers, min, max, label, seen) {
  assert.deepEqual(sortedKeys(bank), [...triggers].sort(), label);
  for (const [trigger, lines] of Object.entries(bank)) {
    const location = `${label}/${trigger}`;
    assert.ok(Array.isArray(lines) && lines.length >= min && lines.length <= max, location);
    for (const line of lines) {
      assert.equal(typeof line, 'string', location);
      assert.ok(line.trim() && line.length < 60, `${location}: ${line}`);
      assert.doesNotMatch(line.replaceAll('{target}', ''), /[{}]/, location);
      assert.ok(!seen.has(line), `${location}: repeated line "${line}"`);
      seen.add(line);
    }
  }
}

test('every Calling and Seep-touched Path has unique, short lines for its triggers', () => {
  assert.equal(Object.keys(CALLING_VOICES).length, 12);
  assert.deepEqual(sortedKeys(CALLING_VOICES), sortedKeys(CALLINGS));

  const seepKeys = [];
  for (const { id, paths } of Object.values(CALLINGS)) {
    const seen = new Set();
    checkBank(CALLING_VOICES[id], VOICE_TRIGGERS, 2, 4, id, seen);
    for (const path of paths.filter(path => path.seep === true)) {
      const key = `${id}/${path.id}`;
      seepKeys.push(key);
      assert.ok(Object.hasOwn(SEEP_VOICES, key), key);
      checkBank(SEEP_VOICES[key], seepTriggers, 1, 2, key, seen);
    }
  }
  assert.deepEqual(sortedKeys(SEEP_VOICES), seepKeys.sort());
  assert.deepEqual(validateCallingVoices(), []);
});

test('the voice data uses original vocabulary', () => {
  const forbidden = /\b(master chief|covenant|cortana|spartan|sangheili|unggoy|jiralhanae|gravemind|forerunner|unsc|odst|warthog|pelican|needler|halo|flood|arbiter|guilty spark|mjolnir)\b/i;
  assert.doesNotMatch(JSON.stringify([CALLING_VOICES, SEEP_VOICES]), forbidden);
});

test('lookups append only the chosen Path’s lines and return independent arrays', () => {
  const base = CALLING_VOICES.vanguard;
  const seep = SEEP_VOICES['vanguard/hollowed'];
  for (const [trigger, lines] of Object.entries(seep)) {
    assert.deepEqual(callingLines('vanguard', trigger, 'hollowed'), [...base[trigger], ...lines]);
  }
  assert.deepEqual(callingLines('vanguard', 'hurt'), base.hurt);
  assert.deepEqual(callingLines('vanguard', 'hurt', 'hoplite'), base.hurt);
  assert.deepEqual(callingLines('vanguard', 'attack', 'hollowed'), base.attack);
  assert.deepEqual(callingLines('huscarl', 'hurt', 'hollowed'), CALLING_VOICES.huscarl.hurt);

  const voice = voiceOf('vanguard');
  assert.deepEqual(voice, { id: 'vanguard', lines: base });
  voice.lines.hurt.pop();
  callingLines('vanguard', 'hurt', 'hollowed').pop();
  assert.deepEqual(voiceOf('vanguard').lines.hurt, base.hurt);
  assert.deepEqual(callingLines('vanguard', 'hurt', 'hollowed'), [...base.hurt, ...seep.hurt]);
});

test('unknown and malformed selections fall back safely', () => {
  for (const value of [null, {}, undefined, 'unknown', 'constructor', '__proto__']) {
    assert.equal(voiceOf(value), null);
    assert.deepEqual(callingLines(value, 'hurt'), []);
    assert.deepEqual(callingLines('vanguard', value, 'hollowed'), []);
    assert.deepEqual(callingLines('vanguard', 'hurt', value), CALLING_VOICES.vanguard.hurt);
  }
});
