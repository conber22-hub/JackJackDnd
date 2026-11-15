/* 🕹 THE HANDHELD AT THE TABLE: a player's phone is the pocket console too, the standard way to play a seated hero.
   The world in the shell's screen (ui/handheld.js), the camera following the hero (ui/followcam.js), and the buttons
   doing what the player's phone already could, through the same requests to the DM (the DM's app still decides,
   rolls and broadcasts, so nothing new crosses the table):
     · D-pad: a step a press (requestMove; held, it keeps walking as the DM moves the hero), up is away from the camera
     · A: strike the target (the first attack that reaches it); out of a fight, the stairs the hero stands on, a door
       beside the hero opens or shuts, or a card on the screen is put away
     · B: end the turn in a fight; else back, or put a card away
     · X: spells (the card-only path: who to aim at, which slot); Y: actions (Dash, Disengage, Dodge, Stand up,
       a chosen attack, features, Search)
     · L / R: the next target in a fight; else turn the camera. View: the next camera view
     · Select: the hero's sheet (the Hero tab, over everything, with notes, letters and the rest); Start: the menu
     · taps on the screen: a foe to aim at (again to strike), the hero for A, the ground to walk there; doors and
       objects as before
   It holds the handheld whenever this phone is seated with a hero (not the TV, not card only, not in the Lantern
   Yard), and the device wants it: on a touch screen with no controller, unless the menu's "The classic screen" is
   chosen (kept per device). A controller plugged in plays it too. */
import { state, ui, tokById } from '../engine/state.js';
import { esc } from '../util/core.js';
import { readPad, padIntents, keyIntent } from '../engine/pad.js';
import { rangeCheck, coverOf } from '../engine/targeting.js';
import { tokGap } from '../engine/movement.js';
import { requestAct } from '../game/requests.js';
import { requestMove, doorAction, onStairs, takeStairs, search } from '../game/actions.js';
import { exitLabel } from '../engine/generator.js';
import { currentTurn, moveAllowance } from '../game/rules.js';
import { canCast } from '../game/resources.js';
import { askD20 } from '../game/night.js';
import { sendHost } from '../net/table.js';
import { cardAct } from './cards.js';
import { toast } from './hud.js';
import { hh, hhHost, hhPad, addHost, setHandheld, skipBoot } from './handheld.js';
import { SHELLS } from '../engine/wander-cam.js';
import { camTurn, camView, camCrane, camYaw, camFrame, camStart, miniFocus, lookThrough, closeLook, feelHits } from './followcam.js';
import { tokenViews } from '../render/minis.js';

const $ = s => document.querySelector(s);
const me = () => tokById(ui.myToken);
const fight = () => !!state?.combat?.active;
const myTurn = () => fight() && currentTurn()?.id === ui.myToken;
const modalUp = () => [...document.querySelectorAll('.modal:not(.hidden)')].length > 0;
const yardUp = () => !!document.querySelector('#yardModal:not(.hidden)');
const tableActive = () => ui.role === 'player' && !ui.screen && !ui.cardOnly && !!state && !!me() && !yardUp();
const on = () => hhHost() === 'table';
const rt = { target:null, look:null, sentAt:0, sentFrom:null };
const menu = { open:false, page:'main', i:0 };

/* ---------- who to aim at ---------- */
// Foes the hero can see on this floor, nearest first.
const foes = () => { const t = me(); if (!t) return [];
  return state.tokens.filter(o => o.kind === 'monster' && o.floor === t.floor && !o.dead && !o.flags?.gone && tokenViews.get(o.id)?.group?.visible !== false)
    .sort((a, b) => tokGap(t, a) - tokGap(t, b)); };
