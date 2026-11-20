/* ⛨ A HERO'S CALLING, IN PLAY (docs/homebrew/callings.md; ChatGPT's engine/callings.js and data/callings.js). A sheet
   keeps its D&D class as the chassis (h.cls: 'Fighter') and adds h.calling ('vanguard') and h.path ('hoplite'). Here:
     · applyCalling(token, sheet): the Calling's and Path's features become the token's mechs (game/mechfx.js runs
       them in a fight), and the chassis's own features take our names and words (Second Wind → Field Patch)
     · classLine(hero or token): what the hero is, for the screens ("Vanguard · Hoplite 3", or "Fighter 3")
     · rulesMode(): 'dread' (the Callings) or 'classic' (the D&D classes), this device's choice in the creator */
import { callingOf, pathOf, featuresAt, featureView } from '../engine/callings.js';
import { originView } from '../engine/origins.js';
import { applyMechs } from './mechfx.js';

const RKEY = 'dreaddelve.rules.v1';
export function rulesMode(){ try { return localStorage.getItem(RKEY) === 'classic' ? 'classic' : 'dread'; } catch { return 'dread'; } }
export function setRulesMode(m){ try { localStorage.setItem(RKEY, m === 'classic' ? 'classic' : 'dread'); } catch {} }

const lvlOf = x => +(String(x?.cls || '').match(/ (\d+)/)?.[1]) || +x?.lvl || 1;

export function applyCalling(t, sheet){
  if (!t) return t;
  const C = callingOf(sheet);
  t.calling = C ? C.id : null; t.path = C && pathOf(C.id, sheet.path) ? sheet.path : null;
  if (!C){ if (t.mechs?.length) applyMechs(t, []); delete t.callName; return t; }
  const P = t.path ? pathOf(C.id, t.path) : null, lvl = lvlOf(sheet);
  const feats = featuresAt({ calling:C.id, path:t.path, lvl });
  applyMechs(t, feats.filter(f => f.mech && !['text', 'like'].includes(f.mech.k)).map(f => ({ ...f.mech, src:f.n, text:f.text })));
  // the chassis's features you use (Second Wind, Rage…) in our words
  for (const r of t.resources || []){
    if (r.use === 'mech' || r.slot) continue;
    const v = featureView(C.id, r.dd || r.n);
    if (v?.n && v.n !== (r.dd || r.n)){ r.dd ||= r.n; r.n = v.n; if (v.text) r.text = v.text; }
  }
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
export const originLine = h => (h?.origin && originView(h.origin)?.name) || h?.sp || '';
