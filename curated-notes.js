// Hand-researched tasting notes for the bottles that actually surface.
//
// WHY THIS FILE EXISTS
// The research import looks like 317 individually-profiled bottles. It is not.
// Across all 317 records there are only 28 distinct `research.why` strings,
// 7 distinct `concern` strings, and 29 distinct sensory signatures for 154
// whiskeys — bottles were assigned to ~29 archetypes and had their names
// interpolated into a template sentence. Those archetypes are fine for RANKING
// ("you like sweet toasted-oak bourbon" generalises), but they cannot describe
// an individual pour, and no amount of processing will extract per-bottle detail
// that was never there.
//
// So real notes are researched per bottle, and only for the ~21 that are both
// recommended and not already owned. Enriching all 317 would mean hundreds of
// lookups for records nobody opens.
//
// WHAT IS AND ISN'T CLAIMED
// `nose`/`palate`/`finish` are discrete descriptors lifted from the cited
// sources, not prose invented here. `source_type` says whose words they are:
//   "producer"  — the distillery/winery's own published notes
//   "press"     — trade press or a named reviewer
//   "aggregate" — consistent across several retailer listings, no single origin
// Wine is vintage-sensitive; `vintage` records which year the notes describe and
// `house_style: true` marks notes that characterise the bottling generally.
// Nothing here is a rating. Nothing here feeds the palate engine — these are
// descriptions of the bottle, not of the user's reaction to it.
//
// `product_url` is a REAL product page, which is the whole point: every record in
// catalog-research.js carried only a Bing image-search link, so the image
// extractor had nothing to work on. The Worker fetches these, scores the image it
// finds against the bottle name, and anything that doesn't match confidently goes
// to review rather than onto the page.

