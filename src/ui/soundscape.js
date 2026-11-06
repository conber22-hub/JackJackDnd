/* 🎻 The Soundscape (brief-9) — a sound board for the DM: layered ambient
   beds, one-tap scenes, one-shot cues, and a Gaze that darkens the sound.
   Everything is generated in code (Web Audio), so it works offline with no
   sound files and no recorded audio. The board never changes sound.js: it
   makes its own nodes on its own lazily-created AudioContext (see the PR
   for why sharing the app's context would be better), and its master gain
   follows gfx.volume and gfx.music like the app's own drone does.

   The table hears it: the DM's mix goes out as { t:'soundscape',
   layers:{ id:volume }, scene, fade } and cues as { t:'soundcue', id },
   through toPlayers(msg, 'dm'). The table's handler is a hook for Claude
   (see the PR): it must call net.onSoundscape and net.onSoundcue, which
   this module sets when it starts, as the letters do with net.onLetter.
   Each player's own device chooses whether it hears it: off, cues only,
   or everything — the TV always plays the whole mix. */
import { state, ui } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { gfx, onGfx } from '../render/gfx.js';
import { registerCommands } from './palette.js';
import { toast } from './hud.js';
import { net } from '../net/table.js';
import { toPlayers } from '../game/outbox.js';
import { setAmbience } from '../audio/sound.js';

const PREFS_KEY = 'dreaddelve.soundscape.prefs.v1';
const SCENES_KEY = 'dreaddelve.soundscape.scenes.v1';
const TABLE_KEY = 'dreaddelve.soundscape.table.v1';
const FADE = 3;   // scenes crossfade over 3 seconds

/* The twelve beds. Every one is shaped noise or sines with filters, slow
   modulation and random grains — nothing that sounds like a buzzing synth. */
export const LAYERS = [
  { id:'rain-stone', name:'Rain on stone', icon:'🌧️' },
  { id:'rain-leaves', name:'Rain on leaves', icon:'🍂' },
  { id:'wind-pines', name:'Wind in pines', icon:'🌲' },
  { id:'gale', name:'A howling gale', icon:'💨' },
  { id:'drips', name:'Cave drips', icon:'💧' },
  { id:'hearth', name:'A crackling hearth', icon:'🔥' },
  { id:'tavern', name:'A tavern murmur', icon:'🍺' },
  { id:'choir', name:'A distant choir drone', icon:'🎶' },
  { id:'heartbeat', name:'A heartbeat', icon:'🫀' },
  { id:'wolves', name:'Wolves far off', icon:'🐺' },
  { id:'timber', name:'Creaking timber', icon:'🪵' },
  { id:'mist', name:"The Mist's hiss", icon:'🌫️' },
];
export const SCENES = [
  { name:'Tavern night', icon:'🍺', layers:{ hearth:.7, tavern:.8, 'rain-stone':.3 } },
  { name:'Svalich Woods', icon:'🌲', layers:{ 'wind-pines':.7, 'rain-leaves':.4, wolves:.5, timber:.3 } },
  { name:'The Crypt', icon:'⚰️', layers:{ drips:.7, choir:.5, heartbeat:.3, mist:.2 } },
  { name:'Castle Ravenloft', icon:'🏰', layers:{ choir:.7, heartbeat:.4, timber:.5, 'wind-pines':.2 } },
  { name:'Storm on the road', icon:'⛈️', layers:{ gale:.8, 'rain-stone':.8, 'wind-pines':.4 } },
  { name:'The Mists', icon:'🌫️', layers:{ mist:.8, 'wind-pines':.3, choir:.2, wolves:.2 } },
  { name:'Silence', icon:'🤫', layers:{} },
];
export const CUES = [
  { id:'thunder', name:'A thunderclap', icon:'⛈️' },
  { id:'scream', name:'A scream far off', icon:'😱' },
  { id:'door', name:'A door slamming above', icon:'🚪' },
  { id:'bell', name:'A bell tolling thrice', icon:'🔔' },
  { id:'raven', name:"A raven's caw", icon:'🐦‍⬛' },
  { id:'wolf-close', name:'A wolf howl close by', icon:'🐺' },
  { id:'heart-stop', name:'A heart that stops', icon:'🫀' },
  { id:'laugh', name:"The Count's laugh", icon:'🧛' },
];

/* ---- Prefs and scenes, kept per device ---- */
function prefs(){
  try { return { mapChooses:true, followGaze:false, dread:3, ...(JSON.parse(localStorage.getItem(PREFS_KEY)) || {}) }; }
  catch { return { mapChooses:true, followGaze:false, dread:3 }; }
}
function savePrefs(p){ try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {} }
function customScenes(){
  try { const l = JSON.parse(localStorage.getItem(SCENES_KEY)); return Array.isArray(l) ? l.filter(s => s && s.name) : []; }
  catch { return []; }
}
function saveCustomScenes(l){ try { localStorage.setItem(SCENES_KEY, JSON.stringify(l)); } catch {} }
export function tablePref(){
  try { const p = localStorage.getItem(TABLE_KEY); return p === 'off' || p === 'cues' || p === 'all' ? p : 'all'; }
  catch { return 'all'; }
}
function setTablePref(p){ try { localStorage.setItem(TABLE_KEY, p); } catch {} }

