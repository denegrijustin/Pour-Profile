// Catalog invariants from the build brief. Run: npm test
import assert from "node:assert/strict";
import test from "node:test";
import {
  isVisible, lifecycleState, computeFit, fitLabel, shouldRecommend,
  refreshCatalog, validateCatalog, whiskeyDimensions, sbDimensions
} from "../catalog-engine.js";
import { WHISKEY_CATALOG, SB_CATALOG } from "../catalog-seed.js";

const rec = (over = {}) => ({
  id: "x", name: "X", producer: "P", category: "bourbon",
  tasting_profile: {}, ratings: {},
  recommendation: { recommended: false },
  user_state: { tasted: false, user_rating: null, want_to_try: false },
  ...over
});

// ---------- visibility ----------

test("hidden bottles are not shown", () => {
  assert.equal(isVisible(rec()), false);
  assert.equal(lifecycleState(rec()), "hidden_reference");
});

test("recommended bottles are shown", () => {
  const r = rec({ recommendation: { recommended: true } });
  assert.equal(isVisible(r), true);
  assert.equal(lifecycleState(r), "recommended");
});

test("tasted bottles are shown", () => {
  const r = rec({ user_state: { tasted: true, user_rating: null } });
  assert.equal(isVisible(r), true);
  assert.equal(lifecycleState(r), "tasted");
});

test("tasted bottles stay shown even when recommended is false", () => {
  const r = rec({ user_state: { tasted: true, user_rating: 3 }, recommendation: { recommended: false } });
  assert.equal(isVisible(r), true, "a tasted bottle must never disappear");
  assert.equal(lifecycleState(r), "rated");
});

test("a disliked tasted bottle is still permanently visible", () => {
  const r = rec({ user_state: { tasted: true, user_rating: 1 }, recommendation: { recommended: false } });
  assert.equal(isVisible(r), true);
});

test("want_to_try alone does not force visibility but is tracked", () => {
  const r = rec({ user_state: { tasted: false, want_to_try: true } });
  assert.equal(lifecycleState(r), "want_to_try");
  assert.equal(isVisible(r), false);
});

// ---------- fit scoring ----------

test("fit returns null rather than a fake midpoint when the profile is unknown", () => {
  const f = computeFit(rec());
  assert.equal(f.score, null);
  assert.equal(f.fit_label, null);
  assert.equal(f.confidence, 0);
});

test("a sweet toasted-oak bourbon scores well above a dry herbal rye", () => {
  const toasted = computeFit(rec({ tasting_profile: {
    oak: 8, toast_char: 9, sweetness: 7, vanilla_caramel: 9, body: 8,
    spice: 6, finish_intensity: 8, fruit: 5, medicinal_cherry: 0
  }}));
  const dryRye = computeFit(rec({ category: "rye", tasting_profile: {
    oak: 6, toast_char: 3, sweetness: 2, vanilla_caramel: 3, body: 4,
    spice: 9, finish_intensity: 4, fruit: 3, medicinal_cherry: 2
  }}));
  assert.ok(toasted.score > dryRye.score + 20, `${toasted.score} should far exceed ${dryRye.score}`);
});

test("medicinal cherry is penalised hard — the clearest known negative", () => {
  const base = { oak: 7, toast_char: 7, sweetness: 6, vanilla_caramel: 7, body: 7, spice: 5, finish_intensity: 7, fruit: 6 };
  const clean = computeFit(rec({ tasting_profile: { ...base, medicinal_cherry: 0 } }));
  const medicinal = computeFit(rec({ tasting_profile: { ...base, medicinal_cherry: 9 } }));
  assert.ok(medicinal.score < clean.score - 10, `${medicinal.score} vs ${clean.score}`);
  assert.ok(medicinal.penalties.some((p) => p.trait === "medicinal_cherry"));
});

test("rich dark cherry is NOT treated the same as medicinal cherry", () => {
  const darkCherry = computeFit(rec({ tasting_profile: {
    oak: 8, toast_char: 8, sweetness: 7, vanilla_caramel: 8, body: 8,
    spice: 5, finish_intensity: 8, fruit: 9, medicinal_cherry: 0
  }}));
  const medicinal = computeFit(rec({ tasting_profile: {
    oak: 8, toast_char: 8, sweetness: 7, vanilla_caramel: 8, body: 8,
    spice: 5, finish_intensity: 8, fruit: 9, medicinal_cherry: 8
  }}));
  assert.ok(darkCherry.score > medicinal.score, "fruit alone must not be punished");
});

