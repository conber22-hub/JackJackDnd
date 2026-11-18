/* ☠ HOW IT DIES — a killing blow ends a creature in the way that suits what it was (engine/punch.js bloodOf death), on
   every screen:
     · fall: it drops (render/minis.js), and a dark pool spreads out under it
     · melt (the Seep): it bursts, sags and sinks into a black-green puddle
     · crumble (the walking dead): it sinks into the ground in a cloud of dust, leaving a grey heap
     · fade (ghosts, wisps, the Mist): it lifts into the air, thins to light and is gone
     · scatter (a swarm): it breaks apart, a hundred small dark things flying every way
     · burn (straw): it goes up in sparks and slumps to ash
   Whatever doesn't fall leaves no body on the map (unless it's still deciding: the Seep's Unfinished Death). What's left
   on the ground fades once the fight is over. Called from render/punch.js impact; every frame from main.js. */
import * as THREE from 'three';
import { state, tokById } from '../engine/state.js';
import { BEST } from '../data/bestiary.js';
import { bloodOf } from '../engine/punch.js';
import { tokenViews } from './minis.js';

const glowTex = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const blotTex = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i <= 24; i++){ const a = i / 24 * 6.283, r = 46 + Math.sin(i * 2.7) * 8 + Math.cos(i * 1.3) * 6; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

const dying = new Map();   // id -> { kind, t0, blood, parent, at:Vector3 }
const left = [];           // what's left on the ground: { m, t0, ms, size }
const bits = [];           // particles: { p, t0, ms, vel, grav }
let fadeFrom = 0, made = 0;
export const deathOf = t => bloodOf({ tags:BEST[t?.bid]?.tags, name:t?.name, kind:t?.kind }).death;

function remnant(parent, at, col, size, opacity = .85, ms = 1600){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map:blotTex, color:col, transparent:true, opacity, depthWrite:false, fog:false, polygonOffset:true, polygonOffsetFactor:-2 }));
  m.position.copy(at).setY(at.y + .07); m.rotation.y = Math.random() * 6.28; m.scale.setScalar(.01); m.renderOrder = 3; parent.add(m);
  left.push({ m, t0:performance.now(), ms, size, op:opacity });
  while (left.length > 30){ const o = left.shift(); o.m.parent?.remove(o.m); o.m.material.dispose(); o.m.geometry.dispose(); }
}
function burst(parent, at, col, n, { up = 2, out = 2.5, grav = 6, ms = 1100, size = .1, add = false } = {}){
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++){ pos.set([at.x, at.y + .5 + Math.random() * .4, at.z], i * 3); const a = Math.random() * 6.283, s = Math.random() * out; vel.push([Math.cos(a) * s, Math.random() * up, Math.sin(a) * s]); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color:col, size, map:glowTex, transparent:true, depthWrite:false, fog:false, ...(add ? { blending:THREE.AdditiveBlending } : {}) }));
  p.renderOrder = 24; parent.add(p); bits.push({ p, t0:performance.now(), ms, vel, grav, floor:at.y + .05 });
}

// a killing blow has landed on `id` (render/punch.js)
export function dies(id){
  const t = tokById(id), tv = tokenViews.get(id); if (!t || !tv?.group?.parent) return;
  const blood = bloodOf({ tags:BEST[t.bid]?.tags, name:t.name, kind:t.kind }), kind = blood.death, parent = tv.group.parent, at = tv.group.position.clone();
  dying.set(id, { kind, t0:performance.now(), blood, parent, at }); made++;
  if (kind === 'fall'){ if (blood.splat) setTimeout(() => remnant(parent, at, blood.color, 1.5, .8, 2600), 450); }
  else if (kind === 'melt'){ burst(parent, at, blood.spark, 40, { up:3, out:2.2, ms:900, size:.12 }); burst(parent, at, blood.color, 30, { up:1.5, out:1.4, ms:1200, size:.16 }); setTimeout(() => remnant(parent, at, blood.color, 1.7, .9, 1400), 200); }
  else if (kind === 'crumble'){ burst(parent, at, '#b9b0a0', 50, { up:1.2, out:1.2, grav:1.2, ms:1800, size:.2 }); setTimeout(() => remnant(parent, at, '#6f675b', 1.1, .9, 1400), 300); }
  else if (kind === 'fade'){ burst(parent, at, blood.spark, 36, { up:2.5, out:.6, grav:-1.5, ms:1800, size:.14, add:true }); }
  else if (kind === 'scatter'){ burst(parent, at, '#20161a', 90, { up:3, out:4.5, grav:2, ms:1400, size:.09 }); burst(parent, at, blood.color, 20, { up:1.5, out:2, ms:900, size:.1 }); }
  else if (kind === 'burn'){ burst(parent, at, '#ffb04a', 50, { up:3.5, out:.8, grav:-.5, ms:1700, size:.1, add:true }); setTimeout(() => remnant(parent, at, '#2a2420', 1.1, .9, 1200), 500); }
}

