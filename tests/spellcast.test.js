import test from 'node:test';
import assert from 'node:assert/strict';
import { upDice, upRays, addDice, diceAt, concDC, BREAKS_CONC } from '../src/engine/spellcast.js';
import { SPELLS } from '../src/data/srd.js';

const sp = n => SPELLS.find(s => s.n === n);

test('upcasting reads the higher-level rule: more dice, folded together', () => {
  assert.equal(upDice(sp('Fireball')), '1d6');
  assert.equal(diceAt(sp('Fireball'), 3), '8d6');
  assert.equal(diceAt(sp('Fireball'), 5), '10d6');
  assert.equal(diceAt(sp('Cure Wounds'), 3), '6d8');
  assert.equal(diceAt(sp('Magic Missile'), 3), '5d4+5', 'two more darts');
  assert.ok(upRays(sp('Scorching Ray')));
  assert.equal(addDice('2d10+4d6', '1d6', 2), '2d10+6d6');
  assert.equal(diceAt({ l:1, d:'1d8' }, 4), '1d8', 'no higher-level rule, no change');
  // how many of the library's spells the table can upcast from their text
  assert.ok(SPELLS.filter(s => s.l && s.d && upDice(s)).length >= 20);
});

test('concentration: DC 10 or half the damage, at most 30; what breaks it', () => {
  assert.equal(concDC(7), 10); assert.equal(concDC(26), 13); assert.equal(concDC(90), 30);
  for (const c of ['incapacitated', 'paralyzed', 'stunned', 'unconscious']) assert.ok(BREAKS_CONC.has(c));
  assert.ok(!BREAKS_CONC.has('prone'));
  assert.ok(sp('Hold Person').conc && sp('Spirit Guardians').conc && !sp('Fireball').conc);
});

test('Concentration: one spell at a time, and when it ends, what it held lets go', async () => {
  const { setState } = await import('../src/engine/state.js');
  const { addCond, startConc, endConc } = await import('../src/game/rules.js');
  const cleric = { id:'c', name:'Cleric', conds:[] }, a = { id:'a', name:'A', conds:[] }, b = { id:'b', name:'B', conds:[] };
  setState({ tokens:[cleric, a, b], combat:{ active:false, order:[], idx:0, round:0 }, log:[] });
  startConc(cleric, 'Hold Person'); addCond(a, 'paralyzed', -1, 'conc:c'); addCond(a, 'prone', 1);
  // a second, fresh Hold Person frees the first target
  startConc(cleric, 'Hold Person'); addCond(b, 'paralyzed', -1, 'conc:c');
  assert.deepEqual([a.conds.map(c => c.n), b.conds.map(c => c.n)], [['prone'], ['paralyzed']]);
  // stunned (incapacitating) ends it
  addCond(cleric, 'stunned', 1);
  assert.equal(cleric.conc, null);
  assert.deepEqual(b.conds, []);
  assert.equal(endConc(cleric), null);   // nothing left to end
});
