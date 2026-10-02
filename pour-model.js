// Shared sensory vocabulary: observations are separate from enjoyment. Versioned
// answers stay attached to each pour rather than overwriting bottle facts.
const q = (id, axis, prompt, low, high) => ({ id, axis, prompt, low, high });
export const POUR_CATEGORIES = ['bourbon', 'wine', 'tequila', 'rum', 'scotch'];
export const QUESTIONS = {
  bourbon: [
    q('sweetness','sweetness','How sweet is the caramel, vanilla or brown sugar?','Dry','Very sweet'),
    q('oak','oak','How much toasted or charred oak do you taste?','None','Dominant'),
    q('fruit','fruit','How intense are cherry, apple or dried-fruit notes?','None','Intense'),
    q('spice','spice','How strong is the rye pepper or baking spice?','None','Fiery'),
    q('grain','grain','How prominent are corn, wheat or grain notes?','None','Dominant'),
    q('richness','richness','How rich are chocolate, nuts or toffee notes?','None','Rich'),
    q('smoke','smoke','How smoky or leathery is it?','None','Heavy'),
    q('body','body','How full and coating is the mouthfeel?','Light','Full'),
    q('warmth','warmth','How much alcohol heat do you feel?','Gentle','Hot'),
    q('finish','finish','How long do the flavors linger?','Short','Long')
  ],
  wine: [
    q('sweetness','sweetness','How sweet is the wine?','Bone dry','Dessert sweet'),
    q('fruit','fruit','How intense are its citrus, berry or stone-fruit flavors?','Subtle','Intense'),
    q('acidity','acidity','How crisp or tart is it?','Soft','Very tart'),
    q('tannin','tannin','How drying or grippy are its tannins?','None','Grippy'),
    q('oak','oak','How much vanilla, toast or oak do you taste?','None','Dominant'),
    q('herbal','herbal','How prominent are green, herbal or earthy notes?','None','Dominant'),
    q('richness','richness','How creamy, buttery or rounded is it?','Lean','Creamy'),
    q('body','body','How full is its body, from light whites to bold reds?','Light','Full'),
    q('warmth','warmth','How much alcohol warmth do you feel?','Gentle','Hot'),
    q('finish','finish','How long does the flavor linger?','Short','Long')
  ],
  tequila: [
    q('agave','herbal','How strong is the cooked agave or green agave character?','None','Dominant'),
    q('sweetness','sweetness','How sweet is it, from agave to vanilla?','Dry','Very sweet'),
    q('fruit','fruit','How intense are citrus or tropical-fruit notes?','None','Intense'),
    q('spice','spice','How peppery or spicy is it?','None','Fiery'),
    q('oak','oak','How much barrel oak or toast do you taste?','None / blanco','Heavy / aged'),
    q('minerality','minerality','How mineral, earthy or saline is it?','None','Dominant'),
    q('richness','richness','How rich are caramel, chocolate or nut notes?','None','Rich'),
    q('body','body','How full and oily is its texture?','Light','Full'),
    q('warmth','warmth','How much alcohol heat do you feel?','Gentle','Hot'),
    q('finish','finish','How long does the flavor linger?','Short','Long')
  ],
  rum: [
    q('sweetness','sweetness','How sweet are sugarcane or molasses notes?','Dry','Very sweet'),
    q('fruit','fruit','How intense are banana, pineapple or dried-fruit notes?','None','Intense'),
    q('funk','funk','How strong is fermented fruit or Jamaican-style funk?','Clean','Very funky'),
    q('herbal','herbal','How grassy or cane-forward is it, as in agricole?','None','Dominant'),
    q('oak','oak','How much aged oak or toast do you taste?','None / white','Heavy / aged'),
    q('spice','spice','How much baking spice or pepper is present?','None','Intense'),
    q('richness','richness','How rich are toffee, chocolate or nut notes?','None','Rich'),
    q('body','body','How full and coating is its texture?','Light','Full'),
    q('warmth','warmth','How much alcohol heat do you feel?','Gentle','Hot'),
    q('finish','finish','How long does the flavor linger?','Short','Long')
  ],
  scotch: [
    q('smoke','smoke','How strong is peat smoke, from unpeated to Islay?','Unpeated','Heavily peated'),
    q('sweetness','sweetness','How sweet are honey, vanilla or sherry notes?','Dry','Very sweet'),
    q('fruit','fruit','How intense are orchard or dried-fruit notes?','None','Intense'),
    q('oak','oak','How much cask oak or toast do you taste?','None','Dominant'),
    q('grain','grain','How prominent are malt, cereal or biscuit notes?','None','Dominant'),
    q('spice','spice','How strong are pepper or warming spices?','None','Fiery'),
    q('minerality','minerality','How coastal, saline or mineral is it?','None','Dominant'),
    q('body','body','How full and oily is its texture?','Light','Full'),
    q('warmth','warmth','How much alcohol heat do you feel?','Gentle','Hot'),
    q('finish','finish','How long does the flavor linger?','Short','Long')
  ]
};
export const STYLES = {
  bourbon: ['Straight bourbon','Wheated','High rye','Double oaked','Barrel finished','Single barrel','Other'],
  wine: ['Sauvignon Blanc','Chardonnay','Riesling','Pinot Grigio','Cabernet Sauvignon','Pinot Noir','Merlot','Red blend','Rosé','Sparkling','Dessert wine','Other'],
  tequila: ['Blanco','Reposado','Añejo','Extra añejo','Cristalino','Other'],
  rum: ['White','Gold','Dark / aged','Spiced','Agricole','Jamaican / funky','Navy / overproof','Other'],
  scotch: ['Unpeated single malt','Peated single malt','Sherry cask','Bourbon cask','Blended malt','Blended whisky','Other']
};
export const AXES = [...new Set(Object.values(QUESTIONS).flat().map(q => q.axis))];
export const AXIS_LABELS = { sweetness:'Sweetness',oak:'Oak',fruit:'Fruit',spice:'Spice',grain:'Grain / malt',richness:'Richness',smoke:'Smoke / peat',body:'Body',warmth:'Alcohol warmth',finish:'Finish length',acidity:'Acidity',tannin:'Tannin',herbal:'Herbal / agave',minerality:'Minerality',funk:'Rum funk' };
export function parseAnswers(raw) { try { return typeof raw === 'string' ? JSON.parse(raw) : raw || {}; } catch { return {}; } }
export function validateAnswers(category, answers) {
  if (!QUESTIONS[category] || !answers || typeof answers !== 'object' || Array.isArray(answers)) return false;
  const allowed = new Set(QUESTIONS[category].map(q => q.id));
  return Object.entries(answers).every(([id,a]) => allowed.has(id) && a && typeof a.intensity === 'number' && Number.isFinite(a.intensity) && a.intensity >= 0 && a.intensity <= 10 && typeof a.enjoyment === 'number' && Number.isInteger(a.enjoyment) && a.enjoyment >= 1 && a.enjoyment <= 5);
}
export function observations(category, raw) {
  const answers = parseAnswers(raw), out = {};
  for (const question of QUESTIONS[category] || []) {
    const a = answers[question.id];
    if (a && Number.isFinite(a.intensity)) out[question.axis] = a.intensity;
  }
  return out;
}
// Positive examples define targets. Disliked intensities repel candidates rather
// than becoming targets. Same-category and same-style evidence is stronger;
// cross-category transfer is only allowed for shared sensory axes.
export function scorePour(candidate, evidence) {
  const dims = candidate.dimensions || {}, reasons = [], concerns = [], contributions = [];
  for (const axis of AXES) {
    if (!Number.isFinite(dims[axis])) continue;
    const samples = evidence.filter(e => Number.isFinite(e.dimensions?.[axis]) && e.rating != null);
    if (!samples.length) continue;
    const weighted = samples.map(e => ({ ...e, weight: e.category === candidate.category ? (e.style && String(e.style).toLowerCase().replaceAll('_',' ') === String(candidate.style || '').toLowerCase().replaceAll('_',' ') ? 1.5 : 1) : 0.35 }));
    const positives = weighted.filter(e => (e.enjoyment?.[axis] ?? (e.rating / 2)) >= 3.5);
    const negatives = weighted.filter(e => (e.enjoyment?.[axis] ?? (e.rating / 2)) <= 2);
    let fit = null, why = '';
    if (positives.length) {
      const weight = positives.reduce((s,e) => s + e.weight, 0);
      const target = positives.reduce((s,e) => s + e.dimensions[axis] * e.weight, 0) / weight;
      fit = Math.max(0, 100 - Math.abs(dims[axis] - target) * 10);
      why = `${AXIS_LABELS[axis]} ${dims[axis]}/10 is ${Math.abs(dims[axis]-target) <= 2 ? 'close to' : 'different from'} your enjoyed pours (about ${target.toFixed(1)}/10)`;
    }
    if (negatives.length) {
      const penalty = negatives.reduce((s,e) => s + Math.max(0, 1 - Math.abs(dims[axis] - e.dimensions[axis]) / 4) * e.weight, 0) / negatives.reduce((s,e) => s + e.weight, 0);
      fit = fit == null ? 75 - penalty * 65 : Math.max(0, fit - penalty * 45);
      if (penalty > 0.45) concerns.push(`${AXIS_LABELS[axis]} resembles pours you disliked`);
    }
    if (fit != null) {
      const weight = Math.min(3, weighted.reduce((s,e) => s + e.weight, 0));
      contributions.push({ fit, weight });
      if (why) reasons.push({fit, text:why});
    }
  }
  if (!contributions.length) return { score:null, confidence:'No tasting evidence', reasons:[], concerns:[], axes:0 };
  const score = Math.round(contributions.reduce((s,c) => s+c.fit*c.weight,0) / contributions.reduce((s,c) => s+c.weight,0));
  return { score, confidence: contributions.length >= 6 && evidence.length >= 5 ? 'Established' : 'Early estimate', reasons:reasons.sort((a,b) => b.fit-a.fit).slice(0,3).map(r => r.text), concerns:concerns.slice(0,3), axes:contributions.length };
}
export function tastingEvidence(t) {
  const category = t.bottle_category || t.category;
  const answers = parseAnswers(t.questionnaire_answers), enjoyment = {};
  for (const q of QUESTIONS[category] || []) if (answers[q.id]) enjoyment[q.axis] = answers[q.id].enjoyment;
  return { category, style:t.tasting_style || t.varietal || t.subcategory, rating:t.rating, dimensions:observations(category,answers), enjoyment };
}
