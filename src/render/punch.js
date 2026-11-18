/* 💥 A BLOW FELT ON THE MAP — every figure, whatever it's made of (forged, a model, a paper standee, an old shape):
     · the attacker lunges in to meet the blow (a shot or a spell kicks back a touch instead)
     · at the moment it lands the world holds still for a few hundredths of a second (the hit-stop: figures' swings,
       models' clips and everything here pause), longer for a heavy blow, longer still for a crit
     · the one struck flashes white and is knocked back along the line of the blow, then springs home
     · a slash of light across them (a gold cross on a crit), sparks and blood thrown out the far side, and a splash
       of it left on the ground for the rest of the fight (rot for the Seep; dust for the dead; nothing for a ghost)
     · the camera's view punches in; a crit flashes the screen, and a hero of yours hurt reddens its edges
     · a killing blow: a longer hold, then slow motion, the body thrown back to lie where it falls, and a pale wisp
       rising out of it
     · a miss: they sway aside and back
   The numbers are engine/punch.js; the game says when (game/combat.js animate → minis.js actOn → here, on every
   screen); ui/fightfx.js covers what has no swing (a spell's area). */
import * as THREE from 'three';
import { camera, fx } from './scene.js';
import { gfx } from './gfx.js';
import { tokenViews } from './minis.js';
import { state, tokById } from '../engine/state.js';
import { BEST } from '../data/bestiary.js';
import { impactOf, speedAt, moveAt, bloodOf, lastOfSide } from '../engine/punch.js';
import { dies } from './deathfx.js';

/* ---------- the hit-stop: the world's clock ---------- */
let imp = null, impAt = -1e9, clk = 0, lastNow = 0;
// how fast the world runs right now (0 frozen .. 1): main.js slows figures' swings and clips by it
export const worldSpeed = (now = performance.now()) => speedAt(now - impAt, imp);
function hold(I, now){
  if (gfx.calm) return;   // (calm effects: the world never stops on a blow)
  // a new blow only takes over if it holds longer than what's left of the one under way
  const left = imp ? imp.stop + (imp.slowMs || 0) - (now - impAt) : 0;
  if (I.stop + I.slowMs > left){ imp = I; impAt = now; }
}

/* ---------- moves: lunge, knock, dodge ---------- */
const moves = new Map();   // id -> [{ kind, t0 (world clock), ms, amp, dx, dz, back }]
const dirOf = (from, to) => {
  const a = tokById(from), b = tokById(to); if (!a || !b || a.id === b.id) return null;
  const dx = (b.x + ((b.size || 1) - 1) / 2) - (a.x + ((a.size || 1) - 1) / 2), dz = (b.y + ((b.size || 1) - 1) / 2) - (a.y + ((a.size || 1) - 1) / 2), l = Math.hypot(dx, dz) || 1;
  return { x:dx / l, z:dz / l };
};
// ✨ a spell's area just went off (render/spellfx.js): what it catches is knocked away from its middle
let blast = null;
export function setBlast(L, o){ blast = { L, x:o.x, y:o.y, at:performance.now() }; }
function blastDir(id){
  const t = tokById(id); if (!t || !blast || blast.L !== t.floor || performance.now() - blast.at > 1500) return null;
  const dx = t.x + (t.size || 1) / 2 - blast.x, dz = t.y + (t.size || 1) / 2 - blast.y, l = Math.hypot(dx, dz);
  return l < .2 ? null : { x:dx / l, z:dz / l };
}
// a spell's own colours for the blow (Fire Bolt lands in fire): its sparks, and the slash's light
const EL = { fire:'#ffb04a', cold:'#d8f3ff', lightning:'#eef4ff', thunder:'#e6e2ff', force:'#d9c2ff', radiant:'#fff6c8', necrotic:'#b5ff9a', acid:'#d9ff6a', poison:'#a8f070', psychic:'#ffb3ec' };
function addMove(id, m){ if (!moves.has(id)) moves.set(id, []); moves.get(id).push({ t0:clk, ...m }); }

/* ---------- flashes: every mesh of the figure white for an instant ---------- */
const white = new THREE.MeshBasicMaterial({ color:'#ffffff' }), pale = new THREE.MeshBasicMaterial({ color:'#ffd8d0' });
const flashes = [];
function flash(id, ms, crit){
  const fig = tokenViews.get(id)?.group.userData.fig; if (!fig || !ms) return;
  const until = performance.now() + ms;
  fig.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || o.userData.punchOrig) return;
    o.userData.punchOrig = o.material; o.material = crit ? white : pale; flashes.push({ o, until });
  });
}