test("fit labels follow the documented thresholds", () => {
  assert.equal(fitLabel(95), "Exceptional");
  assert.equal(fitLabel(93), "Exceptional");
  assert.equal(fitLabel(88), "Strong");
  assert.equal(fitLabel(80), "Possible");
  assert.equal(fitLabel(65), "Low");
  assert.equal(fitLabel(40), "Avoid");
});

test("high proof only helps when body and sweetness carry it", () => {
  const carried = whiskeyDimensions({ _proof: 120, body: 9, sweetness: 8 });
  const hot = whiskeyDimensions({ _proof: 120, body: 3, sweetness: 2 });
  assert.ok(carried.proof_integration > hot.proof_integration);
});

test("Sauvignon Blanc: pyrazine-heavy style is not assumed to be wanted", () => {
  const balanced = computeFit(rec({ category: "sauvignon_blanc", tasting_profile: {
    fruit: 8, citrus: 7, tropical: 7, acidity: 6, body: 6, finish_intensity: 7, grassy_herbal: 3, minerality: 5
  }}));
  const grassy = computeFit(rec({ category: "sauvignon_blanc", tasting_profile: {
    fruit: 5, citrus: 8, tropical: 2, acidity: 9, body: 3, finish_intensity: 5, grassy_herbal: 9, minerality: 7
  }}));
  assert.ok(balanced.score > grassy.score + 15, `${balanced.score} vs ${grassy.score}`);
});

// ---------- promotion ----------

test("promotion needs both fit and availability", () => {
  const strongLocal = rec({ ratings: { jd_fit: 90 }, regional_availability: { score: 60 } });
  const strongRare = rec({ ratings: { jd_fit: 90 }, regional_availability: { score: 10 } });
  assert.equal(shouldRecommend(strongLocal).recommended, true);
  assert.equal(shouldRecommend(strongRare).recommended, false);
});

test("exceptional fit is promoted even when allocated", () => {
  const r = rec({ ratings: { jd_fit: 95 }, regional_availability: { score: 5 } });
  assert.equal(shouldRecommend(r).recommended, true);
});

test("a known deal-breaker is never auto-promoted regardless of score", () => {
  const r = rec({ ratings: { jd_fit: 96 }, regional_availability: { score: 90 }, tasting_profile: { medicinal_cherry: 8 } });
  assert.equal(shouldRecommend(r).recommended, false);
});

test("manual overrides are preserved", () => {
  const r = rec({ ratings: { jd_fit: 20 } });
  assert.equal(shouldRecommend(r, { manualOverride: true }).recommended, true);
  const r2 = rec({ ratings: { jd_fit: 99 } });
  assert.equal(shouldRecommend(r2, { manualOverride: false }).recommended, false);
});

test("refresh never hides a tasted bottle", () => {
  const [out] = refreshCatalog([rec({
    user_state: { tasted: true, user_rating: 2 },
    tasting_profile: { oak: 2, toast_char: 1, sweetness: 1, vanilla_caramel: 1, body: 2, spice: 9, finish_intensity: 2, fruit: 1, medicinal_cherry: 9 }
  })]);
  assert.equal(out.recommendation.recommended, false, "should not be recommended");
  assert.equal(out.visibility.show_in_app, true, "but must remain visible");
});

// ---------- validation ----------

test("validation catches duplicate ids", () => {
  const v = validateCatalog([rec({ id: "a" }), rec({ id: "a" })]);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => e.includes("duplicate id")));
});

test("validation rejects an image claiming verification with no URL", () => {
  const v = validateCatalog([rec({ image: { verified: true } })]);
  assert.ok(v.errors.some((e) => e.includes("verified is true but there is no URL")));
});

test("validation rejects malformed UPCs rather than accepting invented ones", () => {
  const v = validateCatalog([rec({ barcode: { upc: "not-a-upc" } })]);
  assert.ok(v.errors.some((e) => e.includes("UPC")));
});

