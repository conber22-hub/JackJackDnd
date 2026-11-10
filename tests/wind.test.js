import test from 'node:test';
import assert from 'node:assert/strict';
import { setState } from '../src/engine/state.js';
import { windForce, wind, updateWind, addSway, swayKey } from '../src/render/wind.js';

// 🌬 The wind (render/wind.js): how hard it blows comes from the valley's weather, or the DM's own words; the sway is a
// few lines added to a material's vertex shader.
test('the wind follows the weather: the valley\'s reading, then the DM\'s words', () => {
  setState({ campaign:{ wx:{ kind:'overcast', wind:0 } } }); assert.equal(windForce(), .1);
  setState({ campaign:{ wx:{ kind:'overcast', wind:3 } } }); assert.equal(windForce(), 1);
  setState({ campaign:{ wx:{ kind:'storm' } } }); assert.equal(windForce(), 1, 'an older save\'s reading has no wind: the kind says');
  setState({ campaign:{ wx:{ kind:'thick-fog' } } }); assert.equal(windForce(), .1);
  setState({ campaign:{ weather:'A howling gale off the mountains.' } }); assert.equal(windForce(), 1);
  setState({ campaign:{ weather:'Still and grey.' } }); assert.equal(windForce(), .1);
  setState({ campaign:{ weather:'Blood-red rain.' } }); assert.equal(windForce(), .32);
  setState({ wx:{ kind:'rain', wind:2 } }); assert.equal(windForce(), .62, 'a player\'s device reads what it was sent');
  setState(null); assert.equal(windForce(), .32);
});
test('the force eases towards the weather\'s, and the clock is the frame\'s', () => {
  setState({ campaign:{ wx:{ kind:'storm', wind:3 } } }); wind.force.value = .1;
  wind.time.value = 11.5; updateWind(12); assert.equal(wind.time.value, 12); assert.ok(wind.force.value > .1 && wind.force.value < 1);
  for (let i = 1; i < 60; i++) updateWind(12 + i * .5);
  assert.ok(wind.force.value > .98);
  setState(null);
});
test('the sway goes into a vertex shader once, with the shared uniforms; a shader without the hook is left alone', () => {
  const sh = { uniforms:{}, vertexShader:'void main(){\n#include <begin_vertex>\n}' };
  addSway(sh, { from:.3, top:2.3, amp:.16 });
  assert.equal(sh.uniforms.uWindTime, wind.time); assert.equal(sh.uniforms.uWindForce, wind.force);
  assert.match(sh.vertexShader, /uniform float uWindForce/); assert.match(sh.vertexShader, /smoothstep\( 0\.3000, 2\.3000/);
  const odd = { uniforms:{}, vertexShader:'void main(){}' }; addSway(odd); assert.equal(odd.vertexShader, 'void main(){}');
  assert.notEqual(swayKey({ amp:.05 }), swayKey({ amp:.16 }));
});
