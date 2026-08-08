import { api } from "./api.js";
import { el, escapeHtml, bottleCardHtml, emptyStateHtml } from "./ui.js";
import { compareList } from "./view-bottle.js";

export async function renderDiscover(dispatchNav) {
  const view = el("view-discover");
  view.innerHTML = `<p class="field-hint">Loading recommendations…</p>`;
  const res = await api.bottles({ status: "want_to_try", sort: "highest_match" }).catch(() => ({ bottles: [] }));
  const wantToTry = res.bottles || [];

  const groups = { highest: [], experiment: [], benchmark: [], other: [] };
  for (const b of wantToTry) {
    const p = b.category_attrs?.discovery_priority;
    (groups[p] || groups.other).push(b);
  }

  view.innerHTML = `
    <div class="filter-bar">
      <button class="filter-chip active" data-action="tab-list">List</button>
      <button class="filter-chip" data-action="tab-map">Map</button>
      <button class="filter-chip" data-action="tab-compare">Compare${compareList.length ? ` (${compareList.length})` : ""}</button>
    </div>

    ${groups.highest.length ? `<div class="section-title"><h2>Highest Priority</h2></div><div class="bottle-grid">${groups.highest.map(bottleCardHtml).join("")}</div>` : ""}
    ${groups.experiment.length ? `<div class="section-title"><h2>Profile Experiments</h2></div><div class="bottle-grid">${groups.experiment.map(bottleCardHtml).join("")}</div>` : ""}
    ${groups.benchmark.length ? `<div class="section-title"><h2>Future Benchmarks</h2></div><div class="bottle-grid">${groups.benchmark.map(bottleCardHtml).join("")}</div>` : ""}
    ${groups.other.length ? `<div class="section-title"><h2>Also Want to Try</h2></div><div class="bottle-grid">${groups.other.map(bottleCardHtml).join("")}</div>` : ""}
    ${!wantToTry.length ? emptyStateHtml("✨", "Your discovery queue is empty", "Mark bottles Want to Try from My Spirits and they'll be ranked here by predicted match.") : ""}
  `;

  view.querySelector("[data-action='tab-map']").addEventListener("click", () => dispatchNav("map"));
  view.querySelector("[data-action='tab-compare']").addEventListener("click", () => dispatchNav("compare"));
}
