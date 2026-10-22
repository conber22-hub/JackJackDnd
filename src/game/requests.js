/* PLAYERS ROLL — a player taps an attack, a spell or a feature on their own hero card and then a target;
   the request goes to the DM, who approves it (as asked, or with advantage / disadvantage) or refuses it.
   With "players roll freely" on (Table tab), requests resolve at once. The DM's app always does the rolling,
   so every result is the same card on every screen. */
import { state, ui, tokById } from '../engine/state.js';
import { $, esc, uid } from '../util/core.js';
import { toast } from '../ui/hud.js';
import { canAct } from './rules.js';
import { doAttack, castSpell, partySees } from './combat.js';
import { useFeature } from './resources.js';
import { rangeCheck, coverOf, areaOf, areaSquares, spellReach } from '../engine/targeting.js';
import { tokGap } from '../engine/movement.js';
import { sfx } from '../audio/sound.js';

/* ---------- the player's side ---------- */
let send = null;                 // set by net/table.js (avoids an import cycle)
export function setSender(fn){ send = fn; }
export function requestAct(m){
  if (!send) return;
  if (send({ t:'act', ...m })) toast(state.freeRolls ? 'Rolling…' : 'Sent to the DM…');
}

/* ---------- the DM's side ---------- */
export const queue = [];
const label = m => {
  const a = tokById(m.id), tg = tokById(m.target);
  const what = m.kind === 'attack' ? a?.attacks?.[m.i]?.n : m.kind === 'cast' ? a?.casts?.[m.i]?.n : a?.resources?.find(r => r.id === m.res)?.n;
  const mode = m.mode === 'adv' ? ' with advantage' : m.mode === 'dis' ? ' with disadvantage' : '';
  return `<b>${esc(a?.name || '?')}</b> ${m.kind === 'attack' ? 'attacks' : m.kind === 'cast' ? 'casts' : 'uses'} <b>${esc(what || '?')}</b>${m.aim ? ' <span class="muted">(aimed on the map)</span>' : tg && tg.id !== a?.id ? ` → ${esc(tg.name)}` : ''}${mode}${m.d20 ? ` · 🎲 rolled <b>${m.d20}</b>` : ''}`;
};
// Is this a request the seat may make? (its own token, alive, and its turn if there's a fight)
export function validAct(m, ownsId){
  const a = tokById(m.id); if (!a || !ownsId(a.id) || a.dead || !canAct(a)) return null;
  const tg = tokById(m.target) || (m.kind === 'feat' ? a : null); if (!tg || tg.floor !== a.floor) return null;
  if (tg.kind === 'monster' && !partySees(tg)) return null;               // nobody can target what the party can't see
  if (m.kind === 'attack' && (!a.attacks?.[m.i] || tg.dead)) return null;
  if (m.kind === 'cast' && !a.casts?.[m.i]) return null;
  if (m.kind === 'feat' && !a.resources?.some(r => r.id === m.res)) return null;
  // in reach and in sight (engine/targeting.js): a player's device checks too, but the DM's table decides
  let aim = null;
  if (m.kind === 'attack' && tg.id !== a.id && (!rangeCheck(a, tg, a.attacks[m.i]).ok || coverOf(a, tg).cover === 'total')) return null;
  if (m.kind === 'cast'){
    const sp = a.casts[m.i], area = areaOf(sp);
    if (area){
      if (!m.aim || !Number.isInteger(m.aim.x) || !Number.isInteger(m.aim.y)) return null;
      aim = { x:m.aim.x, y:m.aim.y };
      if (!areaSquares(a, area, aim).ok) return null;
    } else if (tg.id !== a.id && (tokGap(a, tg) > Math.max(1, spellReach(sp)) || coverOf(a, tg).cover === 'total')) return null;
  }
  const d20 = Number.isInteger(m.d20) && m.d20 >= 1 && m.d20 <= 20 ? m.d20 : null;   // a real die they rolled at the table
  return { kind:m.kind, id:a.id, target:tg.id, i:+m.i || 0, res:m.res, mode:['adv', 'dis'].includes(m.mode) ? m.mode : 'normal', ...(aim ? { aim } : {}), ...(d20 ? { d20 } : {}) };
}
export function receiveAct(m, peer, who, deny){
  if (state.campaign?.freeRolls){ if (!runAct(m)) deny('That could not be done (no slot or charge left?).'); return; }
  queue.push({ ...m, rid:uid(), peer, who, deny });
  sfx('turn', false); renderRequests();   // the chime is for the DM only
}
export function runAct(m, mode = m.mode){
  const a = tokById(m.id); if (!a) return false;
  if (m.kind === 'attack') return doAttack(m.id, m.target, m.i, mode, { d20:m.d20 });
  if (m.kind === 'cast') return castSpell(m.id, m.target, m.i, m.aim || null);
  if (m.kind === 'feat') return useFeature(a, m.res, tokById(m.target) || a);
  return false;
}
export function answerRequest(rid, verdict){
  const i = queue.findIndex(q => q.rid === rid); if (i < 0) return;
  const [q] = queue.splice(i, 1);
  const typed = +$(`#rq-${rid}`)?.value; if (typed >= 1 && typed <= 20) q.d20 = Math.round(typed);   // the DM typed the die they rolled
  // things change while a request waits (the target died, the turn passed): check it again
  const ok = verdict === 'no' ? q : validAct(q, id => state.seats[q.peer] === id);
  if (!ok){ q.deny?.('That can no longer be done — try again.'); renderRequests(); return; }
  if (verdict === 'no') q.deny?.('The DM says no to that one.');
  else if (!runAct(q, verdict === 'ok' ? q.mode : verdict)) q.deny?.('That could not be done (no slot or charge left?).');
  renderRequests();
}
// A new scene (a new delve, a loaded save): requests about the old one are void.
export function clearRequests(text = 'The DM changed the scene — ask again.'){ for (const q of queue.splice(0)) q.deny?.(text); renderRequests(); }
export function dropRequestsFrom(peer){ for (let i = queue.length - 1; i >= 0; i--) if (queue[i].peer === peer) queue.splice(i, 1); renderRequests(); }
export function renderRequests(){
  const el = $('#reqPanel'); if (!el) return;
  if (ui.role !== 'dm' || ui.tableView){ el.innerHTML = ''; return; }
  el.innerHTML = queue.map(q => `<div class="req"><div class="w">🎲 ${label(q)} <span class="muted">(${esc(q.who)})</span></div>
    <div class="b">${q.kind === 'attack' && !q.d20 && state.campaign?.realDice ? `<input class="txt num" id="rq-${q.rid}" type="number" min="1" max="20" placeholder="d20" title="The d20 they rolled at the table (blank: the app rolls)">` : ''}<button class="btn small primary" data-act="reqAns" data-id="${q.rid}" data-k="ok">${q.d20 ? '✓ Use their roll' : '✓ Roll it'}</button><button class="btn small" data-act="reqAns" data-id="${q.rid}" data-k="adv" title="Approve with advantage">▲ Adv</button><button class="btn small" data-act="reqAns" data-id="${q.rid}" data-k="dis" title="Approve with disadvantage">▼ Dis</button><button class="btn small danger" data-act="reqAns" data-id="${q.rid}" data-k="no">✕ No</button></div></div>`).join('');
}
