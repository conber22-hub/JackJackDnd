import { test, expect, startDM, idle, preparePage } from './helpers.js';

// Read the app's save out of the idb-keyval store (database 'keyval-store', store 'keyval').
async function idbSave(page){
  return page.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('keyval-store');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('keyval')) return resolve(null);
      const tx = db.transaction('keyval', 'readonly').objectStore('keyval').get('dreaddelve.save.v1');
      tx.onsuccess = () => resolve(tx.result ?? null);
      tx.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  }));
}

test('add, tag, filter, search, pin, tick off, delete with undo, tonight\'s notes', async ({ page }) => {
  // a long test on a slow sandbox: the suite's 60 s budget is not enough for all its steps
  test.setTimeout(180_000);
  await startDM(page);
  await page.keyboard.press('n');
  await expect(page.locator('#nbDrawer.open')).toBeVisible();
  // typing a #tag tags the note and leaves the text
  await page.locator('#nbText').fill('Met #npc Grun at the mill');
  await page.keyboard.press('Enter');
  const note = page.locator('.nb-note', { hasText: 'Met Grun at the mill' });
  await expect(note).toBeVisible();
  await expect(note.locator('.nb-tag.on')).toHaveCount(1);
  // tapping a tag onto a note
  await note.locator('.nb-tag', { hasText: '💰' }).click();
  await expect(note.locator('.nb-tag.on')).toHaveCount(2);
  // filter: a tag the note lacks hides it; All brings it back
  await page.locator('[data-nb-filter="hook"]').click();
  await expect(note).toBeHidden();
  await page.locator('[data-nb-filter=""]').click();
  await expect(note).toBeVisible();
  // search
  await page.locator('#nbSearch').fill('zzz');
  await expect(note).toBeHidden();
  await page.locator('#nbSearch').fill('Grun');
  await expect(note).toBeVisible();
  await page.locator('#nbSearch').fill('');
  // pin: a second note, then pin the first above it
  await page.locator('#nbText').fill('Bought rope');
  await page.keyboard.press('Enter');
  const second = page.locator('.nb-note', { hasText: 'Bought rope' });
  await expect(second).toBeVisible();
  await note.locator('[data-nb="pin"]').click();
  await expect(page.locator('.nb-note').first()).toContainText('Met Grun');
  // tick off a To do
  await page.locator('#nbText').fill('Pay the miller #todo');
  await page.keyboard.press('Enter');
  const todo = page.locator('.nb-note', { hasText: 'Pay the miller' });
  await expect(todo.locator('[data-nb="done"]')).toBeVisible();
  await todo.locator('[data-nb="done"]').click();
  await expect(todo).toHaveClass(/done/);
  // delete with undo
  await second.locator('[data-nb="del"]').click();
  await expect(second).toBeHidden();
  await page.locator('[data-nb="undo"]').click();
  await expect(second).toBeVisible();
  // tonight's notes: this session's notes as plain text, grouped by tag
  await page.locator('[data-nb="tonight"]').click();
  await expect(page.locator('#nbTonightText')).toContainText('👤 NPC');
  await expect(page.locator('#nbTonightText')).toContainText('Met Grun at the mill');
  await expect(page.locator('#nbTonightText')).toContainText('❗ To do');
  await expect(page.locator('#nbTonightText')).toContainText('✓ Pay the miller');
});

test('a note survives a reload', async ({ page }) => {
  await startDM(page);
  await page.keyboard.press('n');
  await page.locator('#nbText').fill('Reload me');
  await page.keyboard.press('Enter');
  await expect(page.locator('.nb-note', { hasText: 'Reload me' })).toBeVisible();
  // the debounced autosave lands the note in IndexedDB, then the reload restores it
  await expect.poll(async () => {
    const s = await idbSave(page);
    return s?.campaign?.notebook?.some(n => n.text === 'Reload me') ?? false;
  }, { timeout: 15_000 }).toBe(true);
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  await expect(page.locator('#continueBox .th-continue')).toBeVisible();
  await page.getByRole('button', { name: 'Return to the table' }).click();
  await expect(page.locator('#startModal')).toBeHidden();
  await idle(page);
  await page.keyboard.press('n');
  await expect(page.locator('.nb-note', { hasText: 'Reload me' })).toBeVisible();
});

test("a player's screen never has the notebook", async ({ browser }) => {
  // a long test on a slow sandbox: the suite's 60 s budget is not enough for all its steps
  test.setTimeout(180_000);
  // Phone width: the drawer and the button must behave there too.
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = await preparePage(page);
  await startDM(page);
  await page.keyboard.press('n');
  await page.locator('#nbText').fill('The miller is lying about the harvest');
  await page.keyboard.press('Enter');
  await expect(page.locator('.nb-note', { hasText: 'The miller is lying' })).toBeVisible();
  await page.locator('[data-nb="close"]').click();
  // Becoming a player is what joining a table does: the role flips, and renderAll() marks the body.
  // A live join stalls on this sandbox's PeerJS path (proven on the untouched base in October), so the
  // flip is done directly; the redacted-save unit test proves the notes themselves never arrive.
  await page.evaluate(() => { window.DreadDelve.ui.role = 'player'; document.body.classList.add('player'); });
  await expect(page.locator('#btnNotebook')).toBeHidden();
  await page.keyboard.press('n');
  await expect(page.locator('#nbDrawer.open')).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.close();
});
