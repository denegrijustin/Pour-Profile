import { rateCatalogBottle } from './catalog-actions.js';
import { getFocus, focusHtml, wireFocus } from './recommendation-focus.js';
import { photoRecommendationHtml, wirePhotoRecommendations } from "./photo-recommendations.js";
// Discover is the recommendation surface.
//
// It used to list only bottles you had already flagged "want to try", which made
// it a to-do list wearing a recommendation engine's clothes: the scored catalog —
// the entire point of the research import — was unreachable from anywhere except
// by typing a query into the Scan tab. Now the catalog leads, ranked by fit, with
// the reason attached, and your own shortlist sits below it.

import { api } from "./api.js";
import { el, escapeHtml, bottleCardHtml, bottleThumbHtml, emptyStateHtml, toast, openSheet, closeSheet, expertChipsHtml, expertNotesHtml } from "./ui.js";
import { flavorHeatmapHtml, wireFlavorHeatmap } from "./flavor-heatmap.js";
import { compareList } from "./view-bottle.js";

const state = { sort: "best_fit", mode: "picks" };
let renderSequence = 0;

// Fit bands are named, not just numbered, because a bare percentage invites
// false precision. "No profile yet" is deliberately distinct from a low score.
function fitBand(fit) {
  if (fit == null) return { cls: "fit-unknown", label: "Not scored yet" };
  if (fit >= 85) return { cls: "fit-strong", label: "Strong match" };
  if (fit >= 72) return { cls: "fit-good", label: "Good match" };
  if (fit >= 55) return { cls: "fit-maybe", label: "Worth a pour" };
  return { cls: "fit-weak", label: "Probably not for you" };
}

