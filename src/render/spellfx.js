/* ✨ SPELLS, SEEN — what a spell does on the map, in its element's colours (engine/spellfx.js), on every screen:
     · burst (Fireball, Shatter): a ball of it flies from the caster's hands to the spot and goes off: a flash that
       lights everything round, a dome swelling and fading, a shockwave ring along the ground, the ground lit, and
       its motes (embers rising, shards falling, sparks thrown, a cloud that hangs)
     · cone (Burning Hands, a breath): it pours out of the caster across the cone, nearest squares first
     · line (Lightning Bolt): a jagged bolt from the caster down the line, flickering
     · aura (Thunderwave from where they stand): out from the caster all round
     · pillar (Sacred Flame): a column of it comes down on the target
     · darts (Magic Missile): bright darts on curving paths, one after another
     · touch (a heal, a help, a hold, Toll the Dead): it gathers on the one it's on: motes rising, a ring
   A creature caught in an area is knocked away from its middle (render/punch.js setBlast). The game calls spellFx
   (game/combat.js castSpell, and for the table's screens net/table.js 'spellfx'). */
import * as THREE from 'three';
import { scene, wx, wz } from './scene.js';
import { floorViews } from './floors.js';
import { tokenViews } from './minis.js';
import { state, tokById } from '../engine/state.js';
import { groundY } from '../engine/grid.js';
import { spellLook, spellPath, wavesFrom } from '../engine/spellfx.js';
import { setBlast } from './punch.js';
import { gfx } from './gfx.js';

const live = [];
let slow = 1;   // (for looking at it frame by frame: setSpellSlow(8) plays every spell eight times slower)
export function setSpellSlow(k = 1){ slow = Math.max(1, k); }   // { obj, t0, ms, step(k, obj, dt), done() }
let made = 0;
const glowTex = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const add = (obj, ms, step, delay = 0) => { obj.visible = false; scene.add(obj); live.push({ obj, t0:performance.now() + delay * slow, ms, step }); return obj; };
const addMat = o => ({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false, ...o });
// solid colour (on pale stone or snow, light added to light barely shows): the dome, the rings, the ground
const solidMat = o => ({ transparent:true, depthWrite:false, fog:false, ...o });
function dispose(o){ o.traverse(c => { c.geometry?.dispose?.(); if (c.material){ c.material.dispose(); } }); }

// the flash: two lights kept in the scene from the start (adding a light later would rebuild every material: a stall)
// (not on low quality, the phone's setting: every light makes every lit surface dearer to draw)
const flashes = gfx.quality === 'low' ? [] : [0, 1].map(() => { const l = new THREE.PointLight('#ffffff', 0, 12, 1.6); scene.add(l); return { l, t0:0, ms:1, k:0 }; });
function flash(at, col, k, ms = 450){ if (!k || !flashes.length) return; const f = flashes.sort((a, b) => a.t0 - b.t0)[0]; f.l.color.set(col); f.l.position.copy(at).setY(at.y + 1.2); f.t0 = performance.now(); f.ms = ms; f.k = k * 2.2; }

/* ---------- where things are, in the world ---------- */
const sq = (L, x, y, h = 0) => { const fv = floorViews[L], f = state.floors[L]; if (!fv || !f) return null;
  const v = new THREE.Vector3(wx(x), groundY(f, Math.floor(x), Math.floor(y)) + h, wz(y)); return fv.group.localToWorld(v); };
const tokAt = (id, h = .8) => { const tv = tokenViews.get(id); if (!tv?.group?.parent) return null; const v = new THREE.Vector3(); tv.group.getWorldPosition(v); v.y += h; return v; };

