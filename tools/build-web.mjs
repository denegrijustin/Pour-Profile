#!/usr/bin/env node
// Build the front end into dist/.
//
//   node tools/build-web.mjs
//
// - bundles app.js (+ lazily imported views) into minified, content-hashed ES modules
// - minifies and hashes styles.css
// - rewrites index.html to point at the hashed files
// - generates sw.js with the exact precache list, so the cache can never drift from the build
// - copies static files (manifest, icon) as-is
// Hashed files never change under the same name, so they are served `immutable`.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const hash = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);

// Only the build's own output is removed; catalog.json is rebuilt by build-catalog.mjs.
fs.rmSync(assets, { recursive: true, force: true });
// dist/notes/ belongs to build-catalog.mjs and is left alone.
for (const f of fs.readdirSync(dist, { withFileTypes: true })) {
  if (f.isFile() && !["catalog.json", "kansas.tsv"].includes(f.name)) fs.rmSync(path.join(dist, f.name));
}
fs.mkdirSync(assets, { recursive: true });

const js = await build({
  entryPoints: [path.join(root, "app.js")],
  bundle: true, splitting: true, format: "esm", minify: true, target: "es2020",
  outdir: assets, entryNames: "[name]-[hash]", chunkNames: "[name]-[hash]",
  metafile: true, write: true, legalComments: "none"
});
const css = await build({
  entryPoints: [path.join(root, "styles.css")],
  bundle: false, minify: true, outdir: assets, entryNames: "[name]-[hash]",
  metafile: true, write: true
});

const outputs = (r) => Object.keys(r.metafile.outputs).filter((f) => !f.endsWith(".map"));
const rel = (f) => "/" + path.relative(dist, path.resolve(root, f)).split(path.sep).join("/");
const entryJs = rel(Object.entries(js.metafile.outputs).find(([, o]) => o.entryPoint && o.entryPoint.endsWith("app.js"))[0]);
const cssFile = rel(outputs(css)[0]);
const allAssets = [...outputs(js), ...outputs(css)].map(rel);

let html = read("index.html")
  .replace('href="/styles.css"', `href="${cssFile}"`)
  .replace('src="/app.js"', `src="${entryJs}"`);
if (!html.includes(cssFile) || !html.includes(entryJs)) throw new Error("index.html rewrite failed");
// Warm the connection and the entry module before the parser reaches the script tag.
html = html.replace("</head>", `    <link rel="modulepreload" href="${entryJs}">\n  </head>`);
fs.writeFileSync(path.join(dist, "index.html"), html);

for (const f of ["manifest.json", "icon.svg"]) fs.copyFileSync(path.join(root, f), path.join(dist, f));

const precache = ["/", "/index.html", "/manifest.json", "/icon.svg", ...allAssets];
const version = hash(JSON.stringify(precache) + html);
const sw = read("sw.js")
  .replace(/const CACHE_NAME = .*;/, `const CACHE_NAME = "pour-decisions-${version}";`)
  .replace(/const CORE_ASSETS = \[[\s\S]*?\];/, `const CORE_ASSETS = ${JSON.stringify(precache)};`);
fs.writeFileSync(path.join(dist, "sw.js"), sw);

// Headers: hashed assets are immutable; the shell and service worker must always revalidate.
fs.writeFileSync(path.join(dist, "_headers"), [
  "/assets/*", "  Cache-Control: public, max-age=31536000, immutable", "",
  "/sw.js", "  Cache-Control: no-cache", "",
  "/index.html", "  Cache-Control: no-cache", "",
  "/catalog.json", "  Cache-Control: public, max-age=300, must-revalidate", "",
  "/kansas.tsv", "  Cache-Control: public, max-age=3600, must-revalidate", "  Content-Type: text/plain; charset=utf-8", "",
  "/notes/*", "  Cache-Control: public, max-age=300, must-revalidate", ""
].join("\n"));

const size = (f) => fs.statSync(path.join(dist, f)).size;
const total = allAssets.reduce((n, f) => n + size(f), 0);
console.log(`web: ${allAssets.length} assets, ${(total / 1024).toFixed(0)} KB minified; entry ${entryJs} (${(size(entryJs) / 1024).toFixed(0)} KB)`);
