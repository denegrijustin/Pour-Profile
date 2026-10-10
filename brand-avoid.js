// Brands the person has said they don't like (brand_signals rows with sentiment "negative"). A catalog bottle from
// one of them is never offered as a recommendation, and says why wherever it still appears (browse, search).

const norm = (t) => String(t ?? "").toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** The disliked brand a catalog record belongs to (by producer), or null. */
export function dislikedBrandOf(record, avoidBrands = []) {
  const producer = norm(record?.producer);
  if (!producer) return null;
  return avoidBrands.find((b) => norm(b) && (producer === norm(b) || producer.startsWith(`${norm(b)} `))) ?? null;
}

/** The highest fit a disliked brand can show, below the recommendation threshold (65). */
export const DISLIKED_BRAND_FIT_CAP = 40;

/**
 * Applies the dislike to one scored catalog entry: caps the fit, and replaces the explanation with the reason.
 * Entries from other brands are returned unchanged.
 */
export function applyBrandDislike(scored, record, avoidBrands) {
  const brand = dislikedBrandOf(record, avoidBrands);
  if (!brand) return scored;
  return {
    ...scored,
    jd_fit: Math.min(scored.jd_fit ?? DISLIKED_BRAND_FIT_CAP, DISLIKED_BRAND_FIT_CAP),
    why: `You've said you don't like ${brand}, so this isn't recommended.`,
    concern: `You've said you don't like ${brand}.`,
    disliked_brand: brand
  };
}

// Product lines sold without the brand name on the label.
const BRAND_LINES = { "jack daniels": ["gentleman jack"] };

/** The disliked brand a bottle name begins with ("Jack Daniel's Old No. 7"), or null; for bottles identified in a photo. */
export function dislikedBrandInName(name, avoidBrands = []) {
  const n = norm(name);
  return avoidBrands.find((b) => norm(b) && [norm(b), ...(BRAND_LINES[norm(b)] ?? [])].some((line) => n === line || n.startsWith(`${line} `))) ?? null;
}
