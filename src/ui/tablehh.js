/* 🕹 THE HANDHELD AT THE TABLE: a player's phone is the pocket console too, the standard way to play a seated hero.
   The world in the shell's screen (ui/handheld.js), the camera following the hero (ui/followcam.js), and the buttons
   doing what the player's phone already could, through the same requests to the DM (the DM's app still decides,
   rolls and broadcasts, so nothing new crosses the table):
   Each button does one thing, always (the same in a fight or out of one):
     · D-pad: a step a press (requestMove; held, it keeps walking as the DM moves the hero), up is away from the
       camera; in a menu, up and down through it
     · A: what the line on the screen says: strike the target (the attack that reaches it, or the one last chosen),
       the action spent, end the turn; out of a fight, the stairs, a door beside the hero, a card put away; in a menu, choose
     · B: back, put a card away, let a foe go
     · X: the Actions menu: each attack, Spells…, Dash, Disengage, Dodge, Stand up, features (Action Surge gives the
       action back), Search, End turn
     · Y: the next target. L / R: turn the camera. View: the next camera view
     · Select: the hero's sheet (Muse's pocket sheet); Start: the menu
     · taps on the screen: a foe to aim at (again to strike), the hero for A, the ground to walk there; doors and
       objects as before
   It holds the handheld whenever this phone is seated with a hero (not the TV, not card only, not in the Lantern
   Yard), and the device wants it: on a touch screen with no controller, unless the menu's "The classic screen" is
   chosen (kept per device). A controller plugged in plays it too. */
import { turnBanner } from './turnbanner.js';
import { hpBar, barMood } from './hpbar.js';
import { state, ui, tokById } from '../engine/state.js';
import { esc, signed } from '../util/core.js';
import { optList, optInfo, tag } from './optrow.js';
import { attackBits, spellBits, actBits, featBits, spellOf } from './actrows.js';
import { pipsHtml, markSpent } from './turnpips.js';
import { orderStrip, wireStrip } from './orderstrip.js';
import { showHover } from '../render/fightzone.js';
import { edgeWords } from '../engine/odds.js';
import { attackEdge } from '../game/combat.js';
import { readPad, padIntents, keyIntent } from '../engine/pad.js';
import { rangeCheck, coverOf, areaOf, areaSquares, spellReach } from '../engine/targeting.js';
import { tokGap } from '../engine/movement.js';
import { requestAct } from '../game/requests.js';
import { requestMove, doorAction, onStairs, takeStairs, search } from '../game/actions.js';
import { exitLabel } from '../engine/generator.js';
import { currentTurn, moveAllowance } from '../game/rules.js';
import { canCast, slotLevels, left, BONUS_FEATS } from '../game/resources.js';
import { playerAnswer } from '../game/moves.js';
import { tune, coachTick, coachLearn, coachDone } from './hhlife.js';
import { uncover, banner } from './passage.js';
import { underfoot } from '../engine/underfoot.js';
import { sfx } from '../audio/sound.js';
import { stepFx, tickStepFx } from '../render/stepfx.js';
import { groundWeather } from '../render/floors.js';
import { askD20 } from '../game/night.js';
import { sendHost } from '../net/table.js';
import { cardAct } from './cards.js';
import { openPocketSheet, pocketPress, pocketOpen, closePocketSheet } from './pocketsheet.js';
import { playerLetters } from './letters.js';
import { toast, waiting } from './hud.js';
import { hh, hhHost, hhPad, addHost, setHandheld, skipBoot, shellItem } from './handheld.js';
import { victoryOpen, victoryPress } from './victory.js';
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
const rt = { target:null, atk:null, aAt:0, surgeWas:null, look:null, sentAt:0, sentFrom:null, cast:null, hpWas:null, turnWas:false, fightWas:false };

/* ---------- the turn's action ----------
   The DM's app doesn't count a player's attacks (the DM rules on it), so the handheld does, the way a player would:
   a strike each (two or more with Extra Attack: Fighters, Barbarians, Paladins, Rangers and Monks from level 5,
   Fighters three at 11 and four at 20), or one spell; Action Surge gives the action back (once a turn); then A, or
   X's End turn, ends the turn. */
const turnKey = () => fight() ? `${state.combat.round}:${state.combat.idx}` : '';
const used = { key:'', strikes:0, acted:false, surged:false, bonus:false, did:'' };
const usedNow = () => { const k = turnKey(); if (used.key !== k){ used.key = k; used.strikes = 0; used.acted = false; used.surged = false; used.bonus = false; used.did = ''; } return used; };
// Action Surge spent on the hero's turn (from the handheld, the classic card or the DM's app: its count going down
// is what tells): one more action, strikes and all
function surgeWatch(t){
  const n = (t.resources || []).some(r => r.id === 'surge') ? left(t, 'surge') : null;
  if (n !== null && rt.surgeWas != null && n < rt.surgeWas && myTurn()){ const u = usedNow();
    if (!u.surged){ u.surged = true; u.strikes = 0; u.acted = false; toast('⚡ Action Surge: one more action this turn.'); tune('crit'); } }
  rt.surgeWas = n;
}
function maxStrikes(t){
  const m = /^(\w+) (\d+)/.exec(t?.cls || ''); if (!m) return 1;
  const c = m[1], L = +m[2];
  if (c === 'Fighter') return L >= 20 ? 4 : L >= 11 ? 3 : L >= 5 ? 2 : 1;
  return ['Barbarian', 'Paladin', 'Ranger', 'Monk'].includes(c) && L >= 5 ? 2 : 1;
}
const strikesLeft = t => { const u = usedNow(); return u.acted ? 0 : Math.max(0, maxStrikes(t) - u.strikes); };
const actionLeft = t => !fight() || (!usedNow().acted && usedNow().strikes === 0);
// A spell cast as a bonus action (Healing Word, Misty Step…): it spends the bonus action, not the action
const bonusSpell = sp => !!sp && /bonus/i.test(spellOf(sp.sn || sp.n)?.time || '');
// What's left of the turn, for the pips (ui/turnpips.js)
const economy = t => { if (!fight() || !t) return null; const u = usedNow(), n = strikesLeft(t);
  return { mine:myTurn(), strikes:n, of:maxStrikes(t), action:n > 0, did:u.acted ? u.did : u.strikes ? 'strike' : '', bonus:!u.bonus, moveFt:Math.max(0, moveAllowance(t)) * 5, reaction:!t.reacted }; };
