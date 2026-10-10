import { api } from './api.js';
import { el, emptyStateHtml, skeletonHtml, errorStateHtml } from './ui.js';
import { getFocus, focusHtml, wireFocus } from './recommendation-focus.js';
import { pickCardHtml, openCatalogDetail } from './view-discover.js';
import { flavorHeatmapHtml, wireFlavorHeatmap } from './flavor-heatmap.js';
import { openBottlePickerSheet } from './log-pour.js';

let homeDispatch;
let renderSequence=0;
export async function renderHome() {
  const view=el('view-home'), sequence=++renderSequence, focus=getFocus();
  view.innerHTML=skeletonHtml(3);
  const picksRes = await api.catalogRecommended(focus).catch(()=>({results:[],failed:true}));
  if(sequence!==renderSequence) return;
  if (picksRes.failed) { view.innerHTML=errorStateHtml(); return; }
  view.innerHTML=`
    ${focusHtml()}
    ${picksRes.results?.length?`<div class="pick-list home-picks">${picksRes.results.slice(0,3).map(pickCardHtml).join('')}</div>`:emptyStateHtml('✧',picksRes.failed?'Couldn’t load recommendations':'No scored picks for this variety yet',picksRes.failed?'Try again when your connection is available.':'Rate a bottle in this variety to build its taste profile. You can also browse the catalog.')}
    <button class="btn btn-secondary btn-block" data-action="nav-discover">More bottles</button>
    <div class="quick-actions"><button class="quick-action" data-action="log-pour">Rate a bottle</button><button class="quick-action" data-action="nav-discover">Browse bottles</button><button class="quick-action" data-action="nav-scan">Scan a bottle or shelf</button><button class="quick-action" data-action="nav-spirits">My collection</button></div>
    ${focus.category!=='wine'?`<details class="optional-flavor-map"><summary>Explore your flavor map</summary><div id="homeOptionalMap"><button class="btn btn-secondary" data-action="load-flavor-map">Open flavor map</button></div></details>`:''}`;
  wireFocus(view,renderHome);
}
export function wireHomeActions(dispatchNav) {
  homeDispatch=dispatchNav;
  el('view-home').addEventListener('click',async e=>{
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='nav-discover') dispatchNav('discover');
    if(action==='nav-scan') dispatchNav('scan');
    if(action==='nav-spirits') dispatchNav('spirits');
    if(action==='log-pour') openBottlePickerSheet();
    if(action==='load-flavor-map') {
      const holder=el('homeOptionalMap'); holder.innerHTML='<p>Loading flavor map…</p>';
      const data=await api.flavorMap().catch(()=>({}));
      holder.innerHTML=data.flavor_profile?flavorHeatmapHtml(data.flavor_profile):'<p>No flavor map available yet.</p>';
      wireFlavorHeatmap(holder,data.flavor_profile||{},id=>openCatalogDetail(id,dispatchNav));
    }
    if(e.target.closest('button,a,[data-open-bottle]')) return;
    const card=e.target.closest('[data-catalog-detail]'); if(card) openCatalogDetail(card.dataset.catalogDetail,dispatchNav);
  });
  el('view-home').addEventListener('keydown',e=>{
    const card=e.target.closest('[data-catalog-detail]'); if(card && !e.target.closest('button') && ['Enter',' '].includes(e.key)) {e.preventDefault();openCatalogDetail(card.dataset.catalogDetail,homeDispatch);}
  });
  el('view-home').addEventListener('click',async e=>{
    const button=e.target.closest('[data-adopt],[data-adopt-tried]'); if(!button)return;
    button.disabled=true;
    try {const tried=button.hasAttribute('data-adopt-tried');const res=await api.catalogAdopt({catalog_id:button.dataset.adopt||button.dataset.adoptTried,status_tags:[tried?'tried':'want_to_try']});if(tried)dispatchNav('bottle',res.bottle_id);else renderHome();}catch{button.disabled=false;button.textContent='Try again';}
  });
}
