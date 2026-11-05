/* The 🎨 Look panel and 📸 photo mode — the controls for how good the app
   looks, on a big TV as much as on a phone, and a way to keep the moments
   worth keeping. Every device chooses for itself: the settings live in
   render/gfx.js, per browser, never sent to the table. Ultra is the
   renderer's (render/gfx.js, render/post.js, render/minis.js); a photo comes
   from the renderer's capture() (render/post.js), one frame read at once. */
import { capture } from '../render/post.js';
import { ui, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { gfx, setGfx, onGfx } from '../render/gfx.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';
import { toPlayers } from '../game/outbox.js';
import { valley, clockText } from '../game/overworld.js';
import { placeById } from '../engine/overland.js';

/* This device's Look choices that are not gfx: the offers it has already
   seen, and the photo options. Kept per browser, like gfx. */
const PREF_KEY = 'dreaddelve.look.v1';
const prefs = { dontAsk:false, dropOffered:false, ultraOffered:false, frame:true, caption:true, scale:1 };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch {}
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {} };

/* The presets: what "for this screen" sets, all at once. TV takes ultra only
   when this device has shown it keeps up at high (the watcher below). */
const PRESETS = {
  phone:{ label:'📱 Phone', title:'Low, classic, omens off', set:{ quality:'low', style:'classic', omens:false } },
  laptop:{ label:'💻 Laptop', title:'Medium, omens on', set:{ quality:'medium', omens:true } },
  tv:{ label:'📺 TV', title:'High (ultra if it keeps up), omens on', set:null },
};
function presetSet(k){
  if (k !== 'tv') return PRESETS[k].set;
  return { quality:(recentFps > 55 && gfx.quality === 'high') ? 'ultra' : 'high', omens:true };
}

/* The panel: a sheet with quality, style, omens, sound, presets and photo. */
function panelHTML(){
  const q = gfx.quality, s = gfx.style;
  const qBtn = (k, n) => `<button class="btn small ${q === k ? 'on' : ''}" data-look-q="${k}">${n}</button>`;
  const sBtn = (k, n, d, sw) => `<button class="btn small ${s === k ? 'on' : ''}" data-look-s="${k}"><span class="look-sw" style="background:${sw}"></span>${n} <span class="muted">${d}</span></button>`;
  return `<div style="position:relative;width:min(520px,94vw)"><button class="btn small" data-act="lookClose" style="position:absolute;right:-4px;top:-34px;z-index:2">✕</button>
  <h2 style="margin:0 0 4px">🎨 Look</h2><div class="muted">For this screen only — each device chooses for itself. <span id="lookFps">– fps</span></div>
  <h4>Quality</h4><div class="row">${qBtn('low', 'Low')}${qBtn('medium', 'Medium')}${qBtn('high', 'High')}${qBtn('ultra', 'Ultra')}</div>
  <div class="muted">Low is fast, for phones · medium adds bloom and film grain · high adds torch shadows · ultra is sharper shadows, every torch casting them, full device resolution.</div>
  <h4>Style</h4><div class="row">${sBtn('classic', 'Classic', 'the app as it is', 'linear-gradient(135deg,#1a1c26,#3a4a3a)')}${sBtn('painted', 'Painted', 'an illustrated poster', 'linear-gradient(135deg,#e8c87a,#a33327 55%,#2a6a6a)')}</div>
  <div class="muted">Painted needs medium or high — picking it at low raises quality to medium.</div>
  <h4>Signs &amp; sound</h4><div class="row"><label><input type="checkbox" data-look-omens ${gfx.omens ? 'checked' : ''}> Omens (Strahd's Gaze, outdoors)</label>
  <label><input type="checkbox" data-look-music ${gfx.music ? 'checked' : ''}> Music</label>
  <label><input type="checkbox" data-look-sfx ${gfx.sfx ? 'checked' : ''}> Effects</label></div>
  <div class="row"><label style="flex:1">Volume <input type="range" min="0" max="100" value="${Math.round(gfx.volume * 100)}" data-look-vol style="width:100%"></label></div>
  <h4>For this screen</h4><div class="row">${Object.entries(PRESETS).map(([k, p]) => `<button class="btn small" data-look-preset="${k}" title="${esc(p.title)}">${p.label}</button>`).join('')}</div>
  <div class="muted">Phone: low, classic, omens off · laptop: medium, omens on · TV: high (ultra if it keeps up), omens on.</div>
  <h4>📸 Photo mode</h4><div class="row"><label><input type="checkbox" data-look-frame ${prefs.frame ? 'checked' : ''}> Frame</label>
  <label><input type="checkbox" data-look-caption ${prefs.caption ? 'checked' : ''}> Caption (place and day)</label>
  <label>Size <select data-look-scale><option value="1" ${prefs.scale === 1 ? 'selected' : ''}>Full</option><option value="0.5" ${prefs.scale === 0.5 ? 'selected' : ''}>Half</option></select></label></div>
  <div class="row"><button class="btn small primary" data-act="lookPhoto">📸 Enter photo mode</button></div>
  <div class="muted">Photo mode hides every panel and button, leaving only the 3D view. Capture saves a PNG; the DM can also send one to the table as a handout.</div></div>`;
}
export function openLookPanel(){
  let m = $('#lookPanel');
  if (!m){ m = document.createElement('div'); m.id = 'lookPanel'; m.className = 'modal hidden'; document.body.appendChild(m); }
  m.innerHTML = panelHTML();
  m.classList.remove('hidden');
}
function closeLookPanel(){ $('#lookPanel')?.classList.add('hidden'); }
/* Refresh the panel's controls to match gfx (button states, boxes, slider) —
   without rebuilding it, so a dragged slider is not clobbered mid-drag. */