export const CURATED_NOTES = {
  // ---------------- whiskey ----------------
  "penelope-toasted-rye": {
    nose: ["cinnamon", "spearmint", "cedar", "raw honey", "toasted marshmallow", "barrel char"],
    palate: ["oak-forward", "cinnamon", "dark chocolate", "caramel", "mint", "clove", "milk chocolate"],
    finish: ["medium-long", "caramel", "butterscotch", "pear", "rye spice", "drying toasted oak"],
    source_type: "press",
    product_url: "https://woodencork.com/collections/penelope-bourbon/products/penelope-bourbon-toasted-series-rye-whiskey",
    sources: [
      { title: "The Whiskey Wash — Penelope Toasted Rye (2024)", url: "https://thewhiskeywash.com/whiskey-reviews/whiskey-review-penelope-toasted-rye-whiskey-2024/" },
      { title: "The Daily Pour — Penelope brings back Toasted Rye", url: "https://thedailypour.com/whiskey/rye/penelope-bourbon-toasted-rye/" }
    ]
  },

  "michter-s-toasted-barrel-strength-rye": {
    // Michter's sells this as "US*1 Toasted Barrel Finish Rye"; it is bottled at
    // barrel strength (110.4 proof), which is what the catalog name refers to.
    official_name: "Michter's US*1 Toasted Barrel Finish Rye",
    nose: ["rye spice", "pepper", "grain", "toasted wood sweetness", "vanilla"],
    palate: ["enhanced spice", "delicate chocolate", "vanilla", "honey", "roasted nuts", "dates"],
    finish: ["lingering", "burnt brown sugar", "crème brûlée", "smoky campfire"],
    proof: 110.4,
    source_type: "producer",
    product_url: "https://michters.com/michters-us-1-toasted-barrel-finish-rye-whiskey-review/",
    sources: [
      { title: "Michter's — US*1 Toasted Barrel Finish Rye", url: "https://michters.com/michters-us-1-toasted-barrel-finish-rye-whiskey-review/" },
      { title: "Bourbon Banter review", url: "https://www.bourbonbanter.com/michters-us-1-toasted-barrel-finish-rye-whiskey-review/" }
    ]
  },

  "peerless-double-oak-rye": {
    nose: ["sweet seasoned oak", "orange zest"],
    palate: ["warm molasses", "earthy cinnamon", "bright florals", "smoked herbs"],
    finish: ["candied smoke"],
    proof: 107,
    source_type: "producer",
    product_url: "https://www.reservebar.com/products/peerless-double-oak-rye/GROUPING-2002002",
    sources: [
      { title: "Kentucky Peerless / ReserveBar listing", url: "https://www.reservebar.com/products/peerless-double-oak-rye/GROUPING-2002002" }
    ],
    note: "Non-chill filtered; aged in a new charred oak barrel then moved to a second new oak barrel."
  },

  "peerless-double-oak-bourbon": {
    nose: ["sweet oak", "orange zest", "cedar", "tobacco", "herbs"],
    palate: ["honey sweetness", "cinnamon", "spicy oak", "leather", "full body"],
    finish: ["viscous", "sweet toasted oak", "dry cocoa"],
    source_type: "producer",
    product_url: "https://www.reservebar.com/products/peerless-double-oak-bourbon/GROUPING-1744429",
    sources: [
      { title: "Kentucky Peerless Distilling", url: "https://kentuckypeerless.com/" },
      { title: "ReserveBar listing", url: "https://www.reservebar.com/products/peerless-double-oak-bourbon/GROUPING-1744429" }
    ]
  },

  "jim-beam-black-7-year": {
    official_name: "Jim Beam Black Extra Aged",
    nose: ["sweet caramel", "vanilla pod", "toasted oak", "roasted peanut", "maple syrup", "baking spice"],
    palate: ["toffee", "sweet corn", "vanilla fudge", "warm oak", "nutmeg", "gentle char", "dark chocolate"],
    finish: ["lingering caramel", "soft spice", "warming oak sweetness", "medium length"],
    proof: 90,
    source_type: "aggregate",
    product_url: "https://www.jimbeam.com/en-us/bourbons/jim-beam-black",
    sources: [
      { title: "Jim Beam — Black", url: "https://www.jimbeam.com/en-us/bourbons/jim-beam-black" },
      { title: "Master of Malt — Jim Beam Black 7 Year", url: "https://www.masterofmalt.com/whiskies/jim-beam/jim-beam-black-7-year-old-whiskey" }
    ],
    note: "Reviewers split on this one: some read it as oaky and slightly bitter rather than sweet."
  },

  "michter-s-toasted-barrel-finish-bourbon": {
    official_name: "Michter's US*1 Toasted Barrel Finish Bourbon",
    nose: ["campfire", "cinnamon", "pecan", "candied fruit"],
    palate: ["campfire", "cinnamon", "pecan", "candied fruit"],
    finish: ["lingering", "baked pear", "vanilla", "marshmallow"],
    proof: 91.4,
    source_type: "producer",
    product_url: "https://www.distillerytrail.com/blog/michters-distillery-releases-us1-toasted-barrel-finish-bourbon/",
    sources: [
      { title: "Michter's official notes via Distillery Trail", url: "https://www.distillerytrail.com/blog/michters-distillery-releases-us1-toasted-barrel-finish-bourbon/" },
      { title: "Whisky Magazine tasting", url: "https://www.whiskymag.com/tastings/michters-us1-toasted-barrel-finish/" }
    ],
    note: "Second barrel is toasted but not charred, from 18-month air-dried wood."
  },

  "old-forester-1910": {
    official_name: "Old Forester 1910 Old Fine Whisky",
    nose: ["buttercream", "sticky toffee", "cedar", "apricot"],
    palate: ["oatmeal raisin cookie", "milk chocolate", "caramel corn", "evolving spice"],
    finish: ["charred oak", "clean peripheral spice"],
    proof: 93,
    source_type: "producer",
    product_url: "https://shop.oldforester.com/old-forester-1910-old-fine-whisky",
    sources: [
      { title: "Old Forester — 1910 Old Fine Whisky", url: "https://shop.oldforester.com/old-forester-1910-old-fine-whisky" },
      { title: "Bourbon Banter review", url: "https://www.bourbonbanter.com/old-forester-1910-old-fine-whisky-review/" }
    ],
    note: "Second-barrelled; fourth and final expression of the Whiskey Row series."
  },

  "elijah-craig-toasted-barrel": {
    nose: ["sweet menthol", "peppermint", "gingerbread", "nutty breadiness", "light caramel", "baked apple"],
    palate: ["peppermint", "apple pie", "warm caramel", "hazelnut", "cinnamon", "ginger spice", "charred oak"],
    finish: ["buttered toast", "minty freshness", "long"],
    abv: 47,
    source_type: "press",
    product_url: "https://unwindbottleshop.com/products/elijah-craig-bourbon-toasted-barrel-750ml",
    sources: [
      { title: "Whisky Magazine tasting", url: "https://www.whiskymag.com/tastings/elijah-craig-toasted-barrel-kentucky-straight-bourbon/" },
      { title: "The Bourbon Finder", url: "https://thebourbonfinder.com/elijah-craig-toasted-barrel/" }
    ],
    note: "Finished in toasted barrels that are flash-charred, which keeps the Straight Bourbon designation."
  },

  "penelope-valencia": {
    official_name: "Penelope Valencia (Vino de Naranja cask finish)",
    nose: ["orange peel", "caramel", "vanilla", "warm spice", "Mediterranean citrus"],
    palate: ["caramel", "orange peel", "vanilla", "cinnamon", "warm grain"],
    finish: ["medium-long", "citrus", "warm spice", "caramel"],
    proof: 95,
    source_type: "aggregate",
    product_url: "https://woodencork.com/collections/penelope-bourbon/products/penelope-valencia-straight-bourbon-finished-in-vino-de-naranja-casks",
    sources: [
      { title: "The Daily Pour — Valencia returns", url: "https://thedailypour.com/" },
      { title: "Wooden Cork listing", url: "https://woodencork.com/collections/penelope-bourbon/products/penelope-valencia-straight-bourbon-finished-in-vino-de-naranja-casks" }
    ],
    note: "74% corn / 16% wheat / 7% rye / 3% malted barley, finished up to a year in Vino de Naranja casks."
  },

  "penelope-rio": {
    official_name: "Penelope Rio (honey + Amburana cask finish)",
    nose: ["sweet honey", "cinnamon rolls"],
    palate: ["gingerbread", "honey", "nectar", "baking spices", "rich body"],
    finish: ["savoury", "subtle honey", "spice"],
    proof: 98,
    source_type: "press",
    product_url: "https://breakingbourbon.com/review/penelope-rio-batch-4-25-901",
    sources: [
      { title: "Breaking Bourbon — Penelope Rio", url: "https://breakingbourbon.com/review/penelope-rio-batch-4-25-901" },
      { title: "Fred Minnick — Penelope releases Amburana-aged Rio", url: "https://www.fredminnick.com/2024/03/18/penelope-bourbon-releases-amburana-aged-rio/" }
    ],
    // Checked deliberately: a first search reported a cachaça cask, which is
    // wrong. It is honey + Amburana (Brazilian hardwood), part of the Cooper
    // Series alongside Tokaji, Rosé and Valencia.
    note: "Double cask finish in American honey and Amburana barrels."
  },

  "penelope-barrel-strength-bourbon": {
    nose: ["vanilla", "caramel", "toasted oak", "butterscotch", "honey", "warm spice"],
    palate: ["toffee", "graham cracker", "cinnamon", "charred oak", "full-bodied"],
    finish: ["long", "warming", "sweet", "oak", "spice"],
    source_type: "aggregate",
    product_url: "https://www.reservebar.com/products/penelope-bourbon-barrel-strength/GROUPING-1267651",
    sources: [
      { title: "American Whiskey Magazine tasting", url: "https://www.americanwhiskeymag.com/reviews/tasting-penelope-bourbon-barrel-strength/" },
      { title: "ReserveBar listing", url: "https://www.reservebar.com/products/penelope-bourbon-barrel-strength/GROUPING-1267651" }
    ],
    note: "Four-grain recipe at cask strength; proof varies by batch."
  },

  // ---------------- wine ----------------
  // Sauvignon Blanc changes materially year to year. `vintage` records which
  // release the notes describe; treat them as a guide to house style, not a
  // promise about the bottle on the shelf.
  "craggy-range-te-muna-road-sauvignon-blanc": {
    nose: ["lime zest", "pink grapefruit", "passionfruit", "jalapeño", "fresh herbs", "wet stone"],
    palate: ["concentrated citrus", "white nectarine", "blackcurrant leaf", "creamy lees mid-palate", "taut acidity"],
    finish: ["mineral", "long", "mouth-watering"],
    vintage: 2025,
    house_style: true,
    source_type: "press",
    product_url: "https://www.kobrandwineandspirits.com/product/craggy_range_te_muna_sauvignon_blanc/",
    sources: [
      { title: "Kobrand — Te Muna Sauvignon Blanc", url: "https://www.kobrandwineandspirits.com/release/te-muna-sauvignon-blanc-2025/" }
    ],
    note: "Martinborough, not Marlborough — cooler, drier and more textural than the classic NZ style."
  },

  "cakebread-sauvignon-blanc": {
    nose: ["pink grapefruit", "Granny Smith apple", "kiwi", "honeydew", "guava", "lime zest"],
    palate: ["bright citrus", "green apple", "orange sherbet", "lemongrass", "tropical hints"],
    finish: ["balanced", "lingering citrus", "melon", "pear"],
    vintage: 2024,
    house_style: true,
    source_type: "producer",
    product_url: "https://67wine.com/products/cakebread-cellars-sauvignon-blanc-north-coast-2024-750ml",
    sources: [
      { title: "Cakebread Cellars via 67 Wine", url: "https://67wine.com/products/cakebread-cellars-sauvignon-blanc-north-coast-2024-750ml" }
    ],
    note: "North Coast bottling; Cakebread planted Sauvignon Blanc as its first white in 1972."
  },

  "spottswoode-sauvignon-blanc": {
    nose: ["lime", "lemon", "grapefruit", "mandarin", "white peach", "cassis bud"],
    palate: ["ripe pear", "green apple", "dried herbs", "toasted wheat berry", "rich and textural"],
    finish: ["long", "mouth-watering", "mineral"],
    vintage: 2023,
    house_style: true,
    source_type: "producer",
    product_url: "https://spottswoode.com/accolades/2025-spottswoode-sauvignon-blanc/",
    sources: [
      { title: "Spottswoode Estate", url: "https://spottswoode.com/accolades/2025-spottswoode-sauvignon-blanc/" }
    ]
  },

  "cloudy-bay-sauvignon-blanc": {
    nose: ["citrus zest", "lime leaf", "apricot", "orange blossom"],
    palate: ["passionfruit", "citrus", "white stone fruit", "pink peppercorn", "hibiscus", "pink grapefruit"],
    finish: ["long", "crisp", "lemon acidity", "subtle saline"],
    vintage: 2024,
    house_style: true,
    source_type: "producer",
    product_url: "https://www.thebarreltap.com/collections/white-wine/products/cloudy-bay-new-zealand-sauvignon-blanc-2024",
    sources: [
      { title: "Cloudy Bay notes via The Barrel Tap", url: "https://www.thebarreltap.com/collections/white-wine/products/cloudy-bay-new-zealand-sauvignon-blanc-2024" },
      { title: "Decanter — Cloudy Bay success story", url: "https://www.decanter.com/wine-reviews-tastings/cloudy-bay-a-sauvignon-blanc-success-story-491449" }
    ],
    note: "The 2024 is more restrained than earlier vintages — less overt tropical push."
  },

  "dragonette-cellars-happy-canyon-sauvignon-blanc": {
    nose: ["white peach", "lime peel", "lemongrass", "tarragon", "stony"],
    palate: ["candied citrus", "tropical fruit", "herbal undertones", "medium-bodied", "gently weighty"],
    finish: ["long", "honeyed minerality"],
    vintage: 2021,
    house_style: true,
    source_type: "press",
    product_url: "https://cache.wine.com/product/Dragonette-Cellars-Happy-Canyon-Sauvignon-Blanc-2021/1103410",
    sources: [
      { title: "Wine.com listing with critic notes", url: "https://cache.wine.com/product/Dragonette-Cellars-Happy-Canyon-Sauvignon-Blanc-2021/1103410" }
    ],
    note: "Reads closer to white Bordeaux than to New Zealand — crushed citrus, white flowers, a touch of brioche."
  },

  "klein-constantia-sauvignon-blanc": {
    nose: ["grapefruit", "lime", "kiwi", "yellow plum", "mango", "citrus blossom", "umami thread"],
    palate: ["quince", "light walnut", "flinty minerality", "fresh salinity", "textured"],
    finish: ["long", "vibrant", "expressive"],
    vintage: 2024,
    house_style: true,
    source_type: "press",
    product_url: "https://67wine.com/products/klein-constantia-sauvignon-blanc-2024-750ml",
    sources: [
      { title: "Winemag.co.za — Sauvignon Blanc of Klein Constantia", url: "https://winemag.co.za/wine/review/sauvignon-blanc-of-klein-constantia/" }
    ],
    note: "Constantia Valley, South Africa. Picked at 4am; roughly 80% wild ferment."
  },

  "dog-point-sauvignon-blanc": {
    nose: ["citrus", "tropical fruit", "jasmine", "orange blossom"],
    palate: ["grapefruit", "juicy tropical fruit", "saline texture", "crisp acidity", "concentrated"],
    finish: ["lengthy", "mineral"],
    vintage: 2025,
    house_style: true,
    source_type: "press",
    product_url: "https://buywinesonline.com/products/dog-point-vineyard-sauvignon-blanc-2025-750-ml",
    sources: [
      { title: "Buy Wines Online — Dog Point 2025", url: "https://buywinesonline.com/products/dog-point-vineyard-sauvignon-blanc-2025-750-ml" },
      { title: "Gismondi on Wine tasting note", url: "https://gismondionwine.com/tasting-notes/202108/dog-point-vineyard-sauvignon-blanc-2019?note=35677" }
    ],
    note: "Made in a reductive, more Burgundian style — savoury and textural rather than overtly fruity."
  },

  "grgich-hills-fum-blanc": {
    official_name: "Grgich Hills Estate Fumé Blanc",
    nose: ["fresh lime", "lemon verbena", "gooseberry", "honeysuckle"],
    palate: ["bright citrus", "star fruit", "green mango", "deft oak"],
    finish: ["long", "chiselled", "slate minerality"],
    vintage: 2023,
    house_style: true,
    source_type: "press",
    product_url: "https://67wine.com/products/grgich-hills-fume-blanc-sauvignon-blanc-napa-valley-2023-organic-750ml",
    sources: [
      { title: "67 Wine — Grgich Hills Fumé Blanc 2023", url: "https://67wine.com/products/grgich-hills-fume-blanc-sauvignon-blanc-napa-valley-2023-organic-750ml" }
    ],
    note: "Certified organic. Oak-influenced, so fuller and less overtly grassy than an unoaked Sauvignon Blanc."
  },

  "matetic-eq-coastal-sauvignon-blanc": {
    nose: ["citrus", "ripe tropical fruit", "mango", "papaya", "grapefruit peel", "saline", "light herbal"],
    palate: ["invigorating", "concentrated", "fruity", "delicate mineral", "crunchy mouthfeel"],
    finish: ["crisp"],
    vintage: 2021,
    house_style: true,
    source_type: "producer",
    product_url: "https://m.wine.com/product/Matetic-EQ-Coastal-Sauvignon-Blanc-2021/1023516",
    sources: [
      { title: "Wine.com — Matetic EQ Coastal", url: "https://m.wine.com/product/Matetic-EQ-Coastal-Sauvignon-Blanc-2021/1023516" },
      { title: "Jancis Robinson — EQ Coastal 2024", url: "https://www.jancisrobinson.com/zh-hans/tastings/322381" }
    ],
    note: "Casablanca Valley, Chile — coastal salinity is the signature."
  },

  "pascal-jolivet-sancerre": {
    nose: ["white grapefruit", "lime pith", "orchard flowers", "fennel", "flinty smoke", "thyme", "cut grass"],
    palate: ["green apple", "gooseberry", "creamy lees texture", "salinity", "stony minerality", "taut and dry"],
    finish: ["long", "flinty", "lime pith", "chalky grip"],
    house_style: true,
    source_type: "aggregate",
    product_url: "https://buywinesonline.com/products/jolivet-sancerre-sauvignon-blanc-2024-750-ml",
    sources: [
      { title: "Buy Wines Online — Pascal Jolivet Sancerre 2024", url: "https://buywinesonline.com/products/jolivet-sancerre-sauvignon-blanc-2024-750-ml" },
      { title: "MMD — Pascal Jolivet range", url: "https://www.mmdltd.com/?p=8649" }
    ],
    // The estate's standard Sancerre, not the Les Caillottes, Le Chêne Marchand
    // or Clos du Roy cuvées, which are separate wines with their own notes.
    note: "Loire Sancerre — flint and chalk rather than tropical fruit."
  }
};

export function curatedNote(catalogId) {
  return CURATED_NOTES[catalogId] || null;
}

/** Product pages worth fetching an image from, keyed by catalog id. */
export function curatedImageSources() {
  return Object.entries(CURATED_NOTES)
    .filter(([, n]) => n.product_url)
    .map(([id, n]) => ({ id, url: n.product_url }));
}
