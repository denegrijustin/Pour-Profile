import { api, downscaleImage } from "./api.js";
import {
  el, escapeHtml, formatRating, formatDate, formatMoney, statusPillsHtml, matchBadgeHtml,
  decisionBannerHtml, whyConcernsHtml, openSheet, closeSheet, toast, flavorTagPickerHtml
} from "./ui.js";
import { CATEGORIES, STATUS_TAGS, categoryLabel, titleize } from "./spirit-taxonomy.js";
import { openLogPourSheet } from "./log-pour.js";
import { varietalSelectHtml, dimensionSlidersHtml, wireDimensionSliders } from "./wine-form.js";
import { sourcesFor, sourceLabel, sourceScale } from "./rating-sources.js";

let currentBottleId = null;
let currentDispatchNav = () => {};
export let compareList = JSON.parse(sessionStorage.getItem("pourProfile.compare") || "[]");

function saveCompareList() { sessionStorage.setItem("pourProfile.compare", JSON.stringify(compareList)); }

export async function renderBottleDetail(id, dispatchNav) {
  currentBottleId = id;
  if (dispatchNav) currentDispatchNav = dispatchNav;
  const view = el("view-bottle");
  view.innerHTML = `<p class="field-hint">Loading bottle…</p>`;
  let data;
  try { data = await api.bottle(id); } catch (err) { view.innerHTML = `<p>Couldn't load this bottle: ${escapeHtml(err.message)}</p>`; return; }
  const { bottle, tastings, match } = data;
  const external = await api.externalRatings(id).then((r) => r.external_ratings || []).catch(() => []);

  const isWine = bottle.category === "wine";
  // Wine and spirits don't share meaningful specs — don't show mash bill for a
  // Sauvignon Blanc or a varietal for a bourbon.
  const specs = isWine ? [
    ["Category", "Wine"],
    ["Varietal", bottle.varietal ? titleize(bottle.varietal) : "Unknown"],
    ["Vintage", bottle.vintage ?? "Non-vintage / unknown"],
    ["Producer", bottle.brand || "Unknown"],
    ["Region", [bottle.appellation, bottle.origin_state, bottle.origin_country].filter(Boolean).join(", ") || "Unknown"],
    ["ABV", bottle.abv ? `${bottle.abv}%` : "Unknown"],
    ["Price", formatMoney(bottle.msrp) || "Unknown"]
  ] : [
    ["Category", categoryLabel(bottle.category)],
    ["Proof / ABV", bottle.proof ? `${bottle.proof} proof${bottle.abv ? ` / ${bottle.abv}% ABV` : ""}` : "Unknown"],
    ["Distillery", bottle.distillery_name || "Unknown"],
    ["Origin", [bottle.distillery_city, bottle.distillery_state, bottle.distillery_country].filter(Boolean).join(", ") || "Unknown"],
    ["Age", bottle.age_statement || "NAS / unknown"],
    ["Finish", bottle.barrel_finish || "—"],
    ["Mash Bill", bottle.mash_bill || "Unknown"],
    ["MSRP", formatMoney(bottle.msrp) || "Unknown"]
  ];

  const sourcedNote = bottle.is_sourced_whiskey
    ? `<p class="field-hint">⚠ This producer is known to source whiskey — the distillery listed may not reflect where it was actually distilled. Confidence: ${escapeHtml(bottle.distillery_confidence || "unknown")}.</p>`
    : "";

  const tastingsHtml = tastings.length
    ? tastings.map((t) => `
      <div class="timeline-item">
        <div class="td-rating">${t.rating != null ? formatRating(t.rating) : "—"}</div>
        <div class="td-body">
          <div class="td-meta">${formatDate(t.tasted_at)}${t.venue_name ? ` · ${escapeHtml(t.venue_name)}` : ""}${t.serving_style ? ` · ${escapeHtml(titleize(t.serving_style))}` : ""}</div>
          ${t.notes ? `<p style="margin:4px 0">${escapeHtml(t.notes)}</p>` : ""}
          ${t.flavor_tags && t.flavor_tags.length ? `<div class="tag-cloud" style="margin-top:4px">${t.flavor_tags.map((f) => `<span class="tag-chip" style="cursor:default">${escapeHtml(titleize(f))}</span>`).join("")}</div>` : ""}
        </div>
      </div>`).join("")
    : `<p class="field-hint">No tastings logged yet.</p>`;

  const personalScore = isWine ? (data.wineMatch ? data.wineMatch.score : null) : (match ? match.matchPercent : null);

  const flavorCounts = {};
  for (const t of tastings) for (const f of (t.flavor_tags || [])) flavorCounts[f] = (flavorCounts[f] || 0) + 1;
  const flavorExperience = Object.entries(flavorCounts).sort((a, b) => b[1] - a[1]);

  view.innerHTML = `
    <button class="btn-ghost" data-action="back" style="padding-left:0">← Back</button>
    <div class="hero-photo">
      ${bottle.image_url
        ? `<img src="${escapeHtml(bottle.image_url)}" alt="${escapeHtml(bottle.name)}">`
        : `<div class="hero-photo-empty"><span style="font-size:46px" aria-hidden="true">${bottle.category === "wine" ? "🍷" : "🥃"}</span><span class="field-hint">No photo yet</span></div>`}
      <button class="hero-photo-btn" data-action="photo" type="button">${bottle.image_url ? "Change photo" : "📷 Add photo"}</button>
    </div>
    <input type="file" id="bottlePhotoInput" accept="image/*" capture="environment" hidden>
    ${bottle.image_source ? `<p class="field-hint">Image source: ${escapeHtml(titleize(bottle.image_source))}${bottle.image_confidence ? ` (${escapeHtml(bottle.image_confidence)} confidence)` : ""}</p>` : ""}
    <h1>${escapeHtml(bottle.name)}</h1>
    <p class="field-hint">${escapeHtml([bottle.brand, bottle.expression].filter(Boolean).join(" · "))}</p>
    <div class="status-pills" style="margin:10px 0">${statusPillsHtml(bottle.status_tags)}</div>

    <div style="display:flex;align-items:center;gap:16px;margin:14px 0">
      ${matchBadgeHtml(match?.matchPercent)}
      <div>
        <div class="rating-display">${bottle.avg_rating != null ? formatRating(bottle.avg_rating) : "—"}<span style="font-size:13px;color:var(--charcoal-soft);font-weight:400"> / 10 avg</span></div>
        <div class="field-hint">${bottle.tasting_count || 0} tasting${bottle.tasting_count === 1 ? "" : "s"} logged</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button class="btn btn-primary" data-action="log-pour" style="flex:1">Log a Pour</button>
      <button class="btn btn-secondary" data-action="edit-bottle">Edit</button>
      <button class="btn btn-secondary" data-action="add-compare">⇄</button>
    </div>

    ${isWine ? wineMatchHtml(data.wineMatch) : `${decisionBannerHtml(match)}${whyConcernsHtml(match)}${sourcedNote}`}

    <div class="section-title"><h2>Details</h2></div>
    <div class="card"><dl class="spec-grid">${specs.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join("")}</dl></div>
    ${bottle.description ? `<div class="card"><strong>Notes on this bottle</strong><p style="margin-top:6px">${escapeHtml(bottle.description)}</p></div>` : ""}

    <div class="section-title"><h2>Outside Opinion</h2><span class="link" data-action="add-external">+ Add</span></div>
    <div class="card">
      ${external.length ? external.map((r) => `
        <div class="ext-rating">
          <div>
            <strong>${escapeHtml(sourceLabel(r.source))}</strong>
            ${r.score != null ? `<span class="ext-score">${r.score}<span style="font-weight:500;font-size:12px">/${escapeHtml(r.scale)}</span></span>` : ""}
            ${descriptorChips(r)}
          </div>
          <button class="btn-ghost btn-sm" data-del-external="${r.id}" aria-label="Remove">✕</button>
        </div>`).join("") : `<p class="field-hint">Nothing recorded. If you see a score on a shelf talker or in another app, add it here — it stays separate from your palate score and never influences it.</p>`}
      ${external.length && personalScore != null ? `<p class="field-hint" style="margin-top:10px">${escapeHtml(contrastLine(external, personalScore))}</p>` : ""}
    </div>

    <div class="section-title"><h2>My Tastings</h2></div>
    <div class="card">${tastingsHtml}</div>

    ${flavorExperience.length ? `
    <div class="section-title"><h2>My Flavor Experience</h2></div>
    <div class="card"><div class="tag-cloud">${flavorExperience.map(([f, n]) => `<span class="tag-chip" style="cursor:default">${escapeHtml(titleize(f))} × ${n}</span>`).join("")}</div></div>` : ""}
  `;

  wireBottleDetail(bottle);
}