/* ---------- the pieces ---------- */
function sprite(col, s){ const m = new THREE.Sprite(new THREE.SpriteMaterial(addMat({ map:glowTex, color:col }))); m.scale.setScalar(s); m.renderOrder = 28; return m; }
// a glowing ball from a to b (an arc), ms; then onLand
function ball(a, b, look, ms, onLand, s = .55){
  const g = new THREE.Group(), core = sprite(look.col, s), halo = sprite(look.col2, s * 2.2); g.add(halo, core);
  const trail = [];
  add(g, ms, k => { const e = k * k * (3 - 2 * k) * .3 + k * .7; g.position.lerpVectors(a, b, e); g.position.y += Math.sin(k * Math.PI) * Math.min(1.6, a.distanceTo(b) * .15);
    if (Math.random() < .7){ const t = sprite(look.col2, s * .7); t.position.copy(g.position); trail.push(t); add(t, 260, q => { t.material.opacity = (1 - q) * .7; t.scale.setScalar(s * .7 * (1 - q * .6)); }); } });
  setTimeout(onLand, ms * slow);
}
function dome(at, r, look, ms = 520){
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), new THREE.MeshBasicMaterial(solidMat({ color:look.col, opacity:.75, side:THREE.DoubleSide })));
  m.position.copy(at); m.renderOrder = 27;
  add(m, ms, k => { const e = 1 - Math.pow(1 - k, 3); m.scale.setScalar(Math.max(.01, r * e)); m.material.opacity = .6 * (1 - k) * (1 - k); m.material.color.set(k < .25 ? look.col : look.col2); });
}
function ring(at, r, col, ms = 600, delay = 0){
  const m = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(solidMat({ color:col, opacity:.9, side:THREE.DoubleSide })));
  m.position.copy(at).setY(at.y + .06); m.renderOrder = 6;
  add(m, ms, k => { const e = 1 - Math.pow(1 - k, 2); m.scale.setScalar(Math.max(.01, r * e)); m.material.opacity = .9 * (1 - k); }, delay);
}
// motes: n particles from `at` in a spread (r), moving as the look says
function motes(at, look, n, r, ms = 1100, delay = 0, dir = null){
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = [];
  const c1 = new THREE.Color(look.col), c2 = new THREE.Color(look.col2);
  for (let i = 0; i < n; i++){
    const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * r;
    pos.set([at.x + Math.cos(a) * d, at.y + Math.random() * .4, at.z + Math.sin(a) * d], i * 3);
    const m = look.motes, sp = .6 + Math.random();
    const v = m === 'rise' ? [(Math.random() - .5) * .4, 1.2 + Math.random() * 1.6, (Math.random() - .5) * .4]
      : m === 'fall' ? [(Math.random() - .5) * 1.4, 2 + Math.random() * 1.5, (Math.random() - .5) * 1.4]
      : m === 'swirl' ? [Math.cos(a + 1.6) * sp, .25 + Math.random() * .4, Math.sin(a + 1.6) * sp]
      : [Math.cos(a) * sp * 3, 1 + Math.random() * 2.5, Math.sin(a) * sp * 3];
    if (dir){ v[0] += dir.x * 3.2; v[2] += dir.z * 3.2; }
    vel.push(v); (Math.random() < .5 ? c1 : c2).toArray(col, i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial(addMat({ size:look.motes === 'swirl' ? .32 : .18, vertexColors:true, map:glowTex }))); p.renderOrder = 26;
  const floor = at.y - .2; let last = 0;
  add(p, ms, k => { const dt = Math.min(.05, (k - last) * ms / 1000); last = k; const A = geo.attributes.position.array;
    for (let i = 0; i < n; i++){ const v = vel[i];
      if (look.motes === 'fall' || look.motes === 'burst') v[1] -= 7 * dt; else if (look.motes === 'swirl'){ v[0] *= .985; v[2] *= .985; }
      A[i * 3] += v[0] * dt; A[i * 3 + 1] = Math.max(floor, A[i * 3 + 1] + v[1] * dt); A[i * 3 + 2] += v[2] * dt; }
    geo.attributes.position.needsUpdate = true; p.material.opacity = k < .7 ? 1 : (1 - k) / .3; }, delay);
}
// the ground under it lit, square by square (waves: in order, gap ms apart)
function groundLit(L, waves, look, gap = 0, ms = 900){
  waves.forEach((w, i) => {
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(.94, .94).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(solidMat({ color:look.col2, opacity:.6 })), w.length);
    const m4 = new THREE.Matrix4();
    w.forEach((s, j) => { const v = sq(L, s.x, s.y, .05); if (v) mesh.setMatrixAt(j, m4.makeTranslation(v.x, v.y, v.z)); });
    mesh.renderOrder = 5;
    add(mesh, ms, k => { mesh.material.opacity = (k < .15 ? k / .15 : (1 - k) / .85) * .6; mesh.material.color.set(k < .2 ? look.col : look.col2); }, i * gap);
  });
}
// a jagged bolt from a to b
class Jag extends THREE.Curve { constructor(pts){ super(); this.p = pts; }
  getPoint(t, out = new THREE.Vector3()){ const n = this.p.length - 1, f = Math.min(n - 1e-6, t * n), i = Math.floor(f); return out.lerpVectors(this.p[i], this.p[i + 1], f - i); } }
