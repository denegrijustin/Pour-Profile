import { termsToTags } from './expert-match.js';
const parse = raw => { try{return typeof raw==='string'?JSON.parse(raw):raw || {};}catch{return {};}};
export const REACTIONS={bad:2,ok:6,like:7.5,love:9};
export function sourcePreferences(rows, records) {
  // Latest reaction per bottle; repeated pours cannot swamp another bottle.
  const latest=new Map();
  for(const row of rows) if(!latest.has(row.bottle_id) || row.id>latest.get(row.bottle_id).id) latest.set(row.bottle_id,row);
  return [...latest.values()].map(row=>{
    const own=parse(row.category_attrs).web_research;
    const rec=records.find(r=>r.id===row.catalog_id) || records.find(r=>r.name.toLowerCase()===row.bottle_name?.toLowerCase());
    const terms=own?.flavor_terms || rec?.expert?.flavor_terms || [];
    return {name:row.bottle_name,category:row.bottle_category,rating:row.rating,tags:termsToTags(terms),sources:own?.sources || [],basis:'sourced tasting notes'};
  }).filter(p=>p.tags.length && (p.rating>=7 || p.rating<=4));
}
export function sourcePreferenceFit(candidate, preferences) {
  const tags=termsToTags(candidate.expert?.flavor_terms || []);
  if(!tags.length) return null;
  const matches=preferences.filter(p=>p.category===(candidate.category==='sauvignon_blanc'?'wine':candidate.category)).map(p=>({...p,overlap:tags.filter(t=>p.tags.includes(t))})).filter(p=>p.overlap.length);
  if(!matches.length) return null;
  let sum=0,weights=0;
  for(const p of matches) {const similarity=p.overlap.length/Math.min(tags.length,p.tags.length); const weight=p.rating>=8.5?1.5:1;sum+=(p.rating>=7?55+45*similarity:45-45*similarity)*weight;weights+=weight;}
  const positive=matches.filter(p=>p.rating>=7).sort((a,b)=>b.overlap.length-a.overlap.length)[0];
  const negative=matches.find(p=>p.rating<=4);
  return {score:Math.round(sum/weights),reason:positive?`Shares sourced ${positive.overlap.slice(0,3).join(', ').replaceAll('_',' ')} notes with ${positive.name}, which you ${positive.rating>=8.5?'love':'like'}.`:null,concern:negative?`Shares sourced ${negative.overlap.slice(0,3).join(', ').replaceAll('_',' ')} notes with ${negative.name}, which you rated Bad.`:null};
}