/* ---- The audio engine: our own context, lazily, on the first tap ---- */
let ctx = null, master = null, comp = null, noiseBuf = null;
const live = new Map();   // layer id -> running instance
let currentScene = null, currentMix = {}, sent = [], cueLog = [], lastCue = null;

function ensureCtx(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = gfx.volume * (gfx.music ? 1 : 0); master.connect(comp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); let b = 0;
  for (let i = 0; i < d.length; i++){ const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = b * 3.5; }   // brown-ish, as sound.js does
  onGfx(g => { if (master) master.gain.setTargetAtTime(g.volume * (g.music ? 1 : 0), ctx.currentTime, .1); });
  return ctx;
}
const resumeCtx = () => { if (ensureCtx() && ctx.state === 'suspended') ctx.resume().catch(() => {}); };
const now = () => ctx.currentTime;

/* A looping noise source through a filter into a gain, into the master. */
function bed(type, freq, q, gain){
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(now(), Math.random() * 1.5);
  return { src, f, g };
}
/* A slow oscillator wobbling an AudioParam (a filter's frequency, a gain). */
function lfo(freq, depth, param){
  const o = ctx.createOscillator(); o.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = depth;
  o.connect(g); g.connect(param); o.start();
  return { o, g };
}
/* A one-shot: a source with an attack/decay envelope into the master. */
function shot(build, at){
  const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
  const nodes = build(g, at);
  return { g, nodes };
}
const env = (g, at, a, peak, d) => {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
};
const stopAll = list => { for (const n of list){ try { n.stop?.(); n.disconnect?.(); } catch {} } };

/* ---- The layers ---- */
function layerOut(){ const g = ctx.createGain(); g.gain.value = 0; g.connect(master); return g; }
function repeat(fn, min, max){
  let timer = null, stopped = false;
  const tick = () => { if (stopped) return; fn(); timer = setTimeout(tick, min + Math.random() * (max - min)); };
  tick();
  return { stop(){ stopped = true; clearTimeout(timer); } };
}
const baseLayer = (out, nodes, timers = []) => ({
  out,
  setVolume(v, fade = .5){ out.gain.setTargetAtTime(v, now(), Math.max(fade / 3, .05)); },
  stop(){ for (const t of timers) t.stop?.(); stopAll(nodes); try { out.disconnect(); } catch {} },
});

