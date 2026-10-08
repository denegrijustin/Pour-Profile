import {enrichBookImage} from './book-images.js';
import {lookupBottleSources} from './bottle-search.js';
import {downloadImage,enrichOne} from './image-enrich.js';
import {researchFetch} from './bottle-research.js';

// Size and generic product words don't change the photographed expression.
// Ages, vintages, proof, finishes and barrel/pick names DO and remain required.
export function photoIdentity(name='') {
 return String(name).toLowerCase().replace(/[’']/g,'').replace(/\b\d+(?:\.\d+)?\s*(?:ml|litres?|liters?|l)\b/g,' ').replace(/\b(?:whiskey|whisky|kentucky|straight|bottle|bourbon)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean).sort().join(' ');
}
export function photoQueries(subject) {
 const name=subject.name.trim(),plain=name.replace(/[’']/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const branded=subject.producer && !name.toLowerCase().includes(subject.producer.toLowerCase())?`${subject.producer} ${name}`:name;
 return [...new Set([branded,plain,`${plain} 750ml`,`${plain} whiskey`])].slice(0,3);
}
export async function enrichPersistentImage(subject,{fetchImpl=researchFetch,assetFetch,book=enrichBookImage,search=lookupBottleSources,fallback=enrichOne}={}) {
 const first=await book(subject,{fetchImpl,assetFetch,fallback:async()=>({status:'no_match',match_reason:'continue with other sources'})});
 if(first.status==='ok')return {...first,exhausted:false};
 const queries=photoQueries(subject),seen=new Set();let details=0,available=0;
 const notes=[];
 for(const q of queries) {
  try {
   const result=await search(q,null,fetchImpl);
   if((result.unavailable_sources || []).length<3)available++;
   const exact=(result.candidates || []).filter(c=>photoIdentity(c.name)===photoIdentity(subject.name));
   // Several sizes of the same expression are safe representative packshots.
   exact.sort((a,b)=>Number(/750\s*ml/i.test(b.name))-Number(/750\s*ml/i.test(a.name)));
   for(const c of exact) {
    if(seen.has(c.url)||details>=4)continue;seen.add(c.url);details++;
    try {
     const {draft}=await search(subject.name,c.url,fetchImpl);
     if(!draft?.source_image_url || photoIdentity(draft.name)!==photoIdentity(subject.name))continue;
     const {mime,buf}=await downloadImage(draft.source_image_url,fetchImpl);
     return {status:'ok',confidence:1,source_page:c.url,image_url:draft.source_image_url,mime,buf,candidates:[],match_reason:`Photo found across bottle sources (${details} product pages checked)`,exhausted:false,queries_tried:queries.indexOf(q)+1};
    }catch(e){notes.push(e.message);}
   }
  }catch(e){notes.push(e.message);}
 }
 const last=await fallback(subject,{fetchImpl});
 return {...last,exhausted:last.status!=='ok' && available>0,retryable:last.status!=='ok' && !available,queries_tried:queries.length,match_reason:`Persistent lookup: ${queries.length} queries across Blue Book and two retailers, producer and public image sources; ${last.match_reason || notes.join('; ')}`};
}
