/* 🔨 THE WORKSHOP AT THE TABLE — the DM's side of crafting (engine/crafting.js, Codex's): a design built from parts,
   a crafter (a hero with the tools, or the valley's smith on commission), the coin and materials it takes, and the
   hours of work, each stretch a tool check. Finished things go into the hero's pack with their own numbers (a crafted
   longsword fights as itself, its rune counts); a finished wagon joins the party's transport, and can be brought onto
   the map. All of it lives in the campaign (state.campaign.materials, .jobs, .transport), which never reaches the
   players (engine/redact.js); what a player sees is the thing itself, in their pack. */
import { state, log } from '../engine/state.js';
import { build, plan, work, finish } from '../engine/crafting.js';
import { PARTS, PART_BY_ID, SLOTS } from '../data/crafting.js';
import { stats } from '../engine/holdings.js';
import { migrateSheet } from '../engine/inventory.js';
import { heroStats } from '../engine/hero.js';
import { mulberry32, hashSeed } from '../util/core.js';
import { toast, showCard } from '../ui/hud.js';
import { changed } from './session.js';
import { applyCharacter } from './heroes.js';
import { sendSheetToOwner } from '../net/table.js';
import { tradingHeroes, spendCoins } from './trade.js';
import { freeTilesNear } from '../engine/grid.js';
import { buildFloor } from '../render/floors.js';
import { dayHooks } from './court.js';

export const KINDS = { weapon:'⚔ Weapon', armor:'🛡 Armour', shield:'🛡 Shield', trinket:'✦ Trinket', wagon:'🛞 Wagon' };
export const SLOT_NAMES = { frame:'Frame', head:'Head', grip:'Grip', material:'Material', finish:'Finish', rune:'Rune', lining:'Lining', plates:'Plates', vessel:'Vessel', wheels:'Wheels', axle:'Axle', team:'Team', cover:'Cover', armour:'Armour', fittings:'Fittings' };
// the slots a design must fill (the rest may be left plain)
export const NEEDED = { weapon:['frame'], armor:['frame'], shield:['frame'], trinket:['vessel'], wagon:['frame', 'wheels', 'axle', 'team'] };
export const DEFAULTS = {
  weapon:{ frame:'weapon-longsword', material:'steel' },
  armor:{ frame:'armor-chain-mail', material:'steel' },
  shield:{ frame:'armor-shield', material:'iron' },
  trinket:{ vessel:'amulet', material:'iron' },
  wagon:{ frame:'cart', wheels:'wood-wheels', axle:'wood-axle', team:'pony', cover:'no-cover', armour:'no-armour', fittings:[] },
};
// the map's prop for a wagon frame (data/props.js)
export const WAGON_PROP = { handcart:'cart', cart:'cart', wagon:'wagon', 'covered-wagon':'coveredwagon', vardo:'vardo' };
export const wagonProp = parts => parts?.frame === 'wagon' && parts.cover === 'canvas' ? 'coveredwagon' : WAGON_PROP[parts?.frame] || 'wagon';
const MATERIAL_NAMES = { stock:'stock (timber, iron, leather)', 'rune-dust':'rune dust', salt:'salt', timber:'timber', stone:'stone' };
export const materialName = id => MATERIAL_NAMES[id] || id;
// (the catalogue's names are lower case for some parts: "covered wagon")
export const partName = p => p ? p.n.replace(/^[a-z]/, c => c.toUpperCase()) : '';
// a name as it's shown and kept: "cart" → "Cart", "covered wagon" → "Covered wagon"
export const titled = n => String(n || '').replace(/^[a-z]/, c => c.toUpperCase());
export const partsFor = (kind, slot) => PARTS.filter(p => p.slot === slot && p.kinds.includes(kind));
export const slotsOf = kind => SLOTS[kind] || [];