function refreshLookPanel(){
  const m = $('#lookPanel'); if (!m || m.classList.contains('hidden')) return;
  m.querySelectorAll('[data-look-q]').forEach(b => b.classList.toggle('on', b.dataset.lookQ === gfx.quality));
  m.querySelectorAll('[data-look-s]').forEach(b => b.classList.toggle('on', b.dataset.lookS === gfx.style));
  const om = m.querySelector('[data-look-omens]'); if (om) om.checked = gfx.omens;
  const mu = m.querySelector('[data-look-music]'); if (mu) mu.checked = gfx.music;
  const fx = m.querySelector('[data-look-sfx]'); if (fx) fx.checked = gfx.sfx;
  const vol = m.querySelector('[data-look-vol]'); if (vol && document.activeElement !== vol) vol.value = Math.round(gfx.volume * 100);
}

/* Keeping up: a small frame-time watcher — requestAnimationFrame timing,
   nothing heavier. A five-second average under 24 fps at high or ultra
   offers a drop to medium, once; over 55 fps steadily at high on a big
   screen (wider than 1600 px) offers ultra, once. Nothing ever changes
   without the person's tap, and "don't ask again" is remembered per device. */
let stamps = [], recentFps = 0, frameCount = 0;
function watchFps(now){
  requestAnimationFrame(watchFps);
  stamps.push(now); while (stamps.length && stamps[0] < now - 5000) stamps.shift();
  const span = stamps.length > 1 ? (now - stamps[0]) / 1000 : 0;
  recentFps = span > 0.5 ? stamps.length / Math.min(5, span) : 0;
  if (++frameCount % 30 === 0){ const f = $('#lookFps'); if (f) f.textContent = `${Math.round(recentFps)} fps`; }
  if (document.body.classList.contains('photo') || prefs.dontAsk) return;
  if (recentFps < 24 && (gfx.quality === 'high' || gfx.quality === 'ultra') && !prefs.dropOffered){
    prefs.dropOffered = true; savePrefs();
    showOffer('This screen is struggling: drop to medium?', 'Drop to medium', () => setGfx({ quality:'medium' }));
  } else if (recentFps > 55 && gfx.quality === 'high' && window.innerWidth > 1600 && !prefs.ultraOffered){
    prefs.ultraOffered = true; savePrefs();
    showOffer('This screen is keeping up beautifully: try ultra?', 'Try ultra', () => setGfx({ quality:'ultra' }));
  }
}
function showOffer(text, btn, run){
  let o = $('#lookOffer');
  if (!o){ o = document.createElement('div'); o.id = 'lookOffer'; document.body.appendChild(o); }
  o.innerHTML = `<span>${esc(text)}</span><button class="btn small primary" data-act="lookOfferGo">${btn}</button><button class="btn small" data-act="lookOfferNo">Don't ask again</button><button class="btn small" data-act="lookOfferX">✕</button>`;
  o.querySelector('[data-act="lookOfferGo"]').onclick = () => { run(); o.remove(); };
  o.querySelector('[data-act="lookOfferNo"]').onclick = () => { prefs.dontAsk = true; savePrefs(); o.remove(); };
  o.querySelector('[data-act="lookOfferX"]').onclick = () => o.remove();
}

