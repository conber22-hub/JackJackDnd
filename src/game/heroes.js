/* HEROES AT THE TABLE — players' characters arrive with them, the DM keeps every sheet (state.characters),
   and each sheet drives a token on the map. A player's own sheets also live in their browser. */
import { state, ui, makePC, log } from '../engine/state.js';
import { heroToken, heroStats } from '../engine/hero.js';
import { updateVision } from '../engine/grid.js';
import { syncTokens } from '../render/minis.js';
import { toast } from '../ui/hud.js';
import { changed } from './session.js';
import { nearestOpen } from './actions.js';

/* ---------- the player's own heroes (this browser) ---------- */
const KEY = 'dreaddelve.heroes.v1';
export function myHeroes(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function saveMyHero(h){
  const list = myHeroes().filter(x => x.id !== h.id); list.unshift({ ...h, saved:Date.now() });
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { toast('Could not save in this browser — export the hero instead.'); }
}
export function deleteMyHero(id){ try { localStorage.setItem(KEY, JSON.stringify(myHeroes().filter(x => x.id !== id))); } catch {} }
export const myHero = id => myHeroes().find(h => h.id === id) || null;

/* ---------- the DM's side ---------- */
// Store (or update) a sheet and make sure its token is on the map with the right numbers. Returns the token.
export function applyCharacter(sheet, { owner, place = true } = {}){
  if (!state || !sheet?.id) return null;
  const portrait = sheet.portrait; const clean = { ...sheet }; delete clean.portrait;
  state.characters[sheet.id] = { ...clean, owner:owner || state.characters[sheet.id]?.owner || '', updated:Date.now() };
  const fields = heroToken(sheet);
  let t = state.tokens.find(x => x.charId === sheet.id) || state.tokens.find(x => x.kind === 'pc' && !x.charId && x.name.toLowerCase() === String(sheet.name).toLowerCase());
  if (t){
    const lost = Math.max(0, (t.maxHp || 0) - (t.hp || 0));
    Object.assign(t, fields); t.hp = Math.max(t.dead ? 0 : 1, fields.maxHp - lost);
    log(`${t.name}'s sheet was updated (${fields.cls}).`);
  } else if (place){
    t = makePC({ name:fields.name }); Object.assign(t, fields); t.hp = fields.maxHp;
    const L = partyFloor(), f = state.floors[L], r = f.rooms[0], spot = nearestOpen(L, r.cx, r.cy) || { x:r.cx, y:r.cy };
    Object.assign(t, { floor:L, x:spot.x, y:spot.y });
    state.tokens.push(t);
    log(`${t.name} (${fields.cls}) joins the party.`);
  }
  if (t && portrait) state.art[t.id] = portrait;
  updateVision(); syncTokens(); changed();
  return t;
}
// Where the party mostly is (new heroes join them there).
function partyFloor(){
  const counts = {}; for (const t of state.tokens) if (t.kind !== 'monster' && !t.dead) counts[t.floor] = (counts[t.floor] || 0) + 1;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? +best[0] : 0;                // no party yet: everyone starts at the entrance
}
export function placeCharacter(id){
  const sheet = state.characters[id]; if (!sheet) return;
  if (state.tokens.some(t => t.charId === id)){ toast(`${sheet.name} is already on the map.`); return; }
  applyCharacter(sheet, { place:true });
}
export function removeCharacter(id){ delete state.characters[id]; changed(); }
export const characterSummary = sheet => { const st = heroStats(sheet); return `${sheet.sp} ${sheet.cls} ${st.L} · AC ${st.ac} · HP ${st.hp} · PP ${st.passive}`; };
