/* 🗡 THE WANDERER on screen: the third door on the start page (pick a hero, or carry on), and while playing, the
   heads-up display over the map: where and when, the party's health, what Ⓐ would do here, the fight bar on your
   turn, a conversation, and the menu (travel, rest, save, leave). Input: a gamepad (engine/pad.js; the loop below
   reads it every frame), the keyboard, the handheld skin's touch buttons (ui/handheld.js), or taps on the map.
   The follow camera (below) eases after the hero and turns, cranes and cycles views with the right stick, L / R, [ ] - = V. */
import { magicWord } from '../game/calling.js';
import { emblemSvg } from './emblems.js';
import { deathSaveOpen, deathSavePress, dyingBadge } from './deathsave.js';
import { dyingMarks } from '../engine/death-saves.js';
import { classLine, originLine } from '../game/calling.js';
import { turnBanner } from './turnbanner.js';
import { provokers } from '../engine/movement.js';
import { hpBar, barMood } from './hpbar.js';
import { showTarget, faceFor, onFaceReady } from './targetinfo.js';
import { state, ui, tokById, tokenAt, side } from '../engine/state.js';
import { lastOfSide } from '../engine/punch.js';
import { readPad, padIntents, keyIntent } from '../engine/pad.js';
import { companionById } from '../data/wander.js';
import { placeById } from '../engine/overland.js';
import { esc } from '../util/core.js';
import { myHeroes, myHero } from '../game/heroes.js';
import { loadWanderSave } from '../game/session.js';
import { valley, clockText } from '../game/overworld.js';
import { currentTurn } from '../game/combat.js';
import { moveAllowance } from '../game/rules.js';
import { rangeCheck } from '../engine/targeting.js';
import { W, rt, hero, members, wandering, startWander, continueWander, leaveWander, stepHero, heroBusy, walkTo, hereAction, talkView, chooseTalk, talkTo,
  heroAttack, heroDodge, heroShove, heroTurnAct, heroFeatures, heroFeature, endHeroTurn, aim, aimAt, target, targets, attackFor, nextWeapon, attacksLeft, myTurn, fightTick, memorialSteps, destinations, setOut, travelTo, rest, saveNow,
  pack, toggleEquip, usePotion, coinsGp, shopHere, buyPotion, journal, approvalOf, levelReady, partyLevel, nextLevelXp, levelUpHero, sheetOf, spellList, heroCast,
  SLOTS, slotMeta, canSaveSlot, saveToSlot, loadFromSlot, opening, economy, strikeOdds } from '../game/wander.js';
import { setFightZone, clearFightFx, showMoveSquares, clearMoveSquares, showMarks, showOdds, showAreaSquares, clearAim, showHover, floatText, ringPulse, moveSquaresKey } from '../render/fightzone.js';
import { xpOf } from '../engine/encounter.js';
import { BEST } from '../data/bestiary.js';
import { pipsHtml, markSpent, oddsBits, oddsTone, ODDS_COL } from './turnpips.js';
import { orderStrip, wireStrip } from './orderstrip.js';
import { areaOf, areaSquares, caughtIn } from '../engine/targeting.js';
import { reach, pathTo } from '../engine/grid.js';
import { bus, signed } from '../util/core.js';
import { optList, optInfo, tag } from './optrow.js';
import { attackBits, spellBits, actBits, featBits } from './actrows.js';
import { wx, wz, floorY } from '../render/scene.js';
import { passage, tapTarget } from '../game/ways.js';
import { veil, banner } from './passage.js';
import { glintsSeen, pagesFound } from '../game/finds.js';
import { showGlints, clearGlints, tickGlints } from '../render/glints.js';
import { underfoot } from '../engine/underfoot.js';
import { stepFx, tickStepFx, clearStepFx, fordStones } from '../render/stepfx.js';
import { groundWeather } from '../render/floors.js';
import { setCritters, updateCritters, clearCritters } from '../render/critters.js';
import { kindOf } from '../game/finds.js';
import { musicTick, musicStop } from './regionmusic.js';
import { sfx } from '../audio/sound.js';
import { loyalty } from '../engine/wander-life.js';
import { hh, hhOn, hhHost, hhPad, addHost, setHandheld, skipBoot, shellItem } from './handheld.js';
import { victoryOpen, victoryPress } from './victory.js';
import { defeatOpen, defeatPress } from './defeat.js';
import { callingPickerOpen, callingPickerPress } from './callingpicker.js';
import { diceBusy } from './dicemoment.js';
import { levelUpOpen, levelUpPress } from './levelup.js';
import { openBestiary, bestiaryOpen, bestiaryPress, setBestiaryFace } from './bestiary.js';
import { openTrophies, trophiesOpen, trophiesPress } from './trophies.js';
import { beastBook, trophyShelf } from '../game/record.js';
import { faceOf } from '../game/night.js';
import { makeMonster } from '../engine/state.js';
import { gfx } from '../render/gfx.js';
import { camTurn, camView, camCrane, camYaw, camFrame, miniFocus, lookThrough, closeLook, feelHits, camWide, camBack, camBeat, foeAhead } from './followcam.js';
import { tune, coachTick, coachLearn, coachDone, coachHide } from './hhlife.js';
import { openPocketSheet, pocketPress, pocketOpen, closePocketSheet } from './pocketsheet.js';
import { toast } from './hud.js';

const $ = s => document.querySelector(s);
const menu = { open:false, page:'main', i:0 }, talkSel = { i:0 };

/* ---------- the start page ---------- */
export function renderWanderStart(){
  const box = $('#wdStart'); if (!box) return;
  const s = loadWanderSave(), w = s?.campaign?.wander, sh = w && s.characters?.[w.heroId];
  const at = w && placeById(s.campaign.valley?.journey ? s.campaign.valley.journey.to : s.campaign.valley?.at);
  const cont = w ? `<div class="th-continue wd-cont"><div class="th-feature-body"><div class="th-tag" style="color:var(--seep)">Carry on</div>
      <h3>${esc(sh?.name || 'Your hero')}${w.party.length ? ` and ${w.party.map(p => esc(companionById(p.id)?.name || '')).join(', ')}` : ''}</h3>
      <p>${s.campaign.valley?.journey ? `On the road to ${esc(at?.name || '…')}` : esc(at?.name || s.meta?.name || '')} · Day ${s.campaign.valley?.day || 1} · ${w.xp} XP</p>
      <button class="btn primary" data-act="wdContinue">Carry on</button></div></div>` : '';
  const list = myHeroes();
  box.innerHTML = cont + `<h3 class="th-h3">${w ? 'Or begin again with' : 'Who walks into the fog?'}</h3>
    <div class="th-heroes">${list.map(h => `<div class="th-hero">
      <div class="pt" style="background:radial-gradient(circle at 50% 40%,${h.color}66,#120b10 75%)">${h.portrait ? `<img src="${h.portrait}" alt="">` : esc((h.name || '?')[0])}</div>
      <div class="nm">${esc(h.name || 'Unnamed')}</div><div class="meta">${esc(originLine(h))} ${esc(classLine(h))}</div>
      <div class="acts"><button class="btn small primary" data-act="wdBegin" data-id="${h.id}">Begin</button></div></div>`).join('')}
      <button class="th-hero new" data-act="wdNewHero"><b>+</b><span>Create a character</span></button></div>
    <p class="muted wd-keys">🎮 A controller works in Chrome and Edge: plug it in and press a button. Or the keys: <b>WASD</b> or the arrows walk, <b>Space</b> does what the screen says (strike, talk, end your turn), <b>Esc</b> goes back, <b>F</b> opens your actions, <b>Tab</b> picks a target, <b>I</b> is your hero, <b>M</b> the menu, <b>[ ]</b> turn your hero where they stand (the camera stays behind them). Or tap where to walk.</p>
    <p class="muted wd-keys">🕹 On a phone with no controller, the phone becomes one: it is held like a pocket console, the world on its screen (the menu's Handheld page has the shells and a pixel screen).</p>`;
}

