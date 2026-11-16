/* 👣 A STEP, SEEN — what a foot leaves behind (engine/underfoot.js says what's underfoot):
     · dust: a little puff off a dry road        · mud: a dark spatter      · splash: droplets and a ring on the water
     · snow: footprints, left, right, that fade   · rustle: a few leaves flicked up out of brush or crops
   and the stepping stones across a ford. Cheap: a handful of points a step, a pool of prints, shared materials.
   Only the look. */
import * as THREE from 'three';
import { scene, wx, wz, floorY } from './scene.js';
import { printSide, stepAngle } from '../engine/underfoot.js';

const COLORS = { dust:'#9a8a70', mud:'#3d3226', splash:'#cfe0ea', rustle:'#55703e', snow:'#eef2f6' };
const puffs = [];
// A puff of n points at a square, flying out and falling
function puff(L, x, y, color, n, spread, rise, life){
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  const cx = wx(x) + (Math.random() - .5) * .2, cz = wz(y) + (Math.random() - .5) * .2, cy = floorY(L) + .04;
  for (let i = 0; i < n; i++){ pos.set([cx, cy, cz], i * 3); vel.push([(Math.random() - .5) * spread, Math.random() * rise, (Math.random() - .5) * spread]); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size:.07, transparent:true, opacity:.85, depthWrite:false }));
  scene.add(p); puffs.push({ p, vel, t0:performance.now(), life });
}
const ringGeo = new THREE.RingGeometry(.12, .16, 24).rotateX(-Math.PI / 2);
function ring(L, x, y){
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color:'#dfeef5', transparent:true, opacity:.7, depthWrite:false }));
  m.position.set(wx(x), floorY(L) + .05, wz(y)); scene.add(m); puffs.push({ ring:m, t0:performance.now(), life:700 });
}
// footprints: a pool of small dark ovals that fade
const printGeo = new THREE.CircleGeometry(.5, 10).rotateX(-Math.PI / 2), printMat = new THREE.MeshBasicMaterial({ color:'#46505c', transparent:true, opacity:.7, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 });
const prints = []; let printN = 0;
function print(L, x, y, dx, dy){
  const m = new THREE.Mesh(printGeo, printMat.clone()), a = stepAngle(dx, dy), side = printSide(printN++) * .09;
  m.scale.set(.12, 1, .21); m.rotation.y = a; m.renderOrder = 2;
  m.position.set(wx(x) + Math.cos(a) * side, floorY(L) + .07, wz(y) - Math.sin(a) * side);
  scene.add(m); prints.push({ m, t0:performance.now() });
  if (prints.length > 70){ const o = prints.shift(); o.m.parent?.remove(o.m); o.m.material.dispose(); }
}
// A step on (x, y) of floor L, going (dx, dy): kind from engine/underfoot.js
export function stepFx(L, x, y, kind, dx = 0, dy = 0){
  if (kind === 'dust') puff(L, x, y, COLORS.dust, 6, .9, .7, 520);
  else if (kind === 'mud') puff(L, x, y, COLORS.mud, 5, .7, .5, 420);
  else if (kind === 'splash'){ puff(L, x, y, COLORS.splash, 9, 1.4, 1.6, 600); ring(L, x, y); }
  else if (kind === 'rustle') puff(L, x, y, COLORS.rustle, 5, 1.1, 1.2, 700);
  else if (kind === 'snow'){ print(L, x, y, dx, dy); puff(L, x, y, COLORS.snow, 4, .6, .5, 450); }
}
export function tickStepFx(now = performance.now()){
  for (let i = puffs.length - 1; i >= 0; i--){
    const o = puffs[i], k = (now - o.t0) / o.life;
    if (k >= 1){ const obj = o.p || o.ring; obj.parent?.remove(obj); if (o.p){ o.p.geometry.dispose(); o.p.material.dispose(); } else o.ring.material.dispose(); puffs.splice(i, 1); continue; }
    if (o.p){ const a = o.p.geometry.attributes.position; for (let j = 0; j < o.vel.length; j++){ a.array[j * 3] += o.vel[j][0] * .016; a.array[j * 3 + 1] += (o.vel[j][1] - k * 3) * .016; a.array[j * 3 + 2] += o.vel[j][2] * .016; } a.needsUpdate = true; o.p.material.opacity = .85 * (1 - k); }
    else { o.ring.scale.setScalar(1 + k * 2.4); o.ring.material.opacity = .7 * (1 - k); }
  }
  for (let i = prints.length - 1; i >= 0; i--){ const o = prints[i], k = (now - o.t0) / 24000; if (k >= 1){ o.m.parent?.remove(o.m); o.m.material.dispose(); prints.splice(i, 1); } else o.m.material.opacity = .7 * (1 - k * k); }
}
export function clearStepFx(){
  for (const o of puffs.splice(0)){ const obj = o.p || o.ring; obj.parent?.remove(obj); }
  for (const o of prints.splice(0)){ o.m.parent?.remove(o.m); o.m.material.dispose(); }
}

/* ---------- stepping stones across a ford ---------- */
let stones = null, stonesKey = '';
const stoneGeo = new THREE.CylinderGeometry(.16, .19, .08, 7), stoneMat = new THREE.MeshStandardMaterial({ color:'#6f6c66', roughness:.9 });
export function fordStones(L, f, key){
  const k = `${key}:${L}`; if (k === stonesKey) return; stonesKey = k;
  if (stones){ stones.parent?.remove(stones); stones.dispose(); stones = null; }
  const sh = f?.shallow || []; if (!sh.length) return;
  const n = sh.length * 2; stones = new THREE.InstancedMesh(stoneGeo, stoneMat, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  sh.forEach((sq, i) => { const x = sq % f.W, y = (sq / f.W) | 0; for (let j = 0; j < 2; j++){
    const ox = (((x * 31 + y * 17 + j * 7) % 10) / 10 - .5) * .5, oz = (((x * 13 + y * 29 + j * 11) % 10) / 10 - .5) * .5;
    p.set(wx(x) + ox, floorY(L) + .02, wz(y) + oz); q.setFromEuler(new THREE.Euler(0, (x + y + j) * 1.3, 0)); s.set(1 + j * .2, 1, 1 - j * .1);
    m.compose(p, q, s); stones.setMatrixAt(i * 2 + j, m); } });
  stones.receiveShadow = true; scene.add(stones);
}
// (for the browser tests: what's showing)
export const stepFxCount = () => ({ puffs:puffs.length, prints:prints.length, stones:stones?.count || 0 });
