import test from 'node:test';
import assert from 'node:assert/strict';
import {enrichBookImage} from '../book-images.js';
const url='https://bottlebluebook.com/bottle/12/Johnny-Drum';
const item=name=>`<a href="${url}" class="bottle_listings_box"><div style="font-size:20px;">${name}</div></a>`;
const detail=`<h1>Johnny Drum Private Stock</h1><a class="bottle-profile-pic"><img src="https://bottlebluebook.com/img/bottles/drum.jpg"></a>`;
test('exact Blue Book photo is downloaded for storage without AI',async()=>{
 let fallbackCalls=0;
 const r=await enrichBookImage({id:1,name:'Johnny Drum Private Stock'},{fetchImpl:async u=>u.includes('/search?')?new Response(item('Johnny Drum Private Stock')):u===url?new Response(detail):new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/png'}}),fallback:async()=>{fallbackCalls++;}});
 assert.equal(r.status,'ok');assert.equal(r.buf.length,2);assert.equal(r.source_page,url);assert.equal(fallbackCalls,0);
});
test('different age or duplicate edition is never auto accepted',async()=>{
 for(const html of [item('Johnny Drum Private Stock 12 Year'),item('Johnny Drum Private Stock')+item('Johnny Drum Private Stock').replace('/12/','/13/')]) {
 let calls=0;
 const r=await enrichBookImage({name:'Johnny Drum Private Stock'},{fetchImpl:async()=>{calls++;return new Response(html)},fallback:async()=>({status:'failed',match_reason:'no other photo'})});
 assert.equal(r.status,'failed');assert.equal(calls,1);assert.match(r.match_reason,/^Blue Book:/);
 }
});
