/* 🌀 WHAT THEY'RE UNDER, ON THEM — a creature's conditions shown on its figure for as long as they last, so the fight
   reads at a glance (the name plate's icons and the word that floats up once stay as they were):
     · prone, unconscious: lying on the ground          · invisible: a faint, see-through shimmer
     · poisoned: green bubbles rising                    · frightened: trembling, a cold violet ring
     · restrained, grappled: bands round them, turning   · paralyzed, stunned, incapacitated: stars circling the head
     · petrified: grey, and still                        · charmed: pink motes drifting round them
     · raging: a red glow and embers                     · blessed, hasted: gold motes rising
     · dodging: a pale blue shield round them            · concentrating: a slow ring of runes at their feet
     · seeded: a sick green pulse at their feet
   Drawn on every screen, from what each token carries (conds, dodge, conc). Every frame from main.js. */
import * as THREE from 'three';
import { state } from '../engine/state.js';
import { tokenViews } from './minis.js';

const glowTex = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const runeTex = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.translate(128, 128); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 112, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 88, 0, 7); g.stroke();
  g.font = '22px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const R = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒ';
  for (let i = 0; i < R.length; i++){ const a = i / R.length * Math.PI * 2; g.save(); g.rotate(a); g.fillText(R[i], 0, -100); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const add = o => ({ transparent:true, depthWrite:false, fog:false, ...o });

// which effects a creature has now: [name]
export function effectsOf(t){
  if (!t || t.dead || t.flags?.gone) return [];
  const out = new Set();
  for (const c of t.conds || []){
    const n = String(c.n || '').toLowerCase();
    if (n === 'prone' || n === 'unconscious') out.add('down');
    else if (n === 'restrained' || n === 'grappled') out.add('bound');
    else if (n === 'paralyzed' || n === 'stunned' || n === 'incapacitated') out.add('dazed');
    else if (n === 'blessed' || n === 'hasted' || n === 'bless' || n === 'haste') out.add('blessed');
    else if (['invisible', 'poisoned', 'frightened', 'petrified', 'charmed', 'raging', 'seeded'].includes(n)) out.add(n);
  }
  if (t.hp <= 0 && t.kind !== 'monster') out.add('down');
  if (t.dodge) out.add('dodging');
  if (t.conc) out.add('conc');
  return [...out].sort();
}

/* ---------- the pieces, one per effect, on the figure's group ---------- */
function motes(col, n, size = .09){
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = [];
  for (let i = 0; i < n; i++) seed.push([Math.random() * 6.28, Math.random(), .25 + Math.random() * .2]);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial(add({ color:col, size, map:glowTex, blending:THREE.AdditiveBlending }))); p.userData.seed = seed; p.renderOrder = 22; return p;
}
const MAKE = {
  poisoned:() => { const p = motes('#9ff06a', 14, .11); p.userData.kind = 'rise'; p.userData.speed = .45; return p; },
  blessed:() => { const p = motes('#ffe08a', 12, .09); p.userData.kind = 'rise'; p.userData.speed = .35; return p; },
  raging:() => { const g = new THREE.Group(); const s = new THREE.Sprite(new THREE.SpriteMaterial(add({ map:glowTex, color:'#ff4a2a', blending:THREE.AdditiveBlending, opacity:.5 })));
    s.scale.set(1.3, 1.7, 1); s.position.y = .7; g.add(s); const p = motes('#ff8a3a', 12, .08); p.userData.kind = 'rise'; p.userData.speed = .8; g.add(p); g.userData.glow = s; return g; },
  charmed:() => { const p = motes('#ff9ad6', 8, .13); p.userData.kind = 'orbit'; return p; },
  dazed:() => { const p = motes('#fff2a0', 4, .16); p.userData.kind = 'halo'; return p; },
  bound:() => { const g = new THREE.Group(); for (const [y, r] of [[.35, .42], [.7, .36]]){ const m = new THREE.Mesh(new THREE.TorusGeometry(r, .03, 6, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial(add({ color:'#c9b48a', opacity:.85 }))); m.position.y = y; g.add(m); } return g; },
  frightened:() => { const m = new THREE.Mesh(new THREE.RingGeometry(.42, .5, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(add({ color:'#9a7cff', opacity:.6, side:THREE.DoubleSide }))); m.position.y = .05; return m; },
  dodging:() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial(add({ color:'#9fd8ff', opacity:.16, side:THREE.DoubleSide, blending:THREE.AdditiveBlending }))); m.scale.y = 1.6; return m; },
  conc:() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(add({ map:runeTex, color:'#c9a0ff', opacity:.55, blending:THREE.AdditiveBlending }))); m.position.y = .04; return m; },
  seeded:() => { const m = new THREE.Mesh(new THREE.CircleGeometry(.5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(add({ color:'#5f8a1e', opacity:.4 }))); m.position.y = .035; return m; },
};

