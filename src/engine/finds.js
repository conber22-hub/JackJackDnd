import { READ, PAGES, TRINKETS, SEARCH, GLINT, HOW_MANY } from '../data/finds.js';
const clone = v => JSON.parse(JSON.stringify(v));
function hash(s){ let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function random(seed){ let a = hash(seed); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ a >>> 15, a | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(list, rng){ const a = [...list]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function roll(list, rng){ let n = rng() * list.reduce((s, o) => s + o.w, 0); return list.find(o => (n -= o.w) < 0) || list.at(-1); }
const key = (x, y) => `${x},${y}`;
const inside = (x, y, r) => r && x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
export function placeFinds(floor, { seed = '', gaze = 1, taken = [] } = {}){
  if (!floor || !Number.isInteger(floor.W) || !Number.isInteger(floor.H) || floor.W <= 0 || floor.H <= 0) return [];
  const valid = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < floor.W && y < floor.H;
  const props = (floor.props || []).filter(p => valid(p.x, p.y));
  const open = [...new Set((floor.open || []).filter(p => Array.isArray(p) && valid(...p)).map(p => key(...p)))].map(k => k.split(',').map(Number));
  const opens = new Set(open.map(p => key(...p))), paths = new Set((floor.path || []).map(p => key(...p))), occupied = new Set(props.map(p => key(p.x, p.y)));
  // Gaze and collected ids must not influence the layout or its pre-rolled rewards.
  const stamp = JSON.stringify([seed, floor.W, floor.H, floor.kind, open, floor.path || [], props, floor.rooms || [], floor.place || floor.name || '']);
  const rng = random(stamp), prefix = hash(stamp).toString(36), finds = [], usedText = new Set();
  const add = f => finds.push({ id:`find-${prefix}-${finds.length}`, hidden:false, dc:0, ...f });
  const read = (type, prop, position = [prop.x, prop.y]) => {
    const location = String(floor.place || floor.name || (floor.rooms || []).find(r => inside(prop.x, prop.y, r))?.name || '').toLowerCase();
    const where = location.includes('vallaki') ? 'vallaki' : location.includes('krezk') ? 'krezk' : floor.kind === 'village' ? 'village' : 'any';
    const choices = READ[type].filter(t => !usedText.has(t.text) && (!t.where || t.where === 'any' || t.where === where));
    if (!choices.length) return;
    const entry = choices[Math.floor(rng() * choices.length)]; usedText.add(entry.text);
    const text = type === 'gravestone' && entry.years ? `${entry.name}, ${entry.years}. ${entry.text.slice(entry.name.length + 2)}` : entry.text;
    add({ x:position[0], y:position[1], kind:'read', on:prop.kind, text });
  };
  const resolve = list => {
    const raw = roll(list, rng), out = { say:raw.say, gp:raw.gp || 0, trinket:null, page:null, potion:raw.potion || null };
    if (raw.trinket) out.trinket = clone(TRINKETS[Math.floor(rng() * TRINKETS.length)]);
    if (raw.page){
      const pages = PAGES.filter(p => p.where.includes(floor.kind));
      if (pages.length) out.page = clone(pages[Math.floor(rng() * pages.length)]);
      else out.say = 'The paper has washed blank. Nothing remains to read.';
    }
    return out;
  };
  for (const p of props){
    if (['gravestone','statue','shrine','well','milestone'].includes(p.kind)) read(p.kind, p);
    if (['village','town'].includes(floor.kind) && ['cottage','house','hall','signpost'].includes(p.kind) && rng() < .65){
      const at = [[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy]) => [p.x+dx,p.y+dy]).find(q => opens.has(key(...q)) && !occupied.has(key(...q)));
      if (at) read('notice', p, at);
    }
    if (['deadtree','boulder','stump','gallows'].includes(p.kind) && rng() < .6) read('carving', p);
    if (Object.hasOwn(SEARCH, p.kind)) add({ x:p.x, y:p.y, kind:'search', on:p.kind, out:resolve(SEARCH[p.kind]) });
  }
  const limits = HOW_MANY[floor.kind], table = GLINT[floor.kind];
  if (limits && table){
    const wanted = limits.min + Math.floor(rng() * (limits.max - limits.min + 1)), placed = [];
    const candidates = shuffle(open.filter(([x,y]) => !paths.has(key(x,y)) && !occupied.has(key(x,y)) && !inside(x,y,floor.rooms?.[0])), rng);
    for (const [x,y] of candidates){
      if (placed.length === wanted) break;
      if (placed.some(p => Math.hypot(x-p.x, y-p.y) < 4)) continue;
      const hidden = placed.length < limits.hidden;
      const g = Number.isFinite(gaze) ? Math.max(1, Math.min(10, gaze)) : 1;
      const f = { x,y,kind:'glint',on:null,hidden,dc:hidden ? 12 + Math.floor((g-1)*4/9) : 0,out:resolve(table) };
      add(f); placed.push(f);
    }
  }
  const removed = new Set(taken);
  return finds.filter(f => !removed.has(f.id));
}
export function noticed(find, { passive = 0, dist = Infinity } = {}){
  if (!find) return false;
  if (find.kind === 'read' || find.kind === 'search') return true;
  if (find.kind !== 'glint' || !Number.isFinite(dist) || dist < 0) return false;
  return find.hidden ? dist <= 2 && passive >= find.dc : dist <= 6;
}
export function outcome(find){
  const out = find?.out;
  return { say:out?.say || find?.text || 'Nothing remains.', gp:Math.max(0, Math.min(25, Math.floor(out?.gp || 0))),
    trinket:out?.trinket ? clone(out.trinket) : null, page:out?.page ? clone(out.page) : null, potion:out?.potion || null };
}
export function signpost(here, ways = []){
  const arrows = { n:'↑', ne:'↗', e:'→', se:'↘', s:'↓', sw:'↙', w:'←', nw:'↖' };
  return ways.map(w => {
    const hours = Number.isFinite(w.hours) ? Math.max(0, w.hours) : 0;
    const time = hours === 0 ? 'close by' : hours === 1 ? 'an hour on foot' : `${hours} hours on foot`;
    return `${arrows[w.dir] || '•'} ${w.to} — ${time} from ${here}`;
  }).join('\n');
}
