import { test, expect } from './helpers.js';

// 🍂 Side trails (game/trails.js over ChatGPT's engine/road-exploration.js): the road from Vallaki to Krezk forks; the DM
// takes the trail, it becomes its own map, the party reaches its end (the clock moves, the place is known), and the
// road waits on the shelf to go back to.
test('a road forks: the side trail is taken, walked to its end, and the road is there to go back to', async ({ page }) => {
  test.setTimeout(180_000);
  await page.evaluate(() => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Vallaki', seed:'e2e-trail', floors:1, size:40, template:'blank', party:true }, false);
    const V = D.valley(); V.at = 'vallaki'; if (!V.visited.includes('vallaki')) V.visited.push('vallaki'); D.travel('krezk'); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).toBe('journey');
  const fork = await page.evaluate(() => { const st = window.DreadDelve.get(); for (const [L, f] of st.floors.entries()){ const e = (f.events || []).find(x => x.trailhead); if (e) return { L, id:e.id, road:e.trailhead }; } return null; });
  expect(fork).not.toBeNull();
  await page.evaluate(() => { if (!window.DreadDelve.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.evaluate(L => window.DreadDelve.goFloor(L), fork.L);
  await page.locator('[data-act="tab"][data-k="valley"]').click();
  await page.locator(`[data-act="trailFork"][data-id="${fork.id}"]`).click();
  const take = page.locator('#tabBody [data-act="trailTake"]');
  await expect(take.first()).toBeVisible();
  const before = await page.evaluate(() => window.DreadDelve.valley().hour + window.DreadDelve.valley().day * 24);
  await take.filter({ hasText:'🪧' }).last().click();                      // the unknown track
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).toBe('trail');
  expect(await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.kind === 'pc').length)).toBeGreaterThan(0);
  await page.locator('#tabBody [data-act="trailEnd"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.valley().roadExploration.walked.length)).toBe(1);
  expect(await page.evaluate(() => window.DreadDelve.valley().hour + window.DreadDelve.valley().day * 24)).toBeGreaterThan(before);
  await expect(page.locator('#tabBody [data-act="trailTake"]').first()).toBeVisible();   // the next choice
  await page.locator('#tabBody [data-act="trailBack"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).toBe('journey');
});
