/* 3D SCENE CORE — renderer, camera, lights, tweens. 1 grid square = 1 world unit (5 ft). Floor L sits at y = -L * gap. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { $ } from '../util/core.js';
import { state, ui } from '../engine/state.js';

export const WALL_H = 1.4;
export const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
$('#stage').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#07060a');
scene.fog = new THREE.FogExp2('#0d0b10', .02);
export const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 500);
camera.position.set(0, 18, 16);
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .08;
controls.screenSpacePanning = false; controls.maxPolarAngle = Math.PI * .49;
controls.minDistance = 4; controls.maxDistance = 120;

export const ambient = new THREE.AmbientLight('#8a7f99', .6); scene.add(ambient);
export const hemi = new THREE.HemisphereLight('#a092b8', '#140f0c', .45); scene.add(hemi);
export const moon = new THREE.DirectionalLight('#8a96c0', 1.1); moon.position.set(-20, 40, 14); scene.add(moon);

export const floorGap = () => ui.view === 'stack' ? 9 : 7;
export const floorY = L => -L * floorGap();
export const wx = x => x - state.meta.size / 2 + .5;
export const wz = y => y - state.meta.size / 2 + .5;

/* ---------- shared geometry ---------- */
export const G = {
  tile: new THREE.BoxGeometry(1, .2, 1),
  wall: new THREE.BoxGeometry(1, WALL_H, 1),
  cap: new THREE.BoxGeometry(1.02, .06, 1.02),
  plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  step: new THREE.BoxGeometry(.9, .22, .3),
  rune: new THREE.RingGeometry(.32, .44, 32).rotateX(-Math.PI / 2),
  glyph: new THREE.RingGeometry(.55, .7, 6).rotateX(-Math.PI / 2),
  door: new THREE.BoxGeometry(.92, 1.18, .12),
  band: new THREE.BoxGeometry(.96, .07, .15),
  post: new THREE.BoxGeometry(.1, 1.3, .2),
  spike: new THREE.ConeGeometry(.06, .22, 5),
  handle: new THREE.SphereGeometry(.12, 10, 10),
};
export const mat4 = new THREE.Matrix4(), col = new THREE.Color();

/* ---------- tweens & camera ---------- */
export const tweens = [];
export function tween(sec, fn, done){ tweens.push({ t0:performance.now(), dur:sec * 1000, fn, done }); }
export const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export function runTweens(now){
  for (let i = tweens.length - 1; i >= 0; i--){ const tw = tweens[i]; const k = Math.min(1, (now - tw.t0) / tw.dur); tw.fn(k); if (k >= 1){ tweens.splice(i, 1); tw.done && tw.done(); } }
}
export function camTo(target, offset, sec = .8){
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  const off = offset || camera.position.clone().sub(controls.target);
  const p1 = target.clone().add(off);
  tween(sec, k => { const e = ease(k); controls.target.lerpVectors(t0, target, e); camera.position.lerpVectors(p0, p1, e); });
}
export function viewOffset(){ return ui.view === 'top' ? new THREE.Vector3(0, 30, .01) : ui.view === 'stack' ? new THREE.Vector3(34, 18, 34) : new THREE.Vector3(0, 19, 12); }
export function focusTile(L, x, y){ camTo(new THREE.Vector3(wx(x), floorY(L), wz(y))); }
export function focusFloor(){
  if (ui.view === 'stack'){ const mid = -(state.floors.length - 1) * floorGap() / 2; camTo(new THREE.Vector3(controls.target.x, mid, controls.target.z), viewOffset()); }
  else camTo(new THREE.Vector3(controls.target.x, floorY(ui.floor), controls.target.z), viewOffset());
}
export const fx = { shake:0 };

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

/* ---------- labels ---------- */
export function makeLabel(text, color = '#ece1cf', px = 28, hp = null, pc = false, conds = ''){
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  ctx.font = `600 ${px}px system-ui, sans-serif`;
  const w = Math.min(512, Math.ceil(Math.max(ctx.measureText(text).width, conds ? ctx.measureText(conds).width * .8 : 0)) + 24), h = px + 14 + (hp ? 14 : 0) + (conds ? px : 0);
  c.width = w; c.height = h;
  ctx.font = `600 ${px}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(10,8,12,.72)'; ctx.beginPath(); ctx.roundRect(0, 0, w, px + 12, 10); ctx.fill();
  ctx.fillStyle = color; ctx.fillText(text, w / 2, 6);
  let y = px + 16;
  if (hp){
    ctx.fillStyle = '#2a1c20'; ctx.fillRect(10, y, w - 20, 8);
    ctx.fillStyle = pc ? '#56b39d' : '#d24a4a'; ctx.fillRect(10, y, (w - 20) * Math.max(0, Math.min(1, hp[0] / hp[1])), 8);
    y += 14;
  }
  if (conds){ ctx.font = `600 ${Math.round(px * .8)}px system-ui, sans-serif`; ctx.fillStyle = '#ffd3b0'; ctx.fillText(conds, w / 2, y); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, depthWrite:false, transparent:true, fog:false }));
  const s = .0085; sp.scale.set(w * s, h * s, 1); sp.renderOrder = 10;
  return sp;
}
