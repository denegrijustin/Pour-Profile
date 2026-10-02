import { QUESTIONS, STYLES } from './pour-model.js';
import { escapeHtml } from './ui.js';
export function questionnaireHtml(category) {
  const questions = QUESTIONS[category];
  if (!questions) return '';
  return `<section class="pour-questionnaire"><h3>Your ten tasting questions</h3>
    <p class="field-hint">Describe what is in the glass, then say how much you like that characteristic. Skip anything you cannot judge.</p>
    <label for="tastingStyle">Variety / style</label><select id="tastingStyle"><option value="">Not sure</option>${STYLES[category].map(s => `<option>${escapeHtml(s)}</option>`).join('')}</select>
    ${questions.map((q,i) => `<fieldset class="tasting-question" data-question="${q.id}"><legend>${i+1}. ${escapeHtml(q.prompt)}</legend>
      <div class="field-row"><div><label for="intensity-${q.id}">Intensity</label><select id="intensity-${q.id}" data-intensity><option value="">Skip / unsure</option>${Array.from({length:11},(_,n) => `<option value="${n}">${n}${n===0 ? ` — ${escapeHtml(q.low)}` : n===10 ? ` — ${escapeHtml(q.high)}` : ''}</option>`).join('')}</select></div>
      <div><label for="enjoyment-${q.id}">Do you like this level?</label><select id="enjoyment-${q.id}" data-enjoyment><option value="">Choose</option><option value="1">1 — Dislike a lot</option><option value="2">2 — Dislike</option><option value="3">3 — Neutral</option><option value="4">4 — Like</option><option value="5">5 — Love</option></select></div></div></fieldset>`).join('')}
    <p class="field-hint" id="questionProgress">0 of 10 described</p></section>`;
}
export function readQuestionnaire(root = document) {
  const answers = {};
  for (const row of root.querySelectorAll('[data-question]')) {
    const intensity = row.querySelector('[data-intensity]').value, enjoyment = row.querySelector('[data-enjoyment]').value;
    if ((intensity === '') !== (enjoyment === '')) throw new Error('Choose both intensity and enjoyment, or skip both, for each question.');
    if (intensity !== '') answers[row.dataset.question] = { intensity:Number(intensity), enjoyment:Number(enjoyment) };
  }
  return answers;
}
export function wireQuestionnaire(root = document) {
  root.querySelector('.pour-questionnaire')?.addEventListener('change', () => {
    const rows = [...root.querySelectorAll('[data-question]')];
    const answered = rows.filter(r => r.querySelector('[data-intensity]').value !== '' && r.querySelector('[data-enjoyment]').value !== '').length;
    root.querySelector('#questionProgress').textContent = `${answered} of 10 described`;
  });
}

export function savedAnswersHtml(category, raw, style) {
  const answers = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {};
  const rows = (QUESTIONS[category] || []).filter(q => answers[q.id]);
  if (!rows.length) return '';
  return `<details class="saved-questions"><summary>${rows.length}/10 tasting questions${style ? ` · ${escapeHtml(style)}` : ''}</summary>${rows.map(q => `<p class="field-hint">${escapeHtml(q.prompt)}<br>Intensity ${answers[q.id].intensity}/10 · enjoyment ${answers[q.id].enjoyment}/5</p>`).join('')}</details>`;
}
