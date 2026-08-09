// Pour Profile — wine palate scoring.
//
// Deliberately separate from palate-engine.js (spirits). Spirits scoring is
// tag-affinity based: "how much does this person like toasted oak." Wine scoring
// is *dimensional*: each varietal has a target position on a set of 0-10 scales,
// and a candidate scores by how close it lands to those targets.
//
// The other key difference: profiles are scoped PER VARIETAL. What someone likes
// in Sauvignon Blanc does not predict what they like in Chardonnay, so a
// Chardonnay is never scored against a Sauvignon Blanc profile. Cross-varietal
// carryover is opt-in via the '_all' pseudo-varietal, and is weighted lower.

// All dimensions run 0-10. Direction is documented because it is not always obvious.
export const WINE_DIMENSIONS = [
  { id: "fruit_intensity", label: "Fruit intensity", low: "Subtle", high: "Intense" },
  { id: "fruit_character", label: "Fruit character", descriptive: true },
  { id: "sweetness", label: "Sweetness", low: "Bone dry", high: "Dessert sweet" },
  { id: "acidity", label: "Acidity", low: "Soft/flabby", high: "Razor sharp" },
  { id: "body", label: "Body", low: "Thin/light", high: "Full/weighty" },
  { id: "herbal_green", label: "Herbal / green notes", low: "None", high: "Grassy/vegetal" },
  { id: "minerality", label: "Minerality", low: "None", high: "Flinty/saline" },
  { id: "oak", label: "Oak", low: "Unoaked", high: "Heavily oaked" },
  { id: "creaminess", label: "Creaminess", low: "Lean", high: "Buttery/creamy" },
  { id: "alcohol_warmth", label: "Alcohol warmth", low: "Restrained", high: "Hot" },
  { id: "finish", label: "Finish", low: "Short/austere", high: "Long/flavorful" }
];

export const WINE_VARIETALS = [
  { id: "sauvignon_blanc", label: "Sauvignon Blanc", color: "white" },
  { id: "chardonnay", label: "Chardonnay", color: "white" },
  { id: "pinot_grigio", label: "Pinot Grigio / Gris", color: "white" },
  { id: "riesling", label: "Riesling", color: "white" },
  { id: "other_white", label: "Other White", color: "white" },
  { id: "rose", label: "Rosé", color: "rose" },
  { id: "pinot_noir", label: "Pinot Noir", color: "red" },
  { id: "cabernet", label: "Cabernet Sauvignon", color: "red" },
  { id: "red_blend", label: "Red Blend", color: "red" },
  { id: "merlot", label: "Merlot", color: "red" },
  { id: "other_red", label: "Other Red", color: "red" },
  { id: "sparkling", label: "Sparkling", color: "sparkling" },
  { id: "dessert", label: "Dessert / Fortified", color: "dessert" }
];

// Her stated 5-point status scale, distinct from the spirits status set.
export const WINE_STATUSES = [
  { id: "love", label: "Love", sentiment: 1 },
  { id: "like", label: "Like", sentiment: 0.55 },
  { id: "fine", label: "Fine", sentiment: 0 },
  { id: "dislike", label: "Dislike", sentiment: -0.6 },
  { id: "hate", label: "Hate", sentiment: -1 }
];

export const WINE_BANDS = [
  { min: 85, label: "Strong Buy", tone: "buy", blurb: "Very likely aligned with your palate." },
  { min: 75, label: "Likely Like", tone: "buy", blurb: "Good fit, with one or two characteristics that may push your boundaries." },
  { min: 60, label: "Experiment", tone: "try", blurb: "Could go either way. Useful for developing the profile." },
  { min: 0, label: "Probably Skip", tone: "skip", blurb: "Several characteristics conflict with established preferences." }
];

// Distinct from "Probably Skip": no profile yet for this varietal, so there is
// nothing to score against. Saying "skip" here would invent a judgement.
export const NO_EVIDENCE_BAND = {
  min: null, label: "No Profile Yet", tone: "unknown",
  blurb: "There's no profile for this varietal yet — drink it and rate it, and it becomes the first data point."
};

