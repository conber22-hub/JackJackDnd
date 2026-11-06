/* The 🗺️ Map Book — each player's own hand-drawn record of everywhere the
   party has explored, one page per floor, on their phone. Walls in ink, the
   stepped corners of round and eight-sided rooms drawn as diagonal strokes,
   doors, stairs and water, dots for the heroes, and the player's own private
   pins with notes. The DM gets the same book, with a toggle to show the whole
   floor faintly while preparing. Pins live per device in localStorage, keyed
   by the map's name and the floor, and are never sent to anyone.
   Live: the page redraws when a new state arrives or after changed() — see
   the PR: no bus event fires for either today (only 'log' and 'models' are
   ever emitted), so while the book is open it fingerprints the state a few
   times a second and redraws on a change, and it also listens for bus
   'state' in case that event lands later. */
import { state, ui } from '../engine/state.js';
import { $, esc, bus, mulberry32, hashSeed, clamp } from '../util/core.js';
import { T, walk } from '../engine/tiles.js';
import { SLANTED, isShaped, inShape } from '../engine/shapes.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';

const INK = '#3a2a18';          // dark sepia, for the walls
const WATER_INK = '#33475a';    // the same ink, gone cold, for water
const PIN_INK = '#8a2f23';      // a pin's red-brown wax
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'map';

/* ---------- the drawing helper (exported, for the spec) ---------- */

// The squares a floor's grid calls open, limited to what has been explored:
// a square counts only when it is open in the grid AND in the explored set.
// (On a player's device the grid itself is already redacted to explored
// squares plus an edge; on the DM's, the explored set does the limiting.)
const openSet = (floor, explored) => {
  const exp = explored instanceof Set ? explored : new Set(explored || []);
  const open = new Set();
  const g = floor.grid || [];
  for (let i = 0; i < g.length; i++) if (exp.has(i) && walk(+g[i])) open.add(i);
  return open;
};

/* Wall segments for a floor, in square units (y down), as {x1,y1,x2,y2,diag}:
   an ink line along every edge between an explored open square and rock,
   and — for round and eight-sided rooms — a diagonal stroke across a rock
   square whose room floor lies on two sides that meet, with nothing open on
   its other two sides (the 3D view's wedge, in render/floors.js: the same
   test, the same slant). A diagonal replaces the two stepped edges it cuts
   across, so those edges are left out here. */
export function wallSegments(floor, explored){
  const W = floor.W, H = floor.H, g = floor.grid || [];
  const open = openSet(floor, explored);
  const isOpen = (x, y) => x >= 0 && y >= 0 && x < W && y < H && open.has(y * W + x);
  const code = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : +g[y * W + x];
  // The slanted corners: rock squares of a round or eight-sided room.
  const diag = new Map();   // rock index -> {x1,y1,x2,y2}; replaced edges keyed "rock:open"
  const replaced = new Set();
  for (const r of floor.rooms || []){
    if (!SLANTED.has(r.shape) || !isShaped(r)) continue;
    const roomFloor = (x, y) => isOpen(x, y) && code(x, y) === T.ROOM && inShape(r, x, y);
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++){
      if (isOpen(x, y)) continue;
      const n = roomFloor(x, y - 1), e = roomFloor(x + 1, y), s = roomFloor(x, y + 1), w = roomFloor(x - 1, y);
      // two sides that meet, and nothing open on the other two
      const kind = n && e && !s && !w ? 'ne' : n && w && !s && !e ? 'nw' : s && w && !n && !e ? 'sw' : s && e && !n && !w ? 'se' : null;
      if (!kind) continue;
      // the diagonal cuts across the corner the two open squares share:
      // NE or SW of the square runs NW-SE; NW or SE runs NE-SW.
      const seg = (kind === 'ne' || kind === 'sw')
        ? { x1:x, y1:y, x2:x + 1, y2:y + 1, diag:true }
        : { x1:x + 1, y1:y, x2:x, y2:y + 1, diag:true };
      diag.set(y * W + x, seg);
      const openNeighbours = { ne:[[x, y - 1], [x + 1, y]], nw:[[x, y - 1], [x - 1, y]], sw:[[x, y + 1], [x - 1, y]], se:[[x, y + 1], [x + 1, y]] }[kind];
      for (const [ox, oy] of openNeighbours) replaced.add(`${y * W + x}:${oy * W + ox}`);
    }
  }
  const segs = [...diag.values()];
  // Every edge between an explored open square and rock (or the floor's edge).
  const dirs = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1]];   // [dx, dy, x1, y1, x2, y2] of the edge
  for (const i of open){
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy, ax, ay, bx, by] of dirs){
      const nx = x + dx, ny = y + dy;
      if (isOpen(nx, ny)) continue;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && replaced.has(`${ny * W + nx}:${i}`)) continue;   // the diagonal has this edge
      segs.push({ x1:x + ax, y1:y + ay, x2:x + bx, y2:y + by, diag:false });
    }
  }
  return segs;
}

