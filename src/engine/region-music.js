import { LOOPS } from '../data/region-music.js';
import { duration } from './chiptune.js';
const known = id => LOOPS.some(s => s.id === id);
function requireLoop(id){ if (!known(id)) throw new RangeError(`Unknown region loop: ${id}`); }
// Priority: combat, underground rooms, indoor use, castle, mists, named place, terrain.
// room may be its name or a room record from the map adapter. Missing hour means noon.
export function regionLoop({ place = null, kind = '', inside = null, room = '', hour = 12, fight = false, mist = false } = {}){
  if (fight) return null;
  const r = typeof room === 'string' ? room : room?.name || '';
  if (/\b(cellar|crypt|catacomb|cave|basement|tomb)s?\b/i.test(`${r} ${inside || ''}`)) return 'crypt';
  if (inside){
    if (/^(church|shrine|chapel|abbey)$/i.test(inside)) return 'church';
    if (/^(tavern|inn)$/i.test(inside)) return 'tavern';
    if (inside === 'castle' || place === 'castle') return 'castle';
    if (inside === 'mill') return 'windmill';
    return 'house';
  }
  if (place === 'castle' || kind === 'castle') return 'castle';
  if (place === 'mists' || (mist && (kind === 'road' || !place))) return 'mists';
  const h = Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 12, night = h >= 20 || h < 6;
  if (place === 'tser') return 'vistani';
  if (place === 'vallaki') return 'vallaki';
  if (place === 'krezk') return 'krezk';
  if (place === 'lake') return 'lake';
  if (place === 'bonegrinder') return 'windmill';
  if (place === 'argyn') return 'castle';
  if (kind === 'camp') return 'vistani';
  if (place === 'village' || kind === 'village' || kind === 'town') return night ? 'villageNight' : 'village';
  if (kind === 'woods' || ['yester','berez'].includes(place)) return 'woods';
  return night ? 'roadNight' : 'road';
}
// With gap=0 start the two fades together; otherwise finish out, wait gap, then start in.
// null means silence (e.g. combat). Positive fades also apply when entering/leaving silence.
export function handover(fromId, toId){
  for (const id of [fromId, toId]) if (id !== null) requireLoop(id);
  if (fromId === toId) return null;
  if (toId === null) return { out:.6, in:.6, gap:0 };
  if (fromId === null) return { out:.6, in:3, gap:0 };
  if (toId === 'church') return { out:3, in:5, gap:1.5 };
  if (['road','roadNight'].includes(fromId) && ['road','roadNight'].includes(toId)) return { out:6, in:6, gap:0 };
  if (toId === 'mists' || fromId === 'mists') return { out:7, in:7, gap:0 };
  return { out:2.5, in:3.5, gap:.25 };
}
export function loopLength(id){ requireLoop(id); return duration(LOOPS.find(s => s.id === id)); }
export function variantFor(id, { gaze = 1 } = {}){
  requireLoop(id);
  const g = Number.isFinite(gaze) ? Math.min(10, Math.max(1, gaze)) : 1, amount = (g - 1) / 9;
  return { tempo:1 - .15 * amount, transpose:-Math.floor(amount * 3) || 0 };
}
