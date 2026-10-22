/* LOOK — the recipe for a figure (render/forge.js builds it): from a character sheet, for any token, rolled for an
   NPC, or a creature's preset varied so a pack of zombies isn't one zombie copied. Pure: no DOM, no Three.js.
   A recipe is small plain data, so it saves with the delve and goes over the wire to players as is.
   Heroes: heroLook(sheet) reads species, class, armour, weapons and shield; sheet.mini holds what the player chose
   in the creator's Look studio (hair, skin, colours, cloak, hat…) and wins over what the sheet suggests. */
import { BODIES, SKINS, SKINS_FANTASY, HAIR_COLS, CLOTHS, RAGS, METALS, HAIR, BEARDS, HORNS, OUTFITS, CLOAKS, HELMS, WEAPON_MODELS, OFFHANDS, POSES,
  CLASS_STYLE, ARMOR_OUTFIT, PRESETS, NPC_KINDS, weaponModel, TWO_HANDED } from '../data/looks.js';
import { mulberry32, hashSeed } from '../util/core.js';

export const BASE_LOOK = { v:1, body:'human', height:1, build:.5, frame:.5, skin:'#d9a57e', hair:'short', hairCol:'#3a2a1e', beard:'none', eyes:'#5a6a7a', glow:false,
  horns:'none', hornCol:'#2a2224', tail:false, outfit:'tunic', c1:'#3a4a6a', c2:'#a08a6a', leather:'#5a3a22', metal:'steel', cloak:'none', cloakCol:'#2a2430',
  helm:'none', main:'none', off:'none', shieldCol:'#6a2a2a', pose:'ready', lantern:false, tilt:0, seed:0 };
const pick = (a, r) => a[Math.floor(r() * a.length) % a.length];
const HEX = /^#[0-9a-f]{6}$/i;
const ENUMS = { body:Object.keys(BODIES), hair:HAIR, beard:BEARDS, horns:HORNS, outfit:[...Object.keys(OUTFITS), 'none'], cloak:Object.keys(CLOAKS), helm:Object.keys(HELMS),
  main:WEAPON_MODELS, off:Object.keys(OFFHANDS), pose:Object.keys(POSES), metal:Object.keys(METALS) };
const COLOURS = ['skin', 'hairCol', 'eyes', 'hornCol', 'c1', 'c2', 'leather', 'cloakCol', 'shieldCol'];
const clamp01 = (v, lo, hi, d) => Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d;
// Make any recipe safe to build (it may come from a save, another device or a hand-edited file).
export function normalizeLook(l = {}){
  const o = { ...BASE_LOOK };
  for (const [k, list] of Object.entries(ENUMS)) if (list.includes(l[k])) o[k] = l[k];
  for (const k of COLOURS) if (HEX.test(l[k] || '')) o[k] = l[k];
  o.height = clamp01(l.height, .75, 1.3, 1); o.build = clamp01(l.build, 0, 1, .5); o.frame = clamp01(l.frame, 0, 1, .5); o.tilt = clamp01(l.tilt, -1, 1, 0);
  o.glow = !!l.glow; o.tail = l.tail === undefined ? !!BODIES[o.body]?.tail : !!l.tail; o.lantern = !!l.lantern;
  o.seed = Number.isInteger(l.seed) ? l.seed >>> 0 : 0;
  if (l.horns === undefined && BODIES[o.body]?.horns) o.horns = BODIES[o.body].horns;
  if (TWO_HANDED.has(o.main) && ['shield', 'dagger', 'book', 'orb'].includes(o.off)) o.off = 'none';   // two hands on a greatsword
  return o;
}

