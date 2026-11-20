/* 💔 A health bar on the screen (the Wanderer's and the handheld table's party list and fight bar): like a name plate's
   (render/hpchip.js), the part a blow took stays a moment, white then pale gold, and drains away. `key` says whose bar
   it is (a token's id), so a drop can be told from a new bar; without one, the bar just shows the fill. The chip is a
   CSS animation; a bar drawn again while it runs picks it up where it was (a negative delay). */
const seen = new Map();   // key -> { frac, from, at }
const MS = 900;
// t (optional): the token, for what guards its hit points: ⛨ a Ward (a pale-blue line along the top of the bar) and
// temporary hit points (a violet stretch past the fill); engine/mech.js
export function hpBar(hp, max, key = null, now = (typeof performance !== 'undefined' ? performance.now() : Date.now()), t = null){
  const f = Math.max(0, Math.min(1, hp / Math.max(1, max)));
  let chip = '';
  if (key != null){
    const c = seen.get(key);
    if (!c) seen.set(key, { frac:f, from:f, at:-1e9 });
    else {
      if (f < c.frac - .001){ const showing = now - c.at < MS ? c.from : c.frac; c.from = Math.max(showing, c.frac); c.at = now; c.mood = 'hit'; c.moodAt = now; }
      else if (f > c.frac + .001){ c.mood = 'heal'; c.moodAt = now; }
      c.frac = f;
      const k = now - c.at;
      if (k < MS && c.from > f) chip = `<i class="wd-chip" style="left:${(f * 100).toFixed(1)}%;width:${((c.from - f) * 100).toFixed(1)}%;animation-delay:-${Math.round(k)}ms"></i>`;
    }
  }
  const w = t?.ward?.max > 0 ? Math.max(0, Math.min(1, (t.ward.now || 0) / t.ward.max)) : null;
  const tp = t?.thp > 0 ? Math.min(1 - f, t.thp / Math.max(1, max)) : 0;
  const ward = w === null ? '' : `<i class="wd-ward${w ? '' : ' down'}" style="width:${((w || 1) * 100).toFixed(1)}%" title="Ward ${t.ward.now || 0}/${t.ward.max}"></i>`;
  const temp = tp > 0 ? `<i class="wd-thp" style="left:${(f * 100).toFixed(1)}%;width:${Math.max(4, tp * 100).toFixed(1)}%" title="${t.thp} temporary hit points"></i>` : '';
  return `<i class="wd-hp${w !== null ? ' warded' : ''}"><i style="width:${(f * 100).toFixed(1)}%"></i>${temp}${chip}${ward}</i>`;
}

/* How the card that holds a bar should look just now: 'hit' (a jolt and a red edge) for a moment after a blow, 'heal' (a
   green glow) after a heal, else ''. Ask after drawing its bar (hpBar), which is what notices the change. */
export function barMood(key, now = (typeof performance !== 'undefined' ? performance.now() : Date.now())){
  const c = seen.get(key); if (!c?.mood) return '';
  return now - c.moodAt < (c.mood === 'hit' ? 380 : 650) ? c.mood : '';
}
