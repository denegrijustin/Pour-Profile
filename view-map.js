import { api } from "./api.js";
import { el, escapeHtml, formatRating } from "./ui.js";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
let mapInstance = null;
let mode = "both"; // 'tastings' | 'origins' | 'both'

function loadMapLibre() {
  return new Promise((resolve) => {
    if (window.maplibregl) return resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export async function renderMapView(dispatchNav) {
  const view = el("view-map");
  view.innerHTML = `
    <button class="btn-ghost" data-action="back" style="padding-left:0">← Back</button>
    <div class="map-toggle-row">
      <button class="filter-chip${mode === "tastings" ? " active" : ""}" data-mode="tastings">My Tastings</button>
      <button class="filter-chip${mode === "origins" ? " active" : ""}" data-mode="origins">Spirit Origins</button>
      <button class="filter-chip${mode === "both" ? " active" : ""}" data-mode="both">Both</button>
    </div>
    <div class="map-legend"><span>🥃 Tasting location</span><span>🏭 Distillery / origin</span></div>
    <div id="mapCanvas"><p class="field-hint" style="padding:16px">Loading map…</p></div>
    <div id="mapAnalytics"></div>
  `;

  view.querySelector("[data-action='back']").addEventListener("click", () => dispatchNav("discover"));
  view.querySelectorAll("[data-mode]").forEach((btn) => btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    view.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("active", b === btn));
    updateMarkers();
  }));

  const [venuesRes, distilleriesRes, statsRes] = await Promise.all([
    api.venues().catch(() => ({ venues: [] })),
    api.distilleries().catch(() => ({ distilleries: [] })),
    api.stats().catch(() => null)
  ]);
  const venues = (venuesRes.venues || []).filter((v) => v.lat != null && v.lon != null && v.tasting_count > 0);
  const distilleries = (distilleriesRes.distilleries || []).filter((d) => d.lat != null && d.lon != null && d.bottle_count > 0);

  if (statsRes) {
    view.querySelector("#mapAnalytics").innerHTML = `
      <div class="section-title"><h2>Map Analytics</h2></div>
      <div class="card"><div class="spec-grid">
        <div><dt>Distilleries Tried</dt><dd>${statsRes.distilleryCount}</dd></div>
        <div><dt>States Represented</dt><dd>${statsRes.stateCount}</dd></div>
        <div><dt>Countries Represented</dt><dd>${statsRes.countryCount}</dd></div>
        <div><dt>Top Venue</dt><dd>${statsRes.topVenues?.[0] ? escapeHtml(statsRes.topVenues[0].name) + ` (${statsRes.topVenues[0].tasting_count})` : "—"}</dd></div>
      </div></div>
      ${statsRes.topStates?.length ? `<div class="card"><strong>Highest-rated states</strong><p class="field-hint" style="margin-top:6px">${statsRes.topStates.map((s) => `${escapeHtml(s.origin_state)} (${s.avg_rating.toFixed(1)}★)`).join(" · ")}</p></div>` : ""}
    `;
  }

  await loadMapLibre();
  const canvas = view.querySelector("#mapCanvas");
  canvas.innerHTML = "";
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  const allPoints = [...venues.map((v) => [v.lon, v.lat]), ...distilleries.map((d) => [d.lon, d.lat])];
  const center = allPoints.length ? allPoints[0] : [-85.5, 38.2];

  mapInstance = new maplibregl.Map({ container: canvas, style: MAP_STYLE_URL, center, zoom: allPoints.length ? 5 : 3 });
  mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

  mapInstance.on("load", () => {
    window.__pourProfileMapData = { venues, distilleries };
    updateMarkers();
    if (allPoints.length > 1) {
      const bounds = allPoints.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(allPoints[0], allPoints[0]));
      mapInstance.fitBounds(bounds, { padding: 48, maxZoom: 9 });
    }
  });
}

let markers = [];
function updateMarkers() {
  if (!mapInstance || !window.__pourProfileMapData) return;
  markers.forEach((m) => m.remove());
  markers = [];
  const { venues, distilleries } = window.__pourProfileMapData;

  if (mode === "tastings" || mode === "both") {
    for (const v of venues) {
      const marker = new maplibregl.Marker({ color: "#c07a3e" })
        .setLngLat([v.lon, v.lat])
        .setPopup(new maplibregl.Popup().setHTML(`
          <strong>🥃 ${escapeHtml(v.name)}</strong>
          <p style="margin:4px 0;font-size:13px">${v.tasting_count} tasting${v.tasting_count === 1 ? "" : "s"}${v.avg_rating != null ? ` · avg ${formatRating(v.avg_rating)}★` : ""}</p>
          ${v.city ? `<p style="margin:0;font-size:12px;color:#6b6156">${escapeHtml([v.city, v.state_region].filter(Boolean).join(", "))}</p>` : ""}
        `))
        .addTo(mapInstance);
      markers.push(marker);
    }
  }
  if (mode === "origins" || mode === "both") {
    for (const d of distilleries) {
      const marker = new maplibregl.Marker({ color: "#6f4a2c" })
        .setLngLat([d.lon, d.lat])
        .setPopup(new maplibregl.Popup().setHTML(`
          <strong>🏭 ${escapeHtml(d.name)}</strong>
          <p style="margin:4px 0;font-size:13px">${d.bottle_count} bottle${d.bottle_count === 1 ? "" : "s"} from here</p>
          ${d.is_sourced_whiskey ? `<p style="margin:0;font-size:11.5px;color:#ab5238">Sourced whiskey — origin confidence: ${escapeHtml(d.confidence)}</p>` : ""}
          <p style="margin:0;font-size:12px;color:#6b6156">${escapeHtml([d.city, d.state_region, d.country].filter(Boolean).join(", "))}</p>
        `))
        .addTo(mapInstance);
      markers.push(marker);
    }
  }
}
