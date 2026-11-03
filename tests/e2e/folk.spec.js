import { test, expect, arena, frameMap } from './helpers.js';

// The valley's people (render/folk.js): drawn where the folk engine puts them; tap one to hear them.
// The DM alone learns that one is the Count's eye.
test('tapping one of the folk: what they say for the outbox, and a spy for the DM\'s eyes only', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  await page.evaluate(() => {
    const f = window.DreadDelve.get().floors[0];
    f.folk = [{ id:'v1', role:'elder', name:'Old Vasil', x:10, y:9, home:{ x:10, y:9 }, haunts:[], mood:'wary', spy:{ for:'n1' }, seen:[] },
              { id:'v2', role:'farmer', name:'Ilya', x:13, y:12, home:{ x:13, y:12 }, haunts:[], mood:'easy', spy:null, seen:[] }];
  });
  await frameMap(page, 10, 10);
  const pt = await page.evaluate(() => { const D = window.DreadDelve, n = D.get().meta.size, v = D.camera.position.clone(); v.set(10 - n / 2 + .5, .5, 9 - n / 2 + .5); v.project(D.camera); return { x:(v.x + 1) / 2 * innerWidth, y:(1 - v.y) / 2 * innerHeight }; });
  await page.mouse.click(pt.x, pt.y);
  const cards = page.locator('#cardLayer .pop');
  await expect(cards.filter({ hasText:'Old Vasil' })).toContainText('keep their hands where you can see them');
  await expect(cards.filter({ hasText:'Old Vasil' })).toContainText('The players haven\'t seen this');   // it waits in the outbox
  await expect(cards.filter({ hasText:'One of the Count\'s eyes' })).toBeVisible();
  // the eyes-only card never reaches the outbox
  expect(await page.evaluate(() => window.DreadDelve.outbox.some(o => /Count's eyes/.test(o.msg.c?.title || '')))).toBe(false);
});
