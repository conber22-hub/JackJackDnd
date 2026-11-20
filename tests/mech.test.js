import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amountOf, newWard, wardSoak, wardTurn, wardRest, wardFrac } from '../src/engine/mech.js';

const fixed = v => (n, s) => n * Math.min(v, s);   // every die shows v (capped at its sides)

test('amounts: numbers, level, proficiency, ability modifiers, dice and arithmetic', () => {
  assert.equal(amountOf('lvl*2', { lvl:5 }), 10);
  assert.equal(amountOf('lvl*2+4', { lvl:1 }), 6);
  assert.equal(amountOf('pb', { lvl:5 }), 3);
  assert.equal(amountOf('pb', { lvl:1 }), 2);
  assert.equal(amountOf('2d8+wis', { lvl:3, mods:{ wis:3 } }, fixed(4)), 11);
  assert.equal(amountOf('1d10+lvl', { lvl:4 }, fixed(10)), 14);
  assert.equal(amountOf('5*lvl', { lvl:3 }), 15);
  assert.equal(amountOf('half lvl', { lvl:7 }), 3);
  assert.equal(amountOf('(lvl+1)*2', { lvl:2 }), 6);
  assert.equal(amountOf('str', { ab:{ Str:16 } }), 3);
  assert.equal(amountOf(7), 7);
});
test('amounts never go below 0, and anything unreadable is 0 (no eval)', () => {
  assert.equal(amountOf('1-5'), 0);
  assert.equal(amountOf('alert(1)'), 0);
  assert.equal(amountOf('lvl;process.exit()'), 0);
  assert.equal(amountOf(''), 0);
  assert.equal(amountOf(null), 0);
  assert.equal(amountOf(undefined), 0);
  assert.equal(amountOf('2 +'), 0);
  assert.equal(amountOf('unknownthing+2'), 2);
  assert.equal(amountOf('1000d6'), 0);
});
test('the Ward soaks a blow before hit points, and breaks', () => {
  const w = newWard({ lvl:3 });
  assert.deepEqual(w, { max:10, now:10, hit:false });
  const a = wardSoak(w, 4);
  assert.deepEqual([a.soaked, a.through, a.broke, a.ward.now, a.ward.hit], [4, 0, false, 6, true]);
  const b = wardSoak(a.ward, 9);
  assert.deepEqual([b.soaked, b.through, b.broke, b.ward.now], [6, 3, true, 0]);
  assert.equal(w.now, 10, 'the input is not changed');
  const none = wardSoak(null, 5);
  assert.equal(none.through, 5);
});
test('the Ward comes back whole only after a round untouched; a rest makes it whole', () => {
  let w = newWard({ lvl:3 });
  w = wardSoak(w, 7).ward;                       // struck since the last turn
  let t = wardTurn(w); assert.equal(t.back, false); assert.equal(t.ward.now, 3); w = t.ward;
  t = wardTurn(w); assert.equal(t.back, true); assert.equal(t.ward.now, 10);   // a round untouched: whole
  assert.equal(wardFrac({ max:10, now:5 }), .5);
  assert.equal(wardRest({ max:10, now:0, hit:true }).now, 10);
  assert.equal(wardTurn(null).back, false);
});

import { whenHolds, mechEdge, mechResist, mechExtra, mechTempHp, mechWard, tempSoak, tempGive } from '../src/engine/mech.js';