function target(){ const l = foes(); let tg = rt.target && l.find(o => o.id === rt.target); if (!tg){ tg = l[0] || null; rt.target = tg?.id || null; } return tg; }
function aim(dir = 1){ const l = foes(); if (!l.length){ rt.target = null; return null; } const k = l.findIndex(o => o.id === rt.target); const n = l[((k < 0 ? -1 : k) + dir + l.length) % l.length]; rt.target = n.id; return n; }
// The attack that reaches the target (one with no slot to spend first), or -1
const attackFor = (t, tg) => !t || !tg ? -1 : t.attacks.findIndex(a => !a.l && rangeCheck(t, tg, a).ok && coverOf(t, tg).cover !== 'total');
// A door beside the hero: { L, id, open }
function doorNear(){ const t = me(); if (!t) return null; const f = state.floors[t.floor];
  const d = (f.doors || []).map(d => ({ d, x:d.i % f.W, y:(d.i / f.W) | 0 })).filter(o => Math.max(Math.abs(o.x - t.x), Math.abs(o.y - t.y)) <= 1)[0];
  return d ? { L:t.floor, id:d.d.id, open:d.d.state === 'open', locked:d.d.state === 'locked' } : null; }

/* ---------- doing ---------- */
function strike(tg = target()){
  const t = me(); if (!t) return;
  if (fight() && !myTurn()) return toast('Not your turn yet.');
  if (!tg) return toast('Nobody to strike.');
  const i = attackFor(t, tg); if (i < 0) return toast(`${tg.name} is out of reach: walk closer.`);
  rt.look = { id:tg.id, until:performance.now() + 1500 };
  const a = t.attacks[i], send = d20 => requestAct({ kind:'attack', id:t.id, i, target:tg.id, mode:ui.atkMode, ...(d20 ? { d20 } : {}) });
  if (state.realDice) askD20(`${t.name}: ${a.n} → ${tg.name}`, send); else send(null);
}
function step(dx, dy){
  if (skipBoot()) return;
  if (menu.open){ if (dy) menu.i = Math.max(0, Math.min(menuItems().length - 1, menu.i + dy)); renderHud(); return; }
  if (modalUp()) return;
  const t = me(), now = performance.now(); if (!t) return;
  // one step at a time: the next once the DM has moved the hero (or it's clearly not coming)
  if (rt.sentFrom && t.x === rt.sentFrom.x && t.y === rt.sentFrom.y && now - rt.sentAt < 900) return;
  rt.sentFrom = { x:t.x, y:t.y }; rt.sentAt = now;
  requestMove(t, t.x + dx, t.y + dy);
}
function putCardAway(){ const c = document.querySelector('#cardLayer .pop:last-child'); if (!c) return false; c.click(); if (c.isConnected) c.remove(); return true; }
function press(b){
  if (!b || skipBoot()) return;
  if (b === 'rs'){ camView(); return; }
  if (b === 'turnl' || b === 'turnr'){ camTurn(b === 'turnl' ? 1 : -1); return; }
  if (b === 'in' || b === 'out'){ camCrane(b === 'in' ? -1 : 1); return; }
  if (sheetOpen()){ if (b === 'b' || b === 'back' || b === 'ls' || b === 'start') closeSheet(); return; }
  if (menu.open){
    const items = menuItems();
    if (b === 'a'){ const o = items[menu.i]; if (o && !o.off) o.run(); }
    else if (b === 'b' || b === 'start'){ if (menu.page !== 'main' && menu.page !== menu.from) { menu.page = 'main'; menu.i = 0; } else menu.open = false; }
    renderHud(); return;
  }
  if (modalUp()) return;   // (a target list, a die to enter, a question from the DM: tapped)
  if (b === 'start'){ openMenu('main'); return; }
  if (b === 'back' || b === 'ls'){ openSheet(); return; }
  if (b === 'x' || b === 'lt' || b === 'spells'){ if (me()?.casts?.length) openMenu('spells'); else toast('No spells.'); return; }
  if (b === 'y' || b === 'rt' || b === 'actions'){ openMenu('actions'); return; }
  if (fight()){
    if (b === 'a') strike();
    else if (b === 'b'){ if (myTurn()) sendHost({ t:'endturn' }); else putCardAway(); }
    else if (b === 'rb' || b === 'lb'){ const n = aim(b === 'rb' ? 1 : -1); if (n) rt.look = { id:n.id, until:performance.now() + 900 }; }
    renderHud(); return;
  }
  if (b === 'a'){ if (putCardAway()) return; const h = hereAction(); if (h) h.run(); }
  else if (b === 'b') putCardAway();
  else if (b === 'lb' || b === 'rb') camTurn(b === 'lb' ? 1 : -1);
  renderHud();
}
// What A would do out of a fight: { label, run } | null
function hereAction(){
  const t0 = me(), st = t0 && onStairs(t0);
  if (st) return { label:exitLabel(state.floors[t0.floor], st), run:() => takeStairs(me()) };
  const dn = doorNear(); if (dn) return { label:dn.locked ? 'Try the locked door' : dn.open ? 'Close the door' : 'Open the door', run:() => doorAction(me(), dn.L, dn.id, 'toggle') };
  const tg = target(), t = me(); if (tg && attackFor(t, tg) >= 0) return { label:`Strike ${tg.name}`, run:() => strike(tg) };
  return null;
}
// A tap on the screen (ui/input.js): a foe aims (again: strike), the hero is A, the ground walks there. Doors and
// objects go on to the usual handling (→ false).
function onTap(tile, tokId){
  if (!on()) return false;
  if (skipBoot()) return true;
  if (menu.open){ menu.open = false; renderHud(); return true; }
  const o = tokId && tokById(tokId), t = me(); if (!t) return false;
  if (o?.kind === 'monster'){ if (rt.target === o.id) strike(o); else { rt.target = o.id; rt.look = { id:o.id, until:performance.now() + 900 }; } renderHud(); return true; }
  if (o?.id === t.id){ press('a'); return true; }
  if (o) return false;
  if (tile && tile.floor === t.floor && !(tile.x === t.x && tile.y === t.y)){ if (fight() && !myTurn()){ toast('Wait for your turn.'); return true; } requestMove(t, tile.x, tile.y); return true; }
  return false;
}

