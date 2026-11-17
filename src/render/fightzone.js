/* ⚔ THE FIGHT ON THE GROUND — what a fight draws on the map (the Wanderer's, ui/wander.js, and anyone's at the table):
     · the ground it's fought over: the squares inside it take on a faint grid, a red line runs round its edge, and the
       ground outside goes dark, sweeping out from the middle when the fight breaks out
     · on the hero's turn, the squares they can still walk to (candle-lit)
     · over a creature that's struck: the damage rising from it ("−7", "MISS", a gold "CRIT")
     · a thrown, shot or cast attack: a streak from one to the other, so the blow is seen to land
   All of it is scenery: nothing here decides anything. */
import * as THREE from 'three';
import { state, tokById } from '../engine/state.js';
import { groundY } from '../engine/grid.js';
import { G, wx, wz } from './scene.js';
import { floorViews } from './floors.js';
import { tokenViews } from './minis.js';

/* ---------- the ground it's fought over ---------- */
const zoneMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2,
  uniforms:{ uReveal:{ value:0 }, uTime:{ value:0 }, uR:{ value:6 } },
  vertexShader:`attribute float aDist; attribute float aKind; varying vec2 vUv; varying float vDist; varying float vKind;
    void main(){ vUv = uv; vDist = aDist; vKind = aKind; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
  fragmentShader:`uniform float uReveal; uniform float uTime; uniform float uR; varying vec2 vUv; varying float vDist; varying float vKind;
    void main(){
      float shown = smoothstep(vDist - 1.5, vDist, uReveal);
      if (shown <= 0.0) discard;
      vec2 q = abs(vUv - .5) * 2.0; float edge = max(q.x, q.y);
      vec4 c;
      if (vKind < .5){ float line = smoothstep(.86, .97, edge); c = vec4(.96, .86, .66, line * .2 + .025); }   // inside: a faint grid
      else if (vKind < 1.5){ float pulse = .5 + .5 * sin(uTime * 2.6 - vDist); c = vec4(.86, .16, .1, .1 + .1 * pulse + smoothstep(.8, .97, edge) * .45); }   // the edge
      else { c = vec4(.02, .01, .02, min(.62, .3 + (vDist - uR) * .08)); }   // outside: going dark
      gl_FragColor = vec4(c.rgb, c.a * shown);
    }`,
});
const zone = { mesh:null, L:-1, cx:0, cy:0, r:0, t0:0, key:'' };
export function clearFightZone(){ if (zone.mesh){ zone.mesh.parent?.remove(zone.mesh); zone.mesh.geometry.dispose(); zone.mesh = null; } zone.key = ''; zone.L = -1; }
/* Draw it round (cx, cy) on floor L, r squares out; again only if any of that changes (fresh: the sweep plays again). */
export function setFightZone(L, cx, cy, r, { fresh = false } = {}){
  const f = state?.floors?.[L], fv = floorViews[L]; if (!f || !fv) return clearFightZone();
  const key = `${L}:${cx}:${cy}:${r}`; if (key === zone.key && !fresh) return;
  const keepT0 = zone.mesh && !fresh ? zone.t0 : performance.now();
  clearFightZone();
  const out = r + 5, list = [];
  for (let y = Math.max(0, cy - out); y <= Math.min(f.H - 1, cy + out); y++) for (let x = Math.max(0, cx - out); x <= Math.min(f.W - 1, cx + out); x++){
    if (!f.grid[y * f.W + x]) continue;
    const d = Math.hypot(x - cx, y - cy); if (d > out) continue;
    list.push({ x, y, d, k:d <= r - 1 ? 0 : d <= r ? 1 : 2 });
  }
  if (!list.length) return;
  const geo = G.plane.clone(), m4 = new THREE.Matrix4();
  geo.setAttribute('aDist', new THREE.InstancedBufferAttribute(new Float32Array(list.map(t => t.d)), 1));
  geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array(list.map(t => t.k)), 1));
  const mesh = new THREE.InstancedMesh(geo, zoneMat, list.length);
  list.forEach((t, n) => { m4.makeTranslation(wx(t.x), .03 + groundY(f, t.x, t.y), wz(t.y)); mesh.setMatrixAt(n, m4); });
  mesh.renderOrder = 2; mesh.frustumCulled = false;
  fv.group.add(mesh);
  Object.assign(zone, { mesh, L, cx, cy, r, t0:keepT0, key });
  zoneMat.uniforms.uR.value = r;
}
export const fightZone = () => zone.mesh ? { L:zone.L, cx:zone.cx, cy:zone.cy, r:zone.r } : null;

/* ---------- where the hero can still walk this turn ---------- */
const moveMat = new THREE.MeshBasicMaterial({ color:'#f4c46a', transparent:true, opacity:.12, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3 });
const moves = { mesh:null, key:'' };
export function clearMoveSquares(){ if (moves.mesh){ moves.mesh.parent?.remove(moves.mesh); moves.mesh.dispose(); moves.mesh = null; } moves.key = ''; }
export function showMoveSquares(L, squares, key){
  if (key === moves.key) return; clearMoveSquares(); moves.key = key;
  const f = state?.floors?.[L], fv = floorViews[L]; if (!f || !fv || !squares.length) return;
  const mesh = new THREE.InstancedMesh(G.plane, moveMat, squares.length), m4 = new THREE.Matrix4(), s = new THREE.Vector3(.86, 1, .86);
  squares.forEach((i, n) => { const x = i % f.W, y = (i / f.W) | 0; m4.makeTranslation(wx(x), .04 + groundY(f, x, y), wz(y)); m4.scale(s); mesh.setMatrixAt(n, m4); });
  mesh.renderOrder = 3; fv.group.add(mesh); moves.mesh = mesh;
}

/* ---------- what happened to them, rising ---------- */
const floats = [];
// the text on a canvas as wide as it needs (a number, or a word like ACTION SURGE): { t, aspect }
function textTex(text, color, word){
  const px = word ? 46 : 64, c = document.createElement('canvas'), g = c.getContext('2d'), font = `900 ${px}px Georgia, serif`;
  g.font = font; const w = Math.ceil(g.measureText(text).width) + 36;
  c.width = Math.max(128, w); c.height = 96;
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = word ? 10 : 12; g.lineJoin = 'round'; g.strokeStyle = 'rgba(12,6,10,.95)'; g.strokeText(text, c.width / 2, 50);
  g.fillStyle = color; g.fillText(text, c.width / 2, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { t, aspect:c.width / c.height };
}
// text over a token, rising and fading (big: a critical, larger and slower; word: an action or a condition, smaller).
// Several at once over the same one stack up rather than sit on each other.
export function floatText(id, text, color = '#ff5a4a', { big = false, word = false } = {}){
  const tv = tokenViews.get(id); if (!tv?.group?.parent) return;
  const now = performance.now(), { t, aspect } = textTex(text, color, word);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, transparent:true, depthTest:false, depthWrite:false }));
  const above = floats.filter(f => f.id === id && now - f.t0 < 450).length;
  s.renderOrder = 30; s.position.set(0, 1.9, 0); s.scale.set(.01, .01, 1); tv.group.add(s);
  floats.push({ s, id, t0:now, y0:1.9 + above * .42, ms:big ? 1700 : word ? 1500 : 1250, k:(big ? 1.5 : word ? .78 : 1), aspect }); madeFloats++; floatsSeen.push(text);
}

/* ---------- a ring on the ground, spreading: something done there ---------- */
const rings = [], ringGeo = new THREE.RingGeometry(.36, .46, 40).rotateX(-Math.PI / 2);
export function ringPulse(id, color = '#f4c46a'){
  const tv = tokenViews.get(id); if (!tv?.group?.parent) return;
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  m.position.set(0, .06, 0); m.renderOrder = 4; tv.group.add(m); rings.push({ m, t0:performance.now() });
}

/* ---------- a thrown, shot or cast blow, crossing ---------- */
const streaks = [];
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const shaftGeo = new THREE.CylinderGeometry(.018, .018, .55, 5).rotateX(Math.PI / 2);
const where = (id, v) => { const tv = tokenViews.get(id); if (!tv?.group?.parent) return null; tv.group.getWorldPosition(v); v.y += .75; return v; };
// from one token to another over ms (spell: a glowing bolt in that colour; else a shaft of steel or wood)
export function streak(fromId, toId, { spell = null, ms = 300 } = {}){
  const a = where(fromId, new THREE.Vector3()), b = where(toId, new THREE.Vector3()); if (!a || !b) return;
  const parent = tokenViews.get(fromId).group.parent;
  const grp = new THREE.Group();
  const shaft = new THREE.Mesh(shaftGeo, new THREE.MeshBasicMaterial({ color:spell || '#e9e2cf', transparent:true, depthWrite:false }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color:spell || '#fff3d6', transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  glow.scale.setScalar(spell ? .7 : .32); grp.add(shaft, glow); grp.renderOrder = 25;
  parent.add(grp); parent.worldToLocal(a); parent.worldToLocal(b);
  madeStreaks++; streaks.push({ grp, a, b, t0:performance.now(), ms, arc:spell ? .15 : Math.min(1.2, a.distanceTo(b) * .08) });
}

/* ---------- 🎯 before a blow or a spell: who it would reach, the odds, the ground it would cover ----------
   marks: [{ id, k }] where k is 'target' (the one aimed at: bright, turning), 'reach' (another it would reach),
   'far' (aimed at but out of reach), 'caught' (a foe inside a spell's area), 'friend' (a friend inside it: mind it) */
const MARK_COL = { target:'#ffd27a', reach:'#f4c46a', far:'#ff6a4a', caught:'#c48cff', friend:'#ff9a3a' };
const markGeo = new THREE.RingGeometry(.4, .5, 48).rotateX(-Math.PI / 2), tickGeo = new THREE.RingGeometry(.52, .58, 6, 1, 0, Math.PI / 5).rotateX(-Math.PI / 2);
const marks = { list:[], key:'' };
function clearMarks(){ for (const m of marks.list){ m.g.parent?.remove(m.g); m.g.children.forEach(c => c.material.dispose()); } marks.list = []; marks.key = ''; }
export function showMarks(list){
  const key = list.map(m => `${m.id}:${m.k}`).join('|');
  if (key === marks.key && marks.list.every(m => m.g.parent)) return;
  clearMarks(); marks.key = key;
  for (const { id, k } of list){
    const tv = tokenViews.get(id); if (!tv?.group?.parent) continue;
    const col = MARK_COL[k] || '#f4c46a', g = new THREE.Group(), sz = tokById(id)?.size || 1;
    const mat = () => new THREE.MeshBasicMaterial({ color:col, transparent:true, depthWrite:false, opacity:k === 'reach' ? .45 : .8 });
    g.add(new THREE.Mesh(markGeo, mat()));
    if (k === 'target' || k === 'far') for (let n = 0; n < 4; n++){ const t = new THREE.Mesh(tickGeo, mat()); t.rotation.y = n * Math.PI / 2; g.add(t); }
    g.position.set(0, .05, 0); g.scale.setScalar(sz); g.renderOrder = 5; tv.group.add(g); marks.list.push({ g, k, id });
  }
}
// the odds over the one aimed at ("65%", "⇈ 84%"), standing still above their head
const odds = { s:null, key:'' };
export function showOdds(id, text, color = '#ffd27a'){
  const key = id && text ? `${id}:${text}:${color}` : '';
  if (key === odds.key && (!odds.s || odds.s.parent)) return;
  if (odds.s){ odds.s.parent?.remove(odds.s); odds.s.material.map.dispose(); odds.s.material.dispose(); odds.s = null; }
  odds.key = key; if (!key) return;
  const tv = tokenViews.get(id); if (!tv?.group?.parent) return;
  const { t, aspect } = textTex(text, color, true);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, transparent:true, depthTest:false, depthWrite:false }));
  // just over their name plate (render/minis.js puts it at 1.25, in the figure's own scale), so it reads as theirs
  const k = 1 / (tv.group.scale.x || 1);
  s.renderOrder = 29; s.position.set(0, (tv.label?.position.y ?? 1.25 * k) + .36 * k, 0); s.scale.set(.4 * aspect * k, .4 * k, 1); tv.group.add(s); odds.s = s; oddsShown.push(text);
}
// the squares a spell would cover, violet
const areaMat = new THREE.MeshBasicMaterial({ color:'#b07cff', transparent:true, opacity:.26, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-4 });
const area = { mesh:null, key:'' };
export function showAreaSquares(L, squares, key){
  if (key === area.key && (area.mesh?.parent || !squares.length)) return;
  if (area.mesh){ area.mesh.parent?.remove(area.mesh); area.mesh.dispose(); area.mesh = null; } area.key = key;
  const f = state?.floors?.[L], fv = floorViews[L]; if (!f || !fv || !squares.length) return;
  const mesh = new THREE.InstancedMesh(G.plane, areaMat, squares.length), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(.94, 1, .94);
  squares.forEach((i, n) => { const x = i % f.W, y = (i / f.W) | 0; m4.makeTranslation(wx(x), .05 + groundY(f, x, y), wz(y)); m4.scale(sc); mesh.setMatrixAt(n, m4); });
  mesh.renderOrder = 4; fv.group.add(mesh); area.mesh = mesh;
}
export function clearAim(){ clearMarks(); showOdds(null, ''); showAreaSquares(0, [], ''); }
const oddsShown = [];

/* Every frame: the edge pulses, the ground sweeps out, the numbers rise, the streaks fly. */
const at = new THREE.Vector3(), ahead = new THREE.Vector3();
export function tickFightFx(now = performance.now()){
  zoneMat.uniforms.uTime.value = now / 1000;
  for (const m of marks.list){ if (m.k === 'target' || m.k === 'far') m.g.rotation.y = now / 1400; else if (m.k === 'caught' || m.k === 'friend') m.g.children[0].material.opacity = .55 + .3 * Math.sin(now / 220); }
  areaMat.opacity = .2 + .08 * Math.sin(now / 300);
  if (zone.mesh) zoneMat.uniforms.uReveal.value = Math.min(zone.r + 7, (now - zone.t0) / 1000 * 11);
  for (let i = floats.length - 1; i >= 0; i--){
    const f = floats[i], a = (now - f.t0) / f.ms;
    if (a >= 1 || !f.s.parent){ f.s.parent?.remove(f.s); f.s.material.map.dispose(); f.s.material.dispose(); floats.splice(i, 1); continue; }
    const pop = Math.min(1, a / .14), k = (1 + .35 * Math.sin(pop * Math.PI)) * f.k;
    f.s.scale.set(.6 * f.aspect * k, .6 * k, 1); f.s.position.y = f.y0 + a * .9; f.s.material.opacity = a > .7 ? (1 - a) / .3 : 1;
  }
  for (let i = rings.length - 1; i >= 0; i--){
    const r = rings[i], a = (now - r.t0) / 650;
    if (a >= 1 || !r.m.parent){ r.m.parent?.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); continue; }
    r.m.scale.setScalar(1 + a * 1.8); r.m.material.opacity = (1 - a) * .85;
  }
  for (let i = streaks.length - 1; i >= 0; i--){
    const s = streaks[i], a = (now - s.t0) / s.ms;
    if (a >= 1){ s.grp.parent?.remove(s.grp); s.grp.children.forEach(c => c.material.dispose()); streaks.splice(i, 1); continue; }
    const p = k => at.lerpVectors(s.a, s.b, k).setY(s.a.y + (s.b.y - s.a.y) * k + Math.sin(k * Math.PI) * s.arc);
    p(a); s.grp.position.copy(at); ahead.copy(p(Math.min(1, a + .05))); s.grp.lookAt(s.grp.parent.localToWorld(ahead.clone()));
  }
}
export function clearFightFx(){ clearFightZone(); clearMoveSquares(); clearAim(); }
// (for the tests: what's drawn now, and how many numbers and streaks have been shown since the page loaded)
let madeFloats = 0, madeStreaks = 0;
export const fightFxCount = () => ({ zone:!!zone.mesh, moves:moves.mesh?.count || 0, floats:madeFloats, streaks:madeStreaks, texts:floatsSeen.slice(-6),
  marks:marks.list.map(m => ({ id:m.id, k:m.k })), odds:odds.key ? oddsShown[oddsShown.length - 1] : '', area:area.mesh?.count || 0 });
const floatsSeen = [];
