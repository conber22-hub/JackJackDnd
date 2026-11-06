/* THE FOLK AT THE TABLE — the valley's people (engine/folk.js, Codex's: who they are, where they go, what they see,
   what they say; render/folk.js draws them). The DM's browser runs them:
     · a Valley place's floor, a village-themed floor or a road gets its folk when the party is there (ensureFolk),
       again at dawn and dusk (refreshFolk: the ones still out keep where they are and what they've seen)
     · once a second outside a fight they take a step (a step a turn in one, fleeing home); players get the moves,
       only where they have been, as a small 'folk' message, not the whole state
     · what they witness (the party arriving, a fight, a spell, a kill) goes to the court through the Count's eyes
       (tellTheCourt): his servant learns where the party is and how it fights, hunts it, and ambushes more readily
       on the road (engine/nemesis.js pickAmbushers)
     · tapping one: what they say, and the rumour they pass on (to the players through the outbox, as any card);
       whether it's true, and who a spy reports to, on the DM's screen alone */
import { state, ui } from '../engine/state.js';
import { populate, stepFolk, witnesses, tellTheCourt, greet, rumourFor } from '../engine/folk.js';
import { TEMPLATES } from '../data/themes.js';
import { mulberry32, hashSeed } from '../util/core.js';
import { showCard } from '../ui/hud.js';
import { broadcast } from './session.js';
import { sendHost } from '../net/table.js';
import { court as getCourt } from './court.js';
import { SELLERS, openTroubleBy, freshTroubles, markAsking } from './trade.js';
import { PLACE_NAMES } from '../engine/nemesis.js';
import { attitudeOf, influence, recall } from '../engine/social.js';
import { esc } from '../util/core.js';
import { spendCoins } from '../engine/coins.js';
import { log } from '../engine/state.js';

const ROLE_NAMES = { villager:'a villager', farmer:'a farmer', smith:'the smith', child:'a child', lostChild:'a lost child', elder:'an elder', watch:'one of the watch',
  priest:'the priest', beggar:'a beggar', traveller:'a traveller', peddler:'a peddler', pilgrim:'a pilgrim', hermit:'a hermit', captive:'a captive', dog:'a dog' };
