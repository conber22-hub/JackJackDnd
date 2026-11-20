/* 🕹 THE HANDHELD: the Wanderer on a phone with no controller, held like an old pocket console. The world is drawn into
   the shell's screen (render/scene.js setViewRect) and the rest of the phone becomes the controller: a D-pad (slide a
   thumb round it, diagonals too), A and B, X and Y, the L and R shoulders, and Select / View / Start. Fingers go
   through the same paths as a gamepad (ui/wander.js): the D-pad is read as a stick every frame, a button is a press.
   It shows by itself on a touch screen with no controller plugged in; the menu's Handheld page turns it on or off,
   picks the shell, and the chunky-pixel screen. Kept per device in this browser. Original design (no real console's
   name or badge).
   Turning it on boots it (an eye opens on a black screen, then the name, with a two-note chime; a press skips it,
   and does nothing else).
   Its buttons click. Select and Start together open the save states (ui/wander.js). In portrait, a fight's bar
   moves out of the screen onto a small second panel under it, so the fight stays in view. The first
   press asks for the whole screen (where the phone allows it; the Handheld page can say no) and the phone is kept
   awake while it's on. The Lantern light by the screen is the hero's health: green, amber, then a quick red blink
   near death; a hit buzzes the phone, harder for a harder hit. */
import { dpadStick, skinWanted, SHELLS } from '../engine/wander-cam.js';
import { SHELL_PACK, injectShells, mountStickers } from './shells.js';
import { setViewRect, view } from '../render/scene.js';
import { ui } from '../engine/state.js';
import { keepAwake } from '../util/wake.js';
import { sfx } from '../audio/sound.js';
import { tune, coachDone } from './hhlife.js';

