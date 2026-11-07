/* 😱 FEAR — Codex's engine/horror.js at the DM's hand. When the dead stand up, a friend falls or the Count walks in,
   the DM picks the source and the heroes who saw it; each makes a Wisdom save (advantage if they've faced this before).
   A small fail frightens them for a minute; a worse one leaves a mark until a long rest; the worst leaves a lasting
   mark, cured only by a deed (a night at a holy place, a ritual, a service, facing the source) or Greater Restoration.
   Marks live on the hero's sheet (or the token, for a hero without one). A seated player gets the mark's line on
   their phone. Stress (optional): three fails since the last long rest and the next fail leaves a lasting mark. */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { horrorCheck, cure as cureMark, relief as reliefFor, whisper as whisperFor, stress } from '../engine/horror.js';
import { SOURCES, MARK_BY_ID, RELIEF } from '../data/horror.js';
import { addCond } from '../game/rules.js';
import { changed } from '../game/session.js';
import { sendToSeat } from '../net/table.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';

const SOURCE_NAMES = { 'dead-rising':'The dead rising', 'friend-corpse':"A friend's corpse", count:"The Count's presence", 'seep-growth':"The Seep's growth", betrayal:'A betrayal', 'child-danger':'A child in danger', impossible:'The impossible' };
const CURE_NAMES = { 'long-rest':'A long rest', 'Lesser Restoration':'Lesser Restoration', 'Greater Restoration':'Greater Restoration', 'holy-night':'A night at a holy place', ritual:'A ritual', service:'A service done', 'confront-source':'Facing the source' };
const RELIEF_NAMES = { meal:'🍲 A hot meal', prayer:'🙏 A prayer', song:'🎶 A song', friend:"🤝 A friend's hand" };
let pick = new Set(), source = 'dead-rising', dcOver = '', last = [];

const heroes = () => state.tokens.filter(t => t.kind === 'pc' && t.floor === ui.floor && !t.dead && !t.flags?.gone);
// where a hero's fear lives: their sheet if they have one, else the token
const sheetOf = t => state.characters?.[t.charId] || null;
const fearOf = t => (sheetOf(t) || t).horror || null;
function asHero(t){
  const s = sheetOf(t), base = s ? { ...s } : { saves:{ wis:t.saveMod ?? 0 } };
  return { ...base, exhaustion:t.exhaustion || 0, horror:{ ...(fearOf(t) || {}), enabled:!!state.campaign?.stress } };
}
const keep = (t, h) => { (sheetOf(t) || t).horror = h.horror; };

export function mechText(m){
  const x = m.mechanics || {}, out = [];
  if (x.disadvantage) out.push(`Disadvantage on ${x.disadvantage.skill} checks ${x.disadvantage.when}`);
  if (x.longRestRequires === 'light') out.push("Can't take a long rest without a light burning");
  if (x.entrySave) out.push(`DC ${x.entrySave.dc} ${x.entrySave.ability.toUpperCase()} save to willingly enter ${x.entrySave.terrain}`);
  return out.join('; ');
}
// the marks a hero carries, as chips for the party list
export function markChips(t){
  const marks = fearOf(t)?.marks || []; if (!marks.length) return '';
  return `<div>${marks.map(k => { const m = MARK_BY_ID[k.id]; return m ? `<span class="chip on" style="border-color:${m.kind === 'lasting' ? '#7a3cc0' : '#5a6a8a'}" title="${esc(`${m.text} — ${mechText(m)}`)}">${m.kind === 'lasting' ? '🕸' : '💧'} ${esc(m.n)}</span>` : ''; }).join('')}</div>`;
}

export function openHorror(src){
  if (ui.role !== 'dm' || !state) return;
  if (src && SOURCES[src]) source = src;
  pick = new Set(heroes().map(t => t.id)); last = []; render();
}
function close(){ $('#horrorSheet')?.classList.add('hidden'); }