function descriptorChips(r) {
  let d = r.descriptors;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = {}; } }
  if (!d) return "";
  const items = [];
  if (d.dimensions) for (const [k, v] of Object.entries(d.dimensions)) items.push(`${titleize(k)} ${v}/10`);
  if (Array.isArray(d.flavor_tags)) for (const t of d.flavor_tags) items.push(titleize(t));
  if (!items.length) return "";
  return `<div class="tag-cloud" style="margin-top:6px">${items.map((i) => `<span class="tag-chip" style="cursor:default;font-size:11.5px">${escapeHtml(i)}</span>`).join("")}</div>`;
}

// The point of showing both numbers is the gap between them.
// Scales are normalized to a percentage, which is only safe because the scale
// comes from the source definition rather than from typed input.
function contrastLine(external, personalScore) {
  const scored = external.filter((r) => r.score != null && Number(r.scale) > 0);
  if (!scored.length || personalScore == null) return "";
  const pct = scored.map((r) => (Number(r.score) / Number(r.scale)) * 100);
  const avg = Math.round(pct.reduce((a, v) => a + v, 0) / pct.length);
  const gap = personalScore - avg;
  const basis = scored.length === 1
    ? sourceLabel(scored[0].source)
    : `${scored.length} sources`;
  if (Math.abs(gap) < 10) return `${basis} average ${avg}%; your palate says ${personalScore}. Broad agreement.`;
  return gap > 0
    ? `${basis} average ${avg}%, but your palate says ${personalScore} — you may like this more than the consensus does.`
    : `${basis} average ${avg}%, but your palate says ${personalScore} — well reviewed, yet not obviously your style.`;
}

