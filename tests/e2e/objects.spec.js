import { test, expect, arena, frameMap, selectHero, idle } from './helpers.js';

const props = page => page.evaluate(() => window.DreadDelve.get().floors[0].props.map(p => ({ ...p })));
const prop = async (page, k) => (await props(page)).find(p => p.k === k);
// Pin the dice: d20s roll high, so checks and attacks land and saves are made.
const loadedDice = page => page.evaluate(() => { window.__rand = Math.random; Math.random = () => .97; });

test('a hero opens a chest, shoves a crate and topples a bookshelf; the DM smashes a barrel', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:7, y:10 }]);
  await page.evaluate(() => {
    const D = window.DreadDelve;
    for (const [k, x, y] of [['chest', 8, 10], ['crate', 8, 12], ['bookshelf', 12, 9], ['barrel', 16, 13]]) D.placePropAt({ floor:0, x, y }, k);
    const chest = D.get().floors[0].props.find(p => p.k === 'chest'); chest.contents = 'A silver key on a red ribbon.';
  });
  await frameMap(page);
  await loadedDice(page);
  await selectHero(page);

  // the chest, from the "Nearby" chips on Ada's card
  await page.locator('#selCard [data-act="selProp"]', { hasText:'Chest' }).click();
  await expect(page.locator('#selCard .nm')).toContainText('Chest');
  await page.locator('#selCard [data-act="propDo"][data-k="open"]').click();
  await expect(page.locator('#cardLayer')).toContainText('A silver key on a red ribbon.');
  expect((await prop(page, 'chest')).open).toBe(true);

  // the crate: Ada steps beside it, square-on, and pushes it east
  await page.evaluate(() => { const D = window.DreadDelve, a = D.get().tokens.find(t => t.name === 'Ada'); a.x = 7; a.y = 12; D.select(a.id); });
  await page.locator('#selCard [data-act="selProp"]', { hasText:'Crate' }).click();
  await page.locator('#selCard [data-act="propDo"][data-k="push"]').click();
  await expect.poll(async () => (await prop(page, 'crate')).x).toBe(9);

  // the bookshelf: it falls away from her, across two squares, and lies there to be climbed over
  await page.evaluate(() => { const D = window.DreadDelve, a = D.get().tokens.find(t => t.name === 'Ada'); a.x = 11; a.y = 9; D.select(a.id); });
  await page.locator('#selCard [data-act="selProp"]', { hasText:'Bookshelf' }).click();
  await page.locator('#selCard [data-act="propDo"][data-k="topple"]').click();
  const shelf = await prop(page, 'bookshelf');
  expect(shelf.fallen).toMatchObject({ dx:1, dy:0 });
  expect([shelf.x, shelf.fw, shelf.fh]).toEqual([12, 3, 2]);
  expect(await page.evaluate(() => window.DreadDelve.reach(0, 11, 9, 4, null).dist.has(9 * 32 + 13))).toBe(true);

  // the barrel, by the DM's hand (no hero beside it): one blow
  await page.evaluate(() => { window.DreadDelve.select(null); });
  await page.evaluate(() => { const D = window.DreadDelve, b = D.get().floors[0].props.find(p => p.k === 'barrel'); D.objects.selectProp(0, b.id); });
  await page.locator('#selCard [data-act="propDo"][data-k="smash"]').click();
  expect((await prop(page, 'barrel')).broken).toBe(true);
  await idle(page);
  expect(await page.evaluate(() => window.DreadDelve.tokenViews.size)).toBeGreaterThan(0);
});

test('Search finds a stash in a desk; a found secret door lets the shelf in front of it swing aside', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await page.evaluate(() => {
    const D = window.DreadDelve, f = D.get().floors[0];
    D.placePropAt({ floor:0, x:7, y:10 }, 'desk');
    f.props.at(-1).stash = { dc:5, text:'A secret drawer: a deed to a house in Vallaki.' };
    // a secret door in the north wall at 10,7, and a bookshelf standing in front of it
    f.grid[7 * f.W + 10] = 1; f.doors.push({ id:7001, i:7 * f.W + 10, state:'secret', dc:5 });
    f.props.push({ id:7002, k:'bookshelf', x:10, y:8, rot:1, hides:7001 }); f.propsV = (f.propsV || 0) + 1;
    D.rebuildFog?.(0);
  });
  await frameMap(page);
  await loadedDice(page);
  await selectHero(page);
  await page.locator('#selCard [data-act="search"]').click();
  await expect(page.locator('#cardLayer')).toContainText('a deed to a house in Vallaki');
  expect((await prop(page, 'desk')).stash.found).toBe(true);
  // from beside the shelf, Search finds the door; then the shelf swings aside and the way is open
  await page.evaluate(() => { const D = window.DreadDelve, a = D.get().tokens.find(t => t.name === 'Ada'); a.x = 10; a.y = 9; D.select(a.id); });
  await page.locator('#selCard [data-act="search"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().floors[0].doors.find(d => d.id === 7001).state)).toBe('closed');
  await page.locator('#selCard [data-act="selProp"]', { hasText:'Bookshelf' }).click();
  await page.locator('#selCard [data-act="propDo"][data-k="swing"]').click();
  expect((await prop(page, 'bookshelf')).swung).toBe(true);
  expect(await page.evaluate(() => window.DreadDelve.reach(0, 10, 9, 3, null).dist.has(7 * 32 + 10))).toBe(true);
});
