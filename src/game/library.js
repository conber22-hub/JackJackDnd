/* YOUR BOOKS, IN THIS BROWSER — the DM's compendium (engine/library.js converts it) kept in IndexedDB and merged
   into the app's tables at start-up: spells into SPELLS, species, backgrounds and feats into theirs, subclasses into
   SUBCLASSES, creatures into the bestiary. Nothing of it is in the app's code or on the website: it lives only in the
   browser it was imported into, and in the browsers of the players at that DM's table (net/table.js sends them the
   creator's part, packed, once per version).
   The app's own entries always win a name clash: they're the ones the rules are wired to. */
import { get, set, del } from 'idb-keyval';
import { SPELLS, SPECIES, BACKGROUNDS, FEATS, CLASSES, SUBCLASSES } from '../data/srd.js';
import { bestList, setLibraryBestiary, rebuildBestiary } from '../data/bestiary.js';
import { convertPrism, pickLibrary, libCounts, kindCounts, creatorPart, nameKey } from '../engine/library.js';
import { state } from '../engine/state.js';

const KEY = 'dreaddelve.library.v1', TABLE_KEY = 'dreaddelve.tablelibrary.v1';
// What the app has of its own (read before anything is merged in).
const BUILT_IN = {
  spells:new Set(SPELLS.map(s => nameKey(s.n))), species:new Set(Object.keys(SPECIES).map(nameKey)), backgrounds:new Set(Object.keys(BACKGROUNDS).map(nameKey)),
  feats:new Set(Object.keys(FEATS).map(nameKey)), subclasses:new Set(Object.values(CLASSES).map(c => nameKey(c.sub))), monsters:new Set(bestList().map(b => nameKey(b.name))),
};
// mine: the DM's own import { lib, kinds, name, at, hash } · table: what a player got from their DM's table { part, hash }
const L = { mine:null, table:null, applied:null, hash:'', ready:false, listeners:new Set() };
export const libraryState = () => L;
export const onLibrary = fn => { L.listeners.add(fn); return () => L.listeners.delete(fn); };
const tell = () => { for (const fn of L.listeners) try { fn(L); } catch {} };

// A short fingerprint of the content, so a player's phone knows whether it already has this version.
function hashOf(obj){ const s = JSON.stringify(obj); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + s.length.toString(36); }

/* Take out whatever was merged before, then put the new picks in. */
function merge(pick){
  for (let i = SPELLS.length - 1; i >= 0; i--) if (SPELLS[i].lib) SPELLS.splice(i, 1);
  for (const T of [SPECIES, BACKGROUNDS, FEATS]) for (const k of Object.keys(T)) if (T[k]?.lib) delete T[k];
  for (const k of Object.keys(SUBCLASSES)) delete SUBCLASSES[k];
  if (pick){
    SPELLS.push(...pick.spells);
    Object.assign(SPECIES, pick.species); Object.assign(BACKGROUNDS, pick.backgrounds); Object.assign(FEATS, pick.feats);
    for (const [c, subs] of Object.entries(pick.subclasses || {})) if (Object.keys(subs).length) SUBCLASSES[c] = subs;
  }
  setLibraryBestiary(pick?.monsters || []); rebuildBestiary(state?.content?.bestiary);
  L.applied = pick;
}
function apply(){
  if (L.mine?.lib){ merge(pickLibrary(L.mine.lib, L.mine.kinds, BUILT_IN)); L.hash = hashOf(creatorPart(L.applied)); }
  else if (L.table?.part){ merge(pickLibrary(L.table.part, ['canon', 'ua', 'homebrew'], BUILT_IN)); L.hash = L.table.hash; }   // the DM already chose
  else { merge(null); L.hash = ''; }
  tell();
}

