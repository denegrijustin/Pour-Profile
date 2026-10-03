// Turns cited expert notes (producer + critics, see data/expert-notes.json) into
// matching signals, and explains a bottle's fit in terms of what the sources say.
//
// Pure functions only — shared by the Worker and tests. Nothing here invents flavor:
// every tag/axis comes from a descriptor a linked source actually used.

// Ordered rules: the first matching rule for a term wins. `tag` is a spirits flavor tag
// from flavor-taxonomy.js; `axes` are pour-model axes the descriptor speaks to.
const RULES = [
  [/medicinal|cough syrup|cherry cola/, "medicinal_cherry", ["fruit"]],
  [/dark cherry|black cherry|dried cherry|cherry fudge/, "dark_cherry", ["fruit"]],
  [/cherry/, "cherry", ["fruit"]],
  [/butterscotch/, "butterscotch", ["sweetness"]],
  [/toffee|fudge|caramel corn|caramel popcorn|peanut brittle/, "toffee", ["sweetness", "richness"]],
  [/caramel/, "caramel", ["sweetness"]],
  [/vanilla bean|vanilla|cream soda/, "vanilla", ["sweetness"]],
  [/brown sugar|burnt sugar|creme brulee|crème brûlée|candy corn/, "brown_sugar", ["sweetness"]],
  [/maple/, "maple", ["sweetness"]],
  [/molasses/, "molasses", ["sweetness", "richness"]],
  [/honeycomb|honey|honeyed/, "honey", ["sweetness"]],
  [/marshmallow/, "marshmallow", ["sweetness"]],
  [/charred oak|char\b|campfire|smoky oak|creosote/, "charred_oak", ["oak", "smoke"]],
  [/toasted oak|toasty oak|toasty|toast\b|roasted oak|sweet oak|creamy oak/, "toasted_oak", ["oak"]],
  [/dry oak|dried oak|sawdust/, "dry_oak", ["oak"]],
  [/oak|cedar|wood/, "mature_oak", ["oak"]],
  [/dark chocolate|bitter chocolate|baking chocolate|cacao|cocoa/, "cocoa", ["richness"]],
  [/chocolate|mocha/, "chocolate", ["richness"]],
  [/coffee|espresso/, "coffee", ["richness"]],
  [/pecan|almond|hazelnut|walnut|peanut|nut|macadamia|marzipan|nougat/, "nutty", ["richness"]],
  [/pipe tobacco|sweet tobacco/, "sweet_tobacco", ["richness"]],
  [/tobacco/, "tobacco", ["smoke"]],
  [/leather/, "leather", ["smoke"]],
  [/peat/, "peat", ["smoke"]],
  [/smoke|smoky/, "smoke", ["smoke"]],
  [/earth/, "earth", ["smoke"]],
  [/rye spice|rye bread|caraway|dill/, "rye_spice", ["spice"]],
  [/cinnamon|holiday spice|chai/, "cinnamon", ["spice"]],
  [/clove|allspice/, "clove", ["spice"]],
  [/black pepper|white pepper|pepper\b|peppery|peppercorn/, "pepper", ["spice"]],
  [/baking spice|nutmeg|gingerbread|ginger|oak spice|barrel spice|dark spice|dried spice|spice/, "baking_spice", ["spice"]],
  [/raisin|date\b|prune|sherry|port\b/, "raisin", ["fruit", "richness"]],
  [/dried fig|green fig|fig/, "fig", ["fruit"]],
  [/blackberry|raspberry|strawberry|cranberry|berry|berries|cassis|blackcurrant(?! leaf| bud)|currant/, "berry", ["fruit"]],
  [/apricot|peach|nectarine|plum|stone fruit|greengage/, "stone_fruit", ["fruit"]],
  [/pineapple|mango|papaya|guava|passion ?fruit|lychee|tropical|feijoa|starfruit|kiwi|exotic|banana|coconut/, "tropical_fruit", ["fruit"]],
  [/orange|tangerine|mandarin|clementine|kumquat|blood orange|marmalade/, "orange", ["fruit"]],
  [/pear|quince/, "pear", ["fruit"]],
  [/apple/, "apple", ["fruit"]],
  [/mint|menthol|spearmint|peppermint/, "mint", ["herbal"]],
  [/eucalyptus/, "eucalyptus", ["herbal"]],
  [/anise|aniseed|licorice|liquorice|fennel/, "anise", ["herbal"]],
  [/floral|flower|blossom|honeysuckle|jasmine|elderflower|acacia|chamomile|lilac|lavender|hibiscus|linden|perfumed|hawthorn/, "floral", ["herbal"]],
  [/cut grass|grassy|grass|herbaceous|herbal|herbs?\b|herb\b|green pepper|bell pepper|capsicum|jalape|nettle|tomato leaf|blackcurrant leaf|blackcurrant bud|boxwood|asparagus|snap pea|snow pea|green pea|pea tendril|vegetal|leafy|watercress|basil|sage|thyme|tarragon|rosemary|verbena|lemongrass|fynbos|green tea|green\b/, "herbal", ["herbal"]],
  [/corn/, "corn", ["grain"]],
  [/wheat/, "wheat", ["grain"]],
  [/malt|oat|cereal|grain/, "malt", ["grain"]],
  [/bread|brioche|biscuit|graham|shortbread|cookie|cake|pastry/, "bread", ["grain"]],
  // Wine-leaning descriptors without a spirits tag still inform the axes.
  [/mineral|flint|gunflint|struck match|wet stone|crushed stone|slate|chalk|gravel|graphite|stony|oyster|seashell|crushed shell/, null, ["minerality"]],
  [/saline|salty|salinity|sea salt|sea spray|brine|briny/, null, ["minerality"]],
  [/lime|lemon|grapefruit|citrus|yuzu|pomelo|citron|zesty|key lime|makrut|kaffir/, null, ["acidity", "fruit"]],
  [/melon|honeydew|cantaloupe|watermelon|grape\b|white fruit|orchard fruit|fruit salad|ripe/, null, ["fruit"]],
  [/cream|creamy|custard|butter|lanolin|beeswax|waxy|lees/, null, ["body"]],
  [/crisp|tart|sour/, null, ["acidity"]]
];

