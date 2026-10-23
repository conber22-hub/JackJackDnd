/* GAME NIGHT — the DM's side of playing in person (the Night tab). Drives the table screen on the TV
   (ui/screen.js): opens it, says what it shows (the map following the action, lights out, a read-aloud, a face
   and a name, a handout, a turn timer), and points its camera. Also: real dice — players roll their own d20s
   and the app takes the number (combat.doAttack's d20 option, the request queue, the die prompt). */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { camera, controls } from '../render/scene.js';
import { toScreens, screens, sendToSeat, inviteLink, net } from '../net/table.js';
import { setStage, portrait, portraitOfObject } from '../render/forge/studio.js';
import { buildFigure, forgeLook } from '../render/minis.js';
import { toast } from '../ui/hud.js';
import { changed } from './session.js';

// What the screen is showing, so a screen that (re)connects shows the same.
const N = { mode:'map', follow:true, timer:0, over:null };
export const nightNow = () => [{ t:'scMode', mode:N.mode }, { t:'scFollow', on:N.follow }, { t:'timer', secs:N.timer }, ...(N.over ? [N.over] : [])];   // main.js hands this to net/table.js
export const nightState = () => N;

export function openScreenWindow(){
  // noopener: the screen gets its own process, so drawing the TV never slows the DM's window (it still hears
  // this one over the BroadcastChannel)
  window.open(location.pathname + '?screen', '_blank', 'noopener,popup=yes,width=1280,height=720');
  toast('Drag the new window onto the TV, then press ⛶ in its corner. (Nothing opened? Allow pop-ups for this page.)');
}
export const screenLink = code => { const u = new URL(location.href.split('#')[0].split('?')[0]); u.searchParams.set('screen', code); return u.toString(); };

const over = m => { N.over = m.off ? null : m; toScreens(m); changed(); };
export function narrate(title, text){ if (!String(text || '').trim()) { toast('Nothing to read yet.'); return; } over({ t:'narrate', title, text }); }
export function clearScreen(){ over({ t:'narrate', off:true }); }
// The join card: the table's code and the invite as a QR, big on the TV, for players to scan as they sit down.
export function showJoin(){ if (!net.code){ toast('Open the table first (Table tab).'); return; } over({ t:'joinCard', code:net.code, url:inviteLink() }); }
export function toggleQr(){ N.qr = !N.qr; changed(); }
export function setMode(mode){ N.mode = mode; if (mode !== 'dark') N.over = null; toScreens({ t:'scMode', mode }); changed(); }
export function setFollow(on){ N.follow = on; toScreens({ t:'scFollow', on }); changed(); }
export function setTimer(secs){ N.timer = secs; toScreens({ t:'timer', secs }); changed(); }
// Send the DM's own camera to the screen (it holds there for a while, then goes back to following).
export function sendLook(){ toScreens({ t:'look', floor:ui.floor, target:controls.target.toArray(), pos:camera.position.toArray() }); toast('The screen looks where you are looking.'); }

// A face for anyone: their art, else their forged portrait, else a portrait of their mini as it stands on the map.
export function faceOf(t){
  let img = state.art?.[t.id] || state.art?.[t.bid] || null;
  const fl = !img && (t.look || forgeLook(t));   // a forged figure: head and shoulders
  if (fl){ try { setStage([fl]); img = portrait({ size:512 }); } catch { img = null; } }
  if (!img){ try { const g = buildFigure({ ...t, dead:false }); g.children.slice(0, 2).forEach(o => g.remove(o)); img = portraitOfObject(g); } catch { img = null; } }   // without its base ring
  return img;
}
// Introduce someone: their face, their name, and a line.
export function introduce(id, line = ''){
  const t = tokById(id); if (!t) return;
  over({ t:'intro', name:t.name, line:String(line || '').trim(), img:faceOf(t) });
}

/* A note for one player's eyes (passed across the table): it buzzes their phone and waits there to be read.
   strahd: it's his voice, not the DM's. tell: the TV shows that a note was passed (not what it says). */
