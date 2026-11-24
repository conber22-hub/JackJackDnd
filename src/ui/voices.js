/* 🗣 ACTION VOICES — ChatGPT's engine/action-voices.js and audio/action-voices.js at the table. When a hero, a guard or
   a mob attacks, hits, misses, lands a critical, casts or heals, the planner (with its own cooldowns, so the table
   isn't drowned) picks a short line ("Come back to us" on Healing Word) or, for beasts and wordless things, a sound;
   it shows as a caption over the map, on the DM's screen and the players' (for a creature they can see). Speaking
   the lines aloud (the browser's own voice) and the sounds are opt-in per device: 🗣 in the palette cycles
   captions → spoken → off. The DM's device decides what is said; every device decides only whether it hears it. */
import { state, ui } from '../engine/state.js';
import { bus } from '../util/core.js';
import { newActionVoiceState, planActionVoice, actionVoiceForPlayers } from '../engine/action-voices.js';
import { playActionVoice } from '../audio/action-voices.js';
import { CREATURE_VOICES } from '../data/action-voices.js';
import { net, broadcast } from '../net/table.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';
import { voicePackFor } from '../game/voiceworkshop.js';

const KEY = 'dreaddelve.voices.v1';
let vs = newActionVoiceState(), seq = 0;
const mode = () => { try { return localStorage.getItem(KEY) || 'captions'; } catch { return 'captions'; } };
function caption(text){
  let el = document.getElementById('voiceCap');
  if (!el){ el = document.createElement('div'); el.id = 'voiceCap'; document.body.appendChild(el); }
  // (above what sits along the bottom: a hero's sheet on a phone, the fight bar, the dock; 96px up when nothing does)
  let top = innerHeight - 96;
  for (const id of ['selCard', 'wdFight', 'dock']){ const n = document.getElementById(id); if (!n || n.classList.contains('hidden') || !n.getClientRects().length) continue;
    const r = n.getBoundingClientRect(); if (r.width > 0 && r.bottom > innerHeight - 90 && r.top > innerHeight * .35) top = Math.min(top, r.top - 12); }
  const cap = document.getElementById('captions'); if (cap?.children.length){ const r = cap.getBoundingClientRect(); if (r.height > 0) top = Math.min(top, r.top - 8); }   // (and above the fight's captions: ui/captions.js)
  // (on the handheld: on its screen, under the dice at the top, not over the buttons on the body below it)
  const B = document.body, hhY = B.classList.contains('hh') ? parseFloat(getComputedStyle(B).getPropertyValue('--hh-scr-y')) : NaN;
  if (Number.isFinite(hhY)) top = hhY + 128;
  el.classList.toggle('hh', Number.isFinite(hhY));
  el.style.bottom = `${Math.round(innerHeight - top)}px`;
  el.textContent = text; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 3200);
}
function hear(cue){
  const m = mode(); if (!cue || m === 'off') return;
  playActionVoice(cue, { caption, speech:m === 'spoken', sounds:m === 'spoken' });
}
function onActed(e){
  if (ui.role !== 'dm' || !state || !e?.actor) return;
  const a = e.actor, actor = { id:a.id, publicName:a.name, kind:a.kind === 'pc' ? 'pc' : a.kind === 'npc' ? 'npc' : 'monster', bid:a.bid, role:a.role, ...(a.calling ? { calling:a.calling, path:a.path || null } : {}) };
  const pack = voicePackFor(a);   // the owner's approved lines (game/voiceworkshop.js), or the DM's
  const trigger = e.trigger === 'miss' && CREATURE_VOICES[a.bid] ? 'attack' : e.trigger;   // (a wolf that misses still growls)
  const r = planActionVoice(vs, { id:`${a.id}:${++seq}`, actor, trigger, action:String(e.action || '').replace(/ \(×.*\)$/, ''), targetPublicName:e.target?.name, shareable:!a.flags?.hidden },
    { now:performance.now(), pack });
  vs = r.state; if (!r.cue) return;
  hear(r.cue);
  const pub = actionVoiceForPlayers(r.cue, { sourceVisible:!a.flags?.hidden && !a.hidden });
  if (pub) try { broadcast({ t:'voice', cue:pub }); } catch {}
}

// 🔊 in the voice workshop: a line heard on this device, whatever the 🗣 setting (the player asked to hear it).
export function audition(cue){ playActionVoice(cue, { caption, speech:true, sounds:false }); }

let started = false;
export function ensureVoices(){
  if (started) return; started = true;
  const st = document.createElement('style');
  st.textContent = `#voiceCap{position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateY(8px);max-width:min(560px,90vw);padding:8px 16px;border-radius:999px;
    background:rgba(12,10,14,.82);color:#f3e6c8;font-family:var(--serif);font-style:italic;font-size:17px;text-align:center;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:30}
    #voiceCap.on{opacity:1;transform:translateX(-50%)}
    #voiceCap.hh{font-size:13px;padding:4px 12px;max-width:80vw}`;
  document.head.appendChild(st);
  bus.on('acted', onActed);
  net.onVoice = m => hear(m.cue);
  registerCommands([{ id:'voices', n:'Voices', hint:'Lines and sounds as heroes and creatures act: captions, spoken aloud, or off (this device)', icon:'🗣', role:'both',
    run:() => { const next = { captions:'spoken', spoken:'off', off:'captions' }[mode()]; try { localStorage.setItem(KEY, next); } catch {}
      toast(next === 'spoken' ? '🗣 Voices: spoken aloud (and captions).' : next === 'off' ? '🗣 Voices: off.' : '🗣 Voices: captions only.'); } }]);
}
