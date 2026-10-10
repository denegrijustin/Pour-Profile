import test from 'node:test';
import assert from 'node:assert/strict';
import { rateCatalogBottle } from '../catalog-actions.js';
test('had this opens rating for the adopted bottle and navigates only after saving', async () => {
 const calls=[], bottle={id:42,name:'Test Bourbon',category:'bourbon'};
 let saved;
 await rateCatalogBottle('bourbon-test',(...args)=>calls.push(['navigate',...args]), {
  client:{catalogAdopt:async payload=>{calls.push(['adopt',payload]);return {bottle_id:42};},bottle:async id=>{calls.push(['bottle',id]);return {bottle};}},
  openRating:async (value,options)=>{assert.equal(value,bottle);saved=options.onSaved;calls.push(['rating']);}
 });
 assert.deepEqual(calls,[['adopt',{catalog_id:'bourbon-test',status_tags:['tried']}],['bottle',42],['rating']]);
 saved(); assert.deepEqual(calls.at(-1),['navigate','bottle',42]);
});
test('adoption failures propagate without opening a rating form',async()=>{
 let opened=false;
 await assert.rejects(rateCatalogBottle('missing',()=>{}, {client:{catalogAdopt:async()=>{throw new Error('Unknown catalog id');}},openRating:async()=>{opened=true;}}),/Unknown catalog id/);
 assert.equal(opened,false);
});
