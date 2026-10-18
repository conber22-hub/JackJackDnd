/* MINIS — procedural 3D figures for every token (swap for GLB models later), and keeping them in sync with state. */
import * as THREE from 'three';
import { state, ui, viewAsPlayer, tokById } from '../engine/state.js';
import { seenNow } from '../engine/grid.js';
import { BEST } from '../data/bestiary.js';
import { CONDITIONS } from '../data/dread.js';
import { wx, wz, makeLabel, tween } from './scene.js';
import { floorViews } from './floors.js';
import { refreshSelectionRing } from './effects.js';
import { modelKeyFor, instanceModel, modelState } from './models.js';
import { shadowsOn } from './gfx.js';

export function M(geo, color, emi, opts = {}){
  const mat = new THREE.MeshStandardMaterial({ color, roughness:opts.rough ?? .7, metalness:opts.metal ?? .05,
    emissive:emi ? new THREE.Color(emi) : new THREE.Color(0), emissiveIntensity:emi ? (opts.ei ?? 1.4) : 0,
    transparent:!!opts.op, opacity:opts.op ?? 1 });
  return new THREE.Mesh(geo, mat);
}
const at = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
const cyl = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);
const sph = (r, s = 14) => new THREE.SphereGeometry(r, s, s);
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10);
const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
const cone = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s);
function eyes(g, y, z, color, spread = .055, r = .025){ for (const s of [-1, 1]) g.add(at(M(sph(r, 8), '#000', color, { ei:3 }), s * spread, y, z)); }
function hand(color){ const h = new THREE.Group(); h.add(at(M(box(.2, .05, .22), color), 0, .03, 0));
  for (let i = 0; i < 4; i++) h.add(sway(at(M(cyl(.022, .02, .16, 6), color), -.075 + i * .05, .05, .17, Math.PI / 2 - .4, 0, 0), i, .35));
  h.add(at(M(cyl(.024, .02, .13, 6), color), .12, .05, .03, 0, 0, -1.2)); return h; }
function tendrils(g, n, y, r, color = '#8fa64a', len = .45){
  for (let i = 0; i < n; i++){ const m = at(M(cyl(.015, .03, len, 5), color, '#5d7a1f', { ei:.6 }), Math.cos(i * 2.4) * r, y, Math.sin(i * 2.4) * r, Math.sin(i * 1.7) * .6, 0, Math.cos(i * 1.3) * .6); sway(m, i); g.add(m); }
}
// Marks a part to sway in the render loop (tendrils, fingers, quills).
function sway(m, i, amp = .25){ m.userData.sway = { rx:m.rotation.x, rz:m.rotation.z, ph:i * 1.7, amp }; return m; }

