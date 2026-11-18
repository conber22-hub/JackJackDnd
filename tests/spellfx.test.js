import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spellLook, spellPath, wavesFrom } from '../src/engine/spellfx.js';

test('a spell looks like its element, or like what it does', () => {
  assert.equal(spellLook({ ty:'fire' }).kind, 'fire');
  assert.equal(spellLook({ ty:'Fire' }).motes, 'rise');
  assert.equal(spellLook({ ty:'cold' }).motes, 'fall');
  assert.ok(spellLook({ ty:'lightning' }).bolt);
  assert.ok(spellLook({ ty:'radiant' }).pillar);
  assert.equal(spellLook({ ty:'necrotic' }).light, 0, 'necrotic darkens, it does not light');
  assert.equal(spellLook({ k:'heal', ty:'' }).kind, 'heal');
  assert.equal(spellLook({ k:'buff' }).kind, 'help');
  assert.equal(spellLook({ k:'save', cond:'paralyzed' }).kind, 'hold');
  assert.equal(spellLook({}).kind, 'force');
  for (const ty of ['fire', 'cold', 'lightning', 'thunder', 'force', 'radiant', 'necrotic', 'acid', 'poison', 'psychic']){ const l = spellLook({ ty }); assert.match(l.col, /^#[0-9a-f]{6}$/); assert.match(l.col2, /^#[0-9a-f]{6}$/); }
});

test('how it travels: from its shape and its aim', () => {
  assert.equal(spellPath({ shape:'sphere' }), 'burst');
  assert.equal(spellPath({ shape:'cube', self:true }), 'aura');
  assert.equal(spellPath({ shape:'aura' }), 'aura');
  assert.equal(spellPath({ shape:'cone' }), 'cone');
  assert.equal(spellPath({ shape:'line' }), 'line');
  assert.equal(spellPath({ k:'auto', darts:3 }), 'darts');
  assert.equal(spellPath({ kind:'radiant' }), 'pillar');
  assert.equal(spellPath({ kind:'necrotic' }), 'touch');
  assert.equal(spellPath({ kind:'heal' }), 'touch');
});

test('a cone pours out nearest first', () => {
  const sq = [{ x:3, y:0 }, { x:1, y:0 }, { x:2, y:0 }, { x:2, y:1 }];
  const w = wavesFrom(sq, { x:.5, y:.5 });
  assert.deepEqual(w[0], [{ x:1, y:0 }]);
  assert.ok(w[1].some(s => s.x === 2 && s.y === 0));
  assert.deepEqual(w[w.length - 1].at(-1), { x:3, y:0 });
  assert.equal(w.flat().length, 4);
});
