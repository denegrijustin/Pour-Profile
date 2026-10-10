import { flavorHeatmapHtml, wireFlavorHeatmap } from "./flavor-heatmap.js";
import { openCatalogDetail } from "./view-discover.js";
import { FEATURE_BOTTLES } from "./bottle-images.js";
import { api } from "./api.js";
import { el, escapeHtml, bottleCardHtml, emptyStateHtml, skeletonHtml, errorStateHtml } from "./ui.js";
import { openBottlePickerSheet } from "./log-pour.js";
import { titleize } from "./spirit-taxonomy.js";
import { tastingFeedHtml } from "./tasting-feed.js";
import { showPoursTab } from "./view-spirits.js";

export async function renderHome() {
  const view = el("view-home");
  view.innerHTML = skeletonHtml(4);
  let failures = 0;
  const soft = (fallback) => () => { failures++; return fallback; };

  const [bottlesRes, statsRes, palateRes, tastingsRes, picksRes, mapRes] = await Promise.all([
    api.bottles({ sort: "newest" }).catch(soft({ bottles: [] })),
    api.stats().catch(soft(null)),
    api.palate().catch(soft(null)),
    // The pours themselves, not the bottles they belong to — this is the answer
    // to "I logged a sip, where did it go?".
    api.tastings().catch(soft({ tastings: [] })),
    api.catalogRecommended().catch(soft({ results: [] })),
    api.flavorMap().catch(soft({flavor_profile:null}))
  ]);
  // Every request failed: say so, rather than showing an empty collection that looks like real data.
  if (failures === 6) { view.innerHTML = errorStateHtml(); return; }
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
    ${mapRes.flavor_profile ? flavorHeatmapHtml(mapRes.flavor_profile) : ""}
    <section class="home-hero">
      <div class="hero-copy"><button class="btn btn-primary" data-action="nav-scan">Add & rate a drink <span aria-hidden="true">↗</span></button></div>
      <div class="hero-bottles">${FEATURE_BOTTLES.map(b=>`<img src="${escapeHtml(b.image_url)}" alt="${escapeHtml(b.name)}" fetchpriority="high">`).join('')}</div>
    </section>
    <div class="quick-actions">
      <button type="button" class="quick-action" data-action="log-pour"><span class="qa-icon">◉</span>Rate a Pour</button>
      <button type="button" class="quick-action" data-action="nav-discover"><span class="qa-icon">✧</span>Discover</button>
      <button type="button" class="quick-action" data-action="nav-spirits"><span class="qa-icon">▤</span>My Bottles</button>
      <button type="button" class="quick-action" data-action="nav-scan"><span class="qa-icon">＋</span>Add Drink</button>
    </div>

    ${bottles.length ? `<div class="section-title"><h2>Your bottles</h2><button class="btn-ghost" data-action="nav-spirits">View collection →</button></div><div class="home-bottle-shelf">${[...bottles].sort((a,b)=>Number(!!b.image_url)-Number(!!a.image_url)).slice(0,4).map(bottleCardHtml).join('')}</div>` : ""}
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
  wireFlavorHeatmap(view, mapRes.flavor_profile || {}, id=>openCatalogDetail(id, homeDispatch));
}

let homeDispatch;
export function wireHomeActions(dispatchNav) {
  homeDispatch=dispatchNav;
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
