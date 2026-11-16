import { test as it } from 'node:test';
import assert from 'node:assert/strict';
import { TIPS, COOLDOWN_MS, FIGHT_COOLDOWN_MS } from '../src/data/coach.js';
import { test, nextTip, learn, mute, fill, reset, CONDITION_KEYS, LABELS } from '../src/engine/coach.js';
const seat = { now:0, where:'table', mode:'handheld' };
const fight = { ...seat, fight:true, myTurn:true, target:{ seen:true, inReach:false }, moveLeft:30 };
function freeze(v){ if (v && typeof v === 'object'){ Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
it('catalogue is complete, unique and short in every mode', () => {
  assert.ok(TIPS.length >= 45);
  assert.equal(new Set(TIPS.map(t => t.id)).size, TIPS.length);
  const ops = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'includes', 'present'];
  for (const t of TIPS){
    assert.equal(t.once, true); assert.ok(Number.isFinite(t.priority)); assert.ok(t.cooldownMs >= 0);
    for (const [key, rule] of Object.entries(t.when)){
      assert.ok(CONDITION_KEYS.includes(key), key);
      if (rule && typeof rule === 'object') for (const op of Object.keys(rule)) assert.ok(ops.includes(op), op);
    }
    for (const mode of Object.keys(LABELS)){
      const text = fill(t.text, mode);
      assert.ok(text.length < 110, `${t.id}/${mode}: ${text.length} ${text}`); assert.doesNotMatch(text, /[{}]/);
    }
  }
});
it('prerequisites exist and form an acyclic graph', () => {
  const byId = Object.fromEntries(TIPS.map(t => [t.id, t]));
  function visit(id, path){
    assert.ok(byId[id], id); assert.ok(!path.includes(id), `cycle: ${[...path, id]}`);
    byId[id].after.forEach(parent => visit(parent, [...path, id]));
  }
  TIPS.forEach(t => visit(t.id, []));
});
it('conditions fail closed and support missing fields, ratios and membership', () => {
  assert.ok(test({ fight:false, moveLeft:0, 'target.seen':false }, {}));
  assert.ok(test({ 'hp/maxHp':{ lt:.3, gt:0 }, conditions:{ includes:'prone' }, mode:{ in:['pad', 'keys'] } }, { hp:2, maxHp:10, conditions:['prone'], mode:'pad' }));
  assert.ok(test({ hp:{ eq:2, ne:1, lte:2, gte:2 } }, { hp:2 }));
  assert.ok(test({ doorNear:{ present:true } }, { doorNear:{ open:false } }));
  assert.equal(test({ doorNear:{ present:true } }, {}), false);
  for (const when of [{ secret:true }, { hp:{ wat:3 } }, { hp:[] }, { hp:{} }, { 'hp/maxHp':{ lt:.3 } }]) assert.equal(test(when, {}), false);
  assert.equal(test({ 'hp/maxHp':{ lt:.3 } }, { hp:0, maxHp:0 }), false);
  assert.ok(test({ 'hp/maxHp':{ lt:.3 } }, { maxHp:10 }));
});
it('first seating welcomes, then respects the exact cooldown including time zero', () => {
  const first = nextTip(seat); assert.equal(first.tip.id, 'welcome');
  assert.equal(nextTip({ ...seat, now:COOLDOWN_MS - 1 }, first.memory).tip, null);
  assert.equal(nextTip({ ...seat, now:COOLDOWN_MS }, first.memory).tip.id, 'walk');
});
it('combat offers movement out of reach and striking in reach', () => {
  assert.equal(nextTip(fight).tip.id, 'walk-closer');
  assert.equal(nextTip(fight, learn({}, 'step')).tip.id, 'walk-closer');
  assert.equal(learn({}, 'strike').learnt.reach, true);
  assert.equal(nextTip({ ...fight, target:{ seen:true, inReach:true } }).tip.id, 'turn-strike');
  assert.notEqual(nextTip({ ...fight, target:null }).tip?.id, 'walk-closer');
  const first = nextTip(fight);
  assert.equal(nextTip({ ...fight, now:FIGHT_COOLDOWN_MS - 1 }, first.memory).tip, null);
  assert.ok(nextTip({ ...fight, target:{ seen:true, inReach:true }, now:FIGHT_COOLDOWN_MS }, first.memory).tip);
});
it('once tips never repeat even through many calls', () => {
  let memory = reset(); const seen = new Set();
  for (let now = 0; now < 4000000; now += 150000){
    const r = nextTip({ ...seat, now, sessionMs:now }, memory); memory = r.memory;
    if (r.tip){ assert.ok(!seen.has(r.tip.id)); seen.add(r.tip.id); }
  }
  assert.ok(seen.size > 4);
});
it('learning and observed actions suppress matching skills even while muted', () => {
  const ready = { ...fight, target:{ seen:true, inReach:true } };
  assert.notEqual(nextTip(ready, learn({}, 'strike')).tip?.id, 'turn-strike');
  assert.notEqual(nextTip({ ...ready, justDid:'strike' }).tip?.id, 'turn-strike');
  assert.equal(nextTip({ ...ready, justDid:'cast' }, mute()).memory.learnt.cast, true);
  assert.deepEqual(learn({}, 'none'), reset());
});
it('mute and overlays suppress everything without consuming a tip', () => {
  assert.equal(nextTip(fight, mute()).tip, null); assert.ok(nextTip(fight, mute(mute(), false)).tip);
  for (const flag of ['cardUp', 'menuOpen', 'sheetOpen']){
    const r = nextTip({ ...fight, [flag]:true }); assert.equal(r.tip, null); assert.deepEqual(r.memory.seen, {});
  }
});
it('fill adapts controls and leaves unknown placeholders visible', () => {
  assert.equal(fill('{A}', 'keys'), 'Space'); assert.equal(fill('{A}', 'handheld'), 'A');
  assert.equal(fill('{X} {Y} {SELECT} {VIEW}', 'keys'), 'F Tab I V');
  assert.equal(fill('{A}', 'unknown'), 'A'); assert.equal(fill('{UNKNOWN}', 'keys'), '{UNKNOWN}');
});
it('priority and prerequisites decide predictably', () => {
  assert.equal(nextTip({ ...fight, hp:1, maxHp:10, potions:1 }).tip.id, 'low-potion');
  const both = { ...fight, hasSpells:true, cantrips:1, slotsLeft:0, justDid:'cast' };
  assert.equal(nextTip(both, { seen:{ 'walk-closer':1 } }).tip.id, 'cantrip');
  assert.notEqual(nextTip({ ...seat, sessionMs:100000 }).tip?.id, 'walk');
  assert.equal(nextTip({ ...seat, sessionMs:100000 }, { seen:{ welcome:1 } }).tip.id, 'walk');
});
it('table advice stays out of solo play and down heroes get no action instructions', () => {
  assert.equal(nextTip({ ...fight, where:'wander', down:true }).tip.id, 'down-wander');
  assert.equal(nextTip({ ...fight, waitingOnDM:true }).tip.id, 'dm-wait');
  for (const t of TIPS.filter(t => t.when.where === 'table')) assert.equal(test(t.when, { ...fight, where:'wander' }), false);
});
it('tip-specific gaps can exceed the global gap and clocks may restart', () => {
  const memory = { seen:{}, learnt:{}, lastAt:1000 }, late = { ...seat, sessionMs:3000000 };
  TIPS.filter(t => t.id !== 'shells').forEach(t => { memory.seen[t.id] = 1; });
  assert.equal(nextTip({ ...late, now:120999 }, memory).tip, null);
  assert.equal(nextTip({ ...late, now:121000 }, memory).tip.id, 'shells');
  const restarted = nextTip({ ...late, now:0 }, memory);
  assert.equal(restarted.tip, null); assert.equal(restarted.memory.lastAt, 0);
  assert.equal(nextTip({ ...late, now:120000 }, restarted.memory).tip.id, 'shells');
});
it('inputs remain untouched, outputs independent, and JSON round trips deterministic', () => {
  const memory = freeze({ seen:{ welcome:1 }, lastAt:0, learnt:{ menu:true }, muted:false });
  const snapshot = freeze({ ...seat, now:50000 }), r = nextTip(snapshot, memory);
  assert.deepEqual(r, nextTip(snapshot, JSON.parse(JSON.stringify(memory))));
  assert.notEqual(r.memory.seen, memory.seen); assert.notEqual(r.memory.learnt, memory.learnt);
  learn(memory, 'strike'); mute(memory); assert.deepEqual(reset(), reset());
  r.memory.seen.extra = 1; assert.equal(memory.seen.extra, undefined);
});
