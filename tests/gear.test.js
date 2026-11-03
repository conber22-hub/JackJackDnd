import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero, heroStats, heroAttacks } from '../src/engine/hero.js';
import { migrateSheet } from '../src/engine/inventory.js';
import { gearOf, mirrorGear, creatorGear, armorKey } from '../src/engine/gear.js';

const fighter = () => { const h = newHero('Fighter'); h.name = 'Ilse'; return h; };   // chain mail, shield, longsword; Defense

test('an old sheet: the same numbers before and after it gets a pack', () => {
  const h = fighter(), before = heroStats(h), atk = heroAttacks(h, before);
  const p = migrateSheet(h), after = heroStats(p);
  assert.deepEqual(gearOf(p), { armor:'Chain Mail', shield:true, weapons:['Longsword', 'Javelin'] });
  assert.equal(after.ac, before.ac);
  assert.deepEqual(heroAttacks(p, after).map(a => [a.n, a.b, a.d]), atk.map(a => [a.n, a.b, a.d]));
  assert.deepEqual(mirrorGear(p).weapons, ['Longsword', 'Javelin']);
});

test('+1 armour, a +2 longsword, a ring and a cloak (attuned) count; unattuned or carried things do not', () => {
  const h = migrateSheet(fighter()), base = heroStats(h);
  for (const i of h.inv) if (/Chain Mail|Longsword/.test(i.n)) i.equipped = false;
  h.inv.push({ id:'a', n:'Chain Mail, +1', qty:1, equipped:true, attuned:false },
             { id:'w', n:'Longsword, +2', qty:1, equipped:true, attuned:false },
             { id:'c', n:'Cloak of Protection', qty:1, equipped:true, attuned:false },
             { id:'r', n:'Ring of Protection', qty:1, equipped:false, attuned:true });
  let st = heroStats(h);
  assert.equal(st.ac, base.ac + 1);                          // the cloak and ring need attuning and wearing
  const atk = heroAttacks(h, st).find(a => a.n === 'Longsword, +2');
  assert.equal(atk.b, heroAttacks(fighter())[0].b + 2);
  assert.equal(atk.d, '1d8+5');
  h.inv.find(i => i.id === 'c').attuned = true;
  st = heroStats(h);
  assert.equal(st.ac, base.ac + 2);
  assert.equal(st.saves.Dex, base.saves.Dex + 1);
});

test('the creator changing gear updates the pack, keeping the magic version', () => {
  const h = migrateSheet(fighter());
  for (const i of h.inv) if (/Longsword/.test(i.n)) i.equipped = false;
  h.inv.push({ id:'w', n:'Longsword, +1', qty:1, equipped:true, attuned:false });
  const m = mirrorGear(h);
  assert.deepEqual(m.weapons, ['Javelin', 'Longsword']);
  // the creator: same longsword (kept as the +1), leather instead of chain, no shield, a dagger instead of the javelin
  const c = creatorGear({ ...m, armor:'Leather', shield:false, weapons:['Longsword', 'Dagger'] });
  assert.deepEqual(gearOf(c), { armor:'Leather', shield:false, weapons:['Longsword, +1', 'Dagger'] });
  assert.ok(c.inv.some(i => i.n === 'Chain Mail Armor' || i.n === 'Chain Mail'), 'the chain mail is still carried');
  assert.equal(armorKey('Plate Armor'), 'Plate');
  assert.equal(armorKey('Nonsense'), 'None');
});

test('a crafted weapon fights with its own numbers, and its rune counts', async () => {
  const { build } = await import('../src/engine/crafting.js');
  const h = migrateSheet(fighter());
  for (const i of h.inv) if (/Longsword|Javelin/.test(i.n)) i.equipped = false;
  const r = build({ kind:'weapon', parts:{ frame:'weapon-battleaxe', material:'steel', rune:'rune-1' }, name:'Grimsel’s Answer' });
  assert.ok(r.ok, r.why);
  h.inv.push({ id:'c1', n:r.item.n, custom:r.item, qty:1, equipped:true, attuned:false });
  const st = heroStats(h), a = heroAttacks(h, st).find(x => x.n === 'Grimsel’s Answer');
  assert.ok(a, 'the crafted axe is on the attack list');
  assert.equal(a.t, 'slashing');
  assert.match(a.d, /^1d(8|10)\+4$/);   // the battleaxe's own die (versatile two-handed with no shield, here a shield is worn: 1d8), +3 Str +1 rune
});
