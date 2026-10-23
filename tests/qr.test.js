import test from 'node:test';
import assert from 'node:assert/strict';
import { qrSvg, scannable } from '../src/util/qr.js';

test('an invite link becomes a QR code a phone can scan; links only this computer can open get none', () => {
  const svg = qrSvg('https://dread-delve.vercel.app/?join=WXYZ&ps=eyJob3N0Ijoi');
  assert.match(svg, /^<svg[^>]+viewBox="0 0 (\d+) \1"/);
  assert.match(svg, /<path d="M/);
  assert.equal(qrSvg(''), '');
  assert.equal(scannable('https://dread-delve.vercel.app/?join=WXYZ'), true);
  assert.equal(scannable('http://192.168.1.20:5173/?join=WXYZ'), true);   // the dev server on the home Wi-Fi
  for (const url of ['file:///C:/games/dread-delve.html?join=WXYZ', 'http://localhost:5173/?join=WXYZ', 'http://127.0.0.1:4173/dread-delve.html', ''])
    assert.equal(scannable(url), false, url);
});
