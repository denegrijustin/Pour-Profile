import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './harness.mjs';
import { checkDigit, parseBarcode, parseSizeMl, parseOffProduct, expandUpcE } from '../barcode.js';
import { RESEARCH_CATALOG } from '../catalog-research.js';

const withCheck = (body) => body + checkDigit(body);
const EAN13 = withCheck('501234567890');          // 13 digits
const UPCA = withCheck('08504400160');            // 12 digits
const UPCA_AS_EAN = '0' + UPCA;

// Mocks Open Food Facts. `responder(url)` returns a Response-ish object or throws.
function mockOff(responder) {
  const real = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    if (!String(url).includes('openfoodfacts')) throw new Error(`unexpected outbound fetch: ${url}`);
    return responder(String(url), init);
  };
  return { calls, restore: () => { globalThis.fetch = real; } };
}
const offHit = (product) => () => new Response(JSON.stringify({ status: 1, product }), { status: 200 });
const offMiss = () => new Response(JSON.stringify({ status: 0 }), { status: 404 });

async function withOff(responder, fn) {
  const mock = mockOff(responder);
  try { return await fn(mock); } finally { mock.restore(); }
}

const trips = async (t, fn) => { t.wire.trips = 0; const out = await fn(); return { out, trips: t.wire.trips }; };

test('checksums: EAN-13, UPC-A, EAN-8 and UPC-E validate; a flipped digit does not', () => {
  assert.equal(parseBarcode(EAN13).format, 'ean_13');
  assert.equal(parseBarcode(UPCA).format, 'upc_a');
  assert.equal(parseBarcode(UPCA).normalized, UPCA_AS_EAN, 'UPC-A is stored as 13-digit EAN');
  assert.equal(parseBarcode(withCheck('9638507')).format, 'ean_8');
  // Published UPC-E / UPC-A pair.
  assert.equal(expandUpcE('04252614'), '042100005264');
  const e = parseBarcode('04252614');
  assert.deepEqual([e.ok, e.format, e.normalized], [true, 'upc_e', '0042100005264']);

  const flipped = EAN13.slice(0, 12) + ((Number(EAN13[12]) + 1) % 10);
  assert.equal(parseBarcode(flipped).ok, false);
  assert.match(parseBarcode(flipped).error, /checksum/i);
  assert.equal(parseBarcode('12345').ok, false);
  assert.equal(parseBarcode('abc').ok, false);
  assert.equal(parseBarcode('').ok, false);
  assert.equal(parseBarcode(null).ok, false);
});

test('bottle sizes parse from Open Food Facts quantity strings', () => {
  assert.equal(parseSizeMl('750 ml'), 750);
  assert.equal(parseSizeMl('70 cl'), 700);
  assert.equal(parseSizeMl('1,75 L'), 1750);
  assert.equal(parseSizeMl('25.4 fl oz'), 751);
  assert.equal(parseSizeMl('a bottle'), null);
  assert.equal(parseOffProduct({ status: 0 }), null);
  assert.equal(parseOffProduct({ status: 1, product: { product_name: '  ' } }), null);
  assert.equal(parseOffProduct({ status: 1, product: { product_name: 'X', image_url: 'http://insecure/x.jpg' } }).image_url, null);
});

test('GET /api/barcodes rejects a bad checksum before touching D1 or the network', async () => {
  const t = setup();
  await withOff(offMiss, async (off) => {
    const bad = EAN13.slice(0, 12) + ((Number(EAN13[12]) + 1) % 10);
    const { out, trips: n } = await trips(t, () => t.call(`/api/barcodes/${bad}`));
    assert.equal(out.status, 400);
    assert.match(out.data.error, /checksum/i);
    assert.equal(n, 0);
    assert.equal(off.calls.length, 0);
    assert.equal((await t.call('/api/barcodes/12345')).status, 400);
  });
});

test('unknown code: OFF hit is cached into barcodes, so the repeat scan is one trip and no fetch', async () => {
  const t = setup();
  await t.call('/api/profiles');
  await withOff(offHit({ product_name: 'Test Rye Whiskey', brands: 'Test Distilling, Other', quantity: '750 ml', image_front_url: 'https://img.example/rye.jpg' }), async (off) => {
    const first = await trips(t, () => t.call(`/api/barcodes/${EAN13}`));
    assert.equal(first.out.status, 200);
    assert.equal(first.out.data.match, 'product');
    assert.equal(first.out.data.source, 'openfoodfacts');
    assert.equal(first.out.data.confidence, 'low');
    assert.equal(first.out.data.cached, false);
    assert.deepEqual(first.out.data.product, { name: 'Test Rye Whiskey', brand: 'Test Distilling', size_ml: 750, image_url: 'https://img.example/rye.jpg' });
    assert.equal(first.trips, 2, 'one read batch + one cache write');
    assert.equal(off.calls.length, 1);
    assert.match(off.calls[0], new RegExp(`/product/${EAN13}\\.json`));

    const row = t.db.prepare('SELECT * FROM barcodes WHERE barcode = ?').get(EAN13);
    assert.deepEqual([row.source, row.confidence, row.verified, row.product_name, row.size_ml], ['openfoodfacts', 'low', 0, 'Test Rye Whiskey', 750]);

    const again = await trips(t, () => t.call(`/api/barcodes/${EAN13}`));
    assert.equal(again.out.data.match, 'product');
    assert.equal(again.out.data.cached, true);
    assert.equal(again.trips, 1);
    assert.equal(off.calls.length, 1, 'cache hit must not call OFF again');
  });
});

