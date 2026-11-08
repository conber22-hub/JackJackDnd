import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES } from '../src/data/themes.js';
import { SESSIONS } from '../src/data/campaign.js';
import { VALLEY_PLACES } from '../src/data/barovia-map.js';
import { PROPS, propSize } from '../src/data/props.js';
import { isDoorway } from '../src/engine/generator.js';
import { canStep, detectHidden, ORTHO, passMove } from '../src/engine/grid.js';
import { packFloor } from '../src/engine/maps.js';
import { redactForPlayers } from '../src/engine/redact.js';
import { newState, setState } from '../src/engine/state.js';
import { T } from '../src/engine/tiles.js';

function build(template, size = 40, seed = 'review'){
  const spec = TEMPLATES.find(t => t.id === template);
  return newState({template, size, seed, floors:spec.floors.length, party:false});
}
const index = (f, x, y) => y*f.W+x;
const tile = (f, p) => index(f, p.x, p.y);
const named = (f, name) => f.rooms.find(r => r.name === name);

function reachable(f, from){
  const start = tile(f, from);
  assert.ok(passMove(f, start), `${f.name}: invalid entrance`);
  const seen = new Set([start]), queue = [start];
  for(const i of queue){
    const x = i%f.W, y = Math.floor(i/f.W);
    for(const [dx,dy] of ORTHO){
      const ni = index(f,x+dx,y+dy);
      if(seen.has(ni) || !canStep(f,x,y,dx,dy)) continue;
      seen.add(ni);
      queue.push(ni);
    }
  }
  return seen;
}
const visits = (f, seen, r) => [...seen].some(i => {
  const x = i%f.W, y = Math.floor(i/f.W);
  return x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h;
});

for(const template of ['deathhouse-classic','deathhouse','amber-temple']){
  test(`${template}: stable, reachable layouts with valid door and stair tiles`, () => {
    const floors = build(template).floors;
    assert.deepEqual(build(template,40,'another campaign').floors,floors);
    for(const [L,f] of floors.entries()){
      const occupied = new Set();
      for(const p of f.props){
        assert.ok(PROPS[p.k],p.k);
        const {w,h} = propSize(p);
        for(let y=p.y;y<p.y+h;y++) for(let x=p.x;x<p.x+w;x++){
          const i = index(f,x,y);
          assert.ok(f.grid[i] === T.ROOM || f.grid[i] === T.HALL, `${f.name}: ${p.k} at ${x},${y}`);
          assert.ok(!occupied.has(i),`${f.name}: overlapping props at ${x},${y}`);
          occupied.add(i);
        }
      }
      for(const d of f.doors){
        assert.ok(isDoorway(f,d.i), `${f.name}: invalid doorway ${d.i%f.W},${Math.floor(d.i/f.W)}`);
        assert.ok(!occupied.has(d.i),`${f.name}: blocked doorway`);
        d.state='open';
      }
      const seen = reachable(f, f.up ?? {x:f.rooms[0].cx,y:f.rooms[0].cy});
      for(const r of f.rooms) assert.ok(visits(f,seen,r), `${f.name}: ${r.name} is isolated`);
      if(L < floors.length-1){
        assert.ok(seen.has(tile(f,f.down)),`${f.name}: descent is unreachable`);
        assert.equal(f.grid[tile(f,f.down)],T.DOWN);
        assert.deepEqual(floors[L+1].up,f.down);
        assert.equal(floors[L+1].grid[tile(floors[L+1],f.down)],T.UP);
      } else assert.equal(f.down,null);
    }
  });
}

test('Death House campaign and Valley entry points select the intended editions', () => {
  const { delve } = SESSIONS.find(s=>s.n===1).scenes.find(s=>s.delve?.template==='deathhouse');
  assert.equal(delve.floors,6);
  assert.ok(VALLEY_PLACES.find(p=>p.id==='village').maps.includes('deathhouse-classic'));
  const classic = build('deathhouse-classic').floors, flood = build('deathhouse').floors;
  assert.deepEqual(classic.slice(0,5),flood.slice(0,5));
  assert.deepEqual(classic[5].grid,flood[5].grid);
  assert.ok(classic[4].traps.some(t=>t.kind==='pit' && t.armed && !t.found));
  assert.equal(named(classic[5],'Ritual Chamber').type,'lair');
  assert.equal(named(flood[5],'Ritual Chamber').type,'nest');
  assert.ok(!classic.some(f=>f.props.some(p=>p.k==='bloomgrowth')));
  assert.ok(flood[5].props.some(p=>p.k==='bloomgrowth'));
  const vault = classic[5], altar = vault.props.find(p=>p.k==='altar');
  assert.ok(vault.shallow.length);
  assert.ok(!vault.shallow.includes(index(vault,altar.x,altar.y)));
});

test('the attic reveal is DM-controlled and the player map conceals the route', () => {
  const state = build('deathhouse-classic'), L = 3, f = state.floors[L];
  f.doors.find(d=>d.state==='locked').state = 'open';
  const hidden = f.doors.find(d=>d.state==='secret');
  const seen = reachable(f,f.up);
  assert.ok(visits(f,seen,named(f,'Children’s Room')));
  assert.ok(!seen.has(tile(f,f.down)));
  const previous = state.tokens;
  state.tokens = [{floor:L,x:18,y:20,passive:30}];
  setState(state);
  try {
    assert.deepEqual(detectHidden(),[]);
  } finally {
    setState(null);
    state.tokens = previous;
  }
  const player = redactForPlayers({...state,floors:state.floors.map(packFloor)},{explored:{[L]:seen}});
  assert.equal(player.floors[L].grid[hidden.i],'0');
  assert.equal(player.floors[L].down,null);
  assert.equal(player.floors[L+1].name,'Unexplored');
  assert.ok(!player.floors[L].rooms.some(r=>r.notes||r.read));
  hidden.state='open';
  assert.ok(reachable(f,f.up).has(tile(f,f.down)));
});

test('Amber Temple’s vestige cues are kept off the player map', () => {
  const state = build('amber-temple'), f = state.floors[1], vault = named(f,'Amber Vault');
  assert.ok(vault.notes.includes('Vampyr') && vault.notes.includes('Tenebrous') && vault.notes.includes('Zhudun'));
  const visited = new Set([index(f,vault.cx,vault.cy)]);
  const player = redactForPlayers({...state,floors:state.floors.map(packFloor)},{explored:{1:visited}});
  assert.ok(player.floors[1].rooms.some(r=>r.id===vault.id && !r.notes && !r.read));
});
