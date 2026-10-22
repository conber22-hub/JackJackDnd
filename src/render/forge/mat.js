/* FORGE MATERIALS — skin, cloth, leather, chain, plate, bone, glow. Cloth, leather, chain and metal get small
   procedural bump textures (painted once on a canvas), and every forge material carries a soft rim light so a mini
   reads against a dark dungeon floor (the rim's colour and strength are shared: forgeRim). Cached by kind+colour. */
import * as THREE from 'three';

export const forgeRim = { color:{ value:new THREE.Color('#8a9cc8') }, strength:{ value:.38 } };
const tex = new Map();
function canvasTex(key, size, paint, repeat){
  if (tex.has(key)) return tex.get(key);
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); paint(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  tex.set(key, t); return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);
// weave: fine cross threads with noise
const fabric = () => canvasTex('fabric', 64, (g, n) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, n, n);
  for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x++){ const v = 110 + ((x + y) % 4 < 2 ? 30 : -20) + rnd() * 40; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); }
}, [6, 6]);
const leatherT = () => canvasTex('leather', 64, (g, n) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 260; i++){ const v = 90 + rnd() * 90; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.beginPath(); g.arc(rnd() * n, rnd() * n, 1 + rnd() * 3, 0, 7); g.fill(); }
}, [3, 3]);
const chainT = () => canvasTex('chain', 64, (g, n) => {
  g.fillStyle = '#202020'; g.fillRect(0, 0, n, n); g.strokeStyle = '#e0e0e0'; g.lineWidth = 2;
  for (let y = 0; y < n + 8; y += 8) for (let x = 0; x < n + 8; x += 8){ g.beginPath(); g.arc(x + (y / 8 % 2) * 4, y, 3.4, 0, 7); g.stroke(); }
}, [10, 8]);
const brushed = () => canvasTex('brushed', 64, (g, n) => {
  g.fillStyle = '#909090'; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 90; i++){ const v = 100 + rnd() * 80; g.fillStyle = `rgba(${v},${v},${v},.6)`; g.fillRect(0, rnd() * n, n, 1); }
  for (let i = 0; i < 14; i++){ g.fillStyle = 'rgba(40,40,40,.5)'; g.beginPath(); g.arc(rnd() * n, rnd() * n, rnd() * 2, 0, 7); g.fill(); }   // dents
}, [2, 2]);

// A painted surrounding for metal to reflect (torchlit horizon, a cold sky, dark ground): metal without one renders
// as dull brown. Three turns an equirectangular texture into a reflection map by itself.
const envTex = () => canvasTex('env', 128, (g, n) => {
  const gr = g.createLinearGradient(0, 0, 0, n);
  gr.addColorStop(0, '#3a4258'); gr.addColorStop(.38, '#7a8098'); gr.addColorStop(.5, '#b8a08a'); gr.addColorStop(.56, '#4a4038'); gr.addColorStop(1, '#100d0c');
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
  for (let i = 0; i < 5; i++){ const x = rnd() * n; const rg = g.createRadialGradient(x, n * .48, 0, x, n * .48, n * .12); rg.addColorStop(0, 'rgba(255,200,140,.9)'); rg.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = rg; g.fillRect(0, 0, n, n); }
}, [1, 1]);
const KINDS = {
  skin:   { rough:.62, metal:0, sheen:.0 },
  cloth:  { rough:.92, metal:0, bump:fabric, bs:.6 },
  leather:{ rough:.68, metal:0, bump:leatherT, bs:.9 },
  chain:  { rough:.42, metal:.75, bump:chainT, bs:1.6 },
  metal:  { rough:.32, metal:.82, bump:brushed, bs:.35 },
  wood:   { rough:.78, metal:0, bump:leatherT, bs:.5 },
  bone:   { rough:.7, metal:0, bump:leatherT, bs:.4 },
  hair:   { rough:.75, metal:0, bump:fabric, bs:.3 },
  gem:    { rough:.15, metal:.1 },
  dark:   { rough:.4, metal:0 },
};
const mats = new Map();
function rimPatch(m){
  m.onBeforeCompile = sh => {
    sh.uniforms.rimColor = forgeRim.color; sh.uniforms.rimStrength = forgeRim.strength;
    sh.fragmentShader = 'uniform vec3 rimColor;\nuniform float rimStrength;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n  float forgeRimK = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n  totalEmissiveRadiance += rimColor * pow(forgeRimK, 2.6) * rimStrength;');
  };
  m.customProgramCacheKey = () => 'forge-rim';
  return m;
}
// kind: skin | cloth | leather | chain | metal | wood | bone | hair | gem | dark · glow: an emissive colour
export function mat(kind, color, glow = null, gi = 1.6){
  const key = `${kind}|${color}|${glow}|${gi}`;
  let m = mats.get(key); if (m) return m;
  const K = KINDS[kind] || KINDS.cloth;
  m = new THREE.MeshStandardMaterial({ color, roughness:K.rough, metalness:K.metal, emissive:glow ? new THREE.Color(glow) : new THREE.Color(0), emissiveIntensity:glow ? gi : 0 });
  const b = K.bump && K.bump(); if (b){ m.bumpMap = b; m.bumpScale = K.bs; }
  if (kind === 'metal' || kind === 'chain' || kind === 'gem'){ const e = envTex(); if (e){ e.mapping = THREE.EquirectangularReflectionMapping; e.colorSpace = THREE.SRGBColorSpace; m.envMap = e; m.envMapIntensity = kind === 'gem' ? .6 : 1.1; } }
  rimPatch(m); m.userData.forge = kind;
  mats.set(key, m); return m;
}
// a darker or lighter tone of a colour (trim, shading, the soles of boots)
export const shade = (hex, l = -.1, s = 0) => '#' + new THREE.Color(hex).offsetHSL(0, s, l).getHexString();
