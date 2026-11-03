/* THE FOLK AT THE TABLE — tapping one of the valley's people (render/folk.js draws them; engine/folk.js, Codex's,
   decides who they are, where they go and what they've seen). The card with what they say goes to the players
   through the outbox like any other (game/outbox.js); who a spy reports to stays on the DM's own screen. */
import { state, ui } from '../engine/state.js';
import { showCard } from '../ui/hud.js';

const ROLE_NAMES = { villager:'a villager', farmer:'a farmer', smith:'the smith', child:'a child', elder:'an elder', watch:'one of the watch',
  priest:'the priest', beggar:'a beggar', traveller:'a traveller', peddler:'a peddler', pilgrim:'a pilgrim', hermit:'a hermit', captive:'a captive', dog:'a dog' };
// until the folk engine gives them their own words: a look, by mood
const LOOK = { easy:'They nod, and go on with their day.', wary:'They watch you, and keep their hands where you can see them.', afraid:'They will not meet your eyes.' };

export const folkAt = (L, id) => state?.floors[L]?.folk?.find(p => p.id === id) || null;
export const roleName = p => ROLE_NAMES[p.role] || 'someone';

export function talkTo(p){
  if (!p) return;
  const said = p.line || LOOK[p.mood] || LOOK.easy;
  showCard({ kind:'', title:p.name || roleName(p), sub:p.name ? roleName(p) : '', flair:said, cat:'world' }, ui.role === 'dm');
  // the DM's eyes only: this one is the Count's
  if (ui.role === 'dm' && p.spy){
    const m = state.campaign?.court?.members.find(x => x.id === p.spy.for);
    showCard({ kind:'seep', title:'👁 One of the Count\'s eyes', sub:m ? `reports to ${m.name} ${m.epithet}` : 'reports to the court', lines:p.seen?.length ? [`Has seen: ${p.seen.map(s => s.kind).join(', ')}`] : [] }, false);
  }
}