const LAYER_BUILD = {
  'rain-stone'(){
    const out = layerOut();
    const a = bed('highpass', 1800, .4, .06), b = bed('lowpass', 500, .6, .05);
    a.g.connect(out); b.g.connect(out);
    a.g.gain.setTargetAtTime(.06, now(), 1); b.g.gain.setTargetAtTime(.05, now(), 1);
    // droplets pattering on stone: short bright grains, often
    const r = repeat(() => {
      const t = now(), src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2600 + Math.random() * 2200;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(out);
      src.start(t, Math.random()); src.stop(t + .06); env(g, t, .001, .05 + Math.random() * .06, .05);
    }, 120, 420);
    return baseLayer(out, [a.src, b.src], [r]);
  },
  'rain-leaves'(){
    const out = layerOut();
    const a = bed('bandpass', 700, .8, .05); a.g.connect(out);
    a.g.gain.setTargetAtTime(.05, now(), 1);
    lfo(.05, 120, a.f.frequency);   // the patter wanders across the leaves
    const r = repeat(() => {
      const t = now(), src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100 + Math.random() * 600;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(out);
      src.start(t, Math.random()); src.stop(t + .09); env(g, t, .002, .03 + Math.random() * .04, .08);
    }, 300, 900);
    return baseLayer(out, [a.src], [r]);
  },
  'wind-pines'(){
    const out = layerOut();
    const a = bed('bandpass', 320, 1, .06); a.g.connect(out);
    a.g.gain.setTargetAtTime(.06, now(), 1.5);
    lfo(.06, 120, a.f.frequency);   // the wind moves through the trees
    const w = bed('bandpass', 950, 2, .012); w.g.connect(out);   // a faint pine whistle
    w.g.gain.setTargetAtTime(.012, now(), 2);
    lfo(.04, .008, w.g.gain);
    return baseLayer(out, [a.src, w.src]);
  },
  'gale'(){
    const out = layerOut();
    const a = bed('bandpass', 520, .9, .08); a.g.connect(out);
    a.g.gain.setTargetAtTime(.08, now(), 1);
    lfo(.18, 300, a.f.frequency);   // gusts, faster and deeper than the pines
    lfo(.11, .05, a.g.gain);
    const w = bed('bandpass', 1400, 4, .015); w.g.connect(out);
    w.g.gain.setTargetAtTime(.015, now(), 1.5);
    lfo(.23, 400, w.f.frequency);
    return baseLayer(out, [a.src, w.src]);
  },
  'drips'(){
    const out = layerOut();
    const a = bed('lowpass', 220, .5, .02); a.g.connect(out);
    a.g.gain.setTargetAtTime(.02, now(), 1.5);
    // the cave answers: a short delay the drips echo through
    const dl = ctx.createDelay(1); dl.delayTime.value = .28;
    const fb = ctx.createGain(); fb.gain.value = .35;
    const wet = ctx.createGain(); wet.gain.value = .5;
    dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out);
    const r = repeat(() => {
      const t = now(), f = 900 + Math.random() * 900;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + .06);
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(out); g.connect(dl);
      o.start(t); o.stop(t + .3); env(g, t, .003, .05 + Math.random() * .05, .22);
    }, 400, 2500);
    return baseLayer(out, [a.src, dl], [r]);
  },
  'hearth'(){
    const out = layerOut();
    const a = bed('lowpass', 400, .7, .035); a.g.connect(out);
    a.g.gain.setTargetAtTime(.035, now(), 1.5);
    const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 55;
    const hg = ctx.createGain(); hg.gain.value = .015; hum.connect(hg); hg.connect(out); hum.start();
    const r = repeat(() => {   // crackles: very short bright grains
      const t = now(), src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500 + Math.random() * 2500;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(out);
      src.start(t, Math.random()); src.stop(t + .05); env(g, t, .001, .04 + Math.random() * .05, .04);
    }, 80, 500);
    return baseLayer(out, [a.src, hum], [r]);
  },
  'tavern'(){
    const out = layerOut();
    // three voices at a time, each swelling on its own: filtered babble, never words
    const voices = [300, 650, 1100].map((freq, i) => {
      const b = bed('bandpass', freq, 2, .02 + i * .006); b.g.connect(out);
      b.g.gain.setTargetAtTime(.02 + i * .006, now(), 2);
      const w = repeat(() => b.g.gain.setTargetAtTime(.008 + Math.random() * .03, now(), 1.2), 2000, 5000);
      return { b, w };
    });
    const room = bed('lowpass', 150, 1, .02); room.g.connect(out);
    room.g.gain.setTargetAtTime(.02, now(), 2);
    return baseLayer(out, [room.src, ...voices.map(v => v.b.src)], voices.map(v => v.w));
  },
  'choir'(){
    const out = layerOut();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
    lp.connect(out);
    const g = ctx.createGain(); g.gain.value = .05; g.connect(lp);
    const oscs = [110, 164.81, 220, 277.18].map((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = (i % 2 ? 5 : -5) + (Math.random() - .5) * 2;
      o.connect(g); o.start(); return o;
    });
    lfo(.06, .02, g.gain);   // slow swells
    return {
      ...baseLayer(out, [...oscs], []),
      setDread(d){ const k = (d - 1) / 9; lp.frequency.setTargetAtTime(900 - k * 600, now(), 2); g.gain.setTargetAtTime(.05 + k * .03, now(), 2); },
    };
  },
  'heartbeat'(){
    const out = layerOut();
    let bpm = 50 + 3 * 6, timer = null, nextAt = 0;
    const thump = (t, vol) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(58, t);
      o.frequency.exponentialRampToValueAtTime(40, t + .12);
      const g = ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(out);
      o.start(t); o.stop(t + .2); env(g, t, .008, vol, .16);
    };
    const schedule = () => {
      if (!ctx) return;
      const ahead = now() + .35, interval = 60 / bpm;
      while (nextAt < ahead){ if (nextAt > now()){ thump(nextAt, .5); thump(nextAt + .14, .32); } nextAt += interval; }
    };
    nextAt = now() + .1; timer = setInterval(schedule, 200); schedule();
    return {
      ...baseLayer(out, [], [{ stop(){ clearInterval(timer); } }]),
      setDread(d){ bpm = 50 + d * 6; },
    };
  },
  'wolves'(){
    const out = layerOut();
    const r = repeat(() => {
      const t = now(), o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(380, t);
      o.frequency.exponentialRampToValueAtTime(720, t + 1.1);
      o.frequency.exponentialRampToValueAtTime(340, t + 2.8);
      const vib = ctx.createOscillator(); vib.frequency.value = 5;
      const vg = ctx.createGain(); vg.gain.value = 8; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + 3);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const pan = ctx.createStereoPanner(); pan.pan.value = (Math.random() - .5) * 1.2;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(lp); lp.connect(g); g.connect(pan); pan.connect(out);
      o.start(t); o.stop(t + 3); env(g, t, .9, .05, 2);
    }, 18000, 55000);
    return baseLayer(out, [], [r]);
  },
  'timber'(){
    const out = layerOut();
    const r = repeat(() => {
      const t = now(), dur = .6 + Math.random() * .8;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 90 + Math.random() * 70;
      const wob = ctx.createOscillator(); wob.frequency.value = .7;
      const wg = ctx.createGain(); wg.gain.value = 15; wob.connect(wg); wg.connect(o.frequency);
      wob.start(t); wob.stop(t + dur);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 8;
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); n.connect(f); f.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur); n.start(t, Math.random()); n.stop(t + dur);
      env(g, t, dur * .4, .04, dur * .6);
    }, 7000, 22000);
    return baseLayer(out, [], [r]);
  },
  'mist'(){
    const out = layerOut();
    const a = bed('highpass', 4200, .7, .02); a.g.connect(out);
    a.g.gain.setTargetAtTime(.02, now(), 2);
    lfo(.03, .01, a.g.gain);   // the Mist breathes, very slowly
    const low = ctx.createOscillator(); low.type = 'sine'; low.frequency.value = 42;
    const lg = ctx.createGain(); lg.gain.value = .01; low.connect(lg); lg.connect(out); low.start();
    return baseLayer(out, [a.src, low]);
  },
};

