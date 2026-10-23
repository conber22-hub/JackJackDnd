/* ASK THE TABLE — "everyone, a Dexterity saving throw". The DM picks the roll, the DC (shown or secret) and who
   makes it; each of them gets a prompt on their phone (type the d20 they rolled, or let the app roll); the DM
   types or rolls for anyone without one; the TV shows who's still rolling, then reveals everyone's result at
   once. Rules in engine/checks.js. The DM's app decides: a phone only sends a number. */
import { state, ui, tokById, log } from '../engine/state.js';
import { checkById, bonusFor, resolveRoll, groupOk, keepDie } from '../engine/checks.js';
import { $, esc, d, uid } from '../util/core.js';
import { sendToSeat, sendHost, toScreens } from '../net/table.js';
import { showCard, toast } from '../ui/hud.js';
import { sfx } from '../audio/sound.js';

/* ---------- the DM's side ---------- */
let A = null;   // { id, check, dc, secret, mode, who:[token ids], res:{ id:{ d20, bonus, total, ok, how } }, revealed }
export const currentAsk = () => A;
const seated = id => Object.values(state.seats || {}).includes(id);
const status = () => ({ t:'askState', label:checkById(A.check).label, dc:A.secret ? null : A.dc, who:A.who.map(id => ({ name:tokById(id)?.name || '?', done:!!A.res[id] })) });

export function askTable({ check, dc = null, secret = false, mode = 'normal', who = [] }){
  const c = checkById(check); if (!c || !who.length){ toast('Pick a roll and who makes it.'); return; }
  A = { id:uid(), check, dc:Number.isFinite(dc) ? dc : null, secret:!!secret, mode, who:[...who], res:{}, revealed:false };
  for (const id of A.who) if (seated(id)) sendToSeat(id, { t:'ask', id:A.id, tok:id, label:c.label, dc:A.secret ? null : A.dc, mode });
  toScreens(status());
  log(`🎲 The DM asks for ${c.label}${A.dc != null ? ` (DC ${A.dc}${A.secret ? ', secret' : ''})` : ''}: ${A.who.map(id => tokById(id)?.name).join(', ')}.`, true);
  sfx('roll'); refresh();
}
// One result in: a d20 from a phone or typed by the DM (null: the app rolls, with advantage or disadvantage).
export function answerAsk(askId, tokId, d20 = null, how = 'app'){
  if (!A || A.id !== askId || A.revealed || !A.who.includes(tokId) || A.res[tokId]) return false;
  const t = tokById(tokId); if (!t) return false;
  const die = Number.isInteger(d20) && d20 >= 1 && d20 <= 20 ? d20 : keepDie(d(20), d(20), A.mode);
  A.res[tokId] = { ...resolveRoll(die, bonusFor(t, checkById(A.check)), A.dc), how:Number.isInteger(d20) ? how : 'app' };
  toScreens(status());
  if (A.who.every(id => A.res[id])) toast('Everyone has rolled — reveal it when you like.');
  refresh(); return true;
}
// Roll for everyone still waiting, then show everyone's result: a card for the table, a big reveal on the TV.
export function revealAsk(){
  if (!A || A.revealed) return;
  for (const id of A.who) if (!A.res[id]) answerAsk(A.id, id, null);
  A.revealed = true;
  const c = checkById(A.check), rows = A.who.map(id => ({ id, name:tokById(id)?.name || '?', ...A.res[id] }));
  const group = A.dc != null && rows.length > 1 ? groupOk(rows) : null;
  showCard({ kind:rows.some(r => r.nat20) ? 'crit' : '', title:c.label, sub:A.dc != null ? `DC ${A.dc}` : '', ask:true,   // the TV has its own reveal
    lines:rows.map(r => `${esc(r.name)} — ${r.how === 'phone' || r.how === 'dm' ? '🎲 ' : 'd20 '}<b>${r.d20}</b> ${r.bonus >= 0 ? '+' : '−'} ${Math.abs(r.bonus)} = <b>${r.total}</b>${r.ok == null ? '' : r.ok ? ' — <b>success</b>' : ' — <b>fails</b>'}`)
      .concat(group == null ? [] : [`<b>As a group: ${group ? 'they make it' : 'they fail'}</b>`]) });
  toScreens({ t:'askReveal', label:c.label, dc:A.dc, group, rows:rows.map(r => ({ id:r.id, name:r.name, d20:r.d20, bonus:r.bonus, total:r.total, ok:r.ok })) });
  log(`🎲 ${c.label}${A.dc != null ? ` DC ${A.dc}` : ''}: ${rows.map(r => `${r.name} ${r.total}${r.ok == null ? '' : r.ok ? ' ✓' : ' ✗'}`).join(', ')}.`);
  for (const id of A.who) if (seated(id)) sendToSeat(id, { t:'askDone', id:A.id });
  refresh();
}
export function cancelAsk(){ if (!A) return; for (const id of A.who) if (seated(id)) sendToSeat(id, { t:'askDone', id:A.id }); toScreens({ t:'askClear' }); A = null; refresh(); }
export function clearAsk(){ A = null; toScreens({ t:'askClear' }); refresh(); }
let refresher = () => {};
export function onAskChange(fn){ refresher = fn; }
function refresh(){ refresher(); renderAskBar(); }

