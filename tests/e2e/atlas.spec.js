/* The overworld atlas: the Valley of Barovia in 3D, beside the Valley tab's SVG map.
   Graph state, not pixels. The harness serves only the baked page, so the GLBs are
   read from the repo and injected through window.DreadDelve.atlas.injectAtlas — the
   same pattern as the forge-anim spec's clip injection. A separate test proves the
   fallback (no injection → the models never arrive → the "didn't load" note). */
import { test, expect } from './helpers.js';
import { readFileSync } from 'node:fs';
import { startDM } from './helpers.js';

const IDS = ['mists', 'gates', 'village', 'crossroads', 'castle', 'coffin', 'tser', 'bonegrinder', 'vallaki', 'lake', 'argyn', 'berez', 'winery', 'krezk', 'yester', 'tower'];
// Base64: binary ArrayBuffers do not survive the harness's argument serialisation
// (GLTFLoader then rejects them), text does.
const atlasFiles = () => ({
  relief: readFileSync(new URL('../../public/assets/overworld/barovia-relief.glb', import.meta.url)).toString('base64'),
  landmarks: Object.fromEntries(IDS.map(id => [id, readFileSync(new URL(`../../public/assets/overworld/landmarks/${id}.glb`, import.meta.url)).toString('base64')])),
});
// The Valley tab, then the 🗺 3D toggle, then the injected models. → the atlas state.
async function openAtlas(page){
  await startDM(page);
  await page.locator('#tabs button[data-act="tab"][data-k="valley"]').click();
  await expect(page.locator('.valley-map')).toBeVisible();
  await page.getByRole('button', { name:'🗺 3D' }).click();
  await expect(page.locator('#atlasBox canvas')).toBeVisible();
  const files = atlasFiles();
  await page.evaluate(async ({ relief, landmarks }) => {
    await window.DreadDelve.atlas.injectAtlas({ relief, landmarks });
  }, files);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.atlas.atlasState().ready)).toBe(true);
  return page.evaluate(() => window.DreadDelve.atlas.atlasState());
}

test('the 3D toggle swaps the map for the valley in 3D, and back', async ({ page }) => {
  await startDM(page);
  await page.locator('#tabs button[data-act="tab"][data-k="valley"]').click();
  await expect(page.locator('.valley-map')).toBeVisible();
  await expect(page.locator('#atlasBox')).toHaveCount(0);
  await page.getByRole('button', { name:'🗺 3D' }).click();
  await expect(page.locator('#atlasBox canvas')).toBeVisible();
  await expect(page.locator('.valley-map')).toHaveCount(0);
  await page.getByRole('button', { name:'🗺 3D' }).click();
  await expect(page.locator('.valley-map')).toBeVisible();
  await expect(page.locator('#atlasBox')).toHaveCount(0);
});

test('the relief loads and the board is the right size', async ({ page }) => {
  const st = await openAtlas(page);
  expect(st.ready).toBe(true);
  expect(st.relief).toBe(true);
  expect(st.bounds.min[0]).toBeCloseTo(0, 0);
  expect(st.bounds.max[0]).toBeCloseTo(100, 0);
  expect(st.bounds.min[2]).toBeCloseTo(0, 0);
  expect(st.bounds.max[2]).toBeCloseTo(64, 0);
});

test('the landmarks sit on the relief', async ({ page }) => {
  const st = await openAtlas(page);
  expect(st.places.filter(p => p.visible).length).toBe(16);
  const castle = st.places.find(p => p.id === 'castle');
  expect(castle.y).toBeGreaterThan(0); // it stands on its rock above the valley floor
  // One round-trip: the raycasts are cheap in the page, the CDP round-trips are not.
  const diffs = await page.evaluate(places => places.map(p => Math.abs(p.y - window.DreadDelve.atlas.atlasGroundY(p.x, p.z))), st.places);
  for (const d of diffs) expect(d).toBeLessThan(0.01);
});

test('the DM sees all 16 places and all 15 roads', async ({ page }) => {
  const st = await openAtlas(page);
  expect(st.places.length).toBe(16);
  expect(st.roads.length).toBe(15);
  for (const r of st.roads) expect(r.points).toBe(25);
  // Each road's ends are two places on the map.
  const byId = Object.fromEntries(st.places.map(p => [p.id, p]));
  expect(byId.castle).toBeTruthy();
  expect(byId.vallaki).toBeTruthy();
});

test('the road ribbons lie on the ground', async ({ page }) => {
  const st = await openAtlas(page);
  const road = st.roads.find(r => r.id === 'r-vallaki');
  expect(road).toBeTruthy();
  // One round-trip: the raycasts are cheap in the page, the CDP round-trips are not.
  const lifts = await page.evaluate(pts => pts.filter((_, i) => i % 6 === 0)
    .map(p => p.y - window.DreadDelve.atlas.atlasGroundY(p.x, p.z)), road.pts);
  for (const lift of lifts){
    expect(lift).toBeGreaterThanOrEqual(0.04);
    expect(lift).toBeLessThanOrEqual(0.10);
  }
});

test('clicking a landmark selects the place, like the SVG does', async ({ page }) => {
  test.setTimeout(120000); // openAtlas is ~50s, and the click + re-render + card check need the rest
  const st = await openAtlas(page);
  const v = st.places.find(p => p.id === 'vallaki');
  const pt = await page.evaluate(([x, y, z]) => window.DreadDelve.atlas.atlasScreen(x, y, z), [v.x, v.y + 0.6, v.z]);
  await page.mouse.click(pt.x, pt.y);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.ui.valleySel)).toBe('vallaki');
  await expect(page.locator('#tabBody .card.sel .nm')).toContainText('Vallaki');
});

test('the 3D view survives a panel re-render, camera unmoved', async ({ page }) => {
  test.setTimeout(120000); // openAtlas is ~50s, and the click + re-render + camera read need the rest
  const st = await openAtlas(page);
  const before = st.camera;
  const v = st.places.find(p => p.id === 'vallaki');
  const pt = await page.evaluate(([x, y, z]) => window.DreadDelve.atlas.atlasScreen(x, y, z), [v.x, v.y + 0.6, v.z]);
  await page.mouse.click(pt.x, pt.y); // selects the place → renderPanel() → the canvas is re-hung
  await expect.poll(() => page.evaluate(() => window.DreadDelve.ui.valleySel)).toBe('vallaki');
  await expect(page.locator('#atlasBox canvas')).toBeVisible();
  const after = await page.evaluate(() => window.DreadDelve.atlas.atlasState().camera);
  expect(after.pos.map(n => +n.toFixed(2))).toEqual(before.pos.map(n => +n.toFixed(2)));
  expect(after.target.map(n => +n.toFixed(2))).toEqual(before.target.map(n => +n.toFixed(2)));
});

test('no injection, no 3D: the models never arrive and the map is offered back', async ({ page }) => {
  test.setTimeout(120000); // startDM is ~50s and the fail note needs its 8s timer on top
  await startDM(page);
  await page.locator('#tabs button[data-act="tab"][data-k="valley"]').click();
  await page.locator('[data-act="valleyAtlas"]').click();
  await expect(page.locator('#atlasBox canvas')).toBeVisible();
  await expect(page.locator('#atlasBox')).toContainText("didn't load", { timeout: 12000 });
  await page.locator('#atlasBox [data-act="valleyAtlas"]').click();
  await expect(page.locator('.valley-map')).toBeVisible();
});
