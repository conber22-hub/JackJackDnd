/* HUD — toasts, banners, whispers, pop-up cards, top bar, dock, initiative list, selection card. */
import { state, ui, tokById, isDM, dreadLevel, viewAsPlayer } from '../engine/state.js';
import { exitLabel } from '../engine/generator.js';
import { seenNow } from '../engine/grid.js';
import { BEST } from '../data/bestiary.js';
import { CONDITIONS } from '../data/dread.js';
import { TRAP_KINDS, DOOR_STATES } from '../data/rooms.js';
import { $, esc, clamp, cheb } from '../util/core.js';
import { broadcast, net } from '../net/table.js';
import { currentTurn, moveAllowance } from '../game/rules.js';
import { onStairs, selectedDoor, selectedTrap, nearestHero } from '../game/actions.js';
import { undoCount } from '../game/session.js';
import { renderPanel } from './panels.js';
import { canCast, left } from '../game/resources.js';
import { legendOf, legendLeft, resistLeft, lairCreature } from '../game/combat.js';
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
    : [['story', 'Story'], ['valley', 'Valley'], ['tokens', 'Tokens'], ['bestiary', 'Beasts'], ['dungeon', 'Dungeon'], ['build', 'Build'], ['gaze', 'Gaze'], ['table', 'Table']];
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

export function renderInit(){
  if (!state) return;
  const bar = $('#initBar'), c = state.combat, pv = viewAsPlayer();
  bar.classList.toggle('hidden', !c.active && ui.role === 'player');
  $('#roundLbl').textContent = c.active ? `Round ${c.round}` : '';
  if (!c.active){
    $('#initList').innerHTML = `<div class="muted" style="padding:8px">No fight yet. Roll initiative for everyone on this floor.</div>`;
    $('#initBtns').innerHTML = ui.role === 'dm' ? `<button class="btn primary" data-act="rollInit">⚔ Roll initiative</button>` : '';
    return;
  }
  $('#initList').innerHTML = c.order.map((id, i) => {
    const t = tokById(id); if (!t || t.flags.gone) return '';
    if (pv && t.kind === 'monster' && !seenNow[t.floor]?.has(t.y * state.floors[t.floor].W + t.x) && i !== c.idx) return `<div class="ini"><span class="dot" style="color:#555;background:#555"></span><span class="n muted">something unseen</span></div>`;
    const color = t.kind === 'monster' ? '#c0303a' : t.color;
    const cs = (t.conds || []).map(c => CONDITIONS[c.n]?.icon || '•').join('');
    return `<div class="ini ${i === c.idx ? 'cur' : ''} ${t.dead ? 'dead' : ''}" data-act="sel" data-id="${t.id}"><span class="dot" style="color:${color};background:${color}"></span><span class="n">${esc(t.name)} <span class="muted">${cs}</span></span><span class="v">${t.initRoll ?? ''}</span></div>`;
  }).join('');
  const cur = currentTurn();
  const lair = ui.role === 'dm' && lairCreature();
  $('#initBtns').innerHTML = ui.role === 'dm'
    ? `${lair ? `<button class="btn small seep" data-act="lair" title="${esc(lair.name)}'s lair acts on initiative 20">🏰 Lair</button>` : ''}<button class="btn primary" data-act="nextTurn">Next ▶</button><button class="btn small" data-act="rollInit" title="Re-roll">↻</button><button class="btn small danger" data-act="endCombat">End</button>`
    : (cur && cur.id === ui.myToken ? `<button class="btn primary" data-act="endMyTurn">End my turn</button>` : '');
}

