import test from "node:test";
import assert from "node:assert/strict";
import { applyBrandDislike, dislikedBrandInName, dislikedBrandOf, DISLIKED_BRAND_FIT_CAP } from "../brand-avoid.js";

const avoid = ["Jack Daniel's", "Four Roses"];
const scored = { id: "x", name: "Jack Daniel's Single Barrel Select", jd_fit: 91, why: "Matches your oak and caramel.", concern: null };

test("every Jack Daniel's bottle is recognised, whatever the apostrophe", () => {
  for (const producer of ["Jack Daniel's", "Jack Daniel’s", "JACK DANIELS", "Jack Daniel's Distillery"]) assert.equal(dislikedBrandOf({ producer }, avoid), "Jack Daniel's", producer);
});

test("other brands, and brands that merely share letters, are untouched", () => {
  for (const producer of ["Jim Beam", "Jack Rose", "Four Rosess Imports", "", null]) assert.equal(dislikedBrandOf({ producer }, avoid), null, String(producer));
  assert.deepEqual(applyBrandDislike({ ...scored, jd_fit: 91 }, { producer: "Woodford Reserve" }, avoid), { ...scored, jd_fit: 91 });
});

test("a disliked brand is capped below the recommendation threshold and says why", () => {
  const out = applyBrandDislike(scored, { producer: "Jack Daniel's" }, avoid);
  assert.equal(out.jd_fit, DISLIKED_BRAND_FIT_CAP);
  assert.ok(out.jd_fit < 65, "stays out of the recommended list");
  assert.match(out.why, /don't like Jack Daniel's/);
  assert.match(out.concern, /don't like Jack Daniel's/);
  assert.equal(out.disliked_brand, "Jack Daniel's");
});

test("a fit that was already lower, or missing, is not raised", () => {
  assert.equal(applyBrandDislike({ ...scored, jd_fit: 20 }, { producer: "Jack Daniel's" }, avoid).jd_fit, 20);
  assert.equal(applyBrandDislike({ ...scored, jd_fit: null }, { producer: "Jack Daniel's" }, avoid).jd_fit, DISLIKED_BRAND_FIT_CAP);
});

test("no dislikes means nothing changes", () => {
  assert.deepEqual(applyBrandDislike(scored, { producer: "Jack Daniel's" }, []), scored);
});

test("a bottle identified in a photo is matched by the start of its name", () => {
  assert.equal(dislikedBrandInName("Jack Daniel's Old No. 7", avoid), "Jack Daniel's");
  assert.equal(dislikedBrandInName("Gentleman Jack", avoid), "Jack Daniel's"); // a Jack Daniel's line without the name on the label
  assert.equal(dislikedBrandInName("Jack Rose Bourbon", avoid), null);
  assert.equal(dislikedBrandInName("Four Roses Single Barrel", avoid), "Four Roses");
});
