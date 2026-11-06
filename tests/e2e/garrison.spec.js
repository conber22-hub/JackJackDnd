import { test, expect } from './helpers.js';

// Codex's garrison (engine/garrison.js) on a planned site (engine/sites.js): the DM stocks the site from the Maps
// tab, its groups take their posts; a fight raises the alarm along the floor; ending it calms them. And the plan's
// treasure is real: rooms with treasure have hoards.
test('the DM stocks a site; a fight raises the alarm; the hoards are there', async ({ page }) => {
  test.setTimeout(150_000);
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Garrison', seed:'garrison-e2e', floors:1, size:40, template:'castle', party:true }, false);
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click();
  });
  const site = () => page.evaluate(() => { const f = window.DreadDelve.get().floors[0];
    return { planned:!!f.site, groups:f.garrison?.groups.length || 0, alert:f.garrison ? Object.values(f.garrison.alert || {}).reduce((a, b) => Math.max(a, b), 0) : 0,
      creatures:window.DreadDelve.get().tokens.filter(t => t.garrison).length, hoards:f.rooms.filter(r => r.hoard).length,
      keys:f.rooms.flatMap(r => r.hoard?.keys || []).flatMap(k => k.opens).sort().join(), locked:f.doors.filter(d => d.state === 'locked' && d.key).map(d => d.id).sort().join() }; });
  const before = await site();
  expect(before.planned).toBe(true);
  expect(before.hoards).toBeGreaterThan(0);
  expect(before.keys).toBe(before.locked);            // a key for every door the plan locked, and only those
  await page.locator('[data-act="tab"][data-k="dungeon"]').click();
  await page.locator('[data-act="stockSite"]').click();
  await expect.poll(async () => (await site()).groups).toBeGreaterThan(0);
  const stocked = await site();
  expect(stocked.creatures).toBeGreaterThan(0);
  await expect(page.locator('[data-act="stockSite"]')).toHaveCount(0);   // stocked once
  // a fight: the alarm goes up
  await page.evaluate(() => { const D = window.DreadDelve, s = D.get();
    const foe = s.tokens.find(t => t.garrison), hero = s.tokens.find(t => t.kind === 'pc');
    hero.x = foe.x; hero.y = Math.max(1, foe.y - 1);
    D.rollInitiative({ ids:[hero.id, foe.id] }); });
  await expect.poll(async () => (await site()).alert).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.DreadDelve.get().log.some(l => /🔔/.test(l.m)))).toBe(true);
});