/* ---------- pins: private, per device ---------- */

const pinKey = L => `dreaddelve.mapbook.${slug(state?.meta?.name)}.f${L}.v1`;
const loadPins = L => { try { return JSON.parse(localStorage.getItem(pinKey(L)) || '[]'); } catch { return []; } };
const savePins = (L, list) => { try { localStorage.setItem(pinKey(L), JSON.stringify(list)); } catch {} };

/* ---------- the book ---------- */

let page = 0;                 // the floor in view
let showWhole = false;        // the DM's toggle: draw unexplored squares faintly
let view = { k:1, tx:0, ty:0 };   // the reader's zoom and pan, reset on turning the page
let editingPin = null;        // {id?, x, y} — the pin the editor holds, or a fresh one
let liveTimer = null, lastPrint = '', drawTimer = null;

const partyFloor = () => {
  const me = ui.myToken && (state?.tokens || []).find(t => t.id === ui.myToken);
  if (me) return me.floor;
  const pc = (state?.tokens || []).find(t => t.kind === 'pc');
  return pc ? pc.floor : ui.floor;
};
const floorTitle = (f, L) => (f?.name && f.name !== 'Unexplored') ? f.name : `Floor ${L + 1}`;
const allOpen = f => new Set((f.grid || []).map((v, i) => walk(+v) ? i : -1).filter(i => i >= 0));

function sheetHTML(){
  return `<div class="mapbook-sheet">
    <div class="mapbook-head" id="mapHead">
      <button class="btn small" data-act="mbPrev" aria-label="Previous floor">‹</button>
      <h2 id="mapTitle" style="margin:0">Map Book</h2>
      <button class="btn small" data-act="mbNext" aria-label="Next floor">›</button>
    </div>
    <div class="muted" id="mapPage" style="text-align:center"></div>
    <canvas id="mapCanvas" aria-label="Hand-drawn map of this floor"></canvas>
    <div class="row" style="margin-top:8px;flex-wrap:wrap">
      <button class="btn small" data-act="mbFit">Fit</button>
      <button class="btn small primary" data-act="mbSave">💾 Save as picture</button>
      <label id="mapWholeWrap" class="muted" style="display:none"><input type="checkbox" id="mapWhole"> Show the whole floor</label>
    </div>
    <div id="mapPinEdit" class="mapbook-pin-edit" hidden>
      <input class="txt" id="mbNote" maxlength="80" placeholder="A note for yourself — “lever here?”">
      <div class="row" style="margin-top:6px">
        <button class="btn small primary" data-act="mbPinSave">Save pin</button>
        <button class="btn small" data-act="mbPinRemove" id="mbPinRemove">Remove pin</button>
        <button class="btn small" data-act="mbPinCancel">Cancel</button>
      </div>
    </div>
    <div id="mapPinList"></div>
    <div class="muted" style="margin-top:6px">Tap a square to drop a pin · drag to pan, pinch to zoom · swipe the title to turn the page</div>
  </div>`;
}