/* ---------- the hero's sheet (Select) ---------- */
const sheetOpen = () => document.body.classList.contains('hh-sheet');
function openSheet(){
  ui.panelOpen = true; ui.tab = 'hero';
  document.body.classList.add('hh-sheet');
  import('./panels.js').then(m => m.renderPanel());
}
function closeSheet(){ document.body.classList.remove('hh-sheet'); }

/* ---------- the menu (Start) ---------- */
const openMenu = page => { menu.open = true; menu.page = page; menu.from = page; menu.i = 0; renderHud(); };
const go = page => () => { menu.page = page; menu.i = 0; };
const back = { label:'Back', run:() => { if (menu.page === menu.from) menu.open = false; else { menu.page = 'main'; menu.i = 0; } } };
const TITLE = { main:'At the table', spells:'Spells', actions:'Actions', handheld:'Handheld & camera', help:'How to play' };
const HELP = 'D-pad: a step a press (hold it to keep walking); up is away from the camera. A: strike your target; out of a fight, take the stairs, open a door, put a card away. B: end your turn (or back). X: spells. Y: Dash, Disengage, Dodge, an attack of your choice, features, Search. L and R: the next target in a fight, else turn the camera. Select: your hero\'s sheet. View: the next camera view. Start: this menu. Or tap: a foe to aim (again to strike), the ground to walk, a door or a thing to use it. The DM still decides everything, as before.';
function menuItems(){
  const t = me(); if (!t) return [back];
  const turnOk = !fight() || myTurn();
  if (menu.page === 'spells') return [...(t.casts || []).map((s, i) => ({ label:s.n, sub:s.l ? `level ${s.l}` : 'cantrip', off:!turnOk || !canCast(t, s.l, s.n, s.again),
    run:() => { menu.open = false; cardAct('cast', i); } })), back];
  if (menu.page === 'actions'){
    const ta = k => () => { menu.open = false; sendHost({ t:'turnAct', id:t.id, k }); };
    return [
      ...(fight() ? [{ label:'Dash', sub:'Your speed again this turn', off:!myTurn(), run:ta('dash') }, { label:'Disengage', sub:'Leave without opportunity attacks', off:!myTurn(), run:ta('disengage') },
        { label:'Dodge', sub:'Attacks against you at disadvantage', off:!myTurn(), run:ta('dodge') }, ...(t.conds?.some(c => c.n === 'prone') ? [{ label:'Stand up', off:!myTurn(), run:ta('stand') }] : [])] : []),
      ...t.attacks.map((a, i) => ({ label:a.n, sub:`${a.b >= 0 ? '+' : ''}${a.b} · ${a.d} · choose who`, off:!turnOk || (a.l && !canCast(t, a.l, a.sn || a.n, a.again)), run:() => { menu.open = false; cardAct('atk', i); } })),
      ...(t.resources || []).filter(r => !r.slot).map(r => ({ label:r.id === 'hd' ? 'Hit Die' : r.n, sub:'A feature', off:!turnOk, run:() => { menu.open = false; cardAct('feat', 0, r.id); } })),
      { label:'🔍 Search', sub:'Look around for what\'s hidden', off:!turnOk, run:() => { menu.open = false; search(me()); } },
      back];
  }
  if (menu.page === 'help') return [back];
  if (menu.page === 'handheld'){ const sh = SHELLS.find(x => x.k === hh.shell) || SHELLS[0];
    return [
      { label:`Shell: ${sh.label}`, sub:SHELLS.map(x => x.label).join(' · '), run:() => setHandheld({ shell:SHELLS[(SHELLS.indexOf(sh) + 1) % SHELLS.length].k }) },
      { label:`Screen: ${hh.lcd ? 'Pixel' : 'Smooth'}`, sub:'Pixel: chunky pixels and lines, like an old handheld', run:() => setHandheld({ lcd:!hh.lcd }) },
      { label:`Full screen: ${hh.full ? 'On' : 'Off'}`, sub:'The first press fills the whole screen, where the phone allows it', run:() => setHandheld({ full:!hh.full }) },
      { label:`See through walls: ${hh.seeThru ? 'On' : 'Off'}`, sub:'What stands between the camera and your hero thins away', run:() => setHandheld({ seeThru:!hh.seeThru }) },
      { label:'Camera: the next view', sub:'Close · Over the shoulder · High', run:camView },
      { label:'The classic screen', sub:'The map with the panels, as before (the Hero tab has the way back)', run:() => { menu.open = false; setHandheld({ table:false }); toast('🕹 The classic screen. Your hero tab → 🕹 Handheld brings it back.'); } },
      back];
  }
  return [
    { label:'Carry on', run:() => { menu.open = false; } },
    { label:'Your hero', sub:'Your sheet, notes, letters and the rest', run:() => { menu.open = false; openSheet(); } },
    ...(t.casts?.length ? [{ label:'Spells', run:go('spells') }] : []),
    { label:'Actions', sub:'Dash, Disengage, Dodge, an attack of your choice, features', run:go('actions') },
    { label:'Handheld & camera', sub:'Shell, pixel screen, full screen, seeing through, the classic screen', run:go('handheld') },
    { label:'How to play', run:go('help') },
  ];
}

