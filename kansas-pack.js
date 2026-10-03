// Wire format for dist/kansas.tsv, shared by the build (tools/build-kansas.mjs) and the Worker.
//
// Six thousand bottles must be searchable inside a Worker's few-millisecond CPU budget, so
// the list ships as plain text that is never parsed as a whole: the Worker reads it as one
// string, finds candidate lines with indexOf, and splits only the lines it returns.
//
//   #source <TAB> url <TAB> fetched-iso
//   #distributors <TAB> name|name|...
//   key <TAB> name <TAB> brand <TAB> category <TAB> abv <TAB> distributor#,... <TAB> vintage <TAB> flags <TAB> sizes <TAB> appellation
//
// key is " folded name brand category " (lowercase, no accents/punctuation) so " word" finds a
// word start. flags: 1 = store pick, 2 = gift pack. sizes is empty when the only size is 750 ml.

/** Lowercase, accents stripped, punctuation to spaces, padded so " word" matches a word start. */
export function searchKey(s) {
  return ` ${String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;
}

const clean = (v) => String(v ?? "").replace(/[\t\n\r]+/g, " ");

export function packKansas(snapshot, items) {
  const distributors = [...new Set(items.flatMap((i) => i.distributors))];
  const di = new Map(distributors.map((d, i) => [d, i]));
  const lines = [
    `#source\t${clean(snapshot.source)}\t${clean(snapshot.fetched)}`,
    `#distributors\t${distributors.map(clean).join("|")}`
  ];
  for (const i of items) {
    const sizes = i.sizes_ml.length === 1 && i.sizes_ml[0] === 750 ? "" : i.sizes_ml.join(",");
    lines.push([
      searchKey(`${i.name} ${i.brand} ${i.category.replace(/_/g, " ")}`), clean(i.name), clean(i.brand), i.category,
      i.abv ?? "", i.distributors.map((d) => di.get(d)).join(","), i.vintage || "",
      (i.store_pick ? 1 : 0) | (i.gift_pack ? 2 : 0), sizes, clean(i.appellation)
    ].join("\t"));
  }
  return lines.join("\n");
}

/** Parse only the header and the line offsets; rows stay as text until needed. */
export function openKansas(text) {
  const starts = [];
  for (let at = 0; at !== -1 && at < text.length; ) {
    starts.push(at);
    const nl = text.indexOf("\n", at);
    at = nl === -1 ? -1 : nl + 1;
  }
  const lineAt = (k) => text.slice(starts[k], k + 1 < starts.length ? starts[k + 1] - 1 : text.length);
  const [, source, fetched] = lineAt(0).split("\t");
  const distributors = lineAt(1).split("\t")[1].split("|");
  return { text, starts, first: 2, lineAt, source, fetched, distributors, count: starts.length - 2 };
}

const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

/** Id for row n: index for a cheap lookup, name slug so a stale id (after a data refresh) fails safely. */
export function kansasId(n, name) { return `ks${n}-${slug(name)}`; }

/** Expand row n (0-based, data rows only) into the object the API returns. */
export function kansasRow(k, n) {
  const [, name, brand, category, abv, d, vintage, flags, sizes, appellation] = k.lineAt(k.first + n).split("\t");
  const a = abv === "" ? null : Number(abv);
  return {
    id: kansasId(n, name), name, brand, category, abv: a,
    proof: a && category !== "sauvignon_blanc" ? Math.round(a * 20) / 10 : null,
    distributors: d ? d.split(",").map((x) => k.distributors[Number(x)]) : [],
    vintage: vintage || null, appellation: appellation || null,
    store_pick: !!(Number(flags) & 1), gift_pack: !!(Number(flags) & 2),
    sizes_ml: sizes ? sizes.split(",").map(Number) : [750]
  };
}

/** Find a row by id; null when the id doesn't match this data (e.g. it predates a refresh). */
export function kansasById(k, id) {
  const m = /^ks(\d+)-/.exec(String(id));
  if (!m) return null;
  const n = Number(m[1]);
  if (n >= k.count) return null;
  const row = kansasRow(k, n);
  return row.id === id ? row : null;
}

/** Row numbers whose key contains every word as a word start. Scans for the longest word only. */
export function searchRows(k, words) {
  if (!words.length) return [];
  const [lead, ...rest] = [...words].sort((a, b) => b.length - a.length);
  const out = [];
  let line = 0;
  for (let at = k.text.indexOf(` ${lead}`); at !== -1; at = k.text.indexOf(` ${lead}`, at + 1)) {
    while (line + 1 < k.starts.length && k.starts[line + 1] <= at) line++;   // offsets ascend: walk forward
    if (line < k.first) continue;
    const n = line - k.first;
    if (out[out.length - 1] === n) continue;
    const tab = k.text.indexOf("\t", k.starts[line]);
    if (at > tab) continue;                                                  // matched outside the key column
    const key = k.text.slice(k.starts[line], tab);
    if (rest.every((w) => key.includes(` ${w}`))) out.push(n);
  }
  return out;
}

/** Row flags without splitting the whole line. */
export function rowFlags(k, n) {
  const parts = k.lineAt(k.first + n).split("\t");
  return { category: parts[3], flags: Number(parts[7]) || 0, nameLength: parts[1].length };
}
