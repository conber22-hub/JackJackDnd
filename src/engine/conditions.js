/* SRD 5.2.1, Wizards of the Coast LLC, https://www.dndbeyond.com/srd.
   CC BY 4.0, https://creativecommons.org/licenses/by/4.0/legalcode.
   Changes: pure condition modifiers; contextual prohibitions remain with the caller. */
import { DAMAGE_TYPES } from './defenses.js';
export function implied(conds = []){
  const out = new Set(conds.map(c => typeof c === 'string' ? c : c.n));
  if (['paralyzed','stunned','petrified','unconscious'].some(n => out.has(n))) out.add('incapacitated');
  if (out.has('unconscious')) out.add('prone');
  return out;
}
const has = (c, n) => implied(c?.conds).has(n);
const level = c => Math.max(0, Math.min(6, Math.trunc(c?.exhaustion || 0)));
const penalty = c => level(c) * 2;
const label = c => c?.name || 'the creature';
const stopped = c => ['grappled','restrained','paralyzed','petrified','unconscious'].some(n => has(c, n));
export function attackMods({attacker, target, melee, within5, attackerSeen = true, targetSeen = true, attackerSeesSource = true}){
  const adv = [], dis = [], a = implied(attacker?.conds), t = implied(target?.conds);
  for (const n of ['blinded','poisoned','prone','restrained']) if (a.has(n)) dis.push(`${label(attacker)} ${n}`);
  if (a.has('frightened') && attackerSeesSource) dis.push(`${label(attacker)} frightened`);
  // A grapple condition may store src (the grappler's token id); unknown sources need caller adjudication.
  if (attacker?.conds?.some(c => c.n === 'grappled' && c.src != null && c.src !== target?.id)) dis.push(`${label(attacker)} grappled`);
  for (const n of ['blinded','restrained','paralyzed','petrified','stunned','unconscious']) if (t.has(n)) adv.push(`${label(target)} ${n}`);
  if (t.has('prone')) (within5 ? adv : dis).push(`${label(target)} prone`);
  // Visibility flags describe actual perception (including special senses), overriding invisibility.
  if (!attackerSeen) adv.push(`${label(attacker)} unseen`);
  if (!targetSeen) dis.push(`${label(target)} unseen`);
  return {adv,dis,autoCrit:!!within5 && (t.has('paralyzed') || t.has('unconscious')),penalty:penalty(attacker)};
}
export function saveMods(creature, ability){
  const ab = String(ability).toLowerCase().slice(0,3);
  return {autoFail:['str','dex'].includes(ab) && ['paralyzed','petrified','stunned','unconscious'].some(n => has(creature,n)),adv:[],dis:ab === 'dex' && has(creature,'restrained') ? [`${label(creature)} restrained`] : [],penalty:penalty(creature)};
}
export function checkMods(creature, {sight = false, hearing = false, sourceSeen = true} = {}){
  const dis = [];
  if (has(creature,'poisoned')) dis.push(`${label(creature)} poisoned`);
  if (has(creature,'frightened') && sourceSeen) dis.push(`${label(creature)} frightened`);
  return {autoFail:(sight && has(creature,'blinded')) || (hearing && has(creature,'deafened')),adv:[],dis,penalty:penalty(creature)};
}
export const speedOf = (creature, base) => stopped(creature) ? 0 : Math.max(0, base - level(creature) * 5);
export function canAct(creature){
  const active = !has(creature,'incapacitated');
  return {actions:active,bonus:active,reactions:active,move:!stopped(creature),speak:active};
}
export const damageMods = creature => ({resist:has(creature,'petrified') ? [...DAMAGE_TYPES] : [],immune:[],vuln:[],condImmune:has(creature,'petrified') ? ['poisoned'] : []});
export const exhaustionDead = creature => level(creature) === 6;
