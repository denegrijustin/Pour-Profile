import { api } from "./api.js";
import { el, formatRating, formatDate, escapeHtml, bottleCardHtml, emptyStateHtml } from "./ui.js";
import { openBottlePickerSheet } from "./log-pour.js";
import { getActiveProfile } from "./api.js";
import { titleize } from "./spirit-taxonomy.js";

export async function renderHome() {
  const view = el("view-home");
  view.innerHTML = `<p class="field-hint">Loading your dashboard…</p>`;

  const [bottlesRes, statsRes, palateRes] = await Promise.all([
    api.bottles({ sort: "newest" }).catch(() => ({ bottles: [] })),
    api.stats().catch(() => null),
    api.palate().catch(() => null)
  ]);
  const bottles = bottlesRes.bottles || [];
  const tried = bottles.filter((b) => (b.status_tags || []).includes("tried"));
  const recent = tried.filter((b) => b.last_tasted).sort((a, b) => new Date(b.last_tasted) - new Date(a.last_tasted)).slice(0, 4);
  const wantToTry = bottles.filter((b) => (b.status_tags || []).includes("want_to_try")).sort((a, b) => b.palate_match - a.palate_match).slice(0, 4);

  let insight = "";
  if (palateRes && palateRes.topPositive && palateRes.topPositive.length) {
    const [topTag, topVal] = palateRes.topPositive[0];
    insight = `Your strongest emerging preference is <strong>${escapeHtml(titleize(topTag))}</strong> (${topVal.affinity}% affinity, ${topVal.confidence} confidence, from ${topVal.sampleCount} tasting${topVal.sampleCount === 1 ? "" : "s"}).`;
  }

  const isWine = getActiveProfile() === "wine";
  const heroLine = tried.length
    ? `${tried.length} tried · ${wantToTry.length} on the list`
    : "Rate · Track · Enjoy";

  view.innerHTML = `
    <figure class="brand-hero" style="margin-top:0">
      <img src="/brand-hero.jpg" alt="Justin and Lady at a bar, with a backbar of bottles behind them" loading="eager" fetchpriority="high" width="1400" height="788">
      <div class="hero-scrim" aria-hidden="true"></div>
      <figcaption class="hero-copy">
        <p class="hero-eyebrow">Pour Decisions</p>
        <h2>${isWine ? "Wine" : "Spirits"}</h2>
        <p class="hero-eyebrow" style="margin-top:2px;letter-spacing:0.06em;opacity:0.85">${escapeHtml(heroLine)}</p>
      </figcaption>
    </figure>
    ${bottlesRes._stale ? `<p class="field-hint">Showing your last saved data.</p>` : ""}
    <div class="quick-actions">
      <div class="quick-action" data-action="nav-scan"><span class="qa-icon">📷</span>Scan Bottle</div>
      <div class="quick-action" data-action="log-pour"><span class="qa-icon">🥃</span>Log Pour</div>
      <div class="quick-action" data-action="nav-spirits"><span class="qa-icon">🔎</span>Search</div>
      <div class="quick-action" data-action="nav-discover"><span class="qa-icon">✨</span>What Next?</div>
    </div>

    ${insight ? `<div class="card insight-card"><strong>Profile Insight</strong><p style="margin-top:6px">${insight}</p></div>` : ""}

    <div class="section-title"><h2>Recent Tastings</h2><span class="link" data-action="nav-spirits">See all</span></div>
    ${recent.length ? `<div class="bottle-grid">${recent.map(bottleCardHtml).join("")}</div>` : emptyStateHtml("🥃", "No pours logged yet", "Scan a bottle or search to log your first pour.")}

    <div class="section-title"><h2>Recommended Next</h2><span class="link" data-action="nav-discover">See all</span></div>
    ${wantToTry.length ? `<div class="bottle-grid">${wantToTry.map(bottleCardHtml).join("")}</div>` : emptyStateHtml("✨", "Nothing queued yet", "Add bottles to Want to Try and they'll show up here, ranked by predicted match.")}

    ${statsRes ? `
    <div class="section-title"><h2>At a Glance</h2></div>
    <div class="card">
      <div class="spec-grid">
        <div><dt>Bottles Tried</dt><dd>${tried.length}</dd></div>
        <div><dt>Tastings Logged</dt><dd>${statsRes.tastingCount}</dd></div>
        <div><dt>Distilleries</dt><dd>${statsRes.distilleryCount}</dd></div>
        <div><dt>States Represented</dt><dd>${statsRes.stateCount}</dd></div>
      </div>
    </div>` : ""}
  `;
}

export function wireHomeActions(dispatchNav) {
  el("view-home").addEventListener("click", (e) => {
    if (e.target.closest("[data-action='nav-scan']")) dispatchNav("scan");
    if (e.target.closest("[data-action='nav-spirits']")) dispatchNav("spirits");
    if (e.target.closest("[data-action='nav-discover']")) dispatchNav("discover");
    if (e.target.closest("[data-action='log-pour']")) openBottlePickerSheet();
  });
}
