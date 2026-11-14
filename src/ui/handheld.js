/* 🕹 THE HANDHELD: the Wanderer on a phone with no controller, held like an old pocket console. The world is drawn into
   the shell's screen (render/scene.js setViewRect) and the rest of the phone becomes the controller: a D-pad (slide a
   thumb round it, diagonals too), A and B, X and Y, the L and R shoulders, and Select / View / Start. Fingers go
   through the same paths as a gamepad (ui/wander.js): the D-pad is read as a stick every frame, a button is a press.
   It shows by itself on a touch screen with no controller plugged in; the menu's Handheld page turns it on or off,
   picks the shell, and the chunky-pixel screen. Kept per device in this browser. Original design (no real console's
   name or badge). */
import { dpadStick, skinWanted, SHELLS } from '../engine/wander-cam.js';
import { setViewRect, view } from '../render/scene.js';
import { ui } from '../engine/state.js';

const KEY = 'dreaddelve.handheld.v1';
export const hh = { mode:'auto', shell:'dusk', lcd:false };
try { Object.assign(hh, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
export function setHandheld(patch){ Object.assign(hh, patch); try { localStorage.setItem(KEY, JSON.stringify({ mode:hh.mode, shell:hh.shell, lcd:hh.lcd })); } catch {} relayout(); }

let api = { press:() => {}, legend:() => ({}) }, on = false, el = null;
const stick = { x:0, y:0 };
const fingers = new Map();   // pointerId → the control it went down on
const mq = typeof matchMedia !== 'undefined' ? matchMedia('(pointer:coarse)') : null, coarse = () => !!mq?.matches;
export const hhOn = () => on;
// The D-pad as a stick (for padIntents): { x, y, rx, ry, b }
export const hhPad = () => ({ x:stick.x, y:stick.y, rx:0, ry:0, b:{} });

// What each of the shell's buttons sends (ui/wander.js press). X and Y change with the moment: legend() names them.
const SEND = { a:'a', b:'b', l:'lb', r:'rb', select:'back', view:'rs', start:'start' };

function build(){
  el = document.createElement('div'); el.id = 'handheld'; el.className = 'hidden'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="hh-body">
    <div class="hh-sh"><button class="hh-shoulder l" data-hh="l">L</button><button class="hh-shoulder r" data-hh="r">R</button></div>
    <div class="hh-bezel"><i class="hh-led" title="Lantern"></i><span class="hh-ledl">LANTERN</span>
      <div class="hh-screen" id="hhScreen"></div>
      <div class="hh-brand">DREAD DELVE <em>pocket</em></div></div>
    <div class="hh-left"><div class="hh-dpad" data-hh="dpad"><i class="up"></i><i class="down"></i><i class="left"></i><i class="right"></i><b></b></div></div>
    <div class="hh-right"><div class="hh-face">
      <button class="hh-k small y" data-hh="y">Y</button><button class="hh-k small x" data-hh="x">X</button>
      <button class="hh-k b" data-hh="b">B</button><button class="hh-k a" data-hh="a">A</button>
      <span class="hh-lg y" data-lg="y"></span><span class="hh-lg x" data-lg="x"></span><span class="hh-lg b" data-lg="b"></span><span class="hh-lg a" data-lg="a"></span></div>
      <div class="hh-grille"></div></div>
    <div class="hh-pills"><button class="hh-pill" data-hh="select"><i></i>SELECT<small data-lg="select"></small></button><button class="hh-pill" data-hh="view"><i></i>VIEW<small data-lg="view"></small></button><button class="hh-pill" data-hh="start"><i></i>START<small data-lg="start"></small></button></div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(relayout).observe(el.querySelector('#hhScreen'));
  addEventListener('resize', relayout); addEventListener('orientationchange', () => setTimeout(relayout, 250));
}
const buzz = () => { try { navigator.vibrate?.(8); } catch {} };
function down(e){
  const c = e.target.closest('[data-hh]'); if (!c) return;
  e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch {}
  const k = c.dataset.hh; fingers.set(e.pointerId, { k, c });
  if (k === 'dpad'){ thumb(c, e); return; }
  c.classList.add('down'); buzz();
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
const FIT = ['wanderHud', 'cardLayer'];
function fit(r){
  for (const id of FIT){ const n = document.getElementById(id); if (!n) continue;
    Object.assign(n.style, r ? { left:`${r.x}px`, top:`${r.y}px`, width:`${r.w}px`, height:`${r.h}px`, right:'auto', bottom:'auto' } : { left:'', top:'', width:'', height:'', right:'', bottom:'' }); }
  const t = document.getElementById('toasts');
  if (t) Object.assign(t.style, r ? { top:`${r.y + 44}px`, left:`${r.x + r.w / 2}px`, maxWidth:`${r.w - 16}px` } : { top:'', left:'', maxWidth:'' });
}
function relayout(){
  if (!el || !on) return;
  el.dataset.shell = SHELLS.some(s => s.k === hh.shell) ? hh.shell : 'dusk';
  document.body.classList.toggle('hh-lcd', !!hh.lcd);
  const b = el.querySelector('#hhScreen').getBoundingClientRect();
  if (b.width < 20 || b.height < 20) return;
  const r = { x:b.left, y:b.top, w:b.width, h:b.height };
  // Pixel: about 200 lines down the screen, whatever the phone's own density (an old handheld had 160)
  setViewRect(r, hh.lcd ? Math.min(1, 200 / (r.h * view.base)) : 1); fit(r);
}
function show(v){
  if (v === on) return; on = v;
  el.classList.toggle('hidden', !v); document.body.classList.toggle('hh', v);
  if (v) relayout(); else { stick.x = stick.y = 0; fingers.clear(); document.body.classList.remove('hh-lcd'); setViewRect(null); fit(null); }
}
let lastLg = '';
/* Every frame from ui/wander.js: playing (the Wanderer is on screen) and whether a controller is plugged in. Shows or
   hides the shell, and keeps the button legends up to date. */
export function syncHandheld(playing, padIn){
  if (!el) build();
  const want = skinWanted(hh.mode, { coarse:coarse(), pad:padIn });
  ui.handheld = want;   // (would show while playing: game/wander.js words its first card for it)
  show(!!playing && want);
  if (!on) return;
  const lg = api.legend(), key = JSON.stringify(lg);
  if (key !== lastLg){ lastLg = key; for (const n of el.querySelectorAll('[data-lg]')) n.textContent = lg[n.dataset.lg]?.label || ''; }
}
// ui/wander.js hands over what a press does and what the buttons are called just now.
export function initHandheld(o){ api = { ...api, ...o }; }
