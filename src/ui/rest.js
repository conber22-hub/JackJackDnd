/* 🌙 THE NIGHT WINDOW — the long rest, asked properly: where they sleep and who keeps watch, the odds and the comfort
   before anyone shuts their eyes, then the night (game/rest.js). "Just rest" keeps the old, no-questions long rest. */
import { state } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { REST_PLACES, guessPlace, sleepers, preview, sleep } from '../game/rest.js';
import { longRest } from '../game/resources.js';
import { renderPanel } from './panels.js';

let R = null;   // { kind, watch:Set }
function modal(){
  let m = $('#restModal');
  if (!m){
    m = document.createElement('div'); m.className = 'modal hidden'; m.id = 'restModal'; m.innerHTML = '<div class="box" id="restBox"></div>'; document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closeRest(); const b = e.target.closest('[data-rs]'); if (b) act(b.dataset.rs, b); });
    m.addEventListener('change', e => { const el = e.target.closest('[data-rsf]'); if (!el) return;
      if (el.dataset.rsf === 'kind') R.kind = el.value; else if (el.dataset.rsf === 'watch'){ el.checked ? R.watch.add(el.value) : R.watch.delete(el.value); } render(); });
  }
  return m;
}
export function openRest(kind = null){
  const heroes = sleepers();
  R = { kind:kind || guessPlace(), watch:new Set(heroes.slice(0, 1).map(t => t.id)) };
  modal().classList.remove('hidden'); render();
}
export function closeRest(){ $('#restModal')?.classList.add('hidden'); }
function render(){
  const box = $('#restBox'); if (!box || !R) return;
  const q = preview(R.kind, [...R.watch]), heroes = sleepers();
  box.innerHTML = `<h1 style="font-size:24px">🌙 A long rest</h1>
    <div class="row"><label class="muted">Where <select class="txt" style="width:auto" data-rsf="kind">${Object.entries(REST_PLACES).map(([k, n]) => `<option value="${k}" ${k === R.kind ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <div class="muted" style="margin-top:6px">Who keeps watch</div>
    <div class="row" style="flex-wrap:wrap">${heroes.map(t => `<label class="muted"><input type="checkbox" data-rsf="watch" value="${t.id}" ${R.watch.has(t.id) ? 'checked' : ''}> ${esc(t.name)}</label>`).join('') || '<span class="muted">No heroes on the map.</span>'}</div>
    <div class="card"><b>${Math.round(q.chance * 100)}%</b> chance something comes in the night · <b>${esc(q.comfort)}</b> comfort
      <div class="muted">${q.notes.map(esc).join(' ')}</div>
      <div class="muted">${q.comfort === 'poor' ? 'Poor shelter: full HP, but only half the Hit Dice back and no exhaustion recovered.' : q.comfort === 'fine' ? 'A fine night: one of them may wake with Heroic Inspiration.' : 'A fight in the night breaks the rest: nobody recovers.'}</div></div>
    <div class="row"><button class="btn primary" data-rs="sleep">🌙 Sleep (8 hours)</button><button class="btn" data-rs="plain" title="The old long rest: no place, no rolls, everything back">Just rest</button><button class="btn" data-rs="close">Cancel</button></div>`;
}
function act(a){
  if (a === 'close'){ closeRest(); return; }
  if (a === 'sleep'){ sleep(R.kind, [...R.watch]); closeRest(); renderPanel(); return; }
  if (a === 'plain'){ longRest(); closeRest(); renderPanel(); }
}
