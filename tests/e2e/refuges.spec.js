import { test, expect, arena } from './helpers.js';

// 🕳 Hidden refuges (game/refuges.js over ChatGPT's engine/hidden-refuges.js): the DM hides one, gives the clue, a hero
// searches where it is until it's found (its entrance appears on the map), the party goes in (its own map) and back out.
test('a refuge down the rock: hidden, found by a search, gone into, and left the way they came', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await page.evaluate(() => { if (!window.DreadDelve.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.locator('[data-act="tab"][data-k="dungeon"]').click();
  await page.locator('#tabBody [data-act="refugeHide"][data-k="cave"]').click();
  const site = await page.evaluate(() => window.DreadDelve.get().campaign.refuges.sites[0]);
  expect(site.kind).toBe('cave');
  await page.locator('#tabBody [data-act="refugeClue"]').click();
  // Ada goes to the spot and searches until she finds it
  await page.evaluate(p => { const D = window.DreadDelve, t = D.get().tokens.find(x => x.name === 'Ada'); t.x = p.x; t.y = p.y; D.select(t.id); }, site.position);
  for (let i = 0; i < 30 && !(await page.evaluate(() => window.DreadDelve.get().campaign.refuges.sites[0].found)); i++){
    await page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()));
    await page.locator('#tabBody [data-act="refugeSearch"]').click();
  }
  expect(await page.evaluate(() => window.DreadDelve.get().floors[0].props.some(p => p.refuge && p.k === 'refugeCurtain'))).toBe(true);
  // the entrance is a multi-square patch beside where Ada stands, not a single tile on the spot
  const entrance = await page.evaluate(() => {
    const D = window.DreadDelve, s = D.get().campaign.refuges.sites[0], p = D.get().floors[0].props.find(x => x.refuge === s.id);
    return { at: { x: p.x, y: p.y }, siteAt: s.propAt, pos: s.position, kind: s.kind };
  });
  expect(entrance.at).toEqual(entrance.siteAt);
  expect(entrance.at.x).not.toBe(entrance.pos.x);
  expect(entrance.at.y).not.toBe(entrance.pos.y);
  await page.locator('#tabBody [data-act="refugeIn"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).toBe('refuge');
  expect(await page.evaluate(n => window.DreadDelve.get().floors[0].name, site.name)).toBe(site.name);   // its own layout, not a generated dungeon
  // back to the way in, and out
  await page.evaluate(() => { const D = window.DreadDelve, st = D.get(), a = st.campaign.refuges.active, t = st.tokens.find(x => x.name === 'Ada'); t.x = a.exit.x; t.y = a.exit.y; D.select(t.id); });
  await page.locator('#tabBody [data-act="refugeOut"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).not.toBe('refuge');
  expect(await page.evaluate(() => window.DreadDelve.get().campaign.refuges.sites[0].visited)).toBe(true);
});
