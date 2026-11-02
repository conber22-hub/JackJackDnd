import { test, expect, preparePage, arena, tilePoint } from './helpers.js';

// A round at the table under the Curtain, a phone on one side and the DM on the other.
test('a round at the table: the player acts, waits on the DM, and gets the result when the DM shows it', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(240_000);
  await arena(dm, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  await dm.evaluate(() => window.DreadDelve.placeMonster('zombie', { floor:0, x:7, y:10 }));
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const player = await context.newPage(), errors = await preparePage(player);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada'); await player.locator('#pWord').fill('e2e-secret'); await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect.poll(() => player.evaluate(() => window.DreadDelve.get()?.tokens.find(t => t.id === window.DreadDelve.ui.myToken)?.name)).toBe('Ada');
    await expect(dm.locator('#roleBadge')).toContainText('1 joined');   // the DM's top bar counts her
    // a fight, and it is Ada's turn
    await dm.evaluate(() => { const D = window.DreadDelve; D.rollInitiative(); const s = D.get(); for (let k = 0; k < 6 && D.tokById(s.combat.order[s.combat.idx])?.name !== 'Ada'; k++) D.nextTurn(); });
    await expect.poll(() => dm.evaluate(() => window.DreadDelve.outbox.filter(o => o.cat === 'turns').length)).toBeLessThanOrEqual(1);   // whose turn: only the latest waits
    await expect.poll(() => player.evaluate(() => { const D = window.DreadDelve, s = D.get(); return D.tokById(s.combat.order[s.combat.idx])?.name; })).toBe('Ada');
    // she aims her weapon at the zombie: on a phone the initiative list steps aside while she aims
    await player.evaluate(() => { const D = window.DreadDelve; D.select(D.ui.myToken); });
    await player.locator('#selCard [data-act="atk"]').first().click();
    await expect(player.locator('#initBar')).toBeHidden();
    const z = await player.evaluate(() => { const t = window.DreadDelve.get().tokens.find(t => t.kind === 'monster'); return { x:t.x, y:t.y }; });
    const pt = await tilePoint(player, z.x, z.y); await player.mouse.click(pt.x, pt.y);
    // it is with the DM: she sees that it is, and nothing else yet
    await expect(player.locator('#waitPill')).toHaveClass(/show/);
    await expect(player.locator('#waitPill')).toContainText('With the DM');
    await expect(dm.locator('#reqPanel')).toContainText('Ada');
    // the DM rolls it and shows it, in one tap: it comes up on her phone, and the sign goes
    await dm.locator('#reqPanel [data-act="reqAns"][data-show="1"]').click();
    await expect(player.locator('#cardLayer')).toContainText(/Ada/);
    await expect(player.locator('#waitPill')).not.toHaveClass(/show/);
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally { await context.close(); }
});
