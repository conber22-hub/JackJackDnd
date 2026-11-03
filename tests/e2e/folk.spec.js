import { test, expect, arena, frameMap } from './helpers.js';

// The valley's people (render/folk.js): drawn where the folk engine puts them; tap one to hear them.
// The DM alone learns that one is the Count's eye.
test('tapping one of the folk: what they say for the outbox, and a spy for the DM\'s eyes only', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  await page.evaluate(() => {
    const f = window.DreadDelve.get().floors[0];
    f.folk = [{ id:'v1', role:'elder', name:'Old Vasil', x:10, y:9, home:{ x:10, y:9 }, haunts:[], mood:'wary', spy:{ for:'n1' }, seen:[] },
              { id:'v2', role:'farmer', name:'Ilya', x:13, y:12, home:{ x:13, y:12 }, haunts:[], mood:'easy', spy:null, seen:[] }];
  });
  await frameMap(page, 10, 10);
  const pt = await page.evaluate(() => { const D = window.DreadDelve, n = D.get().meta.size, v = D.camera.position.clone(); v.set(10 - n / 2 + .5, .5, 9 - n / 2 + .5); v.project(D.camera); return { x:(v.x + 1) / 2 * innerWidth, y:(1 - v.y) / 2 * innerHeight }; });
  await page.mouse.click(pt.x, pt.y);
  const cards = page.locator('#cardLayer .pop');
  await expect(cards.filter({ hasText:'Old Vasil' }).first()).toContainText('The players haven\'t seen this');   // what he says waits in the outbox
  await expect(cards.filter({ hasText:'For your eyes' })).toContainText('One of the Count\'s eyes');
  // the eyes-only card never reaches the outbox
  expect(await page.evaluate(() => window.DreadDelve.outbox.some(o => /Count's eyes/.test(o.msg.c?.title || '')))).toBe(false);
});

// Codex's folk engine at the table: a village fills with its people, they go about their day, and a killing in the
// street reaches the Count's court through his eyes.
test('a village fills with folk who walk about; a killing seen by one of the Count\'s eyes reaches his court', async ({ page }) => {
  test.setTimeout(150_000);
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Folk', seed:'e2e-folk', floors:1, size:40, template:'barovia', party:true }, false);
    D.setDread(5);   // his Gaze high: one in five is his
  });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().floors[0].folk?.length || 0), { timeout:20_000 }).toBeGreaterThan(3);
  const first = await page.evaluate(() => window.DreadDelve.get().floors[0].folk.map(p => ({ role:p.role, x:p.x, y:p.y })));
  expect(first.every(p => ['farmer', 'smith', 'child', 'elder', 'watch', 'priest', 'beggar'].includes(p.role))).toBe(true);
  // they walk: in a few seconds someone has moved
  await expect.poll(() => page.evaluate(was => window.DreadDelve.get().floors[0].folk.some((p, i) => p.x !== was[i].x || p.y !== was[i].y), first), { timeout:20_000 }).toBe(true);
  // a hero kills something in front of one of the Count's eyes: his servant learns where they are and hunts them
  const told = await page.evaluate(() => {
    const D = window.DreadDelve, f = D.get().floors[0], hero = D.get().tokens.find(t => t.kind === 'pc' && t.floor === 0);
    const spy = f.folk[0]; spy.spy = { for:D.get().campaign.court?.members.find(m => m.alive)?.id || D.get().campaign.court.members[0].id };
    spy.x = hero.x + 2; spy.y = hero.y;   // right there, watching
    const m = D.placeMonster('zombie', { floor:0, x:hero.x + 1, y:hero.y });
    D.applyDamage(m, 999, 'fire', hero);
    const master = D.get().campaign.court.members.find(x => x.id === spy.spy.for);
    return { knows:master.knows || null, hunting:master.hunting, saw:spy.seen.map(s => s.kind) };
  });
  expect(told.saw).toContain('kill');
  expect(told.hunting).toBe(true);
  expect(told.knows?.heroes?.length).toBeGreaterThan(0);
  expect(told.knows?.tactic).toBe('fire');
  await expect(page.locator('#cardLayer .pop', { hasText:'The Count\'s eyes saw that' })).toBeVisible();
});
