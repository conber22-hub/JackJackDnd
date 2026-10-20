import { test as base, expect } from '@playwright/test';

export { expect };
export const test = base.extend({
  page:async ({ page }, use) => {
    const errors = await preparePage(page);
    await use(page);
    expect(errors, 'Uncaught browser errors').toEqual([]);
  },
});

export async function preparePage(page){
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Fonts are cosmetic; keep functional tests independent of Google's CDN.
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('dreaddelve.gfx.v1', JSON.stringify({ quality:'low', music:false, sfx:false }));
    localStorage.setItem('dreaddelve.peerserver.v1', JSON.stringify({
      host:'127.0.0.1', port:9000, path:'/', key:'dreaddelve', secure:false,
    }));
  });
  await page.goto('/dread-delve.html');
  await page.waitForFunction(() => !!window.DreadDelve);
  return errors;
}

export const idle = page => page.waitForFunction(() => !window.DreadDelve.busy());

// Poll idle AND the destination together: delayed followers and a resumed OA walk can
// briefly report idle before their animation starts. Never accept that gap as completion.
export async function expectPositions(page, expected){
  await expect.poll(() => page.evaluate(names => {
    const D = window.DreadDelve;
    if (D.busy()) return null;
    return Object.fromEntries(names.map(name => {
      const t = D.get().tokens.find(t => t.name === name);
      return [name, t ? { x:t.x, y:t.y, floor:t.floor } : null];
    }));
  }, Object.keys(expected))).toEqual(Object.fromEntries(
    Object.entries(expected).map(([name, p]) => [name, { floor:0, ...p }]),
  ));
}

export async function startDM(page, template = 'blank', floors = '1'){
  await page.locator('[data-act="thRole"][data-k="dm"]').click();
  await page.locator(`[data-act="pickTpl"][data-k="${template}"]`).click();
  await page.getByText('Seed, floors and the demo party', { exact:true }).click();
  await page.locator('#newSeed').fill('e2e-dread-delve');
  if (floors !== null) await page.locator('#newFloors').selectOption(floors);
  await page.getByRole('button', { name:'Descend as DM', exact:true }).click();
  await expect(page.locator('#startModal')).toBeHidden();
  await idle(page);
}

export async function arena(page, heroes = [{ name:'Ada', x:6, y:10 }]){
  await page.evaluate(heroes => {
    const D = window.DreadDelve;
    D.ui.roomPrompts = false;
    D.newDelve({ name:'E2E arena', seed:'e2e-arena', floors:1, size:32, template:'blank', party:false }, false);
    const grid = Array.from({ length:32 }, (_, y) =>
      Array.from({ length:32 }, (_, x) => x >= 3 && x <= 18 && y >= 8 && y <= 14 ? 1 : 0));
    if (!D.importMap(JSON.stringify({
      name:'Training hall', grid, tokens:heroes.map(t => ({ kind:'pc', ...t })),
    }))) throw new Error('Could not import the E2E arena');
  }, heroes);
  await expectPositions(page, Object.fromEntries(heroes.map(({ name, x, y }) => [name, { x, y }])));
}

export async function selectHero(page, name = 'Ada'){
  return page.evaluate(name => {
    const D = window.DreadDelve, t = D.get().tokens.find(t => t.name === name);
    if (!t) throw new Error(`Missing hero: ${name}`);
    D.select(t.id);
    return t.id;
  }, name);
}

export async function frameMap(page, x = 9, y = 10){
  if (await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await settleCamera(page);
  await page.evaluate(() => window.DreadDelve.setView('top'));
  await page.waitForFunction(() => Math.abs(window.DreadDelve.camera.position.y - 30) < .01);
  await settleCamera(page);
  await page.evaluate(({ x, y }) => window.DreadDelve.focusTile(0, x, y), { x, y });
  await page.waitForFunction(({ x, y }) => {
    const D = window.DreadDelve, n = D.get().meta.size;
    return Math.abs(D.camera.position.y - 30) < .01 &&
      Math.hypot(D.controls.target.x - (x - n / 2 + .5), D.controls.target.z - (y - n / 2 + .5)) < .01;
  }, { x, y });
  await settleCamera(page);
}

// Camera tweens are independent of busy() (which covers minis). Wait for a stable
// projection before pointer input, including the camera focus when a turn starts.
async function settleCamera(page){
  let previous, stableSince = Date.now();
  await expect.poll(async () => {
    const current = await page.evaluate(() => {
      const D = window.DreadDelve;
      return [...D.camera.position.toArray(), ...D.controls.target.toArray(), ...D.camera.quaternion.toArray()];
    });
    if (!previous || current.some((v, i) => Math.abs(v - previous[i]) > .0001)) stableSince = Date.now();
    previous = current;
    return Date.now() - stableSince >= 250;
  }, { intervals:[100] }).toBe(true);
}

// Project tile centres through the actual camera instead of hard-coding canvas pixels.
export function tilePoint(page, x, y){
  return page.evaluate(({ x, y }) => {
    const D = window.DreadDelve, n = D.get().meta.size;
    const p = D.camera.position.clone().set(x - n / 2 + .5, 0, y - n / 2 + .5).project(D.camera);
    return { x:(p.x + 1) * innerWidth / 2, y:(1 - p.y) * innerHeight / 2 };
  }, { x, y });
}

export async function clickTile(page, x, y){
  await settleCamera(page);
  const p = await tilePoint(page, x, y);
  await page.mouse.click(p.x, p.y);
}