function wineMatchHtml(wm) {
  if (!wm) return "";
  const tone = wm.band.tone === "buy" ? "buy" : wm.band.tone === "try" ? "try" : wm.band.tone === "skip" ? "skip" : "";
  const head = wm.score == null
    ? `<div class="decision-banner"><span>${escapeHtml(wm.band.label)}</span></div>`
    : `<div class="decision-banner ${tone}"><span>${wm.score}/100 — ${escapeHtml(wm.band.label)}</span><span style="font-size:12px;font-weight:600;opacity:0.75">${escapeHtml(wm.confidenceLabel)} confidence</span></div>`;

  const sub = wm.subscores || {};
  const subRows = [
    ["Fruit", sub.fruit], ["Acidity", sub.acidity], ["Body", sub.body],
    ["Green/herbal risk", sub.greenHerbalRisk], ["Similarity to favorites", sub.similarityToFavorites]
  ].filter(([, v]) => v != null);

  return `
    ${head}
    <p class="field-hint" style="margin-top:8px">${escapeHtml(wm.band.blurb)}</p>
    ${subRows.length ? `<div class="card" style="margin-top:10px"><dl class="spec-grid">
      ${subRows.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${v}/10</dd></div>`).join("")}
    </dl></div>` : ""}
    ${wm.stretches && wm.stretches.length ? `<div style="font-size:13.5px;display:flex;flex-direction:column;gap:4px;margin-top:6px">
      ${wm.stretches.map((d) => `<div>⚠ Expect ${escapeHtml(d.direction)} ${escapeHtml(titleize(d.dimension).toLowerCase())} than your usual (${d.actual} vs ${d.target})</div>`).join("")}
    </div>` : ""}
    ${wm.fits && wm.fits.length ? `<div style="font-size:13.5px;display:flex;flex-direction:column;gap:4px;margin-top:4px">
      ${wm.fits.slice(0, 4).map((d) => `<div>✓ ${escapeHtml(titleize(d.dimension))} right in your range</div>`).join("")}
    </div>` : ""}
  `;
}

function wireBottleDetail(bottle) {
  const view = el("view-bottle");
  view.querySelector("[data-action='back']").addEventListener("click", () => currentDispatchNav("spirits"));

  const photoInput = view.querySelector("#bottlePhotoInput");
  view.querySelector("[data-action='photo']").addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    toast("Processing photo…");
    try {
      const dataUrl = await downscaleImage(file);
      await api.putBottlePhoto(bottle.id, dataUrl);
      toast("Photo saved.");
      renderBottleDetail(bottle.id, currentDispatchNav);
    } catch (err) {
      toast(`Couldn't save photo: ${err.message}`);
    }
  });
  const addExt = view.querySelector("[data-action='add-external']");
  if (addExt) addExt.addEventListener("click", () => openExternalRatingSheet(bottle));
  view.querySelectorAll("[data-del-external]").forEach((btn) => btn.addEventListener("click", async () => {
    await api.deleteExternalRating(Number(btn.dataset.delExternal));
    toast("Removed.");
    renderBottleDetail(bottle.id, currentDispatchNav);
  }));
  view.querySelector("[data-action='log-pour']").addEventListener("click", () => openLogPourSheet(bottle));
  view.querySelector("[data-action='edit-bottle']").addEventListener("click", () => openEditSheet(bottle));
  view.querySelector("[data-action='add-compare']").addEventListener("click", () => {
    if (compareList.includes(bottle.id)) { toast("Already in comparison."); return; }
    if (compareList.length >= 4) { toast("Compare up to 4 bottles at a time."); return; }
    compareList.push(bottle.id);
    saveCompareList();
    toast(`Added to comparison (${compareList.length}/4). Open Compare from Discover.`);
  });
}

