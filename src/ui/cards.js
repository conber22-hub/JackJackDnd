/* CARD ONLY — a player's phone at an in-person game, where the TV has the map. No 3D on the phone (it stays
   cool and the battery lasts): just their hero as a big card, their attacks, spells and features as big
   buttons, a list of who they can target (with what's in reach), the d20 they rolled if the table uses real
   dice, and a pad to step their hero one square at a time (north is up, as on the TV). */
import { state, ui, tokById } from '../engine/state.js';
import { $, esc, cheb } from '../util/core.js';
import { rangeCheck, coverOf, areaOf, areaSquares, spellReach } from '../engine/targeting.js';
import { tokGap } from '../engine/movement.js';
import { requestAct } from '../game/requests.js';
import { askD20 } from '../game/night.js';
import { canCast, left } from '../game/resources.js';
import { requestMove } from '../game/actions.js';
import { currentTurn } from '../game/rules.js';

const KEY = 'dreaddelve.cardonly';
export function setCardOnly(on){
  ui.cardOnly = !!on; try { localStorage.setItem(KEY, on ? '1' : ''); } catch {}
  document.body.classList.toggle('cardonly', ui.cardOnly);
}
export function initCardOnly(){ let on = false; try { on = !!localStorage.getItem(KEY); } catch {} if (on) setCardOnly(true); }

const me = () => tokById(ui.myToken);
// Everyone the hero could aim at, nearest first, with whether it's in reach. foes: true for attacks and harm.
function targets(t, ok, foes = true){
  return state.tokens.filter(o => o.floor === t.floor && !o.dead && !o.flags?.gone && (foes ? o.id !== t.id && o.kind === 'monster' : o.kind !== 'monster'))
    .map(o => ({ t:o, ok:ok(o), ft:tokGap(t, o) * 5 })).sort((a, b) => b.ok - a.ok || a.ft - b.ft);
}
function pick(title, list, cb){
  $('#pickBox').innerHTML = `<h3>${esc(title)}</h3>${list.length ? list.map((x, i) => `<button class="btn pickrow ${x.ok ? '' : 'off'}" data-pick="${i}"><span>${esc(x.t.name)}</span><span class="muted">${x.ft} ft${x.ok ? '' : ' · out of reach'}</span></button>`).join('') : '<div class="muted">Nobody you can see.</div>'}
    <div class="row"><button class="btn" data-pick="cancel">Cancel</button></div>`;
  $('#pickModal').classList.remove('hidden');
  $('#pickBox').onclick = e => { const b = e.target.closest('[data-pick]'); if (!b) return; $('#pickModal').classList.add('hidden'); $('#pickBox').onclick = null;
    if (b.dataset.pick !== 'cancel') cb(list[+b.dataset.pick].t); };
}
// An attack, a spell or a feature tapped on the card.
export function cardAct(kind, i, res){
  const t = me(); if (!t) return;
  if (kind === 'atk'){
    const a = t.attacks[i]; if (!a) return;
    pick(`${a.n} — at whom?`, targets(t, o => rangeCheck(t, o, a).ok && coverOf(t, o).cover !== 'total'), tg => {
      const send = d20 => requestAct({ kind:'attack', id:t.id, i, target:tg.id, mode:ui.atkMode, ...(d20 ? { d20 } : {}) });
      if (state.realDice) askD20(`${t.name}: ${a.n} → ${tg.name}`, send); else send(null);
      ui.atkMode = 'normal';
    });
  } else if (kind === 'cast'){
    const sp = t.casts[i]; if (!sp) return;
    const area = areaOf(sp), heal = sp.k === 'heal' || sp.k === 'buff';
    if (area && area.shape === 'aura'){ requestAct({ kind:'cast', id:t.id, i, target:t.id, aim:{ x:t.x, y:t.y } }); return; }
    const ok = o => area ? areaSquares(t, area, { x:o.x, y:o.y }).ok : o.id === t.id || (tokGap(t, o) <= Math.max(1, spellReach(sp)) && coverOf(t, o).cover !== 'total');
    pick(`${sp.n} — ${area ? 'centred on whom?' : heal ? 'on whom?' : 'at whom?'}`, targets(t, ok, !heal), tg =>
      requestAct({ kind:'cast', id:t.id, i, target:tg.id, ...(area ? { aim:{ x:tg.x, y:tg.y } } : {}) }));
  } else if (kind === 'feat'){
    const r = t.resources?.find(r => r.id === res); if (!r) return;
    if (r.use === 'lay') pick(`${r.n} — who?`, targets(t, o => cheb(t.x, t.y, o.x, o.y) <= 1, false), tg => requestAct({ kind:'feat', id:t.id, res, target:tg.id }));
    else requestAct({ kind:'feat', id:t.id, res, target:t.id });
  }
}
export function cardStep(dx, dy){ const t = me(); if (t) requestMove(t, t.x + dx, t.y + dy); }

// The big card (the Hero tab in card-only mode).
export function cardHTML(t){
  const turn = currentTurn()?.id === t.id, fight = state.combat.active;
  const btn = (k, i, label, sub, off, extra = '') => `<button class="btn cact ${off ? 'off' : ''}" data-act="cardAct" data-k="${k}" data-i="${i}" ${extra}><b>${esc(label)}</b><span>${esc(sub)}</span></button>`;
  let h = `<div class="cbig">${fight ? `<div class="cturn ${turn ? 'on' : ''}">${turn ? 'Your turn' : `${esc(currentTurn()?.name || '…')}'s turn`}</div>` : ''}`;
  h += `<h4>Attack <button class="btn small ${ui.atkMode !== 'normal' ? 'on' : ''}" data-act="atkMode">${ui.atkMode === 'adv' ? '▲ Advantage' : ui.atkMode === 'dis' ? '▼ Disadvantage' : '◆ Normal'}</button></h4><div class="cgrid">`
    + t.attacks.map((a, i) => btn('atk', i, a.n, `${a.b >= 0 ? '+' : ''}${a.b} · ${a.d}`, a.l && !canCast(t, a.l, a.sn || a.n, a.again))).join('') + `</div>`;
  if (t.casts?.length) h += `<h4>Spells</h4><div class="cgrid">` + t.casts.map((s, i) => btn('cast', i, s.n, s.l ? `level ${s.l}` : 'cantrip', !canCast(t, s.l, s.n, s.again))).join('') + `</div>`;
  const feats = (t.resources || []).filter(r => !r.slot);
  if (feats.length) h += `<h4>Features</h4><div class="cgrid">` + feats.map(r => btn('feat', 0, r.id === 'hd' ? 'Hit Die' : r.n, `${left(t, r.id)}/${r.max}`, !left(t, r.id), `data-res="${r.id}"`)).join('') + `</div>`;
  h += `<h4>Move <span class="muted" style="font-weight:400">one square a tap · north is up, as on the TV</span></h4><div class="dpad">${[[-1, -1, '↖'], [0, -1, '↑'], [1, -1, '↗'], [-1, 0, '←'], [0, 0, '·'], [1, 0, '→'], [-1, 1, '↙'], [0, 1, '↓'], [1, 1, '↘']].map(([dx, dy, a]) => dx || dy ? `<button class="btn" data-act="cardStep" data-k="${dx},${dy}">${a}</button>` : '<span></span>').join('')}</div>`;
  return h + `</div>`;
}
