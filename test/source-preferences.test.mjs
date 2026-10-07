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
 const bottle=await call('/api/bottles',{name:'Test Reaction',category:'bourbon'});
 for(const [reaction,rating] of Object.entries({bad:2,ok:6,like:7.5,love:9})) {
   const result=await call('/api/tastings',{bottle_id:bottle.data.bottle.id,reaction,rating:0});
   assert.equal(result.status,200);assert.equal(result.data.tasting.rating,rating);
 }
 assert.equal((await call('/api/tastings',{bottle_id:bottle.data.bottle.id,reaction:'excellent'})).status,400);
});