export function openMapBook(){
  if (!state){ toast('Start a delve first.'); return; }
  let m = $('#mapbookSheet');
  if (!m){
    m = document.createElement('div'); m.id = 'mapbookSheet'; m.className = 'modal hidden';
    m.innerHTML = `<div style="position:relative;width:min(680px,96vw)"><button class="btn small" data-act="mbClose" style="position:absolute;right:-4px;top:-34px;z-index:2">✕</button>${sheetHTML()}</div>`;
    document.body.appendChild(m);
    bindSheet(m);
  }
  page = clamp(partyFloor() || 0, 0, state.floors.length - 1);
  view = { k:1, tx:0, ty:0 }; editingPin = null;
  m.classList.remove('hidden');
  expose();
  requestAnimationFrame(() => { sizeCanvas(); renderSheet(); draw(); startLive(); });
}
function closeMapBook(){ $('#mapbookSheet')?.classList.add('hidden'); stopLive(); }

/* The sheet's own wiring: buttons, the whole-floor toggle, the pin editor,
   and the canvas gestures. (The global [data-act] handler in events.js has
   no case for these, so they are handled here.) */
function bindSheet(m){
  m.addEventListener('click', onMapClick);
  $('#mapWhole', m)?.addEventListener('change', e => { showWhole = e.target.checked; scheduleDraw(); });
  $('#mapHead', m)?.addEventListener('pointerdown', e => {
    const x0 = e.clientX, el = e.currentTarget;
    const up = ev => {
      const dx = ev.clientX - x0;
      if (Math.abs(dx) > 48) turnPage(dx < 0 ? 1 : -1);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointerup', up);
  });
  const cv = $('#mapCanvas', m);
  const pointers = new Map();
  let pinch0 = 0, moved = 0, downAt = 0, downXY = null;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (pointers.size === 1){ moved = 0; downAt = performance.now(); downXY = { x:e.clientX, y:e.clientY }; }
    if (pointers.size === 2){ const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y) / view.k; }
  });
  cv.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (pointers.size === 1){
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      view.tx = clamp(view.tx + dx, -cv.clientWidth, cv.clientWidth);
      view.ty = clamp(view.ty + dy, -cv.clientHeight, cv.clientHeight);
      draw();
    } else if (pointers.size === 2){
      const [a, b] = [...pointers.values()];
      view.k = clamp(Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch0), 1, 6);
      draw();
    }
  });
  const up = e => {
    const wasTap = pointers.size === 1 && moved < 8 && performance.now() - downAt < 400 && downXY;
    pointers.delete(e.pointerId);
    if (wasTap) tapCanvas(e, cv);
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', e => pointers.delete(e.pointerId));
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    view.k = clamp(view.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, 6);
    draw();
  }, { passive:false });
  addEventListener('resize', () => { if (!$('#mapbookSheet')?.classList.contains('hidden')){ sizeCanvas(); draw(); } });
}

function onMapClick(e){
  const pinBtn = e.target.closest?.('[data-pin]');
  if (pinBtn){ openPinEditor(loadPins(page).find(p => p.id === pinBtn.dataset.pin)); return; }
  const act = e.target.closest?.('[data-act]')?.dataset.act;
  if (!act || !act.startsWith('mb')) return;
  if (act === 'mbClose') closeMapBook();
  else if (act === 'mbPrev') turnPage(-1);
  else if (act === 'mbNext') turnPage(1);
  else if (act === 'mbFit'){ view = { k:1, tx:0, ty:0 }; draw(); }
  else if (act === 'mbSave') savePicture();
  else if (act === 'mbPinSave') savePinEditor();
  else if (act === 'mbPinRemove') removePinEditor();
  else if (act === 'mbPinCancel'){ editingPin = null; renderPinEditor(); }
}
function turnPage(d){
  if (!state) return;
  const next = clamp(page + d, 0, state.floors.length - 1);
  if (next === page) return;
  page = next; view = { k:1, tx:0, ty:0 }; editingPin = null;
  renderSheet(); draw();
}

