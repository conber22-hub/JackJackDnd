/* HUD — toasts, banners, whispers, pop-up cards, top bar, dock, initiative list, selection card. */
import { state, ui, tokById, isDM, dreadLevel, viewAsPlayer } from '../engine/state.js';
import { exitLabel } from '../engine/generator.js';
import { seenNow } from '../engine/grid.js';
import { BEST } from '../data/bestiary.js';
import { CONDITIONS } from '../data/dread.js';
import { TRAP_KINDS, DOOR_STATES } from '../data/rooms.js';
import { $, esc, clamp, cheb } from '../util/core.js';
import { broadcast, net } from '../net/table.js';
import { currentTurn, moveAllowance, hasCond, speedSquares } from '../game/rules.js';
import { canUndoMove, renderOA } from '../game/moves.js';
import { onStairs, selectedDoor, selectedTrap, nearestHero } from '../game/actions.js';
import { undoCount } from '../game/session.js';
import { renderPanel } from './panels.js';
import { canCast, left } from '../game/resources.js';
import { renderRequests } from '../game/requests.js';
import { renderPrompts } from '../game/rooms.js';
import { legendOf, legendLeft, resistLeft, lairCreature } from '../game/combat.js';
import { selectedProp, hiddenDoor, actorFor, objectsBeside } from '../game/objects.js';
import { objectActs, objInfo, objAC, objHp, objMaxHp } from '../engine/objects.js';
import { PROPS } from '../data/props.js';
import { fightCandidates } from '../engine/fight.js';
import { renderAskBar } from '../game/asks.js';
import { sfx } from '../audio/sound.js';

export function toast(msg){ const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; $('#toasts').appendChild(el); setTimeout(() => el.remove(), 3800); while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove(); }
export function banner(text){ const b = $('#turnBanner'); b.textContent = text; b.style.opacity = 1; clearTimeout(banner._t); banner._t = setTimeout(() => b.style.opacity = 0, 1800); }
export function showWhisper(text){ const w = $('#whisper'); w.textContent = text; w.style.opacity = .9; clearTimeout(showWhisper._t); showWhisper._t = setTimeout(() => w.style.opacity = 0, 3800); }
export function sendWhisper(text){ showWhisper(text); broadcast({ t:'whisper', text }); sfx('whisper'); }
export function showCard(c, share = true){
  const layer = $('#cardLayer'), el = document.createElement('div');
  el.className = 'pop ' + (c.kind || '');
  el.innerHTML = `<div class="t">${esc(c.title)}</div>${c.sub ? `<div class="s">${esc(c.sub)}</div>` : ''}${c.flair ? `<div class="f">${esc(c.flair)}</div>` : ''}${(c.lines || []).map(l => `<div class="r">${l}</div>`).join('')}${c.big ? `<div class="big">${esc(c.big)}</div>` : ''}<div class="tap">tap to dismiss</div>`;
  el.onclick = () => el.remove();
  layer.appendChild(el); while (layer.children.length > 3) layer.firstChild.remove();
  setTimeout(() => el.remove(), 8000);
  if (share && ui.role === 'dm') broadcast({ t:'card', c });
}