// At start-up: this browser's own library, or the one its last table shared.
export async function loadLibrary(){
  try { L.mine = await get(KEY) || null; L.table = await get(TABLE_KEY) || null; } catch { L.mine = L.table = null; }
  L.ready = true; apply();
}
// The DM imports a compendium file. → the counts of what's now in use
export async function importLibrary(text, name = 'compendium'){
  const lib = convertPrism(text);
  L.mine = { lib, kinds:L.mine?.kinds || ['canon', 'ua'], name, at:Date.now() };
  apply(); try { await set(KEY, L.mine); } catch (e) { throw new Error(`Imported, but this browser wouldn't store it (${e?.message || e}). It will be gone after a reload.`); }
  return libCounts(L.applied);
}
export async function setLibraryKinds(kinds){ if (!L.mine) return; L.mine.kinds = kinds; apply(); try { await set(KEY, L.mine); } catch {} }
export async function removeLibrary(){ L.mine = null; apply(); try { await del(KEY); } catch {} }
export const libraryInUse = () => !!L.applied;
export const libraryCounts = () => L.applied ? libCounts(L.applied) : null;
export const libraryKinds = () => L.mine ? kindCounts(L.mine.lib) : null;

/* Sharing with the table. The DM's side: the hash to offer, and the creator's part, gzipped where the browser can. */
export const tableHash = () => L.mine ? L.hash : '';
export async function packForTable(){
  const json = JSON.stringify(creatorPart(L.applied));
  if (typeof CompressionStream === 'undefined') return { json };
  const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  return { gz:new Uint8Array(buf) };
}
// The player's side: does this phone already have that version? Then keep it; else ask for it.
export const haveTableLibrary = hash => !!hash && (L.table?.hash === hash || (L.mine && L.hash === hash));
export async function receiveTableLibrary(hash, packed){
  let json = packed?.json;
  if (!json && packed?.gz){
    const bytes = packed.gz instanceof Uint8Array ? packed.gz : new Uint8Array(packed.gz);
    json = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  const part = JSON.parse(json);
  L.table = { part, hash }; if (!L.mine) apply();
  try { await set(TABLE_KEY, L.table); } catch {}
  return libCounts(part);
}

/* Looking things up (the DM's reader): every entry whose name has the words, any kind. → [{ kind, n, sub, text }] */
export function lookUp(q, max = 40){
  const lib = L.mine?.lib || L.table?.part; if (!lib) return [];
  const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return [];
  const hit = n => words.every(w => n.toLowerCase().includes(w)), out = [];
  const add = (kind, n, sub, text) => { if (out.length < max && hit(n)) out.push({ kind, n, sub, text }); };
  for (const s of lib.spells || []) add('Spell', s.n, `${s.l ? `Level ${s.l}` : 'Cantrip'} ${s.school} · ${s.src}`, [`${s.time} · ${s.range} · ${s.comp} · ${s.dur}`, s.text, s.hl && `Higher levels. ${s.hl}`].filter(Boolean).join('\n\n'));
  for (const i of lib.items || []) add('Magic item', i.n, `${i.rarity} ${i.type}${i.attune ? ` · ${i.attune}` : ''} · ${i.src}`, i.text);
  for (const m of lib.monsters || []) add('Creature', m.name, `CR ${m.cr} · AC ${m.ac} · HP ${m.hp} · ${m.src}`, m.traits.map(t => t.replace(/<[^>]+>/g, '')).join('\n'));
  for (const [n, f] of Object.entries(lib.feats || {})) add('Feat', n, f.src, f.text);
  for (const [n, s] of Object.entries(lib.species || {})) add('Species', n, s.src, [s.text, ...s.feats.map(f => `${f.n}. ${f.text}`)].join('\n\n'));
  for (const [n, b] of Object.entries(lib.backgrounds || {})) add('Background', n, b.src, [b.text, ...(b.feats || []).map(f => `${f.n}. ${f.text}`)].join('\n\n'));
  for (const [c, subs] of Object.entries(lib.subclasses || {})) for (const [n, s] of Object.entries(subs)) add('Subclass', n, `${c} · ${s.src}`, [s.text, ...Object.entries(s.texts).map(([k, v]) => `${k}. ${v}`)].join('\n\n'));
  return out;
}
// The text of something a hero has (a library feature, feat, species trait), for their sheet. → string or ''
export function textOf(name){
  const lib = L.mine?.lib || L.table?.part; if (!lib || !name) return '';
  const k = nameKey(name);
  for (const s of Object.values(lib.species || {})) for (const f of s.feats || []) if (nameKey(f.n) === k) return f.text;
  for (const subs of Object.values(lib.subclasses || {})) for (const s of Object.values(subs)) for (const [n, t] of Object.entries(s.texts || {})) if (nameKey(n) === k) return t;
  for (const [n, f] of Object.entries(lib.feats || {})) if (nameKey(n) === k) return f.text;
  return '';
}