/* ---------- the HUD ---------- */
function ensureHud(){
  if ($('#wanderHud')) return;
  const el = document.createElement('div'); el.id = 'wanderHud'; el.className = 'hidden';
  el.innerHTML = `<div class="wd-top"><div class="wd-where"><b id="wdPlace"></b><span id="wdClock"></span></div><span id="wdLvl"></span><button class="wd-btn" data-act="wdMenu" aria-label="Menu">☰</button></div>
    <div class="wd-party" id="wdParty"></div><div class="wd-prompt" id="wdPrompt"></div><div class="wd-fight hh-fightbar hidden" id="wdFight"></div><div class="os-top hidden" id="wdOrder"></div>
    <div class="wd-talk hidden" id="wdTalk"></div><div class="wd-menu hidden" id="wdMenuBox"></div><div class="wd-open hidden" id="wdOpen"></div>`;
  document.body.appendChild(el);
}
// A button's name as the player holds it: a pad's, or the handheld's.
const PAD_K = { a:'Ⓐ', b:'Ⓑ', x:'Ⓧ', y:'Ⓨ' }, HH_K = { a:'A', b:'B', x:'X', y:'Y' };
const K = k => { const n = (hhOn() ? HH_K : PAD_K)[k]; return n ? `<b>${n}</b>` : ''; };
// The highlighted choice stays in sight when the D-pad moves through a list longer than the box.
const keepInView = id => { const o = document.querySelector(`#${id} .wd-opt.on`); if (o && o.dataset.seen !== '1'){ document.querySelectorAll(`#${id} .wd-opt[data-seen]`).forEach(n => delete n.dataset.seen); o.dataset.seen = '1'; o.scrollIntoView({ block:'nearest' }); } };
const bar = (hp, max, key, t = null) => hpBar(hp, max, key, undefined, t);   // (💔 a blow's part drains away: ui/hpbar.js)
let last = {};
const put = (id, html) => { if (last[id] === html) return; last[id] = html; const el = document.getElementById(id); if (el) el.innerHTML = html; };
const show = (id, on) => document.getElementById(id)?.classList.toggle('hidden', !on);
export function renderHud(){
  ensureHud();
  const on = wandering(); show('wanderHud', on); document.body.classList.toggle('wd-fighting', on && !!state.combat.active); if (!on) return;
  renderOpening();
  const t = hero(), V = valley(), j = V.journey, f = state.floors[t?.floor ?? 0];
  put('wdPlace', esc(j ? `${f?.name || 'The road'}` : f?.name || state.meta.name));
  put('wdClock', esc(`${clockText()}${j ? ` · to ${placeById(j.to)?.name || ''}, stretch ${(t?.floor ?? 0) + 1} of ${state.floors.length}` : ''}`));
  put('wdLvl', levelReady() ? `<button class="wd-lvl" data-act="wdLevel">⬆ Level ${partyLevel()}</button>` : '');
  const turn = state.combat.active && currentTurn();
  // (💔 the bar first: it's what notices a blow or a heal, and the card jolts or glows with it: ui/hpbar.js)
  put('wdParty', members().map(m => { const hb = bar(m.hp, m.maxHp, m.id, m), mood = barMood(m.id); return `<div class="wd-m${m.id === t?.id ? ' me' : ''}${turn?.id === m.id ? ' turn' : ''}${m.dead || m.hp <= 0 ? ' down' : ''}${mood ? ` ${mood}` : ''}">
    ${(f => f ? `<img class="wd-face" src="${f}" alt="">` : '')(faceFor(m))}<span class="nm">${m.calling ? `<span class="cr-emb" style="color:${esc(m.callColor || 'currentColor')}">${emblemSvg(m.calling, { size:14 })}</span>` : ''}${esc(m.name)}</span>${hb}<span class="hp">${Math.max(0, m.hp)} / ${m.maxHp}</span>${m.dying ? `<span class="ds-badge" data-dying="${esc(m.id)}"></span>` : ''}</div>`; }).join(''));
  for (const el of document.querySelectorAll('#wdParty .ds-badge')){ const m = tokById(el.dataset.dying); dyingBadge(el, m?.dying ? dyingMarks(m.dying) : null); }   // 💀 hearts and skulls
  // what Ⓐ does just now
  const here = !rt.talk && !menu.open && (state.combat.active ? fightAction() : hereAction());
  put('wdPrompt', here ? (here.idle ? `<div class="wd-tx">${esc(here.label)}</div>` : `<button class="wd-act" data-act="wdA">${K('a')} ${esc(here.label)}</button>`) : '');
  // the fight bar
  show('wdFight', state.combat.active); show('wdOrder', !!state.combat.active && !hhOn() && !opening());
  if (state.combat.active){
    // ⏳ the turn order as faces (ui/orderstrip.js): across the top, or in the handheld's panel
    const order = orderStrip({ order:state.combat.order, cur:turn?.id, me:t?.id, round:state.combat.round || 1, act:'osWd', onFace:() => renderHud() });
    let body;
    if (myTurn()){
      const tg = target(), i = attackFor(t, tg), atk = t.attacks[i] || t.attacks[rt.atk ?? 0];
      const ai = t.attacks.indexOf(atk), od = tg && ai >= 0 && i >= 0 ? strikeOdds(ai, tg) : null;
      body = `<div class="wd-fl wd-turn"><b>Your turn</b>${pipsHtml(economy())}</div>
        <div class="wd-fl wd-tgt">${tg ? `<div class="wd-tc" id="wdTarget" data-tid="${esc(tg.id)}"></div>` : 'Nobody in sight'}</div>
        ${atk && attacksLeft() ? `<div class="wd-fl wd-weap">⚔ <b>${esc(atk.n)}</b> ${signed(atk.b)} to hit · ${esc(atk.d)} ${esc(atk.t || '')}${tg ? ` · <span class="${i < 0 ? 'far' : 'near'}">${esc(reachWords(t, tg, ai))}</span>` : ''}${od ? ` · <b class="wd-odds o-${oddsTone(od.hit)}">${esc(od.edge.mark)}${od.pct}</b>` : ''}</div>
        ${od?.edge.text ? `<div class="wd-fl wd-edge">${esc(od.edge.mark)} ${esc(od.edge.text)}</div>` : ''}` : ''}
        <div class="wd-acts"><button class="wd-act" data-act="wdX">${K('x')} Actions</button><button class="wd-act" data-act="wdAim" data-k="1">${K('y')} Next target</button><button class="wd-act" data-act="wdEnd">End turn</button></div>`;
    } else body = `<div class="wd-fl">${turn ? `<span><b>${esc(turn.name)}</b>'s turn…</span>` : '…'}</div>`;
    put('wdFight', `${hhOn() ? `<div class="wd-order">${order}</div>` : ''}${body}`);
    // 🎯 the target card (Muse's ui/targetcard.js): who you're going for, how hurt (in words), what's known (the odds stay
    // on the weapon's line below, as they change with the weapon)
    if (myTurn()) showTarget(document.getElementById('wdTarget'), target());
    if (!hhOn()) put('wdOrder', order);
  }
  // a conversation
  const tv = talkView(); show('wdTalk', !!tv);
  if (tv){ talkSel.i = Math.min(talkSel.i, tv.options.length - 1);
    put('wdTalk', `<div class="wd-tt"><b>${esc(tv.title)}</b>${tv.sub ? `<span>${esc(tv.sub)}</span>` : ''}</div><div class="wd-tx">${esc(tv.text)}</div>
      <div class="wd-opts">${optList(tv.options.map(talkRow), talkSel.i, k => `data-act="wdSay" data-k="${esc(tv.options[k].k)}"`)}</div>`);  keepInView('wdTalk'); }
  // the menu
  show('wdMenuBox', menu.open); $('#wdMenuBox')?.classList.toggle('wd-dock', menu.open && !!state.combat.active && ['strike', 'actions', 'spells'].includes(menu.page));
  if (menu.open){ const items = markSpent(menuItems(), state.combat.active ? economy() : null); menu.i = Math.min(menu.i, items.length - 1);
    const info = pageInfo();
    put('wdMenuBox', `<div class="wd-tt"><b>${esc(PAGE_TITLE[menu.page] || 'The valley waits')}</b>${info.sub ? `<span>${info.sub}</span>` : ''}</div>
      ${info.html ? `<div class="wd-tx">${info.html}</div>` : ''}
      <div class="wd-opts">${optList(items, menu.i, k => `data-act="wdPick" data-k="${k}"`)}</div>${optInfo(items[menu.i])}`); 
    keepInView('wdMenuBox'); }
}
const KEYS_HELP = 'Each button does one thing. Left stick, D-pad, WASD or the arrows: walk (Q E Z C for the diagonals), or move through a menu. Ⓐ / Space: do what the line on the screen says (talk, climb, look, end your turn), or choose; in a fight it opens the choice of what to strike with, each weapon with its bonus, damage and reach, and Ⓐ again strikes. Ⓑ / Esc: back, or put a card away. Ⓧ / F: Actions (each weapon, spells, Dash, Disengage, Dodge, features like Action Surge, a potion, End turn). Ⓨ / Tab: the next target. LB RB / [ ]: turn your hero where they stand, the camera behind them; right stick or - = crane it; right stick click / V: the next view. View / I: your hero. ☰ Start / M: this menu. View + Start / K: the save states. Shortcuts: LT / G spells, RT / H a potion, left stick click / J the journal, N end your turn. Or tap where to walk.';
const PAGE_TITLE = { strike:'Strike', states:'Save states', load:'Load this one?', handheld:'Handheld & camera', main:'The valley waits', travel:'Set out for…', keys:'Controls', pack:'The pack', give:'Who drinks it?', journal:'The journal', level:'Level up', spells:'Spells', actions:'Actions' };
// The words above a page's choices: { sub, html }
function pageInfo(){
  if (menu.page === 'strike'){ const tg = target(); return { sub:tg ? `at ${esc(tg.name)} · ${Math.max(0, tg.hp)} / ${tg.maxHp} HP` : 'Nobody in sight' }; }
  if (menu.page === 'keys') return { html:hhOn() ? HH_HELP : KEYS_HELP };
  if (menu.page === 'states') return { html:`Three places to keep the run as it is now, apart from its own autosave: save before a door you're not sure of, and come back to it. ${hhOn() ? 'Select and Start together open this page.' : 'K opens this page (Back and Start together on a controller).'}` };
  if (menu.page === 'load'){ const m = slotMeta(loading); return { html:m ? `${esc(slotLabel(m))}. Where you are now is kept only if it's saved.` : '' }; }
  if (menu.page === 'handheld') return { html:'The phone held like a pocket console: the world on its screen, the rest of it the controller. Auto shows it on a touch screen with no controller plugged in.' };
  if (menu.page === 'pack'){ const s = sheetOf(); return { sub:`${coinsGp()} gp${s?.coins?.sp ? ` · ${s.coins.sp} sp` : ''}` }; }
  if (menu.page === 'journal'){
    const q = journal(), w = W();
    const quests = q.length ? q.map(j => `<div class="wd-q${j.done ? ' done' : ''}"><b>${j.done ? '✓ ' : '📜 '}${esc(j.title)}</b><span>${esc(j.step)}</span></div>`).join('') : '<div class="muted">No quests yet.</div>';
    const pals = w.party.map(p => { const n = approvalOf(p.id); return `<div class="wd-q"><b>${esc(companionById(p.id)?.name || p.id)}</b><span>${loyalty(n).label} (${n > 0 ? '+' : ''}${n})</span></div>`; }).join('');
    const pages = pagesFound().map(p => `<div class="wd-q"><b>📜 ${esc(p.title)}</b><span>${esc(p.text)}</span></div>`).join('');
    return { sub:`Level ${partyLevel()} · ${w.xp} XP${nextLevelXp() ? ` · next at ${nextLevelXp()}` : ''}`, html:quests + (pals ? `<div class="wd-sep">Companions</div>${pals}` : '') + (pages ? `<div class="wd-sep">Pages found</div>${pages}` : '') };
  }
  if (menu.page === 'level'){ const s = sheetOf(); return { html:`${esc(s?.name || '')} can reach level ${partyLevel()}. Let the game make the choices (an ability increase into what you're best at, new spells), or make them yourself on the character sheet.` }; }
  if (menu.page === 'spells'){ const t = hero(); return { sub:t ? (t.resources || []).filter(r => r.slot).map(r => `L${r.slot} ${t.res?.[r.id] ?? r.max}/${r.max}`).join(' · ') : '' }; }
  return {};
}
// A save state in a line: who, where, when
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`; };
const slotLabel = m => `${m.name}, level ${m.lvl} · ${m.place} · Day ${m.day}`;
let loading = 0;   // the slot the 'load' page asks about
const attackForWith = (t, tg, i) => { try { return rangeCheck(t, tg, t.attacks[i]).ok; } catch { return false; } };
const back = (page = 'main') => ({ label:'Back', run:() => { menu.page = page; menu.i = 0; } });
const go = page => () => { menu.page = page; menu.i = 0; };
let giving = null;   // the potion being given (the pack's 'give' page)
function menuItems(){
  const road = state.meta.template === 'journey', fight = state.combat.active;
  if (menu.page === 'travel') return [...destinations().slice(0, 9).map(d => ({ label:d.name, sub:`${d.stretches} stretch${d.stretches === 1 ? '' : 'es'} of road${d.via.length ? ` · by ${d.via.join(', ')}` : ''}`, run:() => { closeMenu(); travelTo(d.id); } })), back()];
  if (menu.page === 'keys' || menu.page === 'journal') return [back()];
  if (menu.page === 'states'){ const out = [], can = canSaveSlot();
    for (let n = 0; n < SLOTS; n++){ const m = slotMeta(n);
      out.push({ label:`Save to slot ${n + 1}`, sub:can ? (m ? `Over: ${slotLabel(m)} (${ago(m.at)})` : 'Empty') : 'Not in a fight or a conversation', off:!can,
        run:() => { if (saveToSlot(n)){ toast(`💾 Saved to slot ${n + 1}.`); if (hh.chip === false) sfx('chime', false); else tune('save'); } } }); }
    for (let n = 0; n < SLOTS; n++){ const m = slotMeta(n);
      out.push({ label:`Load slot ${n + 1}`, sub:m ? `${slotLabel(m)} · ${ago(m.at)}` : 'Empty', off:!m, run:() => { loading = n; menu.page = 'load'; menu.i = 0; } }); }
    return [...out, back()]; }
  if (menu.page === 'load') return [
    { label:`Yes, load slot ${loading + 1}`, run:() => { closeMenu(); if (loadFromSlot(loading)){ toast(`💾 Slot ${loading + 1}: back where you were.`); tune('load'); } else toast('That slot would not load.'); } },
    back('states')];
  if (menu.page === 'handheld'){
    return [
      { label:`Handheld: ${{ auto:'Auto', on:'On', off:'Off' }[hh.mode] || 'Auto'}`, sub:'Auto · On · Off', run:() => setHandheld({ mode:{ auto:'on', on:'off', off:'auto' }[hh.mode] || 'auto' }) },
      shellItem(),
      { label:'Stickers…', sub:'Vinyl stickers on your own console', run:() => { closeMenu(); import('./shells.js').then(m => m.openStickerBook({})); } },
      { label:`Screen: ${hh.lcd ? 'Pixel' : 'Smooth'}`, sub:'Pixel: chunky pixels and lines, like an old handheld', run:() => setHandheld({ lcd:!hh.lcd }) },
      { label:`Full screen: ${hh.full ? 'On' : 'Off'}`, sub:'The first press fills the whole screen, where the phone allows it', run:() => setHandheld({ full:!hh.full }) },
      { label:'Camera: the next view', sub:'Behind · Close · High', run:camView },
      { label:`See through walls: ${hh.seeThru ? 'On' : 'Off'}`, sub:'What stands between the camera and your hero thins away', run:() => setHandheld({ seeThru:!hh.seeThru }) },
      { label:`Tips: ${hh.tips === false ? 'Off' : 'On'}`, sub:'A short hint now and then, at the right moment', run:() => setHandheld({ tips:hh.tips === false }) },
      { label:`Chip tunes: ${hh.chip === false ? 'Off' : 'On'}`, sub:'Its little jingles (with the sound effects on)', run:() => setHandheld({ chip:hh.chip === false }) },
      back()]; }
  if (menu.page === 'pack') return [
    ...pack().map(i => ({ icon:i.potion ? '🧪' : i.kind === 'weapon' ? '⚔' : i.kind === 'armor' || i.kind === 'shield' ? '🛡' : '◦', label:`${i.n}${i.qty > 1 ? ` ×${i.qty}` : ''}${i.equipped ? ' ✓' : ''}`, sub:i.potion ? 'Drink it, or give it to someone beside you' : ['weapon', 'armor', 'shield'].includes(i.kind) ? (i.equipped ? 'In hand / worn: take it off' : 'Wield it / wear it') : '',
      off:fight && !i.potion, run:() => { if (i.potion){ giving = i.id; menu.page = 'give'; menu.i = 0; } else if (['weapon', 'armor', 'shield'].includes(i.kind)) toggleEquip(i.id); } })),
    ...(shopHere() ? [{ label:'Buy a Potion of Healing', sub:`50 gp (you have ${coinsGp()})`, off:coinsGp() < 50, run:buyPotion }] : []),
    back()];
  if (menu.page === 'give'){ const t = hero(); return [...members().filter(m => !m.flags?.gone).map(m => ({ label:`${m.name}`, sub:`${Math.max(0, m.hp)} / ${m.maxHp} HP${m.id !== t.id && Math.max(Math.abs(m.x - t.x), Math.abs(m.y - t.y)) > 1 ? ' · too far away' : ''}`,
    run:() => { if (usePotion(giving, m.id)){ giving = null; closeMenu(); } } })), back('pack')]; }
  if (menu.page === 'level') return [
    { label:'Let the game choose', run:() => { closeMenu(); levelUpHero(); } },
    { label:'Choose on the character sheet', run:() => { closeMenu(); const s = { ...structuredClone(sheetOf()), lvl:partyLevel() };
      import('./creator.js').then(m => m.openCreator(s, { title:`${s.name}: level ${s.lvl}`, saveLabel:'Level up', onSave:h => levelUpHero(h) })); } },
    back()];
  if (menu.page === 'spells'){ const t = hero(), lvl = e => e.kind === 'atk' ? (t?.attacks?.[e.i]?.l || 0) : e.l || 0;
    const slotsAt = l => (t?.resources || []).filter(r => r.slot === l).map(r => `${t.res?.[r.id] ?? 0} of ${r.max} slots`).join(', ');
    return [...spellList().map(e => ({ e, l:lvl(e) })).sort((a, b) => a.l - b.l).map(({ e, l }) => {
      const b = e.kind === 'atk' ? { ...attackBits(t.attacks[e.i], target() ? reachWords(t, target(), e.i) : '', state.combat.active ? oddsBits(strikeOdds(e.i)) : null), ...(e.why ? { sub:`Only ${e.why}` } : {}) } : spellBits(e, e.why);
      const caught = e.kind === 'cast' && state.combat.active ? areaCatch(t, t.casts[e.i]) : null;
      return { label:e.n, group:l ? `Level ${l}${slotsAt(l) ? ` · ${slotsAt(l)}` : ''}` : 'Cantrips', ...b, ...(e.k === 'heal' && !e.why ? { sub:`${b.sub} · the most hurt of you` } : {}),
        ...(caught ? { sub:`${caught.words}${e.why ? '' : ` · ${b.sub}`}`, info:`${caught.info}<br>${b.info || ''}`, tone:caught.friends.length ? 'warn' : undefined } : {}),
        aim:e.kind === 'atk' ? { atk:e.i } : { cast:e.i }, off:!e.ok, run:() => { closeMenu(); heroCast(e); } }; }),
      { label:'Back', group:' ', icon:'←', run:() => { if (menu.from === 'actions'){ menu.page = 'actions'; menu.i = 0; } else closeMenu(); } }]; }
  if (menu.page === 'strike') return strikeItems();
  if (menu.page === 'actions'){
    const t = hero(), fight = !!state.combat.active, mine = myTurn(), tg = fight ? target() : null, spent = fight && mine && !attacksLeft();
    const end = fight ? [{ label:'End your turn', group:' ', icon:'⏭', sub:spent ? 'Your action is spent' : 'Done for this round', off:!mine, run:() => { closeMenu(); endHeroTurn(); } }] : [];
    const ta = (k, label) => ({ label, group:'Move & defend', ...actBits(k), off:!mine || (k !== 'stand' && !attacksLeft()), run:() => { closeMenu(); heroTurnAct(k); } });
    const slots = (t?.resources || []).filter(r => r.slot).map(r => `L${r.slot} ${t.res?.[r.id] ?? 0}/${r.max}`).join(' · ');
    const potions = pack().filter(i => i.potion).reduce((n, i) => n + i.qty, 0);
    return [
      ...(spent ? end : []),
      ...(fight ? (t?.attacks || []).map((a, i) => ({ label:a.n, group:'Strike', ...attackBits(a, tg ? `${reachWords(t, tg, i)}${attackForWith(t, tg, i) ? ` (${tg.name})` : ''}` : '', tg && attackForWith(t, tg, i) ? oddsBits(strikeOdds(i, tg)) : null),
        aim:{ atk:i }, off:!mine || !attacksLeft(), run:() => { closeMenu(); rt.atk = i; heroAttack(); } })) : []),
      ...(spellList().length ? [{ label:`${magicWord(hero())}…`, group:'Magic', icon:'✦', sub:fight && (rt.cast || rt.attacks) ? 'Your action is spent' : slots || 'Cantrips', info:'Every spell you know, by level, with what it does and what it costs.', run:() => { menu.page = 'spells'; menu.i = 0; } }] : []),
      // 🤚 Shove, in place of a strike: the one aimed at, if they're beside you (engine/shove.js)
      ...(fight && tg && Math.max(Math.abs(tg.x - t.x), Math.abs(tg.y - t.y)) <= Math.max(1, tg.size || 1) ? [
        { label:'Shove: push back', group:'Strike', icon:'🤚', sub:`${tg.name} 5 ft away, unless they save`, info:'In place of a strike: they make a Strength or Dexterity save against 8 + your Strength + your proficiency, or are pushed 5 feet straight away from you (out of your reach, or theirs).', off:!mine || !attacksLeft(), run:() => { closeMenu(); heroShove('push'); } },
        { label:'Shove: knock prone', group:'Strike', icon:'🤚', sub:`${tg.name} down: your blows have advantage`, info:'In place of a strike: the same save, or they fall prone. Blows from beside a prone creature have advantage; it stands up with half its move.', off:!mine || !attacksLeft(), run:() => { closeMenu(); heroShove('prone'); } }] : []),
      ...(fight ? [ta('dash', 'Dash'), ta('disengage', 'Disengage'), ta('dodge', 'Dodge'),
        ...((t?.conds || []).some(c => c.n === 'prone') ? [ta('stand', 'Stand up')] : [])] : []),
      ...heroFeatures().map(f => ({ label:f.n, group:'Your gifts', ...featBits(f), off:!!f.why, run:() => { closeMenu(); heroFeature(f.id); } })),
      ...(potions ? [{ label:'Drink a potion', group:'Items', icon:'🧪', sub:`${potions} in the pack · 2d4+2 HP${fight && rt.bonus ? ' · one a turn' : ''}`, tags:[tag('bonus')], info:'A Potion of Healing: drink it yourself, or pour it into someone beside you from the pack.', off:fight && (!mine || rt.bonus), run:() => { closeMenu(); usePotion(); } }] : []),
      ...(spent ? [] : end),
      { label:'Back', icon:'←', run:closeMenu }];
  }
  return [
    { icon:'▶', label:'Carry on', run:closeMenu },
    ...(levelReady() ? [{ icon:'⬆', label:`Level up to ${partyLevel()}`, sub:'New hit points, and choices', off:fight, run:go('level') }] : []),
    { icon:'🧭', label:'Travel…', sub:road ? 'You are on the road already' : fight ? 'Not in a fight' : 'Take a road out of here', off:road || fight, run:go('travel') },
    { icon:'☾', label:road ? 'Rest an hour' : 'Rest the night', sub:fight ? 'Not in a fight' : road ? 'A short rest by the road (something may find you)' : 'Everyone whole again by morning', off:fight, run:() => { closeMenu(); rest(); } },
    { icon:'🎒', label:'The pack', sub:`${coinsGp()} gp · ${pack().length} things`, run:go('pack') },
    { icon:'📜', label:'The journal', sub:'Quests, and what your companions think', run:go('journal') },
    { icon:'👤', label:'Your hero', sub:'Your sheet, a page at a time (Select)', run:() => { closeMenu(); openHero(); } },
    { icon:'📕', label:'The bestiary', sub:(() => { const b = beastBook(); return `${b.seen} of ${b.of} seen · ${b.mastered} known well`; })(), run:() => { closeMenu(); openBeasts(); } },
    { icon:'🏆', label:'Achievements', sub:(() => { const t = trophyShelf().score; return `${t.got} of ${t.of}`; })(), run:() => { closeMenu(); const t = trophyShelf(); openTrophies(t.shelf, t.score); } },
    ...(spellList().length ? [{ icon:'✦', label:magicWord(hero()), run:go('spells') }] : []),
    { icon:'💾', label:'Save', run:() => { saveNow(); toast('Saved.'); closeMenu(); } },
    { icon:'🗂', label:'Save states', sub:'Three slots of your own, to come back to', run:go('states') },
    { icon:'🎮', label:'Controls', run:go('keys') },
    { icon:'🕹', label:'Handheld & camera', sub:hhOn() ? 'On: the phone is the controller' : 'Play on the phone as if it were a pocket console', run:go('handheld') },
    { icon:'🚪', label:'Leave to the threshold', sub:'Saved: carry on from the start page', run:() => { closeMenu(); leaveWander(); import('./events.js').then(m => m.showStart()); } },
  ];
}
const openMenu = (page = 'main') => { menu.open = true; menu.page = page; menu.from = page; menu.i = 0; };   // (from: a page opened by its own button closes on Ⓑ)
const closeMenu = () => { menu.open = false; };

// 📕 the bestiary, and each creature's face as it's drawn (one at a time, so the book opens at once)
function openBeasts(){
  const b = beastBook(); openBestiary(b);
  const todo = b.entries.filter(e => e.tier > 0).map(e => e.bid);
  const next = () => { const bid = todo.shift(); if (!bid || !bestiaryOpen()) return; try { const f = faceOf(makeMonster(bid, 0, 0, 0)); if (f) setBestiaryFace(bid, f); } catch {} setTimeout(next, 30); };
  setTimeout(next, 60);
}
/* ---------- input ---------- */
function press(b){
  if (skipBoot()) return;   // (the press that skips the handheld's boot does only that)
  if (b === 'states' && pocketOpen()) closePocketSheet();   // (Select, then Start with it: the save states, not the sheet)
  if (pocketOpen()){ pocketPress(b === 'ls' ? 'back' : b); renderHud(); return; }   // (Muse's pocket sheet takes every press while it's open)
  // 🏆 Muse's screens between the fights take every press while one is open (a real Escape arrives here as Ⓑ)
  const sb = b === 'ls' || b === 'start' ? 'b' : b;
  if (victoryOpen()){ victoryPress(sb); renderHud(); return; }
  if (defeatOpen()){ defeatPress(sb); renderHud(); return; }
  if (deathSaveOpen()){ deathSavePress(sb); renderHud(); return; }   // 💀 (Muse's ui/deathsave.js: any press skips it)
  if (callingPickerOpen()){ callingPickerPress(sb); renderHud(); return; }
  if (levelUpOpen()){ levelUpPress(sb); renderHud(); return; }
  if (bestiaryOpen()){ bestiaryPress(sb); renderHud(); return; }
  if (trophiesOpen()){ trophiesPress(sb); renderHud(); return; }
  // the moment a fight breaks out: the fight's buttons wait (a press still down from walking or talking strikes nothing)
  if (opening() && ['a', 'x', 'y', 'yprev', 'endturn', 'lt', 'rt'].includes(b)) return;
  coachDone();
  coachLearn({ a:state.combat.active && menu.page === 'strike' && menu.open ? 'strike' : null, lt:'cast', y:'aim', yprev:'aim', x:'actions', start:'menu', rs:'camera', turnl:'camera', turnr:'camera', lb:'camera', rb:'camera', back:'sheet', endturn:'endTurn' }[b]);
  if (b === 'states' || (b === 'start' && padHeld.back)){ openMenu('states'); return; }
  if (b === 'rs'){ camView(); return; }
  if (b === 'turnl' || b === 'turnr' || b === 'lb' || b === 'rb'){   // (L and R: the hero turns where they stand, the camera behind them)
    camTurn(b === 'turnl' || b === 'lb' ? 1 : -1);
    if (state.combat.active){ const f = foeAhead(hero(), targets()); if (f && f.id !== target()?.id) aimAt(f.id); }   // (turned toward a foe: that's whom they face)
    return; }
  if (b === 'in' || b === 'out'){ camCrane(b === 'in' ? -1 : 1); return; }
  if (menu.open){
    const items = menuItems();
    if (b === 'a'){ const o = items[menu.i]; if (o && !o.off){ tune('menuOk'); o.run(); } }
    else if (b === 'x' && menu.from === 'actions') closeMenu();   // (X again puts its menu away)
    else if (b === 'b' || b === 'start' || (b === 'lt' && menu.page === 'spells')){ if (menu.page === 'give'){ menu.page = 'pack'; menu.i = 0; } else if (menu.page === 'load'){ menu.page = 'states'; menu.i = 0; } else if (menu.page === 'spells' && menu.from === 'actions'){ menu.page = 'actions'; menu.i = 0; } else if (menu.page !== 'main' && menu.page !== menu.from){ menu.page = 'main'; menu.i = 0; } else closeMenu(); }
    return;
  }
  const tv = talkView();
  if (tv){
    if (b === 'a') say(tv.options[talkSel.i]?.k);
    else if (b === 'b') say('bye');
    return;
  }
  if (b === 'start'){ openMenu(); return; }
  if (b === 'back'){ openHero(); return; }
  if (b === 'x'){ openMenu('actions'); return; }
  if (b === 'y' || b === 'yprev'){ if (!aim(b === 'y' ? 1 : -1)) toast('Nobody in sight.'); return; }
  if (b === 'endturn'){ endHeroTurn(); return; }
  // the shortcuts (a controller's triggers and stick, the keys)
  if (b === 'ls'){ openMenu('journal'); return; }
  if (b === 'lt'){ if (spellList().length) openMenu('spells'); else toast('No spells.'); return; }
  if (b === 'rt' && (state.combat.active || pack().some(i => i.potion))){ usePotion(); return; }
  if (b === 'a'){ if (!state.combat.active && dismissCard()) return; const h = state.combat.active ? fightAction() : hereAction(); if (h){ h.run(); talkSel.i = 0; aAt = performance.now(); } }   // (in a fight, B puts a card away: A is for the fight)
  else if (b === 'b') dismissCard();
}
let aAt = 0;
const openHero = () => openPocketSheet({ token:hero(), sheet:sheetOf(), extras:{}, onClose:null });
/* What Ⓐ does in a fight (the line on the screen says it): strike the target, walk closer, or, the action spent, end
   the turn. A second press straight after a strike doesn't end it (a double tap shouldn't throw away the move). */
function fightAction(){
  const t = hero(); if (!t) return null;
  if (!myTurn()){ const c = currentTurn(); return { label:c ? `${c.name}'s turn…` : '…', run:() => {}, idle:true }; }
  const tg = target();
  if (opening()) return { label:'…', run:() => {}, idle:true };
  if (attacksLeft() && tg && attackFor(t, tg) >= 0) return { label:`Attack ${tg.name}…`, run:() => openStrike() };
  if (attacksLeft() && tg) return { label:`Attack ${tg.name}… (out of reach: walk closer)`, run:() => openStrike() };
  if (attacksLeft()) return { label:'Nobody in sight', run:() => toast('Nobody in sight.'), idle:true };
  return { label:'End your turn', run:() => { if (performance.now() - aAt < 1200) return toast(rt.cast ? 'You have cast this turn: Ⓐ again ends your turn.' : 'You have struck this turn: Ⓐ again ends your turn.'); endHeroTurn(); } };
}
/* ---------- ⚔ choosing the blow ----------
   Ⓐ on your turn doesn't strike straight away: it opens the choice of what to strike with, each attack with its
   bonus, its damage and whether it reaches the target from here (the one that would be used at the top). Ⓐ again
   strikes with it; Ⓑ puts the choice away and nothing is spent. A tap on a foe aims; a second tap opens the choice. */
