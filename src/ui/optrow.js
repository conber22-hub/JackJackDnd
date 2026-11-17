/* 🎴 A CHOICE IN A LIST, AS THE HANDHELDS DRAW IT (ui/wander.js, ui/tablehh.js): an icon at its left, its name, a
   line of what it does, and tags at its right for what it costs (Action, Bonus, Free, ½ move, a spell slot,
   Concentration) or what it needs. Lists come in groups with a small header each (Strike, Magic, Move & defend…), and
   the highlighted choice says a little more under the list.
   The name stays the button's first text (the icon is drawn by CSS), so a choice still reads as its name. */
import { esc } from '../util/core.js';

export const COST = { act:'Action', bonus:'Bonus', free:'Free', move:'½ move', react:'Reaction' };
// tag helpers: tag('act'), tag('slot', 'L1'), tag('conc', 'Conc.'), tag('warn', 'out of reach')
export const tag = (k, t = COST[k] || k) => ({ k, t });

// One choice: o = { label, sub, icon, tags:[{ k, t }], off, tone }; attrs: the button's own attributes (data-…)
export function optRow(o, on, attrs){
  // (room kept at the right for the tags, so a long name doesn't run under them)
  const tw = (o.tags || []).reduce((n, t) => n + String(t.t).length * 6.4 + 22, 0);
  return `<button class="wd-opt${on ? ' on' : ''}${o.off ? ' off' : ''}${o.icon ? ' has-ic' : ''}${tw ? ' has-tg' : ''}"${tw ? ` style="--tw:${Math.round(tw)}px"` : ''}${o.icon ? ` data-ic="${esc(o.icon)}"` : ''}${o.tone ? ` data-tone="${esc(o.tone)}"` : ''} ${attrs}>`
    + `${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}`
    + `${o.tags?.length ? `<span class="wd-tags">${o.tags.map(t => `<i class="t-${esc(t.k)}${t.spent ? ' spent' : ''}"${t.spent ? ' title="spent this turn"' : ''}>${esc(t.t)}</i>`).join('')}</span>` : ''}</button>`;
}
// A whole list: a header wherever the group changes; attrsAt(k): the attributes of choice k
export function optList(items, sel, attrsAt){
  let grp = null, out = '';
  items.forEach((o, k) => {
    if ((o.group || '') !== (grp || '') && o.group) out += `<div class="wd-grp">${esc(o.group)}</div>`;
    grp = o.group || '';
    out += optRow(o, k === sel, attrsAt(k));
  });
  return out;
}
// What the highlighted choice says about itself, under the list
export const optInfo = o => o?.info ? `<div class="wd-info">${o.info}</div>` : '';
