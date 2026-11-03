/* TRADE AND TROUBLES AT THE TABLE — the valley's smith, peddler and priest sell what they have (engine/trade.js,
   Codex's: a day's stock at the catalogue's price, dearer as his Gaze rises; a Persuasion roll to haggle; buying and
   selling with the hero's own coins and pack), and the folk ask the party for help (troublesFor: a lost child, a
   captive, a farm raided by one of the Count's court, someone gone missing — who may be one of his eyes).
   All of it on the DM's browser. The stock and the troubles live in the campaign (state.campaign.stock, .troubles),
   which never reaches the players (engine/redact.js); a person with a trouble shows ❗ to everyone. */
import { state, ui, tokById } from '../engine/state.js';
import { stockFor, haggle, buy, sell, troublesFor, resolve } from '../engine/trade.js';
import { wares } from '../engine/crafting.js';
import { migrateSheet } from '../engine/inventory.js';
import { spendCoins, addCoins } from '../engine/coins.js';
export { spendCoins, addCoins };
import { heroStats } from '../engine/hero.js';
import { mulberry32, hashSeed, d } from '../util/core.js';
import { log } from '../engine/state.js';
import { toast, showCard } from '../ui/hud.js';
import { changed } from './session.js';
import { applyCharacter } from './heroes.js';
import { sendSheetToOwner } from '../net/table.js';
import { court } from './court.js';

