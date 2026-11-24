/* ☣ THE ROT, IN PLAY (Codex's engine/rot.js and data/rot.js, read from t.seepMarks, the marks a Seep-touched feature
   leaves: game/mechfx.js payPrice). Here:
     · rotWatch(t, was): after marks change, a card when the hero crosses into a new stage (its line and its rules), and
       at the last one the DM's choice of what becomes of them (taken is not dead)
     · chorusSpeaks(t, trigger): from the middle stages the Chorus whispers at a rest, a fall, a kill; sometimes it offers
       something for one more mark. The whisper is the hero's alone (at the table: their own phone); the offer is
       taken on the card (the Wanderer) or by the DM for them (the table): takeChorus(id)
     · ovenCure(list): a night at the Dutch Oven takes a mark from each, once a visit ("the Seep never got Dutcher")
     · rotLines(t, dm): the stage for a token card or the pocket sheet; the DM also sees what a priest and the Count
       would see */
import { state, ui, tokById, log } from '../engine/state.js';
import { esc } from '../util/core.js';
import { rotStage, rotSigns, chorusWhisper, cureRot, taken } from '../engine/rot.js';
import { showCard } from '../ui/hud.js';
import { sendToSeat } from '../net/table.js';
import { heal } from './combat.js';
import { rotHooks } from './mechfx.js';

const marksOf = t => Math.max(0, Math.floor(+t?.seepMarks || 0));
// (game/mechfx.js and game/resources.js call in through these: a mark taken, a rest)
rotHooks.watch = (t, was) => rotWatch(t, was);
rotHooks.speak = (t, trigger) => chorusSpeaks(t, trigger);

export function rotWatch(t, was){
  if (!t) return null;
  const a = rotStage(was || 0), b = rotStage(marksOf(t));
  if (b.stage <= a.stage) return null;
  showCard({ kind:'seep', title:`${t.name}: ${b.name}`, sub:`The rot · ${marksOf(t)} mark${marksOf(t) === 1 ? '' : 's'}`, flair:b.text,
    lines:b.mechanics.map(m => esc(m.text)), stay:true }, false);
  log(`☣ ${t.name}'s rot: ${b.name}.`);
  const tk = taken(t);
  if (tk && (ui.role === 'dm' || ui.wander))
    showCard({ kind:'seep', title:`${t.name} is taken`, flair:tk.text, lines:tk.outcomes.map(o => `<b>${esc(o.name)}</b> · ${esc(o.text)}`), stay:true }, false);
  return b;
}

// The Chorus at a moment ('rest', 'down', 'kill', 'alone'); rng for the tests
export function chorusSpeaks(t, trigger, rng = Math.random){
  if (!t || t.kind === 'monster' || !(marksOf(t) > 0)) return null;
  const w = chorusWhisper(marksOf(t), { trigger, gaze:+state?.dread || 1, rng }); if (!w) return null;
  if (w.offer) t.chorusOffer = { ...w.offer, trigger, at:Date.now() };
  const lines = w.offer ? [`<i>${esc(w.offer.text)}</i>`] : [];
  // the Wanderer: the hero is yours, the offer's button is on the card; the table: the DM holds the button for them
  const take = w.offer ? `<button class="btn small" data-act="chorusTake" data-id="${esc(t.id)}">Take it (one more mark)</button>` : '';
  if (ui.wander) showCard({ kind:'seep', title:'The Chorus', sub:`to ${t.name}`, flair:w.text, lines:take ? [...lines, take] : lines, stay:!!take }, false);
  else {
    sendToSeat(t.id, { t:'card', c:{ kind:'seep', title:'The Chorus', sub:'to you alone', flair:w.text, lines:w.offer ? [...lines, '<span class="muted">Tell the DM if you take it.</span>'] : [] } });
    if (ui.role === 'dm') showCard({ kind:'seep', title:`The Chorus, to ${t.name}`, sub:'their phone has it', flair:w.text, lines:take ? [...lines, take] : lines }, false);
  }
  log(`☣ The Chorus whispers to ${t.name}.`, true);
  return w;
}

// The offer taken: what it gives, and its mark
export function takeChorus(id){
  const t = tokById(id), o = t?.chorusOffer; if (!o) return false;
  delete t.chorusOffer;
  const was = marksOf(t); t.seepMarks = was + (o.cost?.n || 1);
  if (o.kind === 'heal') heal(t, o.amount || 1);
  else if (o.kind === 'reroll') t.chorusReroll = { on:o.on || 'd20', until:o.expires || 'next long rest' };
  const what = o.kind === 'heal' ? `+${o.amount} HP` : o.kind === 'reroll' ? 'a reroll of one d20 test, before the next long rest' : 'the name of what hunts them (the DM tells it)';
  showCard({ kind:'seep', title:`${t.name} takes what the Chorus gives`, lines:[esc(what), `<span class="fam-seep">The rot spreads (${marksOf(t)} marks).</span>`] }, false);
  log(`☣ ${t.name} takes the Chorus's offer: ${what}.`);
  rotWatch(t, was);
  return true;
}

// A night at the Dutch Oven: a mark off each of the rotted, once a visit (visit: the Wanderer's place and day)
export function ovenCure(list, visit){
  const out = [];
  for (const t of list || []){
    if (!(marksOf(t) > 0)) continue;
    const used = t.ovenVisit === visit, r = cureRot(marksOf(t), { kind:'dutchOven', used });
    if (r.marks < marksOf(t)){ t.seepMarks = r.marks; t.ovenVisit = visit; out.push([t, r.text]); }
  }
  if (out.length) showCard({ kind:'', title:'The Dutch Oven', flair:out[0][1], lines:out.map(([t]) => `${esc(t.name)}: ${marksOf(t)} mark${marksOf(t) === 1 ? '' : 's'} left`) }, false);
  return out.length;
}

// For a token card or the pocket sheet: { name, text, rules[], signs? } (signs: what the DM knows a priest and the Count see)
export function rotLines(t, dm = false){
  if (!(marksOf(t) > 0)) return null;
  const s = rotStage(marksOf(t));
  return { name:s.name, marks:marksOf(t), text:s.text, rules:s.mechanics.map(m => m.text),
    ...(dm ? { signs:{ villager:rotSigns(marksOf(t), { observer:'villager' }), priest:rotSigns(marksOf(t), { observer:'priest' }), count:rotSigns(marksOf(t), { observer:'count' }) } } : {}) };
}
