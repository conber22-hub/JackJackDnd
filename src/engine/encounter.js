/* ENCOUNTERS — build a fight to an XP budget (the 2024 rules' budgets per character), leaned on by Strahd's
   Gaze: the higher it is, the bigger the budget and the more of the Count's own creatures turn up.
   Pure: takes the creature list, returns [{ bid, n }]. */
export const CR_XP = { '0':10, '1/8':25, '1/4':50, '1/2':100, '1':200, '2':450, '3':700, '4':1100, '5':1800, '6':2300, '7':2900, '8':3900,
  '9':5000, '10':5900, '11':7200, '12':8400, '13':10000, '14':11500, '15':13000, '16':15000, '17':18000, '18':20000, '19':22000, '20':25000, '21':33000, '22':41000 };
// XP per character: [low, moderate, high] for levels 1–20
const BUDGET = [[50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
  [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800],
  [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]];
export const DIFFICULTY = ['low', 'moderate', 'high'];
// Whole rulebooks of creatures (the SRD's 330, the DM's books): only when the DM picks that family.
const OPEN_FAMS = new Set(['srd', 'library']);
export const xpOf = b => CR_XP[String(b?.cr)] ?? 0;
export const gazeScale = gaze => 1 + Math.max(0, (+gaze || 1) - 1) * 0.06;
export function budgetFor(levels, difficulty = 'moderate', gaze = 1){
  const k = Math.max(0, DIFFICULTY.indexOf(difficulty));
  return Math.round(levels.reduce((s, L) => s + BUDGET[Math.min(20, Math.max(1, L | 0)) - 1][k], 0) * gazeScale(gaze));
}
/* Pick a leader (the biggest bite of the budget that fits), then its kind (same family) to fill the rest.
   fam: a family id, or 'any'. Bosses and creatures worth nothing are left out. The count stays playable. */
export function buildEncounter(list, { levels = [1, 1, 1, 1], difficulty = 'moderate', gaze = 1, fam = 'any', rng = Math.random } = {}){
  const budget = budgetFor(levels, difficulty, gaze), maxN = Math.max(2, levels.length * 2);
  const pool = list.filter(b => !b.tags?.includes('boss') && xpOf(b) > 0 && xpOf(b) <= budget && (fam === 'any' ? !OPEN_FAMS.has(b.fam) : b.fam === fam));   // 'any' is the campaign's own; the SRD and the DM's books by choice
  if (!pool.length) return { budget, xp:0, group:[] };
  const weight = b => (b.fam === 'barovia' && gaze >= 4 ? 1 + gaze / 3 : 1);
  const pickW = arr => { const tot = arr.reduce((s, b) => s + weight(b), 0); let r = rng() * tot; for (const b of arr){ r -= weight(b); if (r <= 0) return b; } return arr[arr.length - 1]; };
  // the leader: worth between a third and the whole budget if possible
  const big = pool.filter(b => xpOf(b) >= budget / 3);
  const leader = pickW(big.length ? big : pool);
  const group = new Map([[leader.id, 1]]); let xp = xpOf(leader), n = 1;
  const kin = pool.filter(b => b.id !== leader.id && (b.fam === leader.fam || fam !== 'any') && xpOf(b) <= xpOf(leader));
  for (let guard = 0; guard < 40 && n < maxN; guard++){
    const left = budget - xp, fits = [leader, ...kin].filter(b => xpOf(b) <= left);
    if (!fits.length || left < budget * 0.1) break;
    const b = rng() < 0.45 && xpOf(leader) <= left ? leader : pickW(fits);
    group.set(b.id, (group.get(b.id) || 0) + 1); xp += xpOf(b); n++;
  }
  return { budget, xp, group:[...group].map(([bid, n]) => ({ bid, n })) };
}
// The party's levels from their tokens ("Fighter 3 · Champion"), or the session's level for tokens without a sheet.
export function partyLevels(tokens, fallback = 1){
  return tokens.filter(t => t.kind === 'pc' && !t.dead && !t.flags?.gone).map(t => +(String(t.cls || '').match(/(\d+)/)?.[1]) || fallback);
}
