#!/usr/bin/env node
// Merge research batches (data/notes/batch-*.json) with re-runs (data/notes/redo/output-*.json)
// into data/expert-notes.json keyed by catalog id. A re-run replaces the original only when
// its confidence is at least as good. Validates the schema and drops anything unsourced.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RESEARCH_CATALOG } from "../catalog-research.js";
import { selectionIds } from "./catalog-sources.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RANK = { none: 0, low: 1, medium: 2, high: 3 };
const SCALES = new Set(["100", "50", "20", "10", "5"]);
const isUrl = (u) => typeof u === "string" && /^https?:\/\/[^\s]+\.[^\s]+/.test(u);
const str = (s, max = 400) => (typeof s === "string" && s.trim() ? s.trim().slice(0, max) : null);
const num = (n) => (typeof n === "number" && Number.isFinite(n) ? n : null);

export function cleanEntry(e) {
  const issues = [];
  const prodUrl = isUrl(e.producer?.source_url) ? e.producer.source_url : null;
  let producer = null;
  if (e.producer) {
    const p = { nose: str(e.producer.nose), palate: str(e.producer.palate), finish: str(e.producer.finish), summary: str(e.producer.summary, 600) };
    if (Object.values(p).some(Boolean)) {
      if (prodUrl) producer = { ...p, source_url: prodUrl };
      else issues.push("producer notes without source dropped");
    }
  }
  const critics = [];
  for (const c of e.critics || []) {
    if (!isUrl(c.source_url) || !str(c.source)) { issues.push("critic without source dropped"); continue; }
    let score = num(c.score), scale = SCALES.has(String(c.scale)) ? String(c.scale) : null;
    // A bare 50-100 score with no stated scale is the standard 100-point scale (WE, WS, JS, Decanter).
    if (score != null && !scale && score > 50 && score <= 100) scale = "100";
    if (score != null && (!scale || score > Number(scale) || score < 0)) { issues.push(`score ${score}/${c.scale} dropped`); score = null; scale = null; }
    const out = { source: str(c.source, 120), source_url: c.source_url, score, scale, nose: str(c.nose), palate: str(c.palate), finish: str(c.finish), summary: str(c.summary, 600), year: num(c.year) };
    if (out.score == null && !out.nose && !out.palate && !out.finish && !out.summary) continue;
    critics.push(out);
  }
  const f = e.facts || {};
  const facts = isUrl(f.source_url)
    ? { abv: num(f.abv), proof: num(f.proof), age: str(f.age, 80), mash_bill: str(f.mash_bill, 160), cask: str(f.cask, 160), region: str(f.region, 120), source_url: f.source_url }
    : null;
  const flavor_terms = [...new Set((e.flavor_terms || []).map((t) => String(t).toLowerCase().trim()).filter((t) => t && t.length <= 30))].slice(0, 10);
  // Confidence is recomputed from what survived validation, not trusted as reported.
  const hasProducer = !!producer, hasCritic = critics.length > 0;
  let confidence = hasProducer && hasCritic ? "high" : hasProducer || hasCritic ? "medium" : "none";
  if (confidence !== "none" && e.confidence === "low") confidence = "low";
  return { entry: { producer, critics, facts, flavor_terms: confidence === "none" ? [] : flavor_terms, confidence, notes: str(e.notes, 500) }, issues };
}

export function mergeNotes(dir = path.join(root, "data/notes")) {
  const best = new Map();
  const load = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
  const files = [
    ...fs.readdirSync(dir).filter((f) => /^batch-\d+\.json$/.test(f)).sort().map((f) => path.join(dir, f)),
    ...(fs.existsSync(path.join(dir, "redo")) ? fs.readdirSync(path.join(dir, "redo")).filter((f) => /^output-\d+\.json$/.test(f)).sort().map((f) => path.join(dir, "redo", f)) : []),
    // Research for Kansas-registered additions (later files win ties, so re-runs replace placeholders).
    ...(fs.existsSync(path.join(dir, "kansas")) ? fs.readdirSync(path.join(dir, "kansas")).filter((f) => /^output-\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(7)) - parseInt(b.slice(7))).map((f) => path.join(dir, "kansas", f)) : [])
  ];
  const issues = [];
  for (const f of files) for (const raw of load(f)) {
    const { entry, issues: iss } = cleanEntry(raw);
    iss.forEach((i) => issues.push(`${raw.id}: ${i}`));
    const prev = best.get(raw.id);
    if (!prev || RANK[entry.confidence] >= RANK[prev.confidence]) best.set(raw.id, entry);
  }
  const allIds = [...RESEARCH_CATALOG.map((r) => r.id), ...selectionIds()];
  const ids = new Set(allIds);
  const out = {};
  for (const id of allIds) out[id] = best.get(id) || { producer: null, critics: [], facts: null, flavor_terms: [], confidence: "none", notes: "not researched" };
  // Hand corrections from fact-checking (data/notes/corrections.json), applied last.
  const corrPath = path.join(dir, "corrections.json");
  if (fs.existsSync(corrPath)) for (const c of load(corrPath)) {
    const e = out[c.id];
    if (!e) { issues.push(`${c.id}: correction for unknown id`); continue; }
    if (c.remove_critics) e.critics = e.critics.filter((_, i) => !c.remove_critics.includes(i));
    for (const [key, value] of Object.entries(c.set || {})) {
      const parts = key.split(".");
      let obj = e;
      for (const k of parts.slice(0, -1)) { if (obj[k] == null) { obj = null; break; } obj = obj[k]; }
      if (obj == null) { issues.push(`${c.id}: correction path ${key} missing`); continue; }
      obj[parts.at(-1)] = value;
    }
    const hasP = e.producer && Object.entries(e.producer).some(([k, v]) => k !== "source_url" && v);
    if (!hasP) e.producer = null;
    e.confidence = e.producer && e.critics.length ? "high" : e.producer || e.critics.length ? "medium" : "none";
    e.corrected = true;
  }
  const unknown = [...best.keys()].filter((k) => !ids.has(k));
  return { notes: out, issues, unknown };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { notes, issues, unknown } = mergeNotes();
  fs.writeFileSync(path.join(root, "data/expert-notes.json"), JSON.stringify(notes, null, 1) + "\n");
  const c = { high: 0, medium: 0, low: 0, none: 0 };
  let scored = 0;
  for (const n of Object.values(notes)) { c[n.confidence]++; if (n.critics.some((x) => x.score != null)) scored++; }
  console.log("expert notes:", JSON.stringify(c), "with a critic score:", scored, "issues:", issues.length, "unknown ids:", unknown.length);
  if (issues.length) console.log(issues.slice(0, 15).join("\n"));
}
