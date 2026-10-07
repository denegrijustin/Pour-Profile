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