/* ---------- the slash, the sparks, the splash, the wisp ---------- */
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
// a splash on the ground, a few shapes to choose from
const splatTex = [0, 1, 2].map(seed => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(64, 64, 26 + rnd() * 8, 0, 7); g.fill();
  for (let i = 0; i < 9; i++){ const a = rnd() * 6.28, d = 24 + rnd() * 30, r = 4 + rnd() * 10; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r, 0, 7); g.fill(); }
  for (let i = 0; i < 14; i++){ const a = rnd() * 6.28, d = 40 + rnd() * 20; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 1.5 + rnd() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});
const arcGeo = new THREE.RingGeometry(.3, .62, 28, 1, -1.2, 2.4), splatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const bits = [];    // { obj, t0 (world clock), ms, kind, ... } — arcs, sparks, glows, wisps
const splats = [];  // the fight's splashes, cleared when it ends
let fadeFrom = 0;
let made = { impacts:0, kills:0, dodges:0, lunges:0, splats:0, aims:0, lasts:0 };
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

function at(id){ const tv = tokenViews.get(id); if (!tv?.group?.parent) return null; return { tv, parent:tv.group.parent, pos:tv.group.position.clone() }; }
function slash(P, dir, crit, color){
  const n = crit ? 2 : 1;
  for (let i = 0; i < n; i++){
    const m = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color, transparent:true, depthWrite:false, depthTest:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending }));
    m.position.copy(P.pos).setY(P.pos.y + .72); m.renderOrder = 26;
    // the arc faces whoever struck (or the camera when no one did), tilted like a swing
    if (dir) m.lookAt(tmp.copy(m.position).addScaledVector(tmp2.set(-dir.x, 0, -dir.z), 1)); else m.quaternion.copy(camera.quaternion);
    const tilt = (crit ? (i ? -.8 : .8) : (Math.random() - .5) * 1.4);
    m.rotateZ(tilt); P.parent.add(m);
    bits.push({ obj:m, t0:clk + i * 30, ms:crit ? 260 : 200, kind:'arc', spin:crit ? 1.4 : 1.1 * Math.sign(tilt || 1) });
  }
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color, transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  g.position.copy(P.pos).setY(P.pos.y + .75); g.renderOrder = 27; P.parent.add(g);
  bits.push({ obj:g, t0:clk, ms:crit ? 220 : 150, kind:'glow', s:crit ? 1.6 : 1 });
}
function spray(P, dir, blood, crit, kill){
  const n = crit || kill ? 30 : 16, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  const col = new Float32Array(n * 3), c1 = new THREE.Color(blood.spark), c2 = new THREE.Color(blood.color);
  for (let i = 0; i < n; i++){
    pos.set([P.pos.x, P.pos.y + .75, P.pos.z], i * 3);
    const sp = 1.6 + Math.random() * (crit ? 3.2 : 2.2), a = (Math.random() - .5) * 1.6;
    const bx = dir ? dir.x : Math.cos(i), bz = dir ? dir.z : Math.sin(i);
    const vx = bx * Math.cos(a) - bz * Math.sin(a), vz = bx * Math.sin(a) + bz * Math.cos(a);
    vel.push(new THREE.Vector3(vx * sp, 1 + Math.random() * 2.4, vz * sp));
    (i % 3 ? c2 : c1).toArray(col, i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ size:.09, vertexColors:true, transparent:true, depthWrite:false, fog:false }));
  p.renderOrder = 24; P.parent.add(p);
  bits.push({ obj:p, t0:clk, ms:520, kind:'spray', vel, floor:P.pos.y + .04 });
}
function splat(P, dir, blood, big){
  if (!blood.splat) return;
  const m = new THREE.Mesh(splatGeo, new THREE.MeshBasicMaterial({ map:splatTex[(Math.random() * 3) | 0], color:blood.color, transparent:true, opacity:.85, fog:false, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 }));
  const d = .4 + Math.random() * .3;   // thrown out behind them, clear of their feet
  m.position.set(P.pos.x + (dir ? dir.x * d : 0) + (Math.random() - .5) * .15, P.pos.y + .065, P.pos.z + (dir ? dir.z * d : 0) + (Math.random() - .5) * .15);
  m.rotation.y = Math.random() * 6.28; m.renderOrder = 3;
  const s = (big ? .95 : .6) + Math.random() * .25; m.scale.setScalar(.01); P.parent.add(m);
  splats.push(m); bits.push({ obj:m, t0:clk, ms:180, kind:'splat', s }); made.splats++;
  while (splats.length > 48){ const o = splats.shift(); o.parent?.remove(o); o.material.dispose(); }
}
function wisp(P, color){
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  g.position.copy(P.pos).setY(P.pos.y + .4); g.renderOrder = 27; P.parent.add(g);
  bits.push({ obj:g, t0:clk + 250, ms:1500, kind:'wisp', y0:P.pos.y + .4 });
}

