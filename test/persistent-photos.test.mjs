import test from 'node:test';
import assert from 'node:assert/strict';
import {photoIdentity,photoQueries,enrichPersistentImage} from '../persistent-photos.js';
const miss=async()=>({status:'no_match'});
test('photo identity permits sizes and generic words but preserves expression, proof, year and finishes',()=>{
 assert.equal(photoIdentity('High West Double Rye'),photoIdentity('High West Double Rye Whiskey (750 mL)'));
 for(const name of ['High West Double Rye Barrel Pick','High West Double Rye 2021','High West Double Rye 100 proof','High West Double Rye Syrah Finish'])assert.notEqual(photoIdentity(name),photoIdentity('High West Double Rye'));
 assert.equal(photoQueries({name:"Maker's Mark"}).length,3);
});
test('continues with multiple queries and another source when first photo is unusable',async()=>{
 const calls=[];
 const result=await enrichPersistentImage({name:'Example Rye'}, {book:miss,fallback:miss,search:async(q,url)=>{
  calls.push([q,url]);if(url)return {draft:{name:'Example Rye Whiskey 750ml',source_image_url:url==='https://shop.com/bad'?'https://shop.com/bad.jpg':'https://shop.com/good.jpg'}};
  return {candidates:[{name:'Example Rye 750ml',url:calls.filter(c=>!c[1]).length===1?'https://shop.com/bad':'https://shop.com/good'}]};
 },fetchImpl:async u=>u.endsWith('bad.jpg')?new Response('',{status:404}):new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/jpeg'}})});
 assert.equal(result.status,'ok');assert.ok(calls.filter(c=>!c[1]).length>=2);assert.equal(result.buf.length,2);
});
test('outside search is offered only after full multi-query exhaustion; outages stay retryable',async()=>{
 for(const offline of [false,true]) {
  let queries=0;
  const r=await enrichPersistentImage({name:'Example Rye'}, {book:miss,fallback:miss,search:async()=>{queries++;return {candidates:[],unavailable_sources:offline?['a','b','c']:[]};}});
  assert.equal(queries,3);assert.equal(r.queries_tried,3);assert.equal(r.exhausted,!offline);assert.equal(r.retryable,offline);
 }
});
test('a verified saved photo stops further searches',async()=>{
 const r=await enrichPersistentImage({name:'Known Rye'}, {book:async()=>({status:'ok',buf:new Uint8Array([1])}),search:()=>{throw Error('unnecessary lookup');}});assert.equal(r.status,'ok');assert.equal(r.exhausted,false);
});
