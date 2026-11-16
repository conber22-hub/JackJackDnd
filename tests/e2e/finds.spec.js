import { test, expect } from './helpers.js';

// ✨ Finding things (game/finds.js, engine/finds-lite.js, render/glints.js): in the Village of Barovia a glint is picked
// up with Ⓐ (coins or a keepsake into the pack), a gravestone is read, and a wolf that sees the hero gets a "!" over its
// head a beat before the fight.
test('a glint picked up, a gravestone read, and a "!" before a fight', async ({ page }) => {
  test.setTimeout(240_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-finds'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-finds"]').click();
  await page.keyboard.press('Escape');
  const finds = await page.evaluate(() => window.DreadDelve.get().floors[0].finds);
  expect(finds.some(f => f.kind === 'glint')).toBe(true);
  expect(finds.some(f => f.kind === 'read' && f.on === 'gravestone')).toBe(true);
  // stand beside a glint the hero can see
  // (on a square with nothing else to do beside it: talk comes first, and a glint or a search before a thing to read)
  // (the village folk go about their day and can walk up to talk: they're sent indoors here, as this is about finds)
  const beside = (kind, on) => page.evaluate(([kind, on]) => { const D = window.DreadDelve, f = D.get().floors[0], h = D.wander.hero();
    for (const p of f.folk || []) p.gone = true;
    for (const fd of f.finds.filter(x => x.kind === kind && (!on || x.on === on) && !x.hidden && !x.done)){
      const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => ({ x:fd.x + dx, y:fd.y + dy }))
        .find(p => { const near = q => Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)) <= 1;
          return f.grid[p.y * f.W + p.x] > 0 && !f.props.some(q => q.x === p.x && q.y === p.y) && !D.get().tokens.some(t => t.floor === 0 && t.id !== h.id && near(t))
            && !(f.folk || []).some(p => !p.gone && near(p)) && (kind !== 'read' || !f.finds.some(x => !x.done && x.kind !== 'read' && near(x))) && !f.props.some(q => q.k === 'signpost' && near(q))
            && ![f.up, f.down].some(q => q && q.x === p.x && q.y === p.y) && !(f.events || []).some(near); });
      if (spot){ h.x = spot.x; h.y = spot.y; D.syncTokens(); return fd; }
    }
    throw new Error(`no square beside a ${kind}`); }, [kind, on]);
  await beside('glint');
  await expect(page.locator('#wdPrompt')).toContainText('glints');
  // (what it gave: coins, a keepsake — a second of one already carried only adds to the stack — or a page)
  const got = () => page.evaluate(() => { const w = window.DreadDelve.wander; return { gp:w.coinsGp(), n:w.pack().reduce((s, i) => s + i.qty, 0), pages:(w.W().pages || []).length }; });
  const before = await got();
  await page.keyboard.press('Space');
  await expect.poll(got).not.toEqual(before);
  await expect(page.locator('#wdPrompt')).not.toContainText('glints');
  await page.keyboard.press('Escape');
  // a gravestone: its line, on a card
  await beside('read', 'gravestone');
  await expect(page.locator('#wdPrompt')).toContainText('Read the gravestone');
  await page.keyboard.press('Space');
  await expect(page.locator('#cardLayer')).toContainText('A gravestone');
  await page.keyboard.press('Escape');
  // a wolf in sight: a "!" over it, then the fight
  // (the hero takes one step first, and the wolf stands on open ground in a clear line from where that step ends: the
  // village is laid out afresh each game, and a house can stand between; the page watches for the bubble itself, as it
  // lasts about a second and a slow frame can hide it from a poll from here)
  const wolf = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), f = D.get().floors[0];
    const clear = (x, y) => f.grid[y * f.W + x] > 0 && !f.props.some(q => q.x === x && q.y === y) && !D.get().tokens.some(t => t.floor === 0 && t.x === x && t.y === y);
    const line = (a, b) => { const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)); for (let k = 1; k <= n; k++) if (!clear(Math.round(a.x + (b.x - a.x) * k / n), Math.round(a.y + (b.y - a.y) * k / n))) return false; return true; };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const p = { x:h.x + dx, y:h.y + dy }; if (!clear(p.x, p.y)) continue;
      const spot = [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3], [3, -3], [-3, 3], [3, 0], [-3, 0], [0, 3], [0, -3]].map(([ox, oy]) => ({ x:p.x + ox, y:p.y + oy }))
        .find(q => !(q.x === h.x && q.y === h.y) && line(p, q));
      if (!spot) continue;
      D.placeMonster('wolf', { floor:0, x:spot.x, y:spot.y });
      const id = D.get().tokens.find(t => t.bid === 'wolf').id; window.__bang = false;
      const iv = setInterval(() => { if (D.tokenViews.get(id)?.group.children.some(c => c.isSprite && c.renderOrder === 20)){ window.__bang = true; clearInterval(iv); } }, 10);
      D.wander.stepHero(dx, dy); return id;
    }
    return null; });
  expect(wolf).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.__bang), { timeout:10_000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().combat.active)).toBe(true);
  expect(errs).toEqual([]);
});
