import { test, expect } from './helpers.js';

// Rooms needn't be rectangles: the DM reshapes one from the Build tab, its corners go back to rock (and undo brings
// them back), and the generator mixes shaped rooms into a new delve.
test('a room reshaped from the Build tab, and shaped rooms in a generated delve', async ({ page }) => {
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Shapes', seed:'shapes-e2e', floors:1, size:32, template:'blank', party:false }, false);
    const f = D.get().floors[0];
    // the landing (the only room on a blank floor, 6×5: big enough to shape)
    const r = f.rooms[0]; D.ui.selRoom = r.id;
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click();
  });
  const room = () => page.evaluate(() => { const f = window.DreadDelve.get().floors[0], r = f.rooms[0];
    return { shape:r.shape || '', corner:f.grid[r.y * f.W + r.x], middle:f.grid[r.cy * f.W + r.cx], w:r.w, h:r.h }; });
  await page.locator('[data-act="tab"][data-k="build"]').click();
  const pick = page.locator('#tabBody select[data-f="shape"]').first();
  await expect(pick).toBeVisible();
  const before = await room();
  expect(before.corner).toBe(1);                       // a rectangle: the corner is floor
  expect(before.w).toBeGreaterThanOrEqual(5);
  await pick.selectOption('octagon');
  await expect.poll(async () => (await room()).shape).toBe('octagon');
  const after = await room();
  expect(after.corner).toBe(0);                        // its corner is rock now
  expect([1, 4, 3]).toContain(after.middle);           // and its middle is still open (floor, or the stairs)
  // undo puts the corner back
  await page.evaluate(() => window.DreadDelve.undo());
  await expect.poll(async () => (await room()).corner).toBe(1);

  // a generated delve: some rooms come shaped, each with its middle open
  const made = await page.evaluate(() => {
    const D = window.DreadDelve;
    D.newDelve({ name:'Crypts', seed:'shapes-e2e-2', floors:1, size:40, template:'castle', party:false }, false);
    const f = D.get().floors[0];
    return { shaped:f.rooms.filter(r => r.shape).length, open:f.rooms.every(r => f.grid[r.cy * f.W + r.cx] !== 0) };
  });
  expect(made.shaped).toBeGreaterThan(0);
  expect(made.open).toBe(true);
});
