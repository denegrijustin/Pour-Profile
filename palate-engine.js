// Pour Profile — deterministic, explainable palate scoring.
// No opaque ML: every number here traces back to a rule you could explain out loud.
// Inputs are plain objects shaped like the D1 rows (see migrations/0001_init.sql).

const STATUS_SENTIMENT = {
  favorite: 1, like: 0.6, neutral: 0, dislike: -0.7, avoid: -1
};

const CONFIDENCE_WEIGHT = { high: 1, medium: 0.6, low: 0.3, none: 0.15 };

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

// A single tasting's sentiment in [-1, 1], plus how much weight to give it.
function tastingSentiment(tasting) {
  if (tasting.rating != null) {
    return { sentiment: clamp((tasting.rating - 5) / 4.5, -1, 1), weight: 1 };
  }
  const bools = [tasting.would_drink_again, tasting.would_order_again, tasting.would_buy_bottle]
    .filter((v) => v === 0 || v === 1);
  if (bools.length) {
    const avg = bools.reduce((a, b) => a + (b ? 1 : -1), 0) / bools.length;
    return { sentiment: avg, weight: 0.7 };
  }
  return null;
}

function statusSentiment(statusTags) {
  const tags = Array.isArray(statusTags) ? statusTags : JSON.parse(statusTags || "[]");
  const scored = tags.filter((t) => t in STATUS_SENTIMENT);
  if (!scored.length) return null;
  const avg = scored.reduce((a, t) => a + STATUS_SENTIMENT[t], 0) / scored.length;
  return { sentiment: avg, weight: 0.5 };
}

/**
 * Build the palate profile: per-flavor-tag affinity (0-100) + confidence, from
 * every tasting (weighted highest) and, as a thinner fallback signal, bottle-level
 * status tags and descriptive flavor tags.
 *
 * @param {Array} bottles - bottles with .status_tags (json string or array), .flavor_tags (array of tag names)
 * @param {Array} tastings - tastings with .bottle_id, .rating, .would_*, .flavor_tags (array of tag names)
 */
export function buildPalateProfile(bottles, tastings) {
  const byBottle = new Map(bottles.map((b) => [b.id, b]));
  const acc = new Map(); // tag -> { sum, weight, n }

  const addSignal = (tagNames, sentiment, weight) => {
    if (!tagNames || !tagNames.length || weight <= 0) return;
    for (const tag of tagNames) {
      const cur = acc.get(tag) || { sum: 0, weight: 0, n: 0 };
      cur.sum += sentiment * weight;
      cur.weight += weight;
      cur.n += 1;
      acc.set(tag, cur);
    }
  };

  for (const tasting of tastings) {
    const bottle = byBottle.get(tasting.bottle_id);
    const s = tastingSentiment(tasting);
    if (s) {
      const tags = tasting.flavor_tags && tasting.flavor_tags.length ? tasting.flavor_tags : (bottle?.flavor_tags || []);
      const weight = tasting.flavor_tags && tasting.flavor_tags.length ? s.weight : s.weight * 0.5;
      addSignal(tags, s.sentiment, weight);
    }
  }
  for (const bottle of bottles) {
    const s = statusSentiment(bottle.status_tags);
    if (s) addSignal(bottle.flavor_tags || [], s.sentiment, s.weight);
  }

  const profile = {};
  for (const [tag, { sum, weight, n }] of acc.entries()) {
    const avgSentiment = weight > 0 ? sum / weight : 0;
    const affinity = Math.round(clamp(50 + 50 * avgSentiment, 0, 100));
    let confidence = "low";
    if (weight >= 2.5) confidence = "high";
    else if (weight >= 1) confidence = "medium";
    profile[tag] = { affinity, confidence, sampleWeight: Math.round(weight * 100) / 100, sampleCount: n };
  }
  return profile;
}

/**
 * Score how likely Justin is to like a candidate bottle, given the learned profile.
 * @param {Object} candidate - { flavorTags: string[], proof?: number, brand?: string, category?: string }
 * @param {Object} profile - output of buildPalateProfile
 * @param {Array} brandSignals - [{brand, sentiment}]
 * @param {Array} likedBottles - bottles the user rated favorably (for "similar to")
 * @param {Array} dislikedBottles - bottles the user rated unfavorably (for "different from")
 */
export function scoreMatch(candidate, profile, brandSignals = [], likedBottles = [], dislikedBottles = []) {
  const tags = candidate.flavorTags || [];
  const weighted = [];
  for (const tag of tags) {
    const p = profile[tag];
    if (p) {
      weighted.push({ tag, affinity: p.affinity, confidence: p.confidence, weight: CONFIDENCE_WEIGHT[p.confidence] });
    } else {
      weighted.push({ tag, affinity: 50, confidence: "none", weight: CONFIDENCE_WEIGHT.none });
    }
  }

  const brandSignal = brandSignals.find((b) => candidate.brand && b.brand.toLowerCase() === candidate.brand.toLowerCase());
  if (brandSignal) {
    weighted.push({
      tag: `brand:${brandSignal.brand}`,
      affinity: brandSignal.sentiment === "positive" ? 72 : brandSignal.sentiment === "negative" ? 28 : 50,
      confidence: "medium",
      weight: CONFIDENCE_WEIGHT.medium * 0.6
    });
  }

  let matchPercent = 50;
  let overallWeight = 0;
  if (weighted.length) {
    const sum = weighted.reduce((a, w) => a + w.affinity * w.weight, 0);
    overallWeight = weighted.reduce((a, w) => a + w.weight, 0);
    matchPercent = overallWeight > 0 ? Math.round(sum / overallWeight) : 50;
  }

  const highConfCount = weighted.filter((w) => w.confidence === "high").length;
  const anyConfCount = weighted.filter((w) => w.confidence !== "none").length;
  let confidenceLevel = "Low";
  if (highConfCount >= 2) confidenceLevel = "High";
  else if (anyConfCount >= 2) confidenceLevel = "Medium";

  const whyItFits = weighted
    .filter((w) => w.affinity >= 62)
    .sort((a, b) => b.affinity - a.affinity)
    .map((w) => ({ tag: w.tag, affinity: w.affinity, confidence: w.confidence }));

  const possibleConcerns = weighted
    .filter((w) => w.affinity <= 40)
    .sort((a, b) => a.affinity - b.affinity)
    .map((w) => ({ tag: w.tag, affinity: w.affinity, confidence: w.confidence }));

  if (candidate.proof != null && candidate.proof >= 110) {
    possibleConcerns.push({ tag: "high_proof", affinity: null, confidence: "n/a", note: `${candidate.proof} proof is high — heat can mute or distort other flavors.` });
  }

  const sharedTagBottles = (list) => list
    .filter((b) => (b.flavor_tags || []).some((t) => tags.includes(t)))
    .slice(0, 3)
    .map((b) => b.name);

  let decision = "PROBABLY SKIP";
  if (matchPercent >= 85) decision = "BUY";
  else if (matchPercent >= 65) decision = "TRY A POUR";

  return {
    matchPercent,
    confidenceLevel,
    decision,
    whyItFits,
    possibleConcerns,
    similarToLiked: sharedTagBottles(likedBottles),
    differentFromDisliked: sharedTagBottles(dislikedBottles).length ? [] : dislikedBottles.slice(0, 2).map((b) => b.name)
  };
}
