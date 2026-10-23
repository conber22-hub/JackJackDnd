import { test, expect, arena } from './helpers.js';

// The creator past level 10 (Codex's classes to level 20 and the full SRD feats, with the creator's side done here).
async function openNew(page){
  await arena(page);
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('[data-act="dmNewChar"]').first().click();
  await expect(page.locator('#charModal')).toBeVisible();
  return page.locator('#charBox');
}

test('a level 20 Wizard chooses 9th-level spells, an Epic Boon at 19, and can read every feature', async ({ page }) => {
  const box = await openNew(page);
  await box.locator('select[data-cf="cls"]').selectOption('Wizard');
  await box.locator('select[data-cf="lvl"]').selectOption('20');
  await expect(box.locator('h4', { hasText:'Level 9' })).toBeVisible();
  await box.locator('input[data-spell="Wish"]').check();
  await expect(box.locator('.sheet')).toContainText('Wish');
  await expect(box.locator('.sheet')).toContainText('L9×1');
  // the level 19 pick offers the Epic Boons (and level 4 doesn't)
  const l19 = box.locator('select[data-asi="19"][data-k="feat"]'), l4 = box.locator('select[data-asi="4"][data-k="feat"]');
  await expect(l19.locator('optgroup[label="Epic Boon"] option')).toHaveCount(7);
  await expect(l4.locator('optgroup[label="Epic Boon"]')).toHaveCount(0);
  await l19.selectOption('Boon of Spell Recall');
  await expect(box.locator('.cr-asi', { hasText:'Level 19' })).toContainText('Epic Boon feat');
  // the sheet's reader: the SRD's own words for the class's features
  await box.locator('.sheet details summary').click();
  await expect(box.locator('.sheet details')).toContainText('Arcane Recovery');
  await expect(box.locator('.sheet details')).toContainText('Spell Mastery');
});

test('a Warlock\'s Mystic Arcanum is its own choice, not a prepared spell; a Fighter reads its own Extra Attack', async ({ page }) => {
  const box = await openNew(page);
  await box.locator('select[data-cf="cls"]').selectOption('Warlock');
  await box.locator('select[data-cf="lvl"]').selectOption('13');
  await expect(box.locator('h4', { hasText:'Mystic Arcanum · level 7' })).toBeVisible();
  await expect(box.locator('h4', { hasText:'Mystic Arcanum · level 8' })).toHaveCount(0);
  await expect(box).toContainText('Choose one level 6 Warlock spell for Mystic Arcanum');
  await box.locator('select[data-cf="cls"]').selectOption('Fighter');
  await box.locator('select[data-cf="lvl"]').selectOption('5');
  await box.locator('.sheet details summary').click();
  const extra = box.locator('.feat-read', { hasText:'Extra Attack' });
  await expect(extra).toContainText('twice');
  await expect(extra).not.toContainText('Barbarian, level 5');
});
