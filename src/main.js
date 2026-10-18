/* DREAD DELVE — boot + the render loop.
   Built in honor of Chance. See DREAD-DELVE-ROADMAP.md for the code map. */
import * as THREE from 'three';
import { state, ui, dreadLevel } from './engine/state.js';
import { THEMES } from './data/themes.js';
import { WHISPERS } from './data/dread.js';
import { pick, $ } from './util/core.js';
import { bus } from './util/core.js';
import { scene, camera, controls, renderer, ambient, hemi, moon, runTweens, fx } from './render/scene.js';
import { floorViews, mist } from './render/floors.js';
import { tokenViews } from './render/minis.js';
import { selRing, updatePings } from './render/effects.js';
import { sendWhisper } from './ui/hud.js';
import { renderPanel } from './ui/panels.js';
import { showStart } from './ui/events.js';
import './ui/input.js';
import * as api from './debug.js';

bus.on('log', () => { if (ui.tab === 'table' || ui.tab === 'log' || ui.role === 'player') renderPanel(); });

const clock = new THREE.Clock();
let whisperAt = performance.now() + 30000;
const fogDark = new THREE.Color('#0d0b10'), fogRed = new THREE.Color('#140808'), redMist = new THREE.Color('#7a2a2a');
function frame(){
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05), now = performance.now(), t = now / 1000;
  runTweens(now);
  if (state){
    const D = dreadLevel();
    const fogTarget = D.fog * (ui.view === 'stack' ? .3 : ui.view === 'top' ? .35 : 1) * (ui.tab === 'build' && ui.role === 'dm' && !ui.tableView ? .5 : 1);
    scene.fog.density += (fogTarget - scene.fog.density) * .05;
    scene.fog.color.lerp(state.dread >= 8 ? fogRed : fogDark, .02);
    ambient.intensity += (D.amb * 1.5 - ambient.intensity) * .03; hemi.intensity = ambient.intensity * .9; moon.intensity = ambient.intensity * 1.4;
    const hue = new THREE.Color(D.hue);
    for (const tv of tokenViews.values()){
      const g = tv.group, u = g.userData, fig = u.fig;
      if (u.light){ u.light.intensity = u.light.userData.base * (1 - D.flick * (.5 + .5 * Math.sin(t * 13 + g.id) * Math.sin(t * 7.3 + g.id * 2))); if (u.light.userData.torch) u.light.color.lerp(hue, .05); }
      if (!fig || g.userData.wasDead || !g.visible) continue;
      if (fig.userData.billboard){ const v = camera.position.clone(); g.worldToLocal(v); fig.rotation.y = Math.atan2(v.x, v.z); }
      if (fig.userData.hover) fig.position.y = .15 + Math.sin(t * 2 + g.id) * .08;
      if (fig.userData.pulse){ const s = 1 + Math.sin(t * 2.4 + g.id) * .04; fig.scale.set(s, 1 / s, s); }
      if (fig.userData.skitter) fig.rotation.y = Math.sin(t * 6 + g.id) * .25;
      if (fig.userData.halo) fig.children.forEach(c => { if (c.userData.orbit !== undefined){ const a = c.userData.orbit + t * .6; c.position.x = Math.cos(a) * .22; c.position.z = Math.sin(a) * .22; } });
      fig.children.forEach(c => { if (c.userData.flame) c.scale.x = c.scale.z = .8 + Math.random() * .4; });
    }
    floorViews.forEach(fv => fv?.group.visible && fv.built.traverse(o => { if (o.userData.spin) o.rotation.y += dt * o.userData.spin; if (o.userData.trapId && o.userData.pulse) o.children[0].scale.setScalar(1.05 + Math.sin(t * 3) * .08); }));
    // walls breathe at high dread
    floorViews.forEach(fv => { if (!fv) return; const m = fv.mats.wall; m.emissive.set('#5a0a10'); m.emissiveIntensity = state.dread >= 7 ? (state.dread - 6) * .06 * (1 + Math.sin(t * 1.3)) : 0; });
    // selection ring
    const st = ui.selected && tokenViews.get(ui.selected);
    if (st && selRing.visible){ st.group.getWorldPosition(selRing.position); selRing.position.y += .08; selRing.rotation.y += dt; selRing.material.opacity = .6 + Math.sin(t * 4) * .3; }
    // mist drift
    const mp = mist.geometry.attributes.position; for (let i = 0; i < mp.count; i++){ mp.array[i*3] += Math.sin(t * .2 + i) * .004; mp.array[i*3+2] += .006; if (mp.array[i*3+2] > 30) mp.array[i*3+2] = -30; } mp.needsUpdate = true;
    mist.material.opacity = .08 + state.dread * .018; mist.material.color.lerp(new THREE.Color((THEMES[state.floors[ui.floor]?.theme] || THEMES[0]).mist), .02);
    if (state.dread >= 8) mist.material.color.lerp(redMist, .01);
    updatePings(now);
    // whispers
    if (ui.whispers && ui.role === 'dm' && state.dread >= 3 && now > whisperAt){ whisperAt = now + (60 - state.dread * 4.5) * 1000 * (0.6 + Math.random() * .8); sendWhisper(pick(WHISPERS)); }
    $('#bloodrim').style.boxShadow = `inset 0 0 ${state.dread * 14}px rgba(150,20,30,${(state.dread - 1) * .05})`;
  }
  controls.update();
  if (fx.shake > 0){ fx.shake = Math.max(0, fx.shake - dt * .2); camera.position.x += (Math.random() - .5) * fx.shake; camera.position.y += (Math.random() - .5) * fx.shake; }
  renderer.render(scene, camera);
}

showStart();
frame();
window.DreadDelve = api;   // handy for debugging in the console: DreadDelve.state, DreadDelve.shiftFloor(0), …
