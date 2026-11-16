import { test, expect } from './helpers.js';

// 🚶 Walking (game/actions.js animatePath, render/floors.js, ui/wander.js): the ground already seen keeps its look as
// the hero walks and the fog draws back (each square has its own shade and turn, not one handed out in turn over
// whatever's been seen), and a key held down walks on, square after square, from the first step.
test('the ground keeps its look as the hero walks, and a held key walks on', async ({ page }) => {
  test.setTimeout(240_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-walk'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-walk"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  // (the villagers sent indoors: one walking up would start a talk instead of a step)
  const clear = () => page.evaluate(() => { document.querySelectorAll('#cardLayer .pop').forEach(c => c.remove()); for (const f of window.DreadDelve.get().floors) for (const p of f.folk || []) p.gone = true; window.DreadDelve.wander.rt.talk = null; });
  await clear();

  // the floor squares drawn now: where each is and its shade (every tile mesh of the floor)
  const tiles = () => page.evaluate(() => {
    const D = window.DreadDelve, L = D.wander.hero().floor, out = {};
    D.floorViews[L].built.traverse(o => {
      if (!o.isInstancedMesh || !o.instanceColor || o.geometry?.parameters?.height > .5) return;
      const a = o.instanceMatrix.array, col = o.instanceColor.array;
      for (let n = 0; n < o.count; n++){ const x = Math.round(a[n * 16 + 12] * 100), z = Math.round(a[n * 16 + 14] * 100);
        out[`${o.geometry.uuid}|${o.material.uuid}|${x},${z}`] = [col[n * 3], col[n * 3 + 1], col[n * 3 + 2]].map(v => +v.toFixed(3)).join(' '); }
    });
    return out;
  });
  const before = await tiles();
  expect(Object.keys(before).length).toBeGreaterThan(20);

  // a key held down: the hero walks on (several squares, not one and a wait)
  const pos = () => page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return { x:h.x, y:h.y }; });
  let moved = 0;
  for (const key of ['d', 'a', 's', 'w']){
    const p0 = await pos(); await clear();
    await page.keyboard.down(key); await page.waitForTimeout(7000); await page.keyboard.up(key);
    await expect.poll(() => page.evaluate(() => !window.DreadDelve.busy())).toBe(true);
    const p1 = await pos(); moved = Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y);
    if (moved >= 3) break;
  }
  expect(moved).toBeGreaterThanOrEqual(3);
  // and once let go, it stops
  const still = await pos(); await page.waitForTimeout(1500); expect(await pos()).toEqual(still);

  // the squares that were drawn before still look the same (more have been seen since: the floor was rebuilt)
  const after = await tiles();
  const same = Object.keys(before).filter(k => k in after), changed = same.filter(k => before[k] !== after[k]);
  expect(same.length).toBeGreaterThan(20);
  expect(changed).toEqual([]);
  expect(errs).toEqual([]);
});
