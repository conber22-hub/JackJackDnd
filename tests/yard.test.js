import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHero } from '../src/engine/hero.js';
import { yard, yardOpen, openYard, closeYard, admitToYard, leaveYard, playYard, startDrill, yardView, yardCount, setOut, practiceLine } from '../src/game/yard.js';

const hero = (name, id) => { const h = newHero('Fighter'); h.name = name; h.id = id; h.updated = 1; return h; };

test('the yard lets heroes in by connection, keeps them through a reconnect, and sets out with the ready ones', () => {
  openYard();
  assert.ok(yardOpen());
  assert.ok(admitToYard({ seatId:'ada|k', cid:'p1:1', name:'Ada', sheet:hero('Ada', 'ada') }));
  assert.ok(admitToYard({ seatId:'bea|k', cid:'p2:2', name:'Bea', sheet:null }));
  assert.deepEqual(yardView('p1:1').view.actions.map(a => a.name), ['Longsword', 'Javelin']);
  assert.equal(yardView('p2:2').view.members.find(m => m.slot === 2).stage, 'building');
  assert.equal(yardView(null).view.actions, undefined);   // the TV gets no buttons
  // walk; a stranger's connection can't move anyone
  const walk = playYard('p1:1', { lobbyId:yard.lobby.id, kind:'move', x:6, y:7 });
  assert.ok(walk.ok); assert.equal(walk.slot, 1); assert.deepEqual(walk.path.at(-1), { x:6, y:7 });
  assert.equal(playYard('nobody', { lobbyId:yard.lobby.id, kind:'move', x:5, y:5 }).ok, false);
  // a forged ready (not a boolean) is refused; a real one counts
  assert.equal(playYard('p1:1', { lobbyId:yard.lobby.id, kind:'ready', ready:'yes' }).ok, false);
  assert.ok(playYard('p1:1', { lobbyId:yard.lobby.id, kind:'ready', ready:true }).ok);
  assert.deepEqual(yardCount(), { all:2, ready:1 });
  // Ada's phone drops and comes back on a new connection: her hero is kept, and she must say ready again
  leaveYard('p1:1');
  assert.equal(yardView(null).view.members.find(m => m.slot === 1).stage, 'reconnecting');
  admitToYard({ seatId:'ada|k', cid:'p1:3', name:'Ada', sheet:hero('Ada', 'ada') });
  assert.equal(yardView('p1:3').view.members.find(m => m.slot === 1).stage, 'practising');
  assert.equal(setOut(false), null);   // not everyone is ready
  playYard('p1:3', { lobbyId:yard.lobby.id, kind:'ready', ready:true });
  assert.deepEqual(setOut(true), [{ seatId:'ada|k', heroId:'ada' }]);
  assert.equal(yardOpen(), false);
});

test('the Lantern Gate drill counts only a damaging hit on the lit lantern, with another hero on the plate', () => {
  openYard();
  admitToYard({ seatId:'ada|k', cid:'a', name:'Ada', sheet:hero('Ada', 'ada') });
  admitToYard({ seatId:'bea|k', cid:'b', name:'Bea', sheet:hero('Bea', 'bea') });
  assert.ok(startDrill());
  const id = yard.lobby.id, drillId = yard.drill.id, sword = yardView('b').view.actions[0].id;
  playYard('b', { lobbyId:id, kind:'move', x:11, y:3 });
  // nobody on the plate: the shutter is shut
  assert.equal(playYard('b', { lobbyId:id, drillId, kind:'practice', actionId:sword, targetId:'straw' }).drillFeedback, 'stand-on-plate');
  playYard('a', { lobbyId:id, kind:'move', x:6, y:7 });
  assert.equal(yardView('b').drill.shutterOpen, true);
  let r; for (let i = 0; i < 60 && yard.drill.cleared === 0; i++) r = playYard('b', { lobbyId:id, drillId, kind:'practice', actionId:sword, targetId:'straw' });
  assert.equal(yard.drill.cleared, 1);
  assert.equal(r.drillFeedback, 'target-cleared');
  assert.equal(yardView(null).drill.targetId, 'shield');
  assert.match(yard.feed.join('\n'), /Straw Guard's lantern goes dark/);
  closeYard();
});

test('practice lines read like the table', () => {
  assert.equal(practiceLine('Ada', { kind:'attack', action:'Longsword', targetId:'straw', damage:7, rolls:[{ hit:true, crit:false }] }), "Ada's Longsword hits the Straw Guard for 7.");
  assert.equal(practiceLine('Ada', { kind:'attack', action:'Longsword', targetId:'shield', damage:0, rolls:[{ hit:false, crit:false }] }), "Ada's Longsword misses the Shield Stand.");
  assert.equal(practiceLine('Bea', { kind:'save', action:'Sacred Flame', targetId:'lantern', damage:0, save:{ saved:true } }), "The Lantern Target shrugs off Bea's Sacred Flame.");
});
