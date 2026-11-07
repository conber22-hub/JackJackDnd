import { VOICE_TRIGGERS, DELIVERY, VOICE_LINES, SPELL_VOICE_LINES, VOICE_SOUNDS, CREATURE_VOICES } from '../data/action-voices.js';
import { hashSeed } from '../util/core.js';

const ANIMALS = ['wolf', 'dog', 'raven', 'horse', 'small', 'beast'];
const TRIGGERS = new Set(VOICE_TRIGGERS);
const MAX_EVENTS = 96;
const MAX_SPEAKERS = 48;
const idOk = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
const own = (table, key) => typeof key === 'string' && Object.hasOwn(table, key);
const tidy = (text, length) => typeof text === 'string'
  ? text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, length)
  : '';
const actionKey = value => tidy(value, 80).toLowerCase().replace(/['’]/g, '').replace(/\s+/g, ' ');

export function newActionVoiceState() {
  return { events: [], speakers: [], lastAt: null };
}

/** Safe to save on the DM side after the host approves the owner's edits. */
export function normalizeVoicePack(pack = {}) {
  const lines = [];
  for (const item of Array.isArray(pack?.lines) ? pack.lines.slice(0, 32) : []) {
    const text = tidy(item?.text, 120);
    if (TRIGGERS.has(item?.trigger) && text) lines.push({ trigger: item.trigger, action: actionKey(item.action), text });
  }
  return { muted: pack?.muted === true, delivery: own(DELIVERY, pack?.delivery) ? pack.delivery : null, lines };
}

function animalOf(actor) {
  if (ANIMALS.includes(actor.animal)) return actor.animal;
  if (own(CREATURE_VOICES, actor.bid)) return CREATURE_VOICES[actor.bid];
  if (actor.role === 'dog') return 'dog';
  return actor.kind === 'animal' || actor.beast === true ? 'beast' : null;
}

function profileOf(actor) {
  const animal = animalOf(actor);
  if (actor.profile === 'mimic') return actor.revealed === true ? 'mimic' : animal ?? 'beast';
  // A normal animal stays non-verbal even if a speech pack was attached by mistake.
  if (animal) return animal;
  if (ANIMALS.includes(actor.profile) || own(VOICE_LINES, actor.profile) || actor.profile === 'hollow') return actor.profile;
  if (actor.kind === 'pc') return 'hero';
  if (actor.kind === 'mob') return 'mob';
  if (['watch', 'watchman', 'guard', 'burgomaster’s man', "burgomaster's man"].includes(actor.role)) return 'guard';
  if (actor.kind === 'npc' || actor.kind === 'folk') return 'villager';
  return 'hollow';
}

function nonverbal(profile, trigger) {
  if (!['attack', 'hit', 'critical', 'help', 'guard', 'hurt', 'down', 'rally', 'retreat', 'interact'].includes(trigger)) return null;
  if (profile === 'wolf') {
    if (['hurt', 'down'].includes(trigger)) return 'wolf-yelp';
    return ['help', 'rally', 'retreat'].includes(trigger) ? 'wolf-howl' : 'wolf-growl';
  }
  if (profile === 'dog') return ['hurt', 'down'].includes(trigger) ? 'wolf-yelp' : 'dog-bark';
  if (profile === 'horse') return ['guard', 'interact', 'help'].includes(trigger) ? 'horse-stamp' : 'horse-snort';
  if (profile === 'raven') return 'raven-caw';
  if (profile === 'small') return 'small-squeak';
  return profile === 'hollow' ? 'hollow-rattle' : 'beast-snarl';
}

function spokenLines(profile, event, pack) {
  const trigger = event.trigger, action = actionKey(event.action);
  const exact = pack.lines.filter(line => line.trigger === trigger && line.action && line.action === action);
  const generic = pack.lines.filter(line => line.trigger === trigger && !line.action);
  if (exact.length) return exact.map(line => line.text);
  if (generic.length) return generic.map(line => line.text);
  if (['spell', 'heal'].includes(trigger) && own(SPELL_VOICE_LINES, action)) return SPELL_VOICE_LINES[action];
  return VOICE_LINES[profile]?.[trigger] ?? [];
}

function fill(line, event) {
  const terms = {
    actor: tidy(event.actor.publicName, 40) || 'I',
    target: tidy(event.targetPublicName, 40) || 'friend',
    action: tidy(event.action, 60) || 'this',
  };
  return tidy(line.replace(/\{(actor|target|action)\}/g, (_, key) => terms[key]), 160);
}

/**
 * Host-only. Call once per resolved action with a stable event ID and monotonic ms.
 * Only pass public names/spell labels when a cue may be shared. The local opt-in,
 * recipient visibility and audio settings are applied separately.
 */
export function planActionVoice(state = newActionVoiceState(), event, { now, pack, enabled = true } = {}) {
  if (!idOk(event?.id) || !idOk(event.actor?.id) || !TRIGGERS.has(event.trigger) ||
    !Number.isFinite(now) || now < 0 || state.events.includes(event.id)) return { state, cue: null };
  // Even a suppressed event is consumed so a late duplicate cannot play after the gap.
  const next = { ...state, events: [...state.events, event.id].slice(-MAX_EVENTS) };
  const settings = normalizeVoicePack(pack);
  const previous = state.speakers.find(item => item.id === event.actor.id);
  const profile = profileOf(event.actor);
  // The DM's explicit reveal can interrupt the usual cooldown, even after a bark.
  const reveal = event.trigger === 'reveal' && profile === 'mimic';
  if (!enabled || settings.muted || (event.trigger === 'reveal' && !reveal) ||
    (state.lastAt !== null && now < state.lastAt) ||
    (!reveal && ((state.lastAt !== null && now - state.lastAt < 1800) ||
    (previous && now - previous.at < 6500)))) return { state: next, cue: null };
  const speaker = tidy(event.actor.publicName, 40);
  let body, key;
  if (ANIMALS.includes(profile) || profile === 'hollow') {
    const effect = nonverbal(profile, event.trigger);
    if (!effect) return { state: next, cue: null };
    key = effect;
    body = { kind: 'sound', effect, caption: VOICE_SOUNDS[effect].caption };
  } else {
    const options = [...new Set(spokenLines(profile, event, settings).map(line => fill(line, event)))].filter(Boolean);
    if (!options.length) return { state: next, cue: null };
    const fresh = options.filter(line => line !== previous?.key);
    const pool = fresh.length ? fresh : options;
    const text = pool[hashSeed(JSON.stringify([event.id, event.actor.id])) % pool.length];
    key = text;
    const delivery = settings.delivery || (profile === 'mob' || profile === 'guard' ? 'low' : profile === 'mimic' ? 'hush' : 'steady');
    body = { kind: 'speech', text, delivery, caption: speaker ? speaker + ': ' + text : text };
  }
  const cue = { ...body, actorId: event.actor.id, shareable: event.shareable === true };
  return { cue, state: { ...next, lastAt: now, speakers: [...state.speakers.filter(item => item.id !== event.actor.id),
    { id: event.actor.id, at: now, key }].slice(-MAX_SPEAKERS) } };
}

/** Strip private metadata and drop cues whose source the recipient may not see. */
export function actionVoiceForPlayers(cue, { sourceVisible = false } = {}) {
  if (!cue?.shareable || !sourceVisible) return null;
  return cue.kind === 'speech'
    ? { kind: 'speech', caption: cue.caption, text: cue.text, delivery: cue.delivery }
    : { kind: 'sound', caption: cue.caption, effect: cue.effect };
}
