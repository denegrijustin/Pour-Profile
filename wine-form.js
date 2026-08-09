import { WINE_DIMENSIONS, WINE_VARIETALS, WINE_STATUSES } from "./wine-engine.js";
import { escapeHtml } from "./ui.js";

// The dimension sliders are the input that actually drives wine scoring, so they
// need to be quick to set in a restaurant. Every one is optional and starts
// "unset" — an unset dimension contributes nothing rather than defaulting to 5,
// which would silently fabricate a middle-of-the-road reading of the wine.

export function varietalSelectHtml(id, selected) {
  return `<select id="${id}">
    <option value="">— Choose varietal —</option>
    ${WINE_VARIETALS.map((v) => `<option value="${v.id}" ${v.id === selected ? "selected" : ""}>${escapeHtml(v.label)}</option>`).join("")}
  </select>`;
}

export function wineStatusPickerHtml(selected = []) {
  return `<div class="tag-cloud" id="wineStatusPicker">
    ${WINE_STATUSES.map((s) => `<button type="button" class="tag-chip${selected.includes(s.id) ? " selected" : ""}" data-wine-status="${s.id}">${escapeHtml(s.label)}</button>`).join("")}
  </div>`;
}

export function dimensionSlidersHtml(values = {}) {
  return WINE_DIMENSIONS.filter((d) => !d.descriptive).map((d) => {
    const v = values[d.id];
    const set = v != null;
    return `
      <div class="wine-input" data-dim-row="${d.id}">
        <div class="wine-dim-head">
          <label for="dim-${d.id}" style="margin:0">${escapeHtml(d.label)}</label>
          <span class="wine-dim-conf" id="dimval-${d.id}">${set ? `${v}/10` : "not set"}</span>
        </div>
        <input type="range" id="dim-${d.id}" min="0" max="10" step="1" value="${set ? v : 5}"
               data-dim="${d.id}" data-set="${set ? "1" : "0"}" class="wine-range${set ? "" : " unset"}"
               aria-label="${escapeHtml(d.label)}, ${escapeHtml(d.low || "low")} to ${escapeHtml(d.high || "high")}">
        <div class="wine-scale-ends"><span>${escapeHtml(d.low || "")}</span><span>${escapeHtml(d.high || "")}</span></div>
      </div>`;
  }).join("");
}

/**
 * Wire the sliders. Returns a getter for the values that were actually touched —
 * untouched sliders are deliberately excluded from the payload.
 */
export function wireDimensionSliders(root = document) {
  const values = {};
  root.querySelectorAll(".wine-range").forEach((input) => {
    const dim = input.dataset.dim;
    if (input.dataset.set === "1") values[dim] = Number(input.value);

    const mark = () => {
      input.dataset.set = "1";
      input.classList.remove("unset");
      values[dim] = Number(input.value);
      const label = root.querySelector(`#dimval-${dim}`);
      if (label) label.textContent = `${input.value}/10`;
    };
    input.addEventListener("input", mark);
    // A tap without a drag still counts as setting the value.
    input.addEventListener("change", mark);
  });

  return {
    get: () => ({ ...values }),
    clear: (dim) => { delete values[dim]; }
  };
}

export function wireWineStatusPicker(root = document, initial = []) {
  let selected = [...initial];
  const picker = root.querySelector("#wineStatusPicker");
  if (!picker) return { get: () => selected };
  picker.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-wine-status]");
    if (!btn) return;
    const id = btn.dataset.wineStatus;
    // The five-point scale is mutually exclusive: a wine isn't both Love and Dislike.
    const others = WINE_STATUSES.map((s) => s.id).filter((s) => s !== id);
    selected = selected.filter((s) => !others.includes(s));
    selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    picker.querySelectorAll("[data-wine-status]").forEach((b) => {
      b.classList.toggle("selected", selected.includes(b.dataset.wineStatus));
    });
  });
  return { get: () => selected };
}
