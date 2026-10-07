import {verifiedBottleImage} from './bottle-images.js';
import {lookupBottleBook} from './bottle-blue-book.js';
import {downloadImage,scoreNameMatch,enrichOne} from './image-enrich.js';
import {researchFetch} from './bottle-research.js';

// Only an unambiguous complete identity match can fill a photo automatically.
// Extra years, ages, proof or expression words require the user's selection.
export async function enrichBookImage(subject,{fetchImpl=researchFetch,fallback=enrichOne,assetFetch}={}) {
 let note='';
 const verified=verifiedBottleImage(subject);
 if(verified) {
  try {
   const local=verified.image_url.startsWith('/');
   if(local && !assetFetch) throw new Error('Photo asset unavailable');
   const {mime,buf}=await downloadImage(verified.image_url,local?assetFetch:fetchImpl);
   return {subject_id:subject.id,status:'ok',confidence:1,source_page:verified.image_source_url,image_url:verified.image_url,mime,buf,bytes:buf.length,candidates:[],match_reason:'verified expression photo saved'};
  } catch(err) { note=`Verified photo: ${String(err.message || err)}; `; }
 }
 try {
  const search=await lookupBottleBook(subject.name,null,fetchImpl);
  const exact=(search.candidates || []).filter(c=>{
   const m=scoreNameMatch(subject.name,null,c.name,{identity:true});
   return m.coverage===1 && m.precision===1;
  });
  if(exact.length===1) {
   const {draft}=await lookupBottleBook(subject.name,exact[0].url,fetchImpl);
   const m=scoreNameMatch(subject.name,null,draft.name,{identity:true});
   if(m.coverage===1 && m.precision===1 && draft.source_image_url) {
    const {mime,buf}=await downloadImage(draft.source_image_url,fetchImpl);
    return {subject_id:subject.id,status:'ok',confidence:1,source_page:exact[0].url,image_url:draft.source_image_url,mime,buf,bytes:buf.length,candidates:[],match_reason:'Blue Book: exact expression image saved'};
   }
  }
  note+=exact.length>1?'multiple editions need confirmation':'no unique exact expression image';
 } catch(err) { note+=String(err.message || err); }
 const result=await fallback(subject,{fetchImpl});
 result.match_reason=`Blue Book: ${note}; ${result.match_reason || ''}`;
 return result;
}
