/* 🗡 THE WANDERER on screen: the third door on the start page (pick a hero, or carry on), and while playing, the
   heads-up display over the map: where and when, the party's health, what Ⓐ would do here, the fight bar on your
   turn, a conversation, and the menu (travel, rest, save, leave). Input: a gamepad (engine/pad.js; the loop below
   reads it every frame, with the right stick turning the camera), the keyboard, or taps on the map and the buttons. */
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
import { W, rt, hero, members, wandering, startWander, continueWander, leaveWander, stepHero, walkTo, hereAction, talkView, chooseTalk, talkTo,
  heroAttack, heroDodge, endHeroTurn, aim, target, attackFor, nextWeapon, attacksLeft, myTurn, fightTick, destinations, setOut, rest, saveNow,
  pack, toggleEquip, usePotion, coinsGp, shopHere, buyPotion, journal, approvalOf, levelReady, partyLevel, nextLevelXp, levelUpHero, sheetOf, spellList, heroCast } from '../game/wander.js';
import { loyalty } from '../engine/wander-life.js';
import { camera, controls } from '../render/scene.js';
import { toast } from './hud.js';
import * as THREE from 'three';

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
    <p class="muted wd-keys">🎮 A controller works in Chrome and Edge: plug it in and press a button. Or the keys: <b>WASD</b> or the arrows walk, <b>Space</b> acts, <b>Tab</b> picks a target, <b>F</b> dodges, <b>Esc</b> ends your turn, <b>G</b> casts, <b>H</b> drinks a potion, <b>I</b> is the pack, <b>J</b> the journal, <b>M</b> the menu. Or tap where to walk.</p>`;
}

/* ---------- the HUD ---------- */
function ensureHud(){
  if ($('#wanderHud')) return;
  const el = document.createElement('div'); el.id = 'wanderHud'; el.className = 'hidden';
  el.innerHTML = `<div class="wd-top"><div class="wd-where"><b id="wdPlace"></b><span id="wdClock"></span></div><span id="wdLvl"></span><button class="wd-btn" data-act="wdMenu" aria-label="Menu">☰</button></div>
    <div class="wd-party" id="wdParty"></div><div class="wd-prompt" id="wdPrompt"></div><div class="wd-fight hidden" id="wdFight"></div>
    <div class="wd-talk hidden" id="wdTalk"></div><div class="wd-menu hidden" id="wdMenuBox"></div>`;
  document.body.appendChild(el);
}
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
  // Ⓐ out of a fight
  const here = !state.combat.active && !rt.talk && !menu.open && hereAction();
  put('wdPrompt', here ? `<button class="wd-act" data-act="wdA"><b>Ⓐ</b> ${esc(here.label)}</button>` : '');
  // the fight bar
  show('wdFight', state.combat.active);
  if (state.combat.active){
    const order = state.combat.order.map(tokById).filter(o => o && !o.flags?.gone).map(o => `<span class="${o.kind === 'monster' ? 'foe' : 'pal'}${o.id === turn?.id ? ' now' : ''}${o.dead || o.hp <= 0 ? ' down' : ''}">${esc(o.name)}</span>`).join('');
    let body;
    if (myTurn()){
      const tg = target(), i = attackFor(t, tg), atk = t.attacks[i] || t.attacks[rt.atk ?? 0];
      body = `<div class="wd-fl"><b>Your turn</b> · ${moveAllowance(t) * 5} ft. to move · ${attacksLeft() ? `${attacksLeft()} strike${attacksLeft() === 1 ? '' : 's'} left` : rt.cast ? 'cast' : 'struck'}</div>
        <div class="wd-fl">${tg ? `🎯 <b>${esc(tg.name)}</b> ${bar(tg.hp, tg.maxHp)}` : 'Nobody in sight'}${atk ? ` · ${esc(atk.n)}${i < 0 && tg ? ' <span class="muted">(out of reach)</span>' : ''}` : ''}</div>
        <div class="wd-acts"><button class="wd-act" data-act="wdA"><b>Ⓐ</b> Strike</button><button class="wd-act" data-act="wdAim" data-k="1"><b>RB</b> Next target</button>
        <button class="wd-act" data-act="wdWeapon"><b>Ⓨ</b> Weapon</button>${spellList().length ? `<button class="wd-act" data-act="wdSpells"><b>LT</b> Spell</button>` : ''}${pack().some(i => i.potion) ? `<button class="wd-act${rt.bonus ? ' off' : ''}" data-act="wdPotion"><b>RT</b> Potion</button>` : ''}
        <button class="wd-act" data-act="wdDodge"><b>Ⓧ</b> Dodge</button><button class="wd-act" data-act="wdEnd"><b>Ⓑ</b> End turn</button></div>`;
    } else body = `<div class="wd-fl">${turn ? `<b>${esc(turn.name)}</b>'s turn…` : '…'}</div>`;
    put('wdFight', `<div class="wd-order">${order}</div>${body}`);
  }
  // a conversation
  const tv = talkView(); show('wdTalk', !!tv);
  if (tv){ talkSel.i = Math.min(talkSel.i, tv.options.length - 1);
    put('wdTalk', `<div class="wd-tt"><b>${esc(tv.title)}</b>${tv.sub ? `<span>${esc(tv.sub)}</span>` : ''}</div><div class="wd-tx">${esc(tv.text)}</div>
      <div class="wd-opts">${tv.options.map((o, k) => `<button class="wd-opt${k === talkSel.i ? ' on' : ''}${o.off ? ' off' : ''}" data-act="wdSay" data-k="${o.k}">${k + 1}. ${esc(o.label)}</button>`).join('')}</div>`); }
  // the menu
  show('wdMenuBox', menu.open);
  if (menu.open){ const items = menuItems(); menu.i = Math.min(menu.i, items.length - 1);
    const info = pageInfo();
    put('wdMenuBox', `<div class="wd-tt"><b>${esc(PAGE_TITLE[menu.page] || 'The valley waits')}</b>${info.sub ? `<span>${info.sub}</span>` : ''}</div>
      ${info.html ? `<div class="wd-tx">${info.html}</div>` : ''}
      <div class="wd-opts">${items.map((o, k) => `<button class="wd-opt${k === menu.i ? ' on' : ''}${o.off ? ' off' : ''}" data-act="wdPick" data-k="${k}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`); }
}
const KEYS_HELP = 'Left stick, D-pad, WASD or the arrows: walk (Q E Z C for the diagonals). Right stick: turn the camera. Ⓐ / Space: talk, climb, look, strike. LB RB / Tab: pick a target. Ⓨ / R: change weapon. Ⓧ / F: dodge. LT / G: spells. RT / H: drink a potion. Ⓑ / Esc: end your turn, or back. View / I: the pack. Left stick click / J: the journal. ☰ Start / M: this menu. Or tap where to walk.';
const PAGE_TITLE = { main:'The valley waits', travel:'Set out for…', keys:'Controls', pack:'The pack', give:'Who drinks it?', journal:'The journal', level:'Level up', spells:'Spells' };
// The words above a page's choices: { sub, html }
function pageInfo(){
  if (menu.page === 'keys') return { html:KEYS_HELP };
  if (menu.page === 'pack'){ const s = sheetOf(); return { sub:`${coinsGp()} gp${s?.coins?.sp ? ` · ${s.coins.sp} sp` : ''}` }; }
  if (menu.page === 'journal'){
    const q = journal(), w = W();
    const quests = q.length ? q.map(j => `<div class="wd-q${j.done ? ' done' : ''}"><b>${j.done ? '✓ ' : '📜 '}${esc(j.title)}</b><span>${esc(j.step)}</span></div>`).join('') : '<div class="muted">No quests yet.</div>';
    const pals = w.party.map(p => { const n = approvalOf(p.id); return `<div class="wd-q"><b>${esc(companionById(p.id)?.name || p.id)}</b><span>${loyalty(n).label} (${n > 0 ? '+' : ''}${n})</span></div>`; }).join('');
    return { sub:`Level ${partyLevel()} · ${w.xp} XP${nextLevelXp() ? ` · next at ${nextLevelXp()}` : ''}`, html:quests + (pals ? `<div class="wd-sep">Companions</div>${pals}` : '') };
  }
  if (menu.page === 'level'){ const s = sheetOf(); return { html:`${esc(s?.name || '')} can reach level ${partyLevel()}. Let the game make the choices (an ability increase into what you're best at, new spells), or make them yourself on the character sheet.` }; }
  if (menu.page === 'spells'){ const t = hero(); return { sub:t ? (t.resources || []).filter(r => r.slot).map(r => `L${r.slot} ${t.res?.[r.id] ?? r.max}/${r.max}`).join(' · ') : '' }; }
  return {};
}
const back = (page = 'main') => ({ label:'Back', run:() => { menu.page = page; menu.i = 0; } });
const go = page => () => { menu.page = page; menu.i = 0; };
let giving = null;   // the potion being given (the pack's 'give' page)
function menuItems(){
  const road = state.meta.template === 'journey', fight = state.combat.active;
  if (menu.page === 'travel') return [...destinations().slice(0, 9).map(d => ({ label:d.name, sub:`${d.stretches} stretch${d.stretches === 1 ? '' : 'es'} of road${d.via.length ? ` · by ${d.via.join(', ')}` : ''}`, run:() => { closeMenu(); setOut(d.id); } })), back()];
  if (menu.page === 'keys' || menu.page === 'journal') return [back()];
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
    off:!e.ok, run:() => { closeMenu(); heroCast(e); } })), { label:'Back', run:closeMenu }];
  return [
    { label:'Carry on', run:closeMenu },
    ...(levelReady() ? [{ label:`Level up to ${partyLevel()}`, sub:'New hit points, and choices', off:fight, run:go('level') }] : []),
    { label:'Travel…', sub:road ? 'You are on the road already' : fight ? 'Not in a fight' : 'Take a road out of here', off:road || fight, run:go('travel') },
    { label:road ? 'Rest an hour' : 'Rest the night', sub:fight ? 'Not in a fight' : road ? 'A short rest by the road (something may find you)' : 'Everyone whole again by morning', off:fight, run:() => { closeMenu(); rest(); } },
    { label:'The pack', sub:`${coinsGp()} gp · ${pack().length} things`, run:go('pack') },
    { label:'The journal', sub:'Quests, and what your companions think', run:go('journal') },
    ...(spellList().length ? [{ label:'Spells', run:go('spells') }] : []),
    { label:'Save', run:() => { saveNow(); toast('Saved.'); closeMenu(); } },
    { label:'Controls', run:go('keys') },
    { label:'Leave to the threshold', sub:'Saved: carry on from the start page', run:() => { closeMenu(); leaveWander(); import('./events.js').then(m => m.showStart()); } },
  ];
}
const openMenu = (page = 'main') => { menu.open = true; menu.page = page; menu.from = page; menu.i = 0; };   // (from: a page opened by its own button closes on Ⓑ)
const closeMenu = () => { menu.open = false; };

