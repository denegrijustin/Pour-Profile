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
import { packCatalog, attachExpertNotes } from "../catalog-pack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFlag = process.argv.indexOf("--out");
const out = path.resolve(root, outFlag > -1 ? process.argv[outFlag + 1] : "dist/catalog.json");

// Cited producer/critic notes (tools/merge-notes.mjs -> data/expert-notes.json) ride
// along on each record as `expert`; records with nothing reliable carry no field.
const notesPath = path.join(root, "data/expert-notes.json");
const NOTES = fs.existsSync(notesPath) ? JSON.parse(fs.readFileSync(notesPath, "utf8")) : {};
const packed = attachExpertNotes(packCatalog(RESEARCH_CATALOG), NOTES);
const json = JSON.stringify(packed);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, json);

const before = Buffer.byteLength(JSON.stringify(RESEARCH_CATALOG));
const after = Buffer.byteLength(json);
console.log(`catalog: ${packed.length} records (${packed.filter((r) => r.expert).length} with cited notes), ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (${path.relative(root, out)})`);
