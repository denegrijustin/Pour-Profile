import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fullCatalog} from '../tools/catalog-sources.mjs';
import {mergeNotes} from '../tools/merge-notes.mjs';
import {setup} from './harness.mjs';
const selection=JSON.parse(readFileSync(new URL('../data/photo-bourbon-selection.json',import.meta.url)));
const pending=JSON.parse(readFileSync(new URL('../data/photo-bourbon-pending.json',import.meta.url)));
const all=fullCatalog();
test('photo research uses canonical records without duplicating bourbon expressions',()=>{
 assert.equal(selection.length,24);
 assert.equal(new Set(all.map(r=>r.id)).size,all.length);
 for(const s of selection){const r=all.find(r=>r.id===s.id);assert.ok(r,s.id);assert.deepEqual(r.photo_reference.photos,s.photos);assert.equal(r.photo_reference.batch_confirmed,false);assert.equal(r.tasting_profile.summary_source,'cited_notes');assert.ok(r.tasting_profile.summary);assert.ok(!r.user_state?.tasted);}
 const fresh=all.filter(r=>r.data_source==='photo_research');assert.equal(fresh.length,8);
 for(const r of fresh){assert.equal(r.regional_availability.score,undefined);assert.equal(r.ratings.general,undefined);}
 assert.equal(pending.length,16);assert.ok(pending.every(r=>!r.id&&r.status==='needs_expression_confirmation'));
});
test('rebuilding expert notes retains every selected source-backed record and unknown batch strengths',()=>{
 const {notes,unknown}=mergeNotes();assert.deepEqual(unknown,[]);
 for(const s of selection){assert.ok(notes[s.id]?.confidence!=='none',s.id);}
 for(const id of ['photo-nulu-french-oak','photo-nulu-amburana','photo-ben-holladay-rickhouse-proof','photo-holladay-soft-red-wheat-rickhouse-proof']){assert.equal(all.find(r=>r.id===id).proof,null);assert.equal(notes[id].facts.proof,null);assert.ok(notes[id].critics.every(c=>c.score===null));}
 assert.equal(all.find(r=>r.id==='photo-gunnars-honey').category,'american_whiskey');
 assert.equal(all.find(r=>r.id==='photo-gunnars-honey').proof,70);
});
test('local catalog search and adoption carry researched details without a web lookup',async()=>{
 const t=setup();const search=await t.call('/api/drinks/search?q=nulu amburana');
 assert.ok(search.data.results.some(r=>r.id==='photo-nulu-amburana'));
 const detail=await t.call('/api/catalog/item/photo-nulu-amburana');assert.equal(detail.status,200);assert.ok(detail.data.expert.producer.source_url.includes('nuluwhiskies'));assert.ok(detail.data.expert.critics.length);
 const add=await t.call('/api/catalog/adopt',{catalog_id:'photo-old-grand-dad-bonded'});assert.equal(add.status,200);
 const saved=(await t.call('/api/bottles/'+add.data.bottle_id)).data;
 assert.equal(saved.bottle.proof,100);assert.equal(saved.bottle.abv,50);assert.equal(saved.bottle.age_statement,'At least 4 years');assert.equal(saved.bottle.barrel_finish,'New charred oak');assert.ok(saved.bottle.producer_url.includes('beamdistilling'));assert.ok(saved.expert);
});
