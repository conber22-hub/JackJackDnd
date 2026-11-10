import test from 'node:test';
import assert from 'node:assert/strict';
import { planDecay, DECAY_STAGES } from '../src/engine/decay.js';
import { genPlace } from '../src/engine/settlement.js';

// 🏚 engine/decay.js over ChatGPT's planner: which houses of a place are left empty, and which the Moss has taken.
const village = () => { const lay = genPlace('village', { seed:7, name:'Testvale', last:true }); return { W:40, H:40, buildings:lay.buildings.map(b => ({ ...b })) }; };
const count = (plan, stage) => plan.filter(p => p.stage === stage).length;
test('a lived-in place has no dead houses; an abandoned one has only what was asked for; the Moss takes the rest', () => {
  const f = village(), n = planDecay(f, { seed:'s', stage:'inhabited' }).length;
  assert.ok(n >= 4, 'a village has houses to plan');
  assert.equal(count(planDecay(f, { seed:'s', stage:'inhabited' }), 'inhabited'), n);
  const some = planDecay(f, { seed:'s', stage:'abandoned', intensity:.34 }), most = planDecay(f, { seed:'s', stage:'abandoned', intensity:.67 }), all = planDecay(f, { seed:'s', stage:'abandoned', intensity:1 });
  assert.equal(count(all, 'abandoned'), n); assert.equal(count(some, 'infested') + count(most, 'infested') + count(all, 'infested'), 0);
  assert.ok(count(some, 'abandoned') <= count(most, 'abandoned') && count(most, 'abandoned') <= n);
  for (const p of some) if (p.stage === 'abandoned') assert.equal(most.find(q => q.index === p.index).stage, 'abandoned', 'a house once left stays left as more go');
  const moss = planDecay(f, { seed:'s', stage:'infested', intensity:.5 });
  assert.equal(count(moss, 'inhabited'), 0, 'where the Moss is, nobody is left'); assert.ok(count(moss, 'infested') >= 1 && count(moss, 'abandoned') >= 1);
  for (const p of all){ assert.ok(DECAY_STAGES.includes(p.stage)); assert.ok(p.read.length > 5 && p.name.length > 0); assert.ok(f.buildings[p.index]); }
});
test('the same seed gives the same houses; keeps, turrets and slivers are left out; a floor with none plans nothing', () => {
  const f = village();
  assert.deepEqual(planDecay(f, { seed:'s', stage:'abandoned', intensity:.5 }), planDecay(f, { seed:'s', stage:'abandoned', intensity:.5 }));
  const odd = { W:40, H:40, buildings:[{ x:2, y:2, w:6, h:6, keep:true }, { x:10, y:2, w:3, h:3, turret:true }, { x:20, y:2, w:1, h:4 }, { x:30, y:30, w:4, h:4, name:'The last house', door:'e' }] };
  const plan = planDecay(odd, { seed:'s', stage:'abandoned', intensity:1 });
  assert.deepEqual(plan.map(p => p.index), [3]); assert.equal(plan[0].name, 'The last house');
  assert.deepEqual(planDecay({ W:40, H:40, buildings:[] }, { stage:'abandoned' }), []); assert.deepEqual(planDecay(null), []); assert.deepEqual(planDecay(f, { stage:'ruined' }), []);
});