function bolt(a, b, look, ms = 420){
  const seed = [];
  for (let s = 0; s < 2; s++){
    const n = Math.max(6, Math.round(a.distanceTo(b) * 1.6)), pts = [];
    for (let i = 0; i <= n; i++){ const v = new THREE.Vector3().lerpVectors(a, b, i / n); if (i && i < n){ const j = seed[i] ||= [(Math.random() - .5) * .5, (Math.random() - .5) * .4, (Math.random() - .5) * .5]; v.x += j[0]; v.y += j[1]; v.z += j[2]; } pts.push(v); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new Jag(pts), n * 3, s ? .045 : .11, 6, false), new THREE.MeshBasicMaterial(s ? addMat({ color:'#ffffff' }) : solidMat({ color:look.col2 }))); m.renderOrder = 28;   // (a solid edge, a white-hot core)
    add(m, ms, k => { m.material.opacity = (Math.random() < .25 ? .3 : 1) * (1 - k); });
  }
}
function pillar(at, look, ms = 900){
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 7, 14, 1, true), new THREE.MeshBasicMaterial(addMat({ color:look.col, side:THREE.DoubleSide })));
  core.position.copy(at).setY(at.y - .8 + 3.5); core.renderOrder = 28; add(core, ms, k => { core.material.opacity = k < .15 ? k / .15 : (1 - k) / .85; });
  const h = 7, m = new THREE.Mesh(new THREE.CylinderGeometry(.42, .55, h, 20, 1, true), new THREE.MeshBasicMaterial(solidMat({ color:look.col2, opacity:.8, side:THREE.DoubleSide })));
  m.position.copy(at).setY(at.y - .8 + h / 2); m.renderOrder = 27;
  add(m, ms, k => { const e = k < .15 ? k / .15 : 1; m.scale.set(.2 + .8 * e * (1 - k * .7), 1, .2 + .8 * e * (1 - k * .7)); m.material.opacity = (k < .15 ? k / .15 : (1 - k) / .85) * .8; });
}

/* ---------- a spell ----------
   fx: { L, by (caster id), at (target id), shape, self, origin:{ x, y } (squares, centred), squares:[index], ty, k, cond, n, darts } */
