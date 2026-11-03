/* COINS — paying and being paid the way people do, not the way a bank would (pure: no DOM). */
/* Pay gp from a purse the way a person does: the small coins first, then one bigger coin broken, the change given
   back in gold, silver and copper. (Platinum and electrum a hero didn't spend stay as they were.) → coins | null */
const COIN = [['cp', 1], ['sp', 10], ['ep', 50], ['gp', 100], ['pp', 1000]];
export function spendCoins(coins, gp){
  const c = Object.fromEntries(COIN.map(([k]) => [k, Math.max(0, Math.floor(+coins?.[k] || 0))]));
  let left = Math.round(gp * 100);
  if (COIN.reduce((n, [k, v]) => n + c[k] * v, 0) < left) return null;
  for (const [k, v] of COIN){ const use = Math.min(c[k], Math.floor(left / v)); c[k] -= use; left -= use * v; }
  if (left > 0){
    const [k, v] = COIN.find(([k, v]) => c[k] > 0 && v > left) || COIN.slice().reverse().find(([k]) => c[k] > 0);
    c[k]--; let change = v - left;
    for (const [ck, cv] of [['gp', 100], ['sp', 10], ['cp', 1]]){ c[ck] += Math.floor(change / cv); change %= cv; }
  }
  return c;
}
// Coins received: added as gold, silver and copper to what the purse already holds.
export function addCoins(coins, gp){
  const c = { cp:0, sp:0, ep:0, gp:0, pp:0, ...coins }; let v = Math.round(gp * 100);
  for (const [k, n] of [['gp', 100], ['sp', 10], ['cp', 1]]){ c[k] = (+c[k] || 0) + Math.floor(v / n); v %= n; }
  return c;
}
