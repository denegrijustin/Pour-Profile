const WINE = new Set(['sauvignon_blanc','chardonnay','pinot_grigio','riesling','other_white','rose','pinot_noir','cabernet','red_blend','merlot','other_red','sparkling','dessert']);
export function catalogVarietal(r) { return r.varietal || (WINE.has(r.category) ? r.category : null); }
export function matchesCatalogFocus(r, category='', varietal='') {
  const wine=r.category==='wine'||WINE.has(r.category);
  return (!category || (category==='wine'?wine:r.category===category)) && (!varietal || catalogVarietal(r)===varietal);
}
