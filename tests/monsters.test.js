import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SRD_MONSTERS } from '../src/data/srd-monsters.js';
import { BEST, BESTIARY, FAMILIES, rebuildBestiary, setLibraryBestiary } from '../src/data/bestiary.js';
import { BAROVIA } from '../src/data/bestiary-barovia.js';
import { makeMonster } from '../src/engine/state.js';
import { avgDice, rollDice, parseAttacks, attacksToText } from '../src/util/core.js';
const index = JSON.parse(readFileSync(new URL('./fixtures/srd-monster-index.json', import.meta.url)));
const get = name => SRD_MONSTERS.find(m => m.name === name);
const dice = /^(?:\d+d[1-9]\d*|\d+)(?:[+-](?:\d+d[1-9]\d*|\d+))*$/;

test('all 330 creatures match the independent official PDF stat inventory', () => {
  assert.equal(SRD_MONSTERS.length, 330);
  assert.equal(new Set(SRD_MONSTERS.map(m => m.id)).size, 330);
  assert.equal(new Set(SRD_MONSTERS.map(m => m.name)).size, 330);
  assert.deepEqual(SRD_MONSTERS.map(m => m.name).sort(), index.map(m => m.name).sort());
  for (const expected of index){
    const m = get(expected.name);
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(m[key], value, `${m.name}: ${key}`);
    assert.match(m.cr, /^(?:0|1\/8|1\/4|1\/2|[1-9]|[12]\d|30)$/);
    assert.ok(m.ac >= 5 && m.ac <= 30); assert.match(m.hp, dice); assert.ok(avgDice(m.hp) > 0);
    assert.ok(m.size >= 1 && m.size <= 4 && m.speed >= 0);
    assert.equal(m.fam, 'srd'); assert.equal(m.src, 'SRD 5.2.1');
    assert.ok(m.spd && m.senses && m.look && m.text);
    assert.ok(Array.isArray(m.traits));
  }
  assert.equal(get('Ancient Red Dragon').stats.Int, 18);
  assert.equal(get('Remorhaz').saves.dex, 1);
  assert.equal(get("Will-o'-Wisp").stats.Wis, 14);
  assert.equal(get('Young White Dragon').saves.int, 2, 'retain the printed SRD save, despite its -2 modifier');
});

test('every attack rolls and round-trips through the existing attack editor', () => {
  let count = 0;
  for (const m of SRD_MONSTERS){
    const parsed = parseAttacks(attacksToText(m.attacks));
    assert.equal(parsed.length, m.attacks.length);
    m.attacks.forEach((a, i) => {
      count++;
      assert.ok(Number.isInteger(a.b)); assert.match(a.d, dice, `${m.name}: ${a.n}`);
      assert.ok(Number.isFinite(rollDice(a.d).total)); assert.ok(a.text);
      for (const key of ['n','b','d','t','f']) assert.equal(parsed[i][key], a[key]);
      for (const part of a.parts) assert.match(part.d, dice);
      if (a.reach) assert.ok(a.reach > 0);
      if (a.rng) assert.ok(a.rng.every(n => n > 0));
    });
  }
  assert.equal(count, 423);
  assert.deepEqual(SRD_MONSTERS.filter(m => !m.attacks.length).map(m => m.name).sort(), ['Seahorse','Shrieker Fungus']);
  const tentacle = get('Roper').attacks.find(a => a.n === 'Tentacle');
  assert.equal(tentacle.d, '0'); assert.equal(tentacle.reach, 12); assert.match(tentacle.text, /Grappled/);
  assert.equal(get('Cat').attacks[0].d, '1');
  assert.equal(get('Swarm of Rats').attacks[0].d, '2d4');
  assert.equal(get('Goblin Warrior').attacks[0].d, '1d6+2');
  assert.deepEqual(get('Goblin Warrior').attacks[1].rng, [80,320]);
  assert.deepEqual(get('Ancient Red Dragon').attacks[0].parts, [{d:'2d8+10',t:'slashing'},{d:'3d6',t:'fire'}]);
});

test('creatures use supported mini shapes and can become tokens', () => {
  const renderer = readFileSync(new URL('../src/render/minis.js', import.meta.url), 'utf8');
  const shapes = new Set([...renderer.matchAll(/^  (\w+)\([bt]\)\{/gm)].map(m => m[1]));
  for (const m of SRD_MONSTERS){
    assert.ok(shapes.has(m.shape), `${m.name}: ${m.shape}`);
    const token = makeMonster(m.id, 0, 1, 2);
    assert.equal(token.ac, m.ac); assert.equal(token.init, m.init); assert.equal(token.speed, m.speed);
    assert.equal(token.hp, avgDice(m.hp)); assert.deepEqual(token.attacks, m.attacks);
    assert.notEqual(token.attacks, m.attacks);
  }
});

test('registry has no SRD ID clashes and preserves existing, Barovia, library and custom precedence', () => {
  const ids = new Set([...BESTIARY, ...BAROVIA].map(m => m.id));
  assert.ok(FAMILIES.srd);
  for (const m of SRD_MONSTERS){ assert.ok(!ids.has(m.id)); assert.equal(BEST[m.id], m); }
  const original = BAROVIA[0];
  SRD_MONSTERS.push({...original, name:'Lower-priority test duplicate'});
  try {
    setLibraryBestiary([{...original, name:'Library duplicate'}, {...get('Cat'), id:'test-library-cat'}]);
    rebuildBestiary({});
    assert.equal(BEST[original.id], original);
    assert.equal(BEST['test-library-cat'].name, 'Cat');
    rebuildBestiary({'srd-cat':{...get('Cat'), ac:22}});
    assert.equal(BEST['srd-cat'].ac, 22); assert.equal(BEST['srd-cat'].custom, true);
    assert.equal(get('Cat').ac, 12);
  } finally { SRD_MONSTERS.pop(); setLibraryBestiary([]); rebuildBestiary({}); }
});
