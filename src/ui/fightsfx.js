/* 🔊 A LITTLE SOUND FOR EVERYTHING IN A FIGHT — ChatGPT's chiptune recipes (engine/fight-sfx.js sfxFor, data/fight-sfx.js)
   played on the effects channel (audio/sound.js playTune: the player's sound setting turns them off):
     · a swing as the blow is thrown (steel, a club, a bowstring, a claw, a bite, a spell in its element's colour), and
       as it lands (render/punch.js's impact, a third of a second on) the hit by what it hit: flesh, leather, hide,
       mail, plate, bone; a parry or a whiff on a miss; a crit layered on top
     · healing, a spell cast by its school, Dash / Dodge / Disengage / getting up, a feature (Second Wind, Rage…),
       a condition taken on, a foe killed, a hero down
   They play where the fight is run (the DM's app, the Wanderer); the plain hit / miss / crit the table hears is still
   sent to the players' screens. Variation comes from a counter, so ten sword hits don't sound the same. */
import { bus } from '../util/core.js';
import { sfxFor } from '../engine/fight-sfx.js';
import { playTune, quietHere } from '../audio/sound.js';
import { ARMOR, SPELLS } from '../data/srd.js';
import { BEST } from '../data/bestiary.js';

let n = 0;
const play = (e, at = 0) => { try { const r = sfxFor(e, { seed:`${e.t}:${++n}` }); if (r) playTune(r.events, { gain:.55, at }); } catch {} };

/* What a blow lands on: a hero's armour by its weight; a creature's by what it is (bone, hide, plate, or bare). */
export function armourOf(t){
  if (!t) return 'none';
  if (t.kind !== 'monster'){
    const a = ARMOR[t.armor]; if (!a || t.armor === 'None') return 'none';
    if (/hide/i.test(t.armor)) return 'hide';
    return a.dex >= 99 ? 'light' : a.dex > 0 ? 'medium' : 'heavy';
  }
  const tags = BEST[t.bid]?.tags || [], nm = String(t.name || '').toLowerCase();
  if (tags.includes('undead') && /skeleton|bone|lich/.test(nm)) return 'bone';
  if (/wolf|bear|boar|bat|rat|beast|spider|horse|hound|worg/.test(nm)) return 'hide';
  if ((t.ac || 0) >= 16 || /knight|guard|soldier|armou?r|golem|revenant/.test(nm)) return 'heavy';
  if ((t.ac || 0) >= 14) return 'medium';
  return 'none';
}
const side = t => t?.kind === 'monster' ? 'monster' : 'pc';

function acted(e){
  if (!e?.actor) return;
  const tr = e.trigger;
  if (tr === 'hit' || tr === 'miss' || tr === 'critical'){
    const kind = e.spell ? 'spell' : e.ranged ? 'ranged' : 'melee', dmgType = e.spell || e.dmgType || 'slashing';
    play({ t:'swing', kind, weapon:e.action || '', dmgType, by:side(e.actor) });
    if (e.target) play({ t:'land', hit:tr !== 'miss', crit:tr === 'critical', nat:e.die?.n, dmgType, kind, armour:armourOf(e.target), by:side(e.actor),
      bite:/bite|fang|jaws/i.test(e.action || '') }, .33);   // (as the blow lands: render/punch.js)
    return;
  }
  if (tr === 'spell' && e.action){ const lib = SPELLS.find(s => s.n === String(e.action).replace(/ \(×.*\)$/, ''));
    play({ t:'cast', spell:e.action, level:lib?.l || 0, school:String(lib?.school || 'evocation').toLowerCase() }); }
}

let wired = false;
export function wireFightSfx(){
  if (wired) return; wired = true;
  quietHere(['hit', 'miss', 'crit']);   // (these play here instead; the players' screens still hear the plain ones)
  bus.on('acted', acted);
  bus.on('healed', e => { if (e?.n > 0) play({ t:'heal', n:e.n }, .2); });
  bus.on('turnAct', e => e?.k && play({ t:'act', k:e.k }));
  bus.on('feature', e => e?.id && play({ t:'feature', id:e.id }));
  bus.on('cond', e => e?.n && play({ t:'cond', n:e.n }, .45));
  bus.on('hurt', e => { if (e?.t?.dead) play(e.t.kind === 'monster' ? { t:'kill' } : { t:'down', hero:true }, .5); });
}
