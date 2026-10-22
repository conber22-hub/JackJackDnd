/* 🎲 ROLL AN NPC — a name, a forged look, the line the DM reads when the party meets them, a quirk and a want.
   The DM places them as an ally (a token of the party's side) or as a foe (a creature of the matching kind). */
import { state, ui, makeNPC, makeMonster, log } from '../engine/state.js';
import { npcLook, describeLook } from '../engine/look.js';
import { NPC_KINDS } from '../data/looks.js';
import * as T from '../data/npc-starter.js';
import { BEST } from '../data/bestiary.js';
import { changed } from './session.js';
import { setMode } from '../ui/input.js';
import { toast } from '../ui/hud.js';

const pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
// a hostile kind's creature in the bestiary (for placing as a foe)
const FOE_OF = { villager:'commoner', vistani:'commoner', guard:'guard', priest:'commoner', noble:'commoner', bandit:'bandit', cultist:'cultist', hunter:'scout', adventurer:'veteran' };
export function rollNPC(kind = 'villager'){
  const look = npcLook(kind);
  const name = kind === 'vistani' ? pick(T.VISTANI) : `${pick(T.FIRST)} ${pick(T.LAST)}`;
  return { kind, name, look, line:describeLook(look), quirk:pick(T.QUIRKS), want:pick(T.WANTS) };
}
// Put the NPC on the map: tap where (the Build tab's place mode). foe: a creature of the matching kind.
export function placeNPC(npc, foe = false){
  if (!npc) return;
  if (foe){
    const bid = FOE_OF[npc.kind] || 'commoner';
    if (!BEST[bid]){ toast('No creature of that kind in the bestiary.'); return; }
    const t = makeMonster(bid, ui.floor, 0, 0); t.flags.gone = true;            // hidden until the DM taps where
    Object.assign(t, { name:npc.name, look:npc.look, notes:`${npc.line} ${npc.quirk[0].toUpperCase()}${npc.quirk.slice(1)}; ${npc.want}.` });
    state.tokens.push(t);
    setMode('placeTok', { id:t.id }, `Tap where ${npc.name} stands`);
  } else {
    const t = makeNPC(npc.name); t.look = npc.look; t.color = npc.look.c1; t.flags.gone = true;
    t.notes = `${npc.line} ${npc.quirk[0].toUpperCase()}${npc.quirk.slice(1)}; ${npc.want}.`;
    state.tokens.push(t);
    setMode('placeTok', { id:t.id }, `Tap where ${npc.name} stands`);
  }
  log(`${npc.name} (${NPC_KINDS[npc.kind]?.n || npc.kind}) enters the story.`, true);
  changed();
}
