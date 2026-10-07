#!/usr/bin/env node
// Build the catalog asset the Worker loads at runtime.
//
//   node tools/build-catalog.mjs [--out dist/catalog.json]
//
// catalog-research.js stays the source of truth (it is what tools/import-catalog.mjs
// generates). This packs it into dist/catalog.json so the ~700 KB of data ships as a
// compressed static asset instead of being compiled into the Worker script.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESEARCH_CATALOG } from "../catalog-research.js";
import { fullCatalog, withKansas } from "./catalog-sources.mjs";
import { buildKansas } from "./build-kansas.mjs";
import { packCatalog, attachExpertNotes, fullExpert } from "../catalog-pack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFlag = process.argv.indexOf("--out");
const out = path.resolve(root, outFlag > -1 ? process.argv[outFlag + 1] : "dist/catalog.json");

// Cited producer/critic notes (tools/merge-notes.mjs -> data/expert-notes.json) ride
// along on each record as `expert`; records with nothing reliable carry no field.
const notesPath = path.join(root, "data/expert-notes.json");
const NOTES = fs.existsSync(notesPath) ? JSON.parse(fs.readFileSync(notesPath, "utf8")) : {};
const registry = path.join(root, "data/kansas/registry.json");
const KANSAS_ITEMS = fs.existsSync(registry) ? buildKansas(JSON.parse(fs.readFileSync(registry, "utf8"))) : [];
const ALL = withKansas(fullCatalog(), KANSAS_ITEMS);
const packed = attachExpertNotes(packCatalog(ALL), NOTES, { slim: true });

// Full cited notes, one small file per bottle, fetched only when that bottle is opened.
const notesDir = path.join(root, "dist/notes");
fs.rmSync(notesDir, { recursive: true, force: true });
fs.mkdirSync(notesDir, { recursive: true });
let noteFiles = 0;
for (const r of ALL) {
  const full = fullExpert(NOTES[r.id]);
  if (full) { fs.writeFileSync(path.join(notesDir, `${r.id}.json`), JSON.stringify(full)); noteFiles++; }
}
const json = JSON.stringify(packed);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, json);

const before = Buffer.byteLength(JSON.stringify(ALL));
const after = Buffer.byteLength(json);
console.log(`catalog: ${packed.length} records (${packed.filter((r) => r.expert).length} with cited notes in ${noteFiles} files, ${packed.filter((r) => r.kansas).length} registered in Kansas), ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (${path.relative(root, out)})`);
