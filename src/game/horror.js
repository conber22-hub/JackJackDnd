/* 🕯 ROADSIDE HORRORS at the table (engine/horror-roads.js over ChatGPT's set pieces). A journey's stretch may have
   one staged beside the road; it stands on the DM's map from the start, labelled, and the Maps tab has its three
   beats to read (what they see coming, what they find, what is different when they come back). Showing it puts it on
   the players' map too; hiding it takes it off again. Only the look and the words: no encounter, no rolls. */
import { state, ui, log } from '../engine/state.js';
import { changed } from './session.js';
import { buildFloor } from '../render/floors.js';
import { showCard } from '../ui/hud.js';

export const horrorHere = (L = ui.floor) => state.floors[L]?.horror || [];
const scene = (id, L = ui.floor) => horrorHere(L).find(s => s.id === id);

export function showHorror(id, on = true, L = ui.floor){
  const s = scene(id, L); if (!s) return;
  s.shown = !!on; buildFloor(L); changed();
  if (on){ log(`🕯 ${s.name}.`); showCard({ kind:'', title:s.name, flair:s.beats.approach, lines:['<b>For the DM.</b> On the players\' map now. Read the approach as they come near; 📖 has the rest.'] }, false); }
}
export function readHorror(id, L = ui.floor){
  const s = scene(id, L); if (!s) return;
  showCard({ kind:'', title:s.name, flair:s.beats.reveal, lines:[`<b>Coming back.</b> ${s.beats.aftermath}`, s.whisper ? `<b>Only you know.</b> ${s.whisper}` : ''].filter(Boolean) }, false);
}
