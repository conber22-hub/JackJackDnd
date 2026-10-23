/* DREAD DELVE — boot + the render loop. See DREAD-DELVE-ROADMAP.md for the code map. */
import * as THREE from 'three';
import { state, ui, dreadLevel } from './engine/state.js';
import { THEMES } from './data/themes.js';
import { WHISPERS } from './data/dread.js';
import { pick, $ } from './util/core.js';
import { bus } from './util/core.js';
import { scene, camera, controls, renderer, ambient, hemi, moon, runTweens, fx } from './render/scene.js';
import { renderFrame } from './render/post.js';
import { gfx, onGfx, shadowsOn } from './render/gfx.js';
import { loadStoredModels } from './render/models.js';
import { setDrone, setAmbience } from './audio/sound.js';
import { syncTokens } from './render/minis.js';
import { buildAllFloors } from './render/floors.js';
import { walk } from './engine/tiles.js';
import { floorViews, mist } from './render/floors.js';
import { tokenViews } from './render/minis.js';
import { poseRig } from './render/forge/anim.js';
import { selRing, updatePings, updateGroupRings } from './render/effects.js';
import { updateAmbience, weatherKind } from './render/ambience.js';
import { updateSkyline } from './render/skyline.js';
import { sendWhisper } from './ui/hud.js';
import { renderPanel } from './ui/panels.js';
import { showStart } from './ui/events.js';
import { bootScreenUI } from './ui/screen.js';
import { initCardOnly } from './ui/cards.js';
import { runLocalScreen, listenForScreens } from './net/screen.js';
import { joinTable, readInvite, net, setScreenNow } from './net/table.js';
import { nightNow } from './game/night.js';
import { onAskChange } from './game/asks.js';
import { loadLibrary, onLibrary } from './game/library.js';
import './ui/input.js';
import * as api from './debug.js';

// the DM's books (game/library.js): load them from this browser, and redraw what lists them when they change
onLibrary(() => renderPanel()); loadLibrary();
bus.on('log', () => { if (ui.tab === 'table' || ui.tab === 'log' || ui.role === 'player') renderPanel(); });
bus.on('models', key => { if (!state) return; if (String(key).startsWith('kit:')) buildAllFloors(); syncTokens(); });
function applyQuality(){
  renderer.shadowMap.enabled = shadowsOn(); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (state){ buildAllFloors(); syncTokens(); }
}
onGfx(applyQuality); applyQuality();
loadStoredModels();

