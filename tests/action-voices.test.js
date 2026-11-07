import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVoicePack, newActionVoiceState, planActionVoice, actionVoiceForPlayers } from '../src/engine/action-voices.js';
import { playActionVoice } from '../src/audio/action-voices.js';

const hero = { id: 'hidden-actor-1', kind: 'pc', publicName: 'Aven', name: 'DM-only name' };
const makeEvent = (id, trigger, fields = {}) => ({ id, trigger, actor: hero, shareable: true, ...fields });
const plan = (id, trigger, fields, pack) => planActionVoice(undefined, makeEvent(id, trigger, fields), { now: 0, pack });

test('exact custom action lines win over generic lines and named spell defaults', () => {
  const pack = { delivery: 'hush', secret: 'private', lines: [
    { trigger: 'spell', text: 'Stand back.' },
    { trigger: 'spell', action: '  FIRE BOLT  ', text: ' Here, {target}.\nCatch my {action}! ' },
    { trigger: 'nope', text: 'unused' },
  ] };
  const filtered = normalizeVoicePack(pack);
  assert.deepEqual(Object.keys(filtered).sort(), ['delivery', 'lines', 'muted']);
  assert.equal(filtered.lines.length, 2);
  const custom = plan('spell-1', 'spell', { action: 'Fire Bolt', targetPublicName: 'Shield Stand' }, filtered).cue;
  assert.equal(custom.text, 'Here, Shield Stand. Catch my Fire Bolt!');
  assert.equal(custom.delivery, 'hush');
  assert.equal(plan('spell-2', 'spell', { action: 'Magic Missile' }, pack).cue.text, 'Stand back.');
  assert.equal(plan('spell-3', 'spell', { action: 'Magic Missile' }).cue.text, 'There’s nowhere to duck.');
  assert.equal(plan('help', 'help', {}, { lines: [{ trigger: 'help', text: 'Take my hand, {target}.' }] }).cue.text, 'Take my hand, friend.');
});

test('role defaults cover teamwork and common combat beats while muted actors stay quiet', () => {
  for (const trigger of ['attack', 'critical', 'heal', 'help', 'guard', 'dodge', 'dash', 'down', 'rally', 'retreat', 'interact']) {
    assert.equal(plan(trigger, trigger).cue.kind, 'speech');
  }
  const watch = { id: 'watch', kind: 'folk', role: 'watch' };
  const mob = { id: 'gang', kind: 'mob' };
  assert.equal(plan('watch', 'retreat', { actor: watch }).cue.text, 'Fall back to the arch!');
  assert.equal(plan('mob', 'retreat', { actor: mob }).cue.text, 'Scatter!');
  assert.equal(plan('mute', 'attack', {}, { muted: true }).cue, null);
});

test('animals and wordless monsters use effects, and a mimic needs a deliberate reveal', () => {
  const talking = { lines: [{ trigger: 'attack', text: 'Secret speech' }] };
  const wolf = { id: 'wolf', kind: 'monster', bid: 'barovian-wolf', profile: 'hero' };
  const dog = { id: 'dog', kind: 'folk', role: 'dog', profile: 'mimic', revealed: false };
  assert.equal(plan('wolf', 'attack', { actor: wolf }, talking).cue.effect, 'wolf-growl');
  assert.equal(plan('horse', 'help', { actor: { id: 'pony', animal: 'horse' } }).cue.effect, 'horse-stamp');
  assert.equal(plan('raven', 'hurt', { actor: { id: 'bird', animal: 'raven' } }).cue.effect, 'raven-caw');
  assert.equal(plan('hollow', 'attack', { actor: { id: 'bones', kind: 'monster' } }).cue.effect, 'hollow-rattle');
  const bark = plan('bark', 'attack', { actor: dog }, talking);
  assert.equal(bark.cue.effect, 'dog-bark');
  assert.equal(plan('false-reveal', 'reveal', { actor: dog }).cue, null);
  const revealed = planActionVoice(bark.state, makeEvent('reveal', 'reveal', { actor: { ...dog, revealed: true } }), { now: 10 });
  assert.equal(revealed.cue.kind, 'speech');
  assert.match(revealed.cue.text, /dog|barking/);
  assert.equal(plan('now-spoken', 'attack', { actor: { ...dog, revealed: true } }, talking).cue.text, 'Secret speech');
});

