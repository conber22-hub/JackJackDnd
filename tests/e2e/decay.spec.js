import { test, expect } from './helpers.js';

// 🏚 Dead villages (game/decay.js over ChatGPT's planner): the DM says how far a place has fallen; its houses are marked
// abandoned or moss-taken (and drawn so), the DM gets a line for each, the players are sent the houses' state and
// nothing else, and it can all be put back.
test('a village is abandoned, then taken by the Moss, then lived in again', async ({ page }) => {
  test.setTimeout(120_000);
  await page.evaluate(() => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Krezk', seed:'decay-e2e', floors:1, size:40, template:'krezk', party:true }, false);
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.locator('[data-act="tab"][data-k="dungeon"]').click();
  const houses = () => page.evaluate(() => { const f = window.DreadDelve.get().floors[0], n = s => f.buildings.filter(b => b.decay === s).length; return { left:n('abandoned'), moss:n('infested'), asked:f.decay || null }; });
  expect(await houses()).toEqual({ left:0, moss:0, asked:null });
  await page.locator('#tabBody [data-act="decayStage"][data-k="abandoned"]').click();
  const all = await houses();
  expect(all.left).toBeGreaterThan(2); expect(all.moss).toBe(0); expect(all.asked).toEqual({ stage:'abandoned', intensity:1 });
  await page.locator('#tabBody [data-act="decayMuch"][data-k="0.34"]').click();
  const some = await houses();
  expect(some.left).toBeLessThan(all.left);                                // only some of the houses now
  await page.locator('#tabBody [data-act="decayStage"][data-k="infested"]').click();
  const moss = await houses();
  expect(moss.moss).toBe(some.left); expect(moss.left + moss.moss).toBe(all.left);   // the Moss takes the empty ones; nobody is left in the rest
  await expect(page.locator('#tabBody')).toContainText('The state of this place');
  expect(await page.locator('#tabBody .card', { hasText:'Its houses' }).locator('.row .grow').count()).toBe(all.left);   // a line for the DM on each
  // the players are sent each house's state (to draw it), not its name or the DM's line
  const sent = await page.evaluate(() => { const st = window.DreadDelve.redactForPlayers(window.DreadDelve.get()), bs = st.floors[0].buildings; return { n:bs.filter(b => b.decay).length, names:bs.some(b => b.name), read:JSON.stringify(st.floors[0]).includes('knock at the door') }; });
  expect(sent.names).toBe(false); expect(sent.read).toBe(false);
  // and the map draws without complaint, the dead houses with it
  expect(await page.evaluate(() => { const D = window.DreadDelve; return D.floorViews[0].built.children.length > 10; })).toBe(true);
  await page.locator('#tabBody [data-act="decayStage"][data-k="inhabited"]').click();
  expect(await houses()).toEqual({ left:0, moss:0, asked:null });
});
