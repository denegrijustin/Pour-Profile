// Starter reference catalog.
//
// HONESTY CONTRACT — read before adding rows.
//
// Every field here is one of two kinds, and they are not mixed:
//
//   (a) Product identity and style — producer, category, style, and the 0-10
//       sensory estimates. These come from widely-published product knowledge.
//       The sensory numbers are explicitly *model estimates*, flagged
//       profile_source: "model_estimate", and exist to drive fit scoring. They
//       are not claimed to be measured or sourced.
//
//   (b) Verifiable external facts — image URLs, UPCs, retail prices, critic
//       scores, and Kansas/regional availability. These are LEFT NULL. They were
//       not verifiable when this file was written (no network access to producer
//       sites, retailers, or barcode databases), and inventing them would put
//       600 broken image links and unfounded availability claims into the app.
//       The importer fills them in from a researched dataset — see
//       docs/CATALOG_RESEARCH.md.
//
// `distribution_estimate` is a rough national-footprint guess used only to gate
// promotion; it is NOT a Kansas availability claim and carries confidence 0.3.

const NO_IMAGE = { primary_url: null, source_url: null, source_name: null, alt: null, verified: false, cached_image_path: null };

function whiskey([id, name, producer, category, subcategory, proof, dims, dist, note]) {
  const [sweetness, oak, spice, fruit, body, finish_intensity, medicinal_cherry, vanilla_caramel, toast_char] = dims;
  return {
    id, name, producer, category, subcategory,
    country: "USA", region: null, appellation_or_distillery: null,
    vintage: null, age_statement: null, proof, abv: proof == null ? null : proof / 2,
    mash_bill: null, grape: null,
    typical_price_usd: null,
    regional_availability: {
      score: dist, label: distLabel(dist),
      kansas: null, kansas_city_metro: null, regional: null,
      confidence: 0.3, sources: [],
      note: "National-footprint estimate only. No Kansas-specific availability was verified."
    },
    ratings: { general: null, tasting: null, jd_fit: null, fit_label: null, confidence: 0 },
    tasting_profile: {
      summary: note || null,
      profile_source: "model_estimate",
      sweetness, oak, spice, fruit, body, finish_intensity,
      medicinal_cherry, vanilla_caramel, toast_char,
      acidity: null, citrus: null, tropical: null, grassy_herbal: null, minerality: null
    },
    recommendation: { recommended: false, reason: null, concern: null, best_for: [] },
    user_state: { tasted: false, user_rating: null, user_notes: null, want_to_try: false, favorite: false },
    visibility: { show_in_app: false, rule: "tasted || recommended" },
    image: { ...NO_IMAGE },
    barcode: { upc: null, ean: null, source: null, verified: false },
    sources: [],
    last_verified: null
  };
}

function sb([id, name, producer, country, region, dims, dist, note]) {
  const [fruit, acidity, citrus, tropical, grassy_herbal, minerality, body, finish_intensity] = dims;
  return {
    id, name, producer, category: "sauvignon_blanc", subcategory: null,
    country, region, appellation_or_distillery: null,
    vintage: null, age_statement: null, proof: null, abv: null,
    mash_bill: null, grape: "Sauvignon Blanc",
    typical_price_usd: null,
    regional_availability: {
      score: dist, label: distLabel(dist),
      kansas: null, kansas_city_metro: null, regional: null,
      confidence: 0.3, sources: [],
      note: "National-footprint estimate only. No Kansas-specific availability was verified."
    },
    ratings: { general: null, tasting: null, jd_fit: null, fit_label: null, confidence: 0 },
    tasting_profile: {
      summary: note || null,
      profile_source: "model_estimate",
      fruit, acidity, citrus, tropical, grassy_herbal, minerality, body, finish_intensity,
      sweetness: 2, oak: null, spice: null, medicinal_cherry: 0, vanilla_caramel: null, toast_char: null
    },
    recommendation: { recommended: false, reason: null, concern: null, best_for: [] },
    user_state: { tasted: false, user_rating: null, user_notes: null, want_to_try: false, favorite: false },
    visibility: { show_in_app: false, rule: "tasted || recommended" },
    image: { ...NO_IMAGE },
    barcode: { upc: null, ean: null, source: null, verified: false },
    sources: [],
    last_verified: null
  };
}

