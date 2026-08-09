// Pour Decisions — hidden reference catalog.
//
// The catalog is a large pool of bottles the app knows about but does NOT show
// in normal browsing. It exists to power recommendations, search-to-add, and
// match scoring. Visibility is deliberately narrow:
//
//     show_in_app = tasted || recommended
//
// with one hard guarantee: once a bottle is tasted it stays visible forever,
// even if you hated it and even if `recommended` later flips to false. A rating
// you gave is history; it must not disappear because a score moved.

export const LIFECYCLE = ["hidden_reference", "recommended", "want_to_try", "tasted", "rated"];

/** Derived state, in priority order. */
export function lifecycleState(rec) {
  const u = rec.user_state || {};
  if (u.tasted && u.user_rating != null) return "rated";
  if (u.tasted) return "tasted";
  if (u.want_to_try) return "want_to_try";
  if (rec.recommendation && rec.recommendation.recommended) return "recommended";
  return "hidden_reference";
}

/** The single visibility rule. Tasted always wins. */
export function isVisible(rec) {
  const tasted = !!(rec.user_state && rec.user_state.tasted);
  const recommended = !!(rec.recommendation && rec.recommendation.recommended);
  return tasted || recommended;
}

// ---------------------------------------------------------------------------
// Fit scoring
// ---------------------------------------------------------------------------
// Weights come straight from palate_seed.json. Sensory attributes are 0-10;
// the weighted result is expressed 0-100 to match the jd_fit field.

export const WHISKEY_WEIGHTS = {
  sweet_toasted_oak: 0.25,
  caramel_vanilla_brown_sugar: 0.20,
  texture_body: 0.15,
  controlled_spice: 0.15,
  finish_quality: 0.10,
  compatible_fruit: 0.10,
  proof_integration: 0.05
};

export const SB_WEIGHTS = {
  ripe_fruit_intensity: 0.25,
  citrus_tropical_balance: 0.20,
  acidity_integration: 0.15,
  body_texture: 0.15,
  finish: 0.10,
  restrained_herbal: 0.10,
  minerality: 0.05
};

// Traits that pull a score down regardless of how well the bottle reviews.
// medicinal_cherry is the heaviest: it is the single clearest negative signal
// in the seed data ("reminded me of cough syrup").
// Point deductions on the 0-100 fit scale (NOT 0-10 — an earlier version sized
// these for the wrong scale, which made a full-strength cough-syrup note cost
// only ~9 points and still land in "Low" rather than "Avoid").
// medicinal_cherry dominates deliberately: it is the one trait recorded as a
// strong dislike on its own, independent of everything else in the glass.
const WHISKEY_PENALTIES = {
  medicinal_cherry: 25,
  solvent: 18,
  harsh_grain: 14,
  overly_dry_rye: 12,
  excessive_tannin: 11,
  thin_finish: 10
};

