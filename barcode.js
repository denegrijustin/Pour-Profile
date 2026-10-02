// Barcode helpers shared by the Worker and the tests: validation, normalisation and
// Open Food Facts parsing. No I/O except the one injectable fetch in lookupOpenFoodFacts.

const OFF_URL = "https://world.openfoodfacts.org/api/v2/product/";
const OFF_FIELDS = "product_name,brands,quantity,image_front_url,image_url";
const OFF_TIMEOUT_MS = 4000;

/** GS1 check digit for a digit string WITHOUT its check digit (weights 3,1,3,1 from the right). */
export function checkDigit(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(body.length - 1 - i) - 48;
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

const checksumOk = (code) => checkDigit(code.slice(0, -1)) === code.charCodeAt(code.length - 1) - 48;

/** Expand an 8-digit UPC-E (number system 0 or 1) to its 12-digit UPC-A equivalent. */
export function expandUpcE(code) {
  const ns = code[0];
  const [a, b, c, d, e, f] = code.slice(1, 7);
  const tail = code[7];
  let body;
  if ("012".includes(f)) body = `${ns}${a}${b}${f}0000${c}${d}${e}`;
  else if (f === "3") body = `${ns}${a}${b}${c}00000${d}${e}`;
  else if (f === "4") body = `${ns}${a}${b}${c}${d}00000${e}`;
  else body = `${ns}${a}${b}${c}${d}${e}0000${f}`;
  return body + tail;
}

const bad = () => ({ ok: false, error: "Barcode checksum is invalid. Check the digits and try again." });

/**
 * Validate a scanned/typed code.
 * Returns { ok:true, format, normalized, variants } or { ok:false, error }.
 *   normalized - the key stored in `barcodes`: UPC-A and UPC-E become 13-digit EAN-13
 *                (leading 0) so a 12-digit and 13-digit scan of one product are the same row.
 *   variants   - every spelling an older row in bottles.barcode might use.
 */
export function parseBarcode(input) {
  const raw = String(input ?? "").trim();
  if (!/^\d+$/.test(raw)) return { ok: false, error: "Barcode must contain digits only." };
  if (![8, 12, 13].includes(raw.length)) return { ok: false, error: "Barcode must be 8 (EAN-8/UPC-E), 12 (UPC-A) or 13 (EAN-13) digits." };

  let format, normalized;
  if (raw.length === 13) { if (!checksumOk(raw)) return bad(); format = "ean_13"; normalized = raw; }
  else if (raw.length === 12) { if (!checksumOk(raw)) return bad(); format = "upc_a"; normalized = "0" + raw; }
  else if (checksumOk(raw)) { format = "ean_8"; normalized = raw; }
  else if ("01".includes(raw[0]) && checksumOk(expandUpcE(raw))) { format = "upc_e"; normalized = "0" + expandUpcE(raw); }
  else return bad();

  const variants = [...new Set([
    normalized,
    normalized.length === 13 && normalized[0] === "0" ? normalized.slice(1) : null,
    raw
  ].filter(Boolean))];
  return { ok: true, format, normalized, variants };
}

/** "750 ml", "70 cl", "1.75 L", "25.4 fl oz" -> millilitres (integer) or null. */
export function parseSizeMl(quantity) {
  const m = String(quantity ?? "").toLowerCase().replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|ml|cl|dl|l)\b/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const ml = m[2].startsWith("fl") ? n * 29.5735 : m[2] === "ml" ? n : m[2] === "cl" ? n * 10 : m[2] === "dl" ? n * 100 : n * 1000;
  const out = Math.round(ml);
  return out > 0 && out <= 20000 ? out : null;
}

/** Turn an Open Food Facts API payload into our product shape, or null for a miss/unusable hit. */
export function parseOffProduct(data) {
  if (!data || data.status !== 1 || !data.product) return null;
  const p = data.product;
  const name = typeof p.product_name === "string" ? p.product_name.trim() : "";
  if (!name) return null;
  const brand = typeof p.brands === "string" ? p.brands.split(",")[0].trim() || null : null;
  const image = p.image_front_url || p.image_url || null;
  return {
    product_name: name.slice(0, 200),
    brand: brand && brand.slice(0, 120),
    size_ml: parseSizeMl(p.quantity),
    image_url: typeof image === "string" && /^https:\/\//.test(image) ? image.slice(0, 500) : null
  };
}

/** Resolves { status:'hit', product } | { status:'miss' } | { status:'error', reason }. Never throws. */
export async function lookupOpenFoodFacts(code, fetchImpl = globalThis.fetch) {
  try {
    const res = await fetchImpl(`${OFF_URL}${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`, {
      headers: { "User-Agent": "PourProfile/1.0 (barcode lookup)", Accept: "application/json" },
      signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(OFF_TIMEOUT_MS) : undefined
    });
    if (res.status === 404) return { status: "miss" };
    if (!res.ok) return { status: "error", reason: `Open Food Facts returned ${res.status}` };
    const product = parseOffProduct(await res.json());
    return product ? { status: "hit", product } : { status: "miss" };
  } catch (err) {
    return { status: "error", reason: String(err && err.message || err) };
  }
}