export function bandFor(score) {
  return WINE_BANDS.find((b) => score >= b.min) || WINE_BANDS[WINE_BANDS.length - 1];
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

// How well an actual value matches a target, 0-1.
// Deliberately steeper than linear: on a 0-10 scale a 3-point miss is a real
// stylistic difference, not "70% right". ~1pt ≈ 0.94, 2pt ≈ 0.83, 3pt ≈ 0.67,
// 4pt ≈ 0.48, 6pt+ ≈ 0.
function closenessFor(delta) {
  return clamp(1 - Math.pow(Math.min(delta, 6) / 6, 1.6), 0, 1);
}

// A wine is not "a good fit on average" if one defining trait is way off, so the
// overall score blends the weighted mean with the single worst dimension.
// Tuned against the worked Koha example in her profile (predicted 82).
const MEAN_WEIGHT = 0.6;
const WORST_WEIGHT = 0.4;

// Deltas at or above this are called out as stretches; at or below FIT_DELTA as fits.
const STRETCH_DELTA = 2;
const FIT_DELTA = 1;

/**
 * Score a candidate wine against a per-varietal dimensional profile.
 *
 * @param {Object} candidate - { varietal, dimensions: {dimId: 0-10}, name }
 * @param {Array}  profileRows - wine_palate_dimensions rows for this profile.
 *                 Rows for the candidate's varietal are used at full weight;
 *                 '_all' rows (cross-varietal carryover) at reduced weight.
 * @param {Array}  referenceWines - wines with a known positive status for this
 *                 profile, each { name, varietal, dimensions } — used for the
 *                 "similarity to known favorites" subscore.
 */
export function scoreWine(candidate, profileRows, referenceWines = []) {
  const dims = candidate.dimensions || {};
  const relevant = profileRows.filter((r) => r.varietal === candidate.varietal || r.varietal === "_all");

  const perDimension = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let worstCloseness = null;

  for (const row of relevant) {
    if (row.target_value == null || row.confidence <= 0) continue;   // unknown preference contributes nothing
    const actual = dims[row.dimension];
    if (actual == null) continue;                                     // unknown about the wine contributes nothing

    const delta = Math.abs(Number(actual) - Number(row.target_value));
    const closeness = closenessFor(delta);
    // Cross-varietal signal is real but weaker than same-varietal evidence.
    const weight = row.confidence * (row.varietal === "_all" ? 0.4 : 1);

    weightedSum += closeness * weight;
    totalWeight += weight;
    // Only confident, same-varietal dimensions can drag the score down as "worst":
    // a low-confidence guess shouldn't veto an otherwise good match.
    if (row.varietal !== "_all" && row.confidence >= 3 && (worstCloseness == null || closeness < worstCloseness)) {
      worstCloseness = closeness;
    }
    perDimension.push({
      dimension: row.dimension,
      target: Number(row.target_value),
      actual: Number(actual),
      delta: Math.round(delta * 10) / 10,
      closeness: Math.round(closeness * 100),
      confidence: row.confidence,
      crossVarietal: row.varietal === "_all"
    });
  }

  const similarity = similarityToReferences(candidate, referenceWines);

  // With no dimensional evidence at all, refuse to invent precision: sit at the
  // neutral midpoint and report low confidence rather than a confident number.
  let score;
  if (totalWeight === 0) {
    score = similarity != null ? Math.round(50 + (similarity - 5) * 4) : 50;
  } else {
    const mean = weightedSum / totalWeight;
    const worst = worstCloseness == null ? mean : worstCloseness;
    const dimensionScore = (mean * MEAN_WEIGHT + worst * WORST_WEIGHT) * 100;
    score = similarity != null
      ? Math.round(dimensionScore * 0.8 + (similarity * 10) * 0.2)
      : Math.round(dimensionScore);
  }
  score = clamp(score, 0, 100);

  const evidenceCount = perDimension.filter((d) => !d.crossVarietal).length;
  const hasEvidence = evidenceCount > 0 || similarity != null;
  const band = hasEvidence ? bandFor(score) : NO_EVIDENCE_BAND;
  const avgConfidence = perDimension.length
    ? perDimension.reduce((a, d) => a + d.confidence, 0) / perDimension.length
    : 0;
  let confidenceLabel = "Low";
  if (evidenceCount >= 5 && avgConfidence >= 3.5) confidenceLabel = "High";
  else if (evidenceCount >= 3 && avgConfidence >= 2.5) confidenceLabel = "Moderate";

  // Subscores mirror the shape she asked for: the wine's own levels, not match deltas.
  const subscores = {
    fruit: dims.fruit_intensity ?? null,
    acidity: dims.acidity ?? null,
    body: dims.body ?? null,
    greenHerbalRisk: greenRisk(dims, relevant),
    similarityToFavorites: similarity
  };

  // Reported in terms of raw distance on the 0-10 scale, which is what a person
  // can actually act on ("expect noticeably more acidity than you're used to").
  const fits = perDimension.filter((d) => d.delta <= FIT_DELTA).sort((a, b) => a.delta - b.delta);
  const stretches = perDimension.filter((d) => d.delta >= STRETCH_DELTA)
    .sort((a, b) => b.delta - a.delta)
    .map((d) => ({ ...d, direction: d.actual > d.target ? "more" : "less" }));

  return {
    score: hasEvidence ? score : null,   // null, not 50 — "unknown" is not "average"
    band, confidenceLabel: hasEvidence ? confidenceLabel : "None",
    subscores, fits, stretches, perDimension, evidenceCount, hasEvidence
  };
}

// "Green/herbal risk" is only a risk relative to how much green this palate wants.
// A grassy wine is not risky for someone who likes grassy wine.
function greenRisk(dims, relevantRows) {
  const actual = dims.herbal_green;
  if (actual == null) return null;
  const row = relevantRows.find((r) => r.dimension === "herbal_green" && r.target_value != null);
  if (!row) return Math.round(actual);
  const over = Number(actual) - Number(row.target_value);
  return Math.round(clamp(5 + over, 0, 10));
}

// Mean dimensional closeness to the nearest known-liked wine, expressed 0-10.
function similarityToReferences(candidate, referenceWines) {
  const sameVarietal = referenceWines.filter((w) => w.varietal === candidate.varietal && w.dimensions && Object.keys(w.dimensions).length);
  if (!sameVarietal.length) return null;
  const dims = candidate.dimensions || {};

  let best = null;
  for (const ref of sameVarietal) {
    const shared = Object.keys(ref.dimensions).filter((d) => dims[d] != null);
    if (!shared.length) continue;
    const meanDistance = shared.reduce((a, d) => a + Math.abs(Number(dims[d]) - Number(ref.dimensions[d])), 0) / shared.length;
    const sim = clamp(10 - meanDistance, 0, 10);
    if (best == null || sim > best) best = sim;
  }
  return best == null ? null : Math.round(best * 10) / 10;
}

/**
 * Fold a rated tasting back into the dimensional profile — the "that becomes
 * evidence" step. A high rating pulls each target toward the wine's actual
 * values; a low rating pushes away. Movement is deliberately small and scaled by
 * how far the rating sits from neutral, so one bottle never rewrites a profile.
 *
 * Returns proposed updates rather than applying them, so callers can show the
 * user what changed and why.
 */
export function learnFromTasting({ rating, dimensions }, profileRows, varietal) {
  if (rating == null || !dimensions) return [];
  const sentiment = clamp((rating - 6.5) / 3.5, -1, 1);   // 6.5/10 treated as neutral for wine
  if (Math.abs(sentiment) < 0.1) return [];

  const updates = [];
  for (const [dimension, actualRaw] of Object.entries(dimensions)) {
    if (actualRaw == null) continue;
    const actual = Number(actualRaw);
    const row = profileRows.find((r) => r.varietal === varietal && r.dimension === dimension);

    if (!row || row.target_value == null) {
      // First real evidence for a previously unknown dimension: adopt the observed
      // value, but only from a wine they actually liked, and at minimum confidence.
      if (sentiment > 0.25) {
        updates.push({ varietal, dimension, target_value: actual, confidence: 1, reason: `First evidence: liked a wine at ${dimension} ${actual}/10.` });
      }
      continue;
    }

    const target = Number(row.target_value);
    const step = 0.35 * sentiment * (actual - target);
    const next = clamp(target + step, 0, 10);
    // Agreement builds confidence; disagreement should not silently harden it.
    const agreed = sentiment > 0 && Math.abs(actual - target) <= 2;
    const confidence = clamp(row.confidence + (agreed ? 1 : 0), 0, 5);

    if (Math.abs(next - target) >= 0.05 || confidence !== row.confidence) {
      updates.push({
        varietal, dimension,
        target_value: Math.round(next * 100) / 100,
        confidence,
        reason: sentiment > 0
          ? `Rated ${rating}/10 with ${dimension} at ${actual}/10 — moved target ${target} → ${Math.round(next * 100) / 100}.`
          : `Rated ${rating}/10 with ${dimension} at ${actual}/10 — moved target away, ${target} → ${Math.round(next * 100) / 100}.`
      });
    }
  }
  return updates;
}
