/* SIDE PANEL — one function per tab. The DM gets Story · Tokens · Bestiary · Dungeon · Build · Gaze · Table; players get Your hero · Log. */
import { state, ui, tokById, dreadLevel, shiftTable, whimTable } from '../engine/state.js';
import { roomById, exitLabel } from '../engine/generator.js';
import { tableGaps, tableMax } from '../engine/tables.js';
import { FAMILIES, BEST, bestList } from '../data/bestiary.js';
import { DREAD, CONDITIONS } from '../data/dread.js';
import { ROOM_TYPES, TRAP_KINDS, DOOR_STATES } from '../data/rooms.js';
import { THEMES, TEMPLATES } from '../data/themes.js';
import { DEFAULT_SHIFT_TABLE, DEFAULT_WHIM_TABLE, WHIM_STEPS } from '../data/tables.js';
import { $, esc, avgDice, attacksToText } from '../util/core.js';
import { net, savedTable, peerServer, inviteLink } from '../net/table.js';
import { currentTurn } from '../game/rules.js';
import { onStairs, dreadRulesLines } from '../game/actions.js';
import { undoCount } from '../game/session.js';
import { hpBar, condChips, resChips, BUILD_TOOLS } from './hud.js';
import { DIFFICULTY, gazeScale } from '../engine/encounter.js';
import { SHAPE_NAMES } from '../render/minis.js';
import { gfx } from '../render/gfx.js';
import { heroStats } from '../engine/hero.js';
import { sheetHTML } from './creator.js';
import { myHero } from '../game/heroes.js';
import { PROPS, PROP_CATS, HOUSES } from '../data/props.js';
import { valleyTab, placesForSession, playerMapTab } from './valley.js';
import { modelInfo } from '../render/models.js';
import { CAMPAIGN, SESSIONS, CLOCKS, PLACES, PLACE_STATES, CAST, FORTUNE } from '../data/campaign.js';
import { marchOrder } from '../game/moves.js';
import { NPC_KINDS } from '../data/looks.js';
import { mapStatus, away, library } from '../game/maps.js';
import { sessionKey } from '../game/campaign.js';
import { libraryList, KIND_LABEL } from '../engine/maps.js';
import { nightState, screenCount, screenLink, partyRoom, introducible, realDice } from '../game/night.js';
import { cardHTML } from './cards.js';

const art = (key, label) => {
  const a = state.art[key];
  return `<div class="artslot">${a ? `<img src="${a}" alt="">` : '<div style="width:56px;height:56px;border-radius:8px;background:#1d1720;display:grid;place-items:center">🖼</div>'}
    <div style="flex:1">${a ? 'Art set — shows as a standee mini.' : `No art yet. Drop in your Grok image for ${esc(label)}.`}<br>
    <label class="btn small" style="display:inline-block;margin-top:4px">Choose image<input type="file" accept="image/*" data-edit="art" data-k="${key}" hidden></label>
    ${a ? `<button class="btn small" data-act="clearArt" data-k="${key}">Clear</button>` : ''}</div></div>`;
};
const modelSlot = (key, label) => {
  const m = modelInfo(key);
  return `<div class="artslot"><div style="width:56px;height:56px;border-radius:8px;background:#1d1720;display:grid;place-items:center;font-size:22px">${m ? '🧊' : '⬚'}</div>
    <div style="flex:1">${m ? `3D model: <b>${esc(m.name)}</b> (${Math.round(m.size / 1024)} KB)` : `No 3D model. Drop a .glb for ${esc(label)} (it beats the art and the built-in mini).`}<br>
    <label class="btn small" style="display:inline-block;margin-top:4px">Choose .glb<input type="file" accept=".glb,model/gltf-binary" data-edit="model" data-k="${key}" hidden></label>
    ${m ? `<button class="btn small" data-act="clearModel" data-k="${key}">Clear</button>` : ''}</div></div>`;
};
export const gfxPanel = () => `<h3>Graphics & sound</h3>
  <div class="row"><label>Quality</label>${['low', 'medium', 'high'].map(q => `<button class="btn small ${gfx.quality === q ? 'on' : ''}" data-act="gfxQ" data-k="${q}">${q[0].toUpperCase() + q.slice(1)}</button>`).join('')}</div>
  <div class="muted">Low: fastest (phones). Medium: bloom on eyes and runes, film grain that worsens as his Gaze rises. High: torch shadows too.</div>
  <div class="row"><label>Volume</label><input type="range" min="0" max="1" step=".05" value="${gfx.volume}" data-edit="gfxVol" style="flex:1">
    <button class="btn small ${gfx.music ? 'on' : ''}" data-act="gfxT" data-k="music">Drone</button><button class="btn small ${gfx.sfx ? 'on' : ''}" data-act="gfxT" data-k="sfx">Effects</button></div>
  <div class="muted">Sound starts after your first tap. The DM's sounds play on every player's device too.</div>`;
