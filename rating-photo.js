import {api,downscaleImage} from './api.js';
import {bottleThumbHtml,escapeHtml} from './ui.js';

export function ratingPhotoToolsHtml() {
 return '<div id="ratingPhotoTools" class="field-hint" role="status" style="margin:8px 0" hidden></div>';
}
export async function wireRatingPhoto(bottle) {
 const root=document.getElementById('ratingPhotoTools'),photo=document.getElementById('ratingBottlePhoto');
 if(!root||!photo)return;
 let running=false;
 const alive=()=>root.isConnected && photo.isConnected;
 const renderPhoto=b=>{if(alive())photo.innerHTML=bottleThumbHtml(b);};
 const fallback=()=>{
  if(!alive())return;
  root.hidden=false;
  root.innerHTML=`<p>We couldn’t verify a photo after multiple searches. You can search outside the app, take a screenshot of the correct bottle, and upload it here.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-secondary btn-sm" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(bottle.name+' bottle')}" target="_blank" rel="noopener noreferrer">Search bottle images</a><button type="button" class="btn btn-secondary btn-sm" data-photo-upload>Upload screenshot</button><button type="button" class="btn btn-secondary btn-sm" data-photo-retry>Search again</button></div><input type="file" accept="image/*" data-photo-file hidden>`;
  root.querySelector('[data-photo-retry]').onclick=()=>search();
  const input=root.querySelector('[data-photo-file]');
  root.querySelector('[data-photo-upload]').onclick=()=>input.click();
  input.onchange=async()=>{
   const file=input.files?.[0];if(!file)return;
   try {const data=await downscaleImage(file);await api.putBottlePhoto(bottle.id,data);const saved=await api.bottle(bottle.id);renderPhoto(saved.bottle);if(alive()){root.textContent='Photo saved.';}}
   catch(e){if(alive())root.textContent=e.message || 'Could not save screenshot. Please try again.';}
  };
 };
 const retry=(message)=>{
  if(!alive())return;root.hidden=false;root.innerHTML=`${escapeHtml(message)} <button type="button" class="btn btn-secondary btn-sm" data-photo-retry>Retry photo search</button>`;root.querySelector('button').onclick=()=>search();
 };
 const search=async()=>{
  if(running||!alive())return;running=true;root.hidden=false;root.textContent='Finding the bottle photo across sources and alternate searches…';
  try {
   const res=await api.enrichImages({limit:1,bottle_id:bottle.id,bottles_only:true,retry_failed:true});
   if(!alive())return;
   if(res.results?.some(r=>r.status==='ok')) {
    const saved=await api.bottle(bottle.id);renderPhoto(saved.bottle);
    const img=photo.querySelector('img');if(img)img.onerror=()=>retry('The saved photo could not load.');
    root.textContent='Bottle photo found and saved.';
   } else if(res.results?.some(r=>r.exhausted && r.queries_tried>=2))fallback();
   else retry('Photo search could not finish. Please retry when connected.');
  }catch {retry('Photo search could not finish. Please retry when connected.');}
  finally {running=false;}
 };
 try {
  const current=(await api.bottle(bottle.id)).bottle;if(!alive())return;
  if(current?.image_url){
   renderPhoto(current);const img=photo.querySelector('img');
   if(img){img.onerror=()=>{if(current.image_source==='user_photo')retry('Your uploaded photo could not load.');else search();};if(img.complete&&!img.naturalWidth)await search();}
  }else await search();
 }catch {await search();}
}
