#!/usr/bin/env node
// Build the Kansas availability list the Worker serves (dist/kansas.json).
//
//   node tools/build-kansas.mjs
//
// Source: data/kansas/registry.json — a filtered snapshot of the Kansas Department of
// Revenue "Active Brand Search" (every product registered for sale in Kansas, with the
// distributor that carries it). Registration means a Johnson County store can order a
// bottle through that distributor; it does not mean any one store has it on the shelf.
//
// Each line: category, brand, label, abv, sizes(ml, comma), distributor codes, vintage, appellation.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Words the registry uses that read as shouting or legal boilerplate in an app list.
const SMALL = new Set(["and", "of", "the", "in", "de", "la", "le", "du", "des", "del", "di", "y", "a", "with", "en"]);
const KEEP_UPPER = new Set(["KSBW", "BIB", "XO", "VS", "VSOP", "VSSOP", "USA", "II", "III", "IV", "NAS", "KC", "OGD", "WT", "EH", "JTS", "HH", "NV", "IPA", "SB", "MGP", "NY", "TX", "KY"]);
export function titleCase(s) {
  return String(s || "").trim().toLowerCase().split(/\s+/).map((w, i) => {
    const up = w.toUpperCase();
    if (KEEP_UPPER.has(up.replace(/[^A-Z]/g, ""))) return up;
    if (i > 0 && SMALL.has(w)) return w;
    return w.replace(/(^|[-'’.(/])([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase());
  }).join(" ").replace(/\bMc([a-z])/g, (m, c) => "Mc" + c.toUpperCase()).replace(/'S\b/g, "'s");
}

const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);

/** Re-derive the category from the text (the snapshot's own guess missed "KSBW"). */
export function classify(category, brand, label) {
  const s = `${brand} ${label}`.toUpperCase();
  if (category === "sauvignon_blanc") return "sauvignon_blanc";
  if (/BOURBON|KSBW|\bSBW\b/.test(s)) return "bourbon";
  if (/\bRYE\b/.test(s) && /WHISK/.test(s)) return "rye";
  return category;
}

// Single-barrel store and club picks: real, but a one-off barrel at one shop.
// Only explicit "picked by <someone>" wording counts — "Single Barrel Select" alone is
// a product name (Jack Daniel's), not a store pick.
const PICK = /\b(BOTTLED FOR|SELECTED BY|SELECTED FOR|PICKED BY|HAND PICKED BY|STORE PICK|WHISKEY GUILD|WHISKEY HUNTERS|BOURBON SOCIETY|BOURBON CLUB|WHISKEY CLUB|AMBASSADORS|LIQUOR\b|WINE (&|AND) SPIRITS LLC|BOTTLE SHOP|\bMHK\b|FRIDGE|RANCHMART|\bVAABC\b)/;
// Barrel programs ("Single Barrel Select", "Private Selection", "Barrel Select") are store
// picks when the store or club name follows the whiskey designation, e.g.
// "Cask Strength Single Barrel Select KSBW Salina Liquor".
const PROGRAM = /(SINGLE BARREL SELECT|PRIVATE SELECT(ION)?|BARREL SELECT(ION)?|HAND ?PICKED)/;
const DESIGNATION = /\b(KSBW|KSRW|SBW|WHISKEY|WHISKY|BOURBON|RYE|TEQUILA|RUM|REPOSADO|ANEJO|AÑEJO|BLANCO)\b(?!.*\b(KSBW|KSRW|SBW|WHISKEY|WHISKY|BOURBON|RYE|TEQUILA|RUM|REPOSADO|ANEJO|AÑEJO|BLANCO)\b)/;
export function isStorePick(label) {
  const s = String(label).toUpperCase();
  if (PICK.test(s)) return true;
  if (!PROGRAM.test(s)) return false;
  const m = s.match(DESIGNATION);
  if (!m) return false;
  const tail = s.slice(m.index + m[0].length).replace(/[^A-Z0-9 &'"-]/g, " ").trim().split(/\s+/).filter((w) => w && !/^(\d+|PROOF|YEARS?|OLD|LTO)$/.test(w));
  return tail.length >= 2;
}

// Gift sets and combo packs: the same liquid as the plain bottle plus a glass or a mini.
const GIFT = /(\bVAP\b|\bW\/|\bWITH (TWO |2 )?(GLASS|GLASSES|SNIFTER|ROCKS|MINI|CUP|SPOON|ICE)|\bCOMBO\b|\bKIT\b|GIFT ?(SET|PACK|BOX)|\bW GLASS)/;
export function isGiftPack(label) { return GIFT.test(String(label).toUpperCase()); }

// Ready-to-drink cocktails made with a whiskey ("Old Fashioned crafted with Knob Creek").
const RTD = /\b(OLD FASHIONED|CRAFTED WITH|READY TO (DRINK|SERVE)|MANHATTAN|MARGARITA|MOJITO|SPRITZ|HIGHBALL|COCKTAIL)\b/;

export function buildKansas(snapshot) {
  const legend = snapshot.legend;
  const out = [];
  const ids = new Set();
  for (const line of snapshot.lines) {
    const [cat0, brandRaw, labelRaw, abvRaw, sizesRaw, distRaw, vintage, appellation] = line.split("\t");
    if (cat0 !== "sauvignon_blanc" && RTD.test(`${brandRaw} ${labelRaw}`.toUpperCase())) continue;
    const category = classify(cat0, brandRaw, labelRaw);
    const brand = titleCase(brandRaw);
    const label = titleCase(labelRaw)
      .replace(/\bKSBW\b/g, "Kentucky Straight Bourbon").replace(/\bKSRW\b/g, "Kentucky Straight Rye")
      .replace(/\bLto\b/g, "Limited").replace(/\s+/g, " ").trim();
    // Many labels repeat the brand ("1792 — 1792 Full Proof"); don't print it twice.
    const name = label.toLowerCase().startsWith(brand.toLowerCase()) ? label : `${brand} ${label}`;
    let id = `ks-${slug(`${brandRaw} ${labelRaw}`)}`;
    for (let n = 2; ids.has(id); n++) id = `ks-${slug(`${brandRaw} ${labelRaw}`)}-${n}`;
    ids.add(id);
    let abv = Number(abvRaw) || null;
    // A handful of registrations put proof in the ABV field (e.g. "100" for a bottled-in-bond).
    if (abv != null && abv > 80 && cat0 !== "sauvignon_blanc") abv = Math.round((abv / 2) * 100) / 100;
    out.push({
      id, name, brand, label, category,
      abv, proof: abv && category !== "sauvignon_blanc" ? Math.round(abv * 2 * 10) / 10 : null,
      sizes_ml: sizesRaw ? sizesRaw.split(",").map(Number).filter(Boolean) : [],
      distributors: distRaw ? distRaw.split(",").map((c) => legend[c]).filter(Boolean) : [],
      vintage: vintage || null,
      appellation: appellation ? titleCase(appellation) : null,
      store_pick: isStorePick(labelRaw),
      gift_pack: isGiftPack(labelRaw)
    });
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, "data/kansas/registry.json"), "utf8"));
  const items = buildKansas(snapshot);
  const payload = { source: snapshot.source, fetched: snapshot.fetched, count: items.length, items };
  fs.mkdirSync(path.join(root, "dist"), { recursive: true });
  fs.writeFileSync(path.join(root, "dist/kansas.json"), JSON.stringify(payload));
  const by = {};
  for (const i of items) by[i.category] = (by[i.category] || 0) + 1;
  console.log(`kansas: ${items.length} registered bottles (${items.filter((i) => i.store_pick).length} store picks, ${items.filter((i) => i.gift_pack).length} gift packs) ${JSON.stringify(by)}`);
}
