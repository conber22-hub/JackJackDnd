import { test, expect } from './helpers.js';

// 🕯 Roadside horrors (game/horror.js over engine/horror-roads.js and ChatGPT's set pieces): a journey's stretch may
// have a scene staged beside the road; the DM sees it from the start and its beats in the Maps tab; showing it puts
// it on the players' map (pieces, no words); hiding takes it off again.
test('a scene beside the road: the DM reads it, shows it to the table, and hides it again', async ({ page }) => {
  test.setTimeout(150_000);
  let L = -1;
  for (const seed of ['hz1', 'hz2', 'hz3', 'hz4', 'hz5', 'hz6'] ){
    await page.evaluate(seed => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
      D.newDelve({ name:'Start', seed, floors:1, size:40, template:'blank', party:true }, false);
      const V = D.valley(); V.at = 'village'; if (!V.visited.includes('village')) V.visited.push('village'); V.seed = seed; D.travel('vallaki'); }, seed);
    await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).toBe('journey');
    L = await page.evaluate(() => window.DreadDelve.get().floors.findIndex(f => f.horror?.length));
    if (L >= 0) break;
  }
  expect(L).toBeGreaterThanOrEqual(0);
  await page.evaluate(L => { const D = window.DreadDelve; D.goFloor(L); document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()); if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click(); }, L);
  await page.locator('[data-act="tab"][data-k="dungeon"]').click();
  const scene = await page.evaluate(L => window.DreadDelve.get().floors[L].horror[0], L);
  await expect(page.locator('#tabBody')).toContainText(scene.name);
  await expect(page.locator('#tabBody')).toContainText(scene.beats.approach);
  const sent = () => page.evaluate(L => { const st = window.DreadDelve.redactForPlayers(window.DreadDelve.get()); return JSON.stringify(st?.floors?.[L]?.horror || []); }, L);
  expect(await sent()).toBe('[]');                                            // the DM's until shown
  await page.locator(`#tabBody [data-act="horrorRead"][data-id="${scene.id}"]`).click();
  await expect(page.locator('#cardLayer')).toContainText(scene.beats.reveal);
  await page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()));
  await page.locator(`#tabBody [data-act="horrorShow"][data-id="${scene.id}"]`).click();
  expect(await page.evaluate(L => window.DreadDelve.get().floors[L].horror[0].shown, L)).toBe(true);
  const out = await sent();
  expect(out).toContain(scene.pieces[0].a);                                   // its pieces go to the players…
  expect(out).not.toContain(scene.beats.reveal); expect(out).not.toContain(scene.name);   // …but none of its words
  await page.locator(`#tabBody [data-act="horrorShow"][data-id="${scene.id}"]`).click();
  expect(await sent()).toBe('[]');
});
