import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toOrbit, fromOrbit, clampOrbit, angleTo, snapTurn, crane, nextView, glide, dpadStick, skinWanted, VIEWS, CAM, SHELLS } from '../src/engine/wander-cam.js';
import { keyIntent } from '../src/engine/pad.js';

const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('an orbit goes to an offset and back; the Wanderer\'s start is the close view', () => {
  const o = toOrbit([0, 10.5, 8.5]);
  near(o.yaw, 0); near(o.dist, Math.hypot(10.5, 8.5)); near(o.pitch, Math.atan2(10.5, 8.5));
  near(Math.abs(o.pitch - VIEWS[0].pitch), 0, .01); near(o.dist, VIEWS[0].dist, .01);
  for (const p of [[3, 4, -5], [-7, 2, 1], [0, 9, -9]]){ const back = fromOrbit(toOrbit(p)); p.forEach((v, i) => near(back[i], v)); }
  const c = clampOrbit({ yaw:1, pitch:0, dist:500 });
  assert.equal(c.pitch, CAM.minPitch); assert.equal(c.dist, CAM.maxDist); assert.equal(c.yaw, 1);
});

test('turning: the short way round, and snapping to the next eighth either way', () => {
  near(angleTo(0, Math.PI / 2), Math.PI / 2);
  near(angleTo(3, -3), 2 * Math.PI - 6);   // across the back, not the long way
  const e = Math.PI / 4;
  near(snapTurn(0, 1), e); near(snapTurn(0, -1), -e);
  near(snapTurn(.1, 1), e); near(snapTurn(.1, -1), 0);
  near(snapTurn(e + 1e-9, 1), 2 * e);   // already on an eighth: the next one, not a turn of nothing
  near(snapTurn(snapTurn(snapTurn(0, 1), 1), -1), e);
});

test('craning goes up and back or down and close, inside the limits; views cycle from the nearest', () => {
  const o = { yaw:.3, pitch:VIEWS[0].pitch, dist:VIEWS[0].dist };
  const up = crane(o, 1), down = crane(o, -1);
  assert.ok(up.pitch > o.pitch && up.dist > o.dist); assert.ok(down.pitch < o.pitch && down.dist < o.dist);
  assert.equal(up.yaw, .3);
  let far = o; for (let i = 0; i < 40; i++) far = crane(far, 1);
  assert.equal(far.pitch, CAM.maxPitch); assert.equal(far.dist, CAM.maxDist);
  assert.equal(nextView(o).k, VIEWS[1].k);
  assert.equal(nextView({ yaw:0, ...VIEWS.at(-1) }).k, VIEWS[0].k);
  // near enough to a view counts as it
  assert.equal(nextView({ yaw:0, pitch:VIEWS[1].pitch + .02, dist:VIEWS[1].dist * 1.05 }).k, VIEWS[2].k);
});

test('gliding closes the same share of a gap at any frame rate', () => {
  near(glide(0, 7), 0);
  const twoHalves = 1 - (1 - glide(.05, 7)) ** 2;
  near(twoHalves, glide(.1, 7));
  assert.ok(glide(10, 7) > .999);
});

test('the touch D-pad: a thumb\'s place → a stick; the middle is nothing', () => {
  assert.deepEqual(dpadStick(0, 0), { x:0, y:0 });
  assert.deepEqual(dpadStick(5, -5, 60), { x:0, y:0 });
  const up = dpadStick(0, -40, 60); near(up.x, 0); near(up.y, -1);
  const diag = dpadStick(30, 30, 60); near(diag.x, Math.SQRT1_2); near(diag.y, Math.SQRT1_2);
});

test('the handheld shows on a touch screen with no controller, or when asked', () => {
  assert.equal(skinWanted('auto', { coarse:true, pad:false }), true);
  assert.equal(skinWanted('auto', { coarse:true, pad:true }), false);
  assert.equal(skinWanted('auto', { coarse:false, pad:false }), false);
  assert.equal(skinWanted('on', { coarse:false, pad:true }), true);
  assert.equal(skinWanted('off', { coarse:true }), false);
  assert.ok(SHELLS.length >= 3 && SHELLS.every(s => s.k && s.label));
});

test('the camera\'s keys: [ ] , . turn, - = + crane, V the next view', () => {
  for (const [k, b] of [['[', 'turnl'], [']', 'turnr'], [',', 'turnl'], ['.', 'turnr'], ['-', 'out'], ['=', 'in'], ['+', 'in'], ['v', 'rs'], ['V', 'rs']]) assert.deepEqual(keyIntent(k), { k:'press', b });
});
