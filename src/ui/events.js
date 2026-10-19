/* UI EVENT WIRING — every [data-act] button, [data-edit] field, and keyboard shortcut. */
import { state, setState, ui, tokById, isDM, makePC, makeNPC } from '../engine/state.js';
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
import { whimRoll, whimStep } from '../game/whim.js';
import { changed, exportDelve, importDelve, loadLocal, loadState, deserialize, saveSoon, undo, download, snapshot } from '../game/session.js';
import { hostTable, closeTable, joinTable, sendHost, broadcast, pushState } from '../net/table.js';
import { newDelve, importMap, setAutoLink, removeRoom, populate, clearMonsters, addFloorBelow, removeBottomFloor, randomSeed } from '../game/build.js';
import { populateFloor } from '../engine/generator.js';
import { setGfx, gfx } from '../render/gfx.js';
import { openCreator, sheetHTML } from './creator.js';
import { PROPS } from '../data/props.js';
import { valleyMapHTML } from './valley.js';
import { valley, travel, arrive, enterPlace, readEvent, springEvent, doneEvent, newRoadEvent, goToEvent } from '../game/overworld.js';
import { myHeroes, saveMyHero, deleteMyHero, myHero, applyCharacter, placeCharacter, removeCharacter, myProfile, saveProfile, playerKey, unlockCharacter, setCharacterOwner } from '../game/heroes.js';
import { putModel, deleteModel } from '../render/models.js';
import { buildSessionDelve, placeSessionEncounter, readAloud, tickClock, applyTicks, rollNight, shareNight, setSessionGaze, markBeat, printSessions, sessionById, SESSIONS } from '../game/campaign.js';

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
    case 'cast': if (sel){ const sp = sel.casts[+el.dataset.i]; setMode('cast', { caster:sel.id, i:+el.dataset.i }, `${sel.name}: ${sp.n} — tap ${sp.k === 'heal' ? 'who to heal' : sp.rad ? 'the creature at the centre' : 'the target'}`); } break;
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
    case 'shiftNow': shiftFloor(ui.floor, 'Barovia rearranges itself'); break;
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
    // the Whim Die (kept in state.grasp)
    case 'whimRoll': whimRoll(ui.floor); break;
    case 'whimStep': whimStep(+k, 'the DM'); renderPanel(); renderTop(); renderDock(); break;
    case 'whimAuto': state.grasp.auto = !state.grasp.auto; changed(); break;
    case 'setDread': setDread(+k); break;
    case 'saveShift': case 'saveWhim': {
      const box = a === 'saveShift' ? '#shiftText' : '#whimText', key = a === 'saveShift' ? 'shift' : 'grasp', txt = $(box).value.trim();
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
    // graphics, sound, models
    case 'gfxQ': setGfx({ quality:k }); renderPanel(); break;
    case 'gfxT': setGfx({ [k]:!gfx[k] }); renderPanel(); break;
    case 'clearModel': deleteModel(k).then(() => { broadcast({ t:'model', key:k, buf:null }); renderPanel(); }); break;
    // story tab
    case 'session': state.campaign.session = +k; if (ui.tab === 'valley') ui.tab = 'story'; renderTabs(); changed(); renderPanel(); $('#tabBody').scrollTop = 0; break;
    // the valley (overworld)
    case 'valleySel': ui.valleySel = k; renderPanel(); if (!$('#valleyModal').classList.contains('hidden')) $('#valleyBox').innerHTML = valleyMapHTML(); break;
    case 'valleyMap': $('#valleyBox').innerHTML = valleyMapHTML(); $('#valleyModal').classList.remove('hidden'); break;
    case 'valleyMapClose': $('#valleyModal').classList.add('hidden'); break;
    case 'valleyGo': ui.valleySel = k; ui.tab = 'valley'; renderTabs(); renderPanel(); $('#tabBody').scrollTop = 0; break;
    case 'valleyTravel': $('#valleyModal').classList.add('hidden'); if (!valley().journey || confirm('The party is already on a road. Set out somewhere else from where they started?')) travel(k); break;
    case 'valleyArrive': arrive(); break;
    case 'goFloor': goFloor(+k); renderPanel(); break;
    case 'valleyEnter': if (confirm('Build this place\'s map? It replaces the current one (the party, their characters and the campaign come along).')) enterPlace(k, id); break;
    case 'evRead': readEvent(+k, +id); break;
    case 'evSpring': springEvent(+k, +id); renderPanel(); break;
    case 'evGo': goToEvent(+k, +id); break;
    case 'evDone': doneEvent(+k, +id); renderPanel(); break;
    case 'roadNew': newRoadEvent(ui.floor); break;
    case 'sessGaze': setSessionGaze(+k); break;
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
      newDelve({ seed, floors:+$('#newFloors').value, size:40, template:$('#newTemplate').value, party:$('#newDemoParty').checked, name:(TEMPLATES.find(t => t.id === $('#newTemplate').value) || {}).id === 'andral' ? 'Beneath Saint Andral\'s' : (TEMPLATES.find(t => t.id === $('#newTemplate').value)?.name || 'Dread Delve') }, !!state);
      toast(`Seed "${seed}" — same seed, same dungeon.`); } break;
    case 'continue': { const s = loadLocal(); if (s) loadState(deserialize(s)); } break;
    case 'join': {
      const code = $('#joinCode').value.trim(), hero = myHero($('#joinHero').value), who = signIn();
      if (!who) return;
      if (!code){ toast('Enter the table code from your DM.'); return; }
      ui.myHeroId = hero?.id || null; joinTable(code, who.name, who.key, hero); } break;
    // heroes
    case 'newHero': openCreator(null, { onSave:h => { if (!h.player) h.player = myProfile().name || $('#pName').value.trim(); saveMyHero(h); renderHeroList(); toast(`${h.name} is ready.`); } }); break;
    case 'newHeroAtTable': openCreator(null, { saveLabel:'Bring to the table', onSave:h => { if (!h.player) h.player = ui.myName; saveMyHero(h); ui.myHeroId = h.id; sendHost({ t:'char', char:h }); toast(`${h.name} sent to the DM.`); renderPanel(); } }); break;
    case 'editHero': { const h = myHero(id); if (h) openCreator(h, { title:`${h.name}`, onSave:h2 => { saveMyHero(h2); renderHeroList(); if (ui.role === 'player'){ sendHost({ t:'char', char:h2 }); toast('Sent to the DM.'); renderPanel(); } } }); } break;
    case 'delHero': if (confirm('Delete this hero from this browser?')){ deleteMyHero(id); renderHeroList(); } break;
    case 'exportHero': { const h = myHero(id); if (h) download(`${h.name.replace(/[^\w]+/g, '-').toLowerCase()}.json`, JSON.stringify(h, null, 1)); } break;
    case 'dmNewChar': openCreator(null, { title:'New character (DM)', saveLabel:'Add to the party', onSave:h => { applyCharacter(h, { owner:'DM' }); renderPanel(); } }); break;
    case 'dmSheet': { const h = state.characters[id]; if (h) openCreator(h, { title:`${h.name}'s sheet`, saveLabel:'Save sheet', onSave:h2 => { applyCharacter(h2, { owner:h.owner }); renderPanel(); } }); } break;
    case 'placeChar': placeCharacter(id); break;
    case 'unlockChar': if (confirm('Clear this character\'s secret word? The next player to sign in with the owner\'s name gets it.')){ unlockCharacter(id); toast('Unlocked.'); renderPanel(); } break;
    case 'pickChar': sendHost({ t:'pick', id }); ui.myHeroId = id; renderPanel(); break;
    case 'removeChar': if (confirm('Forget this character sheet? (Its token stays on the map.)')){ removeCharacter(id); renderPanel(); } break;
    case 'propCat': ui.propCat = k; ui.propKind = Object.keys(PROPS).find(p => PROPS[p].cat === k); renderPanel(); break;
    case 'propKind': ui.propKind = k; renderPanel(); break;
    case 'closeHelp': $('#helpModal').classList.add('hidden'); break;
    case 'help': $('#helpModal').classList.remove('hidden'); break;
    // the threshold (start page)
    case 'thRole': showRole(k); break;
    case 'pickTpl': pickTemplate(k); break;
    case 'beginS0': {
      if (loadLocal() && !confirm('Begin a new campaign at Session Zero? The delve saved on this device will be replaced — Export it first if you want to keep it.')) return;
      setState(null);   // a new campaign: nothing carries over
      newDelve({ name:'Session Zero — Salt for the Lantern & Ladle', seed:'flood-s0-saltroad', floors:3, size:40, template:'saltroad', party:$('#newDemoParty').checked }, false);
      state.campaign.session = 0; ui.tab = 'story'; ui.panelOpen = true; renderAll(); changed();
      toast('Session Zero is on the table. The Story tab has the beats.'); } break;
  }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-edit]'); if (!el) return;
  const kind = el.dataset.edit, t = el.dataset.id && tokById(el.dataset.id), sel = ui.selected && tokById(ui.selected);
  if (kind === 'tok' && t){ const fld = el.dataset.f; t[fld] = el.type === 'number' ? (+el.value || 0) : el.value; if (fld === 'maxHp') t.hp = Math.min(t.hp, t.maxHp); if (t.hp > 0 && t.dead && t.kind !== 'monster') t.dead = false; changed(); }
  else if (kind === 'charOwner'){ setCharacterOwner(el.dataset.id, el.value); renderPanel(); }
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
  else if (kind === 'model' && el.files[0]){
    const file = el.files[0], key = el.dataset.k;
    file.arrayBuffer().then(buf => putModel(key, buf, file.name).then(() => { broadcast({ t:'model', key, name:file.name, buf }); toast(`${file.name} loaded.`); renderPanel(); }))
      .catch(err => toast('Could not read that model: ' + (err?.message || err)));
  }
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
  if (e.target.dataset?.edit === 'gfxVol') setGfx({ volume:+e.target.value });
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
$('#whimBadge').onclick = () => { if (state && isDM()){ ui.tab = 'gaze'; ui.panelOpen = true; renderTabs(); renderPanel(); renderDock(); } };
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
  else if (e.key.toLowerCase() === 'w' && dm) whimRoll(ui.floor);
  else if (e.key.toLowerCase() === 'b' && dm){ ui.tab = ui.tab === 'build' ? 'tokens' : 'build'; ui.panelOpen = true; if (ui.tab !== 'build') setMode('select'); renderTabs(); renderPanel(); renderDock(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && dm && ui.selected) removeToken(ui.selected);
});