export const materials = () => (state.campaign.materials ||= { stock:6, 'rune-dust':0 });
export const jobs = () => (state.campaign.jobs ||= []);
export const transport = () => (state.campaign.transport ||= []);
const day = () => state.campaign?.valley?.day ?? 0;
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|craft|${Date.now()}|${tick++}`));

/* ---------- who can craft: a hero with a sheet, or a smith of the valley's folk ---------- */
export function crafters(){
  const heroes = tradingHeroes().map(t => ({ ref:`hero:${t.id}`, name:t.name, hero:t }));
  const smiths = [];
  state.floors.forEach((f, L) => (f.folk || []).filter(p => p.role === 'smith' && !p.dead && !p.flags?.gone).forEach(p => smiths.push({ ref:`folk:${L}:${p.id}`, name:`${p.name}, the smith (commission)`, smith:p, L })));
  return [...heroes, ...smiths];
}
export const crafterBy = ref => crafters().find(c => c.ref === ref) || null;

/* Workshops where a hero stands: the forge, bench or still on this floor (the Build tab's Camp & keep props, or a
   village anvil), and those of a holding on this map (engine/holdings.js stats). */
const PROP_SHOP = { forge:'forge', anvil:'forge', workbench:'carpenter', alchemy:'alchemist' };
export function workshopsHere(L){
  const out = new Set();
  for (const p of state.floors[L]?.props || []) if (PROP_SHOP[p.k] && !p.broken) out.add(PROP_SHOP[p.k]);
  for (const h of state.campaign.holdings || []) if (h.map === state.meta.mapId && h.floor === L) for (const w of stats(h).workshops) out.add(w);
  return [...out];
}
// the tools a design's parts call for
export const toolsFor = design => [...new Set(Object.values(design.parts || {}).flat().map(id => PART_BY_ID[id]?.needs.tool).filter(Boolean))];
const packTools = sheet => (sheet.inv || []).filter(i => (i.qty ?? 1) > 0).map(i => i.n);

/* The job a crafter would take on. dmAllows: the DM rules they have what they need (tools, proficiency, a forge).
   → plan()'s result (ok, why, cost, materials, hours, check…) plus who pays, the fee, and what the party supplies */
export function quote(design, ref, { dmAllows = false } = {}){
  const c = crafterBy(ref);
  if (!c) return { ok:false, why:'Choose who makes it.' };
  const need = toolsFor(design), all = ['forge', 'carpenter', 'alchemist'];
  if (c.smith){
    if (design.kind === 'wagon' && !dmAllows) return { ok:false, why:'A smith doesn\'t build wagons: a hero with carpenter\'s tools does, at a carpenter\'s bench.' };
    // the smith has their own forge, tools and iron; rune dust is the party's to bring
    const q = plan(design, { crafter:{ role:'smith', bonus:4, tools:need }, tools:need, materials:{ ...materials(), stock:Infinity }, place:{ workshops:all } });
    if (!q.ok) return q;
    const supply = Object.fromEntries(Object.entries(q.materials).filter(([id]) => id !== 'stock'));
    return { ...q, by:c, fee:Math.round(q.cost * 25) / 100, price:Math.round(q.cost * 125) / 100, supply };
  }
  const sheet = migrateSheet(state.characters[c.hero.charId]), st = heroStats(sheet);
  const crafter = { ...sheet, ab:st.sc, tools:dmAllows ? need : (sheet.tools || []) };
  const q = plan(design, { crafter, tools:dmAllows ? need : packTools(sheet), materials:materials(), place:{ workshops:dmAllows ? all : workshopsHere(c.hero.floor) } });
  if (!q.ok){
    // say exactly what's missing, so the DM knows what to fix
    const why = [];
    if (/tools/.test(q.why)) for (const t of need){
      if (!packTools(sheet).includes(t)) why.push(`${c.name} has no ${t} in their pack (add them in the Tokens tab, or buy them)`);
      if (!(sheet.tools || []).includes(t)) why.push(`${c.name} isn't proficient with ${t} (tick it above, if their class or background gives it)`);
    }
    if (/needs a/.test(q.why)) why.push(`There's no ${q.why.replace('Work needs a ', '').replace('.', '')} here: put one on this map (Build tab → Camp & keep), or build one at a holding`);
    if (/materials/.test(q.why)) why.push('Not enough materials: see the party\'s materials below');
    return { ...q, why:why.length ? why.join('. ') + '.' : q.why };
  }
  return { ...q, by:c, fee:0, price:q.cost, supply:q.materials };
}

// A hero is (or is not) proficient with a kind of tools: the DM's say, kept on the sheet.
export function setProficient(tokId, tool, on){
  const t = state.tokens.find(x => x.id === tokId), sheet = t && state.characters[t.charId]; if (!sheet) return;
  const h = structuredClone(sheet), s = new Set(h.tools || []); if (on) s.add(tool); else s.delete(tool);
  h.tools = [...s]; applyCharacter(h, { place:false }); sendSheetToOwner(h.id);
}