export const SHAPES = {
  pc(t){ const g = new THREE.Group(), c = t.color;
    g.add(at(M(cone(.26, .55, 12), '#2a2430'), 0, .3, 0));                 // cloak
    g.add(at(M(cap(.15, .3), c), 0, .55, 0));
    g.add(at(M(sph(.13), '#d8b89a'), 0, .86, 0));
    g.add(at(M(cyl(.02, .02, .35, 6), '#5a3d22'), .22, .55, .06, .3));      // torch
    const fl = at(M(sph(.06, 8), '#ffb347', '#ff9a2a', { ei:4 }), .25, .76, .12); fl.userData.flame = 1; g.add(fl);
    return g; },
  npc(t){ const g = SHAPES.pc(t); g.scale.setScalar(.9); return g; },
  vampire(b){ const g = new THREE.Group();
    g.add(at(M(cone(.28, .7, 12), '#1a1016'), 0, .35, 0));
    g.add(at(M(cap(.14, .32), b.color), 0, .58, 0));
    g.add(at(M(cone(.2, .25, 10, 1), '#7a1020'), 0, .86, -.03, Math.PI));     // collar
    g.add(at(M(sph(.12), '#d9d0d6'), 0, .9, 0)); eyes(g, .92, .1, b.eye);
    return g; },
  husk(b){ const g = new THREE.Group(), body = new THREE.Group();
    body.add(at(M(cap(.16, .3), b.color), 0, .5, 0));
    body.add(at(M(sph(.12), '#7d7a68'), .06, .8, .06)); eyes(body, .82, .17, b.eye, .045, .02);
    tendrils(body, 5, .45, .13);
    body.add(at(M(box(.04, .04, .5), '#4a3a2a'), .2, .45, .15, -.6));           // host's weapon
    body.rotation.z = .25; body.rotation.x = .2; g.add(body); return g; },
  templar(b){ const g = new THREE.Group(), body = new THREE.Group();
    body.add(at(M(cap(.18, .32), '#8a8f99', null, { metal:.7, rough:.35 }), 0, .52, 0));
    body.add(at(M(sph(.13), '#7a7f88', null, { metal:.7, rough:.35 }), 0, .86, 0));
    body.add(at(M(sph(.08, 8), b.color, '#7aa020', { ei:.8 }), 0, .88, .09));    // burst visor
    eyes(body, .9, .14, b.eye, .04, .018);
    tendrils(body, 6, .5, .16);
    const shield = at(M(box(.05, .42, .32), '#6b6f78', null, { metal:.6 }), -.24, .5, .08); body.add(shield);
    shield.add(at(M(cyl(.07, .07, .02, 12), '#d8d2bf', '#e8d48a', { ei:.6, metal:.9 }), -.03, 0, 0, 0, 0, Math.PI / 2));
    body.add(at(M(box(.035, .035, .7), '#c8cbd6', null, { metal:.9, rough:.25 }), .24, .5, .2, -.5));
    body.rotation.z = .12; g.add(body); return g; },
  seepling(b){ const g = new THREE.Group();
    g.add(at(M(sph(.17), b.color, '#4a6a10', { ei:.5, op:.92 }), 0, .17, 0)); g.children[0].scale.y = .7;
    g.add(at(M(sph(.07, 8), '#c6ff5a', '#c6ff5a', { ei:3 }), 0, .2, .05));
    for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; g.add(at(M(cyl(.012, .006, .3, 5), '#5a6a2a'), Math.cos(a) * .2, .08, Math.sin(a) * .2, Math.sin(a) * .9, 0, -Math.cos(a) * .9)); }
    g.userData.skitter = 1; return g; },
  bloat(b){ const g = new THREE.Group();
    g.add(at(M(sph(.33), b.color, '#6a8a20', { ei:.35 }), 0, .42, 0));
    g.add(at(M(cone(.3, .35, 12), '#1d1a1e'), 0, .74, 0));                   // shawl
    g.add(at(M(sph(.11), '#8a8577'), 0, .86, .04));
    for (let i = 0; i < 7; i++) g.add(at(M(sph(.05, 8), '#c6ff5a', '#c6ff5a', { ei:2.5 }), Math.cos(i * 1.7) * .3, .3 + Math.sin(i) * .15, Math.sin(i * 1.7) * .3));
    g.userData.pulse = 1; return g; },
  stalker(b){ const g = new THREE.Group();
    g.add(at(M(box(.22, .14, .62), b.color), 0, .32, 0));
    g.add(at(M(cone(.1, .3, 8), '#9a9a7a'), 0, .34, .42, Math.PI / 2));
    for (let i = 0; i < 4; i++){ const s = i < 2 ? 1 : -1, z = i % 2 ? .2 : -.2;
      g.add(at(M(cyl(.025, .02, .45, 6), '#4d553a'), s * .22, .22, z, 0, 0, s * .9)); }
    for (let i = 0; i < 5; i++) g.add(at(M(cone(.03, .18, 6), '#cfc6a8'), 0, .45, -.25 + i * .12));
    eyes(g, .36, .5, b.eye, .05); return g; },
  quill(b){ const g = new THREE.Group();
    g.add(at(M(cyl(.08, .14, .4, 8), '#4d553a'), 0, .2, 0));
    g.add(at(M(sph(.26), b.color, '#5a7a1a', { ei:.45 }), 0, .6, 0));
    for (let i = 0; i < 16; i++){ const v = new THREE.Vector3(Math.cos(i * 2.4) * Math.sin(i * .7 + 1), Math.abs(Math.cos(i * .7 + 1)) * .9 + .1, Math.sin(i * 2.4) * Math.sin(i * .7 + 1)).normalize();
      const q = M(cone(.025, .32, 5), '#e2d8bd'); q.position.copy(v.clone().multiplyScalar(.32)).add(new THREE.Vector3(0, .6, 0));
      q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); g.add(q); }
    g.userData.pulse = 1; return g; },
  bulwark(b){ const g = new THREE.Group();
    g.add(at(M(box(.75, .7, .55), b.color), 0, .55, 0));
    g.add(at(M(sph(.13), '#8a876f'), 0, 1.0, .12)); eyes(g, 1.0, .24, b.eye);
    for (const s of [-1, 1]) g.add(at(M(cyl(.14, .18, .8, 8), '#5c5c42'), s * .5, .45, .1, .2, 0, s * .15));
    for (let i = 0; i < 6; i++) g.add(at(M(box(.22, .06, .04), '#e2d8bd'), -.25 + (i % 3) * .25, .45 + Math.floor(i / 3) * .25, .29));
    return g; },
  colossus(b){ const g = new THREE.Group();
    g.add(at(M(box(.8, .75, .55), b.color), 0, .75, 0));
    g.add(at(M(sph(.12, 12), '#200', b.eye, { ei:3.5 }), 0, .85, .29));                         // furnace eye
    for (let i = 0; i < 5; i++) g.add(at(M(box(.6, .05, .04), '#e2d8bd'), 0, .55 + i * .1, .29));  // ribs
    for (const s of [-1, 1]){
      g.add(at(M(cyl(.22, .16, .3, 10, 1), '#9a6a2a', null, { metal:.8, rough:.35 }), s * .42, 1.2, 0));  // bell pauldrons
      g.add(at(M(cyl(.12, .16, .75, 8), '#55593f'), s * .55, .6, .05, .1, 0, s * .2));
      g.add(at(M(box(.24, .24, .24), '#c8cbd6', null, { metal:.9, rough:.3 }), s * .62, .2, .1));   // reliquary fists
    }
    for (const s of [-1, 1]) g.add(at(M(cyl(.12, .14, .4, 8), '#4a4e36'), s * .22, .2, 0));
    g.add(at(M(sph(.14), '#8a876f'), 0, 1.25, .05));
    tendrils(g, 8, .9, .4, '#7f9a3a', .6);
    return g; },
  mind(b){ const g = new THREE.Group();
    const brain = at(M(sph(.55, 20), b.color, '#4a5a10', { ei:.35, rough:.5 }), 0, .45, 0); brain.scale.set(1, .7, .9); g.add(brain);
    for (let i = 0; i < 9; i++) g.add(at(M(new THREE.TorusGeometry(.32 + (i % 3) * .08, .035, 6, 18, Math.PI), '#8a8a5e'), 0, .5 + (i % 3) * .06, -.3 + i * .07, 0, Math.PI / 2, 0));
    for (let i = 0; i < 5; i++){ const a = i * 1.25; g.add(at(M(sph(.07, 8), '#c9b9a0'), Math.cos(a) * .45, .5 + Math.sin(i) * .1, Math.sin(a) * .4)); }  // faces
    for (let i = 0; i < 7; i++) g.add(at(M(sph(.04, 6), '#200', i % 2 ? b.eye : '#c6ff5a', { ei:3 }), Math.cos(i * .9) * .5, .55, Math.sin(i * .9) * .45));
    for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; g.add(sway(at(M(cyl(.05, .02, 1, 6), '#5a6a3a'), Math.cos(a) * .8, .12, Math.sin(a) * .8, Math.sin(a) * 1.35, 0, -Math.cos(a) * 1.35), i, .15)); }
    g.userData.pulse = 1; return g; },
  undertow(b){ const g = new THREE.Group();
    for (let i = 0; i < 9; i++) g.add(at(M(sph(.35 + ((i * 37) % 10) * .03), b.color, '#3a5a10', { ei:.4 }), Math.cos(i * 2.1) * .5, .4 + i * .14, Math.sin(i * 2.1) * .5));
    for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; g.add(sway(at(M(cyl(.06, .02, 1.4, 6), '#5a6a3a'), Math.cos(a) * .9, .35, Math.sin(a) * .9, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2), i, .18)); }
    for (let i = 0; i < 14; i++) g.add(at(M(sph(.06, 8), '#300', i % 3 ? '#ff4a4a' : '#c6ff5a', { ei:2.5 }), Math.cos(i * 1.3) * .55, .5 + (i % 7) * .2, Math.sin(i * 1.3) * .55));
    g.userData.pulse = 1; return g; },
  hand(b){ const g = new THREE.Group();
    for (let i = 0; i < 3; i++){ const h = hand(b.color); h.position.set(Math.cos(i * 2.1) * .16, 0, Math.sin(i * 2.1) * .16); h.rotation.y = i * 2.1 + .4; g.add(h); }
    g.userData.skitter = 1; g.userData.climber = 1; return g; },
  handmass(b){ const g = new THREE.Group();
    g.add(at(M(sph(.42), '#b8a98f'), 0, .42, 0));
    for (let i = 0; i < 22; i++){ const v = new THREE.Vector3(Math.cos(i * 2.4) * Math.sin(i * .9 + .5), Math.cos(i * .9 + .5), Math.sin(i * 2.4) * Math.sin(i * .9 + .5)).normalize(); if (v.y < -.2) v.y = -v.y * .3;
      const h = hand(b.color); h.position.copy(v.clone().multiplyScalar(.45)).add(new THREE.Vector3(0, .42, 0));
      h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v); g.add(h); }
    g.userData.pulse = 1; return g; },
  lich(b){ const g = new THREE.Group(), taken = b.id === 'andral2';
    g.add(at(M(cone(.3, .95, 14), taken ? '#56604a' : '#6c7286', null, { metal:.6, rough:.35 }), 0, .48, 0));
    g.add(at(M(sph(.13), '#d8d2bf'), 0, 1.02, 0)); eyes(g, 1.04, .1, b.eye, .045, .03);
    for (let i = 0; i < 9; i++){ const a = i / 9 * Math.PI * 2; const n = at(M(cyl(.012, .003, .16, 5), taken ? '#8a9a5a' : '#e8ecf4', taken ? '#9cc23c' : '#cfe8ff', { ei:1.5, metal:.9 }), Math.cos(a) * .22, 1.22, Math.sin(a) * .22); n.userData.orbit = a; g.add(n); }
    g.add(at(M(cyl(.02, .02, 1.3, 6), '#c8cbd6', null, { metal:.9, rough:.3 }), .28, .65, 0));
    g.add(at(M(sph(.07, 10), '#e8ecf4', taken ? '#9cc23c' : '#cfe8ff', { ei:2 }), .28, 1.32, 0));
    if (taken){ tendrils(g, 8, .6, .2, '#8fa64a', .55); g.add(at(M(sph(.09, 10), b.color, '#7aa020', { ei:.8 }), .07, 1.05, .06)); }
    g.userData.halo = 1; return g; },
  wraith(b){ const g = new THREE.Group();
    g.add(at(M(cone(.27, .8, 14), b.color, '#4a7aa0', { ei:.6, op:.55 }), 0, .55, 0, Math.PI));
    g.add(at(M(sph(.12), b.color, '#9ad0ff', { ei:.8, op:.65 }), 0, 1.02, 0)); eyes(g, 1.03, .1, b.eye, .04, .02);
    g.userData.hover = 1; return g; },
  bellghoul(b){ const g = new THREE.Group(), body = new THREE.Group();
    body.add(at(M(cap(.13, .3), b.color), 0, .45, 0));
    body.add(at(M(sph(.11), '#8f8270'), 0, .78, .05)); eyes(body, .82, .14, b.eye, .045, .022);
    body.add(at(M(cyl(.06, .14, .18, 12, 1), '#9a6a2a', null, { metal:.8, rough:.35 }), 0, .66, .12));
    for (const s of [-1, 1]) body.add(at(M(cyl(.03, .025, .45, 6), b.color), s * .18, .35, .1, .5));
    body.rotation.x = .45; g.add(body); return g; },
  weaver(b){ const g = new THREE.Group();
    g.add(at(M(sph(.3), b.color), 0, .55, -.2)); g.children[0].scale.set(1, .8, 1.2);
    g.add(at(M(sph(.18), '#c9bc9f'), 0, .5, .25)); eyes(g, .56, .42, b.eye, .06, .03);
    for (let i = 0; i < 6; i++) g.add(at(M(box(.5, .03, .03), '#e8dcc4'), 0, .55, -.45 + i * .1));
    for (let i = 0; i < 8; i++){ const s = i < 4 ? 1 : -1, z = -.3 + (i % 4) * .2;
      g.add(at(M(cyl(.03, .02, .75, 6), '#d7cbb3'), s * .42, .4, z, 0, 0, s * 1.05)); }
    return g; },
  candle(b){ const g = new THREE.Group();
    g.add(at(M(cap(.17, .38), b.color, null, { rough:.4 }), 0, .45, 0));
    g.add(at(M(sph(.13), '#e3d6a8', null, { rough:.4 }), 0, .82, 0));
    for (let i = 0; i < 6; i++) g.add(at(M(cyl(.02, .03, .12 + (i % 3) * .06, 6), '#efe3b8'), Math.cos(i) * .15, .62 - (i % 4) * .06, Math.sin(i) * .15));
    g.add(at(M(cyl(.012, .012, .14, 5), '#222'), 0, .98, 0));
    const fl = at(M(sph(.06, 8), '#9ad0ff', '#6ab0ff', { ei:4 }), 0, 1.08, 0); fl.scale.y = 1.8; fl.userData.flame = 1; g.add(fl);
    return g; },
  dwarf(b){ const g = new THREE.Group();
    g.add(at(M(cap(.2, .18), b.color, '#9aa0b0', { ei:.15, metal:.6, rough:.4 }), 0, .38, 0));
    g.add(at(M(sph(.13), '#b8bcc8', null, { metal:.7, rough:.3 }), 0, .66, 0)); eyes(g, .68, .11, b.eye, .045, .02);
    g.add(at(M(cone(.11, .22, 8), '#d8dce6', null, { metal:.8 }), 0, .52, .1, Math.PI));
    g.add(at(M(cyl(.02, .02, .5, 6), '#5a3d22'), .25, .4, .05, 0, 0, .3));
    g.add(at(M(box(.3, .05, .05), '#8a8f99', null, { metal:.8 }), .32, .64, .05, 0, 0, .3));
    return g; },
  wolf(b){ const g = new THREE.Group(), bloom = b.fam === 'bloom';
    const body = at(M(cap(.13, .42), b.color), 0, .32, 0, Math.PI / 2); g.add(body);
    g.add(at(M(sph(.12), b.color), 0, .42, .3));
    g.add(at(M(cone(.07, .2, 8), b.color), 0, .4, .46, Math.PI / 2));                       // snout
    for (const s of [-1, 1]) g.add(at(M(cone(.035, .09, 6), b.color), s * .06, .55, .27));     // ears
    eyes(g, .45, .4, b.eye, .05, .02);
    for (const [x, z] of [[-.08, .18], [.08, .18], [-.08, -.18], [.08, -.18]]) g.add(at(M(cyl(.03, .025, .26, 6), b.color), x, .13, z));
    g.add(at(M(cone(.04, .3, 6), b.color), 0, .38, -.38, -Math.PI / 2.6));                    // tail
    if (bloom) for (let i = 0; i < 5; i++) g.add(at(M(sph(.04, 6), '#c6ff5a', '#9cc23c', { ei:2 }), Math.cos(i * 1.7) * .1, .25 + (i % 2) * .08, -.15 + i * .07));
    if ((b.size || 1) > 1) g.scale.setScalar(1.15);
    g.userData.prowl = 1; return g; },
  scarecrow(b){ const g = new THREE.Group();
    g.add(at(M(cyl(.025, .025, .9, 6), '#5a3d22'), 0, .45, 0));
    g.add(at(M(cyl(.02, .02, .7, 6), '#5a3d22'), 0, .7, 0, 0, 0, Math.PI / 2));
    g.add(at(M(cone(.2, .5, 8), '#6a5a3a'), 0, .55, 0));
    g.add(at(M(sph(.12), '#b8a070'), 0, .9, 0)); eyes(g, .92, .1, b.eye || '#ff9a3a', .04, .02);
    g.add(at(M(cone(.16, .18, 10), '#3a2e22'), 0, 1.05, 0));
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) g.add(at(M(cone(.015, .12, 4), '#d8c070'), s * (.33 + i * .02), .7 - i * .03, 0, 0, 0, s * (Math.PI / 2 + .3 - i * .2)));
    return g; },
  swarm(b){ const g = new THREE.Group(), bats = /bat/.test(b.id || '');
    for (let i = 0; i < 9; i++){
      const a = i * 2.4, r = .1 + (i % 3) * .1, y = bats ? .4 + (i % 4) * .12 : .06;
      const m = at(M(bats ? box(.16, .02, .06) : sph(.06, 8), b.color), Math.cos(a) * r, y, Math.sin(a) * r);
      if (!bats) m.scale.set(1, .7, 1.5); g.add(m);
      g.add(at(M(sph(.012, 6), '#000', '#ff4a4a', { ei:2 }), Math.cos(a) * r, y + .03, Math.sin(a) * r + .06));
    }
    g.userData[bats ? 'hover' : 'skitter'] = 1; return g; },
  zombie(b){ const g = new THREE.Group(), body = new THREE.Group();
    body.add(at(M(cap(.15, .32), b.color), 0, .5, 0));
    body.add(at(M(sph(.12), '#9a9a82'), .03, .82, .04)); eyes(body, .84, .14, b.eye, .045, .02);
    for (const s of [-1, 1]) body.add(at(M(cyl(.035, .03, .42, 6), b.color), s * .17, .62, .18, Math.PI / 2.2));   // reaching arms
    body.add(at(M(cone(.2, .3, 8), '#3a3328'), 0, .25, 0));
    body.rotation.x = .18; body.rotation.z = -.1; g.add(body); return g; },
  skeleton(b){ const g = new THREE.Group(), bone = '#d8d0b8';
    g.add(at(M(sph(.11), bone), 0, .85, 0)); eyes(g, .87, .09, b.eye, .04, .02);
    g.add(at(M(cyl(.025, .025, .38, 6), bone), 0, .58, 0));
    for (let i = 0; i < 4; i++) g.add(at(M(new THREE.TorusGeometry(.1 - i * .012, .012, 5, 14), bone), 0, .7 - i * .06, 0, Math.PI / 2));
    for (const s of [-1, 1]){ g.add(at(M(cyl(.02, .02, .4, 5), bone), s * .07, .2, 0)); g.add(at(M(cyl(.018, .018, .38, 5), bone), s * .16, .55, 0, 0, 0, s * .2)); }
    g.add(at(M(box(.035, .035, .55), '#7a7f88', null, { metal:.7 }), .2, .5, .14, -.5));
    if (b.id === 'wight') g.add(at(M(cone(.22, .5, 10), '#3a3a30'), 0, .45, -.02));
    return g; },
  hag(b){ const g = new THREE.Group(), body = new THREE.Group();
    body.add(at(M(cone(.27, .8, 12), '#2a2430'), 0, .4, 0));
    body.add(at(M(sph(.12), b.color), 0, .86, .06)); eyes(body, .88, .16, b.eye === '#ffffff' ? '#ffd24a' : b.eye, .045, .022);
    body.add(at(M(cone(.03, .12, 6), b.color), 0, .84, .19, Math.PI / 2));                       // nose
    for (let i = 0; i < 6; i++) body.add(at(M(cyl(.012, .006, .5, 4), '#8a8a8a'), Math.cos(i) * .1, .7, -.05 + Math.sin(i) * .08, .3, 0, Math.cos(i) * .3));
    for (const s of [-1, 1]) body.add(at(M(cyl(.025, .015, .35, 5), b.color), s * .2, .55, .12, Math.PI / 2.5));
    body.rotation.x = .25; g.add(body); return g; },
  humanoid(b){ const g = new THREE.Group(), id = b.id || '';
    const robe = /cult|priest|mage|noble/.test(id) ? (/cult/.test(id) ? '#3a1018' : /priest/.test(id) ? '#d8d0b8' : /mage/.test(id) ? '#2a3a6a' : '#5a3a6a') : '#4a3a2a';
    g.add(at(M(cone(.25, .6, 12), robe), 0, .32, 0));
    g.add(at(M(cap(.13, .26), b.color), 0, .58, 0));
    g.add(at(M(sph(.11), '#d8b89a'), 0, .86, 0));
    if (/cult/.test(id)) g.add(at(M(cone(.14, .26, 10), robe), 0, .96, -.02));                // hood
    if (/guard|knight|veteran|bandit|thug|berserker|scout/.test(id)) g.add(at(M(box(.035, .035, .55), '#9aa0aa', null, { metal:.8 }), .2, .55, .12, -.5));
    if (/knight|guard/.test(id)) g.add(at(M(box(.05, .36, .26), '#6b6f78', null, { metal:.6 }), -.22, .5, .06));
    if (/mage|priest|cult-fanatic/.test(id)) g.add(at(M(sph(.05, 8), '#fff', /priest/.test(id) ? '#ffe9a0' : '#9ab0ff', { ei:3 }), .22, .7, .12));
    return g; },
};
export const SHAPE_NAMES = Object.keys(SHAPES).filter(k => k !== 'pc' && k !== 'npc');