test('a 12-digit UPC-A scan and its 13-digit EAN form are the same row', async () => {
  const t = setup();
  await withOff(offHit({ product_name: 'UPC Product' }), async (off) => {
    await t.call(`/api/barcodes/${UPCA}`);
    const again = await t.call(`/api/barcodes/${UPCA_AS_EAN}`);
    assert.equal(again.data.cached, true);
    assert.equal(off.calls.length, 1);
    assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM barcodes').get().n, 1);
  });
});

test('OFF miss and OFF outage both answer found:false without caching anything', async () => {
  const t = setup();
  await withOff(offMiss, async () => {
    const { out, trips: n } = await trips(t, () => t.call(`/api/barcodes/${EAN13}`));
    assert.equal(out.status, 200);
    assert.deepEqual([out.data.found, out.data.match, out.data.lookup], [false, null, 'miss']);
    assert.equal(n, 1, 'a miss is a single read trip');
  });
  await withOff(() => { throw new Error('network down'); }, async () => {
    const out = await t.call(`/api/barcodes/${EAN13}`);
    assert.equal(out.status, 200);
    assert.deepEqual([out.data.found, out.data.lookup], [false, 'unavailable']);
  });
  await withOff(() => new Response('', { status: 503 }), async () => {
    assert.equal((await t.call(`/api/barcodes/${EAN13}`)).data.lookup, 'unavailable');
  });
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM barcodes').get().n, 0);
});

test('POST /api/barcodes links a code to a bottle; lookup then needs one trip and no network', async () => {
  const t = setup();
  const bottle = (await t.call('/api/bottles', { name: 'Linked Bourbon', category: 'bourbon' })).data.bottle;
  await withOff(offMiss, async (off) => {
    const saved = await trips(t, () => t.call('/api/barcodes', { barcode: UPCA, bottle_id: bottle.id, size_ml: 750 }));
    assert.equal(saved.out.status, 201);
    assert.deepEqual(saved.out.data, { ok: true, barcode: UPCA_AS_EAN, format: 'upc_a', created: true, replaced: false,
      link: { bottle_id: bottle.id, catalog_id: null }, verified: true });
    assert.equal(saved.trips, 2, 'one read batch + one write batch');

    for (const spelling of [UPCA, UPCA_AS_EAN]) {
      const hit = await trips(t, () => t.call(`/api/barcodes/${spelling}`));
      assert.equal(hit.out.data.match, 'bottle');
      assert.equal(hit.out.data.bottle.id, bottle.id);
      assert.equal(hit.out.data.bottle.name, 'Linked Bourbon');
      assert.deepEqual([hit.out.data.source, hit.out.data.confidence, hit.out.data.verified], ['user', 'high', true]);
      assert.equal(hit.trips, 1);
    }
    assert.equal(off.calls.length, 0);
  });
  // The legacy per-bottle column is filled in for search-by-barcode.
  assert.equal(t.db.prepare('SELECT barcode FROM bottles WHERE id = ?').get(bottle.id).barcode, UPCA_AS_EAN);
});

test('saving over a cached OFF row upgrades it to a verified user link', async () => {
  const t = setup();
  const bottle = (await t.call('/api/bottles', { name: 'Real Name', category: 'bourbon' })).data.bottle;
  await withOff(offHit({ product_name: 'Wrong Grocery Name', quantity: '1 L' }), async () => {
    await t.call(`/api/barcodes/${EAN13}`);
  });
  const res = await t.call('/api/barcodes', { barcode: EAN13, bottle_id: bottle.id });
  assert.equal(res.status, 200);
  assert.deepEqual([res.data.created, res.data.replaced], [false, false]);
  const row = t.db.prepare('SELECT * FROM barcodes WHERE barcode = ?').get(EAN13);
  assert.deepEqual([row.bottle_id, row.source, row.verified, row.size_ml], [bottle.id, 'user', 1, 1000]);
});

