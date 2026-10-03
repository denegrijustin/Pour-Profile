import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup } from './harness.mjs';
import { RESEARCH_CATALOG } from '../catalog-research.js';
import { classifyTerm, termsToTags, criticSummary, explainFromNotes, axisTargets, linkCatalogRecord, expertBrief } from '../expert-match.js';
import { cleanEntry } from '../tools/merge-notes.mjs';
import { FLAVOR_TAGS } from '../flavor-taxonomy.js';

const NOTES = JSON.parse(readFileSync(new URL('../data/expert-notes.json', import.meta.url), 'utf8'));
const isUrl = (u) => typeof u === 'string' && /^https?:\/\/\S+\.\S+/.test(u);

// ---------- the data itself ----------

test('every catalog record has an entry, and every claim carries a source link', () => {
  assert.equal(Object.keys(NOTES).length, RESEARCH_CATALOG.length);
  for (const r of RESEARCH_CATALOG) assert.ok(NOTES[r.id], `missing ${r.id}`);
  for (const [id, e] of Object.entries(NOTES)) {
    assert.ok(['high', 'medium', 'low', 'none'].includes(e.confidence), id);
    if (e.producer) assert.ok(isUrl(e.producer.source_url), `${id} producer source`);
    if (e.facts) assert.ok(isUrl(e.facts.source_url), `${id} facts source`);
    for (const c of e.critics) {
      assert.ok(isUrl(c.source_url) && c.source, `${id} critic source`);
      if (c.score != null) assert.ok(c.scale && c.score <= Number(c.scale) && c.score >= 0, `${id} ${c.source} ${c.score}/${c.scale}`);
    }
    if (e.confidence === 'none') { assert.equal(e.producer, null, id); assert.equal(e.critics.length, 0, id); }
    else assert.ok(e.producer || e.critics.length, `${id} claims ${e.confidence} with nothing behind it`);
  }
});

test('confidence reflects what survived validation, not what a researcher claimed', () => {
  const { entry, issues } = cleanEntry({
    id: 'x', confidence: 'high',
    producer: { nose: 'vanilla', palate: null, finish: null, summary: null, source_url: null },
    critics: [
      { source: 'Mag', source_url: 'https://mag.example.com/r', score: 120, scale: '100', summary: 'ok' },
      { source: 'NoLink', source_url: '', score: 90, scale: '100' }
    ],
    facts: { abv: 45, source_url: null }, flavor_terms: ['Vanilla', 'vanilla', 'oak'], notes: null
  });
  assert.equal(entry.producer, null);              // notes without a source are dropped
  assert.equal(entry.critics.length, 1);           // critic without a link is dropped
  assert.equal(entry.critics[0].score, null);      // 120/100 is impossible -> dropped
  assert.equal(entry.facts, null);
  assert.equal(entry.confidence, 'medium');
  assert.deepEqual(entry.flavor_terms, ['vanilla', 'oak']);
  assert.ok(issues.length >= 3);
});

// ---------- turning descriptors into signals ----------

test('descriptors map onto the app flavor vocabulary', () => {
  const tags = new Set(FLAVOR_TAGS.map(([t]) => t));
  for (const term of ['dark cherry', 'toffee', 'black pepper', 'cut grass', 'passion fruit', 'pecan', 'dark chocolate']) {
    const { tag } = classifyTerm(term);
    assert.ok(tag && tags.has(tag), `${term} -> ${tag}`);
  }
  assert.equal(classifyTerm('dark cherry').tag, 'dark_cherry');   // not plain cherry
  assert.equal(classifyTerm('cough syrup').tag, 'medicinal_cherry');
  assert.deepEqual(classifyTerm('wet stone').axes, ['minerality']);
  assert.deepEqual(termsToTags(['vanilla', 'vanilla bean', 'caramel']), ['vanilla', 'caramel']);
});

test('critic scores on different scales are never blended into one average', () => {
  const cs = criticSummary([
    { score: 92, scale: '100' }, { score: 88, scale: '100' }, { score: 17, scale: '20' }, { score: 4, scale: '5' }, { score: null, scale: null }
  ]);
  assert.equal(cs.avg100, 90);
  assert.equal(cs.n100, 2);
  assert.equal(cs.scored, 4);
  assert.equal(cs.count, 5);
});

