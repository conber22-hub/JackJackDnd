/* HEROES AT THE TABLE — players' characters arrive with them, the DM keeps every sheet (state.characters),
   and each sheet drives a token on the map. A player's own sheets also live in their browser.
   Signing in is a name plus a secret word: the DM's save remembers which sheets belong to which player,
   so a player on a new device gets their characters back by joining with the same name and word. */
import { state, ui, makePC, log } from '../engine/state.js';
import { heroToken, heroStats } from '../engine/hero.js';
import { updateVision } from '../engine/grid.js';
import { syncTokens } from '../render/minis.js';
import { toast } from '../ui/hud.js';
import { hashSeed } from '../util/core.js';
import { changed } from './session.js';
import { nearestOpen } from './actions.js';
import { fillResources } from './resources.js';

/* ---------- the player's own heroes (this browser) ---------- */
const KEY = 'dreaddelve.heroes.v1';
export function myHeroes(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function saveMyHero(h){
  const list = myHeroes().filter(x => x.id !== h.id); list.unshift({ ...h, saved:Date.now() });
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { toast('Could not save in this browser — export the hero instead.'); }
}
export function deleteMyHero(id){ try { localStorage.setItem(KEY, JSON.stringify(myHeroes().filter(x => x.id !== id))); } catch {} }
export const myHero = id => myHeroes().find(h => h.id === id) || null;

/* ---------- who this player is (this browser) ---------- */
const PKEY = 'dreaddelve.player.v1';
// Table-level privacy, not real security: it keeps one friend from grabbing another's hero.
export const playerKey = (name, word) => hashSeed(`dd|${String(name).trim().toLowerCase()}|${word}`).toString(36);
export function myProfile(){ try { return JSON.parse(localStorage.getItem(PKEY) || 'null') || { name:'', key:'' }; } catch { return { name:'', key:'' }; } }
export function saveProfile(p){ try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch {} }

/* ---------- the DM's side ---------- */
// Store (or update) a sheet and make sure its token is on the map with the right numbers. Returns the token.
export function applyCharacter(sheet, { owner, key, place = true } = {}){
  if (!state || !sheet?.id) return null;
  const portrait = sheet.portrait, prev = state.characters[sheet.id]; const clean = { ...sheet }; delete clean.portrait;
  state.characters[sheet.id] = { ...clean, owner:owner || prev?.owner || '', key:key || prev?.key || '', updated:Date.now() };
  const fields = heroToken(sheet);
  let t = state.tokens.find(x => x.charId === sheet.id) || state.tokens.find(x => x.kind === 'pc' && !x.charId && x.name.toLowerCase() === String(sheet.name).toLowerCase());
  if (t){
    const lost = Math.max(0, (t.maxHp || 0) - (t.hp || 0));
    Object.assign(t, fields); t.hp = Math.max(t.dead ? 0 : 1, fields.maxHp - lost);
    fillResources(t);
    log(`${t.name}'s sheet was updated (${fields.cls}).`);
  } else if (place){
    t = makePC({ name:fields.name }); Object.assign(t, fields); t.hp = fields.maxHp; fillResources(t);
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
// Can this signed-in player use that sheet? Unclaimed sheets (no secret word yet) go to whoever has the owner's name.
export function ownsCharacter(sheet, name, key){
  if (!sheet) return false;
  const nm = String(name || '').trim().toLowerCase();
  if (sheet.key) return !!key && sheet.key === key && (!sheet.owner || sheet.owner.toLowerCase() === nm);
  return !!nm && String(sheet.owner || '').toLowerCase() === nm;
}
export const charactersOf = (name, key) => Object.values(state?.characters || {}).filter(c => ownsCharacter(c, name, key));
// A sheet as the player gets it back: no lock, with its portrait.
export function sheetForPlayer(c){
  const out = { ...c }; delete out.key; delete out.owner;
  const tok = state.tokens.find(t => t.charId === c.id); if (tok && state.art[tok.id]) out.portrait = state.art[tok.id];
  return out;
}
export function unlockCharacter(id){ const c = state.characters[id]; if (c){ c.key = ''; changed(); } }
export function setCharacterOwner(id, owner){ const c = state.characters[id]; if (c){ c.owner = String(owner).trim().slice(0, 30); c.key = ''; changed(); } }
export function placeCharacter(id){
  const sheet = state.characters[id]; if (!sheet) return;
  if (state.tokens.some(t => t.charId === id)){ toast(`${sheet.name} is already on the map.`); return; }
  applyCharacter(sheet, { place:true });
}
export function removeCharacter(id){ delete state.characters[id]; changed(); }
export const characterSummary = sheet => { const st = heroStats(sheet); return `${sheet.sp} ${sheet.cls} ${st.L} · AC ${st.ac} · HP ${st.hp} · PP ${st.passive}`; };
