/* ✨ GLINTS AND BUBBLES — the little signs the old pocket-console adventures used to say "there's something here":
     · glints: a twinkle on the ground where something lies that the hero has noticed (game/finds.js glintsSeen)
     · bubbles: a "!" over a creature the moment it sees the party (a beat before the fight), a "?" over the hero when
       something unseen is close, a "…" for a thought; they pop up, hold a moment and fade
   Only the look: none of it changes a rule or what anyone can see. */
import * as THREE from 'three';
import { scene, wx, wz, floorY } from './scene.js';
import { tokenViews } from './minis.js';

let starTex = null;
function star(){
  if (starTex) return starTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, 'rgba(255,248,220,1)'); r.addColorStop(.25, 'rgba(255,226,150,.55)'); r.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,252,235,.95)';
  for (const [w, h] of [[3, 30], [30, 3]]){ g.beginPath(); g.ellipse(32, 32, w, h, 0, 0, Math.PI * 2); g.fill(); }
  starTex = new THREE.CanvasTexture(c); starTex.colorSpace = THREE.SRGBColorSpace;
  return starTex;
}
let group = null, key = '';
export function showGlints(L, list){
  const k = list.length ? `${L}:${list.map(g => `${g.x},${g.y}`).join(';')}` : '';
  if (k === key) return; key = k;
  clearGlints(true);
  if (!list.length) return;
  group = new THREE.Group(); group.name = 'glints';
  for (const g of list){
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:star(), color:'#ffe9a8', transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
    s.position.set(wx(g.x) + .12, floorY(L) + .22, wz(g.y) - .1); s.userData.ph = (g.x * 7 + g.y * 13) % 10; s.renderOrder = 5;
    group.add(s);
  }
  scene.add(group);
}
export function clearGlints(keepKey = false){
  if (group){ scene.remove(group); for (const s of group.children) s.material.dispose(); group = null; }
  if (!keepKey) key = '';
}

/* ---------- bubbles ---------- */
const bubbles = [], texCache = new Map();
function bubbleTex(ch, color){
  const k = ch + color; if (texCache.has(k)) return texCache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(16,10,14,.92)'; g.strokeStyle = color; g.lineWidth = 6;
  g.beginPath(); g.roundRect(14, 10, 100, 86, 26); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(52, 94); g.lineTo(64, 118); g.lineTo(76, 94); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = color; g.font = '900 68px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 56);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache.set(k, t); return t;
}
// A bubble over a token: '!' (seen), '?' (heard), '…'. ms: how long it stays.
export function bubble(id, ch = '!', { color = ch === '!' ? '#ff5a4a' : '#f0d27a', ms = 1300 } = {}){
  const tv = tokenViews.get(id); if (!tv) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:bubbleTex(ch, color), transparent:true, depthTest:false, depthWrite:false }));
  s.position.set(0, 2.05, 0); s.scale.setScalar(.01); s.renderOrder = 20;
  tv.group.add(s);
  bubbles.push({ s, t0:performance.now(), ms });
}
// Every frame: the glints twinkle, the bubbles pop, hold and fade
export function tickGlints(now = performance.now()){
  if (group) for (const s of group.children){ const k = .5 + .5 * Math.sin(now / 260 + s.userData.ph); s.material.opacity = .3 + .7 * k * k; s.scale.setScalar(.28 + .3 * k); s.material.rotation = now / 900 + s.userData.ph; }
  for (let i = bubbles.length - 1; i >= 0; i--){
    const b = bubbles[i], a = (now - b.t0) / b.ms;
    if (a >= 1){ b.s.parent?.remove(b.s); b.s.material.dispose(); bubbles.splice(i, 1); continue; }
    const x = Math.min(1, a / .12), back = 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;   // (an ease-out-back pop)
    b.s.scale.setScalar(Math.max(.01, .78 * back)); b.s.position.y = 2.05 + Math.min(.12, a * .5);
    b.s.material.opacity = a > .8 ? (1 - a) / .2 : 1;
  }
}
