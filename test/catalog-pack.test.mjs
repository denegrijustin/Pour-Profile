import test from 'node:test';
import assert from 'node:assert/strict';
import { RESEARCH_CATALOG } from '../catalog-research.js';
import { refreshCatalog } from '../catalog-engine.js';
import { packCatalog, hydrateCatalog, lookupUrl } from '../catalog-pack.js';

const roundTrip = () => hydrateCatalog(JSON.parse(JSON.stringify(packCatalog(RESEARCH_CATALOG))));

test('packing is lossless: every record is identical, key for key and in order, after refresh', () => {
  const before = refreshCatalog(structuredClone(RESEARCH_CATALOG));
  const after = refreshCatalog(roundTrip());
  assert.equal(after.length, before.length);
  for (let i = 0; i < before.length; i++) {
    assert.equal(JSON.stringify(after[i]), JSON.stringify(before[i]), `record ${before[i].id} drifted`);
  }
});

test('packing does not mutate its input', () => {
  const snapshot = JSON.stringify(RESEARCH_CATALOG);
  packCatalog(RESEARCH_CATALOG);
  assert.equal(JSON.stringify(RESEARCH_CATALOG), snapshot);
});

test('the rebuilt lookup link matches the one the research export shipped, for every record', () => {
  for (const r of RESEARCH_CATALOG) assert.equal(r.image.lookup_url, lookupUrl(r.name), r.id);
});

test('packing actually removes what it claims to, and keeps real data', () => {
  const packed = packCatalog(RESEARCH_CATALOG);
  for (const p of packed) {
    assert.ok(!('visibility' in p) && !('lifecycle' in p), 'derived fields are not stored');
    assert.ok(!('last_verified' in p), 'null placeholders are not stored');
  }
  // Real data survives: a record that carries a source image keeps it.
  const withImage = { ...RESEARCH_CATALOG[0], image: { ...RESEARCH_CATALOG[0].image, primary_url: 'https://example.com/a.jpg', source_url: 'https://example.com/' } };
  const [p] = packCatalog([withImage]);
  assert.equal(p.image.primary_url, 'https://example.com/a.jpg');
  assert.equal(hydrateCatalog([p])[0].image.source_url, 'https://example.com/');
});