export const folkAt = (L, id) => state?.floors[L]?.folk?.find(p => p.id === id) || null;
export const roleName = p => ROLE_NAMES[p.role] || 'someone';
// (the court is made the first time it's asked for: game/court.js)
const court = () => getCourt() || { members:[], news:[] };
const night = () => { const h = state.campaign?.valley?.hour; return h != null && (h >= 20 || h < 6); };
const day = () => state.campaign?.valley?.day ?? null;
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|folk|${tick++}`));

/* What kind of place a floor is, for the folk: a Valley place (its kind), a village-themed floor, the open road.
   Dungeons, cellars and the castle stay empty. → { id, kind } or null. The id is what the court learns, and what
   journeys' paths are made of (so a report from here makes an ambush on the next road out likelier). */
export function folkPlace(L){
  const spec = TEMPLATES.find(t => t.id === state.meta.template)?.floors?.[L];
  const kind = spec?.place?.kind || (spec?.theme === 'village' ? 'village' : state.meta.journey && L === 0 ? 'road' : null);
  if (!kind) return null;
  return { id:state.meta.place || state.meta.journey?.to || state.meta.template, kind };
}
const partyOn = L => state.tokens.filter(t => t.floor === L && !t.dead && !t.flags?.gone && t.kind !== 'monster');

// The folk for a floor, the first time the party is on it (nobody standing where a hero is).
export function ensureFolk(L = ui.floor){
  const f = state?.floors[L]; if (!f || f.folk || ui.role !== 'dm') return false;
  const place = folkPlace(L); if (!place) return false;
  const taken = new Set(partyOn(L).map(t => `${t.x},${t.y}`));
  f.folk = populate(f, { place, seed:`${state.meta.seed}|${L}`, gaze:state.dread || 1, night:night(), court:court() }).filter(p => !taken.has(`${p.x},${p.y}`));
  freshTroubles(f, place);   // what they need help with (game/trade.js)
  const hero = partyOn(L)[0];
  if (hero) witnessed(L, { kind:'arrival', x:hero.x, y:hero.y });
  sendFolk(L);
  return true;
}
// Dawn and dusk: who is out now. Those still out keep their square and what they've seen; the rest have gone in.
export function refreshFolk(L = ui.floor){
  const f = state?.floors[L]; if (!f?.folk || ui.role !== 'dm') return;
  const place = folkPlace(L); if (!place) return;
  const old = new Map(f.folk.map(p => [p.id, p]));
  f.folk = populate(f, { place, seed:`${state.meta.seed}|${L}`, gaze:state.dread || 1, night:night(), court:court() })
    .map(p => old.has(p.id) ? { ...p, x:old.get(p.id).x, y:old.get(p.id).y, seen:old.get(p.id).seen || [], mood:old.get(p.id).mood } : p);
  freshTroubles(f, place);
  sendFolk(L);
}

/* One step for everyone on the floor in view. Outside a fight the DM's browser calls this once a second; in one,
   once a turn (combat.js), with fight:true so they run home. */
export function stepFolkNow(L = ui.floor, { fight = !!state?.combat?.active } = {}){
  const f = state?.floors[L]; if (!f?.folk?.length || ui.role !== 'dm') return;
  const moves = stepFolk(f.folk, f, { party:partyOn(L), fight, night:night(), rng:rng() });
  if (!moves.length) return;
  const by = new Map(f.folk.map(p => [p.id, p]));
  for (const m of moves){ const p = by.get(m.id); if (p){ p.x = m.x; p.y = m.y; } }
  sendFolk(L);
}
// The players' copy: the folk standing where the party has been, without who spies or what they saw (as engine/redact.js).
function sendFolk(L){
  const f = state.floors[L], ex = state.explored?.[L];
  if (!f?.folk || !ex) return;
  broadcast({ t:'folk', L, folk:f.folk.filter(p => ex.has(p.y * f.W + p.x)).map(p => ({ id:p.id, role:p.role, name:p.name, x:p.x, y:p.y, mood:p.mood, ...(p.ask ? { ask:true } : {}) })) });
}
// A player's screen: the folk the DM sent.
export function receiveFolk(m){
  const f = state?.floors[m.L]; if (!f || !Array.isArray(m.folk)) return;
  f.folk = m.folk;
}

/* Something the folk might see: { kind:'arrival'|'fight'|'spell'|'kill'|'theft', x, y, by?, type? }.
   The Count's eyes among those who saw it tell their master (DM's eyes only); a kill seen by ordinary folk
   becomes a rumour in the valley. */
export function witnessed(L, event){
  const f = state?.floors[L]; if (!f?.folk?.length || ui.role !== 'dm' || !getCourt()) return [];
  const place = folkPlace(L), ids = witnesses(f.folk, f, { ...event, day:day() });
  if (!ids.length) return [];
  const news = tellTheCourt(court(), f.folk, ids, { ...event, day:day() }, { place:place?.id, day:day() }, rng());
  const told = news.filter(n => n.who);
  if (told.length){
    const names = told.map(n => court().members.find(m => m.id === n.who)).filter(Boolean).map(m => `${m.name} ${m.epithet}`);
    showCard({ kind:'seep', title:'👁 The Count\'s eyes saw that', sub:`Word goes to ${names.join(' and ')}`, lines:told.map(n => n.text) }, false);
  }
  return news;
}

/* Tapping one of the folk. The DM hears what they say (and a rumour, if they have one), to send on; the DM alone
   sees whether the rumour is true and whom a spy serves. A player who taps one asks the DM, like any action. */
export function talkTo(p, { by = null } = {}){
  if (!p) return;
  if (ui.role !== 'dm'){ sendHost({ t:'talk', L:ui.floor, id:p.id }); showCard({ kind:'', title:p.name || roleName(p), sub:p.name ? roleName(p) : '', flair:'You go over to them. (The DM tells you what they say.)' }, false); return; }
  const r = rng(), said = greet(p, { gaze:state.dread || 1, night:night() }, r), heard = p.role === 'dog' ? null : rumourFor(p, court(), { gaze:state.dread || 1 }, r);
  const rumour = heard && heard.text !== said ? heard : null;
  const trouble = openTroubleBy(p.id);
  showCard({ kind:'', title:p.name || roleName(p), sub:`${p.name ? roleName(p) : ''}${by ? `${p.name ? ' · ' : ''}${by} talks to them` : ''}`, flair:trouble ? trouble.text : said, lines:rumour && !trouble ? [`“${rumour.text}”`] : [], cat:'world' });
  const m = p.spy && court().members.find(x => x.id === p.spy.for), about = rumour?.about && court().members.find(x => x.id === rumour.about);
  const notes = [
    ...(m ? [`👁 One of the Count's eyes: reports to ${m.name} ${m.epithet}${p.seen?.length ? ` (has seen: ${p.seen.map(s => s.kind).join(', ')})` : ''}`] : []),
    ...(rumour && !rumour.true ? [`✗ That rumour is false${m ? ': a lure towards its master\'s haunt' : ''}`] : []),
    ...(rumour?.true && about && !trouble ? [`✓ True, about ${about.name} ${about.epithet}`] : []),
    // a trouble: what it leads to, and the DM's say on how it went
    ...(trouble ? [troubleNote(trouble), `<span class="row"><button class="btn small primary" data-act="trouble" data-k="done" data-id="${trouble.id}">✓ Put right</button><button class="btn small" data-act="trouble" data-k="failed" data-id="${trouble.id}">✗ Failed</button><button class="btn small" data-act="trouble" data-k="ignored" data-id="${trouble.id}">Left alone</button></span>`] : []),
    // a seller: the trade window (ui/trade.js)
    ...(SELLERS.includes(p.role) ? [`<button class="btn small primary" data-act="tradeOpen" data-id="${p.id}" data-k="${ui.floor}">🛒 Trade with ${p.name || roleName(p)}</button>`] : []),
    ...(p.role === 'smith' ? [`<button class="btn small" data-act="workshop" data-id="folk:${ui.floor}:${p.id}">🔨 Commission ${p.name || 'the smith'}</button>`] : []),
    ...(p.role === 'dog' ? [] : [talkRow(p)]),
  ];
  if (notes.length) showCard({ kind:m ? 'seep' : '', title:'For your eyes', lines:notes }, false);
}