/* ---------- on the screen ---------- */
function ensureHud(){
  if ($('#tableHud')) return;
  const el = document.createElement('div'); el.id = 'tableHud'; el.className = 'hidden';
  el.innerHTML = `<div class="wd-top"><div class="wd-where"><b id="tbPlace"></b><span id="tbClock"></span></div><button class="wd-btn" data-tb="menu" aria-label="Menu">☰</button></div>
    <div class="wd-party" id="tbParty"></div><div class="wd-prompt" id="tbPrompt"></div><div class="wd-fight hh-fightbar hidden" id="tbFight"></div>
    <div class="wd-menu hidden" id="tbMenu"></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-tb]'); if (!b) return; e.stopPropagation();
    const k = b.dataset.tb;
    if (k === 'menu') menu.open ? (menu.open = false) : openMenu('main');
    else if (k === 'pick'){ menu.i = +b.dataset.i; press('a'); }
    else if (k === 'a') press('a'); else if (k === 'b') press('b'); else if (k === 'x') press('spells'); else if (k === 'y') press('actions'); else if (k === 'rb') press('rb');
    renderHud();
  });
}
const bar = (hp, max) => `<i class="wd-hp"><i style="width:${Math.max(0, Math.min(100, hp / Math.max(1, max) * 100))}%"></i></i>`;
const last = {};
const put = (id, html) => { if (last[id] === html) return; last[id] = html; const el = document.getElementById(id); if (el) el.innerHTML = html; };
const show = (id, v) => document.getElementById(id)?.classList.toggle('hidden', !v);
export function renderHud(){
  ensureHud();
  const v = on(); show('tableHud', v); if (!v) return;
  const t = me(); if (!t) return;
  const f = state.floors[t.floor], cur = fight() && currentTurn();
  put('tbPlace', esc(f?.name || state.meta?.name || ''));
  put('tbClock', esc(fight() ? `Round ${state.combat.round || 1} · ${cur ? (cur.id === t.id ? 'your turn' : `${cur.name}'s turn`) : '…'}` : `${state.meta?.name || ''}`));
  const party = [t, ...state.tokens.filter(o => o.kind === 'pc' && o.id !== t.id && o.floor === t.floor && !o.flags?.gone)].slice(0, 4);
  put('tbParty', party.map(m => `<div class="wd-m${m.id === t.id ? ' me' : ''}${cur?.id === m.id ? ' turn' : ''}${m.dead || m.hp <= 0 ? ' down' : ''}"><span class="nm">${esc(m.name)}</span>${bar(m.hp, m.maxHp)}<span class="hp">${Math.max(0, m.hp)} / ${m.maxHp}</span></div>`).join(''));
  const here = !fight() && !menu.open && hereAction();
  put('tbPrompt', here ? `<button class="wd-act" data-tb="a"><b>A</b> ${esc(here.label)}</button>` : '');
  show('tbFight', fight());
  if (fight()){
    const order = state.combat.order.map(tokById).filter(o => o && !o.flags?.gone).map(o => `<span class="${o.kind === 'monster' ? 'foe' : 'pal'}${o.id === cur?.id ? ' now' : ''}${o.dead || o.hp <= 0 ? ' down' : ''}">${esc(o.name)}</span>`).join('');
    const tg = target(), i = attackFor(t, tg);
    const body = myTurn()
      ? `<div class="wd-fl"><b>Your turn</b> · ${Math.max(0, moveAllowance(t)) * 5} ft. to move</div>
        <div class="wd-fl">${tg ? `🎯 <b>${esc(tg.name)}</b>${tg.maxHp ? ` ${bar(tg.hp, tg.maxHp)}` : ''}${i >= 0 ? ` · ${esc(t.attacks[i].n)}` : ' <span class="muted">(out of reach)</span>'}` : 'Nobody in sight'}</div>
        <div class="wd-acts"><button class="wd-act" data-tb="a"><b>A</b> Strike</button><button class="wd-act" data-tb="rb"><b>R</b> Next target</button>${t.casts?.length ? '<button class="wd-act" data-tb="x"><b>X</b> Spells</button>' : ''}<button class="wd-act" data-tb="y"><b>Y</b> Actions</button><button class="wd-act" data-tb="b"><b>B</b> End turn</button></div>`
      : `<div class="wd-fl">${cur ? `<b>${esc(cur.name)}</b>'s turn…` : '…'}</div>${tg ? `<div class="wd-fl">🎯 ${esc(tg.name)}</div>` : ''}`;
    put('tbFight', `<div class="wd-order">${order}</div>${body}`);
  }
  show('tbMenu', menu.open);
  if (menu.open){ const items = menuItems(); menu.i = Math.min(menu.i, items.length - 1);
    put('tbMenu', `<div class="wd-tt"><b>${esc(TITLE[menu.page] || '')}</b></div>${menu.page === 'help' ? `<div class="wd-tx">${esc(HELP)}</div>` : ''}<div class="wd-opts">${items.map((o, k) => `<button class="wd-opt${k === menu.i ? ' on' : ''}${o.off ? ' off' : ''}" data-tb="pick" data-i="${k}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`);
    const o = document.querySelector('#tbMenu .wd-opt.on'); o?.scrollIntoView({ block:'nearest' }); }
}
function legend(){
  if (menu.open || sheetOpen()) return { a:{ label:'Choose' }, b:{ label:'Back' }, x:{ b:null, label:'' }, y:{ b:null, label:'' }, select:{ label:'Hero' }, view:{ label:'Camera' }, start:{ label:'Menu' } };
  const t = me(), sp = !!t?.casts?.length;
  return { a:{ label:fight() ? 'Strike' : 'Act' }, b:{ label:fight() ? 'End turn' : 'Back' }, x:{ b:sp ? 'spells' : null, label:sp ? 'Spells' : '' }, y:{ b:'actions', label:'Actions' },
    select:{ label:'Hero' }, view:{ label:'Camera' }, start:{ label:'Menu' } };
}

