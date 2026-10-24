"""python scripts/import-srd-monsters.py /workspace/srd-reference

Only explicit attack rolls and their unconditional immediate damage become attack buttons.
The complete stat block and all action/rider text are retained for manual adjudication.
"""
import html
import re
import sys
from pathlib import Path
from srd_source import rows, plain, emit

root = Path(sys.argv[1])
sources = [root / 'monsters-A-Z.md', root / 'animals.md']
types = 'Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder'
damage = re.compile(r'(\d+)(?: \((\d+d\d+(?:\s*[+−-]\s*\d+)?)\))? (' + types + r') damage')
number = lambda s: int(s.replace('−', '-'))
dice = lambda s: re.sub(r'\s+', '', s).replace('−', '-')
sizes = {'Tiny':1, 'Small':1, 'Medium':1, 'Large':2, 'Huge':3, 'Gargantuan':4}
# Malformed cells in the community conversion; transcribed from the official PDF's six ability columns.
ability_fixes = {
    'Ancient Red Dragon': ([30,10,29,18,15,27], [10,7,9,4,9,8]),
    'Remorhaz': ([24,13,21,4,10,5], [7,1,5,-3,0,-3]),
    "Will-o'-Wisp": ([1,28,10,13,14,11], [-5,9,0,1,2,0]),
}

def shape(name, meta):
    if 'Swarm' in meta: return 'swarm'
    if 'Skeleton' in name: return 'skeleton'
    if 'Vampire' in name: return 'vampire'
    if 'Zombie' in name: return 'zombie'
    if 'Undead' in meta: return 'wraith' if re.search(r'Ghost|Specter|Wraith|Shadow|Will-o', name) else 'zombie'
    if re.search(r'Spider|Scorpion', name): return 'weaver'
    if 'Plant' in meta: return 'scarecrow'
    if re.search(r'Ooze|Elemental', meta): return 'wraith'
    if 'Aberration' in meta: return 'mind'
    if re.search(r'Beast|Monstrosity|Dragon', meta): return 'wolf'
    return 'humanoid'

def attack(name, body):
    roll = re.search(r'_(Melee or Ranged|Melee|Ranged) Attack Roll:_ \+(\d+)', body)
    if not roll: return None
    hit = body.split('_Hit:_')[1].strip().split('. ')[0]
    # A swarm's Bloodied alternative is not additional damage; retain any subsequent unconditional poison.
    hit = re.sub(r'—or [^—]+—', ' ', hit)
    hit = re.split(r',? or ', hit)[0]
    # Goblin warriors/bosses add these dice only with Advantage.
    hit = re.sub(r', plus .+ if the attack roll had Advantage', '', hit)
    parts = [{'d':dice(m[2] or m[1]), 't':m[3].lower()} for m in damage.finditer(hit)]
    if not parts:
        assert name == 'Tentacle' and 'Grappled' in hit, (name, hit)
    reach = re.search(r'reach (\d+) (?:ft\.|feet)', body)
    rng = re.search(r'range (\d+)(?:/(\d+))? (?:ft\.|feet)', body)
    out = {'n':name, 'b':int(roll[2]), 'd':'+'.join(p['d'] for p in parts) if parts else '0',
           't':' + '.join(dict.fromkeys(p['t'] for p in parts)) if parts else 'none', 'parts':parts,
           'f':'{A} uses ' + name + ' against {T}.', 'text':body.strip()}
    if roll[1] != 'Ranged': out['m'] = 1
    if reach: out['reach'] = int(reach[1]) / 5
    if rng: out['rng'] = [int(rng[1]), int(rng[2])] if rng[2] else [int(rng[1])]
    return out