test('same action is consumed once, chatter is paced, and consecutive variants differ', () => {
  const blank = Object.freeze({ events: Object.freeze([]), speakers: Object.freeze([]), lastAt: null });
  const first = planActionVoice(blank, makeEvent('strike-1', 'attack'), { now: 0 });
  assert.deepEqual(blank, newActionVoiceState());
  const secondActor = { ...hero, id: 'second' };
  const crowded = planActionVoice(first.state, makeEvent('strike-2', 'attack', { actor: secondActor }), { now: 100 });
  assert.equal(crowded.cue, null);
  assert.equal(planActionVoice(crowded.state, makeEvent('strike-2', 'attack', { actor: secondActor }), { now: 2000 }).state, crowded.state);
  const different = planActionVoice(crowded.state, makeEvent('strike-3', 'attack', { actor: secondActor }), { now: 2000 });
  assert.ok(different.cue);
  const tooSoon = planActionVoice(different.state, makeEvent('strike-4', 'attack'), { now: 4000 });
  assert.equal(tooSoon.cue, null);
  const again = planActionVoice(tooSoon.state, makeEvent('strike-5', 'attack'), { now: 6500 });
  assert.notEqual(again.cue.text, first.cue.text);
  assert.equal(planActionVoice(again.state, makeEvent('strike-1', 'attack'), { now: 13000 }).state, again.state);
});

test('player delivery needs approval and visibility and sends only public text or an effect', () => {
  const cue = plan('see', 'attack').cue;
  assert.equal(actionVoiceForPlayers(cue), null);
  assert.equal(actionVoiceForPlayers({ ...cue, shareable: false }, { sourceVisible: true }), null);
  const publicCue = actionVoiceForPlayers(cue, { sourceVisible: true });
  assert.deepEqual(Object.keys(publicCue).sort(), ['caption', 'delivery', 'kind', 'text']);
  assert.ok(!JSON.stringify(publicCue).includes('hidden-actor'));
  assert.ok(!publicCue.caption.includes('DM-only'));
  const sound = plan('howl', 'rally', { actor: { id: 'wolf', kind: 'animal', animal: 'wolf' } }).cue;
  assert.deepEqual(actionVoiceForPlayers(sound, { sourceVisible: true }), { kind: 'sound', caption: 'A rising howl.', effect: 'wolf-howl' });
});

test('device captions work without audio, and enabled speech respects volume and a busy synthesizer', () => {
  const cue = actionVoiceForPlayers(plan('speech', 'spell', { action: 'Magic Missile' }).cue, { sourceVisible: true });
  const captions = [], spoken = [];
  const synth = { speak: value => spoken.push(value) };
  class Utterance { constructor(text) { this.text = text; } }
  const options = { caption: value => captions.push(value), synth, Utterance, volume: 0.4 };
  assert.equal(playActionVoice(cue, options), 'caption');
  assert.equal(spoken.length, 0);
  assert.equal(playActionVoice(cue, { ...options, speech: true }), 'speech');
  assert.equal(spoken[0].volume, 0.4);
  assert.equal(spoken[0].text, cue.text);
  synth.pending = true;
  assert.equal(playActionVoice(cue, { ...options, speech: true }), 'caption');
  assert.equal(spoken.length, 1);
  assert.equal(captions.length, 3);
});

test('animal effects use an unlocked audio context, with no speech queue', () => {
  const cue = plan('bark', 'attack', { actor: { id: 'hound', animal: 'dog' } }).cue;
  const events = [], param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const context = { state: 'suspended', currentTime: 10, destination: {},
    createOscillator: () => ({ frequency: param, connect() {}, start: at => events.push(at), stop() {} }),
    createGain: () => ({ gain: param, connect() {} }) };
  const settings = { sounds: true, context, caption: () => {} };
  assert.equal(playActionVoice(cue, settings), 'caption');
  context.state = 'running';
  assert.equal(playActionVoice(cue, settings), 'sound');
  assert.equal(events.length, 2);
  assert.equal(playActionVoice(cue, settings), 'caption');
  context.currentTime = 11;
  assert.equal(playActionVoice(cue, { ...settings, sounds: false }), 'caption');
  assert.equal(events.length, 2);
});
