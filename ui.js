import { personalRating } from "./personal-ranking.js";
import { withBottleImage } from "./bottle-images.js";
import { STATUS_TAGS, categoryLabel, titleize } from "./spirit-taxonomy.js";

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function el(id) { return document.getElementById(id); }

export function formatRating(r) {
  return r == null ? "—" : VERDICTS.reduce((best,v)=>Math.abs(v.rating-Number(r))<Math.abs(best.rating-Number(r))?v:best).label;
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
  el("sheet").scrollTop = 0;
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
  bottle = withBottleImage(bottle);
  if (bottle.image_url) return `<img src="${escapeHtml(bottle.image_url)}" alt="${escapeHtml(bottle.name)} bottle" loading="lazy" decoding="async">`;
  return `<div class="photo-placeholder"><svg viewBox="0 0 32 64" aria-hidden="true"><path d="M12 3h8v17l6 9v29H6V29l6-9V3Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 36h12v14H10z" fill="none" stroke="currentColor"/></svg><span>Photo pending</span></div>`;
}

export function bottleCardHtml(bottle) {
  const sub = [bottle.brand, categoryLabel(bottle.category)].filter(Boolean).join(" · ");
  const rating = personalRating(bottle);
  return `
    <article class="bottle-card" data-open-bottle="${bottle.id}" tabindex="0" role="button" aria-label="${escapeHtml(bottle.name)}">
      <div class="thumb">
        ${bottleThumbHtml(bottle)}
        ${rating != null ? `<span class="match-pill">${formatRating(rating)}</span>` : bottle.palate_match != null ? `<span class="match-pill">Est. fit ${bottle.palate_match}%</span>` : ""}
      </div>
      <div class="body">
        <div class="name">${escapeHtml(bottle.name)}</div>
        <div class="sub">${escapeHtml(sub)}</div>
        <div class="meta-row">
          <span>${bottle.external_review_score != null ? `Reviews: ${Math.round(bottle.external_review_score)}/100 · ` : ""}${rating != null ? `You: ${formatRating(rating)}` : "Not rated"}</span>
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

// Rating in the moment is a gut reaction, not an arithmetic exercise. Five large
// targets beat twenty-one small ones when you're one-handed in a dim bar, and
// each verdict carries the status tag too, so a single tap answers both
// "how good was it" and "would you have it again".
export const VERDICTS = [
  { id: "bad", icon: "😕", label: "Bad", rating: 2, status: "dislike", tone: "skip" },
  { id: "ok", icon: "😐", label: "OK", rating: 6, status: "neutral", tone: "try" },
  { id: "like", icon: "🙂", label: "Like", rating: 7.5, status: "like", tone: "buy" },
  { id: "love", icon: "❤️", label: "Love", rating: 9, status: "favorite", tone: "buy" }
];

export function verdictPickerHtml(selected = null) {
  return `
    <div class="verdict-row" role="radiogroup" aria-label="How was it?">
      ${VERDICTS.map((v) => `
        <button type="button" class="verdict${selected === v.id ? " selected" : ""}" data-verdict="${v.id}"
                role="radio" aria-checked="${selected === v.id}" aria-label="${escapeHtml(v.label)}">
          <span class="verdict-icon" aria-hidden="true">${v.icon}</span>
          <span class="verdict-label">${escapeHtml(v.label)}</span>
        </button>`).join("")}
    </div>
    `;
}

/** Legacy precise picker, still used where a considered rating makes sense. */
export function ratingPickerHtml(selected) {
  const values = [];
  for (let v = 0; v <= 10; v += 0.5) values.push(v);
  return `<div class="rating-picker">${values.map((v) => `<button type="button" data-rating="${v}" class="${selected === v ? "selected" : ""}">${v.toFixed(1)}</button>`).join("")}</div>`;
}

/** Placeholder blocks shown while a view's data loads, in place of a bare "Loading…" line. */
export function skeletonHtml(rows = 3) {
  return `<div class="skeleton-list" role="status" aria-label="Loading">${Array.from({ length: rows }, () => `<div class="skeleton-block"></div>`).join("")}</div>`;
}

/** Shown when a view's data could not be fetched; the button re-renders the current view. */
export function errorStateHtml(message = "Couldn't load this right now. Check your connection and try again.") {
  return `<div class="empty-state" role="alert"><div class="ee-icon">📡</div><h3>Can't reach the server</h3><p>${escapeHtml(message)}</p><button type="button" class="btn btn-secondary" data-action="retry-view">Try again</button></div>`;
}

