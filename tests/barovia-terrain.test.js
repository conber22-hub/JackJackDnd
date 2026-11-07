import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { TERRAIN_INDEX } from '../src/render/barovia-terrain-index.js';
import { BIOMES, planTerrain, featureAt } from '../src/render/barovia-terrain-plan.js';

const manifest = JSON.parse(readFileSync(new URL('../public/assets/terrain/manifest.json', import.meta.url)));

test('36 original assets have unique catalog IDs and matching metadata', () => {
  assert.equal(manifest.items.length, 36);
  assert.equal(new Set(manifest.items.map(x => x.id)).size, 36);
  for (const asset of manifest.items) {
    assert.deepEqual(TERRAIN_INDEX[asset.id].size, asset.size);
    assert.equal(TERRAIN_INDEX[asset.id].placement, asset.placement);
    assert.ok(asset.meshes >= 1 && asset.meshes <= 12, `draw call budget: ${asset.id}`);
    assert.ok(asset.pieces >= asset.meshes);
    assert.ok(existsSync(new URL('../public/assets/terrain/' + asset.id + '.glb', import.meta.url)));
    assert.ok(asset.bytes > 100 && asset.bytes < 250_000);
    const [low, high] = asset.geometryBounds;
    assert.ok(low.every(Number.isFinite) && high.every(Number.isFinite));
    assert.ok(high[1] > 0, 'asset has visible height');
    assert.ok(low[1] >= -.3, 'ground is close to zero');
  }
});

test('all biomes name only known terrain with positive weights', () => {
  for (const [name, pool] of Object.entries(BIOMES)) {
    assert.ok(pool.length >= 4, name);
    for (const [id, weight] of pool) {
      assert.ok(TERRAIN_INDEX[id], `${name}: ${id}`);
      assert.ok(weight > 0);
    }
  }
});

test('seeded plans are deterministic and JSON serializable', () => {
  for (const biome of Object.keys(BIOMES)) {
    const settings = {width: 35, height: 32, seed:'svalich|storm|7', biome, density:.04};
    const a = planTerrain(settings), b = planTerrain(settings);
    assert.deepEqual(a, b);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  }
});

test('no placement overlaps another placement, even for rectangular quarter-turns', () => {
  const plan = planTerrain({ width:48, height:48, seed:'roads', biome:'vallakiOutskirts', density:.19 });
  const used = new Set();
  for (const p of plan) {
    const [w,h] = p.size;
    assert.ok(p.x >= 0 && p.y >= 0 && p.x + w <= 48 && p.y + h <= 48);
    for (let y=p.y;y<p.y+h;y++) for (let x=p.x;x<p.x+w;x++) {
      const key=`${x},${y}`;assert.ok(!used.has(key),`overlap: ${key}`);used.add(key);
    }
  }
});

test('allowed predicate protects exits, walls, corridors and stairs', () => {
  const allowed=(x,y)=>x>=4&&x<21 && y>=4&&y<21 && !(x>=10&&x<=12);
  const plan=planTerrain({width:25,height:25,seed:'safe',biome:'svalichWoods',density:.15,allowed});
  assert.ok(plan.length > 0);
  for(const p of plan)for(let y=p.y;y<p.y+p.size[1];y++)for(let x=p.x;x<p.x+p.size[0];x++)assert.ok(allowed(x,y));
});

test('explicit landmarks rotate rectangular footprints correctly', () => {
  assert.deepEqual(featureAt('collapsed_fieldwall',3,5,0).size,[3,1]);
  assert.deepEqual(featureAt('collapsed_fieldwall',3,5,1).size,[1,3]);
  assert.deepEqual(featureAt('collapsed_fieldwall',3,5,2).size,[3,1]);
  assert.throws(()=>featureAt('unknown',2,2),RangeError);
  assert.throws(()=>featureAt('svalich_black_fir',2,2,4),RangeError);
});

test('invalid dimensions, biome and density fail clearly', () => {
  assert.throws(()=>planTerrain({width:0,height:40}),RangeError);
  assert.throws(()=>planTerrain({width:40,height:20,biome:'vampireBanana'}),RangeError);
  assert.throws(()=>planTerrain({width:40,height:20,density:1.1}),RangeError);
});

test('planner never calls Math.random', () => {
  const original = Math.random;
  try {
    Math.random=()=>{throw new Error('No random entropy allowed');};
    assert.ok(planTerrain({width:30,height:30,seed:'pure',biome:'tserBog'}).length > 0);
  } finally {Math.random=original;}
});
