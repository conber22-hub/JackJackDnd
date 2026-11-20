/* ⚔ WHAT EACH ACTION LOOKS LIKE ON THE MAP — for anyone looking at it (the Wanderer, the DM, a handheld at the table
   that sees it happen): over the figure, what it did or what was done to it, and a ring spreading on the ground.
     · a blow: the damage rising red from whoever took it (a gold CRIT), MISS in grey, a streak for a throw, a shot or
       a spell attack (in the spell's colour)
     · healing, from a spell, a potion, Second Wind, Lay on Hands: the hit points back, rising green, a green ring
     · Dash, Dodge, Disengage, getting up: the word, and a ring in its colour
     · a feature used (Second Wind, Action Surge, Rage…): its name in gold
     · a spell cast that isn't an attack (Bless, Cure Wounds, Sacred Flame…): its name over the caster in violet
     · a condition taken on (prone, poisoned, frightened, blessed…): its name over them
   The game says what happened on its bus (game/combat.js, moves.js, resources.js, rules.js); this only draws it
   (render/fightzone.js). */
import { bus } from '../util/core.js';
import { floatText, streak, ringPulse, plantArrow } from '../render/fightzone.js';
import { impact, setMine, windUp } from '../render/punch.js';
import { holdFall } from '../render/minis.js';
import { state, ui } from '../engine/state.js';
import { shareOf } from '../engine/punch.js';

const SPELL_COL = { fire:'#ff8a3a', cold:'#9fd8ff', radiant:'#ffe9a0', necrotic:'#9dff8a', lightning:'#bfe0ff', force:'#c9a0ff', acid:'#b8ff6a', poison:'#8fe36a', thunder:'#d8d8ff', psychic:'#ff9ae0' };
const ACT = { dash:['DASH', '#ffd27a'], dodge:['DODGE', '#9fd8ff'], disengage:['DISENGAGE', '#d8c8ff'], stand:['UP', '#efe6d2'] };
// conditions worth a word over them, in the colour of what they mean (a help, a harm, a hold)
const COND_COL = { blessed:'#ffe08a', hasted:'#ffe08a', raging:'#ff8a5a', invisible:'#cfe8ff', concentrating:null, dodging:null, seeded:null };
const condWord = n => String(n).toUpperCase();
const after = (ms, fn) => setTimeout(fn, ms);

const critAt = new Map();
let hurtLast = 0, hurtN = 0, healLast = 0, healN = 0;
const blowAt = new Map();   // a blow from a swing, shot or spell attack: its impact comes with the swing (render/punch.js)
function acted(e){
  if (!e?.actor) return;
  if (e.trigger === 'hit' || e.trigger === 'miss' || e.trigger === 'critical'){
    if (!e.target) return;
    blowAt.set(e.target.id, performance.now());
    if (e.ranged) streak(e.actor.id, e.target.id, { spell:e.spell ? SPELL_COL[e.spell] || '#c9a0ff' : null, stick:e.spell ? null : e.trigger === 'miss' ? 'miss' : 'hit' });   // (an arrow or a javelin stays where it went)
    if (e.trigger === 'critical') critAt.set(e.target.id, performance.now());
    if (e.trigger === 'miss') after(330, () => floatText(e.target.id, e.block ? 'BLOCKED' : 'MISS', e.block ? '#f2e2b0' : '#d9d2c4', { word:!!e.block }));
    if (e.trigger === 'miss' && e.die?.n === 1) after(420, () => floatText(e.actor.id, 'FUMBLE', '#c9a0ff', { word:true }));   // 🙃 (and they stumble: render/punch.js)
    return;
  }
  if ((e.trigger === 'spell' || e.trigger === 'heal') && e.action){
    floatText(e.actor.id, `✦ ${e.action}`, '#d9b8ff', { word:true }); ringPulse(e.actor.id, '#b48cff');
    if (e.target && e.target.id !== e.actor.id) after(250, () => ringPulse(e.target.id, e.trigger === 'heal' ? '#7dff9a' : '#b48cff'));
  }
}
function hurt(e){
  if (!e?.t || !(e.n > 0)) return;
  const now = performance.now(); hurtN = now - hurtLast < 80 ? hurtN + 1 : 0; hurtLast = now;
  const crit = now - (critAt.get(e.t.id) || -1e9) < 80;
  after(330 + hurtN * 160, () => floatText(e.t.id, `${crit ? 'CRIT ' : ''}−${e.n}`, crit ? '#ffd45a' : e.t.kind === 'monster' ? '#ff7a52' : '#ff3b3b', { big:crit }));
  // 💥 a killing blow: the figure stands until it lands, then falls (render/minis.js)
  if (e.t.dead) holdFall(e.t.id, 500 + hurtN * 160);
  // 🩸 half its hit points gone, with this blow: a foe staggers into it, and the word rises after the number
  if (e.bloodied && e.t.kind === 'monster') after(780 + hurtN * 160, () => floatText(e.t.id, 'BLOODIED', '#ff6a5a', { word:true }));
  // what had no swing (a spell's area, a trap, a burst): it lands all the same, from nowhere in particular
  if (now - (blowAt.get(e.t.id) || -1e9) > 60){ const t = e.t, kill = !!t.dead; after(330 + hurtN * 160, () => impact(t.id, null, { r:shareOf(e.n, t.maxHp), kill })); }
}
function healed(e){
  if (!e?.t || !(e.n > 0)) return;
  const now = performance.now(); healN = now - healLast < 80 ? healN + 1 : 0; healLast = now;
  after(200 + healN * 160, () => { floatText(e.t.id, `+${e.n}`, '#7dff9a'); ringPulse(e.t.id, '#7dff9a'); });
}
function turnAct(e){
  const a = e?.t && ACT[e.k]; if (!a) return;
  floatText(e.t.id, a[0], a[1], { word:true }); ringPulse(e.t.id, a[1]);
}
function feature(e){
  if (!e?.t || !e.n) return;
  floatText(e.t.id, e.n.toUpperCase(), '#ffd45a', { word:true }); ringPulse(e.t.id, '#ffd45a');
}
function cond(e){
  if (!e?.t || !e.n) return;
  const col = e.n in COND_COL ? COND_COL[e.n] : '#d49aff'; if (!col) return;
  after(450, () => floatText(e.t.id, condWord(e.n), col, { word:true }));
}

