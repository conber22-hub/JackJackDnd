import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero, heroStats, heroAttacks, heroToken, castables, heroWarnings, spellLimits, maxSpellLevel, heroResources } from '../src/engine/hero.js';

test('level 1 fighter: chain mail + shield + Defense, Soldier background', () => {
  const h = newHero('Fighter'); h.name = 'Ilse';
  const st = heroStats(h);
  assert.equal(st.sc.Str, 17); assert.equal(st.sc.Con, 14);          // Soldier +2 Str, +1 Con
  assert.equal(st.ac, 16 + 2 + 1);
  assert.equal(st.hp, 10 + 2);
  assert.equal(st.pb, 2);
  const atk = heroAttacks(h, st);
  assert.equal(atk[0].n, 'Longsword'); assert.equal(atk[0].b, 2 + 3); assert.equal(atk[0].d, '1d8+3');
  assert.deepEqual(heroWarnings(h), []);
});

test('level 5 wizard (Sage): slots, spell DC, cantrip scaling, area spells', () => {
  const h = newHero('Wizard'); h.name = 'Ambrose'; h.lvl = 5; h.bg = 'Sage'; h.bg2 = 'Int'; h.bg1 = 'Con'; h.asi = { 4:'Int' };
  h.spells = ['Fire Bolt', 'Fireball', 'Shield'];
  const st = heroStats(h);
  assert.equal(st.sc.Int, 15 + 2 + 2);
  assert.equal(st.dc, 8 + 3 + 4);
  assert.deepEqual(st.slots, [4, 3, 2]);
  assert.equal(maxSpellLevel(h), 3);
  const fb = heroAttacks(h, st).find(a => a.n === 'Fire Bolt');
  assert.equal(fb.d, '2d10'); assert.equal(fb.b, 3 + 4);
  const fireball = castables(h, st).find(c => c.n === 'Fireball');
  assert.equal(fireball.dc, 15); assert.equal(fireball.rad, 4); assert.equal(fireball.half, true);
  assert.equal(spellLimits(h).prepared, 9 + 1);                     // Sage's Magic Initiate adds one
  assert.equal(st.hp, 6 + 2 + 4 * (4 + 2));                          // d6, Con 14
});

test('rogue expertise doubles proficiency; passive Perception follows it', () => {
  const h = newHero('Rogue'); h.name = 'Mira'; h.bg = 'Criminal'; h.bg2 = 'Dex'; h.bg1 = 'Con';
  h.skills = ['Perception', 'Investigation', 'Acrobatics', 'Deception']; h.expert = ['Perception', 'Stealth'];
  const st = heroStats(h);
  assert.equal(st.skills.Perception, 0 + 2 + 2);
  assert.equal(st.passive, 14);
  assert.equal(st.check, 3 + 2);                                     // thieves' tools
  assert.ok(heroAttacks(h, st)[0].f.includes('Sneak Attack +1d6'));
});

test('a hero becomes a token with per-ability saves', () => {
  const h = newHero('Cleric'); h.name = 'Sister Anca'; h.lvl = 3; h.spells = ['Sacred Flame', 'Healing Word'];
  const t = heroToken(h);
  assert.equal(t.kind, 'pc'); assert.equal(t.charId, h.id);
  assert.equal(t.saves.wis, heroStats(h).saves.Wis);
  assert.ok(t.casts.some(c => c.n === 'Sacred Flame' && c.sv === 'dex'));
  assert.ok(t.casts.some(c => c.n === 'Cure Wounds' && c.k === 'heal'), 'Life Domain spells are added at 3');
  assert.match(t.cls, /Cleric 3 · Life Domain/);
});

test('resources: slots, pact slots and class features by level', () => {
  const w = newHero('Wizard'); w.lvl = 5;
  const rw = heroResources(w);
  assert.deepEqual(rw.filter(r => r.slot).map(r => [r.id, r.max]), [['slot1', 4], ['slot2', 3], ['slot3', 2]]);
  assert.equal(rw.find(r => r.id === 'arcane').lv, 3);
  assert.equal(rw.find(r => r.id === 'hd').max, 5);
  const k = newHero('Warlock'); k.lvl = 3;
  const pact = heroResources(k).find(r => r.id === 'pact');
  assert.equal(pact.max, 2); assert.equal(pact.slot, 2); assert.equal(pact.rest, 'short');
  const b = newHero('Barbarian'); b.lvl = 3;
  assert.equal(heroResources(b).find(r => r.id === 'rage').max, 3);
  assert.equal(heroToken(b).rageDmg, 2);
  assert.equal(heroAttacks(b)[0].m, 1);
  const f = newHero('Fighter'); f.lvl = 2;
  assert.deepEqual(heroResources(f).filter(r => !r.slot && r.id !== 'hd' && r.id !== 'heroic').map(r => r.id), ['wind', 'surge']);
});

test('castables: buffs and utility spells are castable; Divine Smite is damage', () => {
  const p = newHero('Paladin'); p.lvl = 2; p.spells = ['Bless'];
  const c = castables(p);
  assert.equal(c.find(s => s.n === 'Bless').k, 'buff');
  const smite = c.find(s => s.n === 'Divine Smite');
  assert.equal(smite.k, 'auto'); assert.equal(smite.smite, 1); assert.equal(smite.l, 1);
});

