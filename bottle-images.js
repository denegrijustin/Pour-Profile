// Verified producer product photography (2026-10-02). Match exact expressions,
// never use a brand-wide image for an unknown expression. User photos win.
// Source pages and image labels checked against the expression, not brand alone.
// Names without batch/year get representative expression photography only.
const entries = [
 [["Honig Napa Valley Sauvignon Blanc", "Honig Sauvignon Blanc"], "/bottle-photo-assets/wine-more-0.png", "https://www.wineonsale.com/products/honig-sauvignon-blanc-2024-750-ml", "retailer"],
 [["Saint Supéry Napa Valley Sauvignon Blanc", "St. Supéry Sauvignon Blanc"], "/bottle-photo-assets/wine-more-1.jpg", "https://www.wineonsale.com/products/st-supery-sauvignon-blanc-2023-750-ml", "retailer"],
 [["Loveblock Marlborough Sauvignon Blanc", "Loveblock Sauvignon Blanc"], "/bottle-photo-assets/wine-more-2.jpg", "https://www.wineonsale.com/products/loveblock-sauvignon-blanc-2023-750-ml", "retailer"],
 [["Henri Bourgeois Les Baronnes Sancerre"], "/bottle-photo-assets/wine-more-3.jpg", "https://www.wineonsale.com/products/henri-bourgeois-sancerre-les-baronnes-blanc-2025-750-ml", "retailer"],
 [["Kim Crawford Marlborough Sauvignon Blanc", "Kim Crawford Sauvignon Blanc"], "/bottle-photo-assets/wine-more-4.png", "https://www.kimcrawfordwines.com/products/sauvignon-blanc", "producer"],
 [["Chateau Ste. Michelle Columbia Valley Sauvignon Blanc", "Chateau Ste. Michelle Sauvignon Blanc"], "/bottle-photo-assets/wine-more-5.jpg", "https://www.ste-michelle.com/sauvignon-blanc-columbia-valley", "producer"],
 [["Greywacke Marlborough Sauvignon Blanc", "Greywacke Sauvignon Blanc"], "/bottle-photo-assets/wine-more-6.jpg", "https://thebottleshops.com/products/greywacke-sauvignon-blanc", "retailer"],
 [["Dry Creek Vineyard Sauvignon Blanc"], "/bottle-photo-assets/dry-creek-vineyard-sauvignon-blanc.png", "https://drycreekvineyard.com/trade/", "producer"],
 [["Bread & Butter Sauvignon Blanc"], "/bottle-photo-assets/bread-butter-sauvignon-blanc.png", "https://trade.wxbrands.com/brand/bread-butter/", "producer"],
 [["Cakebread Cellars Napa Valley Sauvignon Blanc", "Cakebread Cellars Sauvignon Blanc"], "/bottle-photo-assets/cakebread-cellars-napa-valley-sauvignon-blanc.png", "https://kegnbottle.com/products/cakebread-cellars-sauvignon-blanc-750-ml", "retailer"],
 [["Round Pond Estate Rutherford Sauvignon Blanc", "Round Pond Estate Sauvignon Blanc"], "/bottle-photo-assets/round-pond-estate-rutherford-sauvignon-blanc.png", "https://www.roundpond.com/trade/estate-sauvignon-blanc/", "producer"],
 [["Cloudy Bay Marlborough Sauvignon Blanc", "Cloudy Bay Sauvignon Blanc"], "/bottle-photo-assets/cloudy-bay-marlborough-sauvignon-blanc.png", "https://kegnbottle.com/products/cloudy-bay-new-zealand-sauvignon-blanc", "retailer"],
 [["Oyster Bay Marlborough Sauvignon Blanc", "Oyster Bay Sauvignon Blanc"], "/bottle-photo-assets/oyster-bay-marlborough-sauvignon-blanc.png", "https://kegnbottle.com/products/oyster-bay-marlborough-sauvignon-blanc-750ml", "retailer"],
 [["Whitehaven Marlborough Sauvignon Blanc", "Whitehaven Sauvignon Blanc"], "/bottle-photo-assets/whitehaven-marlborough-sauvignon-blanc.png", "https://kegnbottle.com/products/whitehaven-marlborough-sauvignon-blanc-2021-750ml", "retailer"],
 [["Emmolo Napa Valley Sauvignon Blanc", "Emmolo Sauvignon Blanc"], "/bottle-photo-assets/emmolo-napa-valley-sauvignon-blanc.jpg", "https://kegnbottle.com/products/emmolo-sauvignon-blanc-napa-valley", "retailer"],
 [["Kendall-Jackson Vintner's Reserve California Sauvignon Blanc", "Kendall-Jackson Vintner\u2019s Reserve Sauvignon Blanc", "Kendall-Jackson Vintner's Reserve Sauvignon Blanc"], "/bottle-photo-assets/kendall-jackson-vintner-s-reserve-california-sauvignon-blanc.png", "https://kegnbottle.com/products/kendall-jackson-vintners-reserve-sauvignon-blanc", "retailer"],
 [["Gunnar's Honey"], 'https://images.squarespace-cdn.com/content/v1/66cf8b191408943366983247/f99e616f-9753-4a70-a5d4-dfa8dc57e0b2/HONEY2.png?format=750w', 'https://gunnarsbourbon.com/our-story'],
 [['High West Cask Collection Barbados Rum Barrel Finish'], 'https://seelbachs.com/cdn/shop/files/high-west-blended-bourbon-finished-in-barbados-rum-barrels-std-99b42d33d34c-f23c1.jpg?v=1790966708', 'https://seelbachs.com/products/high-west-blended-bourbon-finished-in-barbados-rum-barrels', 'retailer'],
 [["Jim Beam Devil's Cut","Jim Beam Devil’s Cut","Jim Beam Devil's Cut Kentucky Straight Bourbon"], 'https://www.jimbeam.com/sites/default/files/styles/original/public/2025-02/devils-cut-whisky-jim-beam.png.webp?itok=KXMLyD2H', 'https://www.jimbeam.com/en-au/bourbons/jim-beam-devils-cut'],
 [['High West Double Rye','High West Double Rye!','High West Double Rye Whiskey','High West Double Rye Whiskey (750 mL)'], 'https://cdn.shopify.com/s/files/1/0045/4967/3089/files/high-west-double-rye-whiskey-750-ml-keg-n-bottle-8970167.jpg?v=1764186487', 'https://kegnbottle.com/products/high-west-double-rye-750-ml', 'retailer'],
 [['Johnny Drum Private Stock'], 'https://www.kentuckybourbonwhiskey.com/wp-content/uploads/2023/12/JDPS.png', 'https://www.kentuckybourbonwhiskey.com/whiskey/johnny-drum-private-stock/'],
 [['Penelope Architect'], 'https://shop.penelopebourbon.com/cdn/shop/products/bottle_544x.png?v=1641190991', 'https://shop.penelopebourbon.com/products/architect-series'],
 [['Rabbit Hole Dareringer'], 'https://www.rabbitholedistillery.com/cdn/shop/products/dareringer-204807_1024x1024.png?v=1708376543', 'https://www.rabbitholedistillery.com/products/dareringer-straight-bourbon-whiskey-finished-in-px-sherry-casks'],
 [['Evan Williams Bottled-in-Bond','Evan Williams Bottled in Bond'], '/bottle-photo-assets/evan-williams-bottled-in-bond.png', 'https://www.evanwilliams.com/bottled-in-bond-bourbon'],
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
 [['Ben Holladay Soft Red Wheat Bottled-in-Bond','Holladay Soft Red Wheat Bottled-in-Bond','Holladay Soft Red Wheat Bottled-In-Bond Missouri Straight Bourbon Whiskey'], 'https://cdn.shopify.com/s/files/1/0985/0601/5014/files/Ben-Holladay-Soft-Red-Wheat-Bourbon-squared_05f37f8d-f883-419d-bb2b-e4a46bad7e16.png?v=1765003931', 'https://shop.holladaydistillery.com/products/ben-holladay-soft-red-wheat-bourbon-750ml'],
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
