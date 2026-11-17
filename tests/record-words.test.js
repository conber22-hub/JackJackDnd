import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AWARDS } from '../src/data/fight-summary.js';

// game/record.js `one` (copied here: the module itself pulls in the screens): a count of one reads as one
const one = line => String(line).replace(/\b1 times\b/g, 'once').replace(/\b1 ((?:[a-z]+ )?)(\w+?)(es|s)\b/g, (m, adj, w, end) => `1 ${adj}${end === 'es' && /(ss|sh|ch|x)$/.test(w) ? w : end === 'es' ? w + 'e' : w}`);
test('an award for one of something says one', () => {
  const said = AWARDS.map(a => one(a.line.replace('{name}', 'Vasha').replace('{n}', '1')));
  assert.ok(said.includes('Vasha ended 1 foe.'));
  assert.ok(said.includes('Vasha landed 1 critical blow.'));
  assert.ok(said.includes('Vasha kept trying through 1 miss.'));
  assert.ok(said.includes('Vasha chose Dodge once.'));
  assert.ok(said.includes('Vasha cast 1 spell.'));
  assert.ok(said.includes('Vasha dealt 1 damage.'));
  assert.equal(one('Vasha ended 3 foes.'), 'Vasha ended 3 foes.');
});
