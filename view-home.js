import { api } from "./api.js";
import { el, escapeHtml, bottleCardHtml, emptyStateHtml } from "./ui.js";
import { openBottlePickerSheet } from "./log-pour.js";
import { titleize } from "./spirit-taxonomy.js";
import { tastingFeedHtml } from "./tasting-feed.js";
import { showPoursTab } from "./view-spirits.js";

export async function renderHome() {
  const view = el("view-home");
  view.innerHTML = `<p class="field-hint">Loading your dashboard…</p>`;

  const [bottlesRes, statsRes, palateRes, tastingsRes, picksRes] = await Promise.all([
    api.bottles({ sort: "newest" }).catch(() => ({ bottles: [] })),
    api.stats().catch(() => null),
    api.palate().catch(() => null),
    // The pours themselves, not the bottles they belong to — this is the answer
    // to "I logged a sip, where did it go?".
    api.tastings().catch(() => ({ tastings: [] })),
    api.catalogRecommended().catch(() => ({ results: [] }))
  ]);
  const bottles = bottlesRes.bottles || [];
  const tastings = (tastingsRes.tastings || []).slice(0, 5);
  const tried = bottles.filter((b) => (b.status_tags || []).includes("tried"));
  const topPick = (picksRes.results || []).find((r) => !r.adopted_bottle_id) || null;

  let insight = "";
  if (palateRes && palateRes.topPositive && palateRes.topPositive.length) {
    const [topTag, topVal] = palateRes.topPositive[0];
    insight = `Your strongest emerging preference is <strong>${escapeHtml(titleize(topTag))}</strong> (${topVal.affinity}% affinity, ${topVal.confidence} confidence, from ${topVal.sampleCount} tasting${topVal.sampleCount === 1 ? "" : "s"}).`;
  }

  view.innerHTML = `
    ${bottlesRes._stale ? `<p class="field-hint">Showing your last saved data.</p>` : ""}
    <div class="quick-actions">
      <div class="quick-action" data-action="log-pour"><span class="qa-icon">🥃</span>Log a Pour</div>
      <div class="quick-action" data-action="nav-discover"><span class="qa-icon">✨</span>What Next?</div>
      <div class="quick-action" data-action="nav-spirits"><span class="qa-icon">🔎</span>My Bottles</div>
      <div class="quick-action" data-action="nav-scan"><span class="qa-icon">➕</span>Add Bottle</div>
    </div>

    ${topPick ? `
    <div class="section-title"><h2>Tonight's Pick</h2><span class="link" data-action="nav-discover">More</span></div>
    <div class="card tonight-card" data-action="nav-discover">
      <div class="tonight-name">${escapeHtml(topPick.name)}</div>
      <div class="tonight-sub">${escapeHtml([topPick.producer, topPick.jd_fit != null ? `${topPick.jd_fit}/100 match` : null].filter(Boolean).join(" · "))}</div>
      ${topPick.why ? `<p class="tonight-why">${escapeHtml(topPick.why)}</p>` : ""}
    </div>` : ""}

    ${insight ? `<div class="card insight-card"><strong>Profile Insight</strong><p style="margin-top:6px">${insight}</p></div>` : ""}

    <div class="section-title"><h2>Recent Pours</h2>${tastings.length ? `<span class="link" data-action="all-pours">See all</span>` : ""}</div>
    ${tastings.length
      ? tastingFeedHtml(tastings)
      : emptyStateHtml("🥃", "No pours logged yet", "Tap Log a Pour and rate what you're drinking — it takes one tap.")}

    ${statsRes ? `
    <div class="section-title"><h2>At a Glance</h2></div>
    <div class="card">
      <div class="spec-grid">
        <div><dt>Bottles Tried</dt><dd>${tried.length}</dd></div>
        <!-- Counts rated pours only; the feed also lists seeded likes/dislikes
             that were deliberately left unrated, so "Logged" would not add up. -->
        <div><dt>Pours Rated</dt><dd>${statsRes.tastingCount}</dd></div>
        <div><dt>Distilleries</dt><dd>${statsRes.distilleryCount}</dd></div>
        <div><dt>States Represented</dt><dd>${statsRes.stateCount}</dd></div>
      </div>
    </div>` : ""}
  `;
}

export function wireHomeActions(dispatchNav) {
  el("view-home").addEventListener("click", (e) => {
    // A tasting row navigates to its bottle; global delegation handles that, so
    // it must not be swallowed by the card-level "nav-discover" handler.
    if (e.target.closest("[data-open-bottle]")) return;
    if (e.target.closest("[data-action='all-pours']")) { showPoursTab(); dispatchNav("spirits"); return; }
    if (e.target.closest("[data-action='nav-scan']")) dispatchNav("scan");
    if (e.target.closest("[data-action='nav-spirits']")) dispatchNav("spirits");
    if (e.target.closest("[data-action='nav-discover']")) dispatchNav("discover");
    if (e.target.closest("[data-action='log-pour']")) openBottlePickerSheet();
  });
}
