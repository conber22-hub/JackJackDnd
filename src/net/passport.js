/* 🧭 THE REMEMBERED TABLE — ChatGPT's table passport (engine/table-entry.js) on a player's device: the last few
   tables this browser joined (the campaign's own id, its name, the code, who they played), so the start page can
   offer "back to the table" in one tap, and the hero chooser can suggest the hero they played there last.
   Only ever written after the DM's table let them in; kept in this browser alone. */
import { newTablePassport, rememberTable, rememberedHero } from '../engine/table-entry.js';

const PKEY = 'dreaddelve.tables.v1';
export function passport(){
  try { const p = JSON.parse(localStorage.getItem(PKEY) || 'null'); return p && Array.isArray(p.tables) ? p : newTablePassport(); }
  catch { return newTablePassport(); }
}
// After the table admitted us (and again once we're seated on a hero).
export function noteTable(entry){
  try { localStorage.setItem(PKEY, JSON.stringify(rememberTable(passport(), entry))); return true; } catch { return false; }
}
export const recentTables = () => passport().tables;
// The table we expected behind this code: the one we picked from the list, else the last one we met behind it.
export const expectedTable = (code, picked = null) => picked || passport().tables.find(t => t.code === String(code || '').toUpperCase())?.tableId || null;
/* The hero to suggest at this table: the one played here last, if this really is that table (a reused code can
   reach another campaign) and the DM's table still lists it as ours. */
export const suggestHero = ({ expected, actual, owned }) => rememberedHero(passport(), { expectedTableId:expected, actualTableId:actual, ownedHeroIds:owned });
