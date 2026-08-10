import test from "node:test";
import assert from "node:assert/strict";
import {
  tokens, isSearchEnginePage, scoreNameMatch, extractImageCandidates,
  scorePageCandidates, searchOpenFoodFacts, gatherCandidates, enrichOne, downloadImage
} from "../image-enrich.js";

const REC = { id: "angels-envy-rye", name: "Angel's Envy Rye", producer: "Angel's Envy" };

function jsonResponse(body) {
  return {
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => body
  };
}
function imageResponse(bytes, mime = "image/jpeg") {
  return {
    ok: true,
    headers: { get: (h) => (h.toLowerCase() === "content-type" ? mime : null) },
    arrayBuffer: async () => new Uint8Array(bytes).buffer
  };
}
function offProducts(products) {
  return (url) => {
    if (String(url).includes("openfoodfacts")) return Promise.resolve(jsonResponse({ products }));
    return Promise.resolve(imageResponse([1, 2, 3, 4]));
  };
}

test("category words carry no identifying signal and are dropped", () => {
  assert.deepEqual(tokens("Kentucky Straight Bourbon Whiskey"), []);
  assert.deepEqual(tokens("Angel's Envy Rye"), ["angel", "envy", "rye"]);
});

test("bing lookup links are recognised as search engines, real hosts are not", () => {
  assert.equal(isSearchEnginePage("https://www.bing.com/images/search?q=Penelope+Toasted"), true);
  assert.equal(isSearchEnginePage("https://www.google.com/search?q=x"), true);
  assert.equal(isSearchEnginePage("https://angelsenvy.com/products/rye"), false);
  assert.equal(isSearchEnginePage("not a url"), false);
});

test("a different expression of the same brand does not score as a match", () => {
  const right = scoreNameMatch("Angel's Envy Rye", "Angel's Envy", "Angel's Envy Rye Whiskey");
  const wrong = scoreNameMatch("Angel's Envy Rye", "Angel's Envy", "Angel's Envy Bourbon");
  assert.ok(right.coverage === 1, `expected full coverage, got ${right.coverage}`);
  assert.ok(wrong.coverage < 0.8, `wrong expression should fall under the coverage floor, got ${wrong.coverage}`);
});

test("a more specific bottle than we asked for is penalised on precision", () => {
  const exact = scoreNameMatch("Eagle Rare", "Buffalo Trace", "Buffalo Trace Eagle Rare");
  const older = scoreNameMatch("Eagle Rare", "Buffalo Trace", "Buffalo Trace Eagle Rare 17 Year Antique Collection");
  assert.ok(older.score < exact.score, "extra distinguishing words must lower the score");
});

test("scoring is empty-safe rather than throwing", () => {
  assert.deepEqual(scoreNameMatch("", "", "anything"), { score: 0, coverage: 0, precision: 0 });
  assert.deepEqual(scoreNameMatch("Something", "", ""), { score: 0, coverage: 0, precision: 0 });
});

test("logos, sprites and svgs are never offered as bottle photos", () => {
  const html = `
    <img src="/assets/logo.svg" alt="Angel's Envy">
    <img src="/assets/site-sprite.png" alt="sprite">
    <img src="/media/angels-envy-rye.jpg" alt="Angel's Envy Rye bottle">`;
  const got = extractImageCandidates(html, "https://angelsenvy.com/p");
  assert.deepEqual(got.map((c) => c.url), ["https://angelsenvy.com/media/angels-envy-rye.jpg"]);
});

test("json-ld and og:image are extracted and absolutised", () => {
  const html = `
    <meta property="og:image" content="/img/hero.jpg">
    <script type="application/ld+json">{"@type":"Product","name":"Angel's Envy Rye","image":["https://cdn.x/ae-rye.jpg"]}</script>`;
  const got = extractImageCandidates(html, "https://angelsenvy.com/p");
  const urls = got.map((c) => c.url);
  assert.ok(urls.includes("https://angelsenvy.com/img/hero.jpg"), "og:image should be resolved against the base URL");
  assert.ok(urls.includes("https://cdn.x/ae-rye.jpg"));
  assert.equal(got.find((c) => c.origin === "json-ld").alt, "Angel's Envy Rye");
});

test("page candidates rank the product slug above an unrelated hero shot", () => {
  const scored = scorePageCandidates([
    { url: "https://cdn.x/holiday-hero.jpg", origin: "og:image", alt: "Happy holidays" },
    { url: "https://cdn.x/angels-envy-rye.jpg", origin: "img", alt: "" }
  ], REC);
  assert.equal(scored[0].url, "https://cdn.x/angels-envy-rye.jpg");
});