function openStrike(){
  if (opening()) return;
  if (!myTurn()) return toast('Not your turn yet.');
  if (!attacksLeft()) return toast(rt.cast ? 'You have cast this turn.' : 'You have struck this turn.');
  if (!target()) return toast('Nobody in sight.');
  openMenu('strike'); menu.i = 0;
}
// How the attack i reaches the target from where the hero stands, in words
function reachWords(t, tg, i){
  const a = t?.attacks?.[i]; if (!a || !tg) return '';
  let r; try { r = rangeCheck(t, tg, a); } catch { return ''; }
  if (!r.ok) return r.why || 'out of reach';
  if (r.kind === 'ranged') return r.long ? 'long range: at disadvantage' : r.close ? 'a foe at your elbow: at disadvantage' : 'in range';
  return 'in reach';
}
function strikeItems(){
  const t = hero(), tg = target(); if (!t) return [{ label:'Back', run:closeMenu }];
  const best = tg ? attackFor(t, tg) : -1, ok = i => { try { return !!tg && rangeCheck(t, tg, t.attacks[i]).ok; } catch { return false; } };
  const list = (t.attacks || []).map((a, i) => ({ a, i, r:ok(i) })).sort((x, y) => (y.i === best) - (x.i === best) || y.r - x.r);
  const others = targets().length;
  return [...list.map(({ a, i, r }) => ({ label:a.n, ...attackBits(a, reachWords(t, tg, i), r ? oddsBits(strikeOdds(i, tg)) : null), ...(r ? {} : { tone:'far' }),
      aim:{ atk:i }, off:!r || !myTurn() || !attacksLeft(), run:() => { closeMenu(); heroAttack(i); } })),
    { label:'Another target', group:' ', icon:'🎯', sub:others > 1 ? `${others} in sight (${hhOn() ? 'Y' : 'Ⓨ / Tab'} changes it too)` : 'Nobody else in sight', off:others < 2, run:() => { aim(1); menu.i = 0; } },
    { label:'Back', icon:'←', sub:'Nothing is spent', run:closeMenu }];
}

