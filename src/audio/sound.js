/* SOUND — everything is synthesised with WebAudio (no files, works offline).
   drone(dread)  a low bed that thickens, detunes and starts to throb as the Dread rises
   sfx(name)     grind (the Shift) · toll (the Bellmouth, bells) · skitter (hands) · door · trap · hit · crit · miss ·
                 burst (Bloom/Seep deaths) · whisper · ping · turn · rise · boom (Dread up) · roll (dice)
   The DM's app plays a sound and sends it to the table; players play what they're sent. Browsers only allow
   audio after a tap, so nothing plays until the first click. */
import { gfx, onGfx } from '../render/gfx.js';

let ctx = null, master = null, droneBus = null, sfxBus = null, noiseBuf = null;
const drone = { nodes:null, dread:1 };
let sender = null;
export function onSfx(fn){ sender = fn; }            // the net layer forwards DM sounds to players

function init(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = gfx.volume; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.connect(master);
  droneBus = ctx.createGain(); droneBus.gain.value = gfx.music ? 1 : 0; droneBus.connect(comp);
  sfxBus = ctx.createGain(); sfxBus.gain.value = gfx.sfx ? 1 : 0; sfxBus.connect(comp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); let b = 0;
  for (let i = 0; i < d.length; i++){ const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = b * 3.5; }    // brown-ish noise
  return ctx;
}
export function unlock(){ if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); if (!drone.nodes) startDrone(); }
onGfx(g => { if (!ctx) return; master.gain.setTargetAtTime(g.volume, ctx.currentTime, .1); droneBus.gain.setTargetAtTime(g.music ? 1 : 0, ctx.currentTime, .3); sfxBus.gain.setTargetAtTime(g.sfx ? 1 : 0, ctx.currentTime, .1); });

const now = () => ctx.currentTime;
function noise(dur, filterType, freq, q = 1, gain = .5, at = now()){
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(sfxBus);
  src.start(at, Math.random()); src.stop(at + dur + .1);
  return { src, f, g };
}
function tone(type, freq, dur, gain = .3, at = now(), bus = sfxBus){
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = 0;
  o.connect(g); g.connect(bus); o.start(at); o.stop(at + dur + .1);
  return { o, g };
}
const env = (g, at, a, peak, d, end = 0.0001) => { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(end, at + a + d); };

/* ---------- the drone ---------- */
function startDrone(){
  const out = ctx.createGain(); out.gain.value = 0; out.connect(droneBus);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 3; lp.connect(out);
  const oscs = [55, 55 * 1.004, 82.4].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = i === 2 ? .12 : .2; o.connect(g); g.connect(lp); o.start(); return o; });
  const air = ctx.createBufferSource(); air.buffer = noiseBuf; air.loop = true; const af = ctx.createBiquadFilter(); af.type = 'bandpass'; af.frequency.value = 400; af.Q.value = .7; const ag = ctx.createGain(); ag.gain.value = .05; air.connect(af); af.connect(ag); ag.connect(out); air.start();
  const lfo = ctx.createOscillator(); lfo.frequency.value = .08; const lg = ctx.createGain(); lg.gain.value = 60; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  const trem = ctx.createOscillator(); trem.frequency.value = .5; const tg = ctx.createGain(); tg.gain.value = 0; trem.connect(tg); tg.connect(out.gain); trem.start();
  const high = ctx.createOscillator(); high.type = 'sine'; high.frequency.value = 880; const hg = ctx.createGain(); hg.gain.value = 0; high.connect(hg); hg.connect(droneBus); high.start();
  drone.nodes = { out, lp, oscs, ag, af, trem, tg, high, hg, lfo };
  setDrone(drone.dread);
}
export function setDrone(dread){
  drone.dread = dread;
  if (!ctx || !drone.nodes) return;
  const n = drone.nodes, k = (dread - 1) / 9, t = now();
  n.out.gain.setTargetAtTime(.18 + k * .22, t, 2);
  n.lp.frequency.setTargetAtTime(140 + k * 260, t, 2);
  n.oscs[1].frequency.setTargetAtTime(55 * (1.004 + k * .05), t, 3);           // beats get faster and uglier
  n.oscs[2].frequency.setTargetAtTime(82.4 * (1 - k * .06), t, 3);             // the fifth goes flat
  n.ag.gain.setTargetAtTime(.04 + k * .12, t, 2); n.af.frequency.setTargetAtTime(400 + k * 900, t, 2);
  n.trem.frequency.setTargetAtTime(.4 + k * 2.2, t, 2); n.tg.gain.setTargetAtTime(dread >= 7 ? .06 + (dread - 7) * .04 : 0, t, 2);
  n.hg.gain.setTargetAtTime(dread >= 8 ? .012 * (dread - 7) : 0, t, 3); n.high.frequency.setTargetAtTime(880 + Math.random() * 40, t, 4);
}