test("open food facts products without an image are dropped, not scored as zero", async () => {
  const got = await searchOpenFoodFacts(REC, {
    fetchImpl: offProducts([
      { product_name: "Angel's Envy Rye", brands: "Angel's Envy" },          // no image
      { product_name: "Angel's Envy Rye", brands: "Angel's Envy", image_front_url: "https://off/ae-rye.jpg" }
    ])
  });
  assert.equal(got.length, 1);
  assert.equal(got[0].url, "https://off/ae-rye.jpg");
});

test("a bing-only record is never scraped as if it were a product page", async () => {
  const rec = { ...REC, image: { lookup_url: "https://www.bing.com/images/search?q=Angels+Envy+Rye" } };
  const seen = [];
  await gatherCandidates(rec, {
    fetchImpl: (url) => { seen.push(String(url)); return Promise.resolve(jsonResponse({ products: [] })); }
  });
  assert.ok(!seen.some((u) => u.includes("bing.com")), `bing must not be fetched, saw: ${seen.join(", ")}`);
});

test("a bing-only record reports why it found nothing instead of failing silently", async () => {
  const rec = { ...REC, image: { lookup_url: "https://www.bing.com/images/search?q=x" } };
  const { notes } = await gatherCandidates(rec, { fetchImpl: () => Promise.resolve(jsonResponse({ products: [] })) });
  assert.ok(notes.some((n) => n.includes("search-engine")), notes.join("; "));
});

test("a confident match hands back the bytes for the caller to store", async () => {
  const res = await enrichOne(REC, {
    fetchImpl: offProducts([{ product_name: "Angel's Envy Rye", brands: "Angel's Envy", image_front_url: "https://off/ae-rye.jpg" }])
  });
  assert.equal(res.status, "ok");
  assert.equal(res.image_url, "https://off/ae-rye.jpg");
  assert.equal(res.mime, "image/jpeg");
  assert.equal(res.bytes, 4);
  assert.ok(res.buf instanceof Uint8Array, "bytes travel with the result; storage is the caller's call");
});

test("the wrong expression is held for review and its bytes are never fetched", async () => {
  const fetched = [];
  const res = await enrichOne(REC, {
    fetchImpl: (url) => {
      fetched.push(String(url));
      return String(url).includes("openfoodfacts")
        ? Promise.resolve(jsonResponse({ products: [{ product_name: "Angel's Envy Bourbon", brands: "Angel's Envy", image_front_url: "https://off/ae-bourbon.jpg" }] }))
        : Promise.resolve(imageResponse([1, 2, 3, 4]));
    }
  });
  assert.equal(res.status, "needs_review", res.match_reason);
  assert.equal(res.buf, undefined, "a weak match must never come back with bytes to store");
  assert.ok(!fetched.includes("https://off/ae-bourbon.jpg"), "the wrong bottle's image should not even be downloaded");
  assert.ok(res.candidates.length, "the candidate is still offered for a human to confirm");
});

test("a non-image response is held for review, not stored as a broken photo", async () => {
  const res = await enrichOne(REC, {
    fetchImpl: (url) => String(url).includes("openfoodfacts")
      ? Promise.resolve(jsonResponse({ products: [{ product_name: "Angel's Envy Rye", brands: "Angel's Envy", image_front_url: "https://off/x" }] }))
      : Promise.resolve(imageResponse([1], "text/html"))
  });
  assert.equal(res.status, "needs_review");
  assert.match(res.match_reason, /unsupported type/);
});

test("downloadImage rejects oversized and empty payloads", async () => {
  await assert.rejects(
    () => downloadImage("https://x/img.jpg", () => Promise.resolve(imageResponse([]))),
    /empty image/);
  await assert.rejects(
    () => downloadImage("https://x/img.jpg", () => Promise.resolve(imageResponse(new Array(5 * 1024 * 1024).fill(1)))),
    /too large/);
});

test("a resolver outage yields a reported failure, never a throw", async () => {
  const res = await enrichOne(REC, { fetchImpl: () => Promise.reject(new Error("network down")) });
  assert.equal(res.status, "failed");
  assert.equal(res.candidates.length, 0);
  assert.ok(res.match_reason);
});

test("accented names fold rather than shred", () => {
  assert.deepEqual(tokens("Penelope Rosé Cask Finish"), ["penelope", "rose", "cask", "finish"]);
});

test("a producer made only of short words stays matchable", () => {
  // "Te Pa Sauvignon Blanc" is a real catalog record; the short-word filter
  // would otherwise leave it with no tokens and permanently unmatchable.
  assert.deepEqual(tokens("Te Pa Sauvignon Blanc"), ["te", "pa"]);
  assert.ok(scoreNameMatch("Te Pa Sauvignon Blanc", "Te Pa", "Te Pa Sauvignon Blanc").coverage === 1);
});