/* ---- The cues: one-shot stingers ---- */
const CUE_BUILD = {
  thunder(){
    const t = now();
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(90, t + 2.5);
    const g = ctx.createGain(); g.gain.value = 0; n.connect(f); f.connect(g); g.connect(master);
    n.start(t, Math.random()); n.stop(t + 3); env(g, t, .02, .9, 2.8);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(75, t); o.frequency.exponentialRampToValueAtTime(28, t + 2.5);
    const og = ctx.createGain(); og.gain.value = 0; o.connect(og); og.connect(master);
    o.start(t); o.stop(t + 2.6); env(og, t, .02, .5, 2.4);
  },
  scream(){
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(520, t + 1.1);
    const vib = ctx.createOscillator(); vib.frequency.value = 6;
    const vg = ctx.createGain(); vg.gain.value = 30; vib.connect(vg); vg.connect(o.frequency);
    vib.start(t); vib.stop(t + 1.2);
    const dl = ctx.createDelay(1); dl.delayTime.value = .35;
    const fb = ctx.createGain(); fb.gain.value = .3; dl.connect(fb); fb.connect(dl);
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(master); g.connect(dl); dl.connect(master);
    o.start(t); o.stop(t + 1.2); env(g, t, .08, .22, 1);
  },
  door(){
    const t = now();
    const thump = (at, vol) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 70;
      const g = ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(master);
      o.start(at); o.stop(at + .3); env(g, at, .005, vol, .25);
    };
    thump(t, .5);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 280; f.Q.value = 1.5;
    const g = ctx.createGain(); g.gain.value = 0; n.connect(f); f.connect(g); g.connect(master);
    n.start(t, Math.random()); n.stop(t + .15); env(g, t, .002, .3, .12);
    thump(t + .4, .25);   // the slam echoing up the stairs
  },
  bell(){
    const t = now(), f0 = 196;
    for (let toll = 0; toll < 3; toll++){
      const at = t + toll * 1.4;
      [[1, .5, 5], [2, .25, 3.5], [2.4, .2, 3], [3, .14, 2.4], [4.2, .1, 1.6], [5.4, .06, 1]].forEach(([m, a, d]) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f0 * m * (1 + (Math.random() - .5) * .004);
        const g = ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(master);
        o.start(at); o.stop(at + d + .1); env(g, at, .005, a, d);
      });
    }
  },
  raven(){
    const t = now();
    for (let caw = 0; caw < 2; caw++){
      const at = t + caw * .35;
      for (let p = 0; p < 3; p++){
        const n = ctx.createBufferSource(); n.buffer = noiseBuf;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 5;
        const g = ctx.createGain(); g.gain.value = 0; n.connect(f); f.connect(g); g.connect(master);
        n.start(at + p * .06, Math.random()); n.stop(at + p * .06 + .06); env(g, at + p * .06, .002, .3, .05);
      }
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(180, at); o.frequency.exponentialRampToValueAtTime(120, at + .18);
      const g = ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(master);
      o.start(at); o.stop(at + .2); env(g, at, .01, .2, .18);
    }
  },
  'wolf-close'(){
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(480, t);
    o.frequency.exponentialRampToValueAtTime(820, t + 1);
    o.frequency.exponentialRampToValueAtTime(380, t + 2.6);
    const vib = ctx.createOscillator(); vib.frequency.value = 5.5;
    const vg = ctx.createGain(); vg.gain.value = 12; vib.connect(vg); vg.connect(o.frequency);
    vib.start(t); vib.stop(t + 2.7);
    const dl = ctx.createDelay(1); dl.delayTime.value = .4;
    const fb = ctx.createGain(); fb.gain.value = .25; dl.connect(fb); fb.connect(dl);
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(master); g.connect(dl); dl.connect(master);
    o.start(t); o.stop(t + 2.7); env(g, t, .5, .3, 2.1);
  },
  'heart-stop'(){
    const t = now();
    [0, .9, 2.2, 4.2].forEach((dt, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 55;
      const g = ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(master);
      o.start(t + dt); o.stop(t + dt + .2); env(g, t + dt, .008, i === 3 ? .2 : .5, .16);
    });
  },
  laugh(){
    // The Count's laugh, built from nothing: three low chuckles, the last
    // falling away, with a long cold tail. Original synthesis, no recording.
    const t = now();
    [0, .34, .68].forEach((dt, i) => {
      const at = t + dt;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(i === 2 ? 70 : 95, at);
      o.frequency.exponentialRampToValueAtTime(i === 2 ? 55 : 82, at + .28);
      const am = ctx.createOscillator(); am.frequency.value = 7;
      const amg = ctx.createGain(); amg.gain.value = .5;
      const ag = ctx.createGain(); ag.gain.value = .5;
      am.connect(amg); amg.connect(ag.gain);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 320; f.Q.value = 2;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(ag); ag.connect(f); f.connect(g); g.connect(master);
      o.start(at); o.stop(at + .32); am.start(at); am.stop(at + .32);
      env(g, at, .03, .35, .28);
    });
    const dl = ctx.createDelay(1); dl.delayTime.value = .4;
    const fb = ctx.createGain(); fb.gain.value = .4; dl.connect(fb); fb.connect(dl);
    dl.connect(master);
    const tail = ctx.createOscillator(); tail.type = 'sine'; tail.frequency.value = 60;
    const tg = ctx.createGain(); tg.gain.value = 0; tail.connect(tg); tg.connect(dl);
    tail.start(t + .9); tail.stop(t + 2.5); env(tg, t + .9, .1, .12, 1.4);
  },
};

