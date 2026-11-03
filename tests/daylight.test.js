import test from 'node:test';
import assert from 'node:assert/strict';
import { daylight, isNight } from '../src/engine/daylight.js';

test('the light by the hour: dark night, amber dusk, grey noon', () => {
  const night = daylight(1), dusk = daylight(18.6), noon = daylight(12.5), dawn = daylight(6.6);
  assert.equal(night.sun, 0); assert.ok(night.night > .9 && night.windows > .9);
  assert.ok(noon.sun > .95 && noon.night < .05 && noon.windows < .05);
  assert.ok(dusk.warm > .8 && dawn.warm > .8 && noon.warm < .05);
  assert.ok(noon.lightK > 1.2 && night.lightK < .75, 'as bright by day and as dark by night as the old steps');
  assert.ok(isNight(23) && isNight(3) && !isNight(12) && !isNight(9));
  assert.equal(daylight(25).sun, daylight(1).sun);   // hours wrap round
  assert.match(noon.amb, /^#[0-9a-f]{6}$/);
});
