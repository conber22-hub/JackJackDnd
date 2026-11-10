/* QUATERNIUS CLIPS — the forged figures move from the extracted library (public/assets/anim/quaternius.json)
   instead of the hand-keyed poses in forge/anim.js. The e2e harness serves only the baked page, so assets/anim/
   404s there: the spec injects the JSON (read from the repo) through the debug handle, and a separate test
   proves the fallback — no clips, the hand-keyed poses still play. Graph state is checked, not pixels.
   A swing is over in under a second and a round trip can take longer on a busy software renderer, so the clip
   is recorded the moment it starts (as the forge spec does for rig.action), and a frozen mid-swing pose is
   read in the same evaluate that starts the swing. */
import { test, expect, arena, idle } from './helpers.js';
import { readFileSync } from 'node:fs';

const CLIPS = JSON.parse(readFileSync(new URL('../../public/assets/anim/quaternius.json', import.meta.url), 'utf8'));
const inject = page => page.evaluate(data => window.DreadDelve.clips.injectClips(data), CLIPS);
// Record the clip the moment playClip sets it (rig.clip is assigned, then cleared when the action ends).
const recordClip = page => page.evaluate(() => { const r = window.DreadDelve.forgeStudio.studio().figs[0].userData.fig.userData.rig; let v = r.clip; window.__clip = null;
  Object.defineProperty(r, 'clip', { configurable: true, get: () => v, set: x => { if (x) window.__clip = { kind: x.kind, names: x.names, dur: x.dur }; v = x; } }); });
// Start a swing and freeze it mid-swing in one evaluate, then read the sword arm's quaternion.
const frozenPose = (page, unclip) => page.evaluate(u => { const D = window.DreadDelve, r = D.forgeStudio.studio().figs[0].userData.fig.userData.rig;
  if (u){ D.clips.injectClips(null); r.clip = null; }
  D.forgeStudio.act(0, 'attack'); D.forgeStudio.frame({ phase: .5 });
  const q = r.aR.u.quaternion; return [q.x, q.y, q.z, q.w].map(v => +v.toFixed(3)); }, unclip);

test('a sword swing plays the Quaternius clip, and the clip — not the hand-keyed keyframes — moves the arm', async ({ page }) => {
  await page.locator('[data-act="thRole"][data-k="player"]').click();
  await page.locator('[data-act="newHero"]').click();
  await page.locator('#charBox [data-cf="name"]').fill('Ilse');
  // the name field re-renders the panel on blur; blur now, so a later button click is not lost to that rebuild
  await page.locator('#charBox [data-cf="name"]').blur();
  await page.locator('#charBox select[data-mini="main"]').selectOption('sword');
  await expect(page.locator('#crMini canvas')).toBeVisible();
  await inject(page);
  expect(await page.evaluate(() => window.DreadDelve.clips.clipsReady())).toBe(true);
  await recordClip(page);
  await page.locator('#charBox [data-cr="mini:attack"]').click();
  await expect.poll(() => page.evaluate(() => window.__clip)).toEqual({ kind: 'slash', names: ['Sword_Attack'], dur: 0.9 });
  const clipPose = await frozenPose(page, false);
  const keyedPose = await frozenPose(page, true);
  const dist = Math.hypot(...clipPose.map((v, i) => v - keyedPose[i]));
  expect(dist).toBeGreaterThan(.3);
});

test('a cast plays the two-part spell sequence, enter then shoot', async ({ page }) => {
  await page.locator('[data-act="thRole"][data-k="player"]').click();
  await page.locator('[data-act="newHero"]').click();
  await page.locator('#charBox [data-cf="name"]').fill('Ilse');
  // the name field re-renders the panel on blur; blur now, so a later button click is not lost to that rebuild
  await page.locator('#charBox [data-cf="name"]').blur();
  await expect(page.locator('#crMini canvas')).toBeVisible();
  await inject(page);
  await recordClip(page);
  await page.locator('#charBox [data-cr="mini:cast"]').click();
  await expect.poll(() => page.evaluate(() => window.__clip)).toEqual({ kind: 'cast', names: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], dur: 1.033 });
});

