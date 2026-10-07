import { publicUrl, normalizeResearch, researchFetch } from './bottle-research.js';
import { scoreNameMatch } from './image-enrich.js';
const ORIGIN='https://bottlebluebook.com';
function text(html='') {
  return String(html).replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([a-f0-9]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#039;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}
export function bottleBookUrl(value) {
  const safe=publicUrl(value); if(!safe) return null;
  const u=new URL(safe);
  return u.hostname==='bottlebluebook.com' && /^\/bottle\/\d+\//.test(u.pathname) ? safe : null;
}
export function parseBookSearch(html) {
  const candidates=[];
  for(const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*class="bottle_listings_box"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url=bottleBookUrl(text(match[1])); if(!url) continue;
    const block=match[2];
    const heading=block.match(/<div[^>]*font-size:\s*20px[^>]*>([\s\S]*?)<\/div>/i)?.[1];
    const name=text(heading); if(!name) continue;
    const field=label=>text(block.match(new RegExp(`<strong>${label}:<\\/strong>\\s*<span>([\\s\\S]*?)<\\/span>`,'i'))?.[1]);
    const year=field('Year');
    candidates.push({name:year && /^\d{4}$/.test(year) && !name.includes(year)?`${name} (${year})`:name,url,proof:field('Proof'),size:field('Size')});
  }
  return candidates;
}
export function parseBookBottle(html,url) {
  url=bottleBookUrl(url); if(!url) throw new Error('Bottle lookup requires a Bottle Blue Book bottle page.');
  const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  let name=text(h1); if(!name) throw new Error('Bottle lookup could not read this bottle page.');
  const fields={};
  for(const m of html.matchAll(/<span[^>]*class="bottle_heading_title"[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*class="bottle_heading_info"[^>]*>([\s\S]*?)<\/span>/gi)) fields[text(m[1])]=text(m[2]);
  const category=({Bourbon:'bourbon',Rye:'rye','Rye Whiskey':'rye',Scotch:'scotch','Japanese Whisky':'japanese',Japanese:'japanese',Whiskey:'american_whiskey',Wine:'wine'})[fields.Type] || 'other';
  const bottled=/^\d{4}$/.test(fields.Bottled || '')?fields.Bottled:null;
  if(bottled && !name.includes(bottled)) name+=` (${bottled})`;
  const proof=/^\d+(\.\d+)?$/.test(fields.Proof || '')?Number(fields.Proof):null;
  const size=(fields.Size || '').match(/^(\d+(?:\.\d+)?)\s*(ml|l)$/i);
  const age=fields.Age && !/^(--|N\/A|0)$/i.test(fields.Age)?fields.Age:null;
  const score=html.match(/class="overall_rating_box[^>]*>[\s\S]*?<span>\s*(\d+(?:\.\d+)?)\s*<\/span>[\s\S]*?<p>Overall Rating<\/p>/i)?.[1];
  const market=text(html.match(/Market Data[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]);
  const summary=[`${name}. Bottle Blue Book lists ${fields.Type || 'the bottle type'}${proof?`, ${proof} proof`:''}${fields.Size?`, ${fields.Size}`:''}${age?`, age ${age}`:''}.`,score?`Community overall rating: ${score}/100.`:'No community overall rating listed.',market?`Secondary-market estimate: ${market} (not MSRP).`:null].filter(Boolean).join(' ');
  const draft=normalizeResearch({found:true,name,brand:text(h1?.split(/<span\b/i)[0]),expression:text(h1?.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1]) || null,category,proof,abv:proof?proof/2:null,age_statement:age,bottle_size_ml:size?Number(size[1])*(size[2].toLowerCase()==='l'?1000:1):null,vintage:category==='wine' && bottled?Number(bottled):null,summary,product_page:url,sources:[{title:'Bottle Blue Book',url}],flavor_terms:[],reviews:score?[{source:'bottle_blue_book',score:Number(score),scale:100,url,scope:name}]:[]},new Set([url]));
  const image=html.match(/<a\b[^>]*class="bottle-profile-pic"[^>]*>[\s\S]*?<img\b[^>]*src="([^"]+)"/i)?.[1];
  const imageUrl=publicUrl(text(image));
  draft.source_image_url=imageUrl && new URL(imageUrl).hostname==='bottlebluebook.com' && new URL(imageUrl).pathname.startsWith('/img/bottles/')?imageUrl:null;
  draft.lookup_source='Bottle Blue Book';
  return draft;
}
async function page(url,fetchImpl) {
  const res=await fetchImpl(url,{headers:{'User-Agent':'PourProfile/1.0 (on-demand bottle lookup)'}});
  if(!res.ok) throw new Error(`Bottle lookup: Bottle Blue Book returned ${res.status}. Try again later.`);
  if(Number(res.headers.get('content-length'))>1500000) throw new Error('Bottle lookup page is too large.');
  const html=await res.text(); if(html.length>1500000) throw new Error('Bottle lookup page is too large.'); return html;
}
export async function lookupBottleBook(query,sourceUrl,fetchImpl=researchFetch) {
  if(sourceUrl || /^https?:\/\//i.test(query)) {
    const url=bottleBookUrl(sourceUrl || query); if(!url) throw new Error('Bottle lookup requires a Bottle Blue Book bottle page.');
    return {draft:parseBookBottle(await page(url,fetchImpl),url)};
  }
  let url=`${ORIGIN}/search?q=${encodeURIComponent(query)}`, candidates=[];
  // Follow only the site's own next-page link, with a small on-demand cap.
  for(let n=0;n<3 && url;n++) {
    const html=await page(url,fetchImpl); candidates.push(...parseBookSearch(html));
    const next=html.match(/<a\b[^>]*href="([^"]+)"[^>]*rel="next"/i)?.[1];
    url=next && publicUrl(text(next)) && new URL(text(next)).hostname==='bottlebluebook.com' && new URL(text(next)).pathname.startsWith('/search/')?text(next):null;
  }
  candidates=[...new Map(candidates.map(c=>[c.url,c])).values()].map(c=>({...c,match:scoreNameMatch(query,null,c.name,{identity:true}).coverage})).filter(c=>c.match>=0.5).sort((a,b)=>b.match-a.match).slice(0,30);
  // Always confirm among search results; expressions, years and proof can differ.
  return {candidates,message:candidates.length?'Choose the exact expression and year from Bottle Blue Book.':'No matching bottle found on Bottle Blue Book. Try a shorter name or paste its bottle-page link.'};
}
