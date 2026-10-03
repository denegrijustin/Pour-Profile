// Shared harness: the real Worker against a real (in-memory) SQLite database built
// from the actual migrations, with the catalog served the same way production
// serves it — as the packed /catalog.json asset.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../worker.js';
import { RESEARCH_CATALOG } from '../catalog-research.js';
import { packCatalog, attachExpertNotes } from '../catalog-pack.js';
import { buildKansas } from '../tools/build-kansas.mjs';

const NOTES = JSON.parse(readFileSync(new URL('../data/expert-notes.json', import.meta.url), 'utf8'));
// Served exactly as the build produces it: packed records plus their cited notes.
const KANSAS = JSON.stringify((() => { const snap = JSON.parse(readFileSync(new URL('../data/kansas/registry.json', import.meta.url), 'utf8')); return { source: snap.source, fetched: snap.fetched, items: buildKansas(snap) }; })());
const PACKED_CATALOG = JSON.stringify(attachExpertNotes(packCatalog(RESEARCH_CATALOG), NOTES));

export function setup() {
  const db = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../migrations/', import.meta.url)).sort()) {
    db.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  }

  // Counts what actually matters for latency: D1 round trips, not statements.
  const wire = { trips: 0, statements: 0, maxParams: 0 };

  const DB = {
    prepare(sql) {
      let params = [];
      const stmt = {
        bind(...p) {
          // Real D1 rejects a statement with more than 100 bound parameters; so does this.
          if (p.length > 100) throw new Error(`D1_ERROR: too many SQL variables (${p.length} > 100)`);
          params = p; wire.maxParams = Math.max(wire.maxParams, p.length); return stmt;
        },
        async all() { wire.trips++; wire.statements++; return { results: db.prepare(sql).all(...params) }; },
        async first() { wire.trips++; wire.statements++; return db.prepare(sql).get(...params) || null; },
        async run() {
          wire.trips++; wire.statements++;
          const r = db.prepare(sql).run(...params);
          return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } };
        },
        // batch() runs statements itself so a batch counts as ONE trip, as in D1.
        _exec() { wire.statements++; return { results: db.prepare(sql).all(...params) }; }
      };
      return stmt;
    },
    async batch(stmts) {
      wire.trips++;
      return stmts.map((s) => s._exec());
    }
  };

  const ASSETS = {
    async fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === '/catalog.json') return new Response(PACKED_CATALOG, { headers: { 'Content-Type': 'application/json' } });
      if (pathname === '/kansas.json') return new Response(KANSAS, { headers: { 'Content-Type': 'application/json' } });
      return new Response('not found', { status: 404 });
    }
  };

  const env = { DB, ASSETS };
  const call = async (path, body, profile = 'jdad', method = body ? 'POST' : 'GET') => {
    const response = await worker.fetch(new Request(`https://test${path}${path.includes('?') ? '&' : '?'}profile=${profile}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined
    }), env);
    return { status: response.status, data: await response.json(), headers: response.headers };
  };
  return { db, env, call, wire };
}
