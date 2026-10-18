/* UI EVENT WIRING — every [data-act] button, [data-edit] field, and keyboard shortcut. */
import { state, ui, tokById, isDM, makePC, makeNPC } from '../engine/state.js';
import { updateVision, freeTilesNear } from '../engine/grid.js';
import { roomById } from '../engine/generator.js';
import { floorToAscii, floorToJSON } from '../engine/importer.js';
import { parseTable } from '../engine/tables.js';
import { BEST, bestList, rebuildBestiary } from '../data/bestiary.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { TEMPLATES, THEMES } from '../data/themes.js';
import { $, esc, parseAttacks, clamp } from '../util/core.js';
import { focusTile, focusFloor } from '../render/scene.js';
import { buildAllFloors, buildFloor } from '../render/floors.js';
import { syncTokens } from '../render/minis.js';
import { clearReach, showReach } from '../render/effects.js';
import { toast, renderAll, renderTop, renderSel, renderDock, renderTabs } from './hud.js';
import { renderPanel } from './panels.js';
import { setMode } from './input.js';
import { select, takeStairs, goFloor, setView, setDread, rebuildFog, doorAction, search, disarmTrap, triggerTrap, selectedDoor, selectedTrap, nearestHero } from '../game/actions.js';
import { rollInitiative, nextTurn, endCombat, addToInit, applyDamage, heal, infest, useSpecial, removeToken, restoreTaken } from '../game/combat.js';
import { addCond, removeCond } from '../game/rules.js';
import { shiftFloor } from '../game/shift.js';
import { graspRoll, graspStep } from '../game/grasp.js';
import { changed, exportDelve, importDelve, loadLocal, loadState, deserialize, saveSoon, undo, download, snapshot } from '../game/session.js';
import { hostTable, closeTable, joinTable, sendHost, broadcast, pushState } from '../net/table.js';
import { newDelve, importMap, setAutoLink, removeRoom, populate, clearMonsters, addFloorBelow, removeBottomFloor, randomSeed } from '../game/build.js';
import { populateFloor } from '../engine/generator.js';
import { buildSessionDelve, placeSessionEncounter, readAloud, tickClock, applyTicks, rollNight, shareNight, setSessionDread, markBeat, printSessions, sessionById, SESSIONS } from '../game/campaign.js';

