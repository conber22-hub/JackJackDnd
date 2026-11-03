/* THE COUNT'S COURT — a nemesis system. Strahd keeps a court of named servants (hunters, captains, warlords and his
   Chosen), each built on a real creature, with strengths, a weakness, a place they haunt, and a memory:
   whom they hate, what scarred them, how often Barovia has given them back.
   The court lives in the campaign (state.campaign.court). Between sessions it moves on its own (advanceCourt):
   they hunt the party, raid villages, rise in rank, fight each other for his favour, and the dead come back unless
   they were killed by what they fear. Fights feed it (recordFight). Journeys pick its ambushers (pickAmbushers).
   Pure: no DOM, no Three.js; all dice come from the rng passed in. */
import { RANKS, KINDS, NAMES, STRENGTHS, WEAKNESSES, TAUNTS } from '../data/court.js';

const pick = (a, rng) => a[Math.floor(rng() * a.length)];
const sample = (a, n, rng) => { const b = a.slice(), out = []; while (out.length < n && b.length) out.push(b.splice(Math.floor(rng() * b.length), 1)[0]); return out; };
export const title = m => `${m.name} ${m.epithet}`;
export const alive = c => c.members.filter(m => m.alive);
// How many of each rank the court keeps (it fills gaps between sessions): 1 warlord, 2 captains, 3 hunters.
const WANT = [[3, 1], [2, 2], [1, 3]];

export function newCourt(rng){
  const c = { members:[], news:[], nextId:1, turns:0 };
  fill(c, rng, null);
  return c;
}
// A new servant of the given rank (and kind, or any).
export function raise(c, rng, rank, kind = null){
  kind ||= pick(Object.keys(KINDS), rng);
  const K = KINDS[kind], used = new Set(c.members.map(m => m.name));
  const name = pick(NAMES.filter(n => !used.has(n)), rng) || pick(NAMES, rng), epithet = pick(K.epithets, rng);
  const m = { id:`n${c.nextId++}`, name, epithet, kind, rank, power:0, alive:true, returning:false, deaths:0, hunting:false, met:false,
    strengths:sample(Object.keys(STRENGTHS), rank >= 3 ? 2 : 1, rng), weaknesses:sample(Object.keys(WEAKNESSES), 1, rng),
    haunt:pick(K.haunts, rng), grudge:null, scars:[], history:[] };
  c.members.push(m);
  return m;
}
function fill(c, rng, news){
  for (const [rank, want] of WANT){
    while (alive(c).filter(m => m.rank === rank).length + c.members.filter(m => m.returning && m.rank === rank).length < want){
      const m = raise(c, rng, rank);
      news?.push({ who:m.id, text:`A new name is whispered in the taverns: ${title(m)}, a ${RANKS[rank].n.toLowerCase()} of his court.`, rumour:true });
    }
  }
}
const note = (m, text, day) => { m.history.push(day != null ? `Day ${day}: ${text}` : text); if (m.history.length > 12) m.history.shift(); };

/* What one says when the party meets them, from what they remember. */
export function tauntFor(m, rng = Math.random){
  const fill = s => s.replace('{hero}', m.grudge?.hero || 'you').replace('{place}', m.grudge?.place || 'the road').replace('{scar}', m.scars[m.scars.length - 1]?.text || 'scar');
  if (m.scars.length && m.grudge) return fill(pick(TAUNTS.scarred, rng));
  if (m.grudge?.won) return fill(pick(TAUNTS.won, rng));
  if (m.grudge) return fill(pick(TAUNTS.grudge, rng));
  return pick(TAUNTS.first, rng);
}

/* What it is at the table: the base creature's numbers, made tougher by its rank, its strengths and its scars.
   base: the bestiary entry. → { hp, ac, attacks, resist:[types], vuln:[types], regen, retinue } */
