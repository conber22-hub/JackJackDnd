/* OBJECTS IN PLAY — opening, picking, forcing, pushing, toppling, smashing and swinging aside the furniture.
   The DM's browser decides (a player's tap arrives as a { t:'prop' } message, checked in net/table.js); the
   rules are in engine/objects.js and the numbers in data/objects.js. Tall pieces that fall can hurt whoever
   is standing there; breaking things is loud. */
import { state, ui, tokById, log } from '../engine/state.js';
import { objInfo, objAC, objHp, besideProp, pushDir, pushTarget, toppleTarget, lieDown, movedTo, damageObject, fallDamage, objectActs, propName, isObject } from '../engine/objects.js';
import { updateVision } from '../engine/grid.js';
import { bestMelee } from '../engine/movement.js';
import { MOVE_DC, DEBRIS } from '../data/objects.js';
import { SEARCHABLE, rollLoot } from '../data/loot.js';
import { d, rollDice, esc } from '../util/core.js';
import { buildFloor, animateProp } from '../render/floors.js';
import { burst } from '../render/effects.js';
import { showCard, renderSel } from '../ui/hud.js';
import { saveBonus, addCond } from './rules.js';
import { applyDamage } from './combat.js';
import { makeNoise } from './noise.js';
import { changed, broadcast, sendHost } from './session.js';
import { rebuildFog } from './actions.js';
import { sfx } from '../audio/sound.js';

export const propById = (L, id) => state.floors[L]?.props?.find(p => p.id === id);
export const hiddenDoor = (L, p) => p?.hides ? state.floors[L]?.doors.find(dr => dr.id === p.hides) : null;
export function selectProp(L, id){ if (ui.selected) ui.propActor = ui.selected; ui.selected = null; ui.selDoor = null; ui.selTrap = null; ui.selProp = { floor:L, id }; renderSel(); }
export const selectedProp = () => ui.selProp && propById(ui.selProp.floor, ui.selProp.id);
// Pieces next to a creature that it can do something with (for the "Nearby" chips on its card).
export const objectsBeside = t => (state.floors[t.floor]?.props || []).filter(p => isObject(p) && !p.broken && besideProp(t, p));
// Who acts on a prop: a player's own hero; for the DM, the creature last selected if it's beside it, else any hero
// beside it, else nobody (the DM's own hand: no rolls).
export function actorFor(L, p){
  if (ui.role === 'player') return tokById(ui.myToken);
  const cand = [ui.propActor && tokById(ui.propActor), ...state.tokens.filter(t => t.kind !== 'monster')];
  return cand.find(t => t && t.floor === L && !t.dead && !t.flags?.gone && besideProp(t, p)) || null;
}

const check = (who, mod, dc, what) => { const r = d(20), tot = r + mod, ok = tot >= dc; return { ok, line:`${esc(who.name)} — ${what}: d20 <b>${r}</b> ${mod >= 0 ? '+' : '−'} ${Math.abs(mod)} = <b>${tot}</b> vs DC ${dc} — <b>${ok ? 'success' : 'fails'}</b>` }; };
const strMod = t => saveBonus(t, 'str');
// Show what's inside a container the first time it's opened (or smashed open): the DM's own text, or a roll on its table.
export function reveal(actor, p, how){
  if (p.searched || !(SEARCHABLE.has(p.k) || p.contents)) return;
  p.searched = true;
  const what = p.contents || rollLoot(p.k), name = propName(p);
  if (what.startsWith('DM:')){
    showCard({ kind:'', title:`${actor?.name || 'Someone'} ${how} the ${name}`, flair:'Something about it is not right…' });
    showCard({ kind:'seep', title:`For you: the ${name}`, sub:'only you see this', lines:[esc(what.slice(3).trim())] }, false);
  } else { p.found = what; showCard({ kind:'', title:`${actor?.name || 'Someone'} ${how} the ${name}`, flair:what }); }
  log(`${actor?.name || 'Someone'} ${how} the ${name}: ${what}`, what.startsWith('DM:'));
}
function revealStash(actor, p, how){
  if (!p.stash || p.stash.found) return;
  p.stash.found = true;
  showCard({ kind:'', title:`${actor?.name || 'Someone'} finds a hiding place`, sub:`in the ${propName(p)}${how ? ` · ${how}` : ''}`, flair:p.stash.text });
  log(`${actor?.name || 'Someone'} finds a hidden stash in the ${propName(p)}: ${p.stash.text}`);
}
// The secret door behind a piece shows itself when the piece is moved, toppled or smashed.
function exposeDoor(L, p){ const dr = hiddenDoor(L, p); if (dr && dr.state === 'secret'){ dr.state = 'closed'; dr.found = true; log('Behind it: a door that was never meant to be found.'); return true; } return false; }
function done(L, p, fx){
  buildFloor(L); if (fx) animateProp(L, p.id, fx);
  updateVision(); rebuildFog(L); renderSel(); changed();
  if (fx) setTimeout(() => broadcast({ t:'propfx', floor:L, id:p.id, fx }), 120);   // after the new state reaches them
}

