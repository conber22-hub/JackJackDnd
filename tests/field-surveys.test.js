import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_SURVEYS } from '../src/data/field-surveys.js';
import { PLACES } from '../src/data/campaign.js';
import { newSurveyBook, recordObservation, surveyStatus, claimSurvey, surveysForPlayers } from '../src/engine/field-surveys.js';

const add = (book, placeId, observationId) => recordObservation(book, { placeId, observationId });
const reload = state => JSON.parse(JSON.stringify(state));

test('each survey uses an existing campaign place and three distinct kinds of clue', () => {
  assert.equal(Object.keys(FIELD_SURVEYS).length, 5);
  for (const [place, survey] of Object.entries(FIELD_SURVEYS)) {
    assert.ok(PLACES.some(p => p.id === place));
    assert.deepEqual(survey.observations.map(note => note.kind).sort(), ['lore', 'sign', 'terrain']);
    assert.equal(new Set(survey.observations.map(note => note.id)).size, 3);
  }
});

test('clues work in any order, repeat visits cannot advance the count, and progress survives reload', () => {
  for (const [placeId, survey] of Object.entries(FIELD_SURVEYS)) {
    let book = newSurveyBook();
    for (const note of [...survey.observations].reverse()) {
      assert.equal(claimSurvey(book, placeId).lead, null);
      book = add(book, placeId, note.id);
      assert.equal(add(book, placeId, note.id), book);
      book = reload(book);
    }
    assert.equal(surveyStatus(book, placeId).complete, true);
    const claim = claimSurvey(book, placeId);
    assert.deepEqual(claim.lead, survey.lead);
    assert.equal(surveyStatus(book, placeId).claimed, false);
    assert.equal(surveyStatus(claim.book, placeId).claimed, true);
    assert.deepEqual(claimSurvey(claim.book, placeId), { book: claim.book, lead: null });
  }
});

test('player book contains only discovered places and notes, even after a lead is claimed', () => {
  const { vallaki, berez } = FIELD_SURVEYS;
  let book = add(undefined, 'vallaki', vallaki.observations[1].id);
  assert.deepEqual(surveysForPlayers(book), [{
    id: 'vallaki', title: vallaki.title, complete: false, total: 3,
    observations: [{ kind: 'sign', title: vallaki.observations[1].title, text: vallaki.observations[1].text }],
  }]);
  const hidden = [berez.title, vallaki.lead.title, vallaki.observations[0].text, vallaki.observations[2].text];
  for (const text of hidden) assert.ok(!JSON.stringify(surveysForPlayers(book)).includes(text));
  for (const note of vallaki.observations) book = add(book, 'vallaki', note.id);
  book = claimSurvey(book, 'vallaki').book;
  const player = surveysForPlayers(book)[0];
  assert.equal(player.complete, true);
  assert.ok(!JSON.stringify(player).includes(vallaki.lead.title));
  player.observations[0].text = 'edited';
  assert.notEqual(surveysForPlayers(book)[0].observations[0].text, 'edited');
});

test('unknown places, cross-place IDs and duplicate records cannot alter prior progress', () => {
  const book = add(undefined, 'vallaki', 'runnel');
  Object.freeze(book.places[0].found);
  Object.freeze(book.places[0]);
  Object.freeze(book.places);
  Object.freeze(book);
  assert.equal(add(book, 'berez', 'runnel'), book);
  assert.equal(add(book, 'constructor', 'runnel'), book);
  assert.equal(add(book, 'vallaki', 'runnel'), book);
  assert.equal(surveyStatus(book, 'missing'), null);
  assert.deepEqual(claimSurvey(book, 'missing'), { book, lead: null });
  const two = add(book, 'berez', 'raised-stones');
  assert.equal(book.places.length, 1);
  assert.deepEqual(surveysForPlayers(two).map(place => place.id), ['vallaki', 'berez']);
});
