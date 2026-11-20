/* ⛨ THE TWELVE EMBLEMS: one per Calling, as inline SVG, in one consistent style — simple, heraldic,
   readable at 24px on a party card and handsome at 160px on the picker. All original: nothing borrowed
   from any game's symbols (no Halo symbols, factions, names or logos). History is everyone's; the look
   is gothic first. Each emblem is drawn in currentColor on a 64×64 grid, so the host sets the colour;
   the Calling's own colour is passed in by the picker. An unknown id returns a plain shield. */
export const EMBLEM_IDS = ['vanguard', 'huscarl', 'outrider', 'marksman', 'warden', 'chaplain',
  'archivist', 'relicborn', 'seepbound', 'herald', 'mistwalker', 'pankratiast'];

const S = (inner, id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" data-emblem="${id}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const F = inner => `<g fill="currentColor" stroke="none">${inner}</g>`;   // a filled accent inside a stroked emblem

// A shield-and-spear for the Hoplite's Vanguard: the phalanx's wall, and the spear over it.
const vanguard = () => S(`<path d="M20 20 H44 V34 C44 46 38 53 32 56 C26 53 20 46 20 34 Z"/>
  <path d="M14 56 L48 12"/><polygon points="50,6 42,16 54,16" fill="currentColor" stroke="none"/>
  <path d="M14 56 L21 50 M14 56 L10 51"/>`, 'vanguard');
// An axe-and-hall for the Huscarl: the hall they are sworn to, and the axe leaning over it.
const huscarl = () => S(`<path d="M12 32 L32 16 L52 32"/><path d="M16 32 V50 M48 32 V50 M12 50 H52"/>
  <path d="M28 50 V40 H36 V50"/>
  <path d="M14 54 L50 12"/>${F('<path d="M50 10 C57 12 60 19 58 26 C53 23 50 17 50 10 Z"/>')}`, 'huscarl');
// A hooded rider for the Outrider: the horse in profile, and the hooded rider on its back.
const outrider = () => S(`<path d="M12 40 C12 36 16 34 22 34 H38 C46 34 52 36 52 40 C52 45 46 47 38 47 H22 C16 47 12 45 12 40 Z"/>
  <path d="M12 38 C8 40 7 44 8 48"/>
  <path d="M18 47 V56 M25 47 V56 M39 47 V56 M46 47 V56"/>
  <path d="M48 36 C52 30 54 26 56 22 L60 24 C58 29 56 33 54 37"/>
  ${F('<path d="M56 22 L62 19 L60 26 L56 26 Z"/>')}
  <path d="M30 8 C35 12 37 17 37 22 V26 C37 30 34 32 30 32 C26 32 23 30 23 26 V22 C23 17 25 12 30 8 Z"/>
  ${F('<path d="M28 19 C29 22 31 22 32 19 C31 17 29 17 28 19 Z"/>')}
  <path d="M25 32 H35 L38 38 H22 Z"/>`, 'outrider');
// A drawn bow for the Marksman: the arc, the string, and the arrow nocked and pointing out.
const marksman = () => S(`<path d="M22 8 C36 20 36 44 22 56"/><path d="M22 8 V56"/>
  <path d="M12 32 H46"/>${F('<polygon points="46,32 37,28 37,36"/>')}
  <path d="M12 32 L17 28 M12 32 L17 36"/>`, 'marksman');
// A sworn hand for the Warden: the raised palm, and the oath-mark on it.
const warden = () => S(`<path d="M24 56 V32 A4 4 0 0 1 24 24 V16 A3 3 0 0 1 30 16 V20 A3 3 0 0 1 36 20 V13 A3 3 0 0 1 42 13 V20 A3 3 0 0 1 48 20 V26 A3 3 0 0 1 54 26 V34 C54 44 48 50 42 54 V56 Z"/>
  <path d="M33 40 V48 M29 44 H37"/>`, 'warden');
// A bell and cross-of-bandage for the Chaplain: the field priest's bell, the bandage cross on its face.
const chaplain = () => S(`<path d="M32 4 V12 M28 8 H36"/>
  <path d="M32 14 C23 14 19 23 19 33 L15 43 H49 L45 33 C45 23 41 14 32 14 Z"/>
  <path d="M32 24 V36 M26 30 H38"/>${F('<circle cx="32" cy="48" r="2.5"/>')}`, 'chaplain');
// A lantern with an eye of light for the Archivist: the Ghostlight, an old intelligence that talks back.
const archivist = () => S(`<path d="M28 18 C28 11 36 11 36 18"/><path d="M24 18 H40 V50 H24 Z M22 50 H42"/>
  <path d="M32 18 V50"/>
  <path d="M25 34 C28 28 36 28 39 34 C36 40 28 40 25 34 Z"/>${F('<circle cx="32" cy="34" r="2.5"/>')}
  <path d="M32 24 V27 M32 41 V44 M21 34 H24 M40 34 H43"/>`, 'archivist');
// A shard for the Relicborn: a piece of the First Builders, faceted and lodged in the blood.
const relicborn = () => S(`<path d="M32 6 L44 22 L39 56 L32 61 L25 56 L20 22 Z"/>
  <path d="M32 6 V61 M20 22 H44 M25 56 L32 40 L39 56"/>`, 'relicborn');
// A spore-bloom for the Seepbound: the rot's flower, green-black and beautiful, spores drifting off it.
const seepbound = () => S(`<g>${[0, 60, 120, 180, 240, 300].map(a =>
    `<ellipse cx="32" cy="20" rx="6" ry="10" transform="rotate(${a} 32 34)"/>`).join('')}</g>
  <circle cx="32" cy="34" r="5"/>${F('<circle cx="14" cy="18" r="1.8"/><circle cx="50" cy="18" r="1.8"/><circle cx="12" cy="38" r="1.8"/><circle cx="52" cy="38" r="1.8"/><circle cx="20" cy="54" r="1.8"/><circle cx="44" cy="54" r="1.8"/>')}`, 'seepbound');
// A drum for the Herald: the tempo of a fight, sticks crossed above it.
const herald = () => S(`<path d="M20 12 L30 20 M44 12 L34 20"/>${F('<circle cx="20" cy="12" r="2.2"/><circle cx="44" cy="12" r="2.2"/>')}
  <ellipse cx="32" cy="24" rx="16" ry="6"/><path d="M16 24 V46 M48 24 V46 M16 46 A16 6 0 0 0 48 46"/>
  <path d="M16 34 L22 40 L28 34 L34 40 L40 34 L46 40"/>`, 'herald');
// A wolf in fog for the Mistwalker: the pack's head, and the fog it was born in.
const mistwalker = () => S(`<path d="M20 18 L23 5 L30 15 M44 18 L41 5 L34 15"/>
  <path d="M22 16 C20 28 24 42 32 50 C40 42 44 28 42 16 C38 12 26 12 22 16 Z"/>
  <path d="M25 28 L29 29 M35 29 L39 28"/>${F('<polygon points="28,44 36,44 32,49"/>')}
  <path d="M12 55 C18 51 24 59 30 55 C36 51 42 59 48 55 M16 60 C22 57 28 62 34 60 C40 57 46 62 52 60"/>`, 'mistwalker');
// A laurel and fist for the Pankratiast: the Games' fighter, crowned by the branch.
const pankratiast = () => S(`<path d="M14 54 C10 44 10 32 16 22 M14 46 L10 42 M13 36 L9 34 M15 26 L12 22"/>
  <path d="M50 54 C54 44 54 32 48 22 M50 46 L54 42 M51 36 L55 34 M49 26 L52 22"/>
  <path d="M24 22 H40 A4 4 0 0 1 44 26 V40 A4 4 0 0 1 40 44 H24 A4 4 0 0 1 20 40 V26 A4 4 0 0 1 24 22 Z"/>
  <path d="M28 22 V30 M34 22 V30 M40 22 V30 M20 36 C25 33 30 34 32 38"/>`, 'pankratiast');
// A plain shield: what an unknown Calling gets. No name, no story, just the wall.
const shield = () => S(`<path d="M16 10 H48 V30 C48 44 40 52 32 56 C24 52 16 44 16 30 Z"/><path d="M32 10 V56"/>`, 'shield');

const DRAW = { vanguard, huscarl, outrider, marksman, warden, chaplain, archivist, relicborn, seepbound, herald, mistwalker, pankratiast };

export function emblemSvg(callingId, { size = 48, color = null } = {}){
  const draw = DRAW[callingId] || shield;
  const svg = draw();
  const s = Math.max(12, Math.round(+size || 48));
  return svg.replace('<svg ', `<svg width="${s}" height="${s}"${color ? ` style="color:${color}"` : ''} `);
}
export const hasEmblem = id => !!DRAW[id];
