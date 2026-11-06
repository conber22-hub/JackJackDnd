/* 📜 The Chronicle (brief-8) — each device's own record of the story as it
   reached them, kept across sessions: the cards shown, handout pictures,
   the Count's letters, whispers and secret notes, grouped into nights.
   Nothing in it is ever sent anywhere; a player's whispers and notes stay
   on their own device. The DM's copy records what they sent and to whom,
   so a whisper to one player doesn't slip out to the others.

   How it hears: bus 'table' on a player's device, bus 'sent' on the DM's
   (see the PR: neither event is emitted yet — the table's message path and
   the outbox are Claude's, and the exact lines are described there — so
   until they land the Chronicle listens patiently and records nothing.
   The spec drives the bus directly, which is what proves the recorder.) */
import { state, ui } from '../engine/state.js';
import { $, esc, bus } from '../util/core.js';
import { VALLEY_PLACES } from '../data/barovia-map.js';
import { registerCommands } from './palette.js';
import { toast } from './hud.js';

const KEY_PREFIX = 'dreaddelve.chronicle.';
const PREFS_KEY = 'dreaddelve.chronicle.prefs.v1';
const MAX_ENTRIES = 500;      // the book is a record, not an archive without end
const MAX_PICTURES = 30;      // only the 30 most recent handout pictures keep their data
const STORE_CAP = 4 * 1024 * 1024;   // stay under about 4 MB in localStorage
const NIGHT_GAP = 6 * 3600 * 1000;   // more than 6 hours between entries starts a new night
const DEDUPE_MS = 60 * 1000;        // an identical card within a minute is the same showing

const KIND_ICON = { card:'🃏', letter:'✉️', picture:'🖼️', whisper:'💭', note:'📝', estate:'🏰', banner:'📣' };
const FILTERS = [['all','All'], ['card','Cards'], ['letter','Letters'], ['whisper','Whispers'], ['picture','Pictures'], ['note','Notes']];

const placeName = id => VALLEY_PLACES.find(p => p.id === id)?.name || (id ? String(id) : 'The Mist Wall');

/* Where and when this entry happened, in the game's own terms. The valley
   (DM) or the shared valley (players) carries day, hour and place; the map
   name is the delve's. The storage key is the valley's seed when there is
   one, else the delve's seed — the same device, the same campaign. */
function context(){
  const V = state?.campaign?.valley || state?.valley;
  return {
    day:V?.day ?? 1, hour:V?.hour ?? 19,
    place:placeName(V?.at ?? 'mists'),
    map:state?.meta?.name || '',
    seed:V?.seed || state?.meta?.seed || 'default',
  };
}
const storeKey = () => KEY_PREFIX + context().seed + '.v1';
const fallbackKey = () => KEY_PREFIX + (state?.meta?.seed || 'default') + '.v1';

function prefs(){
  try { return { keepRolls:false, ...(JSON.parse(localStorage.getItem(PREFS_KEY)) || {}) }; }
  catch { return { keepRolls:false }; }
}
function savePrefs(p){ try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {} }

/* Load: the primary key first; if it is empty but the delve-seed key has
   entries (the valley was first opened after some entries were recorded
   under the delve's seed), adopt those instead of starting a blank book. */
function loadEntries(){
  for (const k of [storeKey(), fallbackKey()]){
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) return list.filter(e => e && typeof e.at === 'number');
    } catch {}
  }
  return [];
}
let entries = null;   // null until first load (per page); the in-memory copy of the book
const getEntries = () => (entries ??= loadEntries());

function saveEntries(list){
  entries = list;
  // Oldest pictures lose their data first (their entries stay); then the
  // oldest entries go. Keep trying until the book fits, or give up quietly.
  const pruned = list.slice(-MAX_ENTRIES);
  let withPics = 0;
  for (let i = pruned.length - 1; i >= 0; i--){
    if (!pruned[i].picture) continue;
    if (++withPics > MAX_PICTURES) pruned[i] = { ...pruned[i], picture:null };
  }
  const key = storeKey();
  const write = l => { try { localStorage.setItem(key, JSON.stringify(l)); return true; } catch { return false; } };
  if (write(pruned)) return;
  const noPics = pruned.map(e => (e.picture ? { ...e, picture:null } : e));
  if (write(noPics)) { entries = noPics; return; }
  const half = noPics.slice(-100);
  if (write(half)) { entries = half; return; }
  // Storage is full even for a hundred bare entries: keep them in memory
  // for this session and say so once, rather than throwing on every card.
  if (!saveEntries.warned){ saveEntries.warned = true; toast('The Chronicle is full — new pages are kept for this session only.'); }
}

