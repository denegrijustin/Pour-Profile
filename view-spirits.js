import { api } from "./api.js";
import { el, bottleCardHtml, emptyStateHtml } from "./ui.js";
import { CATEGORIES, STATUS_TAGS } from "./spirit-taxonomy.js";
import { openBottlePickerSheet } from "./log-pour.js";

const state = { category: "", status: "", q: "", sort: "newest" };

export async function renderSpirits() {
  const view = el("view-spirits");
  view.innerHTML = `
    <div class="search-bar">
      <input type="search" id="spiritsSearch" placeholder="Search your spirits…" value="${state.q}">
    </div>
    <div class="filter-bar" id="spiritsCategoryFilter">
      <button class="filter-chip${state.category === "" ? " active" : ""}" data-cat="">All</button>
      ${CATEGORIES.map((c) => `<button class="filter-chip${state.category === c.id ? " active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
    </div>
    <div class="filter-bar" id="spiritsStatusFilter">
      <button class="filter-chip${state.status === "" ? " active" : ""}" data-status="">Any status</button>
      ${STATUS_TAGS.map((s) => `<button class="filter-chip${state.status === s.id ? " active" : ""}" data-status="${s.id}">${s.label}</button>`).join("")}
    </div>
    <div class="field-row" style="margin:10px 0">
      <select id="spiritsSort">
        <option value="newest">Newest</option>
        <option value="alphabetical">Alphabetical</option>
        <option value="highest_rated">Highest Rated</option>
        <option value="highest_match">Highest Match</option>
        <option value="proof">Proof</option>
      </select>
      <button class="btn btn-secondary" id="spiritsAddBtn" type="button">+ Add</button>
    </div>
    <div id="spiritsResults"><p class="field-hint">Loading…</p></div>
  `;
  document.getElementById("spiritsSort").value = state.sort;
  await loadResults();
  wire();
}

async function loadResults() {
  const results = el("spiritsResults");
  const params = {};
  if (state.category) params.category = state.category;
  if (state.status) params.status = state.status;
  if (state.q) params.q = state.q;
  params.sort = state.sort;
  const res = await api.bottles(params);
  const bottles = res.bottles || [];
  results.innerHTML = bottles.length
    ? `<div class="bottle-grid">${bottles.map(bottleCardHtml).join("")}</div>`
    : emptyStateHtml("🔍", "No bottles match", "Try a different filter, or add a new bottle.");
}

function wire() {
  document.getElementById("spiritsSearch").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    debounceLoad();
  });
  document.getElementById("spiritsCategoryFilter").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    document.querySelectorAll("#spiritsCategoryFilter .filter-chip").forEach((b) => b.classList.toggle("active", b === btn));
    loadResults();
  });
  document.getElementById("spiritsStatusFilter").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    state.status = btn.dataset.status;
    document.querySelectorAll("#spiritsStatusFilter .filter-chip").forEach((b) => b.classList.toggle("active", b === btn));
    loadResults();
  });
  document.getElementById("spiritsSort").addEventListener("change", (e) => { state.sort = e.target.value; loadResults(); });
  document.getElementById("spiritsAddBtn").addEventListener("click", () => openBottlePickerSheet());
}

let debounceTimer;
function debounceLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(loadResults, 250); }
