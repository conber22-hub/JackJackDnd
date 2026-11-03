/* THE FOLK — the people of Barovia going about their day: billboard figures on the map, drawn by hand on a canvas
   (like him, in render/omens.js), one look for each role. Who they are and where they go is the folk engine's
   business (src/engine/folk.js: populate, stepFolk; data on each floor as f.folk); this draws them, walks them from
   square to square, and finds the one under a tap. The DM sees a faint red glint over the Count's eyes; players never
   get that (engine/redact.js strips spy). */
import * as THREE from 'three';
import { state, ui } from '../engine/state.js';
import { groundY } from '../engine/grid.js';
import { scene, floorY } from './scene.js';

/* ---------- the looks: a figure for each role, painted on a 96×160 canvas, feet at the bottom middle ---------- */
const SKIN = ['#d9b89a', '#c89c7c', '#a87a5c', '#e3c7ae'];
function figure(x, { coat, trim = '#2a2026', skin = SKIN[0], h = 1, hat = null, prop = null, hunch = 0, hood = false, wide = 1 }){
  const W = 96, H = 160, cx = W / 2, top = H - 140 * h, head = 13 * Math.max(.8, h);
  x.save(); x.translate(cx, H); x.rotate(hunch * .25); x.translate(-cx, -H);
  // a soft shadow at the feet
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx, H - 4, 22 * wide, 5, 0, 0, 7); x.fill();
  // the body: a long coat or dress, shaded down one side
  const g = x.createLinearGradient(cx - 26, 0, cx + 26, 0); g.addColorStop(0, shade(coat, -.25)); g.addColorStop(.55, coat); g.addColorStop(1, shade(coat, -.45));
  x.fillStyle = g; x.strokeStyle = trim; x.lineWidth = 2;
  x.beginPath(); x.moveTo(cx - 13 * wide, top + head * 2); x.quadraticCurveTo(cx - 24 * wide, H - 40, cx - 21 * wide, H - 6); x.lineTo(cx + 21 * wide, H - 6);
  x.quadraticCurveTo(cx + 24 * wide, H - 40, cx + 13 * wide, top + head * 2); x.closePath(); x.fill(); x.stroke();
  // arms
  x.strokeStyle = shade(coat, -.35); x.lineWidth = 7 * Math.max(.7, h); x.lineCap = 'round';
  x.beginPath(); x.moveTo(cx - 12 * wide, top + head * 2.3); x.lineTo(cx - 19 * wide, top + head * 2 + 40 * h); x.stroke();
  x.beginPath(); x.moveTo(cx + 12 * wide, top + head * 2.3); x.lineTo(cx + 19 * wide, top + head * 2 + 40 * h); x.stroke();
  // the head
  x.fillStyle = skin; x.strokeStyle = trim; x.lineWidth = 1.5;
  x.beginPath(); x.ellipse(cx, top + head, head * .8, head, 0, 0, 7); x.fill(); x.stroke();
  if (hood){ x.fillStyle = shade(coat, -.2); x.beginPath(); x.moveTo(cx - head * 1.1, top + head * 1.6); x.quadraticCurveTo(cx, top - head * .6, cx + head * 1.1, top + head * 1.6); x.quadraticCurveTo(cx, top + head * .4, cx - head * 1.1, top + head * 1.6); x.fill(); }
  if (hat) hat(x, cx, top, head);
  x.restore();
  if (prop) prop(x, cx, top, head, h);
}
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
const brim = col => (x, cx, top, head) => { x.fillStyle = col; x.fillRect(cx - head * 1.5, top + head * .3, head * 3, 3); x.fillRect(cx - head * .8, top - head * .5, head * 1.6, head * .9); };
const cap = col => (x, cx, top, head) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, top + head * .35, head * .9, head * .55, 0, Math.PI, 0); x.fill(); };
const helm = (x, cx, top, head) => { x.fillStyle = '#7f8590'; x.beginPath(); x.ellipse(cx, top + head * .5, head * .95, head * .75, 0, Math.PI, 0); x.fill(); x.fillRect(cx - 1.5, top + head * .2, 3, head * .9); };
const staff = (len, col = '#5b4630', knob = null) => (x, cx, top, head, h) => { x.strokeStyle = col; x.lineWidth = 3; x.beginPath(); x.moveTo(cx + 22, top + head * .2 - 6); x.lineTo(cx + 24, 154); x.stroke(); if (knob) knob(x, cx + 22, top + head * .2 - 6); };
const spear = staff(1, '#5b4630', (x, px, py) => { x.fillStyle = '#c9ccd2'; x.beginPath(); x.moveTo(px, py - 14); x.lineTo(px - 4, py); x.lineTo(px + 4, py); x.fill(); });
const fork = (x, cx, top, head) => { x.strokeStyle = '#6a5236'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx + 22, top + 4); x.lineTo(cx + 24, 154); x.stroke(); x.strokeStyle = '#9a9a9a'; x.lineWidth = 2; for (const o of [-4, 0, 4]){ x.beginPath(); x.moveTo(cx + 22 + o, top - 10); x.lineTo(cx + 22 + o * .5, top + 6); x.stroke(); } };
const hammer = (x, cx, top, head, h) => { x.strokeStyle = '#5b4630'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx + 19, top + head * 2 + 38); x.lineTo(cx + 26, top + head * 2 + 18); x.stroke(); x.fillStyle = '#55595f'; x.fillRect(cx + 20, top + head * 2 + 12, 13, 8); };
const pack = (x, cx, top, head) => { x.fillStyle = '#6e5233'; x.strokeStyle = '#2a2026'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(cx - 30, top + head * 2.2, 18, 30, 4); x.fill(); x.stroke(); };
const symbol = (x, cx, top, head) => { x.strokeStyle = '#e6c766'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx, top + head * 2.6); x.lineTo(cx, top + head * 3.8); x.moveTo(cx - 5, top + head * 3); x.lineTo(cx + 5, top + head * 3); x.stroke(); };
const bowl = (x, cx, top, head, h) => { x.fillStyle = '#7a6a58'; x.beginPath(); x.ellipse(cx - 20, top + head * 2 + 42 * h, 7, 3, 0, 0, 7); x.fill(); };
const chains = (x, cx, top, head, h) => { x.strokeStyle = '#8a8d94'; x.lineWidth = 2; x.setLineDash([3, 2]); x.beginPath(); x.moveTo(cx - 19, top + head * 2 + 40 * h); x.lineTo(cx + 19, top + head * 2 + 40 * h); x.stroke(); x.setLineDash([]); };
const scarf = (x, cx, top, head) => { x.fillStyle = '#b8323a'; x.fillRect(cx - 14, top + head * 1.9, 28, 6); x.fillStyle = '#e0a83a'; x.fillRect(cx - 14, top + head * 1.9 + 6, 28, 2); };
function dog(x){
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(48, 156, 26, 4, 0, 0, 7); x.fill();
  x.fillStyle = '#5b4a3a'; x.strokeStyle = '#1e1813'; x.lineWidth = 1.5;
  x.beginPath(); x.ellipse(46, 128, 24, 11, 0, 0, 7); x.fill(); x.stroke();                     // body
  for (const lx of [30, 38, 54, 62]){ x.fillRect(lx, 132, 5, 22); }                                // legs
  x.beginPath(); x.ellipse(72, 116, 10, 9, 0, 0, 7); x.fill(); x.stroke();                        // head
  x.beginPath(); x.moveTo(68, 108); x.lineTo(70, 98); x.lineTo(75, 108); x.fill();                 // ear
  x.strokeStyle = '#5b4a3a'; x.lineWidth = 4; x.beginPath(); x.moveTo(23, 124); x.quadraticCurveTo(14, 112, 18, 104); x.stroke();   // tail
}
const LOOKS = {
  villager: { coat:'#86735f' },
  farmer:   { coat:'#937a4f', hat:brim('#8a7346'), prop:fork },
  smith:    { coat:'#655a52', wide:1.15, prop:hammer, skin:SKIN[1] },
  child:    { coat:'#a5785f', h:.62, skin:SKIN[3] },
  elder:    { coat:'#6f6977', hunch:.35, prop:staff(1), hood:true },
  watch:    { coat:'#55606e', hat:helm, prop:spear },
  priest:   { coat:'#3e3947', hood:true, prop:symbol },
  beggar:   { coat:'#73664f', hunch:.5, prop:bowl, hood:true, skin:SKIN[2] },
  traveller:{ coat:'#5f4a74', prop:scarf, hat:cap('#6b2f3a'), skin:SKIN[2] },
  peddler:  { coat:'#83704a', hat:brim('#4e3b24'), prop:pack },
  pilgrim:  { coat:'#a49a86', hood:true, prop:staff(1) },
  hermit:   { coat:'#666852', hunch:.3, hood:true, prop:staff(1) },
  captive:  { coat:'#83776b', prop:chains, skin:SKIN[0] },
  dog:      'dog',
};
LOOKS.lostChild = LOOKS.child;
const SIZE = { child:[.38, .62], dog:[.56, .46] };   // (an adult stands about as tall as a hero's mini)
// a candle-coloured edge on the side towards the light, so a figure reads against the dark (as the minis' rim light does)
function rim(x, c){
  const src = x.getImageData(0, 0, c.width, c.height), d = src.data, out = x.createImageData(c.width, c.height), o = out.data, W = c.width;
  for (let y = 1; y < c.height - 1; y++) for (let xx = 1; xx < W - 1; xx++){
    const i = (y * W + xx) * 4; if (d[i + 3] < 200) continue;
    if (d[i + 3 - 4] < 60 || d[i + 3 - W * 4] < 60){ o[i] = 255; o[i + 1] = 214; o[i + 2] = 150; o[i + 3] = 150; }   // edge facing up and left
  }
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = c.height; tmp.getContext('2d').putImageData(out, 0, 0);
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(tmp, 0, 0); x.restore();
}
const textures = new Map();
function lookTexture(role, flip){
  const key = `${role}|${flip ? 1 : 0}`; if (textures.has(key)) return textures.get(key);
  const c = document.createElement('canvas'); c.width = 96; c.height = 160; const x = c.getContext('2d');
  if (flip){ x.translate(96, 0); x.scale(-1, 1); }
  const L = LOOKS[role] || LOOKS.villager;
  if (L === 'dog') dog(x); else figure(x, L);
  rim(x, c);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  textures.set(key, tex); return tex;
}
export const FOLK_ROLES = Object.keys(LOOKS);

