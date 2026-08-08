import { api } from "./api.js";
import { el, escapeHtml, decisionBannerHtml, whyConcernsHtml, toast, matchBadgeHtml } from "./ui.js";
import { CATEGORIES } from "./spirit-taxonomy.js";
import { openLogPourSheet } from "./log-pour.js";

let stream = null;
let detectLoop = null;

export async function renderScan(dispatchNav) {
  const view = el("view-scan");
  view.innerHTML = `
    <p class="field-hint">Point your camera at the barcode, or enter it manually.</p>
    <div class="scan-frame" id="scanFrame">
      <video id="scanVideo" playsinline muted></video>
      <div class="scan-reticle"></div>
    </div>
    <div id="scanStatus" class="field-hint" style="margin-top:8px">Starting camera…</div>
    <div class="field-row" style="margin-top:14px">
      <input type="text" id="manualBarcode" inputmode="numeric" placeholder="Enter barcode manually">
      <button class="btn btn-secondary" id="manualBarcodeBtn">Look Up</button>
    </div>
    <button class="btn btn-ghost btn-block" id="manualNewBtn" style="margin-top:6px">Skip scanning — add bottle manually</button>
    <div id="scanResult"></div>
  `;

  document.getElementById("manualBarcodeBtn").addEventListener("click", () => {
    const code = document.getElementById("manualBarcode").value.trim();
    if (code) handleBarcode(code, dispatchNav);
  });
  document.getElementById("manualNewBtn").addEventListener("click", () => renderDraftForm(null, dispatchNav));

  await startCamera(dispatchNav);
}

export function stopScan() {
  if (detectLoop) cancelAnimationFrame(detectLoop);
  detectLoop = null;
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

async function startCamera(dispatchNav) {
  const status = el("scanStatus");
  if (!("BarcodeDetector" in window)) {
    status.textContent = "Camera scanning isn't supported in this browser — use manual entry below.";
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const video = document.getElementById("scanVideo");
    if (!video) return;
    video.srcObject = stream;
    await video.play();
    status.textContent = "Scanning…";
    const detector = new BarcodeDetector({ formats: ["upc_a", "upc_e", "ean_13", "ean_8"] });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let busy = false;
    const tick = async () => {
      if (!stream) return;
      if (!busy && video.videoWidth) {
        busy = true;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        try {
          const codes = await detector.detect(canvas);
          if (codes.length) { stopScan(); handleBarcode(codes[0].rawValue, dispatchNav); return; }
        } catch { /* keep scanning */ }
        busy = false;
      }
      detectLoop = requestAnimationFrame(tick);
    };
    detectLoop = requestAnimationFrame(tick);
  } catch (err) {
    status.textContent = "Couldn't access the camera — use manual entry below.";
  }
}

async function handleBarcode(code, dispatchNav) {
  stopScan();
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