// every frame: the dying, and what doesn't leave a body kept out of sight; the particles; what's left on the ground
export function tickDeathFx(now = performance.now()){
  for (const [id, d] of dying){
    const t = tokById(id), fig = tokenViews.get(id)?.group.userData.fig;
    if (!t || !t.dead){ if (fig){ fig.visible = true; fig.scale.setScalar(1); } dying.delete(id); continue; }   // up again (healed, or the Seep decided)
    if (!fig) continue;
    const k = Math.min(1, (now - d.t0) / (d.kind === 'fade' ? 1400 : d.kind === 'scatter' ? 260 : 1100));
    if (d.kind === 'fall') { if (k >= 1) dying.delete(id); continue; }
    if (t.flags?.rising){ fig.visible = true; continue; }   // Unfinished Death: it's still there, twitching
    const e = k * k * (3 - 2 * k);
    if (d.kind === 'melt'){ fig.scale.set(1 + e * .5, Math.max(.02, 1 - e), 1 + e * .5); fig.position.y = -e * .1; }
    else if (d.kind === 'crumble'){ fig.scale.setScalar(Math.max(.02, 1 - e * .6)); fig.position.y = -e * .9; }
    else if (d.kind === 'fade'){ fig.position.y = e * 1.4; fig.scale.setScalar(Math.max(.02, 1 - e)); }
    else if (d.kind === 'scatter' || d.kind === 'burn'){ fig.scale.setScalar(Math.max(.02, 1 - e)); }
    fig.visible = k < 1; if (k >= 1) dying.delete(id);   // (gone: kept out of sight below)
  }
  // the bodiless dead stay out of sight (a figure rebuilt after a reload, say)
  // (its base and its name go with it: there's nothing there to stand on)
  if (state) for (const t of state.tokens){
    const g = tokenViews.get(t.id)?.group; if (!g) continue;
    const hide = t.dead && !t.flags?.rising && !dying.has(t.id) && deathOf(t) !== 'fall';
    if (hide || g.userData.unbodied){ for (const c of g.children) c.visible = !hide; g.userData.unbodied = hide; }
  }
  for (let i = bits.length - 1; i >= 0; i--){
    const b = bits[i], k = (now - b.t0) / b.ms, dt = .016;
    if (k >= 1){ b.p.parent?.remove(b.p); b.p.geometry.dispose(); b.p.material.dispose(); bits.splice(i, 1); continue; }
    const A = b.p.geometry.attributes.position.array;
    for (let j = 0; j < b.vel.length; j++){ const v = b.vel[j]; v[1] -= b.grav * dt; A[j * 3] += v[0] * dt; A[j * 3 + 1] = Math.max(b.floor, A[j * 3 + 1] + v[1] * dt); A[j * 3 + 2] += v[2] * dt; if (A[j * 3 + 1] <= b.floor){ v[0] *= .85; v[2] *= .85; } }
    b.p.geometry.attributes.position.needsUpdate = true; b.p.material.opacity = k < .6 ? 1 : (1 - k) / .4;
  }
  for (const l of left){ const k = Math.min(1, (now - l.t0) / l.ms), e = 1 - Math.pow(1 - k, 3); l.m.scale.setScalar(Math.max(.01, l.size * e)); }
  // the fight is over: what's left fades into the ground
  if (left.length && !state?.combat?.active){
    if (!fadeFrom) fadeFrom = now;
    const k = (now - fadeFrom - 3000) / 3000;
    if (k >= 1){ for (const l of left.splice(0)){ l.m.parent?.remove(l.m); l.m.material.dispose(); l.m.geometry.dispose(); } }
    else if (k > 0) for (const l of left) l.m.material.opacity = l.op * (1 - k);
  } else fadeFrom = 0;
}
// (for the tests: how many have died on screen, and how)
export const deathFxCount = () => ({ made, dying:[...dying.values()].map(d => d.kind), left:left.length });
