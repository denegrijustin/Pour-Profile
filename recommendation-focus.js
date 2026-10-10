import { getActiveProfile } from './api.js';
import { WINE_VARIETALS } from './wine-engine.js';
import { escapeHtml } from './ui.js';
export function getFocus() {
  const fallback = getActiveProfile() === 'lady' ? {category:'wine',varietal:'sauvignon_blanc'} : {category:'bourbon',varietal:''};
  try { return JSON.parse(localStorage.getItem(`pourProfile.focus.${getActiveProfile()}`)) || fallback; } catch { return fallback; }
}
export function focusLabel(focus=getFocus()) { return focus.category === 'wine' ? (WINE_VARIETALS.find(v=>v.id===focus.varietal)?.label || 'All wine') : focus.category.charAt(0).toUpperCase()+focus.category.slice(1).replaceAll('_',' '); }
export function focusHtml() {
  const f=getFocus();
  return `<div class="recommendation-focus"><label>Find my next<select data-focus-category aria-label="Drink category">${['bourbon','wine','tequila','rum','scotch','rye','mezcal','gin','cognac','brandy'].map(c=>`<option value="${c}"${c===f.category?' selected':''}>${escapeHtml(c.charAt(0).toUpperCase()+c.slice(1))}</option>`).join('')}</select></label>${f.category==='wine'?`<label>Wine variety<select data-focus-varietal aria-label="Wine variety"><option value="">All wine</option>${WINE_VARIETALS.map(v=>`<option value="${v.id}"${v.id===f.varietal?' selected':''}>${escapeHtml(v.label)}</option>`).join('')}</select></label>`:''}</div>`;
}
export function wireFocus(view,refresh) {
  for (const select of view.querySelectorAll('[data-focus-category],[data-focus-varietal]')) select.addEventListener('change',()=>{
    const f=getFocus();
    if(select.hasAttribute('data-focus-category')) { f.category=select.value; f.varietal=f.category==='wine'?'sauvignon_blanc':''; }
    else f.varietal=select.value;
    localStorage.setItem(`pourProfile.focus.${getActiveProfile()}`,JSON.stringify(f)); refresh();
  });
}