export function renderTop(){
  if (!state) return;
  const f = state.floors[ui.floor], D = dreadLevel();
  $('#floorLabel').innerHTML = `${esc(f.name)}<small>Floor ${ui.floor + 1} of ${state.floors.length}</small>`;
  $('#dreadNum').textContent = state.dread; $('#dreadName').textContent = D.n; $('#dread').value = state.dread;
  const pv = ui.role === 'player';
  $('#dreadBox').classList.toggle('hide', pv); $('#dreadRO').classList.toggle('hide', !pv);
  $('#dreadRO').innerHTML = `👁 Gaze <b style="color:var(--blood)">${state.dread}</b> · <i>${esc(D.n)}</i>`;
  $('#whimBadge').classList.toggle('hide', viewAsPlayer());
  $('#whimBadge').innerHTML = `🦇 d${state.grasp.die}`;
  const ns = net.status === 'open' ? '' : net.status === 'lost' ? ' · ⚠ disconnected' : net.status === 'closed' ? ' · table closed' : ' · reconnecting…';
  $('#roleBadge').textContent = pv ? `Player · ${ui.myName}${net.join ? ns : ''}` : ui.tableView ? 'Table view' : net.code ? `DM · table ${net.code}${net.online ? '' : ' (offline)'} · ${net.conns.size} joined` : net.opening ? `DM · opening ${net.opening}…` : 'DM';
  $('#roleBadge').classList.toggle('warn', pv ? !!net.join && net.status !== 'open' : !!net.code && !net.online);
}
export function renderTabs(){
  const tabs = ui.role === 'player' ? [['hero', 'Your hero'], ...(state?.valley ? [['map', 'Map']] : []), ['log', 'Log']]
    : [['story', 'Story'], ['valley', 'Valley'], ['tokens', 'Tokens'], ['bestiary', 'Beasts'], ['dungeon', 'Maps'], ['build', 'Build'], ['gaze', 'Gaze'], ['table', 'Table'], ['night', 'Night']];
  if (!tabs.some(t => t[0] === ui.tab)) ui.tab = tabs[0][0];
  $('#tabs').innerHTML = tabs.map(([k, l]) => `<button data-act="tab" data-k="${k}" class="${ui.tab === k ? 'on' : ''}">${l}</button>`).join('');
}
export const BUILD_TOOLS = [
  ['room', '▭', 'Room', 'Drag a room to move it · drag a corner to resize · drag on bare rock to draw a new room · tap a room to select it'],
  ['corridor', '⌇', 'Hall', 'Trace a corridor with your finger or mouse'],
  ['door', '⊓', 'Door', 'Tap a square to place a door (tap again to cycle or remove)'],
  ['trap', '✷', 'Trap', 'Tap a square to hide a trap (tap again to remove)'],
  ['stairs', '⇅', 'Stairs', 'Tap where the stairs down should be — the floor below follows'],
  ['prop', '🪑', 'Props', 'Tap a square to place the chosen prop · tap a prop to turn it · Erase removes it'],
  ['house', '🏠', 'Houses', 'Tap bare rock to put up a house (it fills squares to the right and down) · tap a house to turn its door · Erase takes it down'],
  ['erase', '⌫', 'Erase', 'Tap a prop, door, trap, hand-drawn corridor or dug square to remove it'],
  ['dig', '⛏', 'Dig', 'Tap or drag across rock to dig'],
  ['fill', '▦', 'Fill', 'Tap or drag across floor to fill it with stone'],
  ['rough', '≋', 'Rough', 'Tap or drag to make difficult terrain (mud, rubble, deep water: 2 squares to cross) · start on rough ground to clear it'],
];
export function renderDock(){
  const dm = isDM();
  const b = (act, icon, label, on, extra = '') => `<button data-act="${act}" class="${on ? 'on' : ''}" title="${esc(label)}" ${extra}><span>${icon}</span>${label}</button>`;
  let h = b('mode:select', '✥', 'Select', ui.mode === 'select') + b('mode:ping', '◎', 'Ping', ui.mode === 'ping') + b('focus', '⌖', 'Focus');
  if (dm && ui.tab === 'build') h += BUILD_TOOLS.map(([k, i, l, hint]) => b(`mode:${k}`, i, l, ui.mode === k, `data-hint="${esc(hint)}"`)).join('') + b('undo', '↶', `Undo${undoCount() ? ` ${undoCount()}` : ''}`);
  else if (dm) h += b('mode:noise', '📢', 'Noise', ui.mode === 'noise') + b('shiftNow', '⟲', 'Shift') + b('whimRoll', '🦇', `Whim d${state?.grasp.die ?? 4}`);
  $('#dock').innerHTML = h;
  $('#dock').classList.toggle('wide', !ui.panelOpen);
  $('#dock').classList.toggle('twocol', dm && ui.tab === 'build');
}
export const hpBar = (t, pc) => `<div class="hpbar ${pc ? 'pc' : ''}"><i style="width:${Math.round(100 * clamp(t.hp / t.maxHp, 0, 1))}%"></i></div>`;
export const condChips = (t, removable) => (t.conds || []).map(c => `<span class="chip on" style="border-color:${CONDITIONS[c.n]?.color || '#888'}" ${removable ? `data-act="rmCond" data-k="${esc(c.n)}" title="Remove"` : ''}>${CONDITIONS[c.n]?.icon || '•'} ${esc(c.n)}${c.r > 0 ? ` ${c.r}r` : ''}${removable ? ' ✕' : ''}</span>`).join('');