const opt = (v, label, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
const logList = (n = 999) => state.log.slice().reverse().slice(0, n).map(l => `<div${l.dm ? ' class="muted" title="Only you see this line"' : ''}>${l.dm ? '🔒 ' : ''}${esc(l.m)}</div>`).join('') || '<div class="muted">Quiet. Too quiet.</div>';

function tokensTab(){
  let h = `<h3>The party</h3><div class="row"><button class="btn small" data-act="shortRest" title="An hour: short-rest features come back; spend Hit Dice from each hero's card">☕ Short rest</button><button class="btn small" data-act="longRest" title="Eight hours: full HP, every slot and feature">🌙 Long rest</button></div>`;
  h += `<div class="row"><button class="btn small ${ui.follow !== false ? 'on' : ''}" data-act="toggle" data-k="follow" title="Outside a fight, when you move a hero the others nearby fall in behind, single file">🚶 Party follows the leader</button></div>
    <div class="muted">Listed in marching order — ⇡ moves a hero up the line; 🚩 Stays keeps them where they are.</div>`;
  for (const [n, t] of marchOrder().entries()){
    const open = ui.openPc === t.id;
    const seat = Object.entries(state.seats).find(([, id]) => id === t.id);
    h += `<div class="card ${ui.selected === t.id ? 'sel' : ''}"><div class="hd"><span class="dot" style="color:${t.color};background:${t.color}"></span>
      <span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''} <span class="muted">${t.kind === 'npc' ? 'ally' : ''} · F${t.floor + 1}${seat ? ' · 🎮 ' + esc(net.conns.get(seat[0])?.name || '') : ''}</span></span>
      ${n ? `<button class="btn small" data-act="marchUp" data-id="${t.id}" title="Earlier in the marching order">⇡</button>` : ''}<button class="btn small ${t.flags.stay ? 'on' : ''}" data-act="stay" data-id="${t.id}" title="${t.flags.stay ? 'Stays put when the party moves' : 'Follows the party'}">${t.flags.stay ? '🚩 Stays' : '🚶'}</button>
      ${t.flags.taken ? `<button class="btn small seep" data-act="restore" data-id="${t.id}">Restore</button>` : `<button class="btn small" data-act="sel" data-id="${t.id}">Select</button>`}<button class="btn small" data-act="openPc" data-id="${t.id}">${open ? '▲' : '✎'}</button></div>
      ${t.flags.taken ? `<div class="fam-seep" style="font-size:13px">☣ Taken by the Seep — a Husk walks in their skin.</div>` : ''}
      <div class="stat" style="margin-top:4px">AC ${t.ac} · HP ${t.hp}/${t.maxHp} · ${t.speed} ft · Init ${t.init >= 0 ? '+' : ''}${t.init} · PP ${t.passive}</div>${hpBar(t, true)}
      ${t.conds?.length ? `<div>${condChips(t, false)}</div>` : ''}${resChips(t, false)}
      ${open ? `<div class="row"><input class="txt" style="flex:1" value="${esc(t.name)}" data-edit="tok" data-id="${t.id}" data-f="name"><input type="color" value="${t.color}" data-edit="tok" data-id="${t.id}" data-f="color"></div>
        <div class="row">${[['ac', 'AC'], ['hp', 'HP'], ['maxHp', 'Max'], ['speed', 'Speed'], ['init', 'Init'], ['saveMod', 'Save'], ['check', 'Tools'], ['passive', 'Passive']].map(([k, l]) => `<label>${l}<br><input class="txt num" type="number" value="${t[k]}" data-edit="tok" data-id="${t.id}" data-f="${k}"></label>`).join('')}</div>
        <div class="muted">Tools = lockpicking / disarm bonus · Passive = passive Perception (spots traps and secret doors on its own)</div>
        <label class="muted">Attacks — one per line: Name | +hit | damage | type | flair (optional, {A} and {T})</label>
        <textarea class="txt" data-edit="atk" data-id="${t.id}">${esc(attacksToText(t.attacks))}</textarea>
        ${art(t.id, t.name)}
        ${modelSlot('tok:' + t.id, t.name)}
        <div class="row"><button class="btn small" data-act="placeTok" data-id="${t.id}">📍 Place on map</button><button class="btn small danger" data-act="removeTok" data-id="${t.id}">Remove</button></div>` : ''}
    </div>`;
  }
  h += `<div class="row"><input class="txt" style="flex:1" id="newName" placeholder="Name (e.g. Ireena, Father Lucian)"><button class="btn small" data-act="addPc">+ Hero</button><button class="btn small" data-act="addNpc">+ Ally NPC</button></div>`;
  // 🎲 Roll an NPC: a name, a forged mini, what the party sees, a quirk and a want
  const N = ui.npcRoll;
  h += `<h3>Roll an NPC</h3><div class="row"><select class="txt" style="flex:1" id="npcKind">${Object.entries(NPC_KINDS).map(([k, v]) => opt(k, v.n, k === (N?.kind || ui.npcKind || 'villager'))).join('')}</select><button class="btn small primary" data-act="npcRoll">🎲 Roll</button></div>`;
  if (N) h += `<div class="card npc"><div class="hd">${N.img ? `<img class="npc-pt" src="${N.img}" alt="">` : ''}<div><div class="nm">${esc(N.name)}</div><div class="muted">${esc(NPC_KINDS[N.kind]?.n || '')}</div></div></div>
      <div class="look">${esc(N.line)}</div><div class="muted">They ${esc(N.quirk)}, and ${esc(N.want.replace(/^wants/, 'want'))}.</div>
      <div class="row"><button class="btn small" data-act="npcRoll">🎲 Another</button><button class="btn small primary" data-act="npcPlace">📍 Place as ally</button><button class="btn small danger" data-act="npcPlace" data-k="foe">📍 Place as foe</button></div></div>`;
  const chars = Object.values(state.characters || {});
  h += `<h3>Characters (${chars.length})</h3><div class="muted">Every sheet your players bring is kept here, in this campaign's save — even after they leave the table. A player who signs in with the same name and secret word gets theirs back on any device. 🔒 = locked to that player's secret word.</div>`;
  for (const c of chars){
    const tok = state.tokens.find(t => t.charId === c.id), st = heroStats(c);
    h += `<div class="card"><div class="hd"><span class="dot" style="color:${c.color};background:${c.color}"></span><span class="nm">${esc(c.name)} <span class="muted">${esc(c.sp)} ${esc(c.cls)} ${st.L}</span></span>
      <button class="btn small" data-act="dmSheet" data-id="${c.id}">Sheet</button>${tok ? '' : `<button class="btn small" data-act="placeChar" data-id="${c.id}">Place</button>`}<button class="btn small danger" data-act="removeChar" data-id="${c.id}">✕</button></div>
      <div class="row"><label class="muted" style="flex:1">🎮 Player <input class="txt" style="width:auto" data-edit="charOwner" data-id="${c.id}" value="${esc(c.owner || '')}" placeholder="their sign-in name"></label>${c.key ? `<span title="Locked to the player's secret word">🔒</span><button class="btn small" data-act="unlockChar" data-id="${c.id}" title="They forgot their word? Clear it.">Unlock</button>` : ''}</div>
      <div class="stat">AC ${st.ac} · HP ${st.hp} · Speed ${st.spd} · PP ${st.passive}${st.dc ? ` · Spell DC ${st.dc}` : ''}${c.goBackFor ? ` · would go back for <i>${esc(c.goBackFor)}</i>` : ''}${c.homeSmell ? ` · home smells of <i>${esc(c.homeSmell)}</i>` : ''}</div></div>`;
  }
  h += `<div class="row"><button class="btn small primary" data-act="dmNewChar">✚ Create a character</button></div>`;
  const foes = state.tokens.filter(t => t.kind === 'monster' && t.floor === ui.floor);
  h += `<h3>Horrors on this floor (${foes.filter(t => !t.dead).length})</h3>`;
  if (!foes.length) h += `<div class="muted">Nothing — yet. Use the Bestiary tab to place creatures, or Populate in the Build tab.</div>`;
  for (const t of foes) h += `<div class="card ${ui.selected === t.id ? 'sel' : ''}" data-act="sel" data-id="${t.id}" style="cursor:pointer"><div class="hd"><span class="dot" style="color:#c0303a;background:#c0303a"></span><span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''}${t.flags.rising ? ' <span class="fam-seep">(rising)</span>' : ''}${t.flags.alert ? ' <span class="muted">(alert)</span>' : ''}</span><span class="stat">AC ${t.ac} · ${t.hp}/${t.maxHp}</span></div>${hpBar(t)}${t.conds?.length ? condChips(t, false) : ''}</div>`;
  if (foes.some(t => t.dead)) h += `<div class="row"><button class="btn small" data-act="clearDead">Clear the dead</button></div>`;
  return h;
}

function bestiaryTab(){
  const fams = [['all', 'All'], ...Object.entries(FAMILIES).map(([k, v]) => [k, v.label]), ['custom', 'Custom']];
  const E = ui.enc;
  let h = `<h3>Encounter</h3><div class="card"><div class="row">${DIFFICULTY.map(k => `<span class="chip ${(ui.encDiff || 'moderate') === k ? 'on' : ''}" data-act="encDiff" data-k="${k}">${k}</span>`).join('')}
      <select class="txt" style="width:auto" data-edit="encFam"><option value="any">any creatures</option>${Object.entries(FAMILIES).map(([k, v]) => `<option value="${k}" ${ui.encFam === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>
    <div class="row"><button class="btn small primary" data-act="encRoll">🎲 Roll a fight</button>${E?.group.length ? `<button class="btn small seep" data-act="encPlace">📍 Place on this floor</button>` : ''}</div>
    ${E ? `<div class="stat">Party ${E.levels.length} × level ${[...new Set(E.levels)].join('/')} · ${E.difficulty} · budget <b>${E.budget}</b> XP (Gaze ${E.gaze ?? state.dread} ×${gazeScale(E.gaze ?? state.dread).toFixed(2)})</div>
      ${E.group.length ? `<div>${E.group.map(g => `<span class="chip">${g.n} × ${esc(BEST[g.bid]?.name || g.bid)} <span class="muted">CR ${BEST[g.bid]?.cr}</span></span>`).join('')}</div><div class="muted">${E.xp} XP · placed in a room away from the party</div>` : '<div class="muted">Nothing fits that budget.</div>'}` : '<div class="muted">A fight sized to the party\'s levels. The higher his Gaze, the bigger it gets — and the more of it is his.</div>'}</div>
    <h3>Bestiary</h3><div>${fams.map(([k, l]) => `<span class="chip ${ui.bestFilter === k ? 'on' : ''}" data-act="bestFilter" data-k="${k}">${l}</span>`).join('')}</div>
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
        ${modelSlot('bid:' + b.id, b.name)}
        <h4>Grok prompt</h4><textarea class="txt" readonly id="pr-${b.id}">${esc(b.prompt)}</textarea>
        <div class="row"><button class="btn small" data-act="copy" data-k="pr-${b.id}">Copy prompt</button></div>` : ''}</div>`;
  }
  h += `<div class="row"><button class="btn small" data-act="copyAllPrompts">Copy every Grok prompt</button></div>`;
  return h;
}

// Time since, for the shelf: "just now", "12 min ago", "3 h ago", "2 days ago".
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };
// The map library: the map on the table, the party (here, or waiting elsewhere while the DM sets up), the shelf.
function mapsSection(){
  const w = away(), shelf = libraryList(library()), kind = KIND_LABEL[state.meta.kind] || 'Map';
  let h = `<h3>🗺 Maps</h3>`;
  if (w) h += `<div class="card sel prep"><div class="hd"><span class="nm">✎ Setting up ${esc(state.meta.name)}</span></div>
      <div class="look">The party waits in <b>${esc(w.name)}</b>. The players' screens hold still under a veil until you bring the party here or go back to them.</div>
      <div class="row"><button class="btn small primary" data-act="mode:placeParty" data-hint="Tap where the party arrives">📍 Bring the party here…</button><button class="btn small" data-act="mapBack">↩ Back to the party</button></div></div>`;
  h += `<div class="card"><div class="hd"><span class="nm">▦ ${esc(state.meta.name)}</span><span class="muted">${kind} · ${state.floors.length} floor${state.floors.length === 1 ? '' : 's'} · on the table</span></div>
      ${w ? '' : `<div class="row"><button class="btn small" data-act="mode:placeParty" data-hint="Tap where the party should gather">📍 Move the party…</button><span class="muted">tap a square: everyone regroups there in marching order</span></div>`}</div>`;
  if (shelf.length) h += `<h4>On the shelf (${shelf.length})</h4>` + shelf.map(e => `<div class="card"><div class="hd"><span class="nm">${esc(e.name)}</span><span class="muted">${KIND_LABEL[e.kind] || 'Map'} · ${e.floors.length} floor${e.floors.length === 1 ? '' : 's'} · left ${ago(e.savedAt)}</span></div>
      ${w?.mapId === e.id ? '<div class="muted">🧍 The party is here.</div>' : ''}
      <div class="row"><button class="btn small primary" data-act="mapGo" data-id="${esc(e.id)}" title="${w?.mapId === e.id ? 'Back to the party' : 'The party travels there and arrives where it last stood (or at the way in)'}">${w?.mapId === e.id ? '↩ Back to the party' : '⇢ Go there with the party'}</button>
        ${w?.mapId === e.id ? '' : `<button class="btn small" data-act="mapPrep" data-id="${esc(e.id)}" title="Open it without the party, to set it up">✎ Set it up</button><button class="btn small danger" data-act="mapForget" data-id="${esc(e.id)}" title="Throw this map away">✕</button>`}</div></div>`).join('');
  else h += `<div class="muted">Maps you leave are kept here as the party left them: fog, doors, furniture and whoever stayed behind. Session dungeons and places in the Valley come back off the shelf when you return to them.</div>`;
  return h;
}
function dungeonTab(){
  const f = state.floors[ui.floor], D = dreadLevel();
  let h = mapsSection() + `<h3>This floor</h3>
    <div class="row"><input class="txt" value="${esc(f.name)}" data-edit="floorName"></div>
    <div class="row"><label>Look</label><select class="txt" style="flex:1" data-edit="floorTheme">${THEMES.map((t, i) => opt(i, t.name, f.theme === i)).join('')}</select></div>
    <div class="row"><button class="btn primary" data-act="shiftNow">⟲ Shift the halls (d100)</button><input class="txt num" id="shiftForce" type="number" min="1" max="100" placeholder="roll"><button class="btn small" data-act="shiftForced" title="Use this number instead of rolling">Use</button></div>
    <div class="row"><button class="btn small" data-act="reveal">Reveal floor</button><button class="btn small" data-act="refog">Re-fog floor</button></div>
    <div class="muted">${D.shift ? `At Gaze ${state.dread} this floor rearranges itself at the end of each combat round (${Math.round(D.shift * 100)}% chance).` : 'At Gaze 6+ the land starts rearranging itself during combat.'}</div>
    <h4>View</h4><div class="row">
      <button class="btn small ${ui.previewFog ? 'on' : ''}" data-act="toggle" data-k="previewFog">Preview fog</button>
      <button class="btn small ${ui.roomLabels ? 'on' : ''}" data-act="toggle" data-k="roomLabels">Room labels</button>
      <button class="btn small ${ui.freeMove ? 'on' : ''}" data-act="toggle" data-k="freeMove">Free move</button>
      <button class="btn small ${ui.whispers ? 'on' : ''}" data-act="toggle" data-k="whispers">Whispers</button>
      <button class="btn small ${ui.roomPrompts !== false ? 'on' : ''}" data-act="toggle" data-k="roomPrompts" title="When the party first walks into a room, offer its read-aloud">Room prompts</button></div>
    <h4>Rooms (${f.rooms.length})</h4>
    <div class="row"><button class="btn small" data-act="furnishFloor" title="Furniture for every room that has none, by its type and this floor's look">🪑 Furnish empty rooms</button><button class="btn small" data-act="describeFloor" title="A read-aloud line for every room that has none">📜 Describe rooms</button></div>`;
  for (const r of f.rooms) h += `<div class="card ${ui.selRoom === r.id ? 'sel' : ''}"><div class="hd"><span class="dot" style="color:${ROOM_TYPES[r.type]?.color};background:${ROOM_TYPES[r.type]?.color}"></span>
      <input class="txt" style="flex:1" value="${esc(r.name)}" data-edit="room" data-id="${r.id}" data-f="name"><button class="btn small" data-act="goRoom" data-id="${r.id}">Go</button></div>
      <div class="row"><select class="txt" data-edit="room" data-id="${r.id}" data-f="type">${Object.entries(ROOM_TYPES).map(([k, v]) => opt(k, v.label, r.type === k)).join('')}</select></div>
      <textarea class="txt" style="min-height:44px" placeholder="Read-aloud — what the party sees, hears and smells…" data-edit="room" data-id="${r.id}" data-f="read">${esc(r.read || '')}</textarea>
      <textarea class="txt" style="min-height:44px" placeholder="DM notes — what could happen here…" data-edit="room" data-id="${r.id}" data-f="notes">${esc(r.notes || '')}</textarea>
      <div class="row"><button class="btn small" data-act="readRoom" data-id="${r.id}">📜 Read aloud</button><button class="btn small" data-act="furnishRoom" data-id="${r.id}">🪑 Furnish</button><button class="btn small" data-act="clearRoom" data-id="${r.id}">✕ Clear furniture</button></div></div>`;
  h += `<h4>Grok prompt for this floor</h4><textarea class="txt" readonly id="pr-floor">${esc((THEMES[f.theme] || THEMES[0]).prompt)}</textarea><div class="row"><button class="btn small" data-act="copy" data-k="pr-floor">Copy prompt</button></div>
    <h3>New map</h3>
    <div class="row"><label>Name</label><input class="txt" id="ndName" value="" placeholder="(the template's name)"></div>
    <div class="row"><label>Template</label><select class="txt" style="flex:1" id="ndTemplate">${TEMPLATES.map(t => opt(t.id, t.name, t.id === state.meta.template)).join('')}</select></div>
    <div class="muted" id="ndBlurb">${esc((TEMPLATES.find(t => t.id === state.meta.template) || TEMPLATES[0]).blurb)}</div>
    <div class="row"><label>Seed</label><input class="txt" style="flex:1" id="ndSeed" value="${esc(state.meta.seed)}"></div>
    <div class="row"><label>Floors</label><select class="txt" style="width:auto" id="ndFloors">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => opt(n, n, n === state.meta.floors)).join('')}</select>
      <label>Size</label><select class="txt" style="width:auto" id="ndSize">${[32, 40, 48, 56, 64].map(n => opt(n, n, n === state.meta.size)).join('')}</select></div>
    <div class="row"><button class="btn primary" data-act="regen" data-k="bring">Generate — the party goes there</button><button class="btn" data-act="regen" data-k="prep">Generate to set up</button></div>
    <div class="muted">Either way, the map on the table now goes on the shelf above.</div>`;
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
  if (ui.mode === 'prop') h += `<h4>Prop to place</h4><div>${Object.entries(PROP_CATS).map(([k, l]) => `<span class="chip ${ui.propCat === k ? 'on' : ''}" data-act="propCat" data-k="${k}">${l}</span>`).join('')}</div>
    <div class="propgrid">${Object.entries(PROPS).filter(([, v]) => v.cat === ui.propCat).map(([k, v]) => `<span class="chip ${ui.propKind === k ? 'on' : ''}" data-act="propKind" data-k="${k}">${esc(v.n)}<small> ${v.w}×${v.h}</small></span>`).join('')}</div>
    <div class="muted">Minis climb onto low props (tables, crates, beds: difficult terrain), hop fences and go round tall ones (shelves, statues, pillars). Props never block sight. ${(f.props || []).length} on this floor.</div>`;
  if (ui.mode === 'house') h += `<h4>House to put up</h4><div class="propgrid">${Object.entries(HOUSES).map(([k, v]) => `<span class="chip ${ui.houseKind === k ? 'on' : ''}" data-act="houseKind" data-k="${k}">${esc(v.n)}<small> ${v.w}×${v.h}</small></span>`).join('')}</div>
    <div class="row"><button class="btn small ${ui.houseDark ? '' : 'on'}" data-act="houseDark">${ui.houseDark ? '🌑 Windows dark' : '🕯 Windows lit'}</button></div>
    <div class="muted">Houses stand on solid ground (rock) and block the way, like walls. ${(f.buildings || []).length} on this floor.</div>`;
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
    <h3>Dungeon kit (3D models)</h3>
    <div class="muted">Free CC0 kits (Kenney, Quaternius) work well. The piece is stretched to fill one square; walls stand 7 ft tall.</div>
    ${modelSlot('kit:wall', 'walls')}${modelSlot('kit:floor', 'floor tiles')}
    <h3>Export this floor</h3>
    <div class="row"><button class="btn small" data-act="copyAscii">Copy as ASCII</button><button class="btn small" data-act="downloadFloor">⬇ Floor JSON</button></div>`;
  return h;
}

function gazeTab(){
  const sh = shiftTable(), gr = whimTable(), D = dreadLevel();
  const gapsS = tableGaps(sh.rows, 100), gapsG = tableGaps(gr.rows, 12);
  let h = `<h3>👁 Strahd's Gaze ${state.dread} · ${esc(D.n)}</h3><div class="look">${esc(D.text || '')}</div>
    <div class="trait">${dreadRulesLines(D).join(' · ') || '<span class="muted">No automatic effects at this level.</span>'}</div>
    <div class="muted">How closely the Count is watching. Raise it when they catch his eye; his creatures fight harder, the dead get up, the land moves and, from 8, his voice gets inside their heads.</div>
    <h3>🦇 The Whim Die</h3>
    <div class="row grasp"><button class="btn small" data-act="whimStep" data-k="-1">−</button>
      ${WHIM_STEPS.map(n => `<span class="die ${state.grasp.die === n ? 'on' : ''}">d${n}</span>`).join('')}
      <button class="btn small" data-act="whimStep" data-k="1">+</button></div>
    <div class="row"><button class="btn primary" data-act="whimRoll">Roll the Whim Die</button><button class="btn small ${state.grasp.auto ? 'on' : ''}" data-act="whimAuto">${state.grasp.auto ? 'Auto: each round' : 'Auto: off'}</button></div>
    ${state.grasp.last ? `<div class="muted">Last: d${state.grasp.last.die} = <b>${state.grasp.last.r}</b> — ${esc(state.grasp.last.name)}</div>` : ''}
    <div class="muted">How he toys with them. Grows when one of his creatures falls (once a round) and when you press + (they refused a gift, insulted him, were brave where he could see). Shrinks when they bow, accept his hospitality or rest somewhere holy. Roll it when the night is too quiet.</div>
    <h3>Gaze levels</h3>
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
    <h3>The Whim table</h3>
    <div class="muted">Rows by Whim Die result (1–${Math.max(12, tableMax(gr.rows))}).</div>
    <textarea class="txt" id="whimText" style="min-height:200px;font-family:ui-monospace,monospace;font-size:12px">${esc(state.content.grasp ?? DEFAULT_WHIM_TABLE)}</textarea>
    ${gr.errors.length ? `<div class="bad">${gr.errors.map(esc).join('<br>')}</div>` : ''}${gapsG.length ? `<div class="bad">No row for: ${gapsG.join(', ')}</div>` : ''}
    <div class="row"><button class="btn small primary" data-act="saveWhim">Save table</button></div>`;
  return h;
}

function tableTab(){
  let h = `<h3>Play together</h3>`;
  const saved = savedTable();
  if (!net.code && net.opening) h += `<div class="code" style="opacity:.5">${esc(net.opening)}</div><div class="muted">Opening the table on ${esc(peerServer()?.host || 'the PeerJS server')}…</div>`;
  else if (!net.code) h += `<div class="muted">Open a table and give your players the code (or send them the invite link). They open this same page, choose <i>Accept the invitation</i>, sign in with their name and secret word, and join — their own heroes are seated automatically, and they come back on their own if their phone sleeps.</div>
    <div class="row"><button class="btn primary" data-act="host">${saved ? `Reopen table ${esc(saved.code)}` : 'Open table'}</button>${saved ? '<button class="btn small" data-act="hostNew" title="A new code (players will need it)">New code</button>' : ''}</div>`;
  else {
    const link = inviteLink();
    h += `<div class="code">${net.code}</div>${net.online ? '' : `<div class="muted" style="color:var(--blood)">⚠ Lost touch with the server — reconnecting. Players already here keep playing; new ones can't join until it's back.</div>`}
      ${link ? `<div class="row"><input class="txt" style="flex:1;font-size:12px" readonly value="${esc(link)}" id="inviteLink"><button class="btn small" data-act="copyInvite">📋 Copy invite</button></div>` : ''}
      <h4>Players (${net.conns.size})</h4>`;
    const knocks = [...net.knocks.values()].filter(k => Date.now() - k.at < 180000);
    for (const k of knocks) h += `<div class="row knock ${k.state}"><span style="flex:1">🚪 ${esc(k.name)} ${k.state === 'stuck' ? `<b style="color:var(--blood)">can't get through</b>` : 'is knocking…'}</span>${k.ice ? `<span class="muted">${esc(k.ice)}</span>` : ''}</div>`;
    if (knocks.some(k => k.state === 'stuck')) h += `<div class="muted">Their device found your table but the two of you can't connect directly (different networks, mobile data, a strict router). Try the same Wi-Fi, or add a relay below and send them the new invite link.</div>`;
    if (!net.conns.size && !knocks.length) h += `<div class="muted">Waiting for players to join…</div>`;
    for (const [pid, s] of net.conns) h += s.screen ? `<div class="row"><span style="flex:1">${esc(s.name)}</span><span class="muted">the Night tab drives it</span></div>` : `<div class="row"><span style="flex:1">🎮 ${esc(s.name)}</span><select class="txt" style="width:auto" data-edit="seat" data-k="${pid}"><option value="">— no token —</option>${state.tokens.filter(t => t.kind !== 'monster').map(t => opt(t.id, t.name, state.seats[pid] === t.id)).join('')}</select></div>`;
    h += `<div class="row"><button class="btn small danger" data-act="unhost">Close table</button></div>`;
  }
  const ps = peerServer() || {}, stuck = [...net.knocks.values()].some(k => k.state === 'stuck');
  h += `<details class="card"${ps.turn?.urls || stuck ? ' open' : ''}><summary class="muted">Relay — for players who can't connect${ps.turn?.urls ? ' — <b>yours is on</b>' : ''}</summary>
    <div class="muted">Your table and a player's device talk directly when they can. When they can't (phones on mobile data, two different networks, strict routers) the connection needs a <b>relay</b> (a TURN server) to pass it along. Free public relays are already tried; if players still can't get through, sign up for a free TURN service (Metered's Open Relay, ExpressTURN, Cloudflare and others offer one), paste what it gives you here, Save, and send your players the invite link again — it carries the relay to them. Prefer a <code>turns:…:443</code> address: it gets through almost anything. Several addresses: separate them with commas.</div>
    <div class="row"><input class="txt" style="flex:2" id="psTurn" placeholder="turns:relay.example.com:443?transport=tcp, turn:relay.example.com:80" value="${esc(ps.turn?.urls || '')}"></div>
    <div class="row"><input class="txt" style="flex:1" id="psTurnUser" placeholder="username" value="${esc(ps.turn?.username || '')}"><input class="txt" style="flex:1" id="psTurnPass" placeholder="password / credential" value="${esc(ps.turn?.credential || '')}"></div>
    <div class="row"><button class="btn small" data-act="psSave">Save</button><button class="btn small" data-act="turnTest">Test the relay</button>${ps.turn?.urls ? '<button class="btn small" data-act="turnClear">Remove</button>' : ''}</div></details>`;
  h += `<details class="card"${ps.host ? ' open' : ''}><summary class="muted">Signalling server (advanced)${ps.host ? ` — <b>${esc(ps.host)}</b>` : ' — the free PeerJS server'}</summary>
    <div class="muted">Players find your table through a signalling server. The free public one is the default; run your own (<code>npx peer --port 9000 --key dreaddelve</code>, or any PeerJS server) if it is ever down. The invite link carries this setting to your players.</div>
    <div class="row"><input class="txt" style="flex:2" id="psHost" placeholder="host (e.g. peer.example.com)" value="${esc(ps.host || '')}"><input class="txt num" id="psPort" placeholder="443" value="${esc(ps.port || '')}"></div>
    <div class="row"><input class="txt" style="flex:1" id="psPath" placeholder="path (/)" value="${esc(ps.path || '')}"><input class="txt" style="flex:1" id="psKey" placeholder="key (peerjs)" value="${esc(ps.key || '')}"><label class="muted"><input type="checkbox" id="psSecure" ${ps.secure === false ? '' : 'checked'}> https</label></div>
    <div class="row"><button class="btn small" data-act="psSave">Save</button><button class="btn small" data-act="psTest">Test</button>${ps.host ? '<button class="btn small" data-act="psClear">Use the free server</button>' : ''}</div></details>`;
  h += `<h4>Players' rolls</h4><div class="row"><button class="btn small ${state.campaign.freeRolls ? 'on' : ''}" data-act="freeRolls">🎲 Players roll freely: ${state.campaign.freeRolls ? 'ON' : 'off'}</button></div>
    <div class="muted">Players tap an attack, spell or feature on their own hero, then a target. ${state.campaign.freeRolls ? 'It rolls at once.' : 'You get a request at the top of the screen: roll it as asked, with advantage or disadvantage, or say no.'} Your app does the rolling, so everyone sees the same card.</div>`;
  h += `<div class="row"><button class="btn ${ui.tableView ? 'on' : ''}" data-act="tableView">📺 Table view ${ui.tableView ? 'ON' : 'off'}</button></div>
    <div class="muted">Table view shows what players see — fog, no room secrets, no hidden traps or secret doors, no monster HP. Use it when the screen is cast to a TV.</div>
    ${gfxPanel()}
    <h3>Save</h3><div class="muted">Autosaves in this browser. Export to move a delve between devices or keep backups. Your edited tables and creatures travel with the save.</div>
    <div class="row"><button class="btn" data-act="export">⬇ Export</button><label class="btn">⬆ Import<input type="file" accept=".json" data-edit="import" hidden></label><button class="btn small" data-act="startScreen">Start screen</button></div>
    <h3>Log</h3><div class="log">${logList()}</div>`;
  return h;
}

