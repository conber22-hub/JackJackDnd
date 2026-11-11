/* 🕳 HIDDEN REFUGES — ChatGPT's engine/hidden-refuges.js at the table: places people made to hide from the Count,
   under a road, behind a pantry, through the roots, down a crack in the rock. The DM hides one on a floor (Maps tab);
   a clue can be given (a rumour, a document); a hero beside the spot searches (Wisdom (Perception), the clue lowers the
   DC by 3); found, its entrance shows on the map (the #77 models — the road hatch, the inn cellar, the hollow oak,
   the moss curtain — a 3×3 or 4×4 patch beside where the hero stands); the
   party goes in, and its inside is its own map (built rooms, or a natural cave), with a dilemma for the DM. Leaving
   by the entrance brings them back to where they stood. The book lives on the campaign, DM-side. */
import { state, ui, tokById, log } from '../engine/state.js';
import { newRefugeBook, seedRefuge, learnRefugeClue, searchRefuge, enterRefuge, leaveRefuge, entrancePropAt } from '../engine/hidden-refuges.js';
import { REFUGES } from '../data/hidden-refuges.js';
import { ensureMapId, goToMap } from './maps.js';
import { changed } from './session.js';
import { buildFloor } from '../render/floors.js';
import { showCard, toast } from '../ui/hud.js';
import { d } from '../util/core.js';

export const REFUGE_KINDS = Object.keys(REFUGES);
export const refugeBook = () => (state.campaign.refuges ||= newRefugeBook(String(state.campaign?.valley?.seed || state.meta.seed)));
export const refugeHere = (L = ui.floor) => refugeBook().sites.find(s => s.mapId === state.meta.mapId && s.level === L) || null;
export const refugeVisit = () => { const a = refugeBook().active; return a && a.mapId === state.meta.mapId ? a : null; };

export function hideRefuge(kind, L = ui.floor){
  ensureMapId();
  const f = state.floors[L], r = seedRefuge(refugeBook(), { ...f, level:L }, { mapId:state.meta.mapId, kind, chance:1 });
  state.campaign.refuges = r.book;
  if (!r.id){ toast('No fitting spot on this floor for that kind of refuge.'); return; }
  const s = refugeHere(L); log(`🕳 A refuge is hidden here: ${s.name}.`, true); changed();
}
export function refugeClue(){
  const s = refugeHere(); if (!s) return;
  const r = learnRefugeClue(refugeBook(), s.id); state.campaign.refuges = r.book;
  showCard({ kind:'', title:'A rumour', flair:r.clue, lines:['Give it to the party as you like: a word in the tavern, a scrap of paper, a dying man. (Their search is 3 easier now.)'] }, false);
  changed();
}
// The selected hero searches where they stand: a Wisdom (Perception) roll.
export function searchForRefuge(){
  const s = refugeHere(), t = tokById(ui.selected); if (!s || !t){ toast('Select the hero who searches.'); return; }
  const roll = d(20), total = roll + ((t.passive ?? 10) - 10);
  const r = searchRefuge(refugeBook(), { id:s.id, mapId:state.meta.mapId, level:ui.floor, position:{ x:t.x, y:t.y }, total });
  state.campaign.refuges = r.book;
  if (r.found){
    const f = state.floors[ui.floor]; f.props ||= [];
    // the entrance is a multi-square patch beside where the hero stands (the #77 model for this kind)
    if (!f.props.some(p => p.refuge === s.id)){ const at = entrancePropAt(s); f.props.push({ id:f.nextObj++, k:REFUGES[s.kind].entrance, x:at.x, y:at.y, rot:0, refuge:s.id }); }
    buildFloor(ui.floor);
    showCard({ kind:'', title:`${t.name} finds it`, sub:`🎲 ${roll} → ${total}`, flair:r.tell }, false);
    log(`🕳 ${t.name} finds a hidden way.`);
  } else showCard({ kind:'miss', title:`${t.name} finds nothing`, sub:`🎲 ${roll} → ${total}`, lines:['Nothing here, or nothing they can see.'] }, false);
  changed();
}
// In: its inside as its own map, the party at the way in.
export function goIntoRefuge(){
  const s = refugeHere(), t = tokById(ui.selected); if (!s || !t){ toast('Select a hero beside the entrance.'); return; }
  const r = enterRefuge(refugeBook(), { id:s.id, mapId:state.meta.mapId, level:ui.floor, position:{ x:t.x, y:t.y } });
  if (!r.visit){ toast('They need to be at the entrance, and it found.'); return; }
  state.campaign.refuges = { ...r.book, active:{ ...r.book.active, mapId:`refuge:${s.id}` } };
  state.campaign.refugeBackKey = state.meta.key || null;
  goToMap({ meta:{ name:s.name, seed:s.id, floors:1, size:r.visit.size, template:'refuge', refuge:{ specs:r.visit.specs } }, key:`refuge:${s.id}`, kind:'place', at:{ floor:0, x:r.visit.start.x, y:r.visit.start.y } });
  state.campaign.refuges.active.mapId = state.meta.mapId;   // (the map's own id, now it has one)
  ui.floor = 0;
  showCard({ kind:'', title:s.name, flair:r.visit.builder, lines:[`<b>For the DM.</b> ${r.visit.dilemma}`] }, false);
  log(`🕳 The party goes into ${s.name}.`); changed();
}
// Out by the way they came in (the selected hero at the entrance).
export function leaveRefugeMap(){
  const t = tokById(ui.selected) || state.tokens.find(x => x.kind === 'pc' && x.floor === 0);
  const r = leaveRefuge(refugeBook(), { mapId:state.meta.mapId, level:0, position:{ x:t?.x, y:t?.y } });
  if (!r.back){ toast('Bring a hero back to the way in first.'); return; }
  state.campaign.refuges = r.book;
  goToMap({ id:r.back.mapId, kind:'place', at:{ floor:r.back.level, x:r.back.position.x, y:r.back.position.y } });
  ui.floor = r.back.level; log('🕳 The party comes back out.'); changed();
}