// a ring of force running out across the ground from P (the last blow): to `size` tiles across over ms (real time:
// it runs on through the slow motion, so it reads as the moment's own), starting `delay` ms on
const rings = [];
function shockRing(P, color, size, ms, delay = 0){
  const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0, depthWrite:false, fog:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 56).rotateX(-Math.PI / 2), mat);
  m.position.copy(P.pos).setY(P.pos.y + .09); m.scale.setScalar(.05); m.renderOrder = 8; P.parent.add(m);
  rings.push({ m, t0:performance.now() + delay, ms, size });
}

/* ---------- the screen and the camera ---------- */
let screenEl = null;
function screen(kind){
  if (typeof document === 'undefined' || gfx.calm) return;
  if (!screenEl){ screenEl = document.createElement('div'); screenEl.id = 'punchScreen';
    Object.assign(screenEl.style, { position:'fixed', inset:'0', pointerEvents:'none', zIndex:'6', opacity:'0' }); document.body.appendChild(screenEl); }
  const S = {
    crit: ['radial-gradient(circle at 50% 50%, rgba(255,240,200,.38), rgba(255,220,140,.12) 60%, rgba(0,0,0,0))', 180],
    kill: ['radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(20,0,4,.55))', 650],
    hurt: ['radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(200,10,20,.5))', 520],
    down: ['radial-gradient(circle at 50% 50%, rgba(60,0,0,.15) 20%, rgba(150,0,10,.75))', 1100],
  }[kind]; if (!S) return;
  screenEl.style.background = S[0];
  screenEl.getAnimations?.().forEach(a => a.cancel());
  screenEl.animate?.([{ opacity:1 }, { opacity:kind === 'kill' ? .8 : 0, offset:kind === 'kill' ? .5 : 1 }, { opacity:0 }], { duration:S[1], easing:'ease-out' });
}
let kick = null, baseFov = null;
function fovKick(deg, ms = 300){ if (!deg || gfx.calm) return; if (baseFov == null) baseFov = camera.fov; kick = { at:performance.now(), ms, deg:Math.max(deg, kick && performance.now() - kick.at < 120 ? kick.deg : 0) }; }

/* ---------- what the game calls ---------- */
let mine = () => false;
// which figures are the one watching this screen (their hero): their hurts redden the screen's edges
export function setMine(fn){ mine = fn || (() => false); }

// the attacker: in to meet the blow (ranged: a kick back)
export function lunge(id, targetId, { ranged = false } = {}){
  const d = dirOf(id, targetId); if (!d) return;
  addMove(id, { kind:ranged ? 'knock' : 'lunge', ms:ranged ? 380 : 620, amp:ranged ? -.08 : .3, dx:d.x, dz:d.z, back:true }); made.lunges++;
}
// the blow lands on `id`, from `fromId` (none: a spell's area, a trap). info: { r, crit, kill }
const lastHit = new Map();
export function impact(id, fromId, info = {}){
  const t = tokById(id), P = at(id); if (!t || !P) return;
  // the same blow told twice (a spell's area: the game's own impact, and ui/fightfx.js's for anything without one)
  const was = lastHit.get(id); if (was && performance.now() - was < 450) return; lastHit.set(id, performance.now());
  // (the blow that ends the fight: the last of its side to fall)
  const last = !!info.kill && !!state?.combat?.active && lastOfSide(t, (state.combat.order || []).map(tokById));
  const I = impactOf({ ...info, last }), now = performance.now(), d = fromId ? dirOf(fromId, id) : blastDir(id);
  const b0 = bloodOf({ tags:BEST[t.bid]?.tags, name:t.name, kind:t.kind }), el = EL[info.el];
  const blood = el ? { ...b0, spark:el } : b0;
  hold(I, now); made.impacts++; if (info.kill) made.kills++;
  addMove(id, { kind:'knock', ms:info.kill ? 380 : 420, amp:I.knock, dx:d ? d.x : 0, dz:d ? d.z : 0, back:I.back });
  flash(id, I.flash, info.crit);
  slash(P, d, info.crit, info.crit ? '#ffd45a' : el || (blood.splat ? '#fff0e0' : blood.spark));
  spray(P, d, blood, info.crit, info.kill);
  splat(P, d, blood, info.crit || info.kill);
  if (info.kill){ if (b0.death === 'fall') wisp(P, blood.splat ? '#e8e0ff' : blood.spark); dies(id); }
  if (last){ shockRing(P, '#fff1d6', 3.4, 900); shockRing(P, info.crit ? '#ffd45a' : '#ff9a6a', 2.2, 650, 120); made.lasts++; }   // 🏁 the fight's last blow: a ring of force across the ground   // ☠ how it dies (render/deathfx.js)
  fovKick(I.kick, info.kill ? 650 : info.crit ? 420 : 280);
  if (I.shake > .4 && !gfx.calm) fx.shake = Math.max(fx.shake, (I.shake - .3) * .16);
  const me = mine(id);
  if (me) screen(info.kill || t.hp <= 0 ? 'down' : 'hurt');
  else if (I.screen) screen(I.screen);
}
/* ⚠ a foe shows what it means to do (game/wander.js, before its turn): it draws back from whoever it's going for, and a
   red arrow runs along the ground from it to them, pulsing, for ms */