export function artFor(t){ return state.art[t.id] || (t.bid && state.art[t.bid]) || null; }
function figureKey(t){ const mk = modelKeyFor(t); return [t.kind, t.bid, t.color, t.dead, t.flags.rising, artFor(t) ? artFor(t).length : '', t.size, BEST[t.bid]?.shape, mk ? mk + modelState.version : '', shadowsOn()].join('|'); }

const texCache = new Map();
function artTexture(url){ if (!texCache.has(url)){ const tx = new THREE.TextureLoader().load(url); tx.colorSpace = THREE.SRGBColorSpace; texCache.set(url, tx); } return texCache.get(url); }

export function buildFigure(t){
  const g = new THREE.Group(), b = BEST[t.bid];
  const sideCol = t.kind === 'monster' ? '#7a1f25' : (t.kind === 'npc' ? '#6a58a0' : t.color);
  g.add(at(M(cyl(.43, .46, .07, 28), '#151116'), 0, .035, 0));
  g.add(at(M(new THREE.TorusGeometry(.44, .03, 6, 32), sideCol, sideCol, { ei:.8 }), 0, .07, 0, Math.PI / 2));
  const art = artFor(t), mk = modelKeyFor(t);
  let fig;
  if (mk && (fig = instanceModel(mk))){                                    // a GLB model
    g.userData.mixer = fig.userData.mixer;
  } else if (art){                                    // paper-mini standee using your Grok art
    fig = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.05), new THREE.MeshBasicMaterial({ map:artTexture(art), side:THREE.DoubleSide, transparent:true }));
    plate.position.y = .62; fig.add(plate);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(.86, 1.11), new THREE.MeshBasicMaterial({ color:sideCol, side:THREE.DoubleSide }));
    frame.position.set(0, .62, -.005); fig.add(frame);
    fig.userData.billboard = 1;
  } else {
    fig = t.kind === 'pc' ? SHAPES.pc(t) : t.kind === 'npc' ? SHAPES.npc(t) : (SHAPES[b?.shape] || SHAPES.husk)(b || { color:t.color, eye:'#fff' });
  }
  g.add(fig); g.userData.fig = fig;
  if (shadowsOn()) g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const s = t.size || 1; g.scale.setScalar(s === 1 ? 1 : s * .85);
  if (t.dead){
    fig.rotation.x = -Math.PI / 2 * .92; fig.position.y = .12;
    fig.traverse(o => { if (o.material && o.material.color){ o.material = o.material.clone(); o.material.color.multiplyScalar(.45); if (o.material.emissiveIntensity) o.material.emissiveIntensity = .1; } });
  }
  // light sources
  let lightCol = null, li = 0;
  if (!t.dead && (t.kind === 'pc' || t.kind === 'npc')){ lightCol = '#ffb870'; li = t.kind === 'pc' ? 2.6 : 1.4; }
  if (!t.dead && b?.shape === 'candle'){ lightCol = '#7ab8ff'; li = 1.6; }
  if (!t.dead && b?.shape === 'lich'){ lightCol = b.id === 'andral2' ? '#b8e07a' : '#cfe0ff'; li = 2; }
  if (!t.dead && (b?.shape === 'undertow' || b?.shape === 'mind')){ lightCol = '#9cc23c'; li = 3; }
  if (!t.dead && b?.shape === 'colossus'){ lightCol = '#ff8a4a'; li = 2; }
  if (lightCol){ const pl = new THREE.PointLight(lightCol, li, 9, 1.4); pl.position.set(0, 1.3, 0); pl.userData.base = li; pl.userData.torch = t.kind === 'pc' || t.kind === 'npc';
    pl.shadow.mapSize.set(256, 256); pl.shadow.bias = -.004; pl.shadow.camera.near = .2; pl.shadow.camera.far = 9;
    g.add(pl); g.userData.light = pl; }
  return g;
}