export function emptyStateHtml(icon, title, body, actionHtml = "") {
  return `<div class="empty-state"><div class="ee-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>${actionHtml}</div>`;
}

// ---------- cited expert notes (producer + critics) ----------
const safeUrl = (u) => (typeof u === "string" && /^https?:\/\//.test(u) ? u : null);
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const NOTE_CONFIDENCE = {
  high: "Producer notes and critic reviews",
  medium: "One source type found",
  low: "Thin sourcing — retailer text only"
};

function noteRowsHtml(n) {
  const rows = [["Nose", n.nose], ["Palate", n.palate], ["Finish", n.finish]].filter(([, v]) => v);
  return rows.length ? `<dl class="note-rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join("")}</dl>` : "";
}

/** Small summary used on list cards: critic score + the sources' top descriptors. */
export function expertChipsHtml(brief) {
  if (!brief) return "";
  const score = brief.critic_avg != null
    ? `<span class="critic-chip" title="Average of ${brief.critic_avg_n} critic score${brief.critic_avg_n === 1 ? "" : "s"} on a 100-point scale">Critics ${brief.critic_avg}</span>` : "";
  const terms = (brief.flavor_terms || []).slice(0, 5).map((t) => `<span class="note-term">${escapeHtml(t)}</span>`).join("");
  return score || terms ? `<div class="expert-chips">${score}${terms}</div>` : "";
}

/**
 * Full notes block for a bottle page or detail sheet.
 * @param expert  { producer, critics, facts, flavor_terms, confidence, caveat }
 * @param match   { reasons, concerns } from explainFromNotes, optional
 */
export function expertNotesHtml(expert, match = null) {
  if (!expert || expert.confidence === "none") return "";
  const p = expert.producer;
  const producerHtml = p ? `
    <div class="note-block">
      <div class="note-head"><strong>${/\b(retailer|via|relayed|importer|distributor)\b/i.test(p.summary || "") || expert.confidence === "low" ? "Producer notes (as relayed by a retailer)" : "From the producer"}</strong>${safeUrl(p.source_url) ? `<a href="${escapeHtml(p.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(hostOf(p.source_url))}</a>` : ""}</div>
      ${noteRowsHtml(p)}
      ${p.summary ? `<p class="note-summary">${escapeHtml(p.summary)}</p>` : ""}
    </div>` : "";
  const criticsHtml = (expert.critics || []).map((c) => `
    <div class="note-block">
      <div class="note-head">
        <strong>${escapeHtml(c.source)}</strong>
        ${c.score != null ? `<span class="critic-score">${c.score}<small>/${escapeHtml(c.scale)}</small></span>` : ""}
        ${c.year ? `<span class="note-year">${c.year}</span>` : ""}
        ${safeUrl(c.source_url) ? `<a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(hostOf(c.source_url))}</a>` : ""}
      </div>
      ${noteRowsHtml(c)}
      ${c.summary ? `<p class="note-summary">${escapeHtml(c.summary)}</p>` : ""}
    </div>`).join("");
  const reasons = (match?.reasons || []).map((r) => `<div>✓ ${escapeHtml(r)}</div>`).join("");
  const concerns = (match?.concerns || []).map((c) => `<div>⚠ ${escapeHtml(c)}</div>`).join("");
  return `
    <div class="section-title"><h2>Tasting Notes</h2><span class="field-hint">${escapeHtml(NOTE_CONFIDENCE[expert.confidence] || "")}</span></div>
    ${reasons || concerns ? `<div class="card notes-match"><strong>How the notes fit your palate</strong><div class="notes-match-list">${reasons}${concerns}</div></div>` : ""}
    ${(expert.flavor_terms || []).length ? `<div class="tag-cloud" style="margin-bottom:10px">${expert.flavor_terms.map((t) => `<span class="note-term">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
    <div class="card">${producerHtml}${criticsHtml}</div>
    <p class="field-hint">Paraphrased from the linked sources. Batches and vintages vary${expert.caveat ? ` — ${escapeHtml(expert.caveat)}` : "."}</p>`;
}
