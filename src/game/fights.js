/* THE ENCOUNTER GENERATOR at the table — roll a fight for the party (engine/encounter.js does the maths)
   and drop it into a room on this floor away from the heroes. */
import { state, ui, makeMonster, log } from '../engine/state.js';
import { spotFor } from '../engine/grid.js';
import { buildEncounter, partyLevels } from '../engine/encounter.js';
import { bestList, BEST } from '../data/bestiary.js';
import { SESSIONS } from '../data/campaign.js';
import { pick } from '../util/core.js';
import { syncTokens } from '../render/minis.js';
import { toast } from '../ui/hud.js';
import { addToInit, riseFrom } from './combat.js';
import { changed } from './session.js';

export const sessionLevel = () => +(String(SESSIONS.find(s => s.n === state.campaign?.session)?.level || '1').match(/\d+/)?.[0]) || 1;
export function rollEncounter(difficulty = ui.encDiff || 'moderate', fam = ui.encFam || 'any'){
  let levels = partyLevels(state.tokens, sessionLevel()); if (!levels.length) levels = [1, 1, 1, 1].map(() => sessionLevel());
  ui.enc = { ...buildEncounter(bestList(), { levels, difficulty, gaze:state.dread, fam }), levels, difficulty, gaze:state.dread };
  return ui.enc;
}
export function placeEncounter(enc = ui.enc, L = ui.floor){
  const f = state.floors[L]; if (!enc?.group.length || !f) return;
  const party = state.tokens.filter(t => t.floor === L && t.kind !== 'monster' && !t.dead);
  const far = r => party.length ? Math.min(...party.map(t => Math.abs(t.x - r.cx) + Math.abs(t.y - r.cy))) : 99;
  const rooms = [...f.rooms].sort((a, b) => far(b) - far(a)), room = pick(rooms.slice(0, Math.max(1, Math.ceil(rooms.length / 2))));
  const placed = [];
  // one at a time, biggest first, so Large creatures find room for their whole space
  for (const g of [...enc.group].sort((a, b) => (BEST[b.bid]?.size || 1) - (BEST[a.bid]?.size || 1))) for (let k = 0; k < g.n; k++){
    const s = spotFor(L, room.cx, room.cy, BEST[g.bid]?.size || 1); if (!s) break;
    const m = makeMonster(g.bid, L, s.x, s.y); state.tokens.push(m); placed.push(m);
    if (state.combat.active && state.combat.floor === L) addToInit(m);
  }
  syncTokens(); placed.forEach(riseFrom);
  log(`⚔ Encounter placed: ${enc.group.map(g => `${g.n} ${BEST[g.bid]?.name}`).join(', ')} (${enc.xp} XP).`, true);
  toast(`${placed.length} on the map${room.name ? ` — ${room.name}` : ''}`);
  changed();
}