export const tokenViews = new Map();   // token id -> { group, key, labelKey, label, anim }
const condText = t => (t.conds || []).map(c => `${CONDITIONS[c.n]?.icon || '•'}${c.n}`).join(' ');
export function syncTokens(){
  if (!state) return;
  const pv = viewAsPlayer();
  for (const [id, tv] of tokenViews) if (!tokById(id)){ tv.group.parent?.remove(tv.group); tokenViews.delete(id); }
  for (const t of state.tokens){
    let tv = tokenViews.get(t.id);
    const key = figureKey(t);
    if (!tv || tv.key !== key){
      const wasAlive = tv && !tv.group.userData.wasDead;
      const keepPos = tv ? tv.group.position.clone() : null;
      if (tv) tv.group.parent?.remove(tv.group);
      const group = buildFigure(t); group.userData.tokenId = t.id; group.userData.wasDead = t.dead;
      tv = { group, key, labelKey:'', label:null, anim:tv?.anim || null }; tokenViews.set(t.id, tv);
      if (keepPos) group.position.copy(keepPos);
      if (t.dead && wasAlive){ const f = group.userData.fig; const rx = f.rotation.x; f.rotation.x = 0; tween(.5, k => f.rotation.x = rx * k); }
    }
    const parent = floorViews[t.floor]?.tokens;
    if (parent && tv.group.parent !== parent) parent.add(tv.group);
    if (!tv.anim) tv.group.position.set(wx(t.x + (t.size - 1) / 2), 0, wz(t.y + (t.size - 1) / 2));
    // visibility: players only see monsters the party can currently see
    let vis = !t.flags.gone;
    if (vis && pv && t.kind === 'monster'){
      const W = state.floors[t.floor].W, s = t.size || 1; vis = false;
      for (let dy = 0; dy < s && !vis; dy++) for (let dx = 0; dx < s && !vis; dx++) if (seenNow[t.floor]?.has((t.y + dy) * W + t.x + dx)) vis = true;
    }
    tv.group.visible = vis;
    // label
    const showHp = !pv || t.kind !== 'monster', ct = condText(t);
    const lk = [t.name, t.hp, t.maxHp, showHp, t.dead, ct, t.flags.seeded].join('|');
    if (tv.labelKey !== lk){
      if (tv.label){ tv.group.remove(tv.label); tv.label.material.map?.dispose(); tv.label.material.dispose(); }
      const c = t.kind === 'monster' ? '#ffb3b3' : t.kind === 'npc' ? '#d6c8ff' : t.color;
      tv.label = makeLabel(t.dead ? `${t.name} ✝${t.flags.seeded ? ' ☣' : ''}` : t.name, c, 26, showHp && !t.dead ? [t.hp, t.maxHp] : null, t.kind !== 'monster', t.dead ? '' : ct);
      const shape = BEST[t.bid]?.shape, h = shape === 'undertow' ? 2.4 : shape === 'colossus' ? 1.7 : 1.25;
      tv.label.position.y = h / (tv.group.scale.x || 1); tv.label.scale.multiplyScalar(1 / (tv.group.scale.x || 1));
      tv.group.add(tv.label); tv.labelKey = lk;
    }
  }
  // torch shadows (high quality): only the first three heroes' torches on the floor being looked at cast them
  let casters = 0;
  for (const t of state.tokens){
    const l = tokenViews.get(t.id)?.group.userData.light; if (!l) continue;
    const on = shadowsOn() && l.userData.torch && t.floor === ui.floor && !t.dead && casters < 3;
    if (on) casters++;
    if (l.castShadow !== on) l.castShadow = on;
  }
  refreshSelectionRing();
}
export function clearTokenViews(){ for (const tv of tokenViews.values()) tv.group.parent?.remove(tv.group); tokenViews.clear(); }
