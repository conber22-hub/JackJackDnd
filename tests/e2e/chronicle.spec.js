// The 📜 Chronicle (brief-8). On a player's device, a table card, letter
// and handout become entries that survive a reload; a "Your turn" banner
// and a repeated card don't; search and the Letters filter narrow the list;
// "Previously…" shows the last night's day and its letter; "Save as text"
// downloads a .txt with an entry's title; and on the DM's side a sent
// whisper to one hero shows "to Ada". The events are driven with
// page.evaluate and the bus, through the module's own debug handle — the
// table's message path and the outbox don't emit 'table'/'sent' yet (see
// the PR), so the spec emits them the way the table will.
import { test, expect, arena } from './helpers.js';
import fs from 'node:fs';

const CARD = { t:'card', c:{ title:'The Old Mill', sub:'A ruin on the hill', lines:['<p>The mill wheel turns, though no water runs.</p>'], kind:'read' } };
const LETTER = { t:'letter', letter:{ title:'A letter from the Count', from:'Count Strahd', body:'You are cordially invited to dinner at the castle.', sig:'Strahd', seal:'crest', to:null } };
const WHISPER = { t:'whisper', text:'Something stirs in the dark.' };

async function openChronicle(page){
  await expect.poll(() => page.evaluate(() => !!window.DreadDelveChronicle)).toBe(true);
  await page.locator('#btnChronicle').click();
  await expect(page.locator('#chronicleSheet:not(.hidden)')).toBeVisible();
}

async function reloadAndContinue(page){
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  const door = page.locator('[data-act="thRole"][data-k="dm"]');
  if (await door.isVisible()) await door.click();
  await page.locator('#continueBox [data-act="continue"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
}

// Flip this DM page into a player's: the Chronicle records 'table' events
// only while the role is player (the ghost spec's pattern).
async function flipToPlayer(page, name = 'Ada'){
  await page.evaluate(name => {
    const D = window.DreadDelve, hero = D.get().tokens.find(t => t.name === name);
    if (!hero) throw new Error(`Missing hero: ${name}`);
    D.ui.myToken = hero.id; D.ui.role = 'player';
    document.body.classList.add('player');
    document.querySelector('[data-act="tab"]')?.click();
  }, name);
}

const emitTable = (page, msg) => page.evaluate(m => window.DreadDelveChronicle.bus.emit('table', m), msg);
const emitSent = (page, msg, to) => page.evaluate(({ msg, to }) => window.DreadDelveChronicle.bus.emit('sent', { msg, to, at:Date.now() }), { msg, to });

async function handoutMsg(page){
  const img = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 100; cv.height = 100;
    const x = cv.getContext('2d'); x.fillStyle = '#7a2a1a'; x.fillRect(0, 0, 100, 100);
    return cv.toDataURL('image/png');
  });
  return { t:'handout', title:'The Svalich Road', caption:'The road north', img };
}

test('on a player’s device, a table card, letter and handout become entries that survive a reload', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await flipToPlayer(page);
  await emitTable(page, CARD);
  await emitTable(page, LETTER);
  await emitTable(page, await handoutMsg(page));
  await openChronicle(page);
  await expect(page.locator('#chNights')).toContainText('The Old Mill');
  await expect(page.locator('#chNights')).toContainText('A letter from the Count');
  await expect(page.locator('#chNights')).toContainText('The Svalich Road');
  await expect(page.locator('#chNights .ch-thumb')).toBeVisible();
  await reloadAndContinue(page);
  await openChronicle(page);
  await expect(page.locator('#chNights')).toContainText('The Old Mill');
  await expect(page.locator('#chNights')).toContainText('A letter from the Count');
  await expect(page.locator('#chNights')).toContainText('The Svalich Road');
});

test('a “Your turn” banner and a repeated card don’t become entries', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await flipToPlayer(page);
  await emitTable(page, { t:'banner', text:'Your turn' });
  await emitTable(page, CARD);
  await emitTable(page, CARD);
  await openChronicle(page);
  await expect(page.locator('[data-ch-entry]')).toHaveCount(1);
  await expect(page.locator('#chNights')).toContainText('The Old Mill');
  await expect(page.locator('#chNights')).not.toContainText('Your turn');
});

test('search and the Letters filter narrow the list', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await flipToPlayer(page);
  await emitTable(page, CARD);
  await emitTable(page, LETTER);
  await emitTable(page, WHISPER);
  await openChronicle(page);
  await expect(page.locator('[data-ch-entry]')).toHaveCount(3);
  await page.locator('#chSearch').fill('Count');
  await expect(page.locator('[data-ch-entry]')).toHaveCount(1);
  await expect(page.locator('#chNights')).toContainText('A letter from the Count');
  await page.locator('#chSearch').fill('');
  await page.locator('[data-ch-filter="letter"]').click();
  await expect(page.locator('[data-ch-entry]')).toHaveCount(1);
  await expect(page.locator('#chNights')).toContainText('A letter from the Count');
  await page.locator('[data-ch-filter="all"]').click();
  await expect(page.locator('[data-ch-entry]')).toHaveCount(3);
});

test('“Previously…” shows the last night’s day and its letter', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await flipToPlayer(page);
  await emitTable(page, CARD);
  await emitTable(page, LETTER);
  await openChronicle(page);
  await page.locator('[data-act="chPreviously"]').click();
  await expect(page.locator('#chronicleRecap:not(.hidden)')).toBeVisible();
  await expect(page.locator('#chRecapBody')).toContainText('Day 1');
  await expect(page.locator('#chRecapBody')).toContainText('A letter from the Count');
});

test('“Save as text” downloads a .txt containing an entry’s title', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await flipToPlayer(page);
  await emitTable(page, CARD);
  await openChronicle(page);
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-act="chSaveText"]').click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/\.txt$/);
  const text = fs.readFileSync(await dl.path(), 'utf8');
  expect(text).toContain('The Old Mill');
  expect(text).toContain('Day 1');
});

test('on the DM’s side, a sent whisper to one hero shows “to Ada”', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  const adaId = await page.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').id);
  await expect.poll(() => page.evaluate(() => !!window.DreadDelveChronicle)).toBe(true);
  await emitSent(page, WHISPER, adaId);
  await openChronicle(page);
  await expect(page.locator('#chNights')).toContainText('Something stirs in the dark.');
  await expect(page.locator('#chNights')).toContainText('to Ada');
});
