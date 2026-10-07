// Discover is the recommendation surface.
//
// It used to list only bottles you had already flagged "want to try", which made
// it a to-do list wearing a recommendation engine's clothes: the scored catalog —
// the entire point of the research import — was unreachable from anywhere except
// by typing a query into the Scan tab. Now the catalog leads, ranked by fit, with
// the reason attached, and your own shortlist sits below it.

import { api } from "./api.js";
import { el, escapeHtml, bottleCardHtml, emptyStateHtml, toast } from "./ui.js";
import { compareList } from "./view-bottle.js";

const state = { category: "", sort: "best_fit", mode: "picks" };

// Fit bands are named, not just numbered, because a bare percentage invites
// false precision. "No profile yet" is deliberately distinct from a low score.
function fitBand(fit) {
  if (fit == null) return { cls: "fit-unknown", label: "Not scored yet" };
  if (fit >= 85) return { cls: "fit-strong", label: "Strong match" };
  if (fit >= 72) return { cls: "fit-good", label: "Good match" };
  if (fit >= 55) return { cls: "fit-maybe", label: "Worth a pour" };
  return { cls: "fit-weak", label: "Probably not for you" };
}

function pickCardHtml(r) {
  const band = fitBand(r.jd_fit);
  const sub = [r.producer, r.subcategory].filter(Boolean).join(" · ");
  return `
    <article class="pick-card" data-catalog-id="${escapeHtml(r.id)}">
      <div class="pick-thumb">
        ${r.image_url
          ? `<img src="${escapeHtml(r.image_url)}" alt="" loading="lazy">`
          : `<span aria-hidden="true">${r.category === "sauvignon_blanc" ? "🍷" : "🥃"}</span>`}
      </div>
      <div class="pick-body">
        <div class="pick-head">
          <div>
            <div class="pick-name">${escapeHtml(r.name)}</div>
            ${sub ? `<div class="pick-sub">${escapeHtml(sub)}</div>` : ""}
          </div>
          <span class="fit-chip ${band.cls}">${r.jd_fit != null ? `${r.jd_fit}` : "—"}</span>
        </div>
        <div class="pick-band ${band.cls}">${band.label}</div>
        ${r.why ? `<p class="pick-why">${escapeHtml(r.why)}</p>` : r.summary ? `<p class="pick-why">${escapeHtml(r.summary)}</p>` : ""}
        ${r.concern ? `<p class="pick-concern">⚠ ${escapeHtml(r.concern)}</p>` : ""}
        <div class="pick-meta">
          ${r.price != null ? `<span>~$${Math.round(r.price)}</span>` : ""}
          ${r.availability ? `<span>${escapeHtml(r.availability)}</span>` : ""}
          ${r.serving ? `<span>${escapeHtml(r.serving)}</span>` : ""}
        </div>
        <div class="pick-actions">
          ${r.adopted_bottle_id
            ? `<button class="btn btn-secondary btn-sm" data-open-bottle="${r.adopted_bottle_id}">Already on your list →</button>`
            : `<button class="btn btn-primary btn-sm" data-adopt="${escapeHtml(r.id)}">+ Want to try</button>
               <button class="btn btn-secondary btn-sm" data-adopt-tried="${escapeHtml(r.id)}">I've had this</button>`}
        </div>
      </div>
    </article>`;
}

export async function renderDiscover(dispatchNav) {
  const view = el("view-discover");
  view.innerHTML = `<p class="field-hint">Finding bottles for you…</p>`;

  const [picksRes, mineRes] = await Promise.all([
    (state.mode === "picks" ? api.catalogRecommended() : api.catalogBrowse({ category: state.category, sort: state.sort, limit: 60 }))
      .catch(() => ({ results: [], categories: [] })),
    api.bottles({ status: "want_to_try", sort: "highest_match" }).catch(() => ({ bottles: [] }))
  ]);

  const picks = picksRes.results || [];
  const mine = mineRes.bottles || [];
  const categories = picksRes.categories || [];

  view.innerHTML = `
    <div class="filter-bar">
      <button class="filter-chip${state.mode === "picks" ? " active" : ""}" data-mode="picks">For you</button>
      <button class="filter-chip${state.mode === "browse" ? " active" : ""}" data-mode="browse">Browse all</button>
      <button class="filter-chip" data-action="tab-map">Map</button>
      <button class="filter-chip" data-action="tab-compare">Compare${compareList.length ? ` (${compareList.length})` : ""}</button>
    </div>

    ${state.mode === "browse" ? `
      <div class="filter-bar" id="discoverCategories">
        <button class="filter-chip${state.category === "" ? " active" : ""}" data-cat="">All</button>
        ${categories.map((c) => `<button class="filter-chip${state.category === c ? " active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c.replace(/_/g, " "))}</button>`).join("")}
      </div>
      <div class="field-row" style="margin:10px 0">
        <select id="discoverSort">
          <option value="best_fit"${state.sort === "best_fit" ? " selected" : ""}>Best match for you</option>
          <option value="available"${state.sort === "available" ? " selected" : ""}>Easiest to find</option>
          <option value="price"${state.sort === "price" ? " selected" : ""}>Cheapest first</option>
          <option value="alphabetical"${state.sort === "alphabetical" ? " selected" : ""}>A–Z</option>
        </select>
      </div>` : `
      <p class="field-hint" style="margin:2px 0 12px">Scored against your palate — what you've rated, and what you've said you dislike.${picksRes.already_have ? ` ${picksRes.already_have} more you already have ${picksRes.already_have === 1 ? "is" : "are"} hidden; they're under Browse all.` : ""}</p>`}

    ${picks.length
      ? `<div class="pick-list">${picks.map(pickCardHtml).join("")}</div>`
      : emptyStateHtml("✨", state.mode === "picks" ? "No strong picks yet" : "Nothing in this category",
          state.mode === "picks"
            ? "Log a few more pours and recommendations will sharpen up. Or tap Browse all to look through the whole catalog."
            : "Try a different category or sort order.")}

    ${mine.length ? `
      <div class="section-title"><h2>Your Shortlist</h2></div>
      <div class="bottle-grid">${mine.map(bottleCardHtml).join("")}</div>` : ""}
  `;

  wire(view, dispatchNav);
}

function wire(view, dispatchNav) {
  view.querySelector("[data-action='tab-map']").addEventListener("click", () => dispatchNav("map"));
  view.querySelector("[data-action='tab-compare']").addEventListener("click", () => dispatchNav("compare"));

  view.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => { state.mode = btn.dataset.mode; renderDiscover(dispatchNav); });
  });

  const cats = view.querySelector("#discoverCategories");
  if (cats) cats.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderDiscover(dispatchNav);
  });

  const sortSel = view.querySelector("#discoverSort");
  if (sortSel) sortSel.addEventListener("change", () => { state.sort = sortSel.value; renderDiscover(dispatchNav); });

  view.addEventListener("click", async (e) => {
    const add = e.target.closest("[data-adopt]");
    const tried = e.target.closest("[data-adopt-tried]");
    if (!add && !tried) return;
    const id = (add || tried).dataset.adopt || (add || tried).dataset.adoptTried;
    const btn = add || tried;
    btn.disabled = true;
    btn.textContent = "Adding…";
    try {
      const res = await api.catalogAdopt({ catalog_id: id, status_tags: tried ? ["tried"] : ["want_to_try"] });
      toast(tried ? "Added — log how it was" : "Added to your shortlist");
      // Landing straight on the bottle is the point when you've already had it:
      // the next thing you want is to record the pour, not scroll back.
      if (tried) dispatchNav("bottle", res.bottle_id);
      else renderDiscover(dispatchNav);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = tried ? "I've had this" : "+ Want to try";
      toast(err.message || "Couldn't add that bottle");
    }
  });
}
