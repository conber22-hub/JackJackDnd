"""python scripts/extract-srd-monster-index.py /workspace/srd-raw.txt

Independent stat inventory from pdftotext -raw of the official SRD 5.2.1 PDF.
"""
import json
import re
import sys
from pathlib import Path
raw = Path(sys.argv[1]).read_text()
source = raw.split('\nMonsters A–Z\n')[1]
heads = list(re.finditer(r'^AC (\d+)\s+Initiative ([+−-]\d+)', source, re.M))
number = lambda s: int(s.replace('−', '-'))
index = []
for i, h in enumerate(heads):
    before = source[:h.start()].splitlines()
    start = len(before) - 1
    while not re.match(r'^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b', before[start]): start -= 1
    name = before[start - 1].replace('’', "'")
    body = source[h.start():heads[i+1].start() if i+1 < len(heads) else len(source)]
    hp = re.search(r'^HP (\d+) \(([^)]+)\)', body, re.M)
    cr = re.search(r'^CR (\d+(?:/\d+)?)\b', body, re.M)[1]
    stats, saves = {}, {}
    for ab, score, mod, save in re.findall(r'\b(Str|Dex|Con|Int|Wis|Cha)\s*(\d+)\s+([+−-]?\d+)\s+([+−-]?\d+)', body.split('\nCR ')[0]):
        stats[ab] = int(score); saves[ab.lower()] = number(save)
    assert len(stats) == len(saves) == 6, (name, stats)
    index.append({'name':name, 'ac':int(h[1]), 'init':number(h[2]), 'hp':re.sub(r'\s+', '', hp[2]).replace('−', '-'),
                  'hpAverage':int(hp[1]), 'cr':cr, 'stats':stats, 'saves':saves})
assert len(index) == len({m['name'] for m in index}) == 330
Path('tests/fixtures/srd-monster-index.json').write_text(json.dumps(index, indent=2) + '\n')
print('330 official creature stat lines extracted.')
