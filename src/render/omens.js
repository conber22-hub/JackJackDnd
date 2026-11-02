/* OMENS — the valley answers its master. On the outdoor maps of Barovia, what the land does follows Strahd's Gaze
   (state.dread, data/dread.js), so the table sees it before anyone reads a line:
     always     the valley's walls: mountains all round under a dark sky, and the Mists standing beyond the woods
     Gaze 2+    "A Raven Lingers": ravens circling over the party, more of them the closer he looks
     Gaze 3+    "The Wolves Know Your Scent": eyes in the treeline, opening, blinking, gone; red from Gaze 8
     Gaze 5+    the land withers (render/floors.js: dead trees, grey grass, blighted fields; see witherLevel())
     Gaze 9+    the sky goes red behind the clouds, and the Mists close in
   Nothing here is game state: every screen (the DM's, the TV, a player's phone) works it out from the Gaze.
   gfx.omens = false turns the moving omens off on a device (the valley's walls stay). */
import * as THREE from 'three';
import { state, ui } from '../engine/state.js';
import { walk } from '../engine/tiles.js';
import { THEMES } from '../data/themes.js';
import { scene, controls, floorY } from './scene.js';
import { gfx } from './gfx.js';

const outdoors = () => { const th = THEMES[state?.floors[ui.floor]?.theme] || {}; return (th.walls === 'trees' || th.walls === 'mixed') && th.id !== 'tavern'; };
// How far the land has withered under his Gaze: 0 below Gaze 5, then a step a level (render/floors.js reads it).
export const witherLevel = () => Math.max(0, (state?.dread || 1) - 4);

function softDot(size, inner, outer){
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); g.addColorStop(0, inner); g.addColorStop(.35, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c);
}

/* ---------- the valley's walls: sky, mountains, the Mists ---------- */
const world = new THREE.Group(); scene.add(world);
const skyMat = new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{ red:{ value:0 } },
  vertexShader:`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  // dark above, a faint bruised glow along the horizon (red when he looks hardest), black below
  fragmentShader:`uniform float red; varying vec3 vP;
    void main(){ float h = vP.y; float band = exp(-pow((h - .02) * 7.0, 2.0));
      vec3 glow = mix(vec3(.10, .08, .14), vec3(.32, .05, .06), red);
      vec3 c = mix(vec3(.012, .01, .02), glow, band) * step(-.15, h);
      gl_FragColor = vec4(c, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), skyMat); world.add(sky);
// mountains: two jagged rings of peaks, the far one paler, black against the glow
function ridge(radius, lo, hi, seed, color){
  const n = 160, pos = [], idx = []; let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const peaks = Array.from({ length:n }, (_, k) => lo + (hi - lo) * (.35 + .65 * Math.abs(Math.sin(k * .37 + seed) * Math.cos(k * .11 + seed * 2))) * (.7 + r() * .3));
  for (let k = 0; k <= n; k++){ const a = k / n * Math.PI * 2, h = peaks[k % n]; pos.push(Math.cos(a) * radius, -6, Math.sin(a) * radius, Math.cos(a) * radius, h, Math.sin(a) * radius); }
  for (let k = 0; k < n; k++){ const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, side:THREE.DoubleSide, fog:false, depthWrite:true }));
}
const far = ridge(140, 18, 46, 7, '#100d16'), near = ridge(110, 8, 26, 3, '#08070b');
world.add(far, near);
// the Mists: a ring of slow banks beyond the trees
const mistTex = softDot(64, 'rgba(255,255,255,.55)', 'rgba(255,255,255,0)');
const banks = [];
for (let k = 0; k < 90; k++){
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:mistTex, color:'#9890a6', transparent:true, opacity:0, depthWrite:false }));
  sp.userData = { k, a:k / 90 * Math.PI * 2 + Math.random() * .05, r:Math.random(), y:.5 + Math.random() * 4, s:9 + Math.random() * 9, ph:Math.random() * 6 };
  world.add(sp); banks.push(sp);
}

/* ---------- ravens ---------- */
const black = new THREE.MeshStandardMaterial({ color:'#0c0b0e', roughness:.7, side:THREE.DoubleSide });
const wingGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.06, 0, 0, .1, .34, .02, .02], 3)); g.computeVertexNormals(); return g; })();
const bodyGeo = new THREE.SphereGeometry(.06, 8, 6).scale(.8, .7, 2.4);
const ravens = [];
function makeRaven(){
  const g = new THREE.Group(), body = new THREE.Mesh(bodyGeo, black), l = new THREE.Mesh(wingGeo, black), r = new THREE.Mesh(wingGeo, black);
  // (scaled up: big enough to read from the table's height)
  r.scale.x = -1; g.add(body, l, r); g.scale.setScalar(1.8); g.userData = { l, r, a:Math.random() * 6.28, rad:2.5 + Math.random() * 4, h:3.5 + Math.random() * 2.5, w:(.35 + Math.random() * .35) * (Math.random() < .5 ? -1 : 1), ph:Math.random() * 6 };
  g.visible = false; scene.add(g); return g;
}

