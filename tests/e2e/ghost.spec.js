// Wick, the ghost who shows the DM what's next (brief-3). This spec does NOT use the helpers'
// fixture: the fixture keeps Wick quiet, and here he is the thing under test. Each test opens its
// own context (a fresh device) and prepares it with { wick:true }, then asserts its own errors.
import { test, expect } from '@playwright/test';
import { preparePage, idle, startDM, arena, selectHero } from './helpers.js';

async function freshPage(browser, baseURL, viewport){
  const context = await browser.newContext({ baseURL, ...(viewport ? { viewport } : {}) });
  const page = await context.newPage();
  const errors = await preparePage(page, { wick:true });
  return { context, page, errors };
}
const wickStep = page => page.locator('#wickWrap').getAttribute('data-step');
const wickSay = page => page.locator('#wickWrap .wick-bubble > span').textContent();

test('a fresh DM is pointed at the right thing at three stages: start screen, no heroes, an outbox item', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const { context, page, errors } = await freshPage(browser, baseURL);
  try {
    // Stage 1: the start screen, before any door is chosen.
    await expect.poll(() => wickStep(page)).toBe('start-door');
    await expect.poll(() => wickSay(page)).toBe("Take the Count's seat to begin.");
    // Stage 2: descended with no heroes, so the next thing is the table.
    await startDM(page);
    await expect.poll(() => wickStep(page)).toBe('host');
    await expect.poll(() => wickSay(page)).toBe('Open the Table tab.');
    await page.locator('[data-act="tab"][data-k="table"]').click();
    await expect.poll(() => wickSay(page)).toBe('Open the table so players can join.');
    // Stage 3: a fight's turn banner waits in the outbox.
    await page.locator('[data-act="tab"][data-k="tokens"]').click();
    await page.locator('#newName').fill('Ada');
    await page.locator('[data-act="addPc"]').click();
    await idle(page);
    await page.evaluate(() => { const D = window.DreadDelve; D.rollInitiative(); D.nextTurn(); });
    await expect.poll(() => page.evaluate(() => window.DreadDelve.outbox.length)).toBeGreaterThan(0);
    await expect.poll(() => wickStep(page)).toBe('outbox');
    await expect.poll(() => wickSay(page)).toContain('send it');
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('"Got it" moves him on to the next step', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const { context, page, errors } = await freshPage(browser, baseURL);
  try {
    await arena(page);
    await selectHero(page, 'Ada');
    await page.keyboard.press('Control+k');
    await page.locator('#palQ').fill('zombie');
    // Two zombies now: the SRD one and Barovia's. Either will do for the fight.
    await page.locator('.pal-row', { hasText: 'Place Zombie' }).first().click();
    await expect.poll(() => page.evaluate(() => {
      const D = window.DreadDelve, ada = D.get().tokens.find(t => t.name === 'Ada');
      const z = D.get().tokens.find(t => (t.bid || '').includes('zombie'));
      return z && ada && Math.max(Math.abs(z.x - ada.x), Math.abs(z.y - ada.y)) <= 12;
    })).toBe(true);
    // A fight, advanced to a monster's turn, with its turn banner in the outbox: two steps match,
    // and the outbox one comes first.
    await page.evaluate(() => {
      const D = window.DreadDelve;
      D.rollInitiative();
      for (let i = 0; i < 10 && D.currentTurn()?.kind !== 'monster'; i++) D.nextTurn();
    });
    await idle(page);
    await expect.poll(() => wickStep(page)).toBe('outbox');
    await page.locator('#wickWrap button', { hasText: 'Got it' }).click();
    await expect.poll(() => wickStep(page)).toBe('monster-turn');
    await expect.poll(() => wickSay(page)).toBe('Its turn — run its actions, or Next turn.');
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('turning him off keeps him off after a reload', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const { context, page, errors } = await freshPage(browser, baseURL);
  try {
    await expect.poll(() => wickStep(page)).toBe('start-door');
    // The topbar's help button sits behind the start modal; the start screen has its own.
    await page.locator('#startModal [data-act="help"]').click();
    await expect(page.locator('#btnWick')).toBeVisible();
    await page.locator('#btnWick').click();
    await expect(page.locator('#wickWrap')).toBeHidden();
    await page.reload();
    await page.waitForFunction(() => !!window.DreadDelve);
    await expect(page.locator('#wickWrap')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('dreaddelve.wick.v1'))).toBe('off');
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test("a player's screen gets only the player steps", async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const { context, page, errors } = await freshPage(browser, baseURL, { width:390, height:844 });
  try {
    await startDM(page);
    // On a phone the panel starts as a sheet the ☰ button opens; a tab tap needs it open.
    if (await page.locator('#panel.closed').count()) await page.locator('#btnPanel').click();
    await page.locator('[data-act="tab"][data-k="tokens"]').click();
    await page.locator('#newName').fill('Ada');
    await page.locator('[data-act="addPc"]').click();
    await idle(page);
    // Becoming a player is what joining a table does: the role flips. A live join stalls on this
    // sandbox's PeerJS path (proven on the untouched base in October), so the flip is done directly.
    await page.evaluate(() => {
      const D = window.DreadDelve, hero = D.get().tokens.find(t => t.name === 'Ada');
      D.ui.myToken = hero.id; D.ui.role = 'player'; document.body.classList.add('player');
    });
    await expect.poll(() => wickStep(page)).toMatch(/^p-/);
    await expect.poll(() => wickSay(page)).not.toContain('Open the table');
    // On a phone he sits in a corner with the bubble and an arrow, rather than over the button.
    await expect(page.locator('#wickWrap')).toHaveClass(/corner/);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('the TV screen never has him', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const { context, page, errors } = await freshPage(browser, baseURL);
  try {
    await page.goto('/dread-delve.html?screen');
    await page.waitForFunction(() => !!window.DreadDelve);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('screen'))).toBe(true);
    await expect(page.locator('#wickWrap')).toBeHidden();
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('the start screen: Session Zero, then Continue after a reload', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  // Two fresh devices: choosing the DM door hides it, so the Session Zero step and the
  // Descend-then-reload flow can't share one start screen.
  const first = await freshPage(browser, baseURL);
  try {
    await first.page.locator('[data-act="thRole"][data-k="dm"]').click();
    await expect.poll(() => wickStep(first.page)).toBe('start-s0');
    await expect.poll(() => wickSay(first.page)).toBe('Begin with Session Zero.');
  } finally { await first.context.close(); }
  expect(first.errors, 'Uncaught browser errors').toEqual([]);
  const second = await freshPage(browser, baseURL);
  try {
    await startDM(second.page);
    await second.page.reload();
    await second.page.waitForFunction(() => !!window.DreadDelve);
    await expect.poll(() => wickStep(second.page)).toBe('start-continue');
    await expect.poll(() => wickSay(second.page)).toBe('Continue where you left off.');
  } finally { await second.context.close(); }
  expect(second.errors, 'Uncaught browser errors').toEqual([]);
});
