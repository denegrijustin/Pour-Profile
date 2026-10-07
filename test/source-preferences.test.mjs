import test from 'node:test';
import assert from 'node:assert/strict';
import {sourcePreferences,sourcePreferenceFit} from '../source-preferences.js';
import {setup} from './harness.mjs';
test('one reaction per bottle and sourced notes work without a questionnaire',()=>{
 const rows=[{id:1,bottle_id:1,bottle_name:'Known Bourbon',bottle_category:'bourbon',rating:2},{id:2,bottle_id:1,bottle_name:'Known Bourbon',bottle_category:'bourbon',rating:9}];
 const records=[{name:'Known Bourbon',expert:{flavor_terms:['vanilla','caramel','toasted oak']}}];
 const prefs=sourcePreferences(rows,records);assert.equal(prefs.length,1);assert.equal(prefs[0].rating,9);
 const fit=sourcePreferenceFit({category:'bourbon',expert:{flavor_terms:['vanilla','caramel']}},prefs);
 assert.ok(fit.score>=80);assert.match(fit.reason,/love/);
 assert.equal(sourcePreferenceFit({category:'tequila',expert:{flavor_terms:['vanilla']}},prefs),null);
});
test('Bad notes penalize matching bottles; unknown notes give no score',()=>{
 const prefs=[{name:'Disliked',category:'bourbon',rating:2,tags:['vanilla']}];
 assert.ok(sourcePreferenceFit({category:'bourbon',expert:{flavor_terms:['vanilla']}},prefs).score<50);
 assert.equal(sourcePreferenceFit({category:'bourbon'},prefs),null);
});
test('four reactions map server-side and invalid reactions fail',async()=>{
 const {call}=setup();
 const bottle=await call('/api/bottles',{name:'Test Reaction',category:'bourbon',status_tags:['want_to_try','owned']});
 for(const [reaction,rating] of Object.entries({bad:2,ok:6,like:7.5,love:9})) {
   const result=await call('/api/tastings',{bottle_id:bottle.data.bottle.id,reaction,rating:0});
   assert.equal(result.status,200);assert.equal(result.data.tasting.rating,rating);
   const detail=await call('/api/bottles/'+bottle.data.bottle.id);
   assert.ok(detail.data.bottle.status_tags.includes('tried'));
   assert.ok(detail.data.bottle.status_tags.includes('owned'));
   assert.ok(!detail.data.bottle.status_tags.includes('want_to_try'));
 }
 assert.equal((await call('/api/tastings',{bottle_id:bottle.data.bottle.id,reaction:'excellent'})).status,400);
});
test('older ratings imply tried and leave want-to-try filters without changing another profile',async()=>{
 const {call,db}=setup();const bottle=await call('/api/bottles',{name:'Legacy tried',category:'bourbon',status_tags:['want_to_try']});const id=bottle.data.bottle.id;
 await call('/api/tastings',{bottle_id:id,rating:8});
 db.prepare('UPDATE bottle_status SET status_tags=? WHERE bottle_id=? AND profile_id=1').run('["want_to_try","owned"]',id);
 const detail=await call('/api/bottles/'+id);assert.deepEqual(detail.data.bottle.status_tags,['owned','tried']);
 assert.ok((await call('/api/bottles?status=tried')).data.bottles.some(b=>b.id===id));
 assert.ok(!(await call('/api/bottles?status=want_to_try')).data.bottles.some(b=>b.id===id));
});