/* ---------- ambience: the room's own sound, under the drone ----------
   rain · wind (outdoors, dry) · drips (stone halls) · fire (a tavern's hearth) · water (the Undertow, the cellars) */
const amb = { kind:null, nodes:[], timer:null };
function ambStop(){
  const t = now();
  for (const n of amb.nodes){ try { n.g.gain.setTargetAtTime(0.0001, t, .8); n.src?.stop(t + 3); } catch {} }
  amb.nodes = []; clearInterval(amb.timer); amb.timer = null;
}
function ambNoise(type, freq, q, gain){
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0.0001; src.connect(f); f.connect(g); g.connect(droneBus);
  src.start(now(), Math.random() * 1.5); g.gain.setTargetAtTime(gain, now(), 1.5);
  const n = { src, f, g }; amb.nodes.push(n); return n;
}
const ambBlip = (fn, every, chance) => { amb.timer = setInterval(() => { if (ctx.state === 'running' && Math.random() < chance) fn(); }, every); };
export function setAmbience(kind){
  if (!ctx || kind === amb.kind) return;
  ambStop(); amb.kind = kind;
  if (kind === 'rain'){ ambNoise('highpass', 1800, .4, .06); ambNoise('lowpass', 500, .6, .05); }
  else if (kind === 'wind'){ const w = ambNoise('bandpass', 500, 1.2, .05); const l = ctx.createOscillator(); l.frequency.value = .07; const lg = ctx.createGain(); lg.gain.value = 260; l.connect(lg); lg.connect(w.f.frequency); l.start(); amb.nodes.push({ src:l, g:lg }); }
  else if (kind === 'drips'){ ambNoise('lowpass', 220, .5, .02);
    ambBlip(() => { const t = now(), f = 900 + Math.random() * 900; const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + .06);
      const g = ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(droneBus); o.start(t); o.stop(t + .25); env(g, t, .003, .03 + Math.random() * .03, .18); }, 700, .45); }
  else if (kind === 'fire'){ ambNoise('lowpass', 400, .7, .035);
    ambBlip(() => { const t = now(); const src = ctx.createBufferSource(); src.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500 + Math.random() * 2500;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(droneBus); src.start(t, Math.random()); src.stop(t + .05); env(g, t, .001, .04 + Math.random() * .05, .03); }, 120, .35); }
  else if (kind === 'water'){ ambNoise('lowpass', 300, 1.5, .05); ambNoise('bandpass', 700, 3, .015); }
}

