import { api, downscaleImage } from "./api.js";
import { el, escapeHtml, decisionBannerHtml, whyConcernsHtml, toast, matchBadgeHtml, bottleThumbHtml } from "./ui.js";
import { CATEGORIES } from "./spirit-taxonomy.js";
import { openLogPourSheet } from "./log-pour.js";
import { parseBarcode } from "./barcode.js";

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
    <div class="add-flow-heading"><span class="eyebrow">BUILD YOUR POUR PROFILE</span><h2>Add & rate a drink</h2><p>Find your bottle, then choose Bad, OK, Like or Love.</p><div class="flow-steps"><span class="active">01 · Find drink</span><span>02 · Your reaction</span></div></div>
    <div class="add-methods">
      <button class="btn btn-primary" id="chooseManual">Manual</button>
      <button class="btn btn-secondary" id="chooseBarcode">Barcode</button>
      <button class="btn btn-secondary" id="chooseLabel">Label photo</button>
    </div>
    <label class="add-intent"><input type="checkbox" id="rateAfterAdd" checked> React to this drink after adding <span>Bad / OK / Like / Love</span></label>
    <div id="labelPanel" hidden><label>Photograph or upload one bottle label</label>
      <input id="labelPhoto" type="file" accept="image/*" capture="environment">
      <p id="labelStatus" class="field-hint">We’ll read the label, then let you confirm the drink.</p></div>
    <div id="manualPanel"><label style="margin-top:0">Find a drink in the database</label>
    <input type="search" id="catalogSearch" placeholder="Type any bottle name…" autocomplete="off">
    <button class="btn btn-secondary btn-block" id="webResearchBtn" style="margin-top:8px">Search the web for this bottle</button>
    <p id="webResearchStatus" class="field-hint" role="status">Find sourced details and a bottle image, then review before saving.</p>
    <div id="catalogResults"></div>
    <p class="field-hint" style="margin-top:10px">We'll check the reference catalog as you type — but you're not limited to it. Curated ratings cover 10 publishers across the catalog. Scores apply only to the listed bottle and vintage. Anything not listed can be added manually.</p>
    <button class="btn btn-primary btn-block" id="manualNewTopBtn" style="margin-top:10px">✍️ Add a bottle myself</button>

    </div><details style="margin-top:14px" id="barcodePanel" hidden>
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
    <div id="scanResult"></div>
  `;

  document.getElementById("manualNewTopBtn").addEventListener("click", () => renderDraftForm(null, dispatchNav, null, document.getElementById("rateAfterAdd").checked));

  document.getElementById("manualBarcodeBtn").addEventListener("click", () => {
    const code = document.getElementById("manualBarcode").value.trim();
    if (code) handleBarcode(code, dispatchNav, { manual: true });
  });
  document.getElementById("manualBarcode").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const code = e.target.value.trim();
      if (code) handleBarcode(code, dispatchNav, { manual: true });
    }
  });

  document.getElementById("chooseManual").onclick = () => { stopScan(); document.getElementById("manualPanel").hidden = false; document.getElementById("labelPanel").hidden = true; document.getElementById("barcodePanel").open = false; document.getElementById("barcodePanel").hidden = true; };
  document.getElementById("chooseBarcode").onclick = () => { document.getElementById("manualPanel").hidden = true; document.getElementById("labelPanel").hidden = true; const panel = document.getElementById("barcodePanel"); panel.hidden = false; panel.open = true; };
  document.getElementById("chooseLabel").onclick = () => { stopScan(); document.getElementById("manualPanel").hidden = true; document.getElementById("barcodePanel").open = false; document.getElementById("barcodePanel").hidden = true; document.getElementById("labelPanel").hidden = false; };
  document.getElementById("labelPhoto").onchange = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const status = document.getElementById("labelStatus"); status.textContent = "Reading the label…";
    try {
      const imageDataUrl = await downscaleImage(file, 1600, .85);
      const result = await api.analyzeImage({ imageDataUrl, mimeType: "image/jpeg" });
      if (!result.brand && !result.expression) throw new Error("No drink identified. Try a clearer label or use Manual.");
      renderDraftForm({ name: [result.brand, result.expression].filter(Boolean).join(" "), brand: result.brand, category: result.category }, dispatchNav, null, document.getElementById("rateAfterAdd").checked);
    } catch (err) { status.textContent = `${err.message} You can still add this drink using Manual.`; }
  };
  document.getElementById("webResearchBtn").onclick = async () => {
    const q = document.getElementById("catalogSearch").value.trim();
    if(q.length < 3) { toast("Enter the brand and bottle name first."); return; }
    const btn=document.getElementById("webResearchBtn"), status=document.getElementById("webResearchStatus");
    btn.disabled=true; status.textContent="Searching sources and finding a matching image…";
    try {
      const result=await api.researchBottle(q);
      if(!btn.isConnected) return;
      if(!result.found) { status.textContent=result.message; return; }
      renderDraftForm({...result.draft,research_id:result.research_id,image_note:result.image_note},dispatchNav,{source:"web research",confidence:"medium",sourceUrl:result.sources[0].url},document.getElementById("rateAfterAdd").checked);
    } catch(err) { if(status.isConnected) status.textContent=err.message; }
    finally { btn.disabled=false; }
  };
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
      try { res = await api.drinkSearch(q); } catch { results.innerHTML = `<p class="field-hint">Search unavailable offline.</p>`; return; }
      if (input.value.trim() !== q || !results.isConnected) return;
      const rows = res.results || [];
      results.innerHTML = rows.length ? rows.map((r) => `
        <div class="bottle-row" data-adopt='${escapeHtml(JSON.stringify({ id: r.id, name: r.name, kind: r.kind }))}'>
          <div class="thumb-sm">${bottleThumbHtml(r)}</div>
          <div class="info">
            <div class="name">${escapeHtml(r.name)}</div>
            <div class="sub">${escapeHtml([r.kind === "kansas" ? null : r.producer, r.region, r.proof ? r.proof + " proof" : null, r.kind === "kansas" && r.vintage ? r.vintage : null].filter(Boolean).join(" · "))}</div>
          </div>
          ${r.kind === "reference" ? `<span class="field-hint">${r.ratings.length} sourced rating${r.ratings.length === 1 ? "" : "s"}</span>` : ""}
          ${r.kind === "kansas" ? `<span class="field-hint" title="${escapeHtml((r.distributors || []).join(", "))}">${r.store_pick ? "Store pick · " : ""}Sold in KS</span>` : ""}
          ${r.jd_fit != null ? `<div style="text-align:right"><div style="font-weight:800;color:var(--accent-deep)">${r.jd_fit}</div><div class="field-hint" style="font-size:10px">${escapeHtml(r.fit_label || "")}</div></div>` : ""}
        </div>`).join("") : `<p class="field-hint">Not in the database — that's fine. Tap “Add a bottle myself” to enter it.</p>`;
    }, 220);
  });

  results.addEventListener("click", async (e) => {
    const row = e.target.closest("[data-adopt]");
    if (!row) return;
    const { id, name, kind } = JSON.parse(row.dataset.adopt);
    try {
      const res = await api.drinkAdopt({ id, kind });
      toast(res.already_present ? `${name} is already in your collection.` : `Added ${name} to Want to Try.`);
      const shouldRate = document.getElementById("rateAfterAdd")?.checked;
      await dispatchNav("bottle", res.bottle_id);
      if (shouldRate) { const detail = await api.bottle(res.bottle_id); await openLogPourSheet(detail.bottle, { fromAdd:true }); }
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

async function handleBarcode(code, dispatchNav, { manual = false } = {}) {
  if (handlingCode) return;
  // A camera misread fails the checksum; keep scanning silently. A typed code gets told why.
  const check = parseBarcode(code);
  if (!check.ok) { if (manual) toast(check.error); return; }
  handlingCode = true;
  const shouldRate = document.getElementById("rateAfterAdd")?.checked ?? true;
  stopScan();
  if (navigator.vibrate) navigator.vibrate(40);
  const status = el("scanStatus");
  if (status) status.textContent = `Looking up ${code}…`;
  let result;
  try { result = await api.barcodeLookup(check.normalized); } catch (err) { handlingCode = false; toast(`Lookup failed: ${err.message}`); return; }
  await showBarcodeResult(check.normalized, result, dispatchNav, shouldRate);
}

// Every outcome of a lookup ends somewhere useful: a known bottle, a catalog item to
// add, an external product to confirm, or (unknown) a choice between adding it as new
// and linking the code to a bottle that already exists.
async function showBarcodeResult(code, result, dispatchNav, shouldRate) {
  if (result.match === "bottle" && result.bottle) {
    const detail = await api.bottle(result.bottle.id);
    if (shouldRate) { await dispatchNav("bottle", detail.bottle.id); await openLogPourSheet(detail.bottle, { fromAdd: true }); } else renderStoreModeResult(detail, dispatchNav);
  } else if (result.match === "catalog" && result.catalog) {
    renderCatalogMatch(code, result, dispatchNav, shouldRate);
  } else if (result.match === "product" && result.product) {
    const p = result.product;
    renderDraftForm({ name: p.name, brand: p.brand, image_url: p.image_url, image_source: "barcode_api", image_confidence: "low", barcode: code },
      dispatchNav, { source: result.source, sourceUrl: result.sourceUrl, confidence: result.confidence }, shouldRate, { offerLink: true });
  } else {
    renderUnknownBarcode(code, result, dispatchNav, shouldRate);
  }
}

function renderCatalogMatch(code, result, dispatchNav, shouldRate) {
  const view = el("view-scan");
  const rec = result.catalog;
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Add Drink</button>
    <span class="eyebrow">BARCODE ${escapeHtml(code)}</span>
    <h2>${escapeHtml(rec.name)}</h2>
    <p class="field-hint">${escapeHtml([rec.producer, rec.category, rec.proof ? rec.proof + " proof" : null].filter(Boolean).join(" · "))} — matched from the reference catalog.</p>
    ${rec.summary ? `<p>${escapeHtml(rec.summary)}</p>` : ""}
    <button class="btn btn-primary btn-block" id="barcodeAdoptBtn" style="margin-top:16px">Add to my bottles</button>
  `;
  view.querySelector("[data-action='rescan']").addEventListener("click", () => renderScan(dispatchNav));
  document.getElementById("barcodeAdoptBtn").addEventListener("click", async () => {
    try {
      const res = await api.drinkAdopt({ id: rec.id, kind: "catalog" });
      toast(res.already_present ? `${rec.name} is already in your collection.` : `Added ${rec.name} to Want to Try.`);
      await dispatchNav("bottle", res.bottle_id);
      if (shouldRate) { const detail = await api.bottle(res.bottle_id); await openLogPourSheet(detail.bottle, { fromAdd: true }); }
    } catch (err) { toast(`Couldn't add: ${err.message}`); }
  });
}

function renderUnknownBarcode(code, result, dispatchNav, shouldRate) {
  const view = el("view-scan");
  const unavailable = result.lookup === "unavailable";
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Add Drink</button>
    <span class="eyebrow">BARCODE ${escapeHtml(code)}</span>
    <h2>New barcode</h2>
    <p class="field-hint">${unavailable ? "The product lookup is unavailable right now, so this code couldn't be checked." : "We don't have this code yet."} Add it as a new bottle, or link it to a bottle you already know — either way it will be recognised next time.</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
      <button class="btn btn-primary btn-block" id="barcodeNewBtn">Add to my bottles</button>
      <button class="btn btn-secondary btn-block" id="barcodeLinkBtn">Link this barcode to a bottle</button>
    </div>
  `;
  view.querySelector("[data-action='rescan']").addEventListener("click", () => renderScan(dispatchNav));
  document.getElementById("barcodeNewBtn").addEventListener("click", () => renderDraftForm({ barcode: code }, dispatchNav, null, shouldRate));
  document.getElementById("barcodeLinkBtn").addEventListener("click", () => renderLinkPicker(code, dispatchNav, shouldRate));
}

function renderLinkPicker(code, dispatchNav, shouldRate) {
  const view = el("view-scan");
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Add Drink</button>
    <span class="eyebrow">BARCODE ${escapeHtml(code)}</span>
    <h2>Link to a bottle</h2>
    <p class="field-hint">Search for the bottle this barcode belongs to.</p>
    <input type="text" id="linkSearch" placeholder="Search bottles and the catalog" autocomplete="off">
    <div id="linkResults" style="margin-top:10px"></div>
  `;
  view.querySelector("[data-action='rescan']").addEventListener("click", () => renderScan(dispatchNav));
  const input = document.getElementById("linkSearch");
  const results = document.getElementById("linkResults");
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value.trim();
      if (q.length < 2) { results.innerHTML = ""; return; }
      let res;
      try { res = await api.drinkSearch(q); } catch { results.innerHTML = `<p class="field-hint">Search unavailable offline.</p>`; return; }
      if (input.value.trim() !== q || !results.isConnected) return;
      const rows = res.results || [];
      results.innerHTML = rows.length ? rows.map((r) => `
        <div class="bottle-row" data-link='${escapeHtml(JSON.stringify({ id: r.id, name: r.name, kind: r.kind }))}'>
          <div class="thumb-sm">${bottleThumbHtml(r)}</div>
          <div class="info"><div class="name">${escapeHtml(r.name)}</div>
            <div class="sub">${escapeHtml([r.producer, r.kind === "bottle" ? "in your bottles" : "catalog"].filter(Boolean).join(" · "))}</div></div>
        </div>`).join("") : `<p class="field-hint">No matches. Go back and add it as a new bottle instead.</p>`;
    }, 220);
  });
  results.addEventListener("click", async (e) => {
    const row = e.target.closest("[data-link]");
    if (!row || row.dataset.busy) return;
    row.dataset.busy = "1";
    const { id, name, kind } = JSON.parse(row.dataset.link);
    try {
      let payload;
      if (kind === "bottle") payload = { barcode: code, bottle_id: id };
      else if (kind === "catalog") payload = { barcode: code, catalog_id: id };
      else payload = { barcode: code, bottle_id: (await api.drinkAdopt({ id, kind })).bottle_id };
      try { await api.saveBarcode(payload); }
      catch (err) {
        if (err.status !== 409 || !confirm("This barcode is already linked to a different bottle. Replace that link?")) throw err;
        await api.saveBarcode({ ...payload, replace: true });
      }
      toast(`Barcode linked to ${name}.`);
      await showBarcodeResult(code, await api.barcodeLookup(code), dispatchNav, shouldRate);
    } catch (err) { delete row.dataset.busy; toast(`Couldn't link: ${err.message}`); }
  });
}