/* ---------- input ---------- */
function press(b){
  if (menu.open){
    const items = menuItems();
    if (b === 'a'){ const o = items[menu.i]; if (o && !o.off) o.run(); }
    else if (b === 'b' || b === 'start' || (b === 'lt' && menu.page === 'spells')){ if (menu.page === 'give'){ menu.page = 'pack'; menu.i = 0; } else if (menu.page !== 'main' && menu.page !== menu.from){ menu.page = 'main'; menu.i = 0; } else closeMenu(); }
    return;
  }
  const tv = talkView();
  if (tv){
    if (b === 'a') say(tv.options[talkSel.i]?.k);
    else if (b === 'b') say('bye');
    return;
  }
  if (b === 'start'){ openMenu(); return; }
  if (b === 'back'){ openMenu('pack'); return; }
  if (b === 'ls'){ openMenu('journal'); return; }
  if (b === 'lt'){ if (spellList().length) openMenu('spells'); else toast('No spells.'); return; }
  if (b === 'rt' && (state.combat.active || pack().some(i => i.potion))){ usePotion(); return; }
  if (state.combat.active){
    if (b === 'a') heroAttack(); else if (b === 'b') endHeroTurn(); else if (b === 'x') heroDodge();
    else if (b === 'y'){ const a = nextWeapon(); if (a) toast(`Ready: ${a.n}`); }
    else if (b === 'rb') aim(1); else if (b === 'lb') aim(-1);
    return;
  }
  if (b === 'a'){ if (dismissCard()) return; const h = hereAction(); if (h){ h.run(); talkSel.i = 0; } }
  else if (b === 'b') dismissCard();
}
function say(k){ if (!k) return; const r = chooseTalk(k); talkSel.i = 0; if (r === 'joined') toast('A companion follows you now.'); }
function dismissCard(){ const c = document.querySelector('#cardLayer .pop:last-child'); if (c) c.remove(); return !!c; }
function step(dx, dy){
  if (menu.open){ if (dy) menu.i = Math.max(0, Math.min(menuItems().length - 1, menu.i + dy)); return; }
  const tv = talkView(); if (tv){ if (dy) talkSel.i = Math.max(0, Math.min(tv.options.length - 1, talkSel.i + dy)); return; }
  if (!stepHero(dx, dy)) pending = { dx, dy, until:performance.now() + 260 };
}
let pending = null, padMem = {}, lastTick = 0;
// the camera's yaw: which way "up on the stick" walks
const yaw = () => { const o = camera.position.clone().sub(controls.target); return Math.atan2(o.x, o.z); };
let hudOn = false;
function frame(now){
  requestAnimationFrame(frame);
  if (!wandering()){ if (hudOn){ hudOn = false; show('wanderHud', false); } return; }
  hudOn = true;
  const gp = [...(navigator.getGamepads?.() || [])].find(g => g && g.connected);
  if (gp){
    const pad = readPad(gp), r = padIntents(pad, now, padMem, { yaw:yaw() }); padMem = r.mem;
    for (const it of r.intents) it.k === 'step' ? step(it.dx, it.dy) : press(it.b);
    if (pad && Math.abs(pad.rx) > .25){ const o = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), -pad.rx * .035); camera.position.copy(controls.target).add(o); }
  }
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
    case 'wdWeapon': press('y'); break;
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
  if (tile && tile.floor === t.floor) walkTo(tile.x, tile.y);
}

let ready = false;
export function ensureWander(){
  if (ready) return; ready = true;
  ensureHud();
  ui.wanderTap = null;
  addEventListener('keydown', onKey, { capture:true });
  document.addEventListener('click', onClick, true);
  addEventListener('gamepadconnected', e => { if (wandering()) toast(`🎮 ${e.gamepad.id.split('(')[0].trim() || 'Controller'} ready.`); });
  // the tap hook (ui/input.js) only while playing
  const sync = () => { ui.wanderTap = wandering() ? onTap : null; };
  setInterval(sync, 300);
  requestAnimationFrame(frame);
}
export { W };
