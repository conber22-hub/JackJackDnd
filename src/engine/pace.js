/* ⏩ HOW FAST A FIGHT RUNS — the waits between turns in the Wanderer (game/wander.js fightTick), by the player's choice
   of pace (🎨 Look → Fights → Fight pace, per device: render/gfx.js gfx.pace). Pure.
     wind    ms a foe shows who it's going for (the red arrow) before it acts
     after   ms from the start of a turn before the next one may begin
     settle  ms after the last figure stopped moving before the next turn begins
     down    ms a fallen hero's turn waits before it passes
   The blow that ends a fight keeps its own slow motion whatever the pace (render/punch.js). */
export const PACES = {
  normal:{ wind:550, after:1100, settle:700, down:900, label:'Normal' },
  quick: { wind:380, after:650,  settle:380, down:550, label:'Quick' },
  brisk: { wind:240, after:380,  settle:200, down:300, label:'Brisk' },
};
export const paceOf = name => PACES[name] || PACES.normal;
