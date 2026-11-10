/* THE DEATH CLIP — a forged figure that falls plays Death01 from the Quaternius library
   (public/assets/anim/quaternius.json) instead of just tipping over. The e2e harness serves
   only the baked page, so assets/anim/ 404s there: the spec injects the JSON (read from the
   repo) through the debug handle, and a separate test proves the fallback — no clips, the
   hand-keyed fallen pose and the quick topple still play. Graph state is checked, not pixels.
   Death is a state change: kill() sets t.dead, and syncTokens (exposed on the debug handle
   for this spec) rebuilds the figure and runs the transition synchronously, so the clip is
   read in the same evaluate that starts it — a swing is over in under a second and a round
   trip can take longer on a busy software renderer. */
import { test, expect, arena, idle } from './helpers.js';
import { readFileSync } from 'node:fs';

const CLIPS = JSON.parse(readFileSync(new URL('../../public/assets/anim/quaternius.json', import.meta.url), 'utf8'));
const inject = page => page.evaluate(data => window.DreadDelve.clips.injectClips(data), CLIPS);
const TIP = -Math.PI / 2 * .92;   // the tipped-over rotation minis.js lays a dead figure down at
// Kill the zombie and run the rebuild synchronously, then read the clip off the new rig.
const killZombie = page => page.evaluate(() => { const D = window.DreadDelve, z = D.get().tokens.find(t => t.bid === 'zombie');
  D.kill(z); D.syncTokens();
  const f = D.tokenViews.get(z.id).group.userData.fig, r = f.userData.rig;
  return { clip: r?.clip ? { kind: r.clip.kind, names: r.clip.names, dur: r.clip.dur } : null, rotX: f.rotation.x }; });
const zombieFig = page => page.evaluate(() => { const D = window.DreadDelve, z = D.get().tokens.find(t => t.bid === 'zombie');
  const f = D.tokenViews.get(z.id).group.userData.fig, q = f.userData.rig.hips.quaternion;
  // the hips' total rotation from rest, in radians: Death01 ends the body folded (hips ~94°), while the
  // hand-keyed fallen pose leaves the hips at rest (0) — so this separates the clip from the fallback.
  return { rotX: f.rotation.x, hipsAngle: 2 * Math.acos(Math.min(1, Math.abs(q.w))) }; });

test('Death01 is in the library and registered as the death clip; smash and shoot have none', async ({ page }) => {
  await arena(page, [{ name: 'Ada', x: 6, y: 10 }]);
  await inject(page);
  expect(await page.evaluate(() => window.DreadDelve.clips.clipsReady())).toBe(true);
  expect(await page.evaluate(() => window.DreadDelve.clips.clipNames())).toContain('Death01');
  expect(await page.evaluate(() => window.DreadDelve.clips.hasClip('death'))).toBe(true);
  expect(await page.evaluate(() => window.DreadDelve.clips.clipDuration('death'))).toBe(1.8);
  // No overhead two-handed swing and no bow draw in the Standard tier: they stay hand-keyed.
  expect(await page.evaluate(() => window.DreadDelve.clips.hasClip('smash'))).toBe(false);
  expect(await page.evaluate(() => window.DreadDelve.clips.hasClip('shoot'))).toBe(false);
  expect(await page.evaluate(() => window.DreadDelve.clips.clipDuration('smash'))).toBe(null);
});

test('a forged figure that dies plays the death clip', async ({ page }) => {
  await arena(page, [{ name: 'Ada', x: 6, y: 10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor: 0, x: 7, y: 10 }); });
  await idle(page);
  await inject(page);
  const { clip } = await killZombie(page);
  expect(clip).toEqual({ kind: 'death', names: ['Death01'], dur: 1.8 });
});

test('the dead figure ends tipped over and collapsed, and stays there', async ({ page }) => {
  test.setTimeout(120000); // the kill, the 1.8 s clip and the 1.8 s tip-over, on a slow renderer
  await arena(page, [{ name: 'Ada', x: 6, y: 10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor: 0, x: 7, y: 10 }); });
  await idle(page);
  await inject(page);
  await killZombie(page);
  // the tip-over tween runs over the clip's length: wait until the figure is down
  await expect.poll(() => zombieFig(page)).toMatchObject({ rotX: expect.closeTo(TIP, .15) });
  // and the joints are collapsed, not standing: the hips are folded far from rest (Death01 ends ~94°)
  const { hipsAngle } = await zombieFig(page);
  expect(hipsAngle).toBeGreaterThan(1.0);
  // a moment later it has not stood back up: the death clip holds its final pose
  await page.waitForTimeout(1500);
  const later = await zombieFig(page);
  expect(Math.abs(later.hipsAngle - hipsAngle)).toBeLessThan(.05);
});

test('without clips the fallen pose and the quick topple still play (the offline fallback)', async ({ page }) => {
  test.setTimeout(120000);
  await arena(page, [{ name: 'Ada', x: 6, y: 10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor: 0, x: 7, y: 10 }); });
  await idle(page);
  expect(await page.evaluate(() => window.DreadDelve.clips.clipsReady())).toBe(false);
  const { clip } = await killZombie(page);
  expect(clip).toBe(null);
  // no clip was ever set on the rig, and the figure still tips over (the 0.5 s topple)
  await expect.poll(() => zombieFig(page)).toMatchObject({ rotX: expect.closeTo(TIP, .15) });
});