/* ---- The mix: what the DM hears, and what the table hears ---- */
let mix = {};   // layer id -> volume 0..1 (the DM's mix, the source of truth)
let stopTimers = new Map();
const holding = () => !prefs().mapChooses;
const currentDread = () => prefs().followGaze ? (state?.dread ?? 1) : prefs().dread;

function buildLayer(id){
  resumeCtx();
  if (!ctx) return null;
  const inst = LAYER_BUILD[id]();
  if (!inst) return null;
  live.set(id, inst);
  return inst;
}
function applyMix(targets, fade = FADE){
  if (!ctx && !ensureCtx()) return;   // no audio here, but the mix is still recorded below
  for (const l of LAYERS){
    const target = Math.max(0, Math.min(1, targets[l.id] || 0));
    let inst = live.get(l.id);
    if (target > 0){
      if (!inst) inst = buildLayer(l.id);
      if (!inst) continue;
      const timer = stopTimers.get(l.id);
      if (timer){ clearTimeout(timer); stopTimers.delete(l.id); }
      inst.setVolume(target, fade);
    } else if (inst){
      inst.setVolume(0, fade);
      if (!stopTimers.has(l.id)){
        const timer = setTimeout(() => {
          stopTimers.delete(l.id);
          const cur = live.get(l.id);
          if (cur){ cur.stop(); live.delete(l.id); }
        }, fade * 1000 + 600);
        stopTimers.set(l.id, timer);
      }
    }
  }
}
function applyDread(){
  const d = currentDread();
  for (const inst of live.values()) inst.setDread?.(d);
}
function sendMix(fade = FADE){
  if (ui.role !== 'dm' || !holding()) return;
  const layers = Object.fromEntries(Object.entries(mix).filter(([, v]) => v > 0));
  const msg = { t:'soundscape', layers, scene:currentScene, fade };
  sent.push(msg);
  try { toPlayers(msg, 'dm'); } catch (e) { console.warn(e); }
}
let sendTimer = null;
function sendMixSoon(fade = .5){
  clearTimeout(sendTimer);
  sendTimer = setTimeout(() => sendMix(fade), 300);   // a fader drag sends once, not on every tick
}
function playCue(id){
  if (!CUE_BUILD[id]) return false;
  resumeCtx();
  if (!ctx) return false;
  try { CUE_BUILD[id](); } catch (e) { console.warn(e); return false; }
  lastCue = id; cueLog.push({ id, at:Date.now() });
  return true;
}
function fireCue(id){
  playCue(id);
  if (ui.role !== 'dm') return;
  const msg = { t:'soundcue', id };
  sent.push(msg);
  try { toPlayers(msg, 'dm'); } catch (e) { console.warn(e); }
}

/* ---- What the table hears: the receivers Claude's hook will call ---- */
function onSoundscape(m){
  if (ui.role === 'dm' && !ui.screen) return;   // the DM hears their own board directly
  if (!ui.screen){
    const p = tablePref();
    if (p === 'off' || p === 'cues') return;   // cues only, or nothing
  }
  currentScene = m.scene || null;
  currentMix = { ...(m.layers || {}) };
  applyMix(currentMix, m.fade ?? FADE);
  renderPlayerLine();
}
function onSoundcue(m){
  if (ui.role === 'dm' && !ui.screen) return;
  if (!ui.screen && tablePref() === 'off') return;
  playCue(m.id);
}

