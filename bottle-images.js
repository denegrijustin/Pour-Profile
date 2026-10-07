// Verified producer product photography (2026-10-02). Match exact expressions,
// never use a brand-wide image for an unknown expression. User photos win.
// Source pages and image labels checked against the expression, not brand alone.
// Names without batch/year get representative expression photography only.
const entries = [
 [['Johnny Drum Private Stock'], 'https://www.kentuckybourbonwhiskey.com/wp-content/uploads/2023/12/JDPS.png', 'https://www.kentuckybourbonwhiskey.com/whiskey/johnny-drum-private-stock/'],
 [['Penelope Architect'], 'https://shop.penelopebourbon.com/cdn/shop/products/bottle_544x.png?v=1641190991', 'https://shop.penelopebourbon.com/products/architect-series'],
 [['Rabbit Hole Dareringer'], 'https://www.rabbitholedistillery.com/cdn/shop/products/dareringer-204807_1024x1024.png?v=1708376543', 'https://www.rabbitholedistillery.com/products/dareringer-straight-bourbon-whiskey-finished-in-px-sherry-casks'],
 [['Evan Williams Bottled-in-Bond','Evan Williams Bottled in Bond'], 'https://www.evanwilliams.com/images/bottles/ew-bottleinbond.png?ver=2', 'https://www.evanwilliams.com/bottled-in-bond-bourbon'],
 [['J. Rieger Kansas City Whiskey','Rieger Kansas City Whiskey'], 'https://static.wixstatic.com/media/3c2d51_2715166bd1d94191b49b19698b61bb0c~mv2.png/v1/fit/w_320,h_800,q_85/25_JRC_KCW_COB.png', 'https://www.jriegerco.com/our-spirits/kansas-city-whiskey'],
 [['J. Rieger Rye','Rieger Straight Rye Whiskey'], 'https://static.wixstatic.com/media/3c2d51_b5b09f269c0142cc9814153a55cf180b~mv2.png/v1/fit/w_320,h_800,q_85/rye.png', 'https://www.jriegerco.com/our-spirits'],
 [['Rittenhouse Rye','Rittenhouse Rye Bottled in Bond'], 'https://heavenhilldistillery.com/images/brands/detail/rittenhouse.png', 'https://heavenhilldistillery.com/rittenhouse-rye.php'],
 [['Eagle Rare 10','Eagle Rare 10 Year'], 'https://cms.buffalotracedistillery.com/wp-content/uploads/2025/11/EAGLE_-RARE_10_BOTTLE.png', 'https://www.buffalotracedistillery.com/our-brands/eagle-rare/eagle-rare-10/'],
 [['Stagg'], 'https://cms.buffalotracedistillery.com/wp-content/uploads/2025/11/STAGG_BOTTLE.png', 'https://www.buffalotracedistillery.com/our-brands/george-t-stagg/stagg-bourbon/'],
 [['Jim Beam Green Label','Jim Beam Choice'], 'https://www.liquorstore-online.com/product_images/p_33092.jpg', 'https://www.liquorstore-online.com/33092/jim-beam-green-label', 'retailer'],
 [['Widow Jane 10','Widow Jane 10 Year'], 'https://gacraftspirits.com/cdn/shop/files/widow-jane-10-year-bourbon-whiskey-750ml-3434218_1024x.png?v=1761779315', 'https://gacraftspirits.com/products/widow-jane-10-year-bourbon-whiskey-750ml', 'retailer'],
 // The producer supplies HEIC. This is a JPEG copy of that same product photo.
 [["Tom's Town Rum Cask Bourbon","Tom’s Town Rum Cask Bourbon"], '/bottle-photo-assets/toms-town-rum-finished.jpg', 'https://mercantile.toms-town.com/products/copy-of-blackberry-farm-bourbon'],
 [['Matanzas Creek Sauvignon Blanc'], 'https://www.matanzascreek.com/dw/image/v2/BFTR_PRD/on/demandware.static/-/Sites-jfw-master-catalog/default/dwdd3be5a0/images/0502422/0502422_1.png?sw=408&sh=353&sm=fit&strip=true', 'https://www.matanzascreek.com/'],
 [['Unshackled Sauvignon Blanc','Unshackled Sauvignon Blanc 2023'], 'https://cdn.shopify.com/s/files/1/0415/7908/5983/files/UNSH_2023_SB_2000x2000_5cd60c64-f7ac-451a-8bc7-0e460ef8c5ae.png?v=1787775754', 'https://theprisonerwinecompany.com/products/2023-unshackled-sauvignon-blanc-california'],
 [['Ben Holladay Soft Red Wheat Bottled-in-Bond','Holladay Soft Red Wheat Bottled-in-Bond'], 'https://cdn.shopify.com/s/files/1/0985/0601/5014/files/Ben-Holladay-Soft-Red-Wheat-Bourbon-squared_05f37f8d-f883-419d-bb2b-e4a46bad7e16.png?v=1765003931', 'https://shop.holladaydistillery.com/products/ben-holladay-soft-red-wheat-bourbon-750ml'],
 [['Knob Creek 12 Year','Knob Creek 12 Year Bourbon'], 'https://www.knobcreek.com/sites/default/files/styles/original/public/2024-09/12-year-old-kentucky-bottle-whiskey-knob-creek.webp?itok=N4MZweZD', 'https://www.knobcreek.com/whiskies/12-year-old-bourbon-whiskey'],
 [['Woodford Reserve Bourbon','Woodford Reserve'], 'https://www.woodfordreserve.com/wp-content/uploads/2019/12/Holiday-Bottle.png', 'https://www.woodfordreserve.com/whiskey/straight-bourbon-whiskey/'],
 [['Woodford Reserve Double Oaked'], 'https://www.woodfordreserve.com/wp-content/uploads/2019/12/1.png', 'https://www.woodfordreserve.com/whiskey/double-oaked/'],
 [['Penelope Toasted','Penelope Toasted Bourbon'], 'https://cdn.shopify.com/s/files/1/0528/9089/4506/files/Penelope_Toasted-BourbonBarrelFinish_WEB_1.png?v=1682972762', 'https://shop.penelopebourbon.com/products/toasted-series'],
 [["Maker's Mark", "Maker’s Mark", "Maker's Mark Bourbon"], 'https://www.makersmark.com/sites/default/files/styles/original/public/2025-06/makers-mark-bottle-bourbon-whiskey-classic.png.webp?itok=eoRW3x0g', 'https://www.makersmark.com/'],
 [['Four Roses','Four Roses Bourbon','Four Roses Yellow Label'], 'https://four-roses.files.svdcdn.com/production/images/bourbons/Web_FR-Bourbon.png?dm=1757960461', 'https://www.fourrosesbourbon.com/'],
 [['Old Forester 1910','Old Forester 1910 Old Fine Whisky'], 'https://www.oldforester.com/wp-content/uploads/2019/06/Old-Forester-1910-750ml-New-Label_TransparentBG-1-1-copy-1.png', 'https://www.oldforester.com/products/old-forester-1910-old-fine-whisky/'],
 [["Angel's Envy Rye", "Angel’s Envy Rye"], 'https://d3cqmwe6z7cbal.cloudfront.net/wp-content/uploads/sites/2/2026/04/08065013/AngelsEnvy_SignatureSeries_Rye.jpg', 'https://www.angelsenvy.com/us/en/whiskeys/signature-series/'],
 [["Angel's Envy Bourbon", "Angel’s Envy Bourbon"], 'https://d3cqmwe6z7cbal.cloudfront.net/wp-content/uploads/sites/2/2026/04/08065032/AngelsEnvy_SignatureSeries_Port.jpg', 'https://www.angelsenvy.com/us/en/whiskeys/signature-series/']
];
const normalize = name => String(name || '').replace(/’/g,"'").toLowerCase().trim();
export function verifiedBottleImage(record) {
 const entry = entries.find(([names]) => names.some(name => normalize(name) === normalize(record.name)));
 return entry ? {image_url:entry[1],image_source:entry[3] || 'producer',image_source_url:entry[2]} : null;
}
export function withBottleImage(record) {
 if (record.image_url) return record;
 const photo=verifiedBottleImage(record);
 return photo ? {...record,...photo} : record;
}
export const FEATURE_BOTTLES = ['Penelope Toasted','Woodford Reserve Double Oaked',"Maker's Mark"].map(name=>withBottleImage({name,category:'bourbon'}));
