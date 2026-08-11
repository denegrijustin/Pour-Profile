// The tasting feed.
//
// Logging a pour used to produce a toast and nothing else: the tasting itself
// was only visible by drilling into that one bottle's detail page, so a logged
// sip effectively vanished. `/api/tastings` existed the whole time and no view
// ever called it.
//
// A tasting is an *event* — a rating, a place, a date, what you thought — and
// bottle cards can't show any of that. This renders tastings as what they are.

import { escapeHtml, formatDate, VERDICTS } from "./ui.js";

/** Map a numeric rating back onto the verdict that would have produced it. */
export function verdictForRating(rating) {
  if (rating == null) return null;
  // Nearest verdict by rating, so a fine-tuned 8.2 still reads as "Liked it".
  return VERDICTS.reduce((best, v) =>
    Math.abs(v.rating - rating) < Math.abs(best.rating - rating) ? v : best);
}

// Seeded likes and dislikes were deliberately left unrated — the brief was
// explicit that an unknown rating stays unknown. They still carry a known
// status, so the feed shows that rather than an empty row, and never implies a
// score that was never given.
const STATUS_FALLBACK = {
  favorite: { icon: "\u{2764}\u{FE0F}", label: "Known favorite" },
  like:     { icon: "\u{1F642}",        label: "Known like" },
  dislike:  { icon: "\u{1F615}",        label: "Known dislike" },
  avoid:    { icon: "\u{1F922}",        label: "Avoid" }
};

function reaction(t) {
  const v = verdictForRating(t.rating);
  if (v) return { icon: v.icon, label: v.label, scored: true };
  for (const tag of t.status_tags || []) {
    if (STATUS_FALLBACK[tag]) return { ...STATUS_FALLBACK[tag], scored: false };
  }
  return { icon: "\u{2022}", label: "Logged, not rated", scored: false };
}

export function tastingRowHtml(t, { showBottle = true } = {}) {
  const r = reaction(t);
  const where = t.venue_name || null;
  // An undated seed row says nothing rather than "Date unknown" on every line.
  const when = t.tasted_at ? formatDate(t.tasted_at) : null;
  const meta = [when, where].filter(Boolean).join(" · ");

  return `
    <div class="tasting-row"${showBottle && t.bottle_id ? ` data-open-bottle="${t.bottle_id}" role="button" tabindex="0"` : ""}>
      <div class="tasting-verdict" title="${escapeHtml(r.label)}">
        <span class="tv-icon" aria-hidden="true">${r.icon}</span>
        ${t.rating != null ? `<span class="tv-score">${Number(t.rating).toFixed(1)}</span>` : ""}
      </div>
      <div class="tasting-body">
        ${showBottle ? `<div class="tasting-name">${escapeHtml(t.bottle_name || "Unknown bottle")}</div>` : ""}
        <div class="tasting-verdict-label">${escapeHtml(r.label)}</div>
        ${meta ? `<div class="tasting-meta">${escapeHtml(meta)}</div>` : ""}
        ${t.notes ? `<p class="tasting-notes">${escapeHtml(t.notes)}</p>` : ""}
        ${t.serving_style || t.would_buy_bottle ? `
          <div class="tasting-chips">
            ${t.serving_style ? `<span class="pill pill-neutral">${escapeHtml(String(t.serving_style).replace(/_/g, " "))}</span>` : ""}
            ${t.would_buy_bottle ? `<span class="pill pill-want">Would buy</span>` : ""}
          </div>` : ""}
      </div>
    </div>`;
}

export function tastingFeedHtml(tastings, { showBottle = true } = {}) {
  if (!tastings.length) return "";
  return `<div class="tasting-feed">${tastings.map((t) => tastingRowHtml(t, { showBottle })).join("")}</div>`;
}
