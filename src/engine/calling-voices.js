import { CALLING_VOICES, SEEP_VOICES } from '../data/calling-voices.js';
import { CALLINGS } from '../data/callings.js';
import { VOICE_TRIGGERS } from '../data/action-voices.js';

const SEEP_TRIGGERS = ['hurt', 'down', 'critical', 'rally'];
const own = (table, key) => typeof key === 'string' && Object.hasOwn(table, key);

export function callingLines(callingId, trigger, pathId = null) {
  if (!own(CALLING_VOICES, callingId) || !VOICE_TRIGGERS.includes(trigger)) return [];

  const base = CALLING_VOICES[callingId][trigger] ?? [];
  const pathKey = typeof pathId === 'string' ? `${callingId}/${pathId}` : null;
  const extra = own(SEEP_VOICES, pathKey) ? SEEP_VOICES[pathKey][trigger] ?? [] : [];
  return [...base, ...extra];
}

export function voiceOf(callingId) {
  if (!own(CALLING_VOICES, callingId)) return null;

  const lines = Object.fromEntries(VOICE_TRIGGERS.map(trigger => [
    trigger, callingLines(callingId, trigger),
  ]));
  return { id: callingId, lines };
}

function checkLines(errors, key, bank, triggers, min, max, seen) {
  for (const trigger of Object.keys(bank)) {
    if (!triggers.includes(trigger)) errors.push(`${key}/${trigger}: unknown trigger`);
  }

  for (const trigger of triggers) {
    const label = `${key}/${trigger}`;
    const lines = bank[trigger];
    if (!Array.isArray(lines) || lines.length < min || lines.length > max) {
      errors.push(`${label}: expected ${min}–${max} lines`);
      continue;
    }

    for (const line of lines) {
      if (typeof line !== 'string' || !line.trim() || line.length >= 60 ||
        /[{}]/.test(line.replaceAll('{target}', ''))) {
        errors.push(`${label}: invalid line ${JSON.stringify(line)}`);
        continue;
      }
      if (seen.has(line)) errors.push(`${label}: repeated line ${JSON.stringify(line)}`);
      seen.add(line);
    }
  }
}

export function validateCallingVoices() {
  const errors = [];
  const seepKeys = new Set();

  for (const { id, paths } of Object.values(CALLINGS)) {
    const seen = new Set();
    checkLines(errors, id, CALLING_VOICES[id] ?? {}, VOICE_TRIGGERS, 2, 4, seen);

    for (const path of paths.filter(path => path.seep === true)) {
      const key = `${id}/${path.id}`;
      seepKeys.add(key);
      checkLines(errors, key, SEEP_VOICES[key] ?? {}, SEEP_TRIGGERS, 1, 2, seen);
    }
  }

  for (const id of Object.keys(CALLING_VOICES)) {
    if (!own(CALLINGS, id)) errors.push(`${id}: unknown Calling`);
  }
  for (const key of Object.keys(SEEP_VOICES)) {
    if (!seepKeys.has(key)) errors.push(`${key}: unknown Seep-touched Path`);
  }
  return errors;
}