const arrows = [];
export function windUp(id, targetId, ms = 550){
  const d = dirOf(id, targetId), A = at(id), B = at(targetId); if (!d || !A || !B) return;
  addMove(id, { kind:'knock', ms:ms + 120, amp:-.14, dx:d.x, dz:d.z, back:true });
  const len = Math.max(.3, A.pos.distanceTo(B.pos) - .7), g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color:'#ff3a2a', transparent:true, opacity:0, depthWrite:false, fog:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(.13, len).rotateX(-Math.PI / 2), mat); shaft.position.z = -len / 2 - .35;
  const head = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-.22, 0), new THREE.Vector2(.22, 0), new THREE.Vector2(0, -.36)])).rotateX(-Math.PI / 2), mat); head.position.z = -len - .35;
  g.add(shaft, head); g.position.copy(A.pos).setY(A.pos.y + .07); g.rotation.y = Math.atan2(-d.x, -d.z); g.renderOrder = 7;
  // (and a red ring round whoever it's going for: next to them, an arrow is hidden under the bases)
  const ring = new THREE.Mesh(new THREE.RingGeometry(.55, .68, 40).rotateX(-Math.PI / 2), mat); ring.position.copy(B.pos).setY(B.pos.y + .08); ring.renderOrder = 7;
  A.parent.add(g, ring); arrows.push({ g, ring, mat, t0:performance.now(), ms:ms + 250 }); made.aims++;
}
// a miss: they sway aside, away from the blow
export function dodge(id, fromId){
  const d = dirOf(fromId, id); if (!d) return;
  const side = Math.random() < .5 ? 1 : -1;
  addMove(id, { kind:'dodge', ms:340, amp:.2, dx:-d.z * side, dz:d.x * side, back:true }); made.dodges++;
}

