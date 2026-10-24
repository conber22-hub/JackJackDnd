/* POST-PROCESSING — bloom on glowing eyes, runes and flames; film grain, vignette and a little colour fringe that
   grow with the Dread. Off on "low" quality.
   The "painted" style (gfx.style) adds a pass that makes the frame look like an illustrated poster: an oil-paint
   (Kuwahara) filter melts fine detail into brush-stroke patches, a grade pushes lights warm and shadows cool,
   edges darken a little like a painter's line, and a canvas weave sits over it all. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { renderer, scene, camera, LABELS } from './scene.js';
import { postOn, painted } from './gfx.js';

const DreadShader = {
  uniforms:{ tDiffuse:{ value:null }, time:{ value:0 }, dread:{ value:0 }, grain:{ value:.035 }, aspect:{ value:1 } },
  vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader:`
    uniform sampler2D tDiffuse; uniform float time; uniform float dread; uniform float grain; uniform float aspect; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - .5;
      float fringe = .0006 + dread * .0035;                       // colour fringe grows with the Dread
      vec4 col;
      col.r = texture2D(tDiffuse, vUv + c * fringe * 2.0).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - c * fringe * 2.0).b;
      col.a = 1.0;
      float n = rand(vUv * vec2(aspect, 1.0) * 900.0 + fract(time * 7.13)) - .5;
      col.rgb += n * (grain + dread * .03);
      float v = smoothstep(.85, .25, length(c * vec2(aspect * .8, 1.0)));
      col.rgb *= mix(.62, 1.0, v);
      col.rgb = mix(col.rgb, col.rgb * vec3(1.12, .82, .82), (1.0 - v) * dread * .8);   // blood at the edges
      gl_FragColor = col;
    }`,
};

// The painted look. Kuwahara: for each pixel, of the four squares around it pick the one whose colours vary least and
// take its mean, so flat areas become strokes and edges stay sharp. Then the poster grade and the canvas.
const PaintShader = {
  uniforms:{ tDiffuse:{ value:null }, res:{ value:new THREE.Vector2(1, 1) }, radius:{ value:3 }, amount:{ value:1 } },
  vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader:`
    uniform sampler2D tDiffuse; uniform vec2 res; uniform float radius; uniform float amount; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(rand(i), rand(i + vec2(1, 0)), f.x), mix(rand(i + vec2(0, 1)), rand(i + vec2(1, 1)), f.x), f.y); }
    void quad(vec2 o, inout vec3 best, inout float bestVar){
      vec3 m = vec3(0.0), s = vec3(0.0); float n = 0.0;
      for (int y = 0; y <= 4; y++) for (int x = 0; x <= 4; x++){
        if (float(x) > radius || float(y) > radius) continue;
        vec3 c = texture2D(tDiffuse, vUv + (vec2(float(x), float(y)) * o) / res).rgb; m += c; s += c * c; n += 1.0;
      }
      m /= n; vec3 v = abs(s / n - m * m); float vv = v.r + v.g + v.b;
      if (vv < bestVar){ bestVar = vv; best = m; }
    }
    void main(){
      vec3 src = texture2D(tDiffuse, vUv).rgb;
      // jitter the stroke direction a little with the canvas so it reads as brushwork, not a grid
      vec2 j = vec2(vnoise(vUv * res / 9.0), vnoise(vUv * res / 9.0 + 17.0)) - .5;
      vec3 best = src; float bestVar = 1e9;
      quad(vec2(-1.0, -1.0) + j * .35, best, bestVar); quad(vec2(1.0, -1.0) + j * .35, best, bestVar);
      quad(vec2(-1.0, 1.0) + j * .35, best, bestVar);  quad(vec2(1.0, 1.0) + j * .35, best, bestVar);
      // fine detail (a mini's face, a weapon, a rune) stays crisp: where the brightness changes sharply keep the
      // render, and paint only the flat areas; then darken those edges a little, like a painter's line
      float lx = dot(texture2D(tDiffuse, vUv + vec2(1.5, 0.0) / res).rgb, vec3(.299, .587, .114)) - dot(texture2D(tDiffuse, vUv - vec2(1.5, 0.0) / res).rgb, vec3(.299, .587, .114));
      float ly = dot(texture2D(tDiffuse, vUv + vec2(0.0, 1.5) / res).rgb, vec3(.299, .587, .114)) - dot(texture2D(tDiffuse, vUv - vec2(0.0, 1.5) / res).rgb, vec3(.299, .587, .114));
      float g = length(vec2(lx, ly));
      vec3 col = mix(best, src, smoothstep(.04, .2, g) * .8);
      col *= 1.0 - smoothstep(.1, .4, g) * .25;
      // the poster grade: rich darks, warm amber lights, teal-violet shadows, a touch more colour
      float lum = dot(col, vec3(.299, .587, .114));
      float warm = clamp((col.r - col.b) * 3.0, 0.0, 1.0);
      col = mix(col, col * vec3(.86, .92, 1.14), (1.0 - smoothstep(.0, .45, lum)) * .5);
      col = mix(col, col * vec3(1.12, 1.0, .82), smoothstep(.3, .95, lum) * .5 * warm);          // warm lights warmer
      col = mix(col, col * vec3(.86, .92, 1.1), smoothstep(.3, .95, lum) * .35 * (1.0 - warm));    // cool lights cooler
      col = mix(vec3(lum), col, 1.12);
      col = col * .94 + vec3(.022, .024, .036);                                                // lift the blacks to a painted ink, not a void
      // canvas: a fine weave and a slow mottle, as if printed on board
      vec2 px = vUv * res;
      float weave = (sin(px.x * 1.9) * sin(px.y * 1.9)) * .5 + .5;
      float mottle = vnoise(vUv * res / 140.0);
      col *= .95 + weave * .035 + mottle * .05;
      gl_FragColor = vec4(mix(src, col, amount), 1.0);
    }`,
};

let composer = null, bloom = null, dreadPass = null, paintPass = null;
function build(){
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .55, .45, .82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());              // tone mapping + sRGB, then paint, grain and vignette in display space
  paintPass = new ShaderPass(PaintShader);
  composer.addPass(paintPass);
  dreadPass = new ShaderPass(DreadShader);
  composer.addPass(dreadPass);
}
addEventListener('resize', () => { if (composer){ composer.setSize(innerWidth, innerHeight); bloom.resolution.set(innerWidth / 2, innerHeight / 2); } });

// dread01: 0..1
export function renderFrame(t, dread01){
  if (!postOn()){ renderer.render(scene, camera); return; }
  if (!composer) build();
  dreadPass.uniforms.time.value = t; dreadPass.uniforms.dread.value = dread01; dreadPass.uniforms.aspect.value = innerWidth / innerHeight;
  const p = painted();
  paintPass.enabled = p;
  if (p){ const pr = composer.renderer.getPixelRatio(); paintPass.uniforms.res.value.set(innerWidth * pr, innerHeight * pr); paintPass.uniforms.radius.value = innerWidth * pr > 2000 ? 3 : 2; }
  bloom.strength = (p ? .85 : .5) + dread01 * .35; bloom.radius = p ? .8 : .45; bloom.threshold = p ? .72 : .82;   // painted: wider, airbrushed glow
  if (!p){ composer.render(); return; }
  // painted: the world without its name plates, then the plates on top, unpainted, so names stay readable
  camera.layers.disable(LABELS); composer.render(); camera.layers.set(LABELS);
  const bg = scene.background, auto = renderer.autoClear; scene.background = null; renderer.autoClear = false;
  renderer.clearDepth();   // the last full-screen pass left its own depth; the plates float over the painting
  renderer.render(scene, camera);
  scene.background = bg; renderer.autoClear = auto; camera.layers.set(0); camera.layers.enable(LABELS);
}
