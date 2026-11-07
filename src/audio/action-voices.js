import { DELIVERY, VOICE_SOUNDS } from '../data/action-voices.js';

const playingUntil = new WeakMap();

function playEffect(effect, context, output, volume) {
  if (!Object.hasOwn(VOICE_SOUNDS, effect) || context?.state !== 'running' ||
    context.currentTime < (playingUntil.get(context) ?? 0)) return false;
  let at = context.currentTime;
  for (const [from, to, duration, gain, type] of VOICE_SOUNDS[effect].parts) {
    const osc = context.createOscillator(), envelope = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * volume), at + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(envelope);
    envelope.connect(output ?? context.destination);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
    osc.start(at);
    osc.stop(at + duration + 0.015);
    at += duration + 0.035;
  }
  playingUntil.set(context, at);
  return true;
}

/** Local playback only. Audio is opt-in and the app unlocks its context after a tap. */
export function playActionVoice(cue, {
  caption, speech = false, sounds = false, volume = 1, context, output,
  synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance,
} = {}) {
  if (!cue || (cue.kind !== 'speech' && cue.kind !== 'sound')) return null;
  const captioned = typeof caption === 'function' && typeof cue.caption === 'string';
  if (captioned) caption(cue.caption);
  const fallback = captioned ? 'caption' : null;
  if (!Number.isFinite(volume) || volume <= 0) return fallback;
  const level = Math.min(1, volume);
  try {
    if (cue.kind === 'speech' && speech && synth?.speak && typeof Utterance === 'function' &&
      typeof cue.text === 'string' && cue.text.trim() && !synth.speaking && !synth.pending &&
      (!context || context.currentTime >= (playingUntil.get(context) ?? 0))) {
      const line = new Utterance(cue.text.slice(0, 160));
      const preset = Object.hasOwn(DELIVERY, cue.delivery) ? DELIVERY[cue.delivery] : DELIVERY.steady;
      line.rate = preset.rate;
      line.pitch = preset.pitch;
      line.volume = level;
      synth.speak(line);
      return 'speech';
    }
    if (cue.kind === 'sound' && sounds && !synth?.speaking && !synth?.pending && playEffect(cue.effect, context, output, level)) return 'sound';
  } catch {
    // A device with no usable voice or audio graph can still show the caption.
  }
  return fallback;
}
