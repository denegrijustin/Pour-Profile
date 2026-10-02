import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './harness.mjs';
import { QUESTIONS } from '../pour-model.js';

const answers = (category, i = 7, e = 5) => Object.fromEntries(QUESTIONS[category].map((q) => [q.id, { intensity: i, enjoyment: e }]));

// Latency here is dominated by D1 round trips, not SQL, so each read endpoint gets a
// trip budget. A regression that reintroduces an await-chain shows up as a failed
// assertion rather than as a slow page weeks later.
async function seeded() {
  const t = setup();
  const { call } = t;
  for (const [name, category, rating, profile] of [['Budget Bourbon', 'bourbon', 9, 'jdad'], ['Budget Wine', 'wine', 8, 'lady']]) {
    const b = (await call('/api/bottles', { name, category }, profile)).data.bottle;
    await call('/api/tastings', { bottle_id: b.id, rating, questionnaire_answers: answers(category) }, profile);
  }
  await call('/api/profiles');            // warm the profile cache and the catalog,
  await call('/api/catalog/browse');      // so the budgets measure steady state
  return t;
}

const trips = async (t, path, body) => {
  t.wire.trips = 0;
  const res = await t.call(path, body);
  assert.ok(res.status < 400, `${path} -> ${res.status} ${JSON.stringify(res.data).slice(0, 120)}`);
  return t.wire.trips;
};

test('read endpoints each cost a single D1 round trip once warm', async () => {
  const t = await seeded();
  const id = (await t.call('/api/bottles')).data.bottles[0].id;
  const budget = {
    '/api/stats': 1,
    '/api/palate': 1,
    '/api/bottles': 1,
    '/api/bottles?sort=highest_match': 1,
    [`/api/bottles/${id}`]: 1,
    '/api/catalog/recommended': 1,
    '/api/catalog/browse?limit=200': 1,
    '/api/profile/full': 1,
    '/api/profiles': 0
  };
  for (const [path, max] of Object.entries(budget)) {
    assert.ok(await trips(t, path) <= max, `${path} exceeded ${max} trip(s)`);
  }
  assert.ok(await trips(t, '/api/match', { candidate: { flavorTags: ['vanilla'], proof: 90, category: 'bourbon' } }) <= 1);
});

test('every API response reports its database cost in Server-Timing', async () => {
  const t = await seeded();
  const res = await t.call('/api/stats');
  const timing = res.headers.get('server-timing');
  assert.match(timing, /db;dur=\d+;desc="1 trips \/ 7 statements"/);
  assert.match(timing, /total;dur=\d+/);
});

test('collections past D1\'s 100-parameter limit still list, open and match', async () => {
  const t = await seeded();
  const { db, call } = t;
  const insertBottle = db.prepare("INSERT INTO bottles (name, brand, category) VALUES (?, ?, 'bourbon')");
  const tagId = db.prepare('SELECT id FROM flavor_tags LIMIT 1').get().id;
  const link = db.prepare('INSERT INTO bottle_flavor_tags (bottle_id, flavor_tag_id) VALUES (?, ?)');
  for (let i = 0; i < 160; i++) link.run(Number(insertBottle.run(`Bulk ${i}`, `Brand ${i}`).lastInsertRowid), tagId);

  const list = await call('/api/bottles');
  assert.equal(list.status, 200);
  assert.ok(list.data.bottles.length >= 160);
  assert.ok(list.data.bottles.filter((b) => b.name.startsWith('Bulk')).every((b) => b.flavor_tags.length === 1));

  const one = await call(`/api/bottles/${list.data.bottles.find((b) => b.name === 'Bulk 7').id}`);
  assert.equal(one.status, 200);

  const browse = await call('/api/catalog/browse?limit=200');
  assert.equal(browse.status, 200);
  assert.ok(browse.data.results.length > 100, 'browse must be able to return more than 100 results');

  const match = await call('/api/match', { bottleId: list.data.bottles[0].id });
  assert.equal(match.status, 200);
});

test('flavor tags keep a stable, explicit order', async () => {
  const t = await seeded();
  const { db, call } = t;
  const b = Number(db.prepare("INSERT INTO bottles (name, category) VALUES ('Ordered', 'bourbon')").run().lastInsertRowid);
  const ids = db.prepare('SELECT id FROM flavor_tags ORDER BY id DESC LIMIT 4').all().map((r) => r.id);
  // Insert deliberately out of id order; the API must still answer in flavor_tag_id order.
  for (const id of [ids[1], ids[3], ids[0], ids[2]]) db.prepare('INSERT INTO bottle_flavor_tags (bottle_id, flavor_tag_id) VALUES (?, ?)').run(b, id);
  const expected = db.prepare(`SELECT ft.name FROM bottle_flavor_tags bft JOIN flavor_tags ft ON ft.id = bft.flavor_tag_id WHERE bft.bottle_id = ? ORDER BY bft.flavor_tag_id`).all(b).map((r) => r.name);
  const viaList = (await call('/api/bottles')).data.bottles.find((x) => x.id === b).flavor_tags;
  const viaDetail = (await call(`/api/bottles/${b}`)).data.bottle.flavor_tags;
  assert.deepEqual(viaList, expected);
  assert.deepEqual(viaDetail, expected);
});

test('optional trailing statements never shift results for the lady profile', async () => {
  // Profile 1 appends a brand-signals query to some batches; profile 2 does not. A
  // misaligned destructure would show up as wrong liked/disliked lists or a crash.
  const t = await seeded();
  const id = (await t.call('/api/bottles', null, 'lady')).data.bottles[0].id;
  for (const profile of ['jdad', 'lady']) {
    const res = await t.call(`/api/bottles/${id}`, null, profile);
    assert.equal(res.status, 200, profile);
    assert.ok(Array.isArray(res.data.tastings));
    assert.equal(typeof res.data.match, 'object');
    assert.equal((await t.call('/api/match', { bottleId: id }, profile)).status, 200, profile);
  }
});
