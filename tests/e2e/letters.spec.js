// The Count's letters (brief-4). The DM writes from an opening, sends from the outbox, and the
// table receives aged parchment with a seal that breaks. Two steps are simulated, honestly:
// the table's message handler (m.t === 'letter') is Claude's hook, not yet in the app, so where
// the handler will call net.onLetter, the spec calls it directly with the very letter the DM
// sent; and live PeerJS joins stall in a cold sandbox run (the tour spec's join stalls
// standalone too, on the untouched base), so the player's phone is modelled by flipping the
// DM's page to a player (the ghost spec's flip), which is how the receiver and the list are
// exercised. The reload test proves the list itself survives a reload, via the autosave's
// Continue and a second flip.
import { test, expect, arena } from './helpers.js';

async function flipToPlayer(page, name){
  await page.evaluate(n => {
    const D = window.DreadDelve, hero = D.get().tokens.find(t => t.name === n);
    D.ui.myToken = hero.id; D.ui.role = 'player'; document.body.classList.add('player');
  }, name);
  await page.locator('[data-act="tab"]').first().click();   // re-render as a player: the tabs correct to hero first
  await expect(page.locator('[data-act="tab"][data-k="hero"]')).toBeVisible();
}
async function sendFromOutbox(dm){
  // The outbox shows its rows only when open; the pill alone says how many wait.
  const item = dm.locator('.outItem', { hasText:'Letter from' });
  if (!(await item.isVisible())) await dm.locator('[data-act="outToggle"]').click();
  await item.locator('[data-act="outSend"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.outbox.length)).toBe(0);
}
const sentLetter = dm => dm.evaluate(() => window.DreadDelve.get().campaign.letters[0]);

test('the DM writes one from an opening, sends it from the outbox, and the player gets it sealed, opens it and finds it in their list after a reload', async ({ page }) => {
  test.setTimeout(300_000);
  await arena(page);
  // The desk: an opening fills the letter, the preview shows it sealed, Send holds it.
  await page.locator('#btnLetters').click();
  await expect(page.locator('#letterDesk')).toBeVisible();
  await page.locator('[data-open="0"]').click();
  await expect(page.locator('#ltFrom')).toHaveValue('Count Strahd');
  await expect(page.locator('#ltBody')).toContainText('dine');
  await page.locator('[data-act="letterPreview"]').click();
  await expect(page.locator('#ltPreviewPane .letter-sheet.sealed')).toBeVisible();
  await page.locator('[data-act="letterSend"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.outbox.length)).toBe(1);
  // Sending closes the desk; reopening shows the letter in the sent list, then the outbox sends it.
  await page.locator('#btnLetters').click();
  await expect(page.locator('#letterDesk')).toContainText('the whole party');
  await page.locator('#letterDesk [data-act="letterClose"]').click();
  await page.locator('[data-act="outToggle"]').click();
  await expect(page.locator('#outPanel')).toContainText('Letter from Count Strahd');
  await sendFromOutbox(page);
  // The handler's call, with the letter the DM actually sent, on the player's phone.
  const letter = await sentLetter(page);
  await flipToPlayer(page, 'Ada');
  await page.evaluate(l => window.DreadDelve.net.onLetter(l), letter);
  await expect(page.locator('#letterOverlay .letter-sheet.sealed')).toBeVisible();
  await page.locator('#letterOverlay [data-act="letterSeal"]').click();
  await expect(page.locator('#letterOverlay .letter-sheet.open .ink')).toContainText('dine');
  await page.locator('#letterOverlay [data-act="letterClose"]').click();
  await page.locator('[data-act="tab"][data-k="hero"]').click();
  await expect(page.locator('#letterList')).toContainText('Count Strahd');
  // A reload doesn't lose it: Continue restores the delve, a second flip restores the phone.
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  const door = page.locator('[data-act="thRole"][data-k="dm"]');
  if (await door.isVisible()) await door.click();
  await page.locator('#continueBox [data-act="continue"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
  await flipToPlayer(page, 'Ada');
  await page.locator('[data-act="tab"][data-k="hero"]').click();
  await expect(page.locator('#letterList')).toContainText('Count Strahd');
});

test("a letter to one hero doesn't reach another player", async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('#newName').fill('Bram');
  await page.locator('[data-act="addPc"]').click();
  await page.locator('#btnLetters').click();
  const adaId = await page.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').id);
  await page.locator('#ltTo').selectOption(adaId);
  await page.locator('[data-open="1"]').click();
  await page.locator('[data-act="letterSend"]').click();
  await sendFromOutbox(page);
  const letter = await sentLetter(page);
  expect(letter.to).toBe(adaId);
  // Bram's phone first, on an empty list: the broadcast arrives, but nothing shows and nothing is kept.
  // (Bram first because the flips share this page's localStorage — a later flip would see Ada's stored letter.)
  await flipToPlayer(page, 'Bram');
  await page.evaluate(l => window.DreadDelve.net.onLetter(l), letter);
  await expect(page.locator('#letterOverlay')).toHaveCount(0);
  await page.locator('[data-act="tab"][data-k="hero"]').click();
  await expect(page.locator('#letterList .letter-entry')).toHaveCount(0);
  // Ada's phone: the same letter opens.
  await flipToPlayer(page, 'Ada');
  await page.evaluate(l => window.DreadDelve.net.onLetter(l), letter);
  await expect(page.locator('#letterOverlay .letter-sheet.sealed')).toBeVisible();
  await page.locator('#letterOverlay [data-act="letterSeal"]').click();
  await expect(page.locator('#letterOverlay .letter-sheet.open .ink')).toContainText('Turn back');
});

test('the TV shows it', async ({ page:tv }) => {
  test.setTimeout(180_000);
  await tv.goto('/dread-delve.html?screen');
  await tv.waitForFunction(() => !!window.DreadDelve);
  await expect.poll(() => tv.evaluate(() => document.body.classList.contains('screen'))).toBe(true);
  const letter = { id:'lt-tv-1', from:'Count Strahd', to:null, body:'You are cordially invited to dinner.', sig:'Strahd', seal:'crest', at:Date.now() };
  await tv.evaluate(l => window.DreadDelve.net.onLetter(l), letter);
  await expect(tv.locator('#letterOverlay .letter-sheet.sealed.tv')).toBeVisible();
  await tv.locator('#letterOverlay [data-act="letterSeal"]').click();
  await expect(tv.locator('#letterOverlay .letter-sheet.open .ink')).toContainText('cordially');
});
