import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, walk } from '../src/engine/state.js';
import { genPlace } from '../src/engine/settlement.js';
import { layoutFloor } from '../src/engine/generator.js';
import { reachable } from '../src/engine/caves.js';
import { planJourney } from '../src/engine/overland.js';
import { CROPS, GROUNDS, PROPS, propAt } from '../src/data/props.js';

const joined = f => { const r0 = f.rooms[0], seen = reachable(f, r0.cy * f.W + r0.cx); return f.grid.every((v, i) => !walk(v) || seen.has(i)); };

test('a village has fields at its edges, walled or fenced, with a way in from the street', () => {
  let withFields = 0;
  for (let seed = 1; seed <= 40; seed++){
    const lay = genPlace('village', { seed, name:'Testvale', last:true });
    const f = layoutFloor(0, 40, 40, { theme:'village', layout:lay }, null, true);
    assert.ok(joined(f), `seed ${seed}: every square of the village joins up`);
    const fields = f.rooms.filter(r => r.crop);
    if (fields.length) withFields++;
    for (const r of fields){
      assert.ok(CROPS[r.crop], `seed ${seed}: ${r.crop} is a known crop`);
      assert.equal(r.ground, 'furrow'); assert.ok(r.outdoor);
      assert.equal(r.name, CROPS[r.crop].field);
      // the ring round it: a wall or fence on every square but one (the gate, where the track comes in)
      let gates = 0;
      for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++){
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) continue;
        const p = propAt(f, x, y);
        if (!p || !['drystone', 'fence'].includes(p.k)){ gates++; assert.ok(walk(f.grid[y * 40 + x]), `seed ${seed}: the gap in ${r.name}'s wall is the track`); }
      }
      assert.equal(gates, 1, `seed ${seed}: ${r.name} has one gate`);
    }
  }
  assert.ok(withFields >= 32, `most villages have fields (${withFields} of 40)`);
});

test('the roads run past fields and pastures, and every one can be walked into', () => {
  const kinds = new Set();
  for (let seed = 1; seed <= 30; seed++){
    const s = newState({ name:'J', seed:`farm-${seed}`, floors:planJourney('village', 'vallaki').stretches.length, size:40, template:'journey', journey:{ from:'village', to:'vallaki', seed:`farm-${seed}`, n:1, gaze:2, bloom:false }, party:false });
    for (const f of s.floors){
      assert.ok(joined(f), `farm-${seed}: the stretch joins up`);
      for (const r of f.rooms){ if (r.crop) kinds.add(r.crop); if (r.ground) assert.ok(GROUNDS[r.ground], `${r.ground} is a known ground`); }
    }
  }
  assert.ok(kinds.size >= 3, `several crops along the roads (${[...kinds]})`);
});

test('the drystone wall is a prop you can climb over, like a fence', async () => {
  const { PROP_HOP } = await import('../src/data/props.js');
  assert.ok(PROPS.drystone && PROP_HOP.has('drystone') && PROP_HOP.has('fence'));
});

test('brooks cross some roads at a ford: knee-deep, walkable, slow going', () => {
  let fords = 0;
  for (let seed = 1; seed <= 20; seed++){
    const n = planJourney('village', 'vallaki').stretches.length;
    const s = newState({ name:'J', seed:`ford-${seed}`, floors:n, size:40, template:'journey', journey:{ from:'village', to:'vallaki', seed:`ford-${seed}`, n:1, gaze:2, bloom:false }, party:false });
    for (const f of s.floors){
      if (!f.shallow?.length) continue;
      fords++;
      assert.ok(joined(f), 'the road still goes through');
      for (const i of f.shallow){ assert.ok(walk(f.grid[i]), 'you can wade the ford'); assert.ok(f.rough.includes(i), 'and it is slow going'); }
      assert.ok(f.water.length > 10, 'the brook runs on either side of the road');
      assert.ok(f.rooms[0].notes.includes('ford'), 'the DM is told');
    }
  }
  assert.ok(fords >= 5, `fords turn up (${fords})`);
});