export const SELLERS = ['smith', 'peddler', 'priest'];
const day = () => state.campaign?.valley?.day ?? 0;
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|trade|${tick++}`));

/* ---------- the stock: a day's goods for one seller, kept so what's sold stays sold ---------- */
export function stockOf(p, place){
  const C = state.campaign, key = `${p.id}|${day()}`;
  C.stock ||= {};
  if (!C.stock[key]){
    for (const k of Object.keys(C.stock)) if (!k.endsWith(`|${day()}`)) delete C.stock[k];   // yesterday's shelves are gone
    // the catalogue's goods, and (a smith) the pieces they made themselves this week (engine/crafting.js wares)
    C.stock[key] = [...stockFor(p, { place, gaze:state.dread || 1, day:day(), seed:state.meta.seed }),
      ...wares(p, { place, gaze:state.dread || 1, day:day(), seed:state.meta.seed }).map(w => ({ n:w.n, qty:w.qty, gp:w.gp, custom:w.custom, made:true }))];
  }
  return C.stock[key];
}
// a hero who can trade: one with a sheet the DM keeps
export const tradingHeroes = L => state.tokens.filter(t => t.charId && state.characters?.[t.charId] && !t.dead && !t.flags?.gone && (L == null || t.floor === L));

/* Haggle for one thing: the hero's Persuasion against the seller (DC 10, a point harder for each point of his Gaze
   over 2: everyone is short of everything). → the price agreed, and what the seller says */
export function haggleFor(heroTok, row){
  const sheet = state.characters[heroTok.charId], bonus = heroStats(sheet).skills?.Persuasion ?? 0, raw = d(20);
  const dc = 10 + Math.max(0, (state.dread || 1) - 2);
  const r = haggle(row.gp, { roll:{ total:raw + bonus, raw }, dc }, rng());
  log(`${heroTok.name} haggles over ${row.n}: d20 ${raw} + ${bonus} vs DC ${dc} → ${r.gp} gp.`, true);
  return { ...r, raw, bonus, dc };
}
export function buyFrom(heroTok, row, gp, seller){
  const sheet = state.characters[heroTok.charId];
  if (!row.qty){ toast('Sold out.'); return false; }
  const r = row.custom ? buyMade(sheet, row, gp) : buy(sheet, row, gp);
  if (!r.ok){ toast(r.why); return false; }
  r.sheet.coins = spendCoins(migrateSheet(sheet).coins, r.gp) || r.sheet.coins;   // the change in gold and silver, not platinum
  row.qty--;
  applyCharacter(r.sheet, { place:false }); sendSheetToOwner(r.sheet.id);
  log(`${heroTok.name} buys ${row.n} from ${seller.name} for ${r.gp} gp.`);
  changed(); return true;
}
// A piece the smith made: it goes into the pack with its own numbers (engine/inventory.js reads entry.custom).
function buyMade(sheet, row, gp){
  const out = migrateSheet(sheet), coins = spendCoins(out.coins, gp);
  if (!coins) return { ok:false, why:'There is not enough coin.' };
  out.coins = coins;
  out.inv.push({ id:`made-${Date.now().toString(36)}`, n:row.n, custom:structuredClone(row.custom), qty:1, equipped:false, attuned:false });
  return { ok:true, sheet:out, gp };
}
export function sellTo(heroTok, itemId, seller, place){
  const sheet = state.characters[heroTok.charId], it = sheet.inv?.find(i => i.id === itemId);
  const r = it?.custom ? sellMade(sheet, it) : sell(sheet, itemId, { person:{ ...seller, place } });
  if (!r.ok){ toast(r.why); return false; }
  r.sheet.coins = addCoins(migrateSheet(sheet).coins, r.gp);
  applyCharacter(r.sheet, { place:false }); sendSheetToOwner(r.sheet.id);
  log(`${heroTok.name} sells ${it?.n || 'something'} to ${seller.name} for ${r.gp} gp.`);
  changed(); return true;
}

// A crafted piece sells at half what went into it (the catalogue doesn't know it by name).
function sellMade(sheet, it){
  if (it.equipped || it.attuned) return { ok:false, why:'Put it away and end attunement before selling it.' };
  const out = migrateSheet(sheet), gp = Math.floor((it.custom.cost || 0) * 50) / 100;
  out.inv = out.inv.filter(i => i.id !== it.id);
  return { ok:true, sheet:out, gp };
}

/* ---------- troubles ---------- */
export const troubles = () => (state.campaign.troubles ||= []);
export const openTroubleBy = pid => troubles().find(t => t.by === pid && t.status === 'open') || null;
// Who on this floor is asking for help (❗ over them), from the open troubles.
export function markAsking(f){
  for (const p of f?.folk || []){ const ask = !!openTroubleBy(p.id); if (ask) p.ask = true; else delete p.ask; }
}
/* What the folk here need, the first time the party is here and each dawn: new troubles join the list (by id, so
   a finished one never comes back). place: { id, kind } (game/folk.js folkPlace) */
export function freshTroubles(f, place){
  if (!f?.folk?.length || !place) return;
  const known = new Set(troubles().map(t => t.id));
  for (const t of troublesFor(f.folk.map(p => ({ ...p, place })), court(), { place, gaze:state.dread || 1, day:day() }, rng())) if (!known.has(t.id)) troubles().push(t);
  markAsking(f);
}
/* The DM says how it went: done, failed or ignored. The asker's mood moves; a reward is named for the DM to give;
   a raid left unanswered makes its court member bolder; a missing one comes home (and they were one of his eyes). */
export function settleTrouble(id, outcome){
  const i = troubles().findIndex(t => t.id === id); if (i < 0) return;
  const { trouble, effects } = resolve(troubles()[i], outcome);
  troubles()[i] = trouble;
  if (!effects){ toast('That one is already settled.'); return; }
  const lines = [];
  for (const f of state.floors){
    const p = f.folk?.find(x => x.id === effects.mood.id);
    if (p){ const moods = ['afraid', 'wary', 'easy']; p.mood = moods[Math.max(0, Math.min(2, Math.max(0, moods.indexOf(p.mood)) + effects.mood.delta))]; markAsking(f); }
  }
  const r = effects.reward;
  if (r) lines.push(r.kind === 'coins' ? `Reward: ${r.gp} gp, all they have` : r.kind === 'favour' ? `Reward: “${r.text}”` : `Reward, a true word: ${r.text}`);
  if (effects.court){ const m = court()?.members.find(x => x.id === effects.court.member && x.alive); if (m){ m.power += effects.court.power; m.hunting = true; lines.push(`${m.name} ${m.epithet} grows bolder, and hunts.`); } }
  if (effects.returning){ const m = court()?.members.find(x => x.id === effects.returning.member); lines.push(`They come home, and ask: “${effects.returning.line}”`, m ? `(They are ${m.name}'s eyes.)` : ''); }
  showCard({ kind:'', title:`Trouble ${outcome === 'done' ? 'put right' : outcome === 'failed' ? 'not put right' : 'left alone'}`, lines:lines.filter(Boolean) }, false);
  log(`Trouble ${outcome}: ${trouble.text}`, true);
  changed();
}
