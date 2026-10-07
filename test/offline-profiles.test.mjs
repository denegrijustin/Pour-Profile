import test from 'node:test';
import assert from 'node:assert/strict';
const storage = new Map();
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
globalThis.window={addEventListener(){}};
Object.defineProperty(globalThis,'navigator',{value:{onLine:false},configurable:true});
const {api,setActiveProfile,flushQueue,pendingQueueCount}=await import('../api.js');
test('offline pours retain their person and original deduplication ID through switching and replay',async()=>{
  setActiveProfile('lady');
  await api.createTasting({bottle_id:1,rating:8,client_request_id:'original-lady-id'});
  setActiveProfile('jdad');
  await api.createTasting({bottle_id:1,rating:2,client_request_id:'original-jdad-id'});
  const calls=[];
  globalThis.fetch=async(path,options)=>{calls.push({path,body:JSON.parse(options.body)});return new Response('{}');};
  const result=await flushQueue();assert.equal(result.flushed,2);
  assert.ok(calls[0].path.includes('profile=lady'));assert.equal(calls[0].body.client_request_id,'original-lady-id');
  assert.ok(calls[1].path.includes('profile=jdad'));assert.equal(calls[1].body.client_request_id,'original-jdad-id');
  assert.equal(pendingQueueCount(),0);
});
test('server validation failures are not queued, but lost network responses are safe to replay',async()=>{
  navigator.onLine=true;
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'Invalid rating'}),{status:400});
  await assert.rejects(api.createTasting({rating:99}),/Invalid rating/);assert.equal(pendingQueueCount(),0);
  globalThis.fetch=async()=>{throw new TypeError('Network failed');};
  const result=await api.createTasting({bottle_id:1,rating:8,client_request_id:'lost-response'});
  assert.equal(result.queued,true);assert.equal(pendingQueueCount(),1);
  const queue=JSON.parse(storage.get('pourProfile.queue.v1'));assert.equal(queue[0].requestId,'lost-response');
});
