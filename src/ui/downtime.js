/* 🌙 THE DAYS-OFF WINDOW — a hero, where they are, what they do and for how long; the cost and the check before
   anything happens, then the result on a card. Opened from a hero's card in the Tokens tab, the 🏰 holding section,
   or Ctrl+K. game/downtime.js does the work. */
import { state, ui, tokById } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { ACTIVITIES, PLACE_KINDS, placeKindAt, planFor, takeDaysOff, describe } from '../game/downtime.js';
import { tradingHeroes } from '../game/trade.js';
import { renderPanel } from './panels.js';

const TOOLS = ["Smith's Tools", "Carpenter's Tools", 'Herbalism Kit'];
const ICON = { recuperate:'🛏', work:'⚒', train:'📘', research:'📜', carouse:'🍷', watch:'👁', craft:'🔨' };
let D = null;   // { hero, act, days, kind, learn, skill, tool, real, raw, pass }
function modal(){
  let m = $('#downtimeModal');
  if (!m){
    m = document.createElement('div'); m.className = 'modal hidden'; m.id = 'downtimeModal'; m.innerHTML = '<div class="box" id="downtimeBox"></div>'; document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closeDowntime(); const b = e.target.closest('[data-dt]'); if (b) act(b.dataset.dt, b); });
    m.addEventListener('change', e => { const el = e.target.closest('[data-dtf]'); if (el) field(el.dataset.dtf, el); });
  }
  return m;
}
export function openDowntime(heroId = null){
  const heroes = tradingHeroes(), sel = ui.selected && tokById(ui.selected);
  const hero = (heroId && tokById(heroId)) || (sel?.charId && sel) || heroes[0];
  D = { hero:hero?.id || '', act:'recuperate', days:3, kind:hero ? placeKindAt(hero.floor) : 'village', learn:'', skill:'', tool:'', real:false, raw:'', pass:false };
  modal().classList.remove('hidden'); render();
}
export function closeDowntime(){ $('#downtimeModal')?.classList.add('hidden'); }

function render(){
  const box = $('#downtimeBox'); if (!box || !D) return;
  const heroes = tradingHeroes(), tok = tokById(D.hero);
  const p = tok ? planFor(tok, D.act, D) : { ok:false, why:'Only heroes with a character sheet can take days off (Tokens tab → ✚ Create a character).' };
  const a = describe(D.act), sheet = tok && state.characters[tok.charId];
  const skills = Object.keys((p.ok && p.hero?.skills) || {});
  box.innerHTML = `<h1 style="font-size:24px">🌙 Days off</h1>
    <div class="row"><label class="muted">Who <select class="txt" style="width:auto" data-dtf="hero">${heroes.map(h => `<option value="${h.id}" ${h.id === D.hero ? 'selected' : ''}>${esc(h.name)}</option>`).join('') || '<option value="">no hero with a sheet</option>'}</select></label>
      <label class="muted">Where <select class="txt" style="width:auto" data-dtf="kind">${Object.entries(PLACE_KINDS).map(([k, n]) => `<option value="${k}" ${k === D.kind ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="muted">Days <input class="txt" type="number" min="1" max="60" style="width:70px" data-dtf="days" value="${D.days}"></label></div>
    <div class="seg" style="flex-wrap:wrap">${ACTIVITIES.map(x => `<button class="btn small ${x.id === D.act ? 'on' : ''}" data-dt="act" data-k="${x.id}">${ICON[x.id] || ''} ${esc(x.n)}</button>`).join('')}</div>
    <div class="muted" style="margin:6px 0">${esc(a?.flavour || '')} <span class="muted">(at least ${a?.days} day${a?.days === 1 ? '' : 's'}${a?.cost ? `, ${a.cost} gp a day` : ''})</span></div>
    ${D.act === 'train' ? `<div class="row"><label class="muted">Learn <input class="txt" list="dtLearn" data-dtf="learn" value="${esc(D.learn)}" placeholder="Smith's Tools, Elvish…"></label><datalist id="dtLearn">${TOOLS.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
      <span class="muted">A smith teaches smith's tools, a farmer carpentry, a hermit herbalism; a priest, elder or pilgrim a language.</span></div>` : ''}
    ${D.act === 'work' ? `<div class="row"><label class="muted">With <select class="txt" style="width:auto" data-dtf="skill"><option value="">a skill they're good at</option>${skills.map(s => `<option ${s === D.skill ? 'selected' : ''}>${esc(s)}</option>`).join('')}${(sheet?.tools || []).map(t => `<option value="tool:${esc(t)}" ${D.tool === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label></div>` : ''}
    ${p.ok ? `<div class="card"><b>${p.cost ? `${p.cost} gp` : 'No cost'}</b> for ${p.days} day${p.days === 1 ? '' : 's'}${p.check ? ` · ${esc(p.check.skill || p.check.tool || p.check.ability)} check (+${p.check.bonus})${p.check.dc ? ` against DC ${p.check.dc}` : ''}` : ''}
        ${p.check ? `<div class="row"><label class="muted"><input type="checkbox" data-dtf="real" ${D.real ? 'checked' : ''}> They roll a real d20</label>${D.real ? `<input class="txt" type="number" min="1" max="20" style="width:70px" data-dtf="raw" value="${esc(D.raw)}" placeholder="d20">` : ''}</div>` : ''}
        <div class="row"><label class="muted"><input type="checkbox" data-dtf="pass" ${D.pass ? 'checked' : ''}> The days pass for everyone (the court moves, the smiths work, the holding builds)</label></div>
        <div class="row"><button class="btn primary" data-dt="go">🌙 Spend the days</button></div></div>`
      : `<div class="wsWhy">${esc(p.why)}</div>`}
    <div class="row"><button class="btn" data-dt="close">Done</button></div>`;
}
function act(a, el){
  if (a === 'close'){ closeDowntime(); return; }
  if (a === 'act'){ D.act = el.dataset.k; D.days = Math.max(D.days, describe(D.act)?.days || 1); }
  else if (a === 'go'){
    const tok = tokById(D.hero); if (!tok) return;
    const p = planFor(tok, D.act, D);
    const roll = D.real && p.ok && p.check ? (+D.raw >= 1 && +D.raw <= 20 ? { raw:+D.raw, total:+D.raw + p.check.bonus } : null) : undefined;
    if (roll === null) return;   // a real die, but no number yet
    if (takeDaysOff(tok, D.act, { ...D, roll, passDays:D.pass })){ closeDowntime(); renderPanel(); return; }
  }
  render();
}
function field(f, el){
  if (f === 'hero'){ D.hero = el.value; const t = tokById(D.hero); if (t) D.kind = placeKindAt(t.floor); }
  else if (f === 'kind') D.kind = el.value;
  else if (f === 'days') D.days = Math.max(1, Math.min(60, Math.floor(+el.value || 1)));
  else if (f === 'learn') D.learn = el.value.trim();
  else if (f === 'skill'){ if (el.value.startsWith('tool:')){ D.tool = el.value.slice(5); D.skill = ''; } else { D.skill = el.value; D.tool = ''; } }
  else if (f === 'real') D.real = el.checked;
  else if (f === 'raw') D.raw = el.value;
  else if (f === 'pass') D.pass = el.checked;
  render();
}
