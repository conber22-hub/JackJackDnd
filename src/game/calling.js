/* ⛨ A HERO'S CALLING, IN PLAY (docs/homebrew/callings.md; ChatGPT's engine/callings.js and data/callings.js). A sheet
   keeps its D&D class as the chassis (h.cls: 'Fighter') and adds h.calling ('vanguard') and h.path ('hoplite'). Here:
     · applyCalling(token, sheet): the Calling's and Path's features become the token's mechs (game/mechfx.js runs
       them in a fight), and the chassis's own features take our names and words (Second Wind → Field Patch)
     · classLine(hero or token): what the hero is, for the screens ("Vanguard · Hoplite 3", or "Fighter 3")
     · rulesMode(): 'dread' (the Callings) or 'classic' (the D&D classes), this device's choice in the creator */
import { callingOf, pathOf, featuresAt, featureView } from '../engine/callings.js';
import { originView, originList } from '../engine/origins.js';
import { applyMechs } from './mechfx.js';
import { riteName, riteLine, tradition } from '../engine/rites.js';
import { SRD_SPELLS } from '../data/srd-spells.js';

const RKEY = 'dreaddelve.rules.v1';
// The d20 core's own words a Calling's hero sees in ours (the rule underneath unchanged)
export const OUR_WORDS = { 'Heroic Inspiration':'A Second Chance' };
export const ourWords = s => String(s ?? '').replace(/Heroic Inspiration/g, OUR_WORDS['Heroic Inspiration']);
export function rulesMode(){ try { return localStorage.getItem(RKEY) === 'classic' ? 'classic' : 'dread'; } catch { return 'dread'; } }
export function setRulesMode(m){ try { localStorage.setItem(RKEY, m === 'classic' ? 'classic' : 'dread'); } catch {} }

const lvlOf = x => +(String(x?.cls || '').match(/ (\d+)/)?.[1]) || +x?.lvl || 1;

export function applyCalling(t, sheet){
  if (!t) return t;
  const C = callingOf(sheet);
  t.calling = C ? C.id : null; t.path = C && pathOf(C.id, sheet.path) ? sheet.path : null;
  if (!C){ if (t.mechs?.length) applyMechs(t, []); delete t.callName; riteSpells(t, null); return t; }
  const P = t.path ? pathOf(C.id, t.path) : null, lvl = lvlOf(sheet);
  const feats = featuresAt({ calling:C.id, path:t.path, lvl });
  applyMechs(t, feats.filter(f => f.mech && !['text', 'like'].includes(f.mech.k)).map(f => ({ ...f.mech, src:f.n, text:f.text })));
  // the chassis's features you use (Second Wind, Rage…) in our words
  for (const r of t.resources || []){
    if (r.use === 'mech' || r.slot) continue;
    if (r.id === 'heroic' && r.n === 'Heroic Inspiration'){ r.dd = r.n; r.n = OUR_WORDS['Heroic Inspiration']; continue; }   // (the d20's own luck, in our words)
    const v = featureView(C.id, r.dd || r.n);
    if (v?.n && v.n !== (r.dd || r.n)){ r.dd ||= r.n; r.n = v.n; if (v.text) r.text = v.text; }
  }
  riteSpells(t, C.id);   // ✦ its spells by our names (ChatGPT's data/rites.js)
  t.callName = `${C.name}${P ? ` · ${P.name}` : ''}`;
  t.callColor = C.color; t.emblem = C.emblem;
  return t;
}

// "Vanguard · Hoplite 3" for a Calling's hero (sheet or token), else the D&D class line as it was
export function classLine(x){
  if (!x) return '';
  if (x.callName) return `${x.callName} ${lvlOf(x)}`;
  const C = callingOf(x); if (!C) return x.lvl != null && !/\d/.test(String(x.cls || '')) ? `${x.cls} ${x.lvl}` : String(x.cls || '');
  const P = x.path ? pathOf(C.id, x.path) : null;
  return `${C.name}${P ? ` · ${P.name}` : ''} ${lvlOf(x)}`;
}
// "Drawn (far-future)" for an Origin's hero, else the D&D species
// (a Calling's hero with no Origin set, a companion or an older save, is named by the Origin that stands on their species)
const ERA_ORIGIN = { 'far-future':'drawn-future', ancient:'drawn-ancient', medieval:'drawn-medieval' };
function originFor(h){
  const C = callingOf(h); if (!C) return null;
  const same = originList().filter(o => o.like === h.sp), want = ERA_ORIGIN[C.era];
  return same.find(o => o.id === want) || (C.era === 'barovian' ? same.find(o => !o.id.startsWith('drawn-')) : null) || same[0] || null;
}
export const originLine = h => (h?.origin && originView(h.origin)?.name) || originFor(h)?.name || h?.sp || '';

/* ✦ A spell as a Calling's hero knows it (ChatGPT's engine/rites.js): its own tradition's name and line (an Archivist's
   Protocol, a Chaplain's Rite…), else the tradition of a class that casts it (a Vanguard's borrowed spell is read as
   the Archivists read it), else null (a spell from a DM's book keeps its own name). The rules keep the spell's own
   name underneath (c.sn), so slots, concentration, effects and looks find it. */
const LETTER = { W:'archivist', S:'relicborn', K:'seepbound', C:'chaplain', B:'herald', D:'mistwalker', P:'warden', R:'marksman' };
const CASTERS = new Map(SRD_SPELLS.map(s => [s.n, s.c || '']));
export function spellReading(name, calling){
  if (!calling || typeof name !== 'string') return null;
  for (const id of [calling, ...[...(CASTERS.get(name) || '')].map(l => LETTER[l]).filter(Boolean)]){
    const n = riteName(name, id); if (n && n !== name) return { n, line:riteLine(name, id) };
  }
  return null;
}
// What a hero's magic is called: a Calling's own ("Protocols", "Rites", "Gifts"…), else Spells
export const magicWord = x => tradition(x?.calling)?.plural || 'Spells';
// A hero's own word for a spell (the sheet, the creator's list): ours for a Calling's hero, the spell's otherwise
export const spellWord = (name, hero) => spellReading(name, hero?.calling)?.n || name;
// Rename a token's spells (casts, and the spells that strike like weapons) for its Calling; null puts them back
export function riteSpells(t, calling){
  const SUF = / \(×.*\)$/;
  for (const c of t.casts || []){ if (c.mon) continue;
    const key = c.sn || c.n, r = spellReading(key, calling);
    if (r){ c.sn = key; c.n = r.n; c.line = r.line; c.rite = 1; }
    else if (c.rite){ c.n = key; delete c.sn; delete c.line; delete c.rite; } }
  for (const a of t.attacks || []){
    if (!(a.l != null || / casts /.test(a.f || '') || a.rite)) continue;
    const suf = (String(a.n || '').match(SUF) || [''])[0], key = a.sn || String(a.n || '').replace(SUF, ''), r = spellReading(key, calling);
    if (r){ a.sn = key; a.n = r.n + suf; a.line = r.line; a.rite = 1; }
    else if (a.rite){ a.n = key + suf; if (a.rite === 1 && a.l == null) delete a.sn; delete a.line; delete a.rite; } }
  return t;
}