export function statsFor(m, base){
  const R = RANKS[m.rank], S = m.strengths.map(k => STRENGTHS[k]).filter(Boolean);
  const hp0 = typeof base.hp === 'number' ? base.hp : avg(base.hp);
  const dmg = R.dmg + S.reduce((a, s) => a + (s.dmg || 0), 0);
  return {
    hp:Math.round(hp0 * R.hp), ac:(base.ac || 12) + R.ac + S.reduce((a, s) => a + (s.ac || 0), 0),
    attacks:(base.attacks || []).map(a => ({ ...a, b:(a.b || 0) + R.hit, d:dmg ? addDamage(a.d, dmg) : a.d })),
    resist:m.scars.map(s => s.type).filter(Boolean),
    vuln:m.weaknesses.map(k => WEAKNESSES[k]?.vuln).filter(Boolean),
    regen:S.reduce((a, s) => a + (s.regen || 0), 0),
    retinue:R.retinue + S.reduce((a, s) => a + (s.retinue || 0), 0),
  };
}
function avg(expr){ let t = 0; for (const term of String(expr).replace(/\s+/g, '').match(/[+-]?[^+-]+/g) || []){ const s = term[0] === '-' ? -1 : 1, b = term.replace(/^[+-]/, ''), q = b.match(/^(\d*)d(\d+)$/i); t += s * (q ? +(q[1] || 1) * (+q[2] + 1) / 2 : +b || 0); } return Math.max(1, Math.round(t)); }
export function addDamage(d, n){
  const m = String(d || '').match(/^(.*?)([+-]\d+)?$/), base = m ? m[1] : String(d), bonus = (m?.[2] ? +m[2] : 0) + n;
  return bonus ? `${base}${bonus > 0 ? '+' : ''}${bonus}` : base;
}

/* A fight it was in. outcome: 'died' (it went down) · 'fled' (it got away) · 'won' (it beat them: a hero fell, or they ran).
   by: the hero who struck the last blow (or whom it hates most) · type: the damage that killed it · place · day.
   → { stays:bool (dead for good), text } */
export function recordFight(c, id, { outcome, by = null, type = '', place = '', day = null } = {}, rng = Math.random){
  const m = c.members.find(x => x.id === id); if (!m) return null;
  m.met = true;
  if (by) m.grudge = { hero:by, place:place || m.grudge?.place || 'the road', won:outcome === 'won' };
  if (outcome === 'died'){
    const weak = m.weaknesses.map(k => WEAKNESSES[k]?.vuln).filter(Boolean), killedRight = weak.some(w => String(type).includes(w));
    // the third death, or a death by what it fears, keeps it down; otherwise Barovia gives it back, scarred
    if (killedRight || m.deaths >= 2 || (m.rank === 1 && rng() < .35)){
      m.alive = false; m.returning = false;
      const text = `${title(m)} is destroyed${by ? ` by ${by}` : ''}${place ? ` at ${place}` : ''}${killedRight ? `: ${WEAKNESSES[m.weaknesses[0]].n.toLowerCase()} finished it` : ''}. Barovia will not give this one back.`;
      note(m, text, day); c.news.push({ who:m.id, text, rumour:true }); trim(c);
      return { stays:true, text };
    }
    m.alive = false; m.returning = true; m.deaths++;
    const scar = { type:String(type || '').split(/[ ,]/)[0] || '', text:SCARS[String(type).split(/[ ,]/)[0]] || 'a wound that never closed' };
    m.scars.push(scar);
    const text = `${title(m)} falls${by ? ` to ${by}` : ''}${place ? ` at ${place}` : ''}… and the mist takes the body before anyone can burn it.`;
    note(m, text, day);
    return { stays:false, text };
  }
  m.power += outcome === 'won' ? 2 : 1;
  const text = outcome === 'won' ? `${title(m)} beat the party${place ? ` at ${place}` : ''}${by ? `, and remembers ${by}` : ''}.` : `${title(m)} got away${place ? ` from ${place}` : ''}${by ? `, and will not forget ${by}` : ''}.`;
  note(m, text, day);
  promote(c, m, rng);
  return { stays:false, text };
}
// what a death leaves on one that comes back (by the damage that did it); it resists that damage from then on
const SCARS = { fire:'burned down one side, the skin like candle wax', radiant:'a face half bleached, as if by a hot sun', slashing:'a long seam across the throat',
  piercing:'a hole through the chest that does not bleed', bludgeoning:'a caved-in skull that has set wrong', cold:'frost that never melts in its beard',
  necrotic:'grey veins spreading from the heart', lightning:'branching burns like a tree under the skin', acid:'a face that drips', force:'a body that does not quite line up' };
function promote(c, m, rng){
  const need = 2 + m.rank * 2;
  if (m.rank < 3 && m.power >= need){ m.rank++; m.power = 0; m.strengths.push(...sample(Object.keys(STRENGTHS).filter(k => !m.strengths.includes(k)), 1, rng));
    const text = `${title(m)} rises to ${RANKS[m.rank].n.toLowerCase()}.`; note(m, text); c.news.push({ who:m.id, text, rumour:true }); trim(c); }
}
const trim = c => { if (c.news.length > 30) c.news.splice(0, c.news.length - 30); };

