import { test, expect } from './helpers.js';

// ChatGPT's puzzles at the table (game/puzzles.js, ui/puzzles.js): the DM sets a riddle in a room with a door; it
// locks the door; the 🧩 sheet takes answers (a wrong one counts, and may set off a trap); the right one opens the door.
test('a riddle holds the door shut until it is answered', async ({ page }) => {
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Riddles', seed:'riddle-e2e', floors:1, size:32, template:'blank', party:false }, false);
    // an 9×7 room with a tunnel in from the west, and a door in its mouth
    const grid = Array.from({ length:32 }, (_, y) => Array.from({ length:32 }, (_, x) => (x >= 10 && x <= 18 && y >= 10 && y <= 16) || (y === 13 && x >= 4 && x < 10) ? 1 : 0));
    D.importMap(JSON.stringify({ name:'Riddles', grid }));
    D.placeDoorAt({ floor:0, x:9, y:13 });
    const f = D.get().floors[0], r = f.rooms.find(r => r.w >= 9) || f.rooms[0];
    D.ui.selRoom = r.id;
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click();
  });
  const door = () => page.evaluate(() => window.DreadDelve.get().floors[0].doors[0]?.state);
  const puzzle = () => page.evaluate(() => { const p = window.DreadDelve.get().floors[0].puzzles?.[0]; return p ? { solved:p.state.solved, fails:p.state.fails, answer:p.state.secret.answer } : null; });
  await page.locator('[data-act="tab"][data-k="build"]').click();
  await page.locator('#pzKind').selectOption('riddle');
  await page.locator('[data-act="setPuzzle"]').click();
  await expect.poll(puzzle).not.toBeNull();
  expect(await door()).toBe('locked');
  // the DM's 🧩 button opens the sheet, with the answer for the DM's eyes
  await expect(page.locator('#btnPuzzle')).toBeVisible();
  await page.locator('#btnPuzzle').click();
  const sheet = page.locator('#puzzleSheet');
  await expect(sheet).toBeVisible();
  const { answer } = await puzzle();
  await expect(sheet.locator('.pz-dm')).toContainText(answer);
  // a wrong answer counts
  await sheet.locator('#pzAnswer').fill('a teapot'); await sheet.locator('[data-pzanswer]').click();
  await expect.poll(async () => (await puzzle()).fails).toBe(1);
  expect(await door()).toBe('locked');
  // the right one, shouted with a flourish, opens the door
  await sheet.locator('#pzAnswer').fill(`${answer.toUpperCase()}!`); await sheet.locator('[data-pzanswer]').click();
  await expect.poll(async () => (await puzzle()).solved).toBe(true);
  expect(await door()).toBe('open');
  await expect(sheet).toContainText('It is done');
});
