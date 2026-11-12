/* 🌨 THE LIVING VALLEY — the rest of ChatGPT's Living Valley II (render/barovia-living-*.js; the ground mist is
   render/groundfog.js, the sway render/wind.js):
   · Snow that drifts on the wind: the flakes fall and blow downwind on the graphics card (the pack's snow, from its
     seeded planner), harder and thicker in a blizzard, round the camera on outdoor maps. It replaces the old snow,
     which was moved flake by flake every frame.
   · Blackwater: rivers, ponds, fords and flooded rooms ripple with the wind, catch the sun and the moon on the
     ripples, and darken towards blood when his Gaze is 7 or more (the pack's water, worked into the app's own lit
     water so it keeps its shadows and the fog). Medium quality and above; low keeps the still water.
   · Hunger Moss on the open ground: where the Bloom is loose in the woods (engine/bloom-woods.js), its moss creeps
     out of the treeline over the grass (engine/hunger-moss.js says where; the pack's planner grows it step by step):
     low pads with glowing buds that pulse. When the DM turns the Bloom up, it grows out over a few seconds.
   Only the look: none of it changes a rule, a square or what anyone can see. */
import * as THREE from 'three';
import { state } from '../engine/state.js';
import { createLivingValley } from './barovia-living-three.js';
import { planSnow } from './barovia-living-state.js';
import { mossGround } from '../engine/hunger-moss.js';
import { gfx } from './gfx.js';
import { scene, renderer, wx, wz } from './scene.js';
import { wind } from './wind.js';

/* ---------- blackwater ---------- */
const water = { uBwTime:wind.time, uBwWind:wind.force, uBwGaze:{ value:1 }, uBwOn:{ value:1 } };
const RIPPLE = `
  float bwH(vec2 p, float t, float w){
    return sin(p.x * 2.6 + p.y * 1.4 + t * (.9 + w * .8)) * .5
         + cos(p.y * 3.3 - p.x * .8 - t * (.7 + w * .9)) * .35
         + sin(length(p - vec2(13., 7.)) * 4.6 - t * 1.3) * .22
         + sin(p.x * 7.1 - p.y * 5.3 + t * 2.1) * .12 * (.4 + w);
  }`;
/* Work the living water into one of the app's water materials (once; then each build says whether it is still:
   a flooded room or a cave pool, not out in the wind). */
