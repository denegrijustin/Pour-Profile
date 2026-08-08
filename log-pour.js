import { api } from "./api.js";
import { openSheet, closeSheet, toast, escapeHtml, ratingPickerHtml, flavorTagPickerHtml } from "./ui.js";
import { SERVING_STYLES, VENUE_TYPES } from "./spirit-taxonomy.js";

let selectedRating = null;
let selectedTags = [];
let selectedBottle = null;
let flavorTagsCache = null;

async function getFlavorTags() {
  if (!flavorTagsCache) {
    const res = await api.flavorTags();
    flavorTagsCache = res.flavor_tags || [];
  }
  return flavorTagsCache;
}

export async function openBottlePickerSheet() {
  openSheet(`
    <div class="sheet-header"><h2>Log a Pour</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>
    <label>Find your bottle</label>
    <input type="search" id="pourPickSearch" placeholder="Search by name or brand…" autofocus>
    <div id="pourPickResults" style="margin-top:12px"></div>
    <p class="field-hint">Can't find it? <button class="btn-ghost" type="button" data-action="scan-instead" style="padding:0;font-weight:600">Scan the barcode</button> or start a new bottle below.</p>
    <button class="btn btn-secondary btn-block" id="pourPickNewBtn" style="margin-top:8px">+ New Bottle</button>
  `, {
    onOpen: () => {
      const input = document.getElementById("pourPickSearch");
      const results = document.getElementById("pourPickResults");
      let timer;
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const q = input.value.trim();
          if (q.length < 2) { results.innerHTML = ""; return; }
          const res = await api.bottles({ q });
          results.innerHTML = (res.bottles || []).slice(0, 8).map((b) => `
            <div class="bottle-row" data-pick-bottle='${escapeHtml(JSON.stringify({ id: b.id, name: b.name, brand: b.brand }))}'>
              <div class="thumb-sm">🥃</div>
              <div class="info"><div class="name">${escapeHtml(b.name)}</div><div class="sub">${escapeHtml(b.brand || "")}</div></div>
            </div>`).join("") || `<p class="field-hint">No matches — try New Bottle below.</p>`;
        }, 220);
      });
      results.addEventListener("click", (e) => {
        const row = e.target.closest("[data-pick-bottle]");
        if (!row) return;
        const b = JSON.parse(row.dataset.pickBottle);
        openLogPourSheet(b);
      });
      document.getElementById("pourPickNewBtn").addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("pourprofile:navigate", { detail: { view: "scan" } }));
        closeSheet();
      });
    }
  });
}

