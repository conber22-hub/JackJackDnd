/* 💥 HOW HARD A BLOW LANDS — the numbers behind a blow felt on the map (render/punch.js draws it): how long the world
   holds its breath at the moment of impact (the hit-stop), how far the one struck is knocked back, how much the
   camera kicks, and what comes out of them. Pure, so it can be tested; no DOM, no Three.js.

   r: the share of the target's hit points the blow took (0..1; a player's screen gets it rounded, not the HP). */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* → { stop, slowMs, slowScale, knock, back, shake, kick, flash, screen }
     stop       ms the world freezes at impact (a heavy blow longer, a crit longer still, a killing blow longest)
     slowMs     ms of slow motion after the freeze (only a killing blow), at slowScale speed
     knock      tiles the one struck is knocked back; back: whether they come back (the dead don't)
     shake      how hard the camera shakes (0..1)
     kick       degrees the camera's view narrows for an instant (a punch-in)
     flash      ms the one struck flashes white
     screen     a full-screen flash: '' | 'crit' | 'kill' */
/*  last: the killing blow that ends the fight (the last foe standing, or the last hero): the world holds longer and
     runs slow for over a second, and the camera kicks harder, so a fight won lands like one */
export function impactOf({ r = 0, crit = false, kill = false, miss = false, last = false } = {}){
  if (miss) return { stop:0, slowMs:0, slowScale:1, knock:0, back:true, shake:0, kick:0, flash:0, screen:'' };
  const w = clamp(Number(r) || 0, 0, 1), heft = clamp(w * 2.2, 0, 1);   // half their hit points or more is as hard as it gets
  let stop = 40 + 70 * heft, knock = .1 + .22 * heft, shake = .15 + .35 * heft, kick = 1.8 + 3.2 * heft, flash = 70;
  if (crit){ stop += 55; knock *= 1.45; shake = Math.min(1, shake + .3); kick += 3.5; flash = 110; }
  if (kill){ stop = Math.max(stop, 120) + 30; knock = Math.max(knock, .34) + .08; shake = Math.min(1, shake + .2); kick += 4; flash = Math.max(flash, 100); }
  const end = kill && last; if (end){ stop += 70; kick += 2.5; shake = Math.min(1, shake + .15); }
  return { stop:Math.round(stop), slowMs:end ? 1150 : kill ? 420 : 0, slowScale:end ? .18 : kill ? .3 : 1, knock:+knock.toFixed(3), back:!kill,
    shake:+shake.toFixed(3), kick:+kick.toFixed(2), flash, screen:kill ? 'kill' : crit ? 'crit' : '', last:end };
}

/* The world's speed at `ms` after the impact: 0 while frozen, then slowScale through the slow motion, then 1. */
export function speedAt(ms, imp){
  if (!imp) return 1;
  if (ms < 0) return 1;
  if (ms < imp.stop) return 0;
  if (ms < imp.stop + (imp.slowMs || 0)){
    const k = (ms - imp.stop) / imp.slowMs;   // eases back up to full speed over its last third
    return k < 2 / 3 ? imp.slowScale : imp.slowScale + (1 - imp.slowScale) * ((k - 2 / 3) * 3);
  }
  return 1;
}

/* How a figure moves in a blow, 0..1 through it → the offset, in tiles, along the line of the blow.
     lunge  the attacker: winds back a touch, drives in to meet the impact (around .45), then settles back
     knock  the one struck: snaps back, then (if back) springs home with a little overshoot
     dodge  a miss: a quick step aside (sideways, the caller turns it) and back */
export function moveAt(kind, k, amp = 1, back = true){
  k = clamp(k, 0, 1);
  if (kind === 'lunge'){
    if (k < .18) return -.12 * amp * (k / .18);
    if (k < .45){ const u = (k - .18) / .27; return amp * (-.12 + 1.12 * (1 - (1 - u) * (1 - u))); }
    const u = (k - .45) / .55; return amp * (1 - u * u * (3 - 2 * u));
  }
  if (kind === 'knock'){
    const out = Math.min(1, k / .16), snap = 1 - (1 - out) * (1 - out) * (1 - out);
    if (k < .16 || !back) return amp * snap;
    const u = (k - .16) / .84; return amp * (1 - u) * (1 - u) * Math.cos(u * Math.PI * 1.5);   // home, a touch past, home
  }
  if (kind === 'dodge'){ return amp * Math.sin(k * Math.PI) * (k < .5 ? 1 : 1 - (k - .5) * .2); }
  return 0;
}

/* What comes out of a creature when it's struck: its blood, or what it has instead.
   tags: its tags (seep, undead…); name: its name, for the undead and the bodiless the tags don't say. */
/* death: how it dies (render/deathfx.js) — 'fall' (it drops, and a pool spreads under it) · 'melt' (it bursts and sinks
   into a puddle: the Seep) · 'crumble' (it falls apart into dust: the walking dead) · 'fade' (it rises into light and is
   gone: the bodiless) · 'scatter' (it breaks up and flies apart: a swarm) · 'burn' (straw: it goes up in sparks). A hero
   only ever falls. */
export function bloodOf({ tags = [], name = '', kind = '' } = {}){
  const tg = new Set(tags || []), n = String(name || '').toLowerCase(), hero = kind === 'pc' || kind === 'npc';
  if (tg.has('seep') || /seep|husk|bloom|undertow|budding/.test(n)) return { color:'#4f6b1e', spark:'#c6ff5a', splat:true, death:hero ? 'fall' : 'melt' };   // black-green rot
  if (/ghost|wraith|specter|spectre|shadow|mist|banshee|wisp|spirit|will-o/.test(n)) return { color:'#9fb8d8', spark:'#e6f2ff', splat:false, death:hero ? 'fall' : 'fade' };   // nothing to spill: a cold light
  if (tg.has('undead') || /skeleton|zombie|mummy|lich|bone|corpse|revenant|ghoul|wight/.test(n)) return { color:'#8a8072', spark:'#efe6d2', splat:false, death:hero ? 'fall' : 'crumble' };   // dust and chips of bone
  if (/scarecrow|straw/.test(n)) return { color:'#b89a52', spark:'#ffe2a0', splat:false, death:hero ? 'fall' : 'burn' };   // straw
  if (/hands?-swarm|swarm of/.test(n)) return { color:'#6a1018', spark:'#ffd0b0', splat:true, death:hero ? 'fall' : 'scatter' };
  return { color:'#7a0c14', spark:kind === 'pc' ? '#ffd0a0' : '#ffe2c0', splat:true, death:'fall' };
}

/* A player's screen gets the share of hit points a blow took, rounded to an eighth, never the HP themselves. */
export const shareOf = (n, maxHp) => maxHp > 0 ? Math.round(clamp(n / maxHp, 0, 1) * 8) / 8 : 0;

/* Whether `t`, just fallen, was the last of its side still up: `others` are the rest of the fight (tokens), a side being
   the monsters or everyone else. The gone, the dead (unless rising again) and those at 0 hit points don't count. */
export function lastOfSide(t, others = []){
  if (!t) return false; const foe = t.kind === 'monster';
  return !others.some(o => o && o.id !== t.id && (o.kind === 'monster') === foe && !o.flags?.gone && (o.flags?.rising || (!o.dead && o.hp > 0)));
}

/* Where on the screen a blow came from, as an angle round its middle (degrees, 0 at the top, clockwise): `x` and `z` are
   the attacker's place in the camera's own space (x to the right, z towards the viewer), so a foe straight ahead is at
   the top, one behind at the bottom. render/punch.js draws a red arc at that angle (hitDir). */
export function arcAngle(x, z){
  if (!x && !z) return 0;
  const a = Math.atan2(x, -z) * 180 / Math.PI;
  return Math.round(((a % 360) + 360) % 360);
}
