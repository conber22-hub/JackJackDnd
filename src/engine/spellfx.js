/* ✨ WHAT A SPELL LOOKS LIKE — the colours and the manner of each kind of magic, for render/spellfx.js to draw. Pure.
   By its damage type (its element), else by what it does (a heal, a help, a hold):
     col: the bright core · col2: the edge, smoke or afterglow · motes: how its particles move
       'rise' (embers, motes of light) · 'fall' (shards, drips) · 'burst' (thrown out) · 'swirl' (a cloud that hangs)
     light: the flash it throws on everything round it (0 for none: necrotic and psychic darken, they don't light)
     shock: a shockwave ring on the ground and a dome (thunder and force hit hardest)
     pillar: it comes down from above, a column on the target (radiant: Sacred Flame, Guiding Bolt's glow)
     bolt: a jagged bolt rather than a ball (lightning) */
const LOOK = {
  fire:      { col:'#ffb04a', col2:'#c2310e', motes:'rise',  light:3.2, shock:.7, label:'fire' },
  cold:      { col:'#d8f3ff', col2:'#5fb6ff', motes:'fall',  light:1.6, shock:.5, label:'frost' },
  lightning: { col:'#eef4ff', col2:'#7fa8ff', motes:'burst', light:3.6, shock:.6, bolt:true, label:'lightning' },
  thunder:   { col:'#e6e2ff', col2:'#8b7fff', motes:'burst', light:1.2, shock:1,  label:'thunder' },
  force:     { col:'#d9c2ff', col2:'#8a55ff', motes:'burst', light:1.8, shock:.9, label:'force' },
  radiant:   { col:'#fff6c8', col2:'#ffc94a', motes:'rise',  light:3,   shock:.4, pillar:true, label:'radiance' },
  necrotic:  { col:'#b5ff9a', col2:'#1d3a12', motes:'swirl', light:0,   shock:.5, label:'necrotic' },
  acid:      { col:'#d9ff6a', col2:'#5c8a0a', motes:'fall',  light:.8,  shock:.3, label:'acid' },
  poison:    { col:'#a8f070', col2:'#3d6b1a', motes:'swirl', light:.4,  shock:.2, label:'poison' },
  psychic:   { col:'#ffb3ec', col2:'#b0379a', motes:'swirl', light:.6,  shock:.6, label:'psychic' },
  heal:      { col:'#c9ffd2', col2:'#ffe9a0', motes:'rise',  light:1.4, shock:0,  label:'healing' },
  help:      { col:'#ffe9a0', col2:'#d9b8ff', motes:'rise',  light:.9,  shock:0,  label:'blessing' },
  hold:      { col:'#d9b8ff', col2:'#6a3fb0', motes:'swirl', light:.6,  shock:.2, label:'a hold' },
};
const ELEMENTS = Object.keys(LOOK).slice(0, 10);

/* spell: { ty (damage type), k ('heal'|'auto'|'buff'|'util'|'save'|…), cond, n (its name) }
   → the look, with its kind: 'heal' | 'help' | 'hold' | an element */
export function spellLook(spell = {}){
  const ty = String(spell.ty || '').toLowerCase().split(/[ ,/]/)[0];
  const kind = spell.k === 'heal' ? 'heal' : ELEMENTS.includes(ty) ? ty : spell.cond ? 'hold' : spell.k === 'buff' || spell.k === 'util' ? 'help' : 'force';
  return { kind, ...LOOK[kind] };
}

/* How the spell travels and lands, from its shape (engine/targeting.js areas) and how it's aimed:
   → 'burst' (a ball flies to the spot and goes off: Fireball, Shatter) · 'cone' (pours out of the caster: Burning
     Hands, a breath) · 'line' (a bolt from the caster: Lightning Bolt) · 'aura' (out from the caster all round:
     Thunderwave from where they stand) · 'pillar' (comes down on one: Sacred Flame) · 'darts' (several flying
     at one: Magic Missile) · 'touch' (on one, no flight: a heal, a hold, Toll the Dead) */
export function spellPath({ shape = '', self = false, kind = '', k = '', darts = 0, pillar = false } = {}){
  if (shape === 'cone') return 'cone';
  if (shape === 'line') return 'line';
  if (shape === 'aura' || (shape && self)) return 'aura';
  if (shape) return 'burst';
  if (darts > 1 || k === 'auto') return 'darts';
  if (pillar || kind === 'radiant') return 'pillar';
  return 'touch';
}

/* The squares of a cone or a line, ordered by how far they are from the caster, so the effect can pour across them
   in that order. squares: [{ x, y }]; from: { x, y } → [[...squares at 1], [... at 2], …] (by whole squares) */
export function wavesFrom(squares, from){
  const out = [];
  for (const s of squares){ const d = Math.max(0, Math.round(Math.hypot(s.x + .5 - from.x, s.y + .5 - from.y)) - 1); (out[d] ||= []).push(s); }
  return out.filter(Boolean);
}
