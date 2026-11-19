/* 💬 FIGHT CAPTIONS: a short, readable line for each thing that happens in a fight, the way a good game subtitles
   its combat — for a player who can't hear the sounds, who has the calm effects on, or who simply looked away for a
   second. It only listens to the fight bus (util/core.js) and reads: no messages, no state changes. The hosts
   (main.js, ui/look.js) call startCaptions() once and bind the Captions checkbox — see the PR. */
import { bus, esc } from '../util/core.js';
import { state, ui, tokById } from '../engine/state.js';
import { hasLook, lookFor } from '../engine/spell-looks.js';
import { heftFor } from '../engine/weapon-heft.js';

const KEY = 'dreaddelve.captions.v1';
const MAX = 3;          // lines on screen at once; a new one pushes the oldest off
const HOLD_MS = 3000;   // how long a line holds before it fades out
const FADE_MS = 500;    // the fade out
const GROUP_MS = 700;   // how long one spell's hurts (or one heal's targets) gather into one line
const BLOW_MS = 1000;   // a hurt that soon after its blow, for the same, is the blow itself
const KEEP = 30;        // lines remembered for captionLines(), newest last

let wired = false, on = null, el = null;
const history = [];     // texts, newest last
let group = null, healGroup = null, lastBlow = null;

/* ---------- on or off ---------- */
export function captionsOn(){
  if (on === null){
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    if (saved === '1') on = true;
    else if (saved === '0') on = false;
    // off by default; on in the Wanderer when the device asks for reduced motion
    else on = !!state?.campaign?.wander && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return on;
}
export function setCaptions(v){
  on = !!v;
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {}
  if (!on && el) el.replaceChildren();   // off: the stack goes at once
}
export function captionLines(){ return history.slice(); }

/* ---------- who is who, from the player's side ---------- */
const isMine = id => !!id && (id === ui.myToken || id === state?.campaign?.wander?.heroTok);
// a creature as the captions say it: heroes by name, a beast as "the wolf" (a named foe of the Count's court keeps
// its own name — "the strahd" would be wrong)
const theName = t => !t ? 'Something' : (t.kind === 'monster' && !t.nem ? `the ${t.name.toLowerCase()}` : t.name);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const subj = t => theName(t);                       // the one acting: always named ("Vasha hits the wolf")
const obj = t => isMine(t?.id) ? 'you' : theName(t); // the one it's done to: "you" when it's the player's hero
const joinNames = ts => ts.map((t, i) => (i === ts.length - 1 && ts.length > 1 ? 'and ' : '') + obj(t)).join(ts.length > 2 ? ', ' : ' ');

// a blow's verb: a beast's attack is already a verb ("Bite" bites, "Claw" claws); a hero's weapon is a noun, so a
// hero just hits. A many-word attack ("Spine Volley") falls back to hits too.
const blowVerb = (actor, action) => {
  if (actor?.kind !== 'monster' || !action) return 'hits';
  const w = String(action).replace(/\(.*\)/, '').trim();
  if (!/\s/.test(w) && /^[A-Za-z]+$/.test(w)){ const l = w.toLowerCase(); return /(s|x|ch|sh)$/.test(l) ? `${l}es` : `${l}s`; }
  return 'hits';
};

// what a kind of damage does to someone: the verb, in the third person and as "you" hear it
const VERBS = {
  fire:['burns', 'burn'], cold:['freezes', 'freeze'], lightning:['is shocked', 'are shocked'],
  thunder:['is shaken', 'are shaken'], force:['is blasted', 'are blasted'], acid:['is burned', 'are burned'],
  poison:['is poisoned', 'are poisoned'], necrotic:['withers', 'wither'], radiant:['is seared', 'are seared'],
  psychic:['is rattled', 'are rattled'],
};
const verbFor = (t, type) => { const v = VERBS[type] || null; return v ? (isMine(t?.id) ? v[1] : v[0]) : null; };
// a hurt line for one creature: "The wolf burns for 9." · "You are shocked for 9." · "The wolf takes 5."
const hurtLine = (t, n, type) => {
  const v = verbFor(t, type);
  return v ? `${cap(obj(t))} ${v} for ${n}.` : `${cap(obj(t))} take${isMine(t?.id) ? '' : 's'} ${n}.`;
};

/* ---------- the stack ---------- */
function ensureStyle(){
  if (document.getElementById('captionsStyle')) return;
  const s = document.createElement('style'); s.id = 'captionsStyle';
  s.textContent = `#captions{position:fixed;z-index:41;pointer-events:none;display:flex;flex-direction:column;gap:4px;
  max-width:min(560px,calc(100vw - 24px));box-sizing:border-box}
#captions .cap-line{display:flex;gap:6px;align-items:baseline;width:fit-content;max-width:100%;padding:5px 10px;border-radius:9px;
  background:var(--glass-strong);border:1px solid var(--line);box-shadow:var(--spec),0 8px 24px rgba(0,0,0,.45);
  color:var(--ink);font:13px/1.4 var(--ui);transition:opacity .3s var(--ease)}
#captions .cap-line.out{opacity:0}
#captions .cap-line .cap-ic{flex:0 0 auto}
#captions .cap-line.gold{color:var(--gold-hi);border-color:var(--gold-line)}
#captions .cap-line.red{color:#ffb3ad;border-color:rgba(194,58,70,.55)}
#captions .cap-line .cap-sub{display:block;font-size:11.5px;font-style:italic;color:var(--dim)}
@media (prefers-reduced-motion: reduce){#captions .cap-line{transition:none}}`;
  document.head.appendChild(s);
}
function ensureEl(){
  ensureStyle();
  if (el) return;
  el = document.createElement('div'); el.id = 'captions'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);
  window.addEventListener('resize', place);
}
// low on the screen, clear of the fight bar, the turn order and the cards: in the Wanderer just above #wdFight
// (wherever it sits — desktop, or the handheld's screen); elsewhere bottom-left, clear of #dock.
function place(){
  if (!el) return;
  const fight = document.getElementById('wdFight');
  if (fight && !fight.classList.contains('hidden')){
    const r = fight.getBoundingClientRect();
    if (r.width > 0){ el.style.left = `${r.left + r.width / 2}px`; el.style.transform = 'translateX(-50%)';
      el.style.bottom = `${window.innerHeight - r.top + 10}px`; el.style.alignItems = 'center'; return; }
  }
  // (Claude) above whatever sits along the bottom on the left: the dock, or a player's hero sheet on a phone at the table
  let top = Infinity;
  for (const id of ['dock', 'selCard']){
    const n = document.getElementById(id); if (!n || !n.getClientRects().length || n.classList.contains('hidden')) continue;   // (a fixed panel has no offsetParent)
    const r = n.getBoundingClientRect();
    if (r.width > 0 && r.left < 200 && r.bottom > window.innerHeight - 90 && r.top < window.innerHeight - 40) top = Math.min(top, r.top);
  }
  if (top < Infinity){
    el.style.left = '12px'; el.style.transform = 'none'; el.style.bottom = `${window.innerHeight - top + 10}px`;
    el.style.alignItems = 'flex-start'; return; }
  el.style.left = '12px'; el.style.transform = 'none'; el.style.bottom = '16px'; el.style.alignItems = 'flex-start';
}
// one line: on screen at full strength at once, holding about three seconds, then out and gone. It used to
// fade in from opacity 0 on a CSS transition — but on this box the transition never advances (a diagnostic
// read every live line at opacity 0 for twenty seconds, class "in" and all, while the phone's faster
// compositor showed them fine), so the lines were in the DOM and never seen. A line that appears is worth
// more than a fade that doesn't run; the fade out stays, best effort — if the transition stalls there the
// line simply vanishes at the end of its hold, after being fully readable. Timers, not frames (round 13).
function show(text, tone = '', icon = '', sub = ''){
  if (!captionsOn()) return;
  history.push(text); if (history.length > KEEP) history.shift();
  ensureEl(); place();
  const line = document.createElement('div');
  line.className = `cap-line${tone ? ` ${tone}` : ''}`;
  line.innerHTML = `${icon ? `<span class="cap-ic" aria-hidden="true">${icon}</span>` : ''}<span>${esc(text)}${sub ? `<span class="cap-sub">${esc(sub)}</span>` : ''}</span>`;
  el.appendChild(line);
  while (el.children.length > MAX) el.firstChild.remove();
  setTimeout(() => line.classList.add('out'), HOLD_MS);
  setTimeout(() => line.remove(), HOLD_MS + FADE_MS);
}

