import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupBottleSources, searchCoverage,extraSourceUrl,retailerDraft,producerDraft} from '../bottle-search.js';
const producer='https://www.jimbeam.com/en-au/bourbons/jim-beam-devils-cut';
test('common Devil Cut spelling finds producer despite unavailable other sources',async()=>{
 const r=await lookupBottleSources('Jim Beams Devil cut',null,async()=>{throw Error('offline');});
 assert.equal(r.candidates[0].url,producer);assert.equal(r.unavailable_sources.length,3);
 assert.equal(searchCoverage('Jim Beam Devil cut 12 year',"Jim Beam Devil's Cut"),4/6);
});
test('source selection restricts hosts and paths',()=>{
 assert.equal(extraSourceUrl('https://gacraftspirits.com/products/bourbon?x=1'),'https://gacraftspirits.com/products/bourbon');
 for(const u of ['https://evil.com/products/bourbon','https://gacraftspirits.com/admin','https://www.jimbeam.com/locate'])assert.equal(extraSourceUrl(u),null);
});
test('retailer facts preserve unknowns and do not invent a review or MSRP',()=>{
 const d=retailerDraft({title:'Example Bourbon 750ml',vendor:'Example',description:'Bottled at 90 proof.',tags:['Bourbon'],featured_image:'//cdn.shopify.com/bottle.png'},'https://gacraftspirits.com/products/example');
 assert.equal(d.proof,90);assert.equal(d.abv,45);assert.equal(d.bottle_size_ml,750);assert.equal(d.msrp,null);assert.deepEqual(d.reviews,[]);assert.equal(d.source_image_url,'https://cdn.shopify.com/bottle.png');
});
test('producer structured facts and relative bottle image enter the normal draft',()=>{
 const html=`<script type="application/ld+json">{"@graph":[{"@type":"Product","name":"Jim Beam Devil's Cut","description":"Bottled at 90 proof.","image":"https://www.jimbeam.com/lifestyle.jpg"}]}</script><img src="/bottle.png" alt="Jim Beam Devil’s Cut bottle ">Deep char aroma with a smoky backdrop. intense oak and vanilla notes`;
 const d=producerDraft(html,producer);assert.equal(d.source_image_url,'https://www.jimbeam.com/bottle.png');assert.equal(d.proof,90);assert.ok(d.flavor_terms.includes('oak'));
});
test('retailer search rejects unrelated expressions while BBB failure does not block it',async()=>{
 const r=await lookupBottleSources('Penelope Architect',null,async url=>{
  if(url.includes('bottlebluebook'))throw Error('offline');
  return new Response(JSON.stringify({resources:{results:{products:[{title:'Penelope Architect 750ml',url:'/products/architect'},{title:'Penelope Toasted 750ml',url:'/products/toasted'}]}}}));
 });
 assert.equal(r.candidates.length,2);assert.ok(r.candidates.every(c=>c.name.includes('Architect')));
});
test('blocked retailer detail falls back only to the selected exact handle',async()=>{
 const fetcher=async url=>url.endsWith('.js')?new Response('',{status:403}):new Response(JSON.stringify({resources:{results:{products:[{handle:'double-rye',title:'High West Double Rye',body:'92 proof.',image:'https://cdn.shopify.com/rye.jpg'}]}}}));
 const d=await lookupBottleSources('High West Double Rye','https://kegnbottle.com/products/double-rye',fetcher);
 assert.equal(d.draft.source_image_url,'https://cdn.shopify.com/rye.jpg');assert.equal(d.draft.proof,92);
 await assert.rejects(lookupBottleSources('High West Double Rye','https://kegnbottle.com/products/barrel-pick',fetcher),/403/);
});
