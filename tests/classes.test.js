import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ABILITIES, CLASSES, FEATURES, SLOTS_FULL, SLOTS_HALF, PACT, MAX_LEVEL, profBonus } from '../src/data/srd.js';
import { newHero, heroStats, heroResources, heroToken, heroAttacks, spellLimits } from '../src/engine/hero.js';

// Extracted independently from the official PDF, not from the runtime data or community Markdown.
const { tables } = JSON.parse(readFileSync(new URL('./fixtures/srd-class-tables.json', import.meta.url)));

test('all 240 class levels match the official SRD progression tables', () => {
  assert.equal(MAX_LEVEL, 20);
  assert.equal(Object.keys(CLASSES).length, 12);
  for (const rows of [SLOTS_FULL, SLOTS_HALF, PACT]) assert.equal(rows.length, 20);
  for (const [cls, table] of Object.entries(tables)){
    const C = CLASSES[cls];
    if (C.cantrips) assert.equal(C.cantrips.length, 20, cls);
    if (C.prep) assert.equal(C.prep.length, 20, cls);
    assert.equal(table.rows.length, 20);
    for (const row of table.rows){
      const expected = Object.fromEntries(table.columns.map((key, i) => [key, row[i]]));
      const h = { ...newHero(cls), lvl:expected.level }, st = heroStats(h), resources = heroResources(h, st);
      const label = `${cls} ${h.lvl} (SRD p. ${table.page})`;
      assert.equal(profBonus(h.lvl), expected.pb, label);
      assert.equal(st.pb, expected.pb, label);
      assert.deepEqual(spellLimits(h), { cantrips:expected.cantrips || 0, prepared:expected.prepared || 0 }, label);
      if (C.full || C.half){
        const slots = Array.from({ length:C.full ? 9 : 5 }, (_, i) => expected[`slot${i + 1}`]).filter(Boolean);
        assert.deepEqual(st.slots, slots, label);
        assert.deepEqual(resources.filter(r => r.slot).map(r => r.max), slots, label);
      } else if (C.pact){
        assert.deepEqual(st.pact, { n:expected.pactSlots, l:expected.pactLevel }, label);
        const pact = resources.find(r => r.id === 'pact');
        assert.equal(pact.max, expected.pactSlots, label);
        assert.equal(pact.slot, expected.pactLevel, label);
        assert.equal(pact.rest, 'short');
      } else assert.equal(st.slots, null);
      for (const [column, id] of Object.entries({ rages:'rage', channel:'channel', wildShape:'wild', secondWind:'wind', focus:'focus', sorceryPoints:'sorcery', favoredEnemy:'favored' })){
        if (expected[column] !== undefined) assert.equal(resources.find(r => r.id === id)?.max || 0, expected[column], `${label}: ${column}`);
      }
      if (expected.rageDamage) assert.equal(heroToken(h).rageDmg, expected.rageDamage, label);
      if (expected.bardicDie) assert.ok(resources.find(r => r.id === 'inspire').text.includes(expected.bardicDie.toLowerCase()), label);
      if (expected.martialArts){
        assert.ok(heroAttacks(h, st).find(a => a.n === 'Unarmed Strike').d.startsWith(expected.martialArts), label);
        assert.equal(st.spd, 30 + expected.movement, label);
      }
      if (expected.sneakAttack) assert.ok(heroAttacks(h, st)[0].f.includes(`+${expected.sneakAttack}`), label);
      if (h.lvl >= 11){
        const scheduled = C.features[h.lvl];
        assert.ok(Array.isArray(scheduled), label);
        for (const f of expected.features.split(', ').filter(f => !['—', 'Subclass feature'].includes(f))) assert.ok(scheduled.includes(f), `${label}: ${f}`);
      }
      assert.ok(ABILITIES.every(a => Number.isFinite(st.saves[a])), label);
    }
  }
});

// The concrete subclass features behind the table's "Subclass feature" cells (SRD pp. 30–82).
const subclassFeatures = {
  Barbarian:{ 14:['Berserker: Intimidating Presence'] },
  Bard:{ 14:['Lore: Peerless Skill'] },
  Cleric:{ 17:['Life: Supreme Healing'] },
  Druid:{ 14:["Land: Nature's Sanctuary"] },
  Fighter:{ 15:['Champion: Superior Critical'], 18:['Champion: Survivor'] },
  Monk:{ 11:['Open Hand: Fleet Step'], 17:['Open Hand: Quivering Palm'] },
  Paladin:{ 15:['Devotion: Smite of Protection'], 20:['Devotion: Holy Nimbus'] },
  Ranger:{ 11:["Hunter: Superior Hunter's Prey"], 15:["Hunter: Superior Hunter's Defense"] },
  Rogue:{ 13:['Thief: Use Magic Device'], 17:["Thief: Thief's Reflexes"] },
  Sorcerer:{ 14:['Draconic: Dragon Wings'], 18:['Draconic: Dragon Companion'] },
  Warlock:{ 14:['Fiend: Hurl Through Hell'] },
  Wizard:{ 14:['Evoker: Overchannel'] },
};
test('all 12 subclasses unlock their high-level features at the SRD levels', () => {
  for (const [cls, levels] of Object.entries(subclassFeatures)) for (const [level, names] of Object.entries(levels)) for (const name of names){
    assert.ok(CLASSES[cls].features[level].includes(name));
    assert.ok(heroStats({ ...newHero(cls), lvl:+level }).features.includes(`${name} (${level})`));
    assert.ok(!heroStats({ ...newHero(cls), lvl:level - 1 }).features.some(f => f.startsWith(`${name} (`)));
  }
});

test('every class feature has full text; shared names and repeated upgrades retain their variants', () => {
  for (const C of Object.values(CLASSES)){
    assert.deepEqual(C.features[19], ['Epic Boon']);
    for (const names of Object.values(C.features)) for (const name of names) assert.ok(FEATURES[name]?.length > 40, name);
  }
  assert.equal(Object.keys(FEATURES).length, 183);
  assert.match(FEATURES['Unarmored Defense'], /Barbarian, level 1/);
  assert.match(FEATURES['Unarmored Defense'], /Monk, level 1/);
  assert.match(FEATURES['Improved Brutal Strike'], /Staggering Blow/);
  assert.match(FEATURES['Improved Brutal Strike'], /2d10/);
  assert.match(FEATURES['Devotion: Oath of Devotion Spells'], /Freedom of Movement, Guardian of Faith/);
  assert.match(FEATURES['Wild Shape'], /<table>/, 'embedded rules tables are retained');
  assert.match(FEATURES['Epic Boon'], /another feat of your choice/);
  assert.deepEqual(JSON.parse(JSON.stringify(FEATURES)), FEATURES);
});