export function renderHeroList(){
  const list = myHeroes();
  $('#heroList').innerHTML = list.map(h => `<div class="th-hero">
      <div class="pt" style="background:radial-gradient(circle at 50% 40%,${h.color}66,#120b10 75%)">${h.portrait ? `<img src="${h.portrait}" alt="">` : esc((h.name || '?')[0])}</div>
      <div class="nm">${esc(h.name || 'Unnamed')}</div><div class="meta">${esc(h.sp)} ${esc(h.cls)} ${h.lvl}</div>
      <div class="acts"><button class="btn small" data-act="editHero" data-id="${h.id}">Edit</button><button class="btn small" data-act="exportHero" data-id="${h.id}" title="Download">⬇</button><button class="btn small danger" data-act="delHero" data-id="${h.id}" title="Delete">✕</button></div></div>`).join('')
    + `<button class="th-hero new" data-act="newHero"><b>+</b><span>Create a character</span></button>`;
  $('#joinHero').innerHTML = list.map(h => `<option value="${h.id}">${esc(h.name)} — ${esc(h.cls)} ${h.lvl}</option>`).join('') + `<option value="">★ My characters at the DM's table${list.length ? '' : ' (or none yet)'}</option>`;
}
// The player's name + secret word. The word itself is never stored: only a key made from it.
function signIn(){
  const name = $('#pName').value.trim(), word = $('#pWord').value, prof = myProfile();
  if (!name){ toast('Type your name first (top of the player section).'); $('#pName').focus(); return null; }
  let key;
  if (word) key = playerKey(name, word);
  else if (prof.key && prof.name.toLowerCase() === name.toLowerCase()) key = prof.key;
  else { toast('Pick a secret word — you\'ll use it to get your characters back on another device.'); $('#pWord').focus(); return null; }
  saveProfile({ name, key });
  return { name, key };
}
function renderProfile(){
  const p = myProfile();
  $('#pName').value = p.name || '';
  $('#pWord').value = '';
  $('#pWordHint').textContent = p.key ? '(remembered on this device)' : '';
}
/* ---------- the threshold: the start page ---------- */
const VOICE = {
  '': ['Our champion. Our prisoner. Our favourite toy.', 'We have built you a board, Strahd, and little lights to move across it.',
       'Set your guests upon it. Thin the mist. Count their heartbeats.', 'Let them believe they came of their own free will.', 'They always do.'],
  dm: ['The valley is yours. It has always been yours.', 'Be generous. Hunger is a better leash than fangs.', 'Invite them to dinner before you invite them to die.'],
  player: ['You have been invited.', 'The road behind you is a courtesy. It can be withdrawn.', 'Come in. Wipe your feet. Mind the salt.'],
};
const TPL_GLYPH = { saltroad:'🧂', andral:'✝', castle:'♜', outbreak:'☣', labyrinth:'✋', deathhouse:'🏚', barovia:'⛪', ironcoffin:'☄', bonegrinder:'⚙', standral:'🕯', blank:'▦' };
let voiceTimer = null, voiceI = 0, role = '';
function cycleVoice(){
  const el = $('#thVoice'); if (!el || $('#startModal').classList.contains('hidden')) return;
  const lines = VOICE[role] || VOICE[''];
  el.classList.add('fade');
  setTimeout(() => { voiceI = (voiceI + 1) % lines.length; el.textContent = lines[voiceI]; el.classList.remove('fade'); }, 1200);
}
function showRole(r){
  role = r || ''; voiceI = -1; cycleVoice();
  $('#thDoors').classList.toggle('hidden', !!role); $('#thDoors').style.display = role ? 'none' : '';
  $('#thDM').classList.toggle('hidden', role !== 'dm'); $('#thPlayer').classList.toggle('hidden', role !== 'player');
  try { localStorage.setItem('dreaddelve.role', role); } catch {}
  $('#startModal').scrollTop = 0;
}
function pickTemplate(id){
  const tp = TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
  $('#newTemplate').value = tp.id; $('#newBlurb').textContent = tp.blurb; $('#newFloors').value = String(tp.floors.length);
  document.querySelectorAll('.th-world').forEach(b => b.classList.toggle('on', b.dataset.k === tp.id));
}
function worldCard(t){
  const th = THEMES.find(x => x.id === t.floors[0]?.theme) || THEMES[0];
  return `<button class="th-world" data-act="pickTpl" data-k="${t.id}"><span class="art" style="background:radial-gradient(circle at 75% 30%,${th.trim}44,transparent 55%),linear-gradient(135deg,${th.wall},${th.floor} 60%,${th.mist})">${TPL_GLYPH[t.id] || '✦'}</span>
    <span class="nm">${esc(t.name)}</span><span class="meta">${t.floors.length} floor${t.floors.length === 1 ? '' : 's'}${t.campaign ? ' · campaign' : ''}</span></button>`;
}
export function showStart(){
  renderHeroList(); renderProfile();
  const s = loadLocal();
  $('#continueBox').innerHTML = s ? `<div class="th-continue"><div class="th-feature-art" aria-hidden="true" style="background:radial-gradient(circle at 50% 45%,#9cc23c44,transparent 60%),linear-gradient(#18261f,#0b100d)"><span>⏳</span></div>
    <div class="th-feature-body"><div class="th-tag" style="color:var(--seep)">Continue</div><h3>${esc(s.meta?.name || 'The delve')}</h3>
    <p>${(s.floors || []).length} floor${(s.floors || []).length === 1 ? '' : 's'} · Gaze ${s.dread || 1}${s.campaign ? ` · Session ${s.campaign.session ?? 0}` : ''} · ${Object.keys(s.characters || {}).length} character sheet${Object.keys(s.characters || {}).length === 1 ? '' : 's'}</p>
    <button class="btn primary" data-act="continue">Return to the table</button></div></div>` : '';
  $('#newSeed').value = randomSeed();
  $('#tplGrid').innerHTML = TEMPLATES.filter(t => t.id !== 'saltroad').map(worldCard).join('');
  pickTemplate('andral');
  $('#startModal').classList.remove('hidden');
  let last = ''; try { last = localStorage.getItem('dreaddelve.role') || ''; } catch {}
  showRole(last || (s && !myProfile().key ? 'dm' : !s && myProfile().key ? 'player' : ''));
  if (!voiceTimer) voiceTimer = setInterval(cycleVoice, 5600);
}
