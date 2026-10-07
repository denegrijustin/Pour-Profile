import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isProductPage, passesGate, gatherCandidates, enrichOne } from "../image-enrich.js";

const htmlResponse = (html) => ({ ok: true, headers: { get: () => "text/html" }, text: async () => html });
const jsonResponse = (body) => ({ ok: true, headers: { get: () => "application/json" }, json: async () => body });
const imageResponse = (bytes, mime = "image/jpeg") => ({
  ok: true, headers: { get: (h) => (h.toLowerCase() === "content-type" ? mime : null) },
  arrayBuffer: async () => new Uint8Array(bytes).buffer
});

// A real producer product page: the bottle shot lives behind an opaque CDN path
// that spells nothing a name matcher could read.
const PRODUCT_HTML = `
  <meta property="og:image" content="https://cdn.shopify.com/s/files/1/0528/dw9f3a8b1c7e.png?v=1682972762">
  <script type="application/ld+json">{"@type":"Product","name":"Toasted Series","image":["https://cdn.shopify.com/s/files/1/0528/dw9f3a8b1c7e.png?v=1682972762"]}</script>`;

function fetchFor(pageHtml) {
  return (url) => {
    const u = String(url);
    if (u.includes("openfoodfacts") || u.includes("commons")) return Promise.resolve(jsonResponse({ products: [] }));
    if (u.startsWith("https://cdn.") || u.includes(".png") || u.includes(".jpg")) return Promise.resolve(imageResponse([1, 2, 3, 4], "image/png"));
    return Promise.resolve(htmlResponse(pageHtml));
  };
}

test("a product path is distinguished from a brand homepage", () => {
  assert.equal(isProductPage("https://shop.penelopebourbon.com/products/toasted-series"), true);
  assert.equal(isProductPage("https://www.oldforester.com/products/old-forester-1910-old-fine-whisky/"), true);
  assert.equal(isProductPage("https://rabbitholedistillery.com/"), false);
  assert.equal(isProductPage("https://www.aviationgin.com/"), false);
  assert.equal(isProductPage("https://www.bing.com/images/search?q=x"), false);
  assert.equal(isProductPage("not a url"), false);
});

test("an opaque CDN product shot from a cited page is accepted", async () => {
  // Without this the numeric gate rejects every genuine producer photo, because
  // "dw9f3a8b1c7e.png" scores ~0 against the bottle's name.
  const rec = {
    id: "penelope-toasted-bourbon", name: "Penelope Toasted Bourbon", producer: "Penelope",
    page: "https://shop.penelopebourbon.com/products/toasted-series"
  };
  const res = await enrichOne(rec, { fetchImpl: fetchFor(PRODUCT_HTML) });
  assert.equal(res.status, "ok", res.match_reason);
  assert.ok(res.image_url.includes("cdn.shopify.com"));
});

test("a brand homepage is never auto-accepted", async () => {
  // Four Rabbit Hole expressions cite the same distillery homepage; trusting it
  // would stamp one hero shot onto four different bottles.
  const rec = {
    id: "rabbit-hole-cavehill", name: "Rabbit Hole Cavehill", producer: "Rabbit Hole",
    page: "https://rabbitholedistillery.com/"
  };
  const res = await enrichOne(rec, { fetchImpl: fetchFor(PRODUCT_HTML) });
  assert.equal(res.status, "needs_review", `expected review, got ${res.status}: ${res.match_reason}`);
  assert.equal(res.buf, undefined, "a homepage hero must never be stored");
});

test("different expressions sharing one homepage do not collide", async () => {
  const ids = ["rabbit-hole-cavehill", "rabbit-hole-heigold", "rabbit-hole-dareringer", "rabbit-hole-boxergrail-rye"];
  for (const id of ids) {
    const res = await enrichOne(
      { id, name: id.replace(/-/g, " "), producer: "Rabbit Hole", page: "https://rabbitholedistillery.com/" },
      { fetchImpl: fetchFor(PRODUCT_HTML) });
    assert.notEqual(res.status, "ok", `${id} must not auto-accept a shared homepage image`);
  }
});

test("the homepage case explains itself rather than failing silently", async () => {
  const { notes } = await gatherCandidates(
    { id: "x", name: "Rabbit Hole Cavehill", producer: "Rabbit Hole", page: "https://rabbitholedistillery.com/" },
    { fetchImpl: fetchFor(PRODUCT_HTML) });
  assert.ok(notes.some((n) => n.includes("homepage")), notes.join("; "));
});

test("the cited-page bypass does not leak to arbitrary pages", () => {
  // Only a candidate explicitly flagged from a cited product page may skip the
  // numeric gate; a weak match from anywhere else still has to earn it.
  assert.equal(passesGate({ score: 0.2, coverage: 0.2, precision: 0.2 }), false);
  assert.equal(passesGate({ score: 0.2, coverage: 0.2, precision: 0.2, citedProductPage: true }), true);
  assert.equal(passesGate(null), false);
});

test("every cited producer url in the shipped notes is absolute and non-search", () => {
  const notes = JSON.parse(fs.readFileSync(new URL("../data/expert-notes.json", import.meta.url), "utf8"));
  const urls = Object.values(notes).map((n) => n.producer?.source_url).filter(Boolean);
  assert.ok(urls.length > 300, `expected the bulk of the catalog to carry a producer url, got ${urls.length}`);
  for (const u of urls) assert.match(u, /^https?:\/\//, `not absolute: ${u}`);
});