// The DM's bar at the top (whatever tab is open): who has rolled, and Reveal.
export function renderAskBar(){
  const el = $('#askBar'); if (!el) return;
  if (!A || ui.role !== 'dm'){ el.innerHTML = ''; return; }
  const c = checkById(A.check), n = A.who.filter(id => A.res[id]).length;
  el.innerHTML = `<div class="req"><div class="w">🎲 <b>${esc(c.short)}</b>${A.dc != null ? ` · DC ${A.dc}${A.secret ? ' (secret)' : ''}` : ''} · ${A.revealed ? 'revealed' : `${n}/${A.who.length} rolled`}</div>
    <div class="b">${A.who.map(id => `<span class="chip ${A.res[id] ? 'on' : ''}" title="${A.res[id] ? `rolled ${A.res[id].d20}` : 'waiting'}">${esc(tokById(id)?.name || '?')}${A.res[id] ? ' ✓' : ' …'}</span>`).join('')}
    ${A.revealed ? '<button class="btn small" data-act="askClear">✕</button>' : `<button class="btn small primary" data-act="askReveal">${n < A.who.length ? 'Roll the rest & reveal' : 'Reveal'}</button><button class="btn small" data-act="askCancel" title="Never mind">✕</button>`}</div></div>`;
}

/* ---------- the player's side: the prompt on their phone ---------- */
export function askPrompt(m){
  const me = tokById(m.tok);
  $('#askBox').innerHTML = `<h3>🎲 ${esc(m.label)}</h3><div class="muted">${esc(me?.name || 'You')}${m.dc != null ? ` · DC ${m.dc}` : ''}${m.mode === 'adv' ? ' · with <b>advantage</b> (roll two, keep the higher)' : m.mode === 'dis' ? ' · with <b>disadvantage</b> (roll two, keep the lower)' : ''}</div>
    <div class="muted">Roll your d20 and tap what it shows — the app adds your bonus.</div>
    <div class="d20grid">${Array.from({ length:20 }, (_, i) => `<button class="btn ${i === 19 ? 'primary' : i === 0 ? 'danger' : ''}" data-ask="${i + 1}">${i + 1}</button>`).join('')}</div>
    <div class="row"><button class="btn" data-ask="roll">🎲 Roll for me</button></div>`;
  $('#askModal').classList.remove('hidden');
  try { navigator.vibrate?.([80, 60, 80]); } catch {}
  sfx('roll', false);
  $('#askBox').onclick = e => { const b = e.target.closest('[data-ask]'); if (!b) return;
    if (sendHost({ t:'askAns', id:m.id, tok:m.tok, d20:b.dataset.ask === 'roll' ? null : +b.dataset.ask })){ $('#askModal').classList.add('hidden'); toast('Sent — wait for the reveal.'); } };
  ui.askOpen = m.id;
}
export function askClosed(m){ if (ui.askOpen === m.id){ $('#askModal').classList.add('hidden'); ui.askOpen = null; } }

/* A note passed to this player (game/night.js passNote): it buzzes, and waits on screen until read. Kept in the
   Hero tab ("Notes from the DM") to read again. */
export function notePrompt(m){
  (ui.notes ||= []).unshift({ text:String(m.text || ''), strahd:!!m.strahd, at:Date.now() }); ui.notes = ui.notes.slice(0, 20);
  $('#askBox').innerHTML = `<div class="note ${m.strahd ? 'strahd' : ''}"><h3>${m.strahd ? 'A voice only you can hear' : 'A note, for you alone'}</h3><p>${esc(m.text || '').replace(/\n/g, '<br>')}</p>
    <div class="muted">Keep it to yourself — or don't.</div><div class="row"><button class="btn primary" data-note="ok">I've read it</button></div></div>`;
  $('#askModal').classList.remove('hidden');
  try { navigator.vibrate?.(m.strahd ? [300, 120, 60, 120, 300] : [60, 40, 60]); } catch {}
  sfx(m.strahd ? 'whisper' : 'turn', false);
  $('#askBox').onclick = e => { if (e.target.closest('[data-note]')) $('#askModal').classList.add('hidden'); };
}
