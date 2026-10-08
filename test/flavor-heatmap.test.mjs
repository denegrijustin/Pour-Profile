import test from 'node:test';
import assert from 'node:assert/strict';
import {flavorHeatmapHtml} from '../flavor-heatmap.js';
import {setup} from './harness.mjs';
test('heat map overlays ideal levels and keeps unknown intensity unplotted',()=>{
 const html=flavorHeatmapHtml({dimensions:{sweetness:7},targets:{sweetness:{target:6,samples:3}},descriptors:[{term:'<honey>',axes:['sweetness']},{term:'oak',axes:['oak']}],basis:'model_estimated'});
 assert.ok(html.includes('Bottle 7/10'));assert.ok(html.includes('Ideal 6/10'));assert.ok(html.includes('ideal-marker'));assert.ok(html.includes('&lt;honey&gt;'));assert.ok(html.includes('Bottle intensity unknown'));assert.equal((html.match(/bottle-marker/g)||[]).length,1);
});
test('detail endpoint returns research facts, flavor evidence and personal targets',async()=>{
 const t=setup();const res=await t.call('/api/catalog/item/photo-nulu-french-oak');
 assert.equal(res.status,200);assert.ok(res.data.details.summary);assert.ok(res.data.details.finish);assert.ok(res.data.flavor_profile.descriptors.length);assert.equal(Object.keys(res.data.flavor_profile.dimensions).length,11);assert.equal(res.data.flavor_profile.basis,"research_synthesis_estimate");
 const classic=await t.call('/api/catalog/item/elijah-craig-small-batch');assert.ok(Object.keys(classic.data.flavor_profile.dimensions).length);
});

test('every confirmed store bottle has a complete bounded source-backed intensity profile',async()=>{
 const {fullCatalog}=await import('../tools/catalog-sources.mjs');
 const local=fullCatalog().filter(r=>r.local_store);
 assert.equal(local.length,24);
 for(const r of local){
  assert.ok(r.flavor_profile.sources.length,r.id);
  for(const axis of ['sweetness','oak','fruit','spice','grain','richness','smoke','body','warmth','finish','herbal']) assert.ok(Number.isFinite(r.flavor_profile.dimensions[axis]) && r.flavor_profile.dimensions[axis]>=0 && r.flavor_profile.dimensions[axis]<=10,`${r.id} ${axis}`);
 }
});
test('reaction-only ratings learn ideal levels without inventing tasting observations',async()=>{
 const t=setup();const adopted=await t.call('/api/catalog/adopt',{catalog_id:'photo-nulu-amburana'});
 const rating=await t.call('/api/tastings',{bottle_id:adopted.data.bottle_id,reaction:'love'});
 assert.equal(rating.status,200);
 const detail=await t.call('/api/catalog/item/photo-nulu-french-oak');
 assert.equal(detail.data.flavor_profile.targets.spice.target,9);
 const saved=(await t.call('/api/bottles/'+adopted.data.bottle_id)).data;
 assert.deepEqual(saved.tastings[0].questionnaire_answers,{});
});
