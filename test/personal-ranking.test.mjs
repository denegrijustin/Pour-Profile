import test from "node:test";
import assert from "node:assert/strict";
import { comparePersonalRank, personalRating } from "../personal-ranking.js";
import { bottleCardHtml } from "../ui.js";

test("personal ratings outrank predictions and critic scores", () => {
  const bottles = [
    {id:1,name:"Untasted",palate_match:100,external_review_score:100},
    {id:2,name:"Like",avg_rating:7.5,palate_match:99},
    {id:3,name:"Cakebread",avg_rating:9,palate_match:60,external_review_score:80},
    {id:4,name:"Bad",avg_rating:2,palate_match:95},
    {id:5,name:"OK",avg_rating:6},
    {id:6,name:"Matanzas",avg_rating:9,palate_match:90},
  ];
  assert.deepEqual(bottles.sort(comparePersonalRank).map(b=>b.name), ["Cakebread","Matanzas","Like","OK","Bad","Untasted"]);
});
test("status preferences work without a pour and actual ratings win", () => {
  assert.equal(personalRating({status_tags:["favorite"]}),9);
  assert.equal(personalRating({status_tags:["favorite"],avg_rating:2}),2);
  assert.equal(personalRating({}),null);
});
test("rated cards emphasize the verdict; predictions are labeled for unrated cards", () => {
  const html=bottleCardHtml({id:1,name:"Cakebread",avg_rating:9,palate_match:60});
  assert.match(html, /match-pill">Love/);
  assert.doesNotMatch(html, /60%/);
  assert.match(bottleCardHtml({id:2,name:"New",palate_match:85}), /Est\. fit 85%/);
});
