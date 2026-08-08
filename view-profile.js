import { api } from "./api.js";
import { el, escapeHtml } from "./ui.js";
import { titleize } from "./spirit-taxonomy.js";

export async function renderProfile() {
  const view = el("view-profile");
  view.innerHTML = `<p class="field-hint">Building your palate profile…</p>`;
  const [palateRes, statsRes] = await Promise.all([api.palate().catch(() => null), api.stats().catch(() => null)]);

  const barRow = ([tag, v], positive) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
        <span>${escapeHtml(titleize(tag))}</span>
        <span style="color:var(--charcoal-soft)">${v.affinity}% · ${v.confidence} confidence</span>
      </div>
      <div style="height:8px;border-radius:999px;background:var(--paper-sunk);overflow:hidden">
        <div style="height:100%;width:${v.affinity}%;background:${positive ? "linear-gradient(90deg,var(--amber),var(--amber-deep))" : "var(--negative)"}"></div>
      </div>
    </div>`;

  view.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:2px">Your Palate</h2>
      <p class="field-hint">Learned from your tastings, ratings, and status tags — every number here traces back to something you actually logged.</p>
    </div>

    ${palateRes && palateRes.topPositive?.length ? `
    <div class="section-title"><h2>Strongest Positive Signals</h2></div>
    <div class="card">${palateRes.topPositive.map((e) => barRow(e, true)).join("")}</div>` : ""}

    ${palateRes && palateRes.topNegative?.length ? `
    <div class="section-title"><h2>Strongest Negative Signals</h2></div>
    <div class="card">${palateRes.topNegative.map((e) => barRow(e, false)).join("")}</div>` : ""}

    ${!palateRes || (!palateRes.topPositive?.length && !palateRes.topNegative?.length) ? `<div class="card"><p class="field-hint">Log a few pours and your flavor affinities will start showing up here, each with a confidence level based on how many tastings back it up.</p></div>` : ""}

    ${statsRes ? `
    <div class="section-title"><h2>Statistics</h2></div>
    <div class="card">
      <div class="spec-grid">
        <div><dt>Bottles</dt><dd>${statsRes.bottleCount}</dd></div>
        <div><dt>Tastings Rated</dt><dd>${statsRes.tastingCount}</dd></div>
        <div><dt>Distilleries</dt><dd>${statsRes.distilleryCount}</dd></div>
        <div><dt>States</dt><dd>${statsRes.stateCount}</dd></div>
        <div><dt>Countries</dt><dd>${statsRes.countryCount}</dd></div>
      </div>
    </div>` : ""}

    <div class="section-title"><h2>Your Data</h2></div>
    <div class="card">
      <p class="field-hint">Your data always stays exportable — you're never locked in.</p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <a class="btn btn-secondary btn-sm" href="/api/export.json" download="pour-profile-export.json">Export JSON</a>
        <a class="btn btn-secondary btn-sm" href="/api/export.csv" download="pour-profile-export.csv">Export CSV</a>
      </div>
    </div>
  `;
}