/* ---------- heroes ---------- */
const BODY_OF = { Human:'human', Elf:'elf', Dwarf:'dwarf', Halfling:'halfling', Gnome:'gnome', Orc:'orc', Tiefling:'tiefling', Dragonborn:'dragonborn', Goliath:'goliath' };
const DRAGON_SKIN = { Black:'#2a2a30', Blue:'#2f6aa0', Brass:'#b08a3a', Bronze:'#8a6a2a', Copper:'#b06a2a', Gold:'#c0a040', Green:'#3a8a4a', Red:'#a0302a', Silver:'#c8ccd4', White:'#e0e0e8' };
const BUILD_OF = { Barbarian:.85, Fighter:.65, Paladin:.7, Monk:.4, Rogue:.35, Ranger:.45, Wizard:.25, Sorcerer:.3, Warlock:.35, Bard:.4, Cleric:.55, Druid:.4 };
// What the sheet suggests (species, class, armour, weapons), with the hero's own seed for the rest.
export function sheetLook(h){
  const r = mulberry32(hashSeed(h.id || h.name || 'hero')), body = BODY_OF[h.sp] || 'human', B = BODIES[body], style = CLASS_STYLE[h.cls] || {};
  let skin = pick(SKINS_FANTASY[body] || SKINS, r);
  if (body === 'elf' && /Drow/.test(h.spOpt || '')) skin = pick(SKINS_FANTASY.drow, r);
  if (body === 'dragonborn'){ const k = String(h.spOpt || '').split(' ')[0]; if (DRAGON_SKIN[k]) skin = DRAGON_SKIN[k]; }
  const models = (h.weapons || []).filter(Boolean).map(n => ({ n, m:weaponModel(n) })).filter(x => x.m);
  const ranged = m => ['bow', 'longbow', 'crossbow'].includes(m);
  const melee = models.filter(x => !ranged(x.m));
  let main = (melee[0] || models[0])?.m || style.main || 'none', off = 'none';
  if (h.shield && !TWO_HANDED.has(main)) off = 'shield';
  else if (!TWO_HANDED.has(main) && melee[1] && ['dagger', 'shortsword', 'scimitar', 'sickle', 'axe'].includes(melee[1].m)) off = 'dagger';
  else if (!TWO_HANDED.has(main) && style.off) off = style.off;
  const outfit = ARMOR_OUTFIT[h.armor] || style.outfit || 'tunic';
  const hair = body === 'dragonborn' || body === 'goliath' ? 'bald' : pick(HAIR.filter(x => x !== 'bald' || r() < .3), r);
  return {
    body, height:1 + (r() - .5) * .08, build:Math.min(1, Math.max(0, (BUILD_OF[h.cls] ?? .5) + (r() - .5) * .2)), frame:.3 + r() * .5,
    skin, hair, hairCol:pick(HAIR_COLS, r), beard:B.beard ? pick(['full', 'braided', 'long'], r) : body === 'human' || body === 'orc' ? (r() < .35 ? pick(['stubble', 'short', 'full', 'moustache'], r) : 'none') : 'none',
    eyes:body === 'tiefling' ? '#e8c040' : body === 'dragonborn' ? '#e0a020' : pick(['#5a6a7a', '#4a6a4a', '#6a4a2a', '#3a4a7a', '#7a7a6a'], r), glow:body === 'tiefling',
    horns:B.horns ? (body === 'dragonborn' ? 'swept' : pick(['curled', 'swept', 'ram'], r)) : 'none', hornCol:pick(['#2a2224', '#4a3a30', '#6a5a4a', '#1a1418'], r), tail:!!B.tail,
    outfit, c1:h.color || pick(CLOTHS, r), c2:pick(['#a08a6a', '#c0a050', '#8a7a6a', '#d8d0b8', '#6a5040'], r), leather:pick(['#5a3a22', '#4a3020', '#6a4a2a', '#3a2a1e'], r),
    metal:outfit === 'plate' && h.cls === 'Paladin' ? 'silver' : 'steel', cloak:style.cloak || 'none', cloakCol:pick(['#2a2430', '#3a2a24', '#24302a', '#302430', '#4a1e22', '#22283a'], r),
    helm:style.helm && r() < .6 ? style.helm : 'none', main, off, shieldCol:h.color || '#6a2a2a', pose:style.pose || 'ready',
    lantern:!['torch', 'lantern'].includes(off), seed:hashSeed(h.id || h.name || 'hero'),
  };
}
export function heroLook(h, over = h?.mini){ return normalizeLook({ ...sheetLook(h || {}), ...(over || {}) }); }

