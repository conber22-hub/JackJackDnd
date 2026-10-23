"""Extract an independent test inventory from pdftotext -layout of the official SRD 5.2.1 PDF.

Usage: python scripts/extract-srd-class-tables.py /tmp/srd.txt
See docs/codex/classes-20.md for the source URL and attribution.
"""
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text()
full = ['cantrips', 'prepared'] + [f'slot{i}' for i in range(1, 10)]
half = ['prepared'] + [f'slot{i}' for i in range(1, 6)]
columns = {
    'Barbarian': ['rages', 'rageDamage', 'mastery'],
    'Bard': ['bardicDie'] + full,
    'Cleric': ['channel'] + full,
    'Druid': ['wildShape'] + full,
    'Fighter': ['secondWind', 'mastery'],
    'Monk': ['martialArts', 'focus', 'movement'],
    'Paladin': ['channel'] + half,
    'Ranger': ['favoredEnemy'] + half,
    'Rogue': ['sneakAttack'],
    'Sorcerer': ['sorceryPoints'] + full,
    'Warlock': ['invocations', 'cantrips', 'prepared', 'pactSlots', 'pactLevel'],
    'Wizard': full,
}
tables = {}
for cls, fields in columns.items():
    start = re.search(r'^[ \f]*' + cls + r' Features\s*$', source, re.M).end()
    # Every progression table has 20 numbered rows; continuations belong to the preceding row.
    rows = []
    for line in source[start:].splitlines():
        m = re.match(r'^\s+(\d+)\s+\+(\d)\s+(.*)$', line)
        if not m:
            if rows and line.strip():
                rows[-1][2] += ' ' + line.strip().replace('’', "'")
            continue
        level, pb, rest = m.groups()
        tokens = rest.replace(' ft.', '').split()
        values = tokens[-len(fields):]
        features = ' '.join(tokens[:-len(fields)]).replace('’', "'")
        values = [0 if v == '—' else int(v) if re.fullmatch(r'\+?\d+', v) else v for v in values]
        assert int(level) == len(rows) + 1, (cls, level)
        rows.append([int(level), int(pb), features, *values])
        if int(level) == 20:
            break
    assert len(rows) == 20, cls
    # The page footer immediately before the next form-feed identifies the printed page.
    footer = re.search(r'(\d+)\s+System Reference Document 5\.2\.1', source[start:])
    tables[cls] = {'page': int(footer[1]), 'columns': ['level', 'pb', 'features', *fields], 'rows': rows}

out = {'source': 'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
       'license': 'SRD 5.2.1 by Wizards of the Coast LLC; CC BY 4.0; structured table extraction.',
       'tables': tables}
# One row per line keeps this inventory easy to compare with the printed tables.
text = json.dumps(out, indent=2, ensure_ascii=False)
text = re.sub(r'\[\n\s+([^\[\]]*?)\n\s+\]', lambda m: '[' + re.sub(r'\n\s*', ' ', m[1]) + ']', text)
Path('tests/fixtures/srd-class-tables.json').write_text(text + '\n')
print('12 classes × 20 levels extracted from the official PDF.')
