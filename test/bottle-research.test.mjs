import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResearch, publicUrl, researchBottle } from '../bottle-research.js';
import { setup } from './harness.mjs';
const source='https://producer.com/bottles/rye';
const raw={found:true,name:'Example Rye',category:'rye',proof:100,abv:50,vintage:null,summary:'Producer describes spice.',product_page:source,sources:[{url:source,title:'Producer'}]};
test('research requires consulted sources and leaves unsupported facts unknown',()=>{
  assert.throws(()=>normalizeResearch(raw,new Set()),/sources/);
  const result=normalizeResearch({...raw,proof:500,msrp:'20'},new Set([source]));
  assert.equal(result.proof,null); assert.equal(result.msrp,null); assert.equal(result.abv,50);
  assert.ok(result.description.includes(source));
  assert.equal(normalizeResearch({found:false},new Set()),null);
});
test('reject unsafe source addresses',()=>{
  for(const url of ['http://producer.com','https://127.0.0.1/x','https://[::1]/','https://user:pass@producer.com','https://localhost/x']) assert.equal(publicUrl(url),null);
});
test('uses actual web-search output and refuses incomplete results',async()=>{
  let payload;
  const fake=async(url,opts)=>{payload=JSON.parse(opts.body);return Response.json({status:'completed',output:[{type:'web_search_call',action:{sources:[{url:source}]}},{content:[{type:'output_text',text:JSON.stringify(raw)}]}]});};
  const result=await researchBottle('Example Rye',{OPENAI_API_KEY:'test'},fake);
  assert.equal(result.name,'Example Rye'); assert.equal(payload.store,false); assert.equal(payload.tools[0].type,'web_search');
  await assert.rejects(()=>researchBottle('x',{OPENAI_API_KEY:'test'},async()=>Response.json({status:'incomplete'})),/finish/);
});
test('adoption saves researched details and image bytes without replacing user photos',async()=>{
  const {env,call,db}=setup();
  const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const files=new Map([[`research/${id}/draft`,JSON.stringify({draft:normalizeResearch({...raw,category:'wine',varietal:'sauvignon_blanc',vintage:2023},new Set([source])),created:Date.now(),image:{mime:'image/png'}})],[`research/${id}/image`,new Uint8Array([137,80,78,71])]]);
  env.PHOTOS={get:async key=>files.has(key)?{json:async()=>JSON.parse(files.get(key)),arrayBuffer:async()=>files.get(key).buffer}:null,put:async(key,value)=>files.set(key,value)};
  const response=await call('/api/drinks/research/adopt',{research_id:id});
  assert.equal(response.status,200);
  const result=response.data; assert.equal(result.image_saved,true);
  const bottle=db.prepare('SELECT * FROM bottles WHERE id=?').get(result.bottle_id);
  assert.equal(bottle.varietal,'sauvignon_blanc');assert.equal(bottle.vintage,2023);assert.match(bottle.image_url,/api\/images/);assert.equal(bottle.data_source,'web_research');
  db.prepare("UPDATE bottles SET image_source='user_photo', image_url='/my-photo' WHERE id=?").run(result.bottle_id);
  const again=await call('/api/drinks/research/adopt',{research_id:id});
  assert.equal(again.data.image_saved,false);
  assert.equal(db.prepare('SELECT image_url FROM bottles WHERE id=?').get(result.bottle_id).image_url,'/my-photo');
});

test('citation-free JSON retries as cited prose and extracts a grounded draft',async()=>{
  const responses=[{status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(raw)}]}]},
    {status:'completed',output:[{content:[{type:'output_text',text:'Example Rye: producer states 50% ABV.',annotations:[{type:'url_citation',url:source}]}]}]},
    {status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(raw)}]}]}];
  let calls=0;
  const result=await researchBottle('Example Rye',{OPENAI_API_KEY:'test'},async()=>Response.json(responses[calls++]));
  assert.equal(calls,3);assert.equal(result.sources[0].url,source);
});
