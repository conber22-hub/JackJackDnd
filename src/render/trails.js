/* 🗡 THE SWING'S ARC — a forged figure's blade, axe, mace or claws leave a bright smear through the air as they swing
   (a slash, a smash, a thrust, a claw: render/forge/anim.js), so a blow reads even from across the map. The ribbon runs
   from the weapon's middle to its tip, the newest part brightest, and fades as the swing ends. Every screen draws its
   own, from the figures' own swings. Every frame from main.js. */
import * as THREE from 'three';
import { scene } from './scene.js';
import { tokenViews } from './minis.js';
import { tokById, state } from '../engine/state.js';

const MELEE = new Set(['slash', 'smash', 'thrust', 'claw']);
const N = 14;   // samples along the ribbon
const trails = new Map();   // token id -> { mesh, pts:[[base, tip]], fadeFrom, col }
const box = new THREE.Box3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();

// the two points of a weapon to sweep (its middle and its tip, in its own space), worked out once per weapon
function ends(item){
  if (item.userData.trailEnds) return item.userData.trailEnds;
  // (in the weapon's own space: each piece's box, carried from its own space into the weapon's)
  item.updateMatrixWorld(true); const inv = item.matrixWorld.clone().invert(), m = new THREE.Matrix4(); let top = 0;
  item.traverse(o => { if (!o.isMesh || !o.geometry) return; o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld)); top = Math.max(top, box.max.y); });
  top = top || .3; const e = { base:new THREE.Vector3(0, top * .45, 0), tip:new THREE.Vector3(0, top, 0) };
  item.userData.trailEnds = e; return e;
}
function ribbon(col){
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3));
  const idx = []; for (let i = 0; i < N - 1; i++){ const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors:true, transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, fog:false }));
  m.frustumCulled = false; m.renderOrder = 25; m.userData.col = new THREE.Color(col); scene.add(m); return m;
}
function draw(tr, fade){
  const P = tr.mesh.geometry.attributes.position.array, C = tr.mesh.geometry.attributes.color.array, n = tr.pts.length, c = tr.mesh.userData.col;
  for (let i = 0; i < N; i++){
    const s = tr.pts[Math.max(0, n - N + i)] || tr.pts[n - 1]; if (!s) continue;
    P.set([s[0].x, s[0].y, s[0].z], i * 6); P.set([s[1].x, s[1].y, s[1].z], i * 6 + 3);
    const age = n < N ? i / Math.max(1, n - 1) : i / (N - 1), a = Math.pow(age, 1.6) * fade;   // the newest end brightest
    C.set([c.r * a * .25, c.g * a * .25, c.b * a * .25], i * 6); C.set([c.r * a, c.g * a, c.b * a], i * 6 + 3);   // (brighter at the tip)
  }
  tr.mesh.geometry.attributes.position.needsUpdate = true; tr.mesh.geometry.attributes.color.needsUpdate = true;
}

export function tickTrails(now = performance.now()){
  const t = now / 1000, seen = new Set();
  for (const [id, tv] of tokenViews){
    // 💨 a Dash: a creature running on its dash leaves a faint sheet behind it, feet to shoulders, as it goes
    if (tv.anim && state?.combat?.active && tv.group.visible){ const t = tokById(id);
      if (t?.dashed){ const p = tv.group.getWorldPosition(new THREE.Vector3()), base = p.clone().setY(p.y + .1), tip = p.clone().setY(p.y + 1.05);
        let tr = trails.get(id); if (!tr || tr.fadeFrom || tr.act !== 'dash'){ if (tr){ scene.remove(tr.mesh); tr.mesh.geometry.dispose(); tr.mesh.material.dispose(); } tr = { mesh:ribbon('#ffd27a'), pts:[], fadeFrom:0, act:'dash' }; trails.set(id, tr); }
        const last = tr.pts.at(-1); if (!last || last[0].distanceTo(base) > .04){ tr.pts.push([base, tip]); if (tr.pts.length > N) tr.pts.shift(); }
        seen.add(id); draw(tr, .55); continue; } }
    const fig = tv.group.userData.fig, rig = fig?.userData.rig, act = rig?.action;
    if (!act || !MELEE.has(act.k) || !tv.group.visible) continue;
    const k = (t - act.t0) / act.dur; if (k < .12 || k > .72) continue;
    const item = rig.items?.main, claw = act.k === 'claw' || !item;
    let base, tip;
    if (claw){ base = rig.aR.f.getWorldPosition(new THREE.Vector3()); tip = rig.aR.h.getWorldPosition(new THREE.Vector3()); tip.addScaledVector(v1.subVectors(tip, base), .6); }
    else { const e = ends(item); base = item.localToWorld(v1.copy(e.base)).clone(); tip = item.localToWorld(v2.copy(e.tip)).clone(); }
    let tr = trails.get(id);
    if (!tr || tr.fadeFrom){ if (tr){ scene.remove(tr.mesh); tr.mesh.geometry.dispose(); tr.mesh.material.dispose(); }
      tr = { mesh:ribbon(claw ? '#ff9a7a' : '#e8f2ff'), pts:[], fadeFrom:0, act }; trails.set(id, tr); }
    if (tr.act !== act){ tr.pts = []; tr.act = act; }
    tr.pts.push([base, tip]); if (tr.pts.length > N) tr.pts.shift();
    seen.add(id); draw(tr, 1);
  }
  for (const [id, tr] of trails){
    if (seen.has(id)) continue;
    if (!tr.fadeFrom) tr.fadeFrom = now;
    const f = 1 - (now - tr.fadeFrom) / 160;
    if (f <= 0){ scene.remove(tr.mesh); tr.mesh.geometry.dispose(); tr.mesh.material.dispose(); trails.delete(id); }
    else draw(tr, f);
  }
}
export const trailCount = () => trails.size;