// For and against a blow, in words (players don't see a foe's AC, so no odds: only the advantage and why)
const edgeOf = (t, tg, a) => { try { const E = attackEdge(t, tg, a); return edgeWords({ adv:E.advWhy, dis:E.disWhy }); } catch { return { mark:'', text:'' }; } };
const menu = { open:false, page:'main', i:0 };

/* ---------- who to aim at ---------- */
// Foes the hero can see on this floor, nearest first.
const foes = () => { const t = me(); if (!t) return [];
  return state.tokens.filter(o => o.kind === 'monster' && o.floor === t.floor && !o.dead && !o.flags?.gone && tokenViews.get(o.id)?.group?.visible !== false)
    .sort((a, b) => tokGap(t, a) - tokGap(t, b)); };
function target(){ const l = foes(); let tg = rt.target && l.find(o => o.id === rt.target); if (!tg){ tg = l[0] || null; rt.target = tg?.id || null; } return tg; }
function aim(dir = 1){ const l = foes(); if (!l.length){ rt.target = null; return null; } const k = l.findIndex(o => o.id === rt.target); const n = l[((k < 0 ? -1 : k) + dir + l.length) % l.length]; rt.target = n.id; return n; }
// The attack that reaches the target (one with no slot to spend first), or -1
const avg = d => { let n = 0; String(d || '').replace(/(\d*)d(\d+)/g, (_, c, f) => { n += (+c || 1) * (+f + 1) / 2; return ''; }); const b = /[+-]\s*\d+$/.exec(String(d || '')); return n + (b ? +b[0].replace(/\s/g, '') : 0); };
const attackFor = (t, tg) => { if (!t || !tg || coverOf(t, tg).cover === 'total') return -1;
  let best = -1, bv = -1; t.attacks.forEach((a, i) => { if (a.l || !rangeCheck(t, tg, a).ok) return; const v = avg(a.d) + (a.b || 0) * .5; if (v > bv){ bv = v; best = i; } }); return best; };
// A door beside the hero: { L, id, open }
function doorNear(){ const t = me(); if (!t) return null; const f = state.floors[t.floor];
  const d = (f.doors || []).map(d => ({ d, x:d.i % f.W, y:(d.i / f.W) | 0 })).filter(o => Math.max(Math.abs(o.x - t.x), Math.abs(o.y - t.y)) <= 1)[0];
  return d ? { L:t.floor, id:d.d.id, open:d.d.state === 'open', locked:d.d.state === 'locked' } : null; }

/* ---------- doing ---------- */
function strike(tg = target(), pick = null){
  const t = me(); if (!t) return;
  if (pick !== null && t.attacks?.[pick]) rt.atk = pick;
  if (fight() && !myTurn()) return toast('Not your turn yet.');
  if (!tg) return toast('Nobody to strike.');
  if (fight() && !strikesLeft(t)) return toast(usedNow().acted ? 'Your action is spent this turn: A again ends your turn.' : 'You\'ve struck this turn: A again ends your turn.');
  const i = rt.atk != null && t.attacks[rt.atk] && rangeCheck(t, tg, t.attacks[rt.atk]).ok ? rt.atk : attackFor(t, tg); if (i < 0) return toast(`${tg.name} is out of reach: walk closer.`);
  rt.look = { id:tg.id, until:performance.now() + 1500 };
  if (fight()) usedNow().strikes++;
  coachLearn('strike');
  const a = t.attacks[i], send = d20 => requestAct({ kind:'attack', id:t.id, i, target:tg.id, mode:ui.atkMode, ...(d20 ? { d20 } : {}) });
  if (state.realDice) askD20(`${t.name}: ${a.n} → ${tg.name}`, send); else send(null);
}
/* ---------- ⚔ the choice of blow ----------
   A, with a target, doesn't strike straight away: it opens the choice of what to strike with, each attack with its
   bonus, damage and whether it reaches from here (the one that would be used at the top); A again strikes with it,
   B puts it away with nothing spent. (A tap on a foe aims; a second tap opens it too.) */