// Can the party see any square of this creature's space?
const seesAny = t => { const W = state.floors[t.floor].W, s = t.size || 1; for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) if (seenNow[t.floor]?.has((t.y + dy) * W + t.x + dx)) return true; return false; };
export function renderInit(){
  if (!state) return;
  const bar = $('#initBar'), c = state.combat, pv = viewAsPlayer();
  bar.classList.toggle('hidden', !c.active && ui.role === 'player');
  $('#roundLbl').textContent = c.active ? `Round ${c.round}` : '';
  if (!c.active){
    $('#initList').innerHTML = `<div class="muted" style="padding:8px">No fight yet. Start one to pick who's in it: the party, and the creatures they can see or are close to.</div>`;
    $('#initBtns').innerHTML = ui.role === 'dm' ? `<button class="btn primary" data-act="rollInit">⚔ Start a fight…</button>` : '';
    return;
  }
  const dmv = ui.role === 'dm';
  $('#initList').innerHTML = c.order.map((id, i) => {
    const t = tokById(id); if (t?.unseen) return `<div class="ini ${i === c.idx ? 'cur' : ''}"><span class="dot" style="color:#555;background:#555"></span><span class="n muted">something unseen</span></div>`;
    if (!t || t.flags.gone) return '';
    if (pv && t.kind === 'monster' && !seesAny(t)) return `<div class="ini ${i === c.idx ? 'cur' : ''}"><span class="dot" style="color:#555;background:#555"></span><span class="n muted">something unseen</span></div>`;
    const color = t.kind === 'monster' ? '#c0303a' : t.color;
    const cs = (t.conds || []).map(c => CONDITIONS[c.n]?.icon || '•').join('');
    const bar = dmv || t.kind !== 'monster' ? `<span class="ihp ${t.kind === 'monster' ? '' : 'pc'}"><i style="width:${Math.round(100 * clamp(t.hp / (t.maxHp || 1), 0, 1))}%"></i></span>` : '';
    const extra = dmv ? `${i === c.idx && c.order.length > 1 && c.idx < c.order.length - 1 ? '<b class="dl" data-act="delayTurn" title="Hold back: the next one goes first">⏭</b>' : ''}<b class="x" data-act="leaveFight" data-id="${t.id}" title="Out of the fight">✕</b>` : '';
    return `<div class="ini ${i === c.idx ? 'cur' : ''} ${t.dead ? 'dead' : ''}" data-act="sel" data-id="${t.id}"><span class="dot" style="color:${color};background:${color}"></span><span class="n">${esc(t.name)} <span class="muted">${cs}</span>${bar}</span>${extra}<span class="v">${t.initRoll ?? ''}</span></div>`;
  }).join('');
  const cur = currentTurn();
  const lair = ui.role === 'dm' && lairCreature();
  $('#initBtns').innerHTML = ui.role === 'dm'
    ? `${c.won ? `<button class="btn primary" data-act="endCombat">🏆 End the fight</button>` : ''}${lair ? `<button class="btn small seep" data-act="lair" title="${esc(lair.name)}'s lair acts on initiative 20">🏰 Lair</button>` : ''}${cur?.kind === 'monster' && !cur.dead && !c.won ? `<button class="btn small" data-act="autoTurn" title="It hits whoever it can reach (the most hurt first), or shoots, or closes in and then hits">🤖 Its turn</button>` : ''}<button class="btn ${c.won ? '' : 'primary'}" data-act="nextTurn">Next ▶</button><button class="btn small" data-act="rollInit" title="Re-roll initiative for everyone in it">↻</button>${c.won ? '' : '<button class="btn small danger" data-act="endCombat">End</button>'}`
    : (cur && cur.id === ui.myToken ? `<button class="btn primary" data-act="endMyTurn">End my turn</button>` : '');
}

