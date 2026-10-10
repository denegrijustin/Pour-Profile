import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup } from './harness.mjs';
import { buildKansas, isStorePick, isGiftPack, titleCase, classify } from '../tools/build-kansas.mjs';

const SNAP = JSON.parse(readFileSync(new URL('../data/kansas/registry.json', import.meta.url), 'utf8'));
const ITEMS = buildKansas(SNAP);

test('registry snapshot builds into unique, categorized items', () => {
  assert.ok(ITEMS.length > 5000);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  const cats = new Set(ITEMS.map((i) => i.category));
  for (const c of ['bourbon', 'rye', 'american_whiskey', 'tequila', 'mezcal', 'rum', 'gin', 'cognac', 'sauvignon_blanc']) assert.ok(cats.has(c), c);
  // Core bottles that were missed when "KSBW" labels were not recognized as bourbon.
  assert.ok(ITEMS.some((i) => i.category === 'bourbon' && /^Knob Creek Aged 9 Years/.test(i.name)));
  // A few registrations list no distributor; nearly all should.
  assert.ok(ITEMS.filter((i) => i.distributors.length).length / ITEMS.length > 0.97);
  for (const i of ITEMS) if (i.abv != null) assert.ok(i.abv > 0 && i.abv < 100, i.name);
});

test('store picks, gift packs and cocktails are recognized', () => {
  assert.ok(isStorePick('CASK STRENGTH SINGLE BARREL SELECT KSBW SALINA LIQUOR SALINA WHOLESALE LIQUOR'));
  assert.ok(isStorePick('STRAIGHT WHEAT WHISKEY SINGLE BARREL SELECTED BY RANCHMART'));
  assert.ok(!isStorePick('SINGLE BARREL SELECT TENNESSEE WHISKEY'));      // Jack Daniel's product name
  assert.ok(!isStorePick('AGED 9 YEARS SINGLE BARREL RESERVE KSBW'));
  assert.ok(isGiftPack('SINGLE BARREL SELECT TENNESSEE WHISKEY W/ SNIFTER GLASS VAP'));
  assert.ok(!ITEMS.some((i) => /Old Fashioned Crafted With/i.test(i.name)));
  assert.equal(classify('american_whiskey', '1792', 'BOTTLED IN BOND KSBW'), 'bourbon');
  assert.equal(titleCase("MAKER'S MARK 46"), "Maker's Mark 46");
});

test('drink search reaches Kansas-registered bottles and adding one creates a bottle', async () => {
  const t = setup();
  // "Knob Creek 18" is already a catalog record, so it is not repeated from the Kansas list.
  const dup = await t.call('/api/drinks/search?q=knob creek 18');
  assert.equal(dup.data.results.filter((r) => /18/.test(r.name)).length, 1);
  const s = await t.call('/api/drinks/search?q=knob creek 21');
  const ks = s.data.results.find((r) => r.kind === 'kansas');
  assert.ok(ks, JSON.stringify(s.data.results.map((r) => r.name)));
  assert.ok(ks.distributors.length);
  const add = await t.call('/api/drinks/adopt', { id: ks.id, kind: 'kansas' });
  assert.equal(add.status, 200);
  const b = (await t.call(`/api/bottles/${add.data.bottle_id}`)).data.bottle;
  assert.equal(b.category, 'bourbon');
  assert.equal(b.data_source, 'kansas_registry');
  const again = await t.call('/api/drinks/adopt', { id: ks.id, kind: 'kansas' });
  assert.equal(again.data.already_present, true);
  assert.equal(again.data.bottle_id, add.data.bottle_id);
});

test('Kansas search filters by category, hides gift packs, lists store picks last', async () => {
  const t = setup();
  const r = await t.call('/api/kansas/search?q=knob creek&category=bourbon');
  assert.ok(r.data.results.length > 3);
  assert.ok(r.data.results.every((x) => x.category === 'bourbon'));
  const firstPick = r.data.results.findIndex((x) => x.store_pick);
  if (firstPick >= 0) assert.ok(r.data.results.slice(firstPick).every((x) => x.store_pick));
  const all = await t.call('/api/kansas/search?q=jack daniel single barrel');
  assert.ok(!all.data.results.some((x) => /W\/|Vap\b/i.test(x.name)));
  assert.ok(r.data.source.includes('kdor.ks.gov'));
  const wine = await t.call('/api/kansas/search?q=sauvignon blanc&category=sauvignon_blanc');
  assert.ok(wine.data.results.length > 10);
});

test('researched Kansas bottles join the catalog with notes, availability and their own recommendation pool', async () => {
  const t = setup();
  const tequila = await t.call('/api/catalog/browse?category=tequila&limit=200');
  assert.ok(tequila.data.total >= 25, `only ${tequila.data.total} tequilas`);
  const withNotes = tequila.data.results.filter((r) => r.expert);
  assert.ok(withNotes.length >= 20);
  assert.ok(tequila.data.results.filter((r) => r.data_source === "kansas_registry").every((r) => r.kansas && r.kansas.distributors.length));
  assert.ok(tequila.data.results.some((r) => r.photo_reference && r.local_store));
  for (const c of ['mezcal', 'rum', 'gin', 'cognac', 'sauvignon_blanc', 'bourbon']) assert.ok(tequila.data.categories.includes(c), c);
  // Original records that are registered in Kansas are flagged too.
  const bourbon = await t.call('/api/catalog/browse?category=bourbon&limit=200');
  assert.ok(bourbon.data.results.some((r) => r.id === 'knob-creek-12-year' && r.kansas));
  const item = await t.call('/api/catalog/item/' + withNotes[0].id);
  assert.equal(item.status, 200);
  assert.ok(item.data.expert);
});

test('recommendation pools are per family', async () => {
  const { categoryFamily } = await import('../catalog-engine.js');
  assert.equal(categoryFamily('mezcal'), 'agave');
  assert.equal(categoryFamily('rye'), 'whiskey');
  assert.equal(categoryFamily('armagnac'), 'brandy');
  assert.equal(categoryFamily('sauvignon_blanc'), 'wine');
  assert.equal(categoryFamily('gin'), 'gin');
});