// What a trouble leads to, for the DM: the goal, the court member behind a raid, the reward.
function troubleNote(t){
  const m = t.links?.member && court().members.find(x => x.id === t.links.member);
  const goal = t.goal?.action === 'stopRaid' ? `Stop the raids: ${m ? `${m.name} ${m.epithet}` : 'one of his court'}${t.goal.place ? `, who haunts ${PLACE_NAMES[t.goal.place] || t.goal.place}` : ''}`
    : t.goal?.action === 'bringHome' ? 'Bring the lost child home (they are out on a road)' : t.goal?.action === 'free' ? 'Free the captive (somewhere below ground)' : t.goal?.action === 'return' ? 'Find them (they will come back on their own, with questions: one of his eyes)' : '';
  const r = t.reward, reward = !r ? '' : r.kind === 'coins' ? `${r.gp} gp` : r.kind === 'favour' ? 'a favour' : 'a true word about the court';
  return `❗ ${goal}${reward ? ` · reward: ${reward}` : ''}`;
}

/* The DM's browser keeps them going: a step a second when nobody's fighting, and folk for a floor the party has
   just come to. */
let wasNight = null;
setInterval(() => {
  if (!state || ui.role !== 'dm' || document.hidden) return;
  ensureFolk(ui.floor);
  // dusk or dawn came (the DM set the hour, or the party travelled): who's out in the street now
  const n = night(); if (wasNight !== null && n !== wasNight) refreshFolk(ui.floor); wasNight = n;
  if (!state.combat?.active) stepFolkNow(ui.floor, { fight:false });
}, 1000);

/* ---------- talking (Codex's engine/social.js) ----------
   The DM's card for one of the folk shows how they feel about the party and offers the ways to work on them; the
   hero doing the talking is the selected hero, else the first on the floor. What they remember stays with them. */
const today = () => state.campaign?.valley?.day ?? 1;
const speaker = () => { const sel = ui.selected && state.tokens.find(t => t.id === ui.selected && t.kind === 'pc'); return sel || state.tokens.find(t => t.kind === 'pc' && t.floor === ui.floor && !t.dead); };
const APPROACH = { persuade:'🗣 Persuade', deceive:'🎭 Deceive', intimidate:'😠 Intimidate', bribe:'🪙 Bribe (5 gp)', perform:'🎻 Perform', insight:'🔍 Read them' };
const FEEL = { friendly:'friendly 🙂', indifferent:'indifferent 😐', hostile:'hostile 😠', terrified:'terrified 😨' };
function talkRow(p){
  p.day = today(); const feel = attitudeOf(p, { gaze:state.dread || 1 }), mem = recall(p).slice(-2);
  return `🗣 <b>${FEEL[feel] || feel}</b>${mem.length ? ` <span class="muted">· remembers: ${mem.map(m => esc(m.text)).join('; ')}</span>` : ''}<br>
    <span class="row">${Object.entries(APPROACH).map(([k, l]) => `<button class="btn small" data-act="influence" data-k="${k}" data-id="${ui.floor}:${esc(p.id)}">${l}</button>`).join('')}</span>`;
}
export function influenceFolk(L, id, approach){
  const p = (state.floors[L]?.folk || []).find(x => String(x.id) === String(id)), who = speaker(); if (!p || !who) return;
  const hero = who.charId ? state.characters?.[who.charId] : null;
  p.day = today();
  const offer = approach === 'bribe' ? 5 : 0;
  if (offer && hero){ const paid = spendCoins(hero.coins || {}, offer); if (!paid){ showCard({ kind:'miss', title:`${who.name} can't pay`, sub:'5 gp' }, false); return; } hero.coins = paid; }
  const out = influence(p, { approach, hero:hero || { mods:{ cha:2, wis:1 } }, offer, rng:Math.random, gaze:state.dread || 1 });
  Object.assign(p, { memories:out.person.memories });
  if (out.cost?.witness) witnessed(L, { kind:'intimidation', x:p.x, y:p.y });
  const feel = attitudeOf(p, { gaze:state.dread || 1 });
  const lines = [out.roll ? `${who.name}: ${out.roll.raw} + ${out.roll.bonus} = <b>${out.roll.total}</b> against DC ${out.dc}` : '', esc(out.text), `Now: ${FEEL[feel] || feel}`].filter(Boolean);
  showCard({ kind:out.ok ? 'good' : 'miss', title:`${APPROACH[approach]} · ${p.name || p.role}`, sub:who.name, lines, cat:'rolls' });
  log(`🗣 ${who.name} tries to ${approach} ${p.name || p.role}: ${out.ok ? 'it works' : 'no good'} (now ${feel}).`);
}