export function pickCardHtml(r) {
  const band = fitBand(r.jd_fit);
  const sub = [r.producer, r.subcategory].filter(Boolean).join(" · ");
  return `
    <article class="pick-card pick-card-clickable" data-catalog-id="${escapeHtml(r.id)}" data-catalog-detail="${escapeHtml(r.id)}" tabindex="0" aria-label="View details for ${escapeHtml(r.name)}">
      <div class="pick-thumb">
        ${bottleThumbHtml(r)}
      </div>
      <div class="pick-body">
        <div class="pick-head">
          <div>
            <div class="pick-name" data-catalog-detail="${escapeHtml(r.id)}" role="button" tabindex="0">${escapeHtml(r.name)}</div>
            ${sub ? `<div class="pick-sub">${escapeHtml(sub)}</div>` : ""}
          </div>
          <span class="fit-chip ${band.cls}">${r.jd_fit != null ? `${r.jd_fit}` : "—"}</span>
        </div>
        <div class="pick-band ${band.cls}">${band.label}</div>
        ${expertChipsHtml(r.expert)}
        ${r.why ? `<p class="pick-why">${escapeHtml(r.why)}</p>` : r.summary ? `<p class="pick-why">${escapeHtml(r.summary)}</p>` : ""}
        ${r.concern ? `<p class="pick-concern">⚠ ${escapeHtml(r.concern)}</p>` : ""}
        <div class="pick-meta">
          ${r.price != null ? `<span>~$${Math.round(r.price)}</span>` : ""}
          ${r.local_store ? `<span>Seen in store photos · uploaded ${escapeHtml(r.local_store.last_seen_upload)}</span>` : r.kansas ? `<span title="${escapeHtml("Kansas distributor: " + (r.kansas.distributors || []).join(", "))}">Sold in KS</span>` : r.availability ? `<span>${escapeHtml(r.availability)}</span>` : ""}
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
  const sequence = ++renderSequence;
  view.innerHTML = `<p class="field-hint">Finding bottles for you…</p>`;

  const [picksRes, mineRes] = await Promise.all([
    (state.mode === "picks" ? api.catalogRecommended(getFocus()) : api.catalogBrowse({ ...getFocus(), sort: state.sort, limit: 60, scope: "local" }))
      .catch(() => ({ results: [], categories: [] })),
    api.bottles({ status: "want_to_try", sort: "highest_match" }).catch(() => ({ bottles: [] }))
  ]);


  if (sequence !== renderSequence) return;
  const picks = picksRes.results || [];
  const mine = (mineRes.bottles || []).filter(b => b.category === getFocus().category && (!getFocus().varietal || b.varietal === getFocus().varietal));


  view.innerHTML = `
    ${focusHtml()}
    <details class="optional-flavor-map"><summary>Find bottles from a shelf photo</summary>${photoRecommendationHtml()}</details>
    <div class="filter-bar">
      <button class="filter-chip${state.mode === "picks" ? " active" : ""}" data-mode="picks">For you</button>
      <button class="filter-chip${state.mode === "browse" ? " active" : ""}" data-mode="browse">Local store</button>
      <button class="filter-chip" data-action="tab-map">Map</button>
      <button class="filter-chip" data-action="tab-compare">Compare${compareList.length ? ` (${compareList.length})` : ""}</button>
    </div>

    ${state.mode === "browse" ? `
      <div class="field-row" style="margin:10px 0">
        <select id="discoverSort">
          <option value="external_reviews"${state.sort === "external_reviews" ? " selected" : ""}>Highest external reviews</option>
          <option value="best_fit"${state.sort === "best_fit" ? " selected" : ""}>Best match for you</option>
          <option value="available"${state.sort === "available" ? " selected" : ""}>Easiest to find</option>
          <option value="price"${state.sort === "price" ? " selected" : ""}>Cheapest first</option>
          <option value="alphabetical"${state.sort === "alphabetical" ? " selected" : ""}>A–Z</option>
        </select>
      </div>` : `
      <p class="field-hint" style="margin:2px 0 12px">${picksRes.already_have ? ` ${picksRes.already_have} more you already have ${picksRes.already_have === 1 ? "is" : "are"} hidden; they're under Local store.` : ""}</p>`}

    ${picks.length
      ? `<div class="pick-list">${picks.map(pickCardHtml).join("")}</div>`
      : emptyStateHtml("✨", state.mode === "picks" ? "No strong picks yet" : "Nothing in this category",
          state.mode === "picks"
            ? "Log a few more pours and recommendations will sharpen up. Or tap Local store to look through bottles seen in your store photos."
            : "Try a different category or sort order.")}

    ${mine.length ? `
      <div class="section-title"><h2>Your Shortlist</h2></div>
      <div class="bottle-grid">${mine.map(bottleCardHtml).join("")}</div>` : ""}
  `;

  wirePhotoRecommendations(view);
  wireFocus(view, () => renderDiscover(dispatchNav));
  wire(view, dispatchNav);
}

function wire(view, dispatchNav) {
  view.querySelector("[data-action='tab-map']").addEventListener("click", () => dispatchNav("map"));
  view.querySelector("[data-action='tab-compare']").addEventListener("click", () => dispatchNav("compare"));

  view.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => { state.mode = btn.dataset.mode; renderDiscover(dispatchNav); });
  });

  const sortSel = view.querySelector("#discoverSort");
  if (sortSel) sortSel.addEventListener("change", () => { state.sort = sortSel.value; renderDiscover(dispatchNav); });

  const openDetail = (target) => openCatalogDetail(target.dataset.catalogDetail, dispatchNav);
  view.addEventListener("keydown", (e) => {
    const t = e.target.closest("[data-catalog-detail]");
    if (t && !e.target.closest("button") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDetail(t); }
  });
  view.addEventListener("click", async (e) => {
    const detail = e.target.closest("[data-catalog-detail]");
    if (detail && !e.target.closest("button, a")) { openDetail(detail); return; }
    const add = e.target.closest("[data-adopt]");
    const tried = e.target.closest("[data-adopt-tried]");
    if (!add && !tried) return;
    const id = (add || tried).dataset.adopt || (add || tried).dataset.adoptTried;
    const btn = add || tried;
    btn.disabled = true;
    btn.textContent = "Adding…";
    try {
      if (tried) { await rateCatalogBottle(id, dispatchNav); btn.disabled=false; btn.textContent="I've had this"; return; }
      await api.catalogAdopt({ catalog_id: id, status_tags: ["want_to_try"] });
      toast(tried ? "Added — log how it was" : "Added to your shortlist");
      // Landing straight on the bottle is the point when you've already had it:
      // the next thing you want is to record the pour, not scroll back.
      renderDiscover(dispatchNav);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = tried ? "I've had this" : "+ Want to try";
      toast(err.message || "Couldn't add that bottle");
    }
  });
}

export async function openCatalogDetail(id, dispatchNav) {
  openSheet(`<div class="sheet-header"><h2>Loading…</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>`);
  let data;
  try { data = await api.catalogItem(id); }
  catch (err) { toast(err.message || "Couldn't load that bottle"); closeSheet(); return; }
  const r = data.item;
  const band = fitBand(r.jd_fit);
  const sub = [r.producer, r.subcategory, r.region].filter(Boolean).join(" · ");
  const why = (r.why || "").split(/\.\s+/).filter(Boolean);
  const concerns = (r.concern || "").split(/\.\s+/).filter(Boolean);
  openSheet(`
    <div class="sheet-header"><h2>${escapeHtml(r.name)}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>
    <div class="catalog-detail-photo">${bottleThumbHtml(r)}</div>
    ${sub ? `<p class="field-hint">${escapeHtml(sub)}</p>` : ""}
    <div style="display:flex;align-items:center;gap:10px;margin:10px 0">
      <span class="fit-chip ${band.cls}">${r.jd_fit != null ? r.jd_fit : "—"}</span>
      <strong class="pick-band ${band.cls}" style="margin:0">${band.label}</strong>
    </div>
    <details class="optional-flavor-map"><summary>Explore the flavor map</summary>${flavorHeatmapHtml(data.flavor_profile)}</details>
    ${why.length || concerns.length ? `<div class="notes-match-list" style="margin-bottom:6px">
      ${why.map((w) => `<div>✓ ${escapeHtml(w.replace(/\.$/, ""))}</div>`).join("")}
      ${concerns.map((c) => `<div>⚠ ${escapeHtml(c.replace(/\.$/, ""))}</div>`).join("")}
    </div>` : ""}
    ${r.kansas ? `<p class="field-hint">Registered for sale in Kansas · orderable through ${escapeHtml((r.kansas.distributors || []).join(", ") || "a Kansas distributor")}. Ask your store if it's not on the shelf.</p>` : ""}
    <p>${escapeHtml(data.details?.summary || "")}</p>
    <dl class="spec-grid">${[["ABV",r.abv != null ? `${r.abv}%` : null],["Proof",r.proof],["Age",data.details?.age],["Mash bill",data.details?.mash_bill],["Finish",data.details?.finish],["Serving",data.details?.serving]].filter(([,v])=>v!=null && v!=="").map(([k,v])=>`<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join("")}</dl>
    ${r.local_store ? `<p class="field-hint">Seen in your store photos · uploaded ${escapeHtml(r.local_store.last_seen_upload)}</p>` : ""}
    ${data.expert ? `<details><summary>Producer notes and external reviews</summary>${expertNotesHtml(data.expert)}</details>` : `<p class="field-hint" style="margin-top:14px">No cited tasting notes found for this bottle yet.</p>`}
    <div class="pick-actions" style="margin-top:14px">
      ${r.adopted_bottle_id
        ? `<button class="btn btn-secondary btn-block" data-sheet-open-bottle="${r.adopted_bottle_id}">Open on your list →</button>`
        : `<button class="btn btn-primary btn-sm" data-sheet-adopt="want">+ Want to try</button>
           <button class="btn btn-secondary btn-sm" data-sheet-adopt="tried">I've had this</button>`}
    </div>
  `, {
    onOpen: () => {
      const sheet = document.getElementById("sheetContent");
      wireFlavorHeatmap(sheet, data.flavor_profile, id => openCatalogDetail(id, dispatchNav));
      sheet.querySelector("[data-sheet-open-bottle]")?.addEventListener("click", (e) => { closeSheet(); dispatchNav("bottle", Number(e.currentTarget.dataset.sheetOpenBottle)); });
      sheet.querySelectorAll("[data-sheet-adopt]").forEach((btn) => btn.addEventListener("click", async () => {
        const tried = btn.dataset.sheetAdopt === "tried";
        btn.disabled = true;
        try {
          if (tried) { await rateCatalogBottle(r.id, dispatchNav); return; }
          await api.catalogAdopt({ catalog_id: r.id, status_tags: ["want_to_try"] });
          closeSheet();
          toast(tried ? "Added — log how it was" : "Added to your shortlist");
          renderDiscover(dispatchNav);
        } catch (err) { btn.disabled = false; toast(err.message || "Couldn't add that bottle"); }
      }));
    }
  });
}
