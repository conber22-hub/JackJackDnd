/* 🎯 What Muse's target card (ui/targetcard.js) is given for the foe being aimed at, in the Wanderer's fight bar and the
   handheld's at the table: the token, its bestiary entry (what the party has learned of its kind: game/record.js
   beastBook), its portrait (game/night.js faceOf, drawn once per creature and kept) and the odds the bar works out. */
import { renderTargetCard } from './targetcard.js';
import { beastBook } from '../game/record.js';
import { faceOf } from '../game/night.js';

const faces = new Map();   // token id -> a portrait (or null), drawn once
let book = null, bookAt = 0;
const entryOf = bid => { const now = performance.now(); if (!book || now - bookAt > 2000){ try { book = beastBook(); } catch { book = { entries:[] }; } bookAt = now; }
  return book.entries.find(e => e.bid === bid) || null; };
const faceFor = t => { if (!faces.has(t.id)){ let f = null; try { f = faceOf(t); } catch {} faces.set(t.id, f || null); } return faces.get(t.id); };

// el: where the card goes; t: the token aimed at (or null); odds: { pct, edge } (or null)
export function showTarget(el, t, odds = null){
  if (!el) return;
  renderTargetCard(el, t ? { token:t, known:t.kind === 'monster' ? entryOf(t.bid) : null, odds, face:faceFor(t) } : { token:null });
}
