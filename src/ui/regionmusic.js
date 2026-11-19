/* 🎼 REGION MUSIC — each part of the valley has its own little loop (ChatGPT's data/region-music.js and
   engine/region-music.js: which loop where, how one hands over to the next, a darker turn as the Gaze rises), played
   by audio/sound.js loopTune. The Wanderer's frame calls musicTick about once a second: the village by day and by
   night, the road and the road after dark, the woods, Vallaki, Krezk, the Vistani camp, a church, a tavern, a crypt,
   the Mists. A fight has its own (ChatGPT's engine/battle-music.js: a skirmish, a clash, peril, a last stand, the
   Count's court, the Seep), changing as the fight turns, and a short phrase when it's won or lost, then the region's
   loop comes back; leaving the Wanderer stops it. Only with the music on (the sound settings) and the handheld's
   chiptunes on. */
import { state, tokById } from '../engine/state.js';
import { regionLoop, handover, variantFor } from '../engine/region-music.js';
import { events, duration } from '../engine/chiptune.js';
import { LOOPS } from '../data/region-music.js';
import { loopTune, playMusic } from '../audio/sound.js';
import { battleLoop, shouldChange } from '../engine/battle-music.js';
import { FIGHT_LOOPS, STINGS } from '../data/battle-music.js';
import { BEST } from '../data/bestiary.js';
import { gfx } from '../render/gfx.js';
import { mistWanted } from '../render/groundfog.js';
import { valley } from '../game/overworld.js';
import { kindOf } from '../game/finds.js';
import { hh } from './handheld.js';

const now = { id:null, gaze:0, loop:null, timer:null, fight:null };   // fight: { id, at, bar, order } while a fight's loop plays

/* ---------- 🥁 the fight's music ---------- */
// the fight as the loop chooser reads it: the heroes' and the foes' hit points, the foes' strength and what they are
function fightNow(){
  const all = (state.combat.order || []).map(tokById).filter(Boolean);
  return { round:state.combat.round || 1,
    heroes:all.filter(t => t.kind !== 'monster').map(t => ({ hp:t.hp, maxHp:t.maxHp, down:!!t.dead || t.hp <= 0 })),
    foes:all.filter(t => t.kind === 'monster' && !t.flags?.gone).map(t => ({ hp:t.hp, maxHp:t.maxHp, down:!!t.dead, cr:BEST[t.bid]?.cr ?? 1, tags:BEST[t.bid]?.tags || [], court:!!t.nem })) };
}
function startFight(id, tempo, fadeIn){
  const song = FIGHT_LOOPS.find(s => s.id === id); if (!song) return null;
  const len = song.bars * song.beatsPerBar * 60 / (song.bpm * tempo);
  now.fight = { id, at:performance.now(), bar:len / song.bars, order:[...(state.combat.order || [])] };
  const loop = loopTune(events(song, { tempo }), len, { fadeIn, gain:.3 });
  if (!loop) now.fight = null;   // (the sound isn't running yet: try again on the next tick)
  return loop;
}
function fightTick(){
  const want = battleLoop(fightNow()), f = now.fight;
  if (f && f.id === want.id) return true;
  const bars = f ? (performance.now() - f.at) / 1000 / f.bar : 0;
  if (f && !shouldChange(f.id, want.id, { barsPlayed:bars })) return true;
  clearTimeout(now.timer); now.timer = null;
  now.loop?.stop(f ? .8 : .5); now.id = `fight:${want.id}`;
  now.loop = startFight(want.id, want.tempo, f ? .8 : 1.2);
  return true;
}
// the fight is over: won, or every hero in it down: its phrase, then (after it) the region's loop as usual
function fightOver(){
  const f = now.fight; now.fight = null; if (!f) return;
  const heroes = f.order.map(tokById).filter(t => t && t.kind !== 'monster'), fell = heroes.length && heroes.every(t => t.dead || t.hp <= 0);
  now.loop?.stop(.6); now.loop = null; now.id = null;
  const sting = STINGS.find(s => s.id === (fell ? 'fell' : 'won'));
  if (sting){ try { playMusic(events(sting)); } catch {} now.quietUntil = performance.now() + duration(sting) * 1000 + 600; lastSting = sting.id; }
}
let lastSting = null;
export const fightMusicNow = () => ({ fight:now.fight?.id || null, sting:lastSting, wanted:state?.combat?.active ? battleLoop(fightNow()).id : null });
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
  const on = gfx.music && hh.chip !== false;
  if (on && h && state.combat.active){ fightTick(); return; }   // 🥁 a fight: its own music
  if (now.fight) fightOver();
  if (now.quietUntil && performance.now() < now.quietUntil) return;   // (the fight's last phrase plays out first)
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
export function musicStop(fade = 1.5){ clearTimeout(now.timer); now.loop?.stop(fade); Object.assign(now, { id:null, loop:null, timer:null, fight:null }); }
export const musicNow = () => now.id;   // (for the browser tests: which loop is playing)