const KEY = 'dreaddelve.handheld.v1';
// mode, shell, lcd (the pixel screen), full (ask for the whole screen), seeThru (the hole through walls,
// ui/followcam.js), table (at the table, a player's phone is the handheld too: off for the classic screen)
// tips (the coach, ui/hhlife.js), chip (its little tunes)
export const hh = { mode:'auto', shell:'dusk', lcd:false, full:true, seeThru:true, table:true, tips:true, chip:true };
try { Object.assign(hh, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
export function setHandheld(patch){
  Object.assign(hh, patch);
  try { localStorage.setItem(KEY, JSON.stringify({ mode:hh.mode, shell:hh.shell, lcd:hh.lcd, full:hh.full, seeThru:hh.seeThru, table:hh.table, tips:hh.tips, chip:hh.chip })); } catch {}
  if (patch.full === false && wentFull) leaveFull();
  relayout();
}

const NOHOST = { id:'', active:() => false, press:() => {}, legend:() => ({}), health:() => 1, fight:() => false };
let api = NOHOST, on = false, el = null, boot = null, askedFull = false, wentFull = false;
const stick = { x:0, y:0 };
let tapped = null;   // where a finger first came down on the D-pad, kept until a frame has read it (a tap shorter than a frame still steps)
const fingers = new Map();   // pointerId → the control it went down on
const mq = typeof matchMedia !== 'undefined' ? matchMedia('(pointer:coarse)') : null, coarse = () => !!mq?.matches;
export const hhOn = () => on;
// Every shell: the five drawn in index.html and Muse's pack (ui/shells.js)
export const allShells = () => [...SHELLS, ...SHELL_PACK.map(s => ({ k:s.k, label:s.label }))];
// The menu's Shell line: the next one along
export function shellItem(){
  const L = allShells(), k = Math.max(0, L.findIndex(x => x.k === hh.shell)), sh = L[k];
  return { label:`Shell: ${sh.label}`, sub:`${k + 1} of ${L.length} · A for the next`, run:() => setHandheld({ shell:L[(k + 1) % L.length].k }) };
}
// Would this device show it, as things are? (a touch screen with no controller, or turned on)
export const skinWantedHere = () => skinWanted(hh.mode, { coarse:coarse(), pad:padIn() });
export const hhHost = () => on ? api.id : '';   // which is holding it: 'wander' | 'table' | ''
// The D-pad as a stick (for padIntents): { x, y, rx, ry, b }
export const hhPad = () => { const s = stick.x || stick.y ? stick : tapped || stick; tapped = null; return { x:s.x, y:s.y, rx:0, ry:0, b:{} }; };

// What each of the shell's buttons sends (ui/wander.js press). X and Y change with the moment: legend() names them.
const SEND = { a:'a', b:'b', l:'lb', r:'rb', select:'back', view:'rs', start:'start' };

function build(){
  el = document.createElement('div'); el.id = 'handheld'; el.className = 'hidden'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="hh-body">
    <div class="hh-sh"><button class="hh-shoulder l" data-hh="l">L</button><button class="hh-shoulder r" data-hh="r">R</button></div>
    <div class="hh-bezel"><i class="hh-led" title="Lantern"></i><span class="hh-ledl">LANTERN</span>
      <div class="hh-screen" id="hhScreen"></div>
      <div class="hh-brand">DREAD DELVE <em>pocket</em></div></div>
    <div class="hh-sub" id="hhSub"></div>
    <div class="hh-left"><div class="hh-dpad" data-hh="dpad"><i class="up"></i><i class="down"></i><i class="left"></i><i class="right"></i><b></b></div></div>
    <div class="hh-right"><div class="hh-face">
      <button class="hh-k small y" data-hh="y">Y</button><button class="hh-k small x" data-hh="x">X</button>
      <button class="hh-k b" data-hh="b">B</button><button class="hh-k a" data-hh="a">A</button>
      <span class="hh-lg y" data-lg="y"></span><span class="hh-lg x" data-lg="x"></span><span class="hh-lg b" data-lg="b"></span><span class="hh-lg a" data-lg="a"></span></div>
      <div class="hh-grille"></div></div>
    <div class="hh-pills"><button class="hh-pill" data-hh="select"><i></i>SELECT<small data-lg="select"></small></button><button class="hh-pill" data-hh="view"><i></i>VIEW<small data-lg="view"></small></button><button class="hh-pill" data-hh="start"><i></i>START<small data-lg="start"></small></button></div>
  </div>`;
  document.body.appendChild(el);
  injectShells(); mountStickers(el);   // (Muse's shells and the player's stickers, ui/shells.js)
  boot = document.createElement('div'); boot.id = 'hhBoot'; boot.className = 'hidden';
  // an eye opens in the dark (his, watching), then the name
  boot.innerHTML = `<svg class="hh-eye" viewBox="0 0 200 100" aria-hidden="true">
      <defs><radialGradient id="hhIris" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".22" stop-color="#f06a2c"/><stop offset=".62" stop-color="#7a0c18"/><stop offset="1" stop-color="#1c0307"/></radialGradient>
        <clipPath id="hhLid"><path d="M8 50 Q100 -12 192 50 Q100 112 8 50Z"/></clipPath></defs>
      <g class="hh-eye-open"><g clip-path="url(#hhLid)"><rect width="200" height="100" fill="#160608"/>
        <g class="hh-eye-look"><circle cx="100" cy="50" r="31" fill="url(#hhIris)"/><ellipse class="hh-pupil" cx="100" cy="50" rx="5" ry="23" fill="#050102"/><circle cx="91" cy="40" r="3.5" fill="rgba(255,240,220,.55)"/></g></g>
        <path d="M8 50 Q100 -12 192 50 Q100 112 8 50Z" fill="none" stroke="#6a1c1c" stroke-width="2"/></g></svg>
    <div class="hh-boot-name">DREAD DELVE</div><div class="hh-boot-sub">pocket</div>`;
  document.body.appendChild(boot);
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
  if (typeof ResizeObserver !== 'undefined'){ const ro = new ResizeObserver(relayout); ro.observe(el.querySelector('#hhScreen')); ro.observe(el.querySelector('#hhSub')); }
  addEventListener('resize', relayout); addEventListener('orientationchange', () => setTimeout(relayout, 250));
}
const buzz = () => { try { navigator.vibrate?.(8); } catch {} };
function down(e){
  const c = e.target.closest('[data-hh]'); if (!c) return;
  e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch {}
  const k = c.dataset.hh; fingers.set(e.pointerId, { k, c });
  coachDone();
  goFull();
  if (endBoot()){ if (k !== 'dpad'){ c.classList.add('down'); buzz(); } return; }   // (the press that skips the boot does only that)
  if (k === 'dpad'){ thumb(c, e); tapped = stick.x || stick.y ? { x:stick.x, y:stick.y } : null; return; }
  c.classList.add('down'); buzz(); sfx('tick', false);
  // Select and Start together: the save states
  const other = k === 'start' ? 'select' : k === 'select' ? 'start' : null;
  if (other && [...fingers.values()].some(f => f.k === other)){ api.press('states'); return; }
  api.press(k === 'x' || k === 'y' ? api.legend()[k]?.b : SEND[k]);
}
function move(e){ const f = fingers.get(e.pointerId); if (f?.k === 'dpad') thumb(f.c, e); }
function up(e){
  const f = fingers.get(e.pointerId); if (!f) return; fingers.delete(e.pointerId);
  if (f.k === 'dpad'){ stick.x = stick.y = 0; f.c.dataset.dir = ''; } else f.c.classList.remove('down');
}
function thumb(c, e){
  const r = c.getBoundingClientRect(), s = dpadStick(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width / 2);
  const was = `${Math.sign(Math.round(stick.x * 1.4))},${Math.sign(Math.round(stick.y * 1.4))}`;
  stick.x = s.x; stick.y = s.y;
  const dir = [s.y < -.38 && 'up', s.y > .38 && 'down', s.x < -.38 && 'left', s.x > .38 && 'right'].filter(Boolean).join(' ');
  c.dataset.dir = dir;
  if (dir && was !== `${Math.sign(Math.round(s.x * 1.4))},${Math.sign(Math.round(s.y * 1.4))}`) buzz();
}

// Where the HUD, the pop-up cards and the banners go: over the screen, not the whole phone.
const FIT = ['wanderHud', 'tableHud', 'cardLayer', 'hhBoot', 'vignette', 'bloodrim'];
function fit(r){
  for (const id of FIT){ const n = document.getElementById(id); if (!n) continue;
    Object.assign(n.style, r ? { left:`${r.x}px`, top:`${r.y}px`, width:`${r.w}px`, height:`${r.h}px`, right:'auto', bottom:'auto' } : { left:'', top:'', width:'', height:'', right:'', bottom:'' }); }
  const t = document.getElementById('toasts');
  if (t) Object.assign(t.style, r ? { top:`${r.y + 44}px`, left:`${r.x + r.w / 2}px`, maxWidth:`${r.w - 16}px` } : { top:'', left:'', maxWidth:'' });
  // (and where the screen is, for anything else that sits on it: the table's "with the DM…" pill)
  for (const [k, v] of [['x', r?.x], ['y', r?.y], ['w', r?.w], ['h', r?.h]]) r ? document.body.style.setProperty(`--hh-scr-${k}`, `${Math.round(v)}px`) : document.body.style.removeProperty(`--hh-scr-${k}`);
}
function relayout(){
  if (!el || !on) return;
  el.dataset.shell = allShells().some(s => s.k === hh.shell) ? hh.shell : 'dusk';
  document.body.classList.toggle('hh-lcd', !!hh.lcd);
  const b = el.querySelector('#hhScreen').getBoundingClientRect();
  if (b.width < 20 || b.height < 20) return;
  const r = { x:b.left, y:b.top, w:b.width, h:b.height };
  // Pixel: about 200 lines down the screen, whatever the phone's own density (an old handheld had 160)
  setViewRect(r, hh.lcd ? Math.min(1, 200 / (r.h * view.base)) : 1); fit(r);
  // the second panel under the screen (portrait, in a fight): the fight bar goes there
  const sb = el.querySelector('#hhSub').getBoundingClientRect(), sub = sb.width > 40 && sb.height > 40;
  document.body.classList.toggle('hh-subon', sub);
  if (sub) for (const [k, v] of [['x', sb.left], ['y', sb.top], ['w', sb.width], ['h', sb.height]]) document.body.style.setProperty(`--hh-sub-${k}`, `${Math.round(v)}px`);
}
function show(v){
  if (v === on) return; on = v;
  el.classList.toggle('hidden', !v); document.body.classList.toggle('hh', v); document.body.classList.toggle('hh-table', v && api.id === 'table');
  keepAwake(v);
  if (v){ askedFull = false; relayout(); startBoot(); }
  else { stick.x = stick.y = 0; tapped = null; fingers.clear(); endBoot(); document.body.classList.remove('hh-lcd', 'hh-subon'); el.classList.remove('fight'); setViewRect(null); fit(null); if (wentFull) leaveFull(); }
}

/* ---------- switching on ---------- */
// (counted in drawn frames, not the clock: building the map can hold the page up longer than the whole boot)
let bootLeft = 0, bootAt = 0, lastSync = 0;
function startBoot(){
  boot.classList.remove('hidden', 'out'); el.classList.add('booting'); el.dataset.booted = '1';   // (it has been on: a slow page can be past it by the time anyone looks)
  bootLeft = 2300; bootAt = performance.now(); chimed = false;
}
// Any press skips it (the shell's own, a key, a controller's: ui/wander.js press).
// → true if it was booting (that press is spent skipping it)
export const skipBoot = () => endBoot();
function endBoot(){
  if (!boot || !el?.classList.contains('booting')) return false;
  bootLeft = 0; el.classList.remove('booting'); boot.classList.add('out');
  setTimeout(() => { if (!el.classList.contains('booting')) boot.classList.add('hidden'); }, 350);
  return true;
}
let chimed = false;
// The whole screen, once per switching on, from a press (a browser only allows it from one).
function goFull(){
  if (askedFull || !hh.full) return; askedFull = true;
  const d = document.documentElement;
  if (document.fullscreenElement || !d.requestFullscreen) return;
  d.requestFullscreen({ navigationUI:'hide' }).then(() => { wentFull = true; }).catch(() => {});
}
function leaveFull(){ wentFull = false; if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }

/* ---------- a hit ---------- */
// k: how hard (the share of the hero's hit points it took)
export function rumble(k = .2){
  try { navigator.vibrate?.(k > .3 ? [70, 40, 110] : k > .12 ? [60] : [30]); } catch {}   // (📳 a phone buzzes, the shell on or not)
  if (!on) return;
  el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
}
let lastLg = '';
/* ---------- who holds it ----------
   A host is a way of playing one hero: the Wanderer (ui/wander.js) or a player at the table (ui/tablehh.js).
   { id, active(), press(b), legend(), health(), fight() }. Every frame the first active host has the handheld (if the
   device wants it: a touch screen with no controller, or turned on; at the table, unless the classic screen is chosen).
   Hosts read the D-pad themselves (hhPad) in their own frames. */
const hosts = [];
export function addHost(h){ hosts.push({ ...NOHOST, ...h }); if (hosts.length === 1) requestAnimationFrame(loop); }
function loop(now){ requestAnimationFrame(loop); try { syncHandheld(now); } catch (e){ console.warn(e); } }
const padIn = () => [...(navigator.getGamepads?.() || [])].some(g => g && g.connected);
function syncHandheld(now = performance.now()){
  if (!el) build();
  const step = Math.min(120, Math.max(0, now - lastSync)); lastSync = now;
  const want = skinWanted(hh.mode, { coarse:coarse(), pad:padIn() });
  ui.handheld = want;   // (would show while playing: game/wander.js words its first card for it)
  const host = hosts.find(h => h.active() && (h.id !== 'table' || hh.table !== false));
  if (host && host !== api){ if (on) show(false); api = host; lastLg = ''; }
  show(!!host && want);
  if (!on){ api = NOHOST; return; }
  if (bootLeft > 0){ if (!chimed && bootLeft < 1300){ chimed = true; if (hh.chip === false) sfx('chime', false); else tune('boot'); } bootLeft -= step; if (bootLeft <= 0 || now - bootAt > 6000) endBoot(); }
  const fight = !!api.fight();
  if (el.classList.contains('fight') !== fight){ el.classList.toggle('fight', fight); requestAnimationFrame(relayout); }
  const hp = api.health(), lamp = hp > .5 ? 'ok' : hp > .25 ? 'low' : 'dire';
  if (el.dataset.hp !== lamp) el.dataset.hp = lamp;
  const lg = api.legend(), key = JSON.stringify(lg);
  if (key !== lastLg){ lastLg = key; for (const n of el.querySelectorAll('[data-lg]')) n.textContent = lg[n.dataset.lg]?.label || ''; }
}

