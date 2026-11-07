import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero } from '../src/engine/hero.js';
import {
  newVoiceWorkshop, heroVoiceChoices, submitHeroVoicePack, reviewHeroVoicePack,
  withdrawHeroVoicePack, heroVoiceWorkshopView, approvedHeroVoicePack, previewHeroVoiceLine,
} from '../src/engine/voice-workshop.js';

const owner = { ownerRef: 'owner-a', ownedHeroIds: ['hero-1'] };
const other = { ownerRef: 'owner-b', ownedHeroIds: [] };
const heroId = 'hero-1';
const pack = text => ({ delivery: 'low', lines: [{ trigger: 'spell', action: 'Fire Bolt', text }] });
// The host supplies the action-voice normaliser in production.
const normalize = input => ({
  delivery: input.delivery, muted: input.muted === true,
  lines: input.lines.filter(line => line?.trigger && line?.text?.trim()).map(line => ({
    trigger: line.trigger, action: line.action?.toLowerCase() || '', text: line.text.trim(),
  })),
});
const submit = (workshop, submissionId, expectedRevision, text, access = owner) =>
  submitHeroVoicePack(workshop, { heroId, submissionId, expectedRevision, pack: pack(text) }, access, normalize);
const review = (workshop, submissionId, expectedRevision, decision = 'approve', ownerRef = owner.ownerRef) =>
  reviewHeroVoicePack(workshop, { heroId, submissionId, expectedRevision, decision, ownerRef });
const view = (workshop, access = owner) => heroVoiceWorkshopView(workshop, heroId, access);
const published = (workshop, ownerRef = owner.ownerRef) => approvedHeroVoicePack(workshop, heroId, ownerRef);

test('editor choices come from a hero’s real spells and attacks, with separate healing triggers', () => {
  const hero = { ...newHero('Cleric'), weapons: ['Mace'], spells: ['Healing Word', 'Sacred Flame'] };
  const options = heroVoiceChoices(hero);
  assert.deepEqual(options.find(entry => entry.name === 'Mace')?.triggers, ['attack', 'hit', 'miss', 'critical']);
  assert.deepEqual(options.find(entry => entry.name === 'Healing Word'), { name: 'Healing Word', kind: 'spell', triggers: ['heal'] });
  assert.deepEqual(options.find(entry => entry.name === 'Sacred Flame')?.triggers, ['spell']);
  const warlock = { ...newHero('Warlock'), lvl: 5, spells: ['Eldritch Blast'] };
  assert.deepEqual(heroVoiceChoices(warlock).filter(entry => entry.name.includes('Eldritch Blast')),
    [{ name: 'Eldritch Blast', kind: 'spell', triggers: ['spell'] }]);
});

test('only an owner can submit, and the pending line stays private until an exact review', () => {
  const empty = Object.freeze({ entries: Object.freeze([]) });
  assert.deepEqual(empty, newVoiceWorkshop());
  assert.equal(submit(empty, 's-1', 0, 'forged', other).reason, 'not-your-hero');
  const waiting = submit(empty, 's-1', 0, ' Catch. ').workshop;
  assert.equal(published(waiting), null);
  assert.equal(view(waiting, other), null);
  assert.equal(view(waiting).pending.pack.lines[0].text, 'Catch.');
  assert.equal(review(waiting, 'wrong-id', 1).workshop, waiting);
  assert.equal(review(waiting, 's-1', 0).workshop, waiting);
  const approved = review(waiting, 's-1', 1).workshop;
  assert.equal(published(approved).lines[0].text, 'Catch.');
  assert.equal(view(approved).pending, null);
  assert.deepEqual(view(approved).review, { id: 's-1', status: 'approved' });
  assert.equal(review(approved, 's-1', 1).workshop, approved);
  assert.equal(submit(approved, 's-1', 0, 'duplicate').workshop, approved);
});

