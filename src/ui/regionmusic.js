/* 🎼 REGION MUSIC — each part of the valley has its own little loop (ChatGPT's data/region-music.js and
   engine/region-music.js: which loop where, how one hands over to the next, a darker turn as the Gaze rises), played
   by audio/sound.js loopTune. The Wanderer's frame calls musicTick about once a second: the village by day and by
   night, the road and the road after dark, the woods, Vallaki, Krezk, the Vistani camp, a church, a tavern, a crypt,
   the Mists. A fight hushes it (the fight has its own sounds); leaving the Wanderer stops it. Only with the music on
   (the sound settings) and the handheld's chiptunes on. */
import { state } from '../engine/state.js';
import { regionLoop, handover, variantFor } from '../engine/region-music.js';
import { events, duration } from '../engine/chiptune.js';
import { LOOPS } from '../data/region-music.js';
import { loopTune } from '../audio/sound.js';
import { gfx } from '../render/gfx.js';
import { mistWanted } from '../render/groundfog.js';
import { valley } from '../game/overworld.js';
import { kindOf } from '../game/finds.js';
import { hh } from './handheld.js';

const now = { id:null, gaze:0, loop:null, timer:null };
// Where the hero is, as the loop chooser reads it
function where(h){
  const v = valley(), journey = !!v.journey, tpl = state.meta.template, f = state.floors[h.floor];
  const inside = tpl === 'interior' ? (state.meta.interior?.kind || 'house') : null;
  const room = (f?.rooms || []).filter(r => h.x >= r.x && h.x < r.x + r.w && h.y >= r.y && h.y < r.y + r.h).sort((a, b) => a.w * a.h - b.w * b.h)[0];
  const kind = journey ? 'road' : kindOf(h.floor);
  let mist = false; try { mist = mistWanted() >= .45; } catch {}
  return { place:journey ? null : v.at, kind, inside, room:room?.name || '', hour:v.hour ?? 12, fight:!!state.combat.active, mist };
}
// The loop for where the hero is (whatever the sound settings), and the one wanted now (or null: quiet)
export function loopFor(h){ if (!h) return null; try { return regionLoop(where(h)); } catch (e){ console.warn(e); return null; } }
export const wantedLoop = h => !gfx.music || hh.chip === false ? null : loopFor(h);
function start(id, fadeIn){
  const song = LOOPS.find(s => s.id === id); if (!song) return null;
  const v = variantFor(id, { gaze:state.dread || 1 });
  // (a loop is its bars long, trailing rests and all: the next pass comes in on the beat)
  const bars = song.bars && song.beatsPerBar ? song.bars * song.beatsPerBar * 60 / (song.bpm * v.tempo) : 0;
  return loopTune(events(song, v), bars || duration(song, v), { fadeIn });
}
// About once a second: if the loop wanted has changed, hand over (the old one fades out, the new one fades in)
export function musicTick(h){
  const id = wantedLoop(h), gaze = state.dread || 1;
  if (id === now.id && (!id || now.loop || now.timer)){ now.gaze = gaze; return; }   // (the same loop, or about to start: the Gaze tells on the next region)
  let hand = { out:.6, in:3, gap:0 };
  try { hand = handover(now.loop ? now.id : null, id) || hand; } catch {}
  clearTimeout(now.timer); now.timer = null;
  now.loop?.stop(hand.out); now.loop = null;
  now.id = id; now.gaze = gaze;
  if (!id) return;
  const go = () => { now.timer = null; if (now.id === id && !now.loop) now.loop = start(id, hand.in); };
  // (a gap: the old one finishes fading, a breath, then the new one; none: the two fades cross)
  if (hand.gap > 0) now.timer = setTimeout(go, (hand.out + hand.gap) * 1000); else go();
}
export function musicStop(fade = 1.5){ clearTimeout(now.timer); now.loop?.stop(fade); Object.assign(now, { id:null, loop:null, timer:null }); }
export const musicNow = () => now.id;   // (for the browser tests: which loop is playing)
