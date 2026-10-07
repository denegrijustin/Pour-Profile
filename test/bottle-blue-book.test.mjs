import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBookBottle,parseBookSearch,bottleBookUrl,lookupBottleBook} from '../bottle-blue-book.js';
const url='https://bottlebluebook.com/bottle/741/Blanton';
const detail=`<a class="bottle-profile-pic"><img src="https://bottlebluebook.com/img/bottles/blantons.jpg"></a><h1>Blanton's <span>Single Barrel</span></h1><span class="bottle_heading_title">Type</span><span class="bottle_heading_info">Bourbon</span><span class="bottle_heading_title">Proof</span><span class="bottle_heading_info">93</span><span class="bottle_heading_title">Size</span><span class="bottle_heading_info">750mL</span><span class="bottle_heading_title">Age</span><span class="bottle_heading_info">--</span><div class="overall_rating_box"><span>74</span><p>Overall Rating</p></div><h2>Market Data</h2><h3>$130 - $150</h3>`;
test('Bottle Blue Book imports facts, community rating and exact image; market value is not MSRP',()=>{
  const d=parseBookBottle(detail,url);assert.equal(d.proof,93);assert.equal(d.abv,46.5);assert.equal(d.bottle_size_ml,750);assert.equal(d.age_statement,null);assert.equal(d.msrp,null);assert.equal(d.reviews[0].score,74);assert.equal(d.flavor_terms.length,0);assert.match(d.description,/Secondary-market/);assert.match(d.source_image_url,/blantons.jpg/);
});
test('Bottle Blue Book direct URLs reject other hosts and untrusted image hosts',()=>{
  assert.equal(bottleBookUrl('https://bottlebluebook.com.evil.com/bottle/741/a'),null);
  assert.equal(bottleBookUrl('https://bottlebluebook.com/search?q=x'),null);
  assert.equal(parseBookBottle(detail.replace('https://bottlebluebook.com/img/bottles/blantons.jpg','https://evil.com/x.jpg'),url).source_image_url,null);
});
test('search preserves expression and year for confirmation',async()=>{
  const html=`<a href="${url}" class="bottle_listings_box"><div style="font-size: 20px;">Blanton's<div>Single Barrel</div></div><strong>Year:</strong><span>2020</span><strong>Proof:</strong><span>93</span></a>`;
  assert.equal(parseBookSearch(html)[0].name,"Blanton's Single Barrel (2020)");
  const result=await lookupBottleBook("Blanton's Single Barrel",null,async()=>new Response(html));
  assert.equal(result.candidates.length,1);assert.equal(result.draft,undefined);
});
test('lookup fetches a public bottle page without an OpenAI key or provider calls',async()=>{
  let calls=0;const result=await lookupBottleBook(url,null,async requested=>{calls++;assert.equal(requested,url);return new Response(detail);});
  assert.equal(result.draft.name,"Blanton's Single Barrel");assert.equal(calls,1);
});
test('Worker lookup and adoption persist Bottle Blue Book image and review without an AI key',async()=>{
  const {setup}=await import('./harness.mjs');const {env,call,db}=setup();delete env.OPENAI_API_KEY;
  const files=new Map();env.PHOTOS={get:async key=>files.has(key)?{json:async()=>JSON.parse(files.get(key)),arrayBuffer:async()=>files.get(key).buffer}:null,put:async(key,value)=>files.set(key,value)};
  const original=globalThis.fetch;const calls=[];
  globalThis.fetch=async requested=>{calls.push(String(requested));return String(requested)===url?new Response(detail):new Response(new Uint8Array([137,80,78,71]),{headers:{'content-type':'image/png'}});};
  try {
    const result=await call('/api/drinks/research',{q:url});assert.equal(result.status,200);assert.equal(result.data.image_status,'ok');assert.match(result.data.draft.image_url,/^data:image\/png/);
    const saved=await call('/api/drinks/research/adopt',{research_id:result.data.research_id});assert.equal(saved.status,200);assert.equal(saved.data.image_saved,true);
    const review=db.prepare('SELECT * FROM external_ratings WHERE bottle_id=?').get(saved.data.bottle_id);assert.equal(review.source,'bottle_blue_book');assert.equal(review.score,74);
    assert.equal(calls.length,2);assert.ok(calls.every(u=>u.startsWith('https://bottlebluebook.com/')));
  } finally {globalThis.fetch=original;}
});
