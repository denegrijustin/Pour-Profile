// Everything that makes up the reference catalog, in one place.
//
//   RESEARCH_CATALOG (catalog-research.js)  — the original deep-research import (317)
//   + additions                              — Kansas-registered bottles selected for
//                                              cited-note research (data/kansas/research-selection.json)
//
// Additions carry no model-estimated sensory numbers: their profile is whatever the
// cited producer/critic notes say (data/expert-notes.json), and their availability is
// the Kansas registration itself.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESEARCH_CATALOG } from "../catalog-research.js";
import { nameKey } from "../expert-match.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (rel, fallback) => {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
};

export function selectionIds() {
  return readJson("data/kansas/research-selection.json", []).map((s) => s.id);
}

const COUNTRY = {
  bourbon: "USA", rye: "USA", american_whiskey: "USA", tequila: "Mexico", mezcal: "Mexico",
  cognac: "France", armagnac: "France"
};

/** One selected Kansas bottle -> a catalog record in the research-catalog shape. */
export function additionRecord(sel, expert, fetched) {
  const facts = expert?.facts || {};
  const summary = expert?.producer?.summary || expert?.critics?.find((c) => c.summary)?.summary || null;
  return {
    id: sel.id,
    name: sel.name,
    producer: sel.brand,
    category: sel.category,
    subcategory: null,
    country: COUNTRY[sel.category] || null,
    region: facts.region || sel.appellation || null,
    vintage: sel.vintage ? Number(sel.vintage) || null : null,
    age_statement: facts.age || null,
    // The Kansas label filing is the bottle a local store can order, so its strength wins.
    proof: sel.proof ?? facts.proof ?? null,
    abv: sel.abv ?? facts.abv ?? null,
    mash_bill: facts.mash_bill || null,
    grape: sel.category === "sauvignon_blanc" ? (facts.mash_bill || "Sauvignon Blanc") : null,
    typical_price_usd: {},
    regional_availability: {
      label: "Registered in Kansas",
      score: 60,
      confidence: 0.9,
      distributors: sel.distributors || [],
      source: "Kansas Dept. of Revenue Active Brand list"
    },
    ratings: {},
    research: {},
    tasting_profile: { profile_source: "cited_notes", summary },
    recommendation: { recommended: false },
    image: {},
    last_verified: fetched ? String(fetched).slice(0, 10) : null,
    data_source: "kansas_registry"
  };
}

export function catalogAdditions() {
  const selection = readJson("data/kansas/research-selection.json", []);
  const notes = readJson("data/expert-notes.json", {});
  const fetched = readJson("data/kansas/registry.json", {}).fetched;
  return selection.map((s) => additionRecord(s, notes[s.id], fetched));
}

/** The whole catalog the build ships and the tests serve. */
export function fullCatalog() {
  return [...RESEARCH_CATALOG, ...catalogAdditions()];
}

// ---------- Kansas registration for existing catalog records ----------
// Words that differ between a registration label and a catalog name without changing
// which bottle it is ("Knob Creek Aged 9 Years Kentucky Straight Bourbon" = "Knob Creek 9 Year").
const LABEL_NOISE = new Set(["kentucky", "straight", "bourbon", "rye", "whiskey", "whisky", "whiskeys", "tennessee", "small", "batch",
  "blend", "of", "vineyards", "vineyard", "estate", "winery", "wines", "sauvignon", "blanc", "tequila", "rum", "gin", "cognac",
  "bottled", "in", "bond", "aged", "years", "year", "yr", "old", "proof", "the", "sour", "mash", "special", "original", "handmade",
  "distillery", "co", "company"]);
const WHISKEY = new Set(["bourbon", "rye", "american_whiskey"]);

/** Kansas registrations (regular bottles only) that are the same product as a catalog record. */
export function kansasMatches(record, items) {
  const rw = new Set(nameKey(record.name).split(" ").filter(Boolean));
  return items.filter((i) => {
    if (i.store_pick || i.gift_pack) return false;
    if (!(i.category === record.category || (record.category === "american_whiskey" && WHISKEY.has(i.category)))) return false;
    const hw = new Set(nameKey(i.name).split(" ").filter(Boolean));
    return [...hw].every((w) => rw.has(w) || LABEL_NOISE.has(w)) && [...rw].every((w) => hw.has(w) || LABEL_NOISE.has(w));
  });
}

/** Attach `kansas: { distributors }` to every record that is registered for sale in Kansas. */
export function withKansas(records, items) {
  return records.map((r) => {
    const hits = r.data_source === "kansas_registry" ? items.filter((i) => i.id === r.id) : kansasMatches(r, items);
    if (!hits.length) return r;
    return { ...r, kansas: { distributors: [...new Set(hits.flatMap((h) => h.distributors))], registrations: hits.length } };
  });
}
