import test from 'node:test';
import assert from 'node:assert/strict';
import { BAROVIA } from '../src/data/bestiary-barovia.js';
import { BESTIARY } from '../src/data/bestiary.js';
import { defensesFor, applyDefenses } from '../src/engine/defenses.js';

const by = id => defensesFor([...BAROVIA, ...BESTIARY].find(b => b.id === id));
const hit = (id, t, n) => applyDefenses([{ t, n }], by(id)).total;

test('the DM\'s rulings for the table\'s own creatures', () => {
  assert.equal(hit('grave-ghoul', 'poison', 10), 0);              // the undead don't feel poison
  assert.ok(by('grave-ghoul').condImmune.includes('charmed'));    // nor are ghouls charmed
  assert.equal(hit('night-spawn', 'necrotic', 10), 5);            // vampire kin resist necrotic
  assert.equal(hit('mist-thing', 'slashing', 10), 5);             // blades pass through the mist
  assert.ok(by('mist-thing').condImmune.includes('grappled'));
  assert.equal(hit('scarecrow-watcher', 'fire', 6), 12);          // straw burns
  assert.equal(hit('seepling', 'poison', 8), 0);                  // the Seep is rot
  assert.equal(hit('sporeling', 'fire', 5), 10);                  // the Bloom burns
  assert.equal(hit('carrier-hulk', 'fire', 5), 5);                // (its Soft Bag trait handles fire itself)
  assert.ok(by('undertow').condImmune.includes('frightened'));
  assert.equal(hit('swarm-of-bats', 'piercing', 9), 4);           // swarms shrug off blades
  assert.deepEqual(by('barovian-wolf'), { resist:[], immune:[], vuln:[], condImmune:[] });   // wolves are only wolves
  assert.equal(hit('andral', 'necrotic', 10), 10);                // the Saint's duality: he takes it, and answers
});