/* ---------- one spell's hurts, one line ---------- */
function flushSpell(){
  if (!group) return; const g = group; group = null;
  if (!g.targets.length) return;
  if (g.targets.length === 1){
    const [t, n] = g.targets[0];
    show(hurtLine(t, n, g.type), isMine(t?.id) ? 'red' : '', VERBS[g.type] ? '✦' : '');
  } else {
    const v = VERBS[g.type];
    show(v ? `The ${g.name} ${v[0]} ${joinNames(g.targets.map(([t]) => t))}.`
           : `The ${g.name} hits ${joinNames(g.targets.map(([t]) => t))}.`, '', '✦');
  }
}
function flushHeal(){
  if (!healGroup) return; const g = healGroup; healGroup = null;
  if (!g.targets.length) return;
  const caster = theName(g.caster), gold = g.targets.some(([t]) => isMine(t?.id)) ? 'gold' : '';
  if (g.targets.length === 1){
    const [t, n] = g.targets[0];
    show(g.caster.id === t.id ? `${cap(caster)} heals for ${n}.` : `${cap(caster)} heals ${obj(t)} for ${n}.`, gold, '✚');
  } else show(`${cap(caster)} heals ${joinNames(g.targets.map(([t]) => t))}.`, gold, '✚');
}

// (Claude) what a critical blow felt like, in a few words (ChatGPT's engine/weapon-heft.js), under its line
const heftWords = (n, t) => { try { return heftFor({ n, t }).words || ''; } catch { return ''; } };
// what a spell looks like, in a few words (ChatGPT's engine/spell-looks.js), under the line that names it
const spellWords = name => { try { return hasLook(name) ? lookFor({ n:name }).words || '' : ''; } catch { return ''; } };

