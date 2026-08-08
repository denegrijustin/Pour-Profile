// Pour Profile flavor taxonomy — single source of truth, mirrored into D1 (migrations/0002_flavor_tags.sql).
// Each tag is a *descriptive* note ("I detected X"). Whether X is liked or disliked is
// learned per-person by the palate engine from ratings, never hardcoded here.
export const FLAVOR_CATEGORIES = [
  { id: "sweet", label: "Sweet" },
  { id: "oak", label: "Oak" },
  { id: "fruit", label: "Fruit" },
  { id: "spice", label: "Spice" },
  { id: "rich_dessert", label: "Rich / Dessert" },
  { id: "herbal", label: "Herbal" },
  { id: "grain", label: "Grain" },
  { id: "smoke_earth", label: "Smoke / Earth" },
  { id: "texture", label: "Texture / Structure" }
];

export const FLAVOR_TAGS = [
  // Sweet
  ["caramel", "sweet"], ["vanilla", "sweet"], ["brown_sugar", "sweet"], ["maple", "sweet"],
  ["honey", "sweet"], ["molasses", "sweet"], ["butterscotch", "sweet"], ["brueleed_sugar", "sweet"],
  ["marshmallow", "sweet"],
  // Oak
  ["toasted_oak", "oak"], ["fresh_oak", "oak"], ["charred_oak", "oak"], ["mature_oak", "oak"],
  ["dry_oak", "oak"], ["tannic_oak", "oak"],
  // Fruit — natural dark cherry and medicinal cherry are deliberately separate tags
  ["cherry", "fruit"], ["dark_cherry", "fruit"], ["medicinal_cherry", "fruit"], ["apple", "fruit"],
  ["pear", "fruit"], ["orange", "fruit"], ["raisin", "fruit"], ["fig", "fruit"], ["berry", "fruit"],
  ["stone_fruit", "fruit"], ["tropical_fruit", "fruit"],
  // Spice
  ["cinnamon", "spice"], ["clove", "spice"], ["pepper", "spice"], ["rye_spice", "spice"],
  ["baking_spice", "spice"], ["chili", "spice"],
  // Rich / Dessert
  ["chocolate", "rich_dessert"], ["cocoa", "rich_dessert"], ["coffee", "rich_dessert"],
  ["mocha", "rich_dessert"], ["vanilla_cream", "rich_dessert"], ["toffee", "rich_dessert"],
  ["praline", "rich_dessert"], ["nutty", "rich_dessert"], ["sweet_tobacco", "rich_dessert"],
  ["toasted_marshmallow", "rich_dessert"],
  // Herbal
  ["mint", "herbal"], ["eucalyptus", "herbal"], ["anise", "herbal"], ["herbal", "herbal"],
  ["medicinal", "herbal"], ["floral", "herbal"],
  // Grain
  ["corn", "grain"], ["wheat", "grain"], ["rye_grain", "grain"], ["malt", "grain"],
  ["cereal", "grain"], ["bread", "grain"],
  // Smoke / Earth
  ["smoke", "smoke_earth"], ["peat", "smoke_earth"], ["tobacco", "smoke_earth"],
  ["leather", "smoke_earth"], ["earth", "smoke_earth"],
  // Texture / structure — not a "flavor" but tracked the same way for the match engine
  ["rich_mouthfeel", "texture"], ["thin_mouthfeel", "texture"], ["rounded_finish", "texture"],
  ["dessert_like_finish", "texture"], ["excessive_dryness", "texture"], ["hot_ethanol", "texture"],
  ["bitter_oak", "texture"], ["double_oaked", "texture"]
];
