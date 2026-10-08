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
 assert.equal(res.status,200);assert.ok(res.data.details.summary);assert.ok(res.data.details.finish);assert.ok(res.data.flavor_profile.descriptors.length);assert.deepEqual(res.data.flavor_profile.dimensions,{});
 const classic=await t.call('/api/catalog/item/elijah-craig-small-batch');assert.ok(Object.keys(classic.data.flavor_profile.dimensions).length);
});