const actor = () => ui.role === 'player' ? tokById(ui.myToken) : (ui.selected && tokById(ui.selected));

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, k = el.dataset.k, id = el.dataset.id, sel = ui.selected && tokById(ui.selected);
  if (a.startsWith('mode:')){
    const m = a.slice(5);
    const hint = { ping:'Tap a spot to ping it for everyone' }[m] || '';
    setMode(ui.mode === m ? 'select' : m, null, hint); return;
  }
  switch (a){
    case 'tab': ui.tab = k; if (k !== 'build' && ['room', 'corridor', 'door', 'trap', 'stairs', 'erase'].includes(ui.mode)) setMode('select'); renderTabs(); renderPanel(); renderDock(); break;
    case 'cancelMode': setMode('select'); break;
    case 'sel': select(id); { const t = tokById(id); if (t) focusTile(t.floor, t.x, t.y); } break;
    case 'deselect': ui.selDoor = null; ui.selTrap = null; select(null); break;
    case 'focus': { const t = sel || tokById(ui.myToken); if (t) focusTile(t.floor, t.x, t.y); else focusFloor(); } break;
    case 'atkMode': ui.atkMode = { normal:'adv', adv:'dis', dis:'normal' }[ui.atkMode]; renderSel(); break;
    case 'atk': if (sel) setMode('attack', { attacker:sel.id, i:+el.dataset.i }, `${sel.name}: ${sel.attacks[+el.dataset.i].n}${ui.atkMode !== 'normal' ? ` (${ui.atkMode})` : ''} — tap the target`); break;
    case 'special': if (sel) useSpecial(sel, BEST[sel.bid].specials[+el.dataset.i]); break;
    case 'dmg': if (sel){ const n = +$('#hpAmt').value || 0; applyDamage(sel, n, 'manual'); changed(); } break;
    case 'heal': if (sel){ heal(sel, +$('#hpAmt').value || 0); changed(); } break;
    case 'rmCond': if (sel){ removeCond(sel, k); changed(); } break;
    case 'infest': if (sel) infest(sel); break;
    case 'restore': { const t = tokById(id); if (t) restoreTaken(t); } break;
    case 'joinInit': if (sel){ addToInit(sel); changed(); } break;
    case 'stairs': { const t = sel && (ui.role === 'dm' || sel.id === ui.myToken) ? sel : tokById(ui.myToken); if (t) takeStairs(t); } break;
    case 'search': { const t = ui.role === 'player' ? tokById(ui.myToken) : sel; if (t) search(t); } break;
    case 'remove': if (sel) removeToken(sel.id); break;
    case 'endMyTurn': if (ui.role === 'player') sendHost({ t:'endturn' }); else nextTurn(); break;
    case 'rollInit': rollInitiative(); break;
    case 'nextTurn': nextTurn(); break;
    case 'endCombat': endCombat(); break;
    case 'shiftNow': shiftFloor(ui.floor, 'The Dread Zone rearranges itself'); break;
    case 'shiftForced': { const n = clamp(+$('#shiftForce').value || 0, 1, 100); if (n) shiftFloor(ui.floor, 'The DM calls the shift', n); } break;
    // doors & traps
    case 'doorSet': { const dr = selectedDoor(); if (dr){ snapshot('door'); doorAction(null, ui.selDoor.floor, dr.id, 'set:' + k); } } break;
    case 'doorDo': { const dr = selectedDoor(); if (!dr) break; const f = state.floors[ui.selDoor.floor];
      const who = ui.role === 'player' ? tokById(ui.myToken) : nearestHero(ui.selDoor.floor, dr.i % f.W, (dr.i / f.W) | 0);
      doorAction(who, ui.selDoor.floor, dr.id, k); } break;
    case 'doorDel': { const dr = selectedDoor(); if (dr){ snapshot('remove door'); const f = state.floors[ui.selDoor.floor]; f.doors = f.doors.filter(d => d !== dr); ui.selDoor = null; buildFloor(ui.floor); updateVision(); changed(); } } break;
    case 'trapToggle': { const tr = selectedTrap(); if (tr){ tr[k] = !tr[k]; buildFloor(ui.selTrap.floor); changed(); } } break;
    case 'trapDisarm': { const tr = selectedTrap(); if (!tr) break; const f = state.floors[ui.selTrap.floor];
      const who = ui.role === 'player' ? tokById(ui.myToken) : nearestHero(ui.selTrap.floor, tr.i % f.W, (tr.i / f.W) | 0); disarmTrap(who, ui.selTrap.floor, tr.id); } break;
    case 'trapFire': { const tr = selectedTrap(); if (!tr) break; const f = state.floors[ui.selTrap.floor], x = tr.i % f.W, y = (tr.i / f.W) | 0;
      const victim = state.tokens.find(t => t.floor === ui.selTrap.floor && t.x === x && t.y === y && !t.dead) || { name:'Something', floor:ui.selTrap.floor, x, y, kind:'monster', flags:{} };
      triggerTrap(victim, tr); } break;
    case 'trapDel': { const tr = selectedTrap(); if (tr){ snapshot('remove trap'); const f = state.floors[ui.selTrap.floor]; f.traps = f.traps.filter(t => t !== tr); ui.selTrap = null; buildFloor(ui.floor); changed(); } } break;
    // grasp
    case 'graspRoll': graspRoll(ui.floor); break;
    case 'graspStep': graspStep(+k, 'the DM'); renderPanel(); renderTop(); renderDock(); break;
    case 'graspAuto': state.grasp.auto = !state.grasp.auto; changed(); break;
    case 'setDread': setDread(+k); break;
    case 'saveShift': case 'saveGrasp': {
      const box = a === 'saveShift' ? '#shiftText' : '#graspText', key = a === 'saveShift' ? 'shift' : 'grasp', txt = $(box).value.trim();
      if (!txt){ state.content[key] = null; toast('Back to the default table.'); }
      else { const p = parseTable(txt); if (!p.rows.length){ toast('No rows found — check the format.'); break; } state.content[key] = txt; toast(`Saved ${p.rows.length} rows${p.errors.length ? ` (${p.errors.length} lines skipped)` : ''}.`); }
      changed(); renderPanel(); } break;
    // panels
    case 'openPc': ui.openPc = ui.openPc === id ? null : id; renderPanel(); break;
    case 'openBest': ui.openBest = ui.openBest === k ? null : k; renderPanel(); break;
    case 'editBest': ui.editBest = ui.editBest === k ? null : k; renderPanel(); break;
    case 'saveBest': case 'cloneBest': {
      let obj; try { obj = JSON.parse($('#bestJson').value); } catch (err){ toast('That is not valid JSON: ' + err.message); break; }
      if (!obj.name || !obj.hp || !Array.isArray(obj.attacks)){ toast('A creature needs at least name, hp and attacks.'); break; }
      let nid = k;
      if (a === 'cloneBest'){ const base = String(obj.name).toLowerCase().replace(/[^a-z0-9]+/g, '') || 'creature'; nid = base; for (let n = 2; BEST[nid]; n++) nid = base + n; }
      delete obj.custom; obj.id = nid; obj.fam ||= 'dread'; obj.size ||= 1; obj.tags ||= []; obj.traits ||= [];
      state.content.bestiary[nid] = obj; rebuildBestiary(state.content.bestiary); ui.editBest = nid; ui.openBest = nid;
      toast(a === 'cloneBest' ? `${obj.name} added to the bestiary.` : `${obj.name} saved.`); syncTokens(); changed(); renderPanel(); } break;
    case 'resetBest': delete state.content.bestiary[k]; rebuildBestiary(state.content.bestiary); if (!BEST[k]) ui.editBest = null; toast('Back to the original statblock.'); changed(); renderPanel(); break;
    case 'copyAllPrompts': {
      const txt = bestList().map(b => `${b.name}\n${b.prompt}`).join('\n\n') + '\n\n— Floors —\n' + state.floors.map(f => `${f.name}\n${THEMES[f.theme]?.prompt || ''}`).join('\n\n');
      navigator.clipboard?.writeText(txt).then(() => toast('Every prompt copied.'), () => download('dread-delve-prompts.txt', txt, 'text/plain')); } break;
    case 'bestFilter': ui.bestFilter = k; renderPanel(); break;
    case 'place': setMode('place', { bid:k }, `Placing ${BEST[k].name} — tap tiles, Done when finished`); if (innerWidth < 760){ ui.panelOpen = false; renderPanel(); renderDock(); } break;
    case 'placeTok': setMode('placeTok', { id }, 'Tap where they should stand'); break;
    case 'removeTok': if (confirm('Remove this token?')) removeToken(id); break;
    case 'addPc': case 'addNpc': {
      const name = $('#newName').value.trim() || (a === 'addPc' ? 'New Hero' : 'Ally');
      const t = a === 'addPc' ? makePC({ name, color:'#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') }) : makeNPC(name);
      const f = state.floors[ui.floor], spot = freeTilesNear(ui.floor, f.rooms[0].cx, f.rooms[0].cy, 1, true)[0] || { x:f.rooms[0].cx, y:f.rooms[0].cy };
      Object.assign(t, { floor:ui.floor, x:spot.x, y:spot.y }); state.tokens.push(t); ui.openPc = t.id; updateVision(); changed(); renderPanel(); } break;
    case 'clearDead': state.tokens.filter(t => t.kind === 'monster' && t.dead && t.floor === ui.floor).forEach(t => removeToken(t.id)); break;
    case 'clearArt': delete state.art[k]; syncTokens(); renderPanel(); saveSoon(); broadcast({ t:'art', art:state.art }); break;
    case 'copy': { const ta = $('#' + k); navigator.clipboard?.writeText(ta.value).then(() => toast('Prompt copied.'), () => { ta.select(); toast('Select-all done — copy it.'); }); } break;
    case 'toggle': ui[k] = !ui[k]; if (k === 'previewFog' || k === 'roomLabels') buildAllFloors(); if (k === 'freeMove' && sel) showReach(sel); renderPanel(); break;
    case 'reveal': { const f = state.floors[ui.floor]; f.grid.forEach((v, i) => { if (v > 0) state.explored[ui.floor].add(i); }); rebuildFog(ui.floor); changed(); toast('Floor revealed to players.'); } break;
    case 'refog': state.explored[ui.floor] = new Set(); updateVision(); rebuildFog(ui.floor); changed(); toast('Fog rolls back in.'); break;
    case 'paintMode': ui.paintType = $('#paintType').value; setMode(ui.mode === 'paint' ? 'select' : 'paint', { type:ui.paintType }, `Tap a room to make it a ${ROOM_TYPES[ui.paintType].label}`); break;
    case 'goRoom': { const r = roomById(state.floors[ui.floor], +id); if (r){ ui.selRoom = r.id; focusTile(ui.floor, r.cx, r.cy); buildFloor(ui.floor); renderPanel(); } } break;
    // story tab
    case 'session': state.campaign.session = +k; changed(); renderPanel(); $('#tabBody').scrollTop = 0; break;
    case 'sessDread': setSessionDread(+k); break;
    case 'readOpen': { const se = sessionById(k); readAloud(se.title, se.open); } break;
    case 'readEnd': { const se = sessionById(k); readAloud(`End of session ${se.n}`, se.ending); } break;
    case 'sessDelve': if (confirm('Build this dungeon? It replaces the current one (the party, their characters and the campaign desk come along).')) buildSessionDelve(+k, +id); break;
    case 'sessEnc': placeSessionEncounter(+k, +id); break;
    case 'sessTicks': applyTicks(+k); break;
    case 'clock': tickClock(k, +id); renderPanel(); break;
    case 'night': rollNight(k); break;
    case 'shareNight': shareNight(); break;
    case 'printSess': printSessions([sessionById(k)]); break;
    case 'printAll': printSessions(SESSIONS); break;
    // build tab
    case 'undo': undo(); renderDock(); break;
    case 'doorKind': ui.doorState = k; renderPanel(); break;
    case 'trapKindSel': ui.trapKind = k; renderPanel(); break;
    case 'stairsDir': ui.stairsDir = k; renderPanel(); break;
    case 'autoLink': setAutoLink(ui.floor, !state.floors[ui.floor].autoLink); break;
    case 'delRoom': if (confirm('Delete this room?')) removeRoom(ui.floor, +id); break;
    case 'populateRoom': { snapshot('populate room'); const f = state.floors[ui.floor], r = roomById(f, +id);
      const saved = f.rooms; f.rooms = [r]; const placed = populateFloor(f, ui.floor, Math.random, false); f.rooms = saved;
      if (!placed.length){ const again = (() => { f.rooms = [{ ...r, type:'lair' }]; const p = populateFloor(f, ui.floor, Math.random, false); f.rooms = saved; return p; })(); toast(again.length ? `${again.length} creatures placed.` : 'Nothing fits there.'); }
      else toast(`${placed.length} creatures placed in ${r.name}.`);
      syncTokens(); changed(); } break;
    case 'populate': populate(ui.floor); break;
    case 'clearMonsters': if (confirm('Remove every monster on this floor?')) clearMonsters(ui.floor); break;
    case 'addFloor': { const f = addFloorBelow($('#newFloorTheme').value); goFloor(f.level); } break;
    case 'removeFloor': if (confirm(`Remove ${state.floors[state.floors.length - 1].name} and its monsters?`)) removeBottomFloor(); break;
    case 'importFloor': case 'importDelve': {
      const txt = $('#importText').value; if (!txt.trim()){ toast('Paste a map or choose a file first.'); break; }
      if (a === 'importDelve' && !confirm('Start a new delve from this map? (Export first if you want to keep the current one.)')) break;
      importMap(txt, a === 'importFloor' ? 'floor' : 'delve'); } break;
    case 'copyAscii': { const txt = floorToAscii(state.floors[ui.floor]); navigator.clipboard?.writeText(txt).then(() => toast('Floor copied as ASCII.'), () => { $('#importText').value = txt; toast('Put in the import box — copy it from there.'); }); } break;
    case 'downloadFloor': download(`${state.floors[ui.floor].name.replace(/[^\w]+/g, '-').toLowerCase()}.json`, JSON.stringify(floorToJSON(state.floors[ui.floor]), null, 1)); break;
    case 'regen': if (confirm('Generate a new delve? This replaces the current one (export first if you want to keep it).')){
      newDelve({ name:$('#ndName').value || 'Dread Delve', seed:$('#ndSeed').value || randomSeed(), floors:+$('#ndFloors').value, size:+$('#ndSize').value, template:$('#ndTemplate').value }); } break;
    // table
    case 'host': hostTable(); break;
    case 'unhost': closeTable(); break;
    case 'tableView': { ui.tableView = !ui.tableView; clearReach(); if (ui.mode !== 'select') setMode('select'); buildAllFloors(); updateVision(); syncTokens(); renderAll();
      const pc = state.tokens.find(t => t.kind === 'pc' && t.floor === ui.floor) || state.tokens.find(t => t.kind === 'pc'); if (pc){ goFloor(pc.floor, false); focusTile(pc.floor, pc.x, pc.y); } } break;
    case 'export': exportDelve(); break;
    case 'startScreen': showStart(); break;
    case 'startNew': {
      const seed = $('#newSeed').value.trim() || randomSeed();
      newDelve({ seed, floors:+$('#newFloors').value, size:40, template:$('#newTemplate').value, name:(TEMPLATES.find(t => t.id === $('#newTemplate').value) || {}).id === 'andral' ? 'Beneath Saint Andral\'s' : (TEMPLATES.find(t => t.id === $('#newTemplate').value)?.name || 'Dread Delve') }, !!state);
      toast(`Seed "${seed}" — same seed, same dungeon.`); } break;
    case 'continue': { const s = loadLocal(); if (s) loadState(deserialize(s)); } break;
    case 'join': { const code = $('#joinCode').value.trim(), name = $('#joinName').value.trim(); if (!code || !name){ toast('Enter the code and your name.'); return; } joinTable(code, name); } break;
    case 'closeHelp': $('#helpModal').classList.add('hidden'); break;
  }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-edit]'); if (!el) return;
  const kind = el.dataset.edit, t = el.dataset.id && tokById(el.dataset.id), sel = ui.selected && tokById(ui.selected);
  if (kind === 'tok' && t){ const fld = el.dataset.f; t[fld] = el.type === 'number' ? (+el.value || 0) : el.value; if (fld === 'maxHp') t.hp = Math.min(t.hp, t.maxHp); if (t.hp > 0 && t.dead && t.kind !== 'monster') t.dead = false; changed(); }
  else if (kind === 'atk' && t){ t.attacks = parseAttacks(el.value); changed(); }
  else if (kind === 'room'){ const r = roomById(state.floors[ui.floor], +el.dataset.id); if (!r) return; r[el.dataset.f] = el.value; if (el.dataset.f !== 'notes') buildFloor(ui.floor); renderPanel(); changed(); }
  else if (kind === 'floorName'){ state.floors[ui.floor].name = el.value; renderTop(); changed(); }
  else if (kind === 'floorTheme'){ state.floors[ui.floor].theme = +el.value; buildFloor(ui.floor); renderPanel(); changed(); }
  else if (kind === 'seat'){ if (el.value) state.seats[el.dataset.k] = el.value; else delete state.seats[el.dataset.k]; renderPanel(); pushState(); }
  else if (kind === 'import' && el.files[0]) importDelve(el.files[0]);
  else if (kind === 'importMap' && el.files[0]){ const r = new FileReader(); r.onload = () => { $('#importText').value = r.result; toast('File loaded — choose how to import it.'); }; r.readAsText(el.files[0]); }
  else if (kind === 'art' && el.files[0]) loadArt(el.dataset.k, el.files[0]);
  else if (kind === 'addCond' && sel && el.value){ addCond(sel, el.value, -1); changed(); }
  else if (kind === 'doorDc'){ const dr = selectedDoor(); if (dr){ dr.dc = +el.value || 15; changed(); } }
  else if (kind === 'trapKind'){ const tr = selectedTrap(); if (tr){ tr.kind = el.value; buildFloor(ui.selTrap.floor); changed(); } }
  else if (kind === 'beat'){ markBeat(+el.dataset.k, el.dataset.id, el.checked); }
  else if (kind === 'sessNotes'){ state.campaign.notes[el.dataset.k] = el.value; changed(); }
  else if (kind === 'camp'){ state.campaign[el.dataset.f] = el.value; changed(); }
  else if (kind === 'fortune'){ state.campaign.fortune[el.dataset.k] = el.value; changed(); }
  else if (kind === 'place'){ state.campaign.places[el.dataset.k] = el.value; changed(); }
  else if (kind === 'dreadName' || kind === 'dreadText'){
    const n = +el.dataset.k; state.content.dread ||= {}; state.content.dread[n] ||= {};
    state.content.dread[n][kind === 'dreadName' ? 'n' : 'text'] = el.value.trim();
    renderTop(); changed();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'dread') setDread(+e.target.value);
  if (e.target.id === 'bestSearch'){ ui.bestSearch = e.target.value; const pos = e.target.selectionStart; renderPanel(); const s = $('#bestSearch'); s.focus(); s.setSelectionRange(pos, pos); }
  if (e.target.id === 'ndTemplate' || e.target.id === 'newTemplate'){ const tp = TEMPLATES.find(t => t.id === e.target.value); const b = $(e.target.id === 'ndTemplate' ? '#ndBlurb' : '#newBlurb'); if (b && tp) b.textContent = tp.blurb;
    const fl = $(e.target.id === 'ndTemplate' ? '#ndFloors' : '#newFloors'); if (fl && tp) fl.value = String(tp.floors.length); }
});
function loadArt(key, file){
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 384, s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    state.art[key] = file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .86);
    URL.revokeObjectURL(url); syncTokens(); renderPanel(); saveSoon(); broadcast({ t:'art', art:state.art }); toast('Art set.');
  };
  img.src = url;
}
$('#btnPanel').onclick = () => { ui.panelOpen = !ui.panelOpen; renderPanel(); renderDock(); };
$('#btnHelp').onclick = () => $('#helpModal').classList.remove('hidden');
$('#floorUp').onclick = () => state && goFloor(ui.floor - 1);
$('#floorDown').onclick = () => state && goFloor(ui.floor + 1);
$('#graspBadge').onclick = () => { if (state && isDM()){ ui.tab = 'dread'; ui.panelOpen = true; renderTabs(); renderPanel(); renderDock(); } };
document.querySelectorAll('#viewSeg button').forEach(b => b.onclick = () => state && setView(b.dataset.view));
addEventListener('keydown', e => {
  if (!state || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  const dm = ui.role === 'dm';
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && dm){ e.preventDefault(); undo(); renderDock(); return; }
  if (e.key === 'Escape'){ setMode('select'); ui.selDoor = null; ui.selTrap = null; select(null); }
  else if (e.key === 'PageUp') goFloor(ui.floor - 1);
  else if (e.key === 'PageDown') goFloor(ui.floor + 1);
  else if (e.key === '1') setView('tilt'); else if (e.key === '2') setView('top'); else if (e.key === '3') setView('stack');
  else if (e.key.toLowerCase() === 'f'){ const t = ui.selected && tokById(ui.selected); if (t) focusTile(t.floor, t.x, t.y); }
  else if (e.key.toLowerCase() === 'n' && dm) nextTurn();
  else if (e.key.toLowerCase() === 'g' && dm) graspRoll(ui.floor);
  else if (e.key.toLowerCase() === 'b' && dm){ ui.tab = ui.tab === 'build' ? 'tokens' : 'build'; ui.panelOpen = true; if (ui.tab !== 'build') setMode('select'); renderTabs(); renderPanel(); renderDock(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && dm && ui.selected) removeToken(ui.selected);
});

export function showStart(){
  const s = loadLocal();
  $('#continueBox').innerHTML = s ? `<h2>Continue</h2><div class="row"><button class="btn primary" data-act="continue">Return to “${esc(s.meta?.name || 'the delve')}” · seed ${esc(s.meta?.seed)}</button></div>` : '';
  $('#newSeed').value = randomSeed();
  $('#newTemplate').innerHTML = TEMPLATES.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  $('#newBlurb').textContent = TEMPLATES[0].blurb;
  $('#startModal').classList.remove('hidden');
}
