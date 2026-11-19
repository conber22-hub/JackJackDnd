/* 🤚 SHOVE (SRD 5.2, the Unarmed Strike's Shove, in place of one attack): the one shoved makes a Strength or a Dexterity
   saving throw (whichever is better for them), DC 8 + the shover's Strength modifier + their proficiency bonus; on a
   failure they're pushed 5 feet straight away, or knocked prone (the shover's choice). They can be no more than one
   size larger than the shover. Pure. */

export const shoveDC = ({ str = 0, pb = 2 } = {}) => 8 + (Number(str) || 0) + (Number(pb) || 0);
// the proficiency bonus at a level (1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17+: +6)
export const pbAt = lvl => 2 + Math.floor((Math.max(1, Math.min(20, Number(lvl) || 1)) - 1) / 4);
// sizes in squares (a token's size: 1 small or medium, 2 large, 3 huge, 4 gargantuan): one size larger at most
export const canShove = (a = {}, t = {}) => (Number(t.size) || 1) - (Number(a.size) || 1) <= 1;
// which save the one shoved makes: the better of their Strength and Dexterity
export const saveFor = (saves = {}) => ((saves.dex ?? -99) > (saves.str ?? -99) ? 'dex' : 'str');
/* Where a push leaves them: one square straight away from the shover (by the sign of each step, so a diagonal push
   goes diagonally). free(x, y) says whether they'd fit there. → { x, y } or null (there's nowhere to go: a wall) */
export function pushTo(a, t, free = () => true){
  const dx = Math.sign(t.x - a.x), dy = Math.sign(t.y - a.y); if (!dx && !dy) return null;
  const x = t.x + dx, y = t.y + dy;
  return free(x, y) ? { x, y } : null;
}
/* What happens: choice 'push' | 'prone'; dc; save: their total (or -99, failing outright); to: where a push goes (or null)
   → 'pushed' | 'prone' | 'resisted' | 'stuck' (they failed, but there was nowhere to push them: they stagger, no more) */
export function shoveResult({ choice = 'push', dc = 10, save = 0, to = null } = {}){
  if (save >= dc) return 'resisted';
  if (choice === 'prone') return 'prone';
  return to ? 'pushed' : 'stuck';
}
