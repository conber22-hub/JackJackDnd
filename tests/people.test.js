import test from 'node:test';
import assert from 'node:assert/strict';
import { person, village, introduce, askAbout, forPlayers } from '../src/engine/people.js';
import {
  FIRST_NAMES, FAMILY_NAMES, VISTANI_NAMES, NICKNAMES, ROLES, TRAITS,
  VOICES, WANTS, FEARS, COUNT_FEAR_START, SECRETS, RELATIONS,
} from '../src/data/people.js';

const options = { role: 'smith', seed: 'winter', place: 'Vallaki' };
const roles = Object.keys(ROLES);
const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function unique(list, min) {
  assert.ok(list.length >= min, `Expected ${min} entries, got ${list.length}`);
  assert.equal(new Set(list.map(v => typeof v === 'string' ? v.toLowerCase() : JSON.stringify(v))).size, list.length);
}

test('people data has all required original pools without duplicate entries', () => {
  for (const list of Object.values(FIRST_NAMES)) unique(list, 1);
  unique(Object.values(FIRST_NAMES).flat(), 60);
  for (const [list, min] of [[FAMILY_NAMES, 40], [VISTANI_NAMES, 20], [NICKNAMES, 20],
    [TRAITS, 40], [VOICES, 25], [WANTS, 30], [FEARS, 30], [SECRETS, 30]]) unique(list, min);
  for (const key of ['id', 'subject', 'text', 'slip']) unique(SECRETS.map(s => s[key]), 30);
  for (const name of VISTANI_NAMES) assert.ok(!Object.values(FIRST_NAMES).flat().includes(name));
  assert.deepEqual(Object.keys(RELATIONS).sort(), ['loves', 'owes', 'hates', 'fears', 'serves', 'hides from', 'is kin to', 'informs on'].sort());
  for (const relation of Object.values(RELATIONS)) {
    assert.ok(relation.reply);
    for (const line of relation.lines) assert.ok(line.includes('{a}') && line.includes('{b}'));
  }
  for (const role of ['smith', 'priest', 'innkeeper', 'widow', 'drunk', 'trader', 'watchman', 'farmer',
    'child', 'beggar', 'vistana', "burgomaster's man", 'gravedigger', 'herbwife', 'miller',
    'watch', 'peddler', 'traveller', 'lostChild', 'hermit', 'captive', 'elder', 'pilgrim']) assert.ok(ROLES[role]);
  for (const spec of Object.values(ROLES)) {
    for (const i of spec.wants) assert.ok(WANTS[i]);
    for (const i of spec.fears) assert.ok(FEARS[i]);
    assert.ok(spec.found.length && spec.knows.length && spec.day && spec.night && spec.greeting);
    assert.ok(spec.knows.every(k => ['haunt', 'weakness', 'lure', 'kill', 'report'].includes(k)));
  }
});

for (const role of roles) test(`person: ${role}, 20 seeds, complete and deterministic`, () => {
  for (let i = 0; i < 20; i++) {
    const args = freeze({ ...options, role, seed: `seed-${i}` });
    const p = person(args);
    assert.deepEqual(p, person(args));
    assert.deepEqual(p, clone(p));
    for (const field of ['id', 'name', 'nick', 'role', 'voice', 'wants', 'fears', 'secret', 'mood', 'hook', 'secretSubject', 'secretSlip']) {
      assert.equal(typeof p[field], 'string'); assert.ok(p[field].trim(), field);
    }
    const [first, family] = p.name.split(' ');
    assert.ok((role === 'vistana' ? VISTANI_NAMES : Object.values(FIRST_NAMES).flat()).includes(first));
    assert.ok(FAMILY_NAMES.includes(family));
    assert.ok(NICKNAMES.some(n => n.replace('{first}', first) === p.nick));
    assert.equal(p.role, role);
    assert.ok(Number.isInteger(p.age) && p.age >= ROLES[role].age[0] && p.age <= ROLES[role].age[1]);
    assert.equal(p.look.length, 2); assert.notEqual(p.look[0], p.look[1]);
    assert.ok(p.look.every(t => TRAITS.includes(t)) && VOICES.includes(p.voice));
    assert.ok(WANTS.includes(p.wants) && FEARS.includes(p.fears));
    assert.ok(SECRETS.some(s => s.text === p.secret && s.subject === p.secretSubject && s.slip === p.secretSlip));
    assert.deepEqual(p.knows, ROLES[role].knows);
    assert.ok(['easy', 'wary', 'afraid'].includes(p.mood));
    assert.ok(p.hook.includes(p.name) && p.hook.includes(p.wants));
  }
});

