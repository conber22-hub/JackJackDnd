import test from 'node:test';
import assert from 'node:assert/strict';
import { newCourt, raise, alive, title, tauntFor, statsFor, recordFight, advanceCourt, pickAmbushers, addDamage } from '../src/engine/nemesis.js';
import { RANKS, KINDS, STRENGTHS, WEAKNESSES } from '../src/data/court.js';
import { BEST } from '../src/data/bestiary.js';
import { mulberry32 } from '../src/util/core.js';

test('a new court: a warlord, two captains, three hunters, each a real creature with a strength, a weakness and a haunt', () => {
  const c = newCourt(mulberry32(1));
  assert.deepEqual([3, 2, 1].map(r => alive(c).filter(m => m.rank === r).length), [1, 2, 3]);
  assert.equal(new Set(c.members.map(m => m.name)).size, c.members.length, 'every name its own');
  for (const m of c.members){
    assert.ok(KINDS[m.kind] && BEST[KINDS[m.kind].base], `${title(m)} is built on a creature the app has`);
    for (const r of KINDS[m.kind].retinue) assert.ok(BEST[r], `${r} exists`);
    assert.ok(m.strengths.length >= 1 && m.strengths.every(k => STRENGTHS[k]));
    assert.ok(m.weaknesses.length === 1 && WEAKNESSES[m.weaknesses[0]]);
    assert.ok(KINDS[m.kind].haunts.includes(m.haunt));
  }
});

test('rank makes them tougher; strengths and scars change the numbers at the table', () => {
  const c = newCourt(mulberry32(2)), m = raise(c, mulberry32(3), 1, 'hound'); m.strengths = ['thickhide']; m.weaknesses = ['fire'];
  const base = BEST[KINDS.hound.base], s1 = statsFor(m, base);
  m.rank = 3; m.strengths = ['thickhide', 'brutal', 'packmaster'];
  const s3 = statsFor(m, base);
  assert.ok(s3.hp > s1.hp && s3.ac > s1.ac, 'a warlord outlasts a hunter');
  assert.equal(s3.attacks[0].b, base.attacks[0].b + RANKS[3].hit);
  assert.equal(s3.retinue, RANKS[3].retinue + 2);
  assert.deepEqual(s3.vuln, ['fire']);
  assert.equal(addDamage('2d6+3', 2), '2d6+5'); assert.equal(addDamage('1d8', 3), '1d8+3'); assert.equal(addDamage('1d4-1', 1), '1d4');
});

test('death is not the end unless it dies to what it fears', () => {
  const c = newCourt(mulberry32(4)), m = c.members.find(m => m.rank === 3); m.weaknesses = ['fire'];
  let r = recordFight(c, m.id, { outcome:'died', by:'Mira', type:'slashing', place:'the Old Svalich Road', day:3 }, () => .9);
  assert.ok(!r.stays && m.returning && !m.alive, 'the mist takes the body');
  assert.equal(m.scars[0].type, 'slashing'); assert.deepEqual(statsFor(m, BEST[KINDS[m.kind].base]).resist, ['slashing'], 'it comes back resisting what killed it');
  assert.equal(m.grudge.hero, 'Mira');
  // the court moves: it comes back, relentless, hunting the one who killed it
  for (let k = 0; k < 10 && !m.alive; k++) advanceCourt(c, { gaze:3, day:4 + k }, mulberry32(10 + k));
  assert.ok(m.alive && m.strengths.includes('relentless') && m.hunting);
  assert.match(tauntFor(m, () => 0), /Mira/);
  // and fire finishes it
  r = recordFight(c, m.id, { outcome:'died', by:'Mira', type:'fire', place:'the mill' }, () => .9);
  assert.ok(r.stays && !m.alive && !m.returning);
});

test('surviving the party makes them stronger, and they rise in rank', () => {
  const c = newCourt(mulberry32(5)), m = c.members.find(m => m.rank === 1);
  recordFight(c, m.id, { outcome:'won', by:'Tomas', place:'the crossroads' });
  recordFight(c, m.id, { outcome:'won', by:'Tomas', place:'the crossroads' });
  assert.equal(m.rank, 2, 'a hunter who beat them twice is a captain');
  assert.ok(m.grudge.won); assert.match(tauntFor(m, () => 0), /crossroads|Tomas/);
});

test('the court moves on its own: news, hunts, and the ranks always filled', () => {
  const c = newCourt(mulberry32(6)); let rumours = 0;
  for (let d = 1; d <= 30; d++){
    const news = advanceCourt(c, { gaze:1 + (d % 10), day:d }, mulberry32(100 + d));
    rumours += news.filter(n => n.rumour).length;
    assert.deepEqual([3, 2, 1].map(r => alive(c).filter(m => m.rank >= r).length >= ({ 3:1, 2:3, 1:6 })[r]), [true, true, true], `day ${d}: the court is full`);
  }
  assert.ok(rumours > 5, 'there is news to hear in the taverns');
  assert.ok(c.news.length <= 30);
  assert.ok(alive(c).some(m => m.rank === 4), 'at a high Gaze he chooses one');
});

test('ambushers: those hunting the party, and those whose ground the road crosses', () => {
  const c = newCourt(mulberry32(7)); for (const m of c.members) m.hunting = false;
  assert.equal(pickAmbushers(c, { gaze:1, path:[] }, () => .99).length, 0, 'nobody, when nobody is hunting');
  const h = alive(c)[0]; h.hunting = true;
  assert.deepEqual(pickAmbushers(c, { gaze:5, path:[] }, () => .1).map(m => m.id), [h.id]);
  assert.ok(pickAmbushers(c, { gaze:9, path:alive(c).map(m => m.haunt) }, () => .01).length <= 3);
});