/* ---------- ⚔ a fight breaks out ----------
   A moment for it before anyone acts (game/wander.js opening): bars close in at the top and bottom, a red slash, what
   started it and who's there, the order they'll go in; the ground it's fought over darkens round its edge
   (render/fightzone.js) and the camera draws back to take it in, then comes back to the hero. */
let openedAt = 0;
function renderOpening(){
  const o = opening(), el = $('#wdOpen'); if (!el) return;
  if (!o){ if (!el.classList.contains('hidden')){ el.classList.add('hidden'); el.innerHTML = ''; } document.body.classList.remove('wd-opening'); return; }
  if (openedAt === o.at) return; openedAt = o.at;
  document.querySelectorAll('#cardLayer .pop').forEach(c => c.remove());   // (what was up before is put away: the fight has the screen)
  const order = (state.combat.order || []).map(tokById).filter(x => x && !x.flags?.gone), first = order[0], me = hero();
  el.innerHTML = `<div class="bar top"></div><div class="bar bot"></div><div class="slash"></div>
    <div class="box"><div class="k">⚔ To arms</div><div class="ttl">${esc(o.title)}</div>${o.flair ? `<div class="fl">${esc(o.flair)}</div>` : ''}<div class="foes">${esc(o.foes)}</div>
    <div class="ord">${order.map((x, n) => `<span class="${x.kind === 'monster' ? 'foe' : 'pal'}" style="animation-delay:${(.55 + n * .1).toFixed(2)}s">${n + 1}. ${esc(x.name)}</span>`).join('')}</div>
    <div class="go">${!first ? '' : first.id === me?.id ? 'You go first.' : o.surprise === 'party' ? `Caught off guard: ${esc(first.name)} goes first.` : `${esc(first.name)} goes first.`}</div></div>`;
  el.classList.remove('hidden'); document.body.classList.add('wd-opening');
}
// The ground it's fought over, and on the hero's turn where they can still walk (from the frame, a few times a second)
let zoneOf = null;
function fightGround(){
  const h = hero(), c = state.combat;
  if (!c?.active || !h){ if (zoneOf){ zoneOf = null; clearFightFx(); camBack(); } return; }
  const all = (c.order || []).map(tokById).filter(o => o && o.floor === h.floor && !o.flags?.gone && !((o.dead || o.hp <= 0) && o.kind === 'monster'));
  if (!all.length) return;
  // round the middle of them, far enough out to hold them all (it grows if one goes past its edge)
  if (!zoneOf || zoneOf.L !== h.floor || all.some(o => Math.hypot(o.x - zoneOf.cx, o.y - zoneOf.cy) > zoneOf.r - 1)){
    const cx = Math.round(all.reduce((n, o) => n + o.x, 0) / all.length), cy = Math.round(all.reduce((n, o) => n + o.y, 0) / all.length);
    const r = Math.min(14, Math.max(5, Math.ceil(Math.max(...all.map(o => Math.hypot(o.x - cx, o.y - cy)))) + 3));
    const fresh = !zoneOf; zoneOf = { L:h.floor, cx, cy, r, wide:fresh || zoneOf.wide };
    setFightZone(h.floor, cx, cy, r, { fresh });
    if (fresh) camWide(r);
  }
  if (zoneOf.wide && !opening()){ zoneOf.wide = false; camBack(); }
  // the hero's turn: the squares they can still walk to
  const left = myTurn() && !opening() && !heroBusy() ? moveAllowance(h) : 0;
  // (⚠ in red, those that would let a foe swing at them as they leave its reach: engine/movement.js provokers)
  const mk = left > 0 ? `${h.floor}:${h.x}:${h.y}:${left}:${state.combat.round}:${state.combat.idx}:${h.disengaged ? 1 : 0}` : '';
  if (left > 0 && mk !== moveSquaresKey()){ const f = state.floors[h.floor], R = reach(h.floor, h.x, h.y, left, h.id);
    const sq = [...R.dist.keys()].filter(i => R.dist.get(i) <= left && i !== h.y * f.W + h.x && !tokenAt(h.floor, i % f.W, (i / f.W) | 0));
    let risky = []; try { risky = sq.filter(i => provokers(h, pathTo(R.par, f.W, i)).length); } catch {}
    showMoveSquares(h.floor, sq, mk, risky); }
  else if (!(left > 0)) clearMoveSquares();
  fightAim();
}
/* 🎯 Before a blow or a spell: who it would reach (rings on the ground), the odds over the one aimed at, and the
   squares a spell's area would cover, tinting who it would catch (friends in it in orange). What's aimed: the
   choice highlighted in the open menu, else the attack Ⓐ would use. */