/* Do something to a prop. actor: the creature doing it (null: the DM's own hand, no rolls). */
export function propAction(actor, L, id, act){
  if (ui.role === 'player'){ sendHost({ t:'prop', floor:L, id, act }); return; }
  const f = state.floors[L], p = propById(L, id); if (!f || !p) return;
  const o = objInfo(p.k), name = propName(p), who = actor || { name:'The DM' };
  const allowed = objectActs(f, p, actor, { dm:!actor, door:hiddenDoor(L, p) }).filter(a => a.act && !a.why).map(a => a.act);
  if (actor && !allowed.includes(act)){ const why = objectActs(f, p, actor, { door:hiddenDoor(L, p) }).find(a => a.act === act)?.why; if (why) showCard({ kind:'miss', title:`Can't ${act} the ${name}`, sub:why }); return; }
  const dir = actor && pushDir(actor, p);

  if (act === 'open' || act === 'close'){
    if (act === 'open' && o?.heavy && actor){
      const c = check(actor, strMod(actor), o.heavy, 'Strength');
      showCard({ kind:c.ok ? '' : 'miss', title:`${actor.name} heaves at the lid`, sub:`Strength DC ${o.heavy}`, lines:[c.line], flair:c.ok ? 'Stone grinds on stone.' : 'It shifts a finger\'s width, and settles back.' });
      if (!c.ok){ done(L, p); return; }
    }
    p.open = act === 'open'; sfx('door');
    log(`${who.name} ${p.open ? 'opens' : 'closes'} the ${name}.`);
    if (p.open) reveal(actor, p, 'opens');
    done(L, p, p.open ? 'open' : 'close'); return;
  }
  if (act === 'pick' || act === 'force'){
    if (!actor){ delete p.lock; done(L, p); return; }
    const pick = act === 'pick', dc = pick ? p.lock : p.lock + 2, c = check(actor, pick ? (actor.check || 0) : strMod(actor) + 2, dc, pick ? 'picking the lock' : 'forcing it');
    showCard({ kind:c.ok ? '' : 'miss', title:`${actor.name} ${pick ? 'picks the lock' : 'forces the lock'} on the ${name}`, sub:`DC ${dc}`, lines:[c.line], flair:pick ? '' : 'Wood splits round the hasp.' });
    log(`${actor.name} ${c.ok ? (pick ? 'unlocks' : 'forces open') : 'fails to open'} the ${name}.`);
    if (c.ok){ delete p.lock; if (!pick){ p.open = true; reveal(actor, p, 'forces open'); } }
    if (!pick) makeNoise(L, p.x, p.y, 1, `A ${name} is forced`);
    done(L, p, c.ok && !pick ? 'open' : null); return;
  }
  if (act === 'push'){
    if (!dir) return;
    const dc = MOVE_DC[o.move] || 0, c = dc && check(actor, strMod(actor), dc, 'Strength (Athletics)');
    if (c && !c.ok){ showCard({ kind:'miss', title:`${actor.name} puts a shoulder to the ${name}`, sub:`DC ${dc}`, lines:[c.line], flair:'It does not move.' }); return; }
    const to = pushTarget(f, p, dir.dx, dir.dy, state.tokens.filter(t => t.floor === L));
    if (to.why){ showCard({ kind:'miss', title:`The ${name} won't go`, sub:to.why }); return; }
    if (c) showCard({ kind:'', title:`${actor.name} shoves the ${name}`, lines:[c.line] });
    const from = { x:p.x, y:p.y };
    movedTo(f, p, to); sfx('grind'); log(`${actor.name} pushes the ${name}.`);
    if (exposeDoor(L, p)) showCard({ kind:'', title:'A door!', flair:`Behind where the ${name} stood, a door no one was meant to see.` });
    done(L, p, { slide:{ dx:from.x - to.x, dy:from.y - to.y } }); return;
  }
  if (act === 'topple'){
    if (!dir) return;
    const dc = o.move === 'heavy' ? 13 : 0, c = dc && check(actor, strMod(actor), dc, 'Strength (Athletics)');
    if (c && !c.ok){ showCard({ kind:'miss', title:`${actor.name} heaves at the ${name}`, sub:`DC ${dc}`, lines:[c.line], flair:'It rocks, and rights itself.' }); return; }
    const at = toppleTarget(f, p, dir.dx, dir.dy); if (at.why) return;
    lieDown(f, p, dir.dx, dir.dy, at);
    const fd = fallDamage(p), lines = c ? [c.line] : [];
    for (const t of state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone && at.hit.some(h => h.x >= t.x && h.x < t.x + (t.size || 1) && h.y >= t.y && h.y < t.y + (t.size || 1)))){
      const sv = check(t, saveBonus(t, 'dex'), 13, 'Dexterity save');
      if (sv.ok) lines.push(`${sv.line} — dives clear`);
      else { const dmg = rollDice(fd.dice).total; applyDamage(t, dmg, fd.type, actor?.id); addCond(t, 'prone', -1); lines.push(`${sv.line} — <b>${dmg}</b> ${fd.type}, knocked prone`); }
    }
    showCard({ kind:'crit', title:`${actor.name} topples the ${name}`, lines, flair:'It goes over like a felled tree.' });
    log(`${actor.name} topples the ${name}.`); sfx('boom');
    makeNoise(L, p.x, p.y, 2, `Something heavy crashes down`);
    if (exposeDoor(L, p)) showCard({ kind:'', title:'A door!', flair:'Where it stood, a door no one was meant to see.' });
    done(L, p, 'topple'); return;
  }
  if (act === 'smash'){
    let dmg, line;
    if (!actor){ dmg = 999; line = 'The DM breaks it.'; }
    else {
      const i = bestMelee(actor), a = actor.attacks?.[i] || { n:'Fists', b:saveBonus(actor, 'str'), d:'1+' + Math.max(0, saveBonus(actor, 'str')) };
      const r = d(20), tot = r + (a.b || 0), ac = objAC(p), hit = r === 20 || (r !== 1 && tot >= ac);
      dmg = hit ? rollDice(a.d, r === 20).total : 0;
      line = `${esc(a.n)}: d20 <b>${r}</b> + ${a.b || 0} = <b>${tot}</b> vs AC ${ac} — ${hit ? `<b>${dmg}</b> damage` : 'glances off'}`;
    }
    const broke = damageObject(f, p, dmg);
    showCard({ kind:broke ? 'crit' : dmg ? '' : 'miss', title:`${who.name} ${broke ? 'smashes' : 'hits'} the ${name}`, lines:[line, broke ? `<b>It breaks.</b> ${DEBRIS[o?.m] || ''}` : `${objHp(p)} HP left`] });
    log(`${who.name} ${broke ? 'smashes' : 'hits'} the ${name}.`);
    sfx(broke ? 'burst' : 'hit'); makeNoise(L, p.x, p.y, broke ? 2 : 1, `Something is being smashed`);
    if (broke){
      burst(L, p.x, p.y, o?.m === 'stone' ? '#bdb6aa' : o?.m === 'iron' ? '#9aa0aa' : '#a8865a');
      reveal(actor, p, 'smashes open'); revealStash(actor, p, 'among the pieces');
      if (exposeDoor(L, p)) showCard({ kind:'', title:'A door!', flair:'Behind the wreckage, a door no one was meant to see.' });
    }
    done(L, p, broke ? 'break' : 'shake'); return;
  }
  if (act === 'swing'){
    p.swung = true; f.propsV = (f.propsV || 0) + 1; sfx('grind');
    showCard({ kind:'', title:`The ${name} swings aside`, flair:'On hinges no one has oiled in years. Cold air breathes out of the dark behind it.' });
    log(`${who.name} swings the ${name} aside.`);
    done(L, p, 'swing'); return;
  }
}

