import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTER_PLAY } from '../src/data/monster-play.js';
import { SRD_MONSTERS } from '../src/data/srd-monsters.js';
import { parseAction, buildMonsterPlay } from '../scripts/import-monster-actions.mjs';
import { setState, T } from '../src/engine/state.js';
import { areaOf, areaSquares } from '../src/engine/targeting.js';
test('overlay covers every creature and regenerates actions deterministically', () => {
  assert.equal(Object.keys(MONSTER_PLAY).length, 330);
  // Defence parsing is tested in Task 1; injection keeps this PR independently testable.
  let i = 0;
  assert.deepEqual(buildMonsterPlay(() => MONSTER_PLAY[SRD_MONSTERS[i++].id].defenses), MONSTER_PLAY);
  assert.deepEqual(MONSTER_PLAY['srd-young-black-dragon'].actions[0].d, '14d6');
  assert.equal(MONSTER_PLAY['srd-ancient-red-dragon'].legendary, 3);
  assert.equal(MONSTER_PLAY['srd-ancient-red-dragon'].resistDaily, 4);
  assert.equal(MONSTER_PLAY['srd-basilisk'].actions.length, 0);
});
test('every number and mechanic is evidenced by the individual source trait', () => {
  let count = 0;
  for (const m of SRD_MONSTERS) for (const a of MONSTER_PLAY[m.id].actions){
    count++;
    const source = m.traits.find(t => t.startsWith(`<b>${a.n}.`) || t.startsWith(`<b>${a.n} (`));
    assert.ok(source, m.id);
    assert.ok(source.includes(`DC ${a.dc},`));
    assert.ok(source.replace(/\s/g, '').includes(`(${a.d})`));
    assert.match(source, new RegExp(`${a.ty} damage`, 'i'));
    if (a.area) assert.ok(source.includes(`${a.area[1]}-foot`));
    if (a.recharge) assert.ok(source.includes(`Recharge ${a.recharge}`));
    if (a.r) assert.ok(source.includes(`within ${a.r} feet`));
    if (a.half) assert.ok(source.includes('Success: Half damage'));
    if (a.cond) assert.match(source, new RegExp(`has the ${a.cond} condition`, 'i'));
  }
  assert.ok(count > 40);
});
test('every generated area draws squares from the caster', () => {
  const W = 100, H = 100;
  setState({floors:[{W,H,grid:Array(W*H).fill(T.ROOM),doors:[],traps:[],rough:[]}],tokens:[]});
  const caster = {id:'test',floor:0,x:40,y:40,size:1};
  for (const e of Object.values(MONSTER_PLAY)) for (const a of e.actions) if (a.area){
    const result = areaSquares(caster, areaOf(a), {x:45,y:40});
    assert.ok(result.ok && result.squares.size, a.n);
    assert.equal(areaOf(a).range, 0);
  }
});
test('skip attacks, triggered traits, staged conditions and multiple damage types', () => {
  for (const body of ['Melee Attack Roll: +5. Hit: 3 (1d6) Fire damage.', 'When it dies. Dexterity Saving Throw: DC 10, each creature within 30 feet. Failure: 3 (1d6) Fire damage.', 'Wisdom Saving Throw: DC 10, each creature within 30 feet. First Failure: Restrained.', 'Dexterity Saving Throw: DC 10, each creature within 30 feet. Failure: 3 (1d6) Fire damage plus 3 (1d6) Cold damage.']) assert.equal(parseAction(`<b>Test.</b> ${body}`), null);
});
test('legendary counters use printed non-lair counts', () => {
  for (const m of SRD_MONSTERS){
    const e = MONSTER_PLAY[m.id], text = m.traits.join('\n');
    if (e.legendary) assert.ok(text.includes(`Legendary Action Uses:</b> ${e.legendary}`), m.id);
    if (e.resistDaily) assert.ok(text.includes(`Legendary Resistance (${e.resistDaily}/Day`), m.id);
  }
});