function openStrike(tg = target()){
  const t = me(); if (!t) return;
  if (fight() && !myTurn()) return toast('Not your turn yet.');
  if (!tg) return toast('Nobody in sight.');
  if (fight() && !strikesLeft(t)) return toast(usedNow().acted ? 'Your action is spent this turn.' : 'You\'ve struck this turn.');
  openMenu('strike');
}
function reachWords(t, tg, a){
  if (!a || !tg) return '';
  let r; try { r = rangeCheck(t, tg, a); } catch { return ''; }
  if (r.ok && coverOf(t, tg).cover === 'total') return 'behind total cover';
  if (!r.ok) return r.why || 'out of reach';
  return r.kind === 'ranged' ? (r.long ? 'long range: at disadvantage' : r.close ? 'a foe at your elbow: at disadvantage' : 'in range') : 'in reach';
}
function strikeItems(t){
  const tg = target(), best = tg ? attackFor(t, tg) : -1, ok = a => { try { return !!tg && rangeCheck(t, tg, a).ok && coverOf(t, tg).cover !== 'total'; } catch { return false; } };
  const list = (t.attacks || []).map((a, i) => ({ a, i, r:ok(a) })).sort((x, y) => (y.i === best) - (x.i === best) || y.r - x.r);
  return [...list.map(({ a, i, r }) => ({ label:a.n, ...attackBits(a, reachWords(t, tg, a)), ...(r ? {} : { tone:'far' }),
      off:!r || (fight() && (!myTurn() || !strikesLeft(t))) || (a.l && !canCast(t, a.l, a.sn || a.n, a.again)), run:() => { menu.open = false; strike(tg, i); } })),
    { label:'Back', icon:'←', sub:'Nothing is spent', run:() => { menu.open = false; } }];
}
/* ---------- a spell from the buttons ----------
   At the target (an area aimed at its square), on yourself, or for healing and help a friend chosen on the screen;
   the slot to spend chosen on the screen too when there's more than one. The card-only path stays for anything odd. */
function castFromList(i){
  const t = me(), sp = t?.casts?.[i]; if (!sp) return;
  if (fight() && !myTurn()) return toast('Not your turn yet.');
  if (fight() && !actionLeft(t)) return toast('Your action is spent: A again ends your turn.');
  if (!canCast(t, sp.l, sp.n, sp.again)) return toast(`${sp.n}: no slot left for it.`);
  const area = areaOf(sp), help = sp.k === 'heal' || sp.k === 'buff';
  const go = target => slotThen(t, sp, at => sendCast(t, i, sp, target, at));
  if (area?.shape === 'aura') return go({ id:t.id, aim:{ x:t.x, y:t.y } });
  if (help){ rt.cast = { i }; menu.open = true; menu.page = 'allies'; menu.from = 'spells'; menu.i = 0; renderHud(); return; }
  if (sp.k === 'util') return go({ id:t.id });
  const tg = target(); if (!tg) return toast('Nobody to aim at: L and R pick a target.');
  if (area){ if (!areaSquares(t, area, { x:tg.x, y:tg.y }).ok) return toast(`${tg.name} is out of range of ${sp.n}: walk closer.`); return go({ id:tg.id, aim:{ x:tg.x, y:tg.y } }); }
  if (tokGap(t, tg) > Math.max(1, spellReach(sp)) || coverOf(t, tg).cover === 'total') return toast(`${tg.name} is out of range of ${sp.n}: walk closer.`);
  go({ id:tg.id });
}
// Allies a helping spell can reach (yourself first)
const alliesFor = (t, sp) => [t, ...state.tokens.filter(o => o.kind === 'pc' && o.id !== t.id && o.floor === t.floor && !o.flags?.gone)]
  .map(o => ({ o, ok:o.id === t.id || tokGap(t, o) <= Math.max(1, spellReach(sp)) }));
function slotThen(t, sp, cb){
  const levels = sp.l && t.sustain !== sp.n ? slotLevels(t, sp.l) : [];
  if (levels.length <= 1) return cb(null);
  rt.cast = { ...(rt.cast || {}), cb, levels, base:sp.l }; menu.open = true; menu.page = 'slot'; menu.from = 'slot'; menu.i = 0; renderHud();
}
function sendCast(t, i, sp, tg, at){
  menu.open = false; rt.cast = null;
  requestAct({ kind:'cast', id:t.id, i, target:tg.id, ...(tg.aim ? { aim:tg.aim } : {}), ...(at ? { at } : {}) });
  if (fight()){ if (bonusSpell(sp)) usedNow().bonus = true; else { usedNow().acted = true; usedNow().did = 'cast'; } }
  if (tg.id !== t.id) rt.look = { id:tg.id, until:performance.now() + 1700 };
  coachLearn('cast');
}
const dpadName = (dx, dy) => dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
function step(dx, dy){
  if (skipBoot()) return;
  if (pocketOpen()){ pocketPress(dpadName(dx, dy)); return; }   // (the pocket sheet's rows, not a step)
  if (menu.open){ if (dy){ const n = Math.max(0, Math.min(menuItems().length - 1, menu.i + dy)); if (n !== menu.i) tune('menuMove'); menu.i = n; } renderHud(); return; }
  if (modalUp()) return;
  const t = me(), now = performance.now(); if (!t) return;
  // one step at a time: the next once the DM has moved the hero (or it's clearly not coming)
  if (rt.sentFrom && t.x === rt.sentFrom.x && t.y === rt.sentFrom.y && now - rt.sentAt < 900) return;
  rt.sentFrom = { x:t.x, y:t.y }; rt.sentAt = now;
  requestMove(t, t.x + dx, t.y + dy);
}
function putCardAway(){ const c = document.querySelector('#cardLayer .pop:last-child'); if (!c) return false; c.click(); if (c.isConnected) c.remove(); return true; }
/* One button, one job (the same on the handheld, a controller and the keys):
     D-pad: walk, or move through a menu        A: do what the screen says (strike, end the turn, the stairs, a door…), or choose
     B: back, put away, let go                  X: the Actions menu (attacks, spells, Dash…, features, Search, End turn)
     Y: the next target                          L / R: turn the camera
     Select: your hero's sheet                   Start: the menu                View: the next camera view */
