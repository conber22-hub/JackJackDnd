import { test, expect } from './helpers.js';

// ChatGPT's set pieces (engine/vaults.js): the DM puts one into a plain room from the Build tab; it brings its own
// furniture, name and read-aloud, the way in stays open, and undo takes it out again.
test('the DM puts a set piece into a room, and undo takes it out', async ({ page }) => {
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Vaults', seed:'vaults-e2e', floors:1, size:32, template:'blank', party:false }, false);
    // one 11×9 room with a tunnel running in from the west
    const grid = Array.from({ length:32 }, (_, y) => Array.from({ length:32 }, (_, x) => (x >= 10 && x <= 20 && y >= 10 && y <= 18) || (y === 14 && x >= 4 && x < 10) ? 1 : 0));
    D.importMap(JSON.stringify({ name:'Vaults', grid }));
    const f = D.get().floors[0], r = f.rooms.find(r => r.w >= 9) || f.rooms[0];
    D.ui.selRoom = r.id;
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click();
  });
  const room = () => page.evaluate(() => { const f = window.DreadDelve.get().floors[0], r = f.rooms.find(r => r.id === window.DreadDelve.ui.selRoom);
    const inside = p => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
    return { vault:r.vault || '', name:r.name, read:r.read || '', props:(f.props || []).filter(inside).length, entrance:f.grid[14 * f.W + 10], w:r.w, h:r.h }; });
  await page.locator('[data-act="tab"][data-k="build"]').click();
  const before = await room();
  expect(before.w * before.h).toBeGreaterThanOrEqual(63);
  await expect(page.locator('#setPieceSel')).toBeVisible();
  await page.locator('#setPieceSel').selectOption('coffin-niches');
  await page.locator('[data-act="setPiece"]').click();
  await expect.poll(async () => (await room()).vault).toBe('coffin-niches');
  const after = await room();
  expect(after.name).toBe('The Listening Niches');
  expect(after.read).toContain('coffins');
  expect(after.props).toBeGreaterThan(0);
  expect(after.entrance).not.toBe(0);                  // the square the tunnel comes in by is still open
  await expect(page.locator('#tabBody')).toContainText('Set piece: The Listening Niches');
  await page.evaluate(() => window.DreadDelve.undo());
  await expect.poll(async () => (await room()).vault).toBe('');
});
