// Category list + category-specific attribute schemas, so tequila doesn't inherit bourbon-only fields.
export const CATEGORIES = [
  { id: "bourbon", label: "Bourbon" },
  { id: "rye", label: "Rye" },
  { id: "american_whiskey", label: "American Whiskey" },
  { id: "scotch", label: "Scotch" },
  { id: "irish", label: "Irish Whiskey" },
  { id: "japanese", label: "Japanese Whisky" },
  { id: "canadian", label: "Canadian Whisky" },
  { id: "tequila", label: "Tequila" },
  { id: "mezcal", label: "Mezcal" },
  { id: "rum", label: "Rum" },
  { id: "gin", label: "Gin" },
  { id: "brandy", label: "Brandy" },
  { id: "cognac", label: "Cognac" },
  { id: "armagnac", label: "Armagnac" },
  { id: "cachaca", label: "Cachaça" },
  { id: "wine", label: "Wine" },
  { id: "other", label: "Other" }
];

// Extra fields shown/edited per category, stored in bottles.category_attrs (JSON).
export const CATEGORY_ATTRS = {
  tequila: [
    { key: "tequila_class", label: "Class", options: ["blanco", "reposado", "anejo", "extra_anejo", "joven"] },
    { key: "additive_free", label: "Additive-free (reliably known)", type: "boolean" },
    { key: "agave", label: "Agave", type: "text", placeholder: "e.g. 100% Blue Weber" },
    { key: "nom", label: "NOM", type: "text", placeholder: "e.g. 1123" },
    { key: "cooking_method", label: "Oven / cooking method", type: "text" }
  ],
  mezcal: [
    { key: "agave", label: "Agave / maguey", type: "text" },
    { key: "region", label: "Region", type: "text" },
    { key: "cooking_method", label: "Cooking method", type: "text", placeholder: "e.g. earthen pit" }
  ],
  scotch: [
    { key: "region", label: "Region", options: ["speyside", "highland", "lowland", "islay", "campbeltown", "island"] },
    { key: "style", label: "Style", options: ["single_malt", "single_grain", "blended_malt", "blended"] },
    { key: "peat_level", label: "Peat level", options: ["none", "light", "medium", "heavy"] },
    { key: "cask", label: "Cask", type: "text", placeholder: "e.g. ex-bourbon, sherry" }
  ],
  rum: [
    { key: "style", label: "Style", options: ["white", "gold", "dark", "spiced", "agricole", "navy"] },
    { key: "column_or_pot", label: "Still type", options: ["column", "pot", "blend"] }
  ],
  gin: [
    { key: "style", label: "Style", options: ["london_dry", "old_tom", "navy_strength", "contemporary", "sloe"] },
    { key: "botanicals", label: "Notable botanicals", type: "text" }
  ]
};

export const STATUS_TAGS = [
  { id: "tried", label: "Tried" },
  { id: "favorite", label: "Favorite" },
  { id: "like", label: "Like" },
  { id: "neutral", label: "Neutral" },
  { id: "dislike", label: "Dislike" },
  { id: "avoid", label: "Avoid" },
  { id: "want_to_try", label: "Want to Try" },
  { id: "want_to_buy", label: "Want to Buy" },
  { id: "own", label: "Own" },
  { id: "finished_bottle", label: "Finished Bottle" }
];

export const SERVING_STYLES = [
  { id: "neat", label: "Neat" },
  { id: "rocks", label: "On the Rocks" },
  { id: "water", label: "With Water" },
  { id: "cocktail", label: "Cocktail" }
];

export const VENUE_TYPES = [
  { id: "bar", label: "Bar" },
  { id: "restaurant", label: "Restaurant" },
  { id: "liquor_store", label: "Liquor Store" },
  { id: "distillery_tasting_room", label: "Distillery Tasting Room" },
  { id: "home", label: "Home" },
  { id: "private", label: "Private / Friend's House" },
  { id: "other", label: "Other" }
];

export function titleize(slug) {
  if (!slug) return "";
  return slug.replace(/^brand:/, "").split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || titleize(id);
}
