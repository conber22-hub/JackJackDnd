import test from 'node:test';
import assert from 'node:assert/strict';
import { report } from '../scripts/callings-balance.mjs';
import { BEST } from '../src/data/bestiary.js';
import { CALLINGS } from '../src/data/callings.js';
import { simulate } from '../src/engine/balance.js';
import { mulberry32 } from '../src/util/core.js';

test('a seeded trial is repeatable with an id or the corresponding bestiary entry', () => {
  const setup = { calling:'huscarl', path:'rotblood', lvl:5, foe:'husk', fights:30 };
  const result = simulate({ ...setup, rng:mulberry32(52) });
  assert.deepEqual(result, simulate({ ...setup, foe:BEST.husk, rng:mulberry32(52) }));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.ok(result.featuresUsed['Red Blisters'] > 0);
  assert.ok(result.seep.marks + result.seep.drain + result.seep.hp > 0);
});

test('the same level five build usually beats a CR 1/4 foe and loses to CR 8', () => {
  const setup = { calling:'warden', path:'last-bastion', lvl:5 };
  assert.equal(BEST.wolf.cr, '1/4');
  assert.equal(BEST['srd-frost-giant'].cr, '8');
  assert.ok(simulate({ ...setup, foe:'wolf', rng:mulberry32(37) }).won >= .95);
  assert.ok(simulate({ ...setup, foe:'srd-frost-giant', rng:mulberry32(37) }).won <= .05);
});

test('every Calling and Path simulates at each level from one to ten', () => {
  for (const { id:calling, paths } of Object.values(CALLINGS)){
    for (const { id:path } of paths){
      for (let lvl = 1; lvl <= 10; lvl++){
        const result = simulate({ calling, path, lvl, fights:2 });
        assert.ok(result.won >= 0 && result.won <= 1);
        assert.ok(result.rounds >= 1 && result.rounds <= 30);
        for (const value of [result.dmgDealt, result.dmgTaken, result.hpLeft, ...Object.values(result.featuresUsed)]){
          assert.ok(Number.isFinite(value) && value >= 0, `${calling} / ${path} at level ${lvl}`);
        }
      }
    }
  }
});

test('the report includes each Calling and Path at the requested level', () => {
  const output = report([3]);
  assert.match(output, /^## Level 3 /m);
  assert.doesNotMatch(output, /^## Level (5|10) /m);
  const rows = output.split('\n').filter(line => /^\| (?!Calling|---)/.test(line));
  assert.equal(rows.length, 36);
  for (const { name, paths } of Object.values(CALLINGS)){
    for (const path of paths) assert.equal(rows.filter(row => row.startsWith(`| ${name} | ${path.name} | `)).length, 1);
  }
  assert.match(output, /Seep price \(mark \/ drain \/ HP\)/);
  assert.match(output, /Win↑/);
  assert.match(output, /Win↓/);
});