/* ---------- NPCs and creatures ---------- */
// The changes between one of a kind and the next, from its own seed.
function vary(look, what, r){
  const o = { ...look };
  for (const k of what){
    if (k === 'skin') o.skin = pick(SKINS_FANTASY[o.body] || SKINS, r);
    if (k === 'hair'){ o.hair = pick(HAIR, r); o.hairCol = pick(HAIR_COLS, r); }
    if (k === 'beard') o.beard = r() < .45 ? pick(BEARDS, r) : 'none';
    if (k === 'cloth'){ const pal = o.outfit === 'rags' ? RAGS : CLOTHS; o.c1 = pick(pal, r); o.c2 = pick(pal, r); }
    if (k === 'height'){ o.height = (o.height || 1) * (.93 + r() * .14); o.build = Math.min(1, Math.max(0, (o.build ?? .5) + (r() - .5) * .4)); }
    if (k === 'tilt') o.tilt = (r() - .5) * 1.6;
    if (k === 'gear'){ if (r() < .4) o.helm = 'none'; if (r() < .35) o.off = 'none'; }
  }
  return o;
}
const FORGE_SHAPES = { humanoid:'commoner', zombie:'zombie', skeleton:'skeleton', vampire:'vampire' };
// Is this creature built by the forge? (its preset, or a humanoid / zombie / skeleton / vampire shape)
export const forgePreset = b => b && (PRESETS[b.id] ? b.id : FORGE_SHAPES[b.shape] || null);
export function creatureLook(b, tokenId){
  const pid = forgePreset(b); if (!pid) return null;
  const p = PRESETS[pid], r = mulberry32(hashSeed(`${b.id}|${tokenId}`));
  const base = { ...p };
  delete base.vary;
  if (!p.main || pid !== b.id){ const m = (b.attacks || []).map(a => weaponModel(a.n)).find(Boolean); if (m) base.main = m; }   // a creature of a generic shape holds what it fights with
  if (pid !== b.id && b.color && p.body !== 'skeleton') base.c1 = b.color;
  return normalizeLook({ ...vary(base, p.vary || [], r), seed:hashSeed(String(tokenId)) });
}
// A fresh NPC of a kind (the DM's 🎲 Roll an NPC): everything rolled.
export function npcLook(kind = 'villager', rng = Math.random){
  const K = NPC_KINDS[kind] || NPC_KINDS.villager, p = K.preset ? PRESETS[K.preset] : null;
  const body = K.preset ? 'human' : pick(['human', 'human', 'elf', 'dwarf', 'halfling', 'orc', 'tiefling', 'gnome'], rng);
  let look = { ...(p || { outfit:pick(['leather', 'chain', 'tunic', 'robe'], rng), main:pick(['sword', 'axe', 'spear', 'mace', 'bow', 'staff'], rng), cloak:pick(['cloak', 'hood', 'cape', 'none'], rng), pose:'ready' }), body, ...(K.look || {}) };
  delete look.vary;
  look = vary(look, ['skin', 'hair', 'beard', 'height', ...(kind === 'villager' || kind === 'vistani' || !p ? ['cloth'] : [])], rng);
  if (BODIES[body].horns) look.horns = pick(['curled', 'swept', 'ram'], rng);
  if (BODIES[body].beard && look.beard === 'none') look.beard = 'full';
  look.cloakCol = kind === 'vistani' ? look.cloakCol : pick(['#2a2430', '#3a2a24', '#24302a', '#4a1e22', '#3a3a30'], rng);
  look.seed = Math.floor(rng() * 4294967295);
  return normalizeLook(look);
}
// The look for any token: its own recipe, a creature's preset, or an adventurer rolled from its id and colour.
export function lookFor(t, b){
  if (t.look) return normalizeLook(t.look);
  if (t.kind === 'monster') return creatureLook(b, t.id);
  const r = mulberry32(hashSeed(t.id || t.name));
  const l = npcLook(t.kind === 'npc' ? 'villager' : 'adventurer', r); if (t.color) l.c1 = t.color;
  return normalizeLook(l);
}
export { METALS };

