import { el, closeSheet, toast, escapeHtml } from "./ui.js";
import { api, flushQueue, pendingQueueCount, getActiveProfile, setActiveProfile } from "./api.js";
import { renderHome, wireHomeActions } from "./view-home.js";
import { renderSpirits } from "./view-spirits.js";
import { renderScan, stopScan } from "./view-scan.js";
import { renderDiscover } from "./view-discover.js";
import { renderMapView } from "./view-map.js";
import { renderProfile } from "./view-profile.js";
import { renderBottleDetail } from "./view-bottle.js";
import { renderCompare } from "./view-compare.js";
import { renderWinePalate } from "./view-wine-palate.js";

const NAV_VIEWS = ["home", "spirits", "scan", "discover", "profile"];
const TITLES = {
  home: ["Pour Decisions", "Home"], spirits: ["Your Collection", "My Bottles"], scan: ["Add a Bottle", "Scan"],
  discover: ["Recommendations", "Discover"], map: ["Geographic Journal", "Map"], profile: ["Your Palate", "Profile"],
  bottle: ["Bottle", ""], compare: ["Comparison", "Compare"], wine: ["Wine Palate", "Wine"]
};

let currentView = "home";

function applyProfileLabels() {
  const isWine = getActiveProfile() === "wine";
  const label = isWine ? "My Wines" : "My Spirits";
  const btn = document.querySelector('[data-nav="spirits"]');
  if (btn) btn.lastChild.textContent = label;
  const icon = btn && btn.querySelector(".nav-icon");
  if (icon) icon.textContent = isWine ? "🍷" : "🥃";
  TITLES.spirits = ["Your Collection", label];
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

  if (view === "home") return renderHome();
  if (view === "spirits") return renderSpirits();
  if (view === "scan") return renderScan(navigate);
  if (view === "discover") return renderDiscover(navigate);
  if (view === "map") return renderMapView(navigate);
  if (view === "profile") return renderProfile();
  if (view === "bottle") return renderBottleDetail(param, navigate);
  if (view === "compare") return renderCompare(navigate);
  if (view === "wine") return renderWinePalate();
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

    if (e.target.closest("[data-action='close-sheet']")) { closeSheet(); return; }
    if (e.target.closest("#sheetBackdrop")) { closeSheet(); return; }
  });

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
    el("profileChipName").textContent = active ? active.display_name : getActiveProfile();
  };
  paint();

  chip.addEventListener("click", async () => {
    const { openSheet } = await import("./ui.js");
    openSheet(`
      <div class="sheet-header"><h2>What are you drinking?</h2><button class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button></div>
      <p class="field-hint">Each profile covers one drink family and keeps its own ratings, statuses, and palate model — spirits preferences never bleed into wine.</p>
      <div style="margin-top:12px">
        ${profiles.map((p) => `
          <button type="button" class="btn ${p.slug === getActiveProfile() ? "btn-primary" : "btn-secondary"} btn-block" data-pick-profile="${escapeHtml(p.slug)}" style="margin-bottom:8px;justify-content:space-between">
            <span>${escapeHtml(p.display_name)}</span>
            <span style="font-size:12px;font-weight:500;opacity:0.8">${escapeHtml(p.focus === "wine" ? "Wine only" : "Whiskey, tequila, rum…")}</span>
          </button>`).join("")}
      </div>
    `, {
      onOpen: () => {
        document.querySelectorAll("[data-pick-profile]").forEach((btn) => {
          btn.addEventListener("click", () => {
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
