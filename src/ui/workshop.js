/* 🔨 THE WORKSHOP WINDOW — a builder like a shipyard's: pick what to make, then a part for each slot, and watch it
   change (the picture, the numbers, the name). Then who makes it (a hero with the tools, or a smith of the valley on
   commission), what it costs, and the work: hours of it, each stretch a tool check. Jobs in progress, the party's
   materials, and the wagons they own are kept here too. The DM's window (game/workshop.js does the work). */
import { state, ui, tokById } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { build } from '../engine/crafting.js';
import { PART_BY_ID } from '../data/crafting.js';
import { KINDS, SLOT_NAMES, NEEDED, DEFAULTS, partsFor, slotsOf, partName, materials, materialName, jobs, transport, crafters, quote,
  startJob, workJob, cancelJob, adjustMaterial, setProficient, toolsFor, statLine, bringWagon, titled } from '../game/workshop.js';
import { tradingHeroes } from '../game/trade.js';
import { previewOf } from '../render/workshop.js';

let W = null;   // { kind, parts, name, ref, payer, dmAllows }
function modal(){
  let m = $('#workshopModal');
  if (!m){
    m = document.createElement('div'); m.className = 'modal hidden'; m.id = 'workshopModal'; m.innerHTML = '<div class="box wide" id="workshopBox"></div>'; document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closeWorkshop(); const b = e.target.closest('[data-ws]'); if (b) act(b.dataset.ws, b); });
    m.addEventListener('change', e => { const el = e.target.closest('[data-wsf]'); if (el) field(el.dataset.wsf, el); });
  }
  return m;
}
export function openWorkshop(kind = W?.kind || 'weapon', ref = null){
  const heroes = tradingHeroes(), sel = ui.selected && tokById(ui.selected);
  const hero = sel?.charId && heroes.find(t => t.id === sel.id) || heroes[0];
  W = { kind, parts:structuredClone(DEFAULTS[kind]), name:'', ref:ref || (hero ? `hero:${hero.id}` : crafters()[0]?.ref || ''), payer:hero?.id || '', dmAllows:false, ...(W && W.kind === kind ? { parts:W.parts, name:W.name } : {}) };
  modal().classList.remove('hidden'); render();
}
export function closeWorkshop(){ $('#workshopModal')?.classList.add('hidden'); }
export const workshopOpen = () => !$('#workshopModal')?.classList.contains('hidden') && !!$('#workshopModal');

const design = () => ({ kind:W.kind, parts:Object.fromEntries(Object.entries(W.parts).filter(([, v]) => Array.isArray(v) ? true : !!v)), ...(W.name.trim() ? { name:W.name.trim() } : {}) });

function slotRow(slot){
  if (slot === 'fittings'){
    const frame = PART_BY_ID[W.parts.frame], max = frame?.mods.slots || 0, on = W.parts.fittings || [];
    return `<div class="wsSlot"><b>${SLOT_NAMES[slot]}</b> <span class="muted">${on.length}/${max}</span><div class="wsFits">${partsFor(W.kind, slot).map(p => `<label class="muted"><input type="checkbox" data-wsf="fit" value="${p.id}" ${on.includes(p.id) ? 'checked' : ''} ${!on.includes(p.id) && on.length >= max ? 'disabled' : ''}> ${esc(partName(p))} <span class="muted">${p.cost} gp</span></label>`).join('')}</div></div>`;
  }
  const opts = partsFor(W.kind, slot), need = NEEDED[W.kind].includes(slot);
  return `<label class="wsSlot"><b>${SLOT_NAMES[slot] || slot}</b><select class="txt" data-wsf="part" data-slot="${slot}">${need ? '' : `<option value="">— plain —</option>`}${opts.map(p => `<option value="${p.id}" ${W.parts[slot] === p.id ? 'selected' : ''}>${esc(partName(p))} · ${p.cost} gp${p.mods.bonus ? ` · ${p.mods.rarity}` : ''}</option>`).join('')}</select></label>`;
}

