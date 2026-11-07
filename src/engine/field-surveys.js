import { FIELD_SURVEYS } from '../data/field-surveys.js';

export function newSurveyBook() {
  return { places: [] };
}

function surveyOf(placeId) {
  return Object.hasOwn(FIELD_SURVEYS, placeId) ? FIELD_SURVEYS[placeId] : null;
}

function replaceEntry(book, entry) {
  if (book.places.some(place => place.id === entry.id)) {
    return { places: book.places.map(place => place.id === entry.id ? entry : place) };
  }
  return { places: [...book.places, entry] };
}

/** Call only after the DM confirms the party found this detail in play. */
export function recordObservation(book = newSurveyBook(), { placeId, observationId }) {
  const survey = surveyOf(placeId);
  const observation = survey?.observations.find(note => note.id === observationId);
  const current = book.places.find(place => place.id === placeId);
  if (!observation || current?.found.includes(observationId)) return book;
  const entry = current ?? { id: placeId, found: [], claimed: false };
  return replaceEntry(book, { ...entry, found: [...entry.found, observationId] });
}

function complete(survey, entry) {
  return entry != null && survey.observations.every(note => entry.found.includes(note.id));
}

/** DM-only panel data. An unreleased lead stays out of this view until the survey is complete. */
export function surveyStatus(book = newSurveyBook(), placeId) {
  const survey = surveyOf(placeId);
  if (!survey) return null;
  const entry = book.places.find(place => place.id === placeId);
  const done = complete(survey, entry);
  return {
    title: survey.title,
    observations: survey.observations.map(note => ({ ...note, found: entry?.found.includes(note.id) ?? false })),
    complete: done,
    claimed: entry?.claimed ?? false,
    lead: done ? { ...survey.lead } : null,
  };
}

/** Unlock a DM lead once. Applying any map or story consequences belongs to the DM. */
export function claimSurvey(book = newSurveyBook(), placeId) {
  const survey = surveyOf(placeId);
  const entry = book.places.find(place => place.id === placeId);
  if (!survey || !complete(survey, entry) || entry.claimed) return { book, lead: null };
  return { book: replaceEntry(book, { ...entry, claimed: true }), lead: { ...survey.lead } };
}

/** Party notebook. Only the places and details already discovered are named. */
export function surveysForPlayers(book = newSurveyBook()) {
  const places = [];
  for (const entry of book.places) {
    const survey = surveyOf(entry.id);
    if (!survey) continue;
    const notes = entry.found.map(id => survey.observations.find(note => note.id === id)).filter(Boolean);
    if (!notes.length) continue;
    places.push({
      id: entry.id,
      title: survey.title,
      total: survey.observations.length,
      complete: complete(survey, entry),
      observations: notes.map(({ kind, title, text }) => ({ kind, title, text })),
    });
  }
  return places;
}