// Search finds stashes in the furniture beside the searcher (called from actions.search with the roll's total).
export function searchStashes(actor, tot){
  const out = [];
  for (const p of state.floors[actor.floor]?.props || []){
    if (!p.stash || p.stash.found || !besideProp(actor, p)) continue;
    if (tot >= (p.stash.dc || 13)){ revealStash(actor, p, `Search ${tot}`); out.push(propName(p)); }
  }
  return out;
}
// The DM's edits from the prop card: lock DC, contents, a stash, repair.
export function editProp(L, id, field, value){
  const p = propById(L, id), f = state.floors[L]; if (!p) return;
  if (field === 'lock'){ const n = +value; if (n > 0) p.lock = n; else delete p.lock; }
  else if (field === 'contents'){ if (value) p.contents = String(value).slice(0, 400); else delete p.contents; delete p.searched; delete p.found; }
  else if (field === 'stash'){ if (value) p.stash = { dc:p.stash?.dc || 13, text:String(value).slice(0, 400), found:false }; else delete p.stash; }
  else if (field === 'stashDc'){ if (p.stash) p.stash.dc = +value || 13; }
  else if (field === 'repair'){ delete p.broken; delete p.hp; if (p.fallen){ p.x = p.fallen.ox; p.y = p.fallen.oy; delete p.fw; delete p.fh; delete p.fallen; } delete p.swung; delete p.open; f.propsV = (f.propsV || 0) + 1; buildFloor(L); }
  updateVision(); renderSel(); changed();
}
