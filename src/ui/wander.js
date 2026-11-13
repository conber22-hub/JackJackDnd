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
  heroAttack, heroDodge, endHeroTurn, aim, target, attackFor, nextWeapon, attacksLeft, myTurn, fightTick, destinations, setOut, rest, saveNow } from '../game/wander.js';
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
      <button class="th-hero new" data-act="newHero"><b>+</b><span>Create a character</span></button></div>
    <p class="muted wd-keys">🎮 A controller works in Chrome and Edge: plug it in and press a button. Or the keys: <b>WASD</b> or the arrows walk, <b>Space</b> acts, <b>Tab</b> picks a target, <b>F</b> dodges, <b>Esc</b> ends your turn, <b>M</b> is the menu. Or tap where to walk.</p>`;
}

/* ---------- the HUD ---------- */
function ensureHud(){
  if ($('#wanderHud')) return;
  const el = document.createElement('div'); el.id = 'wanderHud'; el.className = 'hidden';
  el.innerHTML = `<div class="wd-top"><div class="wd-where"><b id="wdPlace"></b><span id="wdClock"></span></div><button class="wd-btn" data-act="wdMenu" aria-label="Menu">☰</button></div>
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
      body = `<div class="wd-fl"><b>Your turn</b> · ${moveAllowance(t) * 5} ft. to move · ${attacksLeft() ? `${attacksLeft()} strike${attacksLeft() === 1 ? '' : 's'} left` : 'struck'}</div>
        <div class="wd-fl">${tg ? `🎯 <b>${esc(tg.name)}</b> ${bar(tg.hp, tg.maxHp)}` : 'Nobody in sight'}${atk ? ` · ${esc(atk.n)}${i < 0 && tg ? ' <span class="muted">(out of reach)</span>' : ''}` : ''}</div>
        <div class="wd-acts"><button class="wd-act" data-act="wdA"><b>Ⓐ</b> Strike</button><button class="wd-act" data-act="wdAim" data-k="1"><b>RB</b> Next target</button>
        <button class="wd-act" data-act="wdWeapon"><b>Ⓨ</b> Weapon</button><button class="wd-act" data-act="wdDodge"><b>Ⓧ</b> Dodge</button><button class="wd-act" data-act="wdEnd"><b>Ⓑ</b> End turn</button></div>`;
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
    put('wdMenuBox', `<div class="wd-tt"><b>${menu.page === 'travel' ? 'Set out for…' : menu.page === 'keys' ? 'Controls' : 'The valley waits'}</b></div>
      ${menu.page === 'keys' ? `<div class="wd-tx">${KEYS_HELP}</div>` : ''}
      <div class="wd-opts">${items.map((o, k) => `<button class="wd-opt${k === menu.i ? ' on' : ''}${o.off ? ' off' : ''}" data-act="wdPick" data-k="${k}">${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>`); }
}
const KEYS_HELP = 'Left stick, D-pad, WASD or the arrows: walk (Q E Z C for the diagonals). Right stick: turn the camera. Ⓐ / Space: talk, climb, look, strike. LB RB / Tab: pick a target. Ⓨ / R: change weapon. Ⓧ / F: dodge. Ⓑ / Esc: end your turn, or back. ☰ Start / M: this menu. Or tap where to walk.';
function menuItems(){
  const road = state.meta.template === 'journey', fight = state.combat.active;
  if (menu.page === 'travel') return [...destinations().slice(0, 9).map(d => ({ label:d.name, sub:`${d.stretches} stretch${d.stretches === 1 ? '' : 'es'} of road${d.via.length ? ` · by ${d.via.join(', ')}` : ''}`, run:() => { closeMenu(); setOut(d.id); } })),
    { label:'Back', run:() => { menu.page = 'main'; menu.i = 0; } }];
  if (menu.page === 'keys') return [{ label:'Back', run:() => { menu.page = 'main'; menu.i = 0; } }];
  return [
    { label:'Carry on', run:closeMenu },
    { label:'Travel…', sub:road ? 'You are on the road already' : fight ? 'Not in a fight' : 'Take a road out of here', off:road || fight, run:() => { menu.page = 'travel'; menu.i = 0; } },
    { label:road ? 'Rest an hour' : 'Rest the night', sub:fight ? 'Not in a fight' : road ? 'A short rest by the road (something may find you)' : 'Everyone whole again by morning', off:fight, run:() => { closeMenu(); rest(); } },
    { label:'Save', run:() => { saveNow(); toast('Saved.'); closeMenu(); } },
    { label:'Controls', run:() => { menu.page = 'keys'; menu.i = 0; } },
    { label:'Leave to the threshold', sub:'Saved: carry on from the start page', run:() => { closeMenu(); leaveWander(); import('./events.js').then(m => m.showStart()); } },
  ];
}
const openMenu = () => { menu.open = true; menu.page = 'main'; menu.i = 0; };
const closeMenu = () => { menu.open = false; };

/* ---------- input ---------- */
function press(b){
  if (menu.open){
    const items = menuItems();
    if (b === 'a'){ const o = items[menu.i]; if (o && !o.off) o.run(); }
    else if (b === 'b' || b === 'start'){ if (menu.page !== 'main'){ menu.page = 'main'; menu.i = 0; } else closeMenu(); }
    return;
  }
  const tv = talkView();
  if (tv){
    if (b === 'a') say(tv.options[talkSel.i]?.k);
    else if (b === 'b') say('bye');
    return;
  }
  if (b === 'start' || b === 'back'){ openMenu(); return; }
  if (state.combat.active){
    if (b === 'a') heroAttack(); else if (b === 'b') endHeroTurn(); else if (b === 'x') heroDodge();
    else if (b === 'y'){ const a = nextWeapon(); if (a) toast(`Ready: ${a.n}`); }
    else if (b === 'rb' || b === 'rt') aim(1); else if (b === 'lb' || b === 'lt') aim(-1);
    return;
  }
  if (b === 'a'){ const h = hereAction(); if (h){ h.run(); talkSel.i = 0; } else dismissCard(); }
  else if (b === 'b') dismissCard();
}
function say(k){ if (!k) return; const r = chooseTalk(k); talkSel.i = 0; if (r === 'joined') toast('A companion follows you now.'); }
function dismissCard(){ const c = document.querySelector('#cardLayer .pop:last-child'); if (c) c.remove(); }
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