/** One descriptor -> { tag, axes } (tag may be null). */
export function classifyTerm(term) {
  const t = String(term || "").toLowerCase().trim();
  for (const [re, tag, axes] of RULES) if (re.test(t)) return { term: t, tag, axes };
  return { term: t, tag: null, axes: [] };
}

/** Distinct spirits flavor tags named by the sources, most-cited first. */
export function termsToTags(terms = []) {
  const counts = new Map();
  for (const term of terms) {
    const { tag } = classifyTerm(term);
    if (tag) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}

/** Axis -> number of descriptors pointing at it. */
export function termsToAxes(terms = []) {
  const out = {};
  for (const term of terms) for (const axis of classifyTerm(term).axes) out[axis] = (out[axis] || 0) + 1;
  return out;
}

/**
 * Critic score summary. Only 100-point scores are averaged together; 20/10/5-point
 * scales are not linear translations of each other, so they are listed, not blended.
 */
export function criticSummary(critics = []) {
  const scored = critics.filter((c) => c.score != null && c.scale);
  const hundred = scored.filter((c) => c.scale === "100");
  const avg100 = hundred.length ? Math.round(hundred.reduce((s, c) => s + c.score, 0) / hundred.length) : null;
  return { count: critics.length, scored: scored.length, avg100, n100: hundred.length };
}

/** The compact form shown on list cards. */
export function expertBrief(expert) {
  if (!expert || expert.confidence === "none") return null;
  const cs = expert.critic_summary || criticSummary(expert.critics);
  return {
    confidence: expert.confidence,
    critic_count: cs.count,
    critic_avg: cs.avg100,
    critic_avg_n: cs.n100,
    flavor_terms: (expert.flavor_terms || []).slice(0, 6)
  };
}

/** Where each axis sits for this person: the average of pours they enjoyed. */
export function axisTargets(evidence = [], category = null) {
  const out = {};
  const pool = category ? evidence.filter((e) => e.category === category) : evidence;
  const axes = new Set(pool.flatMap((e) => Object.keys(e.dimensions || {})));
  for (const axis of axes) {
    const pos = pool.filter((e) => Number.isFinite(e.dimensions[axis]) && (e.enjoyment?.[axis] ?? e.rating / 2) >= 3.5);
    if (pos.length) out[axis] = { target: Math.round((pos.reduce((s, e) => s + e.dimensions[axis], 0) / pos.length) * 10) / 10, samples: pos.length };
  }
  return out;
}

const AXIS_WORD = {
  sweetness: "sweetness", oak: "oak", fruit: "fruit", spice: "spice", herbal: "herbal / green notes",
  smoke: "smoke", minerality: "minerality", acidity: "acidity", richness: "richness", grain: "grain", body: "body"
};
const pretty = (tag) => tag.replaceAll("_", " ");

/**
 * Explain fit from the sources' own descriptors.
 * @param expert   entry from data/expert-notes.json
 * @param palate   tag-affinity profile (buildPalateProfile output)
 * @param targets  axisTargets() output for this category
 * @returns {{ described: string[], tags: string[], reasons: string[], concerns: string[], signal: number|null }}
 *   signal: -1..1 net lean of the sources' flavors against this palate (null if no overlap).
 */
export function explainFromNotes(expert, { palate = {}, targets = {}, category = null } = {}) {
  const empty = { described: [], tags: [], reasons: [], concerns: [], signal: null };
  if (!expert || expert.confidence === "none") return empty;
  const terms = expert.flavor_terms || [];
  const tags = termsToTags(terms);
  const axes = termsToAxes(terms);
  const reasons = [], concerns = [];
  let lean = 0, n = 0;

  if (category !== "wine") {
    const liked = tags.filter((t) => palate[t] && palate[t].confidence !== "none" && palate[t].affinity >= 62);
    const disliked = tags.filter((t) => palate[t] && palate[t].confidence !== "none" && palate[t].affinity <= 40);
    if (liked.length) reasons.push(`Sources describe ${liked.slice(0, 3).map(pretty).join(", ")} — ${liked.length === 1 ? "a flavor" : "flavors"} you've rated well`);
    for (const t of disliked.slice(0, 2)) concerns.push(`Sources note ${pretty(t)}, which you've tended not to enjoy`);
    for (const t of tags) if (palate[t] && palate[t].confidence !== "none") { lean += (palate[t].affinity - 50) / 50; n++; }
  }

  for (const [axis, mentions] of Object.entries(axes)) {
    const t = targets[axis];
    if (!t || mentions < 2) continue;
    if (t.target >= 6) { reasons.push(`Notes lean on ${AXIS_WORD[axis] || axis}; you enjoy it at about ${t.target}/10`); lean += 0.5; n++; }
    else if (t.target <= 3.5) { concerns.push(`Notes lean on ${AXIS_WORD[axis] || axis}; you prefer it low (about ${t.target}/10)`); lean -= 0.5; n++; }
  }

  return { described: terms.slice(0, 10), tags, reasons: reasons.slice(0, 3), concerns: concerns.slice(0, 3), signal: n ? Math.max(-1, Math.min(1, lean / n)) : null };
}

// ---------- linking a saved bottle to its researched catalog record ----------
const FILLER = new Set(["bourbon", "whiskey", "whisky", "straight", "kentucky", "year", "years", "yr", "old", "the", "aged", "wine", "of"]);
export function nameKey(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/'s\b/g, "s").replace(/[^a-z0-9]+/g, " ").trim().split(" ")
    .filter((w) => w && !FILLER.has(w)).sort().join(" ");
}

/**
 * The catalog record a saved bottle corresponds to: explicit catalog_id first, then a
 * name match that ignores filler words ("Eagle Rare 10" = "Eagle Rare 10 Year"), also
 * trying brand + name. An ambiguous name (two records) links to nothing.
 */
export function findCatalogRecord(records, bottle) {
  return linkCatalogRecord(records, bottle)?.record || null;
}

/**
 * Same as findCatalogRecord, but says how the link was made: "linked" (catalog_id),
 * "name" (same name ignoring filler words) or "close" (the saved name's words all appear
 * in exactly one catalog name, e.g. "Rittenhouse Rye" -> "Rittenhouse Rye Bottled in Bond").
 */
export function linkCatalogRecord(records, bottle) {
  if (!bottle) return null;
  if (bottle.catalog_id) { const hit = records.find((r) => r.id === bottle.catalog_id); if (hit) return { record: hit, how: "linked" }; }
  const keys = [nameKey(bottle.name), nameKey(`${bottle.brand || ""} ${bottle.name || ""}`)].filter(Boolean);
  for (const key of keys) {
    const hits = records.filter((r) => nameKey(r.name) === key);
    if (hits.length === 1) return { record: hits[0], how: "name" };
    if (hits.length > 1) return null;
  }
  for (const key of keys) {
    const words = key.split(" ");
    if (words.length < 2) continue;
    const hits = records.filter((r) => { const rw = new Set(nameKey(r.name).split(" ")); return words.every((w) => rw.has(w)); });
    if (hits.length === 1) return { record: hits[0], how: "close" };
    if (hits.length > 1) return null;
  }
  return null;
}