export function renderSel(){
  const el = $('#selCard');
  if (!state){ el.classList.remove('show'); return; }
  if (ui.selDoor) return renderDoorCard(el);
  if (ui.selTrap) return renderTrapCard(el);
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
    acts += t.attacks.map((a, i) => `<button class="btn small ${a.l && !canCast(t, a.l, a.n) ? 'off' : ''}" data-act="atk" data-i="${i}">🗡 ${esc(a.n)} <span class="muted">${a.b >= 0 ? '+' : ''}${a.b} · ${esc(a.d)}${a.l ? ` · L${a.l}` : ''}</span></button>`).join('');
    if (dm && b?.specials) acts += b.specials.map((s, i) => `<button class="btn small seep" data-act="special" data-i="${i}">✦ ${esc(s.n)}</button>`).join('');
    const lg = dm && legendOf(t);
    if (lg?.legendary) acts += `<span class="chip on" title="Back at the start of its turn">⚜ ${legendLeft(t)}/${lg.legendary.n}</span>` + lg.legendary.acts.map((a, i) => `<button class="btn small ${legendLeft(t) < (a.cost || 1) ? 'off' : ''}" data-act="legend" data-i="${i}" title="${esc(a.f || '')}">⚜ ${esc(a.n)}${a.cost > 1 ? ` <span class="muted">(${a.cost})</span>` : ''}</button>`).join('');
    if (lg?.resist) acts += `<button class="btn small ${resistLeft(t) ? '' : 'off'}" data-act="lres">🛡 Legendary Resistance ${resistLeft(t)}/${lg.resist}</button>`;
    if (t.casts?.length) acts += t.casts.map((s, i) => `<button class="btn small ${!canCast(t, s.l, s.n) ? 'off' : ''}" data-act="cast" data-i="${i}" title="${s.k === 'heal' ? 'Heal' : s.d ? `${esc(s.d)} ${esc(s.ty || '')}` : esc(s.cond || s.note || s.k)}${s.sv ? ` · DC ${s.dc} ${s.sv.toUpperCase()}` : ''}${s.rad ? ` · ${s.rad * 5} ft.` : ''}">✨ ${esc(s.n)}${s.l ? ` <span class="muted">L${s.l}</span>` : ''}</button>`).join('');
    acts += (t.resources || []).filter(r => !r.slot).map(r => `<button class="btn small ${left(t, r.id) ? '' : 'off'}" data-act="feat" data-k="${r.id}" title="${esc(r.text || '')}">${r.use === 'hitdie' ? '🎲' : '✦'} ${esc(r.id === 'hd' ? 'Hit Die' : r.n)} <span class="muted">${left(t, r.id)}/${r.max}</span></button>`).join('');
  }
  if (dm){
    acts += `<span style="display:inline-flex;gap:4px;align-items:center"><input class="txt num" id="hpAmt" type="number" value="5" min="0"><button class="btn small danger" data-act="dmg">− HP</button><button class="btn small" data-act="heal">+ HP</button></span>`;
    acts += `<select class="txt" style="width:auto" data-edit="addCond"><option value="">+ condition…</option>${Object.keys(CONDITIONS).map(k => `<option value="${k}">${CONDITIONS[k].icon} ${k}</option>`).join('')}</select>`;
    if (t.dead && t.kind !== 'pc' && (t.kind === 'npc' || b?.tags?.includes('host'))) acts += `<button class="btn small seep" data-act="infest">☣ Infest</button>`;
    if (state.combat.active && !state.combat.order.includes(t.id)) acts += `<button class="btn small" data-act="joinInit">+ Initiative</button>`;
  }
  if (!t.dead && t.kind !== 'monster' && (dm || mine)) acts += `<button class="btn small" data-act="search">🔍 Search</button>`;
  if (stairs && (dm || mine) && !t.dead) acts += `<button class="btn small primary" data-act="stairs">${esc(exitLabel(state.floors[t.floor], stairs))}</button>`;
  if (mine && currentTurn()?.id === t.id) acts += `<button class="btn small primary" data-act="endMyTurn">End my turn</button>`;
  acts += `<button class="btn small" data-act="focus">⌖ Focus</button>`;
  if (dm) acts += `<button class="btn small danger" data-act="remove">✕ Remove</button>`;
  const move = state.combat.active && showStats ? ` · ${moveAllowance(t) * 5} ft left` : '';
  const flags = [t.flags.rising && '<span class="fam-seep">rising…</span>', t.flags.seeded && '<span class="fam-seep">☣ seeded</span>', t.flags.latchedBy && !t.dead && tokById(t.flags.latchedBy) && !tokById(t.flags.latchedBy).dead && '<span class="fam-seep">a Seepling is latched on</span>', t.flags.alert && dm && 'alerted'].filter(Boolean);
  el.innerHTML = `<div class="top"><span class="dot" style="color:${color};background:${color}"></span><span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''}${mine ? ' <span class="muted">(you)</span>' : ''}${t.cls ? ` <span class="muted" style="font-size:13px">${esc(t.cls)}</span>` : ''}</span>
    ${b ? `<span class="muted">CR ${b.cr}</span>` : ''}<button class="btn small" data-act="deselect">✕</button></div>
    ${showStats ? `<div class="stat">AC <b>${t.ac}</b> · HP <b>${t.hp}/${t.maxHp}</b> · Speed <b>${t.speed} ft</b>${move}${flags.length ? ' · ' + flags.join(' · ') : ''}</div>${hpBar(t, t.kind !== 'monster')}` : (b ? `<div class="look">${esc(b.look)}</div>` : '')}
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
export function renderAll(){ renderTop(); renderTabs(); renderPanel(); renderInit(); renderSel(); renderDock(); }
