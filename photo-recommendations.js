import { api, downscaleImage, getActiveProfile } from './api.js';
import { escapeHtml, toast } from './ui.js';
import { openLogPourSheet } from './log-pour.js';
import { categoryLabel } from './spirit-taxonomy.js';
export function photoRecommendationHtml() {
  return `<section class="card photo-discover"><div class="section-title"><h2>Find your pour in a photo</h2></div>
    <p>Photograph one bottle or a store shelf. We'll compare readable bottles against your taste across all five categories.</p>
    <p class="field-hint">For best results, keep labels sharp and take closer photos of crowded shelves. Photos are sent to OpenAI for analysis and are not saved to your tasting history.</p>
    <div class="photo-actions"><button class="btn btn-primary" id="photoCameraBtn">Take a photo</button><button class="btn btn-secondary" id="photoUploadBtn">Choose photo</button></div>
    <input type="file" id="photoCamera" accept="image/jpeg,image/png,image/webp" capture="environment" hidden>
    <input type="file" id="photoUpload" accept="image/jpeg,image/png,image/webp" hidden>
    <div id="photoPreview"></div><div id="photoResults" aria-live="polite"></div></section>`;
}
export function wirePhotoRecommendations(root) {
  const camera = root.querySelector('#photoCamera'), upload = root.querySelector('#photoUpload');
  root.querySelector('#photoCameraBtn').addEventListener('click', () => camera.click());
  root.querySelector('#photoUploadBtn').addEventListener('click', () => upload.click());
  let run = 0;
  const analyze = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const mine = ++run, person = getActiveProfile();
    const results = root.querySelector('#photoResults'), preview = root.querySelector('#photoPreview');
    const buttons = [root.querySelector('#photoCameraBtn'),root.querySelector('#photoUploadBtn')];
    buttons.forEach(b => b.disabled = true);
    results.innerHTML = '<p class="field-hint">Reading labels and comparing your palate…</p>';
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo.');
      const imageDataUrl = await downscaleImage(file,2200,0.88);
      preview.innerHTML = `<img class="shelf-preview" src="${imageDataUrl}" alt="Your bottle or shelf photo">`;
      const res = await api.photoRecommendations({imageDataUrl});
      if (mine !== run || person !== getActiveProfile() || !root.isConnected) return;
      results.innerHTML = `<h3>${res.best ? `${escapeHtml(res.person)}'s closest match: ${escapeHtml(res.best)}` : 'More taste evidence or clearer labels needed'}</h3>
        <p class="field-hint">${escapeHtml(res.guidance)}</p>${res.notes ? `<p class="field-hint">${escapeHtml(res.notes)}</p>` : ''}
        ${res.bottles.length ? res.bottles.map((b,i) => `<article class="photo-result"><div class="pick-head"><h3>${escapeHtml(b.name)}</h3><span class="fit-chip">${b.fit.score == null ? 'Unscored' : `${b.fit.score}/100`}</span></div>
          <p class="field-hint">${escapeHtml(categoryLabel(b.category))} · ${escapeHtml(b.style)} · ${escapeHtml(b.location)}</p>
          <p class="field-hint">Label confidence ${Math.round(b.identity_confidence*100)}% · ${escapeHtml(b.fit.confidence)}</p>
          ${b.fit.reasons.map(r => `<p>${escapeHtml(r)}</p>`).join('')}
          ${b.fit.concerns.map(r => `<p class="pick-concern">${escapeHtml(r)}</p>`).join('')}
          <details><summary>Estimated bottle flavors</summary><p class="field-hint">${escapeHtml(b.profile_basis)}</p><p class="field-hint">${Object.entries(b.dimensions).map(([k,v]) => `${escapeHtml(k)}: ${v}/10`).join(' · ') || 'Unknown'}</p></details>
          <label class="identity-confirm"><input type="checkbox" data-confirm-photo="${i}"> I checked the label: this is the exact bottle</label>
          <button class="btn btn-secondary btn-sm" data-rate-photo="${i}" disabled>Rate this pour</button>
        </article>`).join('') : '<p>No readable bottles found. Try a closer photo.</p>'}`;
      results.querySelectorAll('[data-confirm-photo]').forEach(c => c.addEventListener('change', () => {
        results.querySelector(`[data-rate-photo="${c.dataset.confirmPhoto}"]`).disabled = !c.checked;
      }));
      results.querySelectorAll('[data-rate-photo]').forEach(button => button.addEventListener('click', async () => {
        if (person !== getActiveProfile()) return;
        const b = res.bottles[Number(button.dataset.ratePhoto)];
        button.disabled = true;
        try {
          const found = await api.bottles({q:b.name});
          let bottle = found.bottles.find(item => item.name.toLowerCase() === b.name.toLowerCase() && item.category === b.category);
          if (!bottle) {
            const created = await api.createBottle({name:b.name,category:b.category,subcategory:b.style,data_source:'photo_confirmed',status_tags:[]});
            bottle = created.bottle;
          }
          await openLogPourSheet(bottle);
        } catch (err) { toast(err.message); button.disabled = false; }
      }));
    } catch (err) {
      if (mine === run && root.isConnected) results.innerHTML = `<p class="photo-error">${escapeHtml(err.message)}</p><p class="field-hint">You can keep rating pours and try a photo again later.</p>`;
    } finally { if (mine===run) buttons.forEach(b => b.disabled=false); event.target.value=''; }
  };
  camera.addEventListener('change',analyze); upload.addEventListener('change',analyze);
}
