/* YOUR BOOKS — the DM's own compendium (a .prism export from a character app), turned into the app's formats.
   Pure: JSON in, plain data out. Nothing from it is ever committed or built into the page: the DM imports the file
   into their own browser (game/library.js keeps it there and merges it in at start-up), and the table's players
   get the parts their character creator needs over the table's own connection.

   What comes out:
     spells       the spell format of data/srd.js (school, time, range, comp, dur, text, hl…) plus combat fields
                  read from the description where it says plainly what happens (a spell attack, a save, dice, an area)
     species      { spd, size, note, skills, feats:[{ n, text }], text, subs:{ name:{ note, feats } } }
     backgrounds  { ab, skills, tools, note, text }
     feats        { text, plus, req, origin, style }
     subclasses   { [class]: { [name]: { features:{ level:[names] }, texts:{ name:text }, text } } }
     monsters     bestiary entries (data/bestiary.js): cr, ac, hp, speed, attacks parsed from the actions, the rest as traits
     items        magic items: { n, rarity, type, attune, text }
   Every entry carries src (the book, or 'Unearthed Arcana' / 'Homebrew') and kind ('canon' | 'ua' | 'homebrew'). */
import { ABILITIES, SKILLS, CLASSES } from '../data/srd.js';

export const LIB_VERSION = 1;
const LETTER = { Bard:'B', Cleric:'C', Druid:'D', Paladin:'P', Ranger:'R', Sorcerer:'S', Warlock:'K', Wizard:'W' };
const AB = { str:'Str', strength:'Str', dex:'Dex', dexterity:'Dex', con:'Con', constitution:'Con', int:'Int', intelligence:'Int', wis:'Wis', wisdom:'Wis', chr:'Cha', cha:'Cha', charisma:'Cha' };
const CONDS = ['blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious'];
const SIZE_SQ = { tiny:1, small:1, medium:1, large:2, huge:3, gargantuan:4 };

