/* 🌙 DAYS OFF AT THE TABLE — what a hero does between adventures (engine/downtime.js, ChatGPT's): recuperate, work,
   train, research, carouse, keep watch at the holding, or give the days to a job in the workshop. The DM picks the
   activity and the days; the app builds the engine's inputs from the hero's sheet, where they are and the party's
   holding, rolls (or takes a real die), and applies what comes of it: coins, a level of exhaustion gone, a tool or
   language learned, a villager who's a friend now, a watch kept, hours at the bench. The days can pass for everyone
   (the court moves, the smiths work, the holding builds). */
import { state, ui, log } from '../engine/state.js';
import { plan, resolve, describe } from '../engine/downtime.js';
import { ACTIVITIES } from '../data/downtime.js';
import { migrateSheet } from '../engine/inventory.js';
import { heroStats } from '../engine/hero.js';
import { mulberry32, hashSeed } from '../util/core.js';
import { toast, showCard } from '../ui/hud.js';
import { changed } from './session.js';
import { applyCharacter } from './heroes.js';
import { sendSheetToOwner } from '../net/table.js';
import { folkPlace } from './folk.js';
import { holdingHere, stats } from './holdings.js';
import { workshopsHere, jobs, workJob } from './workshop.js';
import { passTime } from './overworld.js';

export { ACTIVITIES, describe };
export const PLACE_KINDS = { village:'a village', town:'a town', holding:'the party\'s holding', road:'the road or the wild' };
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|downtime|${Date.now()}|${tick++}`));

// Where a hero is, as the engine sees it: their holding, a village or town (the map's place), or the road.
export function placeKindAt(L){
  if (holdingHere(L)) return 'holding';
  const k = folkPlace(L)?.kind;
  return k === 'town' ? 'town' : ['village', 'camp'].includes(k) ? 'village' : 'road';
}
function heroInput(tok){
  const sheet = migrateSheet(state.characters[tok.charId]), st = heroStats(sheet);
  return { id:tok.id, name:tok.name, sc:st.sc, skills:st.skills || {}, pb:st.pb, tools:sheet.tools || [], languages:sheet.languages || [], exhaustion:tok.exhaustion || 0, coins:sheet.coins || {} };
}
function inputs(tok, kind){
  const L = tok.floor, h = kind === 'holding' ? holdingHere(L) : null;
  return {
    hero:heroInput(tok),
    place:{ kind, workshops:workshopsHere(L), folk:(state.floors[L]?.folk || []).map(p => ({ id:p.id, role:p.role, name:p.name, mood:p.mood })) },
    holding:h ? stats(h) : undefined,
    gaze:state.dread || 1,
  };
}
// The plan for a hero: ok with its cost and check, or a plain reason why not. opts: { kind, days, learn, skill, tool }
export function planFor(tok, activityId, opts = {}){
  if (!tok?.charId || !state.characters[tok.charId]) return { ok:false, why:'Only a hero with a character sheet can take days off.' };
  const kind = opts.kind || placeKindAt(tok.floor);
  return plan(activityId, { ...inputs(tok, kind), days:+opts.days || 1, learn:opts.learn || undefined, skill:opts.skill || undefined, tool:opts.tool || undefined });
}

/* Spend the days. roll: { raw, total } from a real die, or none. passDays: the days pass for everyone. */
export function takeDaysOff(tok, activityId, opts = {}){
  const p = planFor(tok, activityId, opts);
  if (!p.ok){ toast(p.why); return null; }
  let out;
  try { out = resolve(p, { roll:opts.roll }, rng()); } catch (e){ toast(e.message); return null; }
  const { effects:fx, lines } = out;
  // the sheet: coins, a tool or a language learned
  const sheet = migrateSheet(state.characters[tok.charId]);
  if (fx.coins) sheet.coins = fx.coins;
  if (fx.addTool) sheet.tools = [...new Set([...(sheet.tools || []), fx.addTool])];
  if (fx.addLanguage) sheet.languages = [...new Set([...(sheet.languages || []), fx.addLanguage])];
  applyCharacter(sheet, { place:false }); sendSheetToOwner(sheet.id);
  const t = state.tokens.find(x => x.id === tok.id) || tok;   // (applyCharacter may have refreshed the token)
  if (fx.exhaustion) t.exhaustion = Math.max(0, (t.exhaustion || 0) + fx.exhaustion);
  if (fx.saveAdvantage) (t.notes ||= []).push(`Advantage on the next save against a lingering ${fx.saveAdvantage}.`);
  // a villager who's a friend now
  if (fx.mood) for (const f of state.floors){ const pp = f.folk?.find(x => x.id === fx.mood.id); if (pp){ pp.mood = fx.mood.to; lines.push(`${pp.name} is a friend now.`); } }
  // a watch kept at the holding: defence while they're there, and an eye on the hired hands
  if (fx.watchBonus){ const h = holdingHere(tok.floor); if (h){ h.watch = { by:tok.id, bonus:fx.watchBonus, defence:fx.defence || 0, until:(state.campaign.valley?.day ?? 0) + (+opts.days || 1) }; } }
  // hours at the bench: to this hero's own work in the workshop, if any
  if (fx.hours){
    const job = jobs().find(j => j.crafter.ref === `hero:${tok.id}`);
    if (job){ let left = fx.hours; while (left > 0 && jobs().includes(job)){ const step = Math.min(8, left); workJob(job.id, step); left -= step; } lines.push(`The hours went into ${job.n}.`); }
    else lines.push('No work is waiting on their bench (🔨 Workshop to start some).');
  }
  if (fx.research) lines.push('(The DM says what they found.)');
  if (fx.mess === 'a fight') lines.push('(The DM runs the fight, or says how it ends.)');
  log(`🌙 ${lines[0]}`, true);
  showCard({ kind:'', cat:'world', title:`🌙 ${tok.name}: ${describe(activityId)?.n || activityId}`, lines });
  if (opts.passDays && state.campaign.valley) for (let i = 0; i < (+opts.days || 1); i++) passTime(24);   // each day comes round: the court, the smiths, the holding
  changed();
  return out;
}
