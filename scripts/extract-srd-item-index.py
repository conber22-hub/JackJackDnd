"""python scripts/extract-srd-item-index.py /tmp/srd-raw.txt (pdftotext -raw of official PDF)."""
import json
import re
import sys
from pathlib import Path
source = Path(sys.argv[1]).read_text()
items = []
active = False
for page in source.split('\f'):
    match = re.match(r'System Reference Document 5\.2\.1\n(\d+)', page)
    if not match: continue
    number = int(match[1])
    if '\nMagic Items A–Z\n' in page: active = True
    if active and '\nMonsters\n' in page: break
    if not active: continue
    lines = page.splitlines()
    for i, line in enumerate(lines):
        if re.match(r'^(Armor\s*\(|Weapon\s*\(|Wondrous Item,|Potion,|Ring,|Rod,|Scroll,|Staff,|Wand,)', line):
            n = lines[i - 1].replace('’', "'")
            if n == 'and Location': n = lines[i - 2] + ' ' + n  # wrapped heading in the PDF
            items.append({'n':n, 'page':number})
assert len(items) == len({i['n'] for i in items}) == 258
Path('tests/fixtures/srd-magic-item-index.json').write_text(json.dumps(items, indent=2) + '\n')
