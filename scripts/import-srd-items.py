"""python scripts/import-srd-items.py /tmp/dread-srd-source"""
import re
import sys
from pathlib import Path
from srd_source import rows, table, amount, price, emit

root = Path(sys.argv[1])
equipment, magic = root / 'equipment.md', root / 'magic-items.md'
source, magics = equipment.read_text(), magic.read_text().split('## Magic Items A–Z')[1]

def costs(weight, cost):
    return {'weight':amount(weight), 'cost':price(cost), 'weightText':weight, 'costText':cost}

weapons = []
for row in rows(table(source, 'Weapons'))[1:]:
    if len(row) == 1:
        category = ('s' if 'Simple' in row[0] else 'm') + ('r' if 'Ranged' in row[0] else '')
        continue
    n, damage, props, mastery, weight, cost = row
    die, ty = damage.split(' ')
    flags = ''.join(flag for prop, flag in [('Finesse','F'), ('Light','L'), ('Thrown','T'), ('Heavy','H'), ('Two-Handed','2'), ('Reach','R'), ('Ammunition','A')] if prop in props)
    versatile = re.search(r'Versatile \((\dd\d+)\)', props)
    if versatile: flags += 'V:' + versatile[1]
    rng = re.search(r'Range (\d+)/(\d+)', props)
    weapons.append({'n':n, 'd':die, 'ty':ty.lower(), 'p':flags, 'rng':[int(rng[1]), int(rng[2])] if rng else 0,
                    'ms':mastery, 'cat':category, 'properties':props, **costs(weight, cost), 'src':'SRD 5.2.1'})
assert len(weapons) == 38

armor = []
for row in rows(table(source, 'Armor'))[1:]:
    if len(row) == 1:
        category = row[0].split()[0].lower()
        continue
    n, ac, strength, stealth, weight, cost = row
    armor.append({'n':n, 'ac':int(re.search(r'\d+', ac)[0]), 'dex':2 if 'max 2' in ac else 99 if 'Dex' in ac else 0,
                  't':category, 'acText':ac, 'strength':int(strength.split()[-1]) if strength != '—' else 0,
                  'stealth':stealth == 'Disadvantage', **costs(weight, cost), 'src':'SRD 5.2.1'})
assert len(armor) == 13

tool_section = source.split('## Tools')[1].split('## Adventuring Gear')[0]
tools = []
for h in re.finditer(r'^\*\*([^\n]+) \(([^)]+)\)\*\*\n([\s\S]*?)(?=^\*\*[^\n]+ \([^)]+\)\*\*\n|^####|\Z)', tool_section, re.M):
    n, cost, text = h.groups()
    weight = re.search(r'\*\*Weight:\*\* ([^\n]+)', text)[1]
    f = {'n':n, 'text':text.strip(), 'ability':re.search(r'\*\*Ability:\*\* (\w+)', text)[1], **costs(weight, cost), 'src':'SRD 5.2.1'}
    variants = re.search(r'\*\*Variants:\*\* (.+)', text)
    if variants:
        f['variants'] = [{'n':m[1].strip().capitalize(), **costs(m[3] or weight, m[2])} for m in re.finditer(r'([^,()]+) \(([^,()]+)(?:, ([^()]+))?\)', variants[1])]
    tools.append(f)
assert len(tools) == 25, len(tools)

gear_section = source.split('## Adventuring Gear')[1].split('## Mounts')[0]
descriptions = {h[1]:h[3].strip() for h in re.finditer(r'^#### (.+) \(([^)]+)\)\n\n([\s\S]*?)(?=^#### |^## |\Z)', gear_section, re.M)}
gear = []
for n, weight, cost in rows(table(source, 'Adventuring Gear'))[1:]:
    key = 'Spell Scroll' if n.startswith('Spell Scroll (') else n
    assert key in descriptions, n
    text = descriptions[key].replace('**Adventuring Gear**\n\n' + table(source, 'Adventuring Gear'), '').strip()
    gear.append({'n':n, 'type':'Pack' if n.endswith('Pack') else 'Adventuring Gear', 'text':text, **costs(weight, cost), 'src':'SRD 5.2.1'})
assert len(gear) == 82
for name, caption in [('Ammunition','Ammunition'), ('Arcane Focus','Arcane Focuses'), ('Druidic Focus','Druidic Focuses'), ('Holy Symbol','Holy Symbols')]:
    variants = []
    for row in rows(table(source, caption))[1:]:
        n, weight, cost = row[0], row[-2], row[-1]
        variants.append({'n':n, **costs(weight, cost), **({'amount':int(row[1]), 'storage':row[2]} if name == 'Ammunition' else {})})
    next(g for g in gear if g['n'] == name)['variants'] = variants

# Item headings are identified by the type/rarity line: embedded creatures stay in their parent item.
heads = [h for h in re.finditer(r'^#### (.+)\n\n_(.+)_\n', magics, re.M) if re.match(r'(Armor|Weapon|Wondrous Item|Potion|Ring|Rod|Scroll|Staff|Wand)\b', h[2])]
items = []
for i, h in enumerate(heads):
    n, info = h[1], h[2]
    text = magics[h.end():heads[i + 1].start() if i + 1 < len(heads) else len(magics)].strip()
    attune = re.search(r'\((Requires Attunement[^)]*)\)', info)
    meta = re.split(r', (?=(?:Common|Uncommon|Rare|Very Rare|Legendary|Artifact|Rarity Varies|Varies)\b)', info, maxsplit=1)
    assert len(meta) == 2, (n, info)
    f = {'n':n, 'type':meta[0], 'rarity':re.sub(r' \(Requires Attunement[^)]*\)', '', meta[1]),
         'attune':attune[1] if attune else '', 'text':text, 'src':'SRD 5.2.1'}
    # Only unconditional, simple bonuses; typed riders and conditional effects remain in their full text.
    if n in ['Cloak of Protection', 'Ring of Protection']: f.update(ac=1, saves=1)
    if n == 'Bracers of Archery': f.update(dmgBonus=2, appliesTo=['Longbow', 'Shortbow'])
    if n in ['Armor, +1, +2, or +3', 'Shield, +1, +2, or +3', 'Weapon, +1, +2, or +3', 'Ammunition, +1, +2, or +3']:
        f['variants'] = []
        for bonus in [1, 2, 3]:
            rarity = ('Rare','Very Rare','Legendary')[bonus-1] if n.startswith('Armor,') else ('Uncommon','Rare','Very Rare')[bonus-1]
            f['variants'].append({'n':n.split(',')[0] + f', +{bonus}', 'rarity':rarity,
                                  **({'ac':bonus} if n.startswith(('Armor,','Shield,')) else {'atk':bonus, 'dmgBonus':bonus})})
    items.append(f)
assert len(items) == 258
for entries in [weapons, armor, tools, gear, items]: assert len({x['n'] for x in entries}) == len(entries)
emit('src/data/srd-items.js', {'SRD_WEAPONS':weapons, 'ARMOR_ITEMS':armor, 'TOOLS':tools, 'GEAR':gear, 'MAGIC_ITEMS':items}, [equipment, magic], 'structured equipment, prices in GP, weights in pounds; conservative bonus fields and variant tables.')
print(f'{len(weapons)} weapons, {len(armor)} armour/shields, {len(tools)} tools, {len(gear)} gear/packs, {len(items)} magic items.')
