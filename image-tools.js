// Driver UI for bottle-photo enrichment.
//
// All the network work happens in the Worker — the phone only kicks off small
// batches and renders progress, because a single Worker invocation can't do
// hundreds of paced third-party lookups inside its subrequest budget.
//
// The important behaviour here is what it does NOT do: a bottle whose best
// candidate scored below the auto-accept threshold is surfaced for confirmation
// rather than quietly adopted. Showing the wrong expression is worse than
// showing no photo, so a weak match always waits for a human.

import { api } from "./api.js";
import { escapeHtml, toast } from "./ui.js";

let running = false;

export function imagesCardHtml() {
  return `
    <div class="section-title"><h2>Bottle Photos</h2></div>
    <div class="card" id="imagesCard">
      <p class="field-hint">Your bottles and the reference catalog both shipped without photos. This looks each one up in Open Food Facts and only keeps a photo when the product name matches that exact expression — anything less certain waits for you to confirm it.</p>
      <div id="imagesStatus" style="margin-top:10px"><p class="field-hint">Checking…</p></div>
      <label for="imagesScope" style="margin-top:12px">What to look up</label>
      <select id="imagesScope">
        <option value="visible">Your bottles + recommended picks</option>
        <option value="all">Everything, including the full reference catalog</option>
      </select>
      <p class="field-hint" style="margin-top:6px">Paced to about 10 lookups a minute, which is what Open Food Facts asks for. Keep this screen open while it runs. You can stop any time — finished bottles are saved, so it picks up where it left off.</p>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" data-action="images-run">Find bottle photos</button>
        <button class="btn btn-secondary btn-sm" data-action="images-stop" hidden>Stop</button>
        <button class="btn btn-secondary btn-sm" data-action="images-review">Review unmatched</button>
      </div>
      <div id="imagesReview"></div>
    </div>`;
}

function progressHtml(s) {
  const attempted = (s.ok || 0) + (s.needs_review || 0) + (s.failed || 0);
  const pct = s.total ? Math.round((attempted / s.total) * 100) : 0;
  return `
    <div style="height:8px;border-radius:999px;background:var(--paper-sunk);overflow:hidden">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent-deep))"></div>
    </div>
    <p class="field-hint" style="margin-top:6px">
      <strong>${s.ok || 0}</strong> photo${(s.ok || 0) === 1 ? "" : "s"} found ·
      ${s.needs_review || 0} need${(s.needs_review || 0) === 1 ? "s" : ""} your eye ·
      ${s.failed || 0} nothing found ·
      ${s.remaining || 0} not checked yet
      <span style="opacity:.75">(${s.bottles || 0} of your bottles, ${s.catalog || 0} catalog entries)</span>
    </p>`;
}

function currentScope(root) {
  const sel = root.querySelector("#imagesScope");
  return sel ? sel.value : "visible";
}

async function refreshStatus(root) {
  const box = root.querySelector("#imagesStatus");
  if (!box) return null;
  try {
    const s = await api.imageStatus(currentScope(root));
    box.innerHTML = progressHtml(s);
    return s;
  } catch {
    box.innerHTML = `<p class="field-hint">Couldn't read photo status — you may be offline.</p>`;
    return null;
  }
}

async function runEnrichment(root) {
  const runBtn = root.querySelector("[data-action='images-run']");
  const stopBtn = root.querySelector("[data-action='images-stop']");
  running = true;
  runBtn.disabled = true;
  runBtn.textContent = "Looking…";
  stopBtn.hidden = false;

  const scope = currentScope(root);
  let processedTotal = 0;
  let stopped = false;
  try {
    while (running) {
      const res = await api.enrichImages({ limit: 6, scope });
      processedTotal += res.processed;
      root.querySelector("#imagesStatus").innerHTML = progressHtml(res.status);
      // `processed === 0` means the queue is drained, not that something broke.
      if (!res.processed) break;
    }
    stopped = !running;
    toast(stopped ? `Stopped after ${processedTotal} bottles` : `Done — checked ${processedTotal} bottles`);
  } catch (err) {
    toast(err.message || "Photo lookup failed");
  } finally {
    running = false;
    runBtn.disabled = false;
    runBtn.textContent = "Find bottle photos";
    stopBtn.hidden = true;
    await refreshStatus(root);
  }
}