// "Fireball 2024" and "Fireball" are one spell; curly apostrophes match straight ones.
export const baseName = n => String(n || '').replace(/\s+2024$/, '').replace(/[’‘]/g, "'").trim();
export const nameKey = n => baseName(n).toLowerCase();
const is2024 = x => /\s2024$/.test(x?.name || '') || /2024/.test(x?.source?.book || '') || x?.is2024 === true || /2024 Edition/.test(x?.tags || '');
export function sourceOf(x){
  const s = x?.source || {}, t = s.sourceType;
  const kind = t === 'canon' ? 'canon' : t === 'unearthedArcana' ? 'ua' : 'homebrew';
  return { kind, src:s.book || (kind === 'ua' ? 'Unearthed Arcana' : kind === 'homebrew' ? (s.customName && !/^https?:/.test(s.customName) ? s.customName : 'Homebrew') : 'Official') };
}
// Of several versions of one thing, keep the 2024 one, else the official one.
const rank = x => (is2024(x) ? 4 : 0) + ({ canon:2, ua:1, homebrew:0 }[sourceOf(x).kind]);
function best(list){
  const by = new Map();
  for (const x of list || []){ if (!x?.name) continue; const k = nameKey(x.name), had = by.get(k); if (!had || rank(x) > rank(had)) by.set(k, x); }
  return [...by.values()];
}
const tidy = s => String(s || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
const skillName = k => { const want = String(k).toLowerCase().replace(/[^a-z]/g, ''); return Object.keys(SKILLS).find(s => s.toLowerCase().replace(/[^a-z]/g, '') === want) || null; };
const skillsOf = o => Object.entries(o || {}).filter(([, v]) => v).map(([k]) => skillName(k)).filter(Boolean);
const featureList = fs => (fs || []).map(f => ({ n:baseName(f.customFeat?.name || f.name), text:tidy(f.customFeat?.featureDescription), l:+f.customFeat?.level || 0 })).filter(f => f.n);

/* ---------- spells ---------- */
const feetOf = range => { const r = String(range || '').toLowerCase(); if (/^touch/.test(r)) return 5; if (/^self/.test(r)) return 0; if (/sight|unlimited/.test(r)) return 1e6; const m = /(\d[\d,]*)\s*(?:ft|feet|foot|')/.exec(r); if (m) return +m[1].replace(/,/g, ''); const mi = /(\d+)\s*mile/.exec(r); return mi ? +mi[1] * 5280 : 0; };
// The higher-level rule: the labelled paragraph (2024), or the "When you cast this spell using a spell slot of…" sentence(s).
function splitHigher(text){
  const t = tidy(text);
  let m = /\n*\s*(?:\*\*\*|_|\*)?(?:At Higher Levels|Using a Higher-Level Spell Slot|Cantrip Upgrade)\.?(?:\*\*\*|_|\*)?\s*/i.exec(t);
  if (m) return { text:t.slice(0, m.index).trim(), hl:t.slice(m.index + m[0].length).trim() };
  m = /(?:^|\n|\.\s+)(When you cast this spell using a spell slot of [\s\S]+)$/i.exec(t);
  if (m) return { text:t.slice(0, m.index + (m[0].startsWith('.') ? 1 : 0)).trim(), hl:m[1].trim() };
  return { text:t, hl:'' };
}
/* What the description says plainly: a spell attack or a save, its dice and damage type, half on a success, an area,
   a condition on a failed save, healing. Anything less clear stays 'util' (the DM reads the text). */
export function spellMechanics(sp, text){
  const t = text.replace(/\s+/g, ' '), lo = t.toLowerCase(), out = {};
  const atk = /\b(?:make|makes) (?:a )?(?:ranged|melee) spell attack/.test(lo) || /\bspell attack\b/.test(lo) && /\bon a hit\b/.test(lo);
  const sv = /\b(strength|dexterity|constitution|intelligence|wisdom|charisma) sav(?:ing throw|e)\b/.exec(lo);
  const dmg = /(\d+d\d+(?:\s*\+\s*\d+)?)\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)\s+damage/i.exec(t);
  const healM = /regains? (?:a number of )?hit points equal to (\d+d\d+(?:\s*\+\s*\d+)?)/i.exec(t);
  const self = /^self/i.test(sp.range || '');
  const area = /(\d+)-foot[- ](?:radius[- ])?(sphere|cone|cube|line|cylinder|emanation|radius)/i.exec(t) || ((m => m && [null, m[1], 'line'])(/\bline (\d+) feet long/i.exec(t)))
    || (self && ((m => m && [null, m[1], 'emanation'])(/^self\s*\((\d+)[- ]?(?:ft|foot)/i.exec(sp.range || '') || /within (\d+) feet of you\b/i.exec(t))));
  let cond = null;
  if (sv){   // a condition named in a sentence about failing the save ("…is knocked prone on a failed save", "On a failure, it is frightened")
    const cr = new RegExp(`\\b(?:is|are|be|becomes?|falls?|knocked|has the)\\s+(?:also\\s+)?(?:knocked\\s+)?(${CONDS.join('|')})\\b`, 'i');
    for (const sen of t.split(/(?<=\.)\s+/)) if (/fail/i.test(sen)){ const m = cr.exec(sen); if (m){ cond = m[1].toLowerCase(); break; } }
  }
  if (healM && !dmg){ out.k = 'heal'; out.d = healM[1].replace(/\s+/g, ''); }
  else if (atk && dmg){ out.k = 'atk'; out.d = dmg[1].replace(/\s+/g, ''); out.ty = dmg[2].toLowerCase(); }
  else if (sv && (dmg || cond)){
    out.k = 'save'; out.sv = sv[1].slice(0, 3);
    if (dmg){ out.d = dmg[1].replace(/\s+/g, ''); out.ty = dmg[2].toLowerCase(); if (/half (?:as much )?(?:the )?damage/i.test(t)) out.half = true; }
    if (cond) out.cond = cond;
  } else out.k = 'util';
  if (area && out.k !== 'util' && out.k !== 'heal'){
    const shape = area[2].toLowerCase(), size = +area[1];
    out.area = shape === 'emanation' || (shape === 'radius' && self) ? ['aura', size] : [shape === 'radius' ? 'sphere' : shape, size];
  }
  if (sp.l === 0 && out.d && out.k !== 'util') out.cs = 1;
  return out;
}
function convertSpell(x){
  const { kind, src } = sourceOf(x), { text, hl } = splitHigher(x.officialDescription);
  const c = [...new Set((x.allCasterNames || []).map(n => LETTER[baseName(n).replace(/, Revised$/, '')]).filter(Boolean))].join('')
    || Object.entries(x.casters || {}).filter(([, v]) => v).map(([k]) => LETTER[k[0].toUpperCase() + k.slice(1)]).filter(Boolean).join('');
  const sp = { n:baseName(x.name), l:Math.max(0, Math.min(9, +x.level || 0)), c, school:x.school || '', time:x.castingTime || '', range:x.range || '', r:feetOf(x.range),
    comp:x.components || '', dur:x.duration || '', ...(x.isConcentration ? { conc:true } : {}), ...(x.isRitual ? { ritual:true } : {}), text, ...(hl ? { hl } : {}), src, kind, lib:true };
  return { ...sp, ...spellMechanics(sp, text) };
}

/* ---------- species, backgrounds, feats ---------- */
function speciesNote(feats, extra = ''){
  const dv = feats.map(f => /darkvision/i.test(f.n) && /(\d+)\s*feet/.exec(f.text)).find(Boolean);
  return [dv ? `Darkvision ${dv[1]} ft` : null, ...feats.filter(f => !/^(darkvision|age|alignment|size|speed|creature type)$|language/i.test(f.n)).map(f => f.n), extra].filter(Boolean).join(' · ');
}
function convertSpecies(x, subs){
  const { kind, src } = sourceOf(x), feats = featureList(x.newFeatures).map(({ n, text }) => ({ n, text }));
  const spd = +x.movement?.speed > 0 ? +x.movement.speed : 30, size = (x.sizes || []).find(s => /^(small|medium|large)$/i.test(s)) || 'Medium';
  const out = { spd, size, note:speciesNote(feats), skills:skillsOf(x.freeSkills), feats, text:tidy(x.raceDescription), src, kind, lib:true };
  if (subs.length){
    out.opts = { [x.subraceLabel || 'Subrace']:subs.map(s => baseName(s.name)).sort() };
    out.subs = Object.fromEntries(subs.map(s => { const f = featureList(s.newFeatures).map(({ n, text }) => ({ n, text })); return [baseName(s.name), { note:speciesNote(f), feats:f, skills:skillsOf(s.freeSkills), text:tidy(s.subraceDescription), ...(+s.movement?.speed > 0 ? { spd:+s.movement.speed } : {}) }]; }));
  }
  return out;
}
function convertBackground(x){
  const { kind, src } = sourceOf(x), feats = featureList(x.features);
  const sel = JSON.stringify(x.features || []);
  const abFrom = /"stats":\{"stats":\{([^}]*)\}/.exec(sel);
  const ab = abFrom ? [...new Set([...abFrom[1].matchAll(/"(\w+)":true/g)].map(m => AB[m[1]]).filter(Boolean))] : [];
  const featName = (/"freeFeatures":\[\{[^\]]*?"name":"([^"]+)"/.exec(sel) || [])[1];
  return { ab:ab.length >= 3 ? ab : [...ABILITIES], skills:skillsOf(x.freeSkills), ...(/tool/i.test(sel) ? { tools:true } : {}), ...(featName ? { feat:baseName(featName) } : {}),
    note:feats.map(f => f.n).join(' · '), feats:feats.map(({ n, text }) => ({ n, text })), text:tidy(x.backgroundDescription), src, kind, lib:true };
}
function convertFeat(x){
  const { kind, src } = sourceOf(x), text = tidy(x.featureDescription);
  const plus = [...new Set((x.newEffects?.abilityScores || []).flatMap(a => Object.entries(a?.stats?.stats || {}).filter(([, v]) => v).map(([k]) => AB[k])).filter(Boolean))];
  const req = (/^\s*Prerequisites?:?\s*([^\n]+)/i.exec(text) || [])[1];
  return { text, ...(plus.length ? { plus } : {}), ...(req ? { req:req.replace(/\.$/, '') } : {}), ...(/Feat: Origin/.test(x.tags || '') ? { origin:true } : {}), ...(x.type === 'fightingStyle' ? { style:true } : {}), src, kind, lib:true };
}

/* ---------- subclasses ---------- */
function convertSubclass(x){
  const { kind, src } = sourceOf(x), features = {}, texts = {};
  for (const f of featureList(x.newFeatures)){ const l = Math.max(1, f.l || 3); (features[l] ||= []).push(f.n); texts[f.n] = f.text; }
  return { features, texts, text:tidy(x.subclassDescription), src, kind, lib:true };
}

/* ---------- monsters ---------- */
const crText = cr => cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : cr === 0.5 ? '1/2' : String(cr ?? 0);
// "Bite. Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) piercing damage" (2014)
// "Bite. Melee Attack Roll: +9, reach 10 ft. Hit: 16 (2d10 + 5) Piercing damage" (2024)
export function parseAttack(line){
  const head = /^([^.]+)\.\s*(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon |Spell )?Attack(?: Roll)?:\s*\+(\d+)/.exec(line);
  if (!head) return null;
  const hit = String(line).split(/Hit:/)[1] || '', rng = /range (\d+)\/(\d+)/i.exec(line);
  // every damage part after "Hit:": "16 (2d10 + 5) piercing damage plus 7 (2d6) fire damage", "4 (1d8 Force Damage) + 16 (2d10 + 5 Piercing Damage)"
  const dice = '(\\d+d\\d+(?:\\s*[+−-]\\s*\\d+)?)';
  const parts = [...hit.matchAll(new RegExp(`\\(${dice}\\s+([A-Za-z]+)\\s+damage\\)|\\(${dice}\\)\\s*([A-Za-z]+)\\s+damage`, 'gi'))]
    .map(m => ({ d:(m[1] || m[3]).replace(/\s+/g, '').replace('−', '-'), t:(m[2] || m[4]).toLowerCase() }));
  const out = { n:head[1].trim(), b:+head[2], ...(rng ? { rng:[+rng[1], +rng[2]] } : {}) };
  if (!parts.length) return { ...out, d:'1d6', t:'bludgeoning', nodmg:true };   // the to-hit came through but the damage didn't ("Hit: .")
  return { ...out, d:parts.map(p => p.d).join('+'), t:[...new Set(parts.map(p => p.t))].join(' + ') };
}
const slug = n => 'lib-' + nameKey(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const boldLine = s => { const m = /^([^.]{1,60})\.\s*([\s\S]*)$/.exec(String(s).trim()); return m ? `<b>${esc(m[1])}.</b> ${esc(m[2])}` : esc(s); };
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]);
function convertMonster(x){
  const { kind, src } = sourceOf(x), st = x.stats || {}, mod = v => Math.floor(((+v || 10) - 10) / 2);
  const mv = x.movement || {}, speed = +mv.speed > 0 ? +mv.speed : 30;
  const spd = [`${speed} ft.`, ...['fly', 'swim', 'climb', 'burrow'].filter(k => +mv[k] > 0).map(k => `${k} ${mv[k]} ft.`)].join(', ');
  const sizeKey = Object.keys(x.sizes || {}).find(k => x.sizes[k]) || String(x.size || 'medium').toLowerCase();
  const hd = x.hpDice, hp = hd?.num && hd?.type ? `${hd.num}d${hd.type}${hd.base ? `+${hd.base}` : ''}` : String(x.hp || 10);
  const lines = [...(x.actions || []), ...(x.bonusActions || []).map(a => `(Bonus action) ${a}`)];
  const attacks = lines.map(parseAttack).filter(Boolean), missing = !attacks.length || attacks.some(a => a.nodmg);
  for (const a of attacks) delete a.nodmg;
  const traits = [...(x.monsterTraits || []).filter(t => !/^(Challenge|Proficiency Bonus)\./.test(t)),
    ...lines.filter(l => !parseAttack(l)), ...(x.reactions || []).map(r => `(Reaction) ${r}`),
    ...(x.legendaryActions?.length ? [`Legendary Actions. ${x.legendaryActionsDescription || ''}`, ...x.legendaryActions] : [])].map(boldLine);
  return { id:slug(x.name), fam:'library', name:baseName(x.name), cr:crText(+x.challengeRating), xp:+x.experiencePoints || 0, ac:+x.ac || 10, hp, speed, spd, init:mod(st.dex),
    size:SIZE_SQ[sizeKey] || 1, stats:Object.fromEntries(Object.entries(st).map(([k, v]) => [AB[k] || k, +v])), race:x.race || '',
    attacks:attacks.length ? attacks : [{ n:'Strike', b:2 + mod(st.str), d:'1d6', t:'bludgeoning' }],
    traits:[...traits, ...(missing ? ['<i>Some of its attack damage didn\'t come through in the export (a stand-in 1d6 is there): set it in the Beasts tab.</i>'] : [])], src, kind, lib:true };
}

/* ---------- magic items ---------- */
function convertItem(x){
  const { kind, src } = sourceOf(x);
  return { n:baseName(x.name), rarity:x.rarity || '', type:x.type || x.itemType || '', attune:x.attunement ? (x.additionalInformation || 'Requires attunement') : '',
    text:tidy((x.properties || []).map(p => p.customFeat?.featureDescription).filter(Boolean).join('\n\n')), src, kind, lib:true };
}

/* ---------- the whole file ---------- */
export function convertPrism(raw){
  const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!d || typeof d !== 'object' || !['spells', 'races', 'monsters', 'feats', 'subclasses'].some(k => Array.isArray(d[k]))) throw new Error('This doesn\'t look like a compendium export (no spells, species, monsters, feats or subclasses in it).');
  const lib = { v:LIB_VERSION, spells:[], species:{}, backgrounds:{}, feats:{}, subclasses:{}, monsters:[], items:[] };
  lib.spells = best(d.spells).map(convertSpell).sort((a, b) => a.l - b.l || a.n.localeCompare(b.n));
  const subsOf = new Map(); for (const s of best(d.subraces)) { const k = nameKey(s.raceName); if (!subsOf.has(k)) subsOf.set(k, []); subsOf.get(k).push(s); }
  for (const x of best(d.races)) lib.species[baseName(x.name)] = convertSpecies(x, subsOf.get(nameKey(x.name)) || []);
  for (const x of best(d.backgrounds)) lib.backgrounds[baseName(x.name)] = convertBackground(x);
  for (const x of best((d.feats || []).filter(f => f.type === 'feat' || f.type === 'fightingStyle'))) lib.feats[baseName(x.name)] = convertFeat(x);
  for (const x of best(d.subclasses)){
    const cls = baseName(x.className); if (!CLASSES[cls]) continue;   // classes the app doesn't have (Artificer, Blood Hunter…) wait for it
    (lib.subclasses[cls] ||= {})[baseName(x.name)] = convertSubclass(x);
  }
  lib.monsters = best(d.monsters).map(convertMonster);
  lib.items = best(d.magicItems).map(convertItem).sort((a, b) => a.n.localeCompare(b.n));
  return lib;
}

/* What to use of it: only the kinds the DM ticked (official books, Unearthed Arcana, homebrew), and nothing the app
   already has under the same name (the built-in version is the one the rules are wired to). have: { spells:Set, species:Set… } of names. */
export function pickLibrary(lib, kinds = ['canon', 'ua'], have = {}){
  const ok = x => kinds.includes(x.kind), fresh = (set, n) => !set?.has(nameKey(n));
  const obj = (o, set) => Object.fromEntries(Object.entries(o || {}).filter(([n, x]) => ok(x) && fresh(set, n)));
  return { v:lib.v,
    spells:(lib.spells || []).filter(s => ok(s) && fresh(have.spells, s.n)),
    species:obj(lib.species, have.species), backgrounds:obj(lib.backgrounds, have.backgrounds), feats:obj(lib.feats, have.feats),
    subclasses:Object.fromEntries(Object.entries(lib.subclasses || {}).map(([c, subs]) => [c, obj(subs, have.subclasses)])),
    monsters:(lib.monsters || []).filter(m => ok(m) && fresh(have.monsters, m.name)),
    items:(lib.items || []).filter(ok) };
}
// How much of each there is (for the import card): { spells:n, species:n… } and the kinds present.
export function libCounts(lib){
  const n = v => Array.isArray(v) ? v.length : Object.keys(v || {}).length;
  return { spells:n(lib.spells), species:n(lib.species), backgrounds:n(lib.backgrounds), feats:n(lib.feats),
    subclasses:Object.values(lib.subclasses || {}).reduce((a, s) => a + n(s), 0), monsters:n(lib.monsters), items:n(lib.items) };
}
export function kindCounts(lib){
  const all = [...(lib.spells || []), ...Object.values(lib.species || {}), ...Object.values(lib.backgrounds || {}), ...Object.values(lib.feats || {}),
    ...Object.values(lib.subclasses || {}).flatMap(o => Object.values(o)), ...(lib.monsters || []), ...(lib.items || [])];
  const c = { canon:0, ua:0, homebrew:0 }; for (const x of all) c[x.kind] = (c[x.kind] || 0) + 1; return c;
}
// The part a player's character creator needs (no monsters, no magic items).
export const creatorPart = lib => ({ v:lib.v, spells:lib.spells, species:lib.species, backgrounds:lib.backgrounds, feats:lib.feats, subclasses:lib.subclasses, monsters:[], items:[] });
