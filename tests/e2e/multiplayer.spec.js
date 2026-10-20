import { test, expect, preparePage, arena, expectPositions, frameMap, selectHero, clickTile } from './helpers.js';

test('DM opens a PeerJS table and a player joins, is seated and moves on both screens', async ({ page:dm, browser, baseURL }) => {
  await arena(dm);
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  expect(code).toMatch(/^[A-Z2-9]{4}$/);
  // A separate context models a separate device, including cookies and localStorage.
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  try {
    const player = await context.newPage();
    const errors = await preparePage(player);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada');
    await player.locator('#pWord').fill('e2e-secret');
    await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect(player.locator('#startModal')).toBeHidden();
    await expect.poll(() => player.evaluate(() => {
      const D = window.DreadDelve;
      return { status:D.net.status, role:D.ui.role, hero:D.get()?.tokens.find(t => t.id === D.ui.myToken)?.name };
    })).toEqual({ status:'open', role:'player', hero:'Ada' });
    expect(await dm.evaluate(() => {
      const D = window.DreadDelve, [seat] = D.net.conns.values();
      return { connections:D.net.conns.size, name:seat.name,
        hero:D.tokById(D.get().seats[seat.conn.peer]).name, transport:seat.conn.peerConnection.connectionState };
    })).toEqual({ connections:1, name:'Ada', hero:'Ada', transport:'connected' });
    await expectPositions(player, { Ada:{ x:6, y:10 } });
    // Use the player's real input path; the DM must accept and broadcast the move.
    await selectHero(player);
    await player.keyboard.press('ArrowRight');
    await expectPositions(dm, { Ada:{ x:7, y:10 } });
    await expectPositions(player, { Ada:{ x:7, y:10 } });
    // A DM move also reaches the already-connected player.
    await frameMap(dm);
    await selectHero(dm);
    await clickTile(dm, 9, 10);
    await expectPositions(dm, { Ada:{ x:9, y:10 } });
    await expectPositions(player, { Ada:{ x:9, y:10 } });
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally {
    await context.close();
  }
});
