import { test, expect, arena, frameMap, tilePoint, idle, selectHero } from './helpers.js';

// A training hall with a wall across it (x = 11, rows 8–11), Ada with a bow, a sword and two area spells,
// and three zombies: one behind the wall, two out in the open.
async function range(page){
  await arena(page, [{ name:'Ada', x:4, y:11 }]);
  await page.evaluate(() => {
    const D = window.DreadDelve, s = D.get(), f = s.floors[0], ada = s.tokens.find(t => t.name === 'Ada');
    for (let y = 8; y <= 11; y++) f.grid[y * f.W + 11] = 0;
    D.goFloor(0);
    ada.attacks = [{ n:'Longbow', b:6, d:'1d8+3', t:'piercing', rng:[150, 600] }, { n:'Longsword', b:6, d:'1d8+3', t:'slashing', m:1 }];
    ada.casts = [{ n:'Fireball', k:'save', l:3, sv:'dex', dc:15, d:'8d6', ty:'fire', half:true, area:['sphere', 20], r:150 },
                 { n:'Burning Hands', k:'save', l:1, sv:'dex', dc:15, d:'3d6', ty:'fire', half:true, area:['cone', 15], r:0 }];
    for (const [x, y] of [[13, 10], [14, 12], [9, 9]]) D.placeMonster('zombie', { floor:0, x, y });
    for (const t of s.tokens) if (t.kind === 'monster') t.hp = t.maxHp = 200;   // nobody dies mid-test
  });
  await idle(page); await frameMap(page, 10, 10); await selectHero(page);
}
const hover = async (page, x, y) => { const p = await tilePoint(page, x, y); await page.mouse.move(p.x, p.y); await page.mouse.move(p.x + 2, p.y + 1); return p; };

test('an attack shows its reach and cover; the DM needs a second tap to shoot past total cover', async ({ page }) => {
  await range(page);
  await page.locator('#selCard [data-act="atk"][data-i="0"]').click();
  await hover(page, 13, 10);
  await expect(page.locator('#moveTip')).toContainText('behind total cover');
  const p = await hover(page, 14, 12);
  await expect(page.locator('#moveTip')).toContainText('Longbow → Zombie 2');
  await expect(page.locator('#moveTip')).not.toContainText('total cover');
  // the sword can't reach that far: the first tap only warns
  await page.keyboard.press('Escape'); await selectHero(page);
  await page.locator('#selCard [data-act="atk"][data-i="1"]').click();
  await page.mouse.click(p.x + 2, p.y + 1);
  await expect(page.locator('#toasts')).toContainText('tap again to roll it anyway');
  expect(await page.evaluate(() => window.DreadDelve.ui.mode)).toBe('attack');
  await page.mouse.click(p.x + 2, p.y + 1);
  await expect(page.locator('#cardLayer .pop').last()).toContainText("out of reach");
});

test('Fireball previews who it catches, stops at walls, and rolls a save for each', async ({ page }) => {
  await range(page);
  await page.locator('#selCard [data-act="cast"][data-i="0"]').click();
  const p = await hover(page, 12, 13);
  await expect(page.locator('#moveTip')).toContainText('2 caught: Zombie, Zombie 2');
  await page.mouse.click(p.x + 2, p.y + 1);
  const card = page.locator('#cardLayer .pop').last();
  await expect(card).toContainText('Ada: Fireball');
  await expect(card).toContainText('Zombie — DEX');
  await expect(card).toContainText('Zombie 2 — DEX');
  await expect(card).not.toContainText('Zombie 3');
  expect(await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.kind === 'monster').map(t => t.maxHp - t.hp > 0))).toEqual([true, true, false]);
});

test('on a touch screen an area is placed with the first tap and cast with the second', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 }, hasTouch:true });
  const page = await context.newPage();
  const { preparePage } = await import('./helpers.js'); const errors = await preparePage(page);
  try {
    await range(page);
    await page.locator('#selCard [data-act="cast"][data-i="0"]').click();
    const p = await tilePoint(page, 12, 13);
    await page.touchscreen.tap(p.x, p.y);
    await expect(page.locator('#modeText')).toContainText('tap again to cast it there');
    expect(await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.kind === 'monster').every(t => t.hp === t.maxHp))).toBe(true);
    await page.touchscreen.tap(p.x, p.y);
    await expect(page.locator('#cardLayer .pop').last()).toContainText('Ada: Fireball');
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