function press(b){
  if (!b || skipBoot()) return;
  if (pocketOpen()){ pocketPress(b === 'ls' ? 'back' : b); return; }   // (the pocket sheet takes every press while it's open)
  if (victoryOpen()){ victoryPress(b === 'ls' || b === 'start' ? 'b' : b); return; }   // 🏆 the victory screen takes every press while it's up
  coachDone();
  if (b === 'rs'){ camView(); coachLearn('camera'); return; }
  if (b === 'turnl' || b === 'turnr'){ camTurn(b === 'turnl' ? 1 : -1); return; }
  if (b === 'lb' || b === 'rb'){ camTurn(b === 'lb' ? 1 : -1); coachLearn('camera'); return; }
  if (b === 'in' || b === 'out'){ camCrane(b === 'in' ? -1 : 1); return; }
  if (sheetOpen()){ if (b === 'b' || b === 'back' || b === 'ls' || b === 'start') closeSheet(); return; }
  if (menu.open){
    const items = menuItems();
    if (b === 'a'){ const o = items[menu.i]; if (o && !o.off){ tune('menuOk'); o.run(); } }
    else if (b === 'x' && menu.from === 'actions'){ tune('menuBack'); menu.open = false; }   // (X again puts its menu away)
    else if (b === 'b' || b === 'start'){ tune('menuBack'); rt.cast = null; if (menu.page !== 'main' && menu.page !== menu.from) { menu.page = 'main'; menu.i = 0; } else menu.open = false; }
    renderHud(); return;
  }
  // a foe getting away from the hero: A strikes it (the reaction), B lets it go
  const oa = ui.oaAsk?.[0];
  if (oa && (b === 'a' || b === 'b')){ playerAnswer(oa.id, b === 'a'); renderHud(); return; }
  if (modalUp()) return;   // (a target list, a die to enter, a question from the DM: tapped)
  if (b === 'start'){ openMenu('main'); coachLearn('menu'); return; }
  if (b === 'back' || b === 'ls'){ openSheet(); coachLearn('sheet'); return; }
  if (b === 'x' || b === 'actions'){ openMenu('actions'); return; }
  if (b === 'lt' || b === 'spells'){ if (me()?.casts?.length) openMenu('spells'); else toast('No spells.'); return; }   // (a controller's trigger, a shortcut)
  if (b === 'y' || b === 'yprev'){ const n = aim(b === 'y' ? 1 : -1); if (n){ rt.look = { id:n.id, until:performance.now() + 900 }; coachLearn('aim'); } else toast('Nobody in sight.'); renderHud(); return; }
  if (b === 'endturn'){ endTurn(); renderHud(); return; }
  if (b === 'a'){ if (!fight() && putCardAway()) return; const h = fight() ? fightAction() : hereAction(); if (h){ h.run(); rt.aAt = performance.now(); } }   // (in a fight, B puts a card away: A is for the fight)
  else if (b === 'b') putCardAway();
  renderHud();
}
function endTurn(){ if (!myTurn()) return; sendHost({ t:'endturn' }); coachLearn('endTurn'); tune('menuOk'); }
// What A does in a fight (the prompt line says it): strike the target, walk closer, or, the action spent, end the turn.
// (A second press straight after a strike doesn't end the turn: a double tap shouldn't throw away the move.)
function fightAction(){
  const t = me(); if (!t) return null;
  if (!myTurn()){ const cur = currentTurn(); return { label:cur ? `${cur.name}'s turn…` : 'Wait for your turn', run:() => toast('Not your turn yet.'), idle:true }; }
  const tg = target(), u = usedNow();
  if (strikesLeft(t) && tg && attackFor(t, tg) >= 0) return { label:`Attack ${tg.name}…`, run:() => openStrike(tg) };
  if (strikesLeft(t) && tg) return { label:`Attack ${tg.name}… (out of reach: walk closer)`, run:() => openStrike(tg) };
  if (strikesLeft(t)) return { label:'Nobody in reach', run:() => toast(tg ? `${tg.name} is out of reach: walk closer, or X for more.` : 'Nobody in sight. X for more.'), idle:true };
  return { label:'End your turn', run:() => { if (performance.now() - (rt.aAt || 0) < 1200) return toast(u.acted ? 'Your action is spent this turn: A again ends your turn.' : 'You\'ve struck this turn: A again ends your turn.'); endTurn(); } };
}
// What A would do out of a fight: { label, run } | null
function hereAction(){
  const t0 = me(), st = t0 && onStairs(t0);
  if (st) return { label:exitLabel(state.floors[t0.floor], st), run:() => { takeStairs(me()); tune('stairs'); coachLearn('stairs'); } };
  const dn = doorNear(); if (dn) return { label:dn.locked ? 'Try the locked door' : dn.open ? 'Close the door' : 'Open the door', run:() => { doorAction(me(), dn.L, dn.id, 'toggle'); tune('door'); coachLearn('door'); } };
  const tg = target(), t = me(); if (tg && attackFor(t, tg) >= 0) return { label:`Attack ${tg.name}…`, run:() => openStrike(tg) };
  return null;
}
// A tap on the screen (ui/input.js): a foe aims (again: strike), the hero is A, the ground walks there. Doors and
// objects go on to the usual handling (→ false).
function onTap(tile, tokId){
  if (!on()) return false;
  if (skipBoot()) return true;
  if (menu.open){ menu.open = false; renderHud(); return true; }
  const o = tokId && tokById(tokId), t = me(); if (!t) return false;
  if (o?.kind === 'monster'){ if (rt.target === o.id) openStrike(o); else { rt.target = o.id; rt.look = { id:o.id, until:performance.now() + 900 }; } renderHud(); return true; }
  if (o?.id === t.id){ press('a'); return true; }
  if (o) return false;
  if (tile && tile.floor === t.floor && !(tile.x === t.x && tile.y === t.y)){ if (fight() && !myTurn()){ toast('Wait for your turn.'); return true; } requestMove(t, tile.x, tile.y); return true; }
  return false;
}