export function livingWater(mat, still = false){
  if (!mat.userData.bwStill){
    const u = mat.userData.bwStill = { value:0 };
    mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, water, { uBwStill:u }); patch(sh); };
    mat.customProgramCacheKey = () => 'blackwater';
    mat.needsUpdate = true;
  }
  mat.userData.bwStill.value = still ? 1 : 0;
  return mat;
}
function patch(sh){
    sh.vertexShader = 'varying vec2 vBwPos;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      {
        vec4 bwP = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          bwP = instanceMatrix * bwP;
        #endif
        vBwPos = ( modelMatrix * bwP ).xz;
      }`);
    sh.fragmentShader = `uniform float uBwTime;\nuniform float uBwStill;\nuniform float uBwWind;\nuniform float uBwGaze;\nuniform float uBwOn;\nvarying vec2 vBwPos;\n${RIPPLE}\n` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bwW = mix( max( .15, uBwWind ), .12, uBwStill );
        if ( uBwOn > .5 ) {
          diffuseColor.rgb = mix( diffuseColor.rgb, diffuse, .75 );   // (one sheet of water, not a checkerboard of squares)
          float bwR = bwH( vBwPos, uBwTime, bwW ) * .4 + .5;
          diffuseColor.rgb *= .78 + .44 * bwR;
          diffuseColor.rgb = mix( diffuseColor.rgb, vec3( .2, .03, .05 ), clamp( ( uBwGaze - 6. ) / 4., 0., 1. ) * .4 );
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if ( uBwOn > .5 ) roughnessFactor = min( roughnessFactor, .3 );`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if ( uBwOn > .5 && ( vec4( normal, 0. ) * viewMatrix ).y > .8 ) {   // (the top of the water, not its sides)
          float e = .06, h0 = bwH( vBwPos, uBwTime, bwW );
          vec2 gr = vec2( bwH( vBwPos + vec2( e, 0. ), uBwTime, bwW ) - h0, bwH( vBwPos + vec2( 0., e ), uBwTime, bwW ) - h0 ) / e;
          float amp = .12 + .16 * bwW;
          normal = normalize( ( viewMatrix * vec4( normalize( vec3( -gr.x * amp, 1., -gr.y * amp ) ), 0. ) ).xyz );
        }`);
}

/* ---------- Hunger Moss ---------- */
const grown = new Map();   // how far the moss had got on each map's floor (so turning the Bloom up grows it out)
export function dropLiving(fv){ if (fv?.moss){ try { fv.moss.layer.dispose(); } catch {} fv.moss = null; } }
/* Mount the moss on a floor's view (fv.built). seen(i): may this viewer see the square. */
export function mountLiving(fv, f, L, bloom, seen){
  dropLiving(fv);
  const ground = bloom > 0 && mossGround(f, bloom, { seen }); if (!ground) return;
  const key = `${state.meta.mapId || state.meta.seed}|${L}`, quality = gfx.quality === 'ultra' ? 'high' : gfx.quality;
  try {
    const layer = createLivingValley({ parent:fv.built, width:f.W, height:f.H, seed:key, quality, groundY:0, showFog:false, enableCanopyBend:false });
    const moss = layer.addHungerMoss({ ...ground, step:0, wx, wz });
    moss.group.userData.hungerMoss = 1;
    // (the cells come in the order the moss reaches them: show the first n, and grow n from where it had got to)
    const was = grown.get(key), target = moss.cells.length;
    fv.moss = { layer, moss, target, n:was != null && was < target ? was : target, key };
    show(fv.moss); grown.set(key, target);
  } catch { fv.moss = null; }
}
function show(m){ const n = Math.floor(m.n); m.moss.pads.count = n; m.moss.buds.count = n * m.moss.plants; }
// Each frame, for the floor on view: the buds pulse, and new moss grows out a step at a time.
export function updateLiving(fv, t){
  water.uBwGaze.value = state?.dread || 1; water.uBwOn.value = gfx.quality === 'low' ? 0 : 1;
  const m = fv?.moss; if (!m) return;
  const dt = Math.max(0, Math.min(1, t - (m.t ?? t))); m.t = t;
  if (m.n < m.target){ m.n = Math.min(m.target, m.n + dt * Math.max(6, m.target / 4)); show(m); }   // (all of it in about four seconds)
  m.layer.update(t); m.moss.budMat.emissiveIntensity *= .6;   // (a little softer than the pack's: the glow pass whitens them)
}

/* ---------- snow on the wind ---------- */
const BOX = 34, SKY = 14, FLAKES = { low:350, medium:900, high:1600 };
const SNOW_V = `
  attribute float aSpeed; attribute float aSize; attribute float aPhase;
  uniform float uTime; uniform float uDrift; uniform float uPointScale;
  varying float vOpacity;
  #include <fog_pars_vertex>
  void main(){
    vec3 p = position;
    p.y = mod( p.y - uTime * aSpeed + ${SKY.toFixed(1)} * 2048., ${SKY.toFixed(1)} );
    p.x = mod( p.x + ${(BOX / 2).toFixed(1)} + uTime * uDrift * ( .6 + aSpeed * .4 ) + ${BOX.toFixed(1)} * 2048., ${BOX.toFixed(1)} ) - ${(BOX / 2).toFixed(1)};
    p.x += cos( uTime * .51 + aPhase * 1.7 ) * .18;
    p.z += sin( uTime * .37 + aPhase ) * .25 + sin( uTime * 1.3 + aPhase * 3. ) * .05;
    vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp( uPointScale * aSize / max( 1., -mvPosition.z ), 1., 16. );
    vOpacity = .55 + .3 * sin( aPhase + uTime * .34 );
    #include <fog_vertex>
  }`;
const SNOW_F = `
  uniform vec3 uColor; varying float vOpacity;
  #include <fog_pars_fragment>
  void main(){
    float d = length( gl_PointCoord - .5 );
    gl_FragColor = vec4( uColor, ( 1. - smoothstep( .2, .49, d ) ) * vOpacity );
    #include <fog_fragment>
  }`;
let snow = null;
const DOWNWIND = -Math.atan2(.34, .94);   // (the way the woods lean: render/wind.js)
function makeSnow(n){
  const pts = planSnow({ width:BOX, height:BOX, seed:'barovia-snow', count:n, skyHeight:SKY });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(p => [p.x, p.y, p.z]), 3));
  g.setAttribute('aSpeed', new THREE.Float32BufferAttribute(pts.map(p => p.speed), 1));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(pts.map(p => p.size), 1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(pts.map(p => p.phase), 1));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms:{ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime:wind.time, uDrift:{ value:0 }, uPointScale:{ value:40 }, uColor:{ value:new THREE.Color('#e8ecf4') } },
    vertexShader:SNOW_V, fragmentShader:SNOW_F, transparent:true, depthWrite:false, fog:true }));
  m.frustumCulled = false; m.rotation.y = DOWNWIND; m.userData = { n, snowfall:1 }; m.name = 'Barovia · snow on the wind';
  return m;
}
/* Each frame (render/ambience.js): on = snow is falling here; heavy = a blizzard; at = where the camera looks. */
export function updateSnowfall(on, heavy, at){
  const n = Math.round((FLAKES[gfx.quality] ?? 900) * (heavy ? 1.6 : 1));
  if (snow && (!on || snow.userData.n !== n)){ scene.remove(snow); snow.geometry.dispose(); snow.material.dispose(); snow = null; }
  if (!on) return null;
  if (!snow){ snow = makeSnow(n); scene.add(snow); }
  // (the flakes' size as the old snow's: .09 across, in perspective; downwind faster the harder it blows)
  snow.material.uniforms.uPointScale.value = renderer.domElement.height * .5 * (heavy ? .17 : .14);
  snow.material.uniforms.uDrift.value = .1 + wind.force.value * 1.7;
  snow.position.set(at.x, at.y - 1, at.z);
  return snow;
}
// For the console and the tests: how many flakes are falling, and how far the moss has got on a floor's view.
export const livingInfo = fv => ({ snow:snow ? snow.userData.n : 0, moss:fv?.moss ? { cells:fv.moss.moss.cells.length, shown:fv.moss.moss.pads.count } : null });
