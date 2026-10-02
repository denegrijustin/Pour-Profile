// Curated factual scores, checked 2026-10-02. Producer compilations are
// explicitly identified as secondary evidence; scores apply only to these releases.
const grey = 'https://greywacke.com/docs/GreywackeReview-Chardonnay.pdf';
const score = (source, value, scale, url, scope = 'Exact release listed') => ({ source, score:value, scale:String(scale), source_url:url, scope });
export const VERIFIED_DRINKS = [
 {id:'cloudy-2023',name:'Cloudy Bay Sauvignon Blanc 2023',producer:'Cloudy Bay',category:'wine',ratings:[score('vivino',4.2,5,'https://www.vivino.com/en/cloudy-bay-sauvignon-blanc/w/18978?year=2023')]},
 {id:'matanzas-2023',name:'Matanzas Creek Estate Vineyard Sauvignon Blanc 2023 (Bennett Valley)',producer:'Matanzas Creek',category:'wine',ratings:[score('wine_enthusiast',90,100,'https://www.wineenthusiast.com/buying-guide/matanzas-creek-winery-2023-estate-vineyard-sauvignon-blanc-bennett-valley/')]},
 {id:'grey-2023',name:'Greywacke Chardonnay 2023',producer:'Greywacke',category:'wine',ratings:[score('decanter',95,100,grey,'Anne Krebiehl, cited in producer compilation, page 1'),score('wine_advocate',92,100,grey,'Erin Larkin, cited in producer compilation, page 1'),score('halliday',95,100,grey,'Shanteh Wale, cited in producer compilation, page 1')]},
 {id:'grey-2022',name:'Greywacke Chardonnay 2022',producer:'Greywacke',category:'wine',ratings:[score('james_suckling',95,100,grey,'Cited in producer compilation, page 2')]},
 {id:'grey-2021',name:'Greywacke Chardonnay 2021',producer:'Greywacke',category:'wine',ratings:[score('wine_spectator',92,100,grey,'MaryAnn Worobiec, cited in producer compilation, page 3')]},
 {id:'woodford-452',name:'Woodford Reserve Double Oaked (45.2% ABV)',producer:'Woodford Reserve',category:'bourbon',abv:45.2,proof:90.4,ratings:[score('distiller_expert',92,100,'https://distiller.com/spirits/woodford-reserve-double-oaked','Expert review by Amanda Schuster')]},
 {id:'woodford-432',name:'Woodford Reserve Double Oaked (43.2% ABV)',producer:'Woodford Reserve',category:'bourbon',abv:43.2,proof:86.4,ratings:[score('whisky_magazine',8.8,10,'https://whiskymag.com/tastings/woodford-reserve-double-oaked/')]},
 {id:'lagavulin-2021',name:'Lagavulin 16 Year (2021 bottling, 43% ABV)',producer:'Lagavulin',category:'scotch',abv:43,proof:86,ratings:[score('whiskyfun',90,100,'https://www.whiskyfun.com/2021/The-Ultimate-Sessions-today-Lagavulin.html','Review dated 2021-08-25; bottling approximately 2021')]}
];
