import { api } from "./api.js";
import { el, escapeHtml, decisionBannerHtml, whyConcernsHtml, toast, matchBadgeHtml } from "./ui.js";
import { CATEGORIES } from "./spirit-taxonomy.js";
import { openLogPourSheet } from "./log-pour.js";

// Barcode decoding has two paths on purpose:
//   1. BarcodeDetector — native, fast, no download. Chrome/Android, some others.
//   2. ZXing (loaded on demand) — the fallback that actually covers iOS Safari,
//      which still ships no BarcodeDetector. Without this, iPhone users got a
//      dead black rectangle, which is the platform this app is primarily for.
const ZXING_URL = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";
const BARCODE_FORMATS = ["upc_a", "upc_e", "ean_13", "ean_8"];

let stream = null;
let detectLoop = null;
let zxingReader = null;
// ZXing fires its callback continuously; without this a second frame can
// re-enter handleBarcode before teardown finishes and double-navigate.
let handlingCode = false;

export async function renderScan(dispatchNav) {
  handlingCode = false;
  const view = el("view-scan");
  view.innerHTML = `
    <label style="margin-top:0">Find a bottle</label>
    <input type="search" id="catalogSearch" placeholder="Search 90+ known bottles by name or producer…" autocomplete="off">
    <div id="catalogResults"></div>
    <p class="field-hint" style="margin-top:10px">Searching the reference catalog is usually faster than scanning, and works when a barcode won't read.</p>

    <details style="margin-top:14px">
      <summary style="cursor:pointer;font-weight:600;font-size:14px;color:var(--accent-deep)">Scan a barcode instead</summary>
    <div class="scan-frame" id="scanFrame" style="margin-top:10px">
      <video id="scanVideo" playsinline muted autoplay></video>
      <div class="scan-reticle"></div>
      <button type="button" class="scan-torch" id="scanTorch" hidden aria-pressed="false">🔦 Light</button>
    </div>
    <div id="scanStatus" class="field-hint" style="margin-top:8px">Starting camera…</div>
    <div class="field-row" style="margin-top:14px">
      <input type="text" id="manualBarcode" inputmode="numeric" placeholder="Enter barcode manually">
      <button class="btn btn-secondary" id="manualBarcodeBtn">Look Up</button>
    </div>
    </details>
    <button class="btn btn-ghost btn-block" id="manualNewBtn" style="margin-top:10px">Not listed — add it manually</button>
    <div id="scanResult"></div>
  `;

  document.getElementById("manualBarcodeBtn").addEventListener("click", () => {
    const code = document.getElementById("manualBarcode").value.trim();
    if (code) handleBarcode(code, dispatchNav);
  });
  document.getElementById("manualBarcode").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const code = e.target.value.trim();
      if (code) handleBarcode(code, dispatchNav);
    }
  });
  document.getElementById("manualNewBtn").addEventListener("click", () => renderDraftForm(null, dispatchNav));

  wireCatalogSearch(dispatchNav);
  // The camera only starts if the user opens the barcode section, so we don't
  // grab it (or prompt for permission) on every visit to this screen.
  const details = view.querySelector("details");
  if (details) details.addEventListener("toggle", () => {
    if (details.open) startCamera(dispatchNav); else stopScan();
  });
}

function wireCatalogSearch(dispatchNav) {
  const input = document.getElementById("catalogSearch");
  const results = document.getElementById("catalogResults");
  if (!input || !results) return;
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      if (q.length < 2) { results.innerHTML = ""; return; }
      let res;
      try { res = await api.catalogSearch(q); } catch { results.innerHTML = `<p class="field-hint">Search unavailable offline.</p>`; return; }
      const rows = res.results || [];
      results.innerHTML = rows.length ? rows.map((r) => `
        <div class="bottle-row" data-adopt='${escapeHtml(JSON.stringify({ id: r.id, name: r.name }))}'>
          <div class="thumb-sm">${r.category === "sauvignon_blanc" ? "🍷" : "🥃"}</div>
          <div class="info">
            <div class="name">${escapeHtml(r.name)}</div>
            <div class="sub">${escapeHtml([r.producer, r.region, r.proof ? r.proof + " proof" : null].filter(Boolean).join(" · "))}</div>
          </div>
          ${r.jd_fit != null ? `<div style="text-align:right"><div style="font-weight:800;color:var(--accent-deep)">${r.jd_fit}</div><div class="field-hint" style="font-size:10px">${escapeHtml(r.fit_label || "")}</div></div>` : ""}
        </div>`).join("") : `<p class="field-hint">Nothing in the catalog matches. Use "add it manually" below.</p>`;
    }, 220);
  });

  results.addEventListener("click", async (e) => {
    const row = e.target.closest("[data-adopt]");
    if (!row) return;
    const { id, name } = JSON.parse(row.dataset.adopt);
    try {
      const res = await api.catalogAdopt({ catalog_id: id, status_tags: ["want_to_try"] });
      toast(res.already_present ? `${name} is already in your collection.` : `Added ${name} to Want to Try.`);
      dispatchNav("bottle", res.bottle_id);
    } catch (err) { toast(`Couldn't add: ${err.message}`); }
  });
}

