import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';

// Migrations named *.auto.sql are applied on every deploy, so each one must be harmless to repeat.
const dir = new URL('../migrations/', import.meta.url);
const files = readdirSync(dir).sort();
const auto = files.filter((f) => f.endsWith('.auto.sql'));

test('there is at least one automatic migration, and they all come after the schema they depend on', () => {
  assert.ok(auto.length >= 1);
  const firstAuto = files.indexOf(auto[0]);
  assert.ok(files.slice(0, firstAuto).includes('0011_catalog_items_barcodes.sql'));
});

test('every automatic migration can run again without changing anything or failing', () => {
  const db = new DatabaseSync(':memory:');
  for (const f of files) db.exec(readFileSync(new URL(f, dir), 'utf8'));
  const snapshot = () => Object.fromEntries(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
      .map(({ name }) => [name, JSON.stringify(db.prepare(`SELECT * FROM "${name}"`).all())])
  );
  const before = snapshot();
  for (const f of auto) {
    db.exec(readFileSync(new URL(f, dir), 'utf8'));
    db.exec(readFileSync(new URL(f, dir), 'utf8'));
  }
  assert.deepEqual(snapshot(), before, 'running the automatic migrations again changed the data');
});

test('the Jack Daniel\'s dislike is recorded exactly once', () => {
  const db = new DatabaseSync(':memory:');
  for (const f of files) db.exec(readFileSync(new URL(f, dir), 'utf8'));
  const rows = db.prepare("SELECT sentiment FROM brand_signals WHERE lower(brand) = lower('Jack Daniel''s')").all();
  assert.deepEqual(rows.map((r) => r.sentiment), ['negative']);
});