export async function openLogPourSheet(bottle, { onSaved } = {}) {
  selectedRating = null;
  selectedTags = [];
  selectedBottle = bottle;
  const tags = await getFlavorTags();

  openSheet(`
    <div class="sheet-header"><h2>Log a Pour</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>
    <div class="card" style="margin-bottom:12px;padding:12px 14px">
      <strong>${escapeHtml(bottle.name)}</strong>
      ${bottle.brand ? `<div class="field-hint">${escapeHtml(bottle.brand)}</div>` : ""}
    </div>

    <label>Rating (required)</label>
    <div id="pourRatingPicker">${ratingPickerHtml(null)}</div>

    <details style="margin-top:16px">
      <summary style="cursor:pointer;font-weight:600;font-size:14px;color:var(--amber-deep)">Add more detail (optional)</summary>
      <div style="margin-top:10px">
        <label>Serving style</label>
        <select id="pourServingStyle">
          <option value="">—</option>
          ${SERVING_STYLES.map((s) => `<option value="${s.id}">${s.label}</option>`).join("")}
        </select>

        <label>Venue / where</label>
        <input type="text" id="pourVenueName" placeholder="e.g. Neat Bar, Lenexa KS, or Home">
        <div class="field-row">
          <div>
            <label>City</label>
            <input type="text" id="pourVenueCity" placeholder="City">
          </div>
          <div>
            <label>State/Region</label>
            <input type="text" id="pourVenueState" placeholder="State">
          </div>
        </div>
        <div class="toggle-row">
          <span style="font-size:13px">Private location (approximate on map)</span>
          <button type="button" class="toggle" id="pourVenuePrivate" data-on="0"></button>
        </div>

        <div class="field-row">
          <div>
            <label>Date</label>
            <input type="date" id="pourDate">
          </div>
          <div>
            <label>Price paid</label>
            <input type="number" step="0.01" id="pourPrice" placeholder="$">
          </div>
        </div>

        <label>Flavor tags detected</label>
        <div id="pourFlavorTags">${flavorTagPickerHtml(tags, [])}</div>

        <label>Notes</label>
        <textarea id="pourNotes" placeholder="Nose, palate, finish, anything worth remembering..."></textarea>

        <div class="toggle-row"><span style="font-size:13px">Would drink again</span><button type="button" class="toggle" id="pourAgain" data-on="0"></button></div>
        <div class="toggle-row"><span style="font-size:13px">Would buy the bottle</span><button type="button" class="toggle" id="pourBuy" data-on="0"></button></div>
      </div>
    </details>

    <button class="btn btn-primary btn-block" id="pourSaveBtn" style="margin-top:18px" disabled>Save Pour</button>
  `, { onOpen: wireSheet });
}

function wireSheet() {
  document.getElementById("pourRatingPicker").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rating]");
    if (!btn) return;
    selectedRating = Number(btn.dataset.rating);
    document.querySelectorAll("#pourRatingPicker button").forEach((b) => b.classList.toggle("selected", Number(b.dataset.rating) === selectedRating));
    document.getElementById("pourSaveBtn").disabled = false;
  });

  document.getElementById("pourFlavorTags").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle-tag]");
    if (!btn) return;
    const tag = btn.dataset.toggleTag;
    if (selectedTags.includes(tag)) selectedTags = selectedTags.filter((t) => t !== tag);
    else selectedTags.push(tag);
    btn.classList.toggle("selected");
  });

  document.querySelectorAll(".toggle").forEach((t) => {
    t.addEventListener("click", () => {
      const on = t.dataset.on === "1";
      t.dataset.on = on ? "0" : "1";
      t.classList.toggle("on", !on);
    });
  });

  document.getElementById("pourSaveBtn").addEventListener("click", savePour);
}

async function savePour() {
  const btn = document.getElementById("pourSaveBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  const venueName = document.getElementById("pourVenueName").value.trim();
  const payload = {
    bottle_id: selectedBottle.id,
    rating: selectedRating,
    serving_style: document.getElementById("pourServingStyle").value || null,
    tasted_at: document.getElementById("pourDate").value || null,
    price_paid: document.getElementById("pourPrice").value ? Number(document.getElementById("pourPrice").value) : null,
    notes: document.getElementById("pourNotes").value.trim() || null,
    would_drink_again: document.getElementById("pourAgain").dataset.on === "1" ? 1 : null,
    would_buy_bottle: document.getElementById("pourBuy").dataset.on === "1" ? 1 : null,
    flavor_tags: selectedTags
  };
  if (venueName) {
    payload.venue = {
      name: venueName,
      city: document.getElementById("pourVenueCity").value.trim() || null,
      state_region: document.getElementById("pourVenueState").value.trim() || null,
      is_private: document.getElementById("pourVenuePrivate").dataset.on === "1"
    };
  }
  try {
    const res = await api.createTasting(payload);
    closeSheet();
    toast(res.queued ? "Saved offline — will sync when you're back online." : "Pour logged.");
    document.dispatchEvent(new CustomEvent("pourprofile:refresh"));
  } catch (err) {
    toast(`Couldn't save: ${err.message}`);
    btn.disabled = false;
    btn.textContent = "Save Pour";
  }
}
