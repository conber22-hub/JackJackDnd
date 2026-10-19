/* TEXTURES — every surface is painted in code at startup (nothing to download, works offline).
   Each floor look picks a floor pattern, a wall pattern and how wet it is. The textures are greyscale so the
   theme colours (and the per-tile colour variation) still tint them. */
import * as THREE from 'three';
import { mulberry32 } from '../util/core.js';

export const SURFACES = {
  undercroft:{ floor:'flag',     wall:'ashlar', wet:.25 },
  silver:    { floor:'rock',     wall:'rock',   wet:.1 },
  hands:     { floor:'rock',     wall:'hands',  wet:.15 },
  undertow:  { floor:'membrane', wall:'flesh',  wet:.8 },
  chapel:    { floor:'flag',     wall:'ashlar', wet:.1 },
  ossuary:   { floor:'flag',     wall:'bones',  wet:.1 },
  womb:      { floor:'membrane', wall:'flesh',  wet:.7 },
  manor:     { floor:'plank',    wall:'panel',  wet:0 },
  woods:     { floor:'dirt',     wall:'hedge',  wet:.35 },
  wreck:     { floor:'plate',    wall:'hull',   wet:.45 },
  mill:      { floor:'plank',    wall:'panel',  wet:0 },
  village:   { floor:'cobble',   wall:'brick',  wet:.4 },
  castle:    { floor:'flag',     wall:'ashlar', wet:0 },
  tavern:    { floor:'plank',    wall:'panel',  wet:0 },
};
const S = 256;
const gray = (v, a = 1) => `rgba(${v},${v},${v},${a})`;

