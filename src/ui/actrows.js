/* 🎴 WHAT EACH CHOICE IN A FIGHT SAYS ABOUT ITSELF (for ui/wander.js and ui/tablehh.js, drawn by ui/optrow.js): its
   icon, a line of what it does, the tags for what it costs, and a little more for when it's highlighted.
   From the hero's own attacks, the SRD's spells (data/srd.js) and their features (engine/hero.js). */
import { SPELLS } from '../data/srd.js';
import { signed, esc } from '../util/core.js';
import { attackProfile } from '../engine/targeting.js';
import { tag } from './optrow.js';

const SP = new Map((Array.isArray(SPELLS) ? SPELLS : Object.values(SPELLS)).map(s => [s.n, s]));
export const spellOf = n => SP.get(n) || null;
const clip = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, '')}…` : t; };
// a spell's first sentence, if it's short enough to be the line under its name
const firstLine = t => { const m = /^[^.]*\./.exec(String(t || '').trim()); return m && m[0].length <= 72 ? m[0].replace(/\.$/, '') : clip(t, 56); };
const ft = r => String(r || '').replace(/ feet\b/, ' ft.').replace(/^Self\b.*/, 'on yourself');
const SAVE = { str:'Str', dex:'Dex', con:'Con', int:'Int', wis:'Wis', cha:'Cha' };
const timeTag = s => /bonus/i.test(s?.time || '') ? tag('bonus') : /reaction/i.test(s?.time || '') ? tag('react') : tag('act');

/* ---------- a weapon (or a spell that strikes like one) ---------- */
export const isSpellAtk = a => / casts /.test(a?.f || '') || a?.l !== undefined && a?.l !== null && !!spellOf(a.sn || a.n);
export function attackBits(a, reach = ''){
  const sp = isSpellAtk(a), far = !sp && (() => { try { const p = attackProfile(a); return !p.melee && p.far > 0; } catch { return false; } })();
  const s = sp && spellOf(a.sn || a.n);
  return { icon:sp ? '✦' : far ? '🏹' : '⚔',
    sub:`${signed(a.b)} to hit · ${a.d} ${a.t || ''}${reach ? ` · ${reach}` : ''}`,
    tags:[tag('act'), ...(a.l ? [tag('slot', `L${a.l}`)] : [])],
    info:s ? esc(clip(s.text, 220)) : `A strike with your ${esc(a.n.toLowerCase())}: roll ${signed(a.b)} against their armour; on a hit, ${esc(a.d)} ${esc(a.t || '')} damage.` };
}

/* ---------- a spell ---------- */
export const SPELL_ICON = { atk:'✦', save:'✸', heal:'✚', buff:'✧', util:'◇', area:'✺' };
// c: the hero's cast entry ({ n, l, k, sn }); why: why it can't be cast now, if it can't
export function spellBits(c, why = ''){
  const s = spellOf(c.sn || c.n), k = c.k || s?.k || 'util', r = ft(s?.range);
  const dmg = s?.d ? `${s.d}${s.ty ? ` ${s.ty}` : ''}` : '';
  const what = k === 'atk' ? [dmg, 'a spell attack', r] : k === 'save' ? [dmg, s?.sv ? `${SAVE[s.sv] || s.sv} save` : '', r]
    : k === 'heal' ? [s?.d ? `heals ${s.d} + your casting bonus` : 'heals', r] : [firstLine(s?.text), r];
  return { icon:SPELL_ICON[k] || '◇',
    sub:why ? `Only ${why}` : what.filter(Boolean).join(' · '),
    tags:[timeTag(s), ...(c.l ? [tag('slot', `L${c.l}`)] : []), ...(s?.conc ? [tag('conc', 'Conc.')] : [])],
    info:s ? `${esc(clip(s.text, 240))}${s.dur && s.dur !== 'Instantaneous' ? ` <span class="muted">· ${esc(s.dur)}</span>` : ''}` : '' };
}

/* ---------- the actions every creature has ---------- */
export const TURN_ACT = {
  dash:{ icon:'💨', sub:'Your speed again this turn', info:'Twice your move this turn: the squares you can reach light up further out.' },
  disengage:{ icon:'↩', sub:'Leave without opportunity attacks', info:'For the rest of this turn, walking out of a foe\'s reach doesn\'t give them a free strike at you.' },
  dodge:{ icon:'🛡', sub:'Attacks against you at disadvantage', info:'Until your next turn, attacks against you roll twice and take the lower, and your Dexterity saves roll twice and take the higher.' },
  stand:{ icon:'⤒', sub:'Half your move', info:'Get up off the ground: it costs half your speed.', cost:'move' },
};
export const actBits = k => { const a = TURN_ACT[k]; return { icon:a.icon, sub:a.sub, info:a.info, tags:[tag(a.cost || 'act')] }; };

/* ---------- a feature (Second Wind, Action Surge, Rage…) ---------- */
const FEAT = { wind:['❤', 'bonus'], surge:['⚡', 'free'], rage:['🔥', 'bonus'], lay:['✋', 'act'], heroic:['✶', 'free'], inspire:['♪', 'bonus'],
  channel:['☀', 'act'], smite:['⚔', 'free'], wild:['🐾', 'bonus'], indomitable:['⛨', 'free'], focus:['☯', 'free'], sorcery:['✺', 'free'],
  sorcrest:['↺', 'free'], favored:['🎯', 'free'], arcane:['↺', 'free'], cunning:['↺', 'free'], hd:['🎲', 'free'] };
// f: { id, n, left, max, why, text }
export function featBits(f){
  const [icon, cost] = FEAT[f.id] || ['◆', 'free'];
  return { icon, sub:`${f.left} of ${f.max} left${f.why ? ` · ${f.why}` : ''}`, tags:[tag(cost)], info:esc(f.text || '') };
}
