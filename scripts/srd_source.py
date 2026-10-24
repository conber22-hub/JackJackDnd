"""Helpers for the pinned, openly licensed SRD Markdown conversion (not private libraries)."""
import hashlib
import html
import json
import re
from pathlib import Path

SOURCE_COMMIT = '1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4'

def plain(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()

def rows(table):
    return [[plain(c) for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)]
            for row in re.findall(r'<tr>(.*?)</tr>', table, re.S)]

def table(source, caption):
    return re.search(re.escape('**' + caption + '**') + r'\s*(<table>.*?</table>)', source, re.S)[1]

def amount(s):
    s = s.replace(',', '').replace('½', '.5').replace('¼', '.25').replace('¾', '.75')
    if s == '—':
        return 0
    fraction = re.match(r'(\d+)/(\d+)', s)
    if fraction:
        return int(fraction[1]) / int(fraction[2])
    match = re.match(r'([\d.]+)', s)
    return float(match[1]) if match else None

def price(s):
    n = amount(s)
    unit = re.search(r'\b(CP|SP|EP|GP|PP)\b', s)
    return round(n * {'CP':.01, 'SP':.1, 'EP':.5, 'GP':1, 'PP':10}[unit[1]], 4) if n is not None and unit else None

def emit(path, exports, sources, changes):
    hashes = ', '.join(p.name + ': ' + hashlib.sha256(p.read_bytes()).hexdigest() for p in sources)
    header = f'''/* This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of
   the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the
   Creative Commons Attribution 4.0 International License, available at
   https://creativecommons.org/licenses/by/4.0/legalcode.
   Changes: {changes}
   Generated from downfallx/dnd-5e-srd-markdown, commit {SOURCE_COMMIT}.
   Source SHA-256: {hashes}
   Markdown/HTML descriptions are data, not trusted markup. */
'''
    Path(path).write_text(header + '\n'.join('export const ' + key + ' = ' + json.dumps(value, ensure_ascii=False, indent=2) + ';' for key, value in exports.items()) + '\n')
