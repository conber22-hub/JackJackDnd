/* 🛒 THE TRADE WINDOW — the DM opens it from a seller's card (game/folk.js): pick the hero who's buying, see the
   day's goods at today's prices, haggle (a Persuasion roll) and buy; or sell from the hero's pack. The hero's sheet,
   coins and pack change as the DM's always do (game/trade.js → applyCharacter), and go back to the player. */
import { state, ui, tokById } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { itemInfo, coinValueGp, migrateSheet } from '../engine/inventory.js';
import { stockOf, tradingHeroes, haggleFor, buyFrom, sellTo } from '../game/trade.js';
import { folkPlace, folkAt, roleName } from '../game/folk.js';

let T = null;   // { L, pid, hero, deals:{ name:{ gp, line } } }
function modal(){
  let m = $('#tradeModal');
  if (!m){ m = document.createElement('div'); m.className = 'modal hidden'; m.id = 'tradeModal'; m.innerHTML = '<div class="box" id="tradeBox"></div>'; document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closeTrade(); }); }
  return m;
}
export function openTrade(L, pid, heroId = null){
  const p = folkAt(L, pid); if (!p) return;
  const heroes = tradingHeroes(L);
  const near = heroes.slice().sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  T = { L, pid, hero:heroId || near?.id || null, deals:{} };
  modal().classList.remove('hidden'); renderTrade();
}
export function closeTrade(){ T = null; $('#tradeModal')?.classList.add('hidden'); }
export function renderTrade(){
  if (!T) return;
  const p = folkAt(T.L, T.pid), box = $('#tradeBox'); if (!p || !box){ closeTrade(); return; }
  const place = folkPlace(T.L), rows = stockOf(p, place), heroes = tradingHeroes(T.L), hero = tokById(T.hero);
  const sheet = hero && migrateSheet(state.characters[hero.charId]);
  const sellable = (sheet?.inv || []).filter(i => !i.equipped && !i.attuned && Number.isFinite(itemInfo(i)?.cost));
  box.innerHTML = `<h1 style="font-size:24px">🛒 ${esc(p.name)} <span class="muted" style="font-size:15px">${esc(roleName(p))}</span></h1>
    <div class="row"><label class="muted">Buying: <select class="txt" style="width:auto" data-edit="tradeHero">${heroes.map(h => `<option value="${h.id}" ${h.id === T.hero ? 'selected' : ''}>${esc(h.name)}</option>`).join('') || '<option>no hero with a sheet</option>'}</select></label>
      ${sheet ? `<span class="muted">· ${+coinValueGp(sheet.coins).toFixed(2)} gp in their purse</span>` : ''}</div>
    ${heroes.length ? '' : '<div class="muted">Only heroes with a character sheet can trade (bring one to the table, or make one in the Tokens tab).</div>'}
    <h3>For sale today</h3>
    ${rows.map((r, i) => { const deal = T.deals[r.n]; return `<div class="packRow"><span class="packN">${r.made ? '🔨 ' : ''}${esc(r.n)} <span class="muted">×${r.qty}${r.made ? ' · their own work' : ''}</span></span>
      <span>${deal ? `<s class="muted">${r.gp}</s> <b>${deal.gp} gp</b>` : `<b>${r.gp} gp</b>`}</span>
      <span class="packB">${deal ? '' : `<button class="btn small" data-act="tradeHaggle" data-i="${i}" ${hero ? '' : 'disabled'}>🗣 Haggle</button>`}<button class="btn small primary" data-act="tradeBuy" data-i="${i}" ${hero && r.qty ? '' : 'disabled'}>Buy</button></span>
      ${deal ? `<div class="muted" style="flex-basis:100%">“${esc(deal.line)}” <span class="muted">(Persuasion ${deal.raw}+${deal.bonus} vs ${deal.dc})</span></div>` : ''}</div>`; }).join('') || '<div class="muted">Nothing to sell today.</div>'}
    ${sheet ? `<h3>Sell from ${esc(hero.name)}'s pack <span class="muted">(half price)</span></h3>
      ${sellable.map(it => `<div class="packRow"><span class="packN">${esc(it.n)}${(it.qty ?? 1) > 1 ? ` <span class="muted">×${it.qty}</span>` : ''}</span><span class="muted">${Math.floor(itemInfo(it).cost * 50) / 100} gp</span>
        <span class="packB"><button class="btn small" data-act="tradeSell" data-id="${esc(it.id)}">Sell</button></span></div>`).join('') || '<div class="muted">Nothing they could sell here (equipped and attuned things stay on).</div>'}` : ''}
    <div class="row"><button class="btn" data-act="tradeClose">Done</button></div>`;
}
// the buttons (ui/events.js passes them here)
export function tradeAct(a, el){
  if (!T) return;
  const p = folkAt(T.L, T.pid), hero = tokById(T.hero), place = folkPlace(T.L), rows = p && stockOf(p, place);
  if (a === 'tradeClose'){ closeTrade(); return; }
  if (!p || !hero) return;
  if (a === 'tradeHaggle'){ const r = rows[+el.dataset.i]; if (r) T.deals[r.n] = haggleFor(hero, r); }
  else if (a === 'tradeBuy'){ const r = rows[+el.dataset.i]; if (r) buyFrom(hero, r, T.deals[r.n]?.gp ?? r.gp, p); }
  else if (a === 'tradeSell') sellTo(hero, el.dataset.id, p, place);
  renderTrade();
}
export function tradeHero(id){ if (T){ T.hero = id; T.deals = {}; renderTrade(); } }
