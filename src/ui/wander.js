/* 🗡 THE WANDERER on screen: the third door on the start page (pick a hero, or carry on), and while playing, the
   heads-up display over the map: where and when, the party's health, what Ⓐ would do here, the fight bar on your
   turn, a conversation, and the menu (travel, rest, save, leave). Input: a gamepad (engine/pad.js; the loop below
   reads it every frame), the keyboard, the handheld skin's touch buttons (ui/handheld.js), or taps on the map.
   The follow camera (below) eases after the hero and turns, cranes and cycles views with the right stick, L / R, [ ] - = V. */
import { state, ui, tokById } from '../engine/state.js';
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
import { W, rt, hero, members, wandering, startWander, continueWander, leaveWander, stepHero, walkTo, hereAction, talkView, chooseTalk, talkTo,
  heroAttack, heroDodge, heroTurnAct, heroFeatures, heroFeature, endHeroTurn, aim, target, targets, attackFor, nextWeapon, attacksLeft, myTurn, fightTick, destinations, setOut, travelTo, rest, saveNow,
  pack, toggleEquip, usePotion, coinsGp, shopHere, buyPotion, journal, approvalOf, levelReady, partyLevel, nextLevelXp, levelUpHero, sheetOf, spellList, heroCast,
  SLOTS, slotMeta, canSaveSlot, saveToSlot, loadFromSlot } from '../game/wander.js';
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
import { camTurn, camView, camCrane, camYaw, camFrame, lookThrough, closeLook, feelHits } from './followcam.js';
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
      <div class="nm">${esc(h.name || 'Unnamed')}</div><div class="meta">${esc(h.sp)} ${esc(h.cls)} ${h.lvl}</div>
      <div class="acts"><button class="btn small primary" data-act="wdBegin" data-id="${h.id}">Begin</button></div></div>`).join('')}
      <button class="th-hero new" data-act="wdNewHero"><b>+</b><span>Create a character</span></button></div>
    <p class="muted wd-keys">🎮 A controller works in Chrome and Edge: plug it in and press a button. Or the keys: <b>WASD</b> or the arrows walk, <b>Space</b> does what the screen says (strike, talk, end your turn), <b>Esc</b> goes back, <b>F</b> opens your actions, <b>Tab</b> picks a target, <b>I</b> is your hero, <b>M</b> the menu, <b>[ ]</b> turn the camera. Or tap where to walk.</p>
    <p class="muted wd-keys">🕹 On a phone with no controller, the phone becomes one: it is held like a pocket console, the world on its screen (the menu's Handheld page has the shells and a pixel screen).</p>`;
}