function render(){
  let m = $('#horrorSheet');
  if (!m){ m = document.createElement('div'); m.id = 'horrorSheet'; m.className = 'modal'; document.body.appendChild(m); m.addEventListener('click', onClick); m.addEventListener('change', onChange); }
  const hs = heroes(), gaze = state.dread || 1, base = SOURCES[source]?.dc ?? 12, dc = (dcOver !== '' ? +dcOver : base) + Math.max(0, gaze - 5);
  let h = `<div class="box hr-sheet"><div class="row" style="align-items:center"><h2 style="flex:1;margin:0">😱 Fear</h2><button class="btn small" data-hrx="close">✕</button></div>
    <div class="muted">What did they see? Each makes a Wisdom save. Past this source before: advantage. His Gaze above 5 adds to the DC.</div>
    <div class="row"><label>Source</label><select class="txt" style="width:auto" id="hrSource">${Object.keys(SOURCES).map(k => `<option value="${k}" ${k === source ? 'selected' : ''}>${esc(SOURCE_NAMES[k] || k)} (DC ${SOURCES[k].dc})</option>`).join('')}</select>
      <label>DC</label><input class="txt num" type="number" id="hrDc" placeholder="${base}" value="${esc(dcOver)}" style="width:64px"><span class="muted" id="hrDcNow">→ DC ${dc} at Gaze ${gaze}</span></div>
    <div class="row">${hs.map(t => `<span class="chip ${pick.has(t.id) ? 'on' : ''}" data-hrx="who" data-id="${t.id}">${esc(t.name)}${stress(asHero(t)) ? ` · ${stress(asHero(t))}⚡` : ''}</span>`).join('') || '<span class="muted">No heroes on this floor.</span>'}</div>
    <div class="row"><button class="btn primary" data-hrx="roll">🎲 Horror check</button>
      <label class="muted"><input type="checkbox" id="hrStress" ${state.campaign?.stress ? 'checked' : ''}> Stress: 3 fails since a long rest and the next leaves a lasting mark</label></div>`;
  if (last.length) h += `<div class="hr-res">${last.map(r => `<div class="${r.ok ? 'ok' : 'bad'}"><b>${esc(r.name)}</b> ${r.roll.dice.join(r.roll.advantage ? ' / ' : '')}${r.roll.bonus ? ` ${r.roll.bonus >= 0 ? '+' : ''}${r.roll.bonus}` : ''} = ${r.roll.total} vs ${r.dc}: ${r.ok ? 'holds' : r.effect?.kind === 'frightened' ? 'frightened (1 minute)' : r.effect?.kind === 'short' ? `marked: <i>${esc(r.effect.mark.n)}</i>` : `a lasting mark: <i>${esc(r.effect?.mark?.n || '')}</i>`}<div class="muted">${esc(r.text)}</div></div>`).join('')}</div>`;
  const marked = hs.filter(t => fearOf(t)?.marks?.length || fearOf(t)?.fails);
  if (marked.length){
    h += `<h4>Their marks</h4>`;
    for (const t of marked){
      const F = fearOf(t);
      h += `<div class="card"><div class="hd"><span class="nm">${esc(t.name)}</span><span class="stat">${F.fails ? `${F.fails} fail${F.fails === 1 ? '' : 's'} since a long rest` : ''}</span></div>
        ${(F.marks || []).map(k => { const mk = MARK_BY_ID[k.id]; if (!mk) return ''; return `<div class="hr-mark"><b>${mk.kind === 'lasting' ? '🕸' : '💧'} ${esc(mk.n)}</b> <span class="muted">(${mk.kind === 'lasting' ? 'lasting' : 'until a long rest'})</span><div>${esc(mk.text)}</div><div class="muted">${esc(mechText(mk))}</div>
          <div class="row">${mk.cure.filter(c => c !== 'long-rest').map(c => `<button class="btn small" data-hrx="cure" data-id="${t.id}" data-k="${esc(k.id)}" data-c="${esc(c)}">✚ ${esc(CURE_NAMES[c] || c)}</button>`).join('')}
          ${mk.whisper && (state.dread || 1) >= 7 && F.whisperSession !== whisperSession() ? `<button class="btn small" data-hrx="whisper" data-id="${t.id}" data-k="${esc(k.id)}" title="Once a session, the Count speaks through this mark">🗣 He whispers</button>` : ''}</div></div>`; }).join('')}
        ${F.fails ? `<div class="row">${Object.keys(RELIEF).map(k => `<button class="btn small" data-hrx="relief" data-id="${t.id}" data-k="${k}">${RELIEF_NAMES[k] || k}</button>`).join('')}</div>` : ''}</div>`;
    }
  }
  m.innerHTML = h + '</div>'; m.classList.remove('hidden');
}
const whisperSession = () => String(state.campaign?.session ?? 0);
function tellPlayer(t, text){ if (Object.values(state.seats || {}).includes(t.id)) sendToSeat(t.id, { t:'note', text:String(text).slice(0, 1200), strahd:false }); }

