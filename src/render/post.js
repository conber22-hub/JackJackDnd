/* POST-PROCESSING — bloom on glowing eyes, runes and flames; film grain, vignette and a little colour fringe that
   grow with the Dread. Off on "low" quality. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { renderer, scene, camera } from './scene.js';
import { postOn } from './gfx.js';

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

let composer = null, bloom = null, dreadPass = null;
function build(){
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .55, .45, .82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());              // tone mapping + sRGB, then grain and vignette in display space
  dreadPass = new ShaderPass(DreadShader);
  composer.addPass(dreadPass);
}
addEventListener('resize', () => { if (composer){ composer.setSize(innerWidth, innerHeight); bloom.resolution.set(innerWidth / 2, innerHeight / 2); } });

// dread01: 0..1
export function renderFrame(t, dread01){
  if (!postOn()){ renderer.render(scene, camera); return; }
  if (!composer) build();
  dreadPass.uniforms.time.value = t; dreadPass.uniforms.dread.value = dread01; dreadPass.uniforms.aspect.value = innerWidth / innerHeight;
  bloom.strength = .5 + dread01 * .35;
  composer.render();
}