/* ---------- the HUD ---------- */
function ensureHud(){
  if ($('#wanderHud')) return;
  const el = document.createElement('div'); el.id = 'wanderHud'; el.className = 'hidden';
  el.innerHTML = `<div class="wd-top"><div class="wd-where"><b id="wdPlace"></b><span id="wdClock"></span></div><span id="wdLvl"></span><button class="wd-btn" data-act="wdMenu" aria-label="Menu">☰</button></div>
    <div class="wd-party" id="wdParty"></div><div class="wd-prompt" id="wdPrompt"></div><div class="wd-fight hh-fightbar hidden" id="wdFight"></div>
    <div class="wd-talk hidden" id="wdTalk"></div><div class="wd-menu hidden" id="wdMenuBox"></div>`;
  document.body.appendChild(el);
}
// A button's name as the player holds it: a pad's, or the handheld's.
const PAD_K = { a:'Ⓐ', b:'Ⓑ', x:'Ⓧ', y:'Ⓨ' }, HH_K = { a:'A', b:'B', x:'X', y:'Y' };
const K = k => { const n = (hhOn() ? HH_K : PAD_K)[k]; return n ? `<b>${n}</b>` : ''; };
// The highlighted choice stays in sight when the D-pad moves through a list longer than the box.
const keepInView = id => { const o = document.querySelector(`#${id} .wd-opt.on`); if (o && o.dataset.seen !== '1'){ document.querySelectorAll(`#${id} .wd-opt[data-seen]`).forEach(n => delete n.dataset.seen); o.dataset.seen = '1'; o.scrollIntoView({ block:'nearest' }); } };
const bar = (hp, max) => `<i class="wd-hp"><i style="width:${Math.max(0, Math.min(100, hp / Math.max(1, max) * 100))}%"></i></i>`;
let last = {};
const put = (id, html) => { if (last[id] === html) return; last[id] = html; const el = document.getElementById(id); if (el) el.innerHTML = html; };
const show = (id, on) => document.getElementById(id)?.classList.toggle('hidden', !on);
export function renderHud(){
  ensureHud();
  const on = wandering(); show('wanderHud', on); if (!on) return;
  const t = hero(), V = valley(), j = V.journey, f = state.floors[t?.floor ?? 0];
  put('wdPlace', esc(j ? `${f?.name || 'The road'}` : f?.name || state.meta.name));
  put('wdClock', esc(`${clockText()}${j ? ` · to ${placeById(j.to)?.name || ''}, stretch ${(t?.floor ?? 0) + 1} of ${state.floors.length}` : ''}`));
  put('wdLvl', levelReady() ? `<button class="wd-lvl" data-act="wdLevel">⬆ Level ${partyLevel()}</button>` : '');
  const turn = state.combat.active && currentTurn();
  put('wdParty', members().map(m => `<div class="wd-m${m.id === t?.id ? ' me' : ''}${turn?.id === m.id ? ' turn' : ''}${m.dead || m.hp <= 0 ? ' down' : ''}">
    <span class="nm">${esc(m.name)}</span>${bar(m.hp, m.maxHp)}<span class="hp">${Math.max(0, m.hp)} / ${m.maxHp}</span></div>`).join(''));
  // what Ⓐ does just now
  const here = !rt.talk && !menu.open && (state.combat.active ? fightAction() : hereAction());
  put('wdPrompt', here ? (here.idle ? `<div class="wd-tx">${esc(here.label)}</div>` : `<button class="wd-act" data-act="wdA">${K('a')} ${esc(here.label)}</button>`) : '');
  // the fight bar
  show('wdFight', state.combat.active);
  if (state.combat.active){
    const order = state.combat.order.map(tokById).filter(o => o && !o.flags?.gone).map(o => `<span class="${o.kind === 'monster' ? 'foe' : 'pal'}${o.id === turn?.id ? ' now' : ''}${o.dead || o.hp <= 0 ? ' down' : ''}">${esc(o.name)}</span>`).join('');
    let body;
    if (myTurn()){
      const tg = target(), i = attackFor(t, tg), atk = t.attacks[i] || t.attacks[rt.atk ?? 0];
      body = `<div class="wd-fl"><b>Your turn</b> · ${moveAllowance(t) * 5} ft. to move · ${attacksLeft() ? `${attacksLeft()} strike${attacksLeft() === 1 ? '' : 's'} left` : rt.cast ? 'cast' : 'struck'}</div>
        <div class="wd-fl">${tg ? `🎯 <b>${esc(tg.name)}</b> ${bar(tg.hp, tg.maxHp)}` : 'Nobody in sight'}${atk ? ` · ${esc(atk.n)}${i < 0 && tg ? ' <span class="muted">(out of reach)</span>' : ''}` : ''}</div>
        <div class="wd-acts"><button class="wd-act" data-act="wdX">${K('x')} Actions</button><button class="wd-act" data-act="wdAim" data-k="1">${K('y')} Next target</button><button class="wd-act" data-act="wdEnd">End turn</button></div>`;
    } else body = `<div class="wd-fl">${turn ? `<b>${esc(turn.name)}</b>'s turn…` : '…'}</div>`;
    put('wdFight', `<div class="wd-order">${order}</div>${body}`);
  }
  // a conversation
  const tv = talkView(); show('wdTalk', !!tv);
  if (tv){ talkSel.i = Math.min(talkSel.i, tv.options.length - 1);
    put('wdTalk', `<div class="wd-tt"><b>${esc(tv.title)}</b>${tv.sub ? `<span>${esc(tv.sub)}</span>` : ''}</div><div class="wd-tx">${esc(tv.text)}</div>
      <div class="wd-opts">${tv.options.map((o, k) => `<button class="wd-opt${k === talkSel.i ? ' on' : ''}${o.off ? ' off' : ''}" data-act="wdSay" data-k="${o.k}">${k + 1}. ${esc(o.label)}</button>`).join('')}</div>`);  keepInView('wdTalk'); }
  // the menu
  show('wdMenuBox', menu.open);
  if (menu.open){ const items = menuItems(); menu.i = Math.min(menu.i, items.length - 1);
    const info = pageInfo();
    put('wdMenuBox', `<div class="wd-tt"><b>${esc(PAGE_TITLE[menu.page] || 'The valley waits')}</b>${info.sub ? `<span>${info.sub}</span>` : ''}</div>
      ${info.html ? `<div class="wd-tx">${info.html}</div>` : ''}
      <div class="wd-opts">${items.map((o, k) => `<button class="wd-opt${k === menu.i ? ' on' : ''}${o.off ? ' off' : ''}" data-act="wdPick" data-k="${k}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`); 
    keepInView('wdMenuBox'); }
}
const KEYS_HELP = 'Each button does one thing. Left stick, D-pad, WASD or the arrows: walk (Q E Z C for the diagonals), or move through a menu. Ⓐ / Space: do what the line on the screen says (talk, climb, look, strike, end your turn), or choose. Ⓑ / Esc: back, or put a card away. Ⓧ / F: Actions (each weapon, spells, Dash, Disengage, Dodge, features like Action Surge, a potion, End turn). Ⓨ / Tab: the next target. LB RB / [ ]: turn the camera; right stick or - = crane it; right stick click / V: the next view. View / I: your hero. ☰ Start / M: this menu. View + Start / K: the save states. Shortcuts: LT / G spells, RT / H a potion, left stick click / J the journal, N end your turn. Or tap where to walk.';
const PAGE_TITLE = { states:'Save states', load:'Load this one?', handheld:'Handheld & camera', main:'The valley waits', travel:'Set out for…', keys:'Controls', pack:'The pack', give:'Who drinks it?', journal:'The journal', level:'Level up', spells:'Spells', actions:'Actions' };
// The words above a page's choices: { sub, html }
function pageInfo(){
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
      { label:'Camera: the next view', sub:'Close · Over the shoulder · High', run:camView },
      { label:`See through walls: ${hh.seeThru ? 'On' : 'Off'}`, sub:'What stands between the camera and your hero thins away', run:() => setHandheld({ seeThru:!hh.seeThru }) },
      { label:`Tips: ${hh.tips === false ? 'Off' : 'On'}`, sub:'A short hint now and then, at the right moment', run:() => setHandheld({ tips:hh.tips === false }) },
      { label:`Chip tunes: ${hh.chip === false ? 'Off' : 'On'}`, sub:'Its little jingles (with the sound effects on)', run:() => setHandheld({ chip:hh.chip === false }) },
      back()]; }
  if (menu.page === 'pack') return [
    ...pack().map(i => ({ label:`${i.n}${i.qty > 1 ? ` ×${i.qty}` : ''}${i.equipped ? ' ✓' : ''}`, sub:i.potion ? 'Drink it, or give it to someone beside you' : ['weapon', 'armor', 'shield'].includes(i.kind) ? (i.equipped ? 'In hand / worn: take it off' : 'Wield it / wear it') : '',
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
  if (menu.page === 'spells') return [...spellList().map(e => ({ label:`${e.n}${e.l ? ` (level ${e.l})` : e.l === 0 ? ' (cantrip)' : ''}`, sub:e.why ? `Only ${e.why}` : e.k === 'heal' ? 'On the most hurt of you, within reach' : e.kind === 'atk' ? 'An attack roll, at the target' : '',
    off:!e.ok, run:() => { closeMenu(); heroCast(e); } })), { label:'Back', run:() => { if (menu.from === 'actions'){ menu.page = 'actions'; menu.i = 0; } else closeMenu(); } }];
  if (menu.page === 'actions'){
    const t = hero(), fight = !!state.combat.active, mine = myTurn(), tg = fight ? target() : null, spent = fight && mine && !attacksLeft();
    const end = fight ? [{ label:'End your turn', sub:spent ? 'Your action is spent' : 'Done for this round', off:!mine, run:() => { closeMenu(); endHeroTurn(); } }] : [];
    const ta = (k, label, sub) => ({ label, sub, off:!mine || (k !== 'stand' && !attacksLeft()), run:() => { closeMenu(); heroTurnAct(k); } });
    return [
      ...(spent ? end : []),
      ...(fight ? (t?.attacks || []).map((a, i) => ({ label:a.n, sub:`${a.b >= 0 ? '+' : ''}${a.b} · ${a.d}${tg ? ` · at ${tg.name}${attackForWith(t, tg, i) ? '' : ' (out of reach)'}` : ''}`,
        off:!mine || !attacksLeft(), run:() => { closeMenu(); rt.atk = i; heroAttack(); } })) : []),
      ...(spellList().length ? [{ label:'Spells…', sub:fight && (rt.cast || rt.attacks) ? 'Your action is spent' : '', run:() => { menu.page = 'spells'; menu.i = 0; } }] : []),
      ...(fight ? [ta('dash', 'Dash', 'Your speed again this turn'), ta('disengage', 'Disengage', 'Leave without opportunity attacks'), ta('dodge', 'Dodge', 'Attacks against you at disadvantage'),
        ...((t?.conds || []).some(c => c.n === 'prone') ? [ta('stand', 'Stand up', 'Half your move')] : [])] : []),
      ...heroFeatures().map(f => ({ label:f.n, sub:`${f.left} of ${f.max} left${f.why ? ` · ${f.why}` : ''}`, off:!!f.why, run:() => { closeMenu(); heroFeature(f.id); } })),
      ...(pack().some(i => i.potion) ? [{ label:'Drink a potion', sub:`${pack().filter(i => i.potion).reduce((n, i) => n + i.qty, 0)} in the pack${fight && rt.bonus ? ' · one a turn' : ''}`, off:fight && (!mine || rt.bonus), run:() => { closeMenu(); usePotion(); } }] : []),
      ...(spent ? [] : end),
      { label:'Back', run:closeMenu }];
  }
  return [
    { label:'Carry on', run:closeMenu },
    ...(levelReady() ? [{ label:`Level up to ${partyLevel()}`, sub:'New hit points, and choices', off:fight, run:go('level') }] : []),
    { label:'Travel…', sub:road ? 'You are on the road already' : fight ? 'Not in a fight' : 'Take a road out of here', off:road || fight, run:go('travel') },
    { label:road ? 'Rest an hour' : 'Rest the night', sub:fight ? 'Not in a fight' : road ? 'A short rest by the road (something may find you)' : 'Everyone whole again by morning', off:fight, run:() => { closeMenu(); rest(); } },
    { label:'The pack', sub:`${coinsGp()} gp · ${pack().length} things`, run:go('pack') },
    { label:'The journal', sub:'Quests, and what your companions think', run:go('journal') },
    { label:'Your hero', sub:'Your sheet, a page at a time (Select)', run:() => { closeMenu(); openHero(); } },
    ...(spellList().length ? [{ label:'Spells', run:go('spells') }] : []),
    { label:'Save', run:() => { saveNow(); toast('Saved.'); closeMenu(); } },
    { label:'Save states', sub:'Three slots of your own, to come back to', run:go('states') },
    { label:'Controls', run:go('keys') },
    { label:'Handheld & camera', sub:hhOn() ? 'On: the phone is the controller' : 'Play on the phone as if it were a pocket console', run:go('handheld') },
    { label:'Leave to the threshold', sub:'Saved: carry on from the start page', run:() => { closeMenu(); leaveWander(); import('./events.js').then(m => m.showStart()); } },
  ];
}
const openMenu = (page = 'main') => { menu.open = true; menu.page = page; menu.from = page; menu.i = 0; };   // (from: a page opened by its own button closes on Ⓑ)
const closeMenu = () => { menu.open = false; };

/* ---------- input ---------- */
function press(b){
  if (skipBoot()) return;   // (the press that skips the handheld's boot does only that)
  if (b === 'states' && pocketOpen()) closePocketSheet();   // (Select, then Start with it: the save states, not the sheet)
  if (pocketOpen()){ pocketPress(b === 'ls' ? 'back' : b); renderHud(); return; }   // (Muse's pocket sheet takes every press while it's open)
  coachDone();
  coachLearn({ a:state.combat.active ? 'strike' : null, lt:'cast', y:'aim', yprev:'aim', x:'actions', start:'menu', rs:'camera', turnl:'camera', turnr:'camera', lb:'camera', rb:'camera', back:'sheet', endturn:'endTurn' }[b]);
  if (b === 'states' || (b === 'start' && padHeld.back)){ openMenu('states'); return; }
  if (b === 'rs'){ camView(); return; }
  if (b === 'turnl' || b === 'turnr' || b === 'lb' || b === 'rb'){ camTurn(b === 'turnl' || b === 'lb' ? 1 : -1); return; }   // (L and R: the camera, always)
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
  if (attacksLeft() && tg && attackFor(t, tg) >= 0) return { label:`Strike ${tg.name}`, run:heroAttack };
  if (attacksLeft()) return { label:tg ? `${tg.name} is out of reach: walk closer` : 'Nobody in reach', run:() => toast(tg ? `${tg.name} is out of reach: walk closer, or Ⓧ for more.` : 'Nobody in sight.'), idle:true };
  return { label:'End your turn', run:() => { if (performance.now() - aAt < 1200) return toast(rt.cast ? 'You have cast this turn: Ⓐ again ends your turn.' : 'You have struck this turn: Ⓐ again ends your turn.'); endHeroTurn(); } };
}
function say(k){ if (!k) return; const r = chooseTalk(k); talkSel.i = 0; if (r === 'joined') toast('A companion follows you now.'); }
function dismissCard(){ const c = document.querySelector('#cardLayer .pop:last-child'); if (c) c.remove(); return !!c; }
function step(dx, dy){
  if (skipBoot()) return;
  if (pocketOpen()){ pocketPress(dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right'); return; }
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
  const focus = rt.focus && { ...rt.focus, x:rt.focus.x + lead.x + shake * (b?.dx || 0), z:rt.focus.z + lead.z + shake * (b?.dy || 0) };
  camFrame(dt, pad, { focus, me:h, other:lk || (ct && ct.id !== h?.id ? ct : null), otherRate:lk ? 4 : 3 });
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
const HH_HELP = 'Each button does one thing. D-pad: walk (slide your thumb round it for the diagonals), or move through a menu. A: do what the line on the screen says (talk, climb, look, strike, end your turn), or choose. B: back, or put a card away. X: Actions: each weapon, spells, Dash, Disengage, Dodge, features like Action Surge, a potion, End turn. Y: the next target. L and R: turn the camera. Select: your hero. View: the next camera view. Start: this menu. Select and Start together: the save states. Touch works too: drag on the screen to turn the camera, pinch to zoom, tap to walk or pick a foe, tap any line of a menu.';
let pending = null, padMem = {}, hhMem = {}, lastTick = 0, lastFrame = 0, glintAt = 0, musicAt = 0;
const padHeld = { back:false };   // (Back held while Start goes down: the save states)
const yaw = camYaw;   // (which way "up on the stick" walks)
let hudOn = false;
/* ---------- 🕹 the tunes and the coach (ui/hhlife.js) ---------- */
const was = { turn:false, fight:false, lvl:false, quests:-1, done:-1 };
function wanderMoments(){
  const w = W(), h = hero(); if (!w || !h) return;
  const mine = myTurn(), f = !!state.combat.active, lvl = levelReady(), q = w.quests?.length || 0, d = (w.quests || []).filter(x => x.done).length;
  if (mine && !was.turn) tune('turnStart');
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
  if (!wandering()){ if (hudOn){ hudOn = false; show('wanderHud', false); closeLook(); feelHits(null); coachHide(); clearGlints(); clearStepFx(); clearCritters(); critKey = ''; musicStop(); } return; }
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
  if (now - lastTick > 180){ lastTick = now; try { fightTick(now); } catch (e){ console.warn(e); } renderHud(); }
}
function onKey(e){
  if (!wandering() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || !$('#charModal')?.classList.contains('hidden')) return;
  if (menu.open || talkView()){ if (/^[1-9]$/.test(e.key)){ const k = +e.key - 1; if (menu.open){ menu.i = k; press('a'); } else { talkSel.i = k; press('a'); } e.preventDefault(); e.stopPropagation(); return; } }
  const it = keyIntent(e.key, { shift:e.shiftKey, yaw:yaw() }); if (!it) return;
  e.preventDefault(); e.stopPropagation();
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
  if (o?.kind === 'monster' && state.combat.active){ if (rt.target === o.id) heroAttack(); else rt.target = o.id; return; }
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
  passage.veil = veil; passage.banner = banner; passage.sting = id => tune({ door:'door', spotted:'gazeRises' }[id] || 'stairs');
  addEventListener('keydown', onKey, { capture:true });
  document.addEventListener('click', onClick, true);
  addEventListener('gamepadconnected', e => { if (wandering()) toast(`🎮 ${e.gamepad.id.split('(')[0].trim() || 'Controller'} ready.`); });
  // the tap hook (ui/input.js) only while playing
  const sync = () => { ui.wanderTap = wandering() ? onTap : null; };
  setInterval(sync, 300);
  requestAnimationFrame(frame);
}
export { W };
