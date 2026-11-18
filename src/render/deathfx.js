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
import { sfx } from '../audio/sound.js';

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
const deathKind = new Map();   // (worked out once per creature: what it is doesn't change)
export const deathOf = t => { const k = `${t?.bid}|${t?.name}|${t?.kind}`; let d = deathKind.get(k); if (!d){ d = bloodOf({ tags:BEST[t?.bid]?.tags, name:t?.name, kind:t?.kind }).death; deathKind.set(k, d); } return d; };

function remnant(parent, at, col, size, opacity = .85, ms = 1600){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map:blotTex, color:col, transparent:true, opacity, depthWrite:false, fog:false, polygonOffset:true, polygonOffsetFactor:-2 }));
  m.position.copy(at).setY(at.y + .07); m.rotation.y = Math.random() * 6.28; m.scale.setScalar(.01); m.renderOrder = 3; parent.add(m);
  left.push({ m, t0:performance.now(), ms, size, op:opacity });
  while (left.length > 30){ const o = left.shift(); o.m.parent?.remove(o.m); o.m.material.dispose(); o.m.geometry.dispose(); }
}
// (soft sprites, not textured points: a point's texture isn't drawn on every device)
function burst(parent, at, col, n, { up = 2, out = 2.5, grav = 6, ms = 1100, size = .1, add = false, lift = .5, spread = .4 } = {}){
  const mat = new THREE.SpriteMaterial({ map:glowTex, color:col, transparent:true, depthWrite:false, fog:false, ...(add ? { blending:THREE.AdditiveBlending } : {}) });
  const g = new THREE.Group(), vel = [];
  for (let i = 0; i < n; i++){
    const sp = new THREE.Sprite(mat); sp.position.set(at.x, at.y + lift + Math.random() * spread, at.z); sp.scale.setScalar(size * (.7 + Math.random() * .6)); sp.renderOrder = 24; g.add(sp);
    const a = Math.random() * 6.283, s = Math.random() * out; vel.push([Math.cos(a) * s, Math.random() * up, Math.sin(a) * s]);
  }
  parent.add(g); bits.push({ p:g, mat, t0:performance.now(), ms, vel, grav, floor:at.y + .05 });
}

/* 🌫 a puff of dust kicked up at the feet: a body hitting the ground, a heavy blow driving someone back, a Dash's first
   stride (render/punch.js, render/trails.js). Low, grey-brown, rolling outward and settling. */
let dusts = 0;
export function dust(parent, at, n = 22, { out = 1.5, ms = 950, size = .26 } = {}){
  if (!parent || !at) return; dusts++;
  burst(parent, at, '#d9ccb0', n, { up:.7, out, grav:.6, ms, size:size * 2, lift:.16, spread:.18 });
}
// a killing blow has landed on `id` (render/punch.js)
export function dies(id){
  const t = tokById(id), tv = tokenViews.get(id); if (!t || !tv?.group?.parent) return;
  const blood = bloodOf({ tags:BEST[t.bid]?.tags, name:t.name, kind:t.kind }), kind = blood.death, parent = tv.group.parent, at = tv.group.position.clone();
  dying.set(id, { kind, t0:performance.now(), blood, parent, at }); made++;
  // and what it sounds like: the Seep's wet burst, bone and dust, a last whisper, a swarm's skitter, straw going up
  const snd = { melt:'burst', crumble:'crunch', fade:'whisper', scatter:'skitter', burn:'rise' }[kind]; if (snd) sfx(snd, false);
  if (kind === 'fall'){ if (blood.splat) setTimeout(() => remnant(parent, at, blood.color, 1.5, .8, 2600), 450); setTimeout(() => dust(parent, at, 30, { out:2 }), 420); }   // (and the dust as it lands)
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
    if (hide !== !!g.userData.unbodied || (hide && g.children.some(c => c.visible))){ for (const c of g.children) c.visible = !hide; g.userData.unbodied = hide; }
  }
  for (let i = bits.length - 1; i >= 0; i--){
    const b = bits[i], k = (now - b.t0) / b.ms, dt = Math.min(.05, Math.max(.008, (now - (b.last || b.t0)) / 1000)); b.last = now;
    if (k >= 1){ b.p.parent?.remove(b.p); b.mat.dispose(); bits.splice(i, 1); continue; }
    const kids = b.p.children;
    for (let j = 0; j < b.vel.length; j++){ const v = b.vel[j], q = kids[j].position; v[1] -= b.grav * dt; q.x += v[0] * dt; q.y = Math.max(b.floor, q.y + v[1] * dt); q.z += v[2] * dt; if (q.y <= b.floor){ v[0] *= .85; v[2] *= .85; } }
    b.mat.opacity = k < .6 ? 1 : (1 - k) / .4;
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
export const deathFxCount = () => ({ made, dying:[...dying.values()].map(d => d.kind), left:left.length, dusts });
