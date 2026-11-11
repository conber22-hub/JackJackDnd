import test from 'node:test';
import assert from 'node:assert/strict';
import { newState } from '../src/engine/state.js';
import { planJourney } from '../src/engine/overland.js';
import { planRoadsideHorror, horrorForPlayers } from '../src/engine/horror-roads.js';
import { redactForPlayers } from '../src/engine/redact.js';
import { T } from '../src/engine/tiles.js';

// 🕯 engine/horror-roads.js: ChatGPT's set pieces staged beside a journey's road, off the road and the clearings,
// the DM's until shown, and only the shown ones (pieces, no words) reach the players.
const journey = (from, to, seed, gaze = 3) => { const p = planJourney(from, to);
  return newState({ name:'J', seed, floors:p.stretches.length, size:40, template:'journey', journey:{ from, to, seed, n:0, gaze, bloom:false } }); };
test('some stretches of road have a scene beside them, never on the road, the trees cleared where it stands', () => {
  let n = 0, all = 0;
  for (const seed of ['h1', 'h2', 'h3']) for (const f of journey('village', 'vallaki', seed).floors){
    all++; if (!f.horror?.length) continue; n++;
    const clear = new Set(f.clear);
    for (const s of f.horror){
      assert.ok(s.name && s.beats.approach && s.beats.reveal && s.beats.aftermath); assert.equal(s.shown, false);
      for (const p of s.pieces){ const i = Math.round(p.y) * f.W + Math.round(p.x);
        assert.notEqual(f.grid[i], T.HALL, `${s.id}: ${p.a} is not on the road`); assert.ok(clear.has(i), `${p.a}: its square is cleared of trees`); }
    }
  }
  assert.ok(n >= 1 && n < all, `some stretches, not all (${n} of ${all})`);
  // the same journey gives the same scenes
  assert.deepEqual(journey('village', 'vallaki', 'h1').floors.map(f => f.horror || null), journey('village', 'vallaki', 'h1').floors.map(f => f.horror || null));
});
test('players get only the scenes the DM has shown, and none of their words', () => {
  const st = journey('village', 'vallaki', 'h2'), L = st.floors.findIndex(f => f.horror?.length), f = st.floors[L];
  assert.ok(L >= 0);
  assert.deepEqual(horrorForPlayers(f), []);
  f.horror[0].shown = true;
  const sent = horrorForPlayers(f);
  assert.equal(sent.length, 1); assert.equal(sent[0].pieces.length, f.horror[0].pieces.length);
  const json = JSON.stringify(sent); assert.ok(!json.includes(f.horror[0].beats.reveal) && !json.includes(f.horror[0].name));
  st.explored = st.floors.map(() => new Set()); st.explored[L] = new Set([...Array(f.W * f.H).keys()]);
  assert.equal(redactForPlayers(st)?.floors?.[L]?.horror?.length ?? 1, 1);
  assert.deepEqual(planRoadsideHorror(f, {}, {}), { scenes:[], clear:[] }); assert.deepEqual(planRoadsideHorror(null, null), { scenes:[], clear:[] });
});
