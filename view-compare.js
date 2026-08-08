import { api } from "./api.js";
import { el, escapeHtml, formatMoney, emptyStateHtml } from "./ui.js";
import { categoryLabel, titleize } from "./spirit-taxonomy.js";
import { compareList, removeFromCompare, clearCompare } from "./view-bottle.js";

export async function renderCompare(dispatchNav) {
  const view = el("view-compare");
  if (!compareList.length) {
    view.innerHTML = emptyStateHtml("⇄", "No bottles to compare", "Open a bottle and tap the ⇄ button to add up to 4 for comparison.");
    return;
  }
  view.innerHTML = `<p class="field-hint">Loading comparison…</p>`;
  const details = await Promise.all(compareList.map((id) => api.bottle(id).catch(() => null)));
  const valid = details.filter(Boolean);

  const rows = [
    ["Match", (d) => `${d.match?.matchPercent ?? "—"}%`],
    ["My Rating", (d) => d.bottle.avg_rating != null ? d.bottle.avg_rating.toFixed(1) : "—"],
    ["Category", (d) => categoryLabel(d.bottle.category)],
    ["Proof", (d) => d.bottle.proof ?? "—"],
    ["Age", (d) => d.bottle.age_statement || "—"],
    ["Finish", (d) => d.bottle.barrel_finish || "—"],
    ["Mash Bill", (d) => d.bottle.mash_bill || "—"],
    ["MSRP", (d) => formatMoney(d.bottle.msrp) || "—"],
    ["Dominant Flavors", (d) => (d.bottle.flavor_tags || []).slice(0, 4).map(titleize).join(", ") || "—"],
    ["Concerns", (d) => (d.match?.possibleConcerns || []).map((c) => titleize(c.tag)).join(", ") || "None flagged"]
  ];

  const best = valid.reduce((a, b) => (b.match?.matchPercent ?? 0) > (a.match?.matchPercent ?? 0) ? b : a, valid[0]);

  view.innerHTML = `
    <p class="field-hint">Comparing which bottle fits your palate best.</p>
    ${best ? `<div class="card insight-card"><strong>${escapeHtml(best.bottle.name)}</strong> is the closest fit at ${best.match?.matchPercent ?? "—"}% predicted match.</div>` : ""}
    <div class="compare-scroll">
      <table class="compare-table">
        <thead><tr><th></th>${valid.map((d) => `<th>${escapeHtml(d.bottle.name)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map(([label, fn]) => `<tr><th>${escapeHtml(label)}</th>${valid.map((d) => `<td>${escapeHtml(String(fn(d)))}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
      ${valid.map((d) => `<button class="btn btn-secondary btn-sm" data-remove="${d.bottle.id}">Remove ${escapeHtml(d.bottle.name)}</button>`).join("")}
    </div>
    <button class="btn btn-ghost" id="clearCompareBtn" style="margin-top:10px">Clear comparison</button>
  `;

  view.querySelectorAll("[data-remove]").forEach((btn) => btn.addEventListener("click", () => { removeFromCompare(Number(btn.dataset.remove)); renderCompare(dispatchNav); }));
  document.getElementById("clearCompareBtn").addEventListener("click", () => { clearCompare(); renderCompare(dispatchNav); });
}
