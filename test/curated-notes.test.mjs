import test from "node:test";
import assert from "node:assert/strict";
import { CURATED_NOTES, curatedNote, curatedImageSources } from "../curated-notes.js";
import { RESEARCH_CATALOG } from "../catalog-research.js";
import { isSearchEnginePage } from "../image-enrich.js";

const byId = new Map(RESEARCH_CATALOG.map((r) => [r.id, r]));

test("every curated key matches a real catalog record", () => {
  const orphans = Object.keys(CURATED_NOTES).filter((id) => !byId.has(id));
  assert.deepEqual(orphans, [], `curated notes keyed to nonexistent catalog ids: ${orphans.join(", ")}`);
});

test("curated notes carry descriptors, not empty shells", () => {
  for (const [id, n] of Object.entries(CURATED_NOTES)) {
    assert.ok(n.nose?.length, `${id} has no nose descriptors`);
    assert.ok(n.palate?.length, `${id} has no palate descriptors`);
    assert.ok(n.finish?.length, `${id} has no finish descriptors`);
  }
});

test("every note is attributed to at least one source", () => {
  for (const [id, n] of Object.entries(CURATED_NOTES)) {
    assert.ok(n.sources?.length, `${id} has no sources`);
    for (const s of n.sources) {
      assert.ok(/^https?:\/\//.test(s.url), `${id} source url is not absolute: ${s.url}`);
      assert.ok(s.title, `${id} has a source with no title`);
    }
    assert.ok(["producer", "press", "aggregate"].includes(n.source_type), `${id} has an unknown source_type`);
  }
});

test("product urls are real pages, never search-engine links", () => {
  // The whole reason the image pass found nothing before: all 317 catalog URLs
  // were Bing image-search links, which are unscrapeable by design.
  for (const { id, url } of curatedImageSources()) {
    assert.ok(/^https?:\/\//.test(url), `${id} product_url is not absolute`);
    assert.equal(isSearchEnginePage(url), false, `${id} product_url is a search engine page`);
  }
});

test("wine notes declare which vintage they describe", () => {
  for (const [id, n] of Object.entries(CURATED_NOTES)) {
    const rec = byId.get(id);
    if (rec?.category !== "sauvignon_blanc") continue;
    // Vintage-free is allowed only when explicitly flagged as house style, so a
    // missing vintage can never be mistaken for a claim about a specific year.
    assert.ok(n.vintage != null || n.house_style === true,
      `${id} is a wine with neither a vintage nor a house_style flag`);
  }
});

test("curatedNote returns null for unknown ids rather than throwing", () => {
  assert.equal(curatedNote("not-a-real-bottle"), null);
  assert.ok(curatedNote("old-forester-1910"));
});

test("the shortlist covers both profiles", () => {
  const cats = Object.keys(CURATED_NOTES).map((id) => byId.get(id).category);
  assert.ok(cats.filter((c) => c === "sauvignon_blanc").length >= 8, "wine is under-covered");
  assert.ok(cats.filter((c) => c !== "sauvignon_blanc").length >= 8, "whiskey is under-covered");
});
