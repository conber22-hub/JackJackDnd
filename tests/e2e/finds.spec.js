import { test, expect } from './helpers.js';

// ✨ Finding things (game/finds.js, engine/finds-lite.js, render/glints.js): in the Village of Barovia a glint is picked
// up with Ⓐ (coins or a keepsake into the pack), a gravestone is read, and a wolf that sees the hero gets a "!" over its
// head a beat before the fight.
test('a glint picked up, a gravestone read, and a "!" before a fight', async ({ page }) => {
  test.setTimeout(240_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-finds'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-finds"]').click();
  await page.keyboard.press('Escape');
  const finds = await page.evaluate(() => window.DreadDelve.get().floors[0].finds);
  expect(finds.some(f => f.kind === 'glint')).toBe(true);
  expect(finds.some(f => f.kind === 'read' && f.on === 'gravestone')).toBe(true);
  // stand beside a glint the hero can see
  const beside = (kind, on) => page.evaluate(([kind, on]) => { const D = window.DreadDelve, f = D.get().floors[0], h = D.wander.hero();
    const fd = f.finds.find(x => x.kind === kind && (!on || x.on === on) && !x.hidden && !x.done);
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => ({ x:fd.x + dx, y:fd.y + dy }))
      .find(p => f.grid[p.y * f.W + p.x] > 0 && !f.props.some(q => q.x === p.x && q.y === p.y) && !D.get().tokens.some(t => t.floor === 0 && t.x === p.x && t.y === p.y));
    h.x = spot.x; h.y = spot.y; D.syncTokens(); return fd; }, [kind, on]);
  await beside('glint');
  await expect(page.locator('#wdPrompt')).toContainText('glints');
  const before = await page.evaluate(() => ({ gp:window.DreadDelve.wander.coinsGp(), n:window.DreadDelve.wander.pack().length, pages:(window.DreadDelve.wander.W().pages || []).length }));
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => ({ gp:window.DreadDelve.wander.coinsGp(), n:window.DreadDelve.wander.pack().length, pages:(window.DreadDelve.wander.W().pages || []).length })))
    .not.toEqual(before);
  await expect(page.locator('#wdPrompt')).not.toContainText('glints');
  await page.keyboard.press('Escape');
  // a gravestone: its line, on a card
  await beside('read', 'gravestone');
  await expect(page.locator('#wdPrompt')).toContainText('Read the gravestone');
  await page.keyboard.press('Space');
  await expect(page.locator('#cardLayer')).toContainText('A gravestone');
  await page.keyboard.press('Escape');
  // a wolf in sight: a "!" over it, then the fight
  const wolf = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), f = D.get().floors[0];
    const spot = [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3], [3, -3], [-3, 3]].map(([dx, dy]) => ({ x:h.x + dx, y:h.y + dy })).find(p => f.grid[p.y * f.W + p.x] > 0);
    D.placeMonster('wolf', { floor:0, x:spot.x, y:spot.y }); return D.get().tokens.find(t => t.bid === 'wolf').id; });
  await page.evaluate(() => { const w = window.DreadDelve.wander; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.stepHero(dx, dy)) return; });
  await expect.poll(() => page.evaluate(id => window.DreadDelve.tokenViews.get(id)?.group.children.some(c => c.isSprite && c.renderOrder === 20) ?? false, wolf), { timeout:3000, intervals:[50] }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().combat.active)).toBe(true);
  expect(errs).toEqual([]);
});