/* 📱 A player's screen at the table (net/table.js 'act'): the game's events don't fire there, so the blow's own message
   draws what the DM's screen draws from them: the shot or the throw crossing (as it's loosed), the number over whoever
   took it (or MISS), and the arrow that stays where it went. */
export function remoteBlow(kind, id, from, fx = {}){
  if (kind === 'attack' && fx?.ranged && from) streak(id, from, { spell:fx.el ? SPELL_COL[fx.el] || '#c9a0ff' : null });   // (attack: id is the one loosing, from its target)
  else if (kind === 'hit'){ if (fx?.n > 0) floatText(id, `${fx.crit ? 'CRIT ' : ''}−${fx.n}`, fx.crit ? '#ffd45a' : '#ff7a52', { big:!!fx.crit }); if (fx?.ranged && from && !fx.el) plantArrow(from, id, 'hit'); }
  else if (kind === 'miss'){ floatText(id, fx?.block ? 'BLOCKED' : 'MISS', fx?.block ? '#f2e2b0' : '#d9d2c4', { word:!!fx?.block }); if (fx?.fumble && from) floatText(from, 'FUMBLE', '#c9a0ff', { word:true }); if (fx?.ranged && from && !fx.el) plantArrow(from, id, 'miss'); }
}
export function remoteHeal(id, n){ if (n > 0){ floatText(id, `+${n}`, '#7dff9a'); ringPulse(id, '#7dff9a'); } }
let wardsShown = 0;
export const wardFloats = () => wardsShown;
let wired = false;
export function wireFightFx(){
  if (wired) return; wired = true;
  // the one watching: a player's own hero, or the Wanderer's (their hurts redden the screen's edges)
  setMine(id => !!id && (id === ui.myToken || id === state?.campaign?.wander?.heroTok));
  bus.on('acted', acted); bus.on('hurt', hurt); bus.on('healed', healed);
  bus.on('turnAct', turnAct); bus.on('feature', feature); bus.on('cond', cond);
  bus.on('turnStart', e => { const t = e?.t; if (!t || t.dead) return; const col = t.kind === 'monster' ? '#ff6a4a' : '#ffd27a'; ringPulse(t.id, col); after(180, () => ringPulse(t.id, col)); });   // 🔆 whose turn it is
  bus.on('shove', e => { if (!e?.target || e.out === 'prone') return; after(380, () => floatText(e.target.id, { pushed:'SHOVED', prone:'PRONE', resisted:'STANDS FIRM', stuck:'STAGGERS' }[e.out] || 'SHOVE', e.out === 'resisted' ? '#d9d2c4' : '#ffd27a', { word:true })); });   // 🤚 (game/combat.js shove)
  // ⛨ a Ward (engine/mech.js): what it soaked, pale blue; WARD DOWN when it breaks; WARD when it comes back whole
  bus.on('ward', e => { const t = e?.t; if (!t) return;
    if (e.back){ floatText(t.id, '⛨ WARD', '#9fdcff', { word:true }); ringPulse(t.id, '#9fdcff'); wardsShown++; return; }
    after(330, () => floatText(t.id, `⛨ −${e.soaked}`, '#9fdcff')); wardsShown++;
    if (e.broke) after(700, () => { floatText(t.id, 'WARD DOWN', '#6fb6e8', { word:true }); ringPulse(t.id, '#6fb6e8'); }); });
  bus.on('temphp', e => { const t = e?.t; if (!t) return; if (e.given) floatText(t.id, `+${e.given} TEMP`, '#c9b8ff'); else if (e.soaked) after(330, () => floatText(t.id, `−${e.soaked} temp`, '#b3a4e6')); });   // (engine/mech.js)
  bus.on('aims', e => { if (e?.by && e.at){ windUp(e.by, e.at, e.ms); if (e.at === state?.campaign?.wander?.heroTok || e.at === ui.myToken) floatText(e.at, '!', '#ff4a3a', { word:true }); } });   // ⚠ a foe shows who it's going for
}