const stripHtml = s => {
  const d = document.createElement('div'); d.innerHTML = String(s || '');
  return (d.textContent || '').replace(/\s+\n/g, '\n').trim();
};
const isRoll = (c, text) => !!c?.die || /hit|miss|damage|save/i.test(((c?.kind || '') + ' ' + text));
const uid = () => `ch-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

/* A handout picture, downscaled to 800 px wide JPEG when it is bigger than
   that (a small picture is kept as it is — no point re-encoding it). */
function downscalePicture(url){
  return new Promise(res => {
    if (!url || typeof url !== 'string') return res(null);
    const img = new Image();
    img.onload = () => {
      try {
        if (img.naturalWidth <= 800) return res(url);
        const cv = document.createElement('canvas');
        cv.width = 800; cv.height = Math.round(800 * img.naturalHeight / img.naturalWidth);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/jpeg', .82));
      } catch { res(url); }
    };
    img.onerror = () => res(url);
    img.src = url;
  });
}

/* Turn one table message into an entry, or null when it is noise. `to` is
   set only for the DM's records (a hero id, or null for the whole table). */
function toEntry(msg, to){
  if (!msg || typeof msg.t !== 'string') return null;
  const ctx = context();
  const base = { id:uid(), at:Date.now(), day:ctx.day, hour:ctx.hour, place:ctx.place, map:ctx.map };
  if (to !== undefined) base.to = to ?? null;
  const t = msg.t;
  if (t === 'card'){
    const c = msg.c || {};
    const text = stripHtml([c.sub, ...(c.lines || [])].filter(Boolean).join('\n'));
    const title = String(c.title || c.sub || 'A card').replace(/<[^>]*>/g, '');
    if (!title && !text) return null;
    if (isRoll(c, text) && !prefs().keepRolls) return null;
    return { ...base, kind:'card', title, text, portrait:!!c.portrait };
  }
  if (t === 'letter'){
    const l = msg.letter || {};
    return { ...base, kind:'letter', title:String(l.title || 'A letter from the Count'), text:String(l.body || ''), from:l.from || '' };
  }
  if (t === 'handout'){
    const pic = msg.img || msg.url || null;   // the code sends img; the brief says url — take either
    return { ...base, kind:'picture', title:String(msg.title || 'A picture'), text:String(msg.caption || ''), picture:pic };
  }
  if (t === 'whisper') return { ...base, kind:'whisper', title:'A whisper', text:String(msg.text || '') };
  if (t === 'note') return { ...base, kind:'note', title:msg.strahd ? 'A voice only you can hear' : 'A note, for you alone', text:String(msg.text || ''), strahd:!!msg.strahd };
  if (t === 'estate'){
    const e = msg.estate || {}, h = e.holding || {};
    return { ...base, kind:'estate', title:'Our place', text:[h.name, h.kind].filter(Boolean).join(' — ') || 'The party’s holding' };
  }
  if (t === 'banner'){
    if (/your turn/i.test(String(msg.text || ''))) return null;   // noise, never recorded
    return { ...base, kind:'banner', title:String(msg.text || 'A banner'), text:'' };
  }
  return null;
}

function record(msg, to){
  if (!state || ui.screen) return null;
  const entry = toEntry(msg, to);
  if (!entry) return null;
  const list = getEntries();
  const last = list[list.length - 1];
  if (last && last.kind === entry.kind && last.title === entry.title && last.text === entry.text
    && entry.at - last.at < DEDUPE_MS) return null;   // the same card shown twice in a minute
  if (entry.kind === 'picture' && entry.picture){
    // The picture arrives after the downscale; the entry itself is filed now.
    downscalePicture(entry.picture).then(pic => {
      const cur = getEntries(), found = cur.find(e => e.id === entry.id);
      if (found && found.picture){ found.picture = pic; saveEntries(cur); if (sheetOpen()) render(); }
    });
  }
  list.push(entry);
  saveEntries(list);
  if (sheetOpen()) render();
  return entry;
}

/* Players record what reaches their screen; the DM records what they send.
   (Checked at the event, not at subscribe time: a test flips the role
   after the module starts, and the DM's own screen shows the card too.) */
function onTable(m){ if (ui.role !== 'dm') record(m); }
function onSent({ msg, to } = {}){ if (ui.role === 'dm') record(msg, to); }

/* Group entries into nights, newest night first. A gap of more than six
   hours between entries starts a new night. */
export function groupNights(list){
  const sorted = [...list].sort((a, b) => a.at - b.at);
  const nights = [];
  for (const e of sorted){
    const last = nights[nights.length - 1];
    if (!last || e.at - last.entries[last.entries.length - 1].at > NIGHT_GAP){
      nights.push({ day:e.day, place:e.place, at:e.at, entries:[e] });
    } else last.entries.push(e);
  }
  return nights.reverse();
}
const importance = e => e.kind === 'letter' ? 3 : e.kind === 'picture' ? 3 : e.kind === 'card' && e.portrait ? 2 : e.kind === 'card' ? 1 : 0;

/* "Previously…": the last night, its five most important entries — letters,
   handouts and cards with a portrait first — in the order they happened.
   Built from the entries alone; no AI. */
export function buildRecap(list){
  const nights = groupNights(list);
  const night = nights[0];
  if (!night) return null;
  const picked = [...night.entries].sort((a, b) => importance(b) - importance(a) || b.at - a.at).slice(0, 5)
    .sort((a, b) => a.at - b.at);
  return { day:night.day, place:night.place, at:night.at, entries:picked };
}

const nightTitle = n => `Day ${n.day} · ${n.place}`;
const nightDate = n => new Date(n.at).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
const entryTime = e => {
  const d = new Date(e.at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const toLine = e => {
  if (!('to' in e)) return '';
  const name = e.to ? (state?.tokens || []).find(t => t.id === e.to)?.name || 'a hero' : null;
  return name ? `to ${name}` : 'to all';
};

/* ---- Reading ---- */

let sheet = null, query = '', filter = 'all';
const sheetOpen = () => !!sheet && !sheet.classList.contains('hidden');

function entryHtml(e){
  const to = toLine(e);
  const pic = e.picture ? `<img class="ch-thumb" src="${esc(e.picture)}" alt="" data-ch-full="${esc(e.picture)}">` : '';
  const body = e.kind === 'letter'
    ? `<div class="ch-letter"><div class="ch-letter-from">${esc(e.from || 'Count Strahd')}</div><div class="ch-text">${esc(e.text)}</div></div>`
    : (e.text ? `<div class="ch-text" data-ch-fold>${esc(e.text)}</div>` : '');
  return `<article class="ch-entry" data-ch-entry data-kind="${e.kind}">
    <span class="ch-icon" aria-hidden="true">${KIND_ICON[e.kind] || '📜'}</span>
    <div class="ch-entry-body">
      <div class="ch-entry-head"><span class="ch-title">${esc(e.title)}</span>${to ? `<span class="ch-to">${esc(to)}</span>` : ''}<span class="ch-time">${entryTime(e)}</span></div>
      ${body}${pic}
    </div></article>`;
}

function render(){
  if (!sheet) return;
  const list = getEntries();
  const q = query.trim().toLowerCase();
  const nights = groupNights(list).map(n => ({
    ...n,
    entries:n.entries.filter(e => (filter === 'all' || e.kind === filter)
      && (!q || (e.title + ' ' + e.text).toLowerCase().includes(q))),
  })).filter(n => n.entries.length);
  const box = sheet.querySelector('#chNights');
  if (!list.length){
    box.innerHTML = `<p class="muted" style="text-align:center;padding:24px 8px">Nothing in the Chronicle yet — cards, letters, whispers and pictures will gather here as the story reaches you.</p>`;
  } else if (!nights.length){
    box.innerHTML = `<p class="muted" style="text-align:center;padding:24px 8px">Nothing matches that search.</p>`;
  } else {
    box.innerHTML = nights.map(n => `<section class="ch-night">
      <header class="ch-night-head"><h3>${esc(nightTitle(n))}</h3><span class="muted">${esc(nightDate(n))}</span></header>
      ${n.entries.map(entryHtml).join('')}
    </section>`).join('');
  }
  sheet.querySelector('#chRolls').checked = prefs().keepRolls;
  sheet.querySelectorAll('[data-ch-filter]').forEach(b => b.classList.toggle('on', b.dataset.chFilter === filter));
}

function buildSheet(){
  sheet = document.createElement('div');
  sheet.id = 'chronicleSheet';
  sheet.className = 'modal hidden';
  sheet.innerHTML = `<div class="box chronicle-book">
    <div class="ch-head"><h2>📜 The Chronicle</h2><button class="btn small" data-act="chClose" title="Close">✕</button></div>
    <p class="muted" style="margin:0 0 8px">Your own record of the story as it reached you. Nothing in it is ever sent anywhere.</p>
    <div class="ch-tools">
      <input class="txt" id="chSearch" type="search" placeholder="Search titles and text…" aria-label="Search the Chronicle">
      <div class="ch-chips">${FILTERS.map(([k, label]) => `<button class="btn small" data-ch-filter="${k}">${label}</button>`).join('')}</div>
      <label class="ch-rolls muted"><input type="checkbox" id="chRolls"> Keep roll results</label>
    </div>
    <div class="ch-actions">
      <button class="btn" data-act="chPreviously">Previously…</button>
      <button class="btn" data-act="chSaveText">Save as text</button>
      <button class="btn" data-act="chSaveNight">Save night as picture</button>
      <button class="btn" data-act="chClear">Clear the Chronicle</button>
    </div>
    <div id="chNights"></div>
  </div>
  <div id="chronicleRecap" class="modal hidden"><div class="box chronicle-book ch-recap">
    <div class="ch-head"><h2>Previously…</h2><button class="btn small" data-act="chRecapClose" title="Close">✕</button></div>
    <div id="chRecapBody"></div>
  </div></div>
  <div id="chFull" class="modal hidden"><div class="box" style="text-align:center"><img id="chFullImg" src="" alt="" style="max-width:100%;max-height:78vh;border-radius:12px"><div class="muted" style="margin-top:8px">Tap to put it away.</div></div></div>`;
  document.body.appendChild(sheet);
  sheet.querySelector('#chSearch').addEventListener('input', e => { query = e.target.value; render(); });
  sheet.querySelector('#chRolls').addEventListener('change', e => savePrefs({ ...prefs(), keepRolls:e.target.checked }));
  sheet.addEventListener('click', e => {
    const fold = e.target.closest('[data-ch-fold]');
    if (fold){ fold.classList.toggle('open'); return; }
    const full = e.target.closest('[data-ch-full]');
    if (full){
      sheet.querySelector('#chFullImg').src = full.dataset.chFull;
      sheet.querySelector('#chFull').classList.remove('hidden');
      return;
    }
    if (e.target.closest('#chFull')){ sheet.querySelector('#chFull').classList.add('hidden'); return; }
    const chip = e.target.closest('[data-ch-filter]');
    if (chip){ filter = chip.dataset.chFilter; render(); return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'chClose') closeChronicle();
    else if (act === 'chPreviously') openRecap();
    else if (act === 'chRecapClose') sheet.querySelector('#chronicleRecap').classList.add('hidden');
    else if (act === 'chSaveText') saveText();
    else if (act === 'chSaveNight') saveNightPicture();
    else if (act === 'chClear') clearChronicle();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheetOpen()) closeChronicle();
  });
}

export function openChronicle(){
  if (!sheet) buildSheet();
  render();
  sheet.classList.remove('hidden');
}
export function closeChronicle(){ sheet?.classList.add('hidden'); }

function openRecap(){
  const recap = buildRecap(getEntries());
  const body = sheet.querySelector('#chRecapBody');
  if (!recap){
    body.innerHTML = `<p class="muted">Nothing to recap yet — the Chronicle is empty.</p>`;
  } else {
    body.innerHTML = `<p class="ch-recap-head">${esc(nightTitle(recap))} · ${esc(nightDate(recap))}</p>
      ${recap.entries.map(e => `<article class="ch-entry" data-kind="${e.kind}">
        <span class="ch-icon" aria-hidden="true">${KIND_ICON[e.kind] || '📜'}</span>
        <div class="ch-entry-body"><div class="ch-entry-head"><span class="ch-title">${esc(e.title)}</span></div>
        ${e.picture ? `<img class="ch-thumb" src="${esc(e.picture)}" alt="">` : ''}
        ${e.text ? `<div class="ch-text open">${esc(e.text)}</div>` : ''}</div></article>`).join('')}`;
  }
  sheet.querySelector('#chronicleRecap').classList.remove('hidden');
}

/* ---- Export ---- */

function download(url, name){
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}
const slug = s => String(s || 'chronicle').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chronicle';

function chronicleText(){
  const nights = groupNights(getEntries());
  const lines = ['THE CHRONICLE', ''];
  for (const n of [...nights].reverse()){
    lines.push(`${nightTitle(n)} — ${nightDate(n)}`, '');
    for (const e of n.entries){
      lines.push(`[${entryTime(e)}] ${KIND_ICON[e.kind] || ''} ${e.title}${toLine(e) ? ` (${toLine(e)})` : ''}`);
      if (e.text) lines.push(e.text);
      if (e.picture) lines.push('[a picture]');
      lines.push('');
    }
  }
  return lines.join('\n');
}
export function saveText(){
  const list = getEntries();
  if (!list.length){ toast('Nothing in the Chronicle yet.'); return; }
  const blob = new Blob([chronicleText()], { type:'text/plain' });
  download(URL.createObjectURL(blob), `chronicle-${slug(context().map)}.txt`);
  toast('📜 The Chronicle is saved as text.');
}

/* The current (newest) night as a PNG page: cream paper, the night's head,
   then each entry's title and wrapped text, with thumbnails drawn small. */
export function exportNightPNG(){
  const nights = groupNights(getEntries());
  const night = nights[0];
  if (!night) return null;
  const W = 900, pad = 48, lineH = 30;
  const wrap = (ctx, text, max) => {
    const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
    let line = '';
    for (const w of words){
      if (ctx.measureText(line + ' ' + w).width > max && line){ lines.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) lines.push(line);
    return lines;
  };
  const draw = (ctx, night, pics) => {
    let y = pad + 8;
    ctx.fillStyle = '#2b1d10'; ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText(nightTitle(night), pad, y); y += 30;
    ctx.font = '22px Georgia, serif'; ctx.fillStyle = '#6b5636';
    ctx.fillText(nightDate(night), pad, y); y += 44;
    ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke(); y += 36;
    for (const e of night.entries){
      ctx.font = 'bold 26px Georgia, serif'; ctx.fillStyle = '#2b1d10';
      const titleLines = wrap(ctx, `${KIND_ICON[e.kind] || '📜'} ${e.title}`, W - pad * 2);
      for (const l of titleLines){ ctx.fillText(l, pad, y); y += lineH; }
      if (e.text){
        ctx.font = '24px Georgia, serif'; ctx.fillStyle = '#3a2c1a';
        const body = wrap(ctx, e.text, W - pad * 2).slice(0, 6);
        for (const l of body){ ctx.fillText(l, pad, y); y += lineH; }
      }
      const pic = pics[e.id];
      if (pic){ const h = 220; ctx.drawImage(pic, pad, y + 8, 300, h); y += h + 16; }
      y += 14;
    }
    return y + pad;
  };
  const pics = {};
  const loads = night.entries.filter(e => e.picture).map(e => new Promise(res => {
    const img = new Image();
    img.onload = () => { pics[e.id] = img; res(); };
    img.onerror = () => res();
    img.src = e.picture;
  }));
  const cv = document.createElement('canvas');
  cv.width = W;
  const measure = document.createElement('canvas').getContext('2d');
  const height = draw(measure, night, {});
  cv.height = Math.min(4000, Math.max(400, height));
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f3e6c8'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, cv.width - 10, cv.height - 10);
  return Promise.all(loads).then(() => {
    // Pictures arrived after measuring: redraw with them (the page grows if needed).
    const h2 = draw(ctx, night, pics);
    if (h2 > cv.height){ cv.height = Math.min(4000, h2); ctx.fillStyle = '#f3e6c8'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, cv.width - 10, cv.height - 10); draw(ctx, night, pics); }
    return cv.toDataURL('image/png');
  });
}
function saveNightPicture(){
  exportNightPNG()?.then(url => {
    if (!url){ toast('Nothing in the Chronicle yet.'); return; }
    const night = groupNights(getEntries())[0];
    download(url, `chronicle-${slug(nightTitle(night))}.png`);
    toast('📜 The night is saved as a picture.');
  });
}

function clearChronicle(){
  if (!window.confirm('Clear the whole Chronicle? This cannot be undone.')) return;
  entries = [];
  try { localStorage.removeItem(storeKey()); localStorage.removeItem(fallbackKey()); } catch {}
  render();
  toast('The Chronicle is cleared.');
}

/* ---- Start ---- */

let started = false;
export function ensureChronicle(){
  if (started) return; started = true;
  if (!document.getElementById('chronicleCSS')){
    const st = document.createElement('style'); st.id = 'chronicleCSS';
    st.textContent = `body.screen #btnChronicle{display:none!important}
    .chronicle-book{background:linear-gradient(175deg,#f6ecd2,#efe0bb 60%,#e6d3a4);color:#2b1d10;border:6px solid #4a2c14;outline:2px solid #2b1d10;border-radius:4px 14px 14px 4px/14px 4px 4px 14px;padding:18px 20px;font-family:var(--serif);filter:drop-shadow(0 10px 24px rgba(0,0,0,.5));max-width:720px;max-height:86vh;overflow-y:auto}
    .chronicle-book h2{font-family:var(--serif);font-size:24px;color:#2b1d10;-webkit-text-fill-color:#2b1d10;background:none;text-shadow:none}.chronicle-book h2::after,.chronicle-book h2::before{display:none}
    .ch-head{display:flex;align-items:center;gap:8px}.ch-head h2{flex:1}
    .chronicle-book .btn{background:rgba(43,29,16,.08);border-color:rgba(43,29,16,.25);color:#2b1d10}
    .chronicle-book .btn.primary{background:#4a0d0d;border-color:#4a0d0d;color:#f3e6c8}
    .chronicle-book .btn.on{background:#4a2c14;border-color:#4a2c14;color:#f3e6c8}
    .chronicle-book .muted{color:rgba(43,29,16,.6)}
    .ch-tools{display:flex;flex-direction:column;gap:8px;margin:8px 0}
    .ch-tools .txt{background:rgba(255,255,255,.6);border-color:rgba(43,29,16,.3);color:#2b1d10}
    .ch-chips{display:flex;flex-wrap:wrap;gap:6px}
    .ch-rolls{display:flex;align-items:center;gap:6px;font-size:14px}
    .ch-actions{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
    .ch-night{margin-top:14px;border-top:2px solid rgba(43,29,16,.35);padding-top:10px}
    .ch-night-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
    .ch-night-head h3{font-size:19px;margin:0}
    .ch-entry{display:flex;gap:10px;padding:10px 2px;border-top:1px solid rgba(43,29,16,.18)}
    .ch-icon{font-size:20px;line-height:1.4;flex:none}
    .ch-entry-body{flex:1;min-width:0}
    .ch-entry-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
    .ch-title{font-weight:700;font-size:17px}
    .ch-to{font-size:13px;font-style:italic;color:rgba(43,29,16,.65)}
    .ch-time{margin-left:auto;font-size:13px;color:rgba(43,29,16,.55)}
    .ch-text{white-space:pre-wrap;line-height:1.55;font-size:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    .ch-text.open{display:block}
    .ch-thumb{display:block;max-width:220px;max-height:160px;margin-top:8px;border:1px solid rgba(43,29,16,.35);border-radius:4px;cursor:pointer}
    .ch-letter{background:linear-gradient(175deg,#efe3c2,#e2d2a8 60%,#d3bd8d);border-radius:6px 12px 8px 14px/12px 8px 14px 6px;padding:12px 14px;margin-top:6px;box-shadow:0 2px 8px rgba(0,0,0,.2)}
    .ch-letter .ch-text{display:block;-webkit-line-clamp:unset;overflow:visible;cursor:default}
    .ch-letter-from{font-size:14px;font-style:italic;margin-bottom:6px}
    .ch-recap .ch-text{display:block;-webkit-line-clamp:unset;overflow:visible;cursor:default}
    .ch-recap-head{font-size:20px;font-weight:700;margin:4px 0 10px}
    @media (max-width:480px){.chronicle-book{padding:14px}.chronicle-book h2{font-size:20px}.ch-text{font-size:15px}}
    @media (prefers-reduced-motion:reduce){.chronicle-book *{animation:none!important;transition:none!important}}`;
    document.head.appendChild(st);
  }
  if (!$('#btnChronicle')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnChronicle'; b.title = 'Chronicle'; b.textContent = '📜';
    b.onclick = () => openChronicle();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
  registerCommands([{ id:'chronicle', n:'Chronicle', hint:'Your own record of the story as it reached you, night by night', icon:'📜', role:'both', run:openChronicle }]);
  bus.on('table', onTable);
  bus.on('sent', onSent);
  bus.on('state', () => { if (sheetOpen()) render(); });   // the day or place may have moved
  setTimeout(expose, 0);
}

/* The spec's handle on the book: its own window global, because
   window.DreadDelve is the debug module's namespace object and is not
   extensible — assigning to it throws (see the Map Book). */
function expose(){
  if (!window.DreadDelveChronicle) window.DreadDelveChronicle = {
    bus, entries:() => getEntries(), key:storeKey,
    openChronicle, openRecap, exportText:() => chronicleText(), exportNightPNG,
    reset:() => { entries = []; try { localStorage.removeItem(storeKey()); localStorage.removeItem(fallbackKey()); } catch {} },
  };
}