test('editing or returning a line leaves the previously approved pack live', () => {
  let book = submit(newVoiceWorkshop(), 'original', 0, 'Old line').workshop;
  book = review(book, 'original', 1).workshop;
  const firstEdit = submit(book, 'edit-1', 2, 'First draft').workshop;
  assert.equal(published(firstEdit).lines[0].text, 'Old line');
  assert.equal(submit(firstEdit, 'stale-tab', 2, 'Stale').reason, 'revision-changed');
  const secondEdit = submit(firstEdit, 'edit-2', 3, 'Second draft').workshop;
  assert.equal(review(secondEdit, 'edit-1', 3).reason, 'revision-changed');
  const returned = review(secondEdit, 'edit-2', 4, 'return').workshop;
  assert.equal(view(returned).review.draft.lines[0].text, 'Second draft');
  assert.equal(published(returned).lines[0].text, 'Old line');
  const receipt = view(returned);
  receipt.published.lines[0].text = 'tampered';
  assert.equal(published(returned).lines[0].text, 'Old line');
  assert.equal(view(JSON.parse(JSON.stringify(returned))).review.status, 'returned');
});

test('reassigned sheets do not inherit private drafts or approved lines from their old owner', () => {
  const nextOwner = { ...other, ownedHeroIds: [heroId] };
  const waiting = submit(newVoiceWorkshop(), 'before', 0, 'Private line').workshop;
  assert.equal(view(waiting, nextOwner).pending, null);
  assert.equal(review(waiting, 'before', 1, 'approve', nextOwner.ownerRef).workshop, waiting);
  const oldApproved = review(waiting, 'before', 1).workshop;
  assert.equal(published(oldApproved, nextOwner.ownerRef), null);
  const newPending = submit(oldApproved, 'after', 0, 'New hero voice', nextOwner).workshop;
  assert.equal(newPending.entries.length, 1);
  assert.equal(view(newPending, nextOwner).pending.id, 'after');
  assert.equal(published(newPending), null);
});

test('withdrawals and malformed submissions leave the existing pack unchanged', () => {
  const empty = newVoiceWorkshop();
  assert.equal(submit(empty, 'blank', 0, ' ').reason, 'invalid-line');
  assert.equal(submitHeroVoicePack(empty, {
    heroId, submissionId: 'reveal', expectedRevision: 0, pack: { lines: [{ trigger: 'reveal', text: 'A secret.' }] },
  }, owner, normalize).reason, 'invalid-line');
  const waiting = submit(empty, 'edit', 0, 'My line').workshop;
  const request = { heroId, submissionId: 'edit', expectedRevision: 1 };
  assert.equal(withdrawHeroVoicePack(waiting, request, other).workshop, waiting);
  const withdrawn = withdrawHeroVoicePack(waiting, request, owner).workshop;
  assert.equal(view(withdrawn).pending, null);
  assert.equal(view(withdrawn).review.status, 'withdrawn');
  assert.equal(published(withdrawn), null);
  assert.equal(withdrawHeroVoicePack(withdrawn, request, owner).workshop, withdrawn);
});

test('preview auditions a single line with fresh state and can never mark it shareable', () => {
  const input = { heroId, heroName: 'Ilse', line: pack('Try this, {target}.').lines[0], delivery: 'low', targetName: 'Aven' };
  const planVoice = (state, event, opts) => {
    assert.equal(state, undefined);
    assert.equal(event.shareable, false);
    assert.equal(event.actor.kind, 'pc');
    assert.equal(event.actor.publicName, 'Ilse');
    assert.equal(event.action, 'Fire Bolt');
    assert.equal(opts.pack.lines.length, 1);
    assert.equal(opts.now, 0);
    return { cue: { kind: 'speech', shareable: false, text: opts.pack.lines[0].text.replace('{target}', event.targetPublicName) } };
  };
  const cue = previewHeroVoiceLine(input, { normalizePack: normalize, planVoice });
  assert.equal(cue.text, 'Try this, Aven.');
  assert.equal(previewHeroVoiceLine({ ...input, line: { trigger: 'spell', text: '' } },
    { normalizePack: normalize, planVoice: () => assert.fail('invalid line previewed') }), null);
});
