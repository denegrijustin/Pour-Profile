import { api, downscaleImage } from "./api.js";
import {
  el, escapeHtml, formatRating, formatDate, formatMoney, statusPillsHtml, matchBadgeHtml,
  decisionBannerHtml, whyConcernsHtml, openSheet, closeSheet, toast, flavorTagPickerHtml
} from "./ui.js";
import { CATEGORIES, STATUS_TAGS, categoryLabel, titleize } from "./spirit-taxonomy.js";
import { openLogPourSheet } from "./log-pour.js";

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

  const specs = [
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

  const flavorCounts = {};
  for (const t of tastings) for (const f of (t.flavor_tags || [])) flavorCounts[f] = (flavorCounts[f] || 0) + 1;
  const flavorExperience = Object.entries(flavorCounts).sort((a, b) => b[1] - a[1]);

  view.innerHTML = `
    <button class="btn-ghost" data-action="back" style="padding-left:0">← Back</button>
    <div class="hero-photo">
      ${bottle.image_url
        ? `<img src="${escapeHtml(bottle.image_url)}" alt="${escapeHtml(bottle.name)}">`
        : `<div class="hero-photo-empty"><span style="font-size:46px" aria-hidden="true">🥃</span><span class="field-hint">No photo yet</span></div>`}
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

    ${decisionBannerHtml(match)}
    ${whyConcernsHtml(match)}
    ${sourcedNote}

    <div class="section-title"><h2>Details</h2></div>
    <div class="card"><dl class="spec-grid">${specs.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join("")}</dl></div>
    ${bottle.description ? `<div class="card"><strong>Notes on this bottle</strong><p style="margin-top:6px">${escapeHtml(bottle.description)}</p></div>` : ""}

    <div class="section-title"><h2>My Tastings</h2></div>
    <div class="card">${tastingsHtml}</div>

    ${flavorExperience.length ? `
    <div class="section-title"><h2>My Flavor Experience</h2></div>
    <div class="card"><div class="tag-cloud">${flavorExperience.map(([f, n]) => `<span class="tag-chip" style="cursor:default">${escapeHtml(titleize(f))} × ${n}</span>`).join("")}</div></div>` : ""}
  `;

  wireBottleDetail(bottle);
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
