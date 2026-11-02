/* THE CURTAIN — nothing reaches the players' screens unless the DM sends it.
   Everything the app would show them (a card: a roll, a death, a trap found, the Mists; a turn banner; the Count's
   whispers) goes through toPlayers(). By the campaign's share settings each kind is:
     hold   kept in the DM's outbox (📤 at the top of the screen, and a Send button on the DM's own card) until sent,
            edited first if the DM likes, or dropped
     auto   sent at once, as the app always did
     never  shown on the DM's screen only
   Kinds: rolls (attacks, spells, saves, checks), turns (whose turn it is), world (everything else that happens),
   whispers (the Count's voice); and dm: the DM pressed something meant for the table (Reveal), so it goes at once. And for what the players' screens work out for themselves:
     gaze   whether their top bar shows his Gaze · omens   whether their maps answer it (ravens, eyes, withering)
     log    whether they read the log (off: they see only what was sent to them)
   The settings live in the campaign (state.campaign.share), so they travel with the save; the outbox does not. */
import { state, ui } from '../engine/state.js';
import { uid, esc } from '../util/core.js';
import { broadcast, changed } from './session.js';

export const SHARE_KINDS = {
  rolls:   { n:'Rolls',    hint:'Attacks, spells, saves and checks: who hit, how hard, who saved' },
  turns:   { n:'Turns',    hint:'Whose turn it is in a fight' },
  world:   { n:'The world', hint:'Everything else that happens: deaths, traps found, the Mists, the land moving, his servants' },
  whispers:{ n:'Whispers', hint:'The Count\'s voice in their heads' },
};
export const DEFAULT_SHARE = { rolls:'hold', turns:'hold', world:'hold', whispers:'hold', gaze:false, omens:false, log:false };
export const shareOf = () => ({ ...DEFAULT_SHARE, ...(state?.campaign?.share || {}) });
export const outbox = [];   // { id, cat, msg, at }

// What kind of card this is, if the caller didn't say: anything with a die or a DC in it is a roll.
export function cardCat(c){
  if (c?.cat) return c.cat;
  const text = [c?.sub, ...(c?.lines || [])].join(' ');
  return c?.die || /\bd20\b|to hit|\bDC \d+|saving throw|\bsave\b|\bcheck\b/i.test(text) ? 'rolls' : 'world';
}

/* Something for the players' screens. → 'sent' | 'held' | 'kept' (the DM's eyes only) */
export function toPlayers(msg, cat = 'world'){
  if (ui.role !== 'dm') return 'kept';
  if (cat === 'dm'){ broadcast(msg); return 'sent'; }   // the DM's own doing (a reveal they pressed): that press was the send
  const how = shareOf()[cat] || 'hold';
  if (how === 'auto'){ broadcast(msg); return 'sent'; }
  if (how === 'never') return 'kept';
  outbox.push({ id:uid(), cat, msg, at:Date.now() });
  while (outbox.length > 40) outbox.shift();
  renderOutbox();
  return 'held';
}
// Send one (with the DM's edits: { title, flair } for a card, { text } for a banner or a whisper).
export function sendHeld(id, edit = null){
  const i = outbox.findIndex(o => o.id === id); if (i < 0) return;
  const [o] = outbox.splice(i, 1), msg = structuredClone(o.msg);
  if (edit){
    if (msg.t === 'card'){ if (edit.title != null) msg.c.title = edit.title; if (edit.flair != null) msg.c.flair = edit.flair; }
    else if (edit.text != null) msg.text = edit.text;
  }
  broadcast(msg);
  // what they were sent is what their log shows (when the log is otherwise closed to them)
  const line = msg.t === 'card' ? msg.c.title : msg.text; if (line){ state.log.push({ t:Date.now(), m:line, sent:true }); if (state.log.length > 120) state.log.shift(); }
  renderOutbox(); changed();
}
export function dropHeld(id){ const i = outbox.findIndex(o => o.id === id); if (i >= 0) outbox.splice(i, 1); renderOutbox(); }
export function sendAllHeld(){ for (const o of outbox.slice()) sendHeld(o.id); }
export function dropAllHeld(){ outbox.splice(0); renderOutbox(); }
export function setShare(k, v){ state.campaign.share = { ...shareOf(), [k]:v }; if (v === 'auto' && SHARE_KINDS[k]) for (const o of outbox.filter(o => o.cat === k)) sendHeld(o.id); changed(); }
export const heldFor = c => outbox.find(o => o.msg.t === 'card' && o.msg.c === c);

/* The outbox at the top of the DM's screen: a pill with the count; open, each waiting thing with Send, Edit, Drop. */
const ICON = { rolls:'🎲', turns:'⏳', world:'🌍', whispers:'🦇' };
export function renderOutbox(){
  const el = document.getElementById('outPanel'); if (!el) return;
  if (ui.role !== 'dm' || !outbox.length){ el.innerHTML = ''; return; }
  const what = o => o.msg.t === 'card' ? o.msg.c.title : o.msg.text, more = o => o.msg.t === 'card' ? (o.msg.c.flair || o.msg.c.sub || '') : '';
  let h = `<div class="req out"><div class="w">📤 <b>${outbox.length}</b> waiting for you to send <span class="muted">· the players see nothing until you do</span></div>
    <div class="b"><button class="btn small" data-act="outToggle">${ui.outOpen ? 'Hide' : 'Show'}</button><button class="btn small primary" data-act="outSendAll">Send all</button><button class="btn small" data-act="outDropAll">Drop all</button></div>`;
  if (ui.outOpen) h += outbox.slice(-6).reverse().map(o => `<div class="outItem"><div class="w">${ICON[o.cat] || '•'} ${esc(what(o) || '')}${more(o) ? ` <span class="muted">— ${esc(String(more(o)).slice(0, 90))}</span>` : ''}</div>
      ${ui.outEdit === o.id ? `<input class="txt" id="oe-t-${o.id}" value="${esc(what(o) || '')}">${o.msg.t === 'card' ? `<textarea class="txt" id="oe-f-${o.id}" style="min-height:40px">${esc(o.msg.c.flair || '')}</textarea>` : ''}` : ''}
      <div class="b"><button class="btn small primary" data-act="outSend" data-id="${o.id}">📤 Send</button>${ui.outEdit === o.id ? '' : `<button class="btn small" data-act="outEdit" data-id="${o.id}">✎ Edit</button>`}<button class="btn small" data-act="outDrop" data-id="${o.id}">✕ Drop</button></div></div>`).join('') + (outbox.length > 6 ? `<div class="muted">and ${outbox.length - 6} older</div>` : '');
  el.innerHTML = h + '</div>';
}
// The DM's edits for one, read from the open editor (or null).
export function editsFor(id){
  const t = document.getElementById(`oe-t-${id}`), f = document.getElementById(`oe-f-${id}`); if (!t) return null;
  const o = outbox.find(o => o.id === id); if (!o) return null;
  return o.msg.t === 'card' ? { title:t.value, flair:f ? f.value : undefined } : { text:t.value };
}
