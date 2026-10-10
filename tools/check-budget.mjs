#!/usr/bin/env node
// Size budgets for the built front end (gzip), so growth is caught in review instead of on a phone.
//   node tools/check-budget.mjs     (after `npm run build`)
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist", "assets");
if (!fs.existsSync(assets)) throw new Error("Run npm run build first.");
const KB = 1024;
const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(assets, f)), { level: 9 }).length;
const files = fs.readdirSync(assets);
const rows = [];
let totalJs = 0;
for (const f of files.filter((f) => f.endsWith(".js"))) {
  const size = gz(f);
  totalJs += size;
  rows.push([`assets/${f}`, size, (f.startsWith("app-") ? 15 : 40) * KB]);
}
rows.push(["all JavaScript", totalJs, 90 * KB]);
for (const f of files.filter((f) => f.endsWith(".css"))) rows.push([`assets/${f}`, gz(f), 14 * KB]);

let bad = 0;
for (const [label, size, max] of rows.sort((a, b) => b[1] - a[1])) {
  const over = size > max;
  if (over) bad++;
  console.log(`${over ? "OVER " : "ok   "} ${label.padEnd(36)} ${(size / KB).toFixed(1).padStart(6)} KB / ${(max / KB).toFixed(0)} KB`);
}
if (bad) {
  console.log(`::error title=Size budget::${bad} file(s) over budget. Raise the limit in tools/check-budget.mjs only if the growth is intended.`);
  process.exit(1);
}
