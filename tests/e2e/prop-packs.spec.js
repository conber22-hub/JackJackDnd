import { test, expect, arena } from './helpers.js';

// The Barovian prop packs (src/data/prop-packs.js): in the Build palette, placed like any prop, and a paired piece
// (a crypt gate shut / raised) changes into its other state from the DM's prop card. (The test server serves only the
// app file, so the pieces here are their drawn stand-ins; the models themselves load beside the app on Vercel.)
test('a crypt gate from the packs: placed, then raised from the DM's prop card', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await page.evaluate(() => window.DreadDelve.placePropAt({ floor:0, x:7, y:10 }, 'cryptGateShut'));
  const blocked = () => page.evaluate(() => { const st = window.DreadDelve.get(), f = st.floors[0], p = f.props.find(q => q.k.startsWith('cryptGate'));
    return { k:p.k, id:p.id }; });
  const g = await blocked();
  expect(g.k).toBe('cryptGateShut');
  await page.evaluate(() => { const D = window.DreadDelve; D.select(D.get().tokens.find(t => t.name === 'Ada').id); });
  await page.locator(`[data-act="selProp"][data-k="${g.id}"]`).click();
  await page.locator('[data-act="propDo"][data-k="swap"]').click();
  expect((await blocked()).k).toBe('cryptGateUp');
  await expect(page.locator('[data-act="propDo"][data-k="swap"]')).toContainText('shut');
});