function fightAim(){
  const h = hero();
  if (!myTurn() || opening() || heroBusy() || !h){ clearAim(); return; }
  const tg = target(), items = menu.open ? menuItems() : null, hl = items?.[menu.i]?.aim || null;
  // a spell (not a strike) highlighted
  if (hl?.cast !== undefined){
    const sp = h.casts?.[hl.cast], c = sp && areaCatch(h, sp);
    showOdds(null, '');
    if (c){ showAreaSquares(h.floor, [...c.squares], c.key); showMarks([...c.foes.map(o => ({ id:o.id, k:'caught' })), ...c.friends.map(o => ({ id:o.id, k:'friend' }))]); return; }
    showAreaSquares(0, [], '');
    if (sp && !['heal', 'buff', 'util'].includes(sp.k) && tg) showMarks([{ id:tg.id, k:Math.max(Math.abs(tg.x - h.x), Math.abs(tg.y - h.y)) <= Math.max(1, Math.ceil((sp.r ?? 60) / 5)) ? 'target' : 'far' }]);
    else showMarks([]);
    return;
  }
  showAreaSquares(0, [], '');
  if (!attacksLeft() || !tg){ showMarks([]); showOdds(null, ''); return; }
  const i = hl?.atk ?? (attackFor(h, tg) >= 0 ? attackFor(h, tg) : rt.atk ?? 0), a = h.attacks?.[i]; if (!a){ clearAim(); return; }
  const reaches = o => { try { return rangeCheck(h, o, a).ok; } catch { return false; } };
  const od = reaches(tg) ? strikeOdds(i, tg) : null;
  showMarks([{ id:tg.id, k:od?.ok ? 'target' : 'far' }, ...targets().filter(o => o.id !== tg.id && reaches(o)).map(o => ({ id:o.id, k:'reach' }))]);
  showOdds(tg.id, od?.ok ? `${od.edge.mark}${od.pct}` : 'out of reach', od?.ok ? ODDS_COL[oddsTone(od.hit)] : '#ff8a6a');
}
// Where a spell's area would fall if cast now (at the target, as game/wander.js heroCast aims it), and who's in it
function areaCatch(h, sp){
  const A = sp && areaOf(sp), tg = target(); if (!A || ['heal', 'buff', 'util'].includes(sp.k) || !tg) return null;
  let R; try { R = areaSquares(h, A, { x:tg.x, y:tg.y }); } catch { return null; }
  const who = caughtIn(h, A, R.squares).filter(o => !o.dead && o.hp > 0), foes = who.filter(o => side(o) !== side(h)), friends = who.filter(o => side(o) === side(h));
  const words = `${R.ok ? '' : `${R.why} · `}catches ${foes.length} foe${foes.length === 1 ? '' : 's'}${friends.length ? ` · ⚠ ${friends.map(o => o.id === h.id ? 'you' : o.name).join(', ')} too` : ''}`;
  return { squares:R.squares, foes, friends, words, key:`${h.floor}:${sp.n}:${h.x},${h.y}>${tg.x},${tg.y}:${R.squares.size}`,
    info:`✺ <b>${esc(words)}</b> <span class="muted">(aimed at ${esc(tg.name)}; the squares are lit on the ground)</span>` };
}
// ⚔ A blow felt: the hero's own, or one on the hero, jolts the camera (what's drawn over them: ui/fightfx.js)
function blowFelt(e){
  const h = hero(); if (!h || !wandering() || !e?.actor || !e.target || !['hit', 'critical'].includes(e.trigger)) return;
  if (e.trigger === 'critical' && e.actor.id === h.id) camBeat(900, .28);   // 🎬 your crit: the camera pushes in
  if ((e.actor.id === h.id || e.target.id === h.id) && !gfx.calm) rt.jolt = { at:performance.now() + 330, k:e.trigger === 'critical' ? 1.7 : 1 };
}
// 🗣 A line to say, as a choice: what kind of line it is (an icon), and the check it needs as a tag, not tacked on
const TALK_IC = { bye:'←', quest:'📜', ask:'❝', pitch:'🤝' };
function talkRow(o, k){
  const m = /\s*\(([A-Z][\w ]*?(?: or [A-Z][\w ]*?)?), (\d+)\)\s*$/.exec(o.label || '');
  return { label:`${k + 1}. ${m ? o.label.slice(0, m.index) : o.label}`, icon:TALK_IC[o.k] || '❖', off:!!o.off, sub:typeof o.off === 'string' ? o.off : '',
    tags:m ? [tag('check', `🎲 ${m[1]} ${m[2]}`)] : [] };
}
function say(k){ if (!k) return; const r = chooseTalk(k); talkSel.i = 0; if (r === 'joined') toast('A companion follows you now.'); }
function dismissCard(){ const c = document.querySelector('#cardLayer .pop:last-child'); if (c) c.remove(); return !!c; }
function step(dx, dy){
  if (skipBoot()) return;
  if (pocketOpen()){ pocketPress(dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right'); return; }
  { const d = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
    if (callingPickerOpen()){ callingPickerPress(d); return; }
    if (victoryOpen() || defeatOpen() || levelUpOpen()) return; if (bestiaryOpen()){ bestiaryPress(d); return; } if (trophiesOpen()){ trophiesPress(d); return; } }
  if (menu.open){ if (dy){ const n = Math.max(0, Math.min(menuItems().length - 1, menu.i + dy)); if (n !== menu.i) tune('menuMove'); menu.i = n; } return; }
  const tv = talkView(); if (tv){ if (dy) talkSel.i = Math.max(0, Math.min(tv.options.length - 1, talkSel.i + dy)); return; }
  if (!stepHero(dx, dy)) pending = { dx, dy, until:performance.now() + 260 };
}
/* ---------- 🎥 the follow camera, seeing through, a hit felt (ui/followcam.js, shared with the table's handheld) ----------
   Where to look: where the game says (game/wander.js follow); with someone else to frame (what the hero just struck
   or cast at, or whoever else is acting in a fight), halfway between the two. */
export { camTurn, camView, camCrane };
/* The camera leans a little ahead of the hero while they walk (back to them when they stop), and gives a small shake
   when they walk into a wall. */
const lead = { x:0, z:0 };
function wanderCam(dt, pad){
  const h = hero(), ct = state.combat.active && currentTurn(), now = performance.now();
  const lk = rt.look && now < rt.look.until && tokById(rt.look.id);
  const going = !state.combat.active && now - feet.at < 650, k = 1 - Math.exp(-dt * 2.5);
  lead.x += ((going ? feet.dx * .9 : 0) - lead.x) * k; lead.z += ((going ? feet.dy * .9 : 0) - lead.z) * k;
  const b = rt.bump, shake = b && now - b.at < 200 ? Math.sin((now - b.at) * .09) * .06 * (1 - (now - b.at) / 200) : 0;
  // (it follows the figure where it is, mid-step too, not the square it's headed for: chasing each square as it was
  // chosen made the view surge and settle with every step)
  const j = rt.jolt, jt = j ? now - j.at : -1, jolt = jt >= 0 && jt < 260 ? Math.sin(jt * .11) * .09 * j.k * (1 - jt / 260) : 0;   // (a blow felt)
  // (a fight breaking out: the middle of the ground it's fought over, from further back: fightGround)
  const op = opening() && zoneOf, at = op ? { x:wx(zoneOf.cx), y:floorY(zoneOf.L), z:wz(zoneOf.cy), rate:2.5 } : (h && miniFocus(h, rt.focus?.rate || 7)) || rt.focus;
  const focus = at && { ...at, x:at.x + lead.x + shake * (b?.dx || 0) + jolt, z:at.z + lead.z + shake * (b?.dy || 0) + jolt * .6 };
  // ⚔ in a fight (past its opening), over the hero's shoulder at what they face: a face pointed at in the turn order,
  // a foe on its turn, or the one aimed at (ui/followcam.js)
  const subject = state.combat.active && !op && h && !h.dead ? (lk || (ct && ct.kind === 'monster' ? ct : target())) : null;
  camFrame(dt, pad, { focus, me:h, other:op ? null : lk || (ct && ct.id !== h?.id ? ct : null), otherRate:lk ? 4 : 3, fight:state.combat.active && !op ? { subject } : null });
}
/* 👣 Each step the party takes: what it leaves (a puff, a splash, a print, a rustle: render/stepfx.js) and, for the hero,
   what it sounds like; a bump into a wall is heard too. */
const feet = { at:0, dx:0, dy:0, bumpSeen:0 }, stood = new Map();
const STEP_SOUND = { snow:'crunch', splash:'splash', mud:'splash', rustle:'rustle' };
function feelSteps(now){
  const h = hero(); if (!h) return;
  const gw = groundWeather(), indoors = state.meta.template === 'interior';
  for (const m of members()){
    if (!m || m.dead) continue;
    const k = `${m.floor}:${m.x}:${m.y}`, was = stood.get(m.id); stood.set(m.id, k);
    if (!was || was === k) continue;
    const [fl, px, py] = was.split(':').map(Number);
    if (fl !== m.floor || Math.max(Math.abs(px - m.x), Math.abs(py - m.y)) > 1) continue;   // (a crossing, or put down elsewhere: no step)
    const kind = underfoot(state.floors[m.floor], m.x, m.y, { indoors, ...gw });
    stepFx(m.floor, m.x, m.y, kind, m.x - px, m.y - py);
    if (m === h){ sfx(STEP_SOUND[kind] || 'step', false); Object.assign(feet, { at:now, dx:m.x - px, dy:m.y - py }); }
  }
  if (rt.bump && rt.bump.at > feet.bumpSeen){ feet.bumpSeen = rt.bump.at; sfx('bump', false); }
  fordStones(h.floor, state.floors[h.floor], state.meta.mapId || state.meta.seed);
}
/* 🐈 The valley's animals (Muse's render/critters.js): put down when the hero comes to a floor (the same map, the same
   animals), moving and minding the party every frame, gone when the Wanderer is put away. Scenery only. */
const CRITTERS = { village:'village', town:'town', road:'road', woods:'woods', camp:'camp', interior:'interior', church:'interior', crypt:'crypt', castle:'crypt' };
let critKey = '';
function animals(dt){
  const h = hero(); if (!h) return;
  const key = `${state.meta.mapId || state.meta.seed}:${h.floor}`;
  if (key !== critKey){ critKey = key; let n = 7; for (const c of key) n = (n * 31 + c.charCodeAt(0)) >>> 0;
    setCritters(h.floor, { kind:state.meta.template === 'journey' ? 'road' : CRITTERS[kindOf(h.floor)] || 'village', seed:n }); }
  updateCritters(dt, { party:members().filter(m => m && !m.dead).map(m => ({ x:m.x, y:m.y, floor:m.floor })), hour:valley().hour ?? 12, rain:!!groundWeather().wet });
}
/* ---------- the handheld's buttons ----------
   One button, one job, whatever's going on (the line on the screen says what A does just now). */
function hhLegend(){
  return { a:{ label:'OK' }, b:{ label:'Back' }, x:{ b:'x', label:'Actions' }, y:{ b:'y', label:targets().length ? 'Target' : '' },
    select:{ label:'Hero' }, view:{ label:'Camera' }, start:{ label:'Menu' } };
}
const HH_HELP = 'Each button does one thing. D-pad: walk (slide your thumb round it for the diagonals), or move through a menu. A: do what the line on the screen says (talk, climb, look, end your turn), or choose; in a fight it opens the choice of what to strike with, and A again strikes. B: back, or put a card away. X: Actions: each weapon, spells, Dash, Disengage, Dodge, features like Action Surge, a potion, End turn. Y: the next target. L and R: turn your hero where they stand; the camera stays behind them. Select: your hero. View: the next camera view. Start: this menu. Select and Start together: the save states. Touch works too: drag on the screen to look round (the camera eases back behind your hero), pinch to zoom, tap to walk or pick a foe, tap any line of a menu.';
let pending = null, padMem = {}, hhMem = {}, lastTick = 0, lastFrame = 0, glintAt = 0, musicAt = 0;
const padHeld = { back:false };   // (Back held while Start goes down: the save states)
// which way "up on the stick" walks: away from the camera; but in a list or a screen, up is up (the shoulder camera in
// a fight can stand at any angle)
const yaw = () => menu.open || talkView() || pocketOpen() || victoryOpen() || defeatOpen() || levelUpOpen() || bestiaryOpen() || trophiesOpen() ? 0 : camYaw();
let hudOn = false, xpShown = 0;
export const xpFloatsShown = () => xpShown;   // (for the tests: the "+N XP" shown over the fallen)
/* ---------- 🕹 the tunes and the coach (ui/hhlife.js) ---------- */
const was = { turn:false, fight:false, lvl:false, quests:-1, done:-1, round:0, banner:false };
function wanderMoments(){
  const w = W(), h = hero(); if (!w || !h) return;
  const mine = myTurn(), f = !!state.combat.active, lvl = levelReady(), q = w.quests?.length || 0, d = (w.quests || []).filter(x => x.done).length;
  if (mine && !was.turn){ tune('turnStart'); was.banner = true; }
  // ⚔ the banner: once the fight's opening has played, and not over a screen or a card that's up (ui/turnbanner.js)
  if (!mine || !f) was.banner = false;
  else if (was.banner && !opening() && !menu.open && !talkView() && !victoryOpen() && !defeatOpen() && !levelUpOpen() && !diceBusy()){
    const r = state.combat.round || 1; turnBanner({ title:'Your turn', sub:r > 1 && r !== was.round ? `Round ${r}` : '' }); was.round = r; was.banner = false; }
  if (!f) was.round = 0;
  if (!f && was.fight) tune(members().every(m => m.dead || m.hp <= 0) ? 'defeat' : 'victory');
  if (lvl && !was.lvl) tune('levelUp');
  if (was.quests >= 0 && q > was.quests) tune('questNew');
  if (was.done >= 0 && d > was.done) tune('questDone');
  Object.assign(was, { turn:mine, fight:f, lvl, quests:q, done:d });
}
function wanderSnapshot(){
  const h = hero(); if (!h) return null;
  const tg = state.combat.active ? target() : null, i = tg ? attackFor(h, tg) : -1;
  const slots = (h.resources || []).filter(r => r.slot).reduce((n, r) => n + (h.res?.[r.id] ?? 0), 0);
  return { where:'wander', fight:!!state.combat.active, myTurn:myTurn(), hp:Math.max(0, h.hp), maxHp:h.maxHp, down:h.dead || h.hp <= 0,
    conditions:(h.conds || []).map(c => c.n), moveLeft:state.combat.active ? moveAllowance(h) * 5 : 30,
    target:tg ? { name:tg.name, inReach:i >= 0, seen:true } : null, foesSeen:state.combat.active ? targets().length : 0,
    alliesDown:members().filter(m => m.id !== h.id && (m.dead || m.hp <= 0)).length, hasSpells:spellList().length > 0, slotsLeft:slots,
    cantrips:(h.casts || []).filter(c => !c.l).length, hasHealing:(h.casts || []).some(c => c.k === 'heal'), potions:pack().filter(x => x.potion).reduce((n, x) => n + x.qty, 0),
    cardUp:!!document.querySelector('#cardLayer .pop') || !!talkView(), menuOpen:menu.open, sheetOpen:false, waitingOnDM:false };
}
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - (lastFrame || now)) / 1000); lastFrame = now;
  const gp = [...(navigator.getGamepads?.() || [])].find(g => g && g.connected);
  if (!wandering()){ if (hudOn){ hudOn = false; show('wanderHud', false); clearFightFx(); camBack(); document.body.classList.remove('wd-fighting'); closeLook(); feelHits(null); coachHide(); clearGlints(); clearStepFx(); clearCritters(); critKey = ''; musicStop(); } return; }
  hudOn = true;
  let pad = null;
  if (gp){
    pad = readPad(gp); padHeld.back = !!pad?.b.back; const r = padIntents(pad, now, padMem, { yaw:yaw() }); padMem = r.mem;
    for (const it of r.intents) it.k === 'step' ? step(it.dx, it.dy) : press(it.b);
  }
  if (hhOn() && hhHost() === 'wander'){ const r = padIntents(hhPad(), now, hhMem, { yaw:yaw() }); hhMem = r.mem; for (const it of r.intents) if (it.k === 'step') step(it.dx, it.dy); }
  try { wanderCam(dt, pad); } catch (e){ console.warn(e); }
  // ✨ the glints the hero has noticed (game/finds.js), twinkling; the bubbles over heads
  if (now - glintAt > 250){ glintAt = now; try { const h = hero(); showGlints(h.floor, glintsSeen()); } catch (e){ console.warn(e); } }
  tickGlints(now);
  try { feelSteps(now); } catch (e){ console.warn(e); }
  tickStepFx(now);
  try { animals(dt); } catch (e){ console.warn(e); }
  if (now - musicAt > 1000){ musicAt = now; try { musicTick(hero()); } catch (e){ console.warn(e); } }   // (🎼 ui/regionmusic.js)
  try { lookThrough(hero(), now); } catch (e){ console.warn(e); }
  feelHits(hero(), gp);
  try { wanderMoments(); coachTick(wanderSnapshot); } catch (e){ console.warn(e); }
  if (pending){ if (now > pending.until) pending = null; else if (stepHero(pending.dx, pending.dy)) pending = null; }
  walkHeld();
  if (now - lastTick > 180){ lastTick = now; try { fightTick(now); } catch (e){ console.warn(e); } try { fightGround(now); } catch (e){ console.warn(e); } try { memorialSteps(); } catch (e){ console.warn(e); } renderHud(); }
}
let held = null;   // (the walking key held down, if one is)
function onKeyUp(e){ if (held && e.key.toLowerCase() === held.key) held = null; }
function walkHeld(){
  if (!held || pending || state.combat.active || menu.open || pocketOpen() || talkView() || heroBusy()) return;
  const it = keyIntent(held.key, { shift:held.shift, yaw:yaw() }); if (it?.k === 'step') step(it.dx, it.dy);
}
function onKey(e){
  if (!wandering() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || !$('#charModal')?.classList.contains('hidden')) return;
  if (callingPickerOpen()) return;   // (the picker reads the keyboard itself: ui/callingpicker.js)
  if (menu.open || talkView()){ if (/^[1-9]$/.test(e.key)){ const k = +e.key - 1; if (menu.open){ menu.i = k; press('a'); } else { talkSel.i = k; press('a'); } e.preventDefault(); e.stopPropagation(); return; } }
  const it = keyIntent(e.key, { shift:e.shiftKey, yaw:yaw() }); if (!it) return;
  e.preventDefault(); e.stopPropagation();
  // a held key walks on, square after square, from the first step (the frame keeps it going: no wait for the
  // keyboard's own repeat to start, and no extra steps from it)
  if (it.k === 'step'){ if (e.repeat && held) return; held = { key:e.key.toLowerCase(), shift:e.shiftKey }; }
  it.k === 'step' ? step(it.dx, it.dy) : press(it.b);
  renderHud();
}
function onClick(e){
  const b = e.target.closest('[data-act^="wd"]'); if (!b) return;
  const act = b.dataset.act, k = b.dataset.k, id = b.dataset.id;
  switch (act){
    case 'wdBegin': { const h = myHero(id); if (h){ $('#startModal').classList.add('hidden'); startWander(h); } } break;
    case 'wdContinue': if (continueWander()) $('#startModal').classList.add('hidden'); else toast('There is no Wanderer saved in this browser.'); break;
    case 'wdMenu': menu.open ? closeMenu() : openMenu(); break;
    case 'wdPick': { menu.i = +k; press('a'); } break;
    case 'wdSay': say(k); break;
    case 'wdA': press('a'); break;
    case 'wdAim': aim(+k || 1); break;
    case 'wdWeapon': { const a = nextWeapon(); if (a) toast(`Ready: ${a.n}`); } break;
    case 'wdX': press('x'); break;
    case 'wdDodge': heroDodge(); break;
    case 'wdEnd': endHeroTurn(); break;
    case 'wdSpells': press('lt'); break;
    case 'wdPotion': usePotion(); break;
    case 'wdLevel': if (!state.combat.active) openMenu('level'); break;
    default: return;
  }
  e.stopPropagation(); renderHud();
}
// A tap on the map: on a foe in a fight, aim at it (tap again to strike); on a waiting companion, talk; else walk there.
function onTap(tile, tokId){
  if (menu.open || talkView()) return;
  const o = tokId && tokById(tokId), t = hero(); if (!t) return;
  if (o?.kind === 'monster' && state.combat.active){ if (rt.target === o.id && !opening()) openStrike(); else rt.target = o.id; return; }
  if (o?.flags?.companion && o.kind === 'npc' && Math.max(Math.abs(o.x - t.x), Math.abs(o.y - t.y)) <= 1){ talkTo(o.flags.companion); return; }
  if (o?.id === t.id){ press('a'); return; }
  if (tile && tile.floor === t.floor){
    // a building: to its doorstep and in (game/ways.js)
    const door = tapTarget(tile.x, tile.y);
    if (door){ if (door.x === t.x && door.y === t.y) door.then(); else if (walkTo(door.x, door.y)) setTimeout(() => { const h = hero(); if (h && h.x === door.x && h.y === door.y) door.then(); }, 900); return; }
    walkTo(tile.x, tile.y);
  }
}