export function renderSel(){
  const el = $('#selCard');
  if (!state){ el.classList.remove('show'); return; }
  if (ui.selDoor) return renderDoorCard(el);
  if (ui.selTrap) return renderTrapCard(el);
  if (ui.selProp) return renderPropCard(el);
  const t = ui.selected && tokById(ui.selected);
  if (!t){ el.classList.remove('show'); return; }
  const dm = isDM(), mine = t.id === ui.myToken, b = BEST[t.bid];
  const showStats = dm || t.kind !== 'monster';
  const color = t.kind === 'monster' ? '#c0303a' : t.color;
  const stairs = onStairs(t);
  let acts = '';
  // attacks, spells and features: the DM rolls them directly; a player's taps on their own hero become requests
  if ((dm || mine) && !t.dead){
    acts += `<button class="btn small ${ui.atkMode !== 'normal' ? 'on' : ''}" data-act="atkMode" title="Advantage / disadvantage for the next roll">${ui.atkMode === 'adv' ? '▲ Adv' : ui.atkMode === 'dis' ? '▼ Dis' : '◆ Normal'}</button>`;
    acts += t.attacks.map((a, i) => `<button class="btn small ${a.l && !canCast(t, a.l, a.sn || a.n, a.again) ? 'off' : ''}" data-act="atk" data-i="${i}">🗡 ${esc(a.n)} <span class="muted">${a.b >= 0 ? '+' : ''}${a.b} · ${esc(a.d)}${a.l ? ` · L${a.l}` : ''}</span></button>`).join('');
    if (dm && b?.specials) acts += b.specials.map((s, i) => `<button class="btn small seep" data-act="special" data-i="${i}">✦ ${esc(s.n)}</button>`).join('');
    const lg = dm && legendOf(t);
    if (lg?.legendary) acts += `<span class="chip on" title="Back at the start of its turn">⚜ ${legendLeft(t)}/${lg.legendary.n}</span>` + lg.legendary.acts.map((a, i) => `<button class="btn small ${legendLeft(t) < (a.cost || 1) ? 'off' : ''}" data-act="legend" data-i="${i}" title="${esc(a.f || '')}">⚜ ${esc(a.n)}${a.cost > 1 ? ` <span class="muted">(${a.cost})</span>` : ''}</button>`).join('');
    if (lg?.resist) acts += `<button class="btn small ${resistLeft(t) ? '' : 'off'}" data-act="lres">🛡 Legendary Resistance ${resistLeft(t)}/${lg.resist}</button>`;
    if (t.casts?.length) acts += t.casts.map((s, i) => `<button class="btn small ${!canCast(t, s.l, s.n, s.again) ? 'off' : ''}" data-act="cast" data-i="${i}" title="${s.k === 'heal' ? 'Heal' : s.d ? `${esc(s.d)} ${esc(s.ty || '')}` : esc(s.cond || s.note || s.k)}${s.sv ? ` · DC ${s.dc} ${s.sv.toUpperCase()}` : ''}${s.rad ? ` · ${s.rad * 5} ft.` : ''}">✨ ${esc(s.n)}${s.l ? ` <span class="muted">L${s.l}</span>` : ''}</button>`).join('');
    acts += (t.resources || []).filter(r => !r.slot).map(r => `<button class="btn small ${left(t, r.id) ? '' : 'off'}" data-act="feat" data-k="${r.id}" title="${esc(r.text || '')}">${r.use === 'hitdie' ? '🎲' : '✦'} ${esc(r.id === 'hd' ? 'Hit Die' : r.n)} <span class="muted">${left(t, r.id)}/${r.max}</span></button>`).join('');
  }
  if (dm){
    acts += `<span style="display:inline-flex;gap:4px;align-items:center"><input class="txt num" id="hpAmt" type="number" value="5" min="0"><button class="btn small danger" data-act="dmg">− HP</button><button class="btn small" data-act="heal">+ HP</button></span>`;
    acts += `<select class="txt" style="width:auto" data-edit="addCond"><option value="">+ condition…</option>${Object.keys(CONDITIONS).map(k => `<option value="${k}">${CONDITIONS[k].icon} ${k}</option>`).join('')}</select>`;
    if (t.dead && t.kind !== 'pc' && (t.kind === 'npc' || b?.tags?.includes('host'))) acts += `<button class="btn small seep" data-act="infest">☣ Infest</button>`;
    if (state.combat.active && !state.combat.order.includes(t.id)) acts += `<button class="btn small" data-act="joinInit">+ Initiative</button>`;
  }
  // moving: a fight's movement actions, taking a move back, the DM's helpers for moving several at once
  if ((dm || mine) && !t.dead){
    const fight = state.combat.active, turn = !fight || currentTurn()?.id === t.id;
    if (fight && (dm || turn)){
      acts += `<button class="btn small ${t.dashed ? 'on' : ''}" data-act="turnAct" data-k="dash" title="Your action: twice your speed this turn">🏃 Dash</button>`;
      acts += `<button class="btn small ${t.disengaged ? 'on' : ''}" data-act="turnAct" data-k="disengage" title="Your action: moving away provokes no opportunity attacks this turn">🛡 Disengage</button>`;
      acts += `<button class="btn small ${t.dodge ? 'on' : ''}" data-act="turnAct" data-k="dodge" title="Your action: attacks against you have disadvantage until your next turn">🌀 Dodge</button>`;
    }
    if (hasCond(t, 'prone') && turn) acts += `<button class="btn small" data-act="turnAct" data-k="stand" title="${fight ? `Costs half your speed (${Math.ceil(speedSquares(t) / 2) * 5} ft)` : 'Get up'}">⤒ Stand up</button>`;
    if (canUndoMove(t, dm)) acts += `<button class="btn small" data-act="undoMove" title="Take back the last move this turn">↶ Undo move</button>`;
    if (dm && t.kind === 'monster') acts += `<button class="btn small" data-act="closeIn" title="Walk to the nearest foe, as close as its move allows">🐾 Close in</button>`;
    if (dm && t.kind === 'monster' && fight && currentTurn()?.id === t.id) acts += `<button class="btn small primary" data-act="autoTurn" title="It hits whoever it can reach (the most hurt first), or shoots, or closes in and then hits">🤖 Its turn</button>`;
    if (dm){
      const g = [...(ui.group || [])].filter(id => tokById(id));
      acts += g.length ? `<span class="grp">👥 +${g.length} moving with it <button class="btn small" data-act="groupClear">✕</button></span>`
        : `<button class="btn small" data-act="${t.kind === 'monster' ? 'groupKin' : 'groupParty'}" title="Move them together, keeping their places (or Shift-click creatures to add them)">👥 ${t.kind === 'monster' ? 'Select its kind' : 'Select party'}</button>`;
    }
  }
  if (!t.dead && t.kind !== 'monster' && (dm || mine)) acts += `<button class="btn small" data-act="search">🔍 Search</button>`;
  // the furniture beside it: tap to open its card (open, push, topple, smash…)
  if (!t.dead && (dm || mine)) acts += objectsBeside(t).slice(0, 4).map(p => `<button class="btn small" data-act="selProp" data-k="${p.id}" title="What ${esc(t.name)} can do with it">🪑 ${esc(PROPS[p.k]?.n || p.k)}${p.lock ? ' 🔒' : ''}</button>`).join('');
  if (stairs && (dm || mine) && !t.dead) acts += `<button class="btn small primary" data-act="stairs">${esc(exitLabel(state.floors[t.floor], stairs))}</button>`;
  if (mine && currentTurn()?.id === t.id) acts += `<button class="btn small primary" data-act="endMyTurn">End my turn</button>`;
  acts += `<button class="btn small" data-act="focus">⌖ Focus</button>`;
  if (dm) acts += `<button class="btn small danger" data-act="remove">✕ Remove</button>`;
  const move = state.combat.active && showStats ? ` · ${moveAllowance(t) * 5} ft left${t.dashed ? ' (dashing)' : ''}${t.disengaged ? ' · disengaged' : ''}${t.dodge ? ' · dodging' : ''}${t.reacted ? ' · reaction used' : ''}` : '';
  const flags = [t.flags.rising && '<span class="fam-seep">rising…</span>', t.flags.seeded && '<span class="fam-seep">☣ seeded</span>', t.flags.latchedBy && !t.dead && tokById(t.flags.latchedBy) && !tokById(t.flags.latchedBy).dead && '<span class="fam-seep">a Seepling is latched on</span>', t.flags.alert && dm && 'alerted'].filter(Boolean);
  el.innerHTML = `<div class="top"><span class="dot" style="color:${color};background:${color}"></span><span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''}${mine ? ' <span class="muted">(you)</span>' : ''}${t.cls ? ` <span class="muted" style="font-size:13px">${esc(t.cls)}</span>` : ''}</span>
    ${b ? `<span class="muted">CR ${b.cr}</span>` : ''}<button class="btn small" data-act="deselect">✕</button></div>
    ${showStats ? `<div class="stat">AC <b>${t.ac}</b> · HP <b>${t.hp}/${t.maxHp}</b> · Speed <b>${t.speed} ft</b>${move}${flags.length ? ' · ' + flags.join(' · ') : ''}</div>${hpBar(t, t.kind !== 'monster')}` : (b ? `<div class="look">${esc(b.look)}</div>` : '')}
    ${dm && t.notes ? `<div class="look">${esc(t.notes)}</div>` : ''}
    ${t.conds?.length ? `<div>${condChips(t, dm)}</div>` : ''}
    ${showStats ? resChips(t, dm) : ''}
    <div class="acts">${acts}</div>`;
  el.classList.add('show');
}
// Spell slots as pips (the DM can nudge any resource up or down).
export function resChips(t, dm){
  const rs = (t.resources || []).filter(r => r.slot || dm); if (!rs.length) return '';
  return `<div class="res">${rs.map(r => `<span class="chip" title="${esc(r.n)}">${esc(r.slot ? (r.id === 'pact' ? `Pact L${r.slot}` : `L${r.slot}`) : r.id === 'hd' ? 'HD' : r.n)} ${r.slot || r.max <= 6 ? `<span class="pip">${'●'.repeat(left(t, r.id))}${'○'.repeat(Math.max(0, r.max - left(t, r.id)))}</span>` : `${left(t, r.id)}/${r.max}`}${dm ? ` <b data-act="resAdj" data-k="${r.id}" data-n="-1">−</b> <b data-act="resAdj" data-k="${r.id}" data-n="1">+</b>` : ''}</span>`).join('')}</div>`;
}
function renderDoorCard(el){
  const dr = selectedDoor(); if (!dr){ ui.selDoor = null; el.classList.remove('show'); return; }
  const L = ui.selDoor.floor, f = state.floors[L], x = dr.i % f.W, y = (dr.i / f.W) | 0, dm = isDM();
  const me = tokById(ui.myToken), near = me && me.floor === L && cheb(me.x, me.y, x, y) <= 1;
  const hero = dm ? nearestHero(L, x, y) : me;
  let acts = '';
  if (dm){
    acts += Object.entries(DOOR_STATES).map(([k, v]) => `<button class="btn small ${dr.state === k ? 'on' : ''}" data-act="doorSet" data-k="${k}">${v.label}</button>`).join('');
    acts += `<label class="muted">DC <input class="txt num" type="number" value="${dr.dc}" data-edit="doorDc"></label>`;
    if (hero && dr.state === 'locked') acts += `<button class="btn small" data-act="doorDo" data-k="pick">🗝 ${esc(hero.name)} picks</button><button class="btn small" data-act="doorDo" data-k="force">💥 ${esc(hero.name)} forces</button>`;
    acts += `<button class="btn small danger" data-act="doorDel">✕ Remove door</button>`;
  } else {
    if (!near) acts += `<span class="muted">Stand next to the door to use it.</span>`;
    else if (dr.state === 'locked') acts += `<button class="btn small" data-act="doorDo" data-k="pick">🗝 Pick the lock</button><button class="btn small" data-act="doorDo" data-k="force">💥 Force it</button><button class="btn small" data-act="doorDo" data-k="toggle">Try the handle</button>`;
    else acts += `<button class="btn small primary" data-act="doorDo" data-k="toggle">${dr.state === 'open' ? 'Close' : 'Open'}</button>`;
  }
  el.innerHTML = `<div class="top"><span class="dot" style="color:${DOOR_STATES[dr.state].color};background:${DOOR_STATES[dr.state].color}"></span><span class="nm">Door — ${DOOR_STATES[dr.state].label}${dr.found ? ' <span class="muted">(found)</span>' : ''}</span><button class="btn small" data-act="deselect">✕</button></div>
    <div class="acts">${acts}</div>`;
  el.classList.add('show');
}
function renderPropCard(el){
  const p = selectedProp(); if (!p){ ui.selProp = null; el.classList.remove('show'); return; }
  const L = ui.selProp.floor, f = state.floors[L], dm = isDM(), o = objInfo(p.k), who = actorFor(L, p), door = hiddenDoor(L, p);
  const acts = objectActs(f, p, who, { dm:dm && !who, door });
  let h = acts.map(a => a.act ? `<button class="btn small ${a.why ? 'off' : a.act === 'open' || a.act === 'swing' ? 'primary' : ''}" data-act="propDo" data-k="${a.act}" ${a.why ? `title="${esc(a.why)}"` : ''}>${esc(a.label)}${a.why ? ` <span class="muted">· ${esc(a.why)}</span>` : ''}</button>` : `<span class="muted">${esc(a.label)}</span>`).join('');
  if (dm){
    h += `<div class="prop-dm"><label class="muted">🔒 Lock DC <input class="txt num" type="number" min="0" value="${p.lock || 0}" data-edit="propLock"></label>
      <label class="muted">Inside <input class="txt" placeholder="${o?.open || p.searched ? 'What they find (blank: roll on its table)' : 'What they find if they search it'}" value="${esc(p.contents || '')}" data-edit="propContents"></label>
      <label class="muted">Hidden stash <input class="txt" placeholder="Found with Search — e.g. a false bottom with a key" value="${esc(p.stash?.text || '')}" data-edit="propStash"></label>
      ${p.stash ? `<label class="muted">DC <input class="txt num" type="number" value="${p.stash.dc || 13}" data-edit="propStashDc"></label>${p.stash.found ? ' <span class="chip on">found</span>' : ''}` : ''}
      ${door ? `<div class="muted">Hides a secret door — ${door.state === 'secret' ? 'not yet found' : 'found'}.</div>` : ''}
      ${p.broken || p.fallen || p.swung || p.open ? `<button class="btn small" data-act="propDo" data-k="repair">↺ Set it back</button>` : ''}</div>`;
  }
  const state2 = [p.broken && 'broken', p.fallen && 'toppled', p.swung && 'swung aside', p.open && 'open', p.lock && 'locked'].filter(Boolean).join(' · ');
  el.innerHTML = `<div class="top"><span class="dot" style="color:#c9a246;background:#c9a246"></span><span class="nm">${esc(PROPS[p.k]?.n || p.k)}${state2 ? ` <span class="muted" style="font-size:13px">${esc(state2)}</span>` : ''}</span><button class="btn small" data-act="deselect">✕</button></div>
    ${o ? `<div class="stat">AC <b>${objAC(p)}</b> · HP <b>${objHp(p)}/${objMaxHp(p)}</b> · ${o.m}${who ? ` · <span class="muted">${esc(who.name)} acts</span>` : dm ? ' · <span class="muted">no hero beside it: your hand, no rolls</span>' : ''}</div>` : ''}
    ${p.found ? `<div class="look">Inside: ${esc(p.found)}</div>` : ''}${p.stash?.found ? `<div class="look">Hidden: ${esc(p.stash.text)}</div>` : ''}
    <div class="acts">${h}</div>`;
  el.classList.add('show');
}
function renderTrapCard(el){
  const tr = selectedTrap(); if (!tr){ ui.selTrap = null; el.classList.remove('show'); return; }
  const L = ui.selTrap.floor, f = state.floors[L], x = tr.i % f.W, y = (tr.i / f.W) | 0, k = TRAP_KINDS[tr.kind] || TRAP_KINDS.pit, dm = isDM();
  const me = tokById(ui.myToken), near = me && me.floor === L && cheb(me.x, me.y, x, y) <= 1;
  const hero = dm ? nearestHero(L, x, y) : me;
  let acts = '';
  if (dm){
    acts += `<select class="txt" style="width:auto" data-edit="trapKind">${Object.entries(TRAP_KINDS).map(([id, v]) => `<option value="${id}" ${tr.kind === id ? 'selected' : ''}>${v.icon} ${v.n}</option>`).join('')}</select>`;
    acts += `<button class="btn small ${tr.armed ? 'on' : ''}" data-act="trapToggle" data-k="armed">${tr.armed ? 'Armed' : 'Spent'}</button>`;
    acts += `<button class="btn small ${tr.found ? 'on' : ''}" data-act="trapToggle" data-k="found">${tr.found ? 'Found (players see it)' : 'Hidden'}</button>`;
    if (hero && tr.armed) acts += `<button class="btn small" data-act="trapDisarm">🛠 ${esc(hero.name)} disarms</button>`;
    if (tr.armed) acts += `<button class="btn small danger" data-act="trapFire">Set it off</button>`;
    acts += `<button class="btn small danger" data-act="trapDel">✕ Remove</button>`;
  } else if (tr.armed){
    acts += near ? `<button class="btn small primary" data-act="trapDisarm">🛠 Try to disarm (DC ${k.find})</button>` : `<span class="muted">Stand next to it to try disarming it.</span>`;
  }
  el.innerHTML = `<div class="top"><span class="dot" style="color:#d0393b;background:#d0393b"></span><span class="nm">${k.icon} ${esc(k.n)}${tr.armed ? '' : ' — spent'}</span><button class="btn small" data-act="deselect">✕</button></div>
    <div class="stat">${k.save !== 'none' ? `DC ${k.dc} ${k.save.toUpperCase()} save · ` : ''}${k.dice !== '0' ? `${esc(k.dice)} ${esc(k.type)}` : 'no damage'}${k.rad ? ` · ${k.rad * 5} ft. burst` : ''}${k.cond ? ` · ${k.cond}` : ''} · spot / disarm DC ${k.find}</div>
    ${dm ? `<div class="look">${esc(k.f)}</div>` : ''}
    <div class="acts">${acts}</div>`;
  el.classList.add('show');
}
/* The fight-setup window (⚔ Start a fight…): who's in it, ticked by engine/fight.js's guess (the party; foes in
   sight, close by or alerted), whether identical creatures share a roll, and who's surprised. */
