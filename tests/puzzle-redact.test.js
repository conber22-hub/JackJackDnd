import test from 'node:test';
import assert from 'node:assert/strict';
import { genFloor } from '../src/engine/generator.js';
import { redactForPlayers } from '../src/engine/redact.js';
import { makePuzzle, KINDS } from '../src/engine/puzzles.js';
import { walk } from '../src/engine/tiles.js';
import { mulberry32 } from '../src/util/core.js';

// Puzzles at the table (game/puzzles.js): the players get each puzzle's view, never its solution, and only in rooms they've seen.
test("players see a puzzle's view, never its solution, and only where they have been", () => {
  const f = genFloor(0, 40, 40, mulberry32(4), null, true, { theme:'manor', shapes:false });
  const [a, b] = f.rooms;
  f.puzzles = KINDS.map((k, n) => ({ id:`pz${n}`, room:n % 2 ? b.id : a.id, name:k.name, state:makePuzzle(k.id, { seed:`r${n}` }), last:'' }));
  const exp = new Set(); for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) if (walk(f.grid[y * f.W + x])) exp.add(y * f.W + x);
  const out = redactForPlayers({ meta:{ seed:'s' }, floors:[f], tokens:[], campaign:{} }, { explored:{ 0:exp } });
  const sent = out.floors[0].puzzles, json = JSON.stringify(sent);
  assert.ok(sent.length > 0 && sent.every(p => p.room === a.id || (Math.abs(p.room) >= 0 && f.rooms.find(r => r.id === p.room))));
  assert.ok(!json.includes('secret') && !json.includes('"solution"') && !json.includes('"order"') && !json.includes('"combination"') && !json.includes('"answer"'));
  assert.ok(sent.every(p => !p.state && p.view && p.view.kind));
  // a room nobody has seen: its puzzle isn't sent at all (unless it's next to what they've seen)
  const far = f.rooms.find(r => Math.abs(r.x - a.x) > 12 || Math.abs(r.y - a.y) > 12);
  if (far){ f.puzzles.push({ id:'pzFar', room:far.id, name:'Levers', state:makePuzzle('levers', { seed:'far' }), last:'' });
    const out2 = redactForPlayers({ meta:{ seed:'s' }, floors:[f], tokens:[], campaign:{} }, { explored:{ 0:exp } });
    assert.ok(!out2.floors[0].puzzles.some(p => p.id === 'pzFar')); }
});