export function stopScan() {
  if (detectLoop) cancelAnimationFrame(detectLoop);
  detectLoop = null;
  // decodeFromStream resolves to void, not a controls object — teardown is on the
  // reader itself. Getting this wrong leaves the camera running after you leave.
  if (zxingReader) {
    try { zxingReader.reset(); } catch { /* already torn down */ }
    zxingReader = null;
  }
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error("Couldn't load the barcode decoder."));
    document.head.appendChild(el);
  });
}

function setStatus(msg) {
  const s = el("scanStatus");
  if (s) s.textContent = msg;
}

// Some phones expose a torch on the rear camera; a bar is exactly where it's needed.
function wireTorch(track) {
  const btn = document.getElementById("scanTorch");
  if (!btn || !track) return;
  const caps = typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
  if (!caps || !caps.torch) return;
  btn.hidden = false;
  let on = false;
  btn.addEventListener("click", async () => {
    on = !on;
    try {
      await track.applyConstraints({ advanced: [{ torch: on }] });
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("on", on);
    } catch { /* torch refused; leave the button as-is */ }
  });
}

async function startCamera(dispatchNav) {
  const video = document.getElementById("scanVideo");
  if (!video) return;

  if (!window.isSecureContext) {
    setStatus("Camera needs a secure (https) connection — use manual entry below.");
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus("This browser won't share the camera — use manual entry below.");
    return;
  }

  // Show the preview FIRST, independent of which decoder we end up using, so the
  // frame is never just a dead black box.
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
  } catch (err) {
    const name = err && err.name;
    if (name === "NotAllowedError" || name === "SecurityError") {
      setStatus("Camera permission denied. On iPhone: Settings → Safari → Camera → Allow, then reload. Manual entry works below meanwhile.");
    } else if (name === "NotFoundError" || name === "OverconstrainedError") {
      setStatus("No usable camera found — use manual entry below.");
    } else {
      setStatus(`Couldn't start the camera (${escapeHtml(name || "unknown")}). Use manual entry below.`);
    }
    return;
  }

  video.srcObject = stream;
  video.setAttribute("playsinline", "");
  try { await video.play(); } catch { /* iOS resolves this on the next tick */ }
  wireTorch(stream.getVideoTracks()[0]);

  if ("BarcodeDetector" in window) {
    try {
      await startNativeDetection(video, dispatchNav);
      return;
    } catch {
      // fall through to ZXing
    }
  }
  await startZxingDetection(video, dispatchNav);
}

async function startNativeDetection(video, dispatchNav) {
  let formats = BARCODE_FORMATS;
  if (typeof BarcodeDetector.getSupportedFormats === "function") {
    const supported = await BarcodeDetector.getSupportedFormats();
    formats = BARCODE_FORMATS.filter((f) => supported.includes(f));
    if (!formats.length) throw new Error("no supported formats");
  }
  const detector = new BarcodeDetector({ formats });
  setStatus("Scanning…");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let busy = false;
  const tick = async () => {
    if (!stream) return;
    if (!busy && video.videoWidth) {
      busy = true;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        const codes = await detector.detect(canvas);
        if (codes.length && codes[0].rawValue) { handleBarcode(codes[0].rawValue, dispatchNav); return; }
      } catch { /* keep scanning */ }
      busy = false;
    }
    detectLoop = requestAnimationFrame(tick);
  };
  detectLoop = requestAnimationFrame(tick);
}

async function startZxingDetection(video, dispatchNav) {
  setStatus("Loading scanner…");
  try {
    if (!window.ZXing) await loadScript(ZXING_URL);
  } catch {
    setStatus("Couldn't load the scanner (offline?). Enter the barcode manually below.");
    return;
  }
  if (!window.ZXing || !window.ZXing.BrowserMultiFormatReader) {
    setStatus("Scanner unavailable — enter the barcode manually below.");
    return;
  }

  const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = window.ZXing;
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8
  ]);
  zxingReader = new BrowserMultiFormatReader(hints);
  setStatus("Scanning…");

  try {
    // Reuse the stream already previewing, so the camera isn't opened twice.
    // Returns void; the reader is what gets reset() on teardown.
    await zxingReader.decodeFromStream(stream, video, (result) => {
      if (result) handleBarcode(result.getText(), dispatchNav);
    });
  } catch {
    setStatus("Scanner couldn't start — enter the barcode manually below.");
  }
}

