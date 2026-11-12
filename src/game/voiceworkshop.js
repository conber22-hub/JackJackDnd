/* 🗣 THE VOICE WORKSHOP, DM SIDE — ChatGPT's engine/voice-workshop.js at the table. A player writes their own hero's
   lines on their phone (ui/voiceworkshop.js): what they say when they hit, miss, land a critical, cast, heal, are hurt
   or go down, with or without a named weapon or spell, and how they sound (steady, quick, low, hushed). The lines go
   to the DM, who approves them or sends them back; only approved lines are ever spoken (ui/voices.js). The workshop
   lives in the campaign (state.campaign.voiceWorkshop), which never goes to the players. The owner of a hero is its
   sheet's owner (game/heroes.js), so a hero handed to another player starts without the old lines. */
import { state } from '../engine/state.js';
import { newVoiceWorkshop, submitHeroVoicePack, reviewHeroVoicePack, withdrawHeroVoicePack, heroVoiceWorkshopView, approvedHeroVoicePack } from '../engine/voice-workshop.js';
import { normalizeVoicePack } from '../engine/action-voices.js';
import { ownsCharacter } from './heroes.js';
import { changed } from './session.js';

// The triggers a hero can have lines for (the ones the table fires: game/combat.js), in the order the editor lists them.
export const HERO_TRIGGERS = [
  ['hit', 'Hits'], ['miss', 'Misses'], ['critical', 'Lands a critical'], ['spell', 'Casts a spell'], ['heal', 'Heals someone'],
  ['hurt', 'Is hurt'], ['down', 'Goes down'],
];
export const TRIGGER_NAME = Object.fromEntries(HERO_TRIGGERS);

export const workshop = () => (state.campaign.voiceWorkshop ||= newVoiceWorkshop());
// Who owns a hero now: its sheet's owner, by name (whether the player may write for it is checked against their name
// and secret word as they send: game/heroes.js; a sheet claimed with a word later keeps its lines).
export const ownerRefOf = sheet => sheet ? `owner:${String(sheet.owner || '').trim().toLowerCase()}` : null;
// What a seated player may do: write for this hero if its sheet is theirs.
function accessFor(seat, heroId){
  const sheet = state.characters?.[heroId];
  return ownsCharacter(sheet, seat.name, seat.key) ? { ownerRef:ownerRefOf(sheet), ownedHeroIds:[heroId] } : { ownerRef:'-', ownedHeroIds:[] };
}

/* A player's message about their hero's lines → { view, ok, reason, sent } for the reply (and sent: a new submission
   the DM should hear about). m: { t:'voiceWant'|'voiceSubmit'|'voiceWithdraw', heroId, submissionId, expectedRevision, pack } */
export function voiceFromPlayer(seat, m){
  const heroId = String(m?.heroId || ''), access = accessFor(seat, heroId);
  let r = { ok:true, reason:null }, sent = false;
  if (m.t === 'voiceSubmit'){
    const before = workshop();
    r = submitHeroVoicePack(before, { heroId, submissionId:m.submissionId, expectedRevision:m.expectedRevision, pack:m.pack }, access, normalizeVoicePack);
    sent = r.ok && r.workshop !== before;
  } else if (m.t === 'voiceWithdraw')
    r = withdrawHeroVoicePack(workshop(), { heroId, submissionId:m.submissionId, expectedRevision:m.expectedRevision }, access);
  if (r.workshop && r.workshop !== workshop()){ state.campaign.voiceWorkshop = r.workshop; changed(); }
  const view = heroVoiceWorkshopView(workshop(), heroId, access);
  return { heroId, view, ok:r.ok && !!view, reason:view ? r.reason : 'not-your-hero', sent };
}

// Lines waiting for the DM: [{ heroId, name, owner, revision, pending:{ id, pack } }]
export function pendingVoices(){
  return workshop().entries.filter(e => e.pending && state.characters?.[e.heroId] && ownerRefOf(state.characters[e.heroId]) === e.ownerRef)
    .map(e => ({ heroId:e.heroId, name:state.characters[e.heroId].name, owner:state.characters[e.heroId].owner || '', revision:e.revision, pending:e.pending }));
}
// Heroes whose lines are approved (for the Table tab's count).
export const approvedVoices = () => workshop().entries.filter(e => e.published?.lines?.length && state.characters?.[e.heroId] && ownerRefOf(state.characters[e.heroId]) === e.ownerRef);

// The DM approves ('approve') or sends back ('return') the lines they read. → the hero's id, for telling its owner.
export function reviewVoice(heroId, submissionId, decision){
  const e = workshop().entries.find(x => x.heroId === heroId && x.pending?.id === submissionId); if (!e) return false;
  const r = reviewHeroVoicePack(workshop(), { heroId, ownerRef:e.ownerRef, submissionId, expectedRevision:e.revision, decision });
  if (!r.ok) return false;
  state.campaign.voiceWorkshop = r.workshop; changed(); return true;
}
// The owner's view of a hero's lines, for a seat (sent after the DM decides).
export const voiceViewFor = (seat, heroId) => heroVoiceWorkshopView(workshop(), heroId, accessFor(seat, heroId));

// The lines a token speaks: its owner's approved lines, else any the DM set (state.campaign.voicePacks), else none.
export function voicePackFor(tok){
  const id = tok?.charId || tok?.id, sheet = tok?.charId && state.characters?.[tok.charId];
  return (sheet && state.campaign?.voiceWorkshop && approvedHeroVoicePack(state.campaign.voiceWorkshop, tok.charId, ownerRefOf(sheet)))
    || state.campaign?.voicePacks?.[id] || null;
}
