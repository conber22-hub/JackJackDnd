import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { convertPrism, pickLibrary, libCounts, kindCounts, creatorPart, parseAttack, nameKey } from '../src/engine/library.js';
import { SPELLS, SPECIES, BACKGROUNDS, FEATS, CLASSES } from '../src/data/srd.js';
import { diceAt } from '../src/engine/spellcast.js';
import { areaOf, areaSquares } from '../src/engine/targeting.js';
import { setState, T } from '../src/engine/state.js';

// An invented compendium in the export's shape: no book text lives in this repository.
const raw = readFileSync(new URL('./fixtures/library-sample.prism.json', import.meta.url), 'utf8');
const lib = convertPrism(raw);
const have = { spells:new Set(SPELLS.map(s => nameKey(s.n))), species:new Set(Object.keys(SPECIES).map(nameKey)), backgrounds:new Set(Object.keys(BACKGROUNDS).map(nameKey)),
  feats:new Set(Object.keys(FEATS).map(nameKey)), subclasses:new Set(Object.values(CLASSES).map(c => nameKey(c.sub))) };

test('a compendium export becomes spells the table can cast, with the 2024 version kept', () => {
  const g = lib.spells.find(s => s.n === 'Gloamlance');
  assert.equal(lib.spells.filter(s => s.n === 'Gloamlance').length, 1);
  assert.deepEqual([g.k, g.d, g.ty, g.l, g.c, g.r, g.src], ['atk', '4d8', 'necrotic', 2, 'WS', 90, 'Tome of Test Fixtures 2024']);
  assert.match(g.hl, /1d8 for each spell slot level above 2/);
  assert.doesNotMatch(g.text, /Higher-Level/);
  assert.equal(diceAt(g, 4), '6d8');   // upcasting reads the library's higher-level line too
  const mire = lib.spells.find(s => s.n === 'Mire Burst');
  assert.deepEqual([mire.k, mire.sv, mire.d, mire.ty, mire.half, mire.cond, mire.area], ['save', 'str', '4d6', 'bludgeoning', true, 'prone', ['cube', 15]]);
  const hush = lib.spells.find(s => s.n === 'Hush of Lanterns');
  assert.deepEqual([hush.k, hush.conc, hush.ritual, hush.kind, hush.d], ['util', true, true, 'ua', undefined]);   // nothing to roll: the DM reads it
  assert.deepEqual(lib.spells.find(s => s.n === 'Pocket Sparkle').cs, 1);
  // every area the library automates is one the targeting engine draws
  setState({ floors:[{ W:60, H:60, grid:Array(3600).fill(T.ROOM), doors:[], traps:[], rough:[] }], tokens:[] });
  for (const s of lib.spells.filter(s => s.area)) assert.ok(areaSquares({ id:'c', floor:0, x:30, y:30, size:1 }, areaOf(s), { x:33, y:30 }).squares.size > 0, s.n);
});

test('species, subraces, backgrounds, feats and subclasses come through in the creator\'s shapes', () => {
  const m = lib.species.Mistborn;
  assert.deepEqual([m.spd, m.size, [...m.skills].sort()], [35, 'Medium', ['Sleight of Hand', 'Stealth']]);
  assert.match(m.note, /Darkvision 60 ft · Fogstep/);
  assert.doesNotMatch(m.note, /Language/);
  const b = lib.species.Bogling;
  assert.deepEqual(b.opts, { Subrace:['Peat Bogling', 'Reed Bogling'] });
  assert.equal(b.subs['Reed Bogling'].spd, 30);
  assert.equal(b.subs['Peat Bogling'].spd, undefined);
  const bg = lib.backgrounds.Lamplighter;
  assert.deepEqual([bg.ab.length, [...bg.skills].sort(), bg.tools], [6, ['Athletics', 'Perception'], true]);
  assert.deepEqual(lib.feats['Lantern Bearer'].plus, ['Wis', 'Cha']);
  assert.equal(lib.feats['Lantern Bearer'].req, 'Wisdom 13 or higher');
  assert.equal(lib.feats['Lucky Lantern'].origin, true);
  assert.equal(lib.feats['Fog Fencing'].style, true);
  assert.equal(lib.feats.Fogstep, undefined);   // features aren't feats
  assert.deepEqual(lib.subclasses.Fighter['Lantern Knight'].features, { 3:['Kindle'], 7:['Bright Ward'] });
  assert.equal(lib.subclasses.Artificer, undefined);   // a class the app doesn't have yet
});

test('monsters become bestiary entries; attacks are read in both stat-block styles', () => {
  const h = lib.monsters.find(x => x.name === 'Bog Hound');
  assert.deepEqual([h.id, h.cr, h.ac, h.hp, h.speed, h.size, h.init, h.fam], ['lib-bog-hound', '2', 13, '6d8+6', 40, 2, 2, 'library']);
  assert.deepEqual(h.attacks, [{ n:'Bite', b:5, d:'2d6+3', t:'piercing' }]);
  assert.ok(h.traits.some(t => t.startsWith('<b>Howl.</b>')));
  assert.ok(!h.traits.some(t => /Challenge\./.test(t)));
  const w = lib.monsters.find(x => x.name === 'Reed Wisp');
  assert.equal(w.cr, '1/4');
  assert.deepEqual(w.attacks[0], { n:'Spark', b:6, d:'1d4+3', t:'lightning', rng:[30, 90] });
  assert.ok(w.traits.some(t => /didn't come through/.test(t)));   // "Hit: ." in the export: said so, not invented quietly
  assert.equal(parseAttack('Claw. Melee Weapon Attack: +9 to hit, reach 5 ft., single target. Hit: 9 (1d8 + 5 Slashing Damage)').d, '1d8+5');
  assert.deepEqual((({ d, t }) => ({ d, t }))(parseAttack('Gnash. Melee Weapon Attack: +7 to hit, reach 10 ft., single target. Hit: 4 (1d8 Force Damage) + 12 (2d8 + 3 Piercing Damage)')), { d:'1d8+2d8+3', t:'force + piercing' });
  assert.deepEqual((({ d, t }) => ({ d, t }))(parseAttack('Maw. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage plus 7 (2d6) fire damage.')), { d:'2d6+3+2d6', t:'piercing + fire' });
  assert.deepEqual(lib.items[0], { n:'Lantern of Long Nights', rarity:'Uncommon', type:'Wondrous Item', attune:'Requires attunement', text:'It burns for a week on one candle.', src:'Tome of Test Fixtures', kind:'canon', lib:true });
});

test('the DM picks which kinds of material to use, and the app\'s own rules win on a name clash', () => {
  assert.deepEqual(kindCounts(lib), { canon:13, ua:2, homebrew:1 });
  const pick = pickLibrary(lib, ['canon'], have);
  assert.ok(!pick.spells.some(s => s.n === 'Fireball'));          // the SRD's Fireball is the one wired into the rules
  assert.ok(!pick.spells.some(s => s.kind !== 'canon'));
  assert.equal(pick.species.Dwarf, undefined);
  assert.deepEqual(libCounts(pick), { spells:2, species:2, backgrounds:1, feats:3, subclasses:1, monsters:1, items:1 });
  assert.equal(libCounts(pickLibrary(lib, ['canon', 'ua', 'homebrew'], have)).spells, 4);
  const cp = creatorPart(pick);
  assert.deepEqual([cp.monsters, cp.items], [[], []]);
  assert.deepEqual(JSON.parse(JSON.stringify(lib)), lib);   // storable and sendable as it is
  assert.throws(() => convertPrism('{"hello":1}'), /compendium/);
});
