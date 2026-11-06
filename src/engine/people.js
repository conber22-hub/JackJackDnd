import {
  FIRST_NAMES, FAMILY_NAMES, VISTANI_NAMES, NICKNAMES, ROLES, TRAITS,
  VOICES, WANTS, FEARS, COUNT_FEAR_START, SECRETS, RELATIONS,
} from '../data/people.js';

const own = (o, k) => Object.hasOwn(o, k);
const pick = (items, rng) => items[Math.floor(rng() * items.length)];
const normal = s => typeof s === 'string' ? s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() : '';
function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}
function random(seed) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function textInput(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
}
function gazeValue(gaze) {
  if (!Number.isFinite(gaze)) throw new TypeError('gaze must be finite');
  return Math.max(0, Math.min(10, gaze));
}
function moodAt(roll, gaze) {
  if (roll < .05 + .085 * gaze) return 'afraid';
  return roll < .4 + .06 * gaze ? 'wary' : 'easy';
}
const firsts = role => role === 'vistana' ? VISTANI_NAMES : Object.values(FIRST_NAMES).flat();

/** DM-only profile. Additional place/gaze/secretSubject/secretSlip/ties support dialogue.
 * Persist the profile; use forPlayers before putting it on any player-facing transport.
 * Human folk aliases are supported; dogs and unknown roles are rejected.
 */
export function person({ role, seed, place, gaze = 1 } = {}) {
  if (typeof role !== 'string' || !own(ROLES, role)) throw new RangeError(`Unknown human role: ${role}`);
  textInput(seed, 'seed'); textInput(place, 'place');
  const g = gazeValue(gaze), spec = ROLES[role];
  const key = JSON.stringify([seed, place, role]);
  const rng = random(key), first = pick(firsts(role), rng);
  const name = `${first} ${pick(FAMILY_NAMES, rng)}`;
  const nick = pick(NICKNAMES, rng).replace('{first}', first);
  const age = spec.age[0] + Math.floor(rng() * (spec.age[1] - spec.age[0] + 1));
  const look = [pick(TRAITS, rng)];
  look.push(pick(TRAITS.filter(t => t !== look[0]), rng));
  const voice = pick(VOICES, rng), moodRoll = rng();
  const privateRng = random(`${key}:private`);
  const wants = WANTS[pick(age < 18 ? [8, 16, 25, 27, 31] : spec.wants, privateRng)];
  const countChance = .08 + .08 * g;
  const fears = privateRng() < countChance
    ? pick(FEARS.slice(COUNT_FEAR_START), privateRng)
    : FEARS[pick(age < 18 ? [8, 16, 19, 22] : spec.fears, privateRng)];
  const countSecret = privateRng() < countChance;
  const suitable = SECRETS.filter(s => s.count === countSecret &&
    (age >= 18 || countSecret || [8, 9, 16, 17, 19, 22].includes(SECRETS.indexOf(s))));
  const secret = pick(suitable, privateRng);
  return {
    id: `person-${hash(key).toString(36)}`, name, nick, role, age, look, voice,
    wants, fears, secret: secret.text, knows: [...spec.knows], mood: moodAt(moodRoll, g),
    hook: `${name} asks for help to ${wants}; a small kindness could buy a conversation.`,
    place, gaze: g, secretSubject: secret.subject, secretSlip: secret.slip, ties: [],
  };
}

/** 2–100 people: a singleton cannot have another person's ties or a secret witness.
 * Each person has 2–3 incident edges (including mutual edges); no isolated clusters.
 * ties on profiles are independent JSON copies with endpoint names for askAbout.
 */
