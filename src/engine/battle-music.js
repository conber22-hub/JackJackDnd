import { FIGHT_LOOPS } from '../data/battle-music.js';

const clamp = n => Math.min(1, Math.max(0, n));
const members = xs => Array.isArray(xs) ? xs.filter(x => x && typeof x === 'object') : [];
const fallen = x => x.down === true || (Number.isFinite(x.hp) && x.hp <= 0);
function fractionLeft(x) {
  if (fallen(x)) return 0;
  if (!Number.isFinite(x.hp) || !(x.maxHp > 0)) return 1;
  return clamp(x.hp / x.maxHp);
}
function rating(value) {
  const [top, bottom = '1'] = String(value ?? 1).split('/');
  const cr = Number(top) / Number(bottom);
  return Number.isFinite(cr) ? Math.max(.125, cr) : 1;
}
function assess(fight) {
  const heroes = members(fight?.heroes);
  const foes = members(fight?.foes).filter(foe => !fallen(foe));
  const count = Math.max(heroes.length, 1);
  // Pressure is CR per party member, softened to stay bounded. A wounded foe
  // retains half its threat until it falls. Hurt is averaged per hero so a
  // fragile caster counts as much as a tank. Rounds add up to 8% over 8 turns.
  const threat = foes.reduce((sum,f) => sum + rating(f.cr) * (.5 + .5 * fractionLeft(f)), 0) / count;
  const hurt = heroes.reduce((sum,h) => sum + 1 - fractionLeft(h), 0) / count;
  const standing = heroes.filter(h => !fallen(h)).length;
  const rounds = clamp(((Number(fight?.round) || 1) - 1) / 8);
  const pressure = 1 - 1 / (1 + threat);
  const level = clamp(.48 * pressure + .32 * hurt + .12 * (heroes.length-standing)/count + .08 * rounds);
  return { heroes, foes, standing, level };
}
export function tension(fight) { return assess(fight).level; }
export function battleLoop(fight) {
  const { heroes, foes, standing, level } = assess(fight);
  let id;
  if (foes.some(f => f.court === true)) id = 'court';
  else if (foes.some(f => Array.isArray(f.tags) && f.tags.includes('seep'))) id = 'seep';
  else if (standing === 1 && (heroes.length > 1 || fractionLeft(heroes[0]) < .25)) id = 'lastStand';
  else if (level < .35) id = 'skirmish';
  else if (level < .7) id = 'clash';
  else id = 'peril';
  return { id, tempo:.9 + .35 * level };
}
export function shouldChange(fromId,toId,{ barsPlayed = 0 } = {}) {
  return fromId !== toId && (toId === 'lastStand' || barsPlayed >= 4);
}
export function fightLoops() { return FIGHT_LOOPS.map(loop => loop.id); }
