/* SIDE PANEL — one function per tab. The DM gets Tokens · Bestiary · Dungeon · Build · Dread · Table; players get Your hero · Log. */
import { state, ui, tokById, dreadLevel, shiftTable, graspTable } from '../engine/state.js';
import { roomById } from '../engine/generator.js';
import { tableGaps, tableMax } from '../engine/tables.js';
import { FAMILIES, BEST, bestList } from '../data/bestiary.js';
import { DREAD, CONDITIONS } from '../data/dread.js';
import { ROOM_TYPES, TRAP_KINDS, DOOR_STATES } from '../data/rooms.js';
import { THEMES, TEMPLATES } from '../data/themes.js';
import { DEFAULT_SHIFT_TABLE, DEFAULT_GRASP_TABLE, GRASP_STEPS } from '../data/tables.js';
import { $, esc, avgDice, attacksToText } from '../util/core.js';
import { net } from '../net/table.js';
import { currentTurn } from '../game/rules.js';
import { onStairs, dreadRulesLines } from '../game/actions.js';
import { undoCount } from '../game/session.js';
import { hpBar, condChips, BUILD_TOOLS } from './hud.js';
import { SHAPE_NAMES } from '../render/minis.js';

const art = (key, label) => {
  const a = state.art[key];
  return `<div class="artslot">${a ? `<img src="${a}" alt="">` : '<div style="width:56px;height:56px;border-radius:8px;background:#1d1720;display:grid;place-items:center">🖼</div>'}
    <div style="flex:1">${a ? 'Art set — shows as a standee mini.' : `No art yet. Drop in your Grok image for ${esc(label)}.`}<br>
    <label class="btn small" style="display:inline-block;margin-top:4px">Choose image<input type="file" accept="image/*" data-edit="art" data-k="${key}" hidden></label>
    ${a ? `<button class="btn small" data-act="clearArt" data-k="${key}">Clear</button>` : ''}</div></div>`;
};
const opt = (v, label, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
const logList = (n = 999) => state.log.slice().reverse().slice(0, n).map(l => `<div>${esc(l.m)}</div>`).join('') || '<div class="muted">Quiet. Too quiet.</div>';

function tokensTab(){
  let h = `<h3>The party</h3>`;
  for (const t of state.tokens.filter(t => t.kind !== 'monster')){
    const open = ui.openPc === t.id;
    const seat = Object.entries(state.seats).find(([, id]) => id === t.id);
    h += `<div class="card ${ui.selected === t.id ? 'sel' : ''}"><div class="hd"><span class="dot" style="color:${t.color};background:${t.color}"></span>
      <span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''} <span class="muted">${t.kind === 'npc' ? 'ally' : ''} · F${t.floor + 1}${seat ? ' · 🎮 ' + esc(net.conns.get(seat[0])?.name || '') : ''}</span></span>
      ${t.flags.taken ? `<button class="btn small seep" data-act="restore" data-id="${t.id}">Restore</button>` : `<button class="btn small" data-act="sel" data-id="${t.id}">Select</button>`}<button class="btn small" data-act="openPc" data-id="${t.id}">${open ? '▲' : '✎'}</button></div>
      ${t.flags.taken ? `<div class="fam-seep" style="font-size:13px">☣ Taken by the Seep — a Husk walks in their skin.</div>` : ''}
      <div class="stat" style="margin-top:4px">AC ${t.ac} · HP ${t.hp}/${t.maxHp} · ${t.speed} ft · Init ${t.init >= 0 ? '+' : ''}${t.init} · PP ${t.passive}</div>${hpBar(t, true)}
      ${t.conds?.length ? `<div>${condChips(t, false)}</div>` : ''}
      ${open ? `<div class="row"><input class="txt" style="flex:1" value="${esc(t.name)}" data-edit="tok" data-id="${t.id}" data-f="name"><input type="color" value="${t.color}" data-edit="tok" data-id="${t.id}" data-f="color"></div>
        <div class="row">${[['ac', 'AC'], ['hp', 'HP'], ['maxHp', 'Max'], ['speed', 'Speed'], ['init', 'Init'], ['saveMod', 'Save'], ['check', 'Tools'], ['passive', 'Passive']].map(([k, l]) => `<label>${l}<br><input class="txt num" type="number" value="${t[k]}" data-edit="tok" data-id="${t.id}" data-f="${k}"></label>`).join('')}</div>
        <div class="muted">Tools = lockpicking / disarm bonus · Passive = passive Perception (spots traps and secret doors on its own)</div>
        <label class="muted">Attacks — one per line: Name | +hit | damage | type | flair (optional, {A} and {T})</label>
        <textarea class="txt" data-edit="atk" data-id="${t.id}">${esc(attacksToText(t.attacks))}</textarea>
        ${art(t.id, t.name)}
        <div class="row"><button class="btn small" data-act="placeTok" data-id="${t.id}">📍 Place on map</button><button class="btn small danger" data-act="removeTok" data-id="${t.id}">Remove</button></div>` : ''}
    </div>`;
  }
  h += `<div class="row"><input class="txt" style="flex:1" id="newName" placeholder="Name (e.g. Ireena, Father Lucian)"><button class="btn small" data-act="addPc">+ Hero</button><button class="btn small" data-act="addNpc">+ Ally NPC</button></div>`;
  const foes = state.tokens.filter(t => t.kind === 'monster' && t.floor === ui.floor);
  h += `<h3>Horrors on this floor (${foes.filter(t => !t.dead).length})</h3>`;
  if (!foes.length) h += `<div class="muted">Nothing — yet. Use the Bestiary tab to place creatures, or Populate in the Build tab.</div>`;
  for (const t of foes) h += `<div class="card ${ui.selected === t.id ? 'sel' : ''}" data-act="sel" data-id="${t.id}" style="cursor:pointer"><div class="hd"><span class="dot" style="color:#c0303a;background:#c0303a"></span><span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''}${t.flags.rising ? ' <span class="fam-seep">(rising)</span>' : ''}${t.flags.alert ? ' <span class="muted">(alert)</span>' : ''}</span><span class="stat">AC ${t.ac} · ${t.hp}/${t.maxHp}</span></div>${hpBar(t)}${t.conds?.length ? condChips(t, false) : ''}</div>`;
  if (foes.some(t => t.dead)) h += `<div class="row"><button class="btn small" data-act="clearDead">Clear the dead</button></div>`;
  return h;
}

function bestiaryTab(){
  const fams = [['all', 'All'], ...Object.entries(FAMILIES).map(([k, v]) => [k, v.label]), ['custom', 'Custom']];
  let h = `<h3>Bestiary</h3><div>${fams.map(([k, l]) => `<span class="chip ${ui.bestFilter === k ? 'on' : ''}" data-act="bestFilter" data-k="${k}">${l}</span>`).join('')}</div>
    <div class="row"><input class="txt" id="bestSearch" placeholder="Search…" value="${esc(ui.bestSearch)}"></div>`;
  if (FAMILIES[ui.bestFilter]) h += `<div class="look">${esc(FAMILIES[ui.bestFilter].blurb)}</div>`;
  const q = ui.bestSearch.toLowerCase();
  const list = bestList().filter(b => (ui.bestFilter === 'all' || b.fam === ui.bestFilter || (ui.bestFilter === 'custom' && b.custom)) && (!q || b.name.toLowerCase().includes(q)));
  for (const b of list){
    const open = ui.openBest === b.id, fam = FAMILIES[b.fam] || FAMILIES.dread, editing = ui.editBest === b.id;
    h += `<div class="card"><div class="hd"><span class="dot ${fam.cls}" style="background:currentColor"></span><span class="nm">${esc(b.name)}${b.custom ? ' <span class="muted">(edited)</span>' : ''}</span><span class="muted">CR ${esc(b.cr)}</span></div>
      <div class="stat">AC <b>${b.ac}</b> · HP <b>${avgDice(b.hp)}</b> (${esc(b.hp)}) · ${esc(b.spd || b.speed + ' ft.')}${b.size > 1 ? ` · ${b.size}×${b.size}` : ''}</div>
      <div class="row"><button class="btn small primary" data-act="place" data-k="${b.id}">📍 Place</button><button class="btn small" data-act="openBest" data-k="${b.id}">${open ? 'Hide' : 'Details'}</button><button class="btn small" data-act="editBest" data-k="${b.id}">${editing ? 'Close editor' : '✎ Edit'}</button></div>
      ${editing ? `<label class="muted">Statblock as JSON — same fields as src/data/bestiary.js. Shapes: ${SHAPE_NAMES.join(', ')}</label>
        <textarea class="txt" id="bestJson" style="min-height:260px;font-family:ui-monospace,monospace;font-size:12px">${esc(JSON.stringify({ ...b, custom:undefined }, null, 1))}</textarea>
        <div class="row"><button class="btn small primary" data-act="saveBest" data-k="${b.id}">Save</button><button class="btn small" data-act="cloneBest" data-k="${b.id}">Save as new creature</button>${b.custom ? `<button class="btn small danger" data-act="resetBest" data-k="${b.id}">Reset to original</button>` : ''}</div>` : ''}
      ${open ? `${(b.traits || []).map(t => `<div class="trait">${t}</div>`).join('')}
        ${(b.attacks || []).map(a => `<div class="trait"><b>${esc(a.n)}.</b> ${a.b >= 0 ? '+' : ''}${a.b} to hit, ${esc(a.d)} ${esc(a.t)}${a.on ? `; DC ${a.on.dc} ${a.on.save.toUpperCase()} or ${esc(a.on.cond)}` : ''}${a.latch ? '; latches on' : ''}.</div>`).join('')}
        ${(b.specials || []).map(s => `<div class="trait"><b>✦ ${esc(s.n)}.</b> <span class="muted">${esc(s.fx)}</span></div>`).join('')}
        <h4>What it looks like</h4><div class="look">${esc(b.look)}</div>
        ${art(b.id, b.name)}
        <h4>Grok prompt</h4><textarea class="txt" readonly id="pr-${b.id}">${esc(b.prompt)}</textarea>
        <div class="row"><button class="btn small" data-act="copy" data-k="pr-${b.id}">Copy prompt</button></div>` : ''}</div>`;
  }
  h += `<div class="row"><button class="btn small" data-act="copyAllPrompts">Copy every Grok prompt</button></div>`;
  return h;
}

function dungeonTab(){
  const f = state.floors[ui.floor], D = dreadLevel();
  let h = `<h3>This floor</h3>
    <div class="row"><input class="txt" value="${esc(f.name)}" data-edit="floorName"></div>
    <div class="row"><label>Look</label><select class="txt" style="flex:1" data-edit="floorTheme">${THEMES.map((t, i) => opt(i, t.name, f.theme === i)).join('')}</select></div>
    <div class="row"><button class="btn primary" data-act="shiftNow">⟲ Shift the halls (d100)</button><input class="txt num" id="shiftForce" type="number" min="1" max="100" placeholder="roll"><button class="btn small" data-act="shiftForced" title="Use this number instead of rolling">Use</button></div>
    <div class="row"><button class="btn small" data-act="reveal">Reveal floor</button><button class="btn small" data-act="refog">Re-fog floor</button></div>
    <div class="muted">${D.shift ? `At Dread ${state.dread} this floor shifts on its own at the end of each combat round (${Math.round(D.shift * 100)}% chance).` : 'At Dread 6+ the halls start shifting on their own during combat.'}</div>
    <h4>View</h4><div class="row">
      <button class="btn small ${ui.previewFog ? 'on' : ''}" data-act="toggle" data-k="previewFog">Preview fog</button>
      <button class="btn small ${ui.roomLabels ? 'on' : ''}" data-act="toggle" data-k="roomLabels">Room labels</button>
      <button class="btn small ${ui.freeMove ? 'on' : ''}" data-act="toggle" data-k="freeMove">Free move</button>
      <button class="btn small ${ui.whispers ? 'on' : ''}" data-act="toggle" data-k="whispers">Whispers</button></div>
    <h4>Rooms (${f.rooms.length})</h4>`;
  for (const r of f.rooms) h += `<div class="card ${ui.selRoom === r.id ? 'sel' : ''}"><div class="hd"><span class="dot" style="color:${ROOM_TYPES[r.type]?.color};background:${ROOM_TYPES[r.type]?.color}"></span>
      <input class="txt" style="flex:1" value="${esc(r.name)}" data-edit="room" data-id="${r.id}" data-f="name"><button class="btn small" data-act="goRoom" data-id="${r.id}">Go</button></div>
      <div class="row"><select class="txt" data-edit="room" data-id="${r.id}" data-f="type">${Object.entries(ROOM_TYPES).map(([k, v]) => opt(k, v.label, r.type === k)).join('')}</select></div>
      <textarea class="txt" style="min-height:44px" placeholder="DM notes — what could happen here…" data-edit="room" data-id="${r.id}" data-f="notes">${esc(r.notes || '')}</textarea></div>`;
  h += `<h4>Grok prompt for this floor</h4><textarea class="txt" readonly id="pr-floor">${esc((THEMES[f.theme] || THEMES[0]).prompt)}</textarea><div class="row"><button class="btn small" data-act="copy" data-k="pr-floor">Copy prompt</button></div>
    <h3>New delve</h3>
    <div class="row"><label>Name</label><input class="txt" id="ndName" value="${esc(state.meta.name)}"></div>
    <div class="row"><label>Template</label><select class="txt" style="flex:1" id="ndTemplate">${TEMPLATES.map(t => opt(t.id, t.name, t.id === state.meta.template)).join('')}</select></div>
    <div class="muted" id="ndBlurb">${esc((TEMPLATES.find(t => t.id === state.meta.template) || TEMPLATES[0]).blurb)}</div>
    <div class="row"><label>Seed</label><input class="txt" style="flex:1" id="ndSeed" value="${esc(state.meta.seed)}"></div>
    <div class="row"><label>Floors</label><select class="txt" style="width:auto" id="ndFloors">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => opt(n, n, n === state.meta.floors)).join('')}</select>
      <label>Size</label><select class="txt" style="width:auto" id="ndSize">${[32, 40, 48, 56, 64].map(n => opt(n, n, n === state.meta.size)).join('')}</select></div>
    <div class="row"><button class="btn danger" data-act="regen">Generate (replaces this delve, keeps the party)</button></div>`;
  return h;
}

function buildTab(){
  const f = state.floors[ui.floor], r = ui.selRoom !== null ? roomById(f, ui.selRoom) : null;
  const tool = BUILD_TOOLS.find(t => t[0] === ui.mode);
  let h = `<h3>Build this floor</h3>
    <div class="muted">${tool ? `<b style="color:var(--candle)">${tool[2]}:</b> ${esc(tool[3])}.` : 'Pick a tool from the dock (bottom left) or here. Every change can be undone (Ctrl+Z).'} While a tool is on, right-drag (or two fingers) moves the camera. Top view (2) is easiest.</div>
    <div class="toolgrid">${BUILD_TOOLS.map(([k, i, l]) => `<button class="btn small ${ui.mode === k ? 'on' : ''}" data-act="mode:${k}">${i} ${l}</button>`).join('')}<button class="btn small" data-act="undo">↶ Undo${undoCount() ? ` (${undoCount()})` : ''}</button></div>`;
  if (ui.mode === 'door') h += `<h4>Door to place</h4><div>${Object.entries(DOOR_STATES).map(([k, v]) => `<span class="chip ${ui.doorState === k ? 'on' : ''}" data-act="doorKind" data-k="${k}">${v.label}</span>`).join('')}</div>`;
  if (ui.mode === 'trap') h += `<h4>Trap to hide</h4><div>${Object.entries(TRAP_KINDS).map(([k, v]) => `<span class="chip ${ui.trapKind === k ? 'on' : ''}" data-act="trapKindSel" data-k="${k}">${v.icon} ${v.n}</span>`).join('')}</div><div class="look">${esc(TRAP_KINDS[ui.trapKind].f)}</div>`;
  if (ui.mode === 'stairs') h += `<h4>Which stairs</h4><div><span class="chip ${ui.stairsDir === 'down' ? 'on' : ''}" data-act="stairsDir" data-k="down">▼ Down (to floor ${ui.floor + 2})</span><span class="chip ${ui.stairsDir === 'up' ? 'on' : ''}" data-act="stairsDir" data-k="up">▲ Up (to floor ${ui.floor})</span></div>`;
  h += `<div class="row"><label>Paint rooms as</label><select class="txt" style="width:auto" id="paintType">${Object.entries(ROOM_TYPES).map(([k, v]) => opt(k, v.label, ui.paintType === k)).join('')}</select><button class="btn small ${ui.mode === 'paint' ? 'on' : ''}" data-act="paintMode">Paint</button></div>`;
  h += `<div class="row"><button class="btn small ${f.autoLink ? 'on' : ''}" data-act="autoLink">${f.autoLink ? '🔗 Auto-link ON' : '✋ Hand-built (auto-link off)'}</button></div>
    <div class="muted">${f.autoLink ? 'Rooms connect themselves and the Shift rewires them. Turn it off to freeze the corridors and edit them by hand.' : 'Corridors are exactly what you drew. The Shift still swaps rooms, moves stairs, locks doors and spawns — it just won\'t rewire.'}</div>`;
  if (r){
    h += `<h4>Selected room</h4><div class="card sel"><div class="hd"><span class="dot" style="color:${ROOM_TYPES[r.type]?.color};background:${ROOM_TYPES[r.type]?.color}"></span>
      <input class="txt" style="flex:1" value="${esc(r.name)}" data-edit="room" data-id="${r.id}" data-f="name"></div>
      <div class="row"><select class="txt" data-edit="room" data-id="${r.id}" data-f="type">${Object.entries(ROOM_TYPES).map(([k, v]) => opt(k, v.label, r.type === k)).join('')}</select></div>
      <div class="stat">${r.w}×${r.h} squares (${r.w * 5}×${r.h * 5} ft) at ${r.x}, ${r.y}${r.stairsUp ? ' · stairs up' : ''}${r.stairsDown ? ' · stairs down' : ''}</div>
      <textarea class="txt" style="min-height:44px" placeholder="DM notes…" data-edit="room" data-id="${r.id}" data-f="notes">${esc(r.notes || '')}</textarea>
      <div class="row"><button class="btn small" data-act="populateRoom" data-id="${r.id}">Populate room</button><button class="btn small danger" data-act="delRoom" data-id="${r.id}">Delete room</button></div></div>`;
  }
  const counts = { doors:f.doors.length, secret:f.doors.filter(d => d.state === 'secret').length, traps:f.traps.filter(t => t.armed).length, hidden:f.traps.filter(t => t.armed && !t.found).length };
  h += `<div class="muted" style="margin-top:8px">${f.rooms.length} rooms · ${counts.doors} doors (${counts.secret} secret) · ${counts.traps} armed traps (${counts.hidden} hidden)</div>
    <h3>Floors</h3>
    <div class="row"><button class="btn small" data-act="populate">👹 Populate this floor</button><button class="btn small danger" data-act="clearMonsters">Clear its monsters</button></div>
    <div class="row"><select class="txt" style="width:auto" id="newFloorTheme">${THEMES.map(t => opt(t.id, t.name, false)).join('')}</select><button class="btn small" data-act="addFloor">+ Floor below the bottom</button></div>
    <div class="row"><button class="btn small danger" data-act="removeFloor">Remove bottom floor</button></div>
    <h3>Import a map</h3>
    <div class="muted">Battle Table JSON, any grid JSON, or ASCII (<code>#</code> rock · <code>.</code> floor · <code>+</code> door · <code>'</code> open door · <code>L</code> locked · <code>S</code> secret · <code>^</code> trap · <code>&gt;</code> down · <code>&lt;</code> up; separate floors with <code>=== Name ===</code>).</div>
    <textarea class="txt" id="importText" style="min-height:110px;font-family:ui-monospace,monospace;font-size:12px" placeholder="Paste here, or choose a file…"></textarea>
    <div class="row"><label class="btn small">📄 Choose file<input type="file" accept=".json,.txt,.map" data-edit="importMap" hidden></label>
      <button class="btn small primary" data-act="importFloor">Replace this floor</button><button class="btn small danger" data-act="importDelve">Import as a new delve</button></div>
    <h3>Export this floor</h3>
    <div class="row"><button class="btn small" data-act="copyAscii">Copy as ASCII</button><button class="btn small" data-act="downloadFloor">⬇ Floor JSON</button></div>`;
  return h;
}

function dreadTab(){
  const sh = shiftTable(), gr = graspTable(), D = dreadLevel();
  const gapsS = tableGaps(sh.rows, 100), gapsG = tableGaps(gr.rows, 12);
  let h = `<h3>Dread ${state.dread} · ${esc(D.n)}</h3><div class="look">${esc(D.text || '')}</div>
    <div class="trait">${dreadRulesLines(D).join(' · ') || '<span class="muted">No automatic effects at this level.</span>'}</div>
    <h3>✋ The Grasp Die</h3>
    <div class="row grasp"><button class="btn small" data-act="graspStep" data-k="-1">−</button>
      ${GRASP_STEPS.map(n => `<span class="die ${state.grasp.die === n ? 'on' : ''}">d${n}</span>`).join('')}
      <button class="btn small" data-act="graspStep" data-k="1">+</button></div>
    <div class="row"><button class="btn primary" data-act="graspRoll">Roll the Grasp Die</button><button class="btn small ${state.grasp.auto ? 'on' : ''}" data-act="graspAuto">${state.grasp.auto ? 'Auto: each round' : 'Auto: off'}</button></div>
    ${state.grasp.last ? `<div class="muted">Last: d${state.grasp.last.die} = <b>${state.grasp.last.r}</b> — ${esc(state.grasp.last.name)}</div>` : ''}
    <div class="muted">Grows when a Hand dies to anything but radiant (and when you press +). Shrinks when the Monstrosity dies, or the party rests in a Sanctuary. Auto-rolls at round end while hands are on the combat floor or the fight is in the Hand-Warrens.</div>
    <h3>Dread levels</h3>
    <div class="muted">Rename the levels and rewrite what you read out. Effects run on their own in combat.</div>`;
  for (let n = 1; n <= 10; n++){
    const L = dreadLevel(n), o = state.content.dread?.[n] || {};
    h += `<div class="card ${n === state.dread ? 'sel' : ''}"><div class="hd"><b style="color:var(--blood);width:22px">${n}</b><input class="txt" style="flex:1" value="${esc(o.n ?? '')}" placeholder="${esc(DREAD[n].n)}" data-edit="dreadName" data-k="${n}"><button class="btn small" data-act="setDread" data-k="${n}">Set</button></div>
      <textarea class="txt" style="min-height:44px" placeholder="${esc(DREAD[n].text)}" data-edit="dreadText" data-k="${n}">${esc(o.text ?? '')}</textarea>
      <div class="muted">${dreadRulesLines(L).join(' · ') || 'no automatic effects'}</div></div>`;
  }
  h += `<h3>The Shift table (d100)</h3>
    <div class="muted">One row per line: <code>range | name | read-out | effects</code>. Effects are listed at the top of src/data/tables.js. Empty the box and save to go back to the default.</div>
    <textarea class="txt" id="shiftText" style="min-height:240px;font-family:ui-monospace,monospace;font-size:12px">${esc(state.content.shift ?? DEFAULT_SHIFT_TABLE)}</textarea>
    ${sh.errors.length ? `<div class="bad">${sh.errors.map(esc).join('<br>')}</div>` : ''}${gapsS.length ? `<div class="bad">No row for: ${gapsS.slice(0, 20).join(', ')}${gapsS.length > 20 ? '…' : ''}</div>` : ''}
    <div class="row"><button class="btn small primary" data-act="saveShift">Save table</button><button class="btn small" data-act="shiftNow">Roll on this floor</button></div>
    <h3>The Grasp table</h3>
    <div class="muted">Rows by Grasp Die result (1–${Math.max(12, tableMax(gr.rows))}).</div>
    <textarea class="txt" id="graspText" style="min-height:200px;font-family:ui-monospace,monospace;font-size:12px">${esc(state.content.grasp ?? DEFAULT_GRASP_TABLE)}</textarea>
    ${gr.errors.length ? `<div class="bad">${gr.errors.map(esc).join('<br>')}</div>` : ''}${gapsG.length ? `<div class="bad">No row for: ${gapsG.join(', ')}</div>` : ''}
    <div class="row"><button class="btn small primary" data-act="saveGrasp">Save table</button></div>`;
  return h;
}

function tableTab(){
  let h = `<h3>Play together</h3>`;
  if (!net.code) h += `<div class="muted">Open a table and give your players the 4-letter code. They open this same file, choose <i>Join a table</i>, and type their character's name — matching names are seated automatically.</div>
    <div class="row"><button class="btn primary" data-act="host">Open table</button></div>`;
  else {
    h += `<div class="code">${net.code}</div><h4>Players (${net.conns.size})</h4>`;
    if (!net.conns.size) h += `<div class="muted">Waiting for players to join…</div>`;
    for (const [pid, s] of net.conns) h += `<div class="row"><span style="flex:1">🎮 ${esc(s.name)}</span><select class="txt" style="width:auto" data-edit="seat" data-k="${pid}"><option value="">— no token —</option>${state.tokens.filter(t => t.kind !== 'monster').map(t => opt(t.id, t.name, state.seats[pid] === t.id)).join('')}</select></div>`;
    h += `<div class="row"><button class="btn small danger" data-act="unhost">Close table</button></div>`;
  }
  h += `<div class="row"><button class="btn ${ui.tableView ? 'on' : ''}" data-act="tableView">📺 Table view ${ui.tableView ? 'ON' : 'off'}</button></div>
    <div class="muted">Table view shows what players see — fog, no room secrets, no hidden traps or secret doors, no monster HP. Use it when the screen is cast to a TV.</div>
    <h3>Save</h3><div class="muted">Autosaves in this browser. Export to move a delve between devices or keep backups. Your edited tables and creatures travel with the save.</div>
    <div class="row"><button class="btn" data-act="export">⬇ Export</button><label class="btn">⬆ Import<input type="file" accept=".json" data-edit="import" hidden></label><button class="btn small" data-act="startScreen">Start screen</button></div>
    <h3>Log</h3><div class="log">${logList()}</div>`;
  return h;
}

function heroTab(){
  const me = tokById(ui.myToken);
  let h = `<h3>Your hero</h3>`;
  if (!me) h += `<div class="muted">${net.host?.open ? 'Connected. Waiting for the DM to seat you at the table…' : 'Connecting to the table…'}</div>`;
  else if (me.flags.taken) h += `<div class="card"><div class="fam-seep">☣ The Seep has taken ${esc(me.name)}. Wait for the DM.</div></div>`;
  else {
    const turn = currentTurn()?.id === me.id, st = onStairs(me);
    h += `<div class="card sel"><div class="hd"><span class="dot" style="color:${me.color};background:${me.color}"></span><span class="nm">${esc(me.name)}${me.dead ? ' ✝' : ''}</span></div>
      <div class="stat">AC ${me.ac} · HP ${me.hp}/${me.maxHp} · Speed ${me.speed} ft${state.combat.active ? ` · moved ${(me.moved || 0) * 5} ft` : ''}</div>${hpBar(me, true)}
      ${me.conds?.length ? `<div>${condChips(me, false)}</div>` : ''}
      <div class="row"><button class="btn small" data-act="sel" data-id="${me.id}">Select & show moves</button><button class="btn small" data-act="search">🔍 Search</button>${st ? `<button class="btn small primary" data-act="stairs">${st === 'down' ? '▼ Descend' : '▲ Ascend'}</button>` : ''}${turn ? `<button class="btn small primary" data-act="endMyTurn">End my turn</button>` : ''}</div></div>`;
    h += `<div class="muted">${state.combat.active ? (turn ? '<b style="color:var(--candle)">It is your turn.</b> Tap a glowing tile to move.' : 'Combat — wait for your turn to move.') : 'Exploring — tap your hero, then a glowing tile.'}<br>Tap a door next to you to open it. Long-press or use ◎ to ping a spot for everyone.</div>`;
  }
  h += `<h3>Log</h3><div class="log">${logList(25)}</div>`;
  return h;
}

export function renderPanel(){
  if (!state) return;
  $('#panel').classList.toggle('closed', !ui.panelOpen);
  const body = $('#tabBody'), scroll = renderPanel.last === ui.tab ? body.scrollTop : 0; renderPanel.last = ui.tab;
  const tabs = { tokens:tokensTab, bestiary:bestiaryTab, dungeon:dungeonTab, build:buildTab, dread:dreadTab, table:tableTab, hero:heroTab,
    log:() => `<h3>What has happened</h3><div class="log" style="max-height:none">${logList()}</div>` };
  body.innerHTML = (tabs[ui.tab] || tokensTab)();
  body.scrollTop = scroll;
}
export { CONDITIONS, BEST };