/* ---------- each creature: what's on it now ---------- */
const on = new Map();   // id -> { key, parts:Map(name -> obj), fig, faded:[[mat, opacity, transparent]] }
function setFigTint(rec, fig, kind){
  // invisible: see-through; petrified: grey. Each figure's own copies of its materials, put back when it ends.
  if (rec.tint === kind && rec.fig === fig) return;
  clearTint(rec);
  if (!kind || !fig) return;
  rec.fig = fig; rec.tint = kind; rec.saved = [];
  fig.traverse(o => { if (!o.isMesh || Array.isArray(o.material)) return; const orig = o.userData.punchOrig || o.material, m = orig.clone(); rec.saved.push([o, orig, m]);   // (mid-flash: its own material, not the flash's)
    if (kind === 'invisible'){ m.transparent = true; m.opacity = .22; m.depthWrite = false; } else if (m.color){ const l = m.color.getHSL({}).l; m.color.setHSL(0, 0, Math.min(.75, l * .9 + .15)); if (m.map) m.map = null; }
    if (o.userData.punchOrig) o.userData.punchOrig = m; else o.material = m; });
}
function clearTint(rec){ for (const [o, orig, m] of rec.saved || []){ if (o.material === m) o.material = orig; if (o.userData.punchOrig === m) o.userData.punchOrig = orig; m.dispose(); } rec.saved = []; rec.tint = null; }
function sync(t, tv){
  const fx = effectsOf(t), key = fx.join(','), fig = tv.group.userData.fig;
  let rec = on.get(t.id);
  if (!rec){ rec = { key:'', parts:new Map(), tilt:0 }; on.set(t.id, rec); }
  if (rec.key !== key || rec.group !== tv.group){
    for (const [n, o] of rec.parts) if (!fx.includes(n) || rec.group !== tv.group){ o.parent?.remove(o); o.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); }); rec.parts.delete(n); }
    for (const n of fx) if (MAKE[n] && !rec.parts.has(n)){ const o = MAKE[n](); tv.group.add(o); rec.parts.set(n, o); }
    rec.key = key; rec.group = tv.group;
  }
  setFigTint(rec, fig, fx.includes('petrified') ? 'petrified' : fx.includes('invisible') ? 'invisible' : null);
  return { rec, fx, fig };
}
let last = 0;
export function tickCondFx(now = performance.now()){
  if (!state) return;
  const t = now / 1000, dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
  const seen = new Set();
  for (const tok of state.tokens){
    const tv = tokenViews.get(tok.id); if (!tv?.group) continue;
    seen.add(tok.id);
    const { rec, fx, fig } = sync(tok, tv);
    // lying down: the figure tips onto its side (and back up when it stands)
    const want = fx.includes('down') ? 1 : 0; rec.tilt += (want - rec.tilt) * Math.min(1, dt * 6);
    if (fig && !tok.dead && (rec.tilt > .001 || rec.tilted)){ fig.rotation.z = rec.tilt * 1.35; fig.position.y = rec.tilt * .14; rec.tilted = rec.tilt > .001; }
    // trembling with fear; still as stone
    if (fig && fx.includes('frightened') && !fx.includes('petrified')) fig.rotation.x = Math.sin(t * 38 + tok.id.length) * .035;
    else if (fig && rec.shook && !tok.dead) fig.rotation.x = 0;
    rec.shook = fx.includes('frightened');
    for (const [n, o] of rec.parts) animate(n, o, t, dt);
  }
  for (const [id, rec] of on) if (!seen.has(id)){ for (const o of rec.parts.values()) o.parent?.remove(o); clearTint(rec); on.delete(id); }
}
function animate(n, o, t, dt){
  if (o.isPoints || o.children?.some(c => c.isPoints)){
    const p = o.isPoints ? o : o.children.find(c => c.isPoints), a = p.geometry.attributes.position, sd = p.userData.seed, k = p.userData.kind, sp = p.userData.speed || .4;
    for (let i = 0; i < sd.length; i++){ const [ph, off, r] = sd[i];
      if (k === 'rise'){ const y = ((t * sp + off) % 1); a.setXYZ(i, Math.cos(ph + t * .6) * r, .1 + y * 1.5, Math.sin(ph + t * .6) * r); }
      else if (k === 'orbit'){ const ang = ph + t * 1.3; a.setXYZ(i, Math.cos(ang) * .55, .5 + Math.sin(t * 2 + ph) * .25, Math.sin(ang) * .55); }
      else { const ang = ph + t * 3; a.setXYZ(i, Math.cos(ang) * .3, 1.25, Math.sin(ang) * .3); } }
    a.needsUpdate = true;
    if (o.userData.glow) o.userData.glow.material.opacity = .4 + .15 * Math.sin(t * 7);
  } else if (n === 'bound') o.children.forEach((c, i) => { c.rotation.y = t * (i ? -1.4 : 1.1); });
  else if (n === 'frightened'){ o.material.opacity = .4 + .25 * Math.sin(t * 5); o.scale.setScalar(1 + .06 * Math.sin(t * 5)); }
  else if (n === 'dodging') o.material.opacity = .12 + .06 * Math.sin(t * 3);
  else if (n === 'conc') o.rotation.y = t * .5;
  else if (n === 'seeded'){ o.material.opacity = .25 + .2 * (.5 + .5 * Math.sin(t * 2.4)); o.scale.setScalar(.9 + .15 * Math.sin(t * 2.4)); }
}
// (for the tests: what each creature shows now)
export const condFxOn = () => Object.fromEntries([...on].map(([id, r]) => [id, r.key]));
