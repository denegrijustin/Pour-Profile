import { el, closeSheet, toast, escapeHtml, skeletonHtml } from "./ui.js";
import { api, flushQueue, pendingQueueCount, getActiveProfile, setActiveProfile } from "./api.js";
import { wireHomeActions } from "./view-home.js";

// Views other than Home load on first visit, so the first paint ships only what Home needs.
const VIEWS = {
  spirits: () => import("./view-spirits.js"),
  scan: () => import("./view-scan.js"),
  discover: () => import("./view-discover.js"),
  map: () => import("./view-map.js"),
  profile: () => import("./view-profile.js"),
  bottle: () => import("./view-bottle.js"),
  compare: () => import("./view-compare.js"),
  wine: () => import("./view-wine-palate.js"),
  home: () => import("./view-home.js")
};
let scanModule = null;
const stopScan = () => { if (scanModule) scanModule.stopScan(); };

const NAV_VIEWS = ["home", "spirits", "scan", "discover", "profile"];
const TITLES = {
  home: ["Pour Profile", "Home"], spirits: ["Your Collection", "My Bottles"], scan: ["Your Collection", "Add Drink"],
  discover: ["Recommendations", "Discover"], map: ["Geographic Journal", "Map"], profile: ["Your Palate", "Profile"],
  bottle: ["Bottle", ""], compare: ["Comparison", "Compare"], wine: ["Wine Palate", "Wine"]
};

let currentView = "home";

function applyProfileLabels() {
  const btn = document.querySelector('[data-nav="spirits"]');
  if (btn) btn.lastChild.textContent = "My Bottles";
  TITLES.spirits = ["Your Collection", "My Bottles"];
}

function setActiveNav(view) {
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.nav === view));
}

async function navigate(view, param) {
  if (currentView === "scan" && view !== "scan") stopScan();
  currentView = view;
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const target = el(`view-${view}`);
  if (target) target.classList.add("active");
  if (NAV_VIEWS.includes(view)) setActiveNav(view); else setActiveNav("");

  const [eyebrow, title] = TITLES[view] || ["Pour Profile", ""];
  el("topbarEyebrow").textContent = eyebrow;
  el("topbarTitle").textContent = view === "bottle" ? "Bottle" : title;

  window.scrollTo(0, 0);

  const load = VIEWS[view];
  if (!load) return;
  // A view that has never rendered shows a placeholder while its code downloads.
  if (target && !target.firstElementChild) target.innerHTML = skeletonHtml();
  let loadFailed = false;
  try {
    const mod = await load().catch((e) => { loadFailed = true; throw e; });
    if (view !== currentView) return; // user navigated away while the view was loading
    if (view === "home") return await mod.renderHome();
    if (view === "spirits") return await mod.renderSpirits();
    if (view === "scan") { scanModule = mod; return await mod.renderScan(navigate); }
    if (view === "discover") return await mod.renderDiscover(navigate);
    if (view === "map") return await mod.renderMapView(navigate);
    if (view === "profile") return await mod.renderProfile();
    if (view === "bottle") return await mod.renderBottleDetail(param, navigate);
    if (view === "compare") return await mod.renderCompare(navigate);
    if (view === "wine") return await mod.renderWinePalate();
  } catch (err) {
    // A chunk that failed to download (a weak connection) or a view that threw: say so and offer a retry
    // instead of leaving a blank screen.
    console.error(`Could not show the ${view} view`, err);
    if (view !== currentView || !target) return;
    target.innerHTML = `<div class="empty-state" role="alert"><p>This view could not load.</p><button type="button" class="btn btn-secondary" data-retry-view>Try again</button></div>`;
    // A module that failed to download stays failed for this page, so retrying it means reloading; a view that
    // merely threw can simply be rendered again.
    target.querySelector("[data-retry-view]").addEventListener("click", () => (loadFailed ? location.reload() : navigate(view, param)));
  }
}

function wireNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.nav));
  });
}

function wireGlobalDelegation() {
  document.addEventListener("click", (e) => {
    const bottleCard = e.target.closest("[data-open-bottle]");
    if (bottleCard) { navigate("bottle", Number(bottleCard.dataset.openBottle)); return; }

    if (e.target.closest("[data-action='retry-view']")) { navigate(currentView); return; }
    if (e.target.closest("[data-action='close-sheet']")) { closeSheet(); return; }
    if (e.target.closest("#sheetBackdrop")) { closeSheet(); return; }
  });

  // A bottle photo that fails to load (offline, or a dead link) is hidden instead of showing its alt text in a box.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && !img.dataset.failed) {
      img.dataset.failed = "1";
      img.classList.add("img-failed");
    }
  }, true);

  document.addEventListener("pourprofile:navigate", (e) => navigate(e.detail.view, e.detail.param));
  document.addEventListener("pourprofile:refresh", () => navigate(currentView));
}

