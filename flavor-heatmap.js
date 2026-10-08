import { AXIS_LABELS, QUESTIONS } from './pour-model.js';
const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 10;
export function flavorHeatmapHtml(profile = {}) {
 const {dimensions = {}, targets = {}, descriptors = [], basis = 'unknown', confidence = 'unknown', rationale = null, low_confidence_axes = []} = profile || {};
 const axes = [...new Set([...Object.keys(dimensions),...Object.keys(targets),...descriptors.flatMap(d=>d.axes)])].filter(a=>AXIS_LABELS[a] && (Object.keys(dimensions).length < 10 || a in dimensions));
 if (!axes.length) return '<p class="field-hint">Flavor profile pending research. Rate liked bottles to learn your ideal flavor levels.</p>';
 return `<section class="flavor-map"><h3>Flavor heat map</h3><p class="field-hint">Low → high intensity (0–10). ● Bottle &nbsp; ◆ Your ideal, learned from bottles you liked or loved. Unknown intensity stays unplotted.</p>
 ${axes.map(axis=>{
  const value=valid(dimensions[axis]) ? Math.round(dimensions[axis]*10)/10 : null, ideal=targets[axis]?.target;
  const terms=descriptors.filter(d=>d.axes.includes(axis)).map(d=>d.term);
  const title=`${AXIS_LABELS[axis]}: bottle ${valid(value)?value+'/10':'intensity unknown'}; your ideal ${valid(ideal)?ideal+'/10':'not learned yet'}`;
  return `<div class="flavor-map-row"><strong>${esc(AXIS_LABELS[axis])}</strong><div class="flavor-scale" role="img" aria-label="${esc(title)}">${Array.from({length:11},(_,i)=>`<span style="background:hsl(${45+i*10} 38% ${92-i*4}%)"></span>`).join('')}${valid(value)?`<b class="flavor-marker bottle-marker" style="left:${4.55+value*9.09}%" title="Bottle: ${value}/10">●</b>`:''}${valid(ideal)?`<b class="flavor-marker ideal-marker" style="left:${4.55+ideal*9.09}%" title="Your ideal: ${ideal}/10 · ${targets[axis].samples} enjoyed pours">◆</b>`:''}</div><small>${valid(value)?`Bottle ${value}/10`:'Bottle intensity unknown'} · ${valid(ideal)?`Ideal ${ideal}/10`:'Ideal not learned yet'}${terms.length?`<br>${esc(terms.join(', '))}`:''}</small></div>`;
 }).join('')}
 ${rationale ? `<p class="field-hint">${esc(rationale)}</p>` : ''}
 <p class="field-hint">Profile confidence: ${esc(confidence)}. ${low_confidence_axes.length ? `Lower-confidence axes: ${esc(low_confidence_axes.map(a=>AXIS_LABELS[a] || a).join(', '))}.` : ''} Bottle intensity basis: ${esc(basis.replaceAll('_',' '))}. Cited descriptors identify flavors, not measured intensity. All synthesized values are estimates, not reviewer-assigned scores. Your ideal is an estimate that improves with your ratings.</p></section>`;
}