/* ---- The board's own UI ---- */
let sheet = null;
const sheetOpen = () => !!sheet && !sheet.classList.contains('hidden');
const WAVE = `<svg class="ss-wave" viewBox="0 0 60 16" aria-hidden="true"><polyline points="0,8 4,8 6,3 8,13 10,8 14,8 16,5 18,11 20,8 24,8 26,2 28,14 30,8 34,8 36,6 38,10 40,8 44,8 46,4 48,12 50,8 54,8 56,7 58,9 60,8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;

function layerRow(l){
  const v = mix[l.id] || 0;
  return `<div class="ss-layer" data-layer="${l.id}">
    <span class="ss-layer-icon" aria-hidden="true">${l.icon}</span>
    <span class="ss-layer-name">${esc(l.name)}</span>
    <input type="range" class="ss-fader" data-fader="${l.id}" min="0" max="100" value="${Math.round(v * 100)}" aria-label="${esc(l.name)} volume">
    <button class="btn small ss-mute" data-mute="${l.id}" title="${v > 0 ? 'Mute' : 'Unmute'}">${v > 0 ? '🔊' : '🔇'}</button>
  </div>`;
}
function sceneTile(s, custom = false){
  return `<button class="btn ss-scene" data-scene="${esc(s.name)}" data-custom="${custom ? '1' : ''}">${WAVE}<span>${esc(s.name)}</span>${custom ? `<span class="ss-scene-del" data-del-scene="${esc(s.name)}" title="Delete this scene">✕</span>` : ''}</button>`;
}
function buildSheet(){
  sheet = document.createElement('div');
  sheet.id = 'soundscapeSheet';
  sheet.className = 'modal hidden';
  sheet.innerHTML = `<div class="box soundscape-board">
    <div class="ss-head"><h2>🎻 The Soundscape</h2><button class="btn small" data-act="ssClose" title="Close">✕</button></div>
    <div id="ssDm">
      <p class="muted ss-note">Everything here is generated in code — no sound files, it works offline. Volume follows the Look panel.</p>
      <div class="ss-toggles">
        <label class="ss-toggle"><input type="checkbox" id="ssMapChooses"> Let the map choose</label>
        <label class="ss-toggle"><input type="checkbox" id="ssFollowGaze"> Follow his Gaze</label>
        <label class="ss-dread">Dread <input type="range" id="ssDread" min="1" max="10" step="1" value="3"> <span id="ssDreadVal">3</span></label>
      </div>
      <div class="ss-layers">${LAYERS.map(layerRow).join('')}</div>
      <h3>Scenes</h3>
      <div class="ss-scenes" id="ssScenes"></div>
      <div class="ss-save"><input class="txt" id="ssSceneName" type="text" placeholder="Name this mix…" aria-label="Scene name"><button class="btn" data-act="ssSaveScene">Save current mix</button></div>
      <h3>Cues</h3>
      <div class="ss-cues">${CUES.map(c => `<button class="btn ss-cue" data-cue="${c.id}">${c.icon}<span>${esc(c.name)}</span></button>`).join('')}</div>
    </div>
    <div id="ssPlayer" hidden>
      <p class="muted">The DM's board is what your phone plays. Choose how much of it you hear:</p>
      <div class="ss-tablepref" role="radiogroup" aria-label="Table sound">
        <label><input type="radio" name="ssTable" value="off"> Off</label>
        <label><input type="radio" name="ssTable" value="cues"> Cues only</label>
        <label><input type="radio" name="ssTable" value="all"> Everything</label>
      </div>
      <p id="ssNowPlaying" class="ss-now"></p>
    </div>
  </div>`;
  document.body.appendChild(sheet);
  sheet.querySelector('#ssMapChooses').addEventListener('change', e => setMapChooses(e.target.checked));
  sheet.querySelector('#ssFollowGaze').addEventListener('change', e => { savePrefs({ ...prefs(), followGaze:e.target.checked }); syncDread(); applyDread(); });
  sheet.querySelector('#ssDread').addEventListener('input', e => { savePrefs({ ...prefs(), dread:Number(e.target.value) }); syncDread(); applyDread(); });
  sheet.querySelectorAll('[name="ssTable"]').forEach(r => r.addEventListener('change', e => { setTablePref(e.target.value); renderPlayerLine(); }));
  sheet.addEventListener('input', e => {
    const f = e.target.closest('[data-fader]');
    if (!f) return;
    setLayer(f.dataset.fader, Number(f.value) / 100, true);
  });
  sheet.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'ssClose'){ closeBoard(); return; }
    if (act === 'ssSaveScene'){ saveScene(); return; }
    const mute = e.target.closest('[data-mute]');
    if (mute){ toggleMute(mute.dataset.mute); return; }
    const del = e.target.closest('[data-del-scene]');
    if (del){ deleteScene(del.dataset.delScene); return; }
    const scene = e.target.closest('[data-scene]');
    if (scene){ applyScene(scene.dataset.scene); return; }
    const cue = e.target.closest('[data-cue]');
    if (cue){ fireCue(cue.dataset.cue); return; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen()) closeBoard(); });
}
function syncDread(){
  const p = prefs();
  sheet.querySelector('#ssDread').value = p.dread;
  sheet.querySelector('#ssDreadVal').textContent = p.dread;
  sheet.querySelector('#ssDread').disabled = p.followGaze;
}
function renderScenes(){
  sheet.querySelector('#ssScenes').innerHTML =
    SCENES.map(s => sceneTile(s)).join('') + customScenes().map(s => sceneTile(s, true)).join('');
}
function renderPlayerLine(){
  const el = sheet.querySelector('#ssNowPlaying');
  if (!el) return;
  el.textContent = currentScene ? `Now playing: ${currentScene}` : (Object.keys(currentMix).length ? 'Now playing: the DM’s mix' : 'Nothing playing yet.');
  sheet.querySelectorAll('[name="ssTable"]').forEach(r => { r.checked = r.value === tablePref(); });
}
function render(){
  if (!sheet) return;
  const p = prefs();
  const isDm = ui.role === 'dm' && !ui.screen;
  sheet.querySelector('#ssDm').hidden = !isDm;
  sheet.querySelector('#ssPlayer').hidden = isDm;
  if (isDm){
    sheet.querySelector('#ssMapChooses').checked = p.mapChooses;
    sheet.querySelector('#ssFollowGaze').checked = p.followGaze;
    syncDread();
    sheet.querySelectorAll('[data-fader]').forEach(f => { f.value = Math.round((mix[f.dataset.fader] || 0) * 100); });
    sheet.querySelectorAll('[data-mute]').forEach(b => {
      const v = mix[b.dataset.mute] || 0;
      b.textContent = v > 0 ? '🔊' : '🔇'; b.title = v > 0 ? 'Mute' : 'Unmute';
    });
    renderScenes();
  } else renderPlayerLine();
}
export function openBoard(){
  resumeCtx();
  if (!sheet) buildSheet();
  render();
  sheet.classList.remove('hidden');
}
export function closeBoard(){ sheet?.classList.add('hidden'); }

function setLayer(id, v, fromUi = false){
  mix[id] = Math.max(0, Math.min(1, v));
  if (holding()){ applyMix(mix, .4); sendMixSoon(.5); }
  if (!fromUi) render();
  else {   // keep the mute button honest while dragging
    const b = sheet.querySelector(`[data-mute="${id}"]`);
    if (b){ b.textContent = mix[id] > 0 ? '🔊' : '🔇'; b.title = mix[id] > 0 ? 'Mute' : 'Unmute'; }
  }
}
let lastNonZero = {};
function toggleMute(id){
  const v = mix[id] || 0;
  if (v > 0){ lastNonZero[id] = v; setLayer(id, 0); }
  else setLayer(id, lastNonZero[id] || .5);
  render();
}
export function applyScene(name){
  const scene = SCENES.find(s => s.name === name) || customScenes().find(s => s.name === name);
  if (!scene) return false;
  mix = { ...scene.layers };
  currentScene = name;
  if (holding()){ applyMix(mix, FADE); sendMix(FADE); }
  render();
  return true;
}
function saveScene(){
  const input = sheet.querySelector('#ssSceneName');
  const name = input.value.trim();
  if (!name){ toast('Give the mix a name first.'); return; }
  const scenes = customScenes().filter(s => s.name !== name);
  scenes.push({ name, layers:{ ...mix } });
  saveCustomScenes(scenes);
  input.value = '';
  renderScenes();
  toast(`🎻 Scene “${name}” saved.`);
}
function deleteScene(name){
  saveCustomScenes(customScenes().filter(s => s.name !== name));
  renderScenes();
}
function setMapChooses(on){
  const was = prefs().mapChooses;
  savePrefs({ ...prefs(), mapChooses:on });
  ui.soundscapeHolds = !on;   // the flag Claude's main.js line will read (see the PR)
  if (was === on) return;
  if (!on){   // the board takes the sound
    try { setAmbience(null); } catch {}   // stop the map's ambience once; main.js re-asserts it every second until the guard lands
    resumeCtx();
    applyMix(mix, FADE);
    sendMix(FADE);
  } else {   // the map takes it back: fade the board out, the map's ambience resumes on main.js's next tick
    applyMix({}, FADE);
  }
  render();
}

/* ---- Start ---- */
let started = false;
export function ensureSoundscape(){
  if (started) return; started = true;
  ui.soundscapeHolds = !prefs().mapChooses;
  if (!document.getElementById('soundscapeCSS')){
    const st = document.createElement('style'); st.id = 'soundscapeCSS';
    st.textContent = `body.screen #btnSoundscape{display:none!important}
    .modal .box.soundscape-board,.soundscape-board{background:linear-gradient(175deg,#2e2419,#211a12 70%,#1a140e);color:#f3e6c8;border:1px solid #4a3a24;border-radius:14px;padding:18px 20px;font-family:var(--serif);max-width:760px;max-height:86vh;overflow-y:auto;filter:drop-shadow(0 10px 24px rgba(0,0,0,.5))}
    .soundscape-board h2{font-family:var(--serif);font-size:24px;color:#f3e6c8;-webkit-text-fill-color:#f3e6c8;background:none;text-shadow:none}.soundscape-board h2::after,.soundscape-board h2::before{display:none}
    .soundscape-board h3{font-size:17px;color:#e9a54a;margin:14px 0 8px}
    .ss-head{display:flex;align-items:center;gap:8px}.ss-head h2{flex:1}
    .soundscape-board .btn{background:rgba(243,230,200,.08);border-color:rgba(243,230,200,.25);color:#f3e6c8}
    .soundscape-board .btn.primary{background:#4a0d0d;border-color:#4a0d0d;color:#f3e6c8}
    .soundscape-board .muted{color:rgba(243,230,200,.6)}
    .ss-note{margin:0 0 10px}
    .ss-toggles{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:12px;font-size:15px}
    .ss-toggle,.ss-dread{display:flex;align-items:center;gap:6px}
    .ss-dread input{width:110px}
    .ss-layers{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}
    .ss-layer{display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(0,0,0,.25);border:1px solid rgba(243,230,200,.15);border-radius:10px;padding:8px 4px}
    .ss-layer-icon{font-size:20px}
    .ss-layer-name{font-size:12px;text-align:center;line-height:1.25;min-height:30px}
    .ss-fader{writing-mode:vertical-lr;direction:rtl;width:28px;height:104px;accent-color:#e9a54a}
    .ss-mute{background:none;border:0;font-size:16px;cursor:pointer;padding:2px}
    .ss-scenes{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
    .ss-scene{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;font-size:15px;position:relative}
    .ss-wave{width:60px;height:16px;opacity:.8}
    .ss-scene-del{position:absolute;top:2px;right:6px;font-size:12px;opacity:.7;cursor:pointer;padding:2px 4px}
    .ss-save{display:flex;gap:8px;margin-top:10px}
    .ss-save .txt{flex:1;background:rgba(255,255,255,.08);border-color:rgba(243,230,200,.3);color:#f3e6c8}
    .ss-cues{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
    .ss-cue{display:flex;align-items:center;gap:8px;padding:12px 10px;font-size:15px;text-align:left}
    .ss-cue span{flex:1}
    .ss-tablepref{display:flex;flex-direction:column;gap:10px;font-size:17px;margin:12px 0}
    .ss-tablepref label{display:flex;align-items:center;gap:8px}
    .ss-now{font-size:16px;font-style:italic;margin-top:8px}
    @media (max-width:480px){.soundscape-board{padding:14px}.soundscape-board h2{font-size:20px}.ss-layers{grid-template-columns:1fr}.ss-layer{flex-direction:row;gap:10px;padding:8px 10px}.ss-layer-name{flex:1;text-align:left;min-height:0}.ss-fader{writing-mode:horizontal-tb;direction:ltr;width:100%;height:28px;flex:2}.ss-dread input{width:90px}}
    @media (prefers-reduced-motion:reduce){.soundscape-board *{animation:none!important;transition:none!important}}`;
    document.head.appendChild(st);
  }
  if (!$('#btnSoundscape')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnSoundscape'; b.title = 'Soundscape'; b.textContent = '🎻';
    b.onclick = () => openBoard();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
  registerCommands([{ id:'soundscape', n:'Soundscape', hint:'The night’s sound: layered beds, scenes and cues for the table', icon:'🎻', role:'both', run:openBoard }]);
  net.onSoundscape = onSoundscape;   // the table's handler calls these when a mix or cue arrives (see the PR)
  net.onSoundcue = onSoundcue;
  setInterval(() => { if (live.size) applyDread(); }, 1000);   // his Gaze darkens the sound as it rises
  setTimeout(expose, 0);
}

/* The spec's handle on the board: its own window global, because
   window.DreadDelve is the debug module's namespace object and is not
   extensible — assigning to it throws (see the Map Book). */
function expose(){
  if (!window.DreadDelveSoundscape) window.DreadDelveSoundscape = {
    state:() => ({
      ctx:ctx?.state || 'none', holding:holding(), mapChooses:prefs().mapChooses,
      followGaze:prefs().followGaze, dread:currentDread(), scene:currentScene,
      layers:Object.fromEntries(LAYERS.map(l => [l.id, { on:(mix[l.id] || 0) > 0, volume:mix[l.id] || 0, running:live.has(l.id) }])),
      tablePref:tablePref(), sentCount:sent.length, lastCue, cueLog:[...cueLog],
    }),
    layers:LAYERS, scenes:SCENES, cues:CUES,
    openBoard, applyScene, setLayer, setMapChooses, setTablePref,
    fireCue, sendMix, sent, cueLog,
    receiveSoundscape:onSoundscape, receiveSoundcue:onSoundcue,
    reset:() => { mix = {}; currentScene = null; currentMix = {}; sent = []; cueLog = []; lastCue = null; },
  };
}
