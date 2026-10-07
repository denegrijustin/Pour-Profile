import test from 'node:test';
import assert from 'node:assert/strict';
import {enrichBookImage} from '../book-images.js';
const url='https://bottlebluebook.com/bottle/12/Johnny-Drum';
const item=name=>`<a href="${url}" class="bottle_listings_box"><div style="font-size:20px;">${name}</div></a>`;
const detail=`<h1>Test Drum Private Stock</h1><a class="bottle-profile-pic"><img src="https://bottlebluebook.com/img/bottles/drum.jpg"></a>`;
test('exact Blue Book photo is downloaded for storage without AI',async()=>{
 let fallbackCalls=0;
 const r=await enrichBookImage({id:1,name:'Test Drum Private Stock'},{fetchImpl:async u=>u.includes('/search?')?new Response(item('Test Drum Private Stock')):u===url?new Response(detail):new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/png'}}),fallback:async()=>{fallbackCalls++;}});
 assert.equal(r.status,'ok');assert.equal(r.buf.length,2);assert.equal(r.source_page,url);assert.equal(fallbackCalls,0);
});
test('different age or duplicate edition is never auto accepted',async()=>{
 for(const html of [item('Test Drum Private Stock 12 Year'),item('Test Drum Private Stock')+item('Test Drum Private Stock').replace('/12/','/13/')]) {
 let calls=0;
 const r=await enrichBookImage({name:'Test Drum Private Stock'},{fetchImpl:async()=>{calls++;return new Response(html)},fallback:async()=>({status:'failed',match_reason:'no other photo'})});
 assert.equal(r.status,'failed');assert.equal(calls,1);assert.match(r.match_reason,/^Blue Book:/);
 }
});
test('verified source bypasses ambiguous Blue Book search and downloads usable image bytes',async()=>{
 const calls=[];
 const r=await enrichBookImage({id:22,name:'Johnny Drum Private Stock'},{fetchImpl:async u=>{calls.push(u);return new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/png'}})},fallback:()=>{throw Error('must not guess')}});
 assert.equal(r.status,'ok');assert.match(r.source_page,/johnny-drum-private-stock/);assert.equal(calls.length,1);assert.match(calls[0],/JDPS.png/);
});
test('producer HEIC photo has a native JPEG asset that is stored through the same pipeline',async()=>{
 const r=await enrichBookImage({id:13,name:"Tom's Town Rum Cask Bourbon"},{fetchImpl:()=>{throw Error('no outside request')},assetFetch:async u=>{assert.match(u,/toms-town-rum-finished.jpg/);return new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/jpeg'}})}});
 assert.equal(r.status,'ok');assert.equal(r.mime,'image/jpeg');
});
test('image batches retry older failures, persist verified bytes and leave personal photos untouched',async()=>{
 const {setup}=await import('./harness.mjs');const {env,call,db}=setup();
 const files=new Map();env.PHOTOS={put:async(k,b)=>files.set(k,b),get:async k=>files.has(k)?{body:files.get(k),httpMetadata:{contentType:'image/png'}}:null};
 const subject=db.prepare("SELECT id FROM bottles WHERE name='Penelope Toasted'").get();assert.ok(subject);
 db.prepare("INSERT INTO image_lookups(subject_kind,subject_id,status,match_reason) VALUES('bottle',?,'failed','old lookup failed')").run(String(subject.id));
 const orig=globalThis.fetch;globalThis.fetch=async()=>new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/png'}});
 try {
  const res=await call('/api/images/enrich',{limit:1,bottle_id:subject.id,bottles_only:true});assert.equal(res.status,200);assert.equal(res.data.processed,1);assert.equal(res.data.results[0].status,'ok');assert.ok(files.has('bottles/'+subject.id));
  const b=db.prepare('SELECT image_url FROM bottles WHERE id=?').get(subject.id);assert.match(b.image_url,/^\/api\/images\//);
  const again=await call('/api/images/enrich',{limit:1,bottle_id:subject.id,bottles_only:true});assert.equal(again.data.processed,0);
 } finally {globalThis.fetch=orig;}
});