function renderStoreModeResult(detail, dispatchNav) {
  const view = el("view-scan");
  const { bottle, match } = detail;
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Add Drink</button>
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

export function renderDraftForm(draft, dispatchNav, provenance, shouldRate = true, { offerLink = false } = {}) {
  draft = draft || {};
  const view = el("view-scan");
  view.innerHTML = `
    <button class="btn-ghost" data-action="rescan" style="padding-left:0">← Add Drink</button>
    <span class="eyebrow">STEP 01 · FIND DRINK</span><h2>Confirm your drink</h2>
    ${provenance ? `<p class="field-hint">Pulled from ${escapeHtml(provenance.source)} (${escapeHtml(provenance.confidence)} confidence) — <a href="${escapeHtml(provenance.sourceUrl || "#")}" target="_blank" rel="noopener">source</a>. Double-check everything below before saving.</p>` : `<p class="field-hint">No external match — fill in what you know. Everything else can be added later.</p>`}
    ${draft.image_url ? `<img src="${escapeHtml(draft.image_url)}" alt="" style="width:100px;border-radius:10px;margin-bottom:10px">` : ""}
    ${draft.research_id ? `<p class="field-hint">${escapeHtml(draft.image_note)}</p>${draft.image_url ? `<label><input type="checkbox" id="saveResearchImage" checked> Save this bottle image</label>` : ""}<p class="field-hint">${escapeHtml([draft.expression,draft.origin_country,draft.origin_state,draft.age_statement,draft.proof ? draft.proof + " proof" : null,draft.abv ? draft.abv + "% ABV" : null,draft.mash_bill,draft.barrel_finish].filter(Boolean).join(" · "))}</p>` : ""}
    ${draft.sources ? `<div class="field-hint">Sources: ${draft.sources.map(s=>`<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a>`).join(" · ")}</div>` : ""}
    <label>Name</label><input type="text" id="draftName" value="${escapeHtml(draft.name || "")}" placeholder="Bottle name">
    <label>Brand</label><input type="text" id="draftBrand" value="${escapeHtml(draft.brand || "")}">
    <label>Category</label>
    <select id="draftCategory">${draft.category === "unknown" ? `<option value="" selected>Choose category</option>` : ""}${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === draft.category ? "selected" : ""}>${c.label}</option>`).join("")}</select>
    <label>Barcode</label><input type="text" id="draftBarcode" value="${escapeHtml(draft.barcode || "")}" readonly>
    ${draft.description ? `<label>Description (from source)</label><textarea id="draftDescription">${escapeHtml(draft.description)}</textarea>` : ""}
    <button class="btn btn-primary btn-block" id="draftSaveBtn" style="margin-top:16px">${shouldRate ? "Continue to Bad / OK / Like / Love →" : "Save to collection"}</button>
    ${offerLink && draft.barcode ? `<button class="btn btn-secondary btn-block" id="draftLinkBtn" style="margin-top:8px">This is a bottle I already have — link barcode</button>` : ""}
  `;
  document.getElementById("draftLinkBtn")?.addEventListener("click", () => renderLinkPicker(draft.barcode, dispatchNav, shouldRate));
  view.querySelector("[data-action='rescan']").addEventListener("click", () => renderScan(dispatchNav));
  document.getElementById("draftSaveBtn").addEventListener("click", async () => {
    const name = document.getElementById("draftName").value.trim();
    if (!name) { toast("Name is required."); return; }
    if (!document.getElementById("draftCategory").value) { toast("Choose a category."); return; }
    const saveBtn=document.getElementById("draftSaveBtn");
    saveBtn.disabled=true;
    try {
      if(draft.research_id) {
        const result=await api.adoptResearch({research_id:draft.research_id,name,brand:document.getElementById("draftBrand").value.trim(),category:document.getElementById("draftCategory").value,description:document.getElementById("draftDescription")?.value.trim() || "",save_image:document.getElementById("saveResearchImage")?.checked !== false});
        toast(result.image_saved ? "Bottle and image saved." : result.image_expected ? "Bottle saved. Image was not replaced or could not be saved." : "Bottle saved.");
        await dispatchNav("bottle",result.bottle_id);
        if(shouldRate) { const detail=await api.bottle(result.bottle_id); await openLogPourSheet(detail.bottle,{fromAdd:true}); }
        return;
      }
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
        status_tags: ["want_to_try"]
      });
      toast("Bottle saved.");
      // Remember the code so the next scan of this product resolves instantly.
      const code = document.getElementById("draftBarcode").value.trim();
      if (code) await api.saveBarcode({ barcode: code, bottle_id: res.bottle.id, product_name: draft.name || null, brand: draft.brand || null, image_url: draft.image_url || null }).catch(() => {});
      await dispatchNav("bottle", res.bottle.id);
      if (shouldRate) await openLogPourSheet(res.bottle, { fromAdd:true });
    } catch (err) { toast(`Couldn't save: ${err.message}`); } finally { saveBtn.disabled=false; }
  });
}
