/* The rot is read from the existing seepMarks counter. All returned data is
   plain JSON. The game owns trigger timing, cure eligibility and persistence. */
import { pick } from '../util/core.js';
import { ROT_STAGES, ROT_SIGNS, CHORUS_WHISPERS, CHORUS_OFFERS, ROT_CURES, TAKEN_OUTCOMES } from '../data/rot.js';

const count = marks => Number.isFinite(marks) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(marks))) : 0;
const lookup = (data, key) => typeof key === 'string' && Object.hasOwn(data, key) ? data[key] : null;

export function rotStage(marks){
  const n = count(marks);
  return structuredClone(ROT_STAGES.findLast(stage => n >= stage.n));
}

export function rotSigns(marks, options){
  const { observer } = options ?? {};
  const { stage, name, text } = rotStage(marks);
  if (observer === 'count'){
    const n = count(marks);
    return `You count ${n} ${n === 1 ? 'mark' : 'marks'}. ${name}. ${text} ${ROT_SIGNS.priest[stage]} ${ROT_SIGNS.seep[stage]}`;
  }
  return (lookup(ROT_SIGNS, observer) ?? ROT_SIGNS.villager)[stage];
}

export function chorusWhisper(marks, options){
  const { trigger, gaze = 1, rng } = options ?? {};
  const { stage } = rotStage(marks);
  const lines = lookup(CHORUS_WHISPERS, trigger);
  if (stage < 2 || stage === ROT_STAGES.at(-1).stage || !lines || typeof rng !== 'function') return null;
  const pressure = Number.isFinite(gaze) ? Math.max(1, Math.min(10, gaze)) : 1;
  if (rng() >= .30 + .15 * (stage - 2) + .04 * (pressure - 1)) return null;
  const text = pick(lines, rng);
  // Make the price explicit so the game can keep it on the consent card.
  const offer = rng() < .25 + .04 * (pressure - 1) ? { ...CHORUS_OFFERS[trigger], cost:{ what:'mark', n:1 } } : null;
  return { text, offer };
}

export function cureRot(marks, options){
  const { kind, used = false, clean = true, calling } = options ?? {};
  const n = count(marks);
  const cure = lookup(ROT_CURES, kind);
  if (n >= ROT_STAGES.at(-1).n) return { marks:n, text:'The Chorus has taken root beyond the reach of any cure.' };
  if (!n) return { marks:n, text:'There are no marks to take away.' };
  if (!cure) return { marks:n, text:'That remedy does not touch the rot.' };
  if (used) return { marks:n, text:'This remedy has given all it can for now.' };
  if (kind === 'holyPlace' && !clean) return { marks:n, text:'The Seep has reached this place. The marks remain.' };
  if (cure.calling && calling != null && calling !== cure.calling) return { marks:n, text:'This rite needs a Chaplain.' };
  return { marks:Math.max(0, n - cure.remove), text:cure.text };
}

export function taken(hero){
  if (rotStage(hero?.seepMarks).stage !== ROT_STAGES.at(-1).stage) return null;
  return { text:'The Chorus has taken them. They are still alive. The DM chooses where their story goes next.', outcomes:structuredClone(TAKEN_OUTCOMES) };
}