const SB_PENALTIES = {
  grassy_herbal_excess: 14,   // computed from grassy_herbal above tolerance
  thin_finish: 10,
  flabby_acidity: 10
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const num = (v, dflt = null) => (v === null || v === undefined || Number.isNaN(Number(v)) ? dflt : Number(v));

/**
 * Map a raw tasting_profile onto the seven whiskey fit dimensions.
 * Kept separate from scoring so the derivation is inspectable and testable.
 */
export function whiskeyDimensions(tp = {}) {
  const oak = num(tp.oak, null);
  const toast = num(tp.toast_char, null);
  const vanillaCaramel = num(tp.vanilla_caramel, null);
  const sweetness = num(tp.sweetness, null);
  const body = num(tp.body, null);
  const spice = num(tp.spice, null);
  const finish = num(tp.finish_intensity, null);
  const fruit = num(tp.fruit, null);
  const medicinal = num(tp.medicinal_cherry, 0);

  // Sweet toasted oak: oak that arrives with sugar, not tannin.
  const sweetToastedOak = avg([toast, oak, sweetness]);
  // Spice is a positive only when it is integrated; runaway spice is not.
  const controlledSpice = spice == null ? null : 10 - Math.abs(spice - 6) * 1.6;
  // Fruit counts for you only when it isn't the medicinal kind.
  const compatibleFruit = fruit == null ? null : clamp(fruit - medicinal * 0.9, 0, 10);

  return {
    sweet_toasted_oak: sweetToastedOak,
    caramel_vanilla_brown_sugar: vanillaCaramel,
    texture_body: body,
    controlled_spice: controlledSpice == null ? null : clamp(controlledSpice, 0, 10),
    finish_quality: finish,
    compatible_fruit: compatibleFruit,
    proof_integration: proofIntegration(tp)
  };
}

// High proof is fine when the bottle carries it; it is a negative when the heat
// arrives without sweetness or body to absorb it.
function proofIntegration(tp) {
  const proof = num(tp._proof, null);
  if (proof == null) return null;
  const carry = avg([num(tp.body, null), num(tp.sweetness, null)]);
  if (carry == null) return null;
  if (proof <= 100) return clamp(6 + carry * 0.3, 0, 10);
  const excess = (proof - 100) / 10;
  return clamp(6 + carry * 0.3 - excess * 1.1, 0, 10);
}

export function sbDimensions(tp = {}) {
  const fruit = num(tp.fruit, null);
  const citrus = num(tp.citrus, null);
  const tropical = num(tp.tropical, null);
  const acidity = num(tp.acidity, null);
  const body = num(tp.body, null);
  const finish = num(tp.finish_intensity, null);
  const herbal = num(tp.grassy_herbal, null);
  const minerality = num(tp.minerality, null);

  // Balance, not maximum: citrus and tropical should support each other.
  const balance = (citrus == null || tropical == null)
    ? (citrus ?? tropical)
    : 10 - Math.abs(citrus - tropical) * 0.8;
  // Acidity is best mid-high; razor-sharp reads as tart, flabby reads as dull.
  const acidIntegration = acidity == null ? null : 10 - Math.abs(acidity - 6.5) * 1.5;
  // Restrained herbal: the seed profile explicitly warns against assuming a
  // pyrazine-heavy style is wanted.
  const restrainedHerbal = herbal == null ? null : 10 - Math.abs(herbal - 3.5) * 1.4;

  return {
    ripe_fruit_intensity: fruit,
    citrus_tropical_balance: balance == null ? null : clamp(balance, 0, 10),
    acidity_integration: acidIntegration == null ? null : clamp(acidIntegration, 0, 10),
    body_texture: body,
    finish: finish,
    restrained_herbal: restrainedHerbal == null ? null : clamp(restrainedHerbal, 0, 10),
    minerality: minerality
  };
}

function avg(values) {
  const v = values.filter((x) => x !== null && x !== undefined && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/**
 * Compute jd_fit (0-100) plus the reasoning behind it.
 * Returns score:null when there simply isn't enough sensory data — an unknown
 * bottle must not be reported as a confident 50.
 */
export function computeFit(rec) {
  const isWine = rec.category === "sauvignon_blanc";
  const tp = { ...(rec.tasting_profile || {}) };
  if (rec.proof != null) tp._proof = rec.proof;

  const dims = isWine ? sbDimensions(tp) : whiskeyDimensions(tp);
  const weights = isWine ? SB_WEIGHTS : WHISKEY_WEIGHTS;

  let sum = 0, wsum = 0;
  const contributions = [];
  for (const [k, w] of Object.entries(weights)) {
    const v = dims[k];
    if (v == null) continue;
    sum += v * w;
    wsum += w;
    contributions.push({ dimension: k, value: Math.round(v * 10) / 10, weight: w });
  }
  if (wsum < 0.5) {
    // Less than half the weighted profile is known — refuse to pretend.
    return { score: null, fit_label: null, confidence: 0, contributions, penalties: [] };
  }

  let score = (sum / wsum) * 10;   // 0-10 -> 0-100

  const penalties = [];
  const penaltyTable = isWine ? SB_PENALTIES : WHISKEY_PENALTIES;
  const applied = isWine ? sbPenaltyInputs(tp) : whiskeyPenaltyInputs(tp);
  for (const [k, level] of Object.entries(applied)) {
    if (!level) continue;
    const hit = (penaltyTable[k] || 0) * level;
    if (hit > 0) { score -= hit; penalties.push({ trait: k, level, points: Math.round(hit * 10) / 10 }); }
  }

  score = Math.round(clamp(score, 0, 100));
  const confidence = Math.round(clamp(wsum, 0, 1) * 100) / 100;
  return { score, fit_label: fitLabel(score), confidence, contributions, penalties };
}

function whiskeyPenaltyInputs(tp) {
  const med = num(tp.medicinal_cherry, 0);
  const oak = num(tp.oak, 0);
  const finish = num(tp.finish_intensity, 5);
  const sweetness = num(tp.sweetness, 5);
  const spice = num(tp.spice, 5);
  return {
    medicinal_cherry: med >= 4 ? (med - 3) / 7 : 0,
    excessive_tannin: oak >= 8 && sweetness <= 4 ? (oak - 7) / 3 : 0,
    thin_finish: finish <= 3 ? (4 - finish) / 4 : 0,
    overly_dry_rye: spice >= 8 && sweetness <= 3 ? (spice - 7) / 3 : 0
  };
}

function sbPenaltyInputs(tp) {
  const herbal = num(tp.grassy_herbal, 0);
  const finish = num(tp.finish_intensity, 5);
  const acidity = num(tp.acidity, 6);
  return {
    grassy_herbal_excess: herbal >= 7 ? (herbal - 6) / 4 : 0,
    thin_finish: finish <= 3 ? (4 - finish) / 4 : 0,
    flabby_acidity: acidity <= 3 ? (4 - acidity) / 4 : 0
  };
}

export function fitLabel(score) {
  if (score == null) return null;
  if (score >= 93) return "Exceptional";
  if (score >= 85) return "Strong";
  if (score >= 75) return "Possible";
  if (score >= 60) return "Low";
  return "Avoid";
}

// ---------------------------------------------------------------------------
// Promotion
// ---------------------------------------------------------------------------

/**
 * Decide whether a hidden bottle should surface as a recommendation.
 * A manual override always wins, and a bottle carrying a known deal-breaker is
 * never auto-promoted no matter how well it scores generally.
 */
export function shouldRecommend(rec, { manualOverride = null } = {}) {
  if (manualOverride !== null) return { recommended: manualOverride, reason: "manual override" };

  const fit = rec.ratings && rec.ratings.jd_fit != null ? rec.ratings.jd_fit : null;
  if (fit == null) return { recommended: false, reason: "no fit score yet" };

  const tp = rec.tasting_profile || {};
  if (num(tp.medicinal_cherry, 0) >= 6) {
    return { recommended: false, reason: "carries a strong medicinal/cherry note, the clearest known negative" };
  }

  const avail = rec.regional_availability && rec.regional_availability.score != null
    ? rec.regional_availability.score : 0;

  if (fit >= 94) return { recommended: true, reason: `exceptional predicted fit (${fit})` };
  if (fit >= 88 && avail >= 45) return { recommended: true, reason: `strong fit (${fit}) and realistically findable locally` };
  if (fit >= 88) return { recommended: false, reason: `strong fit (${fit}) but not reliably available in the region` };
  return { recommended: false, reason: `fit ${fit} below the promotion threshold` };
}

/**
 * Recompute fit + recommendation across the catalog after new evidence.
 *
 * `topNPerCategory` exists because the absolute thresholds (88 / 94) assume
 * sharply-observed sensory profiles. While profiles are model estimates they
 * cluster in the 60-85 band, so the absolute rule alone promotes nothing and the
 * catalog stays invisible. The relative pass surfaces the best available
 * candidates per category so recommendations exist from day one; it still
 * respects the availability floor and the negative-trait veto, and it never
 * promotes anything below `relativeFloor`. Set topNPerCategory: 0 to use the
 * absolute thresholds only.
 */
export function refreshCatalog(records, { manualOverrides = {}, topNPerCategory = 8, relativeFloor = 72, availabilityFloor = 45 } = {}) {
  const scored = records.map((rec) => {
    const fit = computeFit(rec);
    const next = {
      ...rec,
      ratings: { ...(rec.ratings || {}), jd_fit: fit.score, fit_label: fit.fit_label, confidence: fit.confidence }
    };
    const decision = shouldRecommend(next, { manualOverride: rec.id in manualOverrides ? manualOverrides[rec.id] : null });
    next.recommendation = { ...(rec.recommendation || {}), recommended: decision.recommended, reason: decision.reason };
    next._manual = rec.id in manualOverrides;
    return next;
  });

  if (topNPerCategory > 0) {
    const groups = {};
    for (const r of scored) {
      const key = r.category === "sauvignon_blanc" ? "wine" : "whiskey";
      (groups[key] = groups[key] || []).push(r);
    }
    for (const list of Object.values(groups)) {
      list
        .filter((r) => !r._manual && !r.recommendation.recommended)
        .filter((r) => r.ratings.jd_fit != null && r.ratings.jd_fit >= relativeFloor)
        .filter((r) => (r.regional_availability?.score ?? 0) >= availabilityFloor)
        // The veto still applies — a strong medicinal note is never surfaced.
        .filter((r) => Number(r.tasting_profile?.medicinal_cherry ?? 0) < 6)
        .sort((a, b) => b.ratings.jd_fit - a.ratings.jd_fit)
        .slice(0, topNPerCategory)
        .forEach((r) => {
          r.recommendation = {
            ...r.recommendation,
            recommended: true,
            reason: `among the strongest available matches for your palate (fit ${r.ratings.jd_fit})`
          };
        });
    }
  }

  return scored.map((r) => {
    delete r._manual;
    r.visibility = { show_in_app: isVisible(r), rule: "tasted || recommended" };
    r.lifecycle = lifecycleState(r);
    return r;
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate an incoming catalog payload against the rules in
 * catalog_record.schema.json, plus the data-quality rules from the brief.
 * Returns problems rather than throwing, so a partial import can still proceed.
 */
export function validateCatalog(records, { requireImages = false } = {}) {
  const errors = [];
  const warnings = [];
  const seen = new Set();
  const CATEGORIES = new Set(["bourbon", "rye", "american_whiskey", "sauvignon_blanc"]);

  records.forEach((r, i) => {
    const where = `record ${i}${r && r.id ? ` (${r.id})` : ""}`;
    if (!r || typeof r !== "object") { errors.push(`${where}: not an object`); return; }
    for (const f of ["id", "name", "producer", "category"]) {
      if (!r[f]) errors.push(`${where}: missing required field "${f}"`);
    }
    if (r.category && !CATEGORIES.has(r.category)) errors.push(`${where}: unknown category "${r.category}"`);
    if (r.id) {
      if (seen.has(r.id)) errors.push(`${where}: duplicate id`);
      seen.add(r.id);
    }
    const img = r.image || {};
    if (requireImages && !img.primary_url) errors.push(`${where}: image.primary_url is required`);
    if (!img.primary_url) warnings.push(`${where}: no image yet`);
    // An image can't claim verification without actually having a URL.
    if (img.verified && !img.primary_url) errors.push(`${where}: image.verified is true but there is no URL`);
    if (img.primary_url && !img.source_url) warnings.push(`${where}: image has no source attribution`);
    if (r.barcode && r.barcode.upc && !/^\d{8,14}$/.test(String(r.barcode.upc))) {
      errors.push(`${where}: UPC "${r.barcode.upc}" is not 8-14 digits`);
    }
  });

  return { ok: errors.length === 0, errors, warnings, count: records.length, uniqueIds: seen.size };
}
