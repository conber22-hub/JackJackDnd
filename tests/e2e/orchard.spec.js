import { test, expect } from './helpers.js';

// 🍎 Orchards (engine/orchard.js): a field of apple trees in the village; the DM can make any field one from the Build
// tab, and where the Bloom gets into the trees some of the apples turn.
test('a village field becomes an orchard, and the Bloom gets into its apple trees', async ({ page }) => {
  test.setTimeout(120_000);
  const field = await page.evaluate(() => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'The Village of Barovia', seed:'orchard-e2e', floors:1, size:40, template:'barovia', party:true }, false);
    const r = D.get().floors[0].rooms.filter(r => r.crop).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    r.crop = 'orchard'; r.ground = 'grass'; D.buildFloor(0); return { w:r.w, h:r.h }; });
  expect(field.w * field.h).toBeGreaterThan(12);
  const trees = () => page.evaluate(() => Object.fromEntries(window.DreadDelve.floorViews[0].built.children.filter(o => o.userData.orchard).map(o => [o.userData.orchard, o.count])));
  const before = await trees();
  expect(before.healthy).toBeGreaterThan(2); expect(before.bloomed).toBeUndefined();
  await page.evaluate(() => window.DreadDelve.setBloom(.7));
  const after = await trees();
  expect(after.bloomed).toBeGreaterThan(0);
  expect((after.healthy || 0) + after.bloomed).toBe(before.healthy);   // the same trees, some of them turned
});
