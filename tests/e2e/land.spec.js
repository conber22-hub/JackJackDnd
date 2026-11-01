import { test, expect, idle } from './helpers.js';

// The ground the party walks on: fields with crops in the village, and the caves under it.
test('a village field can be planted from the Maps tab, and the planting reaches the map', async ({ page }) => {
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Fields', seed:'e2e-fields', floors:1, size:40, template:'barovia', party:true }, false);
    document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove());
  });
  await idle(page);
  const field = await page.evaluate(() => window.DreadDelve.get().floors[0].rooms.find(r => r.crop));
  expect(field, 'the village has a field').toBeTruthy();
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="dungeon"]').click();
  const crop = page.locator(`select[data-edit="room"][data-id="${field.id}"][data-f="crop"]`);
  await expect(crop).toHaveValue(field.crop);
  const other = field.crop === 'pumpkin' ? 'cabbage' : 'pumpkin';
  await crop.selectOption(other);
  await expect.poll(() => page.evaluate(id => window.DreadDelve.get().floors[0].rooms.find(r => r.id === id).crop, field.id)).toBe(other);
  // and the ground: cobbles for this field, then back to the furrows
  const ground = page.locator(`select[data-edit="room"][data-id="${field.id}"][data-f="ground"]`);
  await ground.selectOption('cobble');
  await expect.poll(() => page.evaluate(id => window.DreadDelve.get().floors[0].rooms.find(r => r.id === id).ground, field.id)).toBe('cobble');
  await ground.selectOption('furrow');
});

test('the mine under the chapel is a cave, and the floor switch shows it', async ({ page }) => {
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Caves', seed:'e2e-caves', floors:2, size:40, template:'andral', party:true }, false);
    document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove());
  });
  await idle(page);
  expect(await page.evaluate(() => window.DreadDelve.get().floors[1].dug.length)).toBeGreaterThan(10);
  await page.locator('#floorDown').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.ui.floor)).toBe(1);
  await page.locator('#floorUp').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.ui.floor)).toBe(0);
});
