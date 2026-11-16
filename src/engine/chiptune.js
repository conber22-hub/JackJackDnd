import { SONGS } from '../data/chiptune.js';

const PITCH = /^([A-G])([#b]?)([0-8])$/;
const TOKEN = /^([A-G][#b]?[0-8]|r|x|X|h)\/(1|2|4|8|16|32)([.t]?)$/;
const SEMITONES = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const VOICES = { pulse1:'square', pulse2:'square', tri:'triangle', noise:'noise' };
const ORDER = Object.keys(VOICES), DRUM_GAIN = { x:.65, X:1, h:.35 };
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const positive = v => Number.isFinite(v) && v > 0;
export function noteFreq(name){
  const m = typeof name === 'string' && PITCH.exec(name);
  if (!m) throw new RangeError(`Invalid pitch ${String(name)}; use C0–B8, with # or b if needed.`);
  const midi = 12 * (+m[3] + 1) + SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}
function tokens(text){
  if (typeof text !== 'string') throw new TypeError('Notes must be a string.');
  return text.trim() ? text.trim().split(/\s+/) : [];
}
function decode(token){
  const m = TOKEN.exec(token);
  if (!m) throw new SyntaxError(`Bad note token "${token}"; expected pitch/length, r/length or drum/length.`);
  // 96 ticks per quarter keeps dotted notes and triplets exact until conversion to seconds.
  return { name:m[1], ticks:384 / +m[2] * (m[3] === '.' ? 1.5 : m[3] === 't' ? 2 / 3 : 1) };
}
export function parseVoice(text, { bpm } = {}){
  if (!positive(bpm)) throw new RangeError('bpm must be a finite positive number.');
  const seconds = 60 / bpm / 96, out = [];
  let ticks = 0;
  for (const token of tokens(text)){
    const note = decode(token), t = ticks * seconds, dur = note.ticks * seconds;
    if (!Number.isFinite(t + dur) || dur <= 0) throw new RangeError('Tempo produces unrepresentable note times.');
    if (note.name !== 'r') out.push(Object.hasOwn(DRUM_GAIN, note.name)
      ? { t, dur, drum:note.name, vol:DRUM_GAIN[note.name] }
      : { t, dur, freq:noteFreq(note.name), vol:1 });
    ticks += note.ticks;
  }
  return out;
}
export function validate(song){
  if (typeof song === 'string') song = SONGS.find(s => s.id === song);
  const problems = [];
  if (!record(song)) return ['Song must be an object.'];
  if (typeof song.id !== 'string' || !song.id.trim()) problems.push('Song needs an id.');
  if (typeof song.title !== 'string' || !song.title.trim()) problems.push('Song needs a title.');
  if (!positive(song.bpm)) problems.push('bpm must be a finite positive number.');
  if (typeof song.loop !== 'boolean') problems.push('loop must be a boolean.');
  if (!record(song.voices) || !Object.keys(song.voices).length) return [...problems, 'Song needs at least one voice.'];
  for (const [name, voice] of Object.entries(song.voices)){
    if (!Object.hasOwn(VOICES, name)) problems.push(`Unknown voice "${name}".`);
    if (!record(voice)){ problems.push(`${name}: voice must be an object.`); continue; }
    if (!['square', 'triangle', 'noise'].includes(voice.wave)) problems.push(`${name}: unknown wave "${voice.wave}".`);
    else if (Object.hasOwn(VOICES, name) && voice.wave !== VOICES[name]) problems.push(`${name}: expected ${VOICES[name]} wave.`);
    if (!Number.isFinite(voice.vol) || voice.vol < 0 || voice.vol > 1) problems.push(`${name}: vol must be between 0 and 1.`);
    if (voice.wave === 'square' && (!positive(voice.duty) || voice.duty >= 1)) problems.push(`${name}: square duty must be between 0 and 1, exclusive.`);
    if (typeof voice.notes !== 'string'){ problems.push(`${name}: notes must be a string.`); continue; }
    for (const token of tokens(voice.notes)){
      try {
        const { name:pitch } = decode(token);
        if (pitch !== 'r' && (Object.hasOwn(DRUM_GAIN, pitch) !== (voice.wave === 'noise')))
          problems.push(`${name}: "${token}" needs a ${voice.wave === 'noise' ? 'drum' : 'pitched'} note.`);
      } catch (e){ problems.push(`${name}: ${e.message}`); }
    }
  }
  return problems;
}
export function events(id, { tempo = 1, transpose = 0 } = {}){
  const song = typeof id === 'string' ? SONGS.find(s => s.id === id) : id;
  if (!song) throw new RangeError(`Unknown song "${id}".`);
  if (!positive(tempo)) throw new RangeError('tempo must be a finite positive number.');
  if (!Number.isFinite(transpose)) throw new RangeError('transpose must be finite semitones.');
  const factor = 2 ** (transpose / 12);
  if (!positive(factor)) throw new RangeError('transpose is out of range.');
  const problems = validate(song);
  if (problems.length) throw new TypeError(problems.join(' '));
  const out = [];
  for (const name of ORDER){
    const voice = song.voices[name]; if (!voice) continue;
    for (const note of parseVoice(voice.notes, { bpm:song.bpm * tempo })){
      const event = { ...note, voice:name, wave:voice.wave, vol:note.vol * voice.vol };
      if (voice.wave === 'square') event.duty = voice.duty;
      if ('freq' in event){
        event.freq *= factor;
        if (!positive(event.freq)) throw new RangeError('transpose produces an unrepresentable frequency.');
      }
      out.push(event);
    }
  }
  // Explicit voice order makes simultaneous onsets independent of object insertion order.
  return out.sort((a, b) => a.t - b.t || ORDER.indexOf(a.voice) - ORDER.indexOf(b.voice));
}
export function duration(id, opts){ return events(id, opts).reduce((end, e) => Math.max(end, e.t + e.dur), 0); }
export function songs(){ return SONGS.map(s => ({ id:s.id, title:s.title, loop:s.loop, duration:duration(s.id) })); }