/* The court moves (a new day in the valley, or the DM says so). ctx: { gaze, day, at (the party's place) }.
   → the news, newest last: { who, text, rumour (the party could hear of it) } */
export function advanceCourt(c, { gaze = 1, day = null, at = null } = {}, rng = Math.random){
  const news = [];
  c.turns++;
  // the dead it gave back
  for (const m of c.members.filter(m => m.returning)){
    if (rng() < .6){ m.returning = false; m.alive = true; if (!m.strengths.includes('relentless')) m.strengths.push('relentless');
      const text = `${title(m)} has come back. ${m.scars.length ? `It wears ${m.scars[m.scars.length - 1].text}.` : ''} It is looking for ${m.grudge?.hero || 'whoever it was'}.`;
      note(m, text, day); news.push({ who:m.id, text, rumour:true }); m.hunting = !!m.grudge; }
  }
  for (const m of alive(c)){
    if (m.grudge || rng() < .12 + gaze * .03){ if (!m.hunting){ m.hunting = true; news.push({ who:m.id, text:`${title(m)} is hunting the party${m.grudge ? ` (it wants ${m.grudge.hero})` : ''}.`, rumour:false }); } }
    if (rng() < .22){ const place = m.haunt; news.push({ who:m.id, text:`${title(m)} came down on ${PLACE_NAMES[place] || place} in the night. ${pick(RAIDS, rng)}`, rumour:true, place }); m.power++; }
    else if (rng() < .3) m.power++;
    promote(c, m, rng);
  }
  // two of a rank fight for his favour: one wins, one is finished
  const ranks = [1, 2, 3].map(r => alive(c).filter(m => m.rank === r)).filter(a => a.length >= 2);
  if (ranks.length && rng() < .25){
    const [a, b] = sample(pick(ranks, rng), 2, rng), [w, l] = a.power + rng() * 3 >= b.power + rng() * 3 ? [a, b] : [b, a];
    l.alive = false; l.returning = false; w.power += 3; promote(c, w, rng);
    const text = `${title(w)} and ${title(l)} fought for his favour. ${w.name} won. Nobody has seen ${l.name} since.`;
    note(w, text, day); note(l, text, day); news.push({ who:w.id, text, rumour:true });
  }
  // when he is watching hardest, he chooses one
  if (gaze >= 7 && !alive(c).some(m => m.rank === 4)){
    const best = alive(c).filter(m => m.rank === 3).sort((a, b) => b.power - a.power)[0];
    if (best){ best.rank = 4; best.strengths.push('regal'); const text = `The Count has chosen ${title(best)}. It sits at his table now.`; note(best, text, day); news.push({ who:best.id, text, rumour:true }); }
  }
  fill(c, rng, news);
  c.news.push(...news); trim(c);
  void at;
  return news;
}
const RAIDS = ['A barn burned with the cattle still in it.', 'Two children are missing. The parents say they heard singing.', 'The well is fouled; nobody says with what.',
  'Doors were marked in chalk. Tonight, the marked houses will not open to anyone.', 'The graves are open, and they are empty.', 'A family was found sitting at their table, waiting.'];
export const PLACE_NAMES = { village:'the Village of Barovia', vallaki:'Vallaki', krezk:'Krezk', tser:'Tser Pool', berez:'Berez', bonegrinder:'Old Bonegrinder',
  yester:'Yester Hill', lake:'Lake Zarovich', argyn:'Argynvostholt', castle:'the castle road', crossroads:'the crossroads', winery:'the Wizard of Wines',
  tower:'the Lonely Tower', coffin:'the Iron Coffin', mists:'the edge of the Mists', gates:'the Gates of Barovia' };

/* Who waits on this journey: those hunting the party first, then a chance for anyone whose ground the road crosses.
   path: the place ids the road passes. → members (at most two; one more when he is watching hard). */
export function pickAmbushers(c, { gaze = 1, path = [] } = {}, rng = Math.random){
  const out = [], max = gaze >= 7 ? 3 : 2;
  // A witnessed location on this route gives a hunting member a 20-point ambush bonus.
  for (const m of alive(c)) if (out.length < max && m.hunting && rng() < Math.min(.95, .45 + gaze * .04 + (path.includes(m.knows?.party) ? .2 : 0))) out.push(m);
  for (const m of alive(c)) if (out.length < max && !out.includes(m) && path.includes(m.haunt) && rng() < .15 + gaze * .03) out.push(m);
  return out;
}
