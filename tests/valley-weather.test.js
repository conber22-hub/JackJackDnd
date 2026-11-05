import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, state } from '../src/engine/state.js';
import { applyWeather, handWeather, skyNow, outlook, fourKind, FALLING, wxNow } from '../src/game/weather.js';
import { KINDS } from '../src/data/weather.js';

// ChatGPT's weather engine at the table (game/weather.js): the valley's sky goes on the desk and is read by the ground,
// the falling weather, the wagons and a night's rest; the DM's own words win until the next day.
test('the valley\'s weather goes on the desk, the DM\'s own words stand until the next day', () => {
  setState(newState({ seed:'wx', floors:1, template:'blank' }));
  const C = state.campaign;
  assert.equal(applyWeather(), null, 'no valley clock yet: nothing changes');
  C.valley = { seed:'valley-seed', day:3, hour:12, at:'mists', visited:['mists'] };
  const w = applyWeather();
  assert.ok(w && KINDS.some(k => k.id === w.kind));
  assert.equal(C.weather, w.line); assert.equal(C.valley.weather, w.line);
  assert.ok(['heavy snow', 'snow', 'frost', 'heavy rain', 'rain', ''].includes(C.wx.ground));
  assert.ok(C.wx.desc.length > 10 && C.wx.travel > 0);
  assert.deepEqual(skyNow(), w, 'the same day, hour and Gaze give the same sky');
  assert.equal(outlook(3).length, 3);
  // the DM writes their own: it stands, and nothing reads the valley's any more
  handWeather('Blood-red rain.');
  assert.equal(applyWeather(), null); assert.equal(C.weather, 'Blood-red rain.'); assert.equal(wxNow(), null);
  // a new day: the valley's weather again
  C.valley.day = 4; assert.ok(applyWeather({ newDay:true })); assert.notEqual(C.weather, 'Blood-red rain.'); assert.ok(wxNow());
  // every kind maps to the wagons' four, and the falling kinds are real
  for (const k of KINDS) assert.ok(['rain', 'snow', 'fog', 'clear'].includes(fourKind(k.id)));
  for (const f of Object.keys(FALLING)) assert.ok(KINDS.some(k => k.id === f));
});

test('a year of the valley\'s weather: snow lies in winter, and the desk line always reads', () => {
  setState(newState({ seed:'wx2', floors:1, template:'blank' }));
  const C = state.campaign; let snowy = 0;   // (over three valleys: one winter in a few can pass without a snow spell)
  for (const seed of ['year', 'barovia', 'abc']){
    C.valley = { seed, day:1, hour:12 };
    for (let d = 1; d <= 364; d++){ C.valley.day = d; applyWeather({ newDay:true }); assert.ok(C.weather.length > 5); if (/snow/.test(C.wx.ground)) snowy++; }
  }
  assert.ok(snowy > 30 && snowy < 600, `${snowy} snowy days in three years`);
});