test('the walk clip drives a walking figure in the creator preview', async ({ page }) => {
  await page.locator('[data-act="thRole"][data-k="player"]').click();
  await page.locator('[data-act="newHero"]').click();
  await page.locator('#charBox [data-cf="name"]').fill('Ilse');
  // the name field re-renders the panel on blur; blur now, so a later button click is not lost to that rebuild
  await page.locator('#charBox [data-cf="name"]').blur();
  await expect(page.locator('#crMini canvas')).toBeVisible();
  await inject(page);
  await page.locator('#charBox [data-cr="mini:walk"]').click();
  // let the walk blend rise, then watch the thigh over a stride (many frames, not two instants: the preview's own
  // frames run in between, and on a busy machine two readings can land at the same point of the stride)
  await page.evaluate(() => { const D = window.DreadDelve; for (let i = 0; i < 5; i++) D.forgeStudio.frame({ moving: true, t: 1 + i * .05 }); });
  const stride = await page.evaluate(() => { const D = window.DreadDelve, r = D.forgeStudio.studio().figs[0].userData.fig.userData.rig, th = [];
    for (let i = 0; i < 30; i++){ D.forgeStudio.frame({ moving: true, t: 1.25 + i * .04 }); th.push(r.lL.t.rotation.x); }
    return { walk: !!r.clipWalk, swing: Math.max(...th) - Math.min(...th) }; });
  expect(stride.walk).toBe(true);
  expect(stride.swing).toBeGreaterThan(.1);
});

test('without clips the hand-keyed poses still play (the offline fallback)', async ({ page }) => {
  await page.locator('[data-act="thRole"][data-k="player"]').click();
  await page.locator('[data-act="newHero"]').click();
  await page.locator('#charBox [data-cf="name"]').fill('Ilse');
  // the name field re-renders the panel on blur; blur now, so a later button click is not lost to that rebuild
  await page.locator('#charBox [data-cf="name"]').blur();
  await expect(page.locator('#crMini canvas')).toBeVisible();
  expect(await page.evaluate(() => window.DreadDelve.clips.clipsReady())).toBe(false);
  // a swing is over in under a second: record the action the moment it starts, as the forge spec does
  await page.evaluate(() => { const r = window.DreadDelve.forgeStudio.studio().figs[0].userData.fig.userData.rig; let v = r.action; window.__action = null;
    Object.defineProperty(r, 'action', { configurable: true, get: () => v, set: x => { if (x) window.__action = { k: x.k }; v = x; } }); });
  await page.locator('#charBox [data-cr="mini:attack"]').click();
  await expect.poll(() => page.evaluate(() => window.__action)).toMatchObject({ k: expect.stringMatching(/slash|smash|thrust|shoot|claw/) });
  expect(await page.evaluate(() => window.DreadDelve.forgeStudio.studio().figs[0].userData.fig.userData.rig.clip ?? null)).toBe(null);
});

test('on the map, a real attack plays the clip on the attacker', async ({ page }) => {
  await arena(page, [{ name: 'Ada', x: 6, y: 10 }]);
  // the arena hero's weapon is drawn at random; a sword makes the swing a clip (slash), not a hand-keyed fallback
  await page.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(t => t.name === 'Ada'); t.look = { main: 'sword' }; });
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor: 0, x: 7, y: 10 }); });
  await idle(page);
  await inject(page);
  const clip = await page.evaluate(() => { const D = window.DreadDelve, s = D.get(); const a = s.tokens.find(t => t.name === 'Ada'), z = s.tokens.find(t => t.bid === 'zombie'); z.hp = z.maxHp = 500; D.doAttack(a.id, z.id, 0);
    const r = D.tokenViews.get(a.id).group.userData.fig.userData.rig; return r.clip ? { kind: r.clip.kind, names: r.clip.names } : null; });
  expect(clip).not.toBe(null);
  expect(clip.kind).toMatch(/slash|thrust|claw/);
});