async function renderReview(root) {
  const box = root.querySelector("#imagesReview");
  box.innerHTML = `<p class="field-hint" style="margin-top:12px">Loading…</p>`;
  let items = [];
  try {
    ({ items } = await api.imageReview());
  } catch (err) {
    box.innerHTML = `<p class="field-hint" style="margin-top:12px">${escapeHtml(err.message || "Couldn't load the review list")}</p>`;
    return;
  }
  if (!items.length) {
    box.innerHTML = `<p class="field-hint" style="margin-top:12px">Nothing waiting on you.</p>`;
    return;
  }

  box.innerHTML = `
    <p class="field-hint" style="margin-top:14px">${items.length} bottle${items.length === 1 ? "" : "s"} where nothing was a confident match. Tap a photo only if it's the right expression — the percentage is how close the product name was, not proof.</p>
    ${items.map((it) => `
      <div style="border-top:1px solid var(--border-soft);padding:12px 0">
        <div style="font-size:14px;font-weight:600">${escapeHtml(it.name)}${it.kind === "catalog" ? ` <span class="field-hint" style="font-weight:400">· catalog</span>` : ""}</div>
        <div class="field-hint">${escapeHtml(it.producer || "")}${it.reason ? ` — ${escapeHtml(it.reason)}` : ""}</div>
        ${it.candidates.length ? `
          <div style="display:flex;gap:8px;overflow-x:auto;padding:10px 0">
            ${it.candidates.map((c) => `
              <button type="button" class="candidate-chip" data-kind="${escapeHtml(it.kind)}" data-id="${escapeHtml(it.id)}" data-url="${escapeHtml(c.url)}" title="${escapeHtml(c.label || c.url)}">
                <img src="${escapeHtml(c.url)}" alt="${escapeHtml(c.label || "")}" loading="lazy" referrerpolicy="no-referrer">
                <span>${Math.round((c.score || 0) * 100)}%</span>
              </button>`).join("")}
          </div>` : `<p class="field-hint" style="margin-top:6px">No candidate photos were found for this bottle.</p>`}
        ${it.source_page ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(it.source_page)}" target="_blank" rel="noopener noreferrer">Open source</a>` : ""}
      </div>`).join("")}`;

  // A candidate whose thumbnail won't load is a candidate you can't judge, so
  // it's disabled rather than left as a blank square inviting a blind tap.
  box.querySelectorAll(".candidate-chip img").forEach((img) => {
    img.addEventListener("error", () => {
      const chip = img.closest(".candidate-chip");
      chip.disabled = true;
      img.remove();
      chip.querySelector("span").textContent = "unavailable";
    });
  });

  box.querySelectorAll(".candidate-chip").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api.acceptImage({ kind: btn.dataset.kind, id: btn.dataset.id, image_url: btn.dataset.url });
        toast("Photo saved");
        await refreshStatus(root);
        await renderReview(root);
      } catch (err) {
        btn.disabled = false;
        toast(err.message || "Couldn't save that photo");
      }
    });
  });
}

export function wireImagesCard(root) {
  const card = root.querySelector("#imagesCard");
  if (!card) return;
  refreshStatus(root);
  card.querySelector("#imagesScope").addEventListener("change", () => refreshStatus(root));
  card.querySelector("[data-action='images-run']").addEventListener("click", () => runEnrichment(root));
  card.querySelector("[data-action='images-stop']").addEventListener("click", () => { running = false; });
  card.querySelector("[data-action='images-review']").addEventListener("click", () => renderReview(root));
}
