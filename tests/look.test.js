import test from 'node:test';
import assert from 'node:assert/strict';
import { heroLook, sheetLook, normalizeLook, creatureLook, npcLook, lookFor, forgePreset } from '../src/engine/look.js';
import { BAROVIA } from '../src/data/bestiary-barovia.js';
import { heroToken, newHero } from '../src/engine/hero.js';
import { mulberry32 } from '../src/util/core.js';

test('a hero looks like their sheet: species, armour, weapons, shield', () => {
  const plate = heroLook({ id:'h1', sp:'Dwarf', cls:'Fighter', armor:'Plate', shield:true, weapons:['Warhammer'], color:'#884422' });
  assert.equal(plate.body, 'dwarf'); assert.equal(plate.outfit, 'plate'); assert.equal(plate.main, 'hammer'); assert.equal(plate.off, 'shield');
  assert.notEqual(plate.beard, 'none', 'dwarves are bearded');
  const wiz = heroLook({ id:'h2', sp:'Elf', cls:'Wizard', armor:'None', weapons:[] });
  assert.equal(wiz.outfit, 'robe'); assert.equal(wiz.main, 'staff'); assert.equal(wiz.pose, 'caster');
  const ranger = heroLook({ id:'h3', sp:'Human', cls:'Ranger', armor:'Leather', weapons:['Longbow', 'Shortsword'] });
  assert.equal(ranger.main, 'shortsword', 'a melee weapon in hand when there is one'); assert.equal(ranger.outfit, 'leather');
  const archer = heroLook({ id:'h4', sp:'Human', cls:'Ranger', armor:'Leather', weapons:['Longbow'] });
  assert.equal(archer.main, 'longbow'); assert.equal(archer.off, 'none', 'a bow needs both hands');
  const big = heroLook({ id:'h5', sp:'Orc', cls:'Barbarian', armor:'Hide', weapons:['Greataxe'], shield:true });
  assert.equal(big.main, 'greataxe'); assert.equal(big.off, 'none', 'no shield with a greataxe');
  const dragon = heroLook({ id:'h6', sp:'Dragonborn', spOpt:'Red (fire)', cls:'Paladin', armor:'Chain Mail', weapons:['Longsword'] });
  assert.equal(dragon.skin, '#a0302a'); assert.equal(dragon.tail, true); assert.equal(dragon.hair, 'bald');
  const tief = heroLook({ id:'h7', sp:'Tiefling', cls:'Warlock', armor:'Leather', weapons:['Dagger'] });
  assert.notEqual(tief.horns, 'none'); assert.equal(tief.tail, true); assert.equal(tief.glow, true);
  // the same sheet always gives the same figure; the player's choices win
  assert.deepEqual(heroLook({ id:'h2', sp:'Elf', cls:'Wizard', armor:'None', weapons:[] }), wiz);
  const mine = heroLook({ id:'h2', sp:'Elf', cls:'Wizard', armor:'None', weapons:[], mini:{ hair:'braid', hairCol:'#e6e6e6', cloak:'hood', helm:'none' } });
  assert.deepEqual([mine.hair, mine.hairCol, mine.cloak, mine.helm, mine.main], ['braid', '#e6e6e6', 'hood', 'none', 'staff']);
  // and a hero token carries it
  const h = newHero('Cleric'); h.name = 'Ilse'; const tok = heroToken(h);
  assert.equal(tok.look.outfit, sheetLook(h).outfit); assert.equal(tok.standee, false);
});

test('looks from anywhere are made safe', () => {
  const l = normalizeLook({ body:'beholder', skin:'red', hair:'<script>', height:9, build:-3, main:'bazooka', off:'shield', seed:-1, c1:'#123456' });
  assert.equal(l.body, 'human'); assert.equal(l.skin, '#d9a57e'); assert.equal(l.hair, 'short'); assert.equal(l.height, 1.3); assert.equal(l.build, 0);
  assert.equal(l.main, 'none'); assert.equal(l.c1, '#123456'); assert.ok(Number.isInteger(l.seed) && l.seed >= 0);
  assert.equal(normalizeLook({ main:'greatsword', off:'shield' }).off, 'none');
});

test('creatures: presets, a weapon from their attacks, and no two of a pack alike', () => {
  const z = BAROVIA.find(b => b.id === 'zombie'), bandit = BAROVIA.find(b => b.id === 'bandit'), wolf = BAROVIA.find(b => b.id === 'wolf');
  assert.equal(forgePreset(wolf), null, 'wolves keep their own shape');
  const a = creatureLook(z, 't1'), b = creatureLook(z, 't2');
  assert.equal(a.body, 'zombie'); assert.equal(a.pose, 'slump'); assert.equal(a.glow, true);
  assert.notDeepEqual(a, b, 'two zombies differ'); assert.deepEqual(creatureLook(z, 't1'), a, 'but each is always itself');
  assert.equal(creatureLook(bandit, 'b1').main, 'scimitar');
  // a generic humanoid holds what it fights with
  const vet = { id:'some-knight', shape:'humanoid', color:'#445566', attacks:[{ n:'Halberd' }] };
  assert.equal(creatureLook(vet, 'k1').main, 'glaive');
  assert.equal(lookFor({ id:'z9', kind:'monster', bid:'zombie' }, z).body, 'zombie');
  // every Barovian preset builds a valid look
  for (const c of BAROVIA.filter(forgePreset)) assert.ok(creatureLook(c, 'x').body);
});

test('NPCs: rolled by kind, seeded, varied', () => {
  const r1 = mulberry32(7), r2 = mulberry32(7);
  assert.deepEqual(npcLook('guard', r1), npcLook('guard', r2));
  const g = npcLook('guard', mulberry32(3)); assert.equal(g.outfit, 'chain'); assert.equal(g.main, 'spear');
  const many = Array.from({ length:30 }, (_, i) => npcLook('villager', mulberry32(i)));
  assert.ok(new Set(many.map(l => l.skin + l.hair + l.hairCol)).size > 15, 'villagers vary');
  const adv = Array.from({ length:40 }, (_, i) => npcLook('adventurer', mulberry32(i)).body);
  assert.ok(new Set(adv).size >= 4, 'adventurers come from many folk');
  // an ally token without a look still gets one, coloured by the token
  assert.equal(lookFor({ id:'n1', kind:'npc', color:'#aa3322' }).c1, '#aa3322');
});
