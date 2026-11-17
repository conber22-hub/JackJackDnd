/* ◆ WHAT'S LEFT OF YOUR TURN — the pips on the fight bar (ui/wander.js, ui/tablehh.js): the action (and how many
   strikes are in it), the bonus action, the move in feet, the reaction. Each goes dim as it's spent, and the cost
   tags on the choices (ui/optrow.js) dim with it, so a spent Bonus says so on Second Wind's row too.
   And the odds of a blow, as the rows and the bar say them (game/wander.js strikeOdds). */
import { esc } from '../util/core.js';

const DID = { dodge:'🛡 dodging', dash:'💨 dashing', disengage:'↩ disengaged', cast:'✦ cast', strike:'struck' };
/* e: { strikes, of, action, partway, did, bonus, moveFt, reaction } (bonus / reaction: still to use) */
export function pipsHtml(e){
  if (!e) return '';
  const act = e.action ? `${e.strikes} strike${e.strikes === 1 ? '' : 's'} left` : DID[e.did] || 'action spent';
  const pip = (k, on, icon, words, tip) => `<span class="pip p-${k}${on ? '' : ' used'}" title="${esc(tip)}"><b>${icon}</b>${esc(words)}</span>`;
  return `<div class="wd-pips">${pip('act', e.action, '◆', act, e.action ? `Your action${e.of > 1 ? `: ${e.of} strikes in it (Extra Attack)` : ''}` : 'Your action is spent this turn')}`
    + `${pip('bonus', e.bonus, '▲', 'Bonus', e.bonus ? 'Your bonus action: a potion, Second Wind, Healing Word…' : 'Your bonus action is spent this turn')}`
    + `${pip('move', e.moveFt > 0, '👣', `${e.moveFt} ft.`, 'How far you can still walk this turn')}`
    + `${pip('react', e.reaction, '⟲', 'Reaction', e.reaction ? 'A strike at a foe who leaves your reach, on their turn' : 'Your reaction is spent until your next turn')}</div>`;
}
// The rows' cost tags, dimmed where that part of the turn is spent (on your own turn in a fight)
export function markSpent(items, e){
  if (!e?.mine) return items;
  const gone = { act:!e.action, bonus:!e.bonus, react:!e.reaction, move:e.moveFt <= 0 };
  return items.map(o => o.tags?.some(t => gone[t.k]) ? { ...o, tags:o.tags.map(t => gone[t.k] ? { ...t, spent:true } : t) } : o);
}

/* ---------- the odds ---------- */
// The colour a chance reads in: good, even, poor
export const oddsTone = p => p >= .65 ? 'good' : p >= .4 ? 'even' : 'poor';
export const ODDS_COL = { good:'#8ff0a8', even:'#ffd27a', poor:'#ff8a6a' };
// What the odds add to an attack's row: a tag with the chance, and the words for its detail line
export function oddsBits(o){
  if (!o) return null;
  const tone = oddsTone(o.hit);
  return { tag:{ k:`odds-${tone}`, t:`${o.edge.mark}${o.pct}` },
    info:`<b>${o.pct} to hit</b> (a ${o.need} or better on the d20${o.need >= 20 ? ': only a 20' : ''})${o.crit > .051 ? ` · ${Math.round(o.crit * 100)}% a critical` : ''} · about ${o.avg} damage a swing, misses counted${o.edge.text ? `<br>${esc(o.edge.mark)} ${esc(o.edge.text)}` : ''}${o.cover && o.cover !== 'none' ? `<br>🧱 ${o.cover === 'half' ? 'half cover: +2 to their AC' : o.cover === 'three' ? 'three-quarters cover: +5 to their AC' : 'total cover: no line to them'}` : ''}` };
}