test('catalog link resolves as a catalog match, then as the bottle once adopted', async () => {
  const t = setup();
  const rec = RESEARCH_CATALOG[0];
  await t.call('/api/profiles');
  await t.call('/api/catalog/browse');
  const saved = await t.call('/api/barcodes', { barcode: EAN13, catalog_id: rec.id });
  assert.equal(saved.status, 201);
  assert.deepEqual(saved.data.link, { bottle_id: null, catalog_id: rec.id });

  await withOff(offMiss, async (off) => {
    const before = await trips(t, () => t.call(`/api/barcodes/${EAN13}`));
    assert.equal(before.out.data.match, 'catalog');
    assert.equal(before.out.data.catalog.id, rec.id);
    assert.equal(before.out.data.bottle, null);
    assert.equal(before.trips, 1);

    const adopted = await t.call('/api/catalog/adopt', { catalog_id: rec.id });
    assert.equal(adopted.data.adopted, true);
    const after = await t.call(`/api/barcodes/${EAN13}`);
    assert.equal(after.data.match, 'bottle');
    assert.equal(after.data.bottle.id, adopted.data.bottle_id);
    assert.equal(after.data.catalog.id, rec.id);
    assert.equal(off.calls.length, 0);
  });

  // Linking by catalog id after adoption also records the adopted bottle.
  const other = withCheck('400638133393'.slice(0, 12));
  const again = await t.call('/api/barcodes', { barcode: other, catalog_id: rec.id });
  assert.equal(again.data.link.bottle_id > 0, true);
});

test('POST validation: checksum, target, unknown ids, mismatches and conflicts', async () => {
  const t = setup();
  const a = (await t.call('/api/bottles', { name: 'Bottle A', category: 'bourbon' })).data.bottle;
  const b = (await t.call('/api/bottles', { name: 'Bottle B', category: 'bourbon' })).data.bottle;
  const badCode = EAN13.slice(0, 12) + ((Number(EAN13[12]) + 1) % 10);

  const noTrips = await trips(t, () => t.call('/api/barcodes', { barcode: badCode, bottle_id: a.id }));
  assert.equal(noTrips.out.status, 400);
  assert.equal(noTrips.trips, 0, 'rejected before any D1 call');
  assert.equal((await t.call('/api/barcodes', { barcode: EAN13 })).status, 400);
  assert.equal((await t.call('/api/barcodes', { barcode: EAN13, bottle_id: 'x' })).status, 400);
  assert.equal((await t.call('/api/barcodes', { barcode: EAN13, bottle_id: 99999 })).status, 404);
  assert.equal((await t.call('/api/barcodes', { barcode: EAN13, catalog_id: 'no-such-record' })).status, 404);

  assert.equal((await t.call('/api/barcodes', { barcode: EAN13, bottle_id: a.id })).status, 201);
  assert.equal((await t.call('/api/barcodes', { barcode: EAN13, bottle_id: a.id })).status, 200, 'same link again is idempotent');

  const conflict = await t.call('/api/barcodes', { barcode: EAN13, bottle_id: b.id });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.data.existing.bottle_id, a.id);
  const replaced = await t.call('/api/barcodes', { barcode: EAN13, bottle_id: b.id, replace: true });
  assert.equal(replaced.status, 200);
  assert.deepEqual([replaced.data.replaced, replaced.data.link.bottle_id], [true, b.id]);
});

test('a bottle that already carries the code in bottles.barcode still resolves', async () => {
  const t = setup();
  const bottle = (await t.call('/api/bottles', { name: 'Legacy Bottle', category: 'bourbon', barcode: UPCA })).data.bottle;
  await withOff(offMiss, async (off) => {
    for (const spelling of [UPCA, UPCA_AS_EAN]) {
      const { out, trips: n } = await trips(t, () => t.call(`/api/barcodes/${spelling}`));
      assert.equal(out.data.match, 'bottle');
      assert.equal(out.data.bottle.id, bottle.id);
      assert.equal(n, 1);
    }
    assert.equal(off.calls.length, 0);
  });
});

test('barcode endpoints stay inside D1 limits with a large collection and report Server-Timing', async () => {
  const t = setup();
  for (let i = 0; i < 150; i++) t.db.prepare("INSERT INTO bottles (name, brand, category) VALUES (?, 'Bulk', 'bourbon')").run(`Bulk ${i}`);
  const target = t.db.prepare("SELECT id FROM bottles WHERE name = 'Bulk 149'").get().id;
  await t.call('/api/barcodes', { barcode: EAN13, bottle_id: target });
  await withOff(offMiss, async () => {
    t.wire.maxParams = 0;
    const res = await t.call(`/api/barcodes/${EAN13}`);
    assert.equal(res.data.bottle.id, target);
    await t.call(`/api/barcodes/${UPCA}`);
    assert.ok(t.wire.maxParams <= 3, `barcode lookups bind a handful of params, saw ${t.wire.maxParams}`);
    assert.match(res.headers.get('server-timing'), /db;dur=\d+;desc="1 trips \/ 2 statements"/);
  });
});