/* ---------- the fight, as it passes through the bus ---------- */
function onActed(e){
  const a = e?.actor, tg = e?.target;
  if (e?.trigger === 'hit' || e?.trigger === 'critical'){
    if (!a || !tg) return;
    lastBlow = { target:tg.id, n:e.dmg || 0, at:Date.now() };
    const crit = e.trigger === 'critical';
    const text = `${cap(subj(a))} ${blowVerb(a, e.action)} ${obj(tg)}${e.dmg > 0 ? ` for ${e.dmg}` : ''}.`;
    show(crit ? `A critical! ${text}` : text, isMine(tg.id) ? 'red' : (crit && isMine(a.id) ? 'gold' : ''), '⚔', crit && !e.spell ? heftWords(e.action, e.dmgType) : '');
  } else if (e?.trigger === 'miss'){
    if (!a || !tg) return;
    if (e.block) show(isMine(tg.id) ? `You block ${theName(a)}.` : `${cap(obj(tg))} blocks ${isMine(a.id) ? 'you' : theName(a)}.`, isMine(tg.id) ? 'gold' : '', '🛡');
    else if (e.die?.n === 1) show(`${cap(subj(a))} fumbles, and misses ${obj(tg)}.`, isMine(a.id) ? 'red' : isMine(tg.id) ? 'gold' : '', '🙃');
    else show(`${cap(subj(a))} misses ${obj(tg)}.`, '', '🎯');
  } else if (e?.trigger === 'spell'){
    if (!a || !e.action) return;
    show(`${cap(subj(a))} casts ${e.action}.`, '', '✦', spellWords(e.action));
    if (group) flushSpell();
    group = { caster:a, name:e.action, type:null, targets:[], timer:setTimeout(flushSpell, GROUP_MS) };
  } else if (e?.trigger === 'heal'){
    if (!a || !e.action) return;
    show(`${cap(subj(a))} casts ${e.action}.`, '', '✦', spellWords(e.action));
    if (healGroup) flushHeal();
    healGroup = { caster:a, targets:[], timer:setTimeout(flushHeal, GROUP_MS) };
  }
  // 'down' and 'hurt' are a voice's lines (ui/voices.js): the hurt below already says them.
}
function onHurt(e){
  const t = e?.t; if (!t || !e.n) return;
  if (t.dead || t.hp <= 0){   // a kill, or a hero down — its own line, over the blow that did it
    if (group && e.by === group.caster?.id) group.targets.push([t, e.n]);
    show(t.kind === 'monster' ? `${cap(theName(t))} falls.`
      : isMine(t.id) ? 'You are down!' : `${t.name} is down!`,
      t.kind === 'monster' ? (isMine(e.by) ? 'gold' : '') : 'red', '☠');
    return;
  }
  if (group && e.by === group.caster?.id){   // one of a spell's hurts: gathered, not said one by one
    if (!group.type) group.type = e.type || null;
    group.targets.push([t, e.n]); return;
  }
  // (Claude) a foe taken to half its hit points: said once, after the blow
  if (e.bloodied && t.kind === 'monster') setTimeout(() => show(`${cap(theName(t))} is bloodied.`, isMine(e.by) ? 'gold' : '', '🩸'), 250);
  if (lastBlow && t.id === lastBlow.target && e.n === lastBlow.n && Date.now() - lastBlow.at < BLOW_MS) return;
  show(hurtLine(t, e.n, e.type), isMine(t?.id) ? 'red' : '', VERBS[e.type] ? '✦' : '');
}
function onHealed(e){
  const t = e?.t; if (!t || !e.n) return;
  if (healGroup){ healGroup.targets.push([t, e.n]); return; }
  show(isMine(t.id) ? `You recover ${e.n}.` : `${cap(theName(t))} recovers ${e.n}.`,
    isMine(t.id) ? 'gold' : '', '✚');
}
const ACT_VERBS = { dash:'dashes', dodge:'dodges', disengage:'disengages', stand:'stands up' };
const COND_WORDS = { prone:'knocked prone' };   // the rest say themselves: frightened, poisoned, restrained…

