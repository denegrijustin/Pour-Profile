import test from 'node:test';
import assert from 'node:assert/strict';
import {tastingRowHtml} from '../tasting-feed.js';
test('rated pours render their reaction without throwing on Home',()=>{
 for(const [rating,label] of [[2,'Bad'],[6,'OK'],[7.5,'Like'],[9,'Love']]) assert.match(tastingRowHtml({rating,bottle_name:'Bottle'}),new RegExp(label));
});