/* ---------- in words ---------- */
const HAIR_WORDS = { short:'short', crop:'cropped', long:'long', tied:'tied-back', braid:'braided', topknot:'top-knotted', wild:'wild', mohawk:'shaved-sided', bun:'pinned-up' };
const BEARD_WORDS = { stubble:'a few days\' stubble', short:'a short beard', full:'a full beard', long:'a long beard', braided:'a braided beard', moustache:'a moustache' };
const OUTFIT_WORDS = { robe:'robes', tunic:'a plain tunic', leather:'worn leathers', hide:'hide and fur', chain:'mail and a tabard', half:'a breastplate over mail', plate:'full plate', monk:'a wrapped gi', rags:'rags', noble:'fine dark clothes', vestments:'vestments and a stole', none:'nothing at all' };
const CLOAK_WORDS = { cloak:'a cloak', hood:'a hooded cloak', cape:'a short cape', mantle:'a high-collared mantle' };
const HELM_WORDS = { cap:'a leather cap', open:'an open helm', great:'a great helm', circlet:'a circlet', hat:'a wide-brimmed hat', pointed:'a pointed hat' };
const hairName = c => { const h = parseInt(c.slice(1), 16), r = h >> 16, g = (h >> 8) & 255, b = h & 255, l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  return l > 200 ? 'white' : l > 150 && r - b < 40 ? 'grey' : l > 150 ? 'fair' : r > 150 && g < 100 ? 'red' : r > 120 && g > 80 ? 'sandy' : l < 50 ? 'black' : 'brown'; };
// One sentence for a look: what the party sees.
export function describeLook(l){
  const B = BODIES[l.body] || BODIES.human, size = l.height > 1.06 ? 'tall ' : l.height < .94 ? 'short ' : '', heft = l.build > .72 ? 'broad ' : l.build < .28 ? 'lean ' : '';
  const who = l.body === 'zombie' ? 'corpse that walks' : l.body === 'skeleton' ? 'skeleton' : l.body === 'vampire' ? 'pale figure' : B.n.toLowerCase();
  const bits = [];
  if (l.body !== 'skeleton'){ if (l.hair === 'bald' || B.snout) bits.push(B.snout ? 'scaled' : 'bald'); else if (l.cloak !== 'hood') bits.push(`${HAIR_WORDS[l.hair] || ''} ${hairName(l.hairCol)} hair`.trim()); }
  if (BEARD_WORDS[l.beard]) bits.push(BEARD_WORDS[l.beard]);
  if (l.horns !== 'none') bits.push(`${l.horns === 'ram' ? 'ram\'s' : l.horns} horns`);
  if (l.glow) bits.push('eyes that glow');
  const wear = [OUTFIT_WORDS[l.outfit], CLOAK_WORDS[l.cloak], HELM_WORDS[l.helm]].filter(Boolean);
  const held = [l.main !== 'none' ? `a ${l.main.replace('longbow', 'longbow')}` : '', l.off === 'shield' ? 'a shield' : l.off === 'claw' ? '' : l.off !== 'none' ? `a ${({ holy:'holy symbol', book:'book', orb:'glowing orb' })[l.off] || l.off}` : ''].filter(Boolean);
  const a = /^[aeiou]/.test(size + heft + who) ? 'An' : 'A';
  const and = xs => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] || '';
  return `${a} ${size}${heft}${who}${bits.length ? ` with ${and(bits)}` : ''}, in ${and(wear)}${held.length ? `, carrying ${and(held)}` : ''}.`;
}