const HANDLERS = {
  acted:onActed, hurt:onHurt, healed:onHealed,
  turnAct:e => { const t = e?.t; if (!t) return; show(`${cap(subj(t))} ${ACT_VERBS[e.k] || 'acts'}.`); },
  feature:e => { const t = e?.t; if (!t) return;
    show(e.id === 'rage' ? `${cap(subj(t))} rages.` : `${cap(subj(t))} uses ${e.n || 'a feature'}.`); },
  cond:e => { const t = e?.t; if (!t || !e.n) return; const w = COND_WORDS[e.n] || e.n;
    show(isMine(t.id) ? `You are ${w}.` : `${cap(theName(t))} is ${w}.`, isMine(t.id) ? 'red' : ''); },
  turnStart:e => { const t = e?.t; if (!t || t.dead) return;
    show(isMine(t.id) ? 'Your turn.' : `${cap(theName(t))}'s turn.`, isMine(t.id) ? 'gold' : '', isMine(t.id) ? '★' : ''); },
  // (Claude) 🤚 a shove (game/combat.js): its outcome; knocked prone says itself as a condition
  shove:e => { const a = e?.actor, tg = e?.target; if (!a || !tg || e.out === 'prone') return;
    show(e.out === 'pushed' ? `${cap(subj(a))} shoves ${obj(tg)} back.` : e.out === 'resisted' ? `${cap(obj(tg))} ${isMine(tg.id) ? 'stand' : 'stands'} firm against ${isMine(a.id) ? 'you' : theName(a)}.` : `${cap(subj(a))} shoves ${obj(tg)}, who staggers.`,
      isMine(tg.id) ? 'red' : isMine(a.id) && e.out !== 'resisted' ? 'gold' : '', '🤚'); },
  aims:e => { const by = tokById(e?.by), at = tokById(e?.at); if (!by || !at) return;
    show(`${cap(subj(by))} goes for ${obj(at)}!`, isMine(at.id) ? 'red' : '', '🎯'); },
};
export const CAPTION_EVENTS = Object.keys(HANDLERS);
export function startCaptions(){
  if (wired) return; wired = true;
  for (const [k, fn] of Object.entries(HANDLERS)) bus.on(k, fn);
  bus.on('state', () => { if (el?.children.length) setTimeout(place, 0); });   // (a phone's sheet can grow with a new state: keep clear of it)
}
/* 📱 (Claude) a player's phone at the table: the fight's events don't fire there, so the DM's app sends each one, by
   ids (net/table.js 'cap'), and the phone says it from its own player's side ("you" is their hero). */
export function feedCaption(k, e){ try { HANDLERS[k]?.(e); } catch {} }
