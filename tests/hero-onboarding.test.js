import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES, SPECIES, BACKGROUNDS } from '../src/data/srd.js';
import { heroToken, heroWarnings, spellPool, spellLimits, SP } from '../src/engine/hero.js';
import { migrateSheet } from '../src/engine/inventory.js';
import { heroStarterCards, buildStarterHero } from '../src/engine/hero-starters.js';
import { newTablePassport, rememberTable, rememberedHero, planTableEntry } from '../src/engine/table-entry.js';

const clone = value => JSON.parse(JSON.stringify(value));

test('starter drafts survive the existing sheet and token pipeline with usable equipment and spells', () => {
  const cards = heroStarterCards();
  assert.equal(cards.length, 6);
  assert.equal(new Set(cards.map(card => card.cls)).size, cards.length);
  for (const card of cards) {
    const hero = buildStarterHero(card.id, { name: ' Aven ', id: 'pc-' + card.id });
    const cls = CLASSES[hero.cls], bg = BACKGROUNDS[hero.bg];
    assert.equal(hero.name, 'Aven');
    assert.equal(hero.lvl, 1);
    assert.equal(hero.cls, card.cls);
    assert.ok(SPECIES[hero.sp]);
    if (SPECIES[hero.sp].opts) assert.ok(Object.values(SPECIES[hero.sp].opts).flat().includes(hero.spOpt));
    assert.ok(bg.ab.includes(hero.bg2) && bg.ab.includes(hero.bg1) && hero.bg2 !== hero.bg1);
    assert.equal(hero.skills.length, cls.skills[0]);
    assert.ok(hero.skills.every(skill => cls.skills[1].includes(skill) && !bg.skills.includes(skill)));
    assert.ok(hero.expert.every(skill => [...hero.skills, ...bg.skills].includes(skill)));
    const pool = new Set(spellPool(hero).map(spell => spell.n));
    assert.ok(hero.spells.every(spell => pool.has(spell)), card.id);
    const limits = spellLimits(hero);
    assert.equal(hero.spells.filter(name => SP(name).l === 0).length, limits.cantrips);
    assert.equal(hero.spells.filter(name => SP(name).l > 0).length, limits.prepared);
    assert.deepEqual(heroWarnings(hero), []);
    const token = heroToken(migrateSheet(clone(hero)));
    assert.equal(token.charId, hero.id);
    assert.ok(token.maxHp > 0 && token.ac >= 10);
    assert.ok(hero.weapons.every(name => token.attacks.some(attack => attack.n === name)), card.id);
    if (hero.spells.length) assert.ok(token.casts.length, card.id);
  }
});

test('starters stay editable and never alter the template or another draft', () => {
  const starter = buildStarterHero('shadow');
  assert.equal(starter.name, '');
  assert.ok(heroWarnings(starter).includes('Give your hero a name.'));
  starter.skills.push('Nature');
  starter.weapons.splice(0);
  starter.ab.Dex = 3;
  const next = buildStarterHero('shadow');
  assert.notEqual(next.id, starter.id);
  assert.equal(next.ab.Dex, 15);
  assert.equal(next.skills.length, 4);
  assert.ok(next.weapons.length);
  assert.throws(() => buildStarterHero('__proto__'), /Unknown hero starter/);
});

const welcome = Object.freeze({ tableId: 'campaign-1', label: '  Barovia  ', code: 'abcd', at: 100, heroId: 'hero-a',
  key: 'private-key', password: 'private-word', sheet: { notes: 'DM notes' } });

test('table history keys by campaign, handles code changes and remembers only allowed metadata', () => {
  const blank = Object.freeze({ tables: Object.freeze([]) });
  const first = rememberTable(blank, welcome);
  assert.deepEqual(blank, newTablePassport());
  assert.deepEqual(first.tables, [{ tableId: 'campaign-1', label: 'Barovia', code: 'ABCD', at: 100, heroId: 'hero-a' }]);
  const second = rememberTable(first, { ...welcome, tableId: 'campaign-2', label: 'One-shot', at: 150, heroId: 'hero-b' });
  const third = rememberTable(second, { ...welcome, code: 'WXYZ', at: 200, heroId: null });
  assert.deepEqual(third.tables.map(table => [table.tableId, table.code]), [['campaign-1', 'WXYZ'], ['campaign-2', 'ABCD']]);
  assert.equal(third.tables[0].heroId, 'hero-a');
  assert.equal(rememberTable(third, welcome), third);
  let bounded = third;
  for (let n = 1; n <= 10; n++) bounded = rememberTable(bounded, { ...welcome, tableId: 'table-' + n, at: 200 + n });
  assert.equal(bounded.tables.length, 8);
  assert.equal(bounded.tables.at(-1).tableId, 'table-3');
});

test('a remembered hero is only suggested after the expected table and owned roster match', () => {
  const book = clone(rememberTable(undefined, welcome));
  const match = { expectedTableId: 'campaign-1', actualTableId: 'campaign-1', ownedHeroIds: ['hero-a'] };
  assert.equal(rememberedHero(book, match), 'hero-a');
  assert.equal(rememberedHero(book, { ...match, actualTableId: 'campaign-2' }), null);
  assert.equal(rememberedHero(book, { ...match, ownedHeroIds: ['hero-b'] }), null);
});

const owned = Object.freeze({ id: 'tok-a', kind: 'pc', charId: 'hero-a', name: 'Aven' });
const foreign = Object.freeze({ id: 'tok-b', kind: 'pc', charId: 'hero-b', name: 'Aven' });

test('seating uses host-owned hero IDs rather than names, submitted IDs or an occupied token', () => {
  const common = { ownedHeroIds: ['hero-a'], tokens: [foreign, owned] };
  assert.deepEqual(planTableEntry({ ...common, lastTokenId: 'tok-b' }), { kind: 'seat', heroId: 'hero-a', tokenId: 'tok-a' });
  assert.deepEqual(planTableEntry({ ...common, requestedHeroId: 'hero-b' }), { kind: 'denied', reason: 'hero-unavailable' });
  assert.deepEqual(planTableEntry({ ...common, occupiedTokenIds: ['tok-a'] }), { kind: 'waiting', reason: 'seat-taken', heroId: 'hero-a' });
  assert.deepEqual(planTableEntry({ tokens: [owned], lastTokenId: 'tok-a' }), { kind: 'waiting', reason: 'no-hero' });
});

test('returning players can recover a waiting hero, while new placements wait for the scene', () => {
  const common = { ownedHeroIds: ['hero-a', 'hero-c', 'hero-a'], tokens: [owned, foreign], preparing: true };
  assert.deepEqual(planTableEntry(common), { kind: 'choose', heroIds: ['hero-a', 'hero-c'] });
  assert.deepEqual(planTableEntry({ ...common, lastTokenId: owned.id }), { kind: 'seat', heroId: 'hero-a', tokenId: owned.id });
  assert.deepEqual(planTableEntry({ ...common, requestedHeroId: 'hero-c' }), { kind: 'waiting', reason: 'scene-preparing', heroId: 'hero-c' });
  assert.deepEqual(planTableEntry({ ...common, requestedHeroId: 'hero-c', preparing: false }), { kind: 'place', heroId: 'hero-c' });
  for (const token of [{ ...owned, dead: true }, { ...owned, flags: { gone: true } }]) {
    assert.deepEqual(planTableEntry({ ownedHeroIds: ['hero-a'], tokens: [token] }),
      { kind: 'waiting', reason: 'hero-off-map', heroId: 'hero-a' });
  }
});