function distLabel(score) {
  if (score >= 80) return "Common";
  if (score >= 55) return "Findable";
  if (score >= 35) return "Limited";
  if (score >= 15) return "Allocated";
  return "Rare";
}

// dims: [sweet, oak, spice, fruit, body, finish, medicinalCherry, vanillaCaramel, toastChar]
export const WHISKEY_CATALOG = [
  // --- the user's stated anchors, so the model can be sanity-checked ---
  whiskey(["angels-envy-rye", "Angel's Envy Rye", "Angel's Envy", "rye", "finished_rye", 100, [8,7,6,7,8,8,1,8,6], 70, "Port-barrel finished rye; sweet and rounded rather than dry and herbal."]),
  whiskey(["penelope-toasted", "Penelope Toasted", "Penelope Bourbon", "bourbon", "toasted_barrel", 104, [8,8,5,6,8,8,0,9,9], 65, "Toasted-barrel finishing pushes caramelised oak, vanilla and brown sugar."]),
  whiskey(["jim-beam-green-label", "Jim Beam Green Label", "Jim Beam", "bourbon", null, null, [7,6,4,5,6,6,0,7,5], 55, "Softer, sweeter Beam-family profile."]),
  whiskey(["makers-mark", "Maker's Mark", "Maker's Mark", "bourbon", "wheated", 90, [6,5,3,4,5,5,2,6,3], 95, "Wheated, soft, comparatively light on toasted oak."]),
  whiskey(["four-roses-yellow", "Four Roses Yellow Label", "Four Roses", "bourbon", null, 80, [4,4,5,6,4,4,3,4,2], 90, "Light, floral, fruit-forward house style."]),
  whiskey(["j-rieger-rye", "J. Rieger Rye", "J. Rieger & Co.", "rye", null, 90, [3,5,8,6,4,4,9,3,2], 45, "Herbal, syrupy-cherry character — the strongest recorded negative."]),
  whiskey(["rittenhouse-rye", "Rittenhouse Rye Bottled-in-Bond", "Heaven Hill", "rye", "bottled_in_bond", 100, [4,6,8,4,6,6,2,5,3], 70, "Classic dry, spice-driven rye."]),
  whiskey(["rabbit-hole-heigold", "Rabbit Hole Heigold", "Rabbit Hole", "bourbon", "high_rye", 95, [7,7,6,6,7,7,1,7,6], 45, "High-rye mash with a sweeter, fuller build."]),
  whiskey(["rabbit-hole-cavehill", "Rabbit Hole Cavehill", "Rabbit Hole", "bourbon", "four_grain", 95, [7,6,5,6,7,7,1,7,5], 45, "Four-grain, honeyed and rounded."]),
  whiskey(["rabbit-hole-dareringer", "Rabbit Hole Dareringer", "Rabbit Hole", "bourbon", "sherry_finish", 93, [8,7,4,8,8,8,2,8,6], 40, "Sherry-cask finished wheated bourbon; dark fruit and sweetness."]),

  // --- toasted / double-oaked: the style the profile points hardest at ---
  whiskey(["woodford-double-oaked", "Woodford Reserve Double Oaked", "Woodford Reserve", "bourbon", "double_oaked", 90.4, [8,9,4,6,8,8,1,9,9], 85, "Re-barrelled into deeply toasted oak; caramel and vanilla forward."]),
  whiskey(["michters-toasted-bourbon", "Michter's US*1 Toasted Barrel Bourbon", "Michter's", "bourbon", "toasted_barrel", 91.4, [8,8,5,6,8,8,1,9,9], 35, "Toasted-barrel finish over the US*1 bourbon."]),
  whiskey(["old-forester-1910", "Old Forester 1910 Old Fine Whisky", "Old Forester", "bourbon", "double_barrel", 93, [8,8,5,6,8,8,1,9,9], 70, "Second-barrel char; dessert-leaning."]),
  whiskey(["jack-daniels-twice-barreled", "Jack Daniel's Twice Barreled Heritage Barrel", "Jack Daniel's", "american_whiskey", "toasted", 100, [7,8,5,5,7,8,1,8,8], 30, "Toasted heritage barrel expression."]),
  whiskey(["penelope-barrel-strength", "Penelope Barrel Strength", "Penelope Bourbon", "bourbon", "barrel_proof", 115, [7,8,6,6,8,8,0,8,7], 45, "Uncut version of the Penelope four-grain blend."]),
  whiskey(["penelope-architect", "Penelope Architect", "Penelope Bourbon", "bourbon", "toasted_barrel", 104, [8,8,5,6,8,8,0,9,9], 40, "French-oak toasted finishing series."]),

  // --- Buffalo Trace / Sazerac ---
  whiskey(["buffalo-trace", "Buffalo Trace Kentucky Straight Bourbon", "Buffalo Trace", "bourbon", null, 90, [6,6,5,6,6,6,2,7,5], 75, "Widely distributed benchmark bourbon."]),
  whiskey(["eagle-rare-10", "Eagle Rare 10 Year", "Buffalo Trace", "bourbon", null, 90, [6,7,4,7,6,7,2,7,5], 35, "Aged, balanced, frequently allocated."]),
  whiskey(["weller-special-reserve", "W.L. Weller Special Reserve", "Buffalo Trace", "bourbon", "wheated", 90, [7,5,3,5,6,5,1,7,4], 25, "Wheated and soft; demand outstrips supply."]),
  whiskey(["weller-antique-107", "W.L. Weller Antique 107", "Buffalo Trace", "bourbon", "wheated", 107, [8,6,4,6,8,7,1,8,5], 20, "Higher-proof wheated Weller."]),
  whiskey(["stagg", "Stagg (Batch Proof)", "Buffalo Trace", "bourbon", "barrel_proof", null, [7,9,6,8,9,9,3,8,8], 15, "Uncut barrel-proof; dark, oaky and intense. Proof varies by batch."]),
  whiskey(["blantons-single-barrel", "Blanton's Single Barrel", "Buffalo Trace", "bourbon", "single_barrel", 93, [7,7,5,7,7,7,2,8,6], 20, "Allocated single barrel."]),
  whiskey(["benchmark-old-no8", "Benchmark Old No. 8", "Buffalo Trace", "bourbon", "value", 80, [4,4,4,4,4,3,2,4,2], 90, "Entry-level value bourbon."]),
  whiskey(["sazerac-rye", "Sazerac Rye", "Sazerac", "rye", null, 90, [5,5,7,5,5,5,3,5,3], 60, "Approachable rye with noticeable spice."]),

  // --- Heaven Hill ---
  whiskey(["elijah-craig-small-batch", "Elijah Craig Small Batch", "Heaven Hill", "bourbon", null, 94, [7,8,5,5,7,7,1,8,7], 85, "Oak-forward, caramel-heavy; a strong stylistic fit signal."]),
  whiskey(["elijah-craig-barrel-proof", "Elijah Craig Barrel Proof", "Heaven Hill", "bourbon", "barrel_proof", null, [7,9,6,6,9,9,1,9,8], 35, "Uncut Elijah Craig; proof varies by batch."]),
  whiskey(["elijah-craig-toasted", "Elijah Craig Toasted Barrel", "Heaven Hill", "bourbon", "toasted_barrel", 94, [8,9,5,5,8,8,1,9,10], 40, "Toasted-barrel finished Elijah Craig."]),
  whiskey(["larceny-small-batch", "Larceny Small Batch", "Heaven Hill", "bourbon", "wheated", 92, [7,5,3,5,6,5,1,7,4], 80, "Wheated, sweet and soft."]),
  whiskey(["larceny-barrel-proof", "Larceny Barrel Proof", "Heaven Hill", "bourbon", "wheated_barrel_proof", null, [8,6,4,6,8,8,1,8,5], 45, "Uncut wheated bourbon."]),
  whiskey(["evan-williams-bib", "Evan Williams Bottled-in-Bond", "Heaven Hill", "bourbon", "bottled_in_bond", 100, [6,6,5,5,6,6,1,7,4], 80, "Value bottled-in-bond."]),
  whiskey(["henry-mckenna-10", "Henry McKenna Single Barrel 10 Year", "Heaven Hill", "bourbon", "bottled_in_bond", 100, [6,8,5,5,7,7,2,7,5], 35, "Aged bonded single barrel."]),

  // --- Beam Suntory ---
  whiskey(["knob-creek-9", "Knob Creek 9 Year", "Jim Beam", "bourbon", null, 100, [7,8,5,5,8,7,1,8,6], 85, "Oaky, full-bodied Beam expression."]),
  whiskey(["knob-creek-12", "Knob Creek 12 Year", "Jim Beam", "bourbon", null, 100, [7,9,5,5,8,8,1,8,7], 60, "Older, deeper-oak Knob Creek."]),
  whiskey(["knob-creek-rye", "Knob Creek Rye", "Jim Beam", "rye", null, 100, [5,6,8,4,6,6,2,6,4], 75, "Fuller-bodied rye, still spice-led."]),
  whiskey(["bookers", "Booker's Bourbon", "Jim Beam", "bourbon", "barrel_proof", null, [7,8,6,6,9,9,1,8,7], 40, "Uncut, unfiltered; proof varies by batch."]),
  whiskey(["bakers-7", "Baker's 7 Year Single Barrel", "Jim Beam", "bourbon", "single_barrel", 107, [7,7,5,6,8,7,1,8,6], 45, "Rich single-barrel Beam."]),
  whiskey(["basil-haydens", "Basil Hayden's", "Jim Beam", "bourbon", "high_rye", 80, [5,4,6,5,4,4,2,5,3], 85, "Light-bodied, high-rye, gentle."]),

  // --- Brown-Forman ---
  whiskey(["woodford-reserve", "Woodford Reserve Distiller's Select", "Woodford Reserve", "bourbon", null, 90.4, [6,7,5,6,7,6,2,7,5], 90, "Widely available flagship."]),
  whiskey(["old-forester-100", "Old Forester 100 Proof", "Old Forester", "bourbon", null, 100, [6,7,6,5,7,6,1,7,5], 80, "Value-forward, sweet and sturdy."]),
  whiskey(["old-forester-statesman", "Old Forester Statesman", "Old Forester", "bourbon", null, 95, [7,7,5,6,8,7,1,8,6], 45, "Fuller, sweeter Old Forester."]),
  whiskey(["old-forester-1920", "Old Forester 1920 Prohibition Style", "Old Forester", "bourbon", "barrel_proof", 115, [8,8,6,6,9,9,1,9,7], 60, "High-proof, rich and sweet."]),

  // --- Wild Turkey / Campari ---
  whiskey(["russells-reserve-10", "Russell's Reserve 10 Year", "Wild Turkey", "bourbon", null, 90, [6,7,6,5,7,7,1,7,5], 70, "Balanced, oak-driven."]),
  whiskey(["russells-single-barrel", "Russell's Reserve Single Barrel", "Wild Turkey", "bourbon", "single_barrel", 110, [7,8,6,6,8,8,1,8,6], 50, "Higher-proof single barrel."]),
  whiskey(["wild-turkey-101", "Wild Turkey 101", "Wild Turkey", "bourbon", null, 101, [6,7,7,5,7,7,2,7,5], 90, "Spicy, robust, ubiquitous."]),
  whiskey(["rare-breed", "Wild Turkey Rare Breed", "Wild Turkey", "bourbon", "barrel_proof", 116.8, [7,8,7,6,8,8,1,8,6], 65, "Barrel-proof Wild Turkey."]),

  // --- craft / regional, commonly seen in the central U.S. ---
  whiskey(["bardstown-fusion", "Bardstown Bourbon Co. Fusion Series", "Bardstown Bourbon Company", "bourbon", "blend", 98.9, [7,7,5,6,7,7,1,8,6], 50, "Blend of own and sourced stock."]),
  whiskey(["new-riff-bib", "New Riff Bottled-in-Bond Bourbon", "New Riff", "bourbon", "bottled_in_bond", 100, [6,7,7,5,7,7,1,7,5], 50, "High-rye bonded bourbon."]),
  whiskey(["wilderness-trail-bib", "Wilderness Trail Small Batch Bottled-in-Bond", "Wilderness Trail", "bourbon", "bottled_in_bond", 100, [7,7,5,6,8,7,1,8,5], 40, "Sweet-mash, full-bodied."]),
  whiskey(["green-river-bourbon", "Green River Kentucky Straight Bourbon", "Green River", "bourbon", null, 90, [6,6,5,5,6,6,1,7,5], 45, "Approachable, caramel-leaning."]),
  whiskey(["high-west-double-rye", "High West Double Rye!", "High West", "rye", "blend", 92, [4,5,9,4,5,5,3,4,3], 70, "Blend of young and old rye; very spice-forward."]),
  whiskey(["high-west-campfire", "High West Campfire", "High West", "american_whiskey", "blend", 92, [6,6,6,5,7,7,2,6,5], 40, "Blend including peated malt."]),
  whiskey(["1792-small-batch", "1792 Small Batch", "Barton 1792", "bourbon", null, 93.7, [6,7,6,5,7,6,2,7,5], 70, "High-rye, spice and caramel."]),
  whiskey(["ben-holladay-bib", "Ben Holladay Soft Red Wheat Bottled-in-Bond", "Ben Holladay", "bourbon", "wheated_bib", 100, [7,7,4,5,8,7,1,8,5], 45, "Missouri wheated bonded bourbon."]),
  whiskey(["toms-town-rum-cask", "Tom's Town Rum Cask Bourbon", "Tom's Town", "bourbon", "rum_cask", null, [8,6,4,6,7,7,1,8,6], 30, "Kansas City rum-cask finished bourbon."]),
  whiskey(["widow-jane-10", "Widow Jane 10 Year", "Widow Jane", "bourbon", null, 91, [7,7,4,6,7,7,2,8,5], 45, "Sourced, blended, sweet-leaning."]),
  whiskey(["michters-us1-bourbon", "Michter's US*1 Small Batch Bourbon", "Michter's", "bourbon", null, 91.4, [7,6,5,6,7,7,1,8,5], 65, "Soft, sweet, widely stocked."]),
  whiskey(["michters-us1-rye", "Michter's US*1 Rye", "Michter's", "rye", null, 84.8, [6,5,7,5,6,6,2,6,4], 60, "Gentler rye."]),
  whiskey(["uncle-nearest-1856", "Uncle Nearest 1856", "Uncle Nearest", "american_whiskey", null, 100, [7,7,5,6,8,7,1,8,6], 65, "Tennessee whiskey, sweet and full."]),
  whiskey(["angels-envy-bourbon", "Angel's Envy Port Finish Bourbon", "Angel's Envy", "bourbon", "port_finish", 86.6, [8,6,4,8,7,7,2,8,5], 80, "Port-finished; sweet and fruit-forward."])
];

