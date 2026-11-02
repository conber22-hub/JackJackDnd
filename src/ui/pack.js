/* 🎒 THE PACK — what a hero carries, wears, wields and is attuned to (engine/inventory.js, Codex's; engine/gear.js).
   Magic that's a number counts by itself: +1 armour and weapons, a Cloak or Ring of Protection, Bracers of Archery.
   The rest is listed for the DM to rule on. Coins and weight too.
   The DM edits the sheet they keep (state.characters), which updates the hero's token and goes back to the player;
   a player edits their own copy and sends it to the DM, the same way an edited sheet always has. */
import { state, ui } from '../engine/state.js';
import { esc, uid } from '../util/core.js';
import { heroStats } from '../engine/hero.js';
import { migrateSheet, canEquip, itemInfo, itemEffects, coinValueGp, load } from '../engine/inventory.js';
import { mirrorGear } from '../engine/gear.js';
import { SRD_WEAPONS, ARMOR_ITEMS, TOOLS, GEAR, MAGIC_ITEMS } from '../data/srd-items.js';
import { myHero, saveMyHero, applyCharacter } from '../game/heroes.js';
import { sendHost, sendSheetToOwner, net } from '../net/table.js';
import { toast } from './hud.js';

const COINS = [['pp', 'Platinum'], ['gp', 'Gold'], ['ep', 'Electrum'], ['sp', 'Silver'], ['cp', 'Copper']];
const qty = i => Number.isFinite(i.qty) ? i.qty : 1;

// The sheet a pack edits: the DM's own record, or the player's copy of their hero.
const sheetFor = id => ui.role === 'dm' ? state.characters?.[id] || null : myHero(id);

/* Change a hero's pack. fn gets a sheet that surely has one (an old sheet gets its pack made from its armour, shield
   and weapons, the first time) and returns false to call it off. */
export function editPack(id, fn){
  const cur = sheetFor(id); if (!cur) return false;
  let h = migrateSheet(cur);
  if (fn(h) === false) return false;
  h = mirrorGear(h);   // the creator's armour, shield and weapons, and the mini's look, follow what's equipped
  if (ui.role === 'dm'){ applyCharacter(h, { place:false }); sendSheetToOwner(h.id); }
  else { saveMyHero(h); if (!sendHost({ t:'char', char:h }) && net.join) net.join.dirty = h.id; }
  return true;
}

export function packAction(id, k, itemId, extra){
  return editPack(id, h => {
    const it = h.inv.find(i => i.id === itemId);
    if (k === 'add'){
      const name = String(extra || '').trim(); if (!name) return false;
      const info = itemInfo(name), have = h.inv.find(i => i.n.toLowerCase() === (info?.n || name).toLowerCase() && !i.equipped);
      if (have && !info?.magic && info?.kind !== 'armor') have.qty = qty(have) + 1;   // another torch: one more in the stack
      else h.inv.push({ id:uid(), n:info?.n || name, qty:1, equipped:false, attuned:false });
      if (!info) toast(`"${name}" isn't in the rules — it's carried, and the DM decides what it does.`);
      return;
    }
    if (!it) return false;
    if (k === 'equip' || k === 'attune'){
      const field = k === 'equip' ? 'equipped' : 'attuned';
      it[field] = !it[field];
      if (it[field]){ const ok = canEquip(h, it.id); if (!ok.ok){ toast(ok.why); return false; } }
    }
    else if (k === 'inc') it.qty = qty(it) + 1;
    else if (k === 'dec' || k === 'drop'){
      it.qty = k === 'drop' ? 0 : qty(it) - 1;
      if (it.qty <= 0) h.inv = h.inv.filter(i => i !== it);
    }
  });
}
export function setCoin(id, k, v){
  return editPack(id, h => { h.coins = { ...h.coins, [k]:Math.max(0, Math.floor(+v || 0)) }; });
}

// (a pack stays open, or shut, across the panel's redraws: <details> toggles don't bubble, so listen on the way down)
document.addEventListener('toggle', e => { const id = e.target?.dataset?.pack; if (id) (ui.packOpen ||= {})[id] = e.target.open; }, true);

// Every name the catalogues know, for the Add box (and the +1/+2/+3 armour and weapons people actually find).
let names = null;
function catalogue(){
  if (names) return names;
  const plus = [...SRD_WEAPONS.map(w => w.n), ...ARMOR_ITEMS.filter(a => a.t !== 'shield').map(a => a.n), 'Shield'].flatMap(n => [1, 2, 3].map(k => `${n}, +${k}`));
  names = [...new Set([...SRD_WEAPONS, ...ARMOR_ITEMS, ...TOOLS, ...GEAR, ...MAGIC_ITEMS].map(i => i.n).filter(n => !/, \+1, \+2, or \+3$/.test(n)).concat(plus))].sort();
  return names;
}
const icon = x => !x ? '•' : x.kind === 'weapon' ? '⚔' : x.kind === 'armor' || x.kind === 'shield' ? '🛡' : x.magic ? '✦' : '•';

