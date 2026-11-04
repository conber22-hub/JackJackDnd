/* 🌙 A NIGHT'S REST — where the party sleeps decides how the night goes (engine/rest.js, ChatGPT's). Their holding
   (its walls, a shrine's ward, a salt line, beds), an inn, a village, a camp, the road (a wagon's bunks) or a
   dungeon; who keeps watch; his Gaze and the weather. The night may pass quietly, or a noise, a scare or a fight may
   come (a fight breaks the rest: nobody recovers). Poor shelter gives back only half the Hit Dice and no exhaustion;
   a fine room gives one hero Heroic Inspiration. Then eight hours pass on the valley's clock. */
import { state, ui, log } from '../engine/state.js';
import { restQuality, rollNight, restOutcome } from '../engine/rest.js';
import { mulberry32, hashSeed } from '../util/core.js';
import { showCard } from '../ui/hud.js';
import { changed } from './session.js';
import { holdingHere, stats } from './holdings.js';
import { MODULE_BY_ID } from '../data/holdings.js';
import { wagonOut, weatherKind } from './wagons.js';
import { passTime } from './overworld.js';

export const REST_PLACES = { holding:'🏰 Their holding', inn:'🍺 An inn', village:'🏘 A village (a barn, a loft)', camp:'⛺ A camp', road:'🛞 The road (in the wagon)', dungeon:'🕯 A dungeon' };
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|rest|${Date.now()}|${tick++}`));
export const sleepers = () => state.tokens.filter(t => t.kind === 'pc' && !t.dead && !t.flags?.gone);

// The place the party is most likely sleeping: their holding, the road, or a dungeon.
export function guessPlace(){
  if (holdingHere(ui.floor)) return 'holding';
  if (state.campaign?.valley?.journey && state.meta.template === 'journey') return 'camp';
  return state.meta.kind === 'place' ? 'inn' : 'dungeon';
}
function holdingInput(){
  const h = holdingHere(ui.floor); if (!h) return null;
  const s = stats(h), salt = (h.modules || []).some(m => m.built && m.hp > 0 && MODULE_BY_ID[m.module]?.gives?.salt);
  return { ...s, salt };
}
// What the night will be like, before anyone sleeps: { chance, comfort, notes }
export function preview(kind, watchIds){
  return restQuality(inputs(kind, watchIds));
}
function inputs(kind, watchIds){
  const watch = new Set(watchIds || []);
  return {
    place:{ kind, name:REST_PLACES[kind] }, holding:kind === 'holding' ? holdingInput() || undefined : undefined,
    wagon:kind === 'road' ? wagonOut() || undefined : undefined,
    party:sleepers().map(t => ({ id:t.id, name:t.name, exhaustion:t.exhaustion || 0, watch:watch.has(t.id) })),
    gaze:state.dread || 1, weather:weatherKind(state.campaign?.valley?.weather || state.campaign?.weather || ''),
  };
}

/* Sleep: roll the night, apply what comes of it to every hero, and move the clock on. → { quality, night, outcome } */
export function sleep(kind, watchIds, { passHours = true, quiet = false } = {}){
  const inp = inputs(kind, watchIds), quality = restQuality(inp), r = rng();
  const night = rollNight(quality, { party:inp.party, gaze:inp.gaze }, r);
  const outcome = restOutcome(quality, night, { party:inp.party });
  const lines = [];
  for (const o of outcome.heroes){
    const t = state.tokens.find(x => x.id === o.id); if (!t) continue;
    if (o.hpFull){
      t.hp = t.maxHp; t.flags.bloodied = false; delete t.sustain;
      t.conds = (t.conds || []).filter(c => c.n === 'seeded');
      for (const res of t.resources || []){
        if (res.id === 'hd') t.res[res.id] = o.hitDice === 'all' ? res.max : o.hitDice === 'half' ? Math.min(res.max, (t.res[res.id] || 0) + Math.max(1, Math.floor(res.max / 2))) : t.res[res.id];
        else t.res[res.id] = res.max;
      }
    }
    if (o.exhaustion && t.exhaustion) t.exhaustion > 1 ? t.exhaustion-- : delete t.exhaustion;
    if (o.inspiration){ const heroic = (t.resources || []).find(x => x.id === 'heroic'); if (heroic) t.res.heroic = heroic.max; else t.inspired = true; lines.push(`${t.name} wakes with Heroic Inspiration.`); }
  }
  if (outcome.heroes.some(o => o.hpFull)) for (const t of state.tokens) delete t.lres;   // a new day: Legendary Resistance too
  // what the DM tells the table
  const ev = night.event;
  const head = ev ? `${ev.severity === 'fight' ? '⚔' : ev.severity === 'scare' ? '😨' : '🔉'} ${ev.n}${night.surprise ? ' (nobody was on watch: it catches them unawares)' : ''}` : 'The night passes.';
  const card = [head, ...(ev?.text ? [ev.text] : []), ...outcome.lines, ...lines];
  if (ev?.severity === 'fight') card.push('(DM: run the fight. The rest is broken; a short rest after, or another try.)');
  if (night.dream){ const who = state.tokens.find(t => t.id === night.dream.id); card.push(`${who?.name || 'One of them'} dreams: ${night.dream.text}`); }
  if (!quiet) showCard({ kind:'', title:`🌙 The night: ${REST_PLACES[kind].replace(/^\S+ /, '')}`, sub:`${Math.round(quality.chance * 100)}% a disturbance · ${quality.comfort} comfort`, lines:card }, false);
  log(`🌙 A night's rest (${kind}): ${head.replace(/^\S+ /, '')}`, true);
  state.campaign.lastRest = { kind, severity:ev?.severity || null, broken:ev?.severity === 'fight', comfort:quality.comfort };   // (what the last night brought: the Valley tab, a test)
  if (passHours && state.campaign?.valley) passTime(8);
  changed();
  return { quality, night, outcome, card };
}
