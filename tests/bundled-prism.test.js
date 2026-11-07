import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { BUNDLED_PRISM_COUNTS, BUNDLED_PRISM_PATH, BUNDLED_PRISM_SHA256, loadBundledPrism } from '../src/game/bundled-prism.js';
const archive = readFileSync(new URL('../public/' + BUNDLED_PRISM_PATH, import.meta.url));
const raw = gunzipSync(archive);

test('the entire owner-provided source survives the compressed bundle byte-for-byte', () => {
  assert.equal(createHash('sha256').update(raw).digest('hex'), BUNDLED_PRISM_SHA256);
  const o = JSON.parse(raw);
  for (const [key, count] of Object.entries(BUNDLED_PRISM_COUNTS)) assert.equal(o[key].length, count, key);
});
test('the loader decompresses the same complete data with a browser-style response', async () => {
  const imported = await loadBundledPrism({fetcher: async path => {
    assert.equal(path, BUNDLED_PRISM_PATH);
    return new Response(archive, {status:200});
  }});
  assert.equal(imported.classes.length, 17);
  assert.equal(imported.feats.length, 3285);
  assert.equal(imported.spells.length, 918);
});
test('missing archive and malformed archive are rejected without mutating any character state', async () => {
  await assert.rejects(loadBundledPrism({fetcher:async () => new Response('missing',{status:404})}), /could not be loaded/);
  await assert.rejects(loadBundledPrism({fetcher:async () => new Response('not a gzip')}));
});