export function render(){
  if (!W) return;
  const box = $('#workshopBox'); if (!box) return;
  const d = design(), b = build(d), item = b.ok ? { ...b.item, n:titled(b.item.n) } : null;
  const img = item ? previewOf(d, item) : null;
  const q = b.ok ? quote(d, W.ref, { dmAllows:W.dmAllows }) : null;
  const who = crafters(), heroes = tradingHeroes(), cur = who.find(c => c.ref === W.ref);
  const M = materials();
  const need = toolsFor(d), heroSheet = cur?.hero && state.characters[cur.hero.charId];
  box.innerHTML = `<h1 style="font-size:24px">🔨 The Workshop</h1>
    <div class="seg" role="tablist">${Object.entries(KINDS).map(([k, n]) => `<button class="btn small ${k === W.kind ? 'on' : ''}" data-ws="kind" data-k="${k}">${n}</button>`).join('')}</div>
    <div class="wsGrid">
      <div class="wsParts">${slotsOf(W.kind).map(slotRow).join('')}
        <label class="wsSlot"><b>Name</b><input class="txt" data-wsf="name" placeholder="${esc(item?.n || 'A name of its own')}" value="${esc(W.name)}"></label></div>
      <div class="wsShow">
        <div class="wsPic">${img ? `<img src="${img}" alt="${esc(item.n)}">` : '<div class="muted" style="padding:40px 10px;text-align:center">✦</div>'}</div>
        ${item ? `<div class="wsName">${esc(item.n)}</div><div class="muted">${esc(statLine(item))}</div>` : `<div class="wsWhy">${esc(b.why)}</div>`}
      </div>
    </div>
    <h3>Who makes it</h3>
    <div class="row"><select class="txt" style="width:auto" data-wsf="ref">${who.map(c => `<option value="${esc(c.ref)}" ${c.ref === W.ref ? 'selected' : ''}>${esc(c.name)}</option>`).join('') || '<option value="">nobody yet: a hero with a sheet, or a smith in a village</option>'}</select>
      ${cur?.smith ? `<label class="muted">for <select class="txt" style="width:auto" data-wsf="payer">${heroes.map(h => `<option value="${h.id}" ${h.id === W.payer ? 'selected' : ''}>${esc(h.name)}</option>`).join('')}</select> (who pays, and gets it)</label>` : ''}
      <label class="muted" title="The DM rules they have the tools, the skill and a workshop"><input type="checkbox" data-wsf="dm" ${W.dmAllows ? 'checked' : ''}> DM's ruling: they have what they need</label></div>
    ${heroSheet && need.length ? `<div class="row muted">${need.map(t => `<label><input type="checkbox" data-wsf="prof" data-tool="${esc(t)}" ${(heroSheet.tools || []).includes(t) ? 'checked' : ''}> ${esc(cur.name)} is proficient with ${esc(t)}</label>`).join(' ')}</div>` : ''}
    ${q ? (q.ok ? `<div class="card wsPlan"><b>${q.price} gp</b>${q.fee ? ` <span class="muted">(${q.fee} of it the smith's fee)</span>` : ''} · ${q.hours} hours of work · ${esc(q.check.ability)} check (+${q.check.bonus}) DC ${q.check.dc} with ${esc(q.tools.join(' and '))}${q.workshop ? ` at a ${q.workshop}` : ''}
        ${Object.keys(q.supply).length ? `<div class="muted">Uses the party's ${Object.entries(q.supply).map(([k, n]) => `${n} ${esc(materialName(k))}`).join(', ')}.</div>` : ''}
        ${cur?.smith ? '<div class="muted">The smith works eight hours a day (as each day passes).</div>' : ''}
        <div class="row"><button class="btn primary" data-ws="start">🔨 Begin the work</button></div></div>`
      : `<div class="wsWhy">${esc(q.why)}</div>`) : ''}
    <h3>Work in progress</h3>
    ${jobs().map(j => `<div class="packRow"><span class="packN">🔨 ${esc(j.n)} <span class="muted">by ${esc(j.crafter.name)} for ${esc(j.forName)}</span>
        <div class="wsBar"><i style="width:${Math.round(100 * j.job.progress / j.job.hours)}%"></i></div><span class="muted">${j.job.progress}/${j.job.hours} h · DC ${j.job.check.dc}${Object.keys(j.job.replacementMaterials || {}).length ? ` · <b style="color:var(--blood)">ruined: needs ${Object.entries(j.job.replacementMaterials).map(([k, n]) => `${n} ${esc(materialName(k))}`).join(', ')}</b>` : ''}${j.notes.length ? ` · ${esc(j.notes.at(-1))}` : ''}</span></span>
        <span class="packB">${[1, 4, 8].map(h => `<button class="btn small" data-ws="work" data-id="${j.id}" data-h="${h}" title="Work ${h} hour${h > 1 ? 's' : ''}: one tool check">${h} h</button>`).join('')}<button class="btn small" data-ws="cancel" data-id="${j.id}" title="Set it aside">✕</button></span></div>`).join('') || '<div class="muted">Nothing on the bench.</div>'}
    <h3>The party's materials</h3>
    <div class="row">${['stock', 'rune-dust'].map(k => `<span class="wsMat">${esc(materialName(k))}: <b>${M[k] || 0}</b> <button class="btn small" data-ws="mat" data-k="${k}" data-by="-1">−</button><button class="btn small" data-ws="mat" data-k="${k}" data-by="1">+</button></span>`).join('')}</div>
    <div class="muted">Stock is bought from a smith or salvaged (the DM adds it here); rune dust is rare: a reward, a find, a bargain with something old.</div>
    ${transport().length ? `<h3>Wagons</h3>${transport().map(w => `<div class="packRow"><span class="packN">🛞 ${esc(w.n)} <span class="muted">${esc(statLine(w))}</span></span><span class="packB"><button class="btn small" data-ws="wagon" data-id="${esc(w.id)}">Bring it here</button></span></div>`).join('')}` : ''}
    <div class="row"><button class="btn" data-ws="close">Done</button></div>`;
}