/* ---------- every frame ---------- */
let padMem = {}, hhMem = {}, lastFrame = 0, lastHud = 0, was = false;
function frame(now){
  requestAnimationFrame(frame);
  const v = on();
  ui.hhTap = v ? onTap : null;
  if (!v){ if (was){ was = false; menu.open = false; closeSheet(); closeLook(); feelHits(null); show('tableHud', false); } return; }
  if (!was) camStart();   // (from the map's overview to close behind the hero)
  was = true;
  const dt = Math.min(.1, (now - (lastFrame || now)) / 1000); lastFrame = now;
  const t = me(); if (!t) return;
  const gp = [...(navigator.getGamepads?.() || [])].find(g => g && g.connected);
  let pad = null;
  if (gp){ pad = readPad(gp); const r = padIntents(pad, now, padMem, { yaw:camYaw() }); padMem = r.mem; for (const it of r.intents) it.k === 'step' ? step(it.dx, it.dy) : press(it.b); }
  { const r = padIntents(hhPad(), now, hhMem, { yaw:camYaw() }); hhMem = r.mem; for (const it of r.intents) if (it.k === 'step') step(it.dx, it.dy); }
  const cur = fight() && currentTurn(), lk = rt.look && now < rt.look.until && tokById(rt.look.id);
  try { camFrame(dt, pad, { focus:miniFocus(t), me:t, other:lk || (cur && cur.id !== t.id ? cur : null), otherRate:lk ? 4 : 3 }); } catch (e){ console.warn(e); }
  try { lookThrough(t, now); } catch (e){ console.warn(e); }
  feelHits(t, gp);
  if (now - lastHud > 180){ lastHud = now; renderHud(); }
}
function onKey(e){
  if (!on() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (sheetOpen() && e.key !== 'Escape') return;
  const it = keyIntent(e.key, { shift:e.shiftKey, yaw:camYaw() }); if (!it) return;
  e.preventDefault(); e.stopPropagation();
  it.k === 'step' ? step(it.dx, it.dy) : press(it.b === 'back' ? 'back' : it.b);
}
let ready = false;
export function ensureTableHH(){
  if (ready) return; ready = true;
  ensureHud();
  addHost({ id:'table', active:tableActive, press:b => { press(b); }, legend, fight,
    health:() => { const t = me(); return t ? Math.max(0, t.hp) / Math.max(1, t.maxHp) : 1; } });
  addEventListener('keydown', onKey, { capture:true });
  // the sheet's way back to the handheld (over the Hero tab)
  const bk = document.createElement('button'); bk.id = 'hhSheetBack'; bk.className = 'btn primary'; bk.textContent = '🕹 Back to the handheld';
  bk.addEventListener('click', closeSheet); document.body.appendChild(bk);
  requestAnimationFrame(frame);
}
export const tableHH = { rt, target, aim, strike, press, step, menu, openSheet, closeSheet, sheetOpen, hereAction };