/* GAME NIGHT — playing round one table (game/night.js): the TV, what it shows, read-alouds, faces, handouts,
   the turn timer, real dice, and the players' phones as hero cards. */
function nightTab(){
  const N = nightState(), n = screenCount(), room = partyRoom(), sess = SESSIONS.find(x => x.n === state.campaign.session);
  const seg = (act, k, on, label, title = '') => `<button class="btn small ${on ? 'on' : ''}" data-act="${act}" data-k="${k}" title="${esc(title)}">${label}</button>`;
  let h = `<h3>🕯 Game night</h3><div class="muted">For playing round one table: the map on the TV, your laptop running it, the players' phones as their hero cards (or no phones at all), and real dice.</div>
    <h4>📺 The table screen</h4>
    <div class="row"><button class="btn primary" data-act="ntOpen">📺 Open the table screen</button><span class="muted">${n ? `<b style="color:var(--candle)">${n} screen${n === 1 ? '' : 's'} connected</b>` : 'none connected'}</span></div>
    <div class="muted">A new window: drag it onto the TV or a second monitor and press ⛶ in its corner. It shows what the party sees (fog, no secrets): the turn order with the heroes' faces across the top, the party along the bottom, and a camera that follows the action and drifts slowly while they explore.</div>
    ${net.code ? `<div class="muted">On another device (a smart TV's browser, a tablet on the table): open <input class="txt" readonly id="ntLink" value="${esc(screenLink(net.code))}" style="width:100%"></div><div class="row"><button class="btn small" data-act="copy" data-k="ntLink">Copy the screen link</button></div>` : `<div class="muted">To put the screen on another device instead (a smart TV's browser, a tablet), open the table first (Table tab); its link appears here.</div>`}
    <div class="row">${seg('ntMode', 'map', N.mode === 'map', '🗺 The map')}${seg('ntMode', 'dark', N.mode === 'dark', '🕯 Lights out', 'Black, one candle: for the moment before a reveal')}${seg('ntFollow', N.follow ? 'off' : 'on', N.follow, '🎥 Follow the action', 'The screen keeps whoever is acting in frame')}<button class="btn small" data-act="ntLook" title="The screen's camera goes where yours is (for a while)">👁 Show what I see</button></div>
    <h4>📜 Read aloud — on the screen</h4>
    <input class="txt" id="ntTitle" placeholder="A title (optional)" value="${esc(ui.ntTitle || '')}">
    <textarea class="txt" id="ntText" style="min-height:90px" placeholder="What they see, hear and smell… it fades in on the TV, big, by candlelight.">${esc(ui.ntText || '')}</textarea>
    <div class="row"><button class="btn small primary" data-act="ntNarrate">📜 Show on the screen</button><button class="btn small" data-act="ntClear">✕ Clear the screen</button></div>
    <div class="row">${room?.read ? `<button class="btn small" data-act="ntQuick" data-k="room" title="${esc(room.read)}">The room they're in: ${esc(room.name)}</button>` : ''}${sess?.open ? `<button class="btn small" data-act="ntQuick" data-k="open">Session ${sess.n}'s opening</button>` : ''}<button class="btn small" data-act="ntQuick" data-k="gaze">Strahd's Gaze</button></div>
    <h4>🎭 Introduce someone</h4>
    <input class="txt" id="ntLine" placeholder="Their first words, or how they come in (optional)" value="${esc(ui.ntLine || '')}">`;
  const who = introducible();
  h += who.length ? who.slice(0, 14).map(t => `<div class="row"><span style="flex:1">${t.kind === 'npc' ? '🧑' : '👹'} ${esc(t.name)}${t.look || state.art?.[t.id] ? '' : ' <span class="muted">(no face — just the name)</span>'}</span><button class="btn small" data-act="ntIntro" data-id="${t.id}">🎭 Introduce</button></div>`).join('')
    : `<div class="muted">Nobody else on this floor. Roll an NPC in the Tokens tab: their forged face is what the table sees.</div>`;
  h += `<h4>🖼 Handouts</h4><div class="row"><label class="btn small">⬆ Show a picture<input type="file" accept="image/*" data-edit="ntHandout" hidden></label></div>
    ${(ui.handouts || []).map((x, i) => `<div class="row"><span style="flex:1">${esc(x.title)}</span><button class="btn small" data-act="ntHand" data-k="${i}">Show again</button></div>`).join('')}
    <div class="muted">A letter, a map, a portrait: it fills the TV until you clear it. (Kept for this evening only.)</div>
    <h4>⏳ Turn timer</h4><div class="row">${[0, 30, 60, 90].map(s => seg('ntTimer', s, N.timer === s, s ? `${s} s` : 'Off')).join('')}</div>
    <div class="muted">A ring on the TV empties over each hero's turn. Nothing happens when it runs out; the table just knows.</div>
    <h4>🎲 Real dice</h4><div class="row"><button class="btn small ${realDice() ? 'on' : ''}" data-act="ntDice">🎲 Players roll real dice: ${realDice() ? 'ON' : 'off'}</button></div>
    <div class="muted">${realDice() ? 'When a hero attacks, you get twenty big buttons: tap what they rolled (or let the app roll). Players on their phones type their roll in with the attack. The app adds the bonuses, checks AC and cover, and rolls damage.' : 'Turn on to type in the d20 the players roll at the table instead of the app rolling it.'}</div>
    <h4>📱 Players' phones</h4>
    <div class="muted">Players join with the table code (Table tab) and turn on <b>📇 Card only</b> in their Hero tab: no map on the phone (the TV has it), just their hero, big buttons, and a list of targets. Or skip the phones: you run the heroes from here.</div>
    <div class="row"><button class="btn small ${gfx.sfx || gfx.music ? '' : 'on'}" data-act="ntQuiet" title="Let the TV's speakers do the sound">🔇 Quiet this laptop</button></div>`;
  return h;
}
const newAtTable = () => net.host?.open && net.status === 'open' ? `<div class="row"><button class="btn small" data-act="newHeroAtTable">✚ Make a new character</button></div>` : '';
function heroTab(){
  const me = tokById(ui.myToken);
  let h = `<h3>Your hero</h3>`;
  if (net.join && net.status !== 'open') h += `<div class="card" style="border-color:var(--blood)"><div class="hd"><span class="nm">${net.status === 'closed' ? 'The DM closed the table' : net.status === 'lost' ? 'Lost the table' : 'Reconnecting to the table…'}</span></div>
    <div class="muted">${net.status === 'closed' ? 'Your heroes are saved in this browser.' : `Table ${esc(net.join.code)}. ${net.status === 'lost' ? 'It stopped answering.' : 'Your phone may have slept — this happens on its own.'}`}</div>
    <div class="row"><button class="btn small primary" data-act="rejoin">↻ Try again</button><button class="btn small" data-act="startScreen">Start screen</button></div></div>`;
  const others = (ui.tableChars || []).filter(c => c.id !== me?.charId);
  const picker = others.length ? `<div class="muted">${me ? 'Your other characters at this table:' : 'Your characters at this table — who are you playing tonight?'}</div><div class="row">${others.map(c => `<button class="btn small${me ? '' : ' primary'}" data-act="pickChar" data-id="${c.id}">${esc(c.name)} · ${esc(c.cls)} ${c.lvl}</button>`).join('')}</div>` : '';
  if (!me) h += `<div class="muted">${net.host?.open ? (others.length ? '' : 'Connected. Waiting for the DM to seat you — or make your character now.') : 'Connecting to the table…'}</div>` + picker + newAtTable();
  else if (me.flags.taken) h += `<div class="card"><div class="fam-seep">☣ The Seep has taken ${esc(me.name)}. Wait for the DM.</div></div>`;
  else {
    const turn = currentTurn()?.id === me.id, st = onStairs(me);
    const sheet = ui.myHeroId && myHero(ui.myHeroId);
    h += `<div class="card sel"><div class="hd"><span class="dot" style="color:${me.color};background:${me.color}"></span><span class="nm">${esc(me.name)}${me.dead ? ' ✝' : ''}</span></div>
      <div class="stat">AC ${me.ac} · HP ${me.hp}/${me.maxHp} · Speed ${me.speed} ft${state.combat.active ? ` · moved ${(me.moved || 0) * 5} ft` : ''}</div>${hpBar(me, true)}
      ${me.conds?.length ? `<div>${condChips(me, false)}</div>` : ''}${resChips(me, false)}
      <div class="row">${ui.cardOnly ? '' : `<button class="btn small" data-act="sel" data-id="${me.id}">Select & show moves</button>`}<button class="btn small" data-act="search">🔍 Search</button>${st ? `<button class="btn small primary" data-act="stairs">${esc(exitLabel(state.floors[me.floor], st))}</button>` : ''}${turn ? `<button class="btn small primary" data-act="endMyTurn">End my turn</button>` : ''}</div></div>`;
    h += `<div class="row"><button class="btn small ${ui.cardOnly ? 'on' : ''}" data-act="cardOnly" title="At an in-person game, when the TV shows the map: no map on this phone, just your hero as a big card">📇 Card only${ui.cardOnly ? ': ON' : ' (we\'re at the table)'}</button></div>`;
    if (ui.cardOnly) h += cardHTML(me);
    if (sheet) h += sheetHTML(sheet) + `<div class="row"><button class="btn small" data-act="editHero" data-id="${sheet.id}">✎ Edit / level up</button></div>`;
    h += picker + newAtTable();
    if (!ui.cardOnly) h += `<div class="muted">${state.combat.active ? (turn ? '<b style="color:var(--candle)">It is your turn.</b> Tap a glowing tile to move.' : 'Combat — wait for your turn to move.') : 'Exploring — tap your hero, then a glowing tile.'}<br>Tap a door next to you to open it. Long-press or use ◎ to ping a spot for everyone.</div>`;
  }
  h += gfxPanel() + `<h3>Log</h3><div class="log">${logList(25)}</div>`;
  return h;
}

