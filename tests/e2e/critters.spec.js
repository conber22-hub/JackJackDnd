import { test, expect } from './helpers.js';

// 🐈 The valley's animals (render/critters.js): the dogs, cats, ravens and rats that make the Village of
// Barovia feel lived in, and the one crow that takes an interest in the party. A Wanderer starts in the village,
// setCritters is driven through window.DreadDelve.critters, and a small frame loop in the page stands in for
// the hook (Claude's) that will call updateCritters every frame.
async function begin(page){
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-cr'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-cr"]').click();
  await expect(page.locator('#wanderHud')).toBeVisible();
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  await page.keyboard.press('Escape');   // (the waking card)
}
// the hook, standing in: every frame, the animals move and react to the party, the hour and the weather
async function drive(page, hour = 12, rain = false){
  await page.evaluate(({ hour, rain }) => {
    if (window.__critterDriver) cancelAnimationFrame(window.__critterDriver);
    let last = performance.now();
    const tick = now => { const D = window.DreadDelve, w = D.wander, h = w.hero();
      D.critters.updateCritters((now - last) / 1000, { party:[h, ...w.members()].filter(Boolean).map(m => ({ x:m.x, y:m.y, floor:m.floor })), hour, rain });
      last = now; window.__critterDriver = requestAnimationFrame(tick); };
    window.__critterDriver = requestAnimationFrame(tick);
  }, { hour, rain });
}
const heroAt = page => page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return { x:h.x, y:h.y, floor:h.floor }; });
const list = page => page.evaluate(() => window.DreadDelve.critters.list());
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

test('the village has animals: they sit on walkable ground or perches, a raven flees, the crow keeps its distance, and clearCritters takes them all away', async ({ page }) => {
  test.setTimeout(300_000);
  await begin(page);
  await page.evaluate(() => { const D = window.DreadDelve; D.critters.setCritters(D.wander.hero().floor, { kind:'village', seed:'e2e-critters' }); });
  await drive(page, 12, false);
  // animals appear, on walkable squares or perched on a prop (setCritters places them synchronously;
  // the driver has had a couple of frames to settle their visibility by the time we look)
  await page.evaluate(() => new Promise(res => setTimeout(res, 2000)));
  const animals = await list(page);
  expect(animals.length, 'at least five animals on a village map').toBeGreaterThanOrEqual(5);
  const placed = await page.evaluate(list => {
    const f = window.DreadDelve.get().floors[window.DreadDelve.wander.hero().floor], bad = [];
    for (const a of list){
      const i = Math.round(a.y) * f.W + Math.round(a.x);
      const prop = (f.props || []).some(p => p.x === Math.round(a.x) && p.y === Math.round(a.y));
      if (!(f.grid[i] > 0 && !f.water?.includes(i)) && !a.perch && !prop) bad.push(`${a.kind} at ${a.x},${a.y}`);
    }
    return bad;
  }, animals);
  expect(placed, 'every animal on walkable ground or a perch').toEqual([]);
  expect(animals.map(a => a.kind).sort()).toEqual(expect.arrayContaining(['dog', 'cat', 'raven', 'crow', 'goat']));
  // the crow is on the map, and never within two squares of the hero
  const crow0 = await page.evaluate(() => window.DreadDelve.critters.crowAt());
  expect(crow0, 'the crow is on the map').not.toBeNull();
  expect(cheb(crow0, await heroAt(page))).toBeGreaterThanOrEqual(2);
  // a raven (or a cat) within reach of the hero moves away after a few frames
  const target = animals.find(a => a.kind === 'raven') || animals.find(a => a.kind === 'cat');
  expect(target, 'a raven or a cat to test with').toBeTruthy();
  const from = { x:target.x, y:target.y };
  await page.evaluate(({ x, y }) => { const h = window.DreadDelve.wander.hero(); h.x = Math.round(x) + 1; h.y = Math.round(y); }, from);
  await expect.poll(async () => {
    const l = await list(page), a = l.find(a => a.kind === target.kind && Math.abs(a.x - from.x) < 1 && Math.abs(a.y - from.y) < 1);
    return a ? 'still' : 'gone';
  }, { timeout:60_000, intervals:[2000] }).toBe('gone');
  // the crow, crowded, moves to a new perch ahead — still never within two squares
  const crow1 = await page.evaluate(() => window.DreadDelve.critters.crowAt());
  await page.evaluate(c => { const h = window.DreadDelve.wander.hero(); h.x = c.x; h.y = c.y + 1; }, crow1);
  await expect.poll(async () => { const c = await page.evaluate(() => window.DreadDelve.critters.crowAt()); const h = await heroAt(page); return cheb(c, h); }, { timeout:60_000, intervals:[2000] }).toBeGreaterThanOrEqual(2);
  // clearCritters removes them all
  await page.evaluate(() => window.DreadDelve.critters.clearCritters());
  expect(await list(page)).toEqual([]);
  expect(await page.evaluate(() => window.DreadDelve.critters.crowAt())).toBeNull();
  expect(await page.evaluate(() => !!window.DreadDelve.critters.list().length)).toBe(false);
});

test('at night the day animals stay in, and the crow keeps its watch', async ({ page }) => {
  test.setTimeout(300_000);
  await begin(page);
  await page.evaluate(() => { const D = window.DreadDelve; D.critters.setCritters(D.wander.hero().floor, { kind:'village', seed:'e2e-critters' }); });
  await drive(page, 22, false);
  await page.evaluate(() => new Promise(res => setTimeout(res, 4000)));
  const night = await list(page);
  expect(night.length).toBeGreaterThan(0);
  expect(night.map(a => a.kind)).not.toContain('dog');
  expect(night.map(a => a.kind)).not.toContain('cat');
  expect(night.map(a => a.kind)).not.toContain('goat');
  expect(night.map(a => a.kind)).toContain('crow');
  await page.evaluate(() => window.DreadDelve.critters.clearCritters());
  expect(await list(page)).toEqual([]);
});
