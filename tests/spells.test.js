import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPELLS as reexported } from '../src/data/srd.js';
import { TABLE_PLAY } from '../src/data/spell-play.js';
import { SPELLS, SRD_SPELLS } from '../src/data/srd-spells.js';
import { EXTRA_SPELLS } from '../src/data/extra-spells.js';
import { FLOOD_SPELLS } from '../src/data/flood-spells.js';
import { newHero, heroAttacks, castables, spellPool } from '../src/engine/hero.js';
import { setState, T } from '../src/engine/state.js';
import { areaOf, areaSquares } from '../src/engine/targeting.js';

// Independent inventory extracted from the official PDF, pp. 107–175, not the Markdown importer.
const index = JSON.parse(readFileSync(new URL('./fixtures/srd-spell-index.json', import.meta.url)));
const spell = n => { const s = SPELLS.find(s => s.n === n); assert.ok(s, n); return s; };
const byName = rows => [...rows].sort((a, b) => a.n.localeCompare(b.n));

test('every official SRD 5.2.1 spell is present with its level, school and class list', () => {
  assert.equal(SRD_SPELLS.length, 339);
  assert.deepEqual(Array.from({ length:10 }, (_, l) => SRD_SPELLS.filter(s => s.l === l).length),
    [27, 57, 57, 42, 34, 38, 31, 20, 17, 16]);
  const identity = ({ n, l, c, school }) => ({ n, l, c, school });
  assert.deepEqual(byName(SRD_SPELLS.map(identity)), byName(index.map(identity)));
  assert.ok(SRD_SPELLS.every(s => s.src === 'SRD 5.2.1' && !s.homebrew));
  // srd.js hands the app the same library, in the same order, with the table's combat fields on top (spell-play.js)
  assert.deepEqual(reexported.map(s => s.n), SPELLS.map(s => s.n));
  assert.ok(reexported.every((s, i) => s === SPELLS[i] || TABLE_PLAY[s.n]));
  assert.deepEqual(SPELLS, [...SRD_SPELLS, ...EXTRA_SPELLS, ...FLOOD_SPELLS]);
});

test('library entries are complete, uniquely named and serialisable for saves and multiplayer', () => {
  const names = SPELLS.map(s => s.n.normalize('NFKC').toLowerCase());
  assert.equal(new Set(names).size, SPELLS.length);
  for (const s of SPELLS){
    for (const key of ['n', 'c', 'school', 'time', 'range', 'comp', 'dur', 'text', 'src'])
      assert.ok(typeof s[key] === 'string' && s[key].trim(), `${s.n}: ${key}`);
    assert.ok(Number.isInteger(s.l) && s.l >= 0 && s.l <= 9, s.n);
    assert.match(s.c, /^[BCDPRSKW]+$/, s.n);
    assert.equal(new Set(s.c).size, s.c.length, s.n);
    assert.ok(Number.isSafeInteger(s.r) && s.r >= 0, s.n);
    assert.match(s.k, /^(atk|save|auto|heal|buff|util)$/, s.n);
    assert.equal(!!s.conc, /Concentration/.test(s.dur), s.n);
    assert.equal(!!s.ritual, /Ritual/.test(s.time), s.n);
    if (s.cs) assert.equal(s.l, 0, s.n);
    if (s.k === 'save') assert.match(s.sv, /^(str|dex|con|int|wis|cha)$/, s.n);
    if (['atk', 'heal'].includes(s.k)) assert.ok(s.d, s.n);
    if (s.d) assert.match(s.d, /^\d+(?:d\d+)?(?:[+-]\d+(?:d\d+)?)*$/, s.n);
    if (s.hl) assert.ok(typeof s.hl === 'string' && s.hl.trim(), s.n);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(SPELLS)), SPELLS);
});