export function village({ seed, place, roles, gaze = 1 } = {}) {
  textInput(seed, 'seed'); textInput(place, 'place'); gazeValue(gaze);
  if (!Array.isArray(roles) || roles.length < 2 || roles.length > 100) {
    throw new RangeError('A village requires 2–100 human roles');
  }
  const people = roles.map((role, i) => person({ role, seed: JSON.stringify([seed, i]), place, gaze }));
  const names = new Set();
  for (const [i, p] of people.entries()) {
    p.id += `-${i}`;
    // Probe the finite name space rather than rerolling an entire personality.
    const first = firsts(p.role), start = hash(p.id), oldName = p.name;
    for (let n = 0; names.has(p.name); n++) {
      const index = (start + n) % (first.length * FAMILY_NAMES.length);
      p.name = `${first[Math.floor(index / FAMILY_NAMES.length)]} ${FAMILY_NAMES[index % FAMILY_NAMES.length]}`;
    }
    if (p.name !== oldName) {
      p.nick = p.nick.replace(oldName.split(' ')[0], p.name.split(' ')[0]);
      p.hook = p.hook.replace(oldName, p.name);
    }
    names.add(p.name);
  }
  const rng = random(JSON.stringify([seed, place, 'ties'])), order = [...people];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const ties = [], directed = ['owes', 'hates', 'fears', 'serves', 'hides from'];
  function add(a, b, kind) {
    const text = pick(RELATIONS[kind].lines, rng)
      .replaceAll('{a}', a.name).replaceAll('{b}', b.name).replaceAll('{subject}', b.secretSubject);
    const tie = { a: a.id, b: b.id, kind, text };
    if (kind === 'informs on') Object.assign(tie, { secretOf: b.id, subject: b.secretSubject });
    ties.push(tie);
  }
  const mutual = order[0].age >= 18 && order[1].age >= 18 && rng() < .5 ? 'loves' : 'is kin to';
  add(order[0], order[1], mutual);
  add(order[1], order[0], mutual);
  if (order.length === 2) add(order[0], order[1], 'informs on');
  else {
    for (let i = 1; i < order.length; i++) {
      add(order[i], order[(i + 1) % order.length], i === 1 ? 'informs on' : pick(directed, rng));
    }
  }
  const byId = new Map(people.map(p => [p.id, p]));
  for (const p of people) p.ties = ties.filter(t => t.a === p.id || t.b === p.id)
    .map(t => ({ ...t, aName: byId.get(t.a).name, bName: byId.get(t.b).name }));
  // Each tension joins two actual, adjacent edges; no invented off-map villagers.
  const pressures = [
    'A sealed letter must be delivered before dusk, and neither will go alone.',
    'A missing purse has brought both promises into question; they ask the party to judge.',
    'The watch demands one witness before the gate closes; both obligations cannot be kept.',
    'There is only one place left in a departing cart, and the party must choose who gets it.',
  ];
  const count = Math.min(4, 2 + Math.floor(people.length / 8));
  const conflicts = people.map(p => p.ties).filter(ts => ts.length >= 2);
  const tensions = Array.from({ length: count }, (_, i) => {
    const edges = conflicts[i % conflicts.length];
    // Prefer conflicting obligations over simply restating a reciprocal relation.
    const left = edges[0], right = edges.find(t => t.kind !== left.kind) || edges[1];
    return `${left.text}; yet ${right.text}. ${pressures[i]}`;
  });
  return { people, ties, tensions };
}

function spoken(p, text) {
  if (p.voice === VOICES[1]) return `${text.replace(/[.!?]+$/u, '')}?`;
  if (p.voice === VOICES[3]) {
    const last = text.replace(/[.!?]+$/u, '').split(' ').at(-1);
    return `${text}. ${last}.`;
  }
  return `${text.replace(/[.!?]+$/u, '')}.`;
}

/** Read aloud only: no hook, private motivation, secret or relationship fields. */
export function introduce(p, { night = false } = {}) {
  const spec = ROLES[p.role];
  // Three sentences even for the repeating voice: repeat within the spoken clause.
  const greeting = p.voice === VOICES[3] ? `${spec.greeting}, ${spec.greeting.split(' ').at(-1)}` : spec.greeting;
  return `${p.name}, the ${spec.label}, has ${p.look[0]} and ${p.look[1]}. ` +
    `${p.name} ${night ? spec.night : spec.day}. ${p.name} ${p.voice}: “${spoken({ ...p, voice: p.voice === VOICES[3] ? '' : p.voice }, greeting)}”`;
}