/* ---------- the hero's sheet (Select) ---------- */
// Select: Muse's pocket sheet (ui/pocketsheet.js), pages on the handheld's screen; the menu's "The full sheet" is the
// classic Hero tab over everything (body.hh-sheet), with notes, letters and the rest to act on
const sheetOpen = () => pocketOpen() || document.body.classList.contains('hh-sheet');
function openSheet(){
  const t = me(); if (!t) return;
  openPocketSheet({ token:t, sheet:state.characters?.[t.charId] || null, extras:{ notes:ui.notes || [], letters:playerLetters() }, onClose:null });
}
function openClassicSheet(){
  ui.panelOpen = true; ui.tab = 'hero';
  document.body.classList.add('hh-sheet');
  import('./panels.js').then(m => m.renderPanel());
}
function closeSheet(){ closePocketSheet(); document.body.classList.remove('hh-sheet'); }

/* ---------- the menu (Start) ---------- */
const openMenu = page => { menu.open = true; menu.page = page; menu.from = page; menu.i = 0; renderHud(); };
const go = page => () => { menu.page = page; menu.i = 0; };
const back = { label:'Back', run:() => { if (menu.page === menu.from) menu.open = false; else { menu.page = 'main'; menu.i = 0; } } };
const TITLE = { strike:'Strike', main:'At the table', spells:'Spells', actions:'Actions', handheld:'Handheld & camera', help:'How to play', allies:'On whom?', slot:'Which slot?' };
const HELP = 'Each button does one thing. D-pad: walk a step a press (hold it to keep walking; up is away from the camera), or move through a menu. A: do what the line on the screen says (attack your target: the choice of what to strike with, then A again strikes; end your turn, take the stairs, open a door), or choose in a menu. B: back, or put a card away. X: Actions: your attacks, spells, Dash, Disengage, Dodge, features like Action Surge, Search, End turn. Y: the next target. L and R: turn the camera. Select: your hero\'s sheet. View: the next camera view. Start: this menu. Or touch the screen: a foe to aim (again: the choice of blow), the ground to walk, a door or a thing to use it, any line of a menu. The DM still decides everything, as before.';
function menuItems(){
  const t = me(); if (!t) return [back];
  const turnOk = !fight() || myTurn();
  if (menu.page === 'strike') return strikeItems(t);
  if (menu.page === 'spells') return [...(t.casts || []).map((s, i) => [s, i]).sort((a, b) => (a[0].l || 0) - (b[0].l || 0)).map(([s, i]) => ({ label:s.n, group:s.l ? `Level ${s.l}` : 'Cantrips', ...spellBits(s), ...(areaOf(s) ? { icon:'✺' } : {}),
    sub:`${spellBits(s).sub}${s.k === 'heal' || s.k === 'buff' || s.k === 'util' ? '' : target() ? ` · at ${target().name}` : ''}`,
    off:!turnOk || !canCast(t, s.l, s.n, s.again) || (fight() && (bonusSpell(s) ? usedNow().bonus : !actionLeft(t))), run:() => { menu.open = false; castFromList(i); } })), back];
  if (menu.page === 'allies'){ const i = rt.cast?.i, sp = t.casts?.[i]; if (!sp) return [back];
    return [...alliesFor(t, sp).map(({ o, ok }) => ({ label:o.id === t.id ? `${o.name} (you)` : o.name, sub:`${Math.max(0, o.hp)} / ${o.maxHp} HP${ok ? '' : ' · out of reach'}`, off:!ok,
      run:() => slotThen(t, sp, at => sendCast(t, i, sp, { id:o.id }, at)) })), { label:'Back', run:() => { rt.cast = null; menu.page = 'spells'; menu.i = 0; } }]; }
  if (menu.page === 'slot'){ const c = rt.cast; if (!c?.levels) return [back];
    return [...c.levels.map(l => ({ label:`Level ${l}${l === c.base ? ' (its own)' : ''}`, sub:(t.resources || []).filter(r => r.slot === l).map(r => `${left(t, r.id)} left`).join(' · '),
      run:() => c.cb(l === c.base ? null : l) })), { label:'Back', run:() => { rt.cast = null; menu.open = false; } }]; }
  if (menu.page === 'actions'){
    const ta = k => () => { menu.open = false; sendHost({ t:'turnAct', id:t.id, k }); if (k === 'dash' || k === 'dodge' || k === 'disengage'){ if (fight()){ usedNow().acted = true; usedNow().did = k; } coachLearn(k); } };
    const tg = target(), spent = fight() && myTurn() && !strikesLeft(t);
    const end = fight() ? [{ label:'End your turn', group:' ', icon:'⏭', sub:spent ? 'Your action is spent' : 'Done for this round', off:!myTurn(), run:() => { menu.open = false; endTurn(); } }] : [];
    // an attack: at the target, if it reaches (and from now on, A strikes with it); else choose who on the screen
    const atk = (a, i) => () => { menu.open = false;
      if (tg && rangeCheck(t, tg, a).ok && coverOf(t, tg).cover !== 'total'){ rt.atk = i; strike(tg); return; }
      if (fight()) usedNow().strikes++; cardAct('atk', i); };
    return [
      ...(spent ? end : []),
      ...t.attacks.map((a, i) => ({ label:a.n, group:'Strike', ...attackBits(a, tg && rangeCheck(t, tg, a).ok ? `at ${tg.name}` : 'choose who'), off:!turnOk || (fight() && !strikesLeft(t)) || (a.l && !canCast(t, a.l, a.sn || a.n, a.again)), run:atk(a, i) })),
      ...(t.casts?.length ? [{ label:'Spells…', group:'Magic', icon:'✦', info:'Every spell you know, with what it does and what it costs.', sub:fight() && !actionLeft(t) ? 'Your action is spent' : (t.resources || []).filter(r => r.slot).map(r => `L${r.slot} ${left(t, r.id)}/${r.max}`).join(' · ') || 'Cantrips', run:() => { menu.page = 'spells'; menu.i = 0; } }] : []),
      ...(fight() ? [{ label:'Dash', group:'Move & defend', ...actBits('dash'), off:!myTurn(), run:ta('dash') }, { label:'Disengage', group:'Move & defend', ...actBits('disengage'), off:!myTurn(), run:ta('disengage') },
        { label:'Dodge', group:'Move & defend', ...actBits('dodge'), off:!myTurn(), run:ta('dodge') }, ...(t.conds?.some(c => c.n === 'prone') ? [{ label:'Stand up', group:'Move & defend', ...actBits('stand'), off:!myTurn(), run:ta('stand') }] : [])] : []),
      ...(t.resources || []).filter(r => !r.slot).map(r => ({ label:r.id === 'hd' ? 'Hit Die' : r.n, group:'Your gifts', ...featBits({ id:r.id, n:r.n, left:left(t, r.id), max:r.max, text:r.text }), sub:`${left(t, r.id)} of ${r.max} left${r.id === 'surge' && usedNow().surged ? ' · used this turn' : ''}`,
        off:!turnOk || !left(t, r.id) || (r.id === 'surge' && (!fight() || usedNow().surged)) || (fight() && BONUS_FEATS.has(r.id) && usedNow().bonus), run:() => { menu.open = false; cardAct('feat', 0, r.id); if (fight() && BONUS_FEATS.has(r.id)) usedNow().bonus = true; } })),
      { label:'Search', group:' ', icon:'🔍', tags:[tag('act')], sub:'Look around for what\'s hidden', info:'Look over everything near you for what\'s hidden: a door, a trap, a thing put away.', off:!turnOk, run:() => { menu.open = false; search(me()); } },
      ...(spent ? [] : end),
      back];
  }
  if (menu.page === 'help') return [back];
  if (menu.page === 'handheld'){
    return [
      shellItem(),
      { label:'Stickers…', sub:'Vinyl stickers on your own console', run:() => { menu.open = false; import('./shells.js').then(m => m.openStickerBook({})); } },
      { label:`Screen: ${hh.lcd ? 'Pixel' : 'Smooth'}`, sub:'Pixel: chunky pixels and lines, like an old handheld', run:() => setHandheld({ lcd:!hh.lcd }) },
      { label:`Full screen: ${hh.full ? 'On' : 'Off'}`, sub:'The first press fills the whole screen, where the phone allows it', run:() => setHandheld({ full:!hh.full }) },
      { label:`See through walls: ${hh.seeThru ? 'On' : 'Off'}`, sub:'What stands between the camera and your hero thins away', run:() => setHandheld({ seeThru:!hh.seeThru }) },
      { label:'Camera: the next view', sub:'Close · Over the shoulder · High', run:camView },
      { label:`Tips: ${hh.tips === false ? 'Off' : 'On'}`, sub:'A short hint now and then, at the right moment', run:() => setHandheld({ tips:hh.tips === false }) },
      { label:`Chip tunes: ${hh.chip === false ? 'Off' : 'On'}`, sub:'Its little jingles (with the sound effects on)', run:() => setHandheld({ chip:hh.chip === false }) },
      { label:'The classic screen', sub:'The map with the panels, as before (the Hero tab has the way back)', run:() => { menu.open = false; setHandheld({ table:false }); toast('🕹 The classic screen. Your hero tab → 🕹 Handheld brings it back.'); } },
      back];
  }
  return [
    { label:'Carry on', run:() => { menu.open = false; } },
    { label:'Your hero', sub:'Your sheet, a page at a time (Select)', run:() => { menu.open = false; openSheet(); } },
    { label:'The full sheet', sub:'The classic Hero tab: notes, letters, your voice and the rest', run:() => { menu.open = false; openClassicSheet(); } },
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
  // ⏳ a face in the turn order: pointed at, its figure lights; a foe tapped is aimed at
  wireStrip('osTb', { hover:id => showHover(id), pick:id => { const o = tokById(id); if (o?.kind === 'monster' && !o.dead){ rt.target = id; rt.look = { id, until:performance.now() + 900 }; renderHud(); } } });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-tb]'); if (!b) return; e.stopPropagation();
    const k = b.dataset.tb;
    if (k === 'menu') menu.open ? (menu.open = false) : openMenu('main');
    else if (k === 'pick'){ menu.i = +b.dataset.i; press('a'); }
    else if (['a', 'b', 'x', 'y', 'endturn'].includes(k)) press(k);
    renderHud();
  });
}
const bar = (hp, max, key) => hpBar(hp, max, key);   // (💔 a blow's part drains away: ui/hpbar.js)
const last = {};
let scrolledTo = '';
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
  put('tbParty', party.map(m => { const hb = bar(m.hp, m.maxHp, m.id), mood = barMood(m.id);   // (💔 the card jolts or glows with its bar: ui/hpbar.js)
    return `<div class="wd-m${m.id === t.id ? ' me' : ''}${cur?.id === m.id ? ' turn' : ''}${m.dead || m.hp <= 0 ? ' down' : ''}${mood ? ` ${mood}` : ''}"><span class="nm">${esc(m.name)}</span>${hb}<span class="hp">${Math.max(0, m.hp)} / ${m.maxHp}</span></div>`; }).join(''));
  const oa = ui.oaAsk?.[0], here = !oa && !menu.open && (fight() ? fightAction() : hereAction());
  put('tbPrompt', oa ? `<div class="wd-oa">⚔ <b>${esc(oa.mover)}</b> is getting away: your reaction?</div><button class="wd-act" data-tb="a"><b>A</b> Strike with ${esc(oa.atk)}</button><button class="wd-act" data-tb="b"><b>B</b> Let them go</button>`
    : here ? (here.idle ? `<div class="wd-tx">${esc(here.label)}</div>` : `<button class="wd-act" data-tb="a"><b>A</b> ${esc(here.label)}</button>`) : '');
  show('tbFight', fight());
  if (fight()){
    // ⏳ the turn order as faces (ui/orderstrip.js); a monster's health isn't for the players to see
    const order = orderStrip({ order:state.combat.order, cur:cur?.id, me:t.id, round:state.combat.round || 1, act:'osTb', seeHp:o => o.kind !== 'monster', onFace:() => renderHud() });
    const tg = target(), i = attackFor(t, tg);
    const body = myTurn()
      ? `<div class="wd-fl wd-turn"><b>Your turn</b>${pipsHtml(economy(t))}</div>
        <div class="wd-fl">${tg ? `🎯 <b>${esc(tg.name)}</b>${tg.maxHp ? ` ${bar(tg.hp, tg.maxHp, tg.id)}` : ''}${i < 0 ? ' <span class="muted">(out of reach)</span>' : ''}` : 'Nobody in sight'}</div>
        ${tg && i >= 0 && strikesLeft(t) ? `<div class="wd-fl wd-weap">⚔ <b>${esc(t.attacks[i].n)}</b> ${signed(t.attacks[i].b)} to hit · ${esc(t.attacks[i].d)} ${esc(t.attacks[i].t || '')} · <span class="near">${esc(reachWords(t, tg, t.attacks[i]))}</span></div>${(e => e.text ? `<div class="wd-fl wd-edge">${esc(e.mark)} ${esc(e.text)}</div>` : '')(edgeOf(t, tg, t.attacks[i]))}` : ''}
        <div class="wd-acts"><button class="wd-act" data-tb="x"><b>X</b> Actions</button><button class="wd-act" data-tb="y"><b>Y</b> Next target</button><button class="wd-act" data-tb="endturn">End turn</button></div>`
      : `<div class="wd-fl">${cur ? `<b>${esc(cur.name)}</b>'s turn…` : '…'}</div>${tg ? `<div class="wd-fl">🎯 ${esc(tg.name)}</div>` : ''}`;
    put('tbFight', `<div class="wd-order">${order}</div>${body}`);
  }
  show('tbMenu', menu.open);
  if (menu.open){ const items = markSpent(menuItems(), economy(t)); menu.i = Math.min(menu.i, items.length - 1);
    put('tbMenu', `<div class="wd-tt"><b>${esc(TITLE[menu.page] || '')}</b></div>${menu.page === 'help' ? `<div class="wd-tx">${esc(HELP)}</div>` : ''}<div class="wd-opts">${optList(items, menu.i, k => `data-tb="pick" data-i="${k}"`)}</div>${optInfo(items[menu.i])}`);
    // keep the highlight in sight when it moves (only then: a finger scrolling the list isn't pulled back)
    const key = `${menu.page}:${menu.i}`; if (key !== scrolledTo){ scrolledTo = key; document.querySelector('#tbMenu .wd-opt.on')?.scrollIntoView({ block:'nearest' }); } }
  else scrolledTo = '';
}
// The buttons' names on the shell: the same whatever's going on (the prompt line says what A does just now)
function legend(){
  const foe = !!foes().length;
  return { a:{ label:'OK' }, b:{ label:'Back' }, x:{ b:'x', label:'Actions' }, y:{ b:'y', label:foe ? 'Target' : '' }, select:{ label:'Hero' }, view:{ label:'Camera' }, start:{ label:'Menu' } };
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
  if (gp){ pad = readPad(gp); const r = padIntents(pad, now, padMem, { yaw:menu.open ? 0 : camYaw() }); padMem = r.mem; for (const it of r.intents) it.k === 'step' ? step(it.dx, it.dy) : press(it.b); }
  { const r = padIntents(hhPad(), now, hhMem, { yaw:menu.open ? 0 : camYaw() }); hhMem = r.mem; for (const it of r.intents) if (it.k === 'step') step(it.dx, it.dy); }
  const cur = fight() && currentTurn(), lk = rt.look && now < rt.look.until && tokById(rt.look.id);
  // ⚔ in a fight, over their hero's shoulder at what they face (ui/followcam.js)
  const subject = fight() && !t.dead ? (lk || (cur && cur.kind === 'monster' ? cur : target())) : null;
  try { camFrame(dt, pad, { focus:miniFocus(t), me:t, other:lk || (cur && cur.id !== t.id ? cur : null), otherRate:lk ? 4 : 3, fight:fight() ? { subject } : null }); } catch (e){ console.warn(e); }
  try { lookThrough(t, now); } catch (e){ console.warn(e); }
  feelHits(t, gp);
  moments(t); surgeWatch(t); placeWatch(t); feelMine(t, now);
  try { coachTick(() => snapshot(t)); } catch (e){ console.warn(e); }
  if (now - lastHud > 180){ lastHud = now; renderHud(); }
}
// 👣 Their own hero's steps: a puff, a splash, a print, a rustle, and the sound of it (as in the Wanderer)
let stoodAt = '';
function feelMine(t, now){
  const k = `${state.meta.mapId || ''}:${t.floor}:${t.x}:${t.y}`, was = stoodAt; stoodAt = k;
  if (was && was !== k){
    const [m, fl, px, py] = was.split(':');
    if (m === (state.meta.mapId || '') && +fl === t.floor && Math.max(Math.abs(+px - t.x), Math.abs(+py - t.y)) <= 1){
      const kind = underfoot(state.floors[t.floor], t.x, t.y, { indoors:state.meta.template === 'interior', ...groundWeather() });
      stepFx(t.floor, t.x, t.y, kind, t.x - +px, t.y - +py);
      sfx({ snow:'crunch', splash:'splash', mud:'splash', rustle:'rustle' }[kind] || 'step', false);
    }
  }
  tickStepFx(now);
}
// The DM moved the party to another map (or the road went on): the fog clears and the name slides in (ui/passage.js)
let placeWas = '';
function placeWatch(t){
  const f = state.floors[t.floor], key = `${state.meta.mapId || state.meta.name}:${state.meta.template === 'journey' || state.meta.template === 'interior' ? t.floor : ''}`;
  if (key === placeWas) return;
  const first = !placeWas; placeWas = key; if (first) return;
  uncover(); tune('stairs');
  banner({ title:state.meta.template === 'journey' ? f?.name || state.meta.name : state.meta.name, sub:state.campaign?.day || '' });
}
// The turn coming round, a fight ending, a hurt or a heal, a reaction to take: a buzz and a tune
function moments(t){
  const mine = myTurn(), f = fight();
  if (mine && !rt.turnWas){ tune('turnStart'); waiting(''); try { navigator.vibrate?.([50, 40, 50]); } catch {}   // (last turn's "with the DM…" is old news)
    const r = state.combat.round || 1; turnBanner({ title:'Your turn', sub:r > 1 && r !== rt.bannerRound ? `Round ${r}` : '' }); rt.bannerRound = r; }   // ⚔ (ui/turnbanner.js)
  if (!f && rt.fightWas && !t.dead && t.hp > 0) tune('victory');
  if (rt.hpWas !== null && t.hp > rt.hpWas) tune('heal');
  else if (rt.hpWas !== null && t.hp < rt.hpWas) tune(t.hp <= 0 ? 'defeat' : 'hit');
  const oaN = ui.oaAsk?.length || 0;
  if (oaN > (rt.oaWas || 0)){ waiting(''); try { navigator.vibrate?.([90, 50, 90]); } catch {} }
  rt.turnWas = mine; rt.fightWas = f; rt.hpWas = t.hp; rt.oaWas = oaN;
}
// What the coach sees (engine/coach.js)
function snapshot(t){
  const tg = target(), i = attackFor(t, tg), pc = state.tokens.filter(o => o.kind === 'pc' && o.id !== t.id && !o.flags?.gone);
  const slots = (t.resources || []).filter(r => r.slot).reduce((n, r) => n + left(t, r.id), 0);
  const dn = doorNear(), st = onStairs(t);
  return { where:'table', fight:fight(), myTurn:myTurn(), round:state.combat?.round || 0, hp:Math.max(0, t.hp), maxHp:t.maxHp, down:t.dead || t.hp <= 0,
    conditions:(t.conds || []).map(c => c.n), moveLeft:fight() ? Math.max(0, moveAllowance(t)) * 5 : 30,
    target:tg ? { name:tg.name, inReach:i >= 0, seen:true } : null, foesSeen:foes().length, alliesDown:pc.filter(o => o.dead || o.hp <= 0).length,
    hasSpells:!!t.casts?.length, slotsLeft:slots, cantrips:(t.casts || []).filter(c => !c.l).length, hasHealing:(t.casts || []).some(c => c.k === 'heal'),
    potions:0, onStairs:st || null, doorNear:dn ? { open:dn.open, locked:dn.locked } : null,
    cardUp:!!document.querySelector('#cardLayer .pop') || modalUp(), menuOpen:menu.open, sheetOpen:sheetOpen(),
    waitingOnDM:!!document.querySelector('#waitPill.on, #waitPill.show') };
}
function onKey(e){
  if (!on() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (document.body.classList.contains('hh-sheet') && e.key !== 'Escape') return;   // (the classic sheet takes its own keys)
  const it = keyIntent(e.key, { shift:e.shiftKey, yaw:pocketOpen() || menu.open ? 0 : camYaw() }); if (!it) return;
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