async function handleBarcode(code, dispatchNav) {
  if (handlingCode) return;
  handlingCode = true;
  stopScan();
  if (navigator.vibrate) navigator.vibrate(40);
  const status = el("scanStatus");
  if (status) status.textContent = `Looking up ${code}…`;
  let result;
  try { result = await api.barcode(code); } catch (err) { toast(`Lookup failed: ${err.message}`); return; }

  if (result.found && result.source === "internal") {
    const detail = await api.bottle(result.bottle.id);
    renderStoreModeResult(detail, dispatchNav);
  } else if (result.found && result.draft) {
    renderDraftForm({ ...result.draft, barcode: code }, dispatchNav, { source: result.source, sourceUrl: result.sourceUrl, confidence: result.confidence });
  } else {
    toast("No match found — add it manually.");
    renderDraftForm({ barcode: code }, dispatchNav);
  }
}

function renderStoreModeResult(detail, dispatchNav) {
  const view = el("view-scan");
  const { bottle, match } = detail;
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Scan another</button>
    <h2>${escapeHtml(bottle.name)}</h2>
    <p class="field-hint">${escapeHtml([bottle.brand, bottle.category].filter(Boolean).join(" · "))} — already in your collection</p>
    ${decisionBannerHtml(match)}
    ${whyConcernsHtml(match)}
    ${bottle.msrp ? `<p style="margin-top:10px"><strong>Typical price:</strong> $${bottle.msrp}</p>` : ""}
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" id="storeLogPourBtn" style="flex:1">Log a Pour</button>
      <button class="btn btn-secondary" id="storeViewBtn">View Bottle</button>
    </div>
  `;
  view.querySelector("[data-action='rescan']").addEventListener("click", () => renderScan(dispatchNav));
  document.getElementById("storeLogPourBtn").addEventListener("click", () => openLogPourSheet(bottle));
  document.getElementById("storeViewBtn").addEventListener("click", () => dispatchNav("bottle", bottle.id));
}

function renderDraftForm(draft, dispatchNav, provenance) {
  draft = draft || {};
  const view = el("view-scan");
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Scan another</button>
    <h2>Confirm Bottle</h2>
    ${provenance ? `<p class="field-hint">Pulled from ${escapeHtml(provenance.source)} (${escapeHtml(provenance.confidence)} confidence) — <a href="${escapeHtml(provenance.sourceUrl || "#")}" target="_blank" rel="noopener">source</a>. Double-check everything below before saving.</p>` : `<p class="field-hint">No external match — fill in what you know. Everything else can be added later.</p>`}
    ${draft.image_url ? `<img src="${escapeHtml(draft.image_url)}" alt="" style="width:100px;border-radius:10px;margin-bottom:10px">` : ""}
    <label>Name</label><input type="text" id="draftName" value="${escapeHtml(draft.name || "")}" placeholder="Bottle name">
    <label>Brand</label><input type="text" id="draftBrand" value="${escapeHtml(draft.brand || "")}">
    <label>Category</label>
    <select id="draftCategory">${CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select>
    <label>Barcode</label><input type="text" id="draftBarcode" value="${escapeHtml(draft.barcode || "")}" readonly>
    ${draft.description ? `<label>Description (from source)</label><textarea id="draftDescription">${escapeHtml(draft.description)}</textarea>` : ""}
    <button class="btn btn-primary btn-block" id="draftSaveBtn" style="margin-top:16px">Save Bottle</button>
  `;
  view.querySelector("[data-action='rescan']").addEventListener("click", () => renderScan(dispatchNav));
  document.getElementById("draftSaveBtn").addEventListener("click", async () => {
    const name = document.getElementById("draftName").value.trim();
    if (!name) { toast("Name is required."); return; }
    try {
      const res = await api.createBottle({
        name,
        brand: document.getElementById("draftBrand").value.trim() || null,
        category: document.getElementById("draftCategory").value,
        barcode: document.getElementById("draftBarcode").value.trim() || null,
        image_url: draft.image_url || null,
        image_source: draft.image_source || null,
        image_confidence: draft.image_confidence || null,
        description: document.getElementById("draftDescription")?.value.trim() || null,
        data_source: provenance ? provenance.source : "manual",
        source_confidence: provenance ? provenance.confidence : "medium",
        status_tags: ["tried"]
      });
      toast("Bottle saved.");
      dispatchNav("bottle", res.bottle.id);
    } catch (err) { toast(`Couldn't save: ${err.message}`); }
  });
}
