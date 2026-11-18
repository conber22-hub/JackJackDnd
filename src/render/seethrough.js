/* 👁 SEEING THROUGH: the Wanderer's hero is never lost behind a wall, a roof or a tree. Whatever stands between the
   camera and the hero, inside a small circle round the hero on the screen, is thinned away in a dithered hole (the
   way a story game keeps its hero in sight). It is a few lines added to the materials of what a floor has built
   (never a mini, and never anything at the hero's feet or below: the ground, roads and water stay), driven by shared
   uniforms. The hole is open only while the Wanderer plays (ui/wander.js calls seeThrough every frame), so the DM's
   table is untouched. Shadows are kept: the shadow pass draws with its own materials. */
import * as THREE from 'three';
import { camera } from './scene.js';

const U = { uDDHero:{ value:new THREE.Vector3(0, 0, -1) }, uDDCut:{ value:0 }, uDDAspect:{ value:1 }, uDDFloor:{ value:0 },
  uDDFoe:{ value:new THREE.Vector3(0, 0, -1) }, uDDCut2:{ value:0 } };   // (a second hole: what the hero faces in a fight)
const KINDS = ['isMeshStandardMaterial', 'isMeshLambertMaterial', 'isMeshPhongMaterial', 'isMeshBasicMaterial', 'isMeshToonMaterial'];

function inject(sh){
  Object.assign(sh.uniforms, U);
  sh.vertexShader = 'varying vec3 vDDClip;\nvarying float vDDY;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
  vDDClip = gl_Position.xyw;
  { vec4 ddW = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    ddW = instanceMatrix * ddW;
  #endif
    vDDY = ( modelMatrix * ddW ).y; }`);
  sh.fragmentShader = 'uniform vec3 uDDHero;\nuniform float uDDCut;\nuniform float uDDAspect;\nuniform float uDDFloor;\nuniform vec3 uDDFoe;\nuniform float uDDCut2;\nvarying vec3 vDDClip;\nvarying float vDDY;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  if ( uDDCut > 0.0 && vDDY > uDDFloor ) {
    vec2 ddNd = vDDClip.xy / vDDClip.z;
    float ddR = vDDClip.z < uDDHero.z - 0.5 ? length( ( ddNd - uDDHero.xy ) * vec2( uDDAspect, 1.0 ) ) / uDDCut : 9.0;
    if ( uDDCut2 > 0.0 && vDDClip.z < uDDFoe.z - 0.5 ) ddR = min( ddR, length( ( ddNd - uDDFoe.xy ) * vec2( uDDAspect, 1.0 ) ) / uDDCut2 );
    if ( ddR < 1.0 ) {
      float ddN = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
      if ( ddN > smoothstep( 0.5, 1.0, ddR ) ) discard;
    }
  }`);
}
// One material, once: the hole added after whatever the material already does to its shader (wind, snow, recolour).
function patch(m){
  if (!m || m.userData.ddCut || !KINDS.some(k => m[k])) return;
  m.userData.ddCut = true;
  const before = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = function (sh, r){ before?.call(this, sh, r); inject(sh); };
  m.customProgramCacheKey = function (){ return (key ? key.call(this) : '') + '|ddcut2'; };
  m.needsUpdate = true;
}
// Everything a floor has built, except the minis on it (a figure is never cut).
function walk(o){
  if (o.userData.tokenId) return;
  if (o.isMesh && !o.isSprite) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch);
  for (const c of o.children) walk(c);
}
const done = new WeakMap();
// Ready a floor's view (a floorViews entry): cheap to call again; only new children are looked at.
export function readyFloor(fv){
  const root = fv?.built; if (!root) return;
  if (done.get(root) === root.children.length) return;
  walk(root); done.set(root, root.children.length);
}

const v4 = new THREE.Vector4();
/* Every frame: at (a THREE.Vector3, the middle of the hero), feet (the floor's height there), radius in world units;
   null closes the hole. */
// foe: a second middle to keep in sight (over the shoulder in a fight: what the hero faces), or null
export function seeThrough(at, feet = 0, radius = 1.5, foe = null){
  if (!at){ U.uDDCut.value = 0; U.uDDCut2.value = 0; return; }
  U.uDDCut2.value = 0;
  if (foe){ v4.set(foe.x, foe.y, foe.z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    if (v4.w > .1){ U.uDDFoe.value.set(v4.x / v4.w, v4.y / v4.w, v4.w); U.uDDCut2.value = 1.2 * camera.projectionMatrix.elements[5] / v4.w; } }
  U.uDDFloor.value = feet + .3;
  v4.set(at.x, at.y, at.z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
  if (v4.w <= .1){ U.uDDCut.value = 0; return; }
  U.uDDHero.value.set(v4.x / v4.w, v4.y / v4.w, v4.w);
  U.uDDAspect.value = camera.aspect;
  U.uDDCut.value = radius * camera.projectionMatrix.elements[5] / v4.w;
}
