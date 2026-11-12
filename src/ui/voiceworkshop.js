/* 🗣 THE VOICE WORKSHOP — a player writes their own hero's lines on their phone (Your hero → 🗣 Your voice): for each
   moment the table voices (a hit, a miss, a critical, a spell, a heal, hurt, down), what the hero says, with any
   weapon or spell or one in particular, and how they sound; 🔊 hears a line on this device first. "Send to the DM"
   sends them to the DM's Table tab (🗣 Voices), where they are approved or sent back to rework; the player sees which.
   Only approved lines are spoken at the table (ui/voices.js). The DM side is game/voiceworkshop.js. */
import { state, ui } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { net, sendHost } from '../net/table.js';
import { toast } from './hud.js';
import { renderPanel } from './panels.js';
import { myHero, ownsCharacter } from '../game/heroes.js';
import { heroVoiceChoices, previewHeroVoiceLine } from '../engine/voice-workshop.js';
import { normalizeVoicePack, planActionVoice } from '../engine/action-voices.js';
import { DELIVERY } from '../data/action-voices.js';
import { HERO_TRIGGERS, TRIGGER_NAME, voiceFromPlayer, pendingVoices, approvedVoices, reviewVoice, voiceViewFor } from '../game/voiceworkshop.js';
import { audition } from './voices.js';

const DELIVERY_NAME = { steady:'Steady', quick:'Quick', low:'Low and slow', hush:'Hushed' };
const WEAPONISH = new Set(['hit', 'miss', 'critical']);
const REASON = { 'not-your-hero':'That hero isn\'t yours at this table.', 'revision-changed':'Your lines changed on the DM\'s side — here they are as they stand now.',
  'invalid-line':'One of the lines can\'t be used — check each has words.', 'invalid-submission':'Those lines couldn\'t be sent.' };
const MAX = 32;
let ed = null;   // the open editor: { heroId, view, draft:{ delivery, muted, lines:[{ trigger, action, text }] } }

const lineLabel = l => `${TRIGGER_NAME[l.trigger] || l.trigger}${l.action ? ` · ${l.action}` : ''}`;
const packText = p => p?.muted ? '<i>Says nothing.</i>' : (p?.lines || []).map(l => `<div class="look"><b>${esc(lineLabel(l))}</b>: “${esc(l.text)}”</div>`).join('') || '<i>No lines.</i>';
function draftFrom(view){
  const src = view?.review?.status === 'returned' ? view.review.draft : view?.pending?.pack || view?.published;
  return { delivery:src?.delivery || 'steady', muted:!!src?.muted, lines:(src?.lines || []).map(l => ({ ...l })) };
}
function status(view){
  if (!view) return 'Asking the table…';
  if (view.pending) return '⏳ With the DM — they haven\'t decided yet. You can change them and send again, or take them back.';
  if (view.review?.status === 'returned') return '↩ The DM sent these back to rework. Change them and send again.';
  if (view.published) return `✓ The DM approved ${view.published.lines.length} line${view.published.lines.length === 1 ? '' : 's'}${view.review?.status === 'withdrawn' ? ' (you took back the last change)' : ''}. Change them and send again any time.`;
  return 'No lines yet. Write a few, hear them, and send them to the DM.';
}