function openEditSheet(bottle) {
  openSheet(`
    <div class="sheet-header"><h2>Edit Bottle</h2><button class="icon-btn" data-action="close-sheet">✕</button></div>
    <label>Name</label><input type="text" id="editName" value="${escapeHtml(bottle.name)}">
    <label>Brand</label><input type="text" id="editBrand" value="${escapeHtml(bottle.brand || "")}">
    <label>Category</label>
    <select id="editCategory">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === bottle.category ? "selected" : ""}>${c.label}</option>`).join("")}</select>
    <div class="field-row">
      <div><label>Proof</label><input type="number" step="0.1" id="editProof" value="${bottle.proof ?? ""}"></div>
      <div><label>MSRP</label><input type="number" step="0.01" id="editMsrp" value="${bottle.msrp ?? ""}"></div>
    </div>
    <label>Status</label>
    <div class="tag-cloud" id="editStatusTags">
      ${STATUS_TAGS.map((s) => `<button type="button" class="tag-chip${(bottle.status_tags || []).includes(s.id) ? " selected" : ""}" data-toggle-status="${s.id}">${s.label}</button>`).join("")}
    </div>
    ${bottle.category === "wine" ? `
      <label>Varietal</label>
      ${varietalSelectHtml("editVarietal", bottle.varietal)}
      <label>Vintage</label>
      <input type="number" id="editVintage" value="${bottle.vintage ?? ""}" placeholder="e.g. 2023">
      <label style="margin-top:16px">Wine character</label>
      <p class="field-hint">These 0-10 values are what the palate model scores against. Leave anything you're unsure of unset.</p>
      <div id="editWineDims">${dimensionSlidersHtml(bottle.wine_dimensions || {})}</div>
    ` : ""}
    <label>Description</label><textarea id="editDescription">${escapeHtml(bottle.description || "")}</textarea>
    <label>Image URL</label>
    <input type="text" id="editImageUrl" value="${escapeHtml(bottle.image_url || "")}" placeholder="https://… (or use Add photo on the bottle page)">
    <p class="field-hint">Paste an official producer image URL, or take your own photo from the bottle page. Your own photo always wins.</p>
    ${bottle.image_url ? `<button class="btn btn-secondary btn-sm" id="editRemovePhotoBtn" style="margin-top:8px">Remove image</button>` : ""}
    <button class="btn btn-primary btn-block" id="editSaveBtn" style="margin-top:16px">Save Changes</button>
    <button class="btn btn-danger btn-block" id="editDeleteBtn" style="margin-top:8px">Delete Bottle</button>
  `, {
    onOpen: () => {
      let statusTags = [...(bottle.status_tags || [])];
      const editWineDims = document.getElementById("editWineDims") ? wireDimensionSliders(document) : null;
      document.getElementById("editStatusTags").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-toggle-status]");
        if (!btn) return;
        const s = btn.dataset.toggleStatus;
        statusTags = statusTags.includes(s) ? statusTags.filter((x) => x !== s) : [...statusTags, s];
        btn.classList.toggle("selected");
      });
      const removeBtn = document.getElementById("editRemovePhotoBtn");
      if (removeBtn) removeBtn.addEventListener("click", async () => {
        try {
          await api.deleteBottlePhoto(bottle.id);
          closeSheet();
          toast("Image removed.");
          renderBottleDetail(bottle.id, currentDispatchNav);
        } catch (err) { toast(`Couldn't remove: ${err.message}`); }
      });

      document.getElementById("editSaveBtn").addEventListener("click", async () => {
        const imageUrl = document.getElementById("editImageUrl").value.trim();
        const payload = {
          name: document.getElementById("editName").value.trim(),
          brand: document.getElementById("editBrand").value.trim() || null,
          category: document.getElementById("editCategory").value,
          proof: document.getElementById("editProof").value ? Number(document.getElementById("editProof").value) : null,
          msrp: document.getElementById("editMsrp").value ? Number(document.getElementById("editMsrp").value) : null,
          description: document.getElementById("editDescription").value.trim() || null,
          status_tags: statusTags
        };
        if (bottle.category === "wine") {
          payload.varietal = document.getElementById("editVarietal").value || null;
          const vintage = document.getElementById("editVintage").value;
          payload.vintage = vintage ? Number(vintage) : null;
          payload.wine_dimensions = editWineDims ? editWineDims.get() : {};
        }
        // Only touch image fields if the URL actually changed, so a user photo
        // saved from the bottle page isn't clobbered by an untouched form field.
        if (imageUrl !== (bottle.image_url || "")) {
          payload.image_url = imageUrl || null;
          payload.image_source = imageUrl ? "manual_url" : null;
          payload.image_confidence = imageUrl ? "medium" : null;
        }
        try {
          await api.updateBottle(bottle.id, payload);
          closeSheet();
          toast("Bottle updated.");
          renderBottleDetail(bottle.id, currentDispatchNav);
        } catch (err) { toast(`Couldn't save: ${err.message}`); }
      });
      document.getElementById("editDeleteBtn").addEventListener("click", async () => {
        if (!confirm(`Delete ${bottle.name}? This removes all its tastings too.`)) return;
        await api.deleteBottle(bottle.id);
        closeSheet();
        toast("Bottle deleted.");
        document.dispatchEvent(new CustomEvent("pourprofile:navigate", { detail: { view: "spirits" } }));
      });
    }
  });
}

