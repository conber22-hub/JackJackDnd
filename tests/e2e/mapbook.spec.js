// The 🗺️ Map Book (brief-7). The book opens on the floor the party is on and
// draws a non-empty hand-drawn map; a shaped room's wall comes out as a
// diagonal stroke (proved through the exported wallSegments helper); a pin
// can be added, survives a reload, and can be removed; and "Save as picture"
// produces a PNG. Pins are private to the device — nothing about them is
// sent anywhere, so no table is needed to prove them.
import { test, expect, startDM, arena } from './helpers.js';
import fs from 'node:fs';

async function openBook(page){
  await page.locator('#btnMapbook').click();
  await expect(page.locator('#mapbookSheet:not(.hidden)')).toBeVisible();
  await expect(page.locator('#mapCanvas')).toBeVisible();
}

async function reloadAndContinue(page){
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  const door = page.locator('[data-act="thRole"][data-k="dm"]');
  if (await door.isVisible()) await door.click();
  await page.locator('#continueBox [data-act="continue"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
}

// Dark sepia pixels on the canvas: the ink of the walls, doors and stairs.
const inkPixels = page => page.evaluate(() => {
  const cv = document.querySelector('#mapCanvas');
  const { data } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  let n = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] < 120 && data[i + 1] < 105 && data[i + 2] < 95) n++;
  return n;
});

// The centre of a square, in page pixels, from the book's own fit transform.
async function squarePoint(page, x, y){
  const box = await page.locator('#mapCanvas').boundingBox();
  const v = await page.evaluate(() => window.DreadDelveMapbook.view());
  return { x:box.x + v.ox + (x + .5) * v.cell, y:box.y + v.oy + (y + .5) * v.cell };
}

test('the book opens on the party’s floor and draws a non-empty map', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBook(page);
  await expect(page.locator('#mapTitle')).toContainText('Training hall');
  await expect(page.locator('#mapPage')).toContainText('Page 1 of 1');
  await expect.poll(() => inkPixels(page)).toBeGreaterThan(100);
});

test('a shaped room draws a diagonal stroke', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await expect.poll(() => page.evaluate(() => !!window.DreadDelveMapbook)).toBe(true);
  const check = await page.evaluate(() => {
    // A 7×7 eight-sided room at (1,1) on a 10×10 floor: the octagon rule
    // (engine/shapes.js) cuts the corners off, so its corner rock squares
    // have room floor on two sides that meet.
    const W = 10, H = 10, grid = new Array(W * H).fill(0);
    for (let y = 1; y < 8; y++) for (let x = 1; x < 8; x++){
      const u = x - 1, v = y - 1;
      if (Math.min(u, 6 - u) + Math.min(v, 6 - v) >= 2) grid[y * W + x] = 1;
    }
    const floor = { W, H, grid, rooms:[{ id:0, x:1, y:1, w:7, h:7, cx:4, cy:4, shape:'octagon' }] };
    const explored = new Set(grid.map((v, i) => v ? i : -1).filter(i => i >= 0));
    const segs = window.DreadDelveMapbook.wallSegments(floor, explored);
    return {
      total:segs.length,
      diag:segs.filter(s => s.x1 !== s.x2 && s.y1 !== s.y2).length,
      axis:segs.filter(s => s.x1 === s.x2 || s.y1 === s.y2).length,
    };
  });
  expect(check.total).toBeGreaterThan(0);
  expect(check.diag).toBeGreaterThan(0);   // the slanted corners, not steps
  expect(check.axis).toBeGreaterThan(0);   // the straight walls are still there
});

test('a pin can be added, survives a reload, and can be removed', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBook(page);
  const p = await squarePoint(page, 6, 10);   // Ada's square, explored
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('#mapPinEdit:not([hidden])')).toBeVisible();
  await page.locator('#mbNote').fill('lever here?');
  await page.locator('[data-act="mbPinSave"]').click();
  await expect(page.locator('#mapPinList')).toContainText('lever here?');
  // A reload doesn't lose it: Continue restores the delve, and the pin
  // lives in this device's localStorage under the map's name and floor.
  await reloadAndContinue(page);
  await openBook(page);
  await expect(page.locator('#mapPinList')).toContainText('lever here?');
  await page.locator('#mapPinList [data-pin]').click();
  await expect(page.locator('#mbNote')).toHaveValue('lever here?');
  await page.locator('[data-act="mbPinRemove"]').click();
  await expect(page.locator('#mapPinList')).not.toContainText('lever here?');
});

test('“Save as picture” produces a PNG data URL and a PNG download', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBook(page);
  const url = await page.evaluate(() => window.DreadDelveMapbook.exportPNG());
  expect(url.startsWith('data:image/png')).toBe(true);
  expect(url.length).toBeGreaterThan(4000);   // a real page, not a blank sheet
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-act="mbSave"]').click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/\.png$/);
  const buf = fs.readFileSync(await dl.path());
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));   // the PNG signature
  expect(buf.length).toBeGreaterThan(4096);
});

test('floors are pages, turned with ‹ ›', async ({ page }) => {
  test.setTimeout(240_000);
  await startDM(page, 'blank', '2');
  await openBook(page);
  await expect(page.locator('#mapPage')).toContainText('Page 1 of 2');
  await page.locator('[data-act="mbNext"]').click();
  await expect(page.locator('#mapPage')).toContainText('Page 2 of 2');
  await page.locator('[data-act="mbPrev"]').click();
  await expect(page.locator('#mapPage')).toContainText('Page 1 of 2');
});