/* The pack, for a sheet (its own panel on the player's screen; under the hero's card in the DM's Tokens tab). */
export function packHTML(sheet){
  const h = Array.isArray(sheet.inv) ? sheet : migrateSheet(sheet);
  const st = heroStats(h), fx = itemEffects(h), ld = load(h, st.sc.Str);
  const rows = h.inv.map(i => {
    const x = itemInfo(i.n), wearable = x && (['armor', 'shield', 'weapon'].includes(x.kind) || x.magic);
    const wt = x?.weight ? `${+(x.weight * qty(i)).toFixed(2)} lb` : '';
    const b = (k, label, on = false, title = '') => `<button class="btn small ${on ? 'on' : ''}" data-act="pack" data-k="${k}" data-id="${esc(h.id)}" data-i="${esc(i.id)}"${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
    return `<div class="packRow ${i.equipped ? 'on' : ''}"><span class="packN">${icon(x)} ${esc(i.n)}${qty(i) > 1 ? ` <span class="muted">×${qty(i)}</span>` : ''}${x?.attune ? ` <span class="muted" title="${esc(x.attune)}">${i.attuned ? '✦ attuned' : 'needs attuning'}</span>` : ''}${x ? '' : ' <span class="muted">(the DM\'s call)</span>'}</span>
      <span class="muted">${wt}</span>
      <span class="packB">${wearable ? b('equip', i.equipped ? '✓ ' + (x.kind === 'weapon' ? 'In hand' : 'Worn') : x.kind === 'weapon' ? 'Wield' : 'Wear', i.equipped) : ''}${x?.attune ? b('attune', i.attuned ? '✦' : 'Attune', i.attuned, 'Attune (a short rest with it); three at most') : ''}${b('dec', '−', false, 'One fewer')}${b('inc', '+', false, 'One more')}</span></div>`;
  }).join('');
  const counts = [fx.ac ? `AC ${fx.ac > 0 ? '+' : ''}${fx.ac}` : '', fx.saves ? `saves +${fx.saves}` : '', fx.spellDc ? `spell DC +${fx.spellDc}` : '', fx.spellAttack ? `spell attacks +${fx.spellAttack}` : '',
    ...Object.entries(fx.attack).map(([w, n]) => `${w}: +${n} to hit${fx.damage[w] ? `, +${fx.damage[w]} damage` : ''}`)].filter(Boolean);
  // what's worn but not a number the app can add (Boots of Elvenkind, a Bag of Holding): the DM's to rule on
  const counted = x => [x.acBonus, x.saves, x.atk, x.dmgBonus, x.spellAttack, x.spellDc].some(v => Number.isFinite(v) && v !== 0);
  const rule = fx.notes.filter(n => { const x = itemInfo(n); return x && !counted(x); });
  return `<details class="card pack" ${ui.packOpen?.[h.id] ? 'open' : ''} data-pack="${esc(h.id)}"><summary>🎒 Pack <span class="muted">· ${h.inv.length} thing${h.inv.length === 1 ? '' : 's'} · ${+ld.weight.toFixed(1)}/${ld.capacity} lb${ld.over ? ' — <b style="color:var(--blood)">too heavy</b>' : ''} · ${+coinValueGp(h.coins).toFixed(2)} gp</span></summary>
    ${rows || '<div class="muted">Nothing yet.</div>'}
    ${counts.length ? `<div class="muted">Counting: ${esc(counts.join(' · '))}</div>` : ''}
    ${rule.length ? `<div class="muted">The DM rules on: ${esc(rule.join(', '))} <span class="muted">(📖 Look it up for what they do)</span></div>` : ''}
    <div class="row"><input class="txt" style="flex:1" list="packNames" id="packAdd-${esc(h.id)}" placeholder="Add: a rope, a potion, Longsword, +1…"><button class="btn small primary" data-act="pack" data-k="add" data-id="${esc(h.id)}">Add</button></div>
    <datalist id="packNames">${catalogue().map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="packCoins">${COINS.map(([k, n]) => `<label title="${n}">${k}<input class="txt" type="number" min="0" data-edit="packCoin" data-k="${k}" data-id="${esc(h.id)}" value="${h.coins?.[k] || 0}"></label>`).join('')}</div>
  </details>`;
}