monsters = []
for source in sources:
    raw = source.read_text()
    heads = list(re.finditer(r'^#{2,3} (.+)\n\n_(.+)_\n\n\*\*AC\*\* (\d+)', raw, re.M))
    for i, h in enumerate(heads):
        name, meta, ac = h[1], h[2], int(h[3])
        body = raw[h.start():heads[i+1].start() if i+1 < len(heads) else len(raw)]
        # The next monster-family heading belongs to the next stat block.
        body = re.split(r'\n## ', body)[0].strip()
        if name in ability_fixes:
            scores, bonuses = ability_fixes[name]
            fixed = '<table><thead><tr><th>Ability</th><th>Score</th><th>Mod</th><th>Save</th></tr></thead><tbody>'
            fixed += ''.join(f'<tr><td>{ab}</td><td>{v}</td><td>{(v-10)//2:+}</td><td>{sv:+}</td></tr>' for ab, v, sv in zip(['STR','DEX','CON','INT','WIS','CHA'], scores, bonuses))
            body = re.sub(r'<table>.*?</table>', fixed + '</tbody></table>', body, count=1, flags=re.S)
        hp = re.search(r'\*\*HP\*\* (\d+) \(([^)]+)\)', body)
        init = number(re.search(r'\*\*Initiative\*\* ([+−-]\d+)', body)[1])
        speed = plain(re.search(r'\*\*Speed\*\* ([^\n]+)', body)[1])
        crline = re.search(r'\*\*CR\*\* ([^\n]+)', body)[1]
        cr = re.match(r'\d+(?:/\d+)?', crline)[0]
        xp = re.search(r'XP ([\d,]+)|([\d,]+) XP', crline)
        xp = int((xp[1] or xp[2]).replace(',', ''))
        stats, saves = {}, {}
        for row in rows(re.search(r'<table>(.*?)</table>', body, re.S)[0])[1:]:
            for j in range(0, len(row), 4):
                ab, score, mod, save = row[j:j+4]
                stats[ab.capitalize()] = number(score); saves[ab.lower()] = number(save)
        assert len(stats) == len(saves) == 6, name
        senses = plain(re.search(r'\*\*Senses\*\* ([^\n]+)', body)[1])
        abilities = list(re.finditer(r'^\*\*_(.+?)\._\*\* ([\s\S]*?)(?=^\*\*_|^#{2,4} |\Z)', body, re.M))
        attacks, traits = [], []
        section = body
        for a in abilities:
            parsed = attack(a[1], a[2])
            if parsed: attacks.append(parsed)
            # Only escaped text reaches the existing HTML trait renderer.
            traits.append('<b>' + html.escape(a[1]) + '.</b> ' + html.escape(plain(a[2]).replace('_', '')))
        legendary = re.search(r'_Legendary Action Uses: ([\s\S]*?)_\n', section)
        if legendary: traits.append('<b>Legendary Action Uses:</b> ' + html.escape(plain(legendary[1])))
        for label in ['Skills','Resistances','Immunities','Vulnerabilities','Languages','Gear']:
            entry = re.search(r'\*\*' + label + r'\*\* ([^\n]+)', body)
            if entry: traits.insert(0, '<b>' + label + '.</b> ' + html.escape(plain(entry[1])))
        creature_type = re.search(r'\b(Aberration|Beast|Celestial|Construct|Dragon|Elemental|Fey|Fiend|Giant|Humanoid|Monstrosity|Ooze|Plant|Undead)s?\b', meta)[1]
        color = {'Undead':'#92879a', 'Beast':'#8d795f', 'Dragon':'#697e69', 'Fiend':'#9b5550', 'Elemental':'#769ca0', 'Plant':'#638852', 'Ooze':'#6d9978'}.get(creature_type, '#8b8495')
        m = {'id':'srd-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'), 'fam':'srd', 'name':name,
             'cr':cr, 'xp':xp, 'ac':ac, 'hp':dice(hp[2]), 'hpAverage':int(hp[1]), 'speed':int(re.match(r'\d+', speed)[0]),
             'spd':speed, 'size':sizes[meta.split()[0]], 'sizeText':meta.split(',')[0], 'init':init, 'stats':stats, 'saves':saves,
             'senses':senses, 'passive':int(re.search(r'Passive Perception (\d+)', senses)[1]),
             'attacks':attacks, 'traits':traits, 'shape':shape(name, meta), 'color':color, 'eye':'#d5c9a7',
             'look':name + ': ' + meta + '.', 'tags':[creature_type.lower()], 'text':body, 'src':'SRD 5.2.1'}
        monsters.append(m)
assert len(monsters) == len({m['id'] for m in monsters}) == 330
assert sum(len(m['attacks']) for m in monsters) == 423
emit('src/data/srd-monsters.js', {'SRD_MONSTERS':monsters}, sources,
     'structured stat blocks, namespaced IDs, escaped trait text and schematic existing mini shapes; explicit attack rolls and immediate damage only.')
print(f'{len(monsters)} creatures; {sum(len(m["attacks"]) for m in monsters)} attack buttons; {sum(not m["attacks"] for m in monsters)} creatures with manual actions only.')