// dims: [fruit, acidity, citrus, tropical, grassyHerbal, minerality, body, finish]
export const SB_CATALOG = [
  // --- stated anchors ---
  sb(["matanzas-creek-sb", "Matanzas Creek Sauvignon Blanc", "Matanzas Creek Winery", "USA", "Sonoma County, California", [7,6,7,6,4,5,6,6], 60, "California Sauvignon Blanc; a stated reference point."]),
  sb(["unshackled-sb", "Unshackled Sauvignon Blanc", "The Prisoner Wine Company", "USA", "California", [8,6,7,7,3,4,6,6], 70, "Riper, rounder California style; a stated reference point."]),

  // --- California ---
  sb(["duckhorn-napa-sb", "Duckhorn Napa Valley Sauvignon Blanc", "Duckhorn", "USA", "Napa Valley, California", [7,7,7,6,4,5,6,7], 70, "Polished Napa style with some texture."]),
  sb(["honig-napa-sb", "Honig Napa Valley Sauvignon Blanc", "Honig", "USA", "Napa Valley, California", [8,7,7,7,4,4,6,6], 60, "Fruit-forward Napa Sauvignon Blanc."]),
  sb(["cakebread-sb", "Cakebread Cellars Sauvignon Blanc", "Cakebread", "USA", "Napa Valley, California", [7,7,7,6,4,5,6,7], 60, "Ripe but structured."]),
  sb(["frogs-leap-sb", "Frog's Leap Sauvignon Blanc", "Frog's Leap", "USA", "Rutherford, California", [7,7,7,5,5,5,6,6], 45, "Rounder Rutherford style."]),
  sb(["dry-creek-fume", "Dry Creek Vineyard Fumé Blanc", "Dry Creek Vineyard", "USA", "Sonoma County, California", [6,7,7,5,5,5,6,6], 50, "Classic Sonoma fumé style."]),
  sb(["kim-crawford-sb", "Kim Crawford Sauvignon Blanc", "Kim Crawford", "New Zealand", "Marlborough", [7,8,7,7,6,4,5,6], 95, "Ubiquitous Marlborough style; tropical with high acid."]),
  sb(["sonoma-cutrer-sb", "Sonoma-Cutrer Sauvignon Blanc", "Sonoma-Cutrer", "USA", "Sonoma County, California", [7,7,7,6,4,5,6,6], 55, "Rounded Sonoma expression."]),
  sb(["st-supery-sb", "St. Supéry Estate Sauvignon Blanc", "St. Supéry", "USA", "Napa Valley, California", [7,7,7,6,4,5,6,6], 45, "Estate Napa Sauvignon Blanc."]),
  sb(["merry-edwards-sb", "Merry Edwards Sauvignon Blanc", "Merry Edwards", "USA", "Russian River Valley, California", [8,6,6,7,3,4,8,8], 40, "Rich, textural, partly barrel-aged."]),
  sb(["rombauer-sb", "Rombauer Sauvignon Blanc", "Rombauer", "USA", "California", [8,6,7,7,3,4,7,7], 55, "Ripe and generous."]),
  sb(["joel-gott-sb", "Joel Gott Sauvignon Blanc", "Joel Gott", "USA", "California", [7,7,7,6,4,4,5,5], 80, "Value California bottling."]),
  sb(["dracaena-sb", "Dracaena Wines Sauvignon Blanc", "Dracaena", "USA", "Paso Robles, California", [7,6,6,6,4,4,6,6], 25, "Central Coast style."]),
  sb(["chalk-hill-sb", "Chalk Hill Sauvignon Blanc", "Chalk Hill", "USA", "Sonoma County, California", [7,7,7,6,4,5,6,6], 45, "Sonoma, moderately rich."]),

  // --- New Zealand ---
  sb(["cloudy-bay-sb", "Cloudy Bay Sauvignon Blanc", "Cloudy Bay", "New Zealand", "Marlborough", [7,8,8,7,6,6,5,7], 75, "Benchmark Marlborough; vivid acid and herbal lift."]),
  sb(["oyster-bay-sb", "Oyster Bay Sauvignon Blanc", "Oyster Bay", "New Zealand", "Marlborough", [7,8,7,7,6,4,5,5], 90, "Widely available Marlborough."]),
  sb(["whitehaven-sb", "Whitehaven Sauvignon Blanc", "Whitehaven", "New Zealand", "Marlborough", [7,8,7,7,6,4,5,6], 80, "Tropical-leaning Marlborough."]),
  sb(["nobilo-sb", "Nobilo Sauvignon Blanc", "Nobilo", "New Zealand", "Marlborough", [7,8,7,7,6,4,5,5], 80, "Everyday Marlborough."]),
  sb(["greywacke-sb", "Greywacke Sauvignon Blanc", "Greywacke", "New Zealand", "Marlborough", [7,8,7,7,5,6,6,7], 35, "More textural Marlborough."]),
  sb(["dog-point-sb", "Dog Point Sauvignon Blanc", "Dog Point", "New Zealand", "Marlborough", [6,8,7,6,7,6,6,7], 35, "Structured, more herbal."]),
  sb(["koha-sb", "Koha Sauvignon Blanc", "Koha", "New Zealand", "Marlborough", [8,8,7,8,7,5,5,6], 40, "Riper Marlborough with clear herbal character."]),

  // --- Loire ---
  sb(["sancerre-generic", "Sancerre (village level)", "Various Loire producers", "France", "Sancerre, Loire", [5,8,7,3,6,8,4,6], 60, "Lean, mineral, high-acid classic style."]),
  sb(["pouilly-fume-generic", "Pouilly-Fumé (village level)", "Various Loire producers", "France", "Pouilly-Fumé, Loire", [5,8,7,3,6,8,5,6], 50, "Flinty Loire counterpart to Sancerre."]),
  sb(["henri-bourgeois-sancerre", "Henri Bourgeois Sancerre Les Baronnes", "Henri Bourgeois", "France", "Sancerre, Loire", [5,8,7,3,6,8,5,7], 45, "Widely distributed Sancerre."]),
  sb(["touraine-sb", "Touraine Sauvignon Blanc", "Various Loire producers", "France", "Touraine, Loire", [5,8,7,3,7,6,4,5], 45, "Value Loire; typically grassier."]),

  // --- rest of world ---
  sb(["bordeaux-blanc-generic", "Bordeaux Blanc (Sauvignon-dominant)", "Various Bordeaux producers", "France", "Bordeaux", [6,7,6,4,5,6,6,6], 45, "Often blended with Sémillon for texture."]),
  sb(["mulderbosch-sb", "Mulderbosch Sauvignon Blanc", "Mulderbosch", "South Africa", "Stellenbosch", [7,7,7,6,5,6,6,6], 40, "Stellenbosch, balanced."]),
  sb(["casas-del-bosque-sb", "Casas del Bosque Sauvignon Blanc", "Casas del Bosque", "Chile", "Casablanca Valley", [7,8,7,6,6,6,5,6], 40, "Cool-climate Chilean."]),
  sb(["santa-rita-120-sb", "Santa Rita 120 Sauvignon Blanc", "Santa Rita", "Chile", "Central Valley", [6,7,7,5,5,4,4,4], 65, "Value Chilean bottling."]),
  sb(["shaw-smith-sb", "Shaw + Smith Sauvignon Blanc", "Shaw + Smith", "Australia", "Adelaide Hills", [7,8,7,6,5,6,6,6], 30, "Adelaide Hills, precise."]),
  sb(["alto-adige-sb", "Alto Adige Sauvignon Blanc", "Various Alto Adige producers", "Italy", "Alto Adige", [6,7,6,5,5,7,5,6], 35, "Alpine, mineral-leaning."]),
  sb(["chateau-ste-michelle-sb", "Chateau Ste. Michelle Sauvignon Blanc", "Chateau Ste. Michelle", "USA", "Columbia Valley, Washington", [7,7,7,6,4,4,5,5], 75, "Widely available Washington bottling."])
];

export const CATALOG = [...WHISKEY_CATALOG, ...SB_CATALOG];