const clock = new THREE.Clock();
let whisperAt = performance.now() + 30000;
const fogDark = new THREE.Color('#0d0b10'), fogRed = new THREE.Color('#140808'), redMist = new THREE.Color('#7a2a2a');
function frame(){
  requestAnimationFrame(frame);
  const raw = clock.getDelta(), dt = Math.min(raw, .05), now = performance.now(), t = now / 1000;
  const ease = 1 - Math.pow(.97, Math.min(raw, 1) * 60);   // the same 3%-a-frame easing at any frame rate
  runTweens(now);
  if (state){
    if (state.dread !== frame.dread){ frame.dread = state.dread; setDrone(state.dread); }
    const D = dreadLevel();
    const fogTarget = D.fog * (ui.view === 'stack' ? .3 : ui.view === 'top' ? .35 : 1) * (ui.tab === 'build' && ui.role === 'dm' && !ui.tableView ? .5 : 1);
    scene.fog.density += (fogTarget - scene.fog.density) * Math.min(1, ease * 1.7);
    scene.fog.color.lerp(state.dread >= 8 ? fogRed : fogDark, .02);
    // the DM gets a little work-light; taverns and villages are lit, dungeons are not
    const th = THEMES[state.floors[ui.floor]?.theme] || THEMES[0], outdoor = (th.walls === 'trees' || th.walls === 'mixed') && th.id !== 'tavern';
    // outdoors the valley's clock matters: grey day, dim dawn and dusk, dark night
    const hour = state.campaign?.valley?.hour ?? state.hour;
    const dayK = !outdoor || hour == null ? 1 : hour >= 8 && hour < 17 ? 1.25 : (hour >= 5 && hour < 8) || (hour >= 17 && hour < 20) ? .95 : .72;
    const lit = (th.light || 1) * dayK;
    if (t - (frame.ambAt || 0) > 1){ frame.ambAt = t;   // the room's own sound
      const w = weatherKind(); setAmbience(outdoor ? (w && w !== 'snow' ? 'rain' : 'wind') : th.id === 'tavern' ? 'fire' : ['undertow', 'cellar', 'womb'].includes(th.id) ? 'water' : 'drips'); }
    ambient.intensity += (D.amb * 1.5 * lit * (ui.role === 'dm' && !ui.tableView ? 1.35 : 1) - ambient.intensity) * ease;
    const k = ambient.intensity / .93; hemi.intensity = .45 * k; moon.intensity = 1.1 * k;
    const hue = new THREE.Color(D.hue);
    for (const tv of tokenViews.values()){
      const g = tv.group, u = g.userData, fig = u.fig;
      if (u.light){ u.light.intensity = u.light.userData.base * (1 - D.flick * (.5 + .5 * Math.sin(t * 13 + g.id) * Math.sin(t * 7.3 + g.id * 2))); if (u.light.userData.torch) u.light.color.lerp(hue, .05); }
      if (!fig || g.userData.wasDead || !g.visible) continue;
      if (fig.userData.rig){ poseRig(fig, t, dt, !!tv.anim); continue; }   // forged figures animate themselves
      if (fig.userData.billboard){ const v = camera.position.clone(); g.worldToLocal(v); fig.rotation.y = Math.atan2(v.x, v.z); }
      if (fig.userData.hover) fig.position.y = .15 + Math.sin(t * 2 + g.id) * .08;
      if (fig.userData.pulse){ const s = 1 + Math.sin(t * 2.4 + g.id) * .04; fig.scale.set(s, 1 / s, s); }
      if (fig.userData.skitter) fig.rotation.y = Math.sin(t * 6 + g.id) * .25;
      if (u.mixer) u.mixer.update(dt);
      if (fig.userData.prowl) fig.position.y = Math.abs(Math.sin(t * 3 + g.id)) * .02;
      if (!fig.userData.hover && !fig.userData.pulse && !fig.userData.billboard) fig.scale.y = 1 + Math.sin(t * 1.6 + g.id) * .012;   // breathing
      if (fig.userData.climber) climb(g, fig, t);
      fig.traverse(c => { const s = c.userData.sway; if (s){ c.rotation.x = s.rx + Math.sin(t * 1.8 + s.ph) * s.amp; c.rotation.z = s.rz + Math.cos(t * 1.3 + s.ph) * s.amp * .6; } });
      if (fig.userData.halo) fig.children.forEach(c => { if (c.userData.orbit !== undefined){ const a = c.userData.orbit + t * .6; c.position.x = Math.cos(a) * .22; c.position.z = Math.sin(a) * .22; } });
      fig.children.forEach(c => { if (c.userData.flame) c.scale.x = c.scale.z = .8 + Math.random() * .4; });
    }
    floorViews.forEach(fv => fv?.group.visible && fv.built.traverse(o => { if (o.userData.spin) o.rotation.y += dt * o.userData.spin; if (o.userData.spinZ) o.rotation.z += dt * o.userData.spinZ; if (o.userData.trapId && o.userData.pulse) o.children[0].scale.setScalar(1.05 + Math.sin(t * 3) * .08); }));
    updateAmbience(t, dt);   // candle and fire light, rain and snow
    updateSkyline(t);        // the castle on the horizon
    // walls breathe red when his Gaze is high
    floorViews.forEach(fv => { if (!fv) return; const m = fv.mats.wall; m.emissive.set('#5a0a10'); m.emissiveIntensity = state.dread >= 7 ? (state.dread - 6) * .06 * (1 + Math.sin(t * 1.3)) : 0; });
    // selection ring
    const st = ui.selected && tokenViews.get(ui.selected);
    updateGroupRings();
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
  if (!(ui.cardOnly && ui.role === 'player')) renderFrame(t, state ? (state.dread - 1) / 9 : 0);   // card only: the TV has the map
}

// Hands crawl up onto the nearest wall and cling there.
function climb(g, fig, t){
  const id = g.userData.tokenId, tok = state.tokens.find(x => x.id === id); if (!tok) return;
  const f = state.floors[tok.floor]; let dir = null;
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = tok.x + dx, ny = tok.y + dy; if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H || !walk(f.grid[ny * f.W + nx])){ dir = [dx, dy]; break; } }
  const tx = dir ? dir[0] * .32 : 0, tz = dir ? dir[1] * .32 : 0, ty = dir ? .45 : 0;
  const rx = dir ? -dir[1] * 1.25 : 0, rz = dir ? dir[0] * 1.25 : 0;
  fig.position.x += (tx - fig.position.x) * .08; fig.position.z += (tz - fig.position.z) * .08; fig.position.y += (ty + Math.sin(t * 5 + g.id) * .03 - fig.position.y) * .08;
  fig.rotation.x += (rx - fig.rotation.x) * .08; fig.rotation.z += (rz - fig.rotation.z) * .08;
}

// ?screen: this window is the table screen for the TV (ui/screen.js) — of this computer's DM window, or of a
// table on another device (?screen=CODE). Otherwise the threshold (start page).
const scr = new URLSearchParams(location.search).get('screen');
if (scr !== null){
  readInvite(); bootScreenUI(); $('#startModal')?.classList.add('hidden');
  if (scr.length >= 4){ joinTable(scr, '📺 Table screen', 'screen-' + Math.random().toString(36).slice(2, 8)); net.join.screen = true; }
  else runLocalScreen();
} else showStart();
initCardOnly();   // a player's phone at an in-person game: no 3D (ui/cards.js)
setScreenNow(nightNow); listenForScreens();
onAskChange(() => { if (ui.tab === 'night') renderPanel(); });
frame();
window.DreadDelve = api;   // handy for debugging in the console: DreadDelve.state, DreadDelve.shiftFloor(0), …