/* ---------- effects ---------- */
const FX = {
  grind(){ const t = now(); const n = noise(2.4, 'bandpass', 120, 2, .9, t); env(n.g, t, .2, .9, 2.1);
    const l = ctx.createOscillator(); l.frequency.value = 9; const lg = ctx.createGain(); lg.gain.value = .5; l.connect(lg); lg.connect(n.g.gain); l.start(t); l.stop(t + 2.5);
    const r = tone('sawtooth', 38, 2.3, .3, t); env(r.g, t, .3, .22, 2); },
  toll(){ const t = now(), f0 = 196;
    [[1, .5, 5], [2, .25, 3.5], [2.4, .2, 3], [3, .14, 2.4], [4.2, .1, 1.6], [5.4, .06, 1]].forEach(([m, a, d]) => { const o = tone('sine', f0 * m * (1 + (Math.random() - .5) * .004), d, a, t); env(o.g, t, .005, a, d); });
    const n = noise(.2, 'highpass', 3000, .5, .3, t); env(n.g, t, .002, .25, .15); },
  skitter(){ const t = now(); for (let i = 0; i < 12; i++){ const at = t + i * (.03 + Math.random() * .05); const n = noise(.05, 'highpass', 2500 + Math.random() * 2000, 2, .3, at); env(n.g, at, .002, .2 + Math.random() * .2, .04); } },
  door(){ const t = now(); const o = tone('sawtooth', 160, 1, .2, t); o.o.frequency.setValueAtTime(140, t); o.o.frequency.linearRampToValueAtTime(260, t + .45); o.o.frequency.linearRampToValueAtTime(180, t + .8);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6; o.o.disconnect(); o.o.connect(f); f.connect(o.g); env(o.g, t, .05, .14, .85);
    const th = tone('sine', 70, .3, .5, t + .85); env(th.g, t + .85, .005, .4, .25); },
  trap(){ const t = now(); const c = noise(.06, 'highpass', 4000, 1, .5, t); env(c.g, t, .001, .5, .05);
    const m = tone('square', 1800, .15, .1, t + .02); env(m.g, t + .02, .001, .08, .12);
    const th = tone('sine', 60, .5, .6, t + .1); th.o.frequency.exponentialRampToValueAtTime(35, t + .5); env(th.g, t + .1, .005, .6, .4); },
  hit(){ const t = now(); const s = tone('sine', 90, .3, .6, t); s.o.frequency.exponentialRampToValueAtTime(45, t + .25); env(s.g, t, .003, .55, .25);
    const n = noise(.15, 'lowpass', 1200, 1, .4, t); env(n.g, t, .002, .35, .12); },
  crit(){ FX.hit(); const t = now(); const p = tone('triangle', 1320, .6, .2, t + .02); env(p.g, t + .02, .003, .15, .55); },
  miss(){ const t = now(); const n = noise(.35, 'bandpass', 600, 1.5, .3, t); n.f.frequency.setValueAtTime(400, t); n.f.frequency.exponentialRampToValueAtTime(2500, t + .3); env(n.g, t, .05, .25, .28); },
  burst(){ const t = now(); const n = noise(.6, 'lowpass', 1800, 4, .6, t); n.f.frequency.setValueAtTime(1800, t); n.f.frequency.exponentialRampToValueAtTime(150, t + .5); env(n.g, t, .005, .6, .55);
    for (let i = 0; i < 4; i++){ const at = t + .1 + i * .08; const b = tone('sine', 120 + Math.random() * 100, .12, .3, at); b.o.frequency.exponentialRampToValueAtTime(60, at + .1); env(b.g, at, .005, .25, .1); } },
  whisper(){ const t = now(); for (let i = 0; i < 3; i++){ const at = t + i * .35; const n = noise(.6, 'bandpass', 1500 + Math.random() * 1500, 8, .2, at); n.f.frequency.linearRampToValueAtTime(800 + Math.random() * 2000, at + .5); env(n.g, at, .15, .18, .45); } },
  ping(){ const t = now(); const o = tone('sine', 1046, .8, .2, t); env(o.g, t, .005, .15, .7); const o2 = tone('sine', 1568, .6, .1, t + .08); env(o2.g, t + .08, .005, .08, .5); },
  turn(){ const t = now(); const o = tone('triangle', 660, .2, .1, t); env(o.g, t, .003, .08, .18); },
  rise(){ const t = now(); const n = noise(1.2, 'lowpass', 300, 2, .5, t); n.f.frequency.linearRampToValueAtTime(900, t + 1); env(n.g, t, .5, .35, .7); },
  boom(){ const t = now(); const o = tone('sine', 55, 2.5, .8, t); o.o.frequency.exponentialRampToValueAtTime(30, t + 2); env(o.g, t, .02, .7, 2.4); const n = noise(1.5, 'lowpass', 200, 1, .5, t); env(n.g, t, .02, .4, 1.4); },
  roll(){ const t = now(); for (let i = 0; i < 6; i++){ const at = t + i * .045 + Math.random() * .02; const n = noise(.03, 'bandpass', 2000 + Math.random() * 1500, 3, .3, at); env(n.g, at, .001, .3, .025); } },
};
export const SFX_NAMES = Object.keys(FX);
// share = true: the DM's sound is sent to everyone at the table too
const last = {};
export function sfx(name, share = true){
  const t = performance.now(); if (last[name] && t - last[name] < 120) return; last[name] = t;
  if (share && sender) sender(name);
  if (!gfx.sfx || !FX[name]) return;
  if (!init() || ctx.state !== 'running') return;
  try { FX[name](); } catch {}
}
addEventListener('pointerdown', unlock, { once:false, passive:true });
addEventListener('keydown', unlock, { once:false });
