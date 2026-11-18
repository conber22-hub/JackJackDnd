import { LOOKS, SCHOOL } from '../data/spell-looks.js';
import { spellLook, spellPath } from './spellfx.js';

const own = (object, key) => typeof key === 'string' && Object.hasOwn(object, key);
const text = value => typeof value === 'string' ? value.trim() : '';

export function hasLook(name){ return own(LOOKS, name); }
export function looked(){ return Object.keys(LOOKS); }

/* Named signatures win. Damage is evaluated alone so k:'heal' or cond cannot
   accidentally hide an element. School names from the SRD are title-cased.
   A fresh flat object keeps callers from modifying the shared catalogue. */
export function lookFor(spell = {}){
  const s = spell && typeof spell === 'object' ? spell : {};
  const ty = text(s.ty), school = text(s.school).toLowerCase();
  const generic = spellLook(ty ? { ty } : {});
  const { col, col2, motes, light, shock, kind } = generic;
  const fallback = {
    col, col2, motes, light, shock, mark:null, linger:0, sound:kind,
    words:'A bright core scatters into drifting sparks.',
    ...(!ty && own(SCHOOL, school) ? SCHOOL[school] : {}),
  };
  const result = { ...fallback, ...(hasLook(s.n) ? LOOKS[s.n] : {}) };
  // Never invent touch/darts/pillar when targeting has supplied no shape.
  if (!result.path && text(s.shape)) result.path = spellPath({ ...s, shape:text(s.shape) });
  return result;
}
