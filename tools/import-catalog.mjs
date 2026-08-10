#!/usr/bin/env node
// Import a deep-research catalog CSV into the app's catalog format.
//
//   node tools/import-catalog.mjs <file.csv> [--out catalog-imported.js] [--dry-run]
//
// Built against the 79-column whiskey matcher schema. Tolerant by design:
// column names are matched case/spacing-insensitively with aliases, because
// research exports rename things between passes.
//
// Two rules drive everything here:
//
//  1. "unspecified" means NULL. The research deliberately used it instead of
//     inventing values, so importing it as a literal string would destroy the
//     one property that makes the dataset trustworthy.
//
//  2. Research scores are preserved but are NOT authoritative for fit. The CSV's
//     JD_fit_score is a static snapshot; this app recomputes fit from the sensory
//     features so it moves as real ratings accumulate. Both are kept, and large
//     disagreements are reported rather than hidden.

import fs from "node:fs";
import path from "node:path";
import { computeFit, fitLabel, validateCatalog, refreshCatalog } from "../catalog-engine.js";

const NULLISH = new Set(["", "unspecified", "unknown", "n/a", "na", "none", "null", "-", "tbd", "pending"]);

// ---------- CSV ----------

/** RFC4180-ish parser: handles quoted fields, embedded commas, newlines, "" escapes. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  text = text.replace(/^﻿/, "");                 // strip BOM
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* handled by \n */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function buildLookup(header) {
  const map = new Map();
  header.forEach((h, i) => map.set(norm(h), i));
  return (...names) => {
    for (const n of names) {
      const i = map.get(norm(n));
      if (i !== undefined) return i;
    }
    return -1;
  };
}

function cell(row, idx) {
  if (idx < 0) return null;
  const v = (row[idx] ?? "").trim();
  return NULLISH.has(v.toLowerCase()) ? null : v;
}

function numCell(row, idx, { max = null } = {}) {
  const v = cell(row, idx);
  if (v === null) return null;
  const cleaned = v.replace(/[$,]/g, "").replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  if (max !== null && n > max) return null;   // out-of-range guard
  return n;
}

function boolCell(row, idx) {
  const v = cell(row, idx);
  if (v === null) return false;
  return ["true", "yes", "y", "1"].includes(v.toLowerCase());
}

