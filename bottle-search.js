import { lookupBottleBook, bottleBookUrl } from './bottle-blue-book.js';
import { publicUrl, normalizeResearch, researchFetch } from './bottle-research.js';
const stores={'gacraftspirits.com':'Great American Craft Spirits','kegnbottle.com':'Keg N Bottle'};
const devilUrl='https://www.jimbeam.com/en-au/bourbons/jim-beam-devils-cut';
const clean=(s='')=>String(s).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#0?39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const tokens=s=>clean(s).toLowerCase().replace(/[’']/g,'').replace(/\bjim beams\b/g,'jim beam').replace(/\bdevil\s+cut\b/g,'devils cut').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
export function searchCoverage(q,name) {const a=tokens(q),b=new Set(tokens(name));return a.length?a.filter(t=>b.has(t)).length/a.length:0;}
export function extraSourceUrl(value) {
 const safe=publicUrl(value); if(!safe)return null;
 const u=new URL(safe);u.search='';u.hash='';
 return (stores[u.hostname] && /^\/products\/[a-z0-9-]+$/.test(u.pathname)) || (u.hostname==='www.jimbeam.com' && /^\/en-au\/bourbons\/[a-z0-9-]+$/.test(u.pathname))?u.href:null;
}
async function read(url,fetchImpl,json=false) {
 const r=await fetchImpl(url);if(!r.ok)throw new Error('Bottle lookup: '+new URL(url).hostname+' returned '+r.status+'.');
 const body=await r.text();if(body.length>1500000)throw new Error('Bottle lookup page is too large.');return json?JSON.parse(body):body;
}
export function retailerDraft(p,url) {
 if(!p?.title)throw new Error('Bottle lookup could not read this product.');
 const description=clean(p.description), facts=clean(p.title)+' '+description;
 const proof=Number(facts.match(/\b(\d+(?:\.\d+)?)\s*proof\b/i)?.[1])||null;
 const abv=Number(facts.match(/\b(\d+(?:\.\d+)?)\s*%\s*(?:ABV|alc)/i)?.[1])||null;
 const size=clean(p.title).match(/\b(\d+(?:\.\d+)?)\s*(ml|l)\b/i);
 const cat=clean([p.title,p.type,...(p.tags||[])].join(' '));
 const category=/bourbon/i.test(cat)?'bourbon':/rye/i.test(cat)?'rye':/scotch/i.test(cat)?'scotch':/whisk/i.test(cat)?'american_whiskey':'other';
 const source=stores[new URL(url).hostname];
 const draft=normalizeResearch({found:true,name:clean(p.title),brand:p.vendor,category,proof,abv:abv || (proof?proof/2:null),bottle_size_ml:size?Number(size[1])*(size[2].toLowerCase()==='l'?1000:1):null,summary:description.slice(0,1200),product_page:url,sources:[{title:source,url}],reviews:[],flavor_terms:[]},new Set([url]));
 const img=p.featured_image;draft.source_image_url=publicUrl(typeof img==='string'?(img.startsWith('//')?'https:'+img:img):img?.src);draft.lookup_source=source;return draft;
}
export function producerDraft(html,url) {
 let product;
 for(const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
  try {const data=JSON.parse(m[1]);product=[...(Array.isArray(data)?data:[data]),...(data['@graph']||[])].find(p=>p['@type']==='Product');if(product)break;}catch{}
 }
 if(!product?.name)throw new Error('Bottle lookup could not verify this producer product.');
 const description=clean(product.description),proof=Number(description.match(/\b(\d+)\s*proof\b/i)?.[1])||null;
 const notes=url===devilUrl && /Deep char aroma with a smoky backdrop/.test(html) && /intense oak and vanilla notes/.test(html)?'Aroma: deep char and smoke. Palate: full bodied, with intense oak and vanilla.':'';
 const draft=normalizeResearch({found:true,name:clean(product.name),brand:'Jim Beam',category:'bourbon',proof,abv:proof?proof/2:null,summary:description+' '+notes,flavor_terms:notes?['char','smoke','oak','vanilla']:[],product_page:url,sources:[{title:'Jim Beam (producer)',url}],reviews:[]},new Set([url]));
 // Use the bottle packshot, rather than the schema's lifestyle image.
 const img=html.match(/<img[^>]*src="([^"]+)"[^>]*alt="Jim Beam Devil[’']s Cut bottle[^"]*"/i)?.[1];
 draft.source_image_url=publicUrl(new URL(img || (typeof product.image==='string'?product.image:''),url).href);draft.lookup_source='Jim Beam (producer)';return draft;
}
export async function lookupBottleSources(query,sourceUrl,fetchImpl=researchFetch) {
 const direct=sourceUrl || (/^https?:\/\//i.test(query)?query:null);
 if(direct) {
  if(bottleBookUrl(direct))return lookupBottleBook(query,direct,fetchImpl);
  const url=extraSourceUrl(direct);if(!url)throw new Error('Bottle lookup requires a supported bottle product page.');
  return {draft:stores[new URL(url).hostname]?retailerDraft(await read(url+'.js',fetchImpl,true),url):producerDraft(await read(url,fetchImpl),url)};
 }
 const jobs=[lookupBottleBook(query,null,fetchImpl),...Object.entries(stores).map(async([host,source])=>{
  const q=tokens(query).join(' ');const d=await read(`https://${host}/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=10`,fetchImpl,true);
  return {candidates:(d.resources?.results?.products || []).map(p=>({name:clean(p.title),url:extraSourceUrl(new URL(p.url,'https://'+host).href),source,match:searchCoverage(query,p.title)})).filter(p=>p.url && p.match>=0.8)};
 })];
 const results=await Promise.allSettled(jobs), candidates=[],unavailable=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled')candidates.push(...(r.value.candidates||[]).map(c=>({...c,source:c.source || 'Bottle Blue Book'})));else unavailable.push(i===0?'Bottle Blue Book':Object.values(stores)[i-1]);});
 if(searchCoverage(query,"Jim Beam Devil's Cut")===1)candidates.unshift({name:"Jim Beam Devil's Cut",url:devilUrl,source:'Jim Beam (producer)',proof:'90',match:1});
 const unique=[...new Map(candidates.map(c=>[c.url,c])).values()].sort((a,b)=>b.match-a.match).slice(0,30);
 return {candidates:unique,message:(unique.length?'Choose the exact bottle and size.':'No matching bottle found. Try a shorter name or a supported product-page link.')+(unavailable.length?' Some sources are temporarily unavailable: '+unavailable.join(', ')+'.':''),unavailable_sources:unavailable};
}