async function wireSearch() {
  const { openSheet } = await import("./ui.js");
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-action='open-search']")) return;
    openSheet(`
      <div class="sheet-header"><h2>Search</h2><button class="icon-btn" data-action="close-sheet">✕</button></div>
      <input type="search" id="globalSearchInput" placeholder="Bottles, distilleries, venues, flavors…" autofocus>
      <div id="globalSearchResults" style="margin-top:12px"></div>
    `, {
      onOpen: () => {
        const input = document.getElementById("globalSearchInput");
        const results = document.getElementById("globalSearchResults");
        let timer;
        input.addEventListener("input", () => {
          clearTimeout(timer);
          timer = setTimeout(async () => {
            const q = input.value.trim();
            if (q.length < 2) { results.innerHTML = ""; return; }
            const res = await api.search(q);
            results.innerHTML = renderSearchResults(res.results);
          }, 220);
        });
        results.addEventListener("click", (e2) => {
          const row = e2.target.closest("[data-goto-bottle]");
          if (row) { closeSheet(); navigate("bottle", Number(row.dataset.gotoBottle)); }
        });
      }
    });
  });
}

function renderSearchResults(results) {
  if (!results) return "";
  const sections = [];
  if (results.bottles?.length) sections.push(`<div class="tag-group-label">Bottles</div>` + results.bottles.map((b) => `<div class="bottle-row" data-goto-bottle="${b.id}"><div class="thumb-sm">🥃</div><div class="info"><div class="name">${escapeHtml(b.name)}</div><div class="sub">${escapeHtml(b.brand || "")}</div></div></div>`).join(""));
  if (results.distilleries?.length) sections.push(`<div class="tag-group-label">Distilleries</div>` + results.distilleries.map((d) => `<div class="field-hint">${escapeHtml(d.name)} — ${escapeHtml([d.city, d.state_region].filter(Boolean).join(", "))}</div>`).join(""));
  if (results.venues?.length) sections.push(`<div class="tag-group-label">Venues</div>` + results.venues.map((v) => `<div class="field-hint">${escapeHtml(v.name)}${v.city ? ` — ${escapeHtml(v.city)}` : ""}</div>`).join(""));
  if (results.tastings?.length) sections.push(`<div class="tag-group-label">Tasting Notes</div>` + results.tastings.map((t) => `<div class="field-hint">"${escapeHtml(t.notes)}" — ${escapeHtml(t.bottle_name)}</div>`).join(""));
  if (results.flavor_tags?.length) sections.push(`<div class="tag-group-label">Flavors</div>` + results.flavor_tags.map((f) => `<span class="tag-chip" style="cursor:default;margin-right:4px">${escapeHtml(f.name)}</span>`).join(""));
  return sections.join("") || `<p class="field-hint">No matches.</p>`;
}

async function wireProfileSwitcher() {
  const chip = el("profileChip");
  let profiles = [];
  try {
    const res = await api.profiles();
    profiles = res.profiles || [];
  } catch { /* offline: keep whatever is cached in the chip */ }

  const paint = () => {
    const active = profiles.find((p) => p.slug === getActiveProfile());
    const slug = getActiveProfile();
    // Offline, before the profile list arrives: still show the person's name, not the raw slug.
    el("profileChipName").textContent = active ? active.display_name : slug === "jdad" ? "JDAD" : slug.charAt(0).toUpperCase() + slug.slice(1);
  };
  paint();

  chip.addEventListener("click", async () => {
    const { openSheet } = await import("./ui.js");
    openSheet(`
      <div class="sheet-header"><h2>Whose pour profile?</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>
      <p class="field-hint">Lady and JDAD each have their own ratings and recommendations across bourbon, wine, tequila, rum and scotch.</p>
      <div style="margin-top:12px">
        ${profiles.map((p) => `
          <button type="button" class="btn ${p.slug === getActiveProfile() ? "btn-primary" : "btn-secondary"} btn-block" data-pick-profile="${escapeHtml(p.slug)}" style="margin-bottom:8px;justify-content:space-between">
            <span>${escapeHtml(p.display_name)}</span>
            <span style="font-size:12px;font-weight:500;opacity:0.8">All five categories</span>
          </button>`).join("")}
      </div>
    `, {
      onOpen: () => {
        document.querySelectorAll("[data-pick-profile]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (currentView === "scan") stopScan();
            setActiveProfile(btn.dataset.pickProfile);
            paint();
            applyProfileLabels();
            closeSheet();
            toast(`Switched to ${el("profileChipName").textContent}.`);
            navigate(currentView);
          });
        });
      }
    });
  });
}

function wireOfflineBanner() {
  const banner = el("offlineBanner");
  const update = () => {
    const pending = pendingQueueCount();
    banner.hidden = navigator.onLine;
    if (!navigator.onLine && pending) {
      banner.textContent = `You're offline — ${pending} pour${pending === 1 ? "" : "s"} queued and will sync automatically.`;
    } else if (!navigator.onLine) {
      banner.textContent = "You're offline — showing your last synced collection. Pours you log now will sync when you're back online.";
    }
    if (navigator.onLine) {
      flushQueue().then(({ flushed }) => { if (flushed) toast(`Synced ${flushed} pour${flushed === 1 ? "" : "s"} logged offline.`); });
    }
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

applyProfileLabels();
wireNav();
wireProfileSwitcher();
wireGlobalDelegation();
wireSearch();
wireHomeActions(navigate);
wireOfflineBanner();
registerServiceWorker();
navigate("home");