test('when: a word, all of several (+), any of several (|), alike words; an unknown word never holds', () => {
  assert.equal(whenHolds(undefined, {}), true);
  assert.equal(whenHolds('fury', { raging:true }), true);
  assert.equal(whenHolds('rage', { raging:false }), false);
  assert.equal(whenHolds('firstHitEachTurn', { firstHit:true }), true);
  assert.equal(whenHolds('bloodied+allyAdjacent', { bloodied:true, allyNear:false }), false);
  assert.equal(whenHolds('bloodied|alone', { alone:true }), true);
  assert.equal(whenHolds('during a full moon', { raging:true }), false);
  assert.equal(whenHolds('always', {}), true);
});
test('advantage and disadvantage from features, by roll and against what', () => {
  const ms = [{ k:'advantage', on:'attack', when:'alone', src:'Last Bastion' }, { k:'advantage', on:'save', vs:'con', src:'Shieldbiter' },
    { k:'disadvantage', on:'attack', when:'hpLow', src:'Hollowed' }, { k:'advantage', on:'save', vs:'frightened', src:'Hearth-Sworn' }];
  assert.deepEqual(mechEdge(ms, 'attack', { alone:true }), { adv:['Last Bastion'], dis:[] });
  assert.deepEqual(mechEdge(ms, 'attack', { alone:false, hpLow:true }), { adv:[], dis:['Hollowed'] });
  assert.deepEqual(mechEdge(ms, 'save', {}, 'con').adv, ['Shieldbiter']);
  assert.deepEqual(mechEdge(ms, 'save', {}, 'dex').adv, []);
  assert.deepEqual(mechEdge(null, 'attack', {}), { adv:[], dis:[] });
});
test('resistances, extra damage (doubled dice on a crit), temporary hit points and the Ward from features', () => {
  const ms = [{ k:'resist', types:['necrotic', 'Poison'], when:'fury', src:'Rotblood' }, { k:'extraDamage', dice:'1d6', type:'fire', when:'firstHitEachTurn', src:'Shardfire' },
    { k:'tempHp', amount:'1d10+lvl', when:'kill', src:'Huscarl' }, { k:'tempHp', amount:'pb', when:'turnStart', src:'Hollowed' }, { k:'ward', max:'lvl*2+4', src:'Vanguard' },
    { k:'heal', amount:'1d8', also:[{ k:'resist', types:['cold'] }], src:'Mender' }];
  assert.deepEqual(mechResist(ms, { raging:true }).sort(), ['cold', 'necrotic', 'poison']);
  assert.deepEqual(mechResist(ms, {}), ['cold']);
  assert.deepEqual(mechExtra(ms, { firstHit:true }, fixed(4)), [{ n:4, type:'fire', src:'Shardfire' }]);
  assert.deepEqual(mechExtra(ms, { firstHit:true, crit:true }, fixed(4)), [{ n:8, type:'fire', src:'Shardfire' }]);
  assert.deepEqual(mechExtra(ms, { firstHit:false }, fixed(4)), []);
  assert.deepEqual(mechTempHp(ms, 'kill', { lvl:3 }, fixed(5)), { n:8, src:'Huscarl' });
  assert.deepEqual(mechTempHp(ms, 'turnStart', { lvl:5 }), { n:3, src:'Hollowed' });
  assert.deepEqual(mechTempHp(ms, 'rest', {}), { n:0, src:'' });
  assert.deepEqual(mechWard(ms, { lvl:2 }), { max:8, src:'Vanguard' });
  assert.equal(mechWard([], {}), null);
  assert.deepEqual(tempSoak(5, 8), { thp:0, soaked:5, through:3 });
  assert.equal(tempGive(4, 7), 7); assert.equal(tempGive(9, 7), 9);
});

import { mechUses, mechResources, seepCosts } from '../src/engine/mech.js';
test('features you use: their uses, as resources, and the price a Seep-touched one takes', () => {
  assert.deepEqual(mechUses('pb/longRest', { lvl:5 }), { max:3, rest:'long' });
  assert.deepEqual(mechUses('1/shortRest'), { max:1, rest:'short' });
  assert.deepEqual(mechUses(undefined), { max:1, rest:'long' });
  const rs = mechResources([{ k:'heal', amount:'2d8+wis', range:5, uses:'pb/longRest', src:'Field Rites' }, { k:'tempHp', amount:'1d10+lvl', when:'bonus', src:'Second Breath' },
    { k:'tempHp', amount:'5', when:'kill', src:'Blood Price' }, { k:'resist', types:['cold'], src:'Hide' },
    { k:'heal', amount:'3d8', src:'Mender of the Choir', also:[{ k:'seepCost', what:'maxHp', amount:'1d4' }] }], { lvl:5 });
  assert.deepEqual(rs.map(r => [r.id, r.max, r.rest, r.use]), [['m-field-rites', 3, 'long', 'mech'], ['m-second-breath', 1, 'long', 'mech'], ['m-mender-of-the-choir', 1, 'long', 'mech']]);
  assert.deepEqual(seepCosts(rs[2].mech, {}, fixed(3)), [{ what:'maxHp', n:3, text:'' }]);
  assert.deepEqual(seepCosts(rs[0].mech), []);
});