let ready = false;
export function ensureWander(){
  if (ready) return; ready = true;
  ensureHud();
  addHost({ id:'wander', active:wandering, press:b => { if (!b || !wandering()) return; press(b); renderHud(); }, legend:hhLegend,
    health:() => { const h = hero(); return h ? Math.max(0, h.hp) / Math.max(1, h.maxHp) : 1; }, fight:() => !!state.combat.active });
  ui.wanderTap = null;
  // a crossing between maps (game/ways.js): the fog, the name, the sound
  passage.veil = veil; passage.banner = banner; passage.sting = id => tune({ door:'door', spotted:'gazeRises', fight:'fightBegins' }[id] || 'stairs');
  bus.on('acted', blowFelt);
  onFaceReady(() => { if (wandering()) renderHud(); });   // (a portrait drawn for the party list or the target card)
  // 🎬 your killing blow; and whoever's blow it was, the one that ends the fight, held longer and closer
  bus.on('hurt', e => { const h = hero(); if (!h || !wandering() || !e?.t?.dead || e.t.kind !== 'monster') return;
    if (lastOfSide(e.t, state.combat.order.map(tokById))) camBeat(1900, .42); else if (e.by === h.id) camBeat(1100, .32);
    // ✨ what it was worth: a gold "+N XP" rises from it as it settles, and a gold ring on the ground
    const xp = xpOf(BEST[e.t.bid]), id = e.t.id;
    if (xp > 0) setTimeout(() => { if (!wandering()) return; floatText(id, `+${xp} XP`, '#ffd96a', { word:true }); ringPulse(id, '#ffd96a'); sfx('chime', false); xpShown++; }, 520); });
  bus.on('levelReady', () => { if (wandering() && !state.combat.active) openMenu('level'); });   // ⬆ after the victory screen: the level-up page, ready
  // ⏳ a face in the turn order: pointed at, its figure lights; a foe tapped is aimed at
  wireStrip('osWd', { hover:id => showHover(id), pick:id => { const o = tokById(id); if (o?.kind === 'monster' && !o.dead && o.hp > 0){ rt.target = id; rt.look = { id, until:performance.now() + 900 }; renderHud(); } } });
  addEventListener('keydown', onKey, { capture:true });
  addEventListener('keyup', onKeyUp, { capture:true }); addEventListener('blur', () => { held = null; });
  document.addEventListener('click', onClick, true);
  addEventListener('gamepadconnected', e => { if (wandering()) toast(`🎮 ${e.gamepad.id.split('(')[0].trim() || 'Controller'} ready.`); });
  // the tap hook (ui/input.js) only while playing
  const sync = () => { ui.wanderTap = wandering() ? onTap : null; };
  setInterval(sync, 300);
  requestAnimationFrame(frame);
}
export { W };