test('spell descriptions preserve embedded creatures, tables, rituals and higher-slot rules', () => {
  assert.match(spell('Animate Objects').text, /#### Animated Object[\s\S]+Slam/);
  assert.match(spell('Find Steed').text, /Otherworldly Steed[\s\S]+Healing Touch/);
  assert.match(spell('Giant Insect').text, /Venomous Spew/);
  assert.match(spell('Summon Dragon').text, /Breath Weapon/);
  assert.match(spell('Teleport').text, /<table>[\s\S]+Mishap[\s\S]+On Target/);
  assert.match(spell('Wish').text, /33 percent chance/);
  assert.match(spell('Fireball').hl, /1d6.*above 3/);
  assert.doesNotMatch(spell('Fireball').text, /Using a Higher-Level/);
  assert.match(spell('Animate Objects').hl, /1d12/);
  assert.equal(spell('Detect Magic').ritual, true);
  assert.equal(spell('Find Familiar').ritual, true);
  assert.match(spell('Counterspell').time, /Reaction.*casting a spell/);
  assert.match(spell('Revivify').comp, /300\+ GP.*consumes/);
  assert.match(spell('Barkskin').comp, /handful of bark/);
  assert.equal(spell('Sending').r, Number.MAX_SAFE_INTEGER);
  assert.equal(spell('Arcane Eye').r, 30);
  assert.equal(spell('Storm of Vengeance').r, 5280);
});

test('every automated area is understood and produces squares in the actual targeting engine', () => {
  const W = 80, H = 80, caster = { id:'caster', floor:0, x:40, y:40, size:1 };
  setState({ floors:[{ W, H, grid:Array(W * H).fill(T.ROOM), doors:[], traps:[], rough:[] }], tokens:[] });
  const supported = new Set(['sphere', 'cylinder', 'cube', 'cone', 'line', 'aura']);
  for (const s of SPELLS.filter(s => s.area)){
    assert.ok(supported.has(s.area[0]), `${s.n}: ${s.area[0]}`);
    assert.ok(Number.isFinite(s.area[1]) && s.area[1] > 0, s.n);
    const area = areaOf(s), result = areaSquares(caster, area, { x:43, y:40 });
    assert.equal(result.ok, true, s.n);
    assert.ok(result.squares.size > 0, s.n);
  }
});

test('unsupported effects stay manual instead of applying invented conditions or damage', () => {
  for (const n of ['Bane', 'Command', 'Dissonant Whispers', 'Sleep', 'Chromatic Orb', 'Ice Knife',
    'Ice Storm', 'Flame Strike', 'Meteor Swarm', 'Heal', 'Power Word Kill', 'Sorcerous Burst', 'Toll the Dead']){
    const s = spell(n);
    assert.equal(s.k, 'util', n);
    assert.equal(s.cond, undefined, n);
    assert.equal(s.d, undefined, `${n}: util + d would be interpreted as a smite`);
  }
  const h = newHero('Wizard'); h.lvl = 5; h.spells = ['Fire Bolt', 'Fireball', 'Scorching Ray', 'Sleep'];
  assert.equal(heroAttacks(h).find(s => s.n === 'Fire Bolt').d, '2d10');
  assert.equal(heroAttacks(h).find(s => s.sn === 'Scorching Ray').d, '2d6');
  const fireball = castables(h).find(s => s.n === 'Fireball');
  assert.deepEqual([fireball.d, fireball.sv, fireball.half, fireball.r, fireball.area],
    ['8d6', 'dex', true, 150, ['sphere', 20]]);
  // at the table (spell-play.js) Sleep is a Wisdom save against Incapacitated; the data layer above stays manual
  assert.deepEqual((({ k, sv, cond }) => ({ k, sv, cond }))(castables(h).find(s => s.n === 'Sleep')), { k:'save', sv:'wis', cond:'incapacitated' });
  assert.ok(spellPool(h).some(s => s.n === 'Find Familiar'));
  const paladin = newHero('Paladin'); paladin.lvl = 2;
  assert.equal(castables(paladin).find(s => s.n === 'Divine Smite').smite, 1);
});

test('supplemental spells survive the move and original Flood spells are clearly distinguished', () => {
  assert.deepEqual(EXTRA_SPELLS.map(s => s.n).sort(),
    ['Armor of Agathys', 'Thorn Whip', 'Toll the Dead', 'Word of Radiance']);
  assert.equal(FLOOD_SPELLS.length, 10);
  assert.deepEqual(FLOOD_SPELLS.map(s => s.l), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(FLOOD_SPELLS.every(s => s.homebrew && s.src === 'Flood Edition homebrew' && s.note.includes(s.text)));
  const h = newHero('Wizard'); h.lvl = 5; h.spells = ['Spore Needle', 'Cyst Rupture', 'Synapse Sever'];
  assert.equal(heroAttacks(h).find(s => s.n === 'Spore Needle').d, '2d6');
  const cyst = castables(h).find(s => s.n === 'Cyst Rupture');
  assert.deepEqual([cyst.d, cyst.ty, cyst.sv, cyst.half], ['3d6', 'acid', 'dex', true]);
  assert.match(castables(h).find(s => s.n === 'Synapse Sever').note, /collective/);
});

test('at the table, the spells heroes cast most roll their dice; the DM\'s calls stay manual', () => {
  const play = n => { const s = reexported.find(s => s.n === n); assert.ok(s, n); return s; };
  for (const [n, k] of [['Magic Missile', 'auto'], ['Hold Person', 'save'], ['Spirit Guardians', 'save'], ['Moonbeam', 'save'], ['Spiritual Weapon', 'atk'],
    ['Toll the Dead', 'save'], ['Web', 'save'], ['Fear', 'save'], ['Flame Strike', 'save'], ['Hold Monster', 'save'], ['Charm Person', 'save']]) assert.equal(play(n).k, k, n);
  for (const n of ['Bane', 'Command', 'Heal', 'Meteor Swarm', 'Power Word Kill', 'Sorcerous Burst']) assert.equal(play(n).k, 'util', n);
  for (const [n, s] of Object.entries(TABLE_PLAY)){
    assert.ok(SPELLS.some(x => x.n === n), `${n} is in the library`);
    assert.ok(s.k !== 'util', `${n}: an override that changes nothing`);
    if (s.k === 'save') assert.match(s.sv, /^(str|dex|con|int|wis|cha)$/, n);
    if (s.area) assert.ok(['sphere', 'cube', 'cone', 'line', 'cylinder', 'aura'].includes(s.area[0]), n);
    if (s.cond) assert.ok(s.cond === s.cond.toLowerCase(), n);
  }
});
