import { STATUS_TAGS, categoryLabel, titleize } from "./spirit-taxonomy.js";

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function el(id) { return document.getElementById(id); }

export function formatRating(r) {
  return r == null ? "—" : Number(r).toFixed(1);
}

export function formatDate(d) {
  if (!d) return "Date unknown";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatMoney(n) {
  return n == null ? null : `$${Number(n).toFixed(2)}`;
}

let toastTimer;
export function toast(message) {
  const t = el("toast");
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

export function openSheet(html, { onOpen } = {}) {
  el("sheetContent").innerHTML = html;
  el("sheetBackdrop").classList.add("open");
  el("sheet").classList.add("open");
  document.body.style.overflow = "hidden";
  if (onOpen) onOpen();
}

export function closeSheet() {
  el("sheetBackdrop").classList.remove("open");
  el("sheet").classList.remove("open");
  document.body.style.overflow = "";
}

export function statusPillsHtml(statusTags) {
  const tags = Array.isArray(statusTags) ? statusTags : [];
  const cls = (t) => {
    if (t === "favorite") return "pill-favorite";
    if (t === "dislike" || t === "avoid") return "pill-dislike";
    if (t === "want_to_try" || t === "want_to_buy") return "pill-want";
    if (t === "own") return "pill-own";
    return "pill-neutral";
  };
  return tags.map((t) => `<span class="pill ${cls(t)}">${escapeHtml(STATUS_TAGS.find((s) => s.id === t)?.label || titleize(t))}</span>`).join("");
}

export function matchBadgeHtml(pct, { small = false, label = "MATCH" } = {}) {
  if (pct == null) return "";
  return `<div class="match-badge${small ? " small" : ""}" style="--pct:${pct}"><span class="pct">${pct}%</span><span class="lbl">${label}</span></div>`;
}

export function decisionBannerHtml(match) {
  if (!match) return "";
  const cls = match.decision === "BUY" ? "buy" : match.decision === "TRY A POUR" ? "try" : "skip";
  return `<div class="decision-banner ${cls}"><span>${match.matchPercent}% match — ${escapeHtml(match.decision)}</span><span style="font-size:12px;font-weight:600;opacity:0.75">${escapeHtml(match.confidenceLevel)} confidence</span></div>`;
}

export function whyConcernsHtml(match) {
  if (!match) return "";
  const fits = (match.whyItFits || []).map((f) => `<div>✓ ${escapeHtml(titleize(f.tag))}</div>`).join("");
  const concerns = (match.possibleConcerns || []).map((c) => `<div>⚠ ${escapeHtml(titleize(c.tag))}${c.note ? ` — ${escapeHtml(c.note)}` : ""}</div>`).join("");
  let similar = "";
  if (match.similarToLiked && match.similarToLiked.length) similar += `<p class="field-hint">Similar to bottles you liked: ${match.similarToLiked.map(escapeHtml).join(", ")}</p>`;
  if (match.differentFromDisliked && match.differentFromDisliked.length) similar += `<p class="field-hint">Different from: ${match.differentFromDisliked.map(escapeHtml).join(", ")}</p>`;
  return `
    <div style="font-size:13.5px;display:flex;flex-direction:column;gap:4px;margin-top:10px">
      ${fits}
      ${concerns}
    </div>
    ${similar}
  `;
}

export function bottleThumbHtml(bottle) {
  if (bottle.image_url) return `<img src="${escapeHtml(bottle.image_url)}" alt="${escapeHtml(bottle.name)} bottle" loading="lazy">`;
  return `<span aria-hidden="true">${bottle.category === "wine" ? "🍷" : "🥃"}</span>`;
}

export function bottleCardHtml(bottle) {
  const sub = [bottle.brand, categoryLabel(bottle.category)].filter(Boolean).join(" · ");
  return `
    <article class="bottle-card" data-open-bottle="${bottle.id}" tabindex="0" role="button" aria-label="${escapeHtml(bottle.name)}">
      <div class="thumb">
        ${bottleThumbHtml(bottle)}
        ${bottle.palate_match != null ? `<span class="match-pill">${bottle.palate_match}%</span>` : ""}
      </div>
      <div class="body">
        <div class="name">${escapeHtml(bottle.name)}</div>
        <div class="sub">${escapeHtml(sub)}</div>
        <div class="meta-row">
          <span>${bottle.avg_rating != null ? `★ ${formatRating(bottle.avg_rating)}` : "Not rated"}</span>
          ${(bottle.status_tags || []).includes("favorite") ? '<span title="Favorite">❤️</span>' : ""}
        </div>
      </div>
    </article>
  `;
}

export function bottleRowHtml(bottle) {
  const sub = [bottle.brand, categoryLabel(bottle.category)].filter(Boolean).join(" · ");
  return `
    <div class="bottle-row" data-open-bottle="${bottle.id}" tabindex="0" role="button" aria-label="${escapeHtml(bottle.name)}">
      <div class="thumb-sm">${bottleThumbHtml(bottle)}</div>
      <div class="info">
        <div class="name">${escapeHtml(bottle.name)}</div>
        <div class="sub">${escapeHtml(sub)}</div>
      </div>
      ${bottle.palate_match != null ? matchBadgeHtml(bottle.palate_match, { small: true }) : ""}
    </div>
  `;
}

export function flavorTagPickerHtml(allTags, selected = []) {
  const byCategory = {};
  for (const t of allTags) { (byCategory[t.category] = byCategory[t.category] || []).push(t); }
  return Object.entries(byCategory).map(([cat, tags]) => `
    <div class="tag-group-label">${escapeHtml(titleize(cat))}</div>
    <div class="tag-cloud">
      ${tags.map((t) => `<button type="button" class="tag-chip${selected.includes(t.name) ? " selected" : ""}" data-toggle-tag="${t.name}">${escapeHtml(titleize(t.name))}</button>`).join("")}
    </div>
  `).join("");
}

export function ratingPickerHtml(selected) {
  const values = [];
  for (let v = 0; v <= 10; v += 0.5) values.push(v);
  return `<div class="rating-picker">${values.map((v) => `<button type="button" data-rating="${v}" class="${selected === v ? "selected" : ""}">${v.toFixed(1)}</button>`).join("")}</div>`;
}

export function emptyStateHtml(icon, title, body, actionHtml = "") {
  return `<div class="empty-state"><div class="ee-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>${actionHtml}</div>`;
}