/* Photo mode: every panel and button hidden (see the CSS), leaving only the
   3D view and a small bar — the camera moves freely, as now. */
function enterPhotoMode(){
  closeLookPanel();
  document.body.classList.add('photo');
  let b = $('#photoBar');
  if (!b){ b = document.createElement('div'); b.id = 'photoBar'; document.body.appendChild(b); }
  b.innerHTML = `<button class="btn small" data-act="photoExit" title="Leave photo mode">✕</button><button class="btn small primary" data-act="photoShot" title="Save a PNG of the view">📸 Capture</button>${ui.role === 'dm' ? `<button class="btn small" data-act="photoHandout" title="Send this view to the table as a handout">📜 Send to the table</button>` : ''}`;
  b.style.display = '';
}
function exitPhotoMode(){ document.body.classList.remove('photo'); const b = $('#photoBar'); if (b) b.style.display = 'none'; }

/* Capture: a frame from the renderer, then the frame and caption drawn on
   at the size asked for (full or half). */
function captureCanvas(){
  const cv = document.querySelector('#stage canvas');
  if (!cv) return Promise.resolve(null);
  // the renderer's own capture (render/post.js): one frame rendered and read at once, so it's never blank
  return new Promise(res => { const src = new Image(); src.onload = () => {
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(cv.width * prefs.scale)); out.height = Math.max(1, Math.round(cv.height * prefs.scale));
    const x = out.getContext('2d');
    x.drawImage(src, 0, 0, out.width, out.height);
    if (prefs.frame){ x.strokeStyle = '#1a1208'; x.lineWidth = 48; x.strokeRect(0, 0, out.width, out.height); x.strokeStyle = '#c9a227'; x.lineWidth = 3; x.strokeRect(32, 32, out.width - 64, out.height - 64); }
    const cap = captionText();
    if (prefs.caption && cap){ const fs = Math.max(20, Math.round(out.width / 40)); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, out.height - fs * 2.4, out.width, fs * 2.4); x.fillStyle = '#e8dcc0'; x.font = `${fs}px Georgia, serif`; x.textAlign = 'center'; x.fillText(cap, out.width / 2, out.height - fs * 0.8); }
    res(out.toDataURL('image/png'));
  }; src.onerror = () => res(null); src.src = capture({ scale:1 }); });
}
function captionText(){
  let place = '', day = '';
  try { const V = valley(); if (V?.at) place = placeById(V.at)?.name || ''; if (V?.day) day = clockText(); } catch {}
  return [place, day].filter(Boolean).join(' · ');
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'view';
function downloadPNG(url, name){
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
}
async function capturePhoto(){
  const url = await captureCanvas();
  if (!url){ toast('No 3D view to photograph.'); return null; }
  downloadPNG(url, `dread-delve-${slug(captionText())}.png`);
  toast('📸 Photo saved.');
  return url;
}
/* The DM's handout: the same view, shrunk for the table (Night's shape — a
   JPEG, never wider than 1280 px), through the Curtain like every card.
   The TV shows a handout as it arrives, and so do the players' phones
   (ui/screen.js showHandoutHere). */
async function sendHandout(){
  const url = await captureCanvas();
  if (!url){ toast('No 3D view to send.'); return; }
  const im = new Image();
  await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = url; });
  const k = Math.min(1, 1280 / im.width), cv = document.createElement('canvas');
  cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
  cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
  const title = captionText() || 'A photo from the table';
  toPlayers({ t:'handout', title, img:cv.toDataURL('image/jpeg', .86), text:`📜 Handout: ${title}` }, 'world');
  log(`📜 Photo handout sent to the table: ${title}.`, true);
  toast('📜 Sent to the table: the TV and the players\' phones show it.');
}

