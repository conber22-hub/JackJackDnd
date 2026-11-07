import { heroAttacks, heroSpells } from './hero.js';

const isId = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
const clone = value => structuredClone(value);

export function newVoiceWorkshop() {
  return { entries: [] };
}

/** Picker data comes from the owned sheet. The editor may also offer generic action triggers. */
export function heroVoiceChoices(sheet) {
  const spells = heroSpells(sheet);
  const spellNames = new Set(spells.map(spell => spell.n));
  const choices = new Map();
  for (const attack of heroAttacks(sheet)) {
    const name = attack.sn || attack.n.replace(/ \(×.*\)$/, '');
    if (!spellNames.has(name)) {
      choices.set('weapon:' + name, { name, kind: 'weapon', triggers: ['attack', 'hit', 'miss', 'critical'] });
    }
  }
  for (const spell of spells) choices.set('spell:' + spell.n,
    { name: spell.n, kind: 'spell', triggers: [spell.k === 'heal' ? 'heal' : 'spell'] });
  return [...choices.values()];
}

function ownedEntry(workshop, heroId, ownerRef) {
  return workshop.entries.find(entry => entry.heroId === heroId && entry.ownerRef === ownerRef);
}

function canAuthor(heroId, { ownerRef, ownedHeroIds } = {}) {
  return isId(heroId) && isId(ownerRef) && Array.isArray(ownedHeroIds) && ownedHeroIds.includes(heroId);
}

function replace(workshop, entry) {
  return { entries: [...workshop.entries.filter(item => item.heroId !== entry.heroId), entry] };
}

const fail = (workshop, reason) => ({ workshop, ok: false, reason });
const accept = workshop => ({ workshop, ok: true, reason: null });

/**
 * Host only. Access is derived from the current connection and owned sheets.
 * Use the action-voice engine's normalizeVoicePack for normalizePack.
 */
export function submitHeroVoicePack(workshop, { heroId, submissionId, expectedRevision, pack }, access, normalizePack) {
  if (!canAuthor(heroId, access)) return fail(workshop, 'not-your-hero');
  if (!isId(submissionId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
    !Array.isArray(pack?.lines) || pack.lines.length > 32 || typeof normalizePack !== 'function') {
    return fail(workshop, 'invalid-submission');
  }
  const previous = ownedEntry(workshop, heroId, access.ownerRef);
  if (previous?.pending?.id === submissionId || previous?.review?.id === submissionId) return accept(workshop);
  if ((previous?.revision ?? 0) !== expectedRevision) return fail(workshop, 'revision-changed');
  const normalized = normalizePack(pack);
  if (!Array.isArray(normalized?.lines) || normalized.lines.length !== pack.lines.length ||
    normalized.lines.some(line => line.trigger === 'reveal')) {
    return fail(workshop, 'invalid-line');
  }
  const lines = normalized.lines.map(({ trigger, action, text }) => ({ trigger, action, text }));
  const clean = { muted: normalized.muted === true, delivery: normalized.delivery ?? null, lines };
  const entry = { heroId, ownerRef: access.ownerRef, revision: expectedRevision + 1,
    published: previous?.published ?? null, pending: { id: submissionId, pack: clean }, review: null };
  return accept(replace(workshop, entry));
}

/** DM only. Resolve exactly the pending version you reviewed against the current owner. */
export function reviewHeroVoicePack(workshop, { heroId, ownerRef, submissionId, expectedRevision, decision }) {
  if (!isId(submissionId) || (decision !== 'approve' && decision !== 'return')) return fail(workshop, 'invalid-decision');
  const entry = ownedEntry(workshop, heroId, ownerRef);
  if (entry?.review?.id === submissionId) return accept(workshop);
  if (!entry?.pending || entry.pending.id !== submissionId || entry.revision !== expectedRevision) {
    return fail(workshop, 'revision-changed');
  }
  return accept(replace(workshop, { ...entry, revision: entry.revision + 1,
    published: decision === 'approve' ? entry.pending.pack : entry.published, pending: null,
    review: { id: submissionId, status: decision === 'approve' ? 'approved' : 'returned',
      ...(decision === 'return' ? { draft: entry.pending.pack } : {}) } }));
}

/** The owner can retract an edit awaiting review without touching the current lines. */
export function withdrawHeroVoicePack(workshop, { heroId, submissionId, expectedRevision }, access) {
  if (!canAuthor(heroId, access)) return fail(workshop, 'not-your-hero');
  const entry = ownedEntry(workshop, heroId, access.ownerRef);
  if (entry?.review?.id === submissionId && entry.review.status === 'withdrawn') return accept(workshop);
  if (!entry?.pending || entry.pending.id !== submissionId || entry.revision !== expectedRevision) {
    return fail(workshop, 'revision-changed');
  }
  return accept(replace(workshop, { ...entry, revision: entry.revision + 1, pending: null,
    review: { id: submissionId, status: 'withdrawn' } }));
}

/** Private, owner-only editor receipt. Player transport must target this connection. */
export function heroVoiceWorkshopView(workshop, heroId, access) {
  if (!canAuthor(heroId, access)) return null;
  const entry = ownedEntry(workshop, heroId, access.ownerRef);
  return entry ? {
    revision: entry.revision, published: clone(entry.published), pending: clone(entry.pending), review: clone(entry.review),
  } : { revision: 0, published: null, pending: null, review: null };
}

/** The host only feeds the playback planner approved lines for the current owner. */
export function approvedHeroVoicePack(workshop, heroId, currentOwnerRef) {
  return clone(ownedEntry(workshop, heroId, currentOwnerRef)?.published ?? null);
}

/** Local audition, using a fresh planner state and the same interpolation as playback. */
export function previewHeroVoiceLine({ heroId, heroName, line, delivery, targetName }, { normalizePack, planVoice }) {
  if (!isId(heroId)) return null;
  const pack = normalizePack({ delivery, lines: [line] });
  if (pack?.lines?.length !== 1 || pack.lines[0].trigger === 'reveal') return null;
  const { cue } = planVoice(undefined, {
    id: 'voice-preview', trigger: pack.lines[0].trigger, action: line.action,
    actor: { id: heroId, kind: 'pc', publicName: heroName }, targetPublicName: targetName, shareable: false,
  }, { now: 0, pack });
  return cue?.kind === 'speech' && cue.shareable === false ? cue : null;
}
