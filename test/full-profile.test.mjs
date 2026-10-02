import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../worker.js';
import {QUESTIONS,AXES,scorePour,validateAnswers} from '../pour-model.js';
function setup() {
  const db=new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../migrations/',import.meta.url)).sort()) db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  const DB={prepare(sql) {
    let params=[];
    const stmt={bind(...p){params=p;return stmt;},async all(){return {results:db.prepare(sql).all(...params)};},async first(){return db.prepare(sql).get(...params)||null;},async run(){const r=db.prepare(sql).run(...params);return {meta:{last_row_id:Number(r.lastInsertRowid),changes:r.changes}};}};
    return stmt;
  }};
  const env={DB};
  const call=async (path,body,profile='jdad',method=body?'POST':'GET') => {
    const response=await worker.fetch(new Request(`https://test${path}${path.includes('?')?'&':'?'}profile=${profile}`,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),env);
    return {status:response.status,data:await response.json()};
  };
  return {db,env,call};
}
const answers=(category,intensity=7,enjoyment=5) => Object.fromEntries(QUESTIONS[category].map(q => [q.id,{intensity,enjoyment}]));
test('all five categories have ten distinct questions with explicit intensity and enjoyment',()=>{
  assert.equal(Object.keys(QUESTIONS).length,5);
  for(const [category,qs] of Object.entries(QUESTIONS)) {assert.equal(qs.length,10);assert.equal(new Set(qs.map(q=>q.id)).size,10);assert.ok(validateAnswers(category,answers(category)));}
  assert.equal(validateAnswers('wine',{oak:{intensity:11,enjoyment:5}}),false);
  assert.equal(validateAnswers('wine',{oak:{intensity:4,enjoyment:0}}),false);
  assert.equal(validateAnswers('wine',{peat:{intensity:4,enjoyment:5}}),false);
});
test('cross-category taste transfer, category priority and dislike penalties',()=>{
  const evidence=[{category:'bourbon',rating:9,dimensions:{oak:8},enjoyment:{oak:5}}];
  assert.ok(scorePour({category:'wine',dimensions:{oak:8}},evidence).score > scorePour({category:'wine',dimensions:{oak:1}},evidence).score);
  const scoped=[...evidence,{category:'wine',rating:9,dimensions:{oak:1},enjoyment:{oak:5}}];
  assert.ok(scorePour({category:'wine',dimensions:{oak:1}},scoped).score > scorePour({category:'wine',dimensions:{oak:8}},scoped).score);
  assert.equal(scorePour({category:'rum',dimensions:{funk:8}},evidence).score,null);
  assert.ok(scorePour({category:'scotch',dimensions:{smoke:8}},[{category:'scotch',rating:2,dimensions:{smoke:8},enjoyment:{smoke:1}}]).score < 30);
});
test('migration preserves people, existing opinions and historical ratings',async()=>{
  const {db,call}=setup();
  const res=await call('/api/profiles');assert.deepEqual(res.data.profiles.map(p=>[p.id,p.slug,p.display_name,p.focus]),[[1,'jdad','JDAD','both'],[2,'lady','Lady','both']]);
  assert.ok(db.prepare('SELECT count(*) n FROM bottle_status WHERE profile_id=1').get().n>0);
  assert.ok(db.prepare('SELECT count(*) n FROM wine_palate_dimensions WHERE profile_id=2').get().n>0);
  assert.equal((await call('/api/profiles',null,'spirits')).status,200);
});
test('all five categories save questions and scores per person, remain visible, and deduplicate retries',async()=>{
  const {call}=setup();
  for(const category of Object.keys(QUESTIONS)) {
    const {data:created}=await call('/api/bottles',{name:`Test ${category}`,category});
    const id=created.bottle.id;
    const payload={bottle_id:id,rating:9,questionnaire_version:1,questionnaire_answers:answers(category),tasting_style:'test style',client_request_id:`id-${category}`,status_tag:'like'};
    const saved=await call('/api/tastings',payload);assert.equal(saved.status,200);
    assert.equal((await call('/api/tastings',payload)).data.deduplicated,true);
    const lady=await call('/api/tastings',{...payload,rating:2,questionnaire_answers:answers(category,2,1)},'lady');assert.equal(lady.status,200);
    const mine=await call(`/api/bottles/${id}`);const hers=await call(`/api/bottles/${id}`,null,'lady');
    assert.equal(mine.data.tastings.length,1);assert.equal(hers.data.tastings.length,1);
    assert.equal(mine.data.tastings[0].rating,9);assert.equal(hers.data.tastings[0].rating,2);
    assert.deepEqual(mine.data.tastings[0].questionnaire_answers,answers(category));
    assert.equal((await call(`/api/tastings/${saved.data.tasting.id}`,{rating:1},'lady','PATCH')).status,404);
    assert.equal((await call(`/api/tastings/${saved.data.tasting.id}`,null,'lady','DELETE')).status,404);
  }
  const full=(await call('/api/profile/full')).data;assert.equal(full.detailed_pours,5);assert.equal(full.counts.filter(c=>Object.keys(QUESTIONS).includes(c.category)).length,5);
  assert.equal((await call('/api/profile/full',null,'wine')).data.person,'Lady');
});
test('invalid answers rejected before any tasting is saved',async()=>{
  const {call,db}=setup();const id=(await call('/api/bottles',{name:'Invalid test',category:'wine'})).data.bottle.id;
  const before=db.prepare('SELECT COUNT(*) n FROM tastings').get().n;
  assert.equal((await call('/api/tastings',{bottle_id:id,rating:8,questionnaire_answers:{oak:{intensity:12,enjoyment:5}}})).status,400);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM tastings').get().n,before);
});
test('photo endpoint handles missing configuration, invalid images, mixed walls and uncertain labels',async()=>{
  const {call,env}=setup();const imageDataUrl='data:image/jpeg;base64,AAAA';
  assert.equal((await call('/api/recommendations/photo',{imageDataUrl})).status,503);
  env.OPENAI_API_KEY='test-secret';
  assert.equal((await call('/api/recommendations/photo',{imageDataUrl:'https://example.com/test.jpg'})).status,400);
  const bottle=(await call('/api/bottles',{name:'Rated bourbon',category:'bourbon'})).data.bottle;
  await call('/api/tastings',{bottle_id:bottle.id,rating:9,questionnaire_answers:answers('bourbon')});
  const original=globalThis.fetch;
  globalThis.fetch=async(url,opts)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');const payload=JSON.parse(opts.body);assert.equal(payload.store,false);
    const candidates=['wine','rum','scotch','tequila','bourbon'].map((category,i)=>({name:`Photo ${category}`,category,style:'Known style',location:'Middle shelf',identity_confidence:i===0?0.4:0.95,profile_basis:'Test estimate',dimensions:Object.fromEntries(AXES.map(axis=>[axis,7]))}));
    return new Response(JSON.stringify({output_text:JSON.stringify({notes:'One blurry label',bottles:candidates})}));
  };
  try {
    const res=await call('/api/recommendations/photo',{imageDataUrl});assert.equal(res.status,200);assert.equal(res.data.bottles.length,5);assert.ok(res.data.best);
    assert.equal(res.data.bottles.find(b=>b.category==='wine').fit.score,null);
    const hers=await call('/api/recommendations/photo',{imageDataUrl},'lady');
    assert.equal(hers.data.person,'Lady');assert.equal(hers.data.evidence_pours,0);
  } finally {globalThis.fetch=original;}
});
test('both photo endpoints use only the Worker credential and the Responses image schema',async()=>{
  const {call,env}=setup();env.OPENAI_API_KEY='fixture-only-credential';
  const imageDataUrl='data:image/png;base64,AAAA';
  const original=globalThis.fetch;
  globalThis.fetch=async(url,opts)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');
    assert.equal(opts.headers.Authorization,'Bearer fixture-only-credential');
    const payload=JSON.parse(opts.body);
    assert.equal(payload.model,'gpt-4.1-mini');assert.equal(payload.store,false);
    assert.equal(payload.text.format.type,'json_schema');assert.equal(payload.text.format.strict,true);
    assert.equal(payload.input[0].content.find(p=>p.type==='input_image').image_url,imageDataUrl);
    assert.ok(opts.signal instanceof AbortSignal);
    assert.ok(!opts.body.includes('fixture-only-credential'));
    const answer=payload.text.format.name==='shelf_bottles'?{notes:'No readable bottles',bottles:[]}:{brand:'Test',expression:'Bottle',category:'bourbon',proof:'',ageStatement:'',notes:'',confidence:0.9};
    return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}]}));
  };
  try {
    for(const path of ['/api/recommendations/photo','/api/analyze-image']) {
      const res=await call(path,{imageDataUrl,mimeType:'image/png',OPENAI_API_KEY:'client-injection'});
      assert.equal(res.status,200);assert.ok(!JSON.stringify(res.data).includes('credential'));
    }
  } finally {globalThis.fetch=original;}
});
test('photo provider errors, refusals and incomplete output never expose upstream text or credentials',async()=>{
  const {call,env}=setup();env.OPENAI_API_KEY='fixture-only-credential';
  const payload={imageDataUrl:'data:image/png;base64,AAAA',mimeType:'image/png'};
  const original=globalThis.fetch; const logged=[];const originalLog=console.error;
  console.error=(...args)=>logged.push(args);
  try {
    for(const path of ['/api/recommendations/photo','/api/analyze-image']) {
      for(const [status,expected] of [[401,503],[403,503],[429,429],[500,502]]) {
        globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'fixture-only-credential upstream sensitive text'}}),{status});
        const res=await call(path,payload);assert.equal(res.status,expected);assert.ok(!JSON.stringify(res.data).includes('fixture-only-credential'));
      }
      for(const [response,expected] of [[{status:'incomplete',output_text:'{}'},502],[{status:'completed',output:[{content:[{type:'refusal',refusal:'sensitive text'}]}]},422],[{output_text:'invalid sensitive text'},502]]) {
        globalThis.fetch=async()=>new Response(JSON.stringify(response));
        const res=await call(path,payload);assert.equal(res.status,expected);assert.ok(!JSON.stringify(res.data).includes('sensitive text'));
      }
      globalThis.fetch=async()=>{throw new Error('fixture-only-credential network detail');};
      assert.equal((await call(path,payload)).status,502);
      globalThis.fetch=async()=>{throw new DOMException('private timeout detail','TimeoutError');};
      assert.equal((await call(path,payload)).status,504);
    }
    assert.equal(logged.length,0);
  } finally {globalThis.fetch=original;console.error=originalLog;}
});