export function spellFx(fx = {}){
  const L = fx.L ?? tokById(fx.by)?.floor; if (L == null || !floorViews[L] || !state?.floors?.[L]) return;
  const look = spellLook(fx), path = spellPath({ shape:fx.shape, self:fx.self, kind:look.kind, k:fx.k, darts:fx.darts, pillar:look.pillar && !fx.shape });
  const f = state.floors[L], W = f.W, src = tokById(fx.by), tgt = tokById(fx.at);
  const hands = tokAt(fx.by, 1) || (src && sq(L, src.x, src.y, 1)), there = tokAt(fx.at, .8) || (tgt && sq(L, tgt.x, tgt.y, .8));
  const squares = (fx.squares || []).map(i => ({ x:i % W, y:(i / W) | 0 }));
  made++;
  if (path === 'burst' || path === 'aura'){
    const o = fx.origin || (tgt ? { x:tgt.x + .5, y:tgt.y + .5 } : null); if (!o) return;
    const mid = sq(L, o.x - .5, o.y - .5, .2); if (!mid) return;
    const r = Math.max(1.2, Math.sqrt(squares.length || 4) * .62);
    setBlast(L, o);
    const boom = () => { flash(mid, look.col, look.light); dome(mid, r, look); ring(mid, r * 1.15, look.col, 650); if (look.shock > .6) ring(mid, r * 1.5, look.col2, 800, 90);
      groundLit(L, [squares], look); motes(mid, look, 70, r * .8, 1300); if (look.motes === 'rise') motes(mid, look, 40, r * .9, 1800, 200); };
    if (path === 'aura' || !hands) boom(); else ball(hands, mid.clone().setY(mid.y + .5), look, 300, boom);
  } else if (path === 'cone' || path === 'line'){
    if (!src) return;
    const from = { x:src.x + ((src.size || 1) / 2), y:src.y + ((src.size || 1) / 2) };
    setBlast(L, from);
    const waves = wavesFrom(squares, from), far = squares.reduce((b, s) => { const d = Math.hypot(s.x + .5 - from.x, s.y + .5 - from.y); return d > b.d ? { d, s } : b; }, { d:0, s:null });
    if (hands) flash(hands, look.col, look.light * .8, 500);
    if (path === 'line' && far.s){ const end = sq(L, far.s.x, far.s.y, .9); if (hands && end) bolt(hands, end, look); groundLit(L, waves, look, 20, 700); }
    else {
      groundLit(L, waves, look, 55, 900);
      waves.forEach((w, i) => { for (const s of w){ const v = sq(L, s.x, s.y, .3); if (!v) continue; const d = { x:(s.x + .5 - from.x), z:(s.y + .5 - from.y) }, l = Math.hypot(d.x, d.z) || 1;
        motes(v, look, 9, .45, 750, i * 55, { x:d.x / l * .4, z:d.z / l * .4 }); } });
    }
  } else if (path === 'pillar'){
    if (!there) return; const feet = there.clone().setY(there.y - .8);
    flash(there, look.col, look.light, 600); pillar(there, look); ring(feet, 1.1, look.col, 600); motes(feet, look, 40, .5, 1400, 100);
  } else if (path === 'darts'){
    if (!hands || !there) return; const n = Math.max(1, Math.min(6, fx.darts || 3));
    for (let i = 0; i < n; i++) setTimeout(() => { const side = (i - (n - 1) / 2) * .9, mid = new THREE.Vector3().lerpVectors(hands, there, .5);
      const a = hands.clone(), b = there.clone(), sway = new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x).normalize().multiplyScalar(side);
      const g = sprite(look.col, .4); let last = a.clone();
      add(g, 320, k => { const p = new THREE.Vector3().lerpVectors(a, b, k).addScaledVector(sway, Math.sin(k * Math.PI)); p.y += Math.sin(k * Math.PI) * .5; g.position.copy(p);
        const t = sprite(look.col2, .28); t.position.copy(last); last = p.clone(); add(t, 220, q => { t.material.opacity = 1 - q; }); });
      setTimeout(() => { flash(there, look.col, look.light * .5, 250); motes(there, look, 14, .2, 600); }, 320 * slow); void mid; }, i * 110 * slow);
  } else {   // touch
    if (!there) return; const feet = there.clone().setY(there.y - .75);
    if (look.light) flash(there, look.col, look.light * .7, 500);
    ring(feet, .9, look.col, 650); ring(feet, .6, look.col2, 700, 120);
    motes(feet, look, look.kind === 'heal' ? 34 : 24, .45, 1400);
    if (look.kind !== 'heal' && look.kind !== 'help' && hands && fx.by !== fx.at) ball(hands, there, look, 260, () => {}, .35);
  }
}

/* ---------- every frame (main.js) ---------- */
export function tickSpellFx(now = performance.now()){
  for (let i = live.length - 1; i >= 0; i--){
    const e = live[i], k = (now - e.t0) / (e.ms * slow);
    if (k < 0) continue;
    if (k >= 1){ scene.remove(e.obj); dispose(e.obj); live.splice(i, 1); continue; }
    e.obj.visible = true; e.step(k, e.obj);
  }
  for (const f of flashes){ const k = (now - f.t0) / (f.ms * slow); f.l.intensity = k >= 0 && k < 1 ? f.k * (k < .1 ? k / .1 : Math.pow(1 - (k - .1) / .9, 2)) : 0; }
}
// (for the tests: how many spells have been drawn, and how much is on screen now)
export const spellFxCount = () => ({ made, live:live.length });