/* ---------- the player's editor ---------- */
export function openVoiceEditor(heroId){
  if (ui.role !== 'player' || !net.host?.open) { toast('Join the table first: the DM approves your lines.'); return; }
  const sheet = myHero(heroId); if (!sheet) return;
  ed = { heroId, sheet, view:null, draft:null };
  sendHost({ t:'voiceWant', heroId });
  render();
}
function choicesFor(trigger){
  if (!ed?.sheet || !WEAPONISH.has(trigger) && trigger !== 'spell' && trigger !== 'heal') return [];
  return heroVoiceChoices(ed.sheet).filter(c => c.triggers.includes(trigger)).map(c => c.name);
}
function editorHTML(){
  const d = ed.draft, name = ed.sheet.name;
  const rows = (d?.lines || []).map((l, i) => {
    const opts = choicesFor(l.trigger);
    return `<div class="card vw-line" data-i="${i}">
      <div class="row"><select class="txt" data-vw="trigger">${HERO_TRIGGERS.map(([k, n]) => `<option value="${k}"${k === l.trigger ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
        ${opts.length ? `<select class="txt" data-vw="action"><option value="">${WEAPONISH.has(l.trigger) ? 'any weapon' : 'any spell'}</option>${opts.map(o => `<option value="${esc(o.toLowerCase())}"${o.toLowerCase() === l.action ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : ''}</div>
      <div class="row"><input class="txt" style="flex:1" data-vw="text" maxlength="120" value="${esc(l.text)}" placeholder="What ${esc(name)} says"><button class="btn small" data-act="vwHear" title="Hear it on this device">🔊</button><button class="btn small" data-act="vwDel" title="Remove this line">✕</button></div></div>`;
  }).join('');
  return `<div class="box"><button class="btn small" data-act="vwClose" style="float:right">✕</button>
    <h2>🗣 ${esc(name)}'s voice</h2>
    <div class="muted" id="vwStatus">${esc(status(ed.view))}</div>
    ${ed.view?.published ? `<details class="card"><summary class="muted">The lines the DM approved</summary>${packText(ed.view.published)}</details>` : ''}
    ${d ? `<div class="row" style="margin-top:10px"><label class="muted">How ${esc(name)} sounds</label><select class="txt" id="vwDelivery">${Object.keys(DELIVERY).map(k => `<option value="${k}"${k === d.delivery ? ' selected' : ''}>${DELIVERY_NAME[k] || k}</option>`).join('')}</select>
      <label class="muted"><input type="checkbox" id="vwMuted"${d.muted ? ' checked' : ''}> Says nothing</label></div>
    <div class="muted">A line is said when it happens, now and then (not every time). <b>{target}</b> is who you're aiming at, <b>{action}</b> the weapon or spell.</div>
    ${rows || '<div class="muted"><i>No lines yet.</i></div>'}
    <div class="row">${d.lines.length < MAX ? '<button class="btn small" data-act="vwAdd">✚ Add a line</button>' : ''}</div>
    <div class="row"><button class="btn primary" data-act="vwSend">Send to the DM</button>${ed.view?.pending ? '<button class="btn small" data-act="vwWithdraw">Take them back</button>' : ''}</div>` : ''}
  </div>`;
}
function render(){
  let m = $('#voiceWorkshop');
  if (!m){ m = document.createElement('div'); m.id = 'voiceWorkshop'; m.className = 'modal hidden'; document.body.appendChild(m);
    m.addEventListener('input', readInput); m.addEventListener('change', e => { readInput(e); if (e.target.dataset.vw === 'trigger') render(); }); }
  if (!ed){ m.classList.add('hidden'); return; }
  m.innerHTML = editorHTML(); m.classList.remove('hidden');
}
function readInput(e){
  if (!ed?.draft) return;
  const t = e.target, row = t.closest('.vw-line');
  if (t.id === 'vwDelivery') ed.draft.delivery = t.value;
  else if (t.id === 'vwMuted') ed.draft.muted = t.checked;
  else if (row && t.dataset.vw){ const l = ed.draft.lines[+row.dataset.i]; if (!l) return;
    if (t.dataset.vw === 'trigger'){ l.trigger = t.value; if (!choicesFor(l.trigger).some(o => o.toLowerCase() === l.action)) l.action = ''; }
    else l[t.dataset.vw] = t.value; }
}
const sid = () => `vw-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
function onEditorAct(act, e){
  if (act === 'vwClose'){ ed = null; render(); return; }
  if (!ed?.draft) return;
  const i = +e.target.closest('.vw-line')?.dataset.i;
  if (act === 'vwAdd'){ ed.draft.lines.push({ trigger:ed.draft.lines.length ? 'miss' : 'hit', action:'', text:'' }); render(); [...document.querySelectorAll('#voiceWorkshop .vw-line input')].pop()?.focus(); }
  else if (act === 'vwDel'){ ed.draft.lines.splice(i, 1); render(); }
  else if (act === 'vwHear'){
    const l = ed.draft.lines[i]; if (!l?.text.trim()) return;
    const cue = previewHeroVoiceLine({ heroId:ed.heroId, heroName:ed.sheet.name, line:l, delivery:ed.draft.delivery, targetName:'the wolf' }, { normalizePack:normalizeVoicePack, planVoice:planActionVoice });
    if (cue) audition(cue);
  }
  else if (act === 'vwSend'){
    const lines = ed.draft.lines.filter(l => l.text.trim()).map(l => ({ trigger:l.trigger, action:l.action || '', text:l.text.trim() }));
    if (!lines.length && !ed.draft.muted){ toast('Write a line first.'); return; }
    sendHost({ t:'voiceSubmit', heroId:ed.heroId, submissionId:sid(), expectedRevision:ed.view?.revision ?? 0, pack:{ delivery:ed.draft.delivery, muted:ed.draft.muted, lines } });
  }
  else if (act === 'vwWithdraw' && ed.view?.pending) sendHost({ t:'voiceWithdraw', heroId:ed.heroId, submissionId:ed.view.pending.id, expectedRevision:ed.view.revision });
}
// The DM's table answers: the hero's lines as they stand (and, after a send, whether it went; after the DM decides, what they decided).
function onVoiceView(m){
  if (m.decided) toast(m.decided === 'approved' ? `🗣 The DM approved ${m.name || 'your hero'}'s lines.` : `🗣 The DM sent ${m.name || 'your hero'}'s lines back to rework.`);
  if (!ed || ed.heroId !== m.heroId) return;
  if (m.ok === false && m.reason) toast(REASON[m.reason] || 'That didn\'t go through.');
  else if (m.sent) toast('🗣 Sent to the DM.');
  ed.view = m.view;
  if (!ed.draft || m.decided || m.ok === false || m.withdrawn) ed.draft = draftFrom(m.view);
  render();
}

/* ---------- the DM's side ---------- */
// A player's message about their lines (net/table.js hands it over with the seat).
function onVoiceWorkshop(seat, c, m){
  if (ui.role !== 'dm' || !state) return;
  const r = voiceFromPlayer(seat, m);
  if (c.open) try { c.send({ t:'voiceView', heroId:r.heroId, view:r.view, ok:r.ok, reason:r.reason, sent:r.sent, withdrawn:m.t === 'voiceWithdraw' && r.ok }); } catch {}
  if (r.sent){ toast(`🗣 ${seat.name} wrote lines for ${state.characters[r.heroId]?.name || 'their hero'}: approve them in the Table tab.`); renderPanel(); }
  else if (m.t === 'voiceWithdraw' && r.ok) renderPanel();
}
// The Table tab's 🗣 Voices card.
export function voiceTableHTML(){
  if (!state?.campaign) return '';
  const wait = pendingVoices(), ok = approvedVoices().length;
  let h = `<h4>🗣 Voices${wait.length ? ` <span class="chip on">${wait.length} to approve</span>` : ''}</h4>`;
  if (!wait.length) h += `<div class="muted">${ok ? `${ok} hero${ok === 1 ? ' has' : 'es have'} their own lines. ` : ''}Players write their heroes' lines on their phones (Your hero → 🗣 Your voice); they come here for you to approve.</div>`;
  for (const v of wait) h += `<div class="card vw-review"><div class="hd"><span class="nm">${esc(v.name)}</span><span class="muted">${esc(v.owner)} · ${esc(DELIVERY_NAME[v.pending.pack.delivery] || 'Steady')}</span></div>
    ${packText(v.pending.pack)}
    <div class="row"><button class="btn small primary" data-act="vwApprove" data-id="${esc(v.heroId)}" data-k="${esc(v.pending.id)}">✓ Approve</button><button class="btn small" data-act="vwReturn" data-id="${esc(v.heroId)}" data-k="${esc(v.pending.id)}">↩ Send back</button></div></div>`;
  return h;
}
function onReview(act, e){
  const b = e.target.closest('[data-act]'), heroId = b.dataset.id, decision = act === 'vwApprove' ? 'approve' : 'return';
  if (!reviewVoice(heroId, b.dataset.k, decision)){ renderPanel(); return; }
  const sheet = state.characters[heroId];
  toast(decision === 'approve' ? `🗣 ${sheet?.name}'s lines are approved.` : `🗣 ${sheet?.name}'s lines went back to their player.`);
  for (const [, s] of net.conns) if (!s.screen && s.conn.open && ownsCharacter(sheet, s.name, s.key))
    try { s.conn.send({ t:'voiceView', heroId, name:sheet.name, view:voiceViewFor(s, heroId), decided:decision === 'approve' ? 'approved' : 'returned' }); } catch {}
  renderPanel();
}

let started = false;
export function ensureVoiceWorkshop(){
  if (started) return; started = true;
  net.onVoiceWorkshop = onVoiceWorkshop;
  net.onVoiceView = onVoiceView;
  document.addEventListener('click', e => {
    const act = e.target.closest?.('[data-act]')?.dataset.act;
    if (!act?.startsWith('vw')) return;
    if (act === 'vwOpen') openVoiceEditor(e.target.closest('[data-act]').dataset.id);
    else if (act === 'vwApprove' || act === 'vwReturn'){ if (ui.role === 'dm') onReview(act, e); }
    else onEditorAct(act, e);
  });
}