const mean = (vals) => {
  const v = vals.filter((x) => x !== null && x !== undefined && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function slug(s) {
  return String(s || "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

// ---------- mapping ----------

/**
 * The research CSV carries 27 granular sensory columns; the fit engine consumes
 * nine composites. Averaging related columns rather than picking one keeps the
 * research detail from being silently thrown away.
 */
function toEngineProfile(g, row, scaleMax) {
  const s = (v) => (v === null ? null : (scaleMax === 5 ? v * 2 : v));   // normalise 0-5 -> 0-10

  const sweetness = s(numCell(row, g("sweetness"), { max: scaleMax }));
  const caramel = s(numCell(row, g("caramel"), { max: scaleMax }));
  const vanilla = s(numCell(row, g("vanilla"), { max: scaleMax }));
  const brownSugar = s(numCell(row, g("brown_sugar", "brownsugar"), { max: scaleMax }));
  const maple = s(numCell(row, g("maple"), { max: scaleMax }));
  const toastedOak = s(numCell(row, g("toasted_oak", "toastedoak", "oak"), { max: scaleMax }));
  const char = s(numCell(row, g("char"), { max: scaleMax }));
  const cinnamon = s(numCell(row, g("cinnamon"), { max: scaleMax }));
  const bakingSpice = s(numCell(row, g("baking_spice", "bakingspice"), { max: scaleMax }));
  const ryeSpice = s(numCell(row, g("pepper_rye_spice", "pepperryespice", "spice"), { max: scaleMax }));
  const cherry = s(numCell(row, g("cherry"), { max: scaleMax }));
  const medicinal = s(numCell(row, g("medicinal_cherry_risk", "medicinalcherryrisk", "medicinal_cherry", "medicinal_phenolic_note"), { max: scaleMax }));
  const darkFruit = s(numCell(row, g("dark_fruit", "darkfruit", "fruit"), { max: scaleMax }));
  const body = s(numCell(row, g("body"), { max: scaleMax }));
  const viscosity = s(numCell(row, g("viscosity"), { max: scaleMax }));
  const finishLength = s(numCell(row, g("finish_length", "finishlength", "finish"), { max: scaleMax }));

  // Wine-side columns (present in the Sauvignon Blanc export).
  const acidity = s(numCell(row, g("acidity"), { max: scaleMax }));
  const citrus = s(numCell(row, g("citrus"), { max: scaleMax }));
  const tropical = s(numCell(row, g("tropical"), { max: scaleMax }));
  const grassy = s(numCell(row, g("grass_herbal", "grassy_herbal", "grassherbal"), { max: scaleMax }));
  const mineral = s(numCell(row, g("mineral", "minerality"), { max: scaleMax }));

  return {
    profile_source: "deep_research_import",
    sweetness,
    oak: mean([toastedOak, char]),
    toast_char: toastedOak,
    vanilla_caramel: mean([caramel, vanilla, brownSugar, maple]),
    spice: mean([cinnamon, bakingSpice, ryeSpice]),
    fruit: mean([cherry, darkFruit]),
    body: mean([body, viscosity]),
    finish_intensity: finishLength,
    medicinal_cherry: medicinal,
    acidity, citrus, tropical, grassy_herbal: grassy, minerality: mineral
  };
}

function detectScaleMax(rows, g) {
  // Reports disagree (0-10 vs 0-5). Decide from the data rather than trusting either.
  const cols = ["sweetness", "caramel", "vanilla", "toasted_oak", "body", "finish_length", "acidity", "citrus"];
  let max = 0;
  for (const row of rows) {
    for (const c of cols) {
      const v = numCell(row, g(c));
      if (v !== null && v > max) max = v;
    }
  }
  return max > 5.0001 ? 10 : 5;
}

export function importCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("CSV has no data rows");
  const header = rows[0];
  const g = buildLookup(header);
  const body = rows.slice(1);

  const scaleMax = detectScaleMax(body, g);
  const notes = [];
  const seen = new Set();
  const records = [];
  let fitDisagreements = 0;

  for (const row of body) {
    const name = cell(row, g("expression", "sku_expression", "name", "bottle", "whiskey", "wine"));
    if (!name) continue;
    const producer = cell(row, g("producer", "bottle_producer", "brand")) || "Unknown";

    let id = slug(cell(row, g("candidate_id", "id")) || `${producer}-${name}`);
    if (seen.has(id)) { let n = 2; while (seen.has(`${id}-${n}`)) n++; id = `${id}-${n}`; }
    seen.add(id);

    const rawCategory = (cell(row, g("category")) || "").toLowerCase();
    const category =
      rawCategory.includes("sauvignon") ? "sauvignon_blanc" :
      rawCategory.includes("rye") ? "rye" :
      rawCategory.includes("bourbon") ? "bourbon" :
      rawCategory.includes("wine") ? "sauvignon_blanc" : "american_whiskey";

    const tasting_profile = toEngineProfile(g, row, scaleMax);
    tasting_profile.summary = cell(row, g("short_tasting_summary", "why_you_ll_like_it", "individual_profile", "tasting_summary"));

    const proof = numCell(row, g("proof"));
    const availability01 = numCell(row, g("kansas_kc_regional_availability_score", "regional_availability_score"), { max: 1 });
    const availability010 = numCell(row, g("kc_regional_availability_score_0_10", "kc_regional_availability_score"), { max: 10 });
    const availScore = availability010 !== null ? availability010 * 10
      : availability01 !== null ? availability01 * 100
      : null;

    const researchFit = numCell(row, g("JD_fit_score", "jd_fit_score", "personalized_fit_score", "jd_fit"), { max: 100 });
    const imageUrl = cell(row, g("bottle_image_URL", "bottle_image_url", "image_primary_url"));
    const imageVerified = (cell(row, g("image_verification_status")) || "").toLowerCase().startsWith("verif");

    const rec = {
      id, name, producer,
      category,
      subcategory: cell(row, g("subcategory_style", "subcategory", "barrel_treatment_finishing")),
      country: cell(row, g("country")),
      region: cell(row, g("region_appellation_distillery", "region", "distillery_source")),
      appellation_or_distillery: cell(row, g("distillery_source", "region_appellation_distillery")),
      vintage: numCell(row, g("vintage")),
      age_statement: cell(row, g("age_statement", "age")),
      proof,
      abv: numCell(row, g("abv")) ?? (proof !== null ? proof / 2 : null),
      mash_bill: cell(row, g("mash_bill", "mash_bill_or_grape_composition")),
      grape: category === "sauvignon_blanc" ? "Sauvignon Blanc" : null,
      typical_price_usd: (() => {
        const t = numCell(row, g("realistic_street_price_usd", "typical_street_price_usd", "street_price"));
        const m = numCell(row, g("msrp_usd", "msrp"));
        return t === null && m === null ? null : { typical: t ?? m, msrp: m, street: t };
      })(),
      regional_availability: {
        score: availScore,
        label: cell(row, g("kc_regional_availability", "kansas_kc_availability", "availability_label")),
        kansas: null, kansas_city_metro: null, regional: null,
        confidence: numCell(row, g("research_confidence"), { max: 1 }),
        allocation_difficulty: numCell(row, g("allocation_difficulty")),
        sources: [cell(row, g("availability_source_url"))].filter(Boolean).map((url) => ({ name: "availability", url }))
      },
      ratings: {
        // Kept distinct exactly as the research insists: three different questions.
        general: numCell(row, g("general_rating"), { max: 100 }),
        tasting: numCell(row, g("tasting_score"), { max: 100 }),
        research_fit: researchFit,              // the CSV's own snapshot
        research_fit_label: cell(row, g("fit_label")),
        jd_fit: null,                            // recomputed below by this app's engine
        fit_label: null,
        confidence: numCell(row, g("research_confidence"), { max: 1 })
      },
      research: {
        overall_rank: numCell(row, g("overall_rank")),
        quality_rank: numCell(row, g("quality_rank")),
        buy_rank: numCell(row, g("buy_rank")),
        value_score: numCell(row, g("value_score")),
        recommendation_score: numCell(row, g("overall_recommendation_score")),
        verdict: cell(row, g("buy_try_at_bar_skip")),
        critic_consensus: cell(row, g("critic_consensus")),
        why: cell(row, g("why_you_ll_like_it")),
        concern: cell(row, g("why_you_might_not", "potential_concern")),
        nearest: cell(row, g("nearest_known_bottles")),
        serving: cell(row, g("recommended_serving"))
      },
      tasting_profile,
      recommendation: {
        recommended: false,
        reason: null,
        concern: cell(row, g("why_you_might_not", "potential_concern")),
        best_for: (cell(row, g("recommended_serving")) || "").split(/[,;/]/).map((x) => x.trim()).filter(Boolean)
      },
      user_state: {
        tasted: boolCell(row, g("tasted", "tasted_")),
        user_rating: numCell(row, g("your_rating", "user_rating"), { max: 100 }),
        user_notes: null,
        want_to_try: boolCell(row, g("want_to_try")),
        favorite: false
      },
      visibility: { show_in_app: false, rule: "tasted || recommended" },
      image: {
        // Only trust an image the research actually verified.
        primary_url: imageVerified ? imageUrl : null,
        source_url: cell(row, g("image_source", "image_source_url")),
        source_name: cell(row, g("image_source")),
        alt: cell(row, g("bottle_image_alt_text", "image_alt")) || `${name} bottle`,
        verified: imageVerified && !!imageUrl,
        cached_image_path: null,
        unverified_candidate_url: !imageVerified ? imageUrl : null,
        lookup_url: cell(row, g("photo_lookup_URL", "photo_lookup_url"))
      },
      barcode: (() => {
        const upc = cell(row, g("barcode_upc", "upc", "barcode"));
        // Only accept something that actually looks like a UPC/EAN.
        return { upc: upc && /^\d{8,14}$/.test(upc) ? upc : null, ean: null, source: null, verified: false };
      })(),
      sources: [cell(row, g("source_URLs", "research_sources", "tasting_source_url"))].filter(Boolean).map((url) => ({ type: "research", name: "research", url })),
      last_verified: cell(row, g("date_researched", "research_date", "last_verified"))
    };

    // The research fit is expert-calibrated against the known anchors, so it is
    // authoritative on import. The model score is computed alongside it, both so
    // divergence is visible and so records without a research value still score.
    const fit = computeFit(rec);
    rec.ratings.model_fit = fit.score;
    rec.ratings.model_fit_label = fit.fit_label;
    rec.ratings.jd_fit_source = researchFit !== null ? "research" : "model";
    rec.ratings.jd_fit = researchFit !== null ? researchFit : fit.score;
    rec.ratings.fit_label = researchFit !== null ? (rec.ratings.research_fit_label || fitLabel(researchFit)) : fit.fit_label;
    if (researchFit !== null && fit.score !== null && Math.abs(researchFit - fit.score) > 15) fitDisagreements++;

    records.push(rec);
  }

  notes.push(`Sensory scale detected as 0-${scaleMax}${scaleMax === 5 ? " (normalised to 0-10)" : ""}.`);
  if (fitDisagreements) notes.push(`${fitDisagreements} record(s) differ by >15 points between the CSV's JD_fit_score and this app's recomputed fit — both are stored.`);

  return { records, notes, scaleMax };
}

// ---------- CLI ----------

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) { console.error("usage: node tools/import-catalog.mjs <file.csv> [--out FILE] [--dry-run]"); process.exit(1); }
  const outIdx = args.indexOf("--out");
  const out = outIdx >= 0 ? args[outIdx + 1] : "catalog-imported.js";
  const dryRun = args.includes("--dry-run");

  const { records, notes } = importCsv(fs.readFileSync(file, "utf8"));
  const validation = validateCatalog(records);
  const refreshed = refreshCatalog(records);

  const withImages = records.filter((r) => r.image.primary_url).length;
  const withUpc = records.filter((r) => r.barcode.upc).length;
  const withAvail = records.filter((r) => r.regional_availability.score !== null).length;
  const withGeneral = records.filter((r) => r.ratings.general !== null).length;
  const scored = records.filter((r) => r.ratings.jd_fit !== null).length;
  const recommended = refreshed.filter((r) => r.recommendation.recommended).length;
  const lowConfidence = records.filter((r) => (r.ratings.confidence ?? 0) < 0.6).length;
  const byCat = records.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {});

  console.log(`\nImported ${records.length} records from ${path.basename(file)}`);
  console.log(`  by category:        ${Object.entries(byCat).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`  fit computed:       ${scored}/${records.length}`);
  console.log(`  verified images:    ${withImages}`);
  console.log(`  real UPCs:          ${withUpc}`);
  console.log(`  availability score: ${withAvail}`);
  console.log(`  critic general:     ${withGeneral}`);
  console.log(`  low confidence:     ${lowConfidence}`);
  console.log(`  would recommend:    ${recommended}`);
  console.log(`  unique ids:         ${validation.uniqueIds}`);
  if (notes.length) console.log("\nNotes:\n" + notes.map((n) => "  - " + n).join("\n"));
  if (validation.errors.length) console.log("\nErrors:\n" + validation.errors.slice(0, 20).map((e) => "  ! " + e).join("\n"));

  if (!dryRun) {
    const header = `// GENERATED by tools/import-catalog.mjs from ${path.basename(file)} — do not edit by hand.\n`;
    fs.writeFileSync(out, `${header}export const IMPORTED_CATALOG = ${JSON.stringify(records, null, 1)};\n`);
    console.log(`\nWrote ${out}`);
  } else {
    console.log("\n(dry run — nothing written)");
  }
}