test('fit explanation names liked and disliked flavors the sources describe', () => {
  const expert = { confidence: 'high', critics: [], producer: { nose: 'x' }, flavor_terms: ['toffee', 'dark cherry', 'cough syrup', 'vanilla'] };
  const palate = {
    toffee: { affinity: 85, confidence: 'high' }, vanilla: { affinity: 70, confidence: 'medium' },
    medicinal_cherry: { affinity: 15, confidence: 'high' }
  };
  const out = explainFromNotes(expert, { palate, category: 'bourbon' });
  assert.match(out.reasons[0], /toffee/);
  assert.ok(out.concerns.some((c) => /medicinal cherry/.test(c)));
  assert.ok(out.signal != null && out.signal > -1 && out.signal < 1);
  // Nothing sourced -> nothing claimed.
  assert.deepEqual(explainFromNotes({ confidence: 'none', flavor_terms: ['toffee'] }, { palate }).reasons, []);
});

test('wine notes are judged against the axes this person enjoys', () => {
  const evidence = [
    { category: 'wine', rating: 9, dimensions: { herbal: 2, fruit: 8 }, enjoyment: { herbal: 4, fruit: 5 } },
    { category: 'wine', rating: 8, dimensions: { herbal: 3, fruit: 7 }, enjoyment: { herbal: 4, fruit: 4 } }
  ];
  const targets = axisTargets(evidence, 'wine');
  assert.equal(targets.fruit.target, 7.5);
  const grassy = { confidence: 'high', flavor_terms: ['cut grass', 'green pepper', 'herbaceous', 'lime'] };
  const out = explainFromNotes(grassy, { targets, category: 'wine' });
  assert.ok(out.concerns.some((c) => /herbal/.test(c)), JSON.stringify(out));
});

test('saved bottles link to catalog records conservatively', () => {
  const recs = RESEARCH_CATALOG;
  assert.equal(linkCatalogRecord(recs, { name: 'Eagle Rare 10' }).record.id, 'eagle-rare-10-year');
  assert.equal(linkCatalogRecord(recs, { name: 'Penelope Toasted' }).how, 'name');
  assert.equal(linkCatalogRecord(recs, { name: 'Rittenhouse Rye' }).how, 'close');
  assert.equal(linkCatalogRecord(recs, { name: 'Weller' }), null);          // many Wellers: no guess
  assert.equal(linkCatalogRecord(recs, { name: 'Something Unknown' }), null);
  assert.equal(linkCatalogRecord(recs, { name: 'whatever', catalog_id: 'stagg' }).how, 'linked');
});

// ---------- end to end through the Worker ----------

test('catalog cards carry a critic/notes brief, and the detail endpoint returns the full notes in one trip', async () => {
  const t = setup();
  const browse = await t.call('/api/catalog/browse?limit=400');
  const withBrief = browse.data.results.filter((r) => r.expert);
  assert.ok(withBrief.length >= browse.data.results.length * 0.75, `only ${withBrief.length} of ${browse.data.results.length} cards have notes`);
  const sample = withBrief[0];
  assert.deepEqual(Object.keys(sample.expert).sort(), ['confidence', 'critic_avg', 'critic_avg_n', 'critic_count', 'flavor_terms']);

  await t.call('/api/profiles');
  t.wire.trips = 0;
  const item = await t.call('/api/catalog/item/penelope-toasted-bourbon');
  assert.equal(item.status, 200);
  assert.equal(t.wire.trips, 1);
  assert.equal(item.data.item.id, 'penelope-toasted-bourbon');
  assert.ok(item.data.expert.producer || item.data.expert.critics.length);
  assert.ok(item.data.expert.critics.every((c) => isUrl(c.source_url)));
  assert.equal((await t.call('/api/catalog/item/not-a-real-bottle')).status, 404);
});

test('a saved bottle page includes its cited notes and still costs one trip', async () => {
  const t = setup();
  const id = t.db.prepare("SELECT id FROM bottles WHERE name = 'Eagle Rare 10'").get().id;
  await t.call(`/api/bottles/${id}`);          // warm
  t.wire.trips = 0;
  const res = await t.call(`/api/bottles/${id}`);
  assert.equal(t.wire.trips, 1);
  assert.equal(res.data.catalog_link.id, 'eagle-rare-10-year');
  assert.deepEqual(res.data.expert, (() => { const { notes, corrected, ...e } = NOTES['eagle-rare-10-year']; return { ...e, caveat: notes || null }; })());
  assert.ok(Array.isArray(res.data.notes_match.reasons));
  const unknown = (await t.call('/api/bottles', { name: 'Totally Unknown Hooch', category: 'bourbon' })).data.bottle;
  const r2 = await t.call(`/api/bottles/${unknown.id}`);
  assert.equal(r2.data.expert, null);
  assert.equal(r2.data.notes_match, null);
});

test('expertBrief is null when nothing reliable was found', () => {
  assert.equal(expertBrief(null), null);
  assert.equal(expertBrief({ confidence: 'none', critics: [] }), null);
});