function storyTab(){
  const C = state.campaign, s = SESSIONS.find(x => x.n === C.session) || SESSIONS[0], done = C.done[s.n] || {};
  const name = id => BEST[id]?.name || id;
  let h = `<h3>${esc(CAMPAIGN.name)}</h3><div class="muted"><i>${esc(CAMPAIGN.tagline)}</i> · ${esc(CAMPAIGN.levels)}</div>
    <div class="sessbar">${SESSIONS.map(x => `<span class="chip ${x.n === s.n ? 'on' : ''}" data-act="session" data-k="${x.n}" title="${esc(x.title)}">${x.n}</span>`).join('')}</div>
    <div class="card sel"><div class="hd"><span class="nm">Session ${s.n} · ${esc(s.title)}</span></div>
      <div class="stat">Level <b>${esc(s.level)}</b> · ${esc(s.length)} · start at Gaze <b>${s.gaze}</b> <button class="btn small" data-act="sessGaze" data-k="${s.n}">Set Gaze ${s.gaze}</button></div>
      ${placesForSession(s.n).length ? `<div class="trait"><b>Where.</b> ${placesForSession(s.n).map(p => `<span class="chip" data-act="valleyGo" data-k="${p.id}">🧭 ${esc(p.name)}</span>`).join('')} <span class="muted">— plan the road in the Valley tab</span></div>` : ''}
      <div class="trait"><b>Hook.</b> ${esc(s.hook)}</div>
      <div class="trait">${esc(s.premise)}</div>
      <div class="trait"><b>From your book.</b> ${esc(s.book)}</div>
      <div class="trait fam-seep"><b>Flood Edition.</b> ${esc(s.flood)}</div>
      <div class="look">${esc(s.open)}</div>
      <div class="row"><button class="btn small primary" data-act="readOpen" data-k="${s.n}">📜 Read the opening to the table</button></div></div>`;
  s.scenes.forEach((sc, k) => {
    h += `<div class="card"><div class="hd"><span class="nm">${esc(sc.t)}</span></div>
      ${sc.beats.map((b, i) => `<label class="beat"><input type="checkbox" data-edit="beat" data-k="${s.n}" data-id="${k}.${i}" ${done[`${k}.${i}`] ? 'checked' : ''}><span>${esc(b)}</span></label>`).join('')}
      ${sc.delve ? (() => { const st = mapStatus(sessionKey(s.n, k)), nm = esc((TEMPLATES.find(t => t.id === sc.delve.template) || {}).name || sc.delve.template);
        return `<div class="row">${st === 'here' ? `<span class="chip on">▦ ${nm} — on the table</span>` : `<button class="btn small primary" data-act="sessDelve" data-k="${s.n}" data-id="${k}">▦ ${st === 'shelf' ? 'Back to' : 'Build'}: ${nm}</button>`}</div><div class="muted">${esc(sc.delve.note || '')} The party comes along; the map you leave is kept in the Maps tab.</div>`; })() : ''}
      ${sc.enc ? `<div class="row"><button class="btn small seep" data-act="sessEnc" data-k="${s.n}" data-id="${k}">⚔ Place: ${esc(sc.enc.label)}</button><span class="muted">${sc.enc.group.map(([b, n]) => `${n} ${esc(name(b))}`).join(', ')} · ${sc.enc.where === 'party' ? 'near the party' : sc.enc.where === 'nest' ? 'in a nest or lair' : 'in a room'}</span></div>` : ''}
    </div>`;
  });
  h += `${s.npcs?.length ? `<div class="trait"><b>Faces.</b> ${s.npcs.map(id => esc(CAST.find(c => c.id === id)?.name || id)).join(' · ')}</div>` : ''}
    ${s.loot?.length ? `<div class="trait"><b>Loot.</b> ${s.loot.map(esc).join(' · ')}</div>` : ''}
    <div class="trait"><b>Clocks (suggested).</b> ${Object.entries(s.tick || {}).map(([k, v]) => `${esc(CLOCKS.find(c => c.id === k)?.label || k)} ${v > 0 ? '+' : ''}${v}`).join(' · ') || '—'} ${Object.keys(s.tick || {}).length ? `<button class="btn small" data-act="sessTicks" data-k="${s.n}">Apply</button>` : ''}</div>
    <div class="trait"><b>End on.</b> ${esc(s.ending)} <button class="btn small" data-act="readEnd" data-k="${s.n}">📜 Read</button></div>
    <div class="trait"><b>Level.</b> ${esc(s.levelUp)}</div>
    <textarea class="txt" placeholder="Session notes — what changed, who saw them, what the Count now knows…" data-edit="sessNotes" data-k="${s.n}">${esc(C.notes[s.n] || '')}</textarea>
    <div class="row"><button class="btn small" data-act="printSess" data-k="${s.n}">🖨 Print this session</button><button class="btn small" data-act="printAll">🖨 All sessions</button></div>
    <h3>The Dark Lord desk</h3>
    <div class="row"><label>Day</label><input class="txt" style="flex:1" value="${esc(C.day)}" data-edit="camp" data-f="day"></div>
    <div class="row"><label>Weather</label><input class="txt" style="flex:1" value="${esc(C.weather)}" data-edit="camp" data-f="weather"></div>
    <h4>Clocks</h4>
    ${CLOCKS.map(c => `<div class="clkrow"><span class="grow" title="${esc(c.full)}">${esc(c.label)}</span><button class="btn small" data-act="clock" data-k="${c.id}" data-id="-1">−</button><span class="clock">${Array.from({ length:c.max }, (_, i) => `<i class="${i < (C.clocks[c.id] || 0) ? 'on' : ''}"></i>`).join('')}</span><button class="btn small" data-act="clock" data-k="${c.id}" data-id="1">+</button></div>`).join('')}
    <div class="muted">Patience full: he arrives. Bloom fills a quarter: his Gaze +1. Riot full: the square burns. Salt runs out: the unburied dead rise Seeded.</div>
    <h4>Roll the night</h4>
    <div class="row">${['omen', 'road', 'dinner', 'rumor', 'stain'].map(k => `<button class="btn small" data-act="night" data-k="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
    ${C.lastNight ? `<div class="look">${esc(C.lastNight)}</div><div class="row"><button class="btn small" data-act="shareNight">Show the table</button></div>` : ''}
    <h4>Counsel</h4><div class="look">${esc(C.counsel || 'Draw a card.')}</div><div class="row"><button class="btn small" data-act="night" data-k="counsel">Draw another</button></div>
    <h4>The fortune</h4><div class="muted">Write down what the cards said, so it is never lost.</div>
    ${FORTUNE.map(f => `<div class="row"><label style="width:120px">${esc(f.label)}</label><input class="txt" style="flex:1" value="${esc(C.fortune[f.id] || '')}" data-edit="fortune" data-k="${f.id}"></div>`).join('')}
    <h4>Places</h4><div class="placegrid">${PLACES.map(p => `<label>${esc(p.name)}<select class="txt" data-edit="place" data-k="${p.id}">${PLACE_STATES.map(st => opt(st, st, (C.places[p.id] || 'quiet') === st)).join('')}</select></label>`).join('')}</div>
    <h4>How the Bloom hunts</h4><div class="trait">${CAMPAIGN.seeded}</div><div class="trait">${CAMPAIGN.salt}</div>
    <div class="trait"><b>Tell before initiative.</b> Sweet rot. A cough that is not a cough. Flies that will not land. The Count's wolves will not enter the square.</div>
    <h4>Faces</h4>
    ${CAST.map(c => `<details class="card"><summary><b>${esc(c.name)}</b> <span class="muted">${esc(c.look)}</span></summary>
      <div class="trait"><b>Want</b> ${esc(c.want)}</div><div class="trait"><b>Fear</b> ${esc(c.fear)}</div><div class="trait"><b>Lever</b> ${esc(c.lever)}</div><div class="muted">${esc(c.line)} — ${esc(c.die)}</div></details>`).join('')}
    <h4>Pillars</h4>${CAMPAIGN.pillars.map(p => `<div class="trait">• ${esc(p)}</div>`).join('')}`;
  return h;
}

export function renderPanel(){
  if (!state) return;
  $('#panel').classList.toggle('closed', !ui.panelOpen);
  const body = $('#tabBody'), scroll = renderPanel.last === ui.tab ? body.scrollTop : 0; renderPanel.last = ui.tab;
  const tabs = { story:storyTab, valley:valleyTab, tokens:tokensTab, bestiary:bestiaryTab, dungeon:dungeonTab, build:buildTab, gaze:gazeTab, table:tableTab, night:nightTab, hero:heroTab,
    map:playerMapTab,
    log:() => `<h3>What has happened</h3><div class="log" style="max-height:none">${logList()}</div>` };
  body.innerHTML = (tabs[ui.tab] || tokensTab)();
  body.scrollTop = scroll;
}
export { CONDITIONS, BEST };
