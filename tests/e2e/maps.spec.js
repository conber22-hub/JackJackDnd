import { test, expect, arena, frameMap, selectHero, clickTile, expectPositions, idle } from './helpers.js';

const tokens = page => page.evaluate(() => window.DreadDelve.get().tokens.map(t => t.name));
const shelf = page => page.evaluate(() => Object.values(window.DreadDelve.get().campaign.maps || {}).map(e => e.name));
const openMaps = async page => { if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click(); await page.locator('[data-act="tab"][data-k="dungeon"]').click(); };

test('maps go on the shelf and come back as the party left them; set one up without the party', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor:0, x:16, y:13 }); D.get().meta.name = 'Training hall'; });
  // a new map: the hall goes on the shelf, the party (not the zombie) travels
  await openMaps(page);
  await page.locator('#ndTemplate').selectOption('blank');
  await page.locator('[data-act="regen"][data-k="bring"]').click();
  await expect.poll(() => shelf(page)).toEqual(['Training hall']);
  expect(await tokens(page)).toEqual(expect.arrayContaining(['Ada', 'Bram']));
  expect(await tokens(page)).not.toContain('Zombie');
  const newName = await page.evaluate(() => window.DreadDelve.get().meta.name);
  // back to the hall: the zombie is still there, and the party arrives where it stood
  await openMaps(page);
  await page.locator('[data-act="mapGo"]').first().click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.name)).toBe('Training hall');
  expect(await tokens(page)).toEqual(expect.arrayContaining(['Ada', 'Bram', 'Zombie']));
  const ada = await page.evaluate(() => { const t = window.DreadDelve.get().tokens.find(t => t.name === 'Ada'); return [t.x, t.y]; });
  expect(Math.max(Math.abs(ada[0] - 6), Math.abs(ada[1] - 10))).toBeLessThanOrEqual(1);
  expect(await shelf(page)).toEqual([newName]);
  // set the other map up without the party: they wait in the hall, the players' screens hold still
  await openMaps(page);
  await page.locator('[data-act="mapPrep"]').first().click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().campaign.away?.name)).toBe('Training hall');
  expect(await tokens(page)).not.toContain('Ada');
  await expect(page.locator('#tabBody .card.prep')).toContainText('The party waits in Training hall');
  // bring them over: tap where they arrive
  await page.locator('#tabBody [data-act="mode:placeParty"]').first().click();
  const spot = await page.evaluate(() => { const r = window.DreadDelve.get().floors[0].rooms[0]; return { x:r.x + 1, y:r.y + 1 }; });
  await frameMap(page, spot.x, spot.y);
  await clickTile(page, spot.x, spot.y);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().campaign.away)).toBeNull();
  expect(await tokens(page)).toEqual(expect.arrayContaining(['Ada', 'Bram']));
  const at = await page.evaluate(() => { const t = window.DreadDelve.get().tokens.find(t => t.name === 'Ada'); return [t.x, t.y]; });
  expect(at).toEqual([spot.x, spot.y]);
});

test('a fight: pick who is in it, the monster takes its own turn, and the win is called', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor:0, x:7, y:10 }); D.placeMonster('zombie', { floor:0, x:17, y:13 }); });
  await frameMap(page);
  await page.locator('#initBtns [data-act="rollInit"]').click();
  await expect(page.locator('#fightModal')).toBeVisible();
  await expect(page.locator('#fightBox .fpick input[data-edit="fightPick"]')).toHaveCount(3);
  // leave the far zombie out
  const far = await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.kind === 'monster')[1].id);
  await page.locator(`#fightBox input[data-id="${far}"]`).uncheck();
  await expect(page.locator('#fightBox [data-act="fightGo"]')).toContainText('(2)');
  await page.locator('#fightBox [data-act="fightGo"]').click();
  const order = await page.evaluate(() => window.DreadDelve.get().combat.order.length);
  expect(order).toBe(2);
  // the zombie's turn: it swings at Ada, who is beside it
  await page.evaluate(() => { const D = window.DreadDelve, c = D.get().combat; while (D.tokById(c.order[c.idx]).kind !== 'monster') D.nextTurn(); });
  await page.locator('#initBtns [data-act="autoTurn"]').click();
  await expect(page.locator('#cardLayer')).toContainText(/Zombie/);
  // down it goes: the fight is won
  await page.evaluate(() => { const D = window.DreadDelve, z = D.get().tokens.find(t => t.kind === 'monster' && D.get().combat.order.includes(t.id)); D.applyDamage(z, 999); });
  await expect(page.locator('#cardLayer')).toContainText('The fight is won');
  await page.locator('#initBtns [data-act="endCombat"]', { hasText:'End the fight' }).click();
  expect(await page.evaluate(() => window.DreadDelve.get().combat.active)).toBe(false);
});