function onChange(e){
  const t = e.target;
  if (t.id === 'hrSource'){ source = t.value; render(); }
  if (t.id === 'hrDc'){ dcOver = t.value.trim(); const base = SOURCES[source]?.dc ?? 12, g = state.dread || 1, el = $('#hrDcNow'); if (el) el.textContent = `→ DC ${(dcOver !== '' ? +dcOver : base) + Math.max(0, g - 5)} at Gaze ${g}`; }
  if (t.id === 'hrStress'){ state.campaign.stress = t.checked; changed(); }
}
function onClick(e){
  const b = e.target.closest('[data-hrx]'); if (!b) return;
  const k = b.dataset.hrx, t = b.dataset.id ? tokById(b.dataset.id) : null;
  if (k === 'close') return close();
  if (k === 'who'){ pick.has(b.dataset.id) ? pick.delete(b.dataset.id) : pick.add(b.dataset.id); return render(); }
  if (k === 'roll'){
    const who = heroes().filter(x => pick.has(x.id)); if (!who.length){ toast('Pick who saw it.'); return; }
    last = [];
    for (const x of who){
      const r = horrorCheck(asHero(x), { source, dc:dcOver !== '' ? +dcOver : undefined, gaze:state.dread || 1, rng:Math.random });
      keep(x, r.hero); last.push({ ...r, name:x.name });
      if (r.effect?.kind === 'frightened') addCond(x, 'frightened', 10, null);
      if (r.effect?.mark) tellPlayer(x, `😱 ${r.effect.mark.n}. ${r.text} (${mechText(r.effect.mark)})`);
      log(`😱 ${x.name} faces ${(SOURCE_NAMES[source] || source).toLowerCase()}: ${r.ok ? 'holds' : r.effect?.mark ? `marked (${r.effect.mark.n})` : 'frightened'}.`, true);
    }
    changed(); return render();
  }
  if (!t) return;
  if (k === 'cure'){
    const r = cureMark(asHero(t), b.dataset.k, b.dataset.c);
    if (r.ok){ keep(t, r.hero); log(`✚ ${t.name}: ${r.text}`, true); tellPlayer(t, `✚ ${r.text}`); changed(); } else toast(r.text);
    return render();
  }
  if (k === 'relief'){ keep(t, reliefFor(asHero(t), b.dataset.k)); toast(`${t.name} breathes easier.`); changed(); return render(); }
  if (k === 'whisper'){
    const r = whisperFor(asHero(t), b.dataset.k, { gaze:state.dread || 1, session:whisperSession(), rng:Math.random });
    if (r.ok){ keep(t, r.hero); sendToSeat(t.id, { t:'note', text:r.text, strahd:true }); log(`🗣 Through ${t.name}'s mark, the Count: “${r.text}”`, true); toast(Object.values(state.seats || {}).includes(t.id) ? `He whispers to ${t.name}.` : `No phone: say it to ${t.name} yourself — “${r.text}”`); changed(); }
    return render();
  }
}

let started = false;
export function ensureHorror(){
  if (started) return; started = true;
  const st = document.createElement('style');
  st.textContent = `.hr-sheet{max-width:640px}.hr-res{margin:8px 0;display:flex;flex-direction:column;gap:6px;font-size:14px}.hr-res .ok{border-left:2px solid var(--gold);padding-left:8px}
  .hr-res .bad{border-left:2px solid var(--blood,#8a1c1c);padding-left:8px}.hr-mark{margin:6px 0;font-size:13px}`;
  document.head.appendChild(st);
  registerCommands([{ id:'horror', n:'A horror check', hint:'The dead rise, a friend falls, the Count arrives: Wisdom saves and the marks fear leaves', icon:'😱', role:'dm', run:() => openHorror() }]);
}
