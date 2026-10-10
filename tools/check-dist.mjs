#!/usr/bin/env node
// Gate for the built site: everything the shell and the Worker depend on must exist and parse before a deploy.
//   node tools/check-dist.mjs     (after `npm run build`)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const problems = [];
const file = (rel) => path.join(dist, rel.replace(/^\//, ""));
const read = (rel) => (fs.existsSync(file(rel)) ? fs.readFileSync(file(rel), "utf8") : (problems.push(`dist${rel.startsWith("/") ? "" : "/"}${rel} is missing`), ""));

// The shell points at hashed files that exist.
const html = read("index.html");
for (const m of html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)) if (!fs.existsSync(file(m[1]))) problems.push(`index.html references ${m[1]}, which was not built`);
if (!/\/assets\/app-[\w-]+\.js/.test(html)) problems.push("index.html does not load the hashed app bundle");

// The service worker precaches only files that exist, and the cache name was stamped by the build.
const sw = read("sw.js");
const core = sw.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
if (!core) problems.push("sw.js has no CORE_ASSETS list");
else for (const a of JSON.parse(core[1])) if (a !== "/" && !fs.existsSync(file(a))) problems.push(`sw.js precaches ${a}, which was not built`);
if (!/CACHE_NAME = "pour-decisions-[0-9a-f]{10}"/.test(sw)) problems.push("sw.js cache name was not stamped with the build hash");

// The Worker reads these two files at run time.
try {
  const catalog = JSON.parse(read("catalog.json") || "null");
  const records = Array.isArray(catalog) ? catalog : catalog?.items ?? catalog?.records ?? Object.values(catalog ?? {}).find(Array.isArray);
  if (!records?.length) problems.push("catalog.json has no records");
} catch (e) {
  problems.push(`catalog.json is not valid JSON: ${e.message}`);
}
if (read("kansas.tsv").trim().split("\n").length < 100) problems.push("kansas.tsv has too few rows");
for (const rel of ["_headers", "manifest.json", "icon.svg"]) read(rel);

if (problems.length) {
  for (const p of problems) console.log(`::error title=Build check::${p}`);
  process.exit(1);
}
console.log("Build check passed.");