export function passNote(id, text, { strahd = false, tell = false } = {}){
  const t = tokById(id), msg = String(text || '').trim(); if (!t || !msg){ toast('Pick a hero and write the note.'); return; }
  if (!Object.values(state.seats || {}).includes(id)){ toast(`${t.name} has no phone at this table — you'll have to whisper it.`); return; }
  sendToSeat(id, { t:'note', text:msg.slice(0, 1200), strahd:!!strahd });
  if (tell) toScreens({ t:'notePassed', name:t.name, strahd:!!strahd });
  log(`🤫 A note to ${t.name}: ${msg}`, true);
  toast(`Note passed to ${t.name}.`);
}

/* Previously on…: the evening's story so far, from the public log (finds, fights won, places reached, what fell),
   for the DM to trim and put on the TV at the start of the next session. */
const STORY = /finds|reaches|sets out|arrives|fight is won|is destroyed|is taken by|falls through|joins the party|enters the story|Strahd's Gaze \d|Whim d\d+ =|smashes|topples|swings the|secret door|make camp|disarms|unlocks|forces open|searches the|opens the|CRITICAL|holds back|gets back up|seeded/i;
export function recapText(max = 12){
  const lines = (state.log || []).filter(l => !l.dm && STORY.test(l.m)).map(l => l.m.replace(/^[^\p{L}\p{N}]+/u, '').trim());
  const seen = new Set(), out = [];
  for (const m of lines.reverse()){ if (seen.has(m)) continue; seen.add(m); out.unshift(m); if (out.length >= max) break; }
  return out.join('\n');
}
// A picture for the table: scaled down to travel light. → a promise
export function showHandout(file, title = ''){
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
        cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        const h = { title:title || file.name.replace(/\.[^.]+$/, ''), img:cv.toDataURL('image/jpeg', .86) };
        (ui.handouts ||= []).unshift(h); ui.handouts = ui.handouts.slice(0, 8);
        over({ t:'handout', ...h }); res(h);
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
export const reshowHandout = i => { const h = ui.handouts?.[i]; if (h) over({ t:'handout', ...h }); };
// The room the party's leader is standing in, for "read this room".
export function partyRoom(){
  const lead = state.tokens.find(t => t.kind === 'pc' && !t.dead && !t.flags?.gone); if (!lead) return null;
  const f = state.floors[lead.floor]; return (f.rooms || []).find(r => lead.x >= r.x && lead.x < r.x + r.w && lead.y >= r.y && lead.y < r.y + r.h) || null;
}
// Who's here to introduce: NPCs and creatures on this floor the party can see (named ones first).
export const introducible = () => state.tokens.filter(t => t.floor === ui.floor && !t.flags?.gone && t.kind !== 'pc').sort((a, b) => (a.kind === 'npc' ? 0 : 1) - (b.kind === 'npc' ? 0 : 1) || a.name.localeCompare(b.name));
export const screenCount = () => screens().length;

/* Real dice: a d20 typed in by the DM (or sent by a player) instead of rolled. The prompt: twenty big buttons
   and "roll it for them". cb(n) with n = 1–20, or null to roll. */
export function askD20(title, cb){
  const box = $('#dieBox'); if (!box){ cb(null); return; }
  box.innerHTML = `<h3>🎲 ${esc(title)}</h3><div class="muted">What did they roll on the d20? (After advantage or disadvantage: the die they kept.)</div>
    <div class="d20grid">${Array.from({ length:20 }, (_, i) => `<button class="btn ${i === 19 ? 'primary' : i === 0 ? 'danger' : ''}" data-die="${i + 1}">${i + 1}</button>`).join('')}</div>
    <div class="row"><button class="btn" data-die="roll">🎲 Roll it for them</button><button class="btn" data-die="cancel">Cancel</button></div>`;
  $('#dieModal').classList.remove('hidden');
  box.onclick = e => { const b = e.target.closest('[data-die]'); if (!b) return; $('#dieModal').classList.add('hidden'); box.onclick = null;
    if (b.dataset.die === 'cancel') return; cb(b.dataset.die === 'roll' ? null : +b.dataset.die); };
}
export const realDice = () => !!state?.campaign?.realDice;
