import { HERO_STARTERS } from '../data/hero-starters.js';
import { newHero } from './hero.js';

export function heroStarterCards() {
  return Object.entries(HERO_STARTERS).map(([id, { title, role, pitch, hook, sheet }]) =>
    ({ id, title, role, pitch, hook, cls: sheet.cls, species: sheet.sp }));
}

/** An editable draft in the existing creator's sheet format. A name is still the player's choice. */
export function buildStarterHero(starterId, { name = '', id } = {}) {
  if (typeof starterId !== 'string' || !Object.hasOwn(HERO_STARTERS, starterId)) {
    throw new RangeError('Unknown hero starter');
  }
  if (typeof name !== 'string' || (id !== undefined && (typeof id !== 'string' || !id.trim()))) {
    throw new TypeError('Use a text name and a valid hero ID');
  }
  const { sheet } = HERO_STARTERS[starterId];
  return { ...newHero(sheet.cls), ...structuredClone(sheet), name: name.trim(), ...(id === undefined ? {} : { id }) };
}