/* ---------- on the map ---------- */
const group = new THREE.Group(); group.name = 'folk'; scene.add(group);
const views = new Map();   // person id → { sprite, eye, x, y, tx, ty, flip }
let eyeTex = null, askTex = null;
function askTexture(){
  if (askTex) return askTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#e8b938'; x.strokeStyle = '#2a2026'; x.lineWidth = 4;
  x.beginPath(); x.arc(32, 32, 26, 0, 7); x.fill(); x.stroke();
  x.fillStyle = '#2a2026'; x.font = 'bold 40px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 32, 34);
  return (askTex = new THREE.CanvasTexture(c));
}
function eyeTexture(){
  if (eyeTex) return eyeTex;
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 1, 16, 16, 15); g.addColorStop(0, 'rgba(255,60,60,1)'); g.addColorStop(1, 'rgba(255,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return (eyeTex = new THREE.CanvasTexture(c));
}
const W0 = () => state.meta.size / 2 - .5;
function makeView(p){
  const [w, h] = SIZE[p.role] || [.5, .84];
  // (drawn colours as they are: the scene's tone mapping would sink them into the dark)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:lookTexture(p.role, false), transparent:true, depthWrite:false, toneMapped:false, alphaTest:.05 }));
  sprite.center.set(.5, 0); sprite.scale.set(w, h, 1); sprite.userData.folkId = p.id; sprite.userData.size = [w, h];
  group.add(sprite);
  return { sprite, eye:null, x:p.x, y:p.y, flip:false };
}
/* Each frame: one figure per person on the floor in view, walking to where the folk engine last put them. */
export function updateFolk(t, dt){
  if (!state){ group.visible = false; return; }
  const f = state.floors[ui.floor], list = (ui.view !== 'stack' && f?.folk) || [];
  group.visible = list.length > 0;
  const live = new Set();
  for (const p of list){
    live.add(p.id);
    let v = views.get(p.id); if (!v){ v = makeView(p); views.set(p.id, v); }
    // walk towards their square (a little over a square a second), turning to face the way they go
    const dx = p.x - v.x, dy = p.y - v.y, d = Math.hypot(dx, dy), step = Math.min(d, dt * 1.3);
    if (d > 3){ v.x = p.x; v.y = p.y; }   // a jump (a new map, a reload): no long walk across it
    else if (d > .001){ v.x += dx / d * step; v.y += dy / d * step; }
    const flip = Math.abs(dx) > .05 ? dx < 0 : v.flip;
    if (flip !== v.flip){ v.flip = flip; v.sprite.material.map = lookTexture(p.role, flip); }
    const moving = d > .02, gx = Math.round(v.x), gy = Math.round(v.y);
    const bob = moving ? Math.abs(Math.sin(t * 9 + p.id.length)) * .05 : Math.sin(t * 1.5 + p.x) * .006;
    v.sprite.position.set(v.x - W0(), floorY(ui.floor) + groundY(f, gx, gy) + bob, v.y - W0());
    v.sprite.material.color.set(p.mood === 'afraid' ? '#b8b4c0' : '#ffffff');
    // ❗ over someone who needs help (game/trade.js troubles; everyone sees it)
    if (p.ask && !v.ask){ v.ask = new THREE.Sprite(new THREE.SpriteMaterial({ map:askTexture(), transparent:true, depthWrite:false, toneMapped:false })); v.ask.scale.set(.32, .32, 1); group.add(v.ask); }
    if (v.ask){ v.ask.visible = !!p.ask; if (p.ask){ v.ask.position.copy(v.sprite.position); v.ask.position.y += v.sprite.userData.size[1] + .28 + Math.sin(t * 3 + p.x) * .04; } }
    // the Count's eyes: a red glint the DM can see, now and then
    const spy = ui.role === 'dm' && p.spy;
    if (spy && !v.eye){ v.eye = new THREE.Sprite(new THREE.SpriteMaterial({ map:eyeTexture(), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending })); v.eye.scale.set(.22, .22, 1); group.add(v.eye); }
    if (v.eye){ v.eye.visible = !!spy; if (spy){ v.eye.position.copy(v.sprite.position); v.eye.position.y += v.sprite.userData.size[1] + .12; v.eye.material.opacity = .35 + .35 * Math.max(0, Math.sin(t * 2 + p.x)); } }
  }
  for (const [id, v] of views) if (!live.has(id)){ group.remove(v.sprite); if (v.eye) group.remove(v.eye); if (v.ask) group.remove(v.ask); v.sprite.material.dispose(); views.delete(id); }
}
/* The person under a tap (the raycaster already aimed by ui/input.js), or null. */
export function pickFolk(raycaster){
  if (!group.visible) return null;
  const hit = raycaster.intersectObjects([...views.values()].map(v => v.sprite), false)[0];
  return hit?.object.userData.folkId || null;
}
