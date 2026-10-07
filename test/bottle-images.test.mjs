import test from 'node:test';import assert from 'node:assert/strict';
import {verifiedBottleImage,withBottleImage} from '../bottle-images.js';
test('expression photos cover collection aliases without bleeding into other expressions',()=>{
 for(const name of ['Johnny Drum Private Stock','Penelope Architect','Rabbit Hole Dareringer','Evan Williams Bottled-in-Bond','Evan Williams Bottled in Bond','J. Rieger Kansas City Whiskey','J. Rieger Rye','Jim Beam Green Label','Rittenhouse Rye','Eagle Rare 10','Widow Jane 10',"Tom's Town Rum Cask Bourbon",'Stagg']) assert.ok(verifiedBottleImage({name}),name);
 for(const name of ['Johnny Drum 15 Year Private Stock','Penelope Architect 2020','Eagle Rare 17 Year','George T. Stagg','Rieger Bottled in Bond Rye']) assert.equal(verifiedBottleImage({name}),null,name);
 const record={name:'Stagg',image_url:'/my-photo',image_source:'user'};assert.equal(withBottleImage(record),record);
});