/* ---------- eyes in the treeline ---------- */
const eyeTex = softDot(32, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
const eyes = [];
function makeEyes(){
  const mat = new THREE.SpriteMaterial({ map:eyeTex, color:'#ffcc55', transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, fog:false });
  const g = new THREE.Group(), a = new THREE.Sprite(mat), b = new THREE.Sprite(mat);
  a.scale.setScalar(.13); b.scale.setScalar(.13); a.position.x = -.08; b.position.x = .08; g.add(a, b);
  g.userData = { mat, life:0, until:0, born:0, blink:0 }; g.visible = false; scene.add(g); return g;
}
// somewhere in the trees near the middle of the view, not too close: a square that isn't open ground, next to one that is
function lair(f, cx, cy){
  for (let tries = 0; tries < 30; tries++){
    const a = Math.random() * 6.28, d = 4 + Math.random() * 9, x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
    if (x < 0 || y < 0 || x >= f.W || y >= f.H){ return { x, y }; }   // past the map's edge: the woods go on
    const i = y * f.W + x; if (walk(f.grid[i]) || f.water?.includes(i)) continue;
    if ([1, -1, f.W, -f.W].some(o => walk(f.grid[i + o]))) return { x, y };
  }
  return null;
}

let center = new THREE.Vector3(), lastWorld = '';
export function updateOmens(t, dt){
  if (!state) return;
  const out = outdoors() && ui.view !== 'stack', G = state.dread || 1, f = state.floors[ui.floor], live = out && gfx.omens !== false;
  const baseY = floorY(ui.floor);
  // the valley's walls
  world.visible = out;
  if (out){
    world.position.set(controls.target.x * .9, baseY, controls.target.z * .9);
    skyMat.uniforms.red.value += ((G >= 9 ? (G - 8) * .45 : 0) - skyMat.uniforms.red.value) * Math.min(1, dt * .8);
    const ring = (f?.W || 40) / 2 + 12, wall = .1 + G * .028;
    for (const sp of banks){
      const u = sp.userData, a = u.a + t * .004 * (u.k % 2 ? 1 : -1), r = ring + u.r * 8 - (G >= 9 ? 5 : 0);
      sp.position.set(Math.cos(a) * r - controls.target.x * .9, u.y + Math.sin(t * .2 + u.ph) * .3, Math.sin(a) * r - controls.target.z * .9);
      sp.scale.set(u.s, u.s * .45, 1); sp.material.opacity = wall * (.75 + .25 * Math.sin(t * .3 + u.ph));
    }
    const key = `${ui.floor}|${G >= 8}`; if (key !== lastWorld){ lastWorld = key; for (const sp of banks) sp.material.color.set(G >= 9 ? '#8a6a72' : '#9890a6'); }
  }
  // ravens: two at Gaze 2, one more a level, ten at most
  const nR = live && G >= 2 ? Math.min(10, G) : 0;
  while (ravens.length < nR) ravens.push(makeRaven());
  center.lerp(new THREE.Vector3(controls.target.x, baseY, controls.target.z), Math.min(1, dt * .5));
  ravens.forEach((g, k) => {
    g.visible = k < nR; if (!g.visible) return;
    const u = g.userData, swoop = Math.max(0, Math.sin(t * .13 + u.ph * 3) - .8) * 10;   // now and then one drops low over the party
    u.a += u.w * dt;
    const x = center.x + Math.cos(u.a) * u.rad, z = center.z + Math.sin(u.a) * u.rad, y = baseY + u.h - swoop * 1.6;
    g.position.set(x, y, z); g.rotation.set(0, -u.a + (u.w > 0 ? 0 : Math.PI), Math.sin(t + u.ph) * .15);
    const flap = Math.sin(t * (swoop > .2 ? 4 : 9) + u.ph) * (swoop > .2 ? .2 : .65);
    u.l.rotation.z = flap; u.r.rotation.z = -flap;
  });
  // eyes: none below Gaze 3, then two pairs a level, sixteen at most
  const nE = live && G >= 3 && f ? Math.min(16, (G - 2) * 2) : 0;
  while (eyes.length < nE) eyes.push(makeEyes());
  const cx = controls.target.x + state.meta.size / 2 - .5, cy = controls.target.z + state.meta.size / 2 - .5;
  eyes.forEach((g, k) => {
    const u = g.userData;
    if (k >= nE){ g.visible = false; u.until = 0; return; }
    if (t > u.until){   // gone: open somewhere else, after a while
      const at = Math.random() < .5 ? lair(f, cx, cy) : null;
      if (!at){ g.visible = false; u.until = t + 1 + Math.random() * 4; return; }
      g.position.set(at.x - state.meta.size / 2 + .5 + (Math.random() - .5) * .5, baseY + .45 + Math.random() * .3, at.y - state.meta.size / 2 + .5 + (Math.random() - .5) * .5);
      u.born = t; u.until = t + 4 + Math.random() * 7; u.blink = t + 1 + Math.random() * 2; g.visible = true;
      u.mat.color.set(G >= 8 ? '#ff3a30' : '#ffc850');
    }
    const fade = Math.min(1, (t - u.born) / 1.5, (u.until - t) / 1.2);
    let open = 1; if (t > u.blink){ open = 0; if (t > u.blink + .12) u.blink = t + 1.5 + Math.random() * 3; }
    u.mat.opacity = Math.max(0, fade) * open * .95;
  });
}