/* ---------- every frame (main.js) ---------- */
export function tickPunch(now = performance.now()){
  const dt = lastNow ? Math.min(100, now - lastNow) : 16; lastNow = now;
  const sp = worldSpeed(now); clk += dt * sp;
  // the figures: the sum of their moves, from where they stand
  for (const [id, list] of moves){
    const fig = tokenViews.get(id)?.group.userData.fig;
    const alive = !tokById(id)?.dead;
    for (let i = list.length - 1; i >= 0; i--) if (clk - list[i].t0 >= list[i].ms && (list[i].back || alive)) list.splice(i, 1);   // (the dead lie where they were thrown)
    if (!fig){ if (!list.length) moves.delete(id); continue; }
    const base = fig.userData.punchBase || (fig.userData.punchBase = { x:fig.position.x, z:fig.position.z });
    let ox = 0, oz = 0;
    for (const m of list){ const k = (clk - m.t0) / m.ms, o = moveAt(m.kind, k, m.amp, m.back); ox += m.dx * o; oz += m.dz * o; }
    const s = fig.parent?.scale.x || 1;
    fig.position.x = base.x + ox / s; fig.position.z = base.z + oz / s;
    if (!list.length){ delete fig.userData.punchBase; moves.delete(id); }
  }
  for (let i = flashes.length - 1; i >= 0; i--){ const f = flashes[i]; if (now >= f.until){ if (f.o.userData.punchOrig){ f.o.material = f.o.userData.punchOrig; delete f.o.userData.punchOrig; } flashes.splice(i, 1); } }
  for (let i = bits.length - 1; i >= 0; i--){
    const b = bits[i], k = (clk - b.t0) / b.ms;
    if (k < 0){ b.obj.visible = false; continue; } b.obj.visible = true;
    if (k >= 1 && b.kind !== 'splat'){ b.obj.parent?.remove(b.obj); b.obj.material.dispose(); if (b.kind === 'spray') b.obj.geometry.dispose(); bits.splice(i, 1); continue; }
    if (b.kind === 'arc'){ b.obj.rotateZ(-b.spin * dt * sp / b.ms * 2.2); b.obj.scale.setScalar(.75 + k * .5); b.obj.material.opacity = k < .2 ? k / .2 : (1 - k) / .8; }
    else if (b.kind === 'glow'){ const e = Math.sin(Math.min(1, k) * Math.PI); b.obj.scale.setScalar((.4 + e * .9) * b.s); b.obj.material.opacity = 1 - k; }
    else if (b.kind === 'spray'){ const a = b.obj.geometry.attributes.position, h = dt * sp / 1000;
      for (let j = 0; j < b.vel.length; j++){ const v = b.vel[j]; v.y -= 9 * h; a.array[j * 3] += v.x * h; a.array[j * 3 + 1] = Math.max(b.floor, a.array[j * 3 + 1] + v.y * h); a.array[j * 3 + 2] += v.z * h; if (a.array[j * 3 + 1] <= b.floor){ v.x *= .8; v.z *= .8; } }
      a.needsUpdate = true; b.obj.material.opacity = k > .6 ? (1 - k) / .4 : 1; }
    else if (b.kind === 'splat'){ const e = 1 - Math.pow(1 - Math.min(1, k), 3); b.obj.scale.setScalar(b.s * e); if (k >= 1) bits.splice(i, 1); }
    else if (b.kind === 'wisp'){ b.obj.position.y = b.y0 + k * 1.6; b.obj.position.x += Math.sin(k * 9) * .003; b.obj.scale.setScalar(.35 + k * .5); b.obj.material.opacity = (k < .2 ? k / .2 : (1 - k) / .8) * .8; }
  }
  for (let i = arrows.length - 1; i >= 0; i--){ const a = arrows[i], k = (now - a.t0) / a.ms;
    if (k >= 1){ a.g.parent?.remove(a.g); a.ring.parent?.remove(a.ring); a.ring.geometry.dispose(); a.g.children.forEach(c => c.geometry.dispose()); a.mat.dispose(); arrows.splice(i, 1); continue; }
    a.ring.scale.setScalar(1.15 - .15 * Math.min(1, k * 3));
    a.mat.opacity = (k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1) * (.55 + .35 * Math.sin(now / 70)); }
  for (let i = rings.length - 1; i >= 0; i--){ const r = rings[i], k = (now - r.t0) / r.ms;
    if (k >= 1){ r.m.parent?.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i, 1); continue; }
    if (k < 0) continue; const e = 1 - Math.pow(1 - k, 3);
    r.m.scale.setScalar(Math.max(.05, r.size * e)); r.m.material.opacity = .85 * (1 - k); }
  // the fight is over: what was spilt fades into the ground
  if (splats.length && !state?.combat?.active){
    if (!fadeFrom) fadeFrom = now;
    const k = (now - fadeFrom - 1500) / 2500;
    if (k >= 1) clearPunch(); else if (k > 0) for (const o of splats) o.material.opacity = .85 * (1 - k);
  } else fadeFrom = 0;
  if (kick){
    const k = (now - kick.at) / kick.ms, e = k < .12 ? k / .12 : Math.pow(1 - (k - .12) / .88, 2);
    camera.fov = baseFov - kick.deg * Math.max(0, e);
    if (k >= 1){ camera.fov = baseFov; kick = null; }
    camera.updateProjectionMatrix();
  }
}
// the fight is over: the ground is wiped (and anything still in the air)
export function clearPunch(){
  moves.clear();
  for (const o of splats.splice(0)){ o.parent?.remove(o); o.material.dispose(); }
  for (const b of bits.splice(0)){ b.obj.parent?.remove(b.obj); b.obj.material.dispose(); if (b.kind === 'spray') b.obj.geometry.dispose(); }
}
// (for the tests: what's been felt since the page loaded, and what's on the ground now)
export const punchCount = () => ({ ...made, onGround:splats.length, speed:worldSpeed(), moving:moves.size });
