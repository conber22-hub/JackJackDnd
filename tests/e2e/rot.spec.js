import { test, expect, arena } from './helpers.js';

// ☣ The rot in play (Codex's engine/rot.js, game/rot.js): marks of a Seep-touched feature carry a hero into a new
// stage with its card; the Chorus whispers and offers something for one more mark, taken on the card; the token
// card and the DM see the stage; at the last stage the DM is given what becomes of them; the Dutch Oven takes a mark.
test('the rot: a stage\'s card, the Chorus and its offer, the stage on the token card, taken, and the Oven\'s cure', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  const id = await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter');
    Object.assign(h, { name:'Ves', lvl:3, calling:'vanguard', path:'hollowed' });
    const t = D.applyCharacter(h); Object.assign(t, { floor:0, x:6, y:11 }); return t.id; });
  // two marks, then a third: Tinged
  await page.evaluate(id => { const D = window.DreadDelve, t = D.tokById(id); t.seepMarks = 2; D.payPrice(t, { also:[{ k:'seepCost', what:'mark' }] }); }, id);
  await expect(page.locator('#cardLayer .pop', { hasText:'Ves: Tinged' })).toBeVisible();
  // the Chorus at a rest, from the middle stages (Rooted at 8): forced to speak, and to offer
  const said = await page.evaluate(id => { const D = window.DreadDelve, t = D.tokById(id); t.seepMarks = 9; t.hp = 5;
    return D.rot.chorusSpeaks(t, 'rest', () => 0); }, id);
  expect(said?.text).toBeTruthy(); expect(said?.offer?.kind).toBe('heal');
  const take = page.locator('#cardLayer [data-act="chorusTake"]');
  await expect(take).toBeVisible();
  await take.click();
  const after = await page.evaluate(id => { const t = window.DreadDelve.tokById(id); return { marks:t.seepMarks, hp:t.hp, offer:t.chorusOffer || null }; }, id);
  expect(after).toEqual({ marks:10, hp:9, offer:null });
  // the token card: the stage, its line, and (the DM) what a priest and the Count would see
  await page.evaluate(id => window.DreadDelve.select(id), id);
  await expect(page.locator('#selCard')).toContainText('Rooted');
  await expect(page.locator('#selCard')).toContainText('The Count');
  // taken: the DM's choice of what becomes of them
  await page.evaluate(id => { const D = window.DreadDelve, t = D.tokById(id); t.seepMarks = 29; D.payPrice(t, { also:[{ k:'seepCost', what:'mark' }] }); }, id);
  await expect(page.locator('#cardLayer .pop', { hasText:'Ves is taken' })).toBeVisible();
  // the Oven: one mark a visit, not two
  const cured = await page.evaluate(id => { const D = window.DreadDelve, t = D.tokById(id); t.seepMarks = 5;
    const a = D.rot.ovenCure([t], 'village:1'), m1 = t.seepMarks, b = D.rot.ovenCure([t], 'village:1'), m2 = t.seepMarks, c = D.rot.ovenCure([t], 'village:2');
    return [a, m1, b, m2, c, t.seepMarks]; }, id);
  expect(cured).toEqual([1, 4, 0, 4, 1, 3]);
});
