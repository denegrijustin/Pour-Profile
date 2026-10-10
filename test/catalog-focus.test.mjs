import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesCatalogFocus,catalogVarietal} from '../catalog-focus.js';
test('wine focus recognizes grape categories without including spirits',()=>{
 assert.equal(matchesCatalogFocus({category:'sauvignon_blanc'},'wine','sauvignon_blanc'),true);
 assert.equal(matchesCatalogFocus({category:'wine',varietal:'chardonnay'},'wine','sauvignon_blanc'),false);
 assert.equal(matchesCatalogFocus({category:'bourbon'},'wine'),false);
 assert.equal(matchesCatalogFocus({category:'chardonnay'},'wine'),true);
});
test('bourbon and rye can be requested independently',()=>{
 assert.equal(matchesCatalogFocus({category:'rye'},'bourbon'),false);
 assert.equal(matchesCatalogFocus({category:'bourbon'},'bourbon'),true);
 assert.equal(matchesCatalogFocus({category:'rye'},'rye'),true);
 assert.equal(catalogVarietal({category:'wine',varietal:'riesling'}),'riesling');
});
import {setup} from './harness.mjs';
test('recommendation API filters the chosen category before ranking, and allows non-local wine',async()=>{
 const {call}=setup();
 const wines=await call('/api/catalog/browse?scope=all&category=wine&varietal=sauvignon_blanc&limit=200');
 assert.ok(wines.data.total>2);
 assert.ok(wines.data.results.every(r=>r.category==='sauvignon_blanc'));
 const picks=await call('/api/catalog/recommended?scope=all&category=bourbon');
 assert.ok(picks.data.results.every(r=>r.category==='bourbon'));
 const other=await call('/api/catalog/recommended?scope=all&category=wine&varietal=chardonnay');
 assert.equal(other.data.results.length,0);
});