function grain(ctx, rng, n = 1400, lo = 170, hi = 255, a = .06){
  for (let i = 0; i < n; i++){ ctx.fillStyle = gray(Math.floor(lo + rng() * (hi - lo)), a); const s = 1 + rng() * 3; ctx.fillRect(rng() * S, rng() * S, s, s); }
}
function blotches(ctx, rng, n, lo, hi, rmin, rmax, a){
  for (let i = 0; i < n; i++){
    const x = rng() * S, y = rng() * S, r = rmin + rng() * (rmax - rmin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, gray(Math.floor(lo + rng() * (hi - lo)), a)); g.addColorStop(1, gray(200, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
function crack(ctx, rng, x, y, len, w = 1.2, shade = 90){
  ctx.strokeStyle = gray(shade, .55); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y);
  let a = rng() * Math.PI * 2; for (let i = 0; i < len; i++){ a += (rng() - .5) * .9; x += Math.cos(a) * 6; y += Math.sin(a) * 6; ctx.lineTo(x, y); } ctx.stroke();
}
function stones(ctx, rng, rows, irregular = .35, mortar = 4, chips = true){
  ctx.fillStyle = gray(70); ctx.fillRect(0, 0, S, S);
  let y = 0;
  const hs = []; for (let r = 0; r < rows; r++) hs.push(S / rows * (1 + (rng() - .5) * irregular));
  const scale = S / hs.reduce((a, b) => a + b, 0);
  for (let r = 0; r < rows; r++){
    const h = hs[r] * scale; let x = -rng() * S / 3;
    while (x < S){
      const w = S / (2 + Math.floor(rng() * 2)) * (1 + (rng() - .5) * irregular);
      ctx.fillStyle = gray(Math.floor(185 + rng() * 55)); ctx.fillRect(x + mortar / 2, y + mortar / 2, w - mortar, h - mortar);
      if (x + w > S){ ctx.fillRect(x - S + mortar / 2, y + mortar / 2, w - mortar, h - mortar); }
      if (chips && rng() < .35) crack(ctx, rng, x + w * rng(), y + h * rng(), 3 + Math.floor(rng() * 4), 1, 110);
      x += w;
    }
    y += h;
  }
}
const PAINT = {
  flag(ctx, rng){ stones(ctx, rng, 3, .5, 5); grain(ctx, rng); blotches(ctx, rng, 12, 120, 200, 10, 40, .15); },
  cobble(ctx, rng){
    ctx.fillStyle = gray(80); ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 90; i++){ const x = rng() * S, y = rng() * S, r = 10 + rng() * 12; ctx.fillStyle = gray(Math.floor(170 + rng() * 70)); ctx.beginPath(); ctx.ellipse(x, y, r, r * (.7 + rng() * .3), rng() * 3, 0, Math.PI * 2); ctx.fill(); }
    grain(ctx, rng); blotches(ctx, rng, 10, 100, 160, 15, 40, .25);
  },
  rock(ctx, rng){
    ctx.fillStyle = gray(190); ctx.fillRect(0, 0, S, S);
    blotches(ctx, rng, 60, 120, 240, 8, 45, .35); grain(ctx, rng, 4000, 100, 255, .1);
    for (let i = 0; i < 9; i++) crack(ctx, rng, rng() * S, rng() * S, 8 + Math.floor(rng() * 10), 1.4, 70);
    for (let i = 0; i < 25; i++){ ctx.fillStyle = gray(255, .5); ctx.fillRect(rng() * S, rng() * S, 2, 2); }      // glints
  },
  plank(ctx, rng){
    const n = 4, w = S / n;
    for (let i = 0; i < n; i++){
      ctx.fillStyle = gray(Math.floor(170 + rng() * 50)); ctx.fillRect(i * w, 0, w, S);
      ctx.strokeStyle = gray(120, .35); ctx.lineWidth = 1;
      for (let k = 0; k < 9; k++){ ctx.beginPath(); const x0 = i * w + 4 + rng() * (w - 8); ctx.moveTo(x0, 0); for (let y = 0; y <= S; y += 16) ctx.lineTo(x0 + Math.sin(y / 30 + k) * 3, y); ctx.stroke(); }
      ctx.fillStyle = gray(115); ctx.fillRect(i * w, 0, 2, S);
      const cut = rng() * S; ctx.fillRect(i * w, cut, w, 2);
      ctx.fillStyle = gray(60); for (const yy of [cut - 8, cut + 10]){ ctx.beginPath(); ctx.arc(i * w + 8, yy, 2, 0, 7); ctx.arc(i * w + w - 8, yy, 2, 0, 7); ctx.fill(); }
    }
    grain(ctx, rng, 1500);
  },
  dirt(ctx, rng){
    ctx.fillStyle = gray(160); ctx.fillRect(0, 0, S, S);
    blotches(ctx, rng, 70, 90, 220, 6, 40, .4); grain(ctx, rng, 5000, 60, 230, .12);
    for (let i = 0; i < 30; i++){ ctx.fillStyle = gray(Math.floor(190 + rng() * 60)); ctx.beginPath(); ctx.arc(rng() * S, rng() * S, 1.5 + rng() * 3, 0, 7); ctx.fill(); }
    ctx.strokeStyle = gray(80, .5); ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++){ ctx.beginPath(); let x = rng() * S, y = rng() * S; ctx.moveTo(x, y); for (let k = 0; k < 8; k++){ x += (rng() - .5) * 40; y += (rng() - .5) * 40; ctx.lineTo(x, y); } ctx.stroke(); }
  },
  membrane(ctx, rng){
    ctx.fillStyle = gray(175); ctx.fillRect(0, 0, S, S);
    blotches(ctx, rng, 40, 120, 240, 10, 50, .4);
    for (let i = 0; i < 14; i++){
      ctx.strokeStyle = gray(rng() < .5 ? 90 : 235, .55); ctx.lineWidth = 1 + rng() * 3; ctx.beginPath();
      let x = rng() * S, y = rng() * S; ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++){ const cx = x + (rng() - .5) * 120, cy = y + (rng() - .5) * 120; x += (rng() - .5) * 90; y += (rng() - .5) * 90; ctx.quadraticCurveTo(cx, cy, x, y); }
      ctx.stroke();
    }
    for (let i = 0; i < 26; i++){ const x = rng() * S, y = rng() * S, r = 2 + rng() * 6; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, gray(255, .9)); g.addColorStop(1, gray(150, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  },
  plate(ctx, rng){
    ctx.fillStyle = gray(60); ctx.fillRect(0, 0, S, S);
    const n = 2, w = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      ctx.fillStyle = gray(Math.floor(165 + rng() * 45)); ctx.fillRect(i * w + 3, j * w + 3, w - 6, w - 6);
      ctx.fillStyle = gray(90); for (const [a, b] of [[12, 12], [w - 12, 12], [12, w - 12], [w - 12, w - 12]]){ ctx.beginPath(); ctx.arc(i * w + a, j * w + b, 3.5, 0, 7); ctx.fill(); }
      ctx.strokeStyle = gray(230, .35); ctx.lineWidth = 1; for (let k = 0; k < 6; k++){ ctx.beginPath(); const x = i * w + rng() * w, y = j * w + rng() * w; ctx.moveTo(x, y); ctx.lineTo(x + (rng() - .5) * 40, y + (rng() - .5) * 10); ctx.stroke(); }
    }
    blotches(ctx, rng, 14, 70, 130, 8, 30, .35);                                                                       // rust
    grain(ctx, rng, 1500);
  },
  ashlar(ctx, rng){ stones(ctx, rng, 4, .15, 4); grain(ctx, rng); blotches(ctx, rng, 10, 90, 150, 10, 40, .2); },
  brick(ctx, rng){
    ctx.fillStyle = gray(90); ctx.fillRect(0, 0, S, S);
    const rows = 8, h = S / rows;
    for (let r = 0; r < rows; r++){ const off = r % 2 ? S / 8 : 0; for (let x = -off; x < S; x += S / 4){ ctx.fillStyle = gray(Math.floor(160 + rng() * 60)); ctx.fillRect(x + 2, r * h + 2, S / 4 - 4, h - 4); } }
    grain(ctx, rng); blotches(ctx, rng, 8, 70, 130, 15, 45, .2);
  },
  panel(ctx, rng){
    PAINT.plank(ctx, rng);
    ctx.strokeStyle = gray(60, .8); ctx.lineWidth = 6; ctx.strokeRect(14, 14, S - 28, S * .45); ctx.strokeRect(14, S * .55, S - 28, S * .4);
    ctx.fillStyle = gray(70); ctx.fillRect(0, S * .5 - 4, S, 8);                                                       // dado rail
    blotches(ctx, rng, 6, 60, 110, 20, 50, .25);                                                                       // damp stains
  },
  hedge(ctx, rng){
    ctx.fillStyle = gray(110); ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 140; i++){ const x = rng() * S, y = rng() * S, r = 6 + rng() * 14; ctx.fillStyle = gray(Math.floor(90 + rng() * 140), .7); ctx.beginPath(); ctx.ellipse(x, y, r, r * .6, rng() * 3, 0, 7); ctx.fill(); }
    ctx.strokeStyle = gray(50, .6); ctx.lineWidth = 5; for (let i = 0; i < 3; i++){ const x = rng() * S; ctx.beginPath(); ctx.moveTo(x, S); ctx.lineTo(x + (rng() - .5) * 20, S * .4); ctx.stroke(); }
  },
  rockwall(ctx, rng){ PAINT.rock(ctx, rng); },
  hands(ctx, rng){
    PAINT.rock(ctx, rng);
    for (let i = 0; i < 9; i++){
      const x = 20 + rng() * (S - 40), y = 20 + rng() * (S - 40), a = rng() * Math.PI * 2, sc = .7 + rng() * .6;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc); ctx.fillStyle = gray(rng() < .5 ? 245 : 60, .55);
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, 7); ctx.fill();
      for (let f = 0; f < 4; f++){ ctx.fillRect(-8 + f * 5, -26, 3.5, 15); }
      ctx.fillRect(9, -6, 10, 3.5); ctx.restore();
    }
  },
  flesh(ctx, rng){
    PAINT.membrane(ctx, rng);
    for (let i = 0; i < 18; i++){ ctx.strokeStyle = gray(60, .45); ctx.lineWidth = 2 + rng() * 3; ctx.beginPath(); const y = rng() * S; ctx.moveTo(0, y); ctx.bezierCurveTo(S / 3, y + (rng() - .5) * 60, S * 2 / 3, y + (rng() - .5) * 60, S, y + (rng() - .5) * 20); ctx.stroke(); }
  },
  hull(ctx, rng){
    PAINT.plate(ctx, rng);
    ctx.fillStyle = gray(80); for (let y = S / 4; y < S; y += S / 4) ctx.fillRect(0, y - 3, S, 6);
    ctx.fillStyle = gray(220, .4); for (let y = S / 4; y < S; y += S / 4) ctx.fillRect(0, y - 3, S, 1);
  },
  bones(ctx, rng){
    stones(ctx, rng, 4, .1, 4, false);
    for (let i = 0; i < 14; i++){
      const x = rng() * S, y = rng() * S, r = 8 + rng() * 6;
      ctx.fillStyle = gray(235); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.fillStyle = gray(40); ctx.beginPath(); ctx.arc(x - r * .38, y - r * .05, r * .26, 0, 7); ctx.arc(x + r * .38, y - r * .05, r * .26, 0, 7); ctx.fill();
      ctx.fillRect(x - 1, y + r * .35, 2, r * .35);
    }
    grain(ctx, rng);
  },
};
function canvasTex(paint, seed, repeat = 1){
  const c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d'), rng = mulberry32(seed);
  (PAINT[paint] || PAINT.flag)(ctx, rng);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4;
  t.colorSpace = THREE.NoColorSpace; t.userData.canvas = c;                 // a tint map: keep it bright
  return t;
}
function wetTex(amount, seed){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'), rng = mulberry32(seed);
  ctx.fillStyle = gray(235); ctx.fillRect(0, 0, 128, 128);                                     // rough
  for (let i = 0; i < 18 * amount; i++){ const x = rng() * 128, y = rng() * 128, r = 6 + rng() * 22; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, gray(25)); g.addColorStop(1, gray(235, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const cache = new Map();
export function surfaceTextures(themeId){
  if (cache.has(themeId)) return cache.get(themeId);
  const sf = SURFACES[themeId] || SURFACES.undercroft, seed = [...themeId].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const floor = canvasTex(sf.floor, seed), wall = canvasTex(sf.wall === 'rock' ? 'rockwall' : sf.wall, seed + 1);
  const bumpF = new THREE.CanvasTexture(floor.userData.canvas); bumpF.wrapS = bumpF.wrapT = THREE.RepeatWrapping;
  const bumpW = new THREE.CanvasTexture(wall.userData.canvas); bumpW.wrapS = bumpW.wrapT = THREE.RepeatWrapping;
  const out = { floor, wall, bumpF, bumpW, wet:sf.wet > 0 ? wetTex(sf.wet, seed + 2) : null, wetAmount:sf.wet };
  cache.set(themeId, out);
  return out;
}