export function removeFromCompare(id) {
  compareList = compareList.filter((x) => x !== id);
  saveCompareList();
}
export function clearCompare() { compareList = []; saveCompareList(); }


function openExternalRatingSheet(bottle) {
  const isWine = bottle.category === "wine";
  const sources = sourcesFor(bottle.category);
  openSheet(`
    <div class="sheet-header"><h2>Outside Opinion</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>
    <p class="field-hint">All structured — no free text, so it stays comparable and can feed scoring.</p>

    <label>Source</label>
    <select id="extSource">
      ${sources.map((sc) => `<option value="${sc.id}" data-scale="${sc.scale}">${escapeHtml(sc.label)}</option>`).join("")}
    </select>

    <label>Score <span class="field-hint" id="extScaleHint"></span></label>
    <input type="number" step="0.1" id="extScore" inputmode="decimal" placeholder="Leave blank if none shown">

    <label style="margin-top:16px">What they said it tastes like</label>
    <p class="field-hint">Pick only what the source actually states. These describe the bottle, so they help score it before you've tried it — they never change your palate.</p>
    ${isWine
      ? `<div id="extWineDims">${dimensionSlidersHtml({})}</div>`
      : `<div id="extFlavorTags"></div>`}

    <button class="btn btn-primary btn-block" id="extSaveBtn" style="margin-top:16px">Save</button>
  `, {
    onOpen: async () => {
      const sourceSel = document.getElementById("extSource");
      const hint = document.getElementById("extScaleHint");
      const scoreInput = document.getElementById("extScore");
      const syncScale = () => {
        const scale = sourceSel.selectedOptions[0].dataset.scale;
        hint.textContent = `(out of ${scale})`;
        scoreInput.max = scale;
        scoreInput.placeholder = `0–${scale}, or leave blank`;
      };
      sourceSel.addEventListener("change", syncScale);
      syncScale();

      let dims = null;
      let selectedTags = [];
      if (isWine) {
        dims = wireDimensionSliders(document);
      } else {
        const res = await api.flavorTags().catch(() => ({ flavor_tags: [] }));
        const host = document.getElementById("extFlavorTags");
        host.innerHTML = flavorTagPickerHtml(res.flavor_tags || [], []);
        host.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-toggle-tag]");
          if (!btn) return;
          const tag = btn.dataset.toggleTag;
          selectedTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
          btn.classList.toggle("selected");
        });
      }

      document.getElementById("extSaveBtn").addEventListener("click", async () => {
        const scoreRaw = scoreInput.value;
        const descriptors = isWine
          ? (Object.keys(dims.get()).length ? { dimensions: dims.get() } : {})
          : (selectedTags.length ? { flavor_tags: selectedTags } : {});
        if (!scoreRaw && !Object.keys(descriptors).length) {
          toast("Add a score or pick some descriptors.");
          return;
        }
        try {
          const res = await api.addExternalRating(bottle.id, {
            source: sourceSel.value,
            score: scoreRaw ? Number(scoreRaw) : null,
            descriptors
          });
          closeSheet();
          const a = res.applied || {};
          const seeded = (a.dimensions || 0) + (a.flavorTags || 0);
          toast(seeded ? `Saved — filled in ${seeded} bottle attribute${seeded === 1 ? "" : "s"}.` : "Saved.");
          renderBottleDetail(bottle.id, currentDispatchNav);
        } catch (err) { toast(`Couldn't save: ${err.message}`); }
      });
    }
  });
}