function onLookClick(ev){
  const q = ev.target.closest('[data-look-q]'); if (q){ setGfx({ quality:q.dataset.lookQ }); refreshLookPanel(); return; }
  const s = ev.target.closest('[data-look-s]');
  if (s){ const patch = { style:s.dataset.lookS }; if (patch.style === 'painted' && gfx.quality === 'low') patch.quality = 'medium'; setGfx(patch); refreshLookPanel(); return; }
  const p = ev.target.closest('[data-look-preset]'); if (p){ setGfx(presetSet(p.dataset.lookPreset)); refreshLookPanel(); return; }
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  if (t.dataset.act === 'lookClose') closeLookPanel();
  else if (t.dataset.act === 'lookPhoto') enterPhotoMode();
  else if (t.dataset.act === 'photoExit') exitPhotoMode();
  else if (t.dataset.act === 'photoShot') capturePhoto();
  else if (t.dataset.act === 'photoHandout') sendHandout();
}
function onLookInput(ev){
  const vol = ev.target.closest('[data-look-vol]'); if (vol){ setGfx({ volume:vol.value / 100 }); return; }
  const om = ev.target.closest('[data-look-omens]'); if (om){ setGfx({ omens:om.checked }); return; }
  const mu = ev.target.closest('[data-look-music]'); if (mu){ setGfx({ music:mu.checked }); return; }
  const fx = ev.target.closest('[data-look-sfx]'); if (fx){ setGfx({ sfx:fx.checked }); return; }
  const fr = ev.target.closest('[data-look-frame]'); if (fr){ prefs.frame = fr.checked; savePrefs(); return; }
  const ca = ev.target.closest('[data-look-caption]'); if (ca){ prefs.caption = ca.checked; savePrefs(); return; }
  const sc = ev.target.closest('[data-look-scale]'); if (sc){ prefs.scale = parseFloat(sc.value) || 1; savePrefs(); }
}
function onLookKey(ev){ if (ev.key === 'Escape' && document.body.classList.contains('photo')) exitPhotoMode(); }

export function ensureLook(){
  if (!document.getElementById('lookCSS')){
    const st = document.createElement('style'); st.id = 'lookCSS';
    st.textContent = `body.screen #btnLook{display:none!important}
    #lookPanel .look-sw{display:inline-block;width:22px;height:22px;border-radius:5px;vertical-align:middle;margin-right:6px;border:1px solid var(--line)}
    #lookOffer{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:40;background:var(--glass-strong);border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;gap:8px;align-items:center;max-width:94vw}
    #photoBar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:40;display:flex;gap:8px}
    body.photo #topbar,body.photo #topPanels,body.photo #tabs,body.photo #panel,body.photo #dock,body.photo #toasts,body.photo #cardLayer,body.photo #selCard,body.photo #initBar,body.photo #modeHint,body.photo #moveTip,body.photo #btnPanel,body.photo #roleBadge,body.photo .modal,body.photo #lookOffer{display:none!important}`;
    document.head.appendChild(st);
  }
  if (!$('#btnLook')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnLook'; b.title = 'Look'; b.textContent = '🎨';
    b.onclick = () => openLookPanel();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
  registerCommands([
    { id:'look', n:'Look', hint:'Quality, style, sound, and photo mode', icon:'🎨', role:'both', run:openLookPanel },
    { id:'photo', n:'Photo mode', hint:'Hide the panels and photograph the view', icon:'📸', role:'both', run:enterPhotoMode },
  ]);
  document.addEventListener('click', onLookClick);
  document.addEventListener('input', onLookInput);
  document.addEventListener('keydown', onLookKey);
  onGfx(() => refreshLookPanel());
  requestAnimationFrame(watchFps);
}
