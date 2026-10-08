import { AXIS_LABELS } from './pour-model.js';
const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 10;
export function mapRecommendation(candidates, targets, xAxis, yAxis, point) {
 const eligible=candidates.filter(c=>c.local_store && !c.adopted_bottle_id && valid(c.dimensions?.[xAxis]) && valid(c.dimensions?.[yAxis]));
 const desired={...Object.fromEntries(Object.entries(targets).filter(([,t])=>valid(t.target)).map(([a,t])=>[a,t.target])),[xAxis]:point.x,[yAxis]:point.y};
 return eligible.map(c=>{
  const axes=Object.keys(desired).filter(a=>valid(c.dimensions[a]));
  const other=axes.filter(a=>a!==xAxis && a!==yAxis);
  const projected=((c.dimensions[xAxis]-point.x)**2+(c.dimensions[yAxis]-point.y)**2)/2;
  const residual=other.length ? other.reduce((s,a)=>s+(c.dimensions[a]-desired[a])**2,0)/other.length : 0;
  const distance=Math.sqrt(projected+residual*0.1);
  return {...c,distance,match:Math.max(0,Math.round(100-distance*10))};
 }).sort((a,b)=>a.distance-b.distance || a.name.localeCompare(b.name))[0] || null;
}
export function flavorHeatmapHtml(profile={}) {
 const {dimensions={},targets={},confidence='unknown',rationale=null}=profile || {};
 const axes=Object.keys(dimensions).filter(a=>valid(dimensions[a]) && AXIS_LABELS[a]);
 if(axes.length<2)return '<p class="field-hint">Flavor map needs a researched numeric profile.</p>';
 const options=selected=>axes.map(a=>`<option value="${a}"${a===selected?' selected':''}>${esc(AXIS_LABELS[a])}</option>`).join('');
 return `<section class="flavor-map"><h3>Your flavor map</h3>${profile.current_name ? `<p class="field-hint">Comparing ${esc(profile.current_name)} to your ideal</p>` : ""}<p class="field-hint">Drag ◆ or tap the chart to explore. Warmer areas match your flavor target better. ● Store bottles · ◎ This bottle.</p>
 <div class="flavor-axis-controls"><label>Horizontal<select data-map-x>${options(axes.includes('sweetness')?'sweetness':axes[0])}</select></label><label>Vertical<select data-map-y>${options(axes.includes('spice')?'spice':axes[1])}</select></label></div>
 <svg class="flavor-chart" viewBox="0 0 360 300" role="img" aria-label="Interactive flavor match heat map"></svg>
 <div class="flavor-point-controls"><label data-point-x-label>Horizontal ideal<input data-point-x type="range" min="0" max="10" step="0.1"></label><label data-point-y-label>Vertical ideal<input data-point-y type="range" min="0" max="10" step="0.1"></label></div>
 <div class="flavor-map-result" aria-live="polite"></div><button class="btn btn-secondary btn-sm" data-map-reset>Reset to learned ideal</button>
 <p class="field-hint" data-map-explanation></p>
 <details><summary>Full flavor profile · ${axes.length} dimensions</summary><div class="flavor-value-grid">${axes.map(a=>`<div><strong>${esc(AXIS_LABELS[a])}</strong><span>Bottle ${dimensions[a]}/10 · Ideal ${valid(targets[a]?.target)?targets[a].target+'/10':'not learned yet'}</span></div>`).join('')}</div><p class="field-hint">${esc(rationale || '')} Profile confidence: ${esc(confidence)}. Values are research estimates, not critic quality scores.</p></details></section>`;
}
export function wireFlavorHeatmap(root,profile={},openBottle) {
 const section=root.querySelector('.flavor-map'),svg=section?.querySelector('svg');if(!svg)return;
 const xSelect=section.querySelector('[data-map-x]'),ySelect=section.querySelector('[data-map-y]');
 const xRange=section.querySelector('[data-point-x]'),yRange=section.querySelector('[data-point-y]');
 const targets=profile.targets || {},candidates=profile.candidates || [];
 let xAxis=xSelect.value,yAxis=ySelect.value,manual=false;
 const initial=()=>({x:valid(targets[xAxis]?.target)?targets[xAxis].target:5,y:valid(targets[yAxis]?.target)?targets[yAxis].target:5});
 const storageKey=`pourProfile.idealMap.v1.${profile.profile_key || "default"}.${profile.category || "bourbon"}`;
 const readSaved=()=>{try{return JSON.parse(localStorage.getItem(storageKey) || 'null')}catch{return null}};
 const applySaved=()=>{
  const saved=readSaved();
  if(saved && [...xSelect.options].some(o=>o.value===saved.xAxis) && [...ySelect.options].some(o=>o.value===saved.yAxis) && valid(saved.point?.x) && valid(saved.point?.y)){
   xAxis=saved.xAxis;yAxis=saved.yAxis;xSelect.value=xAxis;ySelect.value=yAxis;manual=true;return saved.point;
  }
  return initial();
 };
 let point=applySaved();
 const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify({xAxis,yAxis,point}))}catch{};window.dispatchEvent(new CustomEvent('pour-ideal-change',{detail:{key:storageKey,source:section}}));};
 const xy=(x,y)=>({x:42+x*29.6,y:260-y*22.4});
 const render=()=>{
  const best=mapRecommendation(candidates,targets,xAxis,yAxis,point);
  const cells=[];
  for(let x=0;x<20;x++)for(let y=0;y<20;y++){
   const near=mapRecommendation(candidates,targets,xAxis,yAxis,{x:(x+.5)/2,y:(y+.5)/2});
   // Availability fit: distance from each field cell to eligible store bottles.
   const closeness=near?Math.max(0,1-near.distance/5):0;
   const preference=Math.max(0,1-Math.hypot((x+.5)/2-point.x,(y+.5)/2-point.y)/10);
   const heat=closeness*preference;
   cells.push(`<rect x="${42+x*14.8}" y="${36+(19-y)*11.2}" width="15" height="11.5" fill="hsl(${185-145*heat} 55% ${92-35*heat}%)"/>`);
  }
  const dots=candidates.filter(c=>valid(c.dimensions?.[xAxis])&&valid(c.dimensions?.[yAxis])).map(c=>{
   const pos=xy(c.dimensions[xAxis],c.dimensions[yAxis]);return `<circle cx="${pos.x}" cy="${pos.y}" r="${c.id===profile.current_id?7:4}" fill="${c.id===best?.id?'#b34722':'#173b31'}" stroke="white" stroke-width="${c.id===profile.current_id?3:1}"><title>${esc(c.name)}</title></circle>`;
  }).join('');
  const pos=xy(point.x,point.y);
  svg.innerHTML=`${cells.join('')}<rect x="42" y="36" width="296" height="224" fill="none" stroke="#53665e"/>${[0,5,10].map(v=>`<text x="${42+v*29.6}" y="276" text-anchor="middle">${v}</text><text x="32" y="${264-v*22.4}" text-anchor="end">${v}</text>`).join('')}<text x="190" y="295" text-anchor="middle">${esc(AXIS_LABELS[xAxis])}</text><text transform="translate(13 148) rotate(-90)" text-anchor="middle">${esc(AXIS_LABELS[yAxis])}</text>${dots}<path d="M ${pos.x} ${pos.y-9} l 9 9 -9 9 -9 -9 Z" fill="#842851" stroke="white" stroke-width="2"><title>Your ${manual?'explored':'calculated'} ideal</title></path>`;
  xRange.value=point.x;yRange.value=point.y;xRange.setAttribute('aria-label',`${AXIS_LABELS[xAxis]} ideal`);yRange.setAttribute('aria-label',`${AXIS_LABELS[yAxis]} ideal`);
  section.querySelector('.flavor-map-result').innerHTML=best?`<strong>${manual?'Closest to your moved target':'Recommended for your ideal'}: ${esc(best.name)}</strong><p>${best.match}% flavor similarity · ${AXIS_LABELS[xAxis]} ${point.x.toFixed(1)} / ${AXIS_LABELS[yAxis]} ${point.y.toFixed(1)}</p><button class="btn btn-primary btn-sm" data-map-bottle="${esc(best.id)}">See bottle details</button>`:'No untried photo-confirmed bottles with profiles in this category yet.';
  section.querySelector('[data-map-bottle]')?.addEventListener('click',()=>openBottle(best.id));
  const learned=valid(targets[xAxis]?.target)&&valid(targets[yAxis]?.target);
  section.querySelector('[data-map-explanation]').textContent=`${learned?'Calculated from flavors of bottles you enjoyed.':'An unlearned axis starts at the neutral midpoint (5), not a calculated preference.'} Moving the point explores these two flavors; the closest chart position drives recommendations, with other learned flavors refining close matches. Your moved ideal is saved for comparisons across the app. Recommendations use only photo-confirmed store bottles not already on your list. Your ratings are unchanged.`;
 };
 const move=e=>{
  const rect=svg.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*360,y=(e.clientY-rect.top)/rect.height*300;
  point={x:Math.round(Math.max(0,Math.min(10,(x-42)/29.6))*10)/10,y:Math.round(Math.max(0,Math.min(10,(260-y)/22.4))*10)/10};manual=true;render();persist();
 };
 svg.addEventListener('pointerdown',e=>{svg.setPointerCapture(e.pointerId);move(e)});
 svg.addEventListener('pointermove',e=>{if(svg.hasPointerCapture(e.pointerId))move(e)});
 svg.addEventListener('pointerup',e=>{if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId)});
 [xRange,yRange].forEach(input=>input.addEventListener('input',()=>{point={x:Number(xRange.value),y:Number(yRange.value)};manual=true;render();persist()}));
 [xSelect,ySelect].forEach(select=>select.addEventListener('change',()=>{
  if(xSelect.value===ySelect.value){const other=select===xSelect?ySelect:xSelect;other.value=[...other.options].find(o=>o.value!==select.value).value;}
  xAxis=xSelect.value;yAxis=ySelect.value;manual=false;point=initial();render();persist();
 }));
 section.querySelector('[data-map-reset]').addEventListener('click',()=>{manual=false;point=initial();try{localStorage.removeItem(storageKey)}catch{};render();window.dispatchEvent(new CustomEvent('pour-ideal-change',{detail:{key:storageKey,source:section}}))});
 const sync=e=>{if(!section.isConnected){window.removeEventListener('pour-ideal-change',sync);return;}if(e.detail?.key===storageKey && e.detail.source!==section){manual=!!readSaved();point=applySaved();render();}};
 window.addEventListener('pour-ideal-change',sync);render();
}