/** Topics are strings (place/name/id/subject), or {kind:'person', id}.
 * Never reflect unknown input: it could itself contain a secret. Gaze can make an
 * existing profile more guarded, never overrule an explicitly frightened mood.
 */
export function askAbout(p, topic, { gaze = p.gaze ?? 1 } = {}) {
  const g = gazeValue(gaze), mood = g >= 8 || p.mood === 'afraid' ? 'afraid'
    : g >= 5 || p.mood === 'wary' ? 'wary' : 'easy';
  const raw = typeof topic === 'string' ? topic : topic?.kind === 'person' ? topic.id : '';
  const q = normal(raw);
  const tie = (p.ties || []).find(t => {
    const other = t.a === p.id ? t.b : t.a, name = t.a === p.id ? t.bName : t.aName;
    return raw === other || (name && q === normal(name));
  });
  let easy, wary, afraid;
  if (tie) {
    const otherName = tie.a === p.id ? tie.bName : tie.aName;
    easy = `${otherName}? ${tie.a === p.id ? RELATIONS[tie.kind].reply : 'They have their own reasons for watching what I do'}`;
    wary = 'We have crossed paths'; afraid = 'Ask them';
  } else if (['count', 'the count', 'strahd'].includes(q)) {
    easy = 'The Count does not need to visit for people to leave a chair empty';
    wary = 'His roads have ears'; afraid = 'Not his name';
  } else if (['vistani', 'the vistani'].includes(q)) {
    easy = p.role === 'vistana' ? 'Our camp has room for a story and a shared meal; ask each traveller what they have seen'
      : 'The travellers brought news before the last rain; I would ask at their fire';
    wary = 'Try the camp at daylight'; afraid = 'Ask at camp';
  } else if (['dead', 'the dead', 'graves', 'graveyard'].includes(q)) {
    easy = 'We set stones at the graves so we can tell if the earth has shifted';
    wary = 'Keep to the churchyard path'; afraid = 'Let them rest';
  } else if (['place', normal(p.place), 'barovia', 'vallaki', 'krezk'].includes(q) && q) {
    easy = q === 'place' || q === normal(p.place)
      ? 'Here, a lit window means someone is still waiting; knock before the lamps go out'
      : 'I hear the roads there have grown quiet; find someone who has returned recently';
    wary = 'Travel before the lamps go out'; afraid = 'Stay inside';
  } else {
    easy = 'I cannot swear to that, but a little help might give me time to listen';
    wary = 'I have heard too many stories'; afraid = 'I know nothing';
  }
  if (mood === 'afraid') return spoken(p, afraid);
  if (mood === 'wary') return spoken(p, `${wary}; I worry about ${p.fears}`);
  let answer = `${easy}. I am trying to ${p.wants}, though I worry about ${p.fears}`;
  // Match the stored subject exactly after case/punctuation normalisation, not substrings.
  if (q && q === normal(p.secretSubject) && p.secretSlip) answer += `. ${p.secretSlip.replace(/[.!?]+$/u, '')}`;
  return spoken(p, answer);
}

/** met is a DM-approved string list, not an automatic disclosure of private fields.
 * Reject non-strings and verbatim private text; semantic approval remains the DM's.
 */
export function forPlayers(p, met = []) {
  if (!Array.isArray(met)) throw new TypeError('met must be an array of approved facts');
  const hidden = [p.wants, p.fears, p.secret, p.secretSubject, p.secretSlip, ...(p.ties || []).map(t => t.text)]
    .filter(v => typeof v === 'string' && v).map(normal);
  const facts = met.filter(v => typeof v === 'string' && v.trim() && v.length <= 1000)
    .map(v => v.trim()).filter(v => !hidden.some(h => normal(v).includes(h)));
  return { name: p.name, look: [...p.look], voice: p.voice, met: [...new Set(facts)] };
}