test('gaze preserves identity, never improves mood, increases Count fears and secrets', () => {
  let lowFears = 0, highFears = 0, lowSecrets = 0, highSecrets = 0;
  const rank = { easy: 0, wary: 1, afraid: 2 };
  for (let i = 0; i < 400; i++) {
    const args = { ...options, seed: `gaze-${i}` }, low = person({ ...args, gaze: 0 }), high = person({ ...args, gaze: 9 });
    for (const key of ['id', 'name', 'nick', 'role', 'age', 'look', 'voice', 'wants']) assert.deepEqual(low[key], high[key]);
    let previous = -1;
    for (let g = 0; g <= 10; g++) {
      const next = rank[person({ ...args, gaze: g }).mood]; assert.ok(next >= previous); previous = next;
    }
    lowFears += FEARS.slice(COUNT_FEAR_START).includes(low.fears);
    highFears += FEARS.slice(COUNT_FEAR_START).includes(high.fears);
    lowSecrets += SECRETS.find(s => s.text === low.secret).count;
    highSecrets += SECRETS.find(s => s.text === high.secret).count;
  }
  assert.ok(highFears > lowFears * 3); assert.ok(highSecrets > lowSecrets * 3);
});

function checkVillage(v) {
  const ids = new Set(v.people.map(p => p.id));
  assert.equal(ids.size, v.people.length);
  assert.equal(new Set(v.people.map(p => p.name)).size, v.people.length);
  assert.ok(v.tensions.length >= 2 && v.tensions.length <= 4);
  assert.equal(new Set(v.tensions).size, v.tensions.length);
  for (const t of v.tensions) assert.ok(v.people.filter(p => t.includes(p.name)).length >= 2);
  for (const t of v.ties) {
    assert.ok(ids.has(t.a) && ids.has(t.b)); assert.notEqual(t.a, t.b);
    assert.ok(t.text.includes(v.people.find(p => p.id === t.a).name));
    assert.ok(t.text.includes(v.people.find(p => p.id === t.b).name));
    if (t.kind === 'loves') assert.ok(v.people.filter(p => p.id === t.a || p.id === t.b).every(p => p.age >= 18));
    assert.ok(!t.text.includes('{'));
  }
  for (const p of v.people) {
    const incident = v.ties.filter(t => t.a === p.id || t.b === p.id), outgoing = v.ties.filter(t => t.a === p.id);
    assert.ok(incident.length >= 1 && incident.length <= 3);
    assert.ok(outgoing.length >= 1 && outgoing.length <= 3);
    assert.equal(p.ties.length, incident.length);
  }
  const witness = v.ties.find(t => t.kind === 'informs on' && t.secretOf === t.b);
  assert.ok(witness); assert.equal(witness.subject, v.people.find(p => p.id === witness.b).secretSubject);
  assert.ok(v.ties.some(t => ['loves', 'is kin to'].includes(t.kind) &&
    v.ties.some(u => u.a === t.b && u.b === t.a && u.kind === t.kind)));
  assert.ok(v.ties.some(t => !v.ties.some(u => u.a === t.b && u.b === t.a && u.kind === t.kind)));
  const visited = new Set([v.people[0].id]), queue = [...visited];
  while (queue.length) {
    const id = queue.shift();
    for (const t of v.ties.filter(t => t.a === id || t.b === id)) {
      const next = t.a === id ? t.b : t.a;
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  assert.equal(visited.size, ids.size);
}

test('12-person villages have bounded connected ties, reciprocal bonds, witnesses and real tensions', () => {
  for (let i = 0; i < 50; i++) {
    const args = freeze({ seed: `village-${i}`, place: 'Krezk', roles: roles.slice(0, 12) });
    const v = village(args); checkVillage(v); assert.deepEqual(v, village(args)); assert.deepEqual(v, clone(v));
  }
});

test('small, large, repeated-role and all-child villages keep graph and name invariants', () => {
  for (const size of [2, 3, 4, 30, 100]) for (const role of ['child', 'vistana', 'smith']) {
    const v = village({ seed: `size-${size}`, place: 'Barovia', roles: Array(size).fill(role) });
    checkVillage(v);
  }
});

test('introductions give name, two traits, role activity and voice without private facts', () => {
  for (const role of roles) for (const voice of VOICES) {
    const p = { ...person({ ...options, role }), voice };
    for (const night of [false, true]) {
      const line = introduce(p, { night });
      assert.ok(line.includes(p.name) && line.includes(ROLES[role].label));
      assert.ok(p.look.every(t => line.includes(t)) && line.includes(voice));
      assert.ok(line.includes(night ? ROLES[role].night : ROLES[role].day));
      assert.equal((line.match(/[.!?](?=[”\s]|$)/gu) || []).length, 3);
      for (const secret of [p.secret, p.wants, p.fears]) assert.ok(!line.includes(secret));
    }
    assert.notEqual(introduce(p), introduce(p, { night: true }));
  }
});

test('all secret subjects only slip when easy, never confess, including unknown secret-text topics', () => {
  for (const secret of SECRETS) for (const mood of ['easy', 'wary', 'afraid']) {
    const p = { ...person(options), mood, secret: secret.text, secretSubject: secret.subject, secretSlip: secret.slip };
    for (const topic of ['place', 'Vallaki', 'Krezk', 'Count', 'the Vistani', 'the dead', 'unknown', secret.text, secret.subject]) {
      const line = askAbout(p, topic, { gaze: 1 });
      assert.ok(!line.includes(secret.text));
      const slip = secret.slip.replace(/[.!?]+$/u, '');
      assert.equal(line.includes(slip), mood === 'easy' && topic === secret.subject);
    }
    assert.ok(!askAbout(p, secret.subject, { gaze: 9 }).includes(secret.slip.replace(/[.!?]+$/u, '')));
  }
});

test('dialogue is topic-specific, coloured by motivations, and afraid answers are shorter', () => {
  let short = 0, long = 0;
  for (let i = 0; i < 100; i++) {
    const p = person({ ...options, seed: `talk-${i}` });
    const topics = ['place', 'Count', 'Vistani', 'dead', 'unknown'];
    const answers = topics.map(topic => askAbout({ ...p, mood: 'easy' }, topic, { gaze: 1 }));
    assert.equal(new Set(answers).size, topics.length);
    for (const [j, topic] of topics.entries()) {
      assert.ok(answers[j].includes(p.wants) && answers[j].includes(p.fears));
      long += answers[j].length;
      short += askAbout({ ...p, mood: 'afraid' }, topic, { gaze: 0 }).length;
    }
  }
  assert.ok(short < long / 3);
});

test('person topics follow incoming/outgoing ties by id, name or object without disclosing secrets', () => {
  const v = village({ seed: 'talk', place: 'Vallaki', roles: roles.slice(0, 12) });
  for (const p of v.people) for (const tie of p.ties) {
    const other = v.people.find(q => q.id === (tie.a === p.id ? tie.b : tie.a));
    const args = { ...p, mood: 'easy' };
    const a = askAbout(args, other.id, { gaze: 1 });
    assert.equal(a, askAbout(args, other.name, { gaze: 1 }));
    assert.equal(a, askAbout(args, { kind: 'person', id: other.id }, { gaze: 1 }));
    assert.ok(a.includes(other.name)); assert.ok(!a.includes(p.secret) && !a.includes(other.secret));
  }
});

test('forPlayers strictly whitelists fields, filters private text and copies approved met facts', () => {
  const p = village({ seed: 'redact', place: 'Vallaki', roles: ['smith', 'innkeeper', 'child'] }).people[0];
  const met = ['Gave us a cup of tea.', ' Gave us a cup of tea. ', 'Lives by the gate.', p.secret, p.wants, p.fears,
    p.secretSlip, p.secretSubject, p.ties[0].text, { secret: p.secret }, null, 4];
  const view = forPlayers(freeze(p), freeze(met));
  assert.deepEqual(Object.keys(view).sort(), ['name', 'look', 'voice', 'met'].sort());
  assert.deepEqual(view.met, ['Gave us a cup of tea.', 'Lives by the gate.']);
  const json = JSON.stringify(view);
  for (const privateText of [p.secret, p.wants, p.fears, p.ties[0].text]) assert.ok(!json.includes(privateText));
  view.look.push('new trait'); view.met.push('new fact');
  assert.equal(p.look.length, 2); assert.equal(met.length, 12);
  assert.deepEqual(forPlayers(p).met, []);
});

test('pure outputs do not mutate inputs or share mutable arrays with data or other profiles', () => {
  const args = freeze({ seed: 'pure', place: 'Krezk', roles: ['smith', 'child', 'vistana'] });
  const v = village(args), before = clone(v);
  for (const p of freeze(v).people) {
    introduce(p); askAbout(p, 'Count'); forPlayers(p, freeze(['Met at the gate.']));
  }
  assert.deepEqual(v, before);
  const a = village(args), b = village(args);
  a.people[0].ties[0].text = 'changed'; a.people[0].knows.push('changed'); a.people[0].look.push('changed');
  assert.deepEqual(b, before); assert.notEqual(a.ties[0].text, 'changed');
  assert.ok(!ROLES.smith.knows.includes('changed'));
});

test('invalid roles, empty strings, non-finite gaze and impossible village sizes fail explicitly', () => {
  for (const role of ['dog', '__proto__', 'constructor', 'unknown', null]) assert.throws(() => person({ ...options, role }), RangeError);
  for (const key of ['seed', 'place']) for (const value of ['', '  ', 42, null]) assert.throws(() => person({ ...options, [key]: value }), TypeError);
  for (const gaze of [NaN, Infinity, '5', null]) assert.throws(() => person({ ...options, gaze }), TypeError);
  for (const list of [undefined, [], ['smith'], Array(101).fill('smith')]) assert.throws(() => village({ ...options, roles: list }), RangeError);
  assert.throws(() => forPlayers(person(options), {}), TypeError);
  assert.equal(person({ ...options, gaze: -1 }).gaze, 0);
  assert.equal(person({ ...options, gaze: 100 }).gaze, 10);
  assert.notEqual(person({ ...options, seed: '👻' }).id, person({ ...options, seed: '👹' }).id);
});

test('30-person village completes within 50ms', () => {
  const start = performance.now();
  const v = village({ seed: 'speed', place: 'Vallaki', roles: Array.from({ length: 30 }, (_, i) => roles[i % roles.length]) });
  const elapsed = performance.now() - start;
  assert.equal(v.people.length, 30); assert.ok(elapsed < 50, `${elapsed.toFixed(2)}ms`);
});