function act(a, el){
  if (a === 'close'){ closeWorkshop(); return; }
  if (a === 'kind'){ W.kind = el.dataset.k; W.parts = structuredClone(DEFAULTS[W.kind]); W.name = ''; }
  else if (a === 'start'){ if (startJob(design(), W.ref, W.payer, { dmAllows:W.dmAllows })){ W.name = ''; } }
  else if (a === 'work') workJob(el.dataset.id, +el.dataset.h);
  else if (a === 'cancel'){ if (confirm('Set this work aside? The coin and materials already spent are gone.')) cancelJob(el.dataset.id); }
  else if (a === 'mat') adjustMaterial(el.dataset.k, +el.dataset.by);
  else if (a === 'wagon') bringWagon(el.dataset.id, ui.floor);
  render();
}
function field(f, el){
  if (f === 'part') W.parts[el.dataset.slot] = el.value || undefined;
  else if (f === 'fit'){ const s = new Set(W.parts.fittings || []); el.checked ? s.add(el.value) : s.delete(el.value); W.parts.fittings = [...s]; }
  else if (f === 'name') W.name = el.value;
  else if (f === 'ref') W.ref = el.value;
  else if (f === 'payer') W.payer = el.value;
  else if (f === 'dm') W.dmAllows = el.checked;
  else if (f === 'prof'){ const c = crafters().find(x => x.ref === W.ref); if (c?.hero) setProficient(c.hero.id, el.dataset.tool, el.checked); }
  // a wagon's fittings can't outnumber its frame's slots
  if (W.kind === 'wagon' && f === 'part' && el.dataset.slot === 'frame') W.parts.fittings = (W.parts.fittings || []).slice(0, PART_BY_ID[W.parts.frame]?.mods.slots || 0);
  render();
}
