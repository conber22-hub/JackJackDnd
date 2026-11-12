import { readFileSync } from 'node:fs';
import { test, expect } from './helpers.js';

// 🌲 The ground pass (engine/terrain-dress.js, render/floors.js): on an outdoor map the treeline is dressed with the
// Barovia terrain pack's pieces (here a graveyard's: old graves, sentry stones, an arch, a gallows), each standing on
// woods squares only, so nobody's way is blocked; on Low quality (phones) the map is left as it was.
test('the treeline by the graveyard is dressed with the terrain pack, off the open ground', async ({ page }) => {
  test.setTimeout(120_000);
  // (the test server serves the baked page alone: the pack's models come from public/, as the site serves them)
  await page.route(/\/assets\/terrain\/[\w/-]+\.glb$/, route => {
    const file = new URL(route.request().url()).pathname.split('/assets/terrain/')[1];
    try { route.fulfill({ status:200, contentType:'model/gltf-binary', body:readFileSync(new URL(`../../public/assets/terrain/${file}`, import.meta.url)) }); } catch { route.fulfill({ status:404 }); } });
  await page.evaluate(() => { const D = window.DreadDelve; D.setGfx({ quality:'medium' }); D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'The Salt Road', seed:'dress-e2e', floors:3, size:40, template:'saltroad', party:true }, false); D.goFloor(1); });
  const dressed = () => page.evaluate(() => { const D = window.DreadDelve, f = D.get().floors[1], out = [];
    D.floorViews[1].built.traverse(o => { if (!o.userData?.dress) return;
      for (let n = 0; n < o.count; n++){ const m = new o.matrix.constructor(); o.getMatrixAt(n, m); out.push({ id:o.userData.dress, x:m.elements[12], z:m.elements[14] }); } });
    return { pieces:out, W:f.W, H:f.H }; });
  await expect.poll(async () => (await dressed()).pieces.map(p => p.id).filter(id => /graves|sentry|arch|gallows/.test(id)).length, { timeout:60_000 }).toBeGreaterThan(0);
  // none stands where anyone walks: the square under each piece's middle is woods
  const walkable = await page.evaluate(() => { const D = window.DreadDelve, f = D.get().floors[1], bad = [];
    D.floorViews[1].built.traverse(o => { if (!o.userData?.dress) return;
      for (let n = 0; n < o.count; n++){ const m = new o.matrix.constructor(); o.getMatrixAt(n, m);
        const s = D.get().meta.size / 2 - .5, x = Math.round(m.elements[12] + s), y = Math.round(m.elements[14] + s), i = y * f.W + x;
        if (f.grid[i] !== 0 && !(f.water || []).includes(i)) bad.push([o.userData.dress, x, y, f.grid[i]]); } });
    return bad; });
  expect(walkable).toEqual([]);
  // Low quality: none of it
  await page.evaluate(() => { const D = window.DreadDelve; D.setGfx({ quality:'low' }); D.buildFloor(1); });
  expect((await dressed()).pieces).toEqual([]);
});
