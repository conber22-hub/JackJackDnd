/* ✨ THINGS TO FIND AND READ — the small first engine (the same shape as ChatGPT's fuller one, docs/chatgpt/finds.md,
   which will take its place): where the glints, the things to read and the things worth searching are on a map, whether
   the hero has noticed one, and what it gives. Pure and seeded: the same map gives the same finds every time.
     floor: { W, H, kind, open:[[x,y]], path:[[x,y]], props:[{ kind, x, y }], rooms:[{ x, y, w, h }] } */
import { READ, PAGES, TRINKETS, SEARCH, GLINT, HOW_MANY } from '../data/finds-lite.js';

const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = hash(String(seed)); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const weighted = (list, r) => { const sum = list.reduce((s, o) => s + o.w, 0); let k = r() * sum; for (const o of list){ k -= o.w; if (k <= 0) return o; } return list[list.length - 1]; };
const READ_ON = { gravestone:'gravestone', shrine:'shrine', altar:'shrine', statue:'statue', well:'well', milestone:'milestone', deadtree:'carving', boulder:'carving', stump:'carving', gallows:'carving' };
const NOTICE_ON = new Set(['cottage', 'house', 'hall', 'long']);
const SEARCHABLE = new Set(Object.keys(SEARCH));

export function placeFinds(floor, { seed = '', gaze = 1, taken = [] } = {}){
  const r = rng(`${seed}|finds`), out = [], used = { read:{} };
  const kind = floor.kind || 'road', skip = new Set(taken);
  const pick = (key, list) => { const seen = used.read[key] ||= new Set(); const free = list.map((t, i) => i).filter(i => !seen.has(i)); const i = free.length ? free[Math.floor(r() * free.length)] : Math.floor(r() * list.length); seen.add(i); return list[i]; };
  // things to read, on their props
  floor.props.forEach((p, k) => {
    const key = READ_ON[p.kind]; if (!key) return;
    if (key === 'carving' && r() > .35) return;   // (only some trees and stones bear a mark)
    out.push({ id:`r${k}`, x:p.x, y:p.y, kind:'read', on:p.kind, hidden:false, dc:0, text:pick(key, READ[key]) });
  });
  // notices on a few village and town buildings
  if (['village', 'town'].includes(kind)) floor.props.forEach((p, k) => { if (NOTICE_ON.has(p.kind) && r() < .3) out.push({ id:`n${k}`, x:p.x, y:p.y, kind:'read', on:'notice', hidden:false, dc:0, text:pick('notice', READ.notice) }); });
  // things worth a search
  floor.props.forEach((p, k) => { if (SEARCHABLE.has(p.kind) && r() < .7) out.push({ id:`s${k}`, x:p.x, y:p.y, kind:'search', on:p.kind, hidden:false, dc:0, out:roll(SEARCH[p.kind], r, kind) }); });
  // glints on the open ground, apart, off the road, never where they come in
  const many = HOW_MANY[kind] || HOW_MANY.road, n = many.min + Math.floor(r() * (many.max - many.min + 1));
  const path = new Set((floor.path || []).map(([x, y]) => y * floor.W + x)), props = new Set(floor.props.map(p => p.y * floor.W + p.x)), first = floor.rooms?.[0];
  const spots = (floor.open || []).filter(([x, y]) => !path.has(y * floor.W + x) && !props.has(y * floor.W + x) && !(first && x >= first.x && x < first.x + first.w && y >= first.y && y < first.y + first.h));
  const glints = [];
  for (let tries = 0; glints.length < n && tries < 200 && spots.length; tries++){
    const [x, y] = spots[Math.floor(r() * spots.length)];
    if (glints.some(g => Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) < 4)) continue;
    glints.push({ x, y });
  }
  glints.forEach((g, k) => { const hidden = k < many.hidden; out.push({ id:`g${k}`, x:g.x, y:g.y, kind:'glint', on:null, hidden, dc:hidden ? 12 + Math.floor(r() * 3) + Math.min(2, Math.floor((gaze - 1) / 4)) : 0, out:roll(GLINT[kind] || GLINT.road, r, kind) }); });
  return out.filter(f => !skip.has(f.id));
}
function roll(list, r, kind){
  const o = weighted(list, r);
  const pool = PAGES.filter(p => p.where.includes(kind)), pages = pool.length ? pool : PAGES, page = o.page ? pages[Math.floor(r() * pages.length)] : null;
  return { say:o.say, gp:o.gp ? o.gp + Math.floor(r() * o.gp) : 0, trinket:o.trinket ? TRINKETS[Math.floor(r() * TRINKETS.length)].n : null, page:page ? page.id : null, potion:!!o.potion };
}
// Can the hero see it from here? passive: their passive Perception; dist: squares away (Chebyshev)
export function noticed(find, { passive = 10, dist = 0 } = {}){
  if (find.kind !== 'glint') return true;
  return find.hidden ? dist <= 2 && passive >= find.dc : dist <= 6;
}
export const outcome = find => find.out || { say:'', gp:0, trinket:null, page:null, potion:false };
export const pageById = id => PAGES.find(p => p.id === id) || null;
