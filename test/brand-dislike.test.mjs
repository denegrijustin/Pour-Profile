import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './harness.mjs';

// Justin (profile 1) does not like Jack Daniel's: migration 0012 records it, and the Worker has to honor it.
test("Jack Daniel's is never recommended, and says why where it still shows up", async () => {
  const t = setup();
  const picks = await t.call('/api/catalog/recommended');
  assert.ok(!picks.data.results.some((r) => /jack daniel/i.test(r.producer || r.name)), "not among the recommended");

  const browse = await t.call('/api/catalog/browse?scope=local&limit=200');
  const jack = browse.data.results.filter((r) => /jack daniel/i.test(r.producer || ''));
  assert.ok(jack.length >= 8, "still findable in the local-store list");
  for (const r of jack) {
    assert.ok(r.jd_fit <= 40, `${r.name} stays below the recommendation threshold`);
    assert.match(r.concern, /don't like Jack Daniel's/);
  }
});

test("another bottle from a different brand keeps its normal fit", async () => {
  const t = setup();
  const browse = await t.call('/api/catalog/browse?limit=200');
  assert.ok(browse.data.results.some((r) => !/jack daniel|four roses/i.test(r.producer || '') && r.jd_fit > 40), "unrelated brands are not capped");
});