// Pay from a sheet's purse (game/trade.js spendCoins: small coins first, change in gold and silver).
function pay(sheet, gp){
  const out = migrateSheet(sheet), coins = spendCoins(out.coins, gp);
  if (!coins) return { ok:false, why:`${sheet.name} hasn't the coin (${gp} gp).` };
  out.coins = coins;
  return { ok:true, sheet:out };
}
export function adjustMaterial(id, by){ const M = materials(); M[id] = Math.max(0, (M[id] || 0) + by); changed(); }

/* Start the work: the payer's coin and the party's materials are spent now. payerId: the hero token who pays (and
   gets the thing); a hero crafting for themselves pays for their own. → the job record, or null */
export function startJob(design, ref, payerId, opts = {}){
  const q = quote(design, ref, opts);
  if (!q.ok){ toast(q.why); return null; }
  const payer = state.tokens.find(t => t.id === (q.by.hero ? q.by.hero.id : payerId));
  if (!payer?.charId || !state.characters[payer.charId]){ toast('Choose which hero pays (and gets it).'); return null; }
  const paid = pay(state.characters[payer.charId], q.price);
  if (!paid.ok){ toast(paid.why); return null; }
  const M = materials();
  for (const [id, n] of Object.entries(q.supply)) M[id] = (M[id] || 0) - n;
  applyCharacter(paid.sheet, { place:false }); sendSheetToOwner(paid.sheet.id);
  const { by, fee, price, supply, ...job } = q;
  job.item.n = titled(job.item.n);
  const rec = { id:`job-${Date.now().toString(36)}${tick++}`, n:job.item.n, kind:design.kind, design:structuredClone(design), crafter:{ ref, name:by.smith ? by.smith.name : by.name, smith:!!by.smith }, for:payer.charId, forName:payer.name, started:day(), job, dmAllows:!!opts.dmAllows, notes:[] };
  jobs().push(rec);
  log(`🔨 ${rec.crafter.name} begins ${rec.n} for ${payer.name}: ${price} gp${fee ? ` (${fee} of it the smith's fee)` : ''}, ${job.hours} hours of work, ${job.check.ability} check DC ${job.check.dc} with ${job.tools.join(' and ')}.`, true);
  changed();
  return rec;
}

/* A stretch of work: one tool check (engine/crafting.js work). Made: the hours count. Missed: they're lost.
   A 1: a material is ruined, and must be replaced before the work goes on. */
export function workJob(id, hours){
  const rec = jobs().find(j => j.id === id); if (!rec) return null;
  const M = materials(), smith = rec.crafter.smith, before = rec.job;
  const have = smith ? { ...M, stock:Infinity } : M;
  const out = work(before, hours, { materials:have }, rng());
  if (!out.ok){ toast(out.why === 'Replace the ruined materials before resuming work.' ? `First replace what was ruined: ${Object.entries(before.replacementMaterials).map(([k, n]) => `${n} ${materialName(k)}`).join(', ')}.` : out.why); return null; }
  // what was ruined last time is used up now that the work resumes
  for (const [k, n] of Object.entries(before.replacementMaterials || {})) if (!(smith && k === 'stock')) M[k] = Math.max(0, (M[k] || 0) - n);
  rec.job = out;
  const gained = out.progress - before.progress, ruined = out.ruined.length > before.ruined.length;
  const line = ruined ? `a fumble: ${materialName(out.ruined.at(-1))} is ruined, and must be replaced` : gained > 0 ? `${gained} hour${gained === 1 ? '' : 's'} of good work` : 'a poor stretch: the hours are lost';
  rec.notes.push(`Day ${day() + 1}: ${line}.`);
  log(`🔨 ${rec.crafter.name} works on ${rec.n}: ${line} (${out.progress}/${out.hours} h).`, true);
  if (out.progress >= out.hours) completeJob(rec);
  changed();
  return { rec, gained, ruined };
}
export function cancelJob(id){
  const i = jobs().findIndex(j => j.id === id); if (i < 0) return;
  const [rec] = jobs().splice(i, 1);
  log(`🔨 ${rec.n} is set aside, unfinished (the coin and materials are spent).`, true); changed();
}

// Done: into the pack (with its own numbers), or a wagon into the party's transport.
function completeJob(rec){
  const item = finish(rec.job); if (!item) return;
  jobs().splice(jobs().indexOf(rec), 1);
  if (item.kind === 'wagon'){
    transport().push({ id:`wagon-${Date.now().toString(36)}${tick++}`, ...item, owner:rec.forName });
  } else {
    const sheet = state.characters[rec.for];
    if (sheet){
      const h = migrateSheet(sheet);
      h.inv.push({ id:`made-${Date.now().toString(36)}${tick++}`, n:item.n, custom:item, qty:1, equipped:false, attuned:false });
      applyCharacter(h, { place:false }); sendSheetToOwner(h.id);
    }
  }
  const where = item.kind === 'wagon' ? 'It joins the party\'s wagons (🔨 Workshop → Wagons).' : `It's in ${rec.forName}'s pack.`;
  log(`🔨 ${rec.n} is finished. ${where}`);
  showCard({ kind:'', cat:'world', title:`🔨 ${rec.n} is finished`, lines:[`${rec.crafter.name} made it for ${rec.forName}.`, statLine(item), where] });
}

/* What a built thing does, in a line (the stats card and the finished card). */
export function statLine(it){
  if (!it) return '';
  if (it.kind === 'wagon') return `Carries ${it.capacity} lb · ${it.speed} miles a day · AC ${it.ac}, ${it.hp} HP · ${it.seats} seats${it.bunks ? `, ${it.bunks} bunks` : ''}${it.fittings?.length ? ` · ${it.fittings.map(f => f.replaceAll('-', ' ')).join(', ')}` : ''}`;
  const bits = [];
  if (it.kind === 'weapon'){ bits.push(`${it.d}${it.versatile ? ` (${it.versatile} two-handed)` : ''} ${it.ty}`); if (it.atk) bits.push(`+${it.atk} to hit and damage`); if (it.properties) bits.push(it.properties); if (it.rng?.length) bits.push(`range ${it.rng.join('/')}`); }
  if (it.kind === 'armor') bits.push(`AC ${it.ac}${it.dex === true || it.dex == null ? ' + Dex' : it.dex ? ` + Dex (max ${it.dex})` : ''}${it.acBonus ? `, +${it.acBonus}` : ''}`);
  if (it.kind === 'shield') bits.push(`+${it.ac || 2} AC${it.acBonus ? `, +${it.acBonus} more` : ''}`);
  if (it.silvered) bits.push('silvered');
  if (it.objectDamageMultiplier) bits.push('adamantine: double damage to objects');
  if (it.criticalImmune) bits.push('adamantine: no critical hits');
  if (it.light) bits.push(`glows (${it.light.bright} ft bright)`);
  if (it.rustless) bits.push('never rusts');
  bits.push(`${+(it.weight || 0).toFixed(1)} lb`, `${it.cost} gp`, it.rarity || 'common');
  return bits.join(' · ');
}

/* A wagon brought onto this map, beside the party (a prop the minis can climb into and hide behind). */
export function bringWagon(id, L){
  const w = transport().find(x => x.id === id), f = state.floors[L]; if (!w || !f) return;
  const hero = state.tokens.find(t => t.floor === L && t.kind === 'pc' && !t.dead) || state.tokens.find(t => t.floor === L);
  const cx = hero ? hero.x : f.rooms?.[0]?.cx ?? (f.W >> 1), cy = hero ? hero.y : f.rooms?.[0]?.cy ?? (f.H >> 1);
  const k = wagonProp(w.design?.parts);
  const taken = new Set((f.props || []).flatMap(p => [p.y * f.W + p.x, (p.y + 1) * f.W + p.x]));
  const open = new Set(freeTilesNear(L, cx, cy, 200).map(p => p.y * f.W + p.x));
  const spot = [...open].map(i => ({ x:i % f.W, y:(i / f.W) | 0 })).find(p => open.has((p.y + 1) * f.W + p.x) && !taken.has(p.y * f.W + p.x) && !taken.has((p.y + 1) * f.W + p.x));
  if (!spot){ toast('No room for the wagon here.'); return; }
  f.props = (f.props || []).filter(p => p.wagon !== id);   // one wagon, one place
  f.props.push({ id:f.nextObj++, k, x:spot.x, y:spot.y, rot:0, wagon:id, name:w.n });
  buildFloor(L); log(`🛞 ${w.n} is brought up.`); changed();
}

// Each new day the valley's smiths work on what they were asked to make (eight hours).
function smithsWork(){
  for (const rec of jobs().slice()) if (rec.crafter.smith) workJob(rec.id, 8);
}
dayHooks.push(smithsWork);

export const designValid = design => build(design);