/* A tap on the canvas: a pin there opens its editor; an empty square starts
   a fresh pin. (Map units: the fit transform, then the reader's zoom/pan.) */
function tapCanvas(e, cv){
  const f = state?.floors[page]; if (!f) return;
  const r = cv.getBoundingClientRect();
  const t = transform(cv);
  const px = (e.clientX - r.left - t.cx - t.tx) / t.k + t.cx, py = (e.clientY - r.top - t.cy - t.ty) / t.k + t.cy;
  const mx = (px - t.ox) / t.cell, my = (py - t.oy) / t.cell;
  if (mx < 0 || my < 0 || mx >= f.W || my >= f.H) return;
  const x = Math.floor(mx), y = Math.floor(my);
  const pins = loadPins(page);
  const hit = pins.find(p => Math.hypot(p.x + .5 - mx, p.y + .5 - my) < .6);
  openPinEditor(hit || { x, y });
}
function openPinEditor(pin){
  editingPin = pin.id ? { ...pin } : { x:pin.x, y:pin.y };
  renderPinEditor();
  $('#mbNote')?.focus();
}
function renderPinEditor(){
  const ed = $('#mapPinEdit'); if (!ed) return;
  ed.hidden = !editingPin;
  if (!editingPin) return;
  $('#mbNote').value = editingPin.note || '';
  $('#mbPinRemove').style.display = editingPin.id ? '' : 'none';
}
function savePinEditor(){
  if (!editingPin) return;
  const note = $('#mbNote')?.value.trim() || '';
  const pins = loadPins(page);
  if (editingPin.id){
    const p = pins.find(p => p.id === editingPin.id);
    if (p) p.note = note;
  } else if (note){
    pins.push({ id:`pin-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, x:editingPin.x, y:editingPin.y, note, at:Date.now() });
  } else {
    toast('Write the note first — a pin with nothing on it is just a dot.');
    return;
  }
  savePins(page, pins);
  editingPin = null; renderPinEditor(); renderPinList(); draw();
}
function removePinEditor(){
  if (!editingPin?.id) return;
  savePins(page, loadPins(page).filter(p => p.id !== editingPin.id));
  editingPin = null; renderPinEditor(); renderPinList(); draw();
}
function renderPinList(){
  const el = $('#mapPinList'); if (!el) return;
  const pins = loadPins(page);
  el.innerHTML = pins.length
    ? `<h3 style="margin:10px 0 0">📍 Your pins on this floor</h3>` + pins.map(p => `<button class="btn small" data-pin="${esc(p.id)}" style="margin:4px 4px 0 0">📍 ${esc(p.note)}</button>`).join('')
    : '';
}

/* ---------- drawing ---------- */

// The fit: how one square maps to the canvas, in CSS pixels.
function transform(cv){
  const f = state?.floors[page]; if (!f) return null;
  const cw = cv.clientWidth, ch = cv.clientHeight, m = 26;
  const cell = Math.min((cw - 2 * m) / f.W, (ch - 2 * m) / f.H);
  return { cell, ox:(cw - f.W * cell) / 2, oy:(ch - f.H * cell) / 2, cx:cw / 2, cy:ch / 2, k:view.k, tx:view.tx, ty:view.ty, W:f.W, H:f.H };
}
export function mapbookView(){
  const cv = $('#mapCanvas'); if (!cv) return null;
  const t = transform(cv); if (!t) return null;
  return { ...t, cssW:cv.clientWidth, cssH:cv.clientHeight };
}

function sizeCanvas(){
  const cv = $('#mapCanvas'); if (!cv) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(cv.clientWidth * dpr));
  cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
}

/* Parchment: a warm gradient, a little noise, and a darker edge — the same
   sheet whether it is on the screen or saved as a picture. */
function parchment(ctx, w, h, seed){
  const g = ctx.createLinearGradient(0, 0, w * .3, h);
  g.addColorStop(0, '#ecdcb4'); g.addColorStop(.6, '#e0cda0'); g.addColorStop(1, '#d2ba88');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const rng = mulberry32(hashSeed(seed));
  ctx.fillStyle = 'rgba(58,42,24,.06)';
  for (let i = 0; i < 240; i++) ctx.fillRect(rng() * w, rng() * h, 1.6, 1.6);
  ctx.strokeStyle = 'rgba(58,42,24,.18)'; ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, w, h);
}

/* Draw one page into ctx (CSS size w×h, at dpr): parchment, the explored
   squares in ink — or, for the DM with the toggle on, the whole floor with
   the unexplored part faint — the marks, the heroes, and the reader's pins. */
function drawInto(ctx, w, h, dpr, L, forExport = false){
  const f = state?.floors[L]; if (!f) return;
  const explored = state.explored[L] || new Set();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  parchment(ctx, w, h, `${state.meta?.name}|${L}`);
  const cv = $('#mapCanvas');
  const t = cv && L === page && !forExport ? transform(cv) : null;
  // For an export the canvas is off-screen: fit the same way, at fit zoom.
  const tr = t || (() => { const m = 26, cell = Math.min((w - 2 * m) / f.W, (h - 2 * m) / f.H);
    return { cell, ox:(w - f.W * cell) / 2, oy:(h - f.H * cell) / 2, cx:w / 2, cy:h / 2, k:1, tx:0, ty:0, W:f.W, H:f.H }; })();
  const { cell } = tr;
  ctx.save();
  ctx.translate(tr.cx + tr.tx, tr.cy + tr.ty); ctx.scale(tr.k, tr.k); ctx.translate(-tr.cx, -tr.cy);
  const X = mx => tr.ox + mx * cell, Y = my => tr.oy + my * cell;
  const exploredOpen = openSet(f, explored);
  if (!exploredOpen.size){
    ctx.fillStyle = 'rgba(58,42,24,.55)';
    ctx.font = `italic ${Math.max(14, cell * .9)}px ${getComputedStyle(document.body).getPropertyValue('--serif') || 'Georgia, serif'}`;
    ctx.textAlign = 'center';
    ctx.fillText('Nothing mapped on this floor yet.', w / 2, h / 2);
    ctx.restore(); return;
  }
  // The DM's faint whole floor, underneath the ink.
  if (showWhole && ui.role === 'dm'){
    const all = allOpen(f);
    ctx.fillStyle = 'rgba(58,42,24,.05)';
    for (const i of all) if (!exploredOpen.has(i)) ctx.fillRect(X(i % f.W), Y((i / f.W) | 0), cell, cell);
    drawWalls(ctx, wallSegments(f, all), X, Y, cell, L, .22);
    drawMarks(ctx, f, explored, X, Y, cell, .22, false);
  }
  drawWalls(ctx, wallSegments(f, explored), X, Y, cell, L, 1);
  drawMarks(ctx, f, explored, X, Y, cell, 1, true);
  // The party: a small dot where each hero stands, on the floor they're on.
  for (const tok of state.tokens || []){
    if (tok.kind !== 'pc' || tok.floor !== L || tok.flags?.gone) continue;
    const cx = X(tok.x + .5), cy = Y(tok.y + .5), r = Math.max(3, cell * .22);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (tok.dead){ ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }
    else { ctx.fillStyle = tok.color || '#e9a54a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  // Pins, with their notes kept beside them in the list below.
  for (const p of loadPins(L)){
    const cx = X(p.x + .5), cy = Y(p.y + .5), r = Math.max(4, cell * .2);
    ctx.beginPath(); ctx.arc(cx, cy - r * .4, r, 0, Math.PI * 2);
    ctx.fillStyle = PIN_INK; ctx.fill(); ctx.strokeStyle = '#f3e6c8'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r * .55, cy + r * .5); ctx.lineTo(cx + r * .55, cy + r * .5); ctx.lineTo(cx, cy + r * 1.1); ctx.closePath();
    ctx.fillStyle = PIN_INK; ctx.fill();
  }
  // A faint 5-ft tick along the margin, for scale.
  ctx.strokeStyle = 'rgba(58,42,24,.5)'; ctx.lineWidth = 1.5;
  const sx = 10, sy = h - 12;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + cell, sy); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4); ctx.moveTo(sx + cell, sy - 4); ctx.lineTo(sx + cell, sy + 4); ctx.stroke();
  ctx.fillStyle = 'rgba(58,42,24,.6)'; ctx.font = `12px ${getComputedStyle(document.body).getPropertyValue('--serif') || 'Georgia, serif'}`; ctx.textAlign = 'left';
  ctx.fillText('5 ft', sx + cell + 6, sy + 4);
  ctx.restore();
}

function drawWalls(ctx, segs, X, Y, cell, L, alpha){
  ctx.strokeStyle = INK; ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(1.4, cell * .07); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of segs){
    // A little wobble, seeded from the square so it never jitters between redraws.
    const rng = mulberry32(hashSeed(`${L}:${s.x1},${s.y1}-${s.x2},${s.y2}`));
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++){
      const tt = i / 3, wob = (i === 0 || i === 3) ? 0 : (rng() - .5) * .09;
      const px = X(s.x1 + dx * tt + nx * wob), py = Y(s.y1 + dy * tt + ny * wob);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMarks(ctx, f, explored, X, Y, cell, alpha, onlyExplored){
  const g = f.grid || [];
  const isOpen = (x, y) => x >= 0 && y >= 0 && x < f.W && y < f.H && explored.has(y * f.W + x) && walk(+g[y * f.W + x]);
  const doorKnown = d => {   // a door sits in a wall square: known when it, or the floor beside it, has been seen
    if (explored.has(d.i)) return true;
    const x = d.i % f.W, y = (d.i / f.W) | 0;
    return isOpen(x, y - 1) || isOpen(x, y + 1) || isOpen(x - 1, y) || isOpen(x + 1, y);
  };
  ctx.globalAlpha = alpha;
  // Doors: a small bar across the gap — across the passage they close.
  for (const d of f.doors || []){
    if (onlyExplored && !doorKnown(d)) continue;
    const x = d.i % f.W, y = (d.i / f.W) | 0;
    const ns = isOpen(x, y - 1) || isOpen(x, y + 1), ew = isOpen(x - 1, y) || isOpen(x + 1, y);
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, cell * .12); ctx.lineCap = 'round';
    ctx.beginPath();
    if (d.state === 'open'){   // an open door is a gap: two short ticks where the bar would meet the walls
      if (ns && !ew){ ctx.moveTo(X(x + .18), Y(y + .5)); ctx.lineTo(X(x + .3), Y(y + .5)); ctx.moveTo(X(x + .7), Y(y + .5)); ctx.lineTo(X(x + .82), Y(y + .5)); }
      else if (ew && !ns){ ctx.moveTo(X(x + .5), Y(y + .18)); ctx.lineTo(X(x + .5), Y(y + .3)); ctx.moveTo(X(x + .5), Y(y + .7)); ctx.lineTo(X(x + .5), Y(y + .82)); }
      else ctx.rect(X(x + .3), Y(y + .3), cell * .4, cell * .4);
    } else {
      if (ns && !ew){ ctx.moveTo(X(x + .18), Y(y + .5)); ctx.lineTo(X(x + .82), Y(y + .5)); }   // the passage runs north-south: the bar lies across it
      else if (ew && !ns){ ctx.moveTo(X(x + .5), Y(y + .18)); ctx.lineTo(X(x + .5), Y(y + .82)); }
      else ctx.rect(X(x + .3), Y(y + .3), cell * .4, cell * .4);
    }
    ctx.stroke();
    if (d.state === 'locked'){ ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(X(x + .5), Y(y + .5), Math.max(1.5, cell * .07), 0, Math.PI * 2); ctx.fill(); }
  }
  // Stairs: hatching with an arrow — ▲ up, ▼ down.
  for (let i = 0; i < g.length; i++){
    if (onlyExplored && !explored.has(i)) continue;
    const v = +g[i]; if (v !== T.DOWN && v !== T.UP) continue;
    const x = i % f.W, y = (i / f.W) | 0;
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, cell * .05);
    ctx.beginPath();
    ctx.moveTo(X(x + .2), Y(y + .32)); ctx.lineTo(X(x + .8), Y(y + .32));
    ctx.moveTo(X(x + .2), Y(y + .68)); ctx.lineTo(X(x + .8), Y(y + .68));
    ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `${Math.max(10, cell * .55)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v === T.UP ? '▲' : '▼', X(x + .5), Y(y + .52));
  }
  // Water: wavy lines. A chasm: cross-hatching.
  const wavy = (i, col) => {
    const x = i % f.W, y = (i / f.W) | 0;
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, cell * .05);
    for (const yy of [.35, .65]){
      ctx.beginPath(); ctx.moveTo(X(x + .15), Y(y + yy));
      ctx.quadraticCurveTo(X(x + .35), Y(y + yy - .09), X(x + .5), Y(y + yy));
      ctx.quadraticCurveTo(X(x + .65), Y(y + yy + .09), X(x + .85), Y(y + yy));
      ctx.stroke();
    }
  };
  for (const i of f.water || []) if (!onlyExplored || explored.has(i)) wavy(i, WATER_INK);
  for (const i of f.chasm || []){
    if (onlyExplored && !explored.has(i)) continue;
    const x = i % f.W, y = (i / f.W) | 0;
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, cell * .05);
    ctx.beginPath();
    ctx.moveTo(X(x + .2), Y(y + .2)); ctx.lineTo(X(x + .8), Y(y + .8));
    ctx.moveTo(X(x + .8), Y(y + .2)); ctx.lineTo(X(x + .2), Y(y + .8));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function draw(){
  const cv = $('#mapCanvas'); if (!cv || $('#mapbookSheet')?.classList.contains('hidden')) return;
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  drawInto(ctx, cv.clientWidth, cv.clientHeight, dpr, page);
}
function scheduleDraw(){
  clearTimeout(drawTimer); drawTimer = setTimeout(draw, 120);
}
function renderSheet(){
  const f = state?.floors[page];
  $('#mapTitle').textContent = `🗺️ ${floorTitle(f, page)}`;
  $('#mapPage').textContent = `Page ${page + 1} of ${state.floors.length} · ${state.meta?.name || ''}`;
  const whole = $('#mapWholeWrap');
  if (whole) whole.style.display = ui.role === 'dm' ? '' : 'none';
  const box = $('#mapWhole'); if (box) box.checked = showWhole;
  renderPinEditor(); renderPinList();
}

/* "Save as picture": the current page, parchment and pins included, as a PNG. */
export function exportPNG(){
  if (!state) return null;
  const f = state.floors[page]; if (!f) return null;
  const scale = 2, w = 900, h = Math.round(900 * Math.min(1, (f.H + 1) / (f.W + 1)) + 40);
  const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale;
  drawInto(cv.getContext('2d'), w, h, scale, page, true);
  return cv.toDataURL('image/png');
}
function savePicture(){
  const url = exportPNG();
  if (!url){ toast('Nothing to save yet.'); return; }
  const a = document.createElement('a');
  a.href = url; a.download = `mapbook-${slug(state.meta?.name)}-floor-${page + 1}.png`;
  a.click();
  toast('💾 The page is saved as a picture.');
}

/* Live: redraw when a new state arrives (bus 'state', if it ever fires) or
   when the fingerprint of what the page shows changes — at most a few times
   a second, and only while the book is open. */
const fingerprint = () => !state ? '' : JSON.stringify([
  state.meta?.name, state.floors.length,
  state.floors.map((f, L) => [f.name, state.explored[L]?.size || 0]),
  (state.tokens || []).filter(t => t.kind === 'pc').map(t => [t.floor, t.x, t.y, !!t.dead]),
  showWhole, page,
]);
function startLive(){
  stopLive(); lastPrint = fingerprint();
  liveTimer = setInterval(() => {
    if ($('#mapbookSheet')?.classList.contains('hidden')) return stopLive();
    const fp = fingerprint();
    if (fp !== lastPrint){ lastPrint = fp; scheduleDraw(); }
  }, 400);
}
function stopLive(){ clearTimeout(liveTimer); liveTimer = null; }

/* The spec's handle on the exported helper (and the book itself): its own
   window global, because window.DreadDelve is the debug module's namespace
   object and is not extensible — assigning to it throws. If Claude would
   rather the helper lived in debug.js, that is a one-line move. */
function expose(){
  if (!window.DreadDelveMapbook) window.DreadDelveMapbook = { wallSegments, openMapBook, exportPNG, view:mapbookView, pins:L => loadPins(L ?? page) };
}

let started = false;
export function ensureMapbook(){
  if (started) return; started = true;
  if (!document.getElementById('mapbookCSS')){
    const st = document.createElement('style'); st.id = 'mapbookCSS';
    st.textContent = `body.screen #btnMapbook{display:none!important}
    .mapbook-sheet{background:linear-gradient(175deg,#efe3c2,#e2d2a8 60%,#d3bd8d);color:#2b1d10;border-radius:6px 12px 8px 14px/12px 8px 14px 6px;padding:16px 18px;font-family:var(--serif);filter:drop-shadow(0 10px 24px rgba(0,0,0,.5))}
    .mapbook-sheet h2{font-family:var(--serif);font-size:22px}
    .mapbook-head{display:flex;align-items:center;gap:8px}.mapbook-head h2{flex:1;text-align:center}
    .mapbook-head .btn{background:rgba(43,29,16,.08);border-color:rgba(43,29,16,.25);color:#2b1d10}
    #mapCanvas{width:100%;height:min(58vh,520px);display:block;margin-top:8px;border:1px solid rgba(43,29,16,.3);border-radius:4px;touch-action:none;cursor:crosshair}
    .mapbook-sheet .btn{background:rgba(43,29,16,.08);border-color:rgba(43,29,16,.25);color:#2b1d10}
    .mapbook-sheet .btn.primary{background:#4a0d0d;border-color:#4a0d0d;color:#f3e6c8}
    .mapbook-sheet .muted{color:rgba(43,29,16,.6)}
    .mapbook-pin-edit{margin-top:10px;background:rgba(255,246,232,.5);border:1px solid rgba(43,29,16,.25);border-radius:8px;padding:10px}
    .mapbook-pin-edit .txt{background:rgba(255,255,255,.6);border-color:rgba(43,29,16,.3);color:#2b1d10}
    @media (max-width:480px){.mapbook-sheet{padding:12px}#mapCanvas{height:52vh}.mapbook-sheet h2{font-size:19px}}`;
    document.head.appendChild(st);
  }
  if (!$('#btnMapbook')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnMapbook'; b.title = 'Map Book'; b.textContent = '🗺️';
    b.onclick = () => openMapBook();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
  registerCommands([{ id:'mapbook', n:'Map Book', hint:'Your hand-drawn map of everywhere you have been, with your own notes', icon:'🗺️', role:'both', run:openMapBook }]);
  bus.on('state', scheduleDraw);   // fires when a new state arrives on a player's device — if it ever lands (see the PR)
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#mapbookSheet')?.classList.contains('hidden')) closeMapBook(); });
  setTimeout(expose, 0);
}