test('review fixes: Magic Initiate charge, Paladin\'s Smite from level 2, rays, sustained spells, mass heals', () => {
  const f = newHero('Fighter'); f.bg = 'Acolyte'; f.spells = ['Cure Wounds'];
  const mi = heroResources(f).find(r => r.id === 'mi');
  assert.ok(mi && mi.free === 'Cure Wounds' && mi.max === 1);
  const p1 = newHero('Paladin'); p1.lvl = 1;
  assert.ok(!castables(p1).some(s => s.n === 'Divine Smite'));
  assert.ok(!heroResources(p1).some(r => r.id === 'smite'));
  const p2 = newHero('Paladin'); p2.lvl = 2;
  assert.ok(castables(p2).some(s => s.n === 'Divine Smite'));
  assert.equal(heroResources(p2).find(r => r.id === 'smite').free, 'Divine Smite');
  const k = newHero('Warlock'); k.lvl = 5; k.spells = ['Eldritch Blast'];
  const eb = heroAttacks(k).find(a => a.n.startsWith('Eldritch Blast'));
  assert.equal(eb.rays, 2); assert.equal(eb.d.startsWith('1d10'), true);
  const w = newHero('Wizard'); w.lvl = 3; w.spells = ['Scorching Ray'];
  const sr = heroAttacks(w).find(a => a.n.startsWith('Scorching Ray'));
  assert.equal(sr.rays, 3); assert.ok(sr.d.startsWith('2d6')); assert.equal(sr.l, 2); assert.equal(sr.sn, 'Scorching Ray');
  const c = newHero('Cleric'); c.lvl = 5; c.spells = ['Spirit Guardians', 'Mass Healing Word'];
  const cs = castables(c);
  assert.equal(cs.find(s => s.n === 'Spirit Guardians').again, 1);
  assert.equal(cs.find(s => s.n === 'Mass Healing Word').multi, 6);
  const s5 = newHero('Sorcerer'); s5.lvl = 5;
  assert.equal(heroResources(s5).find(r => r.id === 'sorcrest').points, 2);
});

test('feats at Ability Score Improvement levels', async () => {
  const { newHero, heroStats, heroWarnings, heroToken, spellLimits, spellPool, heroResources } = await import('../src/engine/hero.js');
  const h = newHero('Fighter'); h.lvl = 8; h.ab = { Str:15, Dex:14, Con:14, Int:10, Wis:12, Cha:8 }; h.bg = 'Soldier'; h.bg2 = 'Str'; h.bg1 = 'Con';
  const base = heroStats({ ...h, asi:{} });
  // an old sheet: just an ability is +2
  assert.equal(heroStats({ ...h, asi:{ 4:'Dex', 8:'Dex' } }).sc.Dex, base.sc.Dex + 4);
  // +1 and +1
  const split = heroStats({ ...h, asi:{ 4:{ feat:'Ability Score Improvement', ab:'Str', ab2:'Con' } } });
  assert.equal(split.sc.Str, base.sc.Str + 1); assert.equal(split.sc.Con, base.sc.Con + 1);
  // Alert adds the Proficiency Bonus to initiative; Grappler +1 Str or Dex
  const alert = heroStats({ ...h, asi:{ 4:{ feat:'Alert' }, 8:{ feat:'Grappler', ab:'Dex' } } });
  assert.equal(alert.init, base.init + base.pb + (Math.floor((base.sc.Dex + 1 - 10) / 2) - Math.floor((base.sc.Dex - 10) / 2)));
  assert.ok(alert.features.some(f => /Alert — feat \(4\)/.test(f)));
  // Skilled: three skills
  const sk = heroStats({ ...h, asi:{ 4:{ feat:'Skilled', skills:['Arcana', 'Stealth', 'Medicine'] } } });
  for (const s of ['Arcana', 'Stealth', 'Medicine']) assert.ok(sk.prof.has(s));
  // a fighting style feat stacks with the class's own style; Defense +1 AC in armour
  const def = heroStats({ ...h, style:'Archery', armor:'Chain Mail', asi:{ 4:{ feat:'Defense' } } });
  assert.equal(def.ac, heroStats({ ...h, style:'Archery', armor:'Chain Mail', asi:{} }).ac + 1); assert.ok(def.styles.has('Archery') && def.styles.has('Defense'));
  // a written-in feat: +1 ability and hit points per level
  const tough = heroStats({ ...h, asi:{ 4:{ feat:'Other', name:'Hardy', ab:'Con', hp:'2' } } });
  assert.ok(tough.hp >= base.hp + 2 * 8); assert.ok(tough.features.some(f => /Hardy/.test(f)));
  // Magic Initiate: a spell list for a fighter, two cantrips and a level-1 spell, one free cast
  const mi = { ...h, asi:{ 4:{ feat:'Magic Initiate', list:'W' } }, spells:['Fire Bolt', 'Ray of Frost', 'Magic Missile'] };
  assert.deepEqual(spellLimits(mi), { cantrips:2, prepared:1 });
  assert.ok(spellPool(mi).some(s => s.n === 'Magic Missile'));
  assert.ok(heroResources(mi).some(r => /Magic Initiate \(Magic Missile\)/.test(r.n)));
  assert.equal(heroStats(mi).castAb, 'Int');
  // warnings ask for what's missing
  assert.ok(heroWarnings({ ...h, asi:{ 4:{ feat:'Skilled', skills:['Arcana'] } } }).some(w => /Skilled/.test(w)));
  assert.ok(heroWarnings({ ...h, asi:{} }).some(w => /ability increase or feat/.test(w)));
  assert.ok(heroToken({ ...h, name:'X', asi:{ 4:{ feat:'Alert' }, 8:'Str' } }).maxHp > 0);
});
