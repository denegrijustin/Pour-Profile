import { api } from "./api.js";
import { el, escapeHtml } from "./ui.js";
import { WINE_DIMENSIONS, WINE_VARIETALS } from "./wine-engine.js";

const dimLabel = (id) => WINE_DIMENSIONS.find((d) => d.id === id)?.label || id;
const dimMeta = (id) => WINE_DIMENSIONS.find((d) => d.id === id) || {};
const varietalLabel = (id) => WINE_VARIETALS.find((v) => v.id === id)?.label || (id === "_all" ? "Across all wine" : id);

function stars(n) {
  const filled = Math.max(0, Math.min(5, Number(n) || 0));
  return `<span aria-label="${filled} out of 5 confidence">${"★".repeat(filled)}${"☆".repeat(5 - filled)}</span>`;
}

function dimensionRow(row) {
  const meta = dimMeta(row.dimension);
  if (row.target_value == null) {
    return `
      <div class="wine-dim wine-dim-unknown">
        <div class="wine-dim-head">
          <span>${escapeHtml(dimLabel(row.dimension))}</span>
          <span class="wine-dim-conf">Unknown ${stars(row.confidence)}</span>
        </div>
        <p class="field-hint">${escapeHtml(row.notes || "Not enough evidence yet.")}</p>
      </div>`;
  }
  const pct = (Number(row.target_value) / 10) * 100;
  return `
    <div class="wine-dim">
      <div class="wine-dim-head">
        <span>${escapeHtml(dimLabel(row.dimension))}</span>
        <span class="wine-dim-conf">${Number(row.target_value).toFixed(1)}/10 ${stars(row.confidence)}</span>
      </div>
      <div class="wine-scale" role="img" aria-label="Target ${row.target_value} out of 10">
        <div class="wine-scale-marker" style="left:${pct}%"></div>
      </div>
      ${meta.low ? `<div class="wine-scale-ends"><span>${escapeHtml(meta.low)}</span><span>${escapeHtml(meta.high)}</span></div>` : ""}
      ${row.notes ? `<p class="field-hint">${escapeHtml(row.notes)}</p>` : ""}
      ${row.source === "learned" ? `<p class="field-hint">↻ Adjusted from your ratings.</p>` : ""}
    </div>`;
}

export async function renderWinePalate() {
  const view = el("view-wine");
  view.innerHTML = `<p class="field-hint">Loading wine palate…</p>`;

  let data;
  try { data = await api.winePalate(); } catch (err) {
    view.innerHTML = `<p>Couldn't load the wine palate: ${escapeHtml(err.message)}</p>`;
    return;
  }
  const { byVarietal, ratedCounts } = data;
  const varietals = Object.keys(byVarietal || {});

  if (!varietals.length) {
    view.innerHTML = `
      <div class="card"><h2>Wine Palate</h2>
      <p class="field-hint">No wine profile yet. Rate a few wines and per-varietal profiles will build here.</p></div>`;
    return;
  }

  view.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom:2px">Wine Palate</h2>
      <p class="field-hint">Profiles are kept <strong>separate per varietal</strong> — what you like in Sauvignon Blanc doesn't predict what you'll like in Chardonnay. Stars show how much evidence is behind each preference.</p>
    </div>
    ${varietals.map((v) => {
      const rows = byVarietal[v];
      const rated = ratedCounts?.[v] || 0;
      const known = rows.filter((r) => r.target_value != null).length;
      return `
        <div class="section-title">
          <h2>${escapeHtml(varietalLabel(v))}</h2>
          <span class="field-hint">${rated} rated</span>
        </div>
        <div class="card">
          <p class="field-hint" style="margin-bottom:10px">
            ${known} of ${rows.length} dimensions established${rated === 0 ? " — all still hypotheses until wines are rated." : "."}
          </p>
          ${rows.map(dimensionRow).join("")}
        </div>`;
    }).join("")}
  `;
}