export function openFightSetup(){
  const L = ui.floor, f = state.floors[L], cands = fightCandidates(state.tokens, L, f.W, seenNow[L]);
  if (!cands.length){ toast('No one on this floor.'); return; }
  ui.fight = { L, ids:new Set(cands.filter(c => c.in).map(c => c.t.id)), group:ui.fight?.group ?? true, surprise:'none' };
  renderFightSetup(); $('#fightModal').classList.remove('hidden');
}
export function renderFightSetup(){
  const F = ui.fight; if (!F || !state) return;
  const f = state.floors[F.L], cands = fightCandidates(state.tokens, F.L, f.W, seenNow[F.L]);
  const real = !!state.campaign?.realDice;
  const row = c => { const t = c.t, col = t.kind === 'monster' ? '#c0303a' : t.color, on = F.ids.has(t.id);
    const die = real && t.kind !== 'monster' ? `<input class="txt num" type="number" min="1" max="20" placeholder="d20" title="The d20 they rolled for initiative (blank: the app rolls)" data-edit="fightD20" data-id="${t.id}" value="${F.d20?.[t.id] ?? ''}" onclick="event.stopPropagation()">` : '';
    return `<label class="fpick ${on ? '' : 'out'}"><input type="checkbox" data-edit="fightPick" data-id="${t.id}" ${on ? 'checked' : ''}><span class="dot" style="color:${col};background:${col}"></span><span class="nm">${esc(t.name)}</span><span class="why">${esc(c.why)}</span>${die}</label>`; };
  const party = cands.filter(c => c.t.kind !== 'monster'), foes = cands.filter(c => c.t.kind === 'monster');
  const n = cands.filter(c => F.ids.has(c.t.id)).length, sur = (k, l) => `<button class="btn small ${F.surprise === k ? 'on' : ''}" data-act="fightSurprise" data-k="${k}">${l}</button>`;
  $('#fightBox').innerHTML = `<h3>⚔ Start a fight</h3><div class="muted">On <b>${esc(f.name)}</b>. Ticked creatures roll initiative; the rest of the floor carries on (add them later with + Initiative on their card).</div>
    <h4>The party${real ? ' <span class="muted" style="font-weight:400">· type the d20 each rolled (blank: the app rolls)</span>' : ''}</h4>${party.map(row).join('') || '<div class="muted">No heroes on this floor.</div>'}
    <h4>Foes <span class="muted" style="font-weight:400">· <a class="lnk" data-act="fightAll" data-k="in">all</a> · <a class="lnk" data-act="fightAll" data-k="near">just the close ones</a></span></h4>${foes.map(row).join('') || '<div class="muted">No creatures on this floor.</div>'}
    <label class="fpick"><input type="checkbox" data-edit="fightGroup" ${F.group ? 'checked' : ''}><span>Identical creatures share one roll (they act together)</span></label>
    <h4>Surprise</h4><div class="row">${sur('none', 'Nobody')}${sur('party', 'The party is surprised')}${sur('foes', 'Their foes are surprised')}</div>
    <div class="muted">Surprised creatures roll initiative at disadvantage.</div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="fightGo" ${n ? '' : 'disabled'}>⚔ Roll initiative (${n})</button><button class="btn" data-act="fightCancel">Cancel</button></div>`;
}
export function renderAll(){ document.body.classList.toggle('player', ui.role === 'player' && !ui.screen); renderTop(); renderTabs(); renderPanel(); renderInit(); renderSel(); renderDock(); renderRequests(); renderAskBar(); renderPrompts(); renderOA(); }
