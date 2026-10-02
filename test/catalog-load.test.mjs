// Runs in its own process (node --test isolates files), and the failure case comes
// first on purpose: the loader memoizes success for the life of the isolate, so a
// failing load can only be observed before any successful one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './harness.mjs';

test('a missing catalog asset fails the request clearly and is retried, not cached', async () => {
  const { env, call } = setup();
  const realAssets = env.ASSETS;
  env.ASSETS = { async fetch() { return new Response('nope', { status: 404 }); } };

  const broken = await call('/api/catalog/recommended');
  assert.equal(broken.status, 500);
  assert.match(broken.data.error, /Catalog unavailable/);

  // Same isolate, asset now available: the earlier failure must not have been memoized.
  env.ASSETS = realAssets;
  const healed = await call('/api/catalog/recommended');
  assert.equal(healed.status, 200);
  assert.ok(Array.isArray(healed.data.results));
});

test('the catalog is fetched once per isolate, then served from memory', async () => {
  const { env, call } = setup();
  let fetches = 0;
  const realAssets = env.ASSETS;
  env.ASSETS = { async fetch(req) { fetches++; return realAssets.fetch(req); } };
  await call('/api/catalog/browse');
  await call('/api/catalog/search?q=penelope');
  await call('/api/catalog/recommended');
  assert.equal(fetches, 0, 'already loaded by the previous test in this isolate');
});