test("validation flags missing images as warnings, and as errors when required", () => {
  const lenient = validateCatalog([rec()]);
  assert.equal(lenient.ok, true);
  assert.ok(lenient.warnings.some((w) => w.includes("no image")));
  const strict = validateCatalog([rec()], { requireImages: true });
  assert.equal(strict.ok, false);
});

// ---------- shipped seed catalog ----------

test("seed catalog has no duplicate ids", () => {
  const all = [...WHISKEY_CATALOG, ...SB_CATALOG];
  const ids = new Set(all.map((r) => r.id));
  assert.equal(ids.size, all.length);
});

test("seed catalog validates", () => {
  const v = validateCatalog([...WHISKEY_CATALOG, ...SB_CATALOG]);
  assert.equal(v.ok, true, v.errors.join("\n"));
});

test("every seed record produces a fit score", () => {
  for (const r of [...WHISKEY_CATALOG, ...SB_CATALOG]) {
    const f = computeFit(r);
    assert.ok(f.score != null, `${r.id} produced no fit score`);
  }
});

test("no seed record claims a verified image it does not have", () => {
  for (const r of [...WHISKEY_CATALOG, ...SB_CATALOG]) {
    if (r.image && r.image.verified) assert.ok(r.image.primary_url, `${r.id} claims verified with no URL`);
  }
});

test("the known anchors score in the expected direction", () => {
  const byId = Object.fromEntries(refreshCatalog(WHISKEY_CATALOG).map((r) => [r.id, r]));
  const penelope = byId["penelope-toasted"];
  const makers = byId["makers-mark"];
  const rieger = byId["j-rieger-rye"];
  assert.ok(penelope.ratings.jd_fit > makers.ratings.jd_fit, "a stated favorite should beat a stated dislike");
  assert.ok(penelope.ratings.jd_fit > rieger.ratings.jd_fit, "a stated favorite should beat the strongest dislike");
});

// ---------- research import ----------

test("a researched fit score stays authoritative over the model score", () => {
  const [out] = refreshCatalog([rec({
    ratings: { research_fit: 98, research_fit_label: "Exceptional", jd_fit_source: "research" },
    tasting_profile: { oak: 5, toast_char: 5, sweetness: 5, vanilla_caramel: 5, body: 5, spice: 5, finish_intensity: 5, fruit: 5 }
  })]);
  assert.equal(out.ratings.jd_fit, 98, "research value wins");
  assert.equal(out.ratings.fit_label, "Exceptional");
  assert.ok(out.ratings.model_fit != null, "model score is still computed alongside");
  assert.notEqual(out.ratings.model_fit, 98, "and is genuinely independent");
});

test("records without a research fit fall back to the model score", () => {
  const [out] = refreshCatalog([rec({
    tasting_profile: { oak: 8, toast_char: 8, sweetness: 7, vanilla_caramel: 8, body: 8, spice: 6, finish_intensity: 8, fruit: 5 }
  })]);
  assert.equal(out.ratings.jd_fit_source, "model");
  assert.equal(out.ratings.jd_fit, out.ratings.model_fit);
});

test("a high-quality bottle with mediocre personal fit stays hidden", () => {
  // The Russell's Reserve 13 case: Quality #1, JD #49 — must not surface.
  const [out] = refreshCatalog([rec({
    ratings: { general: 99, research_fit: 78, jd_fit_source: "research" },
    regional_availability: { score: 20 }
  })], { topNPerCategory: 0 });
  assert.equal(out.recommendation.recommended, false);
  assert.equal(out.visibility.show_in_app, false);
});

test("absence of fruit is not scored as a fault", () => {
  const base = { oak: 9, toast_char: 9, sweetness: 8, vanilla_caramel: 9, body: 8, spice: 6, finish_intensity: 8 };
  const lowFruit = computeFit(rec({ tasting_profile: { ...base, fruit: 2, medicinal_cherry: 0 } }));
  const medFruit = computeFit(rec({ tasting_profile: { ...base, fruit: 6, medicinal_cherry: 0 } }));
  assert.ok(lowFruit.score >= medFruit.score - 8, `low fruit ${lowFruit.score} should not crater vs ${medFruit.score}`);
  assert.ok(lowFruit.score >= 70, `a toasted-oak bourbon with little fruit should still score well, got ${lowFruit.score}`);
});
