/* Parse and roll the plain-text roll tables (see data/tables.js for the format). Pure — safe to unit test. */

export function parseTable(text){
  const rows = [], errors = [];
  String(text || '').split('\n').forEach((raw, ln) => {
    const line = raw.trim(); if (!line || line.startsWith('#')) return;
    const p = line.split('|').map(s => s.trim());
    const m = p[0].match(/^(\d{1,3})\s*(?:[-–]\s*(\d{1,3}))?$/);
    if (!m){ errors.push(`line ${ln + 1}: "${p[0]}" is not a number or range`); return; }
    const num = s => { const n = +s; return n === 0 ? 100 : n; };
    let lo = num(m[1]), hi = m[2] !== undefined ? num(m[2]) : lo;
    if (hi < lo) [lo, hi] = [hi, lo];
    rows.push({ lo, hi, name:p[1] || `Result ${lo}`, text:p[2] || '', fx:(p[3] || '').split(',').map(s => s.trim()).filter(Boolean) });
  });
  rows.sort((a, b) => a.lo - b.lo);
  return { rows, errors };
}
export function tableToText(rows){
  return rows.map(r => {
    const f = n => String(n === 100 ? 0 : n).padStart(2, '0');
    return `${r.lo === r.hi ? f(r.lo) : `${f(r.lo)}-${f(r.hi)}`} | ${r.name} | ${r.text} | ${r.fx.join(', ')}`;
  }).join('\n');
}
export const tableRow = (rows, n) => rows.find(r => n >= r.lo && n <= r.hi) || null;
export const tableMax = rows => rows.reduce((m, r) => Math.max(m, r.hi), 0);
// Which numbers 1..max no row covers (the editor warns about gaps).
export function tableGaps(rows, max){
  const gaps = [];
  for (let n = 1; n <= max; n++) if (!tableRow(rows, n)) gaps.push(n);
  return gaps;
}
